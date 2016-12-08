// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Savestate hotkeys in FF

wmsx.DOMMachineControls = function(keyForwardControls) {
"use strict";

    var self = this;

    function init() {
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

    this.processKey = function(code, press) {
        var control = keyCodeMap[code];
        if (!control) return keyForwardControls.processKey(code, press);        // Next in chain

        var state = controlStateMap[control];
        if (!state || (state !== press)) {
            controlStateMap[control] = press;
            machineControlsSocket.controlStateChanged(control, press);
        }
        return true;
    };

    var preventIEHelp = function() {
        window.onhelp = function () {
            return false;
        };
    };

    var initKeys = function() {
        var k = wmsx.DOMKeys;

        keyCodeMap[KEY_POWER]                   = controls.POWER;
        keyCodeMap[KEY_POWER | k.ALT]           = controls.POWER;

        keyCodeMap[KEY_POWER | k.SHIFT]         = controls.RESET;
        keyCodeMap[KEY_POWER | k.SHIFT | k.ALT] = controls.RESET;

        keyCodeMap[KEY_SPEED]                   = controls.FAST_SPEED;
        keyCodeMap[KEY_SPEED | k.ALT]           = controls.FAST_SPEED;
        keyCodeMap[KEY_SPEED | k.SHIFT]         = controls.SLOW_SPEED;
        keyCodeMap[KEY_SPEED | k.SHIFT | k.ALT] = controls.SLOW_SPEED;

        keyCodeMap[KEY_INC_SPEED | k.SHIFT | k.ALT]    = controls.INC_SPEED;
        keyCodeMap[KEY_DEC_SPEED | k.SHIFT | k.ALT]    = controls.DEC_SPEED;
        keyCodeMap[KEY_NORMAL_SPEED | k.SHIFT | k.ALT] = controls.NORMAL_SPEED;
        keyCodeMap[KEY_MIN_SPEED | k.SHIFT | k.ALT]    = controls.MIN_SPEED;

        keyCodeMap[KEY_PAUSE | k.ALT]           = controls.PAUSE;
        keyCodeMap[KEY_PAUSE | k.SHIFT | k.ALT] = controls.PAUSE_AUDIO_ON;
        keyCodeMap[KEY_FRAME | k.ALT]           = controls.FRAME;
        keyCodeMap[KEY_FRAMEa | k.ALT]          = controls.FRAME;
        keyCodeMap[KEY_TRACE | k.ALT]           = controls.TRACE;
        keyCodeMap[KEY_DEBUG | k.ALT]           = controls.DEBUG;
        keyCodeMap[KEY_SPRITE_MODE | k.ALT]     = controls.SPRITE_MODE;
        keyCodeMap[KEY_VIDEO_STANDARD | k.ALT]  = controls.VIDEO_STANDARD;
        keyCodeMap[KEY_VSYNCH | k.ALT]          = controls.VSYNCH;
        keyCodeMap[KEY_CPU_TURBO | k.ALT]       = controls.CPU_TURBO_MODE;

        keyCodeMap[KEY_STATE_0 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.CONTROL | k.ALT]  = controls.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_1 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_1;
        keyCodeMap[KEY_STATE_2 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_2;
        keyCodeMap[KEY_STATE_3 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_3;
        keyCodeMap[KEY_STATE_4 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_4;
        keyCodeMap[KEY_STATE_5 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_5;
        keyCodeMap[KEY_STATE_6 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_6;
        keyCodeMap[KEY_STATE_7 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_7;
        keyCodeMap[KEY_STATE_8 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_8;
        keyCodeMap[KEY_STATE_9 | k.CONTROL | k.ALT]   = controls.SAVE_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.CONTROL | k.ALT]  = controls.SAVE_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.CONTROL | k.ALT]  = controls.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_11a | k.CONTROL | k.ALT] = controls.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.CONTROL | k.ALT]  = controls.SAVE_STATE_12;
        keyCodeMap[KEY_STATE_12a | k.CONTROL | k.ALT] = controls.SAVE_STATE_12;

        keyCodeMap[KEY_STATE_0 | k.ALT]   = controls.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.ALT]  = controls.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_1 | k.ALT]   = controls.LOAD_STATE_1;
        keyCodeMap[KEY_STATE_2 | k.ALT]   = controls.LOAD_STATE_2;
        keyCodeMap[KEY_STATE_3 | k.ALT]   = controls.LOAD_STATE_3;
        keyCodeMap[KEY_STATE_4 | k.ALT]   = controls.LOAD_STATE_4;
        keyCodeMap[KEY_STATE_5 | k.ALT]   = controls.LOAD_STATE_5;
        keyCodeMap[KEY_STATE_6 | k.ALT]   = controls.LOAD_STATE_6;
        keyCodeMap[KEY_STATE_7 | k.ALT]   = controls.LOAD_STATE_7;
        keyCodeMap[KEY_STATE_8 | k.ALT]   = controls.LOAD_STATE_8;
        keyCodeMap[KEY_STATE_9 | k.ALT]   = controls.LOAD_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.ALT]  = controls.LOAD_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.ALT]  = controls.LOAD_STATE_11;
        keyCodeMap[KEY_STATE_11a | k.ALT] = controls.LOAD_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.ALT]  = controls.LOAD_STATE_12;
        keyCodeMap[KEY_STATE_12a | k.ALT] = controls.LOAD_STATE_12;
    };


    var controls = wmsx.MachineControls;

    var machineControlsSocket;
    var monitor;

    var keyCodeMap = {};

    var controlStateMap =  {};


    // Default Key Values


    var KEY_POWER            = wmsx.DOMKeys.VK_F11.c;

    var KEY_SPEED            = wmsx.DOMKeys.VK_F12.c;

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
    var KEY_VIDEO_STANDARD   = wmsx.DOMKeys.VK_Q.c;
    var KEY_VSYNCH           = wmsx.DOMKeys.VK_W.c;
    var KEY_CPU_TURBO        = wmsx.DOMKeys.VK_T.c;

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
    var KEY_STATE_11a        = wmsx.DOMKeys.VK_FF_MINUS.c;
    var KEY_STATE_12         = wmsx.DOMKeys.VK_EQUALS.c;
    var KEY_STATE_12a        = wmsx.DOMKeys.VK_FF_EQUALS.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    init();

};
