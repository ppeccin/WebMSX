// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMPeripheralControls = function() {
"use strict";

    var self = this;

    function init() {
        initKeys();
        initGroups();
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

    this.setGroupRestriction = function(pGroup) {
        groupRestriction = pGroup || null;
    };

    this.processKey = function(code, press) {
        if (!press) return false;
        var control = keyCodeMap[code & EXCLUDE_SHIFT_MASK];
        if (!control) return false;

        if (groupRestriction && !groups[groupRestriction].has(control)) return false;
        self.controlActivated(control, false, !!(code & INCLUDE_SHIFT_MASK));                     // Never altPower
        return true;
    };

    this.controlActivated = function(control, altPower, secPort) {
        // All controls are Press-only and repeatable
        switch(control) {
            case controls.MACHINE_SELECT:                                                         // Machine Controls called directly by Screen, no keys here
                if (!mediaChangeDisabledWarning()) screen.openMachineSelectDialog();
                break;
            case controls.MACHINE_POWER_TOGGLE:
                if (altPower) return this.controlActivated(controls.MACHINE_POWER_RESET);
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.POWER, true);
                break;
            case controls.MACHINE_POWER_RESET:
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.RESET, true);
                break;
            case controls.MACHINE_LOAD_STATE_FILE:                                                      // Only this Machine Control has a key here
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.STATE, false, false, false);
                break;
            case controls.MACHINE_SAVE_STATE_FILE:
                machineControlsSocket.controlStateChanged(wmsx.MachineControls.SAVE_STATE_FILE, true);
                break;
            case controls.DISK_LOAD_FILES:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.DISK, altPower, secPort, false);
                break;
            case controls.DISK_ADD_FILES:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.DISK, altPower, secPort, true);   // asExpansion
                break;
            case controls.DISK_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.DISK, altPower, secPort);
                break;
            case controls.DISK_LOAD_FILES_AS_DISK:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.FILES_AS_DISK, altPower, secPort, false);
                break;
            case controls.DISK_LOAD_ZIP_AS_DISK:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.ZIP_AS_DISK, altPower, secPort, false);
                break;
            case controls.DISK_REMOVE:
                if (!mediaChangeDisabledWarning()) diskDrive.removeStack(secPort ? 1 : 0);
                break;
            case controls.DISK_EMPTY:
                diskDrive.insertNewDisk(secPort ? 1 : 0, null);
                break;
            case controls.DISK_EMPTY_720:
                diskDrive.insertNewDisk(secPort ? 1 : 0, diskDrive.FORMAT_OPTIONS_MEDIA_TYPES[0]);
                break;
            case controls.DISK_EMPTY_360:
                diskDrive.insertNewDisk(secPort ? 1 : 0, diskDrive.FORMAT_OPTIONS_MEDIA_TYPES[1]);
                break;
            case controls.DISK_SAVE_FILE:
                diskDrive.saveDiskFile(secPort ? 1 : 0);
                break;
            case controls.DISK_SELECT:
                diskDrive.openDiskSelectDialog(secPort ? 1 : 0, 0, altPower);
                break;
            case controls.DISK_PREVIOUS:
                diskDrive.openDiskSelectDialog(secPort ? 1 : 0, -1, altPower);
                break;
            case controls.DISK_NEXT:
                diskDrive.openDiskSelectDialog(secPort ? 1 : 0, 1, altPower);
                break;
            case controls.CARTRIDGE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.ROM, altPower, secPort, false);
                break;
            case controls.CARTRIDGE_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.ROM, altPower, secPort);
                break;
            case controls.CARTRIDGE_REMOVE:
                if (!mediaChangeDisabledWarning()) cartridgeSocket.remove(secPort ? 1 : 0, altPower);
                break;
            case controls.CARTRIDGE_LOAD_DATA_FILE:
                if (cartridgeSocket.dataOperationNotSupportedMessage(secPort ? 1 : 0, false, false)) break;
                fileLoader.openFileChooserDialog(OPEN_TYPE.CART_DATA, altPower, secPort, false);
                break;
            case controls.CARTRIDGE_SAVE_DATA_FILE:
                cartridgeSocket.saveCartridgeDataFile(secPort ? 1 : 0);
                break;
            case controls.TAPE_LOAD_FILE:
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.TAPE, altPower, secPort, false);
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
                if (secPort) return this.controlActivated(controls.TAPE_AUTO_RUN, altPower, false);
                cassetteDeck.saveTapeFile();
                break;
            case controls.TAPE_REWIND:
                cassetteDeck.rewind();
                break;
            case controls.TAPE_TO_END:
                cassetteDeck.seekToEnd();
                break;
            case controls.TAPE_SEEK_BACK:
                cassetteDeck.seekBackward();
                break;
            case controls.TAPE_SEEK_FWD:
                cassetteDeck.seekForward();
                break;
            case controls.TAPE_AUTO_RUN:
                cassetteDeck.userTypeCurrentAutoRunCommand();
                break;
            case controls.AUTO_LOAD_FILE:
                if (secPort) return this.controlActivated(controls.AUTO_LOAD_URL, altPower, false);
                if (!mediaChangeDisabledWarning()) fileLoader.openFileChooserDialog(OPEN_TYPE.AUTO, altPower, secPort, false);
                break;
            case controls.AUTO_LOAD_URL:
                if (!mediaChangeDisabledWarning()) fileLoader.openURLChooserDialog(OPEN_TYPE.AUTO, altPower, secPort);
                break;
            case controls.SCREEN_CRT_MODE:
                monitor.crtModeToggle(); break;
            case controls.SCREEN_CRT_FILTER:
                monitor.crtFilterToggle(); break;
            case controls.SCREEN_FULLSCREEN:
                monitor.fullscreenToggle(); break;
            case controls.SCREEN_DEFAULTS:
                machineControlsSocket.setDefaults();
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
            case controls.JOYKEYS_TOGGLE_MODE:
                controllersHub.toggleJoykeysMode(); break;
            case controls.MOUSE_TOGGLE_MODE:
                controllersHub.toggleMouseMode(); break;
            case controls.TURBO_FIRE_TOGGLE:
                controllersHub.toggleTurboFireSpeed(); break;
            case controls.COPY_STRING:
                screen.executeTextCopy(); break;
            case controls.PASTE_STRING:
                screen.toggleTextPasteDialog(); break;
            case controls.CAPTURE_SCREEN:
                screen.saveScreenCapture(); break;
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
            monitor.showOSD("Media change is disabled!", true, true);
            return true;
        }
        return false;
    };

    var initKeys = function() {
        var k = wmsx.DOMKeys;

        keyCodeMap[KEY_AUTO | k.CONTROL] = controls.AUTO_LOAD_FILE;

        keyCodeMap[KEY_AUTO | k.CONTROL | k.ALT] = controls.MACHINE_SELECT;

        keyCodeMap[KEY_DISK] = controls.DISK_LOAD_FILES;
        keyCodeMap[KEY_DISK | k.CONTROL] = controls.DISK_EMPTY;
        keyCodeMap[KEY_DISK | k.ALT] = controls.DISK_REMOVE;
        keyCodeMap[KEY_DISK | k.CONTROL | k.ALT] = controls.DISK_SAVE_FILE;

        keyCodeMap[KEY_DISK_SELECT | k.ALT]  = controls.DISK_SELECT;
        keyCodeMap[KEY_DISK_SELECT2 | k.ALT] = controls.DISK_SELECT;
        keyCodeMap[KEY_DISK_PREV | k.ALT]    = controls.DISK_PREVIOUS;
        keyCodeMap[KEY_DISK_NEXT | k.ALT]    = controls.DISK_NEXT;

        keyCodeMap[KEY_CART] = controls.CARTRIDGE_LOAD_FILE;
        keyCodeMap[KEY_CART | k.ALT] = controls.CARTRIDGE_REMOVE;
        keyCodeMap[KEY_CART | k.CONTROL] = controls.CARTRIDGE_LOAD_DATA_FILE;
        keyCodeMap[KEY_CART | k.CONTROL | k.ALT] = controls.CARTRIDGE_SAVE_DATA_FILE;

        keyCodeMap[KEY_TAPE]  = controls.TAPE_LOAD_FILE;
        keyCodeMap[KEY_TAPE | k.CONTROL]  = controls.TAPE_EMPTY;
        keyCodeMap[KEY_TAPE | k.ALT]  = controls.TAPE_REMOVE;
        keyCodeMap[KEY_TAPE | k.CONTROL | k.ALT]  = controls.TAPE_SAVE_FILE;

        keyCodeMap[KEY_TAPE_REW | k.CONTROL | k.ALT]  = controls.TAPE_REWIND;
        keyCodeMap[KEY_TAPE_END | k.CONTROL | k.ALT]  = controls.TAPE_TO_END;
        keyCodeMap[KEY_TAPE_BCK | k.CONTROL | k.ALT]  = controls.TAPE_SEEK_BACK;
        keyCodeMap[KEY_TAPE_FWD | k.CONTROL | k.ALT]  = controls.TAPE_SEEK_FWD;

        keyCodeMap[KEY_KEYBOARD_TOGGLE | k.ALT]  = controls.KEYBOARD_TOGGLE_HOST_LAYOUT;
        keyCodeMap[KEY_JOYSTICKS_TOGGLE | k.ALT]      = controls.JOYSTICKS_TOGGLE_MODE;
        keyCodeMap[KEY_JOYKEYS_TOGGLE | k.ALT]        = controls.JOYKEYS_TOGGLE_MODE;
        keyCodeMap[KEY_MOUSE_TOGGLE | k.ALT]          = controls.MOUSE_TOGGLE_MODE;
        keyCodeMap[KEY_TURBO_FIRE_TOGGLE | k.ALT]     = controls.TURBO_FIRE_TOGGLE;

        keyCodeMap[KEY_CRT_FILTER | k.ALT]   = controls.SCREEN_CRT_FILTER;
        keyCodeMap[KEY_CRT_MODE | k.ALT] 	= controls.SCREEN_CRT_MODE;
        keyCodeMap[KEY_FULLSCREEN | k.ALT]  	= controls.SCREEN_FULLSCREEN;

        keyCodeMap[KEY_UP | k.CONTROL | k.ALT]     = controls.SCREEN_SCALE_MINUS;
        keyCodeMap[KEY_DOWN | k.CONTROL | k.ALT]   = controls.SCREEN_SCALE_PLUS;

        keyCodeMap[KEY_LEFT | k.CONTROL | k.ALT]   = controls.SCREEN_ASPECT_MINUS;
        keyCodeMap[KEY_RIGHT | k.CONTROL | k.ALT]  = controls.SCREEN_ASPECT_PLUS;

        keyCodeMap[KEY_DEFAULTS | k.ALT]  = controls.SCREEN_DEFAULTS;

        keyCodeMap[KEY_COPY | k.ALT]    = controls.COPY_STRING;
        keyCodeMap[KEY_PASTE | k.ALT]   = controls.PASTE_STRING;
        keyCodeMap[KEY_PASTE2 | k.ALT]  = controls.PASTE_STRING;
        keyCodeMap[KEY_CAPTURE_SCREEN | k.ALT]   = controls.CAPTURE_SCREEN;

        keyCodeMap[KEY_MACHINE_POWER | k.CONTROL] = controls.MACHINE_LOAD_STATE_FILE;
    };

    function initGroups() {
        groups.DISK = new Set([
            controls.DISK_LOAD_FILES, controls.DISK_LOAD_URL, controls.DISK_LOAD_FILES_AS_DISK, controls.DISK_LOAD_ZIP_AS_DISK,
            controls.DISK_ADD_FILES, controls.DISK_EMPTY, controls.DISK_EMPTY_360, controls.DISK_EMPTY_720,
            controls.DISK_SELECT, controls.DISK_PREVIOUS, controls.DISK_NEXT, controls.DISK,
            controls.DISK_SAVE_FILE, controls.DISK_REMOVE
        ]);
    }


    var controls = wmsx.PeripheralControls;

    var machineControlsSocket;
    var screen;
    var monitor;
    var controllersHub;
    var fileLoader;
    var cartridgeSocket;
    var cassetteDeck;
    var diskDrive;

    var keyCodeMap = {};                // SHIFT is considered differently

    var groups = {};
    var groupRestriction = null;

    var EXCLUDE_SHIFT_MASK = ~wmsx.DOMKeys.SHIFT;
    var INCLUDE_SHIFT_MASK = wmsx.DOMKeys.SHIFT;

    var OPEN_TYPE = wmsx.FileLoader.OPEN_TYPE;

    var KEY_LEFT    = wmsx.DOMKeys.VK_LEFT.c;
    var KEY_UP      = wmsx.DOMKeys.VK_UP.c;
    var KEY_RIGHT   = wmsx.DOMKeys.VK_RIGHT.c;
    var KEY_DOWN    = wmsx.DOMKeys.VK_DOWN.c;

    var KEY_DEFAULTS  = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_COPY   = wmsx.DOMKeys.VK_C.c;
    var KEY_PASTE   = wmsx.DOMKeys.VK_V.c;
    var KEY_PASTE2  = wmsx.DOMKeys.VK_INSERT.c;

    var KEY_CAPTURE_SCREEN  = wmsx.DOMKeys.VK_G.c;

    var KEY_DISK  = wmsx.DOMKeys.VK_F6.c;
    var KEY_CART  = wmsx.DOMKeys.VK_F7.c;
    var KEY_TAPE  = wmsx.DOMKeys.VK_F8.c;
    var KEY_AUTO  = wmsx.DOMKeys.VK_F12.c;

    var KEY_TAPE_REW   = wmsx.DOMKeys.VK_HOME.c;
    var KEY_TAPE_END   = wmsx.DOMKeys.VK_END.c;
    var KEY_TAPE_BCK   = wmsx.DOMKeys.VK_PAGE_UP.c;
    var KEY_TAPE_FWD   = wmsx.DOMKeys.VK_PAGE_DOWN.c;

    var KEY_DISK_SELECT  = wmsx.DOMKeys.VK_HOME.c;
    var KEY_DISK_SELECT2 = wmsx.DOMKeys.VK_END.c;
    var KEY_DISK_PREV    = wmsx.DOMKeys.VK_PAGE_UP.c;
    var KEY_DISK_NEXT    = wmsx.DOMKeys.VK_PAGE_DOWN.c;

    var KEY_KEYBOARD_TOGGLE       = wmsx.DOMKeys.VK_L.c;
    var KEY_JOYSTICKS_TOGGLE      = wmsx.DOMKeys.VK_J.c;
    var KEY_JOYKEYS_TOGGLE        = wmsx.DOMKeys.VK_K.c;
    var KEY_MOUSE_TOGGLE          = wmsx.DOMKeys.VK_M.c;
    var KEY_TURBO_FIRE_TOGGLE     = wmsx.DOMKeys.VK_H.c;

    var KEY_CRT_FILTER  = wmsx.DOMKeys.VK_T.c;
    var KEY_CRT_MODE    = wmsx.DOMKeys.VK_R.c;
    var KEY_FULLSCREEN  = wmsx.DOMKeys.VK_ENTER.c;

    var KEY_MACHINE_POWER  = wmsx.DOMKeys.VK_F11.c;

    var SCREEN_FIXED_SIZE = WMSX.SCREEN_RESIZE_DISABLED;


    init();

};
