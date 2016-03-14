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
        rateDecayDurTable = tabs.getRateDecayDurations();
    }

    this.connect = function(machine) {
        machine.bus.connectOutputDevice(0x7c, this.output7C);
        machine.bus.connectOutputDevice(0x7d, this.output7D);
        audioSocket = machine.getAudioSocket();
    };

    this.disconnect = function(machine) {
        if (machine.bus.getOutputDevice(0x7c) === this.output7C) machine.bus.disconnectInputDevice(0x7c);
        if (machine.bus.getOutputDevice(0x7d) === this.output7D) machine.bus.disconnectInputDevice(0x7d);
    };

    this.output7C = function (val) {
        registerAddress = val & 0x3f;
    };

    this.output7D = function (val) {
        var chan = registerAddress & 0xf;
        if (chan === 9) chan = 0;
        var mod = register[registerAddress] ^ val;
        register[registerAddress] = val;

        switch(registerAddress) {
            case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x07:
                instrumentsParameters[0][registerAddress] = val;
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
    };

    this.reset = function() {
        for (var chan = 0; chan < 9; ++chan) {
            setVolume(chan, 15);
            setEnvStep(chan, 0);
            updateAllAttenuations(chan);
        }
    };

    this.nextSample = function() {
        ++clock;

        var sample = 0;
        var toChan = rhythmMode ? 6 : 9;
        for (var chan = 0; chan < toChan; chan++) {
            var m = chan << 1, c = m + 1;

            // Update ADSR steps
            tickADSR(m);
            tickADSR(c);

            // Update operators phase
            var mPh = (phaseCounter[m] += phaseInc[m]) >> 9;
            var cPh = (phaseCounter[c] += phaseInc[c]) >> 9;      // 0..1023

            // Compute mixed sample
            var mod = expTable[sineTable[mPh & 1023] + totalAtt[m]];
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

    function tickADSR(op) {
        if (--envStepCounter[op] < 0) {
            if (envLevel[op] === envStepLevelNext[op])
                setEnvStepOp(op, envStepNext[op]);
            else {
                envStepCounter[op] = envStepDur[op];
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
            setEnvStep(chan, ATTACK);
            // Reset and synch M/C phase counters
            phaseCounter[m] = 0;    // - phaseInc[m];            // TODO Modulator phase is 1 behind carrier
            phaseCounter[c] = 0;
        } else {
            if (envStep[m] > 0) setEnvStepOp(m, RELEASE);
            if (envStep[c] > 0) setEnvStepOp(c, RELEASE);
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
            case IDLE:
                envLevel[op] = 127;
                envStepCounter[op] = envStepDur[op] = MAX_INT;
                envStepLevelInc[op] = 0;
                envStepLevelNext[op] = null;
                envStepNext[op] = IDLE;
                break;
            case ATTACK:
                envStepCounter[op] = envStepDur[op] = 0; // rateDecayDurTable[((ar[op] << 2) + ksrOffset[op]) & 63];
                envLevel[op] = 0;         // TODO DAMP step
                envStepLevelInc[op] = -1;
                envStepLevelNext[op] = 0;
                envStepNext[op] = DECAY;
                break;
            case DECAY:
                envStepCounter[op] = envStepDur[op] = rateDecayDurTable[((dr[op] << 2) + ksrOffset[op]) & 63];
                envStepLevelInc[op] = 1;
                envStepLevelNext[op] = sl[op] << 3;
                envStepNext[op] = SUSTAIN;
                break;
            case SUSTAIN:
                if (envType[op]) {
                    // Sustained tone
                    envStepCounter[op] = envStepDur[op] = MAX_INT;
                    envStepLevelInc[op] = 0;
                    envStepLevelNext[op] = null;
                    envStepNext[op] = SUSTAIN;
                } else {
                    // Percussive tone
                    envStepCounter[op] = envStepDur[op] = rateDecayDurTable[((rr[op] << 2) + ksrOffset[op]) & 63];
                    envStepLevelInc[op] = 1;
                    envStepLevelNext[op] = 127;
                    envStepNext[op] = IDLE;
                }
                break;
            case RELEASE:
                var rate = envType[op]
                    ? sustain[op >> 1] ? 5 : rr[op]     // Sustained tone
                    : sustain[op >> 1] ? 5 : 7;         // Percussive tone
                envStepCounter[op] = envStepDur[op] = rateDecayDurTable[((rate << 2) + ksrOffset[op]) & 63];
                envStepLevelInc[op] = 1;
                envStepLevelNext[op] = 127;
                envStepNext[op] = IDLE;
                break;
        }
        updateEnvAttenuationOp(op);
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
        ksrOffset[m] = (ksl[m] ? block[chan] << 1 : block[chan] >> 1) | (fNum[chan] >>> (9 - ksl[m]));
        ksrOffset[c] = (ksl[c] ? block[chan] << 1 : block[chan] >> 1) | (fNum[chan] >>> (9 - ksl[c]));
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

    var registerAddress;
    var register = wmsx.Util.arrayFill(new Array(0x38), 0);

    // Global controls

    var clock = 0;
    var rhythmMode = false;

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

    // Computed values per operator

    var kslAtt =    wmsx.Util.arrayFill(new Array(18), 0);
    var envAtt =    wmsx.Util.arrayFill(new Array(18), 0);
    var amAtt =     wmsx.Util.arrayFill(new Array(18), 0);
    var volModAtt = wmsx.Util.arrayFill(new Array(18), 0);       // For Volume or ModTL
    var totalAtt =  wmsx.Util.arrayFill(new Array(18), 0);

    var envStep =          wmsx.Util.arrayFill(new Array(18), 0);
    var envStepDur =       wmsx.Util.arrayFill(new Array(18), 0);
    var envStepCounter =   wmsx.Util.arrayFill(new Array(18), 0);
    var envStepNext =      wmsx.Util.arrayFill(new Array(18), 0);
    var envStepLevelInc =  wmsx.Util.arrayFill(new Array(18), 0);
    var envStepLevelNext = wmsx.Util.arrayFill(new Array(18), 0);
    var envLevel =         wmsx.Util.arrayFill(new Array(18), 0);

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

    this.kslAtt = kslAtt;
    this.envAtt = envAtt;
    this.amAtt = amAtt;
    this.volModAtt = volModAtt;
    this.totalAtt = totalAtt;

    this.envStep = envStep;
    this.envStepDur = envStepDur;
    this.envStepCounter = envStepCounter;
    this.envStepNext = envStepNext;
    this.envStepLevelInc = envStepLevelInc;
    this.envLevel = envLevel;

    this.phaseInc = phaseInc;
    this.phaseCounter = phaseCounter;


    // Pre calculated tables, factors, values

    var sineTable, expTable, instrumentsParameters, multiFactors, kslValues, rateDecayDurTable;

    var audioSocket, audioSignal;


    var IDLE = 0, ATTACK = 1, DECAY = 2, SUSTAIN = 3, RELEASE = 4;       // Envelope steps

    var MAX_INT = 9007199254740991;

    this.VOLUME = 0.60;
    this.SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 72;                 // Main CPU clock / 72 = 49780hz


    init();


    this.eval = function(str) {
        return eval(str);
    };

};

