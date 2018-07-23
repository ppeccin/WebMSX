// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// OPL4 Wave Sound Chip

wmsx.OPL4AudioWave = function(opl4) {
"use strict";

    var self = this;

    function init() {
        var tabs = new wmsx.OPL4WaveTables();
        linearTable = tabs.getLinearTable12Bits();
        expTable = tabs.getExpTable();
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
        amLevel = 0; amLevelInc = -1; vibPhase = 0;

        // Settings per Channel

        wmsx.Util.arrayFill(waveNumber, 0);
        wmsx.Util.arrayFill(dataBits, 0);
        wmsx.Util.arrayFill(startAddress, 0);
        wmsx.Util.arrayFill(loopPosition, 0);
        wmsx.Util.arrayFill(endPosition, 0);
        wmsx.Util.arrayFill(samplePos, 0);
        wmsx.Util.arrayFill(sampleValue, 0);
        wmsx.Util.arrayFill(phaseInc, 0x200);   // Correct value for Octave = 0 and fNum = 0
        wmsx.Util.arrayFill(phaseCounter, 0);

        wmsx.Util.arrayFill(fNum, 0);
        wmsx.Util.arrayFill(octave, 0);
        wmsx.Util.arrayFill(reverb, 0);
        wmsx.Util.arrayFill(keyOn, 0);
        wmsx.Util.arrayFill(ar, 0);
        wmsx.Util.arrayFill(d1r, 0);
        wmsx.Util.arrayFill(dl, 0);
        wmsx.Util.arrayFill(d2r, 0);
        wmsx.Util.arrayFill(rr, 0);
        wmsx.Util.arrayFill(volume, 0);
        wmsx.Util.arrayFill(am, 0);
        wmsx.Util.arrayFill(vib, 0);
        wmsx.Util.arrayFill(rc, 0);
        wmsx.Util.arrayFill(ksl, 0);

        // Dynamic values

        wmsx.Util.arrayFill(volumeAtt, 0);
        wmsx.Util.arrayFill(amAtt, 0);
        wmsx.Util.arrayFill(envAtt, 0);
        wmsx.Util.arrayFill(kslAtt, 0);
        wmsx.Util.arrayFill(totalAtt, 0);
        wmsx.Util.arrayFill(envStep, IDLE);
        wmsx.Util.arrayFill(envStepLevelDur, 0);
        wmsx.Util.arrayFill(envStepLevelIncClock, 0);
        wmsx.Util.arrayFill(envStepLevelInc, 0);
        wmsx.Util.arrayFill(envStepNext, IDLE);
        wmsx.Util.arrayFill(envStepNextAtLevel, 0);
        wmsx.Util.arrayFill(envLevel, 0);
        wmsx.Util.arrayFill(rcOffset, 0);
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

    this.audioClockPulse = function() {
        var amChanged, vibChanged = false;

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
        }
    };

    this.nextSample = function() {
        var phase, newPhase, delta;
        var sample = 0;

        for (var cha = 23; cha >= 0; --cha) {
            if (envStep[cha] === IDLE) continue;

            // Update phase (0..1023)
            phase = phaseCounter[cha];
            newPhase = phaseCounter[cha] = (phase + phaseInc[cha]) & 0x7fffffff;

            delta = (newPhase >> 10) - (phase >> 10);

            if (delta > 0)
                sample += expTable[advanceSample(cha, delta) + totalAtt[cha]];
            else
                sample += expTable[sampleValue[cha] + totalAtt[cha]];

            // if (delta > 0) sample += advanceSample(cha, delta); else sample += sampleValue[cha];

            // if (sample > (24 * 4096) || sample < (24 * -4096)) console.log("Wave overflow: " + sample);
        }

        return sample;
    };

    function readWaveHeader(cha) {
        var num = waveNumber[cha];

        var waveTableHeader = (register[2] >> 2) & 0x07;
        var address = num < 384 || waveTableHeader === 0 ? num * 12 : (waveTableHeader << 19) + (num - 384) * 12;

        // console.log(cha, waveTableHeader, num, address);

        var val = opl4.memoryRead(address++);
        dataBits[cha] = val >> 6;
        startAddress[cha] = ((val & 0x3f) << 16) | (opl4.memoryRead(address++) << 8) | opl4.memoryRead(address++);
        loopPosition[cha] = (opl4.memoryRead(address++) << 8) | opl4.memoryRead(address++);                 // delta from start in samples
        endPosition[cha] = ~((opl4.memoryRead(address++) << 8) | opl4.memoryRead(address++)) & 0xffff;      // delta from start in samples
        registerWrite(0x80 + cha, opl4.memoryRead(address++));
        registerWrite(0x98 + cha, opl4.memoryRead(address++));
        registerWrite(0xb0 + cha, opl4.memoryRead(address++));
        registerWrite(0xc8 + cha, opl4.memoryRead(address++));
        registerWrite(0xe0 + cha, opl4.memoryRead(address++));

        // console.log("Wave Number", cha, ":", num);
    }

    function registerWrite(reg, val) {
        // console.log("Wave Register WRITE: " + reg.toString(16) + " : " + val.toString(16));

        var cha;

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
                cha = reg - 0x08;
                waveNumber[cha] = ((register[0x20 + cha] & 1) << 8) | val;
                readWaveHeader(cha);
                break;
            case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27: case 0x28: case 0x29: case 0x2a: case 0x2b:
            case 0x2c: case 0x2d: case 0x2e: case 0x2f: case 0x30: case 0x31: case 0x32: case 0x33: case 0x34: case 0x35: case 0x36: case 0x37:
                cha = reg - 0x20;
                if (mod & 0xfe) {
                    fNum[cha] = (val >> 1) | (((register[0x38 + cha]) & 0x07) << 7);                    // FNUM
                    updateFrequency(cha);
                }
                break;
            case 0x38: case 0x39: case 0x3a: case 0x3b: case 0x3c: case 0x3d: case 0x3e: case 0x3f: case 0x40: case 0x41: case 0x42: case 0x43:
            case 0x44: case 0x45: case 0x46: case 0x47: case 0x48: case 0x49: case 0x4a: case 0x4b: case 0x4c: case 0x4d: case 0x4e: case 0x4f:
                cha = reg - 0x38;
                if (mod & 0xf0)
                    // signed 4 bits to decimal -8 .. 7
                    octave[cha] = val & 0x80 ? (val >> 4) - 0x10 : val >> 4;                            // OCTAVE
                if (mod & 0x07)
                    fNum[cha] = ((val & 0x07) << 7) | (register[0x20 + cha] >> 1);                      // FNUM
                if (mod & 0xf7) updateFrequency(cha);
                if (mod & 0x08)
                    reverb[cha] = (val & 0x08) >> 3;                                                    // PSEUDO REVERB
                break;
            case 0x68: case 0x69: case 0x6a: case 0x6b: case 0x6c: case 0x6d: case 0x6e: case 0x6f: case 0x70: case 0x71: case 0x72: case 0x73:
            case 0x74: case 0x75: case 0x76: case 0x77: case 0x78: case 0x79: case 0x7a: case 0x7b: case 0x7c: case 0x7d: case 0x7e: case 0x7f:
                cha = reg - 0x68;
                if (mod & 0x80) setKeyOn(cha, val >> 7);                                                // KEY ON
                break;
            case 0x98: case 0x99: case 0x9a: case 0x9b: case 0x9c: case 0x9d: case 0x9e: case 0x9f: case 0xa0: case 0xa1: case 0xa2: case 0xa3:
            case 0xa4: case 0xa5: case 0xa6: case 0xa7: case 0xa8: case 0xa9: case 0xaa: case 0xab: case 0xac: case 0xad: case 0xae: case 0xaf:
                cha = reg - 0x98;
                if (mod & 0xf0) ar[cha] = val >= 0xf0 ? 63 : (val & 0xf0) >> 2;                         // AR   x 4 (15 becomes 63)
                if (mod & 0x0f) d1r[cha] = (val & 0x0f) === 15 ? 63 : (val & 0x0f) << 2;                  // D1R  x 4 (15 becomes 63)
                break;
            case 0xb0: case 0xb1: case 0xb2: case 0xb3: case 0xb4: case 0xb5: case 0xb6: case 0xb7: case 0xb8: case 0xb9: case 0xba: case 0xbb:
            case 0xbc: case 0xbd: case 0xbe: case 0xbf: case 0xc0: case 0xc1: case 0xc2: case 0xc3: case 0xc4: case 0xc5: case 0xc6: case 0xc7:
                cha = reg - 0xb0;
                if (mod & 0xf0) dl[cha] = val >> 4;                                                     // DL
                if (mod & 0x0f) d2r[cha] = (val & 0x0f) === 15 ? 63 : (val & 0x0f) << 2;                  // D2R  x 4 (15 becomes 63)
                break;
            case 0xc8: case 0xc9: case 0xca: case 0xcb: case 0xcc: case 0xcd: case 0xce: case 0xcf: case 0xd0: case 0xd1: case 0xd2: case 0xd3:
            case 0xd4: case 0xd5: case 0xd6: case 0xd7: case 0xd8: case 0xd9: case 0xda: case 0xdb: case 0xdc: case 0xdd: case 0xde: case 0xdf:
                cha = reg - 0xc8;
                if (mod & 0xf0) {
                    rc[cha] = val >> 4;                                                                 // RC
                    updateRateCorrOffset(cha);
                }
                if (mod & 0x0f) rr[cha] = (val & 0x0f) === 15 ? 63 : (val & 0x0f) << 2;                   // RR  x 4 (15 becomes 63)
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

    function setKeyOn(cha, on) {
        keyOn[cha] = on;
        // Define ADSR phase
        if (on) {
            setEnvStep(cha, DAMP);

            // console.log("Note:", cha, waveNumber[cha], octave[cha], fNum[cha], phaseInc[cha].toString(16));
        } else
            if (envStep[cha] !== IDLE && envStep[cha] !== REVERB) setEnvStep(cha, RELEASE);
    }

    function startSample(cha) {
        samplePos[cha] = 0;
        phaseCounter[cha] = 0;
        return updateSampleValue12bitsLog(cha);
    }

    function advanceSample(cha, quant) {
        var newPos = samplePos[cha] + quant;
        samplePos[cha] = newPos > endPosition[cha]
            ? loopPosition[cha] + (newPos - endPosition[cha]) - 1
            : newPos;
        return updateSampleValue12bitsLog(cha);
    }

    function updateSampleValue12bitsLog(cha) {
        var addr, bin;
        var start = startAddress[cha];
        var bits = dataBits[cha];
        if (bits === 1) {
            // 12 bits per sample
            addr = start + (samplePos[cha] >> 1) * 3;
            bin = samplePos[cha] & 1
                ? ((opl4.memoryRead(addr + 2) << 4) | (opl4.memoryRead(addr + 1) & 0x0f))
                : (opl4.memoryRead(addr) << 4) | (opl4.memoryRead(addr + 1) >> 4);
        } else if (bits === 2) {
            // 16 bits per sample
            addr = start + (samplePos[cha] << 1);
            bin = ((opl4.memoryRead(addr) << 8) | opl4.memoryRead(addr + 1)) >> 4;  // scale down to 12 bits
        } else if (bits === 0) {
            // 8 bits per sample
            addr = start + samplePos[cha];
            bin = opl4.memoryRead(addr);
            bin = (bin << 4) | ((bin & 0x70) >> 3);         // scale up to 12 bits
        } else {
            bin = 0;
        }
        return sampleValue[cha] = linearTable[bin];       // to log signed -4096 .. 4095, signal in bit 14
    }

    function updateSampleValue16bits(cha) {
        var addr, bin;
        var start = startAddress[cha];
        var bits = dataBits[cha];
        if (bits === 1) {
            // 12 bits per sample
            addr = start + (samplePos[cha] >> 1) * 3;
            bin = samplePos[cha] & 1
                ? ((opl4.memoryRead(addr + 2) << 4) | (opl4.memoryRead(addr + 1) & 0x0f))
                : (opl4.memoryRead(addr) << 4) | (opl4.memoryRead(addr + 1) >> 4);
            bin = (bin << 4) | ((bin & 0x7ff) >> 7);        // scale up to 16 bits
        } else if (bits === 2) {
            // 16 bits per sample
            addr = start + (samplePos[cha] << 1);
            bin = (opl4.memoryRead(addr) << 8) | opl4.memoryRead(addr + 1);
        } else if (bits === 0) {
            // 8 bits per sample
            addr = start + samplePos[cha];
            bin = opl4.memoryRead(addr);
            bin = (bin << 8) | ((bin & 0x7f) << 1);         // scale up to 16 bits
        } else {
            bin = 0;
        }
        return sampleValue[cha] = bin & 0x8000 ? bin - 0x10000 : bin;       // to signed -32768 .. 32767
    }

    function setEnvStep(cha, step) {
        envStep[cha] = step;
        switch (step) {
            case DAMP:
                envStepLevelDur[cha] = 1; // rateDecayDurTable[(14 << 2)];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = 1;
                envStepNextAtLevel[cha] = 256;
                envStepNext[cha] = ATTACK;
                break;
            case ATTACK:
                envStepLevelDur[cha] = ar[cha] === 0 ? 0 : rateAttackDurTable[ar[cha] + rcOffset[cha]];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = -1;
                envStepNextAtLevel[cha] = 0;
                envStepNext[cha] = DECAY1;
                startSample(cha);
                break;
            case DECAY1:
                envStepLevelDur[cha] = d1r[cha] === 0 ? 0 : rateDecayDurTable[d1r[cha] + rcOffset[cha]];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = 1;
                 if (reverb[cha]) {
                     envStepNextAtLevel[cha] = 6 << 3;   // ~ 18 dB
                     envStepNext[cha] = REVERB;
                 } else {
                    envStepNextAtLevel[cha] = dl[cha] << 3;
                    envStepNext[cha] = DECAY2;
                 }
                break;
            case DECAY2:
                 envStepLevelDur[cha] = d2r[cha] === 0 ? 0 : rateDecayDurTable[d2r[cha] + rcOffset[cha]];
                 envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                 envStepLevelInc[cha] = 1;
                 if (reverb[cha] && envLevel[cha] < (6 << 3)) {
                     envStepNextAtLevel[cha] = 6 << 3;   // ~ 18 dB
                     envStepNext[cha] = REVERB;
                 } else {
                    envStepNextAtLevel[cha] = 256;
                    envStepNext[cha] = IDLE;
                 }
                break;
            case RELEASE:
                envStepLevelDur[cha] = rr[cha] === 0 ? 0 : rateDecayDurTable[rr[cha] + rcOffset[cha]];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = 1;
                if (reverb[cha] && envLevel[cha] < (6 << 3)) {
                    envStepNextAtLevel[cha] = 6 << 3;   // ~ 18 dB
                    envStepNext[cha] = REVERB;
                } else {
                    envStepNextAtLevel[cha] = 256;
                    envStepNext[cha] = IDLE;
                }
                break;
            case REVERB:
                envStepLevelDur[cha] = rateDecayDurTable[5 << 2];
                envStepLevelIncClock[cha] = clock + envStepLevelDur[cha];
                envStepLevelInc[cha] = 1;
                envStepNextAtLevel[cha] = 256;
                envStepNext[cha] = IDLE;
                break;
            case IDLE:
            default:
                envLevel[cha] = 256;
                envStepLevelIncClock[cha] = envStepLevelDur[cha] = 0;     // Never
                envStepLevelInc[cha] = 0;
                envStepNextAtLevel[cha] = 255;   // Never
                envStepNext[cha] = IDLE;
                break;
        }
    }

    function setVolume(cha, val) {
        volume[cha] = val;
        updateVolumeAttenuation(cha);
    }

    function updateFrequency(cha) {
        var vibVal = 0; vib[cha] ? vibValues[fNum[cha] >> 6][vibPhase] : 0;
        phaseInc[cha] = ((1 << 10) + fNum[cha] + vibVal) << 8 >> (8 - octave[cha] + 1);
        updateKSLAttenuation(cha);
        updateRateCorrOffset(cha);

        // console.log("Wave UpdateFrequency", cha, ":", octave[cha], fNum[cha], phaseInc[cha].toString(16));
    }

    function updateRateCorrOffset(cha) {
        // TODO: Fix : May get wrong rates (<0) from table since it can be < 0 because of octave.
        rcOffset[cha] = rc[cha] === 15 ? 0 : ((rc[cha] + octave[cha]) << 1) + (fNum[cha] >> 8) ;
    }

    function updateAMAttenuation(cha) {
        return;

        amAtt[cha] = am[cha] ? amLevel << 4 : 0;
        updateTotalAttenuation(cha);
    }

    function updateKSLAttenuation(cha) {
        return;

        kslAtt[cha] = kslValues[ksl[cha]][octave[cha]][fNum[cha] >>> 5] << 4;
        updateTotalAttenuation(cha);
    }

    function updateEnvAttenuation(cha) {
        envAtt[cha] = envLevel[cha] << 4;
        // envAtt[cha] = (envLevel[cha] === 128 ? 256 : envLevel[cha]) << 5;         // Higher attenuation in case of minimum level to produce silence
        updateTotalAttenuation(cha);
    }

    function updateVolumeAttenuation(cha) {
        volumeAtt[cha] = (volume[cha] === 15 ? 30 : volume[cha]) << 7;            // Higher attenuation in case of minimum volume to produce silence
        updateTotalAttenuation(cha);
    }

    function updateTotalAttenuation(cha) {
        totalAtt[cha] = amAtt[cha] + kslAtt[cha] + envAtt[cha] + volumeAtt[cha];

        //       0..208 + 0..1792 + 0..2048 + 0..2016
        // max:  256    + 2048    + 4096    + 4096      = 10496 = 0x2900
    }


    // Global settings
    var memoryAddress;
    var registerAddress;
    var register = new Array(0xff);

    // Dynamic global values. Change as time passes
    var clock;
    var amLevel, amLevelInc;
    var vibPhase;

    // Settings Per Channel
    var waveNumber =   new Array(24);
    var dataBits  =    new Array(24);
    var startAddress = new Array(24);
    var loopPosition = new Array(24);
    var endPosition =  new Array(24);
    var samplePos =    new Array(24);
    var sampleValue =  new Array(24);
    var phaseInc =     new Array(24);
    var phaseCounter = new Array(24);

    var fNum =   new Array(24);
    var octave = new Array(24);
    var reverb = new Array(24);
    var keyOn =  new Array(24);
    var ar =     new Array(24);
    var d1r =    new Array(24);
    var dl =     new Array(24);
    var d2r =    new Array(24);
    var rc =     new Array(24);
    var rr =     new Array(24);

    var am =       new Array(24);
    var vib =      new Array(24);
    var ksl =      new Array(24);
    var volume =   new Array(24);

    // Dynamic values per Channel. May change as time passes without being set by software
    var amAtt =     new Array(24);
    var envAtt =    new Array(24);
    var kslAtt =    new Array(24);
    var volumeAtt = new Array(24);
    var totalAtt =  new Array(24);

    var envStep =              new Array(24);
    var envStepLevelDur =      new Array(24);
    var envStepLevelIncClock = new Array(24);
    var envStepLevelInc =      new Array(24);
    var envStepNext =          new Array(24);
    var envStepNextAtLevel =   new Array(24);
    var envLevel =             new Array(24);

    var rcOffset =  new Array(24);


    // Constants

    var IDLE = 255, DAMP = 0, ATTACK = 1, DECAY1 = 2, DECAY2 = 3, RELEASE = 4, REVERB = 5;       // Envelope steps


    // Debug vars

    //this.register = register;

    //this.keyOn = keyOn;
    //this.reverb = reverb;
    //this.fNum = fNum;
    //this.octave = octave;
    //this.instr = instr;
    //this.volume = volume;
    //this.modTL = modTL;

    //this.am = am;
    //this.vib = vib;
    //this.envType = envType;
    //this.rc = rc;
    //this.multi = multi;
    //this.ksl = ksl;
    //this.halfWave = halfWave;
    //this.ar = ar;
    //this.d1r = d1r;
    //this.dl = dl;
    //this.rr = rr;
    //this.rcOffset = rcOffset;

    //this.kslAtt = kslAtt;
    //this.fbShift = fbShift;
    //this.envAtt = envAtt;
    //this.amAtt = amAtt;
    //this.volumeAtt = volumeAtt;
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

    var linearTable, expTable, vibValues, kslValues, rateAttackDurTable, rateDecayDurTable;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ra: registerAddress,
            ma: memoryAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(register),

            c: clock,
            al: amLevel, ai: amLevelInc, vp: vibPhase,

            wn: wmsx.Util.storeInt16BitArrayToStringBase64(waveNumber),
            db: wmsx.Util.storeInt8BitArrayToStringBase64(dataBits),
            sa: wmsx.Util.storeInt32BitArrayToStringBase64(startAddress),
            lp: wmsx.Util.storeInt16BitArrayToStringBase64(loopPosition),
            ep: wmsx.Util.storeInt16BitArrayToStringBase64(endPosition),

            pc: wmsx.Util.storeInt32BitArrayToStringBase64(phaseCounter),
            sp: wmsx.Util.storeInt32BitArrayToStringBase64(samplePos),
            sv: wmsx.Util.storeInt32BitArrayToStringBase64(sampleValue),

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

            kso: wmsx.Util.storeInt8BitArrayToStringBase64(rcOffset)
        }
    };

    this.loadState = function(s) {
        this.reset();

        registerAddress = s.ra;
        var reg = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r);
        for (var r = 0x02; r < 0x06; r++) registerWrite(r, reg[r]);
        for (    r = 0x08; r < 0x20; r++) register[r] = reg[r];         // Reading Wave Header data not necessary
        for (    r = 0x20; r < 0xfa; r++) registerWrite(r, reg[r]);
        memoryAddress = s.ma;

        clock = s.c;
        amLevel = s.al; amLevelInc = s.ai; vibPhase = s.vp;

        waveNumber = wmsx.Util.restoreStringBase64ToInt16BitArray(s.wn, waveNumber);
        dataBits = wmsx.Util.restoreStringBase64ToInt8BitArray(s.db, dataBits);
        startAddress = wmsx.Util.restoreStringBase64ToInt32BitArray(s.sa, startAddress);
        loopPosition = wmsx.Util.restoreStringBase64ToInt16BitArray(s.lp, loopPosition);
        endPosition = wmsx.Util.restoreStringBase64ToInt16BitArray(s.ep, endPosition);

        phaseCounter = wmsx.Util.restoreStringBase64ToInt32BitArray(s.pc, phaseCounter);
        samplePos = wmsx.Util.restoreStringBase64ToInt32BitArray(s.sp, samplePos);
        sampleValue = wmsx.Util.restoreStringBase64ToInt32BitArray(s.sv, sampleValue);

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
        rcOffset = wmsx.Util.restoreStringBase64ToInt8BitArray(s.kso, rcOffset);
    };


    init();

    window.L = linearTable;
    window.E = expTable;


    this.eval = function(str) {
        return eval(str);
    };

};
