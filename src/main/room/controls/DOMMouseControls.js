// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Only 1 Mouse supported

// TODO Screen focus problem. Verify metrics
wmsx.DOMMouseControls = function(room, hub) {
"use strict";

    var self = this;

    this.connect = function(peControllersSocket) {
        controllersSocket = peControllersSocket;
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        updateMode();
    };

    this.powerOff = function() {
    };

    this.releaseControllers = function() {
        if (port >= 0) {
            if (netClientMode) resetClientModeLocalMouseState(mouseLocalState);
            else resetMouseState(mouseState);
        }
    };

    this.resetControllers = function() {
        this.releaseControllers();
        if (mode === -1) port = -1;     // If in Auto mode, disable mouse
        updateConnectionsToHub();
    };

    this.toggleMode = function() {
        var newMode = mode + 1;
        if (newMode > 1) newMode = -2;
        this.setMode(newMode);
        showStatusMessage("Mouse " + this.getModeDesc());
    };

    this.setMode = function(newMode) {
        mode = newMode;
        updateMode();
    };

    this.setModeEffective = function(newMode) {
        mode = newMode.m;
        updateMode(newMode.p);
    };

    this.getMode = function () {
        return mode;
    };

    this.getModeEffective = function () {
        return { m: mode, p: port };
    };

    this.getModeDesc = function() {
        switch (mode) {
            case -1: return "AUTO";
            case 0:  return "ENABLED";
            case 1:  return "ENABLED (port 2)";
            default: return "DISABLED";
        }
    };

    function updateMode(forcePort) {
        port = forcePort !== undefined ? forcePort : mode < 0 ? -1 : mode;
        if (netClientMode) resetClientModeLocalMouseState(mouseLocalState);
        else resetMouseState(mouseState);
        updateConnectionsToHub();
    }

    this.netClientAdaptToServerControlsModes = function(modes) {
        this.setModeEffective(modes.m);     // Use same effective mode as the Server
    };

    this.readControllerPort = function(port) {
        // MouseControls are Net-aware and do not participate in Hub´s port merging
        if (room.netController)
            return netReadControllerPort(port);
        else
            return readLocalControllerPort(port);
    };

    function readLocalControllerPort(atPort) {
        if (atPort === port) return mouseLocalState.portValue;
        else return PORT_VALUE_ALL_RELEASED;
    }

    this.writeControllerPin8Port = function(atPort, val) {
        if (atPort !== port) return;

        var flipped = mouseState.pin8Value ^ val;
        if (!flipped) return;

        mouseState.pin8Value = val;

        var elapsed = controllersSocket.getBUSCycles() - mouseState.lastPin8FlipBUSCycle;
        mouseState.lastPin8FlipBUSCycle += elapsed;

        // Resets read cycle if timeout passed since last flip
        if (elapsed > READ_CYCLE_RESET_TIMEOUT) mouseState.readCycle = -1;

        ++mouseState.readCycle;
        if (mouseState.readCycle === 0) updateDeltas();
        updatePortXYValue();

        //console.log("Mouse SET ReadCycle: " + mouseState.readCycle + ", elapsed: " + elapsed);
    };

    this.portPin8Announced = function(atPort, val) {
        // Auto enable only for port 1 and if not a mobile device
        if (val === 1 && !isMobileDevice && port < 0 && atPort === 0 && mode === -1) autoEnable(atPort, val);
    };

    this.togglePointerLock = function() {
        if (pointerLocked) unlockPointer();
        else lockPointer();
    };

    this.setMouseInputElement = function(pElement) {
        inputElement = pElement;

        // Register events needed
        if ("onpointerlockchange" in document) document.addEventListener('pointerlockchange', pointerLockChangedEvent, false);
        else if ("onmozpointerlockchange" in document) document.addEventListener('mozpointerlockchange', pointerLockChangedEvent, false);
        inputElement.addEventListener("mousemove", mouseMoveEvent);
        inputElement.addEventListener("mousedown", mouseButtonEvent);
        inputElement.addEventListener("mouseup",   mouseButtonEvent);
    };

    this.setScreenPixelScale = function(scaleX, scaleY) {
        pixelScaleX = scaleX; pixelScaleY = scaleY;

        //console.log("MouseControls scaleX: " + scaleX + ", scaleY: " + scaleY);
    };

    this.getMappingForControl = function(button, port) {
        return "Lock / Unlock pointer";
    };

    this.getMappingPopupText = function(button, port) {
        return { heading: "Middle Button:", footer: "" };
    };

    this.customizeControl = function (button, port, mapping) {
        // Nothing to customize
    };

    this.clearControl = function(button, port) {
        // Nothing to clear
    };

    function lockPointer() {
        if (port < 0)
            return screen.showOSD("Mouse Pointer Locking only when MOUSE is ENABLED!", true, true);
        var func = inputElement.requestPointerLock || inputElement.mozRequestPointerLock || inputElement.webkitRequestPointerLock;
        if (func) func.apply(inputElement);
    }

    function unlockPointer() {
        var func = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        if (func) func.apply(document);
    }

    function updatePortButtonsValue() {
        mouseState.portValue = (mouseState.portValue & ~0x30) | ((~mouseState.buttons & 3) << 4)
    }

    function updatePortXYValue() {
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
                mouseState.portValue = mouseState.portValue & ~0x0f;    // Not reading movement, leave only buttons state
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

    function mouseMoveEvent(e) {
        if (port < 0) return;

        e.preventDefault();

        // Get movement either by movement reported (pointer locked) or by position (pointer unlocked)
        var dX = 0, dY = 0;
        if (pointerLocked) {
            dX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            dY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        } else if (lastMoveEvent) {
            dX = e.clientX - lastMoveEvent.clientX;
            dY = e.clientY - lastMoveEvent.clientY;
        }
        lastMoveEvent = e;

        mouseLocalState.dX += dX / pixelScaleX;
        mouseLocalState.dY += dY / pixelScaleY;

        netMouseStateToSend = mouseLocalState;

        //console.log("Mouse moved. DX: " + mouseState.dX + ", DY: " + mouseState.dY);
    }

    function mouseButtonEvent(e) {
        if (port >= 0) {
            e.preventDefault();
            mouseLocalState.buttons = e.buttons & 3;
            if (!netClientMode) updatePortButtonsValue();
            netMouseStateToSend = mouseLocalState;
        }

        if (e.buttons & 4) {
            e.preventDefault();
            self.togglePointerLock();
        }
    }

    function pointerLockChangedEvent() {
        var lockingElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
        pointerLocked = lockingElement === inputElement;
        screen.mousePointerLocked(pointerLocked);
        screen.showOSD(pointerLocked ? "Mouse Pointer Locked" : "Mouse Pointer Released", pointerLocked);   // Only force message when Locking
    }

    function autoEnable(atPort, pin8Val) {
        port = atPort;
        self.writeControllerPin8Port(port, pin8Val);
        updateConnectionsToHub();
        showStatusMessage("Mouse AUTO-ENABLED");
    }

    function updateConnectionsToHub() {
        if (pointerLocked && port < 0) unlockPointer();
        hub.updateMouseConnections(port === 0 ? TYPE : null, port === 1 ? TYPE : null);
        screen.mouseActiveCursorStateUpdate(port >= 0);
    }

    function showStatusMessage(mes) {
        hub.showStatusMessage(mes);
    }

    function resetMouseState(s) {
        s.readCycle = -1;

        s.dX = 0; s.dY = 0;
        s.buttons = 0;

        s.portValue = PORT_VALUE_ALL_RELEASED;
        s.pin8Value = 0; s.lastPin8FlipBUSCycle = 0;
        s.readDX = 0; s.readDY = 0;

        netMouseStateToSend = mouseState;

        return s;
    }

    function resetClientModeLocalMouseState(s) {
        s.dX = 0; s.dY = 0;
        s.buttons = undefined;

        netMouseStateToSend = undefined;

        return s;
    }


    // NetPlay  -------------------------------------------

    function netReadControllerPort(atPort) {
        if (atPort === port) return mouseState.portValue;
        else return PORT_VALUE_ALL_RELEASED;
    }

    this.netGetMouseStateToSend = function() {
        return netMouseStateToSend;
    };

    this.netClearMouseInfoToSend = function() {
        if (netClientMode) resetClientModeLocalMouseState(mouseLocalState);
        else netMouseStateToSend = undefined;
    };

    this.netServerGetMouseState = function() {
        return mouseState;
    };

    this.netServerReceiveClientMouseState = function(state) {
        // Merge states. Add deltas and overwrite buttons
        mouseState.dX += state.dX; mouseState.dY += state.dY;
        if (state.buttons !== undefined) {
            mouseState.buttons = state.buttons;
            updatePortButtonsValue();
        }

        netMouseStateToSend = mouseState;

        // console.log("Client Mouse state:", state);
    };

    this.netClientReceiveServerMouseState = function(state) {
        mouseState = state;

        // console.log("Server Mouse state:", state);
    };

    this.netSetClientMode = function(state) {
        netClientMode = state;
        mouseLocalState = state ? resetClientModeLocalMouseState({}) : mouseState;
    };


    // Store a complete Mouse state, with positions and buttons
    var mouseState = resetMouseState({});
    var mouseLocalState = mouseState;

    var netClientMode = false;
    var netMouseStateToSend = undefined;

    var mode = WMSX.MOUSE_MODE - 1;              // -2: disabled, -1: auto, 0: enabled at port 0, 1: enabled at port 1. (parameter is -1 .. 2)
    var port = -1;                               // -1: disconnected, 0: connected at port 0, 1: connected at port 1
    var pixelScaleX = 1, pixelScaleY = 1;

    var inputElement;
    var lastMoveEvent;
    var pointerLocked = false;

    var controllersSocket, screen;

    var isMobileDevice = wmsx.Util.isMobileDevice();

    var TYPE = wmsx.ControllersHub.MOUSE;
    var READ_CYCLE_RESET_TIMEOUT = (wmsx.Z80.BASE_CLOCK / 1000 * 1.5) | 0;   // 1.5 milliseconds

    var PORT_VALUE_ALL_RELEASED = hub.PORT_VALUE_ALL_RELEASED;

};


