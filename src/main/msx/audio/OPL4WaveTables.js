// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.OPL4WaveTables = function() {
"use strict";

    this.getVIBValues = function() {
        return this.VIB_VALUES;
    };

    this.getRateAttackDurations = function() {
        var tab = new Array(76);
        for (var i = 0; i < 64; ++i) {
            var dur = this.RATE_ATTACK_DURATIONS[i];
            tab[i] = dur >= 0 ? Math.max(1, Math.round(dur / 2.2 / 1000 * 49780 / 256)) : 0;      // Valid Durations are at least 1 clock. 0 = infinite
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
            tab[i] = dur >= 0 ? Math.max(1, Math.round(dur / 1000 * 49780 / 256)) : 0;      // Valid Durations are at least 1 clock. 0 = infinite
        }
        // Repeat last value for exceeding rates (> 63), possible when Rate = 15 and KSR offset > 3, as (Rate x 4 + KSROffset) can be > 63!
        for (i = 64; i < 60 + 16; ++i)
            tab[i] = tab[63];

        return tab;
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
                  0.45,           0.45,           0.45,           0.45      // instantaneous, will be 1 clock (the next clock)
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

    this.PANPOT_VALUES =  [
        // -3 .. -18 dB. Min = -96 dB
        [ 0, 16, 32, 48, 64, 80, 96, 512, 512,   0,  0,  0,  0,  0,  0,  0 ],     // L
        [ 0,  0,  0,  0,  0,  0,  0,   0, 512, 512, 96, 80, 64, 48, 32, 16 ]      // R
    ];

    this.rateDecayIncs = [
        // Full Envelope is 480 steps... Matches with 480 clocks at Rate 56
        // So Rate 56 increments 1 step per clock, each 4 rates doubles clocks

        // Rates (0*4 + 0) .. (13*4 + 3) = 0 .. 55
        0, 1, 0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 1, 0, 1, 1,
        0, 1, 1, 1, 0, 1, 1, 1,
        0, 1, 1, 1, 1, 1, 1, 1,

        // Rates (14*4 + 0) .. (14*4 + 3) = 56 .. 59
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 2, 1, 1, 1, 2,
        1, 2, 1, 2, 1, 2, 1, 2,
        1, 2, 2, 2, 1, 2, 2, 2,

        // Rates (15*4 + 0) .. (15*4 + 3) = 60 .. 63
        2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 4, 2, 2, 2, 4,
        2, 4, 2, 4, 2, 4, 2, 4,
        2, 4, 4, 4, 2, 4, 4, 4
    ];

    this.rateAtackShifts = [
        // Same as Delay, but up to Rate 56 each step does Level = Level 0 -(Level/8) - 1  (exp increase)

        // Rates (0*4 + 0) .. (13*4 + 3) = 0 .. 55
        3, 3, 3, 3, 3, 3, 3, 3,         // 3 means divide by 8
        3, 3, 3, 2, 3, 3, 3, 2,         // 2 means divide by 4
        3, 2, 3, 2, 3, 2, 3, 2,
        3, 2, 2, 2, 3, 2, 2, 2,

        // Rates (0*4 + 0) .. (14*4 + 3) = 0 .. 59
        3, 3, 3, 3, 3, 3, 3, 3,         // 3 means divide by 8
        3, 3, 3, 2, 3, 3, 3, 2,         // 2 means divide by 4
        3, 2, 3, 2, 3, 2, 3, 2,
        3, 2, 2, 2, 3, 2, 2, 2,

        // Rates (15*4 + 0) .. (15*4 + 3) = 60 .. 63
        2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 2, 2,
        2, 2, 2, 2, 2, 2, 2, 2,
        0, 0, 0, 0, 0, 0, 0, 0          // 0 means divide by 1 = instantaneous
    ];

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

    this.getRateClocks = function() {
        var tab = new Array(128);
        for (var r = 14; r >= 0; --r) {
            tab[r] = 1 << (14 - (r >> 4));
        }
        // Repeat last value for exceeding rates (> 63)
        for (r = 64; r < 128; ++r)
            tab[r] = tab[63];

        return tab;
    };

};
