// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// OPL4 FM Sound Chip
// Implementation based on the excellent findings and measurements by Wouter Vermaelen
// http://forums.submarine.org.uk/phpBB/viewforum.php?f=9&sid=802b327ed9853a591025be31c2ed58a2
// https://docs.google.com/document/d/18IGx18NQY_Q1PJVZ-bHywao9bhsDoAqoIn1rIm42nwo/edit

// TODO How changes in parameters affect envelopes in progress

wmsx.OPL4AudioFM = function(opl4) {
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
        cpu = machine.cpu;
        machine.bus.connectInputDevice( 0xc4, this.inputC4);
        machine.bus.connectOutputDevice(0xc4, this.outputC4);
        machine.bus.connectInputDevice( 0xc5, this.inputC5);
        machine.bus.connectOutputDevice(0xc5, this.outputC5);
        machine.bus.connectInputDevice( 0xc6, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectOutputDevice(0xc6, this.outputC6);
        machine.bus.connectInputDevice( 0xc7, this.inputC5);
        machine.bus.connectOutputDevice(0xc7, this.outputC5);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectInputDevice( 0xc4, this.inputC4);
        machine.bus.disconnectOutputDevice(0xc4, this.outputC4);
        machine.bus.disconnectInputDevice( 0xc5, this.inputC5);
        machine.bus.disconnectOutputDevice(0xc5, this.outputC5);
        machine.bus.disconnectInputDevice( 0xc6, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0xc6, this.outputC6);
        machine.bus.disconnectInputDevice( 0xc7, this.inputC5);
        machine.bus.disconnectOutputDevice(0xc7, this.outputC5);
    };

    this.reset = function() {
        // Zero all registers
        status = 0;
        registerAddress = 0;
        wmsx.Util.arrayFill(register, 0);
        clock = 0;

        timer1Preset = timer2Preset = 0;
        timer1Counter = timer2Counter = 0;
        timer1Active = timer2Active = false;
        timer1Masked = timer2Masked = 0;


        // -----------------------------------------


        wmsx.Util.arrayFill(instrumentsParameters[0], 0);   // Reset custom instrument
        // Global controls
        noiseRegister = 0xffff; noiseOutput = 0;
        amLevel = 0; amLevelInc = -1; vibPhase = 0;
        rhythmMode = false;
        // Settings per channel(9) / operator(18)
         wmsx.Util.arrayFill(sustain, 0);
         wmsx.Util.arrayFill(instr, 0);
         wmsx.Util.arrayFill(keyOn, 0);
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
         wmsx.Util.arrayFill(fNum, 0);
         wmsx.Util.arrayFill(block, 0);
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
        wmsx.Util.arrayFill(phaseInc, 0);
        wmsx.Util.arrayFill(phaseCounter, 0);
    };

    this.inputC4 = function() {
        // console.log("Status READ: " + status.toString(16));

        return status;
    };

    this.outputC4 = function (val) {
        // console.log("FM Register Address: " + val.toString(16));

        registerAddress = val;
    };

    this.inputC5 = function() {
        var res = register[registerAddress];

        // console.log("FM Register READ: " + registerAddress.toString(16) + " = " + res.toString(16));

        return res;
    };

    this.outputC5 = function (val) {
        registerWrite(registerAddress, val);
    };

    this.outputC6 = function (val) {
        // console.log("FM Register Address: " + (0x100 | val).toString(16));

        registerAddress = 0x100 | val;
    };

    this.nextSample = function() {
        // if ((clock & 0xffff) === 0) console.log("FM clock:", clock);

        ++clock;
        if ((clock & 0x03) === 0) clockTimers();

        return 0;


        var amChanged, vibChanged = false;
        var m, c, mPh, cPh, mod;

        ++clock;
        amChanged = clockAM();
        if (amChanged) vibChanged = clockVIB();

        var sample = 0;
        var topMelodyChan = rhythmMode ? 5 : 8;

        // Melody channels
        for (var chan = topMelodyChan; chan >= 0; --chan) {
            m = chan << 1; c = m + 1;
            if (envStep[c] === IDLE) continue;

            // Update AM and VIB
            if (amChanged) {
                if (am[m]) updateAMAttenuationOp(m);
                if (am[c]) updateAMAttenuationOp(c);
                if (vibChanged) {
                    if (vib[m]) updateFrequencyOp(m);
                    if (vib[c]) updateFrequencyOp(c);
                }
            }

            // Update ADSR envelopes
            if (envStep[m] !== IDLE) clockEnvelope(m);
            clockEnvelope(c);

            // Update operators phase (0..1023)
            mPh = (phaseCounter[m] += phaseInc[m]) >> 9;
            cPh = (phaseCounter[c] += phaseInc[c]) >> 9;

            // Modulator and Feedback
            if (fbShift[chan]) {
                mPh += (fbLastMod1[chan] + fbLastMod2[chan]) >> fbShift[chan];
                mod = expTable[(halfWave[m] ? halfSineTable : sineTable)[mPh & 1023] + totalAtt[m]];
                fbLastMod2[chan] = fbLastMod1[chan] >> 1;
                fbLastMod1[chan] = mod >> 1;
            } else {
                mod = expTable[(halfWave[m] ? halfSineTable : sineTable)[mPh & 1023] + totalAtt[m]];
            }

            // Modulated Carrier, final sample value
            sample += expTable[(halfWave[c] ? halfSineTable : sineTable)[(cPh + mod) & 1023] + totalAtt[c]] >> 4;
        }

        // Rhythm channels (no AM, VIB, KSR, KSL, DC/DM, FB)
        if (rhythmMode) {
            clockNoise();

            // Bass Drum, 2 ops, normal channel
            c = 13;
            if (envStep[c] !== IDLE) {
                m = 12;
                clockEnvelope(m);
                clockEnvelope(c);
                mPh = ((phaseCounter[m] += phaseInc[m]) >> 9) - 1;
                cPh =  (phaseCounter[c] += phaseInc[c]) >> 9;
                mod = expTable[sineTable[mPh & 1023] + totalAtt[m]];
                sample += expTable[sineTable[(cPh + mod) & 1023] + totalAtt[c]] >> 3;
            }

            // Snare Drum, 1 op + noise
            c = 15;
            if (envStep[c] !== IDLE) {
                clockEnvelope(c);
                cPh = (phaseCounter[c] += phaseInc[c]) >> 9;
                sample += expTable[sineTable[cPh & 0x100 ? noiseOutput ? 0 : 130 : noiseOutput ? 0 : 1023 - 130] + totalAtt[c]] >> 3;
            }

            // Tom Tom, 1op, no noise
            c = 16;
            if (envStep[c] !== IDLE) {
                clockEnvelope(c);
                cPh = (phaseCounter[c] += phaseInc[c]) >> 9;
                sample += expTable[sineTable[cPh & 1023] + totalAtt[c]] >> 3;
            }

            // Cymbal & HiHat
            if (envStep[17] !== IDLE || envStep[14] !== IDLE) {
                // Both share the same phase calculation
                var ph14 = (phaseCounter[14] += phaseInc[14]) >> 9;
                var ph17 = (phaseCounter[17] += phaseInc[17]) >> 9;
                var hhCymPh = (((ph17 & 0x4) !== 0) && ((ph17 & 0x10) === 0)) !==
                                ((((ph14 & 0x02) !== 0) !== ((ph14 & 0x100) !== 0)) || ((ph14 & 0x04) !== 0));

                // Cymbal, 1 op, no noise
                c = 17;
                if (envStep[c] !== IDLE) {
                    clockEnvelope(c);
                    sample += expTable[sineTable[hhCymPh ? 200 : 1023 - 200] + totalAtt[c]] >> 3;
                }

                // HiHat, 1op + noise
                c = 14;
                if (envStep[c] !== IDLE) {
                    clockEnvelope(c);
                    sample += expTable[sineTable[hhCymPh ? noiseOutput ? 40 : 10 : noiseOutput ? 1023 - 40 : 1023 - 10] + totalAtt[c]] >> 3;
                }
            }
        }

        return sample;
    };

    function clockTimers() {
        // console.log("FM Clock Timers");

        if (timer1Active)
            if (++timer1Counter > 255) {
                timer1Counter = timer1Preset;
                if (!timer1Masked) {
                    status |= 0xc0;
                    updateIRQ();
                }
            }
        if (timer2Active && (clock & 0x0f) === 0)
            if (++timer2Counter > 255) {
                timer2Counter = timer2Preset;
                if (!timer2Masked) {
                    status |= 0xa0;
                    updateIRQ();
                }
            }
    }

    function updateIRQ() {
        cpu.setINTChannel(1, (status & 0x80) === 0);        // Using fixed channel 1 for now. TODO Multiple OPL4 connected?

        // console.log("FM update IRQ:", (status & 0x80) === 0);
    }

    function connectAudio() {
        // TODO Route audio through parent
    }

    function registerWrite(reg, val) {
        // console.log("FM Register WRITE: " + reg.toString(16) + " : " + val.toString(16));

        // Special case for setting RST = 1. Other bits are ignored and not set. RST becomes 0
        if (reg === 4 && (val & 0x80)) {
            // console.log("FM RESET flags");
            register[4] &= ~0x80;
            status = 0;
            updateIRQ();
            return;
        }

        var mod = register[reg] ^ val;
        register[reg] = val;

        switch(reg) {
            case 0x02:
                timer1Preset = val;
                break;
            case 0x03:
                timer2Preset = val;
                break;
            case 0x04:
                if (mod & 0x01) {                                                       // ST1
                    timer1Active = (val & 0x01) !== 0;
                    if (timer1Active) timer1Counter = timer1Preset;
                }
                if (mod & 0x02) {                                                       // ST2
                    timer2Active = (val & 0x02) !== 0;
                    if (timer2Active) timer2Counter = timer2Preset;
                }
                if (mod & 0x40) timer1Masked = (val & 0x40) !== 0;                      // MT1
                if (mod & 0x20) timer2Masked = (val & 0x20) !== 0;                      // MT2
                break;
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
                    block[m] = (val >> 1) & 0x7;
                    block[c] = block[m];
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

    function clockEnvelope(op) {
        if (envLevel[op] === envStepNextAtLevel[op]) {
            setEnvStepOp(op, envStepNext[op]);
        } else {
            if (clock === envStepLevelIncClock[op]) {
                envStepLevelIncClock[op] += envStepLevelDur[op];
                envLevel[op] += envStepLevelInc[op];
                updateEnvAttenuationOp(op);
            }
        }
    }

    function setSustain(chan, on) {
        sustain[chan] = on;
    }

    function setKeyOn(chan, on) {
        var m = chan << 1, c = m + 1;
        keyOn[m] = on;
        keyOn[c] = on;
        // Define ADSR phase
        if (on) {
            setEnvStep(chan, DAMP);
        } else {
            // Modulator is not affected by KEY-OFF!
            if (envStep[c] !== IDLE) setEnvStepOp(c, RELEASE);
        }
    }

    function setRhythmKeyOnOp(op, on) {
        keyOn[op] = on;
        // Define ADSR phase
        if (on) {
            setEnvStepOp(op, DAMP);
        } else {
            if (envStep[op] !== IDLE) setEnvStepOp(op, RELEASE);
        }
    }

    function setEnvStep(chan, step) {
        var m = chan << 1, c = m + 1;
        setEnvStepOp(m, step);
        setEnvStepOp(c, step);
    }

    function setEnvStepOp(op, step) {
        envStep[op] = step;
        switch (step) {
            case DAMP:
                envStepLevelDur[op] = rateDecayDurTable[(12 << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = 1;
                envStepNextAtLevel[op] = 128;
                envStepNext[op] = ATTACK;
                break;
            case ATTACK:
                envStepLevelDur[op] = rateAttackDurTable[(ar[op] << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = -8;
                envStepNextAtLevel[op] = 0;
                envStepNext[op] = DECAY;
                // Reset phase counter?
                phaseCounter[op] = 0;
                break;
            case DECAY:
                envStepLevelDur[op] = rateDecayDurTable[(dr[op] << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = 1;
                envStepNextAtLevel[op] = sl[op] << 3;
                envStepNext[op] = SUSTAIN;
                break;
            case SUSTAIN:
                if (envType[op]) {
                    // Sustained tone
                    envStepLevelIncClock[op] = envStepLevelDur[op] = 0;     // Never
                    envStepLevelInc[op] = 0;
                    envStepNextAtLevel[op] = 255;   // Never
                    envStepNext[op] = SUSTAIN;
                } else {
                    // Percussive tone
                    envStepLevelDur[op] = rateDecayDurTable[(rr[op] << 2) + ksrOffset[op]];
                    envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                    envStepLevelInc[op] = 1;
                    envStepNextAtLevel[op] = 128;
                    envStepNext[op] = IDLE;
                }
                break;
            case RELEASE:
                var rate = envType[op]
                    ? sustain[op >> 1] ? 5 : rr[op]     // Sustained tone
                    : sustain[op >> 1] ? 5 : 7;         // Percussive tone
                envStepLevelDur[op] = rateDecayDurTable[(rate << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = 1;
                envStepNextAtLevel[op] = 128;
                envStepNext[op] = IDLE;
                break;
            case IDLE:
            default:
                envLevel[op] = 128;
                envStepLevelIncClock[op] = envStepLevelDur[op] = 0;     // Never
                envStepLevelInc[op] = 0;
                envStepNextAtLevel[op] = 255;   // Never
                envStepNext[op] = IDLE;
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

    function updateFrequency(chan) {
        var m = chan << 1, c = m + 1;
        var vibVal = vib[m] ? vibValues[fNum[m] >> 6][vibPhase] : 0;
        phaseInc[m] = ((((fNum[m] << 1) + vibVal) * multi[m])) << block[m] >> 2;    // Take back the MULTI doubling in the table (>> 1) and the fNum doubling here. Do this because we must use half of vib value, without losing precision in the shift operations
            vibVal = vib[c] ? vibValues[fNum[c] >> 6][vibPhase] : 0;
        phaseInc[c] = ((((fNum[c] << 1) + vibVal) * multi[c])) << block[c] >> 2;
        updateKSLAttenuation(chan);
        updateKSROffset(chan);
    }

    function updateFrequencyOp(op) {
        var vibVal = vib[op] ? vibValues[fNum[op] >> 6][vibPhase] : 0;
        phaseInc[op] = ((((fNum[op] << 1) + vibVal) * multi[op])) << block[op] >> 2;
        updateKSLAttenuationOp(op);
        updateKSROffsetOp(op);
    }

    function updateKSROffset(chan) {
        var m = chan << 1, c = m + 1;
        ksrOffset[m] = (ksr[m] ? block[m] << 1 : block[m] >> 1) | (fNum[m] >>> (9 - ksr[m]));
        ksrOffset[c] = (ksr[c] ? block[c] << 1 : block[c] >> 1) | (fNum[c] >>> (9 - ksr[c]));
    }

    function updateKSROffsetOp(op) {
        ksrOffset[op] = (ksr[op] ? block[op] << 1 : block[op] >> 1) | (fNum[op] >>> (9 - ksr[op]));
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
        var m = chan << 1, c = m + 1;
        kslAtt[m] = kslValues[ksl[m]][block[m]][fNum[m] >>> 5] << 4;
        kslAtt[c] = kslValues[ksl[c]][block[c]][fNum[c] >>> 5] << 4;
        updateTotalAttenuation(chan);
    }

    function updateKSLAttenuationOp(op) {
        kslAtt[op] = kslValues[ksl[op]][block[op]][fNum[op] >>> 5] << 4;
        updateTotalAttenuationOp(op);
    }

    function updateEnvAttenuation(chan) {
        var m = chan << 1, c = m + 1;
        envAtt[m] = (envLevel[m] === 128 ? 256 : envLevel[m]) << 4;            // Higher attenuation in case of minimum level to produce silence
        envAtt[c] = (envLevel[c] === 128 ? 256 : envLevel[c]) << 4;
        updateTotalAttenuation(chan);
    }

    function updateEnvAttenuationOp(op) {
        envAtt[op] = (envLevel[op] === 128 ? 256 : envLevel[op]) << 4;         // Higher attenuation in case of minimum level to produce silence
        updateTotalAttenuationOp(op);
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


    var cpu;

    var audioConnected = false;


    // Global settings
    var status = 0;
    var registerAddress = 0;
    var register = new Array(0x38);

    var timer1Preset = 0, timer2Preset = 0;
    var timer1Counter = 0, timer2Counter = 0;
    var timer1Active = false, timer2Active = false;
    var timer1Masked = false, timer2Masked = false;


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
    var keyOn =    new Array(18);
    var am =       new Array(18);
    var vib =      new Array(18);
    var envType =  new Array(18);
    var ksr =      new Array(18);
    var multi =    new Array(18);
    var ksl =      new Array(18);
    var halfWave = new Array(18);
    var ar =       new Array(18);
    var dr =       new Array(18);
    var sl =       new Array(18);
    var rr =       new Array(18);
    var fNum  =    new Array(18);
    var block =    new Array(18);
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

    var phaseInc =     new Array(18);
    var phaseCounter = new Array(18);


    // Debug vars

    //this.register = register;

    //this.keyOn = keyOn;
    //this.sustain = sustain;
    //this.fNum = fNum;
    //this.block = block;
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

        audioConnected = s.ac;

        registerAddress = s.ra;
        var regs = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r);
        for (var r = 0; r < regs.length; r++) registerWrite(r, regs[r]);

        clock = s.c;
        noiseRegister = s.nr; noiseOutput = s.no;
        amLevel = s.al; amLevelInc = s.ai; vibPhase = s.vp;

        amAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.amt, amAtt);
        envAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.evt, envAtt);
        kslAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.kst, kslAtt);
        totalAtt = wmsx.Util.restoreStringBase64ToInt16BitArray(s.tot, totalAtt);

        envStep = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evs, envStep);
        envStepLevelDur = wmsx.Util.restoreStringBase64ToInt32BitArray(s.evd);
        envStepLevelIncClock = s.evc;
        envStepLevelInc = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.evi, envStepLevelInc);
        envStepNext = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evn, envStepNext);
        envStepNextAtLevel = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evl, envStepNextAtLevel);
        envLevel = wmsx.Util.restoreStringBase64ToInt8BitArray(s.eve, envLevel);
        ksrOffset = wmsx.Util.restoreStringBase64ToInt8BitArray(s.kso, ksrOffset);

        fbLastMod1 = wmsx.Util.restoreStringBase64ToSignedInt16BitArray(s.fb1, fbLastMod1);
        fbLastMod2 = wmsx.Util.restoreStringBase64ToSignedInt16BitArray(s.fb2, fbLastMod2);
    };


    init();

    this.eval = function(str) {
        return eval(str);
    };

};
