// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Util = new function() {

    this.log = function(str) {
        console.log(">> wmsx: " + str);
    };

    this.message = function(str) {
        alert(str);
    };

    this.arrayCount = function(arr, predicate) {
        var count = 0;
        for (var i = arr.length - 1; i >= 0; i--)
            if (predicate(arr[i])) count++;
        return count;
    };

    this.arrayAverage = function(arr) {
        var total = 0;
        for (var i = arr.length - 1; i >= 0; i--) total += arr[i];
        return total / arr.length;
    };

    this.arrayFill = function(arr, val, len) {
        var i = len || arr.length;
        while(i--)
            arr[i] = val;
        return arr;
    };

    this.arrayCopy = function(src, srcPos, dest, destPos, length) {
        destPos = destPos || 0;
        var finalSrcPos = length ? srcPos + length : src.length;
        while(srcPos < finalSrcPos)
            dest[destPos++] = src[srcPos++];
    };

    this.arrayHasElement = function(arr, element) {
        return arr.indexOf(element) >= 0;
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

    // Only 8 bit values
    this.uInt8ArrayToByteString = function(ints, start, length) {
        if (ints === null || ints == undefined) return ints;
        if (start === undefined) start = 0;
        if (length === undefined) length = ints.length;
        var str = "";
        for(var i = start, finish = start + length; i < finish; i++)
            str += String.fromCharCode(ints[i] & 0xff);
        return str;
    };

    this.byteStringToUInt8Array = function(str, totalLength, start, filler) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (start === undefined) start = 0;
        if (totalLength === undefined) totalLength = str.length;
        var ints = new Array(totalLength);
        if (filler !== undefined) this.arrayFill(ints, filler);
        var len = str.length > totalLength ? totalLength : str.length;
        for(var i = 0; i < len; i++)
            ints[start + i] = (str.charCodeAt(i) & 0xff);
        return ints;
    };

    this.storeArrayToStringBase64 = function(arr) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        return btoa(this.uInt8ArrayToByteString(arr));
    };

    this.restoreStringBase64ToArray = function(str) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return this.byteStringToUInt8Array(atob(str));
    };

    this.compressArrayToStringBase64 = function(arr) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        return btoa(this.uInt8ArrayToByteString(JSZip.compressions.DEFLATE.compress(arr)));
    };

    // Returns UInt8Array. Good?
    this.uncompressStringBase64ToArray = function(str) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return JSZip.compressions.DEFLATE.uncompress(atob(str));
    };

    this.compressStringToStringBase64 = function(str) {
        if (str === null || str === undefined) return str;
        if (str.length === 0) return str;
        return btoa(this.uInt8ArrayToByteString(JSZip.compressions.DEFLATE.compress(str)));
    };

    this.uncompressStringBase64ToString = function(str) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return str;
        return this.uInt8ArrayToByteString(JSZip.compressions.DEFLATE.uncompress(atob(str)));
    };

    this.toHex2 = function(num) {
        var res = num.toString(16).toUpperCase();
        if (num > 0 && (res.length % 2)) return "0" + res;
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

    this.arrayIndexOfSubArray = function(arr, subarr, fromIndex, step) {
        var subLen = subarr.length;
        var len = arr.length;
        var st = step || 1;

        Loop: for (var i = fromIndex; (i >= 0) && (i < len); i += st) {
            for (var j = 0; j < subLen; j++)
                if (arr[i + j] !== subarr[j])
                    continue Loop;
            return i;
        }
        return -1;
    };

    this.dump = function(arr, from, quant) {
        var res = "";
        var i;
        from = from || 0;
        var to = from + (quant || (arr.length - from));
        for(i = from; i < to; i++) {
            res = res + i.toString(16, 2) + " ";
        }
        res += "\n";
        for(i = from; i < to; i++) {
            var val = arr[i];
            res = res + (val != undefined ? val.toString(16, 2) + " " : "? ");
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

//// Only add setZeroTimeout to the window object, and hide everything
//// else in a closure.
//(function() {
//    var timeouts = [];
//    var messageName = "zero-timeout-message";
//
//    // Like setTimeout, but only takes a function argument.  There's
//    // no time argument (always zero) and no arguments (you have to
//    // use a closure).
//    function setZeroTimeout(fn) {
//        timeouts.push(fn);
//        window.postMessage(messageName, "*");
//    }
//
//    function handleMessage(event) {
//        if (event.source == window && event.data == messageName) {
//            event.stopPropagation();
//            if (timeouts.length > 0) {
//                var fn = timeouts.shift();
//                fn();
//            }
//        }
//    }
//
//    window.addEventListener("message", handleMessage, true);
//
//    // Add the one thing we want added to the window object.
//    window.setZeroTimeout = setZeroTimeout;
//})();



