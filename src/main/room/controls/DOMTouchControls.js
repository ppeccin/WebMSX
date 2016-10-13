// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMTouchControls = function(hub, keyForwardControls) {
"use strict";

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
        if (aPort === port) return joyState.portValue;
        else return 0x3f;
    };

    this.writeControllerPin8Port = function(atPort, val) {
        // Do nothing
    };

    this.setTouchControlElements = function(elements) {
        if (elements.TDIR) {
            dirElement = elements.TDIR;
            dirElement.addEventListener("touchstart", dirTouchStart);
            dirElement.addEventListener("touchmove", dirTouchMove);
            dirElement.addEventListener("touchend", dirTouchEnd);
            dirElement.addEventListener("touchcancel", dirTouchEnd);
        }

        var buts = [ "A", "B", "X", "Y" ];
        for (var b = 0; b < 4; ++b) {
            var butName = "TB_" + buts[b];
            var butElement = elements[butName];
            if (butElement) {
                butElement.wmsxControl = butName;
                butElement.addEventListener("touchstart", buttonTouchStart);
                butElement.addEventListener("touchend", buttonTouchEnd);
                butElement.addEventListener("touchcancel", buttonTouchEnd);
            }
        }
    };

    this.toggleMode = function() {
        if (!supported) {
            hub.showErrorMessage("Touch Controls unavailable. Not a touch device!");
            return;
        }

        ++mode; if (mode > 1) mode = -2;
        updateMode();
        hub.showStatusMessage("Touch Controls " + this.getModeDesc());
    };

    this.getModeDesc = function() {
        switch (mode) {
            case -1:  return "AUTO";
            case 0:   return "ENABLED";
            case 1:   return "ENABLED (port 2)";
            default:  return !supported ? "NOT SUPPORTED" : "DISABLED";
        }
    };

    this.setTurboFireSpeed = function(speed) {
        turboFireSpeed = speed ? speed * speed + 3 : 0;
        turboFireFlipClockCount = 0;
    };

    this.getMappingForControl = function(button, port) {
        return null;
    };

    this.screenReadjustedUpdate = function() {
        dirTouchCenterX = dirTouchCenterY = undefined;      // Reset center position, will be set again for the new element position
    };

    function updateMode() {
        port = mode === -2 ? -1 : mode === -1 ? (supported ? 0 : 1) : mode;
        resetStates();
        updateConnectionsToHub();
    }

    function dirTouchStart(e) {
        blockEvent(e);
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
                joyState.portValue = joyState.portValue | 0xf;
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
        joyState.portValue = joyState.portValue & ~0xf | DIRECTION_TO_PORT_VALUE[dir + 1];
    }

    function setDirTouchCenter() {
        var rec = dirElement.getBoundingClientRect();
        dirTouchCenterX = (((rec.left + rec.right) / 2) | 0) + window.pageXOffset;
        dirTouchCenterY = (((rec.top + rec.bottom) / 2) | 0) + window.pageYOffset;
    }

    function buttonTouchStart(e) {
        blockEvent(e);
        processButtonTouch(e.target.wmsxControl, true);
    }

    function buttonTouchEnd(e) {
        blockEvent(e);
        processButtonTouch(e.target.wmsxControl, false);
    }

    function processButtonTouch(control, press) {
        var mappings = prefs.buttons[control];
        if (!mappings.length) return;

        if (press)
            for (var i = 0; i < mappings.length; ++i)
                joyState.portValue &= ~(1 << joystickButtons[mappings[i]]);
        else
            for (i = 0; i < mappings.length; ++i)
                joyState.portValue |=  (1 << joystickButtons[mappings[i]]);
    }

    function updateConnectionsToHub() {
        hub.updateTouchControlsConnections(port === 0 ? wmsx.ControllersHub.TOUCH : null, port === 1 ? wmsx.ControllersHub.TOUCH : null);
    }

    function resetStates() {
        joyState.reset();
    }

    function applyPreferences() {
        prefs = WMSX.userPreferences.current.touch;
    }

    function blockEvent(e) {
        e.stopPropagation();
        e.preventDefault();
    }


    var joystickButtons = wmsx.JoystickButtons;

    var machineControlsSocket;
    var screen;

    var supported = wmsx.Util.isTouchDevice();
    var mode = supported ? WMSX.TOUCH_MODE - 1 : -2;            // -2: disabled, -1: auto, 0: enabled at port 0, 1: enabled at port 1. (parameter is -1 .. 2)
    var port = -1;
    var turboFireSpeed = 0, turboFireFlipClockCount = 0;

    var dirElement = null, dirTouchID = null, dirTouchCenterX, dirTouchCenterY;
    var buttonElements = [ null, null ], buttonTouchIDs = [ null, null ];

    var joyState = new JoystickState();

    var prefs;

    var DIR_DEADZONE = 18;
    var DIRECTION_TO_PORT_VALUE = [ 0xf, 0xe, 0x6, 0x7, 0x5, 0xd, 0x9, 0xb, 0xa ];      // bit 0: on, 1: off


    function JoystickState() {
        this.reset = function() {
            this.portValue = 0x3f;          // All switches off
        };
        this.reset();
    }

};

wmsx.DOMTouchControls.LANDSCAPE_LEFT_MARGIN = 14 + 80 + 14;
wmsx.DOMTouchControls.LANDSCAPE_RIGHT_MARGIN = 14 + 76 + 12;
wmsx.DOMTouchControls.LANDSCAPE_TOTAL_MARGIN = wmsx.DOMTouchControls.LANDSCAPE_LEFT_MARGIN + wmsx.DOMTouchControls.LANDSCAPE_RIGHT_MARGIN;