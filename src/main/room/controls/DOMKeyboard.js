// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMKeyboard = function(hub, keyForwardControls) {
"use strict";

    var self = this;

    function init() {
        setDefaultKeyboard();
    }

    this.connect = function(pControllersSocket, pBIOSSocket) {
        biosSocket = pBIOSSocket;
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
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

    this.toggleHostKeyboards = function() {
        var next = (availableKeyboards.indexOf(currentKeyboard) + 1) || 0;
        if (next >= availableKeyboards.length) next = 0;
        this.setKeyboard(availableKeyboards[next]);
        screen.showOSD("Host Keyboard: " + currentKeyboard, true);
    };

    this.getKeyboard = function() {
        return currentKeyboard;
    };

    this.setKeyboard = function(keyboard) {
        currentKeyboard = keyboard;
        updateMapping();
        if (screen) screen.keyboardSettingsStateUpdate();
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

    this.clearKey = function (key) {
        // Ignore if key is already clear
        if (mapping[key].length === 0) return;

        if (!customKeyboards[currentKeyboard]) setCustomKeyboard();

        mapping[key].length = 0;
        updateCodeMap();
    };

    this.customizeKey = function (key, vk) {
        // Ignore if key is already mapped
        if (keyCodeMap[vk.c] === key) return;

        if (!customKeyboards[currentKeyboard]) setCustomKeyboard();

        // Search for keys mapped to this vk, to remove the mapping
        for (var k in mapping) {
            var map = mapping[k];
            if (map.length === 0) continue;
            var i;
            while ((i = wmsx.Util.arrayFindIndex(map, function(aVK) { return aVK.c === vk.c; })) >= 0)
                map.splice(i, 1);
        }

        // Add new mapping, max of X keys
        map = mapping[key];
        if (map.length >= MAX_KEY_MAPPED) map.splice(0, map.length - (MAX_KEY_MAPPED - 1));
        map.push(vk);

        updateCodeMap();
    };

    this.processKey = function(code, press) {
        var msxKey = keyCodeMap[code];                                      // First try, before giving a chance to other controls in the chain

        //console.log("Key " + (press ? "Press" : "Release") + ", code: " + code.toString(16) + ", msxKey: " + msxKey);

        // Try other controls if
        if (!msxKey) {
            if (keyForwardControls.processKey(code, press)) return;

            msxKey = keyCodeMap[code & IGNORE_ALL_MODIFIERS_MASK];          // Second try, ignore modifiers, only if no other controls were found

            //console.log("2 Key " + (press ? "Press" : "Release") + ", code: " + code.toString(16) + ", msxKey: " + msxKey);
        }

        if (msxKey) {
            // Special case for Portuguese "Alt Gr" key, which is LControl+RAlt. Release MSX CONTROL key if pressed, so AltGr can be used as normal RAlt
            if (code === RAltKeyCode && keyStateMap["CONTROL"]) {
                keyboardRowValues[msxKeys["CONTROL"][0]] |= (1 << msxKeys["CONTROL"][1]);
                keyStateMap["CONTROL"] = false;
            }

            // Update key matrix bits
            var state = keyStateMap[msxKey];
            if (state === undefined || (state !== press)) {
                keyStateMap[msxKey] = press;
                if (press) {
                    keyboardRowValues[msxKeys[msxKey][0]] &= ~(1 << msxKeys[msxKey][1]);
                    if (turboFireSpeed && msxKey === "SPACE") turboFireFlipClockCount = 3;
                } else {
                    keyboardRowValues[msxKeys[msxKey][0]] |= (1 << msxKeys[msxKey][1]);
                }
            }
        }
    };

    var updateMapping = function() {
        var map = customKeyboards[currentKeyboard] || wmsx.BuiltInKeyboards[currentKeyboard];
        for (var k in wmsx.KeyboardKeys)
            mapping[k] = !map[k] ? [] : map[k].constructor === Array ? map[k] : [ map[k] ];
        updateCodeMap();
    };

    var updateCodeMap = function() {
        keyCodeMap = {};
        for (var k in mapping) {
            if (mapping[k].length === 0) continue;
            for (var i = 0; i < mapping[k].length; ++i) keyCodeMap[mapping[k][i].c] = k;
        }
    };

    function setDefaultKeyboard() {
        var keyboard = availableKeyboards[0];
        var hostLang = wmsx.Util.userLanguage();
        for (var k = 0; k < availableKeyboards.length; ++k)
            if (hostLang.indexOf(availableKeyboards[k]) === 0) {
                keyboard = availableKeyboards[k];
                break;
            }
        self.setKeyboard(keyboard);
    }

    function setCustomKeyboard() {
        var customName = currentKeyboard === "Default" ? "CUSTOM" : currentKeyboard + CUSTOM_KEYBOARD_SUFFIX;
        // Copy current mapping to new Custom Keyboard if not yet available
        if (!customKeyboards[customName]) {
            customKeyboards[customName] = {};
            availableKeyboards.push(customName);
        }

        // Redefine mappings based on current
        var custom = customKeyboards[customName];
        for (var k in mapping) {
            custom[k] = mapping[k].slice(0);
        }

        self.setKeyboard(customName);
    }

    this.applyPreferences = function() {
    };


    var msxKeys = wmsx.KeyboardKeys;

    var availableKeyboards = wmsx.BuiltInKeyboards.all.slice(0);
    var customKeyboards = {};
    var currentKeyboard;

    var biosSocket;
    var screen;

    var keyStateMap = {};
    var extraModifiersActive = new Set();
    var keyboardRowValues = wmsx.Util.arrayFill(new Array(16), 0xff);            // only 12 rows used

    var japanaseKeyboardLayoutPortValue = WMSX.KEYBOARD_JAPAN_LAYOUT !== 0 ? 0x40 : 0;

    var mapping = {};
    var keyCodeMap;

    var turboFireSpeed = 0, turboFireFlipClockCount = 0;

    var RAltKeyCode = wmsx.DOMKeys.VK_RALT.c;       // Used for special case on Portuguese AltGr key

    var CUSTOM_KEYBOARD_SUFFIX = "-CUSTOM";
    var IGNORE_ALL_MODIFIERS_MASK = wmsx.DOMKeys.IGNORE_ALL_MODIFIERS_MASK;
    var MAX_KEY_MAPPED = 4;

    init();

};