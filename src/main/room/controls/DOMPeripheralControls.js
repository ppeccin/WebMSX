// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMPeripheralControls = function(room) {

    var self = this;

    function init() {
        initKeys();
    }

    this.connect = function(pMachineControlsSocket, pCartridgeSocket) {
        machineControlsSocket = pMachineControlsSocket;
        cartridgeSocket = pCartridgeSocket;
    };

    this.connectPeripherals = function(pScreen, pControllersHub, pFileLoader, pCassetteDeck, pDiskDrive) {
        screen = pScreen;
        monitor = pScreen.getMonitor();
        controllersHub = pControllersHub;
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
        self.controlActivated(control);
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
            case KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK:
                return keyShiftControlAltCodeMap[keyCode];
        }
        return null;
    };

    this.controlActivated = function(control) {
        // All controls are Press-only and repeatable
        switch(control) {
            case controls.MACHINE_POWER_TOGGLE:
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.POWER, true);   // No local keys for this, used only by Screen button
                break;
            case controls.MACHINE_POWER_RESET:
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.RESET, true);   // No local keys for this, used only by Screen button
                break;
            case controls.MACHINE_SAVE_STATE_FILE:
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.SAVE_STATE_FILE, true);   // No local keys for this, used only by Screen button
                break;
            case controls.DISKA_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(false, false);
                break;
            case controls.DISKA_LOAD_FILE_ALT_POWER:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true, false);
                break;
            case controls.DISKA_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(false, false);
                break;
            case controls.DISKA_REMOVE:
                if (!mediaChangeDisabledWarning()) diskDrive.removeDisk(0);
                break;
            case controls.DISKA_EMPTY:
                if (!mediaChangeDisabledWarning()) diskDrive.loadEmptyDisk(0);
                break;
            case controls.DISKA_SAVE_FILE:
                if (!mediaChangeDisabledWarning()) diskDrive.saveDiskFile(0);
                break;
            case controls.DISKB_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(false, true);
                break;
            case controls.DISKB_LOAD_FILE_ALT_POWER:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true, true);
                break;
            case controls.DISKB_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(false, true);
                break;
            case controls.DISKB_REMOVE:
                if (!mediaChangeDisabledWarning()) diskDrive.removeDisk(1);
                break;
            case controls.DISKB_EMPTY:
                if (!mediaChangeDisabledWarning()) diskDrive.loadEmptyDisk(1);
                break;
            case controls.DISKB_SAVE_FILE:
                if (!mediaChangeDisabledWarning()) diskDrive.saveDiskFile(1);
                break;
            case controls.CARTRIDGE1_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(false, false);
                break;
            case controls.CARTRIDGE1_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(false, false);
                break;
            case controls.CARTRIDGE1_REMOVE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.insert(null, 0, false);
                break;
            case controls.CARTRIDGE2_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(false, true);
                break;
            case controls.CARTRIDGE2_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(false, true);
                break;
            case controls.CARTRIDGE2_REMOVE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.insert(null, 1, false);
                break;
            case controls.TAPE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(false);
                break;
            case controls.TAPE_LOAD_FILE_ALT_POWER:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(true);
                break;
            case controls.TAPE_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(false);
                break;
            case controls.TAPE_REMOVE:
                if (!mediaChangeDisabledWarning()) cassetteDeck.removeTape();
                break;
            case controls.TAPE_EMPTY:
                if (!mediaChangeDisabledWarning()) cassetteDeck.loadEmptyTape();
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
                cassetteDeck.userTypeCurrentAutoRunCommand();
                break;
            case controls.SCREEN_CRT_MODE:
                monitor.crtModeToggle(); break;
            case controls.SCREEN_CRT_FILTER:
                monitor.crtFilterToggle(); break;
            case controls.SCREEN_DEFAULTS:
                monitor.setDefaults();
                monitor.showOSD("Initial Settings", true);
                break;
            case controls.SCREEN_FULLSCREEN:
                monitor.fullscreenToggle(); break;
            case controls.JOYSTICKS_TOGGLE_MODE:
                controllersHub.toggleJoystickMode(); break;
            case controls.MOUSE_TOGGLE_MODE:
                controllersHub.toggleMouseMode(); break;
            case controls.PASTE_STRING:
                screen.openPasteDialog();
                break;
            case controls.EXIT:
                room.exit(); break;
        }
        if (SCREEN_FIXED_SIZE) return;
        switch(control) {
            case controls.SCREEN_ASPECT_MINUS:
                monitor.displayAspectDecrease(); break;
            case controls.SCREEN_ASPECT_PLUS:
                monitor.displayAspectIncrease(); break;
            case controls.SCREEN_SCALE_MINUS:
                monitor.displayScaleDecrease(); break;
            case controls.SCREEN_SCALE_PLUS:
                monitor.displayScaleIncrease(); break;
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
        keyCodeMap[KEY_DISKA] = controls.DISKA_LOAD_FILE;
        keyCodeMap[KEY_DISKB] = controls.DISKB_LOAD_FILE;
        keyCodeMap[KEY_CART1] = controls.CARTRIDGE1_LOAD_FILE;
        keyCodeMap[KEY_CART2] = controls.CARTRIDGE2_LOAD_FILE;
        keyCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_FILE;

        keyAltCodeMap[KEY_DISKA] = controls.DISKA_LOAD_FILE;
        keyAltCodeMap[KEY_DISKB] = controls.DISKB_LOAD_FILE;
        keyAltCodeMap[KEY_CART1] = controls.CARTRIDGE1_LOAD_FILE;
        keyAltCodeMap[KEY_CART2] = controls.CARTRIDGE2_LOAD_FILE;
        keyAltCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_FILE;

        keyShiftControlCodeMap[KEY_DISKA] = controls.DISKA_LOAD_FILE_ALT_POWER;
        keyShiftControlCodeMap[KEY_DISKB] = controls.DISKB_LOAD_FILE_ALT_POWER;
        keyShiftControlCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_FILE_ALT_POWER;

        keyShiftAltCodeMap[KEY_DISKA] = controls.DISKA_LOAD_URL;
        keyShiftAltCodeMap[KEY_DISKB] = controls.DISKB_LOAD_URL;
        keyShiftAltCodeMap[KEY_CART1] = controls.CARTRIDGE1_LOAD_URL;
        keyShiftAltCodeMap[KEY_CART2] = controls.CARTRIDGE2_LOAD_URL;
        keyShiftAltCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_URL;

        keyControlCodeMap[KEY_DISKA] = controls.DISKA_REMOVE;
        keyControlCodeMap[KEY_DISKB] = controls.DISKB_REMOVE;
        keyControlCodeMap[KEY_CART1] = controls.CARTRIDGE1_REMOVE;
        keyControlCodeMap[KEY_CART2] = controls.CARTRIDGE2_REMOVE;
        keyControlCodeMap[KEY_TAPE]  = controls.TAPE_REMOVE;

        keyShiftCodeMap[KEY_DISKA] = controls.DISKA_EMPTY;
        keyShiftCodeMap[KEY_DISKB] = controls.DISKB_EMPTY;
        keyShiftCodeMap[KEY_TAPE]  = controls.TAPE_EMPTY;

        keyControlAltCodeMap[KEY_DISKA] = controls.DISKA_SAVE_FILE;
        keyControlAltCodeMap[KEY_DISKB] = controls.DISKB_SAVE_FILE;
        keyControlAltCodeMap[KEY_TAPE]  = controls.TAPE_SAVE_FILE;

        keyAltCodeMap[KEY_TAPE_REW]  = controls.TAPE_REWIND;
        keyAltCodeMap[KEY_TAPE_END]  = controls.TAPE_TO_END;
        keyAltCodeMap[KEY_TAPE_FWD]  = controls.TAPE_SEEK_FWD;
        keyAltCodeMap[KEY_TAPE_BCK]  = controls.TAPE_SEEK_BACK;

        keyShiftControlAltCodeMap[KEY_TAPE] = controls.TAPE_AUTO_RUN;

        keyAltCodeMap[KEY_EXIT]         = controls.EXIT;

        keyAltCodeMap[KEY_JOYSTICKS_TOGGLE]  = controls.JOYSTICKS_TOGGLE_MODE;
        keyAltCodeMap[KEY_MOUSE_TOGGLE]      = controls.MOUSE_TOGGLE_MODE;

        keyAltCodeMap[KEY_CRT_FILTER]   = controls.SCREEN_CRT_FILTER;
        keyAltCodeMap[KEY_CRT_MODE] 	= controls.SCREEN_CRT_MODE;
        keyAltCodeMap[KEY_FULLSCREEN]  	= controls.SCREEN_FULLSCREEN;

        keyControlAltCodeMap[KEY_UP]     = controls.SCREEN_SCALE_MINUS;
        keyControlAltCodeMap[KEY_DOWN]   = controls.SCREEN_SCALE_PLUS;

        keyControlAltCodeMap[KEY_LEFT]   = controls.SCREEN_ASPECT_MINUS;
        keyControlAltCodeMap[KEY_RIGHT]  = controls.SCREEN_ASPECT_PLUS;

        keyAltCodeMap[KEY_DEFAULTS]  = controls.SCREEN_DEFAULTS;

        keyAltCodeMap[KEY_PASTE]  = controls.PASTE_STRING;
    };


    var controls = wmsx.PeripheralControls;

    var machineControlsSocket;
    var screen;
    var monitor;
    var controllersHub;
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
    var keyShiftControlAltCodeMap = {};


    var KEY_LEFT    = wmsx.DOMKeys.VK_LEFT.c;
    var KEY_UP      = wmsx.DOMKeys.VK_UP.c;
    var KEY_RIGHT   = wmsx.DOMKeys.VK_RIGHT.c;
    var KEY_DOWN    = wmsx.DOMKeys.VK_DOWN.c;

    var KEY_DEFAULTS  = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_PASTE  = wmsx.DOMKeys.VK_X.c;

    var KEY_DISKA  = wmsx.DOMKeys.VK_F6.c;
    var KEY_DISKB  = wmsx.DOMKeys.VK_F7.c;

    var KEY_TAPE       = wmsx.DOMKeys.VK_F8.c;
    var KEY_TAPE_REW   = wmsx.DOMKeys.VK_HOME.c;
    var KEY_TAPE_END   = wmsx.DOMKeys.VK_END.c;
    var KEY_TAPE_BCK   = wmsx.DOMKeys.VK_PAGE_UP.c;
    var KEY_TAPE_FWD   = wmsx.DOMKeys.VK_PAGE_DOWN.c;
    var KEY_CART1  = wmsx.DOMKeys.VK_F9.c;
    var KEY_CART2  = wmsx.DOMKeys.VK_F10.c;

    var KEY_JOYSTICKS_TOGGLE  = wmsx.DOMKeys.VK_J.c;
    var KEY_MOUSE_TOGGLE      = wmsx.DOMKeys.VK_M.c;

    var KEY_CRT_FILTER  = wmsx.DOMKeys.VK_T.c;
    var KEY_CRT_MODE    = wmsx.DOMKeys.VK_R.c;
    var KEY_FULLSCREEN  = wmsx.DOMKeys.VK_ENTER.c;

    var KEY_EXIT  = wmsx.DOMKeys.VK_ESCAPE.c;

    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;


    var SCREEN_FIXED_SIZE = WMSX.SCREEN_RESIZE_DISABLED;


    init();

};
