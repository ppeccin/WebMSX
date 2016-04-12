// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Only 1 Mouse supported, always connected at port 1

wmsx.DOMMouseControls = function() {
    var self = this;

    this.connect = function(pMouseSocket) {
        mouseSocket = pMouseSocket;
        mouseSocket.connectControls(this);
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

    this.readMouseDeltaState = function(port, deltaState) {
        if (port !== 0) return false;

        // Calculate movement deltas, limited to the protocol range
        var dX = Math.round(reportedState.x - currentState.x);
        if (dX > 127) dX = 127; else if (dX < -128) dX = -128;
        reportedState.x -= dX;
        var dY = Math.round(reportedState.y - currentState.y);
        if (dY > 127) dY = 127; else if (dY < -128) dY = -128;
        reportedState.y -= dY;

        deltaState.dX = dX;
        deltaState.dY = dY;

        return true;
    };


    function mouseMoveEvent(event) {
        if (event.preventDefault) event.preventDefault();

        E = event;

        // Get movement either by movement reported (pointer locked) or by position (pointer unlocked)
        var dX = 0, dY = 0;
        if (pointerLocked) {
            dX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            dY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        } else if (lastMoveEvent) {
            dX = event.clientX - lastMoveEvent.clientX;
            dY = event.clientY - lastMoveEvent.clientY;
        }

        currentState.x += dX / pixelScaleX;
        currentState.y += dY / pixelScaleY;

        lastMoveEvent = event;

        //console.log("Mouse moved: " + currentState.x + ", " + currentState.y);
    }

    function mouseButtonEvent(event) {
        if (event.preventDefault) event.preventDefault();

        var lastButtons = currentState.buttons;
        currentState.buttons = event.buttons & 7;

        if ((currentState.buttons & 4) && !(lastButtons & 4)) self.togglePointerLock();

        mouseSocket.writeMouseButtonsState(0, currentState);

        //console.log("Mouse buttons: " + currentState.buttons.toString(2));
    }

    function pointerLockChangedEvent() {
        var lockingElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
        pointerLocked = lockingElement === element;

        //console.log("Pointer Lock " + (pointerLocked ? "ON" : "OFF"));
    }


    var currentState = new MouseState();
    var reportedState = new MouseState();
    var pixelScaleX, pixelScaleY;

    var element;
    var lastMoveEvent;
    var pointerLocked = false;

    var mouseSocket;


    // Stores a complete Mouse state, with positions and buttons
    function MouseState() {
        this.reset = function() {
            this.x = 0;
            this.y = 0;
            this.buttons = 0;
        };
        this.reset();
    }

};


