// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ControllersHub = function(keyForwardControls) {
"use strict";

    this.connect = function(controllersSocket, machineControlsSocket) {
        controllersSocket.connectControls(this);
        keyboard.connect(controllersSocket);
        mouseControls.connect(controllersSocket);
        joystickControls.connect(machineControlsSocket);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
        keyboard.connectPeripherals(screen);
        mouseControls.connectPeripherals(screen);
        joystickControls.connectPeripherals(screen);
    };

    this.powerOn = function() {
        keyboard.powerOn();
        mouseControls.powerOn();
        joystickControls.powerOn();
    };

    this.powerOff = function() {
        keyboard.powerOff();
        mouseControls.powerOff();
        joystickControls.powerOff();
    };

    this.releaseControllers = function() {
        keyboard.releaseControllers();
        joystickControls.releaseControllers();
        mouseControls.releaseControllers();
    };

    this.resetControllers = function() {
        keyboard.resetControllers();
        joystickControls.resetControllers();
        mouseControls.resetControllers();
    };

    this.readKeyboardPort = function(row) {
        return keyboard.readKeyboardPort(row);
    };

    this.readControllerPort = function(port) {
        return readFromControllerPort[port](port) | keyboard.readJapaneseKeyboardLayoutPort();
    };

    this.writePin8ControllerPort = function(port, value) {
        writePin8ToControllerPort[port](port, value);
    };

    this.controllersClockPulse = function() {
        keyboard.controllersClockPulse();
        joystickControls.controllersClockPulse();
    };

    this.toggleKeyboardHostLayout = function() {
        keyboard.toggleHostKeyboards();
    };

    this.toggleJoystickMode = function() {
        joystickControls.toggleMode();
    };

    this.toggleMouseMode = function() {
        mouseControls.toggleMode();
    };

    this.toggleTurboFireSpeed = function() {
        turboFireSpeed = (turboFireSpeed + 1) % 7;
        screen.showOSD("Turbo-Fire" + (turboFireSpeed ? " speed: " + (7 - turboFireSpeed) : ": OFF"), true);
        keyboard.setTurboFireSpeed(turboFireSpeed);
        joystickControls.setTurboFireSpeed(turboFireSpeed);
    };

    this.setKeyInputElement = function(element) {
        keyboard.setKeyInputElement(element);
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

    this.showStatusMessage = function(prefix) {
        var p1 = mousePresent[0] || joystickPresent[0] || "&nbsp-&nbsp-&nbsp&nbsp";
        var p2 = mousePresent[1] || joystickPresent[1] || "&nbsp-&nbsp-&nbsp&nbsp";
        screen.showOSD((prefix ? prefix + ".&nbsp&nbsp" : "" ) + "Port 1:&nbsp&nbsp" +p1 + ",&nbsp&nbspPort 2:&nbsp&nbsp" + p2, true);
    };

    function updateConnections() {
        // Mouse takes precedence
        for (var p = 0; p <= 1; ++p) {
            if (mousePresent[p]) {
                readFromControllerPort[p] = mouseControls.readMousePort;
                writePin8ToControllerPort[p] =  mouseControls.writeMousePin8Port;
            } else if (joystickPresent[p]) {
                readFromControllerPort[p] = joystickControls.readJoystickPort;
                writePin8ToControllerPort[p] =  writePin8PortDisconnected;        // Mouse does not take writes
            } else {
                readFromControllerPort[p] = readPortDisconnected;
                writePin8ToControllerPort[p] =  writePin8PortDisconnected;
            }
        }
    }

    function readPortDisconnected(port) {
        return 0x3f;
    }

    function writePin8PortDisconnected(port, val) {
        // Give Mouse a chance to Auto Enable
        mouseControls.portPin8Announced(port, val);
    }


    var readFromControllerPort = [ readPortDisconnected, readPortDisconnected ];
    var writePin8ToControllerPort =  [ writePin8PortDisconnected, writePin8PortDisconnected ];

    var mousePresent =    [ null, null ];
    var joystickPresent = [ null, null ];

    var keyboard =         new wmsx.DOMKeyboard(this, keyForwardControls);
    var mouseControls =    new wmsx.DOMMouseControls(this);
    var joystickControls = new wmsx.GamepadJoysticksControls(this);

    var turboFireSpeed = 0;

    var screen;

};


