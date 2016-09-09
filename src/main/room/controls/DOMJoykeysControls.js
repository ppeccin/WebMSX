// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMJoykeysControls = function(hub, keyForwardControls) {
"use strict";

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
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

        hub.showStatusMessage("Joykeys " + this.getModeDesc());
    };

    this.getModeDesc = function() {
        return mode === -1 ? "DISABLED" : (mode < 2 ? "ONE" : "BOTH") + (swappedMode ? " (swapped)" : "");
    };

    this.setTurboFireSpeed = function(speed) {
        turboFireSpeed = speed ? speed * speed + 3 : 0;
        turboFireFlipClockCount = 0;
    };

    function updateConnectionsToHub() {
        var j1 = mode >= 0 ? wmsx.ControllersHub.JOYKEYS + " 1" : null;
        var j2 = mode >= 2 ? wmsx.ControllersHub.JOYKEYS + " 2" : null;

        hub.updateJoykeysConnections(swappedMode ? j2 : j1, swappedMode ? j1 : j2);
    }

    var resetStates = function() {
        joy1State.reset();
        joy2State.reset();
    };

    this.applyPreferences = function() {
        joy1Prefs = {
        };
        joy2Prefs = {
        };
    };


    var machineControlsSocket;
    var screen;

    var mode = -1;
    var swappedMode = false;

    var turboFireSpeed = 0, turboFireFlipClockCount = 0;

    var joy1State = new JoystickState();
    var joy2State = new JoystickState();

    var joystick1;
    var joystick2;
    var joy1Prefs;
    var joy2Prefs;


    function JoystickState() {
        this.reset = function() {
            this.direction = -1;         // CENTER
            this.xPosition = -1;         // CENTER
            this.portValue = 0x3f;       // All switches off
            this.button1 = this.button1Real = false;
            this.button2 = false;
            this.pause = false;
            this.fastSpeed = false;
            this.slowSpeed = false;
        };
        this.reset();
    }

};
