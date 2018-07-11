// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// OPL4 Wave Sound Chip

wmsx.OPL4AudioWave = function(opl4) {
"use strict";

    var self = this;

    function init() {
        var tabs = new wmsx.YM2413Tables();
        sineTable = tabs.getFullSineTable();
        halfSineTable = tabs.getHalfSineTable();
        expTable = tabs.getExpTable();
        instrumentsParameters = tabs.getInstrumentsROM();
        multiFactors = tabs.getMultiFactorsDoubled();
        vibValues = tabs.getVIBValues();
        kslValues = tabs.getKSLValues();
        rateAttackDurTable = tabs.getRateAttackDurations();
        rateDecayDurTable = tabs.getRateDecayDurations();
    }

    this.connect = function(machine) {
        // machine.bus.connectInputDevice( 0x7e, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectOutputDevice(0x7e, this.output7E);
        machine.bus.connectInputDevice( 0x7f, this.input7F);
        machine.bus.connectOutputDevice(0x7f, this.output7F);
    };

    this.disconnect = function(machine) {
        // machine.bus.disconnectInputDevice( 0x7e, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0x7e, this.output7E);
        machine.bus.disconnectInputDevice( 0x7f, this.input7F);
        machine.bus.disconnectOutputDevice(0x7f, this.output7F);
    };

    this.reset = function() {
        // Zero all registers
        clock = 0;
        memoryAddress = 0;
        registerAddress = 0;
        wmsx.Util.arrayFill(register, 0);
        wmsx.Util.arrayFill(waveNumber, 0);
        wmsx.Util.arrayFill(dataBits, 0);
        wmsx.Util.arrayFill(startAddress, 0);
        wmsx.Util.arrayFill(loopPosition, 0);
        wmsx.Util.arrayFill(endPosition, 0);
        wmsx.Util.arrayFill(samplePos, 0);
        wmsx.Util.arrayFill(sampleValue, 0);
        wmsx.Util.arrayFill(phaseInc, 0);
        wmsx.Util.arrayFill(phaseCounter, 0);

        wmsx.Util.arrayFill(fNum, 0);
        wmsx.Util.arrayFill(octave, 0);
        wmsx.Util.arrayFill(keyOn, 0);
        wmsx.Util.arrayFill(ar, 0);
        wmsx.Util.arrayFill(dr, 0);
        wmsx.Util.arrayFill(sl, 0);
        wmsx.Util.arrayFill(rr, 0);


        // -----------------------------------------


        wmsx.Util.arrayFill(instrumentsParameters[0], 0);   // Reset custom instrument
        // Global controls
        noiseRegister = 0xffff; noiseOutput = 0;
        amLevel = 0; amLevelInc = -1; vibPhase = 0;
        rhythmMode = false;
        // Settings per channel(9) / operator(18)
         wmsx.Util.arrayFill(sustain, 0);
         wmsx.Util.arrayFill(instr, 0);
         wmsx.Util.arrayFill(am, 0);
         wmsx.Util.arrayFill(vib, 0);
         wmsx.Util.arrayFill(envType, 0);
         wmsx.Util.arrayFill(ksr, 0);
         wmsx.Util.arrayFill(multi, 0);
         wmsx.Util.arrayFill(ksl, 0);
         wmsx.Util.arrayFill(halfWave, 0);
         wmsx.Util.arrayFill(ar, 0);
         wmsx.Util.arrayFill(dr, 0);
         wmsx.Util.arrayFill(sl, 0);
         wmsx.Util.arrayFill(rr, 0);
         wmsx.Util.arrayFill(volume, 0);
         wmsx.Util.arrayFill(modTL, 0);
        // Computed settings per channel(9) / operator(18)
        wmsx.Util.arrayFill(fbShift, 0);
        wmsx.Util.arrayFill(volModAtt, 0);
        // Dynamic values per channel(9) / operator(18). May change as time passes without being set by software
        wmsx.Util.arrayFill(amAtt, 0);
        wmsx.Util.arrayFill(envAtt, 0);
        wmsx.Util.arrayFill(kslAtt, 0);
        wmsx.Util.arrayFill(totalAtt, 0);
        wmsx.Util.arrayFill(envStep, IDLE);
        wmsx.Util.arrayFill(envStepLevelDur, 0);
        wmsx.Util.arrayFill(envStepLevelIncClock, 0);
        wmsx.Util.arrayFill(envStepLevelInc, 0);
        wmsx.Util.arrayFill(envStepNext, DAMP);
        wmsx.Util.arrayFill(envStepNextAtLevel, 0);
        wmsx.Util.arrayFill(envLevel, 0);
        wmsx.Util.arrayFill(ksrOffset, 0);
        wmsx.Util.arrayFill(fbLastMod1, 0);
        wmsx.Util.arrayFill(fbLastMod2, 0);
    };

    this.output7E = function (val) {
        registerAddress = val;
    };

    this.input7F = function() {
        return registerRead(registerAddress);
    };

    this.output7F = function (val) {
        registerWrite(registerAddress, val);
    };

    this.nextSample = function() {
        var amChanged, vibChanged = false;
        var m, c, phase, newPhase, delta;
        var sample = 0;

        ++clock;

        // amChanged = clockAM();
        // if (amChanged) vibChanged = clockVIB();

        for (var cha = 23; cha >= 0; --cha) {
            if (envStep[cha] === IDLE) continue;

            // // Update AM and VIB
            // if (amChanged) {
            //     if (am[m]) updateAMAttenuationOp(m);
            //     if (am[c]) updateAMAttenuationOp(c);
            //     if (vibChanged) {
            //         if (vib[m]) updateFrequencyOp(m);
            //         if (vib[c]) updateFrequencyOp(c);
            //     }
            // }

            // Update ADSR envelopes
            clockEnvelope(cha);

            // Update phase (0..1023)
            phase = phaseCounter[cha];
            newPhase = phaseCounter[cha] = (phase + phaseInc[cha]) & 0x7fffffff;

            delta = (newPhase >> 10) - (phase >> 10);
            if (delta > 0)
                sample += advanceSample(cha, delta);
            else
                sample += sampleValue[cha];
        }

        return sample;
    };

    function connectAudio() {
        // TODO Route audio through parent
    }

    function setWaveNumber(cha) {
        var num = ((register[0x20 + cha] & 1) << 8) + register[0x08 + cha];
        waveNumber[cha] = num;

        var waveHeader = (register[2] >> 2) & 0x03;
        var address = waveNumber < 384 ? 0 : waveHeader === 0 ? 0 : waveHeader << 19;
        address += num * 12;

        var val = opl4.memoryRead(address++);
        dataBits[cha] = val >> 6;
        startAddress[cha] = ((val & 0x3f) << 16) | (opl4.memoryRead(address++) << 8) | opl4.memoryRead(address++);
        loopPosition[cha] = (opl4.memoryRead(address++) << 8) | opl4.memoryRead(address++);      // delta from start in samples
        endPosition[cha] =  (opl4.memoryRead(address++) << 8) | opl4.memoryRead(address++);      // delta from start in samples
        registerWrite(0x80 + cha, opl4.memoryRead(address++));
        registerWrite(0x98 + cha, opl4.memoryRead(address++));
        registerWrite(0xb0 + cha, opl4.memoryRead(address++));
        registerWrite(0xc8 + cha, opl4.memoryRead(address++));
        registerWrite(0xe0 + cha, opl4.memoryRead(address++));
    }

    function registerWrite(reg, val) {
        // console.log("Wave Register WRITE: " + reg.toString(16) + " : " + val.toString(16));

        var cha = 0;

        var mod = register[reg] ^ val;
        register[reg] = val;

        switch(reg) {
            case 0x05:
                memoryAddress = ((register[0x03] & 0x3f) << 16) | (register[0x04] << 8) | register[0x05];
                break;
            case 0x06:
                opl4.memoryWrite(memoryAddress, val);
                if (++memoryAddress >= 0x400000) memoryAddress = 0;
                break;
            case 0x08: case 0x09: case 0x0a: case 0x0b: case 0x0c: case 0x0d: case 0x0e: case 0x0f: case 0x10: case 0x11: case 0x12: case 0x13:
            case 0x14: case 0x15: case 0x16: case 0x17: case 0x18: case 0x19: case 0x1a: case 0x1b: case 0x1c: case 0x1d: case 0x1e: case 0x1f:
                setWaveNumber(reg - 0x08);
                break;
            case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27: case 0x28: case 0x29: case 0x2a: case 0x2b:
            case 0x2c: case 0x2d: case 0x2e: case 0x2f: case 0x30: case 0x31: case 0x32: case 0x33: case 0x34: case 0x35: case 0x36: case 0x37:
                break;
            case 0x38: case 0x39: case 0x3a: case 0x3b: case 0x3c: case 0x3d: case 0x3e: case 0x3f: case 0x40: case 0x41: case 0x42: case 0x43:
            case 0x44: case 0x45: case 0x46: case 0x47: case 0x48: case 0x49: case 0x4a: case 0x4b: case 0x4c: case 0x4d: case 0x4e: case 0x4f:
                cha = reg - 0x38;
                if (mod & 0x07)
                    fNum[cha] = ((val & 0x07) << 8) | (register[0x20 + cha] >> 1);                      // FNUM
                if (mod & 0xf0)
                    octave[cha] = val;   // signed 4 bits                                               // OCTAVE
                if (mod & 0xf7) updateFrequency(cha);
                break;
            case 0x68: case 0x69: case 0x6a: case 0x6b: case 0x6c: case 0x6d: case 0x6e: case 0x6f: case 0x70: case 0x71: case 0x72: case 0x73:
            case 0x74: case 0x75: case 0x76: case 0x77: case 0x78: case 0x79: case 0x7a: case 0x7b: case 0x7c: case 0x7d: case 0x7e: case 0x7f:
                if (mod & 0x10) setKeyOn(reg - 0x68, val >> 7);                                         // KEY ON
                break
        }

        return;

        var chan = reg & 0xf;
        if (chan > 8) chan -= 9;                       // Regs X9 - Xf are the same as X0 - X6
        var m = chan << 1, c = m + 1;

        switch(reg) {

            case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x07:
                if (mod) {
                    instrumentsParameters[0][reg] = val;
                    updateCustomInstrChannels();
                }
                break;
            case 0x0e:
                if (mod & 0x20) setRhythmMode((val & 0x20) !== 0);
                if (rhythmMode) {
                    if (mod & 0x30) {                                            // Bass Drum    (2 ops, like a melody channel)
                        setRhythmKeyOnOp(12, (val & 0x10) >> 4);
                        setRhythmKeyOnOp(13, (val & 0x10) >> 4);
                    }
                    if (mod & 0x28) setRhythmKeyOnOp(15, (val & 0x08) >> 3);     // Snare Drum   (1 op)
                    if (mod & 0x24) setRhythmKeyOnOp(16, (val & 0x04) >> 2);     // Tom Tom      (1 op)
                    if (mod & 0x22) setRhythmKeyOnOp(17, (val & 0x02) >> 1);     // Top Cymbal   (1 op)
                    if (mod & 0x21) setRhythmKeyOnOp(14,  val & 0x01);           // HiHat        (1 op)
                }
                break;
            case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17: case 0x18:
            case 0x19: case 0x1a: case 0x1b: case 0x1c: case 0x1d: case 0x1e: case 0x1f:
                if (mod) {
                    fNum[m] = (fNum[m] & ~0xff) | val;
                    fNum[c] = fNum[m];
                    updateFrequency(chan);
                }
                break;
            case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27: case 0x28:
            case 0x29: case 0x2a: case 0x2b: case 0x2c: case 0x2d: case 0x2e: case 0x2f:
                if (mod & 0x20) setSustain(chan, (val & 0x20) >> 5);
                if ((mod & 0x10) && !(rhythmMode && chan > 5)) setKeyOn(chan, (val & 0x10) >> 4);
                if (mod & 0x01) {
                    fNum[m] = (fNum[m] & ~0x100) | ((val & 1) << 8);
                    fNum[c] = fNum[m];
                }
                if (mod & 0x0e) {
                    octave[m] = (val >> 1) & 0x7;
                    octave[c] = octave[m];
                }
                if (mod & 0x0f) updateFrequency(chan);
                break;
            case 0x30: case 0x31: case 0x32: case 0x33: case 0x34: case 0x35: case 0x36: case 0x37: case 0x38:
            case 0x39: case 0x3a: case 0x3b: case 0x3c: case 0x3d: case 0x3e: case 0x3f:
                if (rhythmMode && chan > 5) {
                    if ((mod & 0xf0) && chan > 6) setVolumeOp(m, val >>> 4);        // BD has a normal modulator
                    if (mod & 0x0f) setVolumeOp(c, val & 0xf);
                } else {
                    if (mod & 0xf0) {
                        if (!audioConnected) connectAudio();
                        setInstr(chan, val >>> 4);
                    }
                    if (mod & 0x0f) setVolumeOp(c, val & 0xf);
                }
                break;
        }
    }

    function registerRead(reg) {
        var res;
        switch(reg) {
            case 0x02:
                res = 0x20;            // Device ID
                break;
            case 0x06:
                res = opl4.memoryRead(memoryAddress);
                if (++memoryAddress >= 0x400000) memoryAddress = 0;
                break;
            default:
                res = register[registerAddress];
        }

        // console.log("Wave Register READ: " + registerAddress.toString(16) + " = " + res.toString(16));

        return res;
    }

    function clockNoise() {
        noiseRegister >>= 1;
        noiseOutput = noiseRegister & 1;
        if (noiseOutput) noiseRegister ^= 0x8003020;
    }

    function clockAM() {
        if (clock & 511) return false;        // Only change once each 512 clocks

        if (amLevel === 0 || amLevel === 13) amLevelInc = -amLevelInc;
        amLevel += amLevelInc;
        return true;
    }

    function clockVIB() {
        if (clock & 1023) return false;        // Only change once each 1024 clocks

        vibPhase = (clock >> 10) & 0x7;
        return true;
    }

    function clockEnvelope(cha) {
        if (envLevel[cha] === envStepNextAtLevel[cha]) {
            setEnvStep(cha, envStepNext[cha]);
        } else {
            if (clock === envStepLevelIncClock[cha]) {
                envStepLevelIncClock[cha] += envStepLevelDur[cha];
                envLevel[cha] += envStepLevelInc[cha];
                updateEnvAttenuation(cha);
            }
        }
    }

    function setSustain(chan, on) {
        sustain[chan] = on;
    }

    function setKeyOn(cha, on) {
        keyOn[cha] = on;
        // Define ADSR phase
        if (on) {
            startSample(cha);
            setEnvStep(cha, DAMP);
        } else
            if (envStep[cha] !== IDLE) setEnvStep(cha, RELEASE);
    }

    function startSample(cha) {
        samplePos[cha] = 0;
        return updateSampleValue(cha);
    }

    function advanceSample(cha, quant) {
        var newPos = samplePos[cha] + quant;
        samplePos[cha] = newPos > endPosition[cha]
            ? loopPosition[cha] + (newPos - endPosition[cha]) - 1
            : newPos;
        return updateSampleValue(cha);
    }

    function updateSampleValue(cha) {
        var off, bin;
        var start = startAddress[cha];
        var bits = dataBits[cha];
        if (bits === 0) {
            // 8 bits per sample
            off = samplePos[cha];
            bin = opl4.memoryRead(start + off) << 8;    // up to 16 bits
        } else if (bits === 2) {
            // 16 bits per sample
            off = samplePos[cha] << 1;
            bin = (opl4.memoryRead(start + off) << 8) | opl4.memoryRead(start + off + 1);
        } else {
            // 12 bits per sample
            off = (samplePos[cha] >> 1) * 3;
            bin = samplePos[cha] & 1
                ? (opl4.memoryRead(start + off + 2) | (opl4.memoryRead(start + off + 1) & 0x0f)) << 8       // up tp 16 bits
                : (opl4.memoryRead(start + off) | (opl4.memoryRead(start + off + 1) & 0xf0)) << 4;
        }
        return sampleValue[cha] = bin & 0x8000 ? bin - 0x10000 : bin;  // to signed -32768 .. 32767
    }

    function setRhythmKeyOnOp(op, on) {
    }

    function setEnvStep(cha, step) {
        envStep[cha] = step;
        switch (step) {
            case DAMP:
                envStepLevelDur[cha] = rateDecayDurTable[(12 << 2) + ksrOffset[cha]];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = 1;
                envStepNextAtLevel[cha] = 128;
                envStepNext[cha] = ATTACK;
                break;
            case ATTACK:
                envStepLevelDur[cha] = rateAttackDurTable[(ar[cha] << 2) + ksrOffset[cha]];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = -8;
                envStepNextAtLevel[cha] = 0;
                envStepNext[cha] = DECAY;
                // Reset phase counter?
                phaseCounter[cha] = 0;
                break;
            case DECAY:
                envStepLevelDur[cha] = rateDecayDurTable[(dr[cha] << 2) + ksrOffset[cha]];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = 1;
                envStepNextAtLevel[cha] = sl[cha] << 3;
                envStepNext[cha] = SUSTAIN;
                break;
            case SUSTAIN:
                if (envType[cha]) {
                    // Sustained tone
                    envStepLevelIncClock[cha] = envStepLevelDur[cha] = 0;     // Never
                    envStepLevelInc[cha] = 0;
                    envStepNextAtLevel[cha] = 255;   // Never
                    envStepNext[cha] = SUSTAIN;
                } else {
                    // Percussive tone
                    envStepLevelDur[cha] = rateDecayDurTable[(rr[cha] << 2) + ksrOffset[cha]];
                    envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                    envStepLevelInc[cha] = 1;
                    envStepNextAtLevel[cha] = 128;
                    envStepNext[cha] = IDLE;
                }
                break;
            case RELEASE:
                var rate = envType[cha]
                    ? sustain[cha >> 1] ? 5 : rr[cha]     // Sustained tone
                    : sustain[cha >> 1] ? 5 : 7;         // Percussive tone
                envStepLevelDur[cha] = rateDecayDurTable[(rate << 2) + ksrOffset[cha]];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = 1;
                envStepNextAtLevel[cha] = 128;
                envStepNext[cha] = IDLE;
                break;
            case IDLE:
            default:
                envLevel[cha] = 128;
                envStepLevelIncClock[cha] = envStepLevelDur[cha] = 0;     // Never
                envStepLevelInc[cha] = 0;
                envStepNextAtLevel[cha] = 255;   // Never
                envStepNext[cha] = IDLE;
                break;
        }
    }

    function setRhythmMode(boo) {
        rhythmMode = boo;
        if (rhythmMode) {
            if (!audioConnected) connectAudio();
            setInstr(6, 16);
            setInstr(7, 17);
            setInstr(8, 18);
        } else {
            setEnvStep(6, IDLE); updateEnvAttenuation(6);
            setEnvStep(7, IDLE); updateEnvAttenuation(7);
            setEnvStep(8, IDLE); updateEnvAttenuation(8);
            setInstr(6, register[36] >> 4);
            setInstr(7, register[37] >> 4);
            setInstr(8, register[38] >> 4);
        }
    }

    function setInstr(chan, ins) {
        instr[chan] = ins;

        // Copy parameters
        var m = chan << 1, c = m + 1;
        var pars = instrumentsParameters[ins];
        am[m] =         (pars[0] >> 7) & 1;
        am[c] =         (pars[1] >> 7) & 1;
        vib[m] =        (pars[0] >> 6) & 1;
        vib[c] =        (pars[1] >> 6) & 1;
        envType[m] =    (pars[0] >> 5) & 1;
        envType[c] =    (pars[1] >> 5) & 1;
        ksr[m] =        (pars[0] >> 4) & 1;
        ksr[c] =        (pars[1] >> 4) & 1;
        multi[m] =      multiFactors[pars[0] & 0xf];
        multi[c] =      multiFactors[pars[1] & 0xf];
        ksl[m] =        pars[2] >> 6;
        ksl[c] =        pars[3] >> 6;
        modTL[m] =      pars[2] & 0x3f;
        halfWave[m] =   (pars[3] >> 3) & 1;
        halfWave[c] =   (pars[3] >> 4) & 1;
        fbShift[chan] = (pars[3] & 0x7) ? 8 - (pars[3] & 0x7) : 0;      // 0 means no FB, NOT no shifting
        ar[m] =         pars[4] >> 4;
        ar[c] =         pars[5] >> 4;
        dr[m] =         pars[4] & 0xf;
        dr[c] =         pars[5] & 0xf;
        sl[m] =         pars[6] >> 4;
        sl[c] =         pars[7] >> 4;
        rr[m] =         pars[6] & 0xf;
        rr[c] =         pars[7] & 0xf;

        updateAMAttenuation(chan);
        updateFrequency(chan);
        updateModAttenuationOp(m);

        //console.log("Custom Instr updated for channel: " + chan);
    }

    function updateCustomInstrChannels() {
        for (var chan = 0; chan < 9; chan++)
            if (instr[chan] === 0) setInstr(chan, 0);
    }

    function setVolumeOp(op, val) {
        volume[op] = val;
        updateVolumeAttenuationOp(op);
    }

    function updateFrequency(cha) {
        var vibVal = 0; vib[cha] ? vibValues[fNum[cha] >> 6][vibPhase] : 0;
        phaseInc[cha] = (0x10000 + fNum[cha] + vibVal) << 8 >> (8 - octave[cha] + 1);
        updateKSLAttenuation(cha);
        updateKSROffset(cha);

        // console.log("Wave UpdateFrequency", cha, ":", phaseInc[cha]);
    }

    function updateKSROffset(chan) {
        return;

        var m = chan << 1, c = m + 1;
        ksrOffset[m] = (ksr[m] ? octave[m] << 1 : octave[m] >> 1) | (fNum[m] >>> (9 - ksr[m]));
        ksrOffset[c] = (ksr[c] ? octave[c] << 1 : octave[c] >> 1) | (fNum[c] >>> (9 - ksr[c]));
    }

    function updateAMAttenuation(chan) {
        var m = chan << 1, c = m + 1;
        amAtt[m] = am[m] ? amLevel << 4 : 0;
        amAtt[c] = am[c] ? amLevel << 4 : 0;
        updateTotalAttenuation(chan);
    }

    function updateAMAttenuationOp(op) {
        amAtt[op] = am[op] ? amLevel << 4 : 0;  // 0..13 << 4 = 0 .. 208
        updateTotalAttenuationOp(op);
    }

    function updateKSLAttenuation(chan) {
        return;

        var m = chan << 1, c = m + 1;
        kslAtt[m] = kslValues[ksl[m]][octave[m]][fNum[m] >>> 5] << 4;
        kslAtt[c] = kslValues[ksl[c]][octave[c]][fNum[c] >>> 5] << 4;
        updateTotalAttenuation(chan);
    }

    function updateEnvAttenuation(cha) {
        envAtt[cha] = (envLevel[cha] === 128 ? 256 : envLevel[cha]) << 4;         // Higher attenuation in case of minimum level to produce silence
        updateTotalAttenuationOp(cha);
    }

    function updateModAttenuationOp(op) {
        volModAtt[op] = modTL[op] << 5;
        updateTotalAttenuationOp(op);
    }

    function updateVolumeAttenuationOp(op) {
        volModAtt[op] = (volume[op] === 15 ? 30 : volume[op]) << 7;            // Higher attenuation in case of minimum volume to produce silence
        updateTotalAttenuationOp(op);
    }

    function updateTotalAttenuation(chan) {
        var m = chan << 1, c = m + 1;
        totalAtt[m] = amAtt[m] + kslAtt[m] + envAtt[m] + volModAtt[m];
        totalAtt[c] = amAtt[c] + kslAtt[c] + envAtt[c] + volModAtt[c];
    }

    function updateTotalAttenuationOp(op) {
        totalAtt[op] = amAtt[op] + kslAtt[op] + envAtt[op] + volModAtt[op];     //       0..208 + 0..1792 + 0..2048 + 0..2016
                                                                                // max:  256    + 2048    + 4096    + 4096      = 10496 = 0x2900
    }


    var audioConnected = false;


    // Global settings
    var registerAddress;
    var memoryAddress;
    var register = new Array(0xff);

    // Per Channel data
    var waveNumber = new Array(24);
    var dataBits  = new Array(24);
    var startAddress = new Array(24);
    var loopPosition = new Array(24);
    var endPosition = new Array(24);
    var samplePos = new Array(24);
    var sampleValue = new Array(24);
    var phaseInc =     new Array(24);
    var phaseCounter = new Array(24);

    var fNum = new Array(24);
    var octave = new Array(24);
    var keyOn = new Array(24);
    var ar = new Array(24);
    var dr = new Array(24);
    var sl = new Array(24);
    var rr = new Array(24);


    // -----------------------------------------


    // Constants

    var IDLE = 255, DAMP = 0, ATTACK = 1, DECAY = 2, SUSTAIN = 3, RELEASE = 4;       // Envelope steps

    // Dynamic global values. Change as time passes
    var clock;
    var noiseRegister, noiseOutput;
    var amLevel, amLevelInc;
    var vibPhase;

    // Global settings
    var rhythmMode;

    // Settings per channel(9) / operator(18)
    var sustain =  new Array(9);
    var instr =    new Array(9);
    var am =       new Array(18);
    var vib =      new Array(18);
    var envType =  new Array(18);
    var ksr =      new Array(18);
    var multi =    new Array(18);
    var ksl =      new Array(18);
    var halfWave = new Array(18);
    var volume =   new Array(18);
    var modTL =    new Array(18);

    // Computed settings per channel(9) / operator(18)
    var fbShift =   new Array(9);
    var volModAtt = new Array(18);       // For Volume or ModTL

    // Dynamic values per channel(9) / operator(18). May change as time passes without being set by software
    var amAtt =    new Array(18);
    var envAtt =   new Array(18);
    var kslAtt =   new Array(18);
    var totalAtt = new Array(18);

    var envStep =              new Array(18);
    var envStepLevelDur =      new Array(18);
    var envStepLevelIncClock = new Array(18);
    var envStepLevelInc =      new Array(18);
    var envStepNext =          new Array(18);
    var envStepNextAtLevel =   new Array(18);
    var envLevel =             new Array(18);

    var ksrOffset =  new Array(18);

    var fbLastMod1 = new Array(9);
    var fbLastMod2 = new Array(9);



    // Debug vars

    //this.register = register;

    //this.keyOn = keyOn;
    //this.sustain = sustain;
    //this.fNum = fNum;
    //this.octave = octave;
    //this.instr = instr;
    //this.volume = volume;
    //this.modTL = modTL;

    //this.am = am;
    //this.vib = vib;
    //this.envType = envType;
    //this.ksr = ksr;
    //this.multi = multi;
    //this.ksl = ksl;
    //this.halfWave = halfWave;
    //this.ar = ar;
    //this.dr = dr;
    //this.sl = sl;
    //this.rr = rr;
    //this.ksrOffset = ksrOffset;

    //this.kslAtt = kslAtt;
    //this.fbShift = fbShift;
    //this.envAtt = envAtt;
    //this.amAtt = amAtt;
    //this.volModAtt = volModAtt;
    //this.totalAtt = totalAtt;

    //this.envStep = envStep;
    //this.envStepLevelDur = envStepLevelDur;
    //this.envStepLevelIncClock = envStepLevelIncClock;
    //this.envStepNext = envStepNext;
    //this.envStepNextAtLevel = envStepNextAtLevel;
    //this.envStepLevelInc = envStepLevelInc;
    //this.envLevel = envLevel;

    //this.fbLastMod1 = fbLastMod1;
    //this.fbLastMod2 = fbLastMod2;

    //this.phaseInc = phaseInc;
    //this.phaseCounter = phaseCounter;

    // Pre calculated tables, factors, values

    var sineTable, halfSineTable, expTable, instrumentsParameters, multiFactors, vibValues, kslValues, rateAttackDurTable, rateDecayDurTable;


    var VOLUME = 0.65 * (1.55 / 9 / 256);                               // 9 channels, samples -256..+ 256


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ac: audioConnected,

            ra: registerAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(register),

            c: clock,
            nr: noiseRegister, no: noiseOutput,
            al: amLevel, ai: amLevelInc, vp: vibPhase,

            amt: wmsx.Util.storeInt16BitArrayToStringBase64(amAtt),
            evt: wmsx.Util.storeInt16BitArrayToStringBase64(envAtt),
            kst: wmsx.Util.storeInt16BitArrayToStringBase64(kslAtt),
            tot: wmsx.Util.storeInt16BitArrayToStringBase64(totalAtt),

            evs: wmsx.Util.storeInt8BitArrayToStringBase64(envStep),
            evd: wmsx.Util.storeInt32BitArrayToStringBase64(envStepLevelDur),
            evc: envStepLevelIncClock,
            evi: wmsx.Util.storeInt8BitArrayToStringBase64(envStepLevelInc),
            evn: wmsx.Util.storeInt8BitArrayToStringBase64(envStepNext),
            evl: wmsx.Util.storeInt8BitArrayToStringBase64(envStepNextAtLevel),
            eve: wmsx.Util.storeInt8BitArrayToStringBase64(envLevel),

            kso: wmsx.Util.storeInt8BitArrayToStringBase64(ksrOffset),

            fb1: wmsx.Util.storeInt16BitArrayToStringBase64(fbLastMod1),
            fb2: wmsx.Util.storeInt16BitArrayToStringBase64(fbLastMod2)
        };
    };

    this.loadState = function(s) {
        this.reset();

        // audioConnected = s.ac;
        //
        // registerAddress = s.ra;
        // var regs = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r);
        // for (var r = 0; r < regs.length; r++) registerWrite(r, regs[r]);
        //
        // clock = s.c;
        // noiseRegister = s.nr; noiseOutput = s.no;
        // amLevel = s.al; amLevelInc = s.ai; vibPhase = s.vp;
        //
        // amAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.amt, amAtt);
        // envAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.evt, envAtt);
        // kslAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.kst, kslAtt);
        // totalAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.tot, totalAtt);
        //
        // envStep = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evs, envStep);
        // envStepLevelDur = wmsx.Util.restoreStringBase64ToInt32BitArray(s.evd);
        // envStepLevelIncClock = s.evc;
        // envStepLevelInc = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.evi, envStepLevelInc);
        // envStepNext = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evn, envStepNext);
        // envStepNextAtLevel = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evl, envStepNextAtLevel);
        // envLevel = wmsx.Util.restoreStringBase64ToInt8BitArray(s.eve, envLevel);
        // ksrOffset = wmsx.Util.restoreStringBase64ToInt8BitArray(s.kso, ksrOffset);
        //
        // fbLastMod1 = wmsx.Util.restoreStringBase64ToSignedInt16BitArray(s.fb1, fbLastMod1);
        // fbLastMod2 = wmsx.Util.restoreStringBase64ToSignedInt16BitArray(s.fb2, fbLastMod2);
    };


    init();

    this.eval = function(str) {
        return eval(str);
    };

};
