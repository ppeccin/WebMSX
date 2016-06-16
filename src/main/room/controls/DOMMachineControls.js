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

    this.keyDown = function(e) {
        var modifiers = 0 | (e.ctrlKey && KEY_CTRL_MASK) | (e.altKey && KEY_ALT_MASK) | (e.shiftKey && KEY_SHIFT_MASK);
        if (processKeyEvent(e.keyCode, true, modifiers)) {
            e.returnValue = false;  // IE
            e.preventDefault();
            e.stopPropagation();
            keyForwardControls.keyDown(e);
            return false;
        } else
            return keyForwardControls.keyDown(e);
    };

    this.keyUp = function(e) {
        var modifiers = 0 | (e.ctrlKey && KEY_CTRL_MASK) | (e.altKey && KEY_ALT_MASK) | (e.shiftKey && KEY_SHIFT_MASK);
        if (processKeyEvent(e.keyCode, false, modifiers)) {
            e.returnValue = false;  // IE
            e.preventDefault();
            e.stopPropagation();
            keyForwardControls.keyUp(e);
            return false;
        } else
            return keyForwardControls.keyUp(e);
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
                return withCtrlCodeMap[keyCode];
            case KEY_ALT_MASK:
                return withAltCodeMap[keyCode];
            case KEY_SHIFT_MASK | KEY_ALT_MASK:
                return withShiftAltCodeMap[keyCode];
            case KEY_CTRL_MASK | KEY_ALT_MASK:
                return withCtrlAltCodeMap[keyCode];
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

        normalCodeMap[KEY_POWER]               = controls.POWER;
        withShiftCodeMap[KEY_POWER]            = controls.RESET;
        normalCodeMap[KEY_ALTERNATE_SPEED]     = controls.FAST_SPEED;
        withShiftCodeMap[KEY_ALTERNATE_SPEED]  = controls.SLOW_SPEED;

        withAltCodeMap[KEY_POWER]                 = controls.POWER;
        withShiftAltCodeMap[KEY_POWER]            = controls.RESET;
        withAltCodeMap[KEY_ALTERNATE_SPEED]       = controls.FAST_SPEED;
        withShiftAltCodeMap[KEY_ALTERNATE_SPEED]  = controls.SLOW_SPEED;

        withAltCodeMap[KEY_INC_SPEED]     = controls.INC_SPEED;
        withAltCodeMap[KEY_DEC_SPEED]     = controls.DEC_SPEED;
        withAltCodeMap[KEY_NORMAL_SPEED]  = controls.NORMAL_SPEED;
        withAltCodeMap[KEY_MIN_SPEED]     = controls.MIN_SPEED;

        withAltCodeMap[KEY_PAUSE]            = controls.PAUSE;
        withCtrlAltCodeMap[KEY_PAUSE]        = controls.PAUSE_AUDIO_ON;
        withAltCodeMap[KEY_FRAME]            = controls.FRAME;
        withAltCodeMap[KEY_FRAMEa]           = controls.FRAME;
        withAltCodeMap[KEY_TRACE]            = controls.TRACE;
        withAltCodeMap[KEY_DEBUG]            = controls.DEBUG;
        withAltCodeMap[KEY_SPRITE_MODE]      = controls.SPRITE_MODE;
        withAltCodeMap[KEY_PALETTE]          = controls.PALETTE;
        withAltCodeMap[KEY_VIDEO_STANDARD]   = controls.VIDEO_STANDARD;
        withAltCodeMap[KEY_VSYNCH]           = controls.VSYNCH;

        withAltCodeMap[KEY_DEFAULTS]   = controls.DEFAULTS;

        withCtrlAltCodeMap[KEY_STATE_0] = controls.SAVE_STATE_0;
        withCtrlAltCodeMap[KEY_STATE_0a] = controls.SAVE_STATE_0;
        withCtrlAltCodeMap[KEY_STATE_1] = controls.SAVE_STATE_1;
        withCtrlAltCodeMap[KEY_STATE_2] = controls.SAVE_STATE_2;
        withCtrlAltCodeMap[KEY_STATE_3] = controls.SAVE_STATE_3;
        withCtrlAltCodeMap[KEY_STATE_4] = controls.SAVE_STATE_4;
        withCtrlAltCodeMap[KEY_STATE_5] = controls.SAVE_STATE_5;
        withCtrlAltCodeMap[KEY_STATE_6] = controls.SAVE_STATE_6;
        withCtrlAltCodeMap[KEY_STATE_7] = controls.SAVE_STATE_7;
        withCtrlAltCodeMap[KEY_STATE_8] = controls.SAVE_STATE_8;
        withCtrlAltCodeMap[KEY_STATE_9] = controls.SAVE_STATE_9;
        withCtrlAltCodeMap[KEY_STATE_10] = controls.SAVE_STATE_10;
        withCtrlAltCodeMap[KEY_STATE_11] = controls.SAVE_STATE_11;
        withCtrlAltCodeMap[KEY_STATE_11a] = controls.SAVE_STATE_11;
        withCtrlAltCodeMap[KEY_STATE_12] = controls.SAVE_STATE_12;
        withCtrlAltCodeMap[KEY_STATE_12a] = controls.SAVE_STATE_12;

        withAltCodeMap[KEY_STATE_0] = controls.LOAD_STATE_0;
        withAltCodeMap[KEY_STATE_0a] = controls.LOAD_STATE_0;
        withAltCodeMap[KEY_STATE_1] = controls.LOAD_STATE_1;
        withAltCodeMap[KEY_STATE_2] = controls.LOAD_STATE_2;
        withAltCodeMap[KEY_STATE_3] = controls.LOAD_STATE_3;
        withAltCodeMap[KEY_STATE_4] = controls.LOAD_STATE_4;
        withAltCodeMap[KEY_STATE_5] = controls.LOAD_STATE_5;
        withAltCodeMap[KEY_STATE_6] = controls.LOAD_STATE_6;
        withAltCodeMap[KEY_STATE_7] = controls.LOAD_STATE_7;
        withAltCodeMap[KEY_STATE_8] = controls.LOAD_STATE_8;
        withAltCodeMap[KEY_STATE_9] = controls.LOAD_STATE_9;
        withAltCodeMap[KEY_STATE_10] = controls.LOAD_STATE_10;
        withAltCodeMap[KEY_STATE_11] = controls.LOAD_STATE_11;
        withAltCodeMap[KEY_STATE_11a] = controls.LOAD_STATE_11;
        withAltCodeMap[KEY_STATE_12] = controls.LOAD_STATE_12;
        withAltCodeMap[KEY_STATE_12a] = controls.LOAD_STATE_12;

        withCtrlAltCodeMap[KEY_POWER] = controls.SAVE_STATE_FILE;
    };

    this.applyPreferences = function() {
    };


    var controls = wmsx.MachineControls;

    var machineControlsSocket;
    var monitor;

    var normalCodeMap = {};
    var withShiftCodeMap = {};
    var withCtrlCodeMap = {};
    var withAltCodeMap = {};
    var withShiftAltCodeMap = {};
    var withCtrlAltCodeMap = {};

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
