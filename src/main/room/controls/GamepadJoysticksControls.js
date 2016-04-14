// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.GamepadJoysticksControls = function(hub) {

    this.connect = function(pMachineControlsSocket) {
        machineControlsSocket = pMachineControlsSocket;
    };

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

    this.resetControllers = function() {
        resetStates();
        updateConnectionsToHub();
    };

    this.readJoystickPort = function(port) {
        return port === 0 ? joy1State.portValue : joy1State.portValue;
    };

    this.toggleMode = function() {
        if (!supported) {
            showStatusMessage("Joysticks DISABLED (not supported by browser)");
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

        showStatusMessage(mode === -2 ? "Joysticks DISABLED" : "Joysticks AUTO" + (swappedMode ? " (swapped)" : ""));
    };

    //this.setPaddleMode = function(state) {
    //    if (!supported) return;
    //    paddleMode = state;
    //    joy1State.xPosition = joy2State.xPosition = -1;
    //};

    this.controllersClockPulse = function(noMessage) {
        if (!supported || mode === -2) return;

        // Try to avoid polling at gamepads if none are present, as it may be expensive
        // Only try to detect connected gamepads once each 60 clocks (frames)
        if (++detectionDelayCount >= DETECTION_DELAY) detectionDelayCount = 0;
        if (!joystick1 && !joystick2 && detectionDelayCount !== 0) return;

        var gamepads = navigator.getGamepads();     // Just one poll per clock here then use it several times

        if (joystick1) {
            if (joystick1.update(gamepads)) {
                if (joystick1.hasMoved())
                    update(joystick1, joy1State, joy1Prefs, !swappedMode);
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
                if (joystick2.hasMoved())
                    update(joystick2, joy2State, joy2Prefs, swappedMode);
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
        var j1 = joystick1 ? "JOY1" : null;
        var j2 = joystick2 ? "JOY2" : null;

        hub.updateJoystickConnections(swappedMode ? j2 : j1, swappedMode ? j1 : j2);
    }

    var showDeviceConnectionMessage = function (joy1, conn) {
        updateConnectionsToHub();
        showStatusMessage("Joystick " + (joy1 ? "1" : "2") + (conn ? " connected" : " disconnected"));
    };

    function showStatusMessage(mes) {
        hub.showStatusMessage(mes);
    }

    var detectNewJoystick = function(prefs, notPrefs, gamepads) {       // must have at least 1 button to be accepted
        if (!gamepads || gamepads.length === 0) return;
        // Fixed index detection. Also allow the same gamepad to control both  players
        if (prefs.device >= 0)   // pref.device == -1 means "auto"
            return gamepads[prefs.device] && gamepads[prefs.device].buttons.length > 0 ? new Joystick(prefs.device, prefs) : null;
        // Auto detection
        for (var i = 0, len = gamepads.length; i < len; i++)
            if (gamepads[i] && gamepads[i].buttons.length > 0)
                if (i !== notPrefs.device && (!joystick1 || joystick1.index !== i) && (!joystick2 || joystick2.index !== i))
                    // New Joystick found!
                    return new Joystick(i, prefs);
    };

    var resetStates = function() {
        joy1State.reset();
        joy2State.reset();
    };

    var update = function(joystick, joyState, joyPrefs, primary) {
        // Paddle Analog
        //if (paddleMode && joyPrefs.paddleSens !== 0) {
        //    joyState.xPosition = joystick.getPaddlePosition();
        //}

        // Joystick direction (Analog or POV) and Paddle Digital (Analog or POV)
        var direction = joystick.getDPadDirection();
        if (direction === -1 /* && (!paddleMode || joyPrefs.paddleSens === 0) */)
            direction = joystick.getStickDirection();
        if (direction !== joyState.direction) {
            joyState.direction = direction;
            joyState.portValue = (joyState.portValue & ~0xf) | DIRECTION_TO_PORT_VALUE[direction + 1];
        }

        // Joystick buttons
        //if (joyButtonDetection === joystick) {
        //    detectButton();
        //    return;
        //} else {
            var button;
            var buttonS = joystick.getButtonDigital(joyPrefs.buttonS);
            button =  joystick.getButtonDigital(joyPrefs.button1);
            joyState.button1 = (buttonS || button);
            if (joyState.button1) joyState.portValue &= ~0x10; else joyState.portValue |= 0x10;
            button = joystick.getButtonDigital(joyPrefs.button2);
            joyState.button2 = (buttonS || button);
            if (joyState.button2) joyState.portValue &= ~0x20; else joyState.portValue |= 0x20;
        //}

        // Other Machine controls, not related to the controller port
        button = joystick.getButtonDigital(joyPrefs.pause);
        if (button !== joyState.pause) {
            if (button) machineControlsSocket.controlStateChanged(wmsx.MachineControls.PAUSE, true);
            joyState.pause = button;
        }
        button = joystick.getButtonDigital(joyPrefs.fastSpeed);
        if (button !== joyState.fastSpeed) {
            machineControlsSocket.controlStateChanged(wmsx.MachineControls.FAST_SPEED, button);
            joyState.fastSpeed = button;
        }
        button = joystick.getButtonDigital(joyPrefs.slowSpeed);
        if (button !== joyState.slowSpeed) {
            machineControlsSocket.controlStateChanged(wmsx.MachineControls.SLOW_SPEED, button);
            joyState.slowSpeed = button;
        }
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
    var detectionDelayCount = 1;

    var machineControlsSocket;
    var screen;

    var mode = -1;
    var swappedMode = false;

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
            this.direction = -1;         // CENTER
            this.xPosition = -1;         // CENTER
            this.portValue = 0x3f;       // All switches off
            this.button1 = false;
            this.button2 = false;
            this.pause = false;
            this.fastSpeed = false;
            this.slowSpeed = false;
        };
        this.reset();
    }


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
