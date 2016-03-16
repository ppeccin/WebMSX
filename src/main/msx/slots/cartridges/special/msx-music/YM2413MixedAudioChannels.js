// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.YM2413MixedAudioChannels = function() {
    var self = this;

    function init() {
        FM = self;
        var tabs = new wmsx.YM2413Tables();
        sineTable = tabs.getFullSineTable();
        halfSineTable = tabs.getHalfSineTable();
        expTable =  tabs.getExpTable();
        instrumentsParameters = tabs.getInstrumentsROM();
        multiFactors = tabs.getMultiFactorsDoubled();
        vibValues = tabs.getVIBValues();
        kslValues = tabs.getKSLValues();
        rateAttackDurTable = tabs.getRateAttackDurations();
        rateDecayDurTable = tabs.getRateDecayDurations();

        self.instrumentsParameters = instrumentsParameters;
    }

    this.connect = function(machine) {
        machine.bus.connectOutputDevice(0x7c, this.output7C);
        machine.bus.connectOutputDevice(0x7d, this.output7D);
        machine.bus.connectInputDevice(0x7c, this.inputNotAvailable);
        machine.bus.connectInputDevice(0x7d, this.inputNotAvailable);
        audioSocket = machine.getAudioSocket();
    };

    this.disconnect = function(machine) {
        if (machine.bus.getOutputDevice(0x7c) === this.output7C) machine.bus.disconnectInputDevice(0x7c);
        if (machine.bus.getOutputDevice(0x7d) === this.output7D) machine.bus.disconnectInputDevice(0x7d);
    };

    // Port not available for INPUT
    this.inputNotAvailable = function() {
        return 0xff;
    };

    this.output7C = function (val) {
        registerAddress = val & 0x3f;
    };

    this.output7D = function (val) {
        registerWrite(registerAddress, val);
    };

    this.reset = function() {
        clock = 0;
        amLevel = 0; amLevelInc = -1;   // Starting condition
        vibPhase = 0;
        for (var chan = 0; chan < 9; ++chan) {
            setEnvStep(chan, IDLE);
            updateAllAttenuations(chan);
        }
        for (var reg = 0; reg < 0x39; ++reg)
            registerWrite(reg, 0);
    };

    this.nextSample = function() {
        var amChanged, vibChanged = false;

        ++clock;
        amChanged = clockAM();
        if (amChanged) vibChanged = clockVIB();

        var sample = 0;
        var toChan = rhythmMode ? 6 : 9;
        for (var chan = 0; chan < toChan; chan++) {
            var m = chan << 1, c = m + 1;
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

            // Update operators phase
            var mPh = (phaseCounter[m] += phaseInc[m]) >> 9;
            var cPh = (phaseCounter[c] += phaseInc[c]) >> 9;      // 0..1023

            // Modulator and Feedback
            var fb = (fbLastMod1[chan] + fbLastMod2[chan]) >>> fbShift[chan];
            var mod = expTable[(halfWave[m] ? halfSineTable : sineTable)[(mPh - 1 + fb) & 1023] + totalAtt[m]];
            fbLastMod2[chan] = fbLastMod1[chan];
            fbLastMod1[chan] = mod >> 1;

            // Modulated Carrier, final sample value
            var val = expTable[(halfWave[c] ? halfSineTable : sineTable)[(cPh + mod) & 1023] + totalAtt[c]] >> 4;

            sample += val;
        }

        return sample / (8 * 256);      // Roughly 9 * 255 but more integer
    };

    this.connectAudio = function() {
        if (!audioSignal) audioSignal = new wmsx.AudioSignal("MSX-MUSIC", this, this.SAMPLE_RATE, this.VOLUME);
        audioSignal.signalOn();
        audioSocket.connectAudioSignal(audioSignal);
    };

    this.disconnectAudio = function() {
        if (audioSignal) {
            audioSignal.signalOff();
            audioSocket.disconnectAudioSignal(audioSignal);
        }
    };

    function registerWrite(reg, val) {
        var chan = reg & 0xf;
        if (chan === 9) chan = 0;                       // Regs 19h, 29h, 39h are the same as 10h, 20h, 30h
        var m = chan << 1, c = m + 1;

        var mod = register[reg] ^ val;
        register[reg] = val;

        switch(reg) {
            case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x07:
                instrumentsParameters[0][reg] = val;
                updateCustomInstrChannels();
                break;
            case 0x0e:
                rhythmMode = (val & 0x20) !== 0;
                self.rhythmMode = rhythmMode;
                break;
            case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17: case 0x18: case 0x19:
                if (mod) {
                    fNum[m] = (fNum[m] & ~0xff) | val;
                    fNum[c] = fNum[m];
                    updateFrequency(chan);
                }
                break;
            case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27: case 0x28: case 0x29:
                if (mod & 0x20) setSustain(chan, (val & 0x20) !== 0);
                if (mod & 0x10) setKeyOn(chan, (val & 0x10) !== 0);
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
            case 0x30: case 0x31: case 0x32: case 0x33: case 0x34: case 0x35: case 0x36: case 0x37: case 0x38: case 0x39:
                if (mod & 0x0f) setVolume(chan, val & 0xf);
                if (mod & 0xf0) setInstr(chan, val >>> 4);
                break;
        }
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
            if (envStepLevelIncClock[op] === clock) {
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
        keyOn[chan] = on;
        // Define ADSR phase
        if (on) {
            setEnvStep(chan, DAMP);
        } else {
            // Modulator is not affected by KEY-OFF!   if (envStep[m] > 0) setEnvStepOp(m, RELEASE);
            if (envStep[c] > 0) setEnvStepOp(c, RELEASE);
        }
    }

    function  setEnvStep(chan, step) {
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
                envStepNextAtLevel[op] = 127;
                envStepNext[op] = ATTACK;
                break;
            case ATTACK:
                envStepLevelDur[op] = rateAttackDurTable[(ar[op] << 2) + ksrOffset[op]];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = -1;
                envStepNextAtLevel[op] = 0;
                envStepNext[op] = DECAY;
                // Reset phase counter ?
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
                    envStepLevelIncClock[op] = envStepLevelDur[op] = -1;
                    envStepLevelInc[op] = 0;
                    envStepNextAtLevel[op] = null;
                    envStepNext[op] = null;
                } else {
                    // Percussive tone
                    envStepLevelDur[op] = rateDecayDurTable[(rr[op] << 2) + ksrOffset[op]];
                    envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                    envStepLevelInc[op] = 1;
                    envStepNextAtLevel[op] = 127;
                    envStepNext[op] = IDLE;
                }
                break;
            case RELEASE:
                var rate = envType[op]
                    ? sustain[op >> 1] ? 5 : rr[op]     // Sustained tone
                    : sustain[op >> 1] ? 5 : 7;         // Percussive tone
                envStepLevelDur[op] = rateDecayDurTable[((rate << 2) + ksrOffset[op]) & 63];
                envStepLevelIncClock[op] = clock + envStepLevelDur[op];
                envStepLevelInc[op] = 1;
                envStepNextAtLevel[op] = 127;
                envStepNext[op] = IDLE;
                break;
            case IDLE:
            default:
                envLevel[op] = 127;
                envStepLevelIncClock[op] = envStepLevelDur[op] = -1;
                envStepLevelInc[op] = 0;
                envStepNextAtLevel[op] = null;
                envStepNext[op] = null;
                break;
        }
    }

    function setInstr(chan, ins) {
        instr[chan] = ins;

        // Copy parameters
        var m = chan << 1, c = m + 1;
        var pars = instrumentsParameters[ins];
        am[m] =         (pars[0] >> 7) & 1;
        am[c] =         (pars[0] >> 7) & 1;
        vib[m] =        (pars[0] >> 6) & 1;
        vib[c] =        (pars[0] >> 6) & 1;
        envType[m] =    (pars[0] >> 5) & 1;
        envType[c] =    (pars[1] >> 5) & 1;
        ksr[m] =        (pars[0] >> 4) & 1;
        ksr[c] =        (pars[1] >> 4) & 1;
        multi[m] =      multiFactors[pars[0] & 0xf];
        multi[c] =      multiFactors[pars[1] & 0xf];
        ksl[m] =        pars[2] >>> 6;
        ksl[c] =        pars[3] >>> 6;
        modTL[chan] =   pars[2] & 0x3f;
        halfWave[m] =   (pars[3] >> 3) & 1;
        halfWave[c] =   (pars[3] >> 4) & 1;
        fbShift[chan] = (pars[3] & 0x7) ? 8 - (pars[3] & 0x7) : 31;   // Maximum shift value to discard all bits when FB = off
        ar[m] =         pars[4] >>> 4;
        dr[m] =         pars[4] & 0xf;
        ar[c] =         pars[5] >>> 4;
        dr[c] =         pars[5] & 0xf;
        sl[m] =         pars[6] >>> 4;
        rr[m] =         pars[6] & 0xf;
        sl[c] =         pars[7] >>> 4;
        rr[c] =         pars[7] & 0xf;

        updateAMAttenuation(chan);
        updateFrequency(chan);
        updateModAttenuation(chan);

        //console.log("Custom Instr updated for channel: " + chan);
    }

    function updateCustomInstrChannels() {
        for (var chan = 0; chan < 9; chan++)
            if (instr[chan] === 0) setInstr(chan, 0);
    }

    function setVolume(chan, val) {
        volume[chan] = val;
        updateVolumeAttenuation(chan);
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
        amAtt[op] = am[op] ? amLevel << 4 : 0;
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
        envAtt[m] = envLevel[m] << 4;
        envAtt[c] = envLevel[c] << 4;
        updateTotalAttenuation(chan);
    }

    function updateEnvAttenuationOp(op) {
        envAtt[op] = envLevel[op] << 4;
        updateTotalAttenuationOp(op);
    }

    function updateModAttenuation(chan) {
        var m = chan << 1;
        volModAtt[m] = modTL[chan] << 5;
        updateTotalAttenuationOp(m);
    }

    function updateVolumeAttenuation(chan) {
        var c = (chan << 1) + 1;
        volModAtt[c] = volume[chan] << 7;
        updateTotalAttenuationOp(c);
    }

    function updateTotalAttenuation(chan) {
        var m = chan << 1, c = m + 1;
        totalAtt[m] = amAtt[m] + kslAtt[m] + envAtt[m] + volModAtt[m];
        totalAtt[c] = amAtt[c] + kslAtt[c] + envAtt[c] + volModAtt[c];
    }

    function updateTotalAttenuationOp(op) {
        totalAtt[op] = amAtt[op] + kslAtt[op] + envAtt[op] + volModAtt[op];
    }

    function updateAllAttenuations(chan) {
        updateKSLAttenuation(chan);
        updateEnvAttenuation(chan);
        updateModAttenuation(chan);
        updateVolumeAttenuation(chan);
    }


    // Constants

    var IDLE = -1, DAMP = 0, ATTACK = 1, DECAY = 2, SUSTAIN = 3, RELEASE = 4;       // Envelope steps
    var MAX_INT = 9007199254740991;

    // Global controls

    var clock;
    var registerAddress;
    var register = wmsx.Util.arrayFill(new Array(0x38), 0);
    var rhythmMode;
    var amLevel, amLevelInc;
    var vibPhase;

    // Settings per channel
    var keyOn =   wmsx.Util.arrayFill(new Array(9), false);
    var sustain = wmsx.Util.arrayFill(new Array(9), false);
    var instr =   wmsx.Util.arrayFill(new Array(9), 0);
    var volume =  wmsx.Util.arrayFill(new Array(9), 0);
    var modTL =   wmsx.Util.arrayFill(new Array(9), 0);

    // Settings per operator
    var am =       wmsx.Util.arrayFill(new Array(18), 0);
    var vib =      wmsx.Util.arrayFill(new Array(18), 0);
    var envType =  wmsx.Util.arrayFill(new Array(18), 0);
    var ksr =      wmsx.Util.arrayFill(new Array(18), 0);
    var multi =    wmsx.Util.arrayFill(new Array(18), 0);
    var ksl =      wmsx.Util.arrayFill(new Array(18), 0);
    var halfWave = wmsx.Util.arrayFill(new Array(18), 0);
    var ar =       wmsx.Util.arrayFill(new Array(18), 0);
    var dr =       wmsx.Util.arrayFill(new Array(18), 0);
    var sl =       wmsx.Util.arrayFill(new Array(18), 0);
    var rr =       wmsx.Util.arrayFill(new Array(18), 0);
    var fNum  =    wmsx.Util.arrayFill(new Array(18), 0);     // Actually per channel, but kept per operator
    var block =    wmsx.Util.arrayFill(new Array(18), 0);     // Actually per channel, but kept per operator

    // Computed values per channel

    var fbShift =    wmsx.Util.arrayFill(new Array(9), 0);
    var fbLastMod1 = wmsx.Util.arrayFill(new Array(9), 0);
    var fbLastMod2 = wmsx.Util.arrayFill(new Array(9), 0);

    // Computed values per operator

    var amAtt =     wmsx.Util.arrayFill(new Array(18), 0);
    var kslAtt =    wmsx.Util.arrayFill(new Array(18), 0);
    var envAtt =    wmsx.Util.arrayFill(new Array(18), 0);
    var volModAtt = wmsx.Util.arrayFill(new Array(18), 0);       // For Volume or ModTL
    var totalAtt =  wmsx.Util.arrayFill(new Array(18), 0);

    var envStep =              wmsx.Util.arrayFill(new Array(18), 0);
    var envStepLevelDur =      wmsx.Util.arrayFill(new Array(18), 0);
    var envStepLevelIncClock = wmsx.Util.arrayFill(new Array(18), 0);
    var envStepLevelInc =      wmsx.Util.arrayFill(new Array(18), 0);
    var envStepNext =          wmsx.Util.arrayFill(new Array(18), 0);
    var envStepNextAtLevel =   wmsx.Util.arrayFill(new Array(18), 0);
    var envLevel =             wmsx.Util.arrayFill(new Array(18), 0);

    var ksrOffset =    wmsx.Util.arrayFill(new Array(18), 0);

    var phaseInc =     wmsx.Util.arrayFill(new Array(18), 0);
    var phaseCounter = wmsx.Util.arrayFill(new Array(18), 0);


    // Debug vars

    this.rhythmMode = rhythmMode;

    this.keyOn = keyOn;
    this.sustain = sustain;
    this.fNum = fNum;
    this.block = block;
    this.instr = instr;
    this.volume = volume;
    this.modTL = modTL;

    this.am = am;
    this.vib = vib;
    this.envType = envType;
    this.ksr = ksr;
    this.multi = multi;
    this.ksl = ksl;
    this.halfWave = halfWave;
    this.ar = ar;
    this.dr = dr;
    this.sl = sl;
    this.rr = rr;
    this.ksrOffset = ksrOffset;

    this.kslAtt = kslAtt;
    this.fbShift = fbShift;
    this.envAtt = envAtt;
    this.amAtt = amAtt;
    this.volModAtt = volModAtt;
    this.totalAtt = totalAtt;

    this.envStep = envStep;
    this.envStepLevelDur = envStepLevelDur;
    this.envStepLevelIncClock = envStepLevelIncClock;
    this.envStepNext = envStepNext;
    this.envStepNextAtLevel = envStepNextAtLevel;
    this.envStepLevelInc = envStepLevelInc;
    this.envLevel = envLevel;

    this.phaseInc = phaseInc;
    this.phaseCounter = phaseCounter;

    // Pre calculated tables, factors, values

    var sineTable, halfSineTable, expTable, instrumentsParameters, multiFactors, vibValues, kslValues, rateAttackDurTable, rateDecayDurTable;

    var audioSocket, audioSignal;

    this.VOLUME = 0.60;
    this.SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 72;                 // Main CPU clock / 72 = 49780hz


    init();


    this.eval = function(str) {
        return eval(str);
    };

};
