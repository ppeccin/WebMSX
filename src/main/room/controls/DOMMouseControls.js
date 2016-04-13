// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Only 1 Mouse supported, always connected at port 1

wmsx.DOMMouseControls = function() {
    var self = this;

    this.connect = function(pMouseSocket) {
        mouseSocket = pMouseSocket;
        mouseSocket.connectControls(this);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
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

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    // port 0 only
    this.readMousePort = function(port) {
        return port === 0 ? mouseState.portValue : 0x3f;
    };

    // port 0 only
    this.writeMousePort = function(value) {
        var mod = mouseState.portWriteValue ^ value;
        mouseState.portWriteValue = value;

        var pin8Flipped = mod & 0x10;

        if (pin8Flipped) ++mouseState.readCycle;
        else mouseState.readCycle = -1;

        if (mouseState.readCycle === 0) updateDeltas();
        updatePortValue();

        //console.log("Mouse SET ReadCycle: " + mouseState.readCycle);
    };

    this.setPixelScale = function(scaleX, scaleY) {
        pixelScaleX = scaleX; pixelScaleY = scaleY;
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

        if ((mouseState.buttons & 4) && !(lastButtons & 4)) self.togglePointerLock();
    }

    function pointerLockChangedEvent() {
        var lockingElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
        pointerLocked = lockingElement === element;

        screen.showOSD(pointerLocked ? "Mouse Pointer Locked" : "Mouse Pointer Released", true);
    }


    var mouseState = new MouseState();

    var pixelScaleX, pixelScaleY;

    var element;
    var lastMoveEvent;
    var pointerLocked = false;

    var mouseSocket;
    var screen;


    // Stores a complete Mouse state, with positions and buttons
    function MouseState() {
        this.reset = function() {
            this.dX = 0;
            this.dY = 0;
            this.buttons = 0;

            this.portValue = 0x3f;
            this.portWriteValue = 0;
            this.readCycle = -1;
            this.readDX = 0;
            this.readDY = 0;
        };
        this.reset();
    }

};


