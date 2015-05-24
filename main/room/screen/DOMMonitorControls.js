// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

DOMMonitorControls = function(monitor) {

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
        var monControls = Monitor.Controls;

        // keyCodeMap[KEY_EXIT]            = monControls.EXIT;

        keyCodeMap[KEY_CART_FILE]       = monControls.LOAD_CARTRIDGE_FILE;
        keyCodeMap[KEY_CART_URL]        = monControls.LOAD_CARTRIDGE_URL;

        keyAltCodeMap[KEY_CART_FILE]    = monControls.LOAD_CARTRIDGE_FILE;
        keyAltCodeMap[KEY_CART_URL]     = monControls.LOAD_CARTRIDGE_URL;

        keyControlCodeMap[KEY_CART_FILE] = monControls.LOAD_CARTRIDGE_FILE_NO_AUTO_POWER;
        keyControlCodeMap[KEY_CART_URL]  = monControls.LOAD_CARTRIDGE_URL_NO_AUTO_POWER;

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

        //keyShiftCodeMap[KEY_CART_PASTE_INS] = monControls.LOAD_CARTRIDGE_PASTE;
        //keyControlCodeMap[KEY_CART_PASTE_V] = monControls.LOAD_CARTRIDGE_PASTE;

        keyAltCodeMap[KEY_SIZE_DEFAULT] = monControls.SIZE_DEFAULT;
    };


    var keyCodeMap = {};
    var keyShiftCodeMap = {};
    var keyAltCodeMap = {};
    var keyShiftControlCodeMap = {};
    var keyShiftAltCodeMap = {};
    var keyControlCodeMap = {};
    var keyControlAltCodeMap = {};


    var KEY_LEFT           = DOMKeys.VK_LEFT.c;
    var KEY_UP             = DOMKeys.VK_UP.c;
    var KEY_RIGHT          = DOMKeys.VK_RIGHT.c;
    var KEY_DOWN           = DOMKeys.VK_DOWN.c;

    var KEY_SIZE_DEFAULT   = DOMKeys.VK_BACKSPACE.c;

    var KEY_CART_FILE      = DOMKeys.VK_F10.c;
    var KEY_CART_URL       = DOMKeys.VK_F11.c;
    var KEY_CART_PASTE_V   = DOMKeys.VK_V.c;
    var KEY_CART_PASTE_INS = DOMKeys.VK_INSERT.c;

    var KEY_CRT_FILTER     = DOMKeys.VK_T.c;
    var KEY_CRT_MODES      = DOMKeys.VK_R.c;

    var KEY_DEBUG          = DOMKeys.VK_D.c;
    var KEY_STATS          = DOMKeys.VK_G.c;

    var KEY_FULLSCREEN     = DOMKeys.VK_ENTER.c;

    var KEY_EXIT           = DOMKeys.VK_ESCAPE.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    init();

};
