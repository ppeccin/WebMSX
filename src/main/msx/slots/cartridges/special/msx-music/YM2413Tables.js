// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.YM2413Tables = function() {

    this.getFullSineTable = function() {
        // Complete table for all possible values (1024 entries). Sign in bit 14
        var tab = new Array(1024);
        for (var i = 0; i < 1024; ++i)
            tab[i] = (i > 511 ? 0x4000 : 0) | Math.round(-log2(Math.abs(Math.sin((i + 0.5) * 2 * Math.PI / 1024))) * 256);
        return tab;
    };

    this.getHalfSineTable = function() {
        // Complete table for all possible values (1024 entries). Only positive values for first half, zero for second half
        var tab = new Array(1024);
        for (var i = 0; i < 1024; ++i)
            tab[i] = Math.round(-log2(Math.abs(Math.sin((i < 512 ? i + 0.5 : 0.5) * 2 * Math.PI / 1024))) * 256);
        return tab;
    };

    this.getExpTable = function() {
        // Complete table for all possible values (32768 entries). Input sign in bit 14
        var tab = new Array(32768);
        for (var i = 0; i < 32768; ++i) {
            var v = (Math.round(exp2(((i & 255) ^ 255) / 256) * 1024) << 1) >> ((i & 0x3F00) >> 8);
            if (i & 0x4000) v = ~v;
            tab[i] = v;
        }
        return tab;

        // Original expTable
        // this.expTable[i] = Math.round(exp2(i / 256) * 1024) << 1;
        // Original getExp
        // this.getExp = function(val) {
        //    var sign = val & 0x4000;
        //    var t = this.expTable[(val & 255) ^ 255];
        //    var result = t >> ((val & 0x7F00) >> 8);
        //    if (sign) result = ~result;
        //    return result >> 4;
        // };
    };

    this.getInstrumentsROM = function() {
        return this.INSTRUMENT_ROM;
    };

    this.getVIBValues = function() {
        return this.VIB_VALUES;
    };

    this.getKSLValues = function() {
        return this.KSL_VALUES;
    };

    this.getMultiFactorsDoubled = function() {
        return this.MULTI_FACTORS;
    };

    this.getRateDecayDurations = function() {
        var tab = new Array(64);
        for (var i = 0; i < 64; ++i)
            tab[i] = Math.round(this.RATE_DECAY_DURATIONS[i] / 1000 * 49780 / 127) + 1;  // TODO Revise

        // Repeat last value for exceeding rates (> 63), possible when Rate = 15 and KSR offset > 3, as (Rate x 4 + KSROffset) can be > 63!
        for (i = 64; i < 60 + 16; ++i)
            tab[i] = tab[63];

        return tab;
    };

    this.getRateAttackDurations = function() {
        var tab = new Array(64);
        for (var i = 0; i < 64; ++i)
            tab[i] = Math.round(this.RATE_ATTACK_DURATIONS[i] / 1000 * 49780 / 127) + 1;  // TODO Revise

        // Repeat last value for exceeding rates (> 63), possible when Rate = 15 and KSR offset > 3, as (Rate x 4 + KSROffset) can be > 63!
        for (i = 64; i < 60 + 16; ++i)
            tab[i] = tab[63];

        return tab;
    };


    function log2(x) {
        return Math.log(x) / Math.log(2);
    }

    function exp2(x) {
        return Math.pow(2, x);
    }


    this.INSTRUMENT_ROM = [
        [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ],              //  0 = Custom
        [ 0x61, 0x61, 0x1e, 0x17, 0xf0, 0x7f, 0x00, 0x17 ],              //  1 = Violin
        [ 0x13, 0x41, 0x16, 0x0e, 0xfd, 0xf4, 0x23, 0x23 ],              //  2 = Guitar
        [ 0x03, 0x01, 0x9a, 0x04, 0xf3, 0xf3, 0x13, 0xf3 ],              //  3 = Piano
        [ 0x11, 0x61, 0x0e, 0x07, 0xfa, 0x64, 0x70, 0x17 ],              //  4 = Flute
        [ 0x22, 0x21, 0x1e, 0x06, 0xf0, 0x76, 0x00, 0x28 ],              //  5 = Clarinet
        [ 0x21, 0x22, 0x16, 0x05, 0xf0, 0x71, 0x00, 0x18 ],              //  6 = Oboe
        [ 0x21, 0x61, 0x1d, 0x07, 0x82, 0x80, 0x17, 0x17 ],              //  7 = Trumpet
        [ 0x23, 0x21, 0x2d, 0x16, 0x90, 0x90, 0x00, 0x07 ],              //  8 = Organ
        [ 0x21, 0x21, 0x1b, 0x06, 0x64, 0x65, 0x10, 0x17 ],              //  9 = Horn
        [ 0x21, 0x21, 0x0b, 0x1a, 0x85, 0xa0, 0x70, 0x07 ],              // 10 = Synthesizer
        [ 0x23, 0x01, 0x83, 0x10, 0xff, 0xb4, 0x10, 0xf4 ],              // 11 = Harpsichord
        [ 0x97, 0xc1, 0x20, 0x07, 0xff, 0xf4, 0x22, 0x22 ],              // 12 = Vibraphone
        [ 0x61, 0x00, 0x0c, 0x05, 0xc2, 0xf6, 0x40, 0x44 ],              // 13 = Synthesizer Bass
        [ 0x01, 0x01, 0x56, 0x03, 0x94, 0xc2, 0x03, 0x12 ],              // 14 = Wood Bass
        [ 0x21, 0x01, 0x89, 0x03, 0xf1, 0xe4, 0xf0, 0x23 ],              // 15 = Electric Guitar

        //[ 0x49, 0x4c, 0x4c, 0x12, 0x00, 0x00, 0x00, 0x00 ],  //0
        //[ 0x61, 0x61, 0x1e, 0x17, 0xf0, 0x78, 0x00, 0x17 ],  //1
        //[ 0x13, 0x41, 0x1e, 0x0d, 0xd7, 0xf7, 0x13, 0x13 ],  //2
        //[ 0x13, 0x01, 0x99, 0x04, 0xf2, 0xf4, 0x11, 0x23 ],  //3
        //[ 0x21, 0x61, 0x1b, 0x07, 0xaf, 0x64, 0x40, 0x27 ],  //4
        //[ 0x22, 0x21, 0x1e, 0x06, 0xf0, 0x75, 0x08, 0x18 ],  //5
        //[ 0x31, 0x22, 0x16, 0x05, 0x90, 0x71, 0x00, 0x13 ],  //6
        //[ 0x21, 0x61, 0x1d, 0x07, 0x82, 0x80, 0x10, 0x17 ],  //7
        //[ 0x23, 0x21, 0x2d, 0x16, 0xc0, 0x70, 0x07, 0x07 ],  //8
        //[ 0x61, 0x61, 0x1b, 0x06, 0x64, 0x65, 0x10, 0x17 ],  //9
        //[ 0x61, 0x61, 0x0c, 0x18, 0x85, 0xf0, 0x70, 0x07 ],  //A
        //[ 0x23, 0x01, 0x07, 0x11, 0xf0, 0xa4, 0x00, 0x22 ],  //B
        //[ 0x97, 0xc1, 0x24, 0x07, 0xff, 0xf8, 0x22, 0x12 ],  //C
        //[ 0x61, 0x10, 0x0c, 0x05, 0xf2, 0xf4, 0x40, 0x44 ],  //D
        //[ 0x01, 0x01, 0x55, 0x03, 0xf3, 0x92, 0xf3, 0xf3 ],  //E
        //[ 0x61, 0x41, 0x89, 0x03, 0xf1, 0xf4, 0xf0, 0x13 ],  //F

        //[ 0x07, 0x21, 0x14, 0x00, 0xee, 0xf8, 0xff, 0xf8 ],              // 16 = Bass Drum       (2 ops)
        //[ 0x01, 0x31, 0x00, 0x00, 0xf8, 0xf7, 0xf8, 0xf7 ],              // 17 = Snare, Tom      (1 op each)
        //[ 0x25, 0x11, 0x00, 0x00, 0xf8, 0xfa, 0xf8, 0x55 ]               // 18 = Cymbal, HiHat   (1 op each)

        [ 0x01, 0x01, 0x16, 0x00, 0xfd, 0xf8, 0x2f, 0x6d ],              // 16 = Bass Drum       (2 ops)
        [ 0x01, 0x01, 0x00, 0x00, 0xd8, 0xd8, 0xf9, 0xf8 ],              // 17 = Snare, Tom      (1 op each)
        [ 0x05, 0x01, 0x00, 0x00, 0xf8, 0xba, 0x49, 0x55 ]               // 18 = Cymbal, HiHat   (1 op each)
    ];

    this.VIB_VALUES = [
        [ 0, 0, 0, 0, 0,  0,  0,  0 ],      // According to fNum >> 6 (one line for each value)
        [ 0, 0, 1, 0, 0,  0, -1,  0 ],      // Half these values must be added to fNum BEFORE multi
        [ 0, 1, 2, 1, 0, -1, -2, -1 ],
        [ 0, 1, 3, 1, 0, -1, -3, -1 ],
        [ 0, 2, 4, 2, 0, -2, -4, -2 ],
        [ 0, 2, 5, 2, 0, -2, -5, -2 ],
        [ 0, 3, 6, 3, 0, -3, -6, -3 ],
        [ 0, 3, 7, 3, 0, -3, -7, -3 ]
    ];

    this.KSL_VALUES = [      //  [ KSL ] [ BLOCK ] [ FNUM (4 higher bits) ]
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

    this.MULTI_FACTORS = [
        // 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15           // Original values
        1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30           // Double values
    ];

    this.RATE_DECAY_DURATIONS = [
        99999999999999, 99999999999999, 99999999999999, 99999999999999,     // infinite duration
              20926.60,       16807.20,       14006.00,       12028.70,
              10463.30,        8403.58,        7002.98,        6014.32,
               5231.64,        4201.79,        3501.49,        3007.16,
               2615.82,        2100.89,        1750.75,        1503.58,
               1307.91,        1050.45,         875.37,         751.79,
                653.95,         525.22,         437.69,         375.90,
                326.98,         262.61,         218.84,         187.95,
                163.49,         131.31,         109.42,          93.97,
                 81.74,          65.65,          54.71,          46.99,
                 40.87,          32.83,          27.36,          23.49,
                 20.44,          16.41,          13.68,          11.75,
                 10.22,           8.21,           6.84,           5.87,
                  5.11,           4.10,           3.42,           2.94,
                  2.55,           2.05,           1.71,           1.47,
                  1.27,           1.27,           1.27,           1.27
    ];

    this.RATE_ATTACK_DURATIONS = [
        99999999999999, 99999999999999, 99999999999999, 99999999999999,     // infinite duration
               1730.15,        1400.60,        1153.43,         988.66,
                865.08,         700.30,         576.72,         494.33,
                432.54,         350.15,         288.36,         247.16,
                216.27,         175.07,         144.18,         123.58,
                108.13,          87.54,          72.09,          61.79,
                 54.07,          43.77,          36.04,          30.90,
                 27.03,          21.88,          18.02,          15.45,
                 13.52,          10.94,           9.01,           7.72,
                  6.76,           5.47,           4.51,           3.86,
                  3.38,           2.74,           2.25,           1.93,
                  1.69,           1.37,           1.13,           0.97,
                  0.84,           0.70,           0.60,           0.54,
                  0.50,           0.42,           0.34,           0.30,
                  0.28,           0.22,           0.18,           0.14,
                  0.00,           0.00,           0.00,           0.00      // instantaneous
    ];

};

T = new wmsx.YM2413Tables();
T.sinTable = T.getFullSineTable();
T.expTable = T.getExpTable();



