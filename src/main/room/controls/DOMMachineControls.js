// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMMachineControls = function() {
    var self = this;

    function init() {
        //gamepadControls = new GamepadConsoleControls(self);
        initKeys();
    }

    this.connect = function(pControlsSocket) {
        consoleControlsSocket = pControlsSocket;
        consoleControlsSocket.connectControls(this);
        //gamepadControls.connect(pControlsSocket);
    };

    this.connectPeripherals = function(screen, consolePanel) {
        videoMonitor = screen.getMonitor();
        //gamepadControls.connectScreen(screen);
        this.addInputElements(screen.keyControlsInputElements());
        if (consolePanel) this.addInputElements(consolePanel.keyControlsInputElements());
    };

    this.powerOn = function() {
        preventIEHelp();
        //gamepadControls.powerOn();
    };

    this.powerOff = function() {
        //gamepadControls.powerOff();
    };

    this.destroy = function() {
    };

    this.addInputElements = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener("keydown", this.keyDown);
            elements[i].addEventListener("keyup", this.keyUp);
        }
    };

    this.toggleP1ControlsMode = function() {
        this.setP1ControlsMode(!p1ControlsMode);
        showModeOSD();
    };

    this.setP1ControlsMode = function(state) {
        p1ControlsMode = state;
        //gamepadControls.setP1ControlsMode(state);
        this.applyPreferences();
    };

    this.isP1ControlsMode = function() {
        return p1ControlsMode;
    };

    this.getGamepadControls = function() {
        return gamepadControls;
    };

    this.keyDown = function(event) {
        var modifiers = 0 | (event.ctrlKey ? KEY_CTRL_MASK : 0) | (event.altKey ? KEY_ALT_MASK : 0) | (event.shiftKey ? KEY_SHIFT_MASK : 0);
        if (processKeyEvent(event.keyCode, true, modifiers)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        }
    };

    this.keyUp = function(event) {
        var modifiers = 0 | (event.ctrlKey ? KEY_CTRL_MASK : 0) | (event.altKey ? KEY_ALT_MASK : 0) | (event.shiftKey ? KEY_SHIFT_MASK : 0);
        if (processKeyEvent(event.keyCode, false, modifiers)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        }
    };

    this.clockPulse = function() {
        //gamepadControls.clockPulse();
    };

    this.processKeyEvent = function(keyCode, press, modifiers) {
        if (checkLocalControlKey(keyCode, modifiers, press)) return true;
        var control = controlForEvent(keyCode, modifiers);
        if (control == null) return false;

        var state = controlStateMap[control];
        if (!state || (state !== press)) {
            controlStateMap[control] = press;
            consoleControlsSocket.controlStateChanged(control, press);
        }
        return true;
    };

    var processKeyEvent = this.processKeyEvent;

    var showModeOSD = function() {
        videoMonitor.showOSD("Controllers: " + (p1ControlsMode ? "Swapped" : "Normal"), true);
    };

    var checkLocalControlKey = function(keyCode, modif, press) {
        var control;
        if (press) {
            if (modif === KEY_ALT_MASK || modif === KEY_CTRL_MASK)
                switch (keyCode) {
                    case KEY_TOGGLE_P1_MODE:
                        self.toggleP1ControlsMode();
                        return true;
                    case KEY_TOGGLE_JOYSTICK:
                        gamepadControls.toggleMode();
                        return true;
                }
        }
        return false;
    };

    var controlForEvent = function(keyCode, modif) {
        switch (modif) {
            case 0:
                var joy = joyKeysCodeMap[keyCode];
                if (joy) return joy;
                return normalCodeMap[keyCode];
            case KEY_SHIFT_MASK:
                return withSHIFTCodeMap[keyCode];
            case KEY_CTRL_MASK:
                return withCTRLCodeMap[keyCode];
            case KEY_ALT_MASK:
                return withALTCodeMap[keyCode];
            case KEY_CTRL_MASK | KEY_ALT_MASK:
                return withCTRLALTCodeMap[keyCode];
        }
        return null;
    };

    var preventIEHelp = function() {
        window.onhelp = function () {
            return false;
        };
    };

    var initKeys = function() {
        self.applyPreferences();

        normalCodeMap[KEY_POWER]            = controls.POWER;
        withCTRLCodeMap[KEY_POWER]          = controls.RESET;

        withCTRLALTCodeMap[KEY_SAVE_STATE_FILE]  = controls.SAVE_STATE_FILE;

        normalCodeMap[KEY_SPEED]    = controls.FAST_SPEED;
        withCTRLCodeMap[KEY_SPEED]  = controls.SLOW_SPEED;

        withALTCodeMap[KEY_POWER]  = controls.POWER;
        withALTCodeMap[KEY_SPEED]  = controls.FAST_SPEED;

        withALTCodeMap[KEY_PAUSE]            = controls.PAUSE;
        withALTCodeMap[KEY_FRAME]            = controls.FRAME;
        withALTCodeMap[KEY_TRACE]            = controls.TRACE;
        withALTCodeMap[KEY_DEBUG]            = controls.DEBUG;
        withALTCodeMap[KEY_SPRITE_MODE]      = controls.SPRITE_MODE;
        withALTCodeMap[KEY_PALETTE]          = controls.PALETTE;
        withALTCodeMap[KEY_VIDEO_STANDARD]   = controls.VIDEO_STANDARD;

        withALTCodeMap[KEY_DEFAULTS]   = controls.DEFAULTS;

        withCTRLALTCodeMap[KEY_STATE_0] = controls.SAVE_STATE_0;
        withCTRLALTCodeMap[KEY_STATE_0a] = controls.SAVE_STATE_0;
        withCTRLALTCodeMap[KEY_STATE_1] = controls.SAVE_STATE_1;
        withCTRLALTCodeMap[KEY_STATE_2] = controls.SAVE_STATE_2;
        withCTRLALTCodeMap[KEY_STATE_3] = controls.SAVE_STATE_3;
        withCTRLALTCodeMap[KEY_STATE_4] = controls.SAVE_STATE_4;
        withCTRLALTCodeMap[KEY_STATE_5] = controls.SAVE_STATE_5;
        withCTRLALTCodeMap[KEY_STATE_6] = controls.SAVE_STATE_6;
        withCTRLALTCodeMap[KEY_STATE_7] = controls.SAVE_STATE_7;
        withCTRLALTCodeMap[KEY_STATE_8] = controls.SAVE_STATE_8;
        withCTRLALTCodeMap[KEY_STATE_9] = controls.SAVE_STATE_9;
        withCTRLALTCodeMap[KEY_STATE_10] = controls.SAVE_STATE_10;
        withCTRLALTCodeMap[KEY_STATE_11] = controls.SAVE_STATE_11;
        withCTRLALTCodeMap[KEY_STATE_11a] = controls.SAVE_STATE_11;
        withCTRLALTCodeMap[KEY_STATE_12] = controls.SAVE_STATE_12;
        withCTRLALTCodeMap[KEY_STATE_12a] = controls.SAVE_STATE_12;

        withALTCodeMap[KEY_STATE_0] = controls.LOAD_STATE_0;
        withALTCodeMap[KEY_STATE_0a] = controls.LOAD_STATE_0;
        withALTCodeMap[KEY_STATE_1] = controls.LOAD_STATE_1;
        withALTCodeMap[KEY_STATE_2] = controls.LOAD_STATE_2;
        withALTCodeMap[KEY_STATE_3] = controls.LOAD_STATE_3;
        withALTCodeMap[KEY_STATE_4] = controls.LOAD_STATE_4;
        withALTCodeMap[KEY_STATE_5] = controls.LOAD_STATE_5;
        withALTCodeMap[KEY_STATE_6] = controls.LOAD_STATE_6;
        withALTCodeMap[KEY_STATE_7] = controls.LOAD_STATE_7;
        withALTCodeMap[KEY_STATE_8] = controls.LOAD_STATE_8;
        withALTCodeMap[KEY_STATE_9] = controls.LOAD_STATE_9;
        withALTCodeMap[KEY_STATE_10] = controls.LOAD_STATE_10;
        withALTCodeMap[KEY_STATE_11] = controls.LOAD_STATE_11;
        withALTCodeMap[KEY_STATE_11a] = controls.LOAD_STATE_11;
        withALTCodeMap[KEY_STATE_12] = controls.LOAD_STATE_12;
        withALTCodeMap[KEY_STATE_12a] = controls.LOAD_STATE_12;

        normalCodeMap[KEY_IGNORE_F10] = controls.IGNORED;
        normalCodeMap[KEY_IGNORE_F11] = controls.IGNORED;


    };

    this.applyPreferences = function() {
        joyKeysCodeMap = {};
        if (!p1ControlsMode) {
        } else {
        }
    };

    var controls = wmsx.MachineControls;

    var p1ControlsMode = false;

    var consoleControlsSocket;
    var videoMonitor;
    var gamepadControls;


    var joyKeysCodeMap = {};
    var normalCodeMap = {};
    var withSHIFTCodeMap = {};
    var withCTRLCodeMap = {};
    var withALTCodeMap = {};
    var withCTRLALTCodeMap = {};

    var controlStateMap =  {};


    // Default Key Values

    var KEY_TOGGLE_JOYSTICK  = wmsx.DOMMachineControls.KEY_TOGGLE_JOYSTICK;
    var KEY_TOGGLE_P1_MODE   = wmsx.DOMMachineControls.KEY_TOGGLE_P1_MODE;
    var KEY_CARTRIDGE_FORMAT = wmsx.DOMMachineControls.KEY_CARTRIDGE_FORMAT;
    var KEY_SPEED            = wmsx.DOMMachineControls.KEY_SPEED;
    var KEY_PAUSE            = wmsx.DOMMachineControls.KEY_PAUSE;

    var KEY_POWER            = wmsx.DOMKeys.VK_F9.c;

    var KEY_FRAME            = wmsx.DOMKeys.VK_F.c;
    var KEY_TRACE            = wmsx.DOMKeys.VK_Q.c;
    var KEY_DEBUG            = wmsx.DOMKeys.VK_D.c;
    var KEY_SPRITE_MODE      = wmsx.DOMKeys.VK_S.c;
    var KEY_PALETTE          = wmsx.DOMKeys.VK_E.c;
    var KEY_VIDEO_STANDARD   = wmsx.DOMKeys.VK_V.c;

    var KEY_DEFAULTS         = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_STATE_0          = wmsx.DOMKeys.VK_QUOTE.c;
    var KEY_STATE_0a         = wmsx.DOMKeys.VK__BACKQUOTE;
    var KEY_STATE_1          = wmsx.DOMKeys.VK_1.c;
    var KEY_STATE_2          = wmsx.DOMKeys.VK_2.c;
    var KEY_STATE_3          = wmsx.DOMKeys.VK_3.c;
    var KEY_STATE_4          = wmsx.DOMKeys.VK_4.c;
    var KEY_STATE_5          = wmsx.DOMKeys.VK_5.c;
    var KEY_STATE_6          = wmsx.DOMKeys.VK_6.c;
    var KEY_STATE_7          = wmsx.DOMKeys.VK_7.c;
    var KEY_STATE_8          = wmsx.DOMKeys.VK_8.c;
    var KEY_STATE_9          = wmsx.DOMKeys.VK_9.c;
    var KEY_STATE_10         = wmsx.DOMKeys.VK_0.c;
    var KEY_STATE_11         = wmsx.DOMKeys.VK_MINUS.c;
    var KEY_STATE_11a        = wmsx.DOMKeys.VK_MINUS_FF.c;
    var KEY_STATE_12         = wmsx.DOMKeys.VK_EQUALS.c;
    var KEY_STATE_12a        = wmsx.DOMKeys.VK_EQUALS_FF.c;

    var KEY_SAVE_STATE_FILE  = wmsx.DOMKeys.VK_F6.c;

    var KEY_IGNORE_F10       = wmsx.DOMKeys.VK_F10.c;
    var KEY_IGNORE_F11       = wmsx.DOMKeys.VK_F11.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = wmsx.DOMMachineControls.KEY_ALT_MASK;
    var KEY_SHIFT_MASK = 4;


    init();

};

wmsx.DOMMachineControls.KEY_SPEED  = wmsx.DOMKeys.VK_F12.c;
wmsx.DOMMachineControls.KEY_PAUSE  = wmsx.DOMKeys.VK_P.c;

wmsx.DOMMachineControls.KEY_TOGGLE_JOYSTICK  = wmsx.DOMKeys.VK_J.c;
wmsx.DOMMachineControls.KEY_CARTRIDGE_FORMAT = wmsx.DOMKeys.VK_B.c;

wmsx.DOMMachineControls.KEY_ALT_MASK   = 2;
