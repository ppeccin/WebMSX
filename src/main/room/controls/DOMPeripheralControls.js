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

    this.keyDown = function(event) {
        if (processKeyPress(event.keyCode, event.shiftKey, event.ctrlKey, event.altKey)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        }
    };

    this.keyUp = function(event) {
    };

    var processKeyPress = function(keyCode, shiftKey, ctrlKey, altKey) {
        var control = controlForEvent(keyCode, ctrlKey, altKey);
        if (!control) return false;
        self.controlActivated(control, false, shiftKey);      // Never altPower
        return true;
    };

    var controlForEvent = function(keyCode, ctrlKey, altKey) {
        if (ctrlKey && altKey)
            return keyControlAltCodeMap[keyCode];
        if (ctrlKey)
            return keyControlCodeMap[keyCode];
        if (altKey)
            return keyAltCodeMap[keyCode];
        return keyCodeMap[keyCode];
    };

    this.controlActivated = function(control, altPower, secPort) {
        // All controls are Press-only and repeatable
        switch(control) {
            case controls.MACHINE_POWER_TOGGLE:
                if (altPower) return this.controlActivated(controls.MACHINE_POWER_RESET);
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.POWER, true);
                break;
            case controls.MACHINE_POWER_RESET:
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.RESET, true);
                break;
            case controls.MACHINE_LOAD_STATE_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.STATE, false, false);
                break;
            case controls.MACHINE_SAVE_STATE_FILE:
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.SAVE_STATE_FILE, true);
                break;
            case controls.DISK_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.DISK, altPower, secPort);
                break;
            case controls.DISK_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.DISK, altPower, secPort);
                break;
            case controls.DISK_LOAD_FILES:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.FILES_AS_DISK, altPower, secPort);
                break;
            case controls.DISK_LOAD_ZIP:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.ZIP_AS_DISK, altPower, secPort);
                break;
            case controls.DISK_REMOVE:
                if (!mediaChangeDisabledWarning()) diskDrive.removeDisk(secPort ? 1 : 0);
                break;
            case controls.DISK_EMPTY:
                if (!mediaChangeDisabledWarning()) diskDrive.loadNewFormattedDisk(secPort ? 1 : 0, null);
                break;
            case controls.DISK_EMPTY_720:
                if (!mediaChangeDisabledWarning()) diskDrive.loadNewFormattedDisk(secPort ? 1 : 0, diskDrive.FORMAT_OPTIONS_MEDIA_TYPES[0]);
                break;
            case controls.DISK_EMPTY_360:
                if (!mediaChangeDisabledWarning()) diskDrive.loadNewFormattedDisk(secPort ? 1 : 0, diskDrive.FORMAT_OPTIONS_MEDIA_TYPES[1]);
                break;
            case controls.DISK_SAVE_FILE:
                if (!mediaChangeDisabledWarning()) diskDrive.saveDiskFile(secPort ? 1 : 0);
                break;
            case controls.CARTRIDGE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.ROM, altPower, secPort);
                break;
            case controls.CARTRIDGE_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.ROM, altPower, secPort);
                break;
            case controls.CARTRIDGE_REMOVE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.remove(secPort ? 1 : 0, altPower);
                break;
            case controls.CARTRIDGE_LOAD_DATA_FILE:
                if (cartridgeSocket.dataOperationNotSupportedMessage(secPort ? 1 : 0, false, false)) break;
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.CART_DATA, altPower, secPort);
                break;
            case controls.CARTRIDGE_SAVE_DATA_FILE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.saveCartridgeDataFile(secPort ? 1 : 0);
                break;
            case controls.TAPE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.TAPE, altPower, secPort);
                break;
            case controls.TAPE_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.TAPE, altPower, secPort);
                break;
            case controls.TAPE_REMOVE:
                if (!mediaChangeDisabledWarning()) cassetteDeck.removeTape();
                break;
            case controls.TAPE_EMPTY:
                if (!mediaChangeDisabledWarning()) cassetteDeck.loadEmptyTape();
                break;
            case controls.TAPE_SAVE_FILE:
                if (secPort) return this.controlActivated(controls.TAPE_AUTO_RUN);
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
            case controls.ALL_LOAD_URL:     // TODO Make it work
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.ALL, altPower, secPort);
                break;
            case controls.SCREEN_CRT_MODE:
                monitor.crtModeToggle(); break;
            case controls.SCREEN_CRT_FILTER:
                monitor.crtFilterToggle(); break;
            case controls.SCREEN_FULLSCREEN:
                monitor.fullscreenToggle(); break;
            case controls.SCREEN_DEFAULTS:
                monitor.setDefaults();
                monitor.showOSD("Default Settings", true);
                break;
            case controls.SCREEN_OPEN_HELP:
                screen.openHelp();
                break;
            case controls.SCREEN_OPEN_ABOUT:
                screen.openAbout();
                break;
            case controls.SCREEN_OPEN_SETTINGS:
                if (altPower) return this.controlActivated(controls.SCREEN_DEFAULTS);
                screen.openSettings();
                break;
            case controls.KEYBOARD_TOGGLE_HOST_LAYOUT:
                controllersHub.toggleKeyboardHostLayout(); break;
            case controls.JOYSTICKS_TOGGLE_MODE:
                controllersHub.toggleJoystickMode(); break;
            case controls.MOUSE_TOGGLE_MODE:
                controllersHub.toggleMouseMode(); break;
            case controls.TURBO_FIRE_TOGGLE:
                controllersHub.toggleTurboFireSpeed(); break;
            case controls.PASTE_STRING:
                screen.togglePasteDialog();
                break;
            case controls.CAPTURE_SCREEN:
                screen.captureScreen();
                break;
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
        keyCodeMap[KEY_DISK] = controls.DISK_LOAD_FILE;
        keyControlCodeMap[KEY_DISK] = controls.DISK_EMPTY;
        keyAltCodeMap[KEY_DISK] = controls.DISK_REMOVE;
        keyControlAltCodeMap[KEY_DISK] = controls.DISK_SAVE_FILE;

        keyCodeMap[KEY_CART] = controls.CARTRIDGE_LOAD_FILE;
        keyAltCodeMap[KEY_CART] = controls.CARTRIDGE_REMOVE;
        keyControlCodeMap[KEY_CART] = controls.CARTRIDGE_LOAD_DATA_FILE;
        keyControlAltCodeMap[KEY_CART] = controls.CARTRIDGE_SAVE_DATA_FILE;

        keyCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_FILE;
        keyControlCodeMap[KEY_TAPE]  = controls.TAPE_EMPTY;
        keyAltCodeMap[KEY_TAPE]  = controls.TAPE_REMOVE;
        keyControlAltCodeMap[KEY_TAPE]  = controls.TAPE_SAVE_FILE;

        keyAltCodeMap[KEY_TAPE_REW]  = controls.TAPE_REWIND;
        keyAltCodeMap[KEY_TAPE_END]  = controls.TAPE_TO_END;
        keyAltCodeMap[KEY_TAPE_FWD]  = controls.TAPE_SEEK_FWD;
        keyAltCodeMap[KEY_TAPE_BCK]  = controls.TAPE_SEEK_BACK;

        keyAltCodeMap[KEY_KEYBOARD_TOGGLE_HOST]  = controls.KEYBOARD_TOGGLE_HOST_LAYOUT;
        keyAltCodeMap[KEY_JOYSTICKS_TOGGLE]      = controls.JOYSTICKS_TOGGLE_MODE;
        keyAltCodeMap[KEY_MOUSE_TOGGLE]          = controls.MOUSE_TOGGLE_MODE;
        keyAltCodeMap[KEY_TURBO_FIRE_TOGGLE]     = controls.TURBO_FIRE_TOGGLE;

        keyAltCodeMap[KEY_CRT_FILTER]   = controls.SCREEN_CRT_FILTER;
        keyAltCodeMap[KEY_CRT_MODE] 	= controls.SCREEN_CRT_MODE;
        keyAltCodeMap[KEY_FULLSCREEN]  	= controls.SCREEN_FULLSCREEN;

        keyControlAltCodeMap[KEY_UP]     = controls.SCREEN_SCALE_MINUS;
        keyControlAltCodeMap[KEY_DOWN]   = controls.SCREEN_SCALE_PLUS;

        keyControlAltCodeMap[KEY_LEFT]   = controls.SCREEN_ASPECT_MINUS;
        keyControlAltCodeMap[KEY_RIGHT]  = controls.SCREEN_ASPECT_PLUS;

        keyAltCodeMap[KEY_DEFAULTS]  = controls.SCREEN_DEFAULTS;

        keyAltCodeMap[KEY_PASTE]   = controls.PASTE_STRING;
        keyAltCodeMap[KEY_PASTE2]  = controls.PASTE_STRING;

        keyAltCodeMap[KEY_CAPTURE_SCREEN]   = controls.CAPTURE_SCREEN;
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

    var keyCodeMap = {};                // Shift is a different matter
    var keyAltCodeMap = {};
    var keyControlCodeMap = {};
    var keyControlAltCodeMap = {};

    var OPEN_TYPE = wmsx.FileLoader.OPEN_TYPE;

    var KEY_LEFT    = wmsx.DOMKeys.VK_LEFT.c;
    var KEY_UP      = wmsx.DOMKeys.VK_UP.c;
    var KEY_RIGHT   = wmsx.DOMKeys.VK_RIGHT.c;
    var KEY_DOWN    = wmsx.DOMKeys.VK_DOWN.c;

    var KEY_DEFAULTS  = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_PASTE   = wmsx.DOMKeys.VK_V.c;
    var KEY_PASTE2  = wmsx.DOMKeys.VK_INSERT.c;

    var KEY_CAPTURE_SCREEN  = wmsx.DOMKeys.VK_G.c;

    var KEY_DISK  = wmsx.DOMKeys.VK_F6.c;

    var KEY_CART  = wmsx.DOMKeys.VK_F7.c;

    var KEY_TAPE       = wmsx.DOMKeys.VK_F8.c;
    var KEY_TAPE_REW   = wmsx.DOMKeys.VK_HOME.c;
    var KEY_TAPE_END   = wmsx.DOMKeys.VK_END.c;
    var KEY_TAPE_BCK   = wmsx.DOMKeys.VK_PAGE_UP.c;
    var KEY_TAPE_FWD   = wmsx.DOMKeys.VK_PAGE_DOWN.c;

    var KEY_KEYBOARD_TOGGLE_HOST  = wmsx.DOMKeys.VK_K.c;
    var KEY_JOYSTICKS_TOGGLE      = wmsx.DOMKeys.VK_J.c;
    var KEY_MOUSE_TOGGLE          = wmsx.DOMKeys.VK_M.c;
    var KEY_TURBO_FIRE_TOGGLE     = wmsx.DOMKeys.VK_H.c;

    var KEY_CRT_FILTER  = wmsx.DOMKeys.VK_T.c;
    var KEY_CRT_MODE    = wmsx.DOMKeys.VK_R.c;
    var KEY_FULLSCREEN  = wmsx.DOMKeys.VK_ENTER.c;


    var SCREEN_FIXED_SIZE = WMSX.SCREEN_RESIZE_DISABLED;


    init();

};
