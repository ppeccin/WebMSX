// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMMachineControls = function(room, peripheralControls) {
"use strict";

    function init() {
        initKeys();
    }

    this.connect = function(pControlsSocket) {
        machineControlsSocket = pControlsSocket;
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        preventIEHelp();
    };

    this.powerOff = function() {
    };

    this.processKey = function(code, press) {
        var control = keyCodeMap[code];
        if (!control) return peripheralControls.processKey(code, press);        // Next in chain

        if (press === keyStateMap[code]) return true;
        keyStateMap[code] = press;

        processControlState(control, press);
        return true;
    };

    function processControlState(control, press, data) {
        // Check for NetPlay blocked controls
        if (room.netPlayMode === 2 && (netServerOnlyControls.has(control) || netClientBlockedControls.has(control)))
            return room.showOSD("Function not available in NetPlay Client mode", true, true);

        // Store changes to be sent to peers
        if (!(room.netPlayMode === 1 && netServerOnlyControls.has(control)))
            netControlsToSend.push({ c: (control << 4) | press, d: data });       // binary encoded

        // Do not apply control now if Client
        if (room.netPlayMode === 2) return;

        applyControlState(control, press, data);
    }
    this.processControlState = processControlState;

    function applyControlState(control, press, data) {
        machineControlsSocket.controlStateChanged(control, press, data);

        if (quickOptionsControls.has(control)) screen.quickOptionsControlsStateUpdate();
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
        var k = domKeys;

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
        keyCodeMap[KEY_STATE_12 | k.CONTROL | k.ALT]  = mc.SAVE_STATE_12;

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
        keyCodeMap[KEY_STATE_12 | k.ALT]  = mc.LOAD_STATE_12;

        // Alternate controls for Savestates with SHIFT pressed

        keyCodeMap[KEY_STATE_0 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.CONTROL | k.SHIFT | k.ALT]  = mc.SAVE_STATE_0;
        keyCodeMap[KEY_STATE_1 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_1;
        keyCodeMap[KEY_STATE_2 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_2;
        keyCodeMap[KEY_STATE_3 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_3;
        keyCodeMap[KEY_STATE_4 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_4;
        keyCodeMap[KEY_STATE_5 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_5;
        keyCodeMap[KEY_STATE_6 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_6;
        keyCodeMap[KEY_STATE_7 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_7;
        keyCodeMap[KEY_STATE_8 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_8;
        keyCodeMap[KEY_STATE_9 | k.CONTROL |  k.SHIFT | k.ALT]   = mc.SAVE_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.CONTROL | k.SHIFT | k.ALT]  = mc.SAVE_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.CONTROL | k.SHIFT | k.ALT]  = mc.SAVE_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.CONTROL | k.SHIFT | k.ALT]  = mc.SAVE_STATE_12;

        keyCodeMap[KEY_STATE_0  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_0a | k.SHIFT | k.ALT]  = mc.LOAD_STATE_0;
        keyCodeMap[KEY_STATE_1  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_1;
        keyCodeMap[KEY_STATE_2  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_2;
        keyCodeMap[KEY_STATE_3  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_3;
        keyCodeMap[KEY_STATE_4  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_4;
        keyCodeMap[KEY_STATE_5  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_5;
        keyCodeMap[KEY_STATE_6  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_6;
        keyCodeMap[KEY_STATE_7  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_7;
        keyCodeMap[KEY_STATE_8  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_8;
        keyCodeMap[KEY_STATE_9  | k.SHIFT | k.ALT]   = mc.LOAD_STATE_9;
        keyCodeMap[KEY_STATE_10 | k.SHIFT | k.ALT]  = mc.LOAD_STATE_10;
        keyCodeMap[KEY_STATE_11 | k.SHIFT | k.ALT]  = mc.LOAD_STATE_11;
        keyCodeMap[KEY_STATE_12 | k.SHIFT | k.ALT]  = mc.LOAD_STATE_12;

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
            if (!netServerOnlyControls.has(change.c >> 4)) netControlsToSend.push(change);
            applyControlState(change.c >> 4, change.c & 0x01, change.d);      // binary encoded, with data
        }
    };

    this.netClientApplyControlsChanges = function(changes) {
        for (var i = 0, len = changes.length; i < len; ++i) {
            var change = changes[i];
            applyControlState(change.c >> 4, change.c & 0x01, change.d);      // binary encoded, with data
        }
    };


    var domKeys = wmsx.DOMKeys;

    var mc = wmsx.MachineControls;

    var machineControlsSocket;
    var screen;

    var keyCodeMap = {};
    var keyStateMap = {};

    var controlStateMap =  {};

    var netControlsToSend = new Array(100); netControlsToSend.length = 0;     // pre allocate empty Array


    // Default Key Values

    var KEY_POWER            = domKeys.VK_F11.wc;

    var KEY_SPEED            = domKeys.VK_F12.wc;

    var KEY_INC_SPEED        = domKeys.VK_UP.wc;
    var KEY_DEC_SPEED        = domKeys.VK_DOWN.wc;
    var KEY_NORMAL_SPEED     = domKeys.VK_RIGHT.wc;
    var KEY_MIN_SPEED        = domKeys.VK_LEFT.wc;

    var KEY_PAUSE            = domKeys.VK_P.wc;
    var KEY_FRAME            = domKeys.VK_O.wc;
    var KEY_FRAMEa           = domKeys.VK_F.wc;

    var KEY_TRACE            = domKeys.VK_Q.wc;
    var KEY_DEBUG            = domKeys.VK_D.wc;
    var KEY_SPRITE_MODE      = domKeys.VK_S.wc;
    var KEY_VIDEO_STANDARD   = domKeys.VK_Q.wc;
    var KEY_VSYNCH           = domKeys.VK_W.wc;
    var KEY_CPU_TURBO        = domKeys.VK_T.wc;
    var KEY_VDP_TURBO        = domKeys.VK_Y.wc;

    var KEY_STATE_0          = domKeys.VK_QUOTE.wc;
    var KEY_STATE_0a         = domKeys.VK_BACKQUOTE.wc;
    var KEY_STATE_1          = domKeys.VK_1.wc;
    var KEY_STATE_2          = domKeys.VK_2.wc;
    var KEY_STATE_3          = domKeys.VK_3.wc;
    var KEY_STATE_4          = domKeys.VK_4.wc;
    var KEY_STATE_5          = domKeys.VK_5.wc;
    var KEY_STATE_6          = domKeys.VK_6.wc;
    var KEY_STATE_7          = domKeys.VK_7.wc;
    var KEY_STATE_8          = domKeys.VK_8.wc;
    var KEY_STATE_9          = domKeys.VK_9.wc;
    var KEY_STATE_10         = domKeys.VK_0.wc;
    var KEY_STATE_11         = domKeys.VK_MINUS.wc;
    var KEY_STATE_12         = domKeys.VK_EQUALS.wc;

    var quickOptionsControls = new Set([
        mc.VIDEO_STANDARD, mc.CPU_TURBO_MODE, mc.VDP_TURBO_MODE, mc.SPRITE_MODE, mc.VSYNCH
    ]);

    // User can issue control only on Server. Not sent to Client over network
    var netServerOnlyControls = new Set([
        mc.SAVE_STATE_0, mc.SAVE_STATE_1, mc.SAVE_STATE_2, mc.SAVE_STATE_3, mc.SAVE_STATE_4, mc.SAVE_STATE_5, mc.SAVE_STATE_6,
        mc.SAVE_STATE_7, mc.SAVE_STATE_8, mc.SAVE_STATE_9, mc.SAVE_STATE_10, mc.SAVE_STATE_11, mc.SAVE_STATE_12, mc.SAVE_STATE_FILE,
        mc.LOAD_STATE_0, mc.LOAD_STATE_1, mc.LOAD_STATE_2, mc.LOAD_STATE_3, mc.LOAD_STATE_4, mc.LOAD_STATE_5, mc.LOAD_STATE_6,
        mc.LOAD_STATE_7, mc.LOAD_STATE_8, mc.LOAD_STATE_9, mc.LOAD_STATE_10, mc.LOAD_STATE_11, mc.LOAD_STATE_12,
        mc.TRACE
    ]);

    // User can issue control only on Server. Sent to Client over network
    var netClientBlockedControls = new Set([
        mc.VSYNCH
    ]);


    init();

};
