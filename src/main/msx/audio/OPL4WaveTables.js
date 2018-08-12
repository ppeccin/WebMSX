// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.OPL4WaveTables = function() {
"use strict";

    this.getVIBValues = function() {
        return this.VIB_VALUES;
    };

    this.getPanPotValues = function() {
        return this.PANPOT_VALUES;
    };

    this.getVolumeTable = function() {
        var v = new Array(1536);
        for (var i = 0; i < 1536; ++i) v[i] = Math.pow(10, -0.1875 * i / 20);
        v[1535] = 0;
        return v;
    };

    this.getRateDecayClocks = function() {
        var tab = new Array(76);
        for (var i = 0; i < 64; ++i) {
            var dur = this.RATE_DECAY_DURATIONS[i];
            // Duration in clocks for entire range. 16 fractional bits
            tab[i] = dur >= 0 ? Math.round(65536 / (dur * 44100 / 1000 / 512)) : 0;      // Valid Durations are at least 1 clock. 0 = infinite
        }
        // Repeat last value for exceeding rates (> 63)
        for (i = 64; i < 128; ++i)
            tab[i] = tab[63];

        return tab;
    };

    this.getRateAttackPatterns = function() {
        // Rates form 0 to 60 + 43 (rate correction) = 103 max
        var tab = new Array(104);
        for (var r = 0; r < 64; ++r)
            tab[r] = r < 52 ? this.RATE_ATTACK_SHIFTS[r & 3] : this.RATE_ATTACK_SHIFTS[r - 52 + 4];

        // Repeat last value for exceeding rates (> 63)
        for (r = 64; r < 104; ++r) tab[r] = tab[63];

        return tab;
    };

    this.getRateDecayPatterns = function() {
        // Rates form 0 to 60 + 43 (rate correction) = 103 max
        var tab = new Array(104);
        for (var r = 0; r < 64; ++r)
            tab[r] = r < 56 ? this.RATE_DECAY_INCS[r & 3] : this.RATE_DECAY_INCS[r - 56 + 4];

        // Repeat last value for exceeding rates (> 63)
        for (r = 64; r < 104; ++r) tab[r] = tab[63];

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

        // Rates (0*4 + 0) .. (13*4 + 3) = 0 .. 55       (Rate 52 is 1 clock per step)
        [ 0, 1, 0, 1, 0, 1, 0, 1 ],
        [ 0, 1, 0, 1, 1, 0, 1, 1 ],
        [ 0, 1, 1, 1, 0, 1, 1, 1 ],
        [ 0, 1, 1, 1, 1, 1, 1, 1 ],

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
        -1,                 -1,                 -1,                 -1,              // "infinite" duration, will be 0 clocks
        6222.95,            4978.37,            4148.66,            3556.01,              // 4
        3111.47,            2489.21,            2074.33,            1778.00,              // 8
        1555.74,            1244.63,            1037.19,             889.02,              // 12
        777.87,             622.31,             518.59,             444.54,              // 16
        388.93,             311.16,             259.32,             222.27,              // 20
        194.47,             155.60,             129.66,             111.16,              // 24
        97.23,              77.82,              64.85,              55.60,              // 28
        48.62,              38.91,              32.43,              27.80,              // 32
        24.31,              19.46,              16.24,              13.92,              // 36
        12.15,               9.75,               8.12,               6.98,              // 40
        6.08,               4.90,               4.08,               3.49,              // 44
        3.04,  /!*134.06*!/   2.49,  /!*109.81*!/   2.13,  /!*93.93*!/    1.90,  /!*83.79*!/   // 48
        1.72,  /!*75.85*!/    1.41,  /!*62.18*!/    1.18,  /!*52.04*!/    1.04,  /!*45.86*!/   // 52
        0.91,  /!*40.13*!/    0.73,  /!*32.19*!/    0.59,  /!*26.02*!/    0.50,  /!*22.05*!/   // 56
        0.45,  /!*19.85*!/    0.45,               0.45,               0.00               // 60.  Rate 63 is instantaneous, will be 1 clock (the next clock)
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

};
