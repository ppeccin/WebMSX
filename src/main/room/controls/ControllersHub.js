// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ControllersHub = function() {

    this.connect = function(controllersSocket, machineControlsSocket) {
        controllersSocket.connectControls(this);
        joystickControls.connect(machineControlsSocket);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
        joystickControls.connectPeripherals(screen);
        mouseControls.connectPeripherals(screen);
    };

    this.powerOn = function() {
        joystickControls.powerOn();
        mouseControls.powerOn();
    };

    this.powerOff = function() {
        joystickControls.powerOff();
        mouseControls.powerOff();
    };

    this.resetControllers = function() {
        alternatePrimaryPortValue = 0x3f;

        joystickControls.resetControllers();
        mouseControls.resetControllers();
    };

    this.readPort = function(port) {
        return port === 0
            ? readFromPort[port](port) & alternatePrimaryPortValue
            : readFromPort[port](port);
    };

    this.writePin8Port = function(port, value) {
        writePin8ToPort[port](port, value);
    };

    this.controllersClockPulse = function() {
        joystickControls.controllersClockPulse();
    };

    this.toggleJoystickMode = function() {
        joystickControls.toggleMode();
    };

    this.toggleMouseMode = function() {
        mouseControls.toggleMode();
    };

    this.setMouseInputElement = function(element) {
        mouseControls.setInputElement(element);
    };

    this.setScreenPixelScale = function(scaleX, scaleY) {
        mouseControls.setScreenPixelScale(scaleX, scaleY);
    };

    this.setAlternatePrimaryPortValue = function(val) {
        alternatePrimaryPortValue = val;
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
                readFromPort[p] = mouseControls.readMousePort;
                writePin8ToPort[p] =  mouseControls.writeMousePin8Port;
            } else if (joystickPresent[p]) {
                readFromPort[p] = joystickControls.readJoystickPort;
                writePin8ToPort[p] =  writePin8PortDisconnected;        // Mouse does not take writes
            } else {
                readFromPort[p] = readPortDisconnected;
                writePin8ToPort[p] =  writePin8PortDisconnected;
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


    var readFromPort = [ readPortDisconnected, readPortDisconnected ];
    var writePin8ToPort =  [ writePin8PortDisconnected, writePin8PortDisconnected ];

    var alternatePrimaryPortValue;

    var mousePresent =    [ null, null ];
    var joystickPresent = [ null, null ];

    var joystickControls = new wmsx.GamepadJoysticksControls(this);
    var mouseControls =    new wmsx.DOMMouseControls(this, joystickControls);

    var screen;

};


