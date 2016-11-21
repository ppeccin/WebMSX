// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMTouchControls = function(hub, keyboard) {
"use strict";

    var self = this;

    this.connect = function(pMachineControlsSocket) {
        machineControlsSocket = pMachineControlsSocket;
        machineControlsSocket.addPowerAndUserPauseStateListener(this);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        applyPreferences();
        updateMode();
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

    this.readControllerPort = function(aPort) {
        if (aPort === port) return (turboFireClockCount > turboFireFlipClock) ? joyState.portValue | 0x10 : joyState.portValue;
        else return 0x3f;
    };

    this.writeControllerPin8Port = function(atPort, val) {
        // Do nothing
    };

    this.controllersClockPulse = function() {
        if (turboFireClocks && (--turboFireClockCount <= 0)) turboFireClockCount = turboFireClocks;
    };

    this.toggleMode = function() {
        if (!isTouchDevice) {
            hub.showErrorMessage("Touch Controls unavailable. Not a touch device!");
            return;
        }

        this.setMode(mode < 1 ? mode + 1 : -2);
        hub.showStatusMessage("Touch Controls " + this.getModeDesc());
    };

    this.setMode = function(aMode) {
        mode = aMode;
        updateMode();
    };

    this.getMode = function() {
        return mode;
    };

    this.getModeDesc = function() {
        switch (mode) {
            case -1: return "AUTO";
            case 0:  return "ENABLED";
            case 1:  return "ENABLED (port 2)";
            default: return !isTouchDevice ? "NOT SUPPORTED" : "DISABLED";
        }
    };

    this.getPortActive = function() {
        return port;
    };

    this.setTurboFireClocks = function(clocks) {
        turboFireClocks = clocks;
        turboFireFlipClock = (turboFireClocks / 2) | 0;
        turboFireClockCount = 0;
    };

    this.getMappingForControl = function(button, port) {
        return null;
    };

    this.screenReadjustedUpdate = function() {
        this.releaseControllers();
    };

    this.setupTouchControlsIfNeeded = function(mainElement) {
        if (dirElement || port < 0) return;

        speedControls = document.createElement('div');
        speedControls.id = "wmsx-touch-speed";
        var pause = document.createElement('div');
        pause.id = "wmsx-touch-pause";
        pause.addEventListener("touchstart", pauseTouchStart);
        speedControls.appendChild(pause);
        var ff = document.createElement('div');
        ff.id = "wmsx-touch-fast";
        ff.addEventListener("touchstart", fastTouchStart);
        ff.addEventListener("touchend", fastTouchEnd);
        speedControls.appendChild(ff);
        mainElement.appendChild(speedControls);

        var group = document.createElement('div');
        group.id = "wmsx-touch-left";
        dirElement = wmsx.DOMTouchControls.createDirectional();
        dirElement.addEventListener("touchstart", dirTouchStart);
        dirElement.addEventListener("touchmove", dirTouchMove);
        dirElement.addEventListener("touchend", dirTouchEnd);
        dirElement.addEventListener("touchcancel", dirTouchEnd);
        dirElement.addEventListener("mousedown", dirTouchStart);
        dirElement.addEventListener("mouseup", dirTouchEnd);
        group.appendChild(dirElement);
        mainElement.appendChild(group);

        group = document.createElement('div');
        group.id = "wmsx-touch-right";
        var buts = wmsx.TouchControls.buttons;
        for (var b in buts) createButton(group, buts[b]);
        mainElement.appendChild(group);

        updateSpeedControls();
        updateMappings();

        function createButton(group, name) {
            var but = wmsx.DOMTouchControls.createButton("wmsx-touch-" + name);
            but.wmsxControl = name;
            but.addEventListener("touchstart", buttonTouchStart);
            but.addEventListener("touchend", buttonTouchEnd);
            but.addEventListener("touchcancel", buttonTouchEnd);
            but.addEventListener("mousedown", buttonTouchStart);
            but.addEventListener("mouseup", buttonTouchEnd);
            buttonElements[name] = but;
            group.appendChild(but);
        }
    };

    this.startTouchDetection = function(listener) {
        touchDetectionListener = listener;
    };

    this.stopTouchDetection = function() {
        touchDetectionListener = null;
    };

    this.customizeControl = function(control, mapping) {
        if (control === "T_DIR") prefs.directional = mapping;
        else prefs.buttons[control] = mapping;
        this.updateMappingFor(control);
        WMSX.userPreferences.setDirty();
    };

    this.updateMappingFor = function (control) {
        if (control === "T_DIR") {
            dirElement.wmsxMappingIsKeys = prefs.directional === "KEYBOARD";
            wmsx.DOMTouchControls.styleDirectionalMapping(dirElement, prefs.directional);
        } else {
            var butElem = buttonElements[control];
            var mapping = prefs.buttons[control];
            butElem.wmsxMapping = mapping;
            wmsx.DOMTouchControls.styleButtonMapping(butElem, mapping);
        }
    };

    this.controllersSettingsStateUpdate = function () {
        var active = !!hub.getSettingsState().touchActive;
        document.documentElement.classList.toggle("wmsx-touch-active", active);
        screen.touchControlsActiveUpdate(active);
    };

    this.machinePowerAndUserPauseStateUpdate = function(power, paused) {
        machinePower = power;
        machinePaused = paused;
        if (speedControls) updateSpeedControls();
    };

    function updateSpeedControls() {
        speedControls.classList.toggle("wmsx-poweroff", !machinePower);
        speedControls.classList.toggle("wmsx-paused", machinePaused);
    }

    function updateMode() {
        port = mode === -2 ? -1 : mode === -1 ? (isTouchDevice && isMobileDevice ? 0 : -1) : mode;
        resetStates();
        updateConnectionsToHub();
    }

    function dirTouchStart(e) {
        blockEvent(e);

        if (touchDetectionListener) return touchDetectionListener.touchControlDetected("T_DIR");
        if (dirTouchID !== null) return;
        if (dirTouchCenterX === undefined) setDirTouchCenter();

        var touch = e.changedTouches[0];
        dirTouchID = touch.identifier;
        updateDirMovement(touch.pageX, touch.pageY);
    }

    function dirTouchEnd(e) {
        blockEvent(e);
        if (dirTouchID === null) return;

        var changed = e.changedTouches;
        for (var i = 0; i < changed.length; ++i)
            if (changed[i].identifier === dirTouchID) {
                dirTouchID = null;
                setCurrentDirection(-1);
                return;
            }
    }

    function dirTouchMove(e) {
        blockEvent(e);
        if (dirTouchID === null) return;

        var changed = e.changedTouches;
        for (var i = 0; i < changed.length; ++i) {
            if (changed[i].identifier === dirTouchID) {
                updateDirMovement(changed[i].pageX, changed[i].pageY);
                return;
            }
        }
    }

    function updateDirMovement(newX, newY) {
        var dir = -1;
        var x = newX - dirTouchCenterX, y = newY - dirTouchCenterY;
        var dist = Math.sqrt(x*x + y*y);
        if (dist > DIR_DEADZONE) {
            dir = (1 - Math.atan2(x, y) / Math.PI) / 2;
            dir += 1 / 16;
            if (dir >= 1) dir -= 1;
            dir = (dir * 8) | 0;
        }
        setCurrentDirection(dir);
    }

    function setCurrentDirection(newDir) {
        if (dirCurrentDir === newDir) return;

        if (dirElement.wmsxMappingIsKeys) {
            var release = DIRECTION_TO_KEYS[dirCurrentDir + 1];
            if (release[0]) keyboard.processMSXKey(release[0], false);
            if (release[1]) keyboard.processMSXKey(release[1], false);
            var press = DIRECTION_TO_KEYS[newDir + 1];
            if (press[0]) keyboard.processMSXKey(press[0], true);
            if (press[1]) keyboard.processMSXKey(press[1], true);
        } else
            joyState.portValue = joyState.portValue & ~0xf | DIRECTION_TO_PORT_VALUE[newDir + 1];

        dirCurrentDir = newDir;
    }

    function setDirTouchCenter() {
        var rec = dirElement.getBoundingClientRect();
        dirTouchCenterX = (((rec.left + rec.right) / 2) | 0) + window.pageXOffset;
        dirTouchCenterY = (((rec.top + rec.bottom) / 2) | 0) + window.pageYOffset;
    }

    function buttonTouchStart(e) {
        blockEvent(e);
        if (touchDetectionListener) return touchDetectionListener.touchControlDetected(e.target.wmsxControl);
        processButtonTouch(e.target.wmsxMapping, true);
    }

    function buttonTouchEnd(e) {
        blockEvent(e);
        processButtonTouch(e.target.wmsxMapping, false);
    }

    function processButtonTouch(mapping, press) {
        if (!mapping) return;

        if (mapping.button) {
            // Joystick button
            if (press) {
                joyState.portValue &= ~mapping.mask;
                if (turboFireClocks && mapping.mask === 0x10) turboFireClockCount = turboFireFlipClock + 1;
            } else
                joyState.portValue |= mapping.mask;
        } else if (mapping.key) {
            // Keyboard key
            keyboard.processMSXKey(mapping.key, press);
        }
    }

    function pauseTouchStart(e) {
        blockEvent(e);
        machineControlsSocket.controlStateChanged(!machinePower ? machineControls.POWER : machineControls.PAUSE, true);
    }

    function fastTouchStart(e) {
        blockEvent(e);
        machineControlsSocket.controlStateChanged(machinePaused ? machineControls.FRAME : machineControls.FAST_SPEED, true);
    }

    function fastTouchEnd(e) {
        blockEvent(e);
        machineControlsSocket.controlStateChanged(machinePaused ? machineControls.FRAME : machineControls.FAST_SPEED, false);
    }

    function updateMappings() {
        self.updateMappingFor("T_DIR");
        for (var but in buttonElements) self.updateMappingFor(but);
    }

    function updateConnectionsToHub() {
        hub.updateTouchControlsConnections(port === 0 ? TYPE : null, port === 1 ?  TYPE : null);
    }

    function resetStates() {
        joyState.reset();
        dirTouchCenterX = dirTouchCenterY = undefined;
        dirTouchID = null;
        setCurrentDirection(-1);
    }

    function applyPreferences() {
        prefs = WMSX.userPreferences.current.touch;
    }

    function blockEvent(e) {
        e.stopPropagation();
        e.preventDefault();
    }


    var machineControls = wmsx.MachineControls;
    var machineControlsSocket;
    var screen;

    var isTouchDevice = wmsx.Util.isTouchDevice();
    var isMobileDevice = wmsx.Util.isMobileDevice();
    var mode = WMSX.TOUCH_MODE >= 1 ? WMSX.TOUCH_MODE - 1 : isTouchDevice ? -1 : -2;            // -2: disabled, -1: auto, 0: enabled at port 0, 1: enabled at port 1. (parameter is -1 .. 2)
    var port = -1;
    var turboFireClocks = 0, turboFireClockCount = 0, turboFireFlipClock = 0;

    var dirElement = null, dirTouchID = null, dirTouchCenterX, dirTouchCenterY, dirCurrentDir = -1;
    var buttonElements = { };
    var speedControls;

    var joyState = new JoystickState();
    var machinePower = false, machinePaused = false;

    var prefs;

    var touchDetectionListener;

    var TYPE = wmsx.ControllersHub.TOUCH;

    var DIR_DEADZONE = 18;
    var DIRECTION_TO_PORT_VALUE = [ 0xf, 0xe, 0x6, 0x7, 0x5, 0xd, 0x9, 0xb, 0xa ];      // bit 0: on, 1: off
    var DIRECTION_TO_KEYS = [ [ ], [ "UP" ], [ "RIGHT", "UP" ], [ "RIGHT" ], [ "RIGHT", "DOWN" ], [ "DOWN" ], [ "LEFT", "DOWN" ], [ "LEFT" ], [ "LEFT", "UP" ] ];


    function JoystickState() {
        this.reset = function() {
            this.portValue = 0x3f;          // All switches off
        };
        this.reset();
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            p: prefs
        };
    };

    this.loadState = function(s) {
        resetStates();
        prefs = s.p;
        if (dirElement) updateMappings();
    };

};

wmsx.DOMTouchControls.createDirectional = function(id) {
    var elem = document.createElement('div');
    if (id) elem.id = id;
    elem.classList.add("wmsx-touch-dir");
    createArrowKey("left");
    createArrowKey("right");
    createArrowKey("up");
    createArrowKey("down");

    return elem;

    function createArrowKey(dir) {
        var key = document.createElement('div');
        key.classList.add("wmsx-touch-dir-" + dir);
        elem.appendChild(key);
        var arr = document.createElement('div');
        arr.classList.add("wmsx-arrow-" + dir);
        elem.appendChild(arr);
    }
};

wmsx.DOMTouchControls.createButton = function(id) {
    var but = document.createElement('div');
    if (id) but.id = id;
    but.classList.add("wmsx-touch-button");
    return but;
};

wmsx.DOMTouchControls.styleDirectionalMapping = function(elem, mapping) {
    elem.classList.toggle("wmsx-touch-dir-key", mapping === "KEYBOARD");
    elem.classList.toggle("wmsx-touch-dir-joy", mapping !== "KEYBOARD");
};

wmsx.DOMTouchControls.styleButtonMapping = function(elem, mapping) {
    elem.innerHTML = mapping ? mapping.n || mapping.sn : "";
    if (!mapping) {
        elem.classList.add("wmsx-touch-button-none");
        elem.classList.remove("wmsx-touch-button-joy", "wmsx-touch-button-key");
    } else if (mapping.button) {
        elem.classList.add("wmsx-touch-button-joy");
        elem.classList.remove("wmsx-touch-button-key", "wmsx-touch-button-none");
        var specialClasses = [ "A", "B", "AB" ];
        for (var b = 0; b < specialClasses.length; ++b) {
            if (mapping && mapping.n === specialClasses[b]) elem.classList.add("wmsx-touch-button-joy-" + specialClasses[b]);
            else elem.classList.remove("wmsx-touch-button-joy-" + specialClasses[b]);
        }
    } else if (mapping.key) {
        elem.classList.add("wmsx-touch-button-key");
        elem.classList.remove("wmsx-touch-button-joy", "wmsx-touch-button-none");
    }
};

wmsx.DOMTouchControls.LEFT_WIDTH = 119;
wmsx.DOMTouchControls.RIGHT_WIDTH = 80;
wmsx.DOMTouchControls.TOTAL_WIDTH = wmsx.DOMTouchControls.LEFT_WIDTH + wmsx.DOMTouchControls.RIGHT_WIDTH;