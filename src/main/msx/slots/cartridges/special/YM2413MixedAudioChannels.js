// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.YM2413MixedAudioChannels = function() {
    var self = this;

    function init() {
        FM = self;
    }

    this.connectAudioSocket = function(pAudioSocket) {
        audioSocket = pAudioSocket;
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
                this.rhythmMode = rhythmMode;
                break;
            case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17: case 0x18:
                if (mod) {
                    fNum[chan] = (fNum[chan] & ~0xff) | val;
                    updatePhaseInc(chan);
                }
                break;
            case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27: case 0x28:
                if (mod & 0x01) fNum[chan]  = (fNum[chan] & ~0x100) | ((val & 1) << 8);
                if (mod & 0x0e) block[chan] = (val >> 1) & 0x7;
                if (mod & 0x0f) updatePhaseInc(chan);
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

            var mod = getExp(getSin(mPh) + (modTL[c] << 5));
            var val = getExp(getSin(cPh + (mod << 4)) + (volume[chan] << 7));

            sample += val;
        }

        //if (sample) console.log(sample);

        return sample / (8 * 256);
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
            phaseCounter[(chan << 1) + 1] = 0;
        }
        keyOn[chan] = boo;
    }

    function setInstr(chan, ins) {
        instr[chan] = ins;

        // Copy parameters
        var c = chan << 1, m = c + 1;
        multi[c] = MULTI_FACTORS[INSTRUMENT_ROM[ins][0] & 0xf];
        multi[m] = MULTI_FACTORS[INSTRUMENT_ROM[ins][1] & 0xf];
        modTL[c] = INSTRUMENT_ROM[ins][2] & 0x3f;

        updatePhaseInc(chan);
    }

    function updateCustomInstrChannels() {
        for (var c = 0; c < 9; c++)
            if (instr[c] === 0) setInstr(c, 0);
    }

    var updatePhaseInc = function (chan) {
        phaseInc[chan << 1] =       (fNum[chan] * multi[chan << 1]) >> 1 << block[chan];          // Take back the MULTI doubling in the table (>> 1)
        phaseInc[(chan << 1) + 1] = (fNum[chan] * multi[(chan << 1) + 1]) >> 1 << block[chan];
    };


    var registerAddress;
    var register = wmsx.Util.arrayFill(new Array(0x38), 0);

    var rhythmMode = false;

    // Per channel values
    var keyOn =  wmsx.Util.arrayFill(new Array(9), false);
    var fNum  =  wmsx.Util.arrayFill(new Array(9), 0);
    var block =  wmsx.Util.arrayFill(new Array(9), 0);
    var instr =  wmsx.Util.arrayFill(new Array(9), 0);
    var volume = wmsx.Util.arrayFill(new Array(9), 0xf);

    // Per operator values
    var multi =        wmsx.Util.arrayFill(new Array(18), 0);
    var modTL =        wmsx.Util.arrayFill(new Array(18), 0);
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
    this.modTL = modTL;
    this.phaseInc = phaseInc;
    this.phaseCounter = phaseCounter;

    // -------

    var audioSocket, audioSignal;

    var VOLUME = 0.60;
    var SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 72;       // Main CPU clock / 72 = 49780hz


    init();


    var SIN_ROM = [
        2137, 1731, 1543, 1419, 1326, 1252, 1190, 1137, 1091, 1050, 1013, 979, 949, 920, 894, 869,
        846, 825, 804, 785, 767, 749, 732, 717, 701, 687, 672, 659, 646, 633, 621, 609,
        598, 587, 576, 566, 556, 546, 536, 527, 518, 509, 501, 492, 484, 476, 468, 461,
        453, 446, 439, 432, 425, 418, 411, 405, 399, 392, 386, 380, 375, 369, 363, 358,
        352, 347, 341, 336, 331, 326, 321, 316, 311, 307, 302, 297, 293, 289, 284, 280,
        276, 271, 267, 263, 259, 255, 251, 248, 244, 240, 236, 233, 229, 226, 222, 219,
        215, 212, 209, 205, 202, 199, 196, 193, 190, 187, 184, 181, 178, 175, 172, 169,
        167, 164, 161, 159, 156, 153, 151, 148, 146, 143, 141, 138, 136, 134, 131, 129,
        127, 125, 122, 120, 118, 116, 114, 112, 110, 108, 106, 104, 102, 100, 98, 96,
        94, 92, 91, 89, 87, 85, 83, 82, 80, 78, 77, 75, 74, 72, 70, 69,
        67, 66, 64, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47,
        46, 45, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30,
        29, 28, 27, 26, 25, 24, 23, 23, 22, 21, 20, 20, 19, 18, 17, 17,
        16, 15, 15, 14, 13, 13, 12, 12, 11, 10, 10, 9, 9, 8, 8, 7,
        7, 7, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2,
        2, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    var EXP_ROM = [
        2048, 2054, 2060, 2064, 2070, 2076, 2082, 2088, 2092, 2098, 2104, 2110, 2116, 2122, 2128, 2132,
        2138, 2144, 2150, 2156, 2162, 2168, 2174, 2180, 2186, 2192, 2198, 2204, 2210, 2216, 2222, 2228,
        2234, 2240, 2246, 2252, 2258, 2264, 2270, 2276, 2282, 2288, 2294, 2300, 2308, 2314, 2320, 2326,
        2332, 2338, 2344, 2352, 2358, 2364, 2370, 2376, 2384, 2390, 2396, 2402, 2410, 2416, 2422, 2428,
        2436, 2442, 2448, 2456, 2462, 2468, 2476, 2482, 2488, 2496, 2502, 2510, 2516, 2522, 2530, 2536,
        2544, 2550, 2558, 2564, 2572, 2578, 2584, 2592, 2600, 2606, 2614, 2620, 2628, 2634, 2642, 2648,
        2656, 2664, 2670, 2678, 2684, 2692, 2700, 2706, 2714, 2722, 2728, 2736, 2744, 2752, 2758, 2766,
        2774, 2782, 2788, 2796, 2804, 2812, 2818, 2826, 2834, 2842, 2850, 2858, 2866, 2872, 2880, 2888,
        2896, 2904, 2912, 2920, 2928, 2936, 2944, 2952, 2960, 2968, 2976, 2984, 2992, 3000, 3008, 3016,
        3024, 3032, 3040, 3050, 3058, 3066, 3074, 3082, 3090, 3100, 3108, 3116, 3124, 3132, 3142, 3150,
        3158, 3168, 3176, 3184, 3192, 3202, 3210, 3218, 3228, 3236, 3246, 3254, 3262, 3272, 3280, 3290,
        3298, 3308, 3316, 3326, 3334, 3344, 3352, 3362, 3370, 3380, 3388, 3398, 3408, 3416, 3426, 3434,
        3444, 3454, 3464, 3472, 3482, 3492, 3500, 3510, 3520, 3530, 3538, 3548, 3558, 3568, 3578, 3588,
        3596, 3606, 3616, 3626, 3636, 3646, 3656, 3666, 3676, 3686, 3696, 3706, 3716, 3726, 3736, 3746,
        3756, 3766, 3776, 3786, 3796, 3808, 3818, 3828, 3838, 3848, 3860, 3870, 3880, 3890, 3902, 3912,
        3922, 3932, 3944, 3954, 3966, 3976, 3986, 3998, 4008, 4020, 4030, 4040, 4052, 4062, 4074, 4084
    ];

    var INSTRUMENT_ROM = [
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],           // 0 = Custom
        [0x61, 0x61, 0x1e, 0x17, 0xf0, 0x78, 0x00, 0x17],           // 1 = Violin
        [0x13, 0x41, 0x1e, 0x0d, 0xd7, 0xf7, 0x13, 0x13],           // 2 = Guitar
        [0x13, 0x01, 0x99, 0x04, 0xf2, 0xf4, 0x11, 0x23],           // 3 = Piano
        [0x21, 0x61, 0x1b, 0x07, 0xaf, 0x64, 0x40, 0x27],           // 4 = Flute
        [0x22, 0x21, 0x1e, 0x06, 0xf0, 0x75, 0x08, 0x18],           // 5 = Clarinet
        [0x31, 0x22, 0x16, 0x05, 0x90, 0x71, 0x00, 0x13],           // 6 = Oboe
        [0x21, 0x61, 0x1d, 0x07, 0x82, 0x80, 0x10, 0x17],           // 7 = Trumpet
        [0x23, 0x21, 0x2d, 0x16, 0xc0, 0x70, 0x07, 0x07],           // 8 = Organ
        [0x61, 0x61, 0x1b, 0x06, 0x64, 0x65, 0x10, 0x17],           // 9 = Horn
        [0x61, 0x61, 0x0c, 0x18, 0x85, 0xf0, 0x70, 0x07],           // A = Synthesizer
        [0x23, 0x01, 0x07, 0x11, 0xf0, 0xa4, 0x00, 0x22],           // B = Harpsichord
        [0x97, 0xc1, 0x24, 0x07, 0xff, 0xf8, 0x22, 0x12],           // C = Vibraphone
        [0x61, 0x10, 0x0c, 0x05, 0xf2, 0xf4, 0x40, 0x44],           // D = Synthesizer Bass
        [0x01, 0x01, 0x55, 0x03, 0xf3, 0x92, 0xf3, 0xf3],           // E = Wood Bass
        [0x61, 0x41, 0x89, 0x03, 0xf1, 0xf4, 0xf0, 0x13]            // F = Electric Guitar
    ];

    var MULTI_FACTORS = [
     // 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15           // Original values
        1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30        // Double values
    ];

    function getSin(val) {
        var res = SIN_ROM[((val & 256) ? val ^ 255 : val) & 255];        // Flip if in mirrored quarters
        if (val & 512) res |= 0x8000;                                    // Set sign bit if in negative quarters
        return res;
    }
    this.getSin = getSin;

    function getExp(val) {
        var exp = EXP_ROM[(val & 255) ^ 255];
        var res = exp >>> ((val & 0x7F00) >> 8);
        if (val & 0x8000) res = ~res;                                    // Negate if sign bit was set
        return res >> 4;                                                 // Divide by 16 ???
    }
    this.getExp = getExp;


    this.eval = function(str) {
        return eval(str);
    };

};

