// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMKeyboard = function(hub, keyForwardControls) {
"use strict";

    var self = this;

    function init() {
        setDefaultKeyboard();
    }

    this.connect = function(pControllersSocket, pBIOSSocket) {
        controllersSocket = pControllersSocket;
        biosSocket = pBIOSSocket;
    };

    this.connectPeripherals = function(pScreen) {
        monitor = pScreen.getMonitor();
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.typeString = function(str) {
        var bios = biosSocket.inserted();
        if (bios) bios.getKeyboardExtension().typeString(str);
    };

    this.cancelTypeString = function() {
        var bios = biosSocket.inserted();
        if (bios) bios.getKeyboardExtension().cancelTypeString();
    };

    this.controllersClockPulse = function() {
        if (turboFireSpeed)
            if (--turboFireFlipClockCount <= 0) turboFireFlipClockCount = turboFireSpeed;
    };

    this.readKeyboardPort = function(row) {
        if (turboFireSpeed)
            return row === 8
                ? keyboardRowValues[8] | (turboFireFlipClockCount > 2)
                : keyboardRowValues[row];
        else
            return keyboardRowValues[row];
    };

    this.readJapaneseKeyboardLayoutPort = function() {
        return japanaseKeyboardLayoutPortValue;
    };

    this.setKeyInputElement = function(element) {
        //element.addEventListener("keypress", this.keyPress);
        element.addEventListener("keydown", this.keyDown);
        element.addEventListener("keyup", this.keyUp);
    };

    this.toggleHostKeyboards = function() {
        var next = (wmsx.BuiltInKeyboards.all.indexOf(currentKeyboard) + 1) || 0;
        if (next >= wmsx.BuiltInKeyboards.all.length) next = 0;
        currentKeyboard = wmsx.BuiltInKeyboards.all[next];
        updateMapping();
        monitor.showOSD("Host Keyboard: " + currentKeyboard, true);
    };

    this.setTurboFireSpeed = function(speed) {
        turboFireSpeed = speed ? speed * speed + 3 : 0;
        turboFireFlipClockCount = 0;
    };

    this.releaseControllers = function() {
        keyStateMap = {};
        extraModifiersActive.clear();
        wmsx.Util.arrayFill(keyboardRowValues, 0xff);
    };

    this.resetControllers = function() {
        this.releaseControllers();
    };

    this.getKeyMapping = function(key) {
        return mapping[key];
    };

    this.customizeKey = function (key, vk) {
        // Add Custom keyboard?
        if (wmsx.BuiltInKeyboards.all.indexOf(currentKeyboard) >= 0)
            addCustomKeyboard();

        mapping[key] = [ vk ];
        updateCodeMaps();
    };

    this.keyPress = function(e) {
        console.log("Keyboard KeyPress: " + e.keyCode + " : " + String.fromCharCode(e.charCode));
        window.P = e;
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    this.keyDown = function(e) {
        //console.log("Keyboard KeyDown keyCode: " + e.keyCode + ", key: " + e.key);
        //window.D = e;

        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();

        if (!processKeyEvent(e.keyCode, true, e.altKey, e.ctrlKey)) keyForwardControls.keyDown(e);

        return false;
    };

    this.keyUp = function(e) {
        //console.log("Keyboard KeyUp: " + e.keyCode);

        if (processKeyEvent(e.keyCode, false, e.altKey, e.ctrlKey)) {
            e.returnValue = false;  // IE
            e.preventDefault();
            e.stopPropagation();
            return false;
        } else
            return keyForwardControls.keyUp(e);
    };

    var processKeyEvent = function(keyCode, press, alt, ctrl) {
        var key = keyForEvent(keyCode, alt, ctrl);
        if (!key) return false;
        //if (press) console.log("DOMKey: " + key + ", fromCharCode: " + String.fromCharCode(keyCode));

        var state = keyStateMap[key];
        if (state === undefined || (state !== press)) {
            keyStateMap[key] = press;
            if (press) {
                keyboardRowValues[msxKeys[key][0]] &= ~(1 << msxKeys[key][1]);
                if (turboFireSpeed && key === "SPACE") turboFireFlipClockCount = 3;
            } else {
                keyboardRowValues[msxKeys[key][0]] |= (1 << msxKeys[key][1]);
            }
        }
        return true;
    };

    // TODO Shift+CODE+DEAD not being detected
    var keyForEvent = function(keyCode, alt, ctrl) {
        return alt
            ? ctrl
                ? ctrlAltCodeMap[keyCode] || altCodeMap[keyCode]
                : altCodeMap[keyCode]
            : normalCodeMap[keyCode];
    };

    var updateMapping = function() {
        mapping = {};
        var map = wmsx.BuiltInKeyboards[currentKeyboard];
        for (var k in wmsx.KeyboardKeys)
            mapping[k] = !map[k] ? null : map[k].constructor === Array ? map[k] : [ map[k] ];
        updateCodeMaps();
    };

    var updateCodeMaps = function() {
        normalCodeMap = {};
        altCodeMap = {};
        ctrlAltCodeMap = {};
        for (var k in mapping) {
            if (!mapping[k]) continue;
            if(mapping[k].constructor === Array) {
                for (var i = 0; i < mapping[k].length; ++i) normalCodeMap[mapping[k][i].c] = k;
            } else {
                normalCodeMap[mapping[k].c] = k;
            }
        }
    };

    function setDefaultKeyboard() {
        currentKeyboard = availableKeyboards[0];
        var hostLang = wmsx.Util.userLanguage();
        for (var k = 0; k < availableKeyboards.length; ++k)
            if (hostLang.indexOf(availableKeyboards[k]) === 0) {
                currentKeyboard = availableKeyboards[k];
                break;
            }
        updateMapping();
    }

    function addCustomKeyboard() {

    }

    this.applyPreferences = function() {
    };


    var msxKeys = wmsx.KeyboardKeys;

    var availableKeyboards = wmsx.BuiltInKeyboards.all;
    var currentKeyboard;

    var controllersSocket;
    var biosSocket;
    var monitor;

    var keyStateMap = {};
    var extraModifiersActive = new Set();
    var keyboardRowValues = wmsx.Util.arrayFill(new Array(16), 0xff);            // only 12 rows used

    var japanaseKeyboardLayoutPortValue = WMSX.KEYBOARD_JAPAN_LAYOUT !== 0 ? 0x40 : 0;

    var mapping;
    var normalCodeMap;
    var altCodeMap;
    var ctrlAltCodeMap;

    var turboFireSpeed = 0, turboFireFlipClockCount = 0;


    init();

};