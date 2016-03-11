// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.YM2413MixedAudioChannels = function() {
    var self = this;

    function init() {
        FM = self;
        var tabs = new wmsx.YM2413Tables();
        sineTable = tabs.createSineTable();
        expTable =  tabs.createExpTable();
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
                if (mod & 0x01) fNum[chan]  = (fNum[chan] & ~0x100) | ((val & 1) << 8);
                if (mod & 0x0e) block[chan] = (val >> 1) & 0x7;
                if (mod & 0x0f) updateFrequency(chan);
                if (mod & 0x10) setKeyOn(chan, (val & 0x10) !== 0);
                break;
            case 0x30: case 0x31: case 0x32: case 0x33: case 0x34: case 0x35: case 0x36: case 0x37: case 0x38:
                if (mod & 0x0f) volume[chan] = val & 0xf;
                if (mod & 0xf0) setInstr(chan, val >>> 4);
                break;
        }
    };

    this.nextSample = function() {
        var sample = 0;
        var toChan = rhythmMode ? 6 : 9;
        for (var chan = 0; chan < toChan; chan++) {
            if (!keyOn[chan]) continue;
            var c = chan << 1, m = c + 1;

            var cC = (phaseCounter[c] += phaseInc[c]);
            var cPh = cC >> 9;
            var mC = (phaseCounter[m] += phaseInc[m]);
            var mPh = mC >> 9;

            var mod = expTable[sineTable[mPh & 1023] + (modTL[c] << 5) + (kslValue[m] << 4)];
            var val = expTable[sineTable[(cPh + mod) & 1023] + (volume[chan] << 7) + (kslValue[c] << 4)] >> 4;

            sample += val;
        }

        return sample / (8 * 256);      // Roughly 9 * 255 but more integer
    };

    this.connectAudio = function() {
        if (!audioSignal) audioSignal = new wmsx.AudioSignal("MSX-MUSIC", this, SAMPLE_RATE, VOLUME);
        audioSignal.signalOn();
        audioSocket.connectAudioSignal(audioSignal);
    };

    this.disconnectAudio = function() {
        if (audioSignal) {
            audioSignal.signalOff();
            audioSocket.disconnectAudioSignal(audioSignal);
        }
    };

    function setKeyOn(chan, boo) {
        if (keyOn[chan] !== boo) {
            phaseCounter[chan << 1] = 0;
            phaseCounter[(chan << 1) + 1] = 0 ; // -1;     // Modulator phase is 1 behind carrier
        }
        keyOn[chan] = boo;
    }

    function setInstr(chan, ins) {
        instr[chan] = ins;

        // Copy parameters
        var c = chan << 1, m = c + 1;
        var pars = INSTRUMENT_ROM[ins];
        multi[c] = MULTI_FACTORS[pars[0] & 0xf];
        multi[m] = MULTI_FACTORS[pars[1] & 0xf];
        ksl[c] =   pars[2] >>> 6;
        ksl[m] =   pars[3] >>> 6;
        modTL[c] = pars[2] & 0x3f;

        updateFrequency(chan);
    }

    function updateCustomInstrChannels() {
        for (var c = 0; c < 9; c++)
            if (instr[c] === 0) setInstr(c, 0);
    }

    var updateFrequency = function (chan) {
        var c = chan << 1, m = c + 1;
        kslValue[c] = KSL_VALUES[ksl[c]][block[chan]][fNum[chan] >>> 5];
        kslValue[m] = KSL_VALUES[ksl[m]][block[chan]][fNum[chan] >>> 5];
        phaseInc[c] = ((fNum[chan] * multi[chan << 1]) >> 1) << block[chan];          // Take back the MULTI doubling in the table (>> 1)
        phaseInc[m] = ((fNum[chan] * multi[m]) >> 1) << block[chan];
    };


    var registerAddress;
    var register = wmsx.Util.arrayFill(new Array(0x38), 0);

    var rhythmMode = false;

    // Per channel settings
    var keyOn =  wmsx.Util.arrayFill(new Array(9), false);
    var fNum  =  wmsx.Util.arrayFill(new Array(9), 0);
    var block =  wmsx.Util.arrayFill(new Array(9), 0);
    var instr =  wmsx.Util.arrayFill(new Array(9), 0);
    var volume = wmsx.Util.arrayFill(new Array(9), 0xf);

    // Per operator settings
    var multi =        wmsx.Util.arrayFill(new Array(18), 0);
    var ksl =          wmsx.Util.arrayFill(new Array(18), 0);
    var modTL =        wmsx.Util.arrayFill(new Array(18), 0);

    // Per operator ready values

    var kslValue =     wmsx.Util.arrayFill(new Array(18), 0);
    var phaseInc =     wmsx.Util.arrayFill(new Array(18), 0);
    var phaseCounter = wmsx.Util.arrayFill(new Array(18), 0);


    // Debug vars

    this.rhythmMode = rhythmMode;

    this.keyOn = keyOn;
    this.fNum = fNum;
    this.block = block;
    this.instr = instr;
    this.volume = volume;

    this.multi = multi;
    this.ksl = ksl;
    this.modTL = modTL;

    this.kslValue = kslValue;
    this.phaseInc = phaseInc;
    this.phaseCounter = phaseCounter;

    // Tables

    var sineTable, expTable;

    var audioSocket, audioSignal;

    var VOLUME = 0.60;
    var SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 72;       // Main CPU clock / 72 = 49780hz


    init();


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

