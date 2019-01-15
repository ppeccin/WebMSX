// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.AudioTables = {

    getVolPanVolumeTable: function() {
        if (this.VOLPAN_VOLUME_TABLE) return this.VOLPAN_VOLUME_TABLE;

        var v = new Array(256);
        for (var i = 0; i < 127; ++i) v[i] = Math.pow(10, -0.75 * i / 20);   // Decreasing volume in steps of -0.75 dB  (-0 .. -95.5)
        for (  i = 127; i < 256; ++i) v[i] = 0;                              // Silence

        return this.VOLPAN_VOLUME_TABLE = v;
    },

    VOL_VALUES: [
        // -1.5 .. -31 dB. Min = -infinite dB
        128, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0
    ],

    PAN_VALUES: [
        // -3 .. -18 dB. Min = -infinite dB
        [ 127,   0,  0,  0,  0,  0,  0,  0,  0,  4,  8, 12, 16, 20, 24, 127 ],     // L
        [ 127, 127, 24, 20, 16, 12,  8,  4,  0,  0,  0,  0,  0,  0,  0,   0 ]      // R
    ],

    VOLPAN_VOLUME_TABLE: undefined

};
