// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMMachineControls = function(keyForwardControls) {
    var self = this;

    function init() {
        //gamepadControls = new GamepadConsoleControls(self);
        initKeys();
    }

    this.connect = function(pControlsSocket) {
        machineControlsSocket = pControlsSocket;
    };

    this.connectPeripherals = function(screen) {
        monitor = screen.getMonitor();
    };

    this.powerOn = function() {
        preventIEHelp();
    };

    this.powerOff = function() {
    };

    this.keyDown = function(event) {
        var modifiers = 0 | (event.ctrlKey && KEY_CTRL_MASK) | (event.altKey && KEY_ALT_MASK) | (event.shiftKey && KEY_SHIFT_MASK);
        if (processKeyEvent(event.keyCode, true, modifiers)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            keyForwardControls.keyDown(event);
            return false;
        } else
            return keyForwardControls.keyDown(event);
    };

    this.keyUp = function(event) {
        var modifiers = 0 | (event.ctrlKey && KEY_CTRL_MASK) | (event.altKey && KEY_ALT_MASK) | (event.shiftKey && KEY_SHIFT_MASK);
        if (processKeyEvent(event.keyCode, false, modifiers)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            keyForwardControls.keyUp(event);
            return false;
        } else
            return keyForwardControls.keyUp(event);
    };

    var processKeyEvent = function(keyCode, press, modifiers) {
        var control = controlForEvent(keyCode, modifiers);
        if (control == null) return false;

        var state = controlStateMap[control];
        if (!state || (state !== press)) {
            controlStateMap[control] = press;
            machineControlsSocket.controlStateChanged(control, press);
        }
        return true;
    };

    var controlForEvent = function(keyCode, modif) {
        switch (modif) {
            case 0:
                return normalCodeMap[keyCode];
            case KEY_SHIFT_MASK:
                return withShiftCodeMap[keyCode];
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
        withShiftCodeMap[KEY_POWER]          = controls.RESET;

        normalCodeMap[KEY_ALTERNATE_SPEED]    = controls.FAST_SPEED;
        withCTRLCodeMap[KEY_ALTERNATE_SPEED]  = controls.SLOW_SPEED;

        withALTCodeMap[KEY_POWER]                = controls.POWER;
        withALTCodeMap[KEY_ALTERNATE_SPEED]      = controls.FAST_SPEED;
        withCTRLALTCodeMap[KEY_ALTERNATE_SPEED]  = controls.SLOW_SPEED;

        withALTCodeMap[KEY_INC_SPEED]     = controls.INC_SPEED;
        withALTCodeMap[KEY_DEC_SPEED]     = controls.DEC_SPEED;
        withALTCodeMap[KEY_NORMAL_SPEED]  = controls.NORMAL_SPEED;
        withALTCodeMap[KEY_MIN_SPEED]     = controls.MIN_SPEED;

        withALTCodeMap[KEY_PAUSE]            = controls.PAUSE;
        withCTRLALTCodeMap[KEY_PAUSE]        = controls.PAUSE_AUDIO_ON;
        withALTCodeMap[KEY_FRAME]            = controls.FRAME;
        withALTCodeMap[KEY_FRAMEa]           = controls.FRAME;
        withALTCodeMap[KEY_TRACE]            = controls.TRACE;
        withALTCodeMap[KEY_DEBUG]            = controls.DEBUG;
        withALTCodeMap[KEY_SPRITE_MODE]      = controls.SPRITE_MODE;
        withALTCodeMap[KEY_PALETTE]          = controls.PALETTE;
        withALTCodeMap[KEY_VIDEO_STANDARD]   = controls.VIDEO_STANDARD;
        withALTCodeMap[KEY_VSYNCH]           = controls.VSYNCH;

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

        withCTRLALTCodeMap[KEY_POWER] = controls.SAVE_STATE_FILE;
    };

    this.applyPreferences = function() {
    };


    var controls = wmsx.MachineControls;

    var machineControlsSocket;
    var monitor;

    var normalCodeMap = {};
    var withShiftCodeMap = {};
    var withCTRLCodeMap = {};
    var withALTCodeMap = {};
    var withCTRLALTCodeMap = {};

    var controlStateMap =  {};


    // Default Key Values


    var KEY_POWER            = wmsx.DOMKeys.VK_F11.c;

    var KEY_ALTERNATE_SPEED  = wmsx.DOMKeys.VK_F12.c;

    var KEY_INC_SPEED        = wmsx.DOMKeys.VK_UP.c;
    var KEY_DEC_SPEED        = wmsx.DOMKeys.VK_DOWN.c;
    var KEY_NORMAL_SPEED     = wmsx.DOMKeys.VK_RIGHT.c;
    var KEY_MIN_SPEED        = wmsx.DOMKeys.VK_LEFT.c;

    var KEY_PAUSE            = wmsx.DOMKeys.VK_P.c;
    var KEY_FRAME            = wmsx.DOMKeys.VK_O.c;
    var KEY_FRAMEa           = wmsx.DOMKeys.VK_F.c;

    var KEY_TRACE            = wmsx.DOMKeys.VK_Q.c;
    var KEY_DEBUG            = wmsx.DOMKeys.VK_D.c;
    var KEY_SPRITE_MODE      = wmsx.DOMKeys.VK_S.c;
    var KEY_PALETTE          = wmsx.DOMKeys.VK_E.c;
    var KEY_VIDEO_STANDARD   = wmsx.DOMKeys.VK_Q.c;
    var KEY_VSYNCH           = wmsx.DOMKeys.VK_W.c;

    var KEY_DEFAULTS         = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_STATE_0          = wmsx.DOMKeys.VK_QUOTE.c;
    var KEY_STATE_0a         = wmsx.DOMKeys.VK_BACKQUOTE.c;
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

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    init();

};
