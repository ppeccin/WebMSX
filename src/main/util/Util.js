// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Util = new function() {
"use strict";

    this.log = function(str) {
        console.log(">> wmsx: " + str);
    };

    this.message = function(str) {
        console.log(str);
        alert(str);
    };

    this.arrayFill = function(arr, val, from, to) {
        if (arr.fill) return arr.fill(val, from, to);       // polyfill for TypedArrays or Arrays with native fill
        if (from === undefined) from = 0;
        for (var i = (to === undefined ? arr.length : to) - 1; i >= from; i = i - 1)
            arr[i] = val;
        return arr;
    };

    this.arrayCopy = function(src, srcPos, dest, destPos, length) {
        destPos = destPos || 0;
        var finalSrcPos = length ? srcPos + length : src.length;
        while(srcPos < finalSrcPos)
            dest[destPos++] = src[srcPos++];
        return dest;
    };

    this.arrayAdd = function(arr, element) {
        arr[arr.length] = element;
        return arr;
    };

    this.arrayRemoveAllElement = function(arr, element) {
        var i;
        while ((i = arr.indexOf(element)) >= 0) {
            arr.splice(i, 1);
        }
        return arr;
    };

    this.arraysConcatAll = function(arrs) {
        var len = 0;
        for (var i = 0; i < arrs.length; ++i) len += arrs[i].length;
        var res = new (arrs[0].constructor)(len);   // Same type as the first array
        var pos = 0;
        for (i = 0; i < arrs.length; ++i) {
            this.arrayCopy(arrs[i], 0, res, pos);
            pos += arrs[i].length;
        }
        return res;
    };

    // Only 8 bit values
    this.int8BitArrayToByteString = function(ints, start, length) {
        if (ints === null || ints == undefined) return ints;
        if (start === undefined) start = 0;
        if (length === undefined) length = ints.length - start;
        var str = "";
        for(var i = start, finish = start + length; i < finish; i = i + 1)
            str += String.fromCharCode(ints[i] & 0xff);
        return str;
    };

    this.byteStringToInt8BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        var len = str.length;
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Uint8Array)(len);      // Preserve dest type
        for(var i = 0; i < len; i = i + 1)
            ints[i] = (str.charCodeAt(i) & 0xff);
        return ints;
    };

    this.byteStringToSignedInt8BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        var len = str.length;
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Int8Array)(len);       //  Preserve dest type
        for(var i = 0; i < len; i = i + 1) {
            var val = str.charCodeAt(i) & 0xff;
            ints[i] = val < 128 ? val : val - 256;
        }
        return ints;
    };

    // Only 32 bit values
    this.int32BitArrayToByteString = function(ints, start, length) {
        if (ints === null || ints == undefined) return ints;
        if (start === undefined) start = 0;
        if (length === undefined) length = ints.length - start;
        var str = "";
        for(var i = start, finish = start + length; i < finish; i = i + 1)
            str += String.fromCharCode(ints[i] & 0xff) + String.fromCharCode((ints[i] >> 8) & 0xff) + String.fromCharCode((ints[i] >> 16) & 0xff) + String.fromCharCode((ints[i] >> 24) & 0xff);
        return str;
    };

    this.byteStringToInt32BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        var len = (str.length / 4) | 0;
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Uint32Array)(len);      // Preserve dest type
        for(var i = 0, s = 0; i < len; i = i + 1, s = s + 4)
            ints[i] = (str.charCodeAt(s) & 0xff) | ((str.charCodeAt(s + 1) & 0xff) << 8) | ((str.charCodeAt(s + 2) & 0xff) << 16) | ((str.charCodeAt(s + 3) & 0xff) << 24);
        return ints;
    };

    this.storeInt8BitArrayToStringBase64 = function(arr) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        return btoa(this.int8BitArrayToByteString(arr));
    };

    this.restoreStringBase64ToInt8BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return this.byteStringToInt8BitArray(atob(str), dest);
    };

    this.restoreStringBase64ToSignedInt8BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return this.byteStringToSignedInt8BitArray(atob(str), dest);
    };

    this.compressInt8BitArrayToStringBase64 = function(arr, length) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        if (length < arr.length)
            return btoa(this.int8BitArrayToByteString(JSZip.compressions.DEFLATE.compress(arr.slice(0, length))));
        else
            return btoa(this.int8BitArrayToByteString(JSZip.compressions.DEFLATE.compress(arr)));
    };

    this.uncompressStringBase64ToInt8BitArray = function(str, dest, diffSize) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        var res = JSZip.compressions.DEFLATE.uncompress(atob(str));
        if (dest && (diffSize || dest.length === res.length))
            return this.arrayCopy(res, 0, dest);                                                        // Preserve dest
        else
            return this.arrayCopy(res, 0, new (dest ? dest.constructor : Uint8Array)(res.length));      // Preserve dest type
    };

    this.storeInt32BitArrayToStringBase64 = function(arr) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        return btoa(this.int32BitArrayToByteString(arr));
    };

    this.restoreStringBase64ToInt32BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return this.byteStringToInt32BitArray(atob(str), dest);
    };

    this.compressStringToStringBase64 = function(str) {
        if (str === null || str === undefined) return str;
        if (str.length === 0) return str;
        return btoa(this.int8BitArrayToByteString(JSZip.compressions.DEFLATE.compress(str)));
    };

    this.uncompressStringBase64ToString = function(str) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return str;
        return this.int8BitArrayToByteString(JSZip.compressions.DEFLATE.uncompress(atob(str)));
    };

    this.toHex2 = function(num) {
        var res = num.toString(16).toUpperCase();
        if (num >= 0 && (res.length % 2)) return "0" + res;
        else return res;
    };

    this.toHex4 = function(num) {
        var res = num.toString(16).toUpperCase();
        if (num < 0) return res;
        switch (res.length) {
            case 4:
                return res;
            case 3:
                return "0" + res;
            case 2:
                return "00" + res;
            case 1:
                return "000" + res;
            default:
                return res;
        }
    };

    this.escapeHtml = function(html) {
        return html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\//g,"&#047;")
            .replace(/\?/g,"&#063;")
            .replace(/\-/g, "&#045;")
            .replace(/\|/g, "&#0124;");
    };

    this.arrayFind = function(arr, pred) {
        if (arr.find) return arr.find(pred);
        for (var i = 0, len = arr.length; i < len; ++i)
            if (pred(arr[i], i, arr)) return arr[i];
    };

    this.arrayIndexOfSubArray = function(arr, subarr, fromIndex, step) {
        var subLen = subarr.length;
        var len = arr.length;
        var st = step || 1;

        Loop: for (var i = fromIndex; (i >= 0) && (i < len); i += st) {
            for (var j = 0; j < subLen; j = j + 1)
                if (arr[i + j] !== subarr[j])
                    continue Loop;
            return i;
        }
        return -1;
    };

    this.stringCountOccurrences = function(str, char) {
        var total = 0;
        for (var i = 0, len = str.length; i < len; ++i)
            if (str[i] == char) ++total;
        return total;
    };

    this.stringStartsWith = function(str, start) {
        if (str.startsWith) return str.startsWith(start);
        else return str.substr(0, start.length) === start;
    };

    this.stringEndsWith = function(str, end) {
        if (str.endsWith) return str.endsWith(end);
        else return str.substr(str.length - end.length) === end;
    };

    this.checkContentIsZIP = function(content) {
        if (content && content[0] === 0x50 && content[1] === 0x4b)      // PK signature
            try {
                return new JSZip(content);
            } catch(ez) {
                // Error decompressing files. Abort
            }
        return null;
    };

    this.getZIPFilesSorted = function(zip) {
        var files = zip.file(/.+/);
        files.sort(sortByName);
        return files;
    };

    function sortByName(a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    }

    this.dump = function(arr, from, chunk, quant) {
        var res = "";
        var p = from || 0;
        quant = quant || 1;
        for(var i = 0; i < quant; i++) {
            for(var c = 0; c < chunk; c++) {
                var val = arr[p++];
                res = res + (val != undefined ? val.toString(16, 2) + " " : "? ");
            }
            res = res + "   ";
        }

        console.log(res);
    };

    this.dumpSlot = function(slot, from, chunk, quant) {
        var res = "";
        var p = from || 0;
        quant = quant || 1;
        for(var i = 0; i < quant; i++) {
            for(var c = 0; c < chunk; c++) {
                var val = slot.read(p++);
                res = res + (val != undefined ? val.toString(16, 2) + " " : "? ");
            }
            res = res + "   ";
        }

        console.log(res);
    };

    this.browserInfo = function() {
        var ua = navigator.userAgent;
        var temp;
        var m = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(m[1])) {
            temp = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return { name:'IE', version: (temp[1] || '') };
        }
        if (m[1] === 'Chrome') {
            temp = ua.match(/\bOPR\/(\d+)/);
            if (temp != null) return { name:'Opera', version: temp[1] };
        }
        m = m[2] ? [m[1], m[2]]: [ navigator.appName, navigator.appVersion, '-?' ];
        if ((temp = ua.match(/version\/(\d+)/i)) != null) m.splice(1, 1, temp[1]);
        return {
            name: m[0].toUpperCase(),
            version: m[1]
        };
    };

};
