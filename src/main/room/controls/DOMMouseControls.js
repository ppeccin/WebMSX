// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Only 1 Mouse supported, always connected at port 1

wmsx.DOMMouseControls = function(hub, joystickControls) {
    var self = this;

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.resetControllers = function() {
        if (mode === -1) port = -1;     // If in Auto mode, disable mouse
        mouseState.reset();
        updateConnectionsToHub();
    };

    this.toggleMode = function() {
        ++mode; if (mode > 1) mode = -2;
        port = mode < 0 ? -1 : mode;
        if (port < 0) mouseState.reset();

        updateConnectionsToHub();
        showStatusMessage(mode === -2 ? "Mouse DISABLED" : mode == -1 ? "Mouse AUTO" : mode === 0 ? "Mouse ENABLED" : "Mouse ENABLED (swapped)");
    };

    this.readMousePort = function(atPort) {
        if (atPort === port) return mouseState.portValue;
        else return 0x3f;
    };

    this.writeMousePin8Port = function(atPort, val) {
        if (atPort !== port) return;

        var flipped = mouseState.pin8Value ^ val;
        mouseState.pin8Value = val;

        if (flipped) ++mouseState.readCycle;
        else mouseState.readCycle = -1;

        if (mouseState.readCycle === 0) updateDeltas();
        updatePortValue();

        //console.log("Mouse SET ReadCycle: " + mouseState.readCycle);
    };

    this.portPin8Announced = function(atPort, val) {
        if (val === 1 && port < 0 && mode === -1) tryAutoEnable(atPort, val);
    };

    this.togglePointerLock = function() {
        var func;
        if (pointerLocked) {
            func = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
            if (func) func.apply(document);
        } else {
            func = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            if (func) func.apply(element);
        }
    };

    this.setInputElement = function(pElement) {
        element = pElement;

        // Register events needed
        if ("onpointerlockchange" in document) document.addEventListener('pointerlockchange', pointerLockChangedEvent, false);
        else if ("onmozpointerlockchange" in document) document.addEventListener('mozpointerlockchange', pointerLockChangedEvent, false);
        element.addEventListener("mousemove", mouseMoveEvent);
        element.addEventListener("mousedown", mouseButtonEvent);
        element.addEventListener("mouseup",   mouseButtonEvent);

        // Suppress Context menu
        element.addEventListener("contextmenu", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        });
    };

    this.setScreenPixelScale = function(scaleX, scaleY) {
        pixelScaleX = scaleX; pixelScaleY = scaleY;
    };

    function updatePortValue() {
        switch (mouseState.readCycle) {
            case 0:
                mouseState.portValue = (mouseState.portValue & ~0x0f) | ((mouseState.readDX >> 4) & 0xf); break;
            case 1:
                mouseState.portValue = (mouseState.portValue & ~0x0f) | (mouseState.readDX & 0xf); break;
            case 2:
                mouseState.portValue = (mouseState.portValue & ~0x0f) | ((mouseState.readDY >> 4)& 0xf); break;
            case 3:
                mouseState.portValue = (mouseState.portValue & ~0x0f) | (mouseState.readDY & 0xf); break;
            default:
                mouseState.portValue = mouseState.portValue & ~0x0f;
        }

        //console.log("Setting mouse port value: " + (mouseState.portValue & 0xf));
    }

    function updateDeltas() {
        // Calculate movement deltas, limited to the protocol range
        var dX = Math.round(-mouseState.dX);
        if (dX > 127) dX = 127; else if (dX < -127) dX = -127;
        mouseState.dX += dX;
        mouseState.readDX = dX;

        var dY = Math.round(-mouseState.dY);
        if (dY > 127) dY = 127; else if (dY < -127) dY = -127;
        mouseState.dY += dY;
        mouseState.readDY = dY;

        //if (dX !== 0 && dY !== 0) console.log("New DX: " + dX + ", DY: " + dY);
    }

    function mouseMoveEvent(event) {
        if (event.preventDefault) event.preventDefault();

        // Get movement either by movement reported (pointer locked) or by position (pointer unlocked)
        var dX = 0, dY = 0;
        if (pointerLocked) {
            dX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            dY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        } else if (lastMoveEvent) {
            dX = event.clientX - lastMoveEvent.clientX;
            dY = event.clientY - lastMoveEvent.clientY;
        }
        lastMoveEvent = event;

        mouseState.dX += dX / pixelScaleX;
        mouseState.dY += dY / pixelScaleY;

        //console.log("Mouse moved. DX: " + mouseState.dX + ", DY: " + mouseState.dY);
    }

    function mouseButtonEvent(event) {
        if (event.preventDefault) event.preventDefault();

        var lastButtons = mouseState.buttons;
        mouseState.buttons = event.buttons & 7;
        mouseState.portValue = (mouseState.portValue & ~0x30) | ((~mouseState.buttons & 3) << 4);

        updateHubPrimaryAbsentPortValue();

        if ((mouseState.buttons & 4) && !(lastButtons & 4)) self.togglePointerLock();
    }

    function pointerLockChangedEvent() {
        var lockingElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
        pointerLocked = lockingElement === element;

        screen.showOSD(pointerLocked ? "Mouse Pointer Locked" : "Mouse Pointer Released", true);
    }

    function updateHubPrimaryAbsentPortValue() {
        // Send port value to the ControllersHub, to function as alternate detection mode
        hub.setPrimaryAbsentPortValue(mouseState.portValue | 0xcf);           // Only buttons
    }

    function tryAutoEnable(atPort, pin8Val) {
        port = atPort;

        self.writeMousePin8Port(port, pin8Val);
        updateConnectionsToHub();

        showStatusMessage("Mouse AUTO-ENABLED");
    }

    function updateConnectionsToHub() {
        hub.updateMouseConnections(port === 0 ? "MOUSE" : null, port === 1 ? "MOUSE" : null);
        screen.setMouseActiveCursor(port >= 0);
    }

    function showStatusMessage(mes) {
        hub.showStatusMessage(mes);
    }


    var mouseState = new MouseState();

    var mode = -1;                               // -1: auto, 0: enabled at port 0, 1: enabled at port 1, -2: disabled
    var port = -1;                               // -1: disconnected, 0: connected at port 0, 1: connected at port 1
    var pixelScaleX = 1, pixelScaleY = 1;

    var element;
    var lastMoveEvent;
    var pointerLocked = false;

    var screen;


    // Stores a complete Mouse state, with positions and buttons
    function MouseState() {
        this.reset = function() {
            this.dX = 0;
            this.dY = 0;
            this.buttons = 0;

            this.portValue = 0x3f;
            this.pin8Value = 0;
            this.readCycle = -1;
            this.readDX = 0;
            this.readDY = 0;
        };
        this.reset();
    }

};


