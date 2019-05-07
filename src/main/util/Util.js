// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Util = new function() {
"use strict";

    this.log = function(str) {
        var args = [ ">> wmsx:" ];
        Array.prototype.push.apply(args, arguments);
        console.log.apply(console, args);
        //console.log(str);
        // this.logs.push(str);
    };
    this.warning = function(str) {
        var args = [ ">> wmsx Warning:" ];
        Array.prototype.push.apply(args, arguments);
        console.warn.apply(console, args);
        //console.warn(str);
        // this.logs.push(str);
    };
    this.error = function(str) {
        var args = [ ">> wmsx Error:" ];
        Array.prototype.push.apply(args, arguments);
        console.error.apply(console, args);
        //console.error(str);
        // this.logs.push(str);
    };

    this.message = function(str) {
        console.info(str);
        alert(str);
    };

    this.asNormalArray = function(arr, pos, length) {
        if (!length && arr instanceof Array) return arr;
        return length ? this.arrayCopy(arr, pos, new Array(length)) : this.arrayCopy(arr, 0, new Array(arr.length));
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
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Array)(len);      // Preserve dest type
        for(var i = 0; i < len; i = i + 1)
            ints[i] = (str.charCodeAt(i) & 0xff);
        return ints;
    };

    this.byteStringToSignedInt8BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        var len = str.length;
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Array)(len);       //  Preserve dest type
        for(var i = 0; i < len; i = i + 1) {
            var val = str.charCodeAt(i) & 0xff;
            ints[i] = val < 128 ? val : val - 256;
        }
        return ints;
    };

    // Only 16 bit values
    this.int16BitArrayToByteString = function(ints, start, length) {
        if (ints === null || ints == undefined) return ints;
        if (start === undefined) start = 0;
        if (length === undefined) length = ints.length - start;
        var str = "";
        for(var i = start, finish = start + length; i < finish; i = i + 1)
            str += String.fromCharCode(ints[i] & 0xff) + String.fromCharCode((ints[i] >> 8) & 0xff);
        return str;
    };

    this.byteStringToInt16BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        var len = (str.length / 2) | 0;
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Array)(len);      // Preserve dest type
        for(var i = 0, s = 0; i < len; i = i + 1, s = s + 2)
            ints[i] = (str.charCodeAt(s) & 0xff) | ((str.charCodeAt(s + 1) & 0xff) << 8);
        return ints;
    };

    this.byteStringToSignedInt16BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        var len = (str.length / 2) | 0;
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Array)(len);      // Preserve dest type
        for(var i = 0, s = 0; i < len; i = i + 1, s = s + 2) {
            var val = (str.charCodeAt(s) & 0xff) | ((str.charCodeAt(s + 1) & 0xff) << 8);
            ints[i] = val < 32768 ? val : val - 65536;
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
        var ints = (dest && dest.length === len) ? dest : new (dest ? dest.constructor : Array)(len);      // Preserve dest type
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

    this.compressInt8BitArrayToStringBase64 = function(arr, length, from) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        if (!length) length = arr.length;
        from |= 0;
        if (from || length < arr.length)
            return btoa(this.int8BitArrayToByteString(JSZip.compressions.DEFLATE.compress(arr.slice(from, from + length))));
        else
            return btoa(this.int8BitArrayToByteString(JSZip.compressions.DEFLATE.compress(arr)));
    };

    this.uncompressStringBase64ToInt8BitArray = function(str, dest, diffSize, constr, destPos) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        var res = JSZip.compressions.DEFLATE.uncompress(atob(str));
        if (dest && (diffSize || dest.length === res.length))
            return this.arrayCopy(res, 0, dest, destPos);                                                                    // Preserve dest
        else
            return this.arrayCopy(res, 0, new (constr ? constr : dest ? dest.constructor : Array)(res.length), destPos);     // Use constr or preserve dest type
    };

    this.storeInt16BitArrayToStringBase64 = function(arr) {
        if (arr === null || arr === undefined) return arr;
        if (arr.length === 0) return "";
        return btoa(this.int16BitArrayToByteString(arr));
    };

    this.restoreStringBase64ToInt16BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return this.byteStringToInt16BitArray(atob(str), dest);
    };

    this.restoreStringBase64ToSignedInt16BitArray = function(str, dest) {
        if (str === null || str === undefined) return str;
        if (str == "null") return null; if (str == "undefined") return undefined;
        if (str == "") return [];
        return this.byteStringToSignedInt16BitArray(atob(str), dest);
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
        if (num === null || num === undefined) return num;
        var res = num.toString(16).toUpperCase();
        if (num >= 0 && (res.length % 2)) return "0" + res;
        else return res;
    };

    this.toHex4 = function(num) {
        if (num === null || num === undefined) return num;
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

    this.arrayFindIndex = function(arr, pred) {
        if (arr.findIndex) return arr.findIndex(pred);
        for (var i = 0, len = arr.length; i < len; ++i)
            if (pred(arr[i], i, arr)) return i;
        return -1;
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

    this.checkContentIsLHA = function (content) {
        var cmp = content.slice(2, 7);
        var cmpStr = String.fromCharCode.apply(this, cmp);
        if (content && /-lh.-/.exec(cmpStr)) {
            try {
                return new JSLha(content);
            } catch (ez) {
                // Error decompressing files. Abort
            }
        }
        return null;
    };

    this.getLHAFilesSorted = function (lha) {
        var files = lha.file(/.+/);
        files.sort(sortByName);
        return files;
    };

    this.checkContentIsGZIP = function (content) {
        if (!content || content[0] !== 0x1f || content[1] !== 0x8b || content[2] !== 0x08) return null;      // GZ Deflate signature

        try {
            var flags = content[3];
            var fHCRC =    flags & 0x02;
            var fEXTRA =   flags & 0x04;
            var fNAME =    flags & 0x08;
            var fCOMMENT = flags & 0x10;

            // Skip MTIME, XFL and OS fields, no use...
            var pos = 10;

            // Skip bytes of optional content
            if (fEXTRA) {
                var xLEN = content[pos++] | (content[pos++] << 8);
                pos += xLEN;
            }
            if (fNAME) while (content[pos++] !== 0);
            if (fCOMMENT) while (content[pos++] !== 0);
            if (fHCRC) pos += 2;

            return JSZip.compressions.DEFLATE.uncompress(content.slice(pos, content.length - 8));
        } catch (ez) {
            return null;      // Error decompressing file. Abort
        }
    };

    this.leafFilename = function(fileName) {
        return (((fileName && fileName.indexOf("/") >= 0) ? fileName.split("/").pop() : fileName) || "").trim();
    };

    this.leafFilenameNoExtension = function(fileName) {
        var name = this.leafFilename(fileName);
        var period = name.lastIndexOf(".");
        return period <= 0 ? name : name.substr(0, period).trim();
    };

    this.leafFilenameOnlyExtension = function(fileName) {
        var name = this.leafFilename(fileName);
        var period = name.lastIndexOf(".");
        return period <= 0 ? "" : name.substr(period + 1).trim();
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
        if (this.browserInfoAvailable) return this.browserInfoAvailable;

        var ua = navigator.userAgent;
        var temp;
        var m = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(m[1])) {
            temp = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return this.browserInfoAvailable = { name:'IE', version: (temp[1] || '') };
        }
        if (m[1] === 'Chrome') {
            temp = ua.match(/\bOPR\/(\d+)/);
            if (temp != null) return this.browserInfoAvailable = { name:'Opera', version: temp[1] };
        }
        m = m[2] ? [m[1], m[2]]: [ navigator.appName, navigator.appVersion, '-?' ];
        if ((temp = ua.match(/version\/(\d+)/i)) != null) m.splice(1, 1, temp[1]);
        var name = m[0].toUpperCase();
        return this.browserInfoAvailable = {
            name: this.isIOSDevice() || name === "NETSCAPE" ? "SAFARI" : name,
            version: m[1]
        };
    };

    this.userLanguage = function() {
        return ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage || "en-US").trim();
    };

    this.browserCurrentURL = function () {
        return window.location.origin + window.location.pathname;
    };

    this.isOfficialHomepage = function () {
        var loc = window.location;
        return loc
            && (loc.hostname.toLowerCase() === "webmsx.org")
            && (loc.port === "" || loc.port === "80");
    };

    this.isTouchDevice = function() {
        // Touch Device detected or Touch Mode forced
        return WMSX.TOUCH_MODE > 0 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    };

    this.isMobileDevice = function() {
        return this.isTouchDevice() && (/android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i).test(navigator.userAgent);
    };

    this.isIOSDevice = function() {
        return (/ipad|iphone|ipod/i).test(navigator.userAgent);
    };

    this.isBrowserStandaloneMode = function() {
        return navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
    };

    this.onTapOrMouseDown = function(element, handler) {
        this.addEventsListener(element, this.isTouchDevice() ? "touchstart mousedown" : "mousedown", handler);
    };

    this.onTapOrMouseDownWithBlock = function(element, handler) {
        function onTapOrMouseDown(e) {
            handler(e);
            return blockEvent(e);
        }
        this.addEventsListener(element, this.isTouchDevice() ? "touchstart mousedown" : "mousedown", onTapOrMouseDown);
    };

    this.onTapOrMouseUpWithBlock = function(element, handler) {
        function onTapOrMouseUp(e) {
            handler(e);
            return blockEvent(e);
        }
        this.addEventsListener(element, this.isTouchDevice() ? "touchstart mouseup" : "mouseup", onTapOrMouseUp);
    };

    // Will fire event 2 times (at touch start and end) for needsUIG targets
    this.onTapOrMouseDownWithBlockUIG = function(element, handler) {
        function onTapOrMouseDownUIG(e) {
            if (e.type === "touchend" && !e.target.wmsxNeedsUIG) return blockEvent(e);
            // If User Initiated Gesture needed on TARGET, signal if starting or ending touch
            var uigStart = e.type === "touchstart" && e.target.wmsxNeedsUIG;
            var uigEnd = e.type === "touchend";
            // Fire original event and block
            handler(e, uigStart, uigEnd);
            return blockEvent(e);
        }
        this.addEventsListener(element, this.isTouchDevice() ? "touchstart touchend mousedown" : "mousedown", onTapOrMouseDownUIG);
    };

    function blockEvent(e) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        return false;
    }
    this.blockEvent = blockEvent;

    this.addEventsListener = function(element, events, handler, capture) {
        events = events.split(" ");
        for (var i = 0; i < events.length; ++i)
            if (events[i]) element.addEventListener(events[i], handler, capture);
    };

    this.removeEventsListener = function(element, events, handler, capture) {
        events = events.split(" ");
        for (var i = 0; i < events.length; ++i)
            if (events[i]) element.removeEventListener(events[i], handler, capture);
    };

    this.insertCSS = function(css) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        document.head.appendChild(style);
    };

    this.scaleToFitParentHeight = function(element, parent, bottomOffset) {
        var availHeight = parent.clientHeight - bottomOffset - 20;      //  bar - tolerance
        var height = element.clientHeight;
        var scale = height < availHeight ? 1 : availHeight / height;
        element.style.transform = "translateY(-" + ((bottomOffset / 2) | 0) + "px) scale(" + scale.toFixed(4) + ")";

        // console.log("SCALE availHeight: " + availHeight + ", height: " + height + ", final: " + height * scale);
    };

    this.scaleToFitParentWidth = function(element, parent, horizMargin) {
        var availWidth = parent.clientWidth - (horizMargin * 2 | 0);      //  margins
        var width = element.clientWidth;
        var scale = width < availWidth ? 1 : availWidth / width;
        var finaWidth = (width * scale) | 0;
        var left = Math.floor((availWidth - finaWidth) / 2 + horizMargin);
        element.style.left = "" + left + "px";
        element.style.right = "initial";
        element.style.transform = "scale(" + scale.toFixed(4) + ")";

        // console.log("SCALE availWidth: " + availWidth + ", width: " + width + ", final: " + width * scale + ", left: " + left);
    };

    this.log2 = function(x) {
        return Math.log(x) / Math.log(2);
    };

    this.exp2 = function(x) {
        return Math.pow(2, x);
    };

    this.performanceNow = function() {
        return this.performanceNow.startOffset ? Date.now() - this.performanceNow.startOffset : window.performance.now();
    };

};

if (!window.performance || !window.performance.now) wmsx.Util.performanceNow.startOffset = Date.now();