// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ControllersHub = function(room, machineControls) {
"use strict";

    var self = this;

    this.connect = function(machineTypeSocket, machineControlsSocket, controllersSocket, biosSocket) {
        controllersSocket.connectControls(this);
        keyboard.connect(machineTypeSocket, biosSocket);
        mouseControls.connect(controllersSocket);
        touchControls.connect(machineControlsSocket);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
        keyboard.connectPeripherals(screen);
        mouseControls.connectPeripherals(screen);
        joystickControls.connectPeripherals(screen);
        joykeysControls.connectPeripherals(screen);
        touchControls.connectPeripherals(screen);
    };

    this.powerOn = function() {
        keyboard.powerOn();
        mouseControls.powerOn();
        joystickControls.powerOn();
        joykeysControls.powerOn();
        touchControls.powerOn();
    };

    this.powerOff = function() {
        keyboard.powerOff();
        mouseControls.powerOff();
        joystickControls.powerOff();
        joykeysControls.powerOff();
        touchControls.powerOff();
    };

    this.getKeyboard = function() {
        return keyboard;
    };

    this.getTouchControls = function() {
        return touchControls;
    };

    this.releaseControllers = function() {
        keyboard.releaseControllers();
        joystickControls.releaseControllers();
        joykeysControls.releaseControllers();
        mouseControls.releaseControllers();
        touchControls.releaseControllers();
    };

    this.resetControllers = function() {
        keyboard.resetControllers();
        joystickControls.resetControllers();
        joykeysControls.resetControllers();
        mouseControls.resetControllers();
    };

    this.roomNetPlayStatusChangeUpdate = function(oldMode) {
        mouseControls.netSetClientMode(room.netPlayMode === 2);
    };

    this.readKeyboardPort = function(row) {
        return keyboard.readKeyboardPort(row);
    };

    this.readControllerPort = function(port) {
        var forward = controllerAtPort[port];
        return forward ? forward.readControllerPort(port) : this.netGetMergedPortValues()[port];
    };

    function readLocalControllerPortForMerging(port) {
        // MouseControls are Net-aware and do not participate in port merging
        var forward = controllerAtPort[port];
        return forward && forward !== mouseControls
            ? forward.readLocalControllerPort(port) | japanaseKeyboardLayoutPortValue
            : portValueAllReleased;
    }

    this.writeControllerPin8Port = function(port, value) {
        mouseControls.portPin8Announced(port, value);       // Give Mouse a chance to Auto Enable
        var forward = controllerAtPort[port];
        if (forward) forward.writeControllerPin8Port(port, value);
    };

    this.controllersClockPulse = function() {
        keyboard.controllersClockPulse();
        joykeysControls.controllersClockPulse();
        joystickControls.controllersClockPulse();
        touchControls.controllersClockPulse();

        if (room.netPlayMode === 1) netServerUpdateMergedPortValues();
        else if(room.netPlayMode === 2) netClientUpdateMergedPortValues();
    };

    this.toggleKeyboardLayout = function() {
        keyboard.toggleKeyboardLayout();
    };

    this.toggleJoystickMode = function() {
        joystickControls.toggleMode();
    };

    this.toggleJoykeysMode = function() {
        joykeysControls.toggleMode();
    };

    this.toggleMouseMode = function() {
        mouseControls.toggleMode();
    };

    this.toggleTouchControlsMode = function(skipAuto) {
        touchControls.toggleMode(skipAuto);
    };

    this.toggleHapticFeedback = function() {
        if (hapticFeedbackCapable) {
            hapticFeedbackEnabled = !hapticFeedbackEnabled;
            WMSX.userPreferences.current.hapticFeedback = hapticFeedbackEnabled;
            WMSX.userPreferences.setDirty();
        } else
            this.showErrorMessage("Haptic Feedback not available");
    };

    this.toggleTurboFireSpeed = function() {
        turboFireSpeed = (turboFireSpeed + 1) % 11;
        var turboClocks = turboFireSpeed ? (60 / turboFirePerSecond[turboFireSpeed]) | 0 : 0;
        keyboard.setTurboFireClocks(turboClocks);
        joystickControls.setTurboFireClocks(turboClocks);
        joykeysControls.setTurboFireClocks(turboClocks);
        touchControls.setTurboFireClocks(turboClocks);
        screen.showOSD("Turbo Fire" + (turboFireSpeed ? " speed: " + this.getTurboFireSpeedDesc() : ": OFF"), true);
    };

    this.getTurboFireSpeedDesc = function() {
        return turboFireSpeed ? turboFireSpeed + "x" : "OFF";
    };

    this.getControlReport = function(control) {
        switch (control) {
            case wmsx.PeripheralControls.TOUCH_TOGGLE_DIR_BIG:
                var dirBig = touchControls.isDirBig();
                return { label: dirBig ? "ON" : "OFF", active: dirBig };
            case wmsx.PeripheralControls.HAPTIC_FEEDBACK_TOGGLE_MODE:
                return { label: hapticFeedbackEnabled ? "ON" : "OFF", active: !!hapticFeedbackEnabled };
            case wmsx.PeripheralControls.TURBO_FIRE_TOGGLE:
                return { label: this.getTurboFireSpeedDesc(), active: !!turboFireSpeed };
        }
        return { label: "Unknown", active: false };
    };

    this.setupTouchControlsIfNeeded = function(mainElement) {
        touchControls.setupTouchControlsIfNeeded(mainElement)
    };

    this.setKeyInputElement = function(element) {
        element.addEventListener("keydown", this.keyDown);
        element.addEventListener("keyup", this.keyUp);
    };

    this.screenReadjustedUpdate = function() {
        touchControls.screenReadjustedUpdate();
    };

    this.keyDown = function(e) {
        return processKeyEvent(e, true);
    };

    this.keyUp = function(e) {
        return processKeyEvent(e, false);
    };

    this.setMouseInputElement = function(element) {
        mouseControls.setMouseInputElement(element);
    };

    this.setScreenPixelScale = function(scaleX, scaleY) {
        mouseControls.setScreenPixelScale(scaleX, scaleY);
    };

    this.updateMouseConnections = function(onPort0, onPort1) {
        mousePresent[0] = onPort0; mousePresent[1] = onPort1;
        updateConnections();
    };

    this.updateJoystickConnections = function(onPort0, onPort1) {
        joystickPresent[0] = onPort0; joystickPresent[1] = onPort1;
        updateConnections();
    };

    this.updateJoykeysConnections = function(onPort0, onPort1) {
        joykeysPresent[0] = onPort0; joykeysPresent[1] = onPort1;
        updateConnections();
    };

    this.updateTouchControlsConnections = function(onPort0, onPort1) {
        touchPresent[0] = onPort0; touchPresent[1] = onPort1;
        updateConnections();
    };

    this.showStatusMessage = function(prefix) {
        var p1 = mousePresent[0] || joystickPresent[0] || joykeysPresent[0] || touchPresent[0] || "&nbsp-&nbsp-&nbsp&nbsp";
        var p2 = mousePresent[1] || joystickPresent[1] || joykeysPresent[1] || touchPresent[1] || "&nbsp-&nbsp-&nbsp&nbsp";
        screen.showOSD((prefix ? prefix + ".&nbsp&nbsp" : "" ) + "Port 1:&nbsp&nbsp" + p1 + ",&nbsp&nbspPort 2:&nbsp&nbsp" + p2, true);
    };

    this.showErrorMessage = function(message) {
        screen.showOSD(message, true, true);
    };

    this.getSettingsState = function() {
        settingsStateRet.mouseModeDesc = mouseControls.getModeDesc();
        settingsStateRet.joysticksModeDesc = joystickControls.getModeDesc();
        settingsStateRet.joykeysModeDesc = joykeysControls.getModeDesc();
        settingsStateRet.touchPortSet = touchControls.getPortActive();
        settingsStateRet.touchActive = controllerAtPort[0] === touchControls || controllerAtPort[1] === touchControls;
        settingsStateRet.ports[0] = mousePresent[0] || joystickPresent[0] || joykeysPresent[0] || touchPresent[0] || wmsx.ControllersHub.NONE;
        settingsStateRet.ports[1] = mousePresent[1] || joystickPresent[1] || joykeysPresent[1] || touchPresent[1] || wmsx.ControllersHub.NONE;
        return settingsStateRet;
    };

    this.getMappingForControl = function(button, port) {
        return controllerAtPort[port] && controllerAtPort[port].getMappingForControl(button, port);
    };

    this.getMappingPopupText = function(button, port) {
        return controllerAtPort[port] && controllerAtPort[port].getMappingPopupText(button, port);
    };

    this.mappingPopupVisibility = function(popup, port, visible) {
        // Start listening for joystick button presses if needed
        if (visible && controllerAtPort[port] === joystickControls)
            joystickControls.startButtonDetection(port, popup);
        else
            joystickControls.stopButtonDetection();
    };

    this.customizeControl = function(button, port, mapping) {
        controllerAtPort[port].customizeControl(button, port, mapping);
    };

    this.clearControl = function(button, port) {
        return controllerAtPort[port].clearControl(button, port);
    };

    this.hapticFeedback = function() {
        if (hapticFeedbackEnabled) navigator.vibrate(8);
    };

    this.hapticFeedbackOnTouch = function(e) {
        if (hapticFeedbackEnabled && (e.type === "touchstart" || e.type === "touchend" || e.type === "touchmove")) navigator.vibrate(8);
    };

    var processKeyEvent = function(e, press) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();

        var code = domKeys.codeNewForKeyboardEvent(e);

        // console.log("Key " + (press ? "Press" : "Release") + ", code: " + e.code + ", keyCode: " + e.keyCode /*.toString(16)*/ + ", wc: " + code + ", key: " + e.key + ", which: " + e.which);

        joykeysControls.processKey(code, press);

        return false;
    };

    function updateConnections() {
        // Mouse takes precedence, then Joysticks, then Joykeys, then Touch
        for (var p = 0; p <= 1; ++p) {
            if (mousePresent[p])
                controllerAtPort[p] = mouseControls;
            else if (joystickPresent[p])
                controllerAtPort[p] = joystickControls;
            else if (joykeysPresent[p])
                controllerAtPort[p] = joykeysControls;
            else if (touchPresent[p])
                controllerAtPort[p] = touchControls;
            else
                controllerAtPort[p] = null;
        }
        touchControls.controllersSettingsStateUpdate();
        screen.controllersSettingsStateUpdate();
    }


    // NetPlay  -------------------------------------------

    this.netGetInfoToSend = function() {
        var mouseInfo = mouseControls.netGetMouseStateToSend();
        return mouseInfo || netMergedPortValuesToSend
            ? { m: mouseInfo, p: netMergedPortValuesToSend }
            : undefined;
    };

    this.netClearInfoToSend = function() {
        netMergedPortValuesToSend = undefined;
        mouseControls.netClearMouseInfoToSend();
    };

    this.netServerGetFullInfo = function() {
        return { m: mouseControls.netServerGetMouseState(), p: netMergedPortValues };
    };

    this.netGetMergedPortValues = function() {
        return netMergedPortValues;
    };

    this.netClientReceiveServerInfo = function(info) {
        if (info.m) mouseControls.netClientReceiveServerMouseState(info.m);

        var portValues = info.p;
        if (portValues) {
            netMergedPortValues[0] = portValues[0]; netMergedPortValues[1] = portValues[1];
        }
    };

    this.netServerReceiveClientInfo = function(client, info) {
        // console.log("Receiving Client info:", info);

        // Update Mouse info immediately
        if (info.m) mouseControls.netServerReceiveClientMouseState(info.m);

        // Store other Clients merged port values for later
        var portValues = info.p;
        if (portValues) {
            netClientsMergedPortValuesChanged = true;

            // Retain values only if they are different than the all-released state
            client.controllersPortValues = portValues[0] !== portValueAllReleased || portValues[1] !== portValueAllReleased
                ? portValues : undefined;
        }
    };

    this.netServerClearClientsMergedInfo = function () {
        netClientsMergedPortValues[0] = portValueAllReleased; netClientsMergedPortValues[1] = portValueAllReleased;
        netClientsMergedPortValuesChanged = false;
    };

    function netClientUpdateMergedPortValues() {
        var a = readLocalControllerPortForMerging(0);
        var b = readLocalControllerPortForMerging(1);

        // Have they changed?
        if (netLocalMergedPortValues[0] !== a || netLocalMergedPortValues[1] !== b) {
            netLocalMergedPortValues[0] = a; netLocalMergedPortValues[1] = b;
            netMergedPortValuesToSend = netLocalMergedPortValues;
        }
    }

    function netServerUpdateMergedPortValues() {
        if (netClientsMergedPortValuesChanged) {
            // console.log("Updating Clients merged port values");

            self.netServerClearClientsMergedInfo();
            var clients = room.netController.clients;
            for (var nick in clients) {
                var portValues = clients[nick].controllersPortValues;
                if (!portValues) continue;
                netClientsMergedPortValues[0] &= portValues[0];
                netClientsMergedPortValues[1] &= portValues[1];
            }
        }

        var a = readLocalControllerPortForMerging(0) & netClientsMergedPortValues[0];
        var b = readLocalControllerPortForMerging(1) & netClientsMergedPortValues[1];

        // Have they changed?
        if (netMergedPortValues[0] !== a || netMergedPortValues[1] !== b) {
            netMergedPortValues[0] = a; netMergedPortValues[1] = b;
            netMergedPortValuesToSend = netMergedPortValues;
        }
    }

    this.netServerGetControlsModes = function () {
        return { m: mouseControls.getModeEffective(), sw: joykeysControls.getSwappedState() || joystickControls.getSwappedState() || touchControls.getSwappedState() };
    };

    this.netClientGetControlsModes = function() {
        return { k: joykeysControls.getMode(), j: joystickControls.getMode(), m: mouseControls.getModeEffective(), t: touchControls.getMode() };
    };

    this.netClientRestoreControlsModes = function(modes) {
        joykeysControls.setMode(modes.k);
        joystickControls.setMode(modes.j);
        mouseControls.setModeEffective(modes.m);
        touchControls.setMode(modes.t);
    };

    this.netClientAdaptToServerControlsModes = function(modes) {
        joykeysControls.netClientAdaptToServerControlsModes(modes);
        joystickControls.netClientAdaptToServerControlsModes(modes);
        mouseControls.netClientAdaptToServerControlsModes(modes);
        touchControls.netClientAdaptToServerControlsModes(modes);
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            jk: japanaseKeyboardLayoutPortValue,
            t: touchControls.saveState(),
            h: hapticFeedbackEnabled
        };
    };

    this.loadState = function(s) {
        if (s.jk !== undefined) {
            japanaseKeyboardLayoutPortValue = s.jk;
            portValueAllReleased = 0x3f | japanaseKeyboardLayoutPortValue;
            this.portValueAllReleased = portValueAllReleased;
        }
        if (s.t) touchControls.loadState(s.t);
        if (s.h !== undefined) hapticFeedbackEnabled = s.h && hapticFeedbackCapable;
    };


    var domKeys = wmsx.DOMKeys;

    var controllerAtPort = [ null, null ];

    var mousePresent =     [ null, null ];
    var joystickPresent =  [ null, null ];
    var joykeysPresent =   [ null, null ];
    var touchPresent =     [ null, null ];
    var settingsStateRet = { ports: [ null, null ]};

    // Key processing sequence: JoyKeys -> Keyboard -> MachineControls -> PeripheralControls
    var keyboard =         new wmsx.DOMKeyboard(this, room, machineControls);
    var mouseControls =    new wmsx.DOMMouseControls(room, this);
    var joystickControls = new wmsx.GamepadJoysticksControls(room, this, keyboard);
    var joykeysControls =  new wmsx.DOMJoykeysControls(room, this, keyboard);
    var touchControls =    new wmsx.DOMTouchControls(room, this, keyboard, machineControls);

    var turboFireSpeed = 0;
    var turboFirePerSecond = [ 0, 2, 2.4, 3, 4, 5, 6, 7.5, 10, 12, 15 ];

    var hapticFeedbackCapable = !!navigator.vibrate;
    var hapticFeedbackEnabled = hapticFeedbackCapable && !!WMSX.userPreferences.current.hapticFeedback;

    var japanaseKeyboardLayoutPortValue = WMSX.KEYBOARD_JAPAN_LAYOUT !== 0 ? 0x40 : 0;

    var portValueAllReleased = 0x3f | japanaseKeyboardLayoutPortValue;
    this.portValueAllReleased = portValueAllReleased;

    var netMergedPortValues = [ portValueAllReleased, portValueAllReleased ];
    var netLocalMergedPortValues = [ portValueAllReleased, portValueAllReleased ];
    var netClientsMergedPortValues = [ portValueAllReleased, portValueAllReleased ];
    var netClientsMergedPortValuesChanged = false;
    var netMergedPortValuesToSend;

    var screen;


    wmsx.ControllersHub.hapticFeedback = this.hapticFeedback;
    wmsx.ControllersHub.hapticFeedbackOnTouch = this.hapticFeedbackOnTouch;

};


wmsx.ControllersHub.MOUSE =    "MOUSE";
wmsx.ControllersHub.JOYSTICK = "JOYSTICK";
wmsx.ControllersHub.JOYKEYS =  "JOYKEYS";
wmsx.ControllersHub.TOUCH =    "TOUCH";
wmsx.ControllersHub.JOY_ANY =  "JOY";
wmsx.ControllersHub.NONE =     "NO DEVICE";