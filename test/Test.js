
function lumi(val) {

    var r = val & 255;
    var g = (val >> 8) & 255;
    var b = (val >> 16) & 255;

    return (r+g+b) / 3;

}

function bw(pal) {
    var p = wmsx.ColorCache.v9918PalettesValues[pal];
    var res = "";
    for (var i in p) {
        var v = wmsx.Util.toHex2(Math.round(lumi(p[i])));
        res += "0xff" + v + v + v + ", ";
    }
    return res;
}

function bwy(pal) {
    var p = wmsx.ColorCache.v9918PalettesValues[pal];
    var res = "";
    for (var i in p) {
        var val = p[i];

        var r = val & 255;
        var g = (val >> 8) & 255;
        var b = (val >> 16) & 255;

        var y = (0.2126 * r + 0.7152 * g + 0.0722 * b);

        var v = wmsx.Util.toHex2(Math.round(y));

        res += "0xff" + v + v + v + ", ";
    }

    return res;
}

function green(pal) {
    var p = wmsx.ColorCache.v9918PalettesValues[pal];
    var res = "";
    for (var i in p) {
        var g = wmsx.Util.toHex2(Math.trunc(lumi(p[i])));
        var c = wmsx.Util.toHex2(Math.trunc(lumi(p[i])/3));
        res += "0xff" + c + g + c + ", ";
    }
    return res;
}

