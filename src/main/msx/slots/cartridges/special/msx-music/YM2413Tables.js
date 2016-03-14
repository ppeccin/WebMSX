// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.YM2413Tables = function() {

    this.getSineTable = function() {
        // Complete table for all possible values (1024 entries). Sign in bit 14. No need for get function
        var tab = new Array(1024);
        for (var i = 0; i < 1024; ++i)
            tab[i] = (i > 511 ? 0x4000 : 0) | Math.round(-log2(Math.abs(Math.sin((i + 0.5) * 2 * Math.PI / 1024))) * 256);
        return tab;
    };

    this.getExpTable = function() {
        // Complete table for all possible values (32768 entries). Input sign in bit 14. No need for get function
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

    this.getKSLValues = function() {
        return this.KSL_VALUES;
    };

    this.getMultiFactorsDoubled = function() {
        return this.MULTI_FACTORS;
    };

    this.getRateDecayDurations = function() {
        var tab = new Array(64);
        for (var i = 0; i < 64; ++i) {
            tab[i] = Math.round(this.RATE_DECAY_DURATIONS[i] / 1000 * 49780 / 128);

        }
        return tab;
    };


    function log2(x) {
        return Math.log(x) / Math.log(2);
    }

    function exp2(x) {
        return Math.pow(2, x);
    }


    this.INSTRUMENT_ROM = [
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
        99999999999, 99999999999, 99999999999, 99999999999,     // infinite duration
        20926.6    , 16807.2    , 14006.0    , 12028.7    ,
        10463.3    ,  8403.59   ,  7002.99   ,  6014.33   ,
         5231.65   ,  4201.79   ,  3501.49   ,  3007.17   ,
         2615.82   ,  2100.90   ,  1750.75   ,  1503.58   ,
         1307.91   ,  1050.45   ,   875.374  ,   751.792  ,
          653.956  ,   525.224  ,   437.687  ,   375.896  ,
          326.978  ,   262.612  ,   218.843  ,   187.948  ,
          163.489  ,   131.306  ,   109.422  ,    93.9739 ,
           81.7445 ,    65.653  ,    54.7109 ,    46.9870 ,
           40.8722 ,    32.8265 ,    27.3554 ,    23.4935 ,
           20.4361 ,    16.4133 ,    13.6777 ,    11.7467 ,
           10.2181 ,     8.20663,     6.83886,     5.87337,
            5.10903,     4.10331,     3.41943,     2.93669,
            2.55451,     2.05166,     1.70971,     1.46834,
            1.26720,     1.26720,     1.26720,     1.26720
    ];

};

T = new wmsx.YM2413Tables();
T.sinTable = T.getSineTable();
T.expTable = T.getExpTable();