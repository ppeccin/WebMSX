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

    var color5to8bits =     [ 0, 8, 16, 24, 32, 41, 49, 57, 65, 74, 82, 90, 98, 106, 115, 123, 131, 139, 148, 156, 164, 172, 180, 189, 197, 205, 213, 222, 230, 238, 246, 255 ];    // 8 bit R,G,B values for 5 bit R,G,B colors


    this.initialPalettesValues = [
        // 0: WebMSX original 9918
        new Uint32Array([ 0xff000000, 0xff000000, 0xff28ca07, 0xff65e23d, 0xfff04444, 0xfff46d70, 0xff1330d0, 0xfff0e840, 0xff4242f3, 0xff7878f4, 0xff30cad0, 0xff89dcdc, 0xff20a906, 0xffc540da, 0xffbcbcbc, 0xffffffff ]),
        // 1: 9918
        new Uint32Array([ 0xff000000, 0xff000000, 0xff0deb00, 0xff50f340, 0xffff474d, 0xffff6679, 0xff2b45f9, 0xffffff12, 0xff2d45ff, 0xff5069ff, 0xff05cbde, 0xff44d4f0, 0xff0bcb00, 0xffe246e4, 0xffcccccc, 0xffffffff ]),
        // 2: 9928
        new Uint32Array([ 0xff000000, 0xff000000, 0xff4ab740, 0xff7ecf75, 0xffd75659, 0xffef7780, 0xff515fb8, 0xffeedb66, 0xff5a66d9, 0xff7e8afd, 0xff60c3cc, 0xff88d0de, 0xff42a13b, 0xffb467b6, 0xffcccccc, 0xffffffff ]),
        // 3: 9938
        new Uint32Array([ 0xff000000, 0xff000000, 0xff24db24, 0xff6dff6d, 0xffff2424, 0xffff6d49, 0xff2424b6, 0xffffdb49, 0xff2424ff, 0xff6d6dff, 0xff24dbdb, 0xff92dbdb, 0xff249224, 0xffb649db, 0xffb6b6b6, 0xffffffff ]),
        // 4: Toshiba VDP
        new Uint32Array([ 0xff000000, 0xff000000, 0xff66cc66, 0xff88ee88, 0xffdd4444, 0xffff7777, 0xff5555bb, 0xffdddd77, 0xff6666dd, 0xff7777ff, 0xff55cccc, 0xff88eeee, 0xff55aa55, 0xffbb55bb, 0xffcccccc, 0xffffffff ]),
        // 5: Fujitsu FM-X
        new Uint32Array([ 0xff000000, 0xff000000, 0xff00ff00, 0xff00ff00, 0xffff0000, 0xffff0000, 0xff0000ff, 0xffffff00, 0xff0000ff, 0xff0000ff, 0xff00ffff, 0xff00ffff, 0xff00ff00, 0xffff00ff, 0xffffffff, 0xffffffff ]),

        // 6: BW Toshiba VDP
        new Uint32Array([ 0xff000000, 0xff000000, 0xffafafaf, 0xffd1d1d1, 0xff4f4f4f, 0xff848484, 0xff6b6b6b, 0xffc0c0c0, 0xff7f7f7f, 0xff949494, 0xffc6c6c6, 0xffe7e7e7, 0xff929292, 0xff727272, 0xffcccccc, 0xffffffff ]),
        // 7: Green Toshiba VDP
        new Uint32Array([ 0xff000000, 0xff000000, 0xff3aaf3a, 0xff45d145, 0xff1a4f1a, 0xff2c842c, 0xff236b23, 0xff40c040, 0xff2a7f2a, 0xff319431, 0xff42c642, 0xff4de74d, 0xff309230, 0xff267226, 0xff44cc44, 0xff55ff55 ])
    ];


    this.getColors8bit9938Values = function() {
        if (!colors8bit9938Values) {
            colors8bit9938Values = new Uint32Array(256);
            for (var c = 0; c < 256; ++c)
                colors8bit9938Values[c] = 0xff000000 | (color2to8bits9938[c & 0x3] << 16) | (color3to8bits9938[c >> 5] << 8) | color3to8bits9938[(c >> 2) & 0x7];
        }
        return colors8bit9938Values;
    };

    this.getColors9bit9938Values = function() {
        if (!colors9bit9938Values) {
            colors9bit9938Values = new Uint32Array(512);
            for (var c = 0; c < 512; ++c)
                colors9bit9938Values[c] = 0xff000000 | (color3to8bits9938[c & 0x7] << 16) | (color3to8bits9938[c >> 6] << 8) | color3to8bits9938[(c >>> 3) & 0x7];
        }
        return colors9bit9938Values;
    };

    this.getColors8bit9990Values = function(ysEnabled) {
        if (!colors8bit9990Values) {
            colors8bit9990Values = new Uint32Array(256);
            for (var c = 0; c < 256; ++c)
                colors8bit9990Values[c] = 0xff000000 | (color2to8bits9990[c & 0x3] << 16) | (color3to8bits9990[c >> 5] << 8) | color3to8bits9990[(c >> 2) & 0x7];
        }
        colors8bit9990Values[0] = ysEnabled ? 0x00000000 : 0xff000000;
        return colors8bit9990Values;
    };

    this.getColors16bitValues = function() {
        if (!colors16bitValues) {
            colors16bitValues = new Uint32Array(65536);
            for (var c = 0; c < 65536; ++c)
                colors16bitValues[c] = (c < 32768 ? 0xff000000 : 0x00000000) | (color5to8bits[c & 0x1f] << 16) | (color5to8bits[(c >> 10) & 0x1f] << 8) | color5to8bits[(c >> 5) & 0x1f];
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