// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ColorCache = new function() {

    var colors8bit9938Values =  undefined;         // 32 bit ABGR values for 8 bit GRB colors
    var colors9bit9938Values =  undefined;         // 32 bit ABGR values for 9 bit GRB colors

    var colors8bit9990Values =  undefined;         // 32 bit ABGR values for 8 bit GRB colors. 0 = YS

    var colors16bitValues =     undefined;         // 32 bit ABGR values for YS + 15 bit GRB colors
    var colorsYUVValues =       undefined;         // 32 bit ABGR values for 17 bit YUV colors, no YS
    var colorsYJKValues =       undefined;         // 32 bit ABGR values for 17 bit YJK colors, no YS

    var color2to8bits9938 = [ 0, 73, 146, 255 ];                        // 8 bit B values for 2 bit B colors. Perfect Grays in 256 color mode are possible!
    var color3to8bits9938 = [ 0, 36, 73, 109, 146, 182, 219, 255 ];     // 8 bit R,G values for 3 bit R,G colors

    var color2to8bits9990 = [ 0, 90, 172, 255 ];                        // 8 bit B values for 2 bit B colors. Perfect Grays in 256 color mode NOT possible!
    var color3to8bits9990 = [ 0, 32, 74, 106, 148, 180, 222, 255 ];     // 8 bit R,G values for 3 bit R,G colors

    var color5to8bits = [ 0, 8, 16, 24, 32, 41, 49, 57, 65, 74, 82, 90, 98, 106, 115, 123, 131, 139, 148, 156, 164, 172, 180, 189, 197, 205, 213, 222, 230, 238, 246, 255 ];    // 8 bit R,G,B values for 5 bit R,G,B colors


    this.getColors8bit9938Values = function() {
        if (!colors8bit9938Values) {
            colors8bit9938Values = new Uint32Array(256);
            for (var c = 1; c < 256; ++c)
                colors8bit9938Values[c] = 0xff000000 | (color2to8bits9938[c & 0x3] << 16) | (color3to8bits9938[c >> 5] << 8) | color3to8bits9938[(c >> 2) & 0x7];
        }
        return colors8bit9938Values;
    };

    this.getColors9bit9938Values = function() {
        if (!colors9bit9938Values) {
            colors9bit9938Values = new Uint32Array(512);
            for (var c = 1; c < 512; ++c)
                colors9bit9938Values[c] = 0xff000000 | (color3to8bits9938[c & 0x7] << 16) | (color3to8bits9938[c >>> 6] << 8) | color3to8bits9938[(c >>> 3) & 0x7];
        }
        return colors9bit9938Values;
    };

    this.getColors8bit9990Values = function() {
        if (!colors8bit9990Values) {
            colors8bit9990Values = new Uint32Array(256);
            colors8bit9990Values[0] = 0x00000000;    // YS, alpha = 0
            for (var c = 1; c < 256; ++c)
                colors8bit9990Values[c] = 0xff000000 | (color2to8bits9990[c & 0x3] << 16) | (color3to8bits9990[c >> 5] << 8) | color3to8bits9990[(c >> 2) & 0x7];
        }
        return colors8bit9990Values;
    };

    this.getColors16bitValues = function() {
        if (!colors16bitValues) {
            colors16bitValues = new Uint32Array(65536);
            for (var c = 0; c < 65536; ++c)
                colors16bitValues[c] = (c < 32768 ? 0xff000000 : 0x00000000) | (color5to8bits[c & 0x1f] << 16) | (color5to8bits[c >> 10] << 8) | color5to8bits[(c >> 5) & 0x1f];
        }
        return colors16bitValues;
    };

    this.getColorsYUVValues = function() {
        if (!colorsYUVValues) {
            colorsYUVValues = new Uint32Array(131072);
            for (var c = 0; c < 131072; ++c) {
                var y = c >> 12, j = signed((c >> 6) & 0x3f), k = signed(c & 0x3f);
                var r = trunc(y + j), g = trunc((y * 5 - (j << 1) - k) >> 2), b = trunc(y + k);
                colorsYUVValues[c] = 0xff000000 | (color5to8bits[b] << 16) | (color5to8bits[g] << 8) | color5to8bits[r];
            }
        }
        return colorsYUVValues;
    };

    this.getColorsYJKValues = function() {
        if (!colorsYJKValues) {
            colorsYJKValues = new Uint32Array(131072);
            for (var c = 0; c < 131072; ++c) {
                var y = c >> 12, j = signed((c >> 6) & 0x3f), k = signed(c & 0x3f);
                var r = trunc(y + j), g = trunc(y + k), b = trunc((y * 5 - (j << 1) - k) >> 2);
                colorsYJKValues[c] = 0xff000000 | (color5to8bits[b] << 16) | (color5to8bits[g] << 8) | color5to8bits[r];
            }
        }
        return colorsYJKValues;
    };

    function signed(x) { return x > 31 ? x - 64 : x; }
    function trunc(x)  { return x <= 0 ? 0 : x >= 31 ? 31 : x; }

}();