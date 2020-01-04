// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMKeyboard = function (hub, room, machineControls) {
"use strict";

    var self = this;

    this.connect = function(pMachineTypeSocket, pBIOSSocket) {
        machineTypeSocket = pMachineTypeSocket;
        machineTypeSocket.addMachineTypeStateListener(self, true);      // true = skip immediate update
        biosSocket = pBIOSSocket;
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.resetControllers = function() {
        this.releaseControllers();
        if (bootKeysAlways) startBootKeysCountdown();
    };

    this.machineTypeStateUpdate = function() {
        var newLang = machineTypeSocket.getMachineLang();
        if (newLang !== lang) {
            lang = newLang;
            applyPreferences();
        }
    };

    this.powerOn = function() {
        // Boot Keys
        if (!WMSX.BOOT_KEYS && !WMSX.BOOT_KEYS_ONCE) return;
        var keyNames = (WMSX.BOOT_KEYS || WMSX.BOOT_KEYS_ONCE).split(",");
        var finalKeyNames = [];
        for (var i = 0; i < keyNames.length; ++i) {
            var keyName = keyNames[i].trim().toUpperCase();
            var key = msxKeys[keyName] || msxKeys[BOOT_KEY_NAME_SYMNS[keyName]];
            if (!key) continue;
            finalKeyNames.push(key.key);
            keyboardMatrixBootKeys[key.m[0]] &= ~(1 << key.m[1]);
        }
        if (finalKeyNames.length) startBootKeysCountdown();
        if (bootKeysCountdown && !WMSX.BOOT_KEYS_ONCE) bootKeysAlways = true;

        wmsx.Util.log("Boot Keys" + (bootKeysAlways ? "" : " (once)") + ": " + finalKeyNames.join(", "));
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
        // Boot Keys
        if (bootKeysCountdown > 0) --bootKeysCountdown;

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
        return bootKeysCountdown > 0 ? keyboardMatrix[row] & keyboardMatrixBootKeys[row] : keyboardMatrix[row];
    };

    this.toggleKeyboardLayout = function(dec) {
        var index;
        if (dec) index = currentIsAuto ? availableKeyboards.length - 1 : (availableKeyboards.indexOf(currentKeyboard) - 1) || 0;
        else     index = currentIsAuto ? 0 : (availableKeyboards.indexOf(currentKeyboard) + 1) || 0;

        if (index < 0 || index >= availableKeyboards.length) setDefaultKeyboard();
        else this.setKeyboard(availableKeyboards[index], false);
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
        if (WMSX.userPreferences.current.hostKeyboard[lang] !== prefValue) {
            WMSX.userPreferences.current.hostKeyboard[lang] = prefValue;
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
        if (keyCodeMap[vk.wc] === key) return;

        if (!customKeyboards[currentKeyboard]) makeCustomKeyboard();

        // Search for keys mapped to this vk, to remove the mapping
        for (var k in mapping) {
            var map = mapping[k];
            if (map.length === 0) continue;
            var i;
            while ((i = wmsx.Util.arrayFindIndex(map, function(aVK) { return aVK.wc === vk.wc; })) >= 0)
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

    function startBootKeysCountdown() {
        bootKeysCountdown = bootKeysFrames > 0 ? bootKeysFrames : WMSX.BOOT_DURATION_AUTO;
    }

    var updateMapping = function() {
        var map = customKeyboards[currentKeyboard] || builtInKeyboards[currentKeyboard];
        for (var msxKey in msxKeys)
            mapping[msxKey] = !map[msxKey] ? [] : map[msxKey].constructor === Array ? map[msxKey] : [ map[msxKey] ];
        updateCodeMap();
    };

    var updateCodeMap = function() {
        keyCodeMap = {};
        for (var k in mapping) {
            if (mapping[k].length === 0) continue;
            for (var i = 0; i < mapping[k].length; ++i) keyCodeMap[mapping[k][i].wc] = k;
        }
    };

    function setDefaultKeyboard() {
        var hostLang = (wmsx.Util.userLanguage() || "en-US").toUpperCase() ;

        // Netherlands use en-US keyboard by default
        if (hostLang.substr(0, 2) === "NL") hostLang = "en-US";

        // Try to find exact language-country match
        for (var k = 0; k < availableKeyboards.length; ++k)
            if (availableKeyboards[k].toUpperCase().indexOf(hostLang) === 0)
                return self.setKeyboard(availableKeyboards[k], true);       // true = auto
        // Try to find only language match
        hostLang = hostLang.substr(0, 2);
        for (k = 0; k < availableKeyboards.length; ++k)
            if (availableKeyboards[k].toUpperCase().indexOf(hostLang) === 0)
                return self.setKeyboard(availableKeyboards[k], true);       // true = auto
        // Not found, use default
        self.setKeyboard(availableKeyboards[0], true);               // true = auto
    }

    function makeCustomKeyboard() {
        var customName = currentKeyboard + "-CUSTOM";
        // Copy current mapping to new Custom Keyboard if not yet available
        if (!customKeyboards[customName]) {
            customKeyboards[customName] = {};
            availableKeyboards.push(customName);
        }

        // Init mappings based on current
        var custom = customKeyboards[customName];
        for (var k in mapping)
            custom[k] = mapping[k].slice(0);

        self.setKeyboard(customName, false);
    }

    function applyPreferences() {
        // console.log("KEYBOARD LANG: " + lang);

        builtInKeyboards = wmsx.BuiltInKeyboards[lang] || {};
        customKeyboards = WMSX.userPreferences.current.customHostKeyboards[lang] || {};
        availableKeyboards = Object.keys(builtInKeyboards).concat(Object.keys(customKeyboards));

        var keyboard = WMSX.userPreferences.current.hostKeyboard[lang];                         // undefined = auto
        if (availableKeyboards.indexOf(keyboard) >= 0) self.setKeyboard(keyboard, false);       // use default if not found or not set
        else setDefaultKeyboard();
    }


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
            k: wmsx.Util.storeInt8BitArrayToStringBase64(keyboardMatrix),
            kb: wmsx.Util.storeInt8BitArrayToStringBase64(keyboardMatrixBootKeys),
            bf: bootKeysFrames,
            ba: bootKeysAlways,
            bc: bootKeysCountdown
        };
    };

    this.loadState = function(s) {
        wmsx.Util.restoreStringBase64ToInt8BitArray(s.k, keyboardMatrix);
        wmsx.Util.restoreStringBase64ToInt8BitArray(s.kb, keyboardMatrixBootKeys);
        bootKeysFrames = s.bf;
        bootKeysAlways = s.ba;
        bootKeysCountdown = s.bc;
    };


    var msxKeys = wmsx.KeyboardKeys;
    var domKeys = wmsx.DOMKeys;

    var availableKeyboards = [];
    var builtInKeyboards = {}, customKeyboards = {};
    var currentKeyboard, currentIsAuto;

    var machineTypeSocket;
    var biosSocket;
    var screen;

    var lang = "en";

    var keyStateMap = {};

    var keyboardMatrix = wmsx.Util.arrayFill(new Array(12), 0xff);

    var keyboardMatrixBootKeys = wmsx.Util.arrayFill(new Array(12), 0xff);
    var bootKeysFrames = WMSX.BOOT_KEYS_FRAMES;
    var bootKeysAlways = false;
    var bootKeysCountdown = 0;

    var mapping = {};
    var keyCodeMap = {};

    var turboFireClocks = 0, turboFireClockCount = 0, turboFireFlipClock = 0;
    var turboKeyPressed = false;

    var netMatrixChangesToSend = new Array(100); netMatrixChangesToSend.length = 0;     // pre allocate empty Array

    var RAltKeyCode = domKeys.VK_RALT.wc;       // Used for special case on Portuguese AltGr key

    var IGNORE_ALL_MODIFIERS_MASK = domKeys.IGNORE_ALL_MODIFIERS_MASK;
    var MAX_KEYS_MAPPED = 4;

    var BOOT_KEY_NAME_SYMNS = { "CTRL": "CONTROL", "ESC": "ESCAPE", "CAPS": "CAPSLOCK", "KANA": "CODE", "RETURN": "ENTER", "RET": "ENTER",
        "0": "D0", "1": "D1", "2": "D2", "3": "D3", "4": "D4", "5": "D5", "6": "D6", "7": "D7", "8": "D8", "9": "D9"
    };


    applyPreferences();

};