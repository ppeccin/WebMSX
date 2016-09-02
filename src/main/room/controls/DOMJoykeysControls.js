// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMJoykeysControls = function(hub) {
"use strict";

    this.connect = function(pMachineControlsSocket) {
        machineControlsSocket = pMachineControlsSocket;
    };

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
        var j1 = mode >= 0 ? wmsx.ControllersHub.JOYKEYS + "1" : null;
        var j2 = mode >= 2 ? wmsx.ControllersHub.JOYKEYS + "2" : null;

        hub.updateJoykeysConnections(swappedMode ? j2 : j1, swappedMode ? j1 : j2);
    }

    var resetStates = function() {
        joy1State.reset();
        joy2State.reset();
    };

    this.applyPreferences = function() {
        joy1Prefs = {
            device         : WMSX.userPreferences.JP1DEVICE,
            xAxis          : WMSX.userPreferences.JP1XAXIS,
            xAxisSig       : WMSX.userPreferences.JP1XAXISSIG,
            yAxis          : WMSX.userPreferences.JP1YAXIS,
            yAxisSig       : WMSX.userPreferences.JP1YAXISSIG,
            paddleAxis     : WMSX.userPreferences.JP1PAXIS,
            paddleAxisSig  : WMSX.userPreferences.JP1PAXISSIG,
            button1        : WMSX.userPreferences.JP1BUT1,
            button2        : WMSX.userPreferences.JP1BUT2,
            buttonS        : WMSX.userPreferences.JP1BUTS,
            pause          : WMSX.userPreferences.JP1PAUSE,
            fastSpeed      : WMSX.userPreferences.JP1FAST,
            slowSpeed      : WMSX.userPreferences.JP1SLOW,
            paddleCenter   : WMSX.userPreferences.JP1PCENTER * -190 + 190 - 5,
            paddleSens     : WMSX.userPreferences.JP1PSENS * -190,
            deadzone       : WMSX.userPreferences.JP1DEADZONE
        };
        joy2Prefs = {
            device         : WMSX.userPreferences.JP2DEVICE,
            xAxis          : WMSX.userPreferences.JP2XAXIS,
            xAxisSig       : WMSX.userPreferences.JP2XAXISSIG,
            yAxis          : WMSX.userPreferences.JP2YAXIS,
            yAxisSig       : WMSX.userPreferences.JP2YAXISSIG,
            paddleAxis     : WMSX.userPreferences.JP2PAXIS,
            paddleAxisSig  : WMSX.userPreferences.JP2PAXISSIG,
            button1        : WMSX.userPreferences.JP2BUT1,
            button2        : WMSX.userPreferences.JP2BUT2,
            buttonS        : WMSX.userPreferences.JP2BUTS,
            pause          : WMSX.userPreferences.JP2PAUSE,
            fastSpeed      : WMSX.userPreferences.JP2FAST,
            slowSpeed      : WMSX.userPreferences.JP2SLOW,
            paddleCenter   : WMSX.userPreferences.JP2PCENTER * -190 + 190 - 5,
            paddleSens     : WMSX.userPreferences.JP2PSENS * -190,
            deadzone       : WMSX.userPreferences.JP2DEADZONE
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
