// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMMonitorControls = function(monitor) {

    function init() {
        initKeys();
    }

    this.addInputElements = function(elements) {
        for (var i = 0; i < elements.length; i++)
            elements[i].addEventListener("keydown", this.keyDown);
    };

    this.keyDown = function(event) {
        var modifiers = 0 | (event.ctrlKey ? KEY_CTRL_MASK : 0) | (event.altKey ? KEY_ALT_MASK : 0) | (event.shiftKey ? KEY_SHIFT_MASK : 0);
        if (processKeyPress(event.keyCode, modifiers)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        }
    };

    var processKeyPress = function(keyCode, modifiers) {
        var control = controlForEvent(keyCode, modifiers);
        if (!control) return false;
        monitor.controlActivated(control);
        return true;
    };

    var controlForEvent = function(keyCode, modif) {
        switch (modif) {
            case 0:
                return keyCodeMap[keyCode];
            case KEY_ALT_MASK:
                return keyAltCodeMap[keyCode];
            case KEY_SHIFT_MASK:
                return keyShiftCodeMap[keyCode];
            case KEY_CTRL_MASK:
                return keyControlCodeMap[keyCode];
            case KEY_CTRL_MASK | KEY_ALT_MASK:
                return keyControlAltCodeMap[keyCode];
            case KEY_SHIFT_MASK | KEY_CTRL_MASK:
                return keyShiftControlCodeMap[keyCode];
            case KEY_SHIFT_MASK | KEY_ALT_MASK:
                return keyShiftAltCodeMap[keyCode];
        }
        return null;
    };

    var initKeys = function() {
        var monControls = wmsx.Monitor.Controls;

        keyCodeMap[KEY_CART1]      = monControls.LOAD_CARTRIDGE1_FILE;
        keyCodeMap[KEY_CART2]      = monControls.LOAD_CARTRIDGE2_FILE;
        keyCodeMap[KEY_TAPE]       = monControls.LOAD_TAPE_FILE;

        keyAltCodeMap[KEY_CART1]   = monControls.LOAD_CARTRIDGE1_FILE;
        keyAltCodeMap[KEY_CART2]   = monControls.LOAD_CARTRIDGE2_FILE;
        keyAltCodeMap[KEY_TAPE]    = monControls.LOAD_TAPE_FILE;

        keyControlCodeMap[KEY_CART1] = monControls.LOAD_CARTRIDGE1_URL;
        keyControlCodeMap[KEY_CART2] = monControls.LOAD_CARTRIDGE2_URL;
        keyControlCodeMap[KEY_TAPE]  = monControls.LOAD_TAPE_URL;

        keyShiftCodeMap[KEY_CART1] = monControls.REMOVE_CARTRIDGE1;
        keyShiftCodeMap[KEY_CART2] = monControls.REMOVE_CARTRIDGE2;
        keyShiftCodeMap[KEY_TAPE]  = monControls.REMOVE_TAPE;

        keyAltCodeMap[KEY_EXIT]         = monControls.EXIT;


        keyAltCodeMap[KEY_CRT_FILTER]   = monControls.CRT_FILTER;
        keyAltCodeMap[KEY_DEBUG]     	= monControls.DEBUG;
        keyAltCodeMap[KEY_STATS]    	= monControls.STATS;
        keyAltCodeMap[KEY_CRT_MODES] 	= monControls.CRT_MODES;
        keyAltCodeMap[KEY_FULLSCREEN]  	= monControls.FULLSCREEN;

        keyAltCodeMap[KEY_UP]     = monControls.SIZE_MINUS;
        keyAltCodeMap[KEY_DOWN]   = monControls.SIZE_PLUS;
        keyAltCodeMap[KEY_LEFT]   = monControls.SIZE_MINUS;
        keyAltCodeMap[KEY_RIGHT]  = monControls.SIZE_PLUS;

        keyControlAltCodeMap[KEY_UP]     = monControls.SCALE_Y_MINUS;
        keyControlAltCodeMap[KEY_DOWN]   = monControls.SCALE_Y_PLUS;
        keyControlAltCodeMap[KEY_LEFT]   = monControls.SCALE_X_MINUS;
        keyControlAltCodeMap[KEY_RIGHT]  = monControls.SCALE_X_PLUS;
        keyAltCodeMap[KEY_SIZE_DEFAULT]  = monControls.SIZE_DEFAULT;

        //keyShiftCodeMap[KEY_CART_PASTE_INS] = monControls.LOAD_CARTRIDGE_PASTE;
        //keyControlCodeMap[KEY_CART_PASTE_V] = monControls.LOAD_CARTRIDGE_PASTE;
    };


    var keyCodeMap = {};
    var keyShiftCodeMap = {};
    var keyAltCodeMap = {};
    var keyShiftControlCodeMap = {};
    var keyShiftAltCodeMap = {};
    var keyControlCodeMap = {};
    var keyControlAltCodeMap = {};


    var KEY_LEFT           = wmsx.DOMKeys.VK_LEFT.c;
    var KEY_UP             = wmsx.DOMKeys.VK_UP.c;
    var KEY_RIGHT          = wmsx.DOMKeys.VK_RIGHT.c;
    var KEY_DOWN           = wmsx.DOMKeys.VK_DOWN.c;

    var KEY_SIZE_DEFAULT   = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_CART1   = wmsx.DOMKeys.VK_F6.c;
    var KEY_CART2   = wmsx.DOMKeys.VK_F7.c;
    var KEY_TAPE    = wmsx.DOMKeys.VK_F8.c;

    var KEY_CART_PASTE_V   = wmsx.DOMKeys.VK_V.c;
    var KEY_CART_PASTE_INS = wmsx.DOMKeys.VK_INSERT.c;

    var KEY_CRT_FILTER     = wmsx.DOMKeys.VK_T.c;
    var KEY_CRT_MODES      = wmsx.DOMKeys.VK_R.c;

    var KEY_DEBUG          = wmsx.DOMKeys.VK_D.c;
    var KEY_STATS          = wmsx.DOMKeys.VK_G.c;

    var KEY_FULLSCREEN     = wmsx.DOMKeys.VK_ENTER.c;

    var KEY_EXIT           = wmsx.DOMKeys.VK_ESCAPE.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    init();

};
