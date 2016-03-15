// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.YM2413MixedAudioChannels = function() {
    var self = this;

    function init() {
        FM = self;
        var tabs = new wmsx.YM2413Tables();
        sineTable = tabs.getSineTable();
        expTable =  tabs.getExpTable();
        instrumentsParameters = tabs.getInstrumentsROM();
        multiFactors = tabs.getMultiFactorsDoubled();
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
        for (var chan = 0; chan < 9; ++chan) {
            setEnvStep(chan, IDLE);
            updateAllAttenuations(chan);
        }
        for (var reg = 0; reg < 0x39; ++reg)
            registerWrite(reg, 0);
    };

    this.nextSample = function() {
        ++clock;

        var sample = 0;
        var toChan = rhythmMode ? 6 : 9;
        for (var chan = 0; chan < toChan; chan++) {
            var m = chan << 1, c = m + 1;
            if (envStep[c] === IDLE) continue;

            // Update ADSR envelopes
            updateEnvelope(m);
            updateEnvelope(c);

            // Update operators phase
            var mPh = (phaseCounter[m] += phaseInc[m]) >> 9;
            var cPh = (phaseCounter[c] += phaseInc[c]) >> 9;      // 0..1023

            // Modulator and Feedback
            var fb = (fbLastMod1[chan] + fbLastMod2[chan]) >>> fbShift[chan];
            var mod = expTable[sineTable[(mPh + fb) & 1023] + totalAtt[m]];
            fbLastMod2[chan] = fbLastMod1[chan];
            fbLastMod1[chan] = mod >> 1;

            // Modulated Carrier, final sample value
            var val = expTable[sineTable[(cPh + mod) & 1023] + totalAtt[c]] >> 4;

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
                    fNum[chan] = (fNum[chan] & ~0xff) | val;
                    updateFrequency(chan);
                }
                break;
            case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27: case 0x28: case 0x29:
                if (mod & 0x20) setSustain(chan, (val & 0x20) !== 0);
                if (mod & 0x10) setKeyOn(chan, (val & 0x10) !== 0);
                if (mod & 0x01) fNum[chan]  = (fNum[chan] & ~0x100) | ((val & 1) << 8);
                if (mod & 0x0e) block[chan] = (val >> 1) & 0x7;
                if (mod & 0x0f) updateFrequency(chan);
                break;
            case 0x30: case 0x31: case 0x32: case 0x33: case 0x34: case 0x35: case 0x36: case 0x37: case 0x38: case 0x39:
                if (mod & 0x0f) setVolume(chan, val & 0xf);
                if (mod & 0xf0) setInstr(chan, val >>> 4);
                break;
        }
    }

    function updateEnvelope(op) {
        if (envStep[op] === IDLE) return;       // No need to bother if operator is IDLE

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
            // Reset and synch M/C phase counters
            //phaseCounter[m] = 0 - phaseInc[m];            // TODO Modulator phase is 1 behind carrier
            //phaseCounter[c] = 0;
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
        envType[m] = (pars[0] >> 5) & 1;
        envType[c] = (pars[1] >> 5) & 1;
        ksr[m] =     (pars[0] >> 4) & 1;
        ksr[c] =     (pars[1] >> 4) & 1;
        multi[m] =   multiFactors[pars[0] & 0xf];
        multi[c] =   multiFactors[pars[1] & 0xf];
        ksl[m] =     pars[2] >>> 6;
        ksl[c] =     pars[3] >>> 6;
        modTL[chan]   = pars[2] & 0x3f;
        fbShift[chan] = (pars[3] & 0x07) ? 8 - (pars[3] & 0x07) : 31;   // Maximum shift value to discard all bits when FB = off
        ar[m] =      pars[4] >>> 4;
        dr[m] =      pars[4] & 0xf;
        ar[c] =      pars[5] >>> 4;
        dr[c] =      pars[5] & 0xf;
        sl[m] =      pars[6] >>> 4;
        rr[m] =      pars[6] & 0xf;
        sl[c] =      pars[7] >>> 4;
        rr[c] =      pars[7] & 0xf;

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
        phaseInc[m] = ((fNum[chan] * multi[m]) >> 1) << block[chan];
        phaseInc[c] = ((fNum[chan] * multi[c]) >> 1) << block[chan];          // Take back the MULTI doubling in the table (>> 1)
        updateKSLAttenuation(chan);
        updateKSROffset(chan);
    }

    function updateKSROffset(chan) {
        var m = chan << 1, c = m + 1;
        ksrOffset[m] = (ksr[m] ? block[chan] << 1 : block[chan] >> 1) | (fNum[chan] >>> (9 - ksr[m]));
        ksrOffset[c] = (ksr[c] ? block[chan] << 1 : block[chan] >> 1) | (fNum[chan] >>> (9 - ksr[c]));
    }

    function updateKSLAttenuation(chan) {
        var m = chan << 1, c = m + 1;
        kslAtt[m] = kslValues[ksl[m]][block[chan]][fNum[chan] >>> 5] << 4;
        kslAtt[c] = kslValues[ksl[c]][block[chan]][fNum[chan] >>> 5] << 4;
        updateTotalAttenuation(chan);
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
        totalAtt[m] = kslAtt[m] + envAtt[m] + amAtt[m] + volModAtt[m];
        totalAtt[c] = kslAtt[c] + envAtt[c] + amAtt[c] + volModAtt[c];
    }

    function updateTotalAttenuationOp(op) {
        totalAtt[op] = kslAtt[op] + envAtt[op] + amAtt[op] + volModAtt[op];
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
    var rhythmMode;
    var registerAddress;
    var register = wmsx.Util.arrayFill(new Array(0x38), 0);

    // Settings per channel
    var keyOn =   wmsx.Util.arrayFill(new Array(9), false);
    var sustain = wmsx.Util.arrayFill(new Array(9), false);
    var fNum  =   wmsx.Util.arrayFill(new Array(9), 0);
    var block =   wmsx.Util.arrayFill(new Array(9), 0);
    var instr =   wmsx.Util.arrayFill(new Array(9), 0);
    var volume =  wmsx.Util.arrayFill(new Array(9), 0);
    var modTL =   wmsx.Util.arrayFill(new Array(9), 0);

    // Settings per operator
    var envType = wmsx.Util.arrayFill(new Array(18), 0);
    var ksr =     wmsx.Util.arrayFill(new Array(18), 0);
    var multi =   wmsx.Util.arrayFill(new Array(18), 0);
    var ksl =     wmsx.Util.arrayFill(new Array(18), 0);
    var ar =      wmsx.Util.arrayFill(new Array(18), 0);
    var dr =      wmsx.Util.arrayFill(new Array(18), 0);
    var sl =      wmsx.Util.arrayFill(new Array(18), 0);
    var rr =      wmsx.Util.arrayFill(new Array(18), 0);

    // Computed values per channel

    var fbShift =    wmsx.Util.arrayFill(new Array(9), 0);
    var fbLastMod1 = wmsx.Util.arrayFill(new Array(9), 0);
    var fbLastMod2 = wmsx.Util.arrayFill(new Array(9), 0);

    // Computed values per operator

    var kslAtt =    wmsx.Util.arrayFill(new Array(18), 0);
    var envAtt =    wmsx.Util.arrayFill(new Array(18), 0);
    var amAtt =     wmsx.Util.arrayFill(new Array(18), 0);
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

    this.envType = envType;
    this.ksr = ksr;
    this.multi = multi;
    this.ksl = ksl;
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

    var sineTable, expTable, instrumentsParameters, multiFactors, kslValues, rateAttackDurTable, rateDecayDurTable;

    var audioSocket, audioSignal;

    this.VOLUME = 0.60;
    this.SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 72;                 // Main CPU clock / 72 = 49780hz


    init();


    this.eval = function(str) {
        return eval(str);
    };

};

