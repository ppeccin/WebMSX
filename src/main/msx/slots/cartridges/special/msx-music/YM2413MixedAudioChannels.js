// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.YM2413MixedAudioChannels = function() {
    var self = this;

    function init() {
        FM = self;
        var tabs = new wmsx.YM2413Tables();
        sineTable = tabs.createSineTable();
        expTable =  tabs.createExpTable();
        rateDurTable = tabs.createRateDurationTable();
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
        var mod = register[registerAddress] ^ val;
        register[registerAddress] = val;

        switch(registerAddress) {
            case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x07:
                INSTRUMENT_ROM[0][registerAddress] = val;
                updateCustomInstrChannels();
                break;
            case 0x0e:
                rhythmMode = (val & 0x20) !== 0;
                self.rhythmMode = rhythmMode;
                break;
            case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17: case 0x18:
                if (mod) {
                    fNum[chan] = (fNum[chan] & ~0xff) | val;
                    updateFrequency(chan);
                }
                break;
            case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27: case 0x28:
                if (mod & 0x20) setSustain(chan, (val & 0x20) !== 0);
                if (mod & 0x10) setKeyOn(chan, (val & 0x10) !== 0);
                if (mod & 0x01) fNum[chan]  = (fNum[chan] & ~0x100) | ((val & 1) << 8);
                if (mod & 0x0e) block[chan] = (val >> 1) & 0x7;
                if (mod & 0x0f) updateFrequency(chan);
                break;
            case 0x30: case 0x31: case 0x32: case 0x33: case 0x34: case 0x35: case 0x36: case 0x37: case 0x38:
                if (mod & 0x0f) setVolume(chan, val & 0xf);
                if (mod & 0xf0) setInstr(chan, val >>> 4);
                break;
        }
    };

    this.reset = function() {
        for (var i = 0; i < 9; ++i) {
            setVolume(i, 15);
            setEnvStep(i, 0);
            updateAllAttenuations(i);
        }
    };

    this.nextSample = function() {
        ++clock;

        var sample = 0;
        var toChan = rhythmMode ? 6 : 9;
        for (var chan = 0; chan < toChan; chan++) {
            var c = chan << 1, m = c + 1;

            // Update ADSR steps
            tickADSR(c);
            tickADSR(m);

            // Update operators phase
            var cPh = (phaseCounter[c] += phaseInc[c]) >> 9;      // 0..1023
            var mPh = (phaseCounter[m] += phaseInc[m]) >> 9;

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
            envStepCounter[op] = envStepDur[op];
            var level = envLevel[op] += envStepLevelInc[op];
            if (level === envStepLevelNext[op])
                setEnvStepOp(op, envStepNext[op]);
            else {
                updateEnvAttenuationOp(op);
            }
        }
    }

    function setSustain(chan, on) {
        sustain[chan] = on;
    }

    function setKeyOn(chan, on) {
        var c = chan << 1, m = c + 1;
        keyOn[chan] = on;
        // Define ADSR phase
        if (on) {
            setEnvStep(chan, 1);                          // Attack
            // Reset and synch C/M phase counters
            phaseCounter[c] = 0;
            phaseCounter[m] = 0 - phaseInc[m];            // Modulator phase is 1 behind carrier
        } else {
            if (envStep[c] > 0) setEnvStepOp(c, 4);       // Release
            if (envStep[m] > 0) setEnvStepOp(m, 4);       // Release
        }
    }

    function setEnvStep(chan, step) {
        var c = chan << 1, m = c + 1;
        setEnvStepOp(c, step);
        setEnvStepOp(m, step);
    }

    function setEnvStepOp(op, step) {
        envStep[op] = step;
        switch (step) {
            case 0:                     // Muted
                envLevel[op] = 127;
                envStepCounter[op] = envStepDur[op] = MAX_INT;
                envStepLevelInc[op] = 0;
                envStepLevelNext[op] = 0;
                envStepNext[op] = 0;
                break;
            case 1:                     // Attack
                //envStepCounter[op] = envStepDur[op] = rateDurTable[((ar[op] << 2) + ksrOffset[op]) & 63];
                // Top attack speed for now rateDurTable[ar[op] << 2];
                envStepCounter[op] = envStepDur[op] = 0;
                envLevel[op] = 0;
                envStepLevelInc[op] = -1;
                envStepLevelNext[op] = -1;
                envStepNext[op] = 2;
                break;
            case 2:                     // Decay
                envStepCounter[op] = envStepDur[op] = rateDurTable[((dr[op] << 2) + ksrOffset[op]) & 63];
                envStepLevelInc[op] = 1;
                envStepLevelNext[op] = sl[op] << 3;
                envStepNext[op] = envType[op] ? 3 : 4;      // Sustained Envelope?
                break;
            case 3:                     // Sustain
                envStepCounter[op] = envStepDur[op] = MAX_INT;
                envStepLevelInc[op] = 0;
                envStepLevelNext[op] = -1;
                envStepNext[op] = 3;
                break;
            case 4:                     // Release
                envStepCounter[op] = envStepDur[op] = sustain[op >> 1]
                    ? rateDurTable[((5 << 2) + ksrOffset[op]) & 63]
                    : rateDurTable[((rr[op] << 2) + ksrOffset[op]) & 63];
                envStepLevelInc[op] = 1;
                envStepLevelNext[op] = 128;
                envStepNext[op] = 0;
                break;
        }
        updateEnvAttenuationOp(op);
    }

    function setInstr(chan, ins) {
        instr[chan] = ins;

        // Copy parameters
        var c = chan << 1, m = c + 1;
        var pars = INSTRUMENT_ROM[ins];
        envType[c] = (pars[0] >> 5) & 1;
        envType[m] = (pars[1] >> 5) & 1;
        ksr[c] =     (pars[0] >> 4) & 1;
        ksr[m] =     (pars[1] >> 4) & 1;
        multi[c] =   MULTI_FACTORS[pars[0] & 0xf];
        multi[m] =   MULTI_FACTORS[pars[1] & 0xf];
        ksl[c] =     pars[2] >>> 6;
        ksl[m] =     pars[3] >>> 6;
        modTL[chan]   = pars[2] & 0x3f;
        ar[c] =      pars[4] >>> 4;
        dr[c] =      pars[4] & 0xf;
        ar[m] =      pars[5] >>> 4;
        dr[m] =      pars[5] & 0xf;
        sl[c] =      pars[6] >>> 4;
        rr[c] =      pars[6] & 0xf;
        sl[m] =      pars[7] >>> 4;
        rr[m] =      pars[7] & 0xf;

        updateFrequency(chan);
        updateModAttenuation(chan);
    }

    function updateCustomInstrChannels() {
        for (var c = 0; c < 9; c++)
            if (instr[c] === 0) setInstr(c, 0);
    }

    function setVolume(chan, val) {
        volume[chan] = val;
        updateVolumeAttenuation(chan);
    }

    function updateFrequency(chan) {
        var c = chan << 1, m = c + 1;
        phaseInc[c] = ((fNum[chan] * multi[chan << 1]) >> 1) << block[chan];          // Take back the MULTI doubling in the table (>> 1)
        phaseInc[m] = ((fNum[chan] * multi[m]) >> 1) << block[chan];
        updateKSLAttenuation(chan);
        updateKSROffset(chan);
    }

    function updateKSROffset(chan) {
        var c = chan << 1, m = c + 1;
        ksrOffset[c] = (ksl[c] ? block[chan] << 1 : block[chan] >> 1) | (fNum[chan] >>> (9 - ksl[c]));
        ksrOffset[m] = (ksl[m] ? block[chan] << 1 : block[chan] >> 1) | (fNum[chan] >>> (9 - ksl[m]));
    }

    function updateKSLAttenuation(chan) {
        var c = chan << 1, m = c + 1;
        kslAtt[c] = KSL_VALUES[ksl[c]][block[chan]][fNum[chan] >>> 5] << 4;
        kslAtt[m] = KSL_VALUES[ksl[m]][block[chan]][fNum[chan] >>> 5] << 4;
        updateTotalAttenuation(chan);
    }

    function updateEnvAttenuation(chan) {
        var c = chan << 1, m = c + 1;
        envAtt[c] = envLevel[c] << 4;
        envAtt[m] = envLevel[m] << 4;
        updateTotalAttenuation(chan);
    }

    function updateEnvAttenuationOp(op) {
        envAtt[op] = envLevel[op] << 4;
        updateTotalAttenuationOp(op);
    }

    function updateModAttenuation(chan) {
        var m = (chan << 1) + 1;
        volModAtt[m] = modTL[chan] << 5;
        updateTotalAttenuationOp(m);
    }

    function updateVolumeAttenuation(chan) {
        var c = chan << 1;
        volModAtt[c] = volume[chan] << 7;
        updateTotalAttenuationOp(c);
    }

    function updateTotalAttenuation(chan) {
        var c = chan << 1, m = c + 1;
        totalAtt[c] = kslAtt[c] + envAtt[c] + amAtt[c] + volModAtt[c];
        totalAtt[m] = kslAtt[m] + envAtt[m] + amAtt[m] + volModAtt[m];
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

    // Tables

    var sineTable, expTable, rateDurTable;

    var audioSocket, audioSignal;

    this.VOLUME = 0.60;
    this.SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 72;       // Main CPU clock / 72 = 49780hz


    init();

    var MAX_INT = 9007199254740991;

    var INSTRUMENT_ROM = [
        [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],              // 0 = Custom
        [ 0x61, 0x61, 0x1e, 0x17, 0xf0, 0x7f, 0x00, 0x17 ],              // 1 = Violin
        [ 0x13, 0x41, 0x16, 0x0e, 0xfd, 0xf4, 0x23, 0x23 ],              // 2 = Guitar
        [ 0x03, 0x01, 0x9a, 0x04, 0xf3, 0xf3, 0x13, 0xf3 ],              // 3 = Piano
        [ 0x11, 0x61, 0x0e, 0x07, 0xfa, 0x64, 0x70, 0x17 ],              // 4 = Flute
        [ 0x22, 0x21, 0x1e, 0x06, 0xf0, 0x76, 0x00, 0x28 ],              // 5 = Clarinet
        [ 0x21, 0x22, 0x16, 0x05, 0xf0, 0x71, 0x00, 0x18 ],              // 6 = Oboe
        [ 0x21, 0x61, 0x1d, 0x07, 0x82, 0x80, 0x17, 0x17 ],              // 7 = Trumpet
        [ 0x23, 0x21, 0x2d, 0x16, 0x90, 0x90, 0x00, 0x07 ],              // 8 = Organ
        [ 0x21, 0x21, 0x1b, 0x06, 0x64, 0x65, 0x10, 0x17 ],              // 9 = Horn
        [ 0x21, 0x21, 0x0b, 0x1a, 0x85, 0xa0, 0x70, 0x07 ],              // A = Synthesizer
        [ 0x23, 0x01, 0x83, 0x10, 0xff, 0xb4, 0x10, 0xf4 ],              // B = Harpsichord
        [ 0x97, 0xc1, 0x20, 0x07, 0xff, 0xf4, 0x22, 0x22 ],              // C = Vibraphone
        [ 0x61, 0x00, 0x0c, 0x05, 0xc2, 0xf6, 0x40, 0x44 ],              // D = Synthesizer Bass
        [ 0x01, 0x01, 0x56, 0x03, 0x94, 0xc2, 0x03, 0x12 ],              // E = Wood Bass
        [ 0x21, 0x01, 0x89, 0x03, 0xf1, 0xe4, 0xf0, 0x23 ]               // F = Electric Guitar
    ];

    var MULTI_FACTORS = [
     // 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15           // Original values
        1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30        // Double values
    ];

    var KSL_VALUES = [      //  [ KSL ] [ BLOCK ] [ FNUM (4 higher bits) ]
        [
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ]
        ], [
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  2,  2,  3,  3,  4 ],
            [ 0,  0,  0,  0,  0,  1,  2,  3,  4,  5,  5,  6,  6,  7,  7,  8 ],
            [ 0,  0,  0,  2,  4,  5,  6,  7,  8,  9,  9, 10, 10, 11, 11, 12 ],
            [ 0,  0,  4,  6,  8,  9, 10, 11, 12, 13, 13, 14, 14, 15, 15, 16 ],
            [ 0,  4,  8, 10, 12, 13, 14, 15, 16, 17, 17, 18, 18, 19, 19, 20 ],
            [ 0,  8, 12, 14, 16, 17, 18, 19, 20, 21, 21, 22, 22, 23, 23, 24 ],
            [ 0, 12, 16, 18, 20, 21, 22, 23, 24, 25, 25, 26, 26, 27, 27, 28 ]
        ], [
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  3,  4,  5,  6,  7,  8 ],
            [ 0,  0,  0,  0,  0,  3,  5,  7,  8, 10, 11, 12, 13, 14, 15, 16 ],
            [ 0,  0,  0,  5,  8, 11, 13, 15, 16, 18, 19, 20, 21, 22, 23, 24 ],
            [ 0,  0,  8, 13, 16, 19, 21, 23, 24, 26, 27, 28, 29, 30, 31, 32 ],
            [ 0,  8, 16, 21, 24, 27, 29, 31, 32, 34, 35, 36, 37, 38, 39, 40 ],
            [ 0, 16, 24, 29, 32, 35, 37, 39, 40, 42, 43, 44, 45, 46, 47, 48 ],
            [ 0, 24, 32, 37, 40, 43, 45, 47, 48, 50, 51, 52, 53, 54, 55, 56 ]
        ], [
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  6,  8, 10, 12, 14, 16 ],
            [ 0,  0,  0,  0,  0,  6, 10, 14, 16, 20, 22, 24, 26, 28, 30, 32 ],
            [ 0,  0,  0, 10, 16, 22, 26, 30, 32, 36, 38, 40, 42, 44, 46, 48 ],
            [ 0,  0, 16, 26, 32, 38, 42, 46, 48, 52, 54, 56, 58, 60, 62, 64 ],
            [ 0, 16, 32, 42, 48, 54, 58, 62, 64, 68, 70, 72, 74, 76, 78, 80 ],
            [ 0, 32, 48, 58, 64, 70, 74, 78, 80, 84, 86, 88, 90, 92, 94, 96 ],
            [ 0, 48, 64, 74, 80, 86, 90, 94, 96,100,102,104,106,108,110,112 ]
        ]
    ];


    this.eval = function(str) {
        return eval(str);
    };

};

