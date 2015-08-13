// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMPeripheralControls = function(monitor) {

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
        var controls = wmsx.PeripheralControls;

        keyCodeMap[KEY_CART1]      = controls.CARTRIDGE1_LOAD_FILE;
        keyCodeMap[KEY_CART2]      = controls.CARTRIDGE2_LOAD_FILE;
        keyCodeMap[KEY_TAPE]       = controls.TAPE_LOAD_FILE;

        keyAltCodeMap[KEY_CART1]   = controls.CARTRIDGE1_LOAD_FILE;
        keyAltCodeMap[KEY_CART2]   = controls.CARTRIDGE2_LOAD_FILE;
        keyAltCodeMap[KEY_TAPE]    = controls.TAPE_LOAD_FILE_NO_AUTO_RUN;

        keyControlCodeMap[KEY_CART1] = controls.CARTRIDGE1_LOAD_URL;
        keyControlCodeMap[KEY_CART2] = controls.CARTRIDGE2_LOAD_URL;
        keyControlCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_URL;

        keyShiftCodeMap[KEY_CART1] = controls.CARTRIDGE1_REMOVE;
        keyShiftCodeMap[KEY_CART2] = controls.CARTRIDGE2_REMOVE;
        keyShiftCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_EMPTY;

        keyControlAltCodeMap[KEY_TAPE]  = controls.TAPE_SAVE_FILE;
        keyAltCodeMap[KEY_TAPE_REW]  = controls.TAPE_REWIND;
        keyAltCodeMap[KEY_TAPE_END]  = controls.TAPE_TO_END;
        keyAltCodeMap[KEY_TAPE_FWD]  = controls.TAPE_SEEK_FWD;
        keyAltCodeMap[KEY_TAPE_BCK]  = controls.TAPE_SEEK_BACK;

        keyShiftControlCodeMap[KEY_TAPE] = controls.TAPE_AUTO_RUN;

        keyAltCodeMap[KEY_EXIT]         = controls.EXIT;

        keyAltCodeMap[KEY_CRT_FILTER]   = controls.SCREEN_CRT_FILTER;
        keyAltCodeMap[KEY_DEBUG]     	= controls.SCREEN_DEBUG;
        keyAltCodeMap[KEY_STATS]    	= controls.SCREEN_STATS;
        keyAltCodeMap[KEY_CRT_MODES] 	= controls.SCREEN_CRT_MODES;
        keyAltCodeMap[KEY_FULLSCREEN]  	= controls.SCREEN_FULLSCREEN;

        keyAltCodeMap[KEY_UP]     = controls.SCREEN_SIZE_MINUS;
        keyAltCodeMap[KEY_DOWN]   = controls.SCREEN_SIZE_PLUS;
        keyAltCodeMap[KEY_LEFT]   = controls.SCREEN_SIZE_MINUS;
        keyAltCodeMap[KEY_RIGHT]  = controls.SCREEN_SIZE_PLUS;

        keyControlAltCodeMap[KEY_UP]     = controls.SCREEN_SCALE_Y_MINUS;
        keyControlAltCodeMap[KEY_DOWN]   = controls.SCREEN_SCALE_Y_PLUS;
        keyControlAltCodeMap[KEY_LEFT]   = controls.SCREEN_SCALE_X_MINUS;
        keyControlAltCodeMap[KEY_RIGHT]  = controls.SCREEN_SCALE_X_PLUS;
        keyAltCodeMap[KEY_SIZE_DEFAULT]  = controls.SCREEN_SIZE_DEFAULT;

        //keyShiftCodeMap[KEY_CART_PASTE_INS] = controls.LOAD_CARTRIDGE_PASTE;
        //keyControlCodeMap[KEY_CART_PASTE_V] = controls.LOAD_CARTRIDGE_PASTE;
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

    var KEY_TAPE          = wmsx.DOMKeys.VK_F8.c;
    var KEY_TAPE_REW      = wmsx.DOMKeys.VK_HOME.c;
    var KEY_TAPE_END      = wmsx.DOMKeys.VK_END.c;
    var KEY_TAPE_BCK      = wmsx.DOMKeys.VK_PAGE_UP.c;
    var KEY_TAPE_FWD      = wmsx.DOMKeys.VK_PAGE_DOWN.c;

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
