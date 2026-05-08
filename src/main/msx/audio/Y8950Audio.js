// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Yamaha Y8950 MSX-AUDIO chip, as used by Philips NMS-1205, Panasonic FS-CA1, Toshiba HX-MU900 and compatible cartridges
// Implements the MSX-AUDIO I/O surface, timers, ADPCM RAM/status and the OPL FM operator path.

wmsx.Y8950Audio = function(pName) {
"use strict";

    var self = this;

    function init() {
        name = pName || "Y8950";
        sampleRam = wmsx.Util.arrayFill(new Array(SAMPLE_RAM_SIZE), 0);
        var tabs = new wmsx.YM2413Tables();
        sineTable = tabs.getFullSineTable();
        expTable = tabs.getExpTable();
        multiFactors = tabs.getMultiFactorsDoubled();
        kslValues = tabs.getKSLValues();
        rateAttackDurTable = tabs.getRateAttackDurations();
        rateDecayDurTable = tabs.getRateDecayDurations();
    }

    this.connect = function(machine) {
        bus = machine.bus;
        cpu = machine.cpu;
        audioSocket = machine.getAudioSocket();

        bus.connectInputDevice( 0xc0, this.inputC0);
        bus.connectOutputDevice(0xc0, this.outputC0);
        bus.connectInputDevice( 0xc1, this.inputC1);
        bus.connectOutputDevice(0xc1, this.outputC1);
        bus.connectInputDevice( 0xc2, this.inputC0);
        bus.connectOutputDevice(0xc2, this.outputC0);
        bus.connectInputDevice( 0xc3, this.inputC1);
        bus.connectOutputDevice(0xc3, this.outputC1);

        for (var p = 0x08; p < 0x20; ++p) if ((p & 0xe8) === 0x08)
            bus.connectOutputDevice(p, this.outputDAC);

        if (audioConnected) connectAudio();
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectInputDevice( 0xc0, this.inputC0);
        machine.bus.disconnectOutputDevice(0xc0, this.outputC0);
        machine.bus.disconnectInputDevice( 0xc1, this.inputC1);
        machine.bus.disconnectOutputDevice(0xc1, this.outputC1);
        machine.bus.disconnectInputDevice( 0xc2, this.inputC0);
        machine.bus.disconnectOutputDevice(0xc2, this.outputC0);
        machine.bus.disconnectInputDevice( 0xc3, this.inputC1);
        machine.bus.disconnectOutputDevice(0xc3, this.outputC1);

        for (var p = 0x08; p < 0x20; ++p) if ((p & 0xe8) === 0x08)
            machine.bus.disconnectOutputDevice(p, this.outputDAC);

        disconnectAudio();
        audioSocket = null;
        bus = null;
        cpu = null;
    };

    this.powerOn = function() {
        wmsx.Util.arrayFill(sampleRam, 0);
        this.reset();
    };

    this.powerOff = function() {
        disconnectAudio();
    };

    this.reset = function() {
        wmsx.Util.arrayFill(register, 0);
        register[0x04] = 0x18;
        register[0x19] = 0x0f;      // Matches openMSX reset behavior
        registerAddress = 0;
        status = STATUS_BUF_RDY;
        statusMask = 0;
        timer1Counter = timer2Counter = 0;
        timer1Active = timer2Active = false;
        timer1BUSCycleCounter = timer2BUSCycleCounter = 0;
        lastTimerBUSCycle = cpu && cpu.getBUSCycles ? cpu.getBUSCycles() : 0;
        pcmBusy = false;
        sampleAddress = 0;
        sampleStart = sampleStop = 0;
        dacValue = 0x80;
        dacOutput = 0;
        dac13Output = 0;
        dacEnabled = false;
        midiStatus = 0;
        midiBusyReads = 0;
        chipEnabled = true;
        resetFM();
        resetADPCMPlayback();
        connectAudio();
    };

    this.inputC0 = function() {
        clockTimers();
        return (status & (0x87 | statusMask)) | 0x06;
    };

    this.outputC0 = function(val) {
        registerAddress = val & 0xff;
    };

    this.inputC1 = function() {
        return readRegister(registerAddress);
    };

    this.outputC1 = function(val) {
        writeRegister(registerAddress, val & 0xff);
    };

    this.outputDAC = function(val) {
        dacValue = val & 0xff;
        dacOutput = (dacValue - 0x80) << 1;
    };

    this.connectMIDI = function(machine) {
        for (var p = 0; p < 0x20; p += 8) {
            machine.bus.connectOutputDevice(p + 0x00, this.outputMIDIControl);
            machine.bus.connectOutputDevice(p + 0x01, this.outputMIDIData);
            machine.bus.connectInputDevice( p + 0x04, this.inputMIDIStatus);
            machine.bus.connectInputDevice( p + 0x05, this.inputMIDIData);
        }
    };

    this.disconnectMIDI = function(machine) {
        for (var p = 0; p < 0x20; p += 8) {
            machine.bus.disconnectOutputDevice(p + 0x00, this.outputMIDIControl);
            machine.bus.disconnectOutputDevice(p + 0x01, this.outputMIDIData);
            machine.bus.disconnectInputDevice( p + 0x04, this.inputMIDIStatus);
            machine.bus.disconnectInputDevice( p + 0x05, this.inputMIDIData);
        }
    };

    this.outputMIDIControl = function(val) {
        // Minimal MC6850 behavior for Philips Music Module detection routines.
        if ((val & 0x03) === 0x03) {
            midiStatus = 0;
            midiBusyReads = 0;
        } else
            midiStatus = 0x02;       // transmit data register empty
    };

    this.outputMIDIData = function() {
        midiStatus = 0;
        midiBusyReads = 1;
    };

    this.inputMIDIStatus = function() {
        if (midiBusyReads > 0) {
            --midiBusyReads;
            if (midiBusyReads === 0) midiStatus = 0x02;
            return 0;
        }
        return midiStatus;
    };

    this.inputMIDIData = function() {
        return 0xff;
    };

    this.nextSample = function() {
        ++clock;

        var amChanged = clockAM();
        var vibChanged = amChanged && clockVIB();
        var sample = 0, m, c, mPh, cPh, mod;

        if (chipEnabled) {
            var topMelodyChan = rhythmMode ? 5 : 8;

            for (var chan = topMelodyChan; chan >= 0; --chan) {
                m = chan << 1; c = m + 1;
                if (envStep[c] === IDLE) continue;

                if (amChanged) {
                    if (am[m]) updateAMAttenuationOp(m);
                    if (am[c]) updateAMAttenuationOp(c);
                    if (vibChanged) {
                        if (vib[m]) updateFrequencyOp(m);
                        if (vib[c]) updateFrequencyOp(c);
                    }
                }

                if (envStep[m] !== IDLE) clockEnvelope(m);
                clockEnvelope(c);

                mPh = (phaseCounter[m] += phaseInc[m]) >> 9;
                cPh = (phaseCounter[c] += phaseInc[c]) >> 9;

                if (fbShift[chan]) {
                    mPh += (fbLastMod1[chan] + fbLastMod2[chan]) >> fbShift[chan];
                    mod = expTable[sineTable[mPh & 1023] + totalAtt[m]];
                    fbLastMod2[chan] = fbLastMod1[chan] >> 1;
                    fbLastMod1[chan] = mod >> 1;
                } else
                    mod = expTable[sineTable[mPh & 1023] + totalAtt[m]];

                sample += alg[chan]
                    ? (mod + expTable[sineTable[cPh & 1023] + totalAtt[c]]) >> 4
                    : expTable[sineTable[(cPh + mod) & 1023] + totalAtt[c]] >> 4;
            }

            if (rhythmMode) {
                clockNoise();

                c = 13;     // Bass Drum
                if (envStep[c] !== IDLE) {
                    m = 12;
                    if (envStep[m] !== IDLE) clockEnvelope(m);
                    clockEnvelope(c);
                    mPh = ((phaseCounter[m] += phaseInc[m]) >> 9) - 1;
                    cPh = (phaseCounter[c] += phaseInc[c]) >> 9;
                    mod = expTable[sineTable[mPh & 1023] + totalAtt[m]];
                    sample += expTable[sineTable[(cPh + mod) & 1023] + totalAtt[c]] >> 3;
                }

                c = 15;     // Snare Drum
                if (envStep[c] !== IDLE) {
                    clockEnvelope(c);
                    cPh = (phaseCounter[c] += phaseInc[c]) >> 9;
                    sample += expTable[sineTable[cPh & 0x100 ? noiseOutput ? 0 : 130 : noiseOutput ? 0 : 1023 - 130] + totalAtt[c]] >> 3;
                }

                c = 16;     // Tom
                if (envStep[c] !== IDLE) {
                    clockEnvelope(c);
                    cPh = (phaseCounter[c] += phaseInc[c]) >> 9;
                    sample += expTable[sineTable[cPh & 1023] + totalAtt[c]] >> 3;
                }

                if (envStep[17] !== IDLE || envStep[14] !== IDLE) {
                    var ph14 = (phaseCounter[14] += phaseInc[14]) >> 9;
                    var ph17 = (phaseCounter[17] += phaseInc[17]) >> 9;
                    var hhCymPh = (((ph17 & 0x4) !== 0) && ((ph17 & 0x10) === 0)) !==
                                    ((((ph14 & 0x02) !== 0) !== ((ph14 & 0x100) !== 0)) || ((ph14 & 0x04) !== 0));

                    c = 17;     // Cymbal
                    if (envStep[c] !== IDLE) {
                        clockEnvelope(c);
                        sample += expTable[sineTable[hhCymPh ? 200 : 1023 - 200] + totalAtt[c]] >> 3;
                    }

                    c = 14;     // HiHat
                    if (envStep[c] !== IDLE) {
                        clockEnvelope(c);
                        sample += expTable[sineTable[hhCymPh ? noiseOutput ? 40 : 10 : noiseOutput ? 1023 - 40 : 1023 - 10] + totalAtt[c]] >> 3;
                    }
                }
            }

            sample += calcADPCMSample() + dac13Output;
        }

        if (dacEnabled) sample += dacOutput;
        return sample;
    };

    function readRegister(reg) {
        reg &= 0xff;
        switch (reg) {
            case 0x0f:
            case 0x1a:
                return readSampleData();
            case 0x19:
                return ((register[0x19] & register[0x18]) | (0x08 & ~register[0x18]) | 0xf0) & 0xff;
            default:
                return register[reg] || 0;
        }
    }

    function writeRegister(reg, val) {
        reg &= 0xff;
        val &= 0xff;

        if (reg === 0x04 && (val & 0x80)) {
            resetStatus(0x78);
            updateIRQ();
            resetADPCMStatus();
            return;
        }

        register[reg] = val;

        switch (reg) {
            case 0x02:
            case 0x03:
                break;
            case 0x04:
                changeStatusMask((~val) & 0x78);
                timer1Active = (val & 0x01) !== 0;
                timer2Active = (val & 0x02) !== 0;
                timer1Counter = register[0x02];
                timer2Counter = register[0x03];
                timer1BUSCycleCounter = timer2BUSCycleCounter = 0;
                lastTimerBUSCycle = cpu && cpu.getBUSCycles ? cpu.getBUSCycles() : 0;
                resetADPCMStatus();
                break;
            case 0x07:
                resetADPCMStatus();
                setupADPCMPlayback();
                setupSampleAddress();
                break;
            case 0x08:
                if (!(val & 0x04)) dac13Output = 0;
                setupSampleAddress();
                break;
            case 0x09:
            case 0x0a:
            case 0x0b:
            case 0x0c:
                setupSampleAddress();
                break;
            case 0x0f:
            case 0x1a:
                writeSampleData(val);
                break;
            case 0x10:
            case 0x11:
            case 0x12:
                setupADPCMPlayback();
                break;
            case 0x15:
                updateDAC13();
                break;
            case 0x16:
                register[reg] = val & 0xc0;
                break;
            case 0x17:
                register[reg] = val & 0x07;
                break;
            case 0x18:
            case 0x19:
                updatePeriphery();
                break;
            default:
                updateFMRegister(reg, val);
        }
    }

    function updatePeriphery() {
        var actual = ((register[0x18] & register[0x19]) | (~register[0x18] & 0x08)) & 0x0f;
        chipEnabled = (actual & 0x08) !== 0;
        dacEnabled = (actual & 0x01) !== 0;
    }

    function updateDAC13() {
        if (register[0x08] & 0x04) {
            var tmp = ((register[0x15] << 24) >> 16) + register[0x16];
            tmp = (tmp * 4) >> (7 - register[0x17]);
            dac13Output = Math.max(-32768, Math.min(32767, tmp)) >> 8;
        }
    }

    function resetADPCMStatus() {
        pcmBusy = false;
        setStatus(STATUS_BUF_RDY);
        resetStatus(STATUS_PCM_BSY | STATUS_EOS);
    }

    function setupSampleAddress() {
        sampleStart = (((register[0x0a] << 8) | register[0x09]) << 2) & SAMPLE_RAM_MASK;
        sampleStop = ((((register[0x0c] << 8) | register[0x0b]) << 2) | 0x03) & SAMPLE_RAM_MASK;
        sampleAddress = sampleStart;
    }

    function writeSampleData(val) {
        sampleRam[sampleAddress] = val;
        advanceSampleAddress();
    }

    function readSampleData() {
        var val = sampleRam[sampleAddress];
        advanceSampleAddress();
        return val;
    }

    function advanceSampleAddress() {
        sampleAddress = (sampleAddress + 1) & SAMPLE_RAM_MASK;
        setStatus(STATUS_BUF_RDY);
        if (sampleAddress === ((sampleStop + 1) & SAMPLE_RAM_MASK)) setStatus(STATUS_EOS);
        updateIRQ();
    }

    function setupADPCMPlayback() {
        adpcmDelta = register[0x10] | (register[0x11] << 8);
        adpcmVolume = register[0x12] || 0xff;
        if (register[0x07] & 0x01) {
            register[0x07] = 0;
            resetADPCMPlayback();
        } else if (register[0x07] & 0x80) {
            setStatus(STATUS_PCM_BSY);
            adpcmMemPtr = sampleStart << 1;
            adpcmNowStep = (1 << ADPCM_STEP_BITS) - adpcmDelta;
            adpcmOut = adpcmOutput = adpcmNextLeveling = adpcmSampleStep = 0;
            adpcmDiff = ADPCM_DIFF_DEFAULT;
            adpcmData = 0;
        } else {
            resetStatus(STATUS_PCM_BSY);
        }
        updateIRQ();
    }

    function resetADPCMPlayback() {
        adpcmDelta = register[0x10] | (register[0x11] << 8);
        adpcmVolume = register[0x12] || 0xff;
        adpcmMemPtr = 0;
        adpcmNowStep = 0;
        adpcmOut = adpcmOutput = adpcmNextLeveling = adpcmSampleStep = 0;
        adpcmDiff = ADPCM_DIFF_DEFAULT;
        adpcmData = 0;
    }

    function calcADPCMSample() {
        if ((register[0x07] & 0xc0) !== 0x80 || (register[0x07] & 0x08)) return 0;

        adpcmNowStep += adpcmDelta;
        if (adpcmNowStep & ~ADPCM_STEP_MASK) {
            adpcmNowStep &= ADPCM_STEP_MASK;

            var val;
            if (!(adpcmMemPtr & 1)) {
                adpcmData = sampleRam[(adpcmMemPtr >> 1) & SAMPLE_RAM_MASK];
                val = adpcmData >> 4;
            } else
                val = adpcmData & 0x0f;

            var prevOut = adpcmOut;
            adpcmOut = Math.max(-32768, Math.min(32767, adpcmOut + ((adpcmDiff * ADPCM_F1[val]) / 8) | 0));
            adpcmDiff = Math.max(ADPCM_DIFF_MIN, Math.min(ADPCM_DIFF_MAX, ((adpcmDiff * ADPCM_F2[val]) / 64) | 0));

            var prevLeveling = adpcmNextLeveling;
            adpcmNextLeveling = ((prevOut + adpcmOut) / 2) | 0;
            var deltaLeveling = adpcmNextLeveling - prevLeveling;
            adpcmSampleStep = deltaLeveling * ((adpcmVolume * adpcmDelta) >> ADPCM_STEP_BITS);
            adpcmOutput = prevLeveling * adpcmVolume + deltaLeveling * ((adpcmVolume * adpcmNowStep) >> ADPCM_STEP_BITS);

            ++adpcmMemPtr;
            if ((adpcmMemPtr >> 1) > sampleStop) {
                setStatus(STATUS_EOS);
                if (register[0x07] & 0x10) {
                    adpcmMemPtr = sampleStart << 1;
                    adpcmNowStep = (1 << ADPCM_STEP_BITS) - adpcmDelta;
                } else {
                    register[0x07] = 0;
                    resetStatus(STATUS_PCM_BSY);
                }
                updateIRQ();
            }
        } else
            adpcmOutput += adpcmSampleStep;

        return adpcmOutput >> 16;
    }

    function resetFM() {
        clock = 0;
        noiseRegister = 0xffff; noiseOutput = 0;
        amLevel = 0; amLevelInc = -1; vibPhase = 0;
        rhythmMode = false; amMode = false; vibMode = false;

        wmsx.Util.arrayFill(keyOn, 0);
        wmsx.Util.arrayFill(am, 0);
        wmsx.Util.arrayFill(vib, 0);
        wmsx.Util.arrayFill(envType, 0);
        wmsx.Util.arrayFill(ksr, 0);
        wmsx.Util.arrayFill(multi, 2);
        wmsx.Util.arrayFill(ksl, 0);
        wmsx.Util.arrayFill(tl, 63);
        wmsx.Util.arrayFill(ar, 0);
        wmsx.Util.arrayFill(dr, 0);
        wmsx.Util.arrayFill(sl, 15);
        wmsx.Util.arrayFill(rr, 0);
        wmsx.Util.arrayFill(fNum, 0);
        wmsx.Util.arrayFill(block, 0);

        wmsx.Util.arrayFill(alg, 0);
        wmsx.Util.arrayFill(fbShift, 0);
        wmsx.Util.arrayFill(amAtt, 0);
        wmsx.Util.arrayFill(envAtt, 4096);
        wmsx.Util.arrayFill(kslAtt, 0);
        wmsx.Util.arrayFill(tlAtt, 2016);
        wmsx.Util.arrayFill(totalAtt, 4096);
        wmsx.Util.arrayFill(envStep, IDLE);
        wmsx.Util.arrayFill(envStepLevelDur, 0);
        wmsx.Util.arrayFill(envStepLevelIncClock, 0);
        wmsx.Util.arrayFill(envStepLevelInc, 0);
        wmsx.Util.arrayFill(envStepNext, IDLE);
        wmsx.Util.arrayFill(envStepNextAtLevel, 255);
        wmsx.Util.arrayFill(envLevel, 128);
        wmsx.Util.arrayFill(ksrOffset, 0);
        wmsx.Util.arrayFill(fbLastMod1, 0);
        wmsx.Util.arrayFill(fbLastMod2, 0);
        wmsx.Util.arrayFill(phaseInc, 0);
        wmsx.Util.arrayFill(phaseCounter, 0);
    }

    function updateFMRegister(reg, val) {
        var group = reg & 0xe0;
        var slot = SLOT_MAP[reg & 0x1f];
        var chan = reg & 0x0f;

        switch (group) {
            case 0x20:
                if (slot >= 0) {
                    am[slot] = (val >> 7) & 1;
                    vib[slot] = (val >> 6) & 1;
                    envType[slot] = (val >> 5) & 1;
                    ksr[slot] = (val >> 4) & 1;
                    multi[slot] = multiFactors[val & 0x0f];
                    updateFrequencyOp(slot);
                }
                break;
            case 0x40:
                if (slot >= 0) {
                    ksl[slot] = (val >> 6) & 3;
                    tl[slot] = val & 0x3f;
                    updateKSLAttenuationOp(slot);
                    updateTLAttenuationOp(slot);
                }
                break;
            case 0x60:
                if (slot >= 0) {
                    ar[slot] = val >> 4;
                    dr[slot] = val & 0x0f;
                    updateEnvStepDurOp(slot);
                }
                break;
            case 0x80:
                if (slot >= 0) {
                    sl[slot] = val >> 4;
                    rr[slot] = val & 0x0f;
                    updateEnvStepDurOp(slot);
                }
                break;
            case 0xa0:
                if (reg === 0xbd) {
                    amMode = (val & 0x80) !== 0;
                    vibMode = (val & 0x40) !== 0;
                    setRhythmMode((val & 0x20) !== 0);
                    if (rhythmMode) {
                        setKeyOnOp(12, (val & 0x10) >> 4); setKeyOnOp(13, (val & 0x10) >> 4);
                        setKeyOnOp(15, (val & 0x08) >> 3);
                        setKeyOnOp(16, (val & 0x04) >> 2);
                        setKeyOnOp(17, (val & 0x02) >> 1);
                        setKeyOnOp(14, val & 0x01);
                    }
                } else if (chan < 9) {
                    if (reg & 0x10) {
                        setKeyOn(chan, (val & 0x20) >> 5);
                        setFrequency(chan, register[0xa0 + chan] | ((val & 0x1f) << 8));
                    } else
                        setFrequency(chan, val | ((register[0xb0 + chan] & 0x1f) << 8));
                }
                break;
            case 0xc0:
                if (reg <= 0xc8) {
                    chan = reg - 0xc0;
                    fbShift[chan] = (val & 0x0e) ? 8 - ((val >> 1) & 7) : 0;
                    alg[chan] = val & 1;
                }
                break;
        }
    }

    function setFrequency(chan, freq) {
        var m = chan << 1, c = m + 1;
        fNum[m] = fNum[c] = freq & 0x3ff;
        block[m] = block[c] = (freq >> 10) & 0x07;
        updateFrequency(chan);
    }

    function setKeyOn(chan, on) {
        var m = chan << 1, c = m + 1;
        setKeyOnOp(m, on);
        setKeyOnOp(c, on);
    }

    function setKeyOnOp(op, on) {
        if (keyOn[op] === on) return;
        keyOn[op] = on;
        if (on) {
            if (envStep[op] === IDLE) envLevel[op] = 128;
            setEnvStepOp(op, ATTACK);
        }
        else if (envStep[op] !== IDLE) setEnvStepOp(op, RELEASE);
    }

    function setRhythmMode(on) {
        if (rhythmMode === on) return;
        rhythmMode = on;
        if (!rhythmMode) {
            setKeyOnOp(12, 0); setKeyOnOp(13, 0);
            setKeyOnOp(14, 0); setKeyOnOp(15, 0);
            setKeyOnOp(16, 0); setKeyOnOp(17, 0);
        }
    }

    function clockNoise() {
        noiseRegister >>= 1;
        noiseOutput = noiseRegister & 1;
        if (noiseOutput) noiseRegister ^= 0x8003020;
    }

    function clockAM() {
        if (clock & 511) return false;
        if (amLevel === 0 || amLevel === 26) amLevelInc = -amLevelInc;
        amLevel += amLevelInc;
        return true;
    }

    function clockVIB() {
        if (clock & 1023) return false;
        vibPhase = (clock >> 10) & 0x07;
        return true;
    }

    function clockEnvelope(op) {
        if (envLevel[op] === envStepNextAtLevel[op]) {
            setEnvStepOp(op, envStepNext[op]);
        } else if (envStepLevelDur[op] && clock >= envStepLevelIncClock[op]) {
            do {
                envStepLevelIncClock[op] += envStepLevelDur[op];
            } while (clock >= envStepLevelIncClock[op]);
            envLevel[op] += envStepLevelInc[op];
            if (envStepLevelInc[op] < 0 && envLevel[op] < envStepNextAtLevel[op]) envLevel[op] = envStepNextAtLevel[op];
            else if (envStepLevelInc[op] > 0 && envLevel[op] > envStepNextAtLevel[op]) envLevel[op] = envStepNextAtLevel[op];
            updateEnvAttenuationOp(op);
        }
    }

    function setEnvStepOp(op, step) {
        envStep[op] = step;
        switch (step) {
            case ATTACK:
                envStepLevelDur[op] = rateAttackDurTable[(ar[op] << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = -8;
                envStepNextAtLevel[op] = 0;
                envStepNext[op] = DECAY;
                phaseCounter[op] = 0;
                if (envLevel[op] > 127) envLevel[op] = 127;
                if (ar[op] === 0) {
                    envLevel[op] = 128;
                    setEnvStepOp(op, IDLE);
                } else if (envStepLevelDur[op] === 0) {
                    envLevel[op] = 0;
                    setEnvStepOp(op, DECAY);
                }
                break;
            case DECAY:
                envStepLevelDur[op] = rateDecayDurTable[(dr[op] << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = 1;
                envStepNextAtLevel[op] = Math.min(127, sl[op] << 3);
                envStepNext[op] = SUSTAIN;
                if (dr[op] === 0) {
                    envStepLevelDur[op] = envStepLevelIncClock[op] = 0;
                    envStepNextAtLevel[op] = 255;
                    envStepNext[op] = DECAY;
                }
                break;
            case SUSTAIN:
                if (envType[op]) {
                    envStepLevelDur[op] = envStepLevelIncClock[op] = 0;
                    envStepLevelInc[op] = 0;
                    envStepNextAtLevel[op] = 255;
                    envStepNext[op] = SUSTAIN;
                } else {
                    envStepLevelDur[op] = rateDecayDurTable[(rr[op] << 2) + ksrOffset[op]];
                    envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                    envStepLevelInc[op] = 1;
                    envStepNextAtLevel[op] = 128;
                    envStepNext[op] = IDLE;
                }
                break;
            case RELEASE:
                envStepLevelDur[op] = rateDecayDurTable[(rr[op] << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = 1;
                envStepNextAtLevel[op] = 128;
                envStepNext[op] = IDLE;
                if (rr[op] === 0) {
                    envStepLevelDur[op] = envStepLevelIncClock[op] = 0;
                    envStepNextAtLevel[op] = 255;
                    envStepNext[op] = RELEASE;
                }
                break;
            case IDLE:
            default:
                envLevel[op] = 128;
                envStepLevelDur[op] = envStepLevelIncClock[op] = 0;
                envStepLevelInc[op] = 0;
                envStepNextAtLevel[op] = 255;
                envStepNext[op] = IDLE;
                break;
        }
        updateEnvAttenuationOp(op);
    }

    function updateEnvStepDurOp(op) {
        if (envStep[op] !== IDLE) setEnvStepOp(op, envStep[op]);
    }

    function updateFrequency(chan) {
        updateFrequencyOp(chan << 1);
        updateFrequencyOp((chan << 1) + 1);
    }

    function updateFrequencyOp(op) {
        var vibVal = (vibMode && vib[op]) ? VIB_VALUES[fNum[op] >> 7][vibPhase] : 0;
        phaseInc[op] = (((fNum[op] + vibVal) * multi[op]) << block[op]) >> 2;
        updateKSLAttenuationOp(op);
        updateKSROffsetOp(op);
    }

    function updateKSROffsetOp(op) {
        ksrOffset[op] = (ksr[op] ? block[op] << 1 : block[op] >> 1) | (fNum[op] >>> (9 - ksr[op]));
    }

    function updateAMAttenuationOp(op) {
        amAtt[op] = am[op] ? (amMode ? amLevel : amLevel >> 2) << 4 : 0;
        updateTotalAttenuationOp(op);
    }

    function updateKSLAttenuationOp(op) {
        kslAtt[op] = kslValues[ksl[op]][block[op]][fNum[op] >>> 6] << 4;
        updateTotalAttenuationOp(op);
    }

    function updateTLAttenuationOp(op) {
        tlAtt[op] = tl[op] << 5;
        updateTotalAttenuationOp(op);
    }

    function updateEnvAttenuationOp(op) {
        envAtt[op] = (envLevel[op] === 128 ? 256 : envLevel[op]) << 4;
        updateTotalAttenuationOp(op);
    }

    function updateTotalAttenuationOp(op) {
        totalAtt[op] = Math.min(16383, amAtt[op] + kslAtt[op] + envAtt[op] + tlAtt[op]);
    }

    function clockTimers() {
        if (!cpu) return;
        var now = cpu.getBUSCycles ? cpu.getBUSCycles() : ++clock;
        var elapsed = now - lastTimerBUSCycle;
        if (elapsed <= 0) return;
        lastTimerBUSCycle = now;

        if (timer1Active) {
            timer1BUSCycleCounter += elapsed;
            while (timer1BUSCycleCounter >= TIMER1_BUS_CYCLES) {
                timer1BUSCycleCounter -= TIMER1_BUS_CYCLES;
                if (++timer1Counter > 255) {
                    timer1Counter = register[0x02];
                    setStatus(0x40);
                }
            }
        }
        if (timer2Active) {
            timer2BUSCycleCounter += elapsed;
            while (timer2BUSCycleCounter >= TIMER2_BUS_CYCLES) {
                timer2BUSCycleCounter -= TIMER2_BUS_CYCLES;
                if (++timer2Counter > 255) {
                    timer2Counter = register[0x03];
                    setStatus(0x20);
                }
            }
        }
        updateIRQ();
    }

    function updateIRQ() {
        if (cpu && cpu.setINTChannel) cpu.setINTChannel(4, (status & 0x80) === 0);
    }

    function setStatus(flags) {
        status |= flags;
        if (status & statusMask) status |= 0x80;
    }

    function resetStatus(flags) {
        status &= ~flags;
        if (!(status & statusMask)) status &= 0x7f;
    }

    function changeStatusMask(newMask) {
        statusMask = newMask;
        status &= 0x87 | statusMask;
        if (status & statusMask) status |= 0x80;
        else status &= 0x7f;
        updateIRQ();
    }

    function connectAudio() {
        if (audioSocket) {
            if (!audioSignal) audioSignal = new wmsx.AudioSignal(name, self, VOLUME, SAMPLE_RATE);
            audioSocket.connectAudioSignal(audioSignal);
            audioConnected = true;
        }
    }

    function disconnectAudio() {
        if (audioSocket && audioSignal) audioSocket.disconnectAudioSignal(audioSignal);
        audioConnected = false;
    }


    var name;

    var bus, cpu;
    var audioSocket, audioSignal;
    var audioConnected = false;

    var register = wmsx.Util.arrayFill(new Array(256), 0);
    var registerAddress = 0;
    var status = 0;
    var statusMask = 0;

    var timer1Counter = 0, timer2Counter = 0;
    var timer1Active = false, timer2Active = false;
    var timer1BUSCycleCounter = 0, timer2BUSCycleCounter = 0;
    var lastTimerBUSCycle = 0;

    var sampleRam;
    var sampleAddress = 0, sampleStart = 0, sampleStop = 0;
    var pcmBusy = false;

    var chipEnabled = true;
    var dacEnabled = false;
    var dacValue = 0x80;
    var dacOutput = 0;
    var dac13Output = 0;
    var midiStatus = 0;
    var midiBusyReads = 0;

    var clock = 0;
    var noiseRegister = 0xffff, noiseOutput = 0;
    var amLevel = 0, amLevelInc = -1, vibPhase = 0;
    var rhythmMode = false, amMode = false, vibMode = false;

    var keyOn = new Array(18);
    var am = new Array(18), vib = new Array(18), envType = new Array(18), ksr = new Array(18);
    var multi = new Array(18), ksl = new Array(18), tl = new Array(18);
    var ar = new Array(18), dr = new Array(18), sl = new Array(18), rr = new Array(18);
    var fNum = new Array(18), block = new Array(18);
    var alg = new Array(9), fbShift = new Array(9);
    var amAtt = new Array(18), envAtt = new Array(18), kslAtt = new Array(18), tlAtt = new Array(18), totalAtt = new Array(18);
    var envStep = new Array(18), envStepLevelDur = new Array(18), envStepLevelIncClock = new Array(18);
    var envStepLevelInc = new Array(18), envStepNext = new Array(18), envStepNextAtLevel = new Array(18), envLevel = new Array(18);
    var ksrOffset = new Array(18);
    var fbLastMod1 = new Array(9), fbLastMod2 = new Array(9);
    var phaseInc = new Array(18), phaseCounter = new Array(18);

    var adpcmDelta = 0, adpcmVolume = 0xff, adpcmMemPtr = 0, adpcmNowStep = 0;
    var adpcmOut = 0, adpcmOutput = 0, adpcmDiff = 0, adpcmNextLeveling = 0, adpcmSampleStep = 0, adpcmData = 0;

    var STATUS_BUF_RDY = 0x08;
    var STATUS_PCM_BSY = 0x01;
    var STATUS_EOS = 0x10;

    var SAMPLE_RAM_SIZE = 32 * 1024;
    var SAMPLE_RAM_MASK = SAMPLE_RAM_SIZE - 1;
    var TIMER1_BUS_CYCLES = 287;            // Y8950 timer 1 is about 80 us at MSX CPU clock
    var TIMER2_BUS_CYCLES = 1147;           // Y8950 timer 2 is about 320 us at MSX CPU clock
    var IDLE = 255, ATTACK = 1, DECAY = 2, SUSTAIN = 3, RELEASE = 4;
    var SLOT_MAP = [
         0,  2,  4,  1,  3,  5, -1, -1,
         6,  8, 10,  7,  9, 11, -1, -1,
        12, 14, 16, 13, 15, 17, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1
    ];
    var VIB_VALUES = [
        [ 0, 0, 0, 0, 0,  0,  0,  0 ],
        [ 0, 0, 1, 0, 0,  0, -1,  0 ],
        [ 0, 1, 2, 1, 0, -1, -2, -1 ],
        [ 0, 1, 3, 1, 0, -1, -3, -1 ],
        [ 0, 2, 4, 2, 0, -2, -4, -2 ],
        [ 0, 2, 5, 2, 0, -2, -5, -2 ],
        [ 0, 3, 6, 3, 0, -3, -6, -3 ],
        [ 0, 3, 7, 3, 0, -3, -7, -3 ]
    ];

    var ADPCM_F1 = [ 1, 3, 5, 7, 9, 11, 13, 15, -1, -3, -5, -7, -9, -11, -13, -15 ];
    var ADPCM_F2 = [ 57, 57, 57, 57, 77, 102, 128, 153, 57, 57, 57, 57, 77, 102, 128, 153 ];
    var ADPCM_DIFF_MAX = 0x6000, ADPCM_DIFF_MIN = 0x7f, ADPCM_DIFF_DEFAULT = 0x7f;
    var ADPCM_STEP_BITS = 16, ADPCM_STEP_MASK = (1 << ADPCM_STEP_BITS) - 1;

    var sineTable, expTable, multiFactors, kslValues, rateAttackDurTable, rateDecayDurTable;
    var VOLUME = 0.66 * (1.58 / 9 / 256);
    var SAMPLE_RATE = 49780;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            n: name,
            r: wmsx.Util.compressInt8BitArrayToStringBase64(register),
            ra: registerAddress,
            st: status,
            sm: statusMask,
            t1: timer1Counter,
            t2: timer2Counter,
            ta: timer1Active,
            tb: timer2Active,
            tc: timer1BUSCycleCounter,
            td: timer2BUSCycleCounter,
            lc: lastTimerBUSCycle,
            sr: wmsx.Util.compressInt8BitArrayToStringBase64(sampleRam),
            sa: sampleAddress,
            ss: sampleStart,
            sp: sampleStop,
            ce: chipEnabled,
            de: dacEnabled,
            dv: dacValue,
            dout: dacOutput,
            d13: dac13Output,
            ms: midiStatus,
            mb: midiBusyReads,
            c: clock,
            nr: noiseRegister,
            no: noiseOutput,
            al: amLevel,
            ai: amLevelInc,
            vp: vibPhase,
            rm: rhythmMode,
            am: amMode,
            vm: vibMode,
            ko: wmsx.Util.storeInt8BitArrayToStringBase64(keyOn),
            at: wmsx.Util.storeInt16BitArrayToStringBase64(amAtt),
            et: wmsx.Util.storeInt16BitArrayToStringBase64(envAtt),
            kt: wmsx.Util.storeInt16BitArrayToStringBase64(kslAtt),
            tt: wmsx.Util.storeInt16BitArrayToStringBase64(tlAtt),
            ota: wmsx.Util.storeInt16BitArrayToStringBase64(totalAtt),
            es: wmsx.Util.storeInt8BitArrayToStringBase64(envStep),
            ed: wmsx.Util.storeInt32BitArrayToStringBase64(envStepLevelDur),
            ec: envStepLevelIncClock,
            ei: wmsx.Util.storeInt8BitArrayToStringBase64(envStepLevelInc),
            en: wmsx.Util.storeInt8BitArrayToStringBase64(envStepNext),
            el: wmsx.Util.storeInt8BitArrayToStringBase64(envStepNextAtLevel),
            ee: wmsx.Util.storeInt8BitArrayToStringBase64(envLevel),
            ks: wmsx.Util.storeInt8BitArrayToStringBase64(ksrOffset),
            fb1: wmsx.Util.storeInt16BitArrayToStringBase64(fbLastMod1),
            fb2: wmsx.Util.storeInt16BitArrayToStringBase64(fbLastMod2),
            pc: wmsx.Util.storeInt32BitArrayToStringBase64(phaseCounter),
            ad: adpcmDelta,
            av: adpcmVolume,
            ap: adpcmMemPtr,
            aw: adpcmNowStep,
            ao: adpcmOut,
            ax: adpcmOutput,
            af: adpcmDiff,
            an: adpcmNextLeveling,
            ai2: adpcmSampleStep,
            ab: adpcmData,
            ac: audioConnected
        };
    };

    this.loadState = function(s) {
        name = s.n;
        register = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.r, register);
        registerAddress = s.ra;
        status = s.st;
        statusMask = s.sm;
        timer1Counter = s.t1;
        timer2Counter = s.t2;
        timer1Active = !!s.ta;
        timer2Active = !!s.tb;
        timer1BUSCycleCounter = s.tc || 0;
        timer2BUSCycleCounter = s.td || 0;
        lastTimerBUSCycle = s.lc || 0;
        sampleRam = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.sr, sampleRam);
        sampleAddress = s.sa;
        sampleStart = s.ss;
        sampleStop = s.sp;
        chipEnabled = !!s.ce;
        dacEnabled = !!s.de;
        dacValue = s.dv;
        dacOutput = s.dout || ((dacValue - 0x80) << 1);
        dac13Output = s.d13 || 0;
        midiStatus = s.ms || 0;
        midiBusyReads = s.mb || 0;
        audioConnected = !!s.ac;

        resetFM();
        for (var r = 0; r < register.length; ++r) updateFMRegister(r, register[r]);
        clock = s.c || 0;
        noiseRegister = s.nr || 0xffff; noiseOutput = s.no || 0;
        amLevel = s.al || 0; amLevelInc = s.ai || -1; vibPhase = s.vp || 0;
        rhythmMode = !!s.rm; amMode = !!s.am; vibMode = !!s.vm;
        keyOn = s.ko ? wmsx.Util.restoreStringBase64ToInt8BitArray(s.ko, keyOn) : keyOn;
        amAtt = s.at ? wmsx.Util.restoreStringBase64ToInt16BitArray(s.at, amAtt) : amAtt;
        envAtt = s.et ? wmsx.Util.restoreStringBase64ToInt16BitArray(s.et, envAtt) : envAtt;
        kslAtt = s.kt ? wmsx.Util.restoreStringBase64ToInt16BitArray(s.kt, kslAtt) : kslAtt;
        tlAtt = s.tt ? wmsx.Util.restoreStringBase64ToInt16BitArray(s.tt, tlAtt) : tlAtt;
        totalAtt = s.ota ? wmsx.Util.restoreStringBase64ToInt16BitArray(s.ota, totalAtt) : totalAtt;
        envStep = s.es ? wmsx.Util.restoreStringBase64ToInt8BitArray(s.es, envStep) : envStep;
        envStepLevelDur = s.ed ? wmsx.Util.restoreStringBase64ToInt32BitArray(s.ed) : envStepLevelDur;
        envStepLevelIncClock = s.ec || envStepLevelIncClock;
        envStepLevelInc = s.ei ? wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.ei, envStepLevelInc) : envStepLevelInc;
        envStepNext = s.en ? wmsx.Util.restoreStringBase64ToInt8BitArray(s.en, envStepNext) : envStepNext;
        envStepNextAtLevel = s.el ? wmsx.Util.restoreStringBase64ToInt8BitArray(s.el, envStepNextAtLevel) : envStepNextAtLevel;
        envLevel = s.ee ? wmsx.Util.restoreStringBase64ToInt8BitArray(s.ee, envLevel) : envLevel;
        ksrOffset = s.ks ? wmsx.Util.restoreStringBase64ToInt8BitArray(s.ks, ksrOffset) : ksrOffset;
        fbLastMod1 = s.fb1 ? wmsx.Util.restoreStringBase64ToSignedInt16BitArray(s.fb1, fbLastMod1) : fbLastMod1;
        fbLastMod2 = s.fb2 ? wmsx.Util.restoreStringBase64ToSignedInt16BitArray(s.fb2, fbLastMod2) : fbLastMod2;
        phaseCounter = s.pc ? wmsx.Util.restoreStringBase64ToInt32BitArray(s.pc) : phaseCounter;
        adpcmDelta = s.ad || 0;
        adpcmVolume = s.av || 0xff;
        adpcmMemPtr = s.ap || 0;
        adpcmNowStep = s.aw || 0;
        adpcmOut = s.ao || 0;
        adpcmOutput = s.ax || 0;
        adpcmDiff = s.af || ADPCM_DIFF_DEFAULT;
        adpcmNextLeveling = s.an || 0;
        adpcmSampleStep = s.ai2 || 0;
        adpcmData = s.ab || 0;
        if (audioConnected) connectAudio();
    };


    init();

    this.eval = function(str) {
        return eval(str);
    };

};
