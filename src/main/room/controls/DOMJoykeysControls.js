// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMJoykeysControls = function(hub, keyForwardControls) {
"use strict";

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        applyPreferences();
    };

    this.powerOff = function() {
    };

    this.releaseControllers = function() {
        resetStates();
    };

    this.resetControllers = function() {
        this.releaseControllers();
        updateConnectionsToHub();
    };

    this.readJoystickPort = function(port) {
        return (port === 1) ^ swappedMode ? joy2State.portValue : joy1State.portValue;
    };

    this.toggleMode = function() {
        ++mode; if (mode > 3) mode = -1;

        swappedMode = mode === 1 || mode === 3;
        resetStates();
        updateConnectionsToHub();
        updateCodeMap();

        hub.showStatusMessage("Joykeys " + this.getModeDesc());
    };

    this.getModeDesc = function() {
        return mode === -1 ? "DISABLED" : (mode < 2 ? "ONE" : "BOTH") + (swappedMode ? " (swapped)" : "");
    };

    this.setTurboFireSpeed = function(speed) {
        turboFireSpeed = speed ? speed * speed + 3 : 0;
        turboFireFlipClockCount = 0;
    };

    this.processKey = function(code, press) {
        if (mode < 0) return keyForwardControls.processKey(code, press);

        var mapping = keyCodeMap[code];
        if (!mapping) return keyForwardControls.processKey(code, press);

        if (press) joyStates[mapping.p].portValue &= ~(1 << joystickButtons[mapping.b]);
        else       joyStates[mapping.p].portValue |=  (1 << joystickButtons[mapping.b]);
    };

    function updateCodeMap() {
        keyCodeMap = {};
        if (mode >= 0) updateCodeMapJoykeys(joy1Prefs.buttons, 0);
        if (mode >= 2) updateCodeMapJoykeys(joy2Prefs.buttons, 1);
    }

    function updateCodeMapJoykeys(mapping, port) {
        for (var b in mapping) {
            for (var i = 0; i < mapping[b].length; ++i)
                keyCodeMap[mapping[b][i].c] = { b: b, p: port };
        }
    }

    function updateConnectionsToHub() {
        var j1 = mode >= 0 ? wmsx.ControllersHub.JOYKEYS + " 1" : null;
        var j2 = mode >= 2 ? wmsx.ControllersHub.JOYKEYS + " 2" : null;

        hub.updateJoykeysConnections(swappedMode ? j2 : j1, swappedMode ? j1 : j2);
    }

    function resetStates() {
        joy1State.reset();
        joy2State.reset();
    }

    function applyPreferences() {
        joy1Prefs = WMSX.userPreferences.joykeys[0];
        joy2Prefs = WMSX.userPreferences.joykeys[1];
    }


    var joystickButtons = wmsx.JoystickButtons;

    var machineControlsSocket;
    var screen;

    var mode = -1;
    var swappedMode = false;

    var keyCodeMap = {};

    var turboFireSpeed = 0, turboFireFlipClockCount = 0;

    var joy1State = new JoystickState();
    var joy2State = new JoystickState();
    var joyStates = [ joy1State, joy2State ];

    var joy1Prefs;
    var joy2Prefs;


    function JoystickState() {
        this.reset = function() {
            this.buttonsState = {};         // All buttons released
            this.portValue = 0x3f;          // All switches off
        };
        this.reset();
    }

};
