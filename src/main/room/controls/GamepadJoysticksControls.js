// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.GamepadJoysticksControls = function() {

    this.connect = function(pJoysticksSocket, pMachineControlsSocket) {
        joysticksSocket = pJoysticksSocket;
        joysticksSocket.connectControls(this);
        machineControlsSocket = pMachineControlsSocket;
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        supported = !!navigator.getGamepads;
        if (!supported) return;
        this.applyPreferences();
        initStates();
    };

    this.powerOff = function() {
        supported = false;
    };

    this.toggleMode = function() {
        if (!supported) {
            screen.getMonitor().showOSD("Joystick input not supported by browser", true);
            return;
        }
        initStates();
        if (!joystick1 && !joystick2) {
            screen.getMonitor().showOSD("No Joysticks connected", true);
            return;
        }
        swappedMode = !swappedMode;
        screen.getMonitor().showOSD("Joysticks input " + (swappedMode ? "Swapped" : "Normal"), true);
    };

    this.setPaddleMode = function(state) {
        if (!supported) return;
        paddleMode = state;
        joy1State.xPosition = joy2State.xPosition = -1;
    };

    this.joysticksClockPulse = function() {
        if (!supported) return;

        // Try to avoid polling at gamepads if none are present, as it may be expensive
        // Only try to detect connected gamepads once each 60 clocks (frames)
        if (++gamepadsDetectionDelay >= 60) gamepadsDetectionDelay = 0;
        if (!joystick1 && !joystick2 && gamepadsDetectionDelay !== 0) return;

        var gamepads = navigator.getGamepads();     // Just one poll per clock here then use it several times

        if (joystick1) {
            if (joystick1.update(gamepads)) {
                if (joystick1.hasMoved())
                    update(joystick1, joy1State, joy1Prefs, !swappedMode);
            } else {
                joystick1 = null;
                joystickConnectionMessage(true, false);
            }
        } else {
            if (gamepadsDetectionDelay === 0) {
                joystick1 = detectNewJoystick(joy1Prefs, joy2Prefs, gamepads);
                if (joystick1) joystickConnectionMessage(true, true);
            }
        }

        if (joystick2) {
            if (joystick2.update(gamepads)) {
                if (joystick2.hasMoved())
                    update(joystick2, joy2State, joy2Prefs, swappedMode);
            } else {
                joystick2 = null;
                joystickConnectionMessage(false, false);
            }
        } else {
            if (gamepadsDetectionDelay === 0) {
                joystick2 = detectNewJoystick(joy2Prefs, joy1Prefs, gamepads);
                if (joystick2) joystickConnectionMessage(false, true);
            }
        }
    };

    var joystickConnectionMessage = function (joy0, conn) {
        screen.getMonitor().showOSD("Joystick " + (joy0 ^ swappedMode ? "1" : "2") + (conn ? " connected" : " disconnected"), joy0);
    };

    var detectNewJoystick = function(prefs, notPrefs, gamepads) {
        if (!gamepads || gamepads.length === 0) return;
        // Fixed index detection. Also allow the same gamepad to control both  players
        if (prefs.device >= 0)   // pref.device == -1 means "auto"
            return gamepads[prefs.device] ? new Joystick(prefs.device, prefs) : null;
        // Auto detection
        for (var i = 0, len = gamepads.length; i < len; i++)
            if (gamepads[i])
                if (i !== notPrefs.device && (!joystick1 || joystick1.index !== i) && (!joystick2 || joystick2.index !== i))
                    // New Joystick found!
                    return new Joystick(i, prefs);
    };

    var initStates = function() {
        joy1State = newJoystickState();
        joy2State = newJoystickState();
    };

    var update = function(joystick, joyState, joyPrefs, player0) {
        // Paddle Analog
        if (paddleMode && joyPrefs.paddleSens !== 0) {
            var newPosition = joystick.getPaddlePosition();
            if (newPosition !== joyState.xPosition) {
                joyState.xPosition = newPosition;
                joysticksSocket.controlValueChanged(player0 ? controls.PADDLE1_POSITION : controls.PADDLE2_POSITION, newPosition);
            }
        }
        // Joystick direction (Analog or POV) and Paddle Digital (Analog or POV)
        var newDirection = joystick.getDPadDirection();
        if (newDirection === -1 && (!paddleMode || joyPrefs.paddleSens === 0))
            newDirection = joystick.getStickDirection();
        if (newDirection !== joyState.direction) {
            var newUP = newDirection === 7 || newDirection === 0 || newDirection == 1;
            var newRIGHT = newDirection === 1 || newDirection === 2 || newDirection === 3;
            var newDOWN = newDirection === 3 || newDirection === 4 || newDirection === 5;
            var newLEFT = newDirection === 5 || newDirection === 6 || newDirection === 7;
            if (player0) {
                joysticksSocket.controlStateChanged(controls.JOY1_UP, newUP, 0);
                joysticksSocket.controlStateChanged(controls.JOY1_RIGHT, newRIGHT, 0);
                joysticksSocket.controlStateChanged(controls.JOY1_DOWN, newDOWN, 0);
                joysticksSocket.controlStateChanged(controls.JOY1_LEFT, newLEFT, 0);
            } else {
                joysticksSocket.controlStateChanged(controls.JOY2_UP, newUP, 0);
                joysticksSocket.controlStateChanged(controls.JOY2_RIGHT, newRIGHT, 0);
                joysticksSocket.controlStateChanged(controls.JOY2_DOWN, newDOWN, 0);
                joysticksSocket.controlStateChanged(controls.JOY2_LEFT, newLEFT, 0);
            }
            joyState.direction = newDirection;
        }
        // Joystick buttons
        if (joyButtonDetection === joystick) {
            detectButton();
            return;
        } else {
            var newButtonS = joystick.getButtonDigital(joyPrefs.buttonS);
            var newButton = joystick.getButtonDigital(joyPrefs.button1);
            if ((newButtonS || newButton) !== joyState.button1) {
                joyState.button1 = (newButtonS || newButton);
                joysticksSocket.controlStateChanged(player0 ? controls.JOY1_BUTTON1 : controls.JOY2_BUTTON1, joyState.button1, 0);
            }
            newButton = joystick.getButtonDigital(joyPrefs.button2);
            if ((newButtonS || newButton) !== joyState.button2) {
                joyState.button2 = (newButtonS || newButton);
                joysticksSocket.controlStateChanged(player0 ? controls.JOY1_BUTTON2 : controls.JOY2_BUTTON2, joyState.button2, 0);
            }
        }
        // Other Machine controls
        var newPause = joystick.getButtonDigital(joyPrefs.pause);
        if (newPause !== joyState.pause) {
            if (newPause) machineControlsSocket.controlStateChanged(wmsx.MachineControls.PAUSE, true);
            joyState.pause = newPause;
        }
        var newFastSpeed = joystick.getButtonDigital(joyPrefs.fastSpeed);
        if (newFastSpeed !== joyState.fastSpeed) {
            machineControlsSocket.controlStateChanged(wmsx.MachineControls.FAST_SPEED, newFastSpeed);
            joyState.fastSpeed = newFastSpeed;
        }
        var newSlowSpeed = joystick.getButtonDigital(joyPrefs.slowSpeed);
        if (newSlowSpeed !== joyState.slowSpeed) {
            machineControlsSocket.controlStateChanged(wmsx.MachineControls.SLOW_SPEED, newSlowSpeed);
            joyState.slowSpeed = newSlowSpeed;
        }
    };

    var newJoystickState = function() {
        return {
            direction: -1,         // CENTER
            button1: false, button2: false, pause: false, fastSpeed: false, slowSpeed: false,
            xPosition: -1          // PADDLE POSITION
        }
    };

    var detectButton = function() {
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


    var supported = false;
    var gamepadsDetectionDelay = -1;

    var controls = wmsx.JoysticksControls;
    var joysticksSocket;
    var machineControlsSocket;
    var screen;

    var paddleMode = false;
    var swappedMode = false;

    var joystick1;
    var joystick2;
    var joy1State;
    var joy2State;
    var joy1Prefs;
    var joy2Prefs;

    var joyButtonDetection = null;


    function Joystick(index, prefs) {

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

        this.getDPadDirection = function() {
            if (this.getButtonDigital(12)) {
                if (this.getButtonDigital(15)) return 1;                // NORTHEAST
                else if (this.getButtonDigital(14)) return 7;           // NORTHWEST
                else return 0;                                          // NORTH
            } else if (this.getButtonDigital(13)) {
                if (this.getButtonDigital(15)) return 3;                // SOUTHEAST
                else if (this.getButtonDigital(14)) return 5;           // SOUTHWEST
                else return 4;                                          // SOUTH
            } else if (this.getButtonDigital(14)) return 6;             // WEST
            else if (this.getButtonDigital(15)) return 2;               // EAST
            else return -1;                                             // CENTER
        };

        this.getStickDirection = function() {
            var x = gamepad.axes[xAxis];
            var y = gamepad.axes[yAxis];
            if ((x < 0 ? -x : x) < deadzone) x = 0; else x *= xAxisSig;
            if ((y < 0 ? -y : y) < deadzone) y = 0; else y *= yAxisSig;
            if (x === 0 && y === 0) return -1;
            var dir = (1 - Math.atan2(x, y) / Math.PI) / 2;
            dir += 1/16; if (dir >= 1) dir -= 1;
            return (dir * 8) | 0;
        };

        this.getPaddlePosition = function() {
            var pos = (gamepad.axes[paddleAxis] * paddleAxisSig * paddleSens + paddleCenter) | 0;
            if (pos < 0) pos = 0;
            else if (pos > 380) pos = 380;
            return pos;
        };

        var gamepad;

        var xAxis = prefs.xAxis;
        var yAxis = prefs.yAxis;
        var xAxisSig = prefs.xAxisSig;
        var yAxisSig = prefs.yAxisSig;
        var deadzone = prefs.deadzone;
        var paddleAxis = prefs.paddleAxis;
        var paddleAxisSig = prefs.paddleAxisSig;
        var paddleSens = prefs.paddleSens;
        var paddleCenter = prefs.paddleCenter;

        var lastTimestamp = Number.MIN_VALUE;

    }

};


