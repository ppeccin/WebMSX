// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ControllersHub = function() {

    this.connect = function(keyboardSocket, controllersSocket, machineControlsSocket) {
        controllersSocket.connectControls(this);
        keyboard.connect(keyboardSocket);
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

    this.resetControllers = function() {
        keyboard.liftAllKeys();
        joystickControls.resetControllers();
        mouseControls.resetControllers();
    };

    this.readControllerPort = function(port) {
        return readFromControllerPort[port](port);
    };

    this.writePin8ControllerPort = function(port, value) {
        writePin8ToControllerPort[port](port, value);
    };

    this.controllersClockPulse = function() {
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

    this.toggleTurboFireMode = function() {
        turboFireMode = (turboFireMode + 1) % 2;
        screen.showOSD("Turbo-Fire: " + (turboFireMode ? "ON" : "OFF"), true);
        joystickControls.setTurboFireMode(turboFireMode);
    };

    this.setKeyInputElements = function(elements) {
        keyboard.addInputElements(elements);
    };

    this.setMouseInputElement = function(element) {
        mouseControls.setInputElement(element);
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

    var keyboard =         new wmsx.DOMKeyboard(this);
    var mouseControls =    new wmsx.DOMMouseControls(this);
    var joystickControls = new wmsx.GamepadJoysticksControls(this);

    var turboFireMode = 0;

    var screen;

};


