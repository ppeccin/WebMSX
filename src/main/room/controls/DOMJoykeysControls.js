// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMJoykeysControls = function(room, hub, keyboard) {
"use strict";

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        applyPreferences();
        if (mode >= 0) updateMode();
    };

    this.powerOff = function() {
    };

    this.releaseControllers = function() {
        resetStates();
        var keyStateMap = {};
    };

    this.resetControllers = function() {
        this.releaseControllers();
        updateConnectionsToHub();
    };

    this.readLocalControllerPort = function(port) {
        return turboFireClockCount > turboFireFlipClock ? joyStates[port ^ swappedMode].portValue | 0x10 : joyStates[port ^ swappedMode].portValue;
    };

    this.writeControllerPin8Port = function(atPort, val) {
        // Do nothing
    };

    this.controllersClockPulse = function() {
        if (mode >=0 && turboFireClocks && (--turboFireClockCount <= 0)) turboFireClockCount = turboFireClocks;
    };

    this.toggleMode = function() {
        var newMode = (room.netPlayMode === 2 && !netServerSwapped ? NET_CLIENT_SWAP_MODE_SEQ : NORMAL_MODE_SEQ)[mode + 1];  // mode starts from -1 so +1
        this.setMode(newMode);
        hub.showStatusMessage("Joykeys " + this.getModeDesc());
    };

    this.setMode = function(newMode) {
        if (newMode >= 0 && mode < 0) keyStateMap = {};
        mode = newMode;
        updateMode();
    };

    function updateMode() {
        swappedMode = mode === 1 || mode === 3;
        resetStates();
        updateConnectionsToHub();
        updateCodeMap();
    }

    this.getMode = function () {
        return mode;
    };

    this.getModeDesc = function() {
        switch (mode) {
            case 0:  return "SINGLE";
            case 1:  return "SINGLE (port 2)";
            case 2:  return "DUAL";
            case 3:  return "DUAL (swapped)";
            default: return "DISABLED";
        }
    };

    this.getSwappedState = function() {
        return swappedMode;
    };

    this.netClientAdaptToServerSwappedState = function(swapped) {
        netServerSwapped = swapped;
        if (mode === -1) return;
        if (!swapped) {
            if (mode === 0) this.setMode(1);
            else if (mode === 2) this.setMode(3);
        } else {
            if (mode === 1) this.setMode(0);
            else if (mode === 3) this.setMode(2);
        }
    };

    this.setTurboFireClocks = function(clocks) {
        turboFireClocks = clocks;
        turboFireFlipClock = (turboFireClocks / 2) | 0;
        turboFireClockCount = 0;
    };

    this.processKey = function(code, press) {
        if (mode < 0) return keyboard.processKey(code, press);

        var mappings = keyCodeMap[code];
        if (!mappings) return keyboard.processKey(code, press);

        if (keyStateMap[code] === press) {
            if (!press) keyboard.processKey(code, press);       // Always let Keyboard process key releases
            return;
        }

        keyStateMap[code] = press;

        for (var i = 0; i < mappings.length; ++i) {
            if (press) {
                joyStates[mappings[i].p].portValue &= ~joystickButtons[mappings[i].b].mask;
                if (turboFireClocks && mappings[i].b === "J_A") turboFireClockCount = turboFireFlipClock + 1;
            } else
                joyStates[mappings[i].p].portValue |=  joystickButtons[mappings[i].b].mask;
        }

        // Always let Keyboard process key releases
        if (!press) keyboard.processKey(code, press);
    };

    this.getMappingForControl = function(button, port) {
        return joyPrefs[port ^ swappedMode].buttons[button];
    };

    this.getMappingPopupText = function(button, port) {
        return { heading: "Button mapped to:", footer: "Press new key.<br>(right-click to clear)" };
    };

    this.customizeControl = function (button, port, mapping) {
        // Ignore if key is already mapped
        if (keyCodeMap[mapping.c] && wmsx.Util.arrayFind(keyCodeMap[mapping.c], function(map) {
                return map.b === button && map.p === port;
            })) return;

        // Add new mapping, max of X keys
        var mappings = joyPrefs[port ^ swappedMode].buttons[button];
        if (mappings.length >= MAX_KEYS_MAPPED) mappings.splice(0, mappings.length - (MAX_KEYS_MAPPED - 1));
        mappings.push(mapping);

        resetStates();
        updateCodeMap();
        WMSX.userPreferences.setDirty();
    };

    this.clearControl = function(button, port) {
        joyPrefs[port ^ swappedMode].buttons[button].length = 0;
        resetStates();
        updateCodeMap();
        WMSX.userPreferences.setDirty();
    };

    function updateCodeMap() {
        keyCodeMap = {};
        if (mode >= 0) updateCodeMapJoykeys(joy1Prefs.buttons, 0);
        if (mode >= 2) updateCodeMapJoykeys(joy2Prefs.buttons, 1);
    }

    function updateCodeMapJoykeys(mappings, port) {
        for (var b in mappings) {
            for (var i = 0; i < mappings[b].length; ++i) {
                if (!keyCodeMap[mappings[b][i].c]) keyCodeMap[mappings[b][i].c] = [];
                keyCodeMap[mappings[b][i].c].push({ b: b, p: port });
            }
        }
    }

    function updateConnectionsToHub() {
        var j1 = mode >= 0 ? TYPE + " 1" : null;
        var j2 = mode >= 2 ? TYPE + " 2" : null;

        hub.updateJoykeysConnections(swappedMode ? j2 : j1, swappedMode ? j1 : j2);
    }

    function resetStates() {
        joy1State.reset();
        joy2State.reset();
    }

    function applyPreferences() {
        joyPrefs[0] = joy1Prefs = WMSX.userPreferences.current.joykeys[0];
        joyPrefs[1] = joy2Prefs = WMSX.userPreferences.current.joykeys[1];
    }


    var joystickButtons = wmsx.JoystickButtons;

    var screen;

    var mode = WMSX.JOYKEYS_MODE;
    var swappedMode = false;

    var keyCodeMap = {};
    var keyStateMap = {};

    var joy1State = new JoystickState();
    var joy2State = new JoystickState();
    var joyStates = [ joy1State, joy2State ];

    var turboFireClocks = 0, turboFireClockCount = 0, turboFireFlipClock = 0;

    var joy1Prefs;
    var joy2Prefs;
    var joyPrefs = [];

    var netServerSwapped = false;

    var NORMAL_MODE_SEQ =          [ 0, 1, 2, 3, -1];
    var NET_CLIENT_SWAP_MODE_SEQ = [ 1, 3, 0, -1, 2];

    var TYPE = wmsx.ControllersHub.JOYKEYS;

    var MAX_KEYS_MAPPED = 4;

    function JoystickState() {
        this.reset = function() {
            this.portValue = 0x3f;          // All switches off
        };
        this.reset();
    }

};
