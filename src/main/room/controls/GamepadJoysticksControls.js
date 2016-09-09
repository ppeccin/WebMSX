// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.GamepadJoysticksControls = function(hub, keyForwardControls) {
"use strict";

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        supported = !!navigator.getGamepads;
        if (!supported) return;
        this.applyPreferences();
    };

    this.powerOff = function() {
        supported = false;
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
        if (!supported) {
            hub.showStatusMessage("Joysticks DISABLED (not supported by browser)");
            return;
        }
        ++mode; if (mode > 0) mode = -2;

        if (mode === -2) {
            joystick1 = joystick2 = null;
        } else if (mode === -1) {
            detectionDelayCount = -1;
            this.controllersClockPulse(true);
        }

        swappedMode = mode === 0;

        resetStates();
        updateConnectionsToHub();

        hub.showStatusMessage("Joysticks " + this.getModeDesc());
    };

    this.getModeDesc = function() {
        return mode === -2 ? !supported ? "NOT SUPPORTED" : "DISABLED" : "AUTO" + (swappedMode ? " (swapped)" : "");
    };

    this.setTurboFireSpeed = function(speed) {
        turboFireSpeed = speed ? speed * speed + 3 : 0;
        turboFireFlipClockCount = 0;
    };

    this.controllersClockPulse = function(noMessage) {
        if (!supported || mode === -2) return;

        // Try to avoid polling at gamepads if none are present, as it may be expensive
        // Only try to detect connected gamepads once each 60 clocks (frames)
        if (++detectionDelayCount >= DETECTION_DELAY) detectionDelayCount = 0;
        if (!joystick1 && !joystick2 && detectionDelayCount !== 0) return;

        var gamepads = navigator.getGamepads();     // Just one poll per clock here then use it several times

        if (turboFireSpeed)
            if (--turboFireFlipClockCount <= 0) turboFireFlipClockCount = turboFireSpeed;

        if (joystick1) {
            if (joystick1.update(gamepads)) {
                if (joystick1.hasMoved()) update(joystick1, joy1State, joy1Prefs);
                else if (turboFireSpeed) updateForTurboFire(joy1State);
            } else {
                joystick1 = null;
                joy1State.reset();
                if (!noMessage) showDeviceConnectionMessage(true, false);
            }
        } else {
            if (detectionDelayCount === 0) {
                joystick1 = detectNewJoystick(joy1Prefs, joy2Prefs, gamepads);
                if (joystick1 && !noMessage) showDeviceConnectionMessage(true, true);
            }
        }

        if (joystick2) {
            if (joystick2.update(gamepads)) {
                if (joystick2.hasMoved()) update(joystick2, joy2State, joy2Prefs);
                else if (turboFireSpeed) updateForTurboFire(joy2State);
            } else {
                joystick2 = null;
                joy2State.reset();
                if (!noMessage) showDeviceConnectionMessage(false, false);
            }
        } else {
            if (detectionDelayCount === 0) {
                joystick2 = detectNewJoystick(joy2Prefs, joy1Prefs, gamepads);
                if (joystick2 && !noMessage) showDeviceConnectionMessage(false, true);
            }
        }
    };

    function updateConnectionsToHub() {
        var j1 = joystick1 ? wmsx.ControllersHub.JOYSTICK + "1" : null;
        var j2 = joystick2 ? wmsx.ControllersHub.JOYSTICK + "2" : null;

        hub.updateJoystickConnections(swappedMode ? j2 : j1, swappedMode ? j1 : j2);
    }

    var showDeviceConnectionMessage = function (joy1, conn) {
        updateConnectionsToHub();
        hub.showStatusMessage("Joystick " + (joy1 ? "1" : "2") + (conn ? " connected" : " disconnected"));
    };

    var detectNewJoystick = function(prefs, notPrefs, gamepads) {       // must have at least 1 button to be accepted
        if (!gamepads || gamepads.length === 0) return;
        // Fixed index detection. Also allow the same gamepad to control both players
        if (prefs.device >= 0)   // pref.device == -1 means "auto"
            return gamepads[prefs.device] && gamepads[prefs.device].buttons.length > 0 ? new Gamepad(prefs.device, prefs) : null;
        // Auto detection
        for (var i = 0, len = gamepads.length; i < len; i++)
            if (gamepads[i] && gamepads[i].buttons.length > 0)
                if (i !== notPrefs.device && (!joystick1 || joystick1.index !== i) && (!joystick2 || joystick2.index !== i))
                    // New Joystick found!
                    return new Gamepad(i, prefs);
    };

    var resetStates = function() {
        joy1State.reset();
        joy2State.reset();
    };

    var update = function(gamepad, joyState, prefs) {
        var buttonsState = joyState.buttonsState;

        // Turbo-fire
        var prevTriggerAState = buttonsState["A"];

        // Update buttons states
        for (var b in wmsx.JoystickButtons) {
            var buttonMappings = prefs.buttons[b];
            if (buttonMappings.length > 0) {
                var state = false;
                for (var i = 0; !state && i < buttonMappings.length; ++i)
                    if (gamepad.getButtonDigital(buttonMappings[i].c)) state = true;
                if (buttonsState[b] !== state) {
                    buttonsState[b] = state;
                    var bit = joystickButtons[b];

                    // Real MSX button
                    if (bit >= 0) {
                        if (state) joyState.portValue &= ~(1 << bit);
                        else       joyState.portValue |= (1 << bit);
                    } else {
                        // Virtual button
                        var key = prefs.virtButKeys[b];
                        if (key) keyForwardControls.processKey(key.c, state);
                    }
                }
            }
        }

        // Turbo-fire
        if (turboFireSpeed) updateForTurboFire(joyState, prevTriggerAState === true);

        // Use Analog direction if no directional buttons pressed
        if (!(buttonsState["UP"] || buttonsState["DOWN"] || buttonsState["LEFT"] || buttonsState["RIGHT"])) {
            var dir = gamepad.getStickDirection();
            if (dir !== joyState.analogDirection) {
                joyState.analogDirection = dir;
                joyState.portValue = joyState.portValue & ~0xf | DIRECTION_TO_PORT_VALUE[dir + 1];
            }
        }
    };

    function updateForTurboFire(joyState, prevTriggerAState) {
        if (joyState.buttonsState["A"]) {
            if (prevTriggerAState === false) turboFireFlipClockCount = 2;
            else {
                if (turboFireFlipClockCount > 2 ) joyState.portValue |= 0x10;
                else joyState.portValue &= ~0x10;
            }
        }
    }

    this.applyPreferences = function() {
        joy1Prefs = {
            buttons        : WMSX.userPreferences.joysticks[0].buttons,
            virtButKeys    : WMSX.userPreferences.joysticks[0].virtualButtonsKeys,
            device         : WMSX.userPreferences.joysticks[0].prefs.device,
            xAxis          : WMSX.userPreferences.joysticks[0].prefs.xAxis,
            xAxisSig       : WMSX.userPreferences.joysticks[0].prefs.xAxisSig,
            yAxis          : WMSX.userPreferences.joysticks[0].prefs.yAxis,
            yAxisSig       : WMSX.userPreferences.joysticks[0].prefs.yAxisSig,
            deadzone       : WMSX.userPreferences.joysticks[0].prefs.deadzone
        };
        joy2Prefs = {
            buttons        : WMSX.userPreferences.joysticks[1].buttons,
            virtButKeys    : WMSX.userPreferences.joysticks[0].virtualButtonsKeys,
            device         : WMSX.userPreferences.joysticks[1].prefs.device,
            xAxis          : WMSX.userPreferences.joysticks[1].prefs.xAxis,
            xAxisSig       : WMSX.userPreferences.joysticks[1].prefs.xAxisSig,
            yAxis          : WMSX.userPreferences.joysticks[1].prefs.yAxis,
            yAxisSig       : WMSX.userPreferences.joysticks[1].prefs.yAxisSig,
            deadzone       : WMSX.userPreferences.joysticks[1].prefs.deadzone
        };
    };


    var joystickButtons = wmsx.JoystickButtons;

    var supported = false;
    var detectionDelayCount = 1;

    var machineControls;
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

    var DETECTION_DELAY = 60;
    var DIRECTION_TO_PORT_VALUE = [ 0xf, 0xe, 0x6, 0x7, 0x5, 0xd, 0x9, 0xb, 0xa ];      // bit 0: on, 1: off


    function JoystickState() {
        this.reset = function() {
            this.analogDirection = -1;      // CENTER
            this.buttonsState = {};         // All buttons released
            this.portValue = 0x3f;          // All switches off
        };
        this.reset();
    }


    function Gamepad(index, prefs) {

        this.index = index;

        this.update = function(gamepads) {
            gamepad = gamepads[index];
            return !!gamepad;
        };

        this.hasMoved = function() {
            var newTime = gamepad.timestamp;
            if (newTime) {
                if (newTime > lastTimestamp) {
                    lastTimestamp = newTime;
                    return true;
                } else
                    return false;
            } else
                return true;        // Always true if the timestamp property is not supported
        };

        this.getButtonDigital = function(butIndex) {
            var b = gamepad.buttons[butIndex];
            if (typeof(b) === "object") return b.pressed || b.value > 0.5;
            else return b > 0.5;
        };

        this.getStickDirection = function() {           // CENTER: -1, NORTH: 0, NORTHEAST: 1, EAST: 2, SOUTHEAST: 3, SOUTH: 4, SOUTHWEST: 5, WEST: 6, NORTHWEST: 7
            var x = gamepad.axes[xAxis];
            var y = gamepad.axes[yAxis];
            if ((x < 0 ? -x : x) < deadzone) x = 0; else x *= xAxisSig;
            if ((y < 0 ? -y : y) < deadzone) y = 0; else y *= yAxisSig;
            if (x === 0 && y === 0) return -1;
            var dir = (1 - Math.atan2(x, y) / Math.PI) / 2;
            dir += 1/16; if (dir >= 1) dir -= 1;
            return (dir * 8) | 0;
        };


        var gamepad;

        var xAxis = prefs.xAxis;
        var yAxis = prefs.yAxis;
        var xAxisSig = prefs.xAxisSig;
        var yAxisSig = prefs.yAxisSig;
        var deadzone = prefs.deadzone;

        var lastTimestamp = Number.MIN_VALUE;

    }

};
