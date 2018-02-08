// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMKeyboard = function (hub, room, machineControls) {
"use strict";

    var self = this;

    function init() {
        self.applyPreferences();
    }

    this.connect = function(pBIOSSocket) {
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
        biosSocket.keyboardExtensionTypeString(str);
    };

    this.cancelTypeString = function() {
        biosSocket.keyboardExtensionCancelTypeString();
    };

    this.isShiftPressed = function () {
        return (keyboardMatrix[6] & 1) === 0;
    };

    this.controllersClockPulse = function() {
        // Turbo fire
        if (turboFireClocks && turboKeyPressed) {
            --turboFireClockCount;
            // State flipped?
            if (turboFireClockCount === turboFireFlipClock || turboFireClockCount === 0) {
                var press = turboFireClockCount > 0;
                var matrix = msxKeys["SPACE"].m;
                processMatrixChange(matrix[0], matrix[1], press);
            }
            if (turboFireClockCount <= 0) turboFireClockCount = turboFireClocks;        // restart cycle
        }
    };

    this.readKeyboardPort = function(row) {
        return keyboardMatrix[row];
    };

    this.toggleKeyboardLayout = function() {
        var next = currentIsAuto ? 0 : (availableKeyboards.indexOf(currentKeyboard) + 1) || 0;
        if (next >= availableKeyboards.length) setDefaultKeyboard();
        else this.setKeyboard(availableKeyboards[next], false);
        screen.showOSD("Host Keyboard: " + this.getCurrentKeyboardDesc(), true);
    };

    this.getCurrentKeyboardDesc = function() {
        return (currentIsAuto ? "AUTO: " : "") + currentKeyboard;
    };

    this.setKeyboard = function (keyboard, auto) {
        currentKeyboard = keyboard;
        currentIsAuto = auto;
        updateMapping();
        if (screen) screen.keyboardSettingsStateUpdate();

        var prefValue = auto ? undefined : keyboard;
        if (WMSX.userPreferences.current.keyboard !== prefValue) {
            WMSX.userPreferences.current.keyboard = prefValue;
            WMSX.userPreferences.setDirty();
            WMSX.userPreferences.save();
        }
    };

    this.setTurboFireClocks = function(clocks) {
        turboFireClocks = clocks;
        turboFireFlipClock = (turboFireClocks / 2) | 0;
        turboFireClockCount = 0;
    };

    this.releaseControllers = function() {
        for (var msxKey in keyStateMap)
            if (keyStateMap[msxKey]) this.processMSXKey(msxKey, false);
        turboKeyPressed = false;
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

        if (!customKeyboards[currentKeyboard]) makeCustomKeyboard();

        mapping[key].length = 0;
        updateCodeMap();
        WMSX.userPreferences.setDirty();
    };

    this.customizeKey = function (key, vk) {
        // Ignore if key is already mapped
        if (keyCodeMap[vk.c] === key) return;

        if (!customKeyboards[currentKeyboard]) makeCustomKeyboard();

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
        if (map.length >= MAX_KEYS_MAPPED) map.splice(0, map.length - (MAX_KEYS_MAPPED - 1));
        map.push(vk);

        updateCodeMap();
        WMSX.userPreferences.setDirty();
    };

    this.processKey = function(code, press) {
        var msxKey = keyCodeMap[code];                                      // First try, before giving a chance to other controls in the chain

        //console.log("Key " + (press ? "Press" : "Release") + ", code: " + code.toString(16) + ", msxKey: " + msxKey);

        // Try other controls if not found
        if (!msxKey) {
            if (machineControls.processKey(code, press)) return;

            msxKey = keyCodeMap[code & IGNORE_ALL_MODIFIERS_MASK];          // Second try, ignore modifiers, only if no other controls were found

            //console.log("2 Key " + (press ? "Press" : "Release") + ", code: " + code.toString(16) + ", msxKey: " + msxKey);
        }

        if (msxKey) {
            // Special case for Portuguese "Alt Gr" key, which is LControl+RAlt. Release MSX CONTROL key if pressed, so AltGr can be used as normal RAlt
            if (code === RAltKeyCode && keyStateMap["CONTROL"]) {
                var m = msxKeys["CONTROL"].m;
                processMatrixChange(m[0], m[1], false);
            }
            this.processMSXKey(msxKey, press);
        }
    };

    this.processMSXKey = function(msxKey, press) {
        // TurboFire. Affects only SPACE
        if (turboFireClocks && msxKey === "SPACE") {
            if (turboKeyPressed === press) return;
            if (press) turboFireClockCount = turboFireFlipClock;
            turboKeyPressed = press;
        }

        if (keyStateMap[msxKey] === press) return;
        keyStateMap[msxKey] = press;

        var matrix = msxKeys[msxKey].m;
        processMatrixChange(matrix[0], matrix[1], press);
    };

    function processMatrixChange(line, col, press) {
        // Store changes to be sent to peers
        if (room.netController) netMatrixChangesToSend.push((line << 8) | (col << 4) | press );    // binary encoded

        // Do not apply change now if Client
        if (room.netPlayMode === 2) return;

        applyMatrixChange(line, col, press);
    }

    function applyMatrixChange(line, col, press) {
        // Update key matrix bits
        if (press) keyboardMatrix[line] &= ~(1 << col);
        else keyboardMatrix[line] |= (1 << col);
    }

    var updateMapping = function() {
        var map = customKeyboards[currentKeyboard] || wmsx.BuiltInKeyboards[currentKeyboard];
        for (var msxKey in msxKeys)
            mapping[msxKey] = !map[msxKey] ? [] : map[msxKey].constructor === Array ? map[msxKey] : [ map[msxKey] ];
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
        self.setKeyboard(keyboard, true);        // auto
    }

    function makeCustomKeyboard() {
        var customName = currentKeyboard === availableKeyboards[0] ? "CUSTOM" : currentKeyboard + "-CUSTOM";
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

        self.setKeyboard(customName, false);
    }

    this.applyPreferences = function() {
        customKeyboards = WMSX.userPreferences.current.customKeyboards || {};
        availableKeyboards = wmsx.BuiltInKeyboards.all.slice(0);
        availableKeyboards = availableKeyboards.concat(Object.keys(customKeyboards));

        var keyboard = WMSX.userPreferences.current.keyboard;                   // undefined = auto
        if (keyboard) this.setKeyboard(keyboard, false);
        else setDefaultKeyboard();
    };


    // NetPlay  -------------------------------------------

    this.netGetMatrixChangesToSend = function() {
        return netMatrixChangesToSend.length ? netMatrixChangesToSend : undefined;
    };

    this.netClearMatrixChangesToSend = function() {
        netMatrixChangesToSend.length = 0;
    };

    this.netServerProcessMatrixChanges = function(changes) {
        for (var i = 0, len = changes.length; i < len; ++i) {
            var change = changes[i];
            // Store changes to be sent to Clients
            netMatrixChangesToSend.push(change);
            applyMatrixChange(change >> 8, (change & 0xf0) >> 4, change & 0x01);              // binary encoded
        }
    };

    this.netClientApplyMatrixChanges = function(changes) {
        for (var i = 0, len = changes.length; i < len; ++i)
            applyMatrixChange(changes[i] >> 8, (changes[i] & 0xf0) >> 4, changes[i] & 0x01);   // binary encoded
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            k: wmsx.Util.storeInt8BitArrayToStringBase64(keyboardMatrix)
        };
    };

    this.loadState = function(s) {
        wmsx.Util.restoreStringBase64ToInt8BitArray(s.k, keyboardMatrix);
    };


    var msxKeys = wmsx.KeyboardKeys;

    var availableKeyboards;
    var customKeyboards;
    var currentKeyboard, currentIsAuto;

    var biosSocket;
    var screen;

    var keyStateMap = {};

    var keyboardMatrix = wmsx.Util.arrayFill(new Array(12), 0xff);

    var mapping = {};
    var keyCodeMap;

    var turboFireClocks = 0, turboFireClockCount = 0, turboFireFlipClock = 0;
    var turboKeyPressed = false;

    var netMatrixChangesToSend = new Array(100); netMatrixChangesToSend.length = 0;     // pre allocate empty Array

    var RAltKeyCode = wmsx.DOMKeys.VK_RALT.c;       // Used for special case on Portuguese AltGr key

    var IGNORE_ALL_MODIFIERS_MASK = wmsx.DOMKeys.IGNORE_ALL_MODIFIERS_MASK;
    var MAX_KEYS_MAPPED = 4;


    init();

};