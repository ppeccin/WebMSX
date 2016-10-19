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

    this.toggleMode = function() {
        if (!isTouch) {
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
            default:  return !isTouch ? "NOT SUPPORTED" : "DISABLED";
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
        this.releaseControllers();
    };

    this.setupTouchControlsIfNeeded = function(mainElement) {
        if (dirElement || port < 0) return;

        var group = document.createElement('div');
        group.id = "wmsx-touch-left";
        mainElement.appendChild(group);

        dirElement = document.createElement('div');
        dirElement.id = "wmsx-touch-dir";
        dirElement.addEventListener("touchstart",  dirTouchStart);
        dirElement.addEventListener("touchmove",   dirTouchMove);
        dirElement.addEventListener("touchend",    dirTouchEnd);
        dirElement.addEventListener("touchcancel", dirTouchEnd);
        createArrowKey(dirElement, "left");
        createArrowKey(dirElement, "right");
        createArrowKey(dirElement, "up");
        createArrowKey(dirElement, "down");
        group.appendChild(dirElement);

        group = document.createElement('div');
        group.id = "wmsx-touch-right";
        mainElement.appendChild(group);

        var buts = wmsx.TouchControls.buttons;
        for (var b in buts) createButton(group, buts[b]);

        updateMappings();

        function createButton(group, name) {
            var but = document.createElement('div');
            but.id = "wmsx-touch-" + name;
            but.classList.add("wmsx-touch-button");
            but.addEventListener("touchstart", buttonTouchStart);
            but.addEventListener("touchend", buttonTouchEnd);
            but.addEventListener("touchcancel", buttonTouchEnd);
            group.appendChild(but);
            buttonElements[name] = but;
        }

        function createArrowKey(parent, dir) {
            var key = document.createElement('div');
            key.id = "wmsx-touch-dir-" + dir;
            parent.appendChild(key);
            var arr = document.createElement('div');
            arr.classList.add("wmsx-arrow-" + dir);
            parent.appendChild(arr);
        }
    };

    function updateMode() {
        port = mode === -2 ? -1 : mode === -1 ? (isTouch && isMobile ? 0 : -1) : mode;
        var active = port >= 0;
        resetStates();
        updateConnectionsToHub();

        if (active) document.documentElement.classList.remove("wmsx-touch-disabled");
        else document.documentElement.classList.add("wmsx-touch-disabled");
        screen.touchControlsModeUpdate(active);
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

        if (dirKeysMode) {
            var release = DIRECTION_TO_KEYS[dirCurrentDir + 1];
            if (release[0]) keyForwardControls.processMSXKey(release[0], false);
            if (release[1]) keyForwardControls.processMSXKey(release[1], false);
            var press = DIRECTION_TO_KEYS[newDir + 1];
            if (press[0]) keyForwardControls.processMSXKey(press[0], true);
            if (press[1]) keyForwardControls.processMSXKey(press[1], true);
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
        processButtonTouch(e.target.wmsxControl, true);
    }

    function buttonTouchEnd(e) {
        blockEvent(e);
        processButtonTouch(e.target.wmsxControl, false);
    }

    function processButtonTouch(mapping, press) {
        if (!mapping) return;

        if (mapping.mask) {
            // Joystick button
            if (press) joyState.portValue &= ~mapping.mask;
            else       joyState.portValue |=  mapping.mask;
        } else if (mapping.key) {
            // Keyboard key
            keyForwardControls.processMSXKey(mapping.key, press);
        }
    }

    function updateMappings() {
        if (prefs.directional === "KEYBOARD") {
            dirKeysMode = true;
            dirElement.classList.add("wmsx-touch-dir-key");
            dirElement.classList.remove("wmsx-touch-dir-joy");
        } else {
            dirKeysMode = false;
            dirElement.classList.add("wmsx-touch-dir-joy");
            dirElement.classList.remove("wmsx-touch-dir-key");
        }

        for (var but in buttonElements) {
            var butElement = buttonElements[but];
            var mapping = prefs.buttons[but];
            butElement.innerHTML = mapping ? mapping.n || mapping.sn : "";
            butElement.wmsxControl = mapping;
            if (!mapping || mapping.mask) {
                butElement.classList.add("wmsx-touch-button-joy");
                butElement.classList.remove("wmsx-touch-button-key");
                for (var b = 0; b < BUTTONS_SPECIAL_CLASSES.length; ++b) {
                    var but = BUTTONS_SPECIAL_CLASSES[b];
                    if (mapping && mapping.n === but) butElement.classList.add("wmsx-touch-button-joy-" + but);
                    else butElement.classList.remove("wmsx-touch-button-joy-" + but);
                }
            } else if (mapping.key) {
                butElement.classList.add("wmsx-touch-button-key");
                butElement.classList.remove("wmsx-touch-button-joy");
            }
        }
    }

    function updateConnectionsToHub() {
        hub.updateTouchControlsConnections(port === 0 ? wmsx.ControllersHub.TOUCH : null, port === 1 ? wmsx.ControllersHub.TOUCH : null);
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


    var joystickButtons = wmsx.JoystickButtons;

    var machineControlsSocket;
    var screen;

    var isTouch = wmsx.Util.isTouchDevice();
    var isMobile = wmsx.Util.isMobileDevice();
    var mode = WMSX.TOUCH_MODE >= 1 ? WMSX.TOUCH_MODE - 1 : isTouch ? -1 : -2;            // -2: disabled, -1: auto, 0: enabled at port 0, 1: enabled at port 1. (parameter is -1 .. 2)
    var port = -1;
    var turboFireSpeed = 0, turboFireFlipClockCount = 0;

    var dirKeysMode = false;
    var dirElement = null, dirTouchID = null, dirTouchCenterX, dirTouchCenterY, dirCurrentDir = -1;
    var buttonElements = { };

    var joyState = new JoystickState();

    var prefs;

    var DIR_DEADZONE = 18;
    var DIRECTION_TO_PORT_VALUE = [ 0xf, 0xe, 0x6, 0x7, 0x5, 0xd, 0x9, 0xb, 0xa ];      // bit 0: on, 1: off
    var DIRECTION_TO_KEYS = [ [ ], [ "UP" ], [ "RIGHT", "UP" ], [ "RIGHT" ], [ "RIGHT", "DOWN" ], [ "DOWN" ], [ "LEFT", "DOWN" ], [ "LEFT" ], [ "LEFT", "UP" ] ];

    var BUTTONS_SPECIAL_CLASSES = [ "A", "B", "AB" ];


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