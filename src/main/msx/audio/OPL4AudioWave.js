// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// OPL4 Wave Sound Chip

wmsx.OPL4AudioWave = function(opl4, fm) {
"use strict";

    var self = this;

    function init() {
        var tabs = new wmsx.OPL4WaveTables();
        rateAttackPatterns = tabs.getRateAttackPatterns();
        rateDecayPatterns = tabs.getRateDecayPatterns();
        lfoStepClocks = tabs.getLFOStepClocks();
        vibStepOffsets = tabs.getVIBOffsets();
        amStepOffsets = tabs.getAMOffsets();
        panpotValues = tabs.getPanPotValues();
        volumeTable = tabs.getVolumeTable();
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
        clock = 0;
        memoryAddress = 0;
        registerAddress = 0;

        // Init all registers
        wmsx.Util.arrayFill(register, 0);
        for (var r = 0x50; r < 0x68; ++r) register[r] = 0xfe;
        for (    r = 0x68; r < 0x80; ++r) register[r] = 0x20;

        // Settings per Channel

        wmsx.Util.arrayFill(dataBits, 0);
        wmsx.Util.arrayFill(startAddress, 0);
        wmsx.Util.arrayFill(loopPosition, 0);
        wmsx.Util.arrayFill(endPosition, 0);
        wmsx.Util.arrayFill(phaseInc, 0x200);   // Correct value for Octave = 0 and fNum = 0

        wmsx.Util.arrayFill(fNum, 0);
        wmsx.Util.arrayFill(octave, 0);
        wmsx.Util.arrayFill(reverb, 0);
        wmsx.Util.arrayFill(ar, 0);
        wmsx.Util.arrayFill(d1r, 0);
        wmsx.Util.arrayFill(dl, 0);
        wmsx.Util.arrayFill(d2r, 0);
        wmsx.Util.arrayFill(rr, 0);
        wmsx.Util.arrayFill(rc, 0);
        wmsx.Util.arrayFill(rcOffset, 0);
        wmsx.Util.arrayFill(volume, 0xfe);
        wmsx.Util.arrayFill(panpotL, 0);
        wmsx.Util.arrayFill(panpotR, 0);

        wmsx.Util.arrayFill(lfoStepDur, 0);
        wmsx.Util.arrayFill(vibDepth, 0);
        wmsx.Util.arrayFill(amDepth, 0);

        // Dynamic values

        wmsx.Util.arrayFill(samplePos, 0);
        wmsx.Util.arrayFill(sampleValue, 0);
        wmsx.Util.arrayFill(phaseCounter, 0);

        wmsx.Util.arrayFill(envStep, IDLE);
        wmsx.Util.arrayFill(envStepNext, IDLE);
        wmsx.Util.arrayFill(envStepNextAtLevel, 0);
        wmsx.Util.arrayFill(envStepRate, 0);
        wmsx.Util.arrayFill(envStepLevelDur, 0);
        wmsx.Util.arrayFill(envStepLevelChangeClock, 0);
        wmsx.Util.arrayFill(envStepLevelPattCounter, 0);
        wmsx.Util.arrayFill(envLevel, 512);

        wmsx.Util.arrayFill(lfoStep, 0);
        wmsx.Util.arrayFill(lfoStepChangeClock, 0);
        wmsx.Util.arrayFill(vibOffset, 0);
        wmsx.Util.arrayFill(amOffset, 0);

        wmsx.Util.arrayFill(totalAttL, 1024);
        wmsx.Util.arrayFill(totalAttR, 1024);
    };

    this.output7E = function (val) {
        // fm.setBusyCycles(88);
        registerAddress = val;
    };

    this.input7F = function() {
        return registerRead(registerAddress);
    };

    this.output7F = function (val) {
        // fm.setBusyCycles(88);
        registerWrite(registerAddress, val);
    };

    this.nextSample = function() {
        var newLfoStep;
        var phase, newPhase, delta;
        var cha, sample = 0, sampleL = 0, sampleR = 0;

        ++clock;

        for (cha = 23; cha >= 0; --cha) {

            // Clock and update LFO effects
            newLfoStep = clockLFO(cha);
            if (newLfoStep >= 0) {
                if (vibDepth[cha]) updateVIBOffset(cha, newLfoStep);
                if (amDepth[cha])  updateAMOffset(cha, newLfoStep);
            }

            if (envStep[cha] === IDLE) continue;

            // Clock and update ADSR envelopes
            clockEnvelope(cha);

            // Update phase (0..1023)
            phase = phaseCounter[cha];
            newPhase = phaseCounter[cha] = (phase + phaseInc[cha]) & 0x7fffffff;

            delta = (newPhase >> 10) - (phase >> 10);

            if (delta > 0) {
                sample = advanceSample(cha, delta);
                sampleL += sample * volumeTable[totalAttL[cha]];
                sampleR += sample * volumeTable[totalAttR[cha]];
            } else {
                sampleL += sampleValue[cha] * volumeTable[totalAttL[cha]];
                sampleR += sampleValue[cha] * volumeTable[totalAttR[cha]];
            }

            // if (delta > 0) sampleL += advanceSample(cha, delta); else sampleL += sampleValue[cha];
            // if (sampleL > (24 * 4096) || sampleL < (24 * -4096)) console.log("Wave overflow: " + sampleL);
        }

        sampleResult[0] = sampleL;
        sampleResult[1] = sampleR;
        return sampleResult;
    };

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
                readWaveHeader(cha, ((register[0x20 + cha] & 1) << 8) | val);                           // WAVE HEADER
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
            case 0x50: case 0x51: case 0x52: case 0x53: case 0x54: case 0x55: case 0x56: case 0x57: case 0x58: case 0x59: case 0x5a: case 0x5b:
            case 0x5c: case 0x5d: case 0x5e: case 0x5f: case 0x60: case 0x61: case 0x62: case 0x63: case 0x64: case 0x65: case 0x66: case 0x67:
                cha = reg - 0x50;
                if (mod & 0xfe) {
                    volume[cha] = val & 0xfe;                                                           // TOTAL LEVEL
                    updateTotalAttenuation(cha);
                }
                break;
            case 0x68: case 0x69: case 0x6a: case 0x6b: case 0x6c: case 0x6d: case 0x6e: case 0x6f: case 0x70: case 0x71: case 0x72: case 0x73:
            case 0x74: case 0x75: case 0x76: case 0x77: case 0x78: case 0x79: case 0x7a: case 0x7b: case 0x7c: case 0x7d: case 0x7e: case 0x7f:
                cha = reg - 0x68;
                if (mod & 0xc0) setKeyOnAndDamp(cha, val & 0x80, val & 0x40);                           // KEY ON, DAMP
                if (mod & 0x20) setLFOReset(cha, val & 0x20);                                           // LFO RST
                if (mod & 0x0f) {
                    panpotL[cha] = panpotValues[0][val & 0x0f];                                         // PANPOT
                    panpotR[cha] = panpotValues[1][val & 0x0f];
                    updateTotalAttenuation(cha);
                }
                break;
            case 0x80: case 0x81: case 0x82: case 0x83: case 0x84: case 0x85: case 0x86: case 0x87: case 0x88: case 0x89: case 0x8a: case 0x8b:
            case 0x8c: case 0x8d: case 0x8e: case 0x8f: case 0x90: case 0x91: case 0x92: case 0x93: case 0x94: case 0x95: case 0x96: case 0x97:
                cha = reg - 0x80;
                if (mod & 0x38) lfoStepDur[cha] = lfoStepClocks[(val & 0x38) >> 3];                     // LFO (step duration in clocks)
                if (mod & 0x07) {                                                                       // VIB
                    vibDepth[cha] = val & 0x07;
                    updateVIBOffset(cha, lfoStep[cha]);
                }
                break;
            case 0x98: case 0x99: case 0x9a: case 0x9b: case 0x9c: case 0x9d: case 0x9e: case 0x9f: case 0xa0: case 0xa1: case 0xa2: case 0xa3:
            case 0xa4: case 0xa5: case 0xa6: case 0xa7: case 0xa8: case 0xa9: case 0xaa: case 0xab: case 0xac: case 0xad: case 0xae: case 0xaf:
                cha = reg - 0x98;
                if (mod & 0xf0) ar[cha] = val >= 0xf0 ? 63 : (val & 0xf0) >> 2;                         // AR   x 4 (15 becomes 63)
                if (mod & 0x0f) d1r[cha] = (val & 0x0f) === 15 ? 63 : (val & 0x0f) << 2;                // D1R  x 4 (15 becomes 63)
                break;
            case 0xb0: case 0xb1: case 0xb2: case 0xb3: case 0xb4: case 0xb5: case 0xb6: case 0xb7: case 0xb8: case 0xb9: case 0xba: case 0xbb:
            case 0xbc: case 0xbd: case 0xbe: case 0xbf: case 0xc0: case 0xc1: case 0xc2: case 0xc3: case 0xc4: case 0xc5: case 0xc6: case 0xc7:
                cha = reg - 0xb0;
                if (mod & 0xf0) dl[cha] = (val >= 0xf0 ? 31 : val >> 4) << 4;                           // DL (15 becomes -93 dB)
                if (mod & 0x0f) d2r[cha] = (val & 0x0f) === 15 ? 63 : (val & 0x0f) << 2;                // D2R  x 4 (15 becomes 63)
                break;
            case 0xc8: case 0xc9: case 0xca: case 0xcb: case 0xcc: case 0xcd: case 0xce: case 0xcf: case 0xd0: case 0xd1: case 0xd2: case 0xd3:
            case 0xd4: case 0xd5: case 0xd6: case 0xd7: case 0xd8: case 0xd9: case 0xda: case 0xdb: case 0xdc: case 0xdd: case 0xde: case 0xdf:
                cha = reg - 0xc8;
                if (mod & 0xf0) {
                    rc[cha] = val >> 4;                                                                 // RC
                    updateRateCorrOffset(cha);
                }
                if (mod & 0x0f) rr[cha] = (val & 0x0f) === 15 ? 63 : (val & 0x0f) << 2;                 // RR  x 4 (15 becomes 63)
                break;
            case 0xe0: case 0xe1: case 0xe2: case 0xe3: case 0xe4: case 0xe5: case 0xe6: case 0xe7: case 0xe8: case 0xe9: case 0xea: case 0xeb:
            case 0xec: case 0xed: case 0xee: case 0xef: case 0xf0: case 0xf1: case 0xf2: case 0xf3: case 0xf4: case 0xf5: case 0xf6: case 0xf7:
                cha = reg - 0xe0;
                if (mod & 0x07) {                                                                       // AM
                    amDepth[cha] = val & 0x07;
                    updateAMOffset(cha, lfoStep[cha]);
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
                res = register[reg];
        }

        // console.log("Wave Register READ: " + reg.toString(16) + " = " + res.toString(16));

        return res;
    }

    function readWaveHeader(cha, num) {
        // console.log("Reading Wave Header:", num);

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

        if (envStep[cha] !== IDLE) startSample(cha);
        // if (envStep[cha] !== IDLE) setEnvStep(cha, DAMP);

        // console.log("Wave Number", cha, ":", num);
    }

    function clockLFO(cha) {
        if (clock !== lfoStepChangeClock[cha]) return -1;

        lfoStepChangeClock[cha] += lfoStepDur[cha];
        return lfoStep[cha] = (lfoStep[cha] + 1) & 0x7f;
    }

    function updateVIBOffset(cha, step) {
        var newOffset = vibStepOffsets[(vibDepth[cha] << 7) | step];
        if (vibOffset[cha] !== newOffset) {
            vibOffset[cha] = newOffset;
            updateFrequency(cha);
        }
    }

    function updateAMOffset(cha, step) {
        var newOffset = amStepOffsets[(amDepth[cha] << 7) | step];
        if (amOffset[cha] !== newOffset) {
            amOffset[cha] = newOffset;
            updateTotalAttenuation(cha);
        }
    }

    function clockEnvelope(cha) {
        if (clock !== envStepLevelChangeClock[cha]) return;

        var changePattPos = envStepLevelPattCounter[cha] = (envStepLevelPattCounter[cha] + 1) & 7;
        if (envStep[cha] === ATTACK) {
            var change = rateAttackPatterns[(envStepRate[cha] << 3) | changePattPos];
            if (change >= 0) {
                envLevel[cha] -= 1 + (envLevel[cha] >> change);
                if (envLevel[cha] <= 0)
                    return setEnvStep(cha, DECAY1);
                updateTotalAttenuation(cha);
            }
        } else {
            change = rateDecayPatterns[(envStepRate[cha] << 3) | changePattPos];
            if (change >= 0) {
                envLevel[cha] += change;
                if (envLevel[cha] >= envStepNextAtLevel[cha])
                    return setEnvStep(cha, envStepNext[cha]);
                updateTotalAttenuation(cha);
            }
        }
        envStepLevelChangeClock[cha] += envStepLevelDur[cha];
    }

    function setKeyOnAndDamp(cha, on, damp) {
        // if (cha === 20 || cha === 19) console.log("Note:", cha, "env: " + envStep[cha], "lev: " + envLevel[cha], "vol: " + volume[cha], on ? "ON" : "OFF", damp ? "DAMP" : "NO-DAMP", waveNumber[cha], octave[cha], fNum[cha], phaseInc[cha].toString(16), "clock: " + clock);

        // Define ADSR phase
        if (damp) {
            if (envStep[cha] !== IDLE && envStep[cha] !== DAMP) setEnvStep(cha, DAMP);
        } else {
            if (on) {
                startSample(cha);
                setEnvStep(cha, ATTACK);
            } else
               if (envStep[cha] !== IDLE && envStep[cha] !== REVERB && envStep[cha] !== DAMP) setEnvStep(cha, RELEASE);
        }
    }

    function setLFOReset(cha, reset) {
        if (reset) {
            lfoStep[cha] = 0;
            lfoStepChangeClock[cha] = 0;
            if (vibOffset[cha] !== 0) {
                vibOffset[cha] = 0;
                updateFrequency(cha);
            }
            if (amOffset[cha] !== 0) {
                amOffset[cha] = 0;
                updateTotalAttenuation(cha);
            }
        } else
            lfoStepChangeClock[cha] = clock + lfoStepDur[cha];
    }

    function startSample(cha) {
        samplePos[cha] = 0;
        phaseCounter[cha] = 0;
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
        var nextLevel, rate;
        switch (step) {
            case ATTACK:
                rate = ar[cha] === 0 ? 0 : ar[cha] + rcOffset[cha];
                break;
            case DECAY1:
                envLevel[cha] = 0;
                nextLevel = dl[cha];
                if (nextLevel === 0)
                    return setEnvStep(cha, DECAY2);
                rate = d1r[cha] === 0 ? 0 : d1r[cha] + rcOffset[cha];
                if (reverb[cha] && nextLevel >= REVERB_ENV_LEVEL) {
                    envStepNextAtLevel[cha] = REVERB_ENV_LEVEL;
                    envStepNext[cha] = REVERB;
                } else {
                    envStepNextAtLevel[cha] = nextLevel;
                    envStepNext[cha] = DECAY2;
                }
                break;
            case DECAY2:
                rate = d2r[cha] === 0 ? 0 : d2r[cha] + rcOffset[cha];
                if (reverb[cha] && envLevel[cha] < REVERB_ENV_LEVEL) {
                    envStepNextAtLevel[cha] = REVERB_ENV_LEVEL;
                    envStepNext[cha] = REVERB;
                } else {
                    envStepNextAtLevel[cha] = 512;
                    envStepNext[cha] = IDLE;
                }
                break;
            case RELEASE:
                rate = rr[cha] === 0 ? 0 : rr[cha] + rcOffset[cha];
                if (reverb[cha]) {
                    if (envLevel[cha] < REVERB_ENV_LEVEL) {
                        envStepNextAtLevel[cha] = REVERB_ENV_LEVEL;
                        envStepNext[cha] = REVERB;
                    } else
                        return setEnvStep(cha, REVERB);
                } else {
                    envStepNextAtLevel[cha] = 512;
                    envStepNext[cha] = IDLE;
                }
                break;
            case REVERB:
                rate = REVERB_RATE;
                envStepNextAtLevel[cha] = 512;
                envStepNext[cha] = IDLE;
                break;
            case DAMP:
                rate = DAMP_RATE;
                envStepNextAtLevel[cha] = 512;
                envStepNext[cha] = IDLE;
                break;
            case IDLE:
            default:
                rate = 0;
                envLevel[cha] = 512;
                envStepNextAtLevel[cha] = 1024;         // Never
                envStepNext[cha] = IDLE;
                break;
        }
        envStep[cha] = step;
        envStepRate[cha] = rate;
        envStepLevelDur[cha] = rate < 4 ? 0 : rate >= 52 ? 1 : 1 << (13 - (rate >> 2));
        envStepLevelChangeClock[cha] = clock + envStepLevelDur[cha];
        envStepLevelPattCounter[cha] = 0;
        updateTotalAttenuation(cha);
    }

    function updateFrequency(cha) {
        phaseInc[cha] = ((((1 << 10) + fNum[cha]) << 8) + (vibOffset[cha] * 256)) >> (8 - octave[cha] + 1);     // vibOffset can be negative!
        updateRateCorrOffset(cha);

        // console.log("Wave UpdateFrequency", cha, ":", octave[cha], fNum[cha], phaseInc[cha].toString(16));
    }

    function updateRateCorrOffset(cha) {
        if (rc[cha] === 15) return rcOffset[cha] = 0;
        var corr = ((rc[cha] + octave[cha]) << 1) + (fNum[cha] >> 9);
        rcOffset[cha] = corr >= 0 ? corr : 0;
    }

    function updateTotalAttenuation(cha) {
        var baseAtt = amOffset[cha] + envLevel[cha] + volume[cha];
        totalAttL[cha] = baseAtt + panpotL[cha];
        totalAttR[cha] = baseAtt + panpotR[cha];
    }


    // Global settings
    var memoryAddress;
    var registerAddress;
    var register = new Array(0xff);

    // Dynamic global values. Change as time passes
    var clock;

    // Settings Per Channel
    var dataBits  =    new Array(24);
    var startAddress = new Array(24);
    var loopPosition = new Array(24);
    var endPosition =  new Array(24);
    var samplePos =    new Array(24);
    var sampleValue =  new Array(24);
    var phaseInc =     new Array(24);
    var phaseCounter = new Array(24);

    var fNum =     new Array(24);
    var octave =   new Array(24);
    var reverb =   new Array(24);
    var ar =       new Array(24);
    var d1r =      new Array(24);
    var dl =       new Array(24);
    var d2r =      new Array(24);
    var rc =       new Array(24);
    var rr =       new Array(24);
    var rcOffset = new Array(24);

    var volume =  new Array(24);
    var panpotL = new Array(24);
    var panpotR = new Array(24);

    var lfoStepDur = new Array(24);
    var vibDepth =   new Array(24);
    var amDepth =    new Array(24);


    // Dynamic values per Channel. May change as time passes without being set by software

    var envStep =                  new Array(24);
    var envStepNext =              new Array(24);
    var envStepNextAtLevel =       new Array(24);
    var envStepRate =              new Array(24);
    var envStepLevelDur =          new Array(24);
    var envStepLevelChangeClock =  new Array(24);
    var envStepLevelPattCounter =  new Array(24);
    var envLevel =                 new Array(24);

    var lfoStep =                  new Array(24);
    var lfoStepChangeClock =       new Array(24);
    var vibOffset =                new Array(24);
    var amOffset =                 new Array(24);

    var totalAttL = new Array(24);
    var totalAttR = new Array(24);


    // Constants

    var IDLE = 255, ATTACK = 1, DECAY1 = 2, DECAY2 = 3, RELEASE = 4, REVERB = 5, DAMP = 6;       // Envelope steps

    var REVERB_ENV_LEVEL = 6 << 4;   //  -18 dB
    var REVERB_RATE = 5 << 2;
    var DAMP_RATE = 15 << 2;

    // Pre calculated tables, factors, values

    var rateAttackPatterns, rateDecayPatterns, lfoStepClocks, vibStepOffsets, amStepOffsets, panpotValues, volumeTable;
    var sampleResult = [ 0, 0 ];


    // Savestate  -------------------------------------------

    this.saveState = function() {
        // TODO OPL4 Implement
        return {
            c: clock,
            ra: registerAddress,
            ma: memoryAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(register),

            db: wmsx.Util.storeInt8BitArrayToStringBase64(dataBits),
            sa: wmsx.Util.storeInt32BitArrayToStringBase64(startAddress),
            lp: wmsx.Util.storeInt16BitArrayToStringBase64(loopPosition),
            ep: wmsx.Util.storeInt16BitArrayToStringBase64(endPosition),

            sp: wmsx.Util.storeInt16BitArrayToStringBase64(samplePos),
            sv: wmsx.Util.storeInt16BitArrayToStringBase64(sampleValue),
            pc: wmsx.Util.storeInt32BitArrayToStringBase64(phaseCounter),

            evs: wmsx.Util.storeInt8BitArrayToStringBase64(envStep),
            evr: wmsx.Util.storeInt8BitArrayToStringBase64(envStepRate),
            evd: wmsx.Util.storeInt32BitArrayToStringBase64(envStepLevelDur),
            evc: envStepLevelChangeClock,
            evn: wmsx.Util.storeInt8BitArrayToStringBase64(envStepNext),
            evl: wmsx.Util.storeInt16BitArrayToStringBase64(envStepNextAtLevel),
            epc: wmsx.Util.storeInt8BitArrayToStringBase64(envStepLevelPattCounter),
            eve: wmsx.Util.storeInt16BitArrayToStringBase64(envLevel),

            lfs: wmsx.Util.storeInt8BitArrayToStringBase64(lfoStep),
            lfc: lfoStepChangeClock,
            vio: wmsx.Util.storeInt8BitArrayToStringBase64(vibOffset),
            amo: wmsx.Util.storeInt8BitArrayToStringBase64(amOffset),

            totL: wmsx.Util.storeInt16BitArrayToStringBase64(totalAttL),
            totR: wmsx.Util.storeInt16BitArrayToStringBase64(totalAttR)
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

        dataBits = wmsx.Util.restoreStringBase64ToInt8BitArray(s.db, dataBits);
        startAddress = wmsx.Util.restoreStringBase64ToInt32BitArray(s.sa, startAddress);
        loopPosition = wmsx.Util.restoreStringBase64ToInt16BitArray(s.lp, loopPosition);
        endPosition = wmsx.Util.restoreStringBase64ToInt16BitArray(s.ep, endPosition);

        phaseCounter = wmsx.Util.restoreStringBase64ToInt32BitArray(s.pc, phaseCounter);
        samplePos = wmsx.Util.restoreStringBase64ToInt16BitArray(s.sp, samplePos);
        sampleValue = wmsx.Util.restoreStringBase64ToSignedInt16BitArray(s.sv, sampleValue);

        envStep = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evs, envStep);
        envStepRate = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evr, envStepRate);
        envStepLevelDur = wmsx.Util.restoreStringBase64ToInt32BitArray(s.evd, envStepLevelDur);
        envStepLevelChangeClock = s.evc;
        envStepNext = wmsx.Util.restoreStringBase64ToInt8BitArray(s.evn, envStepNext);
        envStepNextAtLevel = wmsx.Util.restoreStringBase64ToInt16BitArray(s.evl, envStepNextAtLevel);
        envStepLevelPattCounter = wmsx.Util.restoreStringBase64ToInt16BitArray(s.epc, envStepLevelPattCounter);
        envLevel = wmsx.Util.restoreStringBase64ToInt16BitArray(s.eve, envLevel);

        lfoStep = wmsx.Util.restoreStringBase64ToInt8BitArray(s.lfs, lfoStep);
        lfoStepChangeClock = s.lfc;
        vibOffset = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.vio, vibOffset);
        amOffset = wmsx.Util.restoreStringBase64ToInt8BitArray(s.amo, amOffset);

        totalAttL = wmsx.Util.restoreStringBase64ToInt16BitArray(s.totL, totalAttL);
        totalAttR = wmsx.Util.restoreStringBase64ToInt16BitArray(s.totR, totalAttR);
    };


    init();


    // Debug

    this.eval = function(str) {
        return eval(str);
    };

};
