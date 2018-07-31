// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.OPL4WaveTables = function() {
"use strict";

    this.getEnvAttackCurve = function() {
        var tab = new Array(257);
        tab[0] = 0;
        tab[256] = 256;
        for (var i = 1; i < 256; ++i)
            tab[i] = -Math.floor((Math.log(((256 - i)/256) + 0.00001) / 12) * 256);
            // tab[i] = -Math.floor((Math.log(((256 - i)/256) + 0.0025) / 6) * 256);
            // tab[i] = 256 - Math.floor((Math.log(((256 - i)/256) + 0.0188) / 4 + 0.995) * 256);
        return tab;
    };


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
        var v = new Array(1025);
        for (var i = 0; i < 1024; ++i) v[i] = Math.pow(10, -0.375 * i / 20);
        v[1024] = 0;
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

    this.PANPOT_VALUES =  [
        // -3 .. -18 dB. Min = -96 dB
        [ 0, 1, 2, 3, 4, 5, 6, 32, 32,   0, 0, 0, 0, 0, 0, 0 ],     // L
        [ 0, 0, 0, 0, 0, 0, 0,   0, 32, 32, 6, 5, 4, 3, 2, 1 ]      // R
    ];

};
