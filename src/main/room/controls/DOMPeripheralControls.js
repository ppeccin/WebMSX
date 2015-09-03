// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMPeripheralControls = function(room) {

    function init() {
        initKeys();
    }

    this.connect = function(pCartridgeSocket) {
        cartridgeSocket = pCartridgeSocket;
    };

    this.connectPeripherals = function(pMonitor, pFileLoader, pCassetteDeck, pDiskDrive) {
        monitor = pMonitor;
        fileLoader = pFileLoader;
        cassetteDeck = pCassetteDeck;
        diskDrive = pDiskDrive;
    };

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
        controlActivated(control);
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

    var controlActivated = function(control) {
        // All controls are Press-only and repeatable
        switch(control) {
            case controls.DISKA_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true, false);
                break;
            case controls.DISKA_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(true, false);
                break;
            case controls.DISKA_REMOVE:
                if (!mediaChangeDisabledWarning()) diskDrive.removeDisk();
                break;
            case controls.DISKB_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true, true);
                break;
            case controls.DISKB_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(true, true);
                break;
            case controls.DISKB_REMOVE:
                if (!mediaChangeDisabledWarning()) diskDrive.removeDisk();
                break;
            case controls.CARTRIDGE1_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true, false);
                break;
            case controls.CARTRIDGE1_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(true, false);
                break;
            case controls.CARTRIDGE1_REMOVE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.insert(null, 1, true);
                break;
            case controls.CARTRIDGE2_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true, true);
                break;
            case controls.CARTRIDGE2_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(true, true);
                break;
            case controls.CARTRIDGE2_REMOVE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.insert(null, 2, true);
                break;
            case controls.TAPE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true);
                break;
            case controls.TAPE_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(true);
                break;
            case controls.TAPE_LOAD_FILE_NO_AUTO_RUN:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(false);
                break;
            case controls.TAPE_LOAD_URL_NO_AUTO_RUN:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(false);
                break;
            case controls.TAPE_LOAD_EMPTY:
                if (!mediaChangeDisabledWarning()) cassetteDeck.loadEmpty();
                break;
            case controls.TAPE_SAVE_FILE:
                if (!mediaChangeDisabledWarning()) cassetteDeck.saveTapeFile();
                break;
            case controls.TAPE_REWIND:
                if (!mediaChangeDisabledWarning()) cassetteDeck.rewind();
                break;
            case controls.TAPE_TO_END:
                if (!mediaChangeDisabledWarning()) cassetteDeck.seekToEnd();
                break;
            case controls.TAPE_SEEK_BACK:
                if (!mediaChangeDisabledWarning()) cassetteDeck.seekBackward();
                break;
            case controls.TAPE_SEEK_FWD:
                if (!mediaChangeDisabledWarning()) cassetteDeck.seekForward();
                break;
            case controls.TAPE_AUTO_RUN:
                cassetteDeck.typeCurrentAutoRunCommand();
                break;
            case controls.SCREEN_CRT_MODE:
                monitor.crtModeToggle(); break;
            case controls.SCREEN_CRT_FILTER:
                monitor.crtFilterToggle(); break;
            case controls.SCREEN_DEBUG:
                monitor.debugModesCycle(); break;
            case controls.SCREEN_DEFAULTS:
                monitor.setDefaults();
                monitor.showOSD("Initial Settings", true);
                break;
            case controls.SCREEN_FULLSCREEN:
                monitor.fullscreenToggle(); break;
            case controls.EXIT:
                room.exit(); break;
        }
        if (SCREEN_FIXED_SIZE) return;
        switch(control) {
            case controls.SCREEN_SCALE_X_MINUS:
                monitor.displayScaleXDecrease(); break;
            case controls.SCREEN_SCALE_X_PLUS:
                monitor.displayScaleXIncrease(); break;
            case controls.SCREEN_SCALE_Y_MINUS:
                monitor.displayScaleYDecrease(); break;
            case controls.SCREEN_SCALE_Y_PLUS:
                monitor.displayScaleYIncrease(); break;
            case controls.SCREEN_SIZE_MINUS:
                monitor.displaySizeDecrease(); break;
            case controls.SCREEN_SIZE_PLUS:
                monitor.displaySizeIncrease(); break;
        }
    };

    var mediaChangeDisabledWarning = function() {
        if (WMSX.MEDIA_CHANGE_DISABLED) {
            monitor.showOSD("Media change is disabled", true);
            return true;
        }
        return false;
    };


    var initKeys = function() {
        keyCodeMap[KEY_DISKA]      = controls.DISKA_LOAD_FILE;
        keyCodeMap[KEY_DISKB]      = controls.DISKB_LOAD_FILE;
        keyCodeMap[KEY_CART1]      = controls.CARTRIDGE1_LOAD_FILE;
        keyCodeMap[KEY_CART2]      = controls.CARTRIDGE2_LOAD_FILE;
        keyCodeMap[KEY_TAPE]       = controls.TAPE_LOAD_FILE;

        keyAltCodeMap[KEY_DISKA]   = controls.DISKA_LOAD_FILE;
        keyAltCodeMap[KEY_DISKB]   = controls.DISKB_LOAD_FILE;
        keyAltCodeMap[KEY_CART1]   = controls.CARTRIDGE1_LOAD_FILE;
        keyAltCodeMap[KEY_CART2]   = controls.CARTRIDGE2_LOAD_FILE;
        keyAltCodeMap[KEY_TAPE]    = controls.TAPE_LOAD_FILE_NO_AUTO_RUN;

        keyControlCodeMap[KEY_DISKA] = controls.DISKA_LOAD_URL;
        keyControlCodeMap[KEY_DISKB] = controls.DISKB_LOAD_URL;
        keyControlCodeMap[KEY_CART1] = controls.CARTRIDGE1_LOAD_URL;
        keyControlCodeMap[KEY_CART2] = controls.CARTRIDGE2_LOAD_URL;
        keyControlCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_URL;

        keyShiftCodeMap[KEY_DISKA] = controls.DISKA_REMOVE;
        keyShiftCodeMap[KEY_DISKB] = controls.DISKB_REMOVE;
        keyShiftCodeMap[KEY_CART1] = controls.CARTRIDGE1_REMOVE;
        keyShiftCodeMap[KEY_CART2] = controls.CARTRIDGE2_REMOVE;
        keyShiftCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_EMPTY;

        keyAltCodeMap[KEY_TAPE_REW]  = controls.TAPE_REWIND;
        keyAltCodeMap[KEY_TAPE_END]  = controls.TAPE_TO_END;
        keyAltCodeMap[KEY_TAPE_FWD]  = controls.TAPE_SEEK_FWD;
        keyAltCodeMap[KEY_TAPE_BCK]  = controls.TAPE_SEEK_BACK;

        keyControlAltCodeMap[KEY_DISKA] = controls.DISKA_SAVE_FILE;
        keyControlAltCodeMap[KEY_DISKB] = controls.DISKB_SAVE_FILE;
        keyControlAltCodeMap[KEY_TAPE]   = controls.TAPE_SAVE_FILE;

        keyShiftControlCodeMap[KEY_TAPE] = controls.TAPE_AUTO_RUN;

        keyAltCodeMap[KEY_EXIT]         = controls.EXIT;

        keyAltCodeMap[KEY_CRT_FILTER]   = controls.SCREEN_CRT_FILTER;
        keyAltCodeMap[KEY_DEBUG]     	= controls.SCREEN_DEBUG;
        keyAltCodeMap[KEY_CRT_MODE] 	= controls.SCREEN_CRT_MODE;
        keyAltCodeMap[KEY_FULLSCREEN]  	= controls.SCREEN_FULLSCREEN;

        keyAltCodeMap[KEY_UP]     = controls.SCREEN_SIZE_MINUS;
        keyAltCodeMap[KEY_DOWN]   = controls.SCREEN_SIZE_PLUS;
        keyAltCodeMap[KEY_LEFT]   = controls.SCREEN_SIZE_MINUS;
        keyAltCodeMap[KEY_RIGHT]  = controls.SCREEN_SIZE_PLUS;

        keyShiftAltCodeMap[KEY_UP]     = controls.SCREEN_SCALE_Y_MINUS;
        keyShiftAltCodeMap[KEY_DOWN]   = controls.SCREEN_SCALE_Y_PLUS;
        keyShiftAltCodeMap[KEY_LEFT]   = controls.SCREEN_SCALE_X_MINUS;
        keyShiftAltCodeMap[KEY_RIGHT]  = controls.SCREEN_SCALE_X_PLUS;

        keyAltCodeMap[KEY_DEFAULTS]  = controls.SCREEN_DEFAULTS;
    };


    var controls = wmsx.PeripheralControls;

    var monitor;
    var fileLoader;
    var cartridgeSocket;
    var cassetteDeck;
    var diskDrive;

    var keyCodeMap = {};
    var keyShiftCodeMap = {};
    var keyAltCodeMap = {};
    var keyShiftControlCodeMap = {};
    var keyShiftAltCodeMap = {};
    var keyControlCodeMap = {};
    var keyControlAltCodeMap = {};


    var KEY_LEFT    = wmsx.DOMKeys.VK_LEFT.c;
    var KEY_UP      = wmsx.DOMKeys.VK_UP.c;
    var KEY_RIGHT   = wmsx.DOMKeys.VK_RIGHT.c;
    var KEY_DOWN    = wmsx.DOMKeys.VK_DOWN.c;

    var KEY_DEFAULTS  = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_DISKA  = wmsx.DOMKeys.VK_F6.c;
    var KEY_DISKB  = wmsx.DOMKeys.VK_F7.c;

    var KEY_TAPE       = wmsx.DOMKeys.VK_F8.c;
    var KEY_TAPE_REW   = wmsx.DOMKeys.VK_HOME.c;
    var KEY_TAPE_END   = wmsx.DOMKeys.VK_END.c;
    var KEY_TAPE_BCK   = wmsx.DOMKeys.VK_PAGE_UP.c;
    var KEY_TAPE_FWD   = wmsx.DOMKeys.VK_PAGE_DOWN.c;

    var KEY_CART1  = wmsx.DOMKeys.VK_F9.c;
    var KEY_CART2  = wmsx.DOMKeys.VK_F10.c;

    var KEY_CART_PASTE_V   = wmsx.DOMKeys.VK_V.c;
    var KEY_CART_PASTE_INS = wmsx.DOMKeys.VK_INSERT.c;

    var KEY_CRT_FILTER  = wmsx.DOMKeys.VK_T.c;
    var KEY_CRT_MODE    = wmsx.DOMKeys.VK_R.c;

    var KEY_DEBUG   = wmsx.DOMKeys.VK_D.c;

    var KEY_FULLSCREEN   = wmsx.DOMKeys.VK_ENTER.c;

    var KEY_EXIT  = wmsx.DOMKeys.VK_ESCAPE.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    var SCREEN_FIXED_SIZE = WMSX.SCREEN_RESIZE_DISABLED;


    init();

};
