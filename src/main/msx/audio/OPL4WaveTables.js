// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.OPL4WaveTables = function() {
"use strict";

    this.getLinearTable12Bits = function() {
        // Complete table for all possible values (4096 entries). -255 .. 255 values, sign in bit 14
        var tab = new Array(4096);
        for (var i = 0; i < 4096; ++i)
            tab[i] = i < 2048 ? Math.round(-wmsx.Util.log2((i + 0.1) / 2047) * 256) : 0x4000 | Math.round(-wmsx.Util.log2((4095 - i + 0.1) / 2047) * 256);
        return tab;
    };

    this.getExpTable = function() {
        // Complete table for all possible values (32768 entries). Input sign in bit 14
        var tab = new Array(32768);
        for (var i = 0; i < 32768; ++i) {
            var v = (Math.round(wmsx.Util.exp2(((i & 255) ^ 255) / 256) * 1024) << 1) >> Math.min((i & 0x3F00) >> 8, 31);
            if (i & 0x4000) v = -v;
            tab[i] = v;
        }
        return tab;
    };

    this.getVIBValues = function() {
        return this.VIB_VALUES;
    };

    this.getKSLValues = function() {
        return this.KSL_VALUES;
    };

    this.getRateAttackDurations = function() {
        var tab = new Array(76);
        for (var i = 0; i < 64; ++i) {
            var dur = this.RATE_ATTACK_DURATIONS[i];
            tab[i] = dur >= 0 ? Math.max(1, Math.round(dur / 10 / 1000 * 44100 / 128)) : 0;      // Valid Durations are at least 1 clock. 0 = infinite
        }
        // Repeat last value for exceeding rates (> 63), possible when Rate = 15 and KSR offset > 3, as (Rate x 4 + KSROffset) can be > 63!
        for (i = 64; i < 60 + 16; ++i)
            tab[i] = tab[63];

        return tab;
    };

    this.getRateDecayDurations = function() {
        var tab = new Array(76);
        for (var i = 0; i < 64; ++i) {
            var dur = this.RATE_DECAY_DURATIONS[i];
            tab[i] = dur >= 0 ? Math.max(1, Math.round(dur / 1000 * 44100 / 128)) : 0;      // Valid Durations are at least 1 clock. 0 = infinite
        }
        // Repeat last value for exceeding rates (> 63), possible when Rate = 15 and KSR offset > 3, as (Rate x 4 + KSROffset) can be > 63!
        for (i = 64; i < 60 + 16; ++i)
            tab[i] = tab[63];

        return tab;
    };

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


    this.RATE_ATTACK_DURATIONS = [
                    -1,             -1,             -1,             -1,     // "infinite" duration, will be 0 clocks
               6222.95,        4978.37,        4148.66,        3556.01,
               3111.47,        2489.21,        2074.33,        1778.00,
               1555.74,        1244.63,        1037.19,         889.02,
                777.87,         622.31,         518.59,         444.54,
                388.93,         311.16,         259.32,         222.27,
                194.47,         155.60,         129.66,         111.16,
                 97.23,          77.82,          64.85,          55.60,
                 48.62,          38.91,          32.43,          27.80,
                 24.31,          19.46,          16.24,          13.92,
                 12.15,           9.75,           8.12,           6.98,
                  6.08,           4.90,           4.08,           3.49,
                  3.04,           2.49,           2.13,           1.90,
                  1.72,           1.41,           1.18,           1.04,
                  0.91,           0.73,           0.59,           0.50,
                  0.45,           0.45,           0.45,           0.00      // instantaneous, will be 1 clock (the next clock)
    ];



    this.RATE_DECAY_DURATIONS = [
                    -1,             -1,             -1,             -1,     // "infinite" duration, will be 0 clocks
              89164.63,       71331.75,       59443.13,          50951.25,
              44582.31,       35665.90,       29721.59,          25475.65,
              22291.16,       17832.97,       14860.82,          12737.82,
              11145.58,        8916.51,        7430.43,           6368.93,
               5572.79,        4458.28,        3715.24,           3184.49,
               2786.39,        2229.16,        1857.64,           1592.24,
               1393.20,        1114.60,         928.84,            796.15,
                696.60,         557.32,         464.44,            398.10,
                348.30,         278.68,         232.24,            199.05,
                174.15,         139.37,         116.15,             99.55,
                 87.07,          69.71,          58.10,             49.80,
                 43.54,          34.83,          29.02,             24.90,
                 21.77,          17.41,          14.51,             12.43,
                 10.08,           8.71,           7.23,              6.21,
                  5.44,           5.44,           5.44,              5.44
    ];

};
