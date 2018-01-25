// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMMachineControls = function(room, keyForwardControls) {
"use strict";

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

        if (press === keyStateMap[code]) return true;
        keyStateMap[code] = press;

        processControlState(control, press);
        return true;
    };

    function processControlState(control, press) {
        // Check for NetPlay blocked controls
        if (room.netPlayMode === 2 && netServerLocalOnlyControls.has(control))
            return room.showOSD("Function not available in NetPlay Client mode", true, true);

        // Store changes to be sent to peers
        if (!(room.netPlayMode === 1 && netServerLocalOnlyControls.has(control)))
            netControlsToSend.push((control << 4) | press );       // binary encoded

        // Do not apply control now if Client
        if (room.netPlayMode === 2) return;

        applyControlState(control, press);
    }
    this.processControlState = processControlState;

    function applyControlState(control, press) {
        machineControlsSocket.controlStateChanged(control, press);
    }

    this.getControlReport = function(control) {
        return machineControlsSocket.getControlReport(control);
    };

    var preventIEHelp = function() {
        window.onhelp = function () {
            return false;
        };
    };

    var initKeys = function() {
        var k = wmsx.DOMKeys;

        keyCodeMap[KEY_POWER]                   = mc.POWER;
        keyCodeMap[KEY_POWER | k.ALT]           = mc.POWER;

        keyCodeMap[KEY_POWER | k.SHIFT]         = mc.RESET;
        keyCodeMap[KEY_POWER | k.SHIFT | k.ALT] = mc.RESET;

        keyCodeMap[KEY_SPEED]                   = mc.FAST_SPEED;
        keyCodeMap[KEY_SPEED | k.ALT]           = mc.FAST_SPEED;
        keyCodeMap[KEY_SPEED | k.SHIFT]         = mc.SLOW_SPEED;
        keyCodeMap[KEY_SPEED | k.SHIFT | k.ALT] = mc.SLOW_SPEED;

        keyCodeMap[KEY_INC_SPEED | k.SHIFT | k.ALT]    = mc.INC_SPEED;
        keyCodeMap[KEY_DEC_SPEED | k.SHIFT | k.ALT]    = mc.DEC_SPEED;
        keyCodeMap[KEY_NORMAL_SPEED | k.SHIFT | k.ALT] = mc.NORMAL_SPEED;
        keyCodeMap[KEY_MIN_SPEED | k.SHIFT | k.ALT]    = mc.MIN_SPEED;

        keyCodeMap[KEY_PAUSE | k.ALT]           = mc.PAUSE;
        keyCodeMap[KEY_PAUSE | k.SHIFT | k.ALT] = mc.PAUSE_AUDIO_ON;
        keyCodeMap[KEY_FRAME | k.ALT]           = mc.FRAME;
        keyCodeMap[KEY_FRAMEa | k.ALT]          = mc.FRAME;
        keyCodeMap[KEY_TRACE | k.ALT]           = mc.TRACE;
        keyCodeMap[KEY_DEBUG | k.ALT]           = mc.DEBUG;
        keyCodeMap[KEY_SPRITE_MODE | k.ALT]     = mc.SPRITE_MODE;
        keyCodeMap[KEY_VIDEO_STANDARD | k.ALT]  = mc.VIDEO_STANDARD;
        keyCodeMap[KEY_VSYNCH | k.ALT]          = mc.VSYNCH;
        keyCodeMap[KEY_CPU_TURBO | k.ALT]       = mc.CPU_TURBO_MODE;
        keyCodeMap[KEY_VDP_TURBO | k.ALT]       = mc.VDP_TURBO_MODE;

        keyCodeMap[KEY_STATE_0 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.CONTROL | k.ALT]  = mc.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_1 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_1;
        keyCodeMap[KEY_STATE_2 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_2;
        keyCodeMap[KEY_STATE_3 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_3;
        keyCodeMap[KEY_STATE_4 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_4;
        keyCodeMap[KEY_STATE_5 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_5;
        keyCodeMap[KEY_STATE_6 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_6;
        keyCodeMap[KEY_STATE_7 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_7;
        keyCodeMap[KEY_STATE_8 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_8;
        keyCodeMap[KEY_STATE_9 | k.CONTROL | k.ALT]   = mc.SAVE_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.CONTROL | k.ALT]  = mc.SAVE_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.CONTROL | k.ALT]  = mc.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_11a | k.CONTROL | k.ALT] = mc.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.CONTROL | k.ALT]  = mc.SAVE_STATE_12;
        keyCodeMap[KEY_STATE_12a | k.CONTROL | k.ALT] = mc.SAVE_STATE_12;

        keyCodeMap[KEY_STATE_0 | k.ALT]   = mc.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.ALT]  = mc.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_1 | k.ALT]   = mc.LOAD_STATE_1;
        keyCodeMap[KEY_STATE_2 | k.ALT]   = mc.LOAD_STATE_2;
        keyCodeMap[KEY_STATE_3 | k.ALT]   = mc.LOAD_STATE_3;
        keyCodeMap[KEY_STATE_4 | k.ALT]   = mc.LOAD_STATE_4;
        keyCodeMap[KEY_STATE_5 | k.ALT]   = mc.LOAD_STATE_5;
        keyCodeMap[KEY_STATE_6 | k.ALT]   = mc.LOAD_STATE_6;
        keyCodeMap[KEY_STATE_7 | k.ALT]   = mc.LOAD_STATE_7;
        keyCodeMap[KEY_STATE_8 | k.ALT]   = mc.LOAD_STATE_8;
        keyCodeMap[KEY_STATE_9 | k.ALT]   = mc.LOAD_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.ALT]  = mc.LOAD_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.ALT]  = mc.LOAD_STATE_11;
        keyCodeMap[KEY_STATE_11a | k.ALT] = mc.LOAD_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.ALT]  = mc.LOAD_STATE_12;
        keyCodeMap[KEY_STATE_12a | k.ALT] = mc.LOAD_STATE_12;
    };


    // NetPlay  -------------------------------------------

    this.netGetControlsToSend = function() {
        return netControlsToSend.length ? netControlsToSend : undefined;
    };

    this.netClearControlsToSend = function() {
        netControlsToSend.length = 0;
    };

    this.netServerProcessControlsChanges = function(changes) {
        for (var i = 0, len = changes.length; i < len; ++i) {
            var change = changes[i];
            // Store changes to be sent to Clients?
            if (!netServerLocalOnlyControls.has(change >> 4)) netControlsToSend.push(change);
            applyControlState(change >> 4, change & 0x01);              // binary encoded
        }
    };

    this.netClientApplyControlsChanges = function(changes) {
        for (var i = 0, len = changes.length; i < len; ++i)
            applyControlState(changes[i] >> 4, changes[i] & 0x01);      // binary encoded
    };


    var mc = wmsx.MachineControls;

    var machineControlsSocket;
    var monitor;

    var keyCodeMap = {};
    var keyStateMap = {};

    var controlStateMap =  {};

    var netControlsToSend = new Array(100); netControlsToSend.length = 0;     // pre allocate empty Array


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
    var KEY_VDP_TURBO        = wmsx.DOMKeys.VK_Y.c;

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

    var netServerLocalOnlyControls = new Set([
        mc.SAVE_STATE_0, mc.SAVE_STATE_1, mc.SAVE_STATE_2, mc.SAVE_STATE_3, mc.SAVE_STATE_4, mc.SAVE_STATE_5, mc.SAVE_STATE_6,
        mc.SAVE_STATE_7, mc.SAVE_STATE_8, mc.SAVE_STATE_9, mc.SAVE_STATE_10, mc.SAVE_STATE_11, mc.SAVE_STATE_12, mc.SAVE_STATE_FILE,
        mc.LOAD_STATE_0, mc.LOAD_STATE_1, mc.LOAD_STATE_2, mc.LOAD_STATE_3, mc.LOAD_STATE_4, mc.LOAD_STATE_5, mc.LOAD_STATE_6,
        mc.LOAD_STATE_7, mc.LOAD_STATE_8, mc.LOAD_STATE_9, mc.LOAD_STATE_10, mc.LOAD_STATE_11, mc.LOAD_STATE_12,
        mc.VSYNCH, mc.TRACE
    ]);


    init();

};
