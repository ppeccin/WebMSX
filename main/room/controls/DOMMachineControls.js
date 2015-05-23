// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

DOMMachineControls = function() {
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
            case KEY_CTRL_MASK:
                return withCTRLCodeMap[keyCode];
            case KEY_ALT_MASK:
                return withALTCodeMap[keyCode];
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
        normalCodeMap[KEY_CARTRIDGE_REMOVE] = controls.CARTRIDGE_REMOVE;
        normalCodeMap[KEY_SAVE_STATE_FILE]  = controls.SAVE_STATE_FILE;

        withALTCodeMap[KEY_POWER]            = controls.POWER;
        withALTCodeMap[KEY_CARTRIDGE_REMOVE] = controls.CARTRIDGE_REMOVE;
        withALTCodeMap[KEY_SAVE_STATE_FILE]  = controls.SAVE_STATE_FILE;

        normalCodeMap[KEY_FAST_SPEED] = controls.FAST_SPEED;

        withALTCodeMap[KEY_PAUSE]          = controls.PAUSE;
        withALTCodeMap[KEY_FRAME]          = controls.FRAME;
        withALTCodeMap[KEY_TRACE]          = controls.TRACE;
        withALTCodeMap[KEY_DEBUG]          = controls.DEBUG;
        withALTCodeMap[KEY_NO_COLLISIONS]  = controls.NO_COLLISIONS;
        withALTCodeMap[KEY_VIDEO_STANDARD] = controls.VIDEO_STANDARD;

        withCTRLCodeMap[KEY_PAUSE]          = controls.PAUSE;
        withCTRLCodeMap[KEY_FRAME]          = controls.FRAME;
        withCTRLCodeMap[KEY_TRACE]          = controls.TRACE;
        withCTRLCodeMap[KEY_DEBUG]          = controls.DEBUG;
        withCTRLCodeMap[KEY_NO_COLLISIONS]  = controls.NO_COLLISIONS;
        withCTRLCodeMap[KEY_VIDEO_STANDARD] = controls.VIDEO_STANDARD;

        withCTRLCodeMap[KEY_POWER] = controls.POWER_FRY;

        withCTRLCodeMap[KEY_STATE_0] = controls.SAVE_STATE_0;
        withCTRLCodeMap[KEY_STATE_0a] = controls.SAVE_STATE_0;
        withCTRLCodeMap[KEY_STATE_1] = controls.SAVE_STATE_1;
        withCTRLCodeMap[KEY_STATE_2] = controls.SAVE_STATE_2;
        withCTRLCodeMap[KEY_STATE_3] = controls.SAVE_STATE_3;
        withCTRLCodeMap[KEY_STATE_4] = controls.SAVE_STATE_4;
        withCTRLCodeMap[KEY_STATE_5] = controls.SAVE_STATE_5;
        withCTRLCodeMap[KEY_STATE_6] = controls.SAVE_STATE_6;
        withCTRLCodeMap[KEY_STATE_7] = controls.SAVE_STATE_7;
        withCTRLCodeMap[KEY_STATE_8] = controls.SAVE_STATE_8;
        withCTRLCodeMap[KEY_STATE_9] = controls.SAVE_STATE_9;
        withCTRLCodeMap[KEY_STATE_10] = controls.SAVE_STATE_10;
        withCTRLCodeMap[KEY_STATE_11] = controls.SAVE_STATE_11;
        withCTRLCodeMap[KEY_STATE_11a] = controls.SAVE_STATE_11;
        withCTRLCodeMap[KEY_STATE_12] = controls.SAVE_STATE_12;
        withCTRLCodeMap[KEY_STATE_12a] = controls.SAVE_STATE_12;

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

        withALTCodeMap[KEY_CARTRIDGE_FORMAT]    = controls.CARTRIDGE_FORMAT;

        withCTRLCodeMap[KEY_CARTRIDGE_FORMAT]    = controls.CARTRIDGE_FORMAT;
    };

    this.applyPreferences = function() {
        joyKeysCodeMap = {};
        if (!p1ControlsMode) {
        } else {
        }
    };

    var controls = MachineControls;

    var p1ControlsMode = false;

    var consoleControlsSocket;
    var videoMonitor;
    var gamepadControls;


    var joyKeysCodeMap = {};
    var normalCodeMap = {};
    var withCTRLCodeMap = {};
    var withALTCodeMap = {};

    var controlStateMap =  {};


    // Default Key Values

    var KEY_TOGGLE_JOYSTICK  = DOMMachineControls.KEY_TOGGLE_JOYSTICK;
    var KEY_TOGGLE_P1_MODE   = DOMMachineControls.KEY_TOGGLE_P1_MODE;
    var KEY_CARTRIDGE_FORMAT = DOMMachineControls.KEY_CARTRIDGE_FORMAT;
    var KEY_FAST_SPEED       = DOMMachineControls.KEY_FAST_SPEED;
    var KEY_PAUSE            = DOMMachineControls.KEY_PAUSE;

    var KEY_POWER            = DOMKeys.VK_F1.c;

    var KEY_FRAME            = DOMKeys.VK_F.c;
    var KEY_TRACE            = DOMKeys.VK_Q.c;
    var KEY_DEBUG            = DOMKeys.VK_D.c;
    var KEY_NO_COLLISIONS    = DOMKeys.VK_C.c;
    var KEY_VIDEO_STANDARD   = DOMKeys.VK_V.c;

    var KEY_STATE_0          = DOMKeys.VK_QUOTE.c;
    var KEY_STATE_0a         = DOMKeys.VK_TILDE.c;
    var KEY_STATE_1          = DOMKeys.VK_1.c;
    var KEY_STATE_2          = DOMKeys.VK_2.c;
    var KEY_STATE_3          = DOMKeys.VK_3.c;
    var KEY_STATE_4          = DOMKeys.VK_4.c;
    var KEY_STATE_5          = DOMKeys.VK_5.c;
    var KEY_STATE_6          = DOMKeys.VK_6.c;
    var KEY_STATE_7          = DOMKeys.VK_7.c;
    var KEY_STATE_8          = DOMKeys.VK_8.c;
    var KEY_STATE_9          = DOMKeys.VK_9.c;
    var KEY_STATE_10         = DOMKeys.VK_0.c;
    var KEY_STATE_11         = DOMKeys.VK_MINUS.c;
    var KEY_STATE_11a        = DOMKeys.VK_MINUS2.c;
    var KEY_STATE_12         = DOMKeys.VK_EQUALS.c;
    var KEY_STATE_12a        = DOMKeys.VK_EQUALS2.c;

    var KEY_SAVE_STATE_FILE  = DOMKeys.VK_F8.c;

    var KEY_CARTRIDGE_REMOVE    = DOMKeys.VK_F7.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = DOMMachineControls.KEY_ALT_MASK;
    var KEY_SHIFT_MASK = 4;


    init();

};

DOMMachineControls.KEY_SELECT     = DOMKeys.VK_F11.c;
DOMMachineControls.KEY_SELECT2    = DOMKeys.VK_F10.c;
DOMMachineControls.KEY_RESET      = DOMKeys.VK_F12.c;
DOMMachineControls.KEY_FAST_SPEED = DOMKeys.VK_TAB.c;
DOMMachineControls.KEY_PAUSE      = DOMKeys.VK_P.c;

DOMMachineControls.KEY_TOGGLE_JOYSTICK  = DOMKeys.VK_J.c;
DOMMachineControls.KEY_TOGGLE_P1_MODE   = DOMKeys.VK_K.c;
DOMMachineControls.KEY_TOGGLE_PADDLE    = DOMKeys.VK_L.c;
DOMMachineControls.KEY_CARTRIDGE_FORMAT = DOMKeys.VK_B.c;

DOMMachineControls.KEY_ALT_MASK   = 2;
