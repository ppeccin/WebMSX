// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.OPL4WaveTables = function() {
"use strict";

    this.getRegisterWriteMasks = function() {
        var i;
        var mask = wmsx.Util.arrayFill(new Array(256), 0xff);
        mask[0] = mask[1] = 0;                              // LSI TEST
        mask[2] = 0x1d;                                     // DEVICE ID, MEMORY TYPE
        mask[3] = 0x3f;                                     // MEM ADDRESS HIGHER BITS
        mask[7] = 0;                                        // UNUSED
        for (i = 0x80; i <= 0x97; ++i) mask[i] = 0x3f;      // LFO, VIB
        for (i = 0xe0; i <= 0xf7; ++i) mask[i] = 0x07;      // AM
        mask[0xf8] = mask[0xf9] = 0x3f;                     // MIXER
        for (i = 0xfa; i <= 0xff; ++i) mask[i] = 0;         // UNUSED

        return mask;
    };

    this.getPanPotValues = function() {
        return this.PANPOT_VALUES;
    };

    this.getVolumeTable = function() {
        var v = new Array(2048);
        for (var i = 0; i < 1024; ++i) v[i] = Math.pow(10, -0.1875 * i / 20);   // Decreasing volume in steps of -0.1875 dB
        for ( i = 1024; i < 2048; ++i) v[i] = 0;                                // Silence
        return v;
    };

    this.getRateAttackPatterns = function() {
        // Rates form 0 to 60 + 43 (rate correction) = 103 max
        // 8 steps per rate
        var tab = new Array(104 * 8);
        for (var r = 0; r < 64; ++r)
            for (var s = 0; s < 8; ++s)
                tab[r * 8 + s] = r < 52 ? this.RATE_ATTACK_SHIFTS[r & 3][s] : this.RATE_ATTACK_SHIFTS[r - 52 + 4][s];

        // Repeat last value for exceeding rates (> 63)
        for (s = 64 * 8; s < 104 * 8; ++s) tab[s] = 0;

        return tab;
    };

    this.getRateDecayPatterns = function() {
        // Rates form 0 to 60 + 43 (rate correction) = 103 max
        // 8 steps per rate
        var tab = new Array(104 * 8);
        for (var r = 0; r < 64; ++r)
            for (var s = 0; s < 8; ++s)
                tab[r * 8 + s] = r < 56 ? this.RATE_DECAY_INCS[r & 3][s] : this.RATE_DECAY_INCS[r - 56 + 4][s];

        // Repeat last value for exceeding rates (> 63)
        for (s = 64 * 8; s < 104 * 8; ++s) tab[s] = 2;

        return tab;
    };

    this.getLFOStepClocks = function() {
        // 128 steps
        var c = new Array(8);
        for (var i = 0; i < 8; ++i) c[i] = Math.round(44100 / this.LFO_FREQS[i] / 128);
        return c;
    };

    this.getVIBOffsets = function() {
        // 128 steps per depth, 32 levels (0 .. +32 .. 0 .. -32 .. 0)
        var vibs = new Array(8 * 128);
        for (var d = 0; d < 8; ++d) {
            var depth = this.VIB_DEPTHS[d];
            for (var s = 0; s < 128; ++s) {
                vibs[d * 128 + s] = Math.round(
                    s < 32 ? (s / 32) * depth
                    : (s < 96) ? ((64 - s) / 32) * depth
                    : ((s - 128) / 32) * depth
                );
            }
        }
        return vibs;
    };

    this.getAMOffsets = function() {
        // 128 steps per depth, 64 levels (0 .. 64 .. 0)
        var ams = new Array(8 * 128);
        for (var d = 0; d < 8; ++d) {
            var depth = this.AM_DEPTHS[d] / 0.1875;
            for (var s = 0; s < 128; ++s) {
                ams[d * 128 + s] = Math.round(
                    s < 64 ? (s / 64) * depth
                    : ((128 - s) / 64) * depth
                );
            }
        }
        return ams;
    };

    this.PANPOT_VALUES =  [
        // -3 .. -18 dB. Min = -96 dB
        [ 0, 16, 32, 48, 64, 80, 96, 512, 512,   0,  0,  0,  0,  0,  0,  0 ],     // L
        [ 0,  0,  0,  0,  0,  0,  0,   0, 512, 512, 96, 80, 64, 48, 32, 16 ]      // R
    ];

    this.RATE_ATTACK_SHIFTS = [
        // Full Envelope is 512 steps. Start from 512 and decreases exponentially
        // 4 means divide by 16, 3 means divide by 8, 2 means divide by 4, 0 means divide by 1 (instantaneous)
        // -1 means don't change

        // Rates (0*4 + 0) .. (12*4 + 3) = 0 .. 51      (Rate 48 is 2 clocks per step)
        [ 3, -1,  3, -1,  3, -1,  4,  4 ],
        [ 3, -1,  3,  3, -1,  3,  3, -1 ],
        [ 3,  3,  3, -1,  3,  3,  3, -1 ],
        [ 3,  3,  3, -1,  3,  3,  3,  4 ],

        // Rates (13*4 + 0) .. (13*4 + 3) = 52 .. 55    (Rate 52 is 1 clocks per step)
        [ 3, -1,  4, -1,  3, -1,  4,  4 ],
        [ 3, -1,  3, -1,  3, -1,  3,  4 ],
        [ 3,  4,  4,  4,  3,  4,  4,  4 ],
        [ 3,  4,  3,  4,  3,  4,  3,  4 ],

        // Rates (14*4 + -1) .. (14*4 + 3) = 56 .. 59    (Rate 56 is 1 clock per step)
        [ 3, 3, 3, 4, 3, 3, 3, 4 ],
        [ 2, 3, 3, 3, 4, 3, 3, 3 ],
        [ 2, 3, 3, 2, 3, 3, 2, 3 ],
        [ 2, 2, 3, 2, 2, 3, 2, 3 ],

        // Rates (15*4 + 0) .. (15*4 + 3) = 60 .. 63    (Rate 60 is 1 clock per step)
        [ 2, 2, 2, 2, 2, 2, 2, 2 ],
        [ 2, 2, 2, 2, 2, 2, 2, 2 ],
        [ 2, 2, 2, 2, 2, 2, 2, 2 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0 ]
    ];

    this.RATE_DECAY_INCS = [
        // Full Envelope is 480 steps... Matches with 480 clocks at Rate 56
        // So Rate 56 increments 1 step per clock, each 4 rates doubles clocks
        // Start from 0 and increase linearly, when at 480 jump to 512
        // -1 means don't change

        // Rates (0*4 + 0) .. (13*4 + 3) = 0 .. 55       (Rate 52 is 1 clock per step)
        [ -1,  1, -1,  1, -1,  1, -1,  1 ],
        [ -1,  1, -1,  1,  1, -1,  1,  1 ],
        [ -1,  1,  1,  1, -1,  1,  1,  1 ],
        [ -1,  1,  1,  1,  1,  1,  1,  1 ],

        // Rates (14*4 + 0) .. (14*4 + 3) = 56 .. 59     (Rate 56 is 1 clock per step)
        [ 1, 1, 1, 1, 1, 1, 1, 1 ],
        [ 1, 1, 1, 2, 1, 1, 1, 2 ],
        [ 1, 2, 1, 2, 1, 2, 1, 2 ],
        [ 1, 2, 2, 2, 1, 2, 2, 2 ],

        // Rates (15*4 + 0) .. (15*4 + 3) = 60 .. 63     (Rate 60 is 1 clock per step)
        [ 2, 2, 2, 2, 2, 2, 2, 2 ],
        [ 2, 2, 2, 2, 2, 2, 2, 2 ],
        [ 2, 2, 2, 2, 2, 2, 2, 2 ],
        [ 2, 2, 2, 2, 2, 2, 2, 2 ]
    ];

/*
    this.RATE_ATTACK_DURATIONS = [
             -1,                   -1,                   -1,                   -1,                // "infinite" duration, will be 0 clocks
        6222.95,              4978.37,              4148.66,              3556.01,                // 4
        3111.47,              2489.21,              2074.33,              1778.00,                // 8
        1555.74,              1244.63,              1037.19,               889.02,                // 12
         777.87,               622.31,               518.59,               444.54,                // 16
         388.93,               311.16,               259.32,               222.27,                // 20
         194.47,               155.60,               129.66,               111.16,                // 24
          97.23,                77.82,                64.85,                55.60,                // 28
          48.62,                38.91,                32.43,                27.80,                // 32
          24.31,                19.46,                16.24,                13.92,                // 36
          12.15,                 9.75,                 8.12,                 6.98,                // 40
           6.08,                 4.90,                 4.08,                 3.49,                // 44
           3.04,  /!*134.06*!/   2.49,  /!*109.81*!/   2.13,  /!*93.93*!/    1.90,  /!*83.79*!/   // 48
           1.72,  /!*75.85*!/    1.41,  /!*62.18*!/    1.18,  /!*52.04*!/    1.04,  /!*45.86*!/   // 52
           0.91,  /!*40.13*!/    0.73,  /!*32.19*!/    0.59,  /!*26.02*!/    0.50,  /!*22.05*!/   // 56
           0.45,  /!*19.85*!/    0.45,                 0.45,                 0.00                 // 60.  Rate 63 is instantaneous, will be 1 clock (the next clock)
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
*/

    this.LFO_FREQS = [
        // In Hz        in samples
        0.168,      //  262500
        2.019,      //   21842.496285289744
        3.196,      //   13798.498122653316
        4.206,      //   10485.021398002853
        5.215,      //    8456.375838926175
        5.888,      //    7488.679245283019
        6.224,      //    7085.475578406169
        7.066       //    6241.154825926975
    ];

    this.VIB_DEPTHS = [
        // in fNum     in cents
         0,         //  0
         2,         //  3.378
         3,         //  5.065
         4,         //  6.750
         6,         // 10.114
        12,         // 20.170
        24,         // 40.108
        48          // 79.307
    ];

    this.AM_DEPTHS = [
        // In -dB       in units of -0.09375 dB
             0,     //   0  0x00  (0..0)
         1.781,     //  20  0x14  (0..19)
         2.906,     //  32  0x20  (0..31)
         3.656,     //  40  0x28  (0..39)
         4.406,     //  48  0x30  (0..47)
         5.906,     //  64  0x40  (0..63)
         7.406,     //  80  0x50  (0..79)
        11.910      // 128  0x80  (0..127)
    ];

};
