// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMPeripheralControls = function(room) {
"use strict";

    var self = this;

    function init() {
        initKeys();
    }

    this.connect = function(pMachineTypeSocket, pExtensionsSocket, pCartridgeSocket) {
        machineTypeSocket = pMachineTypeSocket;
        extensionsSocket = pExtensionsSocket;
        cartridgeSocket = pCartridgeSocket;
    };

    this.connectPeripherals = function(pCartridgeSlot, pMachineControls, pScreen, pSpeaker, pControllersHub, pFileLoader, pCassetteDeck, pDiskDrive) {
        cartridgeSlot = pCartridgeSlot;
        machineControls = pMachineControls;
        screen = pScreen;
        speaker = pSpeaker;
        monitor = pScreen.getMonitor();
        controllersHub = pControllersHub;
        fileLoader = pFileLoader;
        cassetteDeck = pCassetteDeck;
        diskDrive = pDiskDrive;
    };

    this.getControlReport = function(control) {
        switch (control) {
            case pc.TOUCH_TOGGLE_DIR_BIG:
            case pc.TURBO_FIRE_TOGGLE:
            case pc.HAPTIC_FEEDBACK_TOGGLE_MODE:
                return controllersHub.getControlReport(control);
            case pc.SCREEN_CRT_FILTER:
                return screen.getControlReport(control);
            case pc.SPEAKER_BUFFER_TOGGLE:
                return speaker.getControlReport(control);
        }
        return { label: "Unknown", active: false };
    };

    this.processKey = function(code, press) {
        if (!press) return false;
        var control = keyCodeMap[code & EXCLUDE_SHIFT_MASK];
        if (!control) return false;

        //if (groupRestriction && !groups[groupRestriction].has(control)) return false;
        self.processControlActivated(control, false, !!(code & INCLUDE_SHIFT_MASK));               // Never altPower
        return true;
    };

    this.processControlActivated = function(control, altPower, secPort, data) {
        // If a Net-dependent Control
        if (!netLocalImmediateControls.has(control)) {
            // Check for NetPlay blocked controls
            if (room.netPlayMode === 2 && netServerOnlyControls.has(control) && !netClientSendToServerControls.has(control))
                return room.showOSD("Function not available in NetPlay Client mode", true, true);

            // Store changes to be sent to peers
            if (!(room.netPlayMode === 1 && netServerOnlyControls.has(control)))
                netControlsToSend.push({ c: (control << 4) | (altPower << 1) | secPort, d: data });      // binary encoded with data

            // Do not apply control now if Client
            if (room.netPlayMode === 2) return;
        }

        applyControlActivated (control, altPower, secPort, data, true);     // user-initiated
    };

    function applyControlActivated (control, altPower, secPort, data, user) {
        // All controls are Press-only and repeatable
        var port = secPort ? 1 : 0;
        switch(control) {
            case pc.MACHINE_POWER_TOGGLE:           // MACHINE_ Controls called directly by Screen, no keys here
                if (altPower) return machineControls.processControlState(wmsx.MachineControls.RESET, true);
                machineControls.processControlState(wmsx.MachineControls.POWER, true);
                break;
            case pc.MACHINE_POWER_RESET:
                machineControls.processControlState(wmsx.MachineControls.RESET, true);
                break;
            case pc.MACHINE_LOAD_STATE_FILE:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.STATE, false, 0, false);
                break;
            case pc.MACHINE_SAVE_STATE_FILE:
                machineControls.processControlState(wmsx.MachineControls.SAVE_STATE_FILE, true);
                break;
            case pc.MACHINE_LOAD_STATE_MENU:
                screen.openSaveStateDialog(false);
                break;
            case pc.MACHINE_SAVE_STATE_MENU:
                screen.openSaveStateDialog(true);
                break;
            case pc.MACHINE_SELECT:
                machineTypeSocket.changeMachine(data);
                break;
            case pc.EXTENSION_TOGGLE:
                extensionsSocket.toggleExtension(data, altPower, secPort);
                break;
            case pc.DISK_LOAD_FILES:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.DISK, altPower, port, false);
                break;
            case pc.DISK_ADD_FILES:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.DISK, altPower, port, true);   // asExpansion
                break;
            case pc.DISK_LOAD_URL:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openURLChooserDialog(OPEN_TYPE.DISK, altPower, port);
                break;
            case pc.DISK_LOAD_FILES_AS_DISK:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.FILES_AS_DISK, altPower, port, false);
                break;
            case pc.DISK_LOAD_ZIP_AS_DISK:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.ZIP_AS_DISK, altPower, port, false);
                break;
            case pc.DISK_REMOVE:
                if (!user || !mediaChangeDisabledWarning(control)) diskDrive.removeStack(port);
                break;
            case pc.DISK_EMPTY:
                diskDrive.insertNewDisk(port, null);
                break;
            case pc.DISK_EMPTY_720:
                diskDrive.insertNewDisk(port, diskDrive.FORMAT_OPTIONS_MEDIA_TYPES[0]);
                break;
            case pc.DISK_EMPTY_360:
                diskDrive.insertNewDisk(port, diskDrive.FORMAT_OPTIONS_MEDIA_TYPES[1]);
                break;
            case pc.DISK_SAVE_FILE:
                diskDrive.saveDiskFile(port);
                break;
            case pc.DISK_SELECT:
                diskDrive.openDiskSelectDialog(port, 0, altPower);
                break;
            case pc.DISK_PREVIOUS:
                diskDrive.openDiskSelectDialog(port, -1, altPower);
                break;
            case pc.DISK_NEXT:
                diskDrive.openDiskSelectDialog(port, 1, altPower);
                break;
            case pc.DISK_INSERT:
                diskDrive.insertDiskFromStack(data.d, data.n, data.a);
                break;
            case pc.DISK_MOVE:
                diskDrive.moveDiskInStack(data.d, data.f, data.t);
                break;
            case pc.NEXTOR_LOAD_FILE:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.DISK, altPower, 2, false);
                break;
            case pc.NEXTOR_LOAD_URL:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openURLChooserDialog(OPEN_TYPE.DISK, altPower, 2);
                break;
            case pc.NEXTOR_LOAD_FILES_AS_DISK:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.FILES_AS_DISK, altPower, 2, false);
                break;
            case pc.NEXTOR_LOAD_ZIP_AS_DISK:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.ZIP_AS_DISK, altPower, 2, false);
                break;
            case pc.NEXTOR_REMOVE:
                if (!user || !mediaChangeDisabledWarning(control)) diskDrive.removeStack(2);
                break;
            case pc.NEXTOR_EMPTY:
                diskDrive.insertNewDisk(2);
                break;
            case pc.NEXTOR_SAVE_FILE:
                diskDrive.saveDiskFile(2);
                break;
            case pc.CARTRIDGE_LOAD_FILE:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.ROM, altPower, port, false);
                break;
            case pc.CARTRIDGE_LOAD_URL:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openURLChooserDialog(OPEN_TYPE.ROM, altPower, port);
                break;
            case pc.CARTRIDGE_REMOVE:
                if (!user || !mediaChangeDisabledWarning(control)) cartridgeSlot.removeCartridge(port, altPower);
                break;
            case pc.CARTRIDGE_LOAD_DATA_FILE:
                if (cartridgeSocket.dataOperationNotSupportedMessage(port, false, false)) break;
                fileLoader.openFileChooserDialog(OPEN_TYPE.CART_DATA, altPower, port, false);
                break;
            case pc.CARTRIDGE_SAVE_DATA_FILE:
                cartridgeSlot.saveCartridgeDataFile(port);
                break;
            case pc.TAPE_LOAD_FILE:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.TAPE, altPower, 0, false);
                break;
            case pc.TAPE_LOAD_URL:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openURLChooserDialog(OPEN_TYPE.TAPE, altPower, 0);
                break;
            case pc.TAPE_REMOVE:
                if (!user || !mediaChangeDisabledWarning(control)) cassetteDeck.userRemoveTape();
                break;
            case pc.TAPE_EMPTY:
                if (!user || !mediaChangeDisabledWarning(control)) cassetteDeck.userLoadEmptyTape();
                break;
            case pc.TAPE_SAVE_FILE:
                if (secPort) return cassetteDeck.userTypeCurrentAutoRunCommand();
                cassetteDeck.saveTapeFile();
                break;
            case pc.TAPE_REWIND:
                cassetteDeck.userRewind();
                break;
            case pc.TAPE_TO_END:
                cassetteDeck.userSeekToEnd();
                break;
            case pc.TAPE_SEEK_BACK:
                cassetteDeck.userSeekBackward();
                break;
            case pc.TAPE_SEEK_FWD:
                cassetteDeck.userSeekForward();
                break;
            case pc.TAPE_AUTO_RUN:
                cassetteDeck.userTypeCurrentAutoRunCommand();
                break;
            case pc.AUTO_LOAD_FILE:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openFileChooserDialog(OPEN_TYPE.AUTO, altPower, port, false);
                break;
            case pc.AUTO_LOAD_URL:
                if (!user || !mediaChangeDisabledWarning(control)) fileLoader.openURLChooserDialog(OPEN_TYPE.AUTO, altPower, port, false);
                break;
            case pc.SCREEN_CRT_MODE:
                monitor.crtModeToggle(); break;
            case pc.SCREEN_CRT_FILTER:
                monitor.crtFilterToggle(); break;
            case pc.SCREEN_FULLSCREEN:
                monitor.fullscreenToggle(); break;
            case pc.SCREEN_DEFAULTS:
                machineControls.processControlState(wmsx.MachineControls.DEFAULTS, true);
                monitor.setDefaults();
                break;
            case pc.SCREEN_TOGGLE_MENU:
                screen.toggleMenuByKey();
                break;
            case pc.SCREEN_OPEN_HELP:
                screen.openHelp();
                break;
            case pc.SCREEN_OPEN_ABOUT:
                screen.openAbout();
                break;
            case pc.SCREEN_OPEN_SETTINGS:
                if (altPower) return applyControlActivated(pc.SCREEN_DEFAULTS, false, false, null, user);
                screen.openSettings();
                break;
            case pc.SCREEN_OPEN_QUICK_OPTIONS:
                screen.openQuickOptionsDialog();
                break;
            case pc.SCREEN_OPEN_TOUCH_CONFIG:
                screen.openTouchConfigDialog();
                break;
            case pc.SCREEN_OPEN_MACHINE_SELECT:
                if (!user || !mediaChangeDisabledWarning(control)) screen.openMachineSelectDialog();
                break;
            case pc.SCREEN_TOGGLE_VIRTUAL_KEYBOARD:
                screen.toggleVirtualKeyboard();
                break;
            case pc.SCREEN_OPEN_NETPLAY:
                screen.openNetPlayDialog();
                break;
            case pc.KEYBOARD_TOGGLE_HOST_LAYOUT:
                controllersHub.toggleKeyboardLayout(); break;
            case pc.JOYSTICKS_TOGGLE_MODE:
                controllersHub.toggleJoystickMode(); break;
            case pc.JOYKEYS_TOGGLE_MODE:
                controllersHub.toggleJoykeysMode(); break;
            case pc.MOUSE_TOGGLE_MODE:
                controllersHub.toggleMouseMode(); break;
            case pc.TOUCH_TOGGLE_MODE:
                controllersHub.toggleTouchControlsMode(altPower); break;       // altPower for skip auto option
            case pc.TOUCH_TOGGLE_DIR_BIG:
                controllersHub.getTouchControls().toggleDirBig(); break;
            case pc.TURBO_FIRE_TOGGLE:
                controllersHub.toggleTurboFireSpeed(); break;
            case pc.HAPTIC_FEEDBACK_TOGGLE_MODE:
                controllersHub.toggleHapticFeedback(); break;
            case pc.COPY_STRING:
                screen.executeTextCopy(); break;
            case pc.OPEN_PASTE_STRING:
                screen.toggleTextPasteDialog(); break;
            case pc.OPEN_ENTER_STRING:
                screen.toggleTextEntryDialog(); break;
            case pc.CAPTURE_SCREEN:
                screen.saveScreenCapture(); break;
            case pc.SPEAKER_BUFFER_TOGGLE:
                speaker.toggleBufferBaseSize(); break;
        }
        if (SCREEN_FIXED_SIZE) return;
        switch(control) {
            case pc.SCREEN_ASPECT_MINUS:
                monitor.displayAspectDecrease(); break;
            case pc.SCREEN_ASPECT_PLUS:
                monitor.displayAspectIncrease(); break;
            case pc.SCREEN_SCALE_MINUS:
                monitor.displayScaleDecrease(); break;
            case pc.SCREEN_SCALE_PLUS:
                monitor.displayScaleIncrease(); break;
        }
    }

    var mediaChangeDisabledWarning = function(control) {
        if (WMSX.MEDIA_CHANGE_DISABLED) {
            monitor.showOSD("Media change is disabled!", true, true);
            return true;
        }
        if (room.netPlayMode === 2 && netServerOnlyControls.has(control)) {
            monitor.showOSD("Media loading is disabled in NetPlay Client mode!", true, true);
            return true;
        }
        return false;
    };
    this.mediaChangeDisabledWarning = mediaChangeDisabledWarning;

    var initKeys = function() {
        var k = wmsx.DOMKeys;

        keyCodeMap[KEY_MACHINE_POWER | k.CONTROL] = pc.AUTO_LOAD_FILE;
        keyCodeMap[KEY_MACHINE_POWER | k.CONTROL | k.ALT] = pc.AUTO_LOAD_URL;

        keyCodeMap[KEY_STATE_FILE | k.CONTROL | k.ALT] = pc.MACHINE_SAVE_STATE_FILE;

        keyCodeMap[KEY_DISK] = pc.DISK_LOAD_FILES;
        keyCodeMap[KEY_DISK | k.CONTROL] = pc.DISK_EMPTY;
        keyCodeMap[KEY_DISK | k.ALT] = pc.DISK_REMOVE;
        keyCodeMap[KEY_DISK | k.CONTROL | k.ALT] = pc.DISK_SAVE_FILE;

        keyCodeMap[KEY_DISK_SELECT | k.ALT]  = pc.DISK_SELECT;
        keyCodeMap[KEY_DISK_SELECT2 | k.ALT] = pc.DISK_SELECT;
        keyCodeMap[KEY_DISK_PREV | k.ALT]    = pc.DISK_PREVIOUS;
        keyCodeMap[KEY_DISK_NEXT | k.ALT]    = pc.DISK_NEXT;

        keyCodeMap[KEY_CART] = pc.CARTRIDGE_LOAD_FILE;
        keyCodeMap[KEY_CART | k.ALT] = pc.CARTRIDGE_REMOVE;
        keyCodeMap[KEY_CART | k.CONTROL] = pc.CARTRIDGE_LOAD_DATA_FILE;
        keyCodeMap[KEY_CART | k.CONTROL | k.ALT] = pc.CARTRIDGE_SAVE_DATA_FILE;

        keyCodeMap[KEY_TAPE]  = pc.TAPE_LOAD_FILE;
        keyCodeMap[KEY_TAPE | k.CONTROL]  = pc.TAPE_EMPTY;
        keyCodeMap[KEY_TAPE | k.ALT]  = pc.TAPE_REMOVE;
        keyCodeMap[KEY_TAPE | k.CONTROL | k.ALT]  = pc.TAPE_SAVE_FILE;

        keyCodeMap[KEY_TAPE_REW | k.CONTROL | k.ALT]  = pc.TAPE_REWIND;
        keyCodeMap[KEY_TAPE_END | k.CONTROL | k.ALT]  = pc.TAPE_TO_END;
        keyCodeMap[KEY_TAPE_BCK | k.CONTROL | k.ALT]  = pc.TAPE_SEEK_BACK;
        keyCodeMap[KEY_TAPE_FWD | k.CONTROL | k.ALT]  = pc.TAPE_SEEK_FWD;

        keyCodeMap[KEY_KEYBOARD_TOGGLE | k.ALT]       = pc.KEYBOARD_TOGGLE_HOST_LAYOUT;
        keyCodeMap[KEY_JOYSTICKS_TOGGLE | k.ALT]      = pc.JOYSTICKS_TOGGLE_MODE;
        keyCodeMap[KEY_JOYKEYS_TOGGLE | k.ALT]        = pc.JOYKEYS_TOGGLE_MODE;
        keyCodeMap[KEY_MOUSE_TOGGLE | k.ALT]          = pc.MOUSE_TOGGLE_MODE;
        keyCodeMap[KEY_TOUCH_TOGGLE | k.ALT]          = pc.TOUCH_TOGGLE_MODE;
        keyCodeMap[KEY_TURBO_FIRE_TOGGLE | k.ALT]     = pc.TURBO_FIRE_TOGGLE;

        keyCodeMap[KEY_CRT_FILTER | k.ALT]      = pc.SCREEN_CRT_FILTER;
        keyCodeMap[KEY_CRT_MODE | k.ALT] 	    = pc.SCREEN_CRT_MODE;
        //keyCodeMap[KEY_SETTINGS | k.ALT]    	= controls.SCREEN_OPEN_SETTINGS;
        keyCodeMap[KEY_QUICK_OPTIONS | k.ALT] 	= pc.SCREEN_OPEN_QUICK_OPTIONS;
        keyCodeMap[KEY_TOUCH_CONFIG | k.ALT] 	= pc.SCREEN_OPEN_TOUCH_CONFIG;

        keyCodeMap[KEY_FULLSCREEN | k.ALT]  = pc.SCREEN_FULLSCREEN;

        keyCodeMap[KEY_UP | k.CONTROL | k.ALT]     = pc.SCREEN_SCALE_MINUS;
        keyCodeMap[KEY_DOWN | k.CONTROL | k.ALT]   = pc.SCREEN_SCALE_PLUS;

        keyCodeMap[KEY_LEFT | k.CONTROL | k.ALT]   = pc.SCREEN_ASPECT_MINUS;
        keyCodeMap[KEY_RIGHT | k.CONTROL | k.ALT]  = pc.SCREEN_ASPECT_PLUS;

        keyCodeMap[KEY_MENU]         	  = pc.SCREEN_TOGGLE_MENU;
        keyCodeMap[KEY_DEFAULTS | k.ALT]  = pc.SCREEN_DEFAULTS;

        keyCodeMap[KEY_COPY | k.ALT]    = pc.COPY_STRING;
        keyCodeMap[KEY_PASTE | k.ALT]   = pc.OPEN_PASTE_STRING;
        keyCodeMap[KEY_PASTE2 | k.ALT]  = pc.OPEN_PASTE_STRING;
        keyCodeMap[KEY_ENTER_STRING | k.ALT]   = pc.OPEN_ENTER_STRING;
        keyCodeMap[KEY_CAPTURE_SCREEN | k.ALT] = pc.CAPTURE_SCREEN;

        keyCodeMap[KEY_SPEAKER_BUFFER | k.ALT] = pc.SPEAKER_BUFFER_TOGGLE;
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
            applyControlActivated(change.c >> 4, (change.c >> 1) & 0x01, change.c & 0x01, change.d);     // binary encoded with data
        }
    };

    this.netClientApplyControlsChanges = function(changes) {
        for (var i = 0, len = changes.length; i < len; ++i) {
            var change = changes[i];
            applyControlActivated(change.c >> 4, (change.c >> 1) & 0x01, change.c & 0x01, change.d);     // binary encoded with data
        }
    };


    var pc = wmsx.PeripheralControls;

    var machineControls;
    var screen;
    var monitor;
    var speaker;
    var cartridgeSocket;
    var machineTypeSocket;
    var extensionsSocket;
    var cartridgeSlot;
    var controllersHub;
    var fileLoader;
    var cassetteDeck;
    var diskDrive;

    var keyCodeMap = {};                // SHIFT is considered differently

    var netControlsToSend = new Array(100); netControlsToSend.length = 0;     // pre allocate empty Array

    var EXCLUDE_SHIFT_MASK = ~wmsx.DOMKeys.SHIFT;
    var INCLUDE_SHIFT_MASK = wmsx.DOMKeys.SHIFT;

    var OPEN_TYPE = wmsx.FileLoader.OPEN_TYPE;

    var KEY_LEFT    = wmsx.DOMKeys.VK_LEFT.c;
    var KEY_UP      = wmsx.DOMKeys.VK_UP.c;
    var KEY_RIGHT   = wmsx.DOMKeys.VK_RIGHT.c;
    var KEY_DOWN    = wmsx.DOMKeys.VK_DOWN.c;

    var KEY_MENU      = wmsx.DOMKeys.VK_CONTEXT.c;
    var KEY_DEFAULTS  = wmsx.DOMKeys.VK_BACKSPACE.c;

    var KEY_COPY   = wmsx.DOMKeys.VK_C.c;
    var KEY_PASTE   = wmsx.DOMKeys.VK_V.c;
    var KEY_PASTE2  = wmsx.DOMKeys.VK_INSERT.c;
    var KEY_ENTER_STRING = wmsx.DOMKeys.VK_B.c;

    var KEY_CAPTURE_SCREEN  = wmsx.DOMKeys.VK_G.c;

    var KEY_SPEAKER_BUFFER  = wmsx.DOMKeys.VK_A.c;

    var KEY_DISK  = wmsx.DOMKeys.VK_F6.c;
    var KEY_CART  = wmsx.DOMKeys.VK_F7.c;
    var KEY_TAPE  = wmsx.DOMKeys.VK_F8.c;

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
    var KEY_TOUCH_TOGGLE          = wmsx.DOMKeys.VK_N.c;
    var KEY_TURBO_FIRE_TOGGLE     = wmsx.DOMKeys.VK_H.c;

    var KEY_CRT_FILTER    = wmsx.DOMKeys.VK_E.c;
    var KEY_CRT_MODE      = wmsx.DOMKeys.VK_R.c;
    //var KEY_SETTINGS      = wmsx.DOMKeys.VK_Y.c;
    var KEY_QUICK_OPTIONS = wmsx.DOMKeys.VK_U.c;
    var KEY_TOUCH_CONFIG  = wmsx.DOMKeys.VK_I.c;

    var KEY_FULLSCREEN  = wmsx.DOMKeys.VK_ENTER.c;

    var KEY_MACHINE_POWER  = wmsx.DOMKeys.VK_F11.c;
    var KEY_STATE_FILE     = wmsx.DOMKeys.VK_F12.c;

    var SCREEN_FIXED_SIZE = WMSX.SCREEN_RESIZE_DISABLED;

    var netServerOnlyControls = new Set([
        pc.MACHINE_LOAD_STATE_FILE, pc.MACHINE_SAVE_STATE_FILE, pc.MACHINE_LOAD_STATE_MENU, pc.MACHINE_SAVE_STATE_MENU,

        pc.DISK_LOAD_FILES, pc.DISK_ADD_FILES, pc.DISK_LOAD_URL, pc.DISK_LOAD_FILES_AS_DISK, pc.DISK_LOAD_ZIP_AS_DISK, pc.DISK_SAVE_FILE,
        pc.DISK_EMPTY, pc.DISK_EMPTY_720, pc.DISK_EMPTY_360,
        pc.NEXTOR_LOAD_FILE, pc.NEXTOR_LOAD_URL, pc.NEXTOR_EMPTY, pc.NEXTOR_SAVE_FILE, pc.NEXTOR_REMOVE,
        pc.CARTRIDGE_LOAD_FILE, pc.CARTRIDGE_LOAD_URL, pc.CARTRIDGE_LOAD_DATA_FILE, pc.CARTRIDGE_SAVE_DATA_FILE,
        pc.TAPE_LOAD_FILE, pc.TAPE_LOAD_URL, pc.TAPE_SAVE_FILE,
        pc.AUTO_LOAD_FILE, pc.AUTO_LOAD_URL
    ]);

    var netClientSendToServerControls = new Set([
        pc.DISK_EMPTY, pc.DISK_EMPTY_720, pc.DISK_EMPTY_360
    ]);

    var netLocalImmediateControls = new Set([
        pc.SCREEN_ASPECT_PLUS, pc.SCREEN_ASPECT_MINUS,
        pc.SCREEN_SCALE_PLUS, pc.SCREEN_SCALE_MINUS,
        pc.SCREEN_FULLSCREEN,
        pc.SCREEN_CRT_FILTER, pc.SCREEN_CRT_MODE,
        pc.SCREEN_TOGGLE_MENU,
        pc.SCREEN_OPEN_HELP,
        pc.SCREEN_OPEN_ABOUT,
        pc.SCREEN_OPEN_SETTINGS,
        pc.SCREEN_OPEN_QUICK_OPTIONS,
        pc.SCREEN_OPEN_TOUCH_CONFIG,
        pc.SCREEN_OPEN_MACHINE_SELECT,
        pc.SCREEN_TOGGLE_VIRTUAL_KEYBOARD,
        pc.SCREEN_DEFAULTS,

        pc.SPEAKER_BUFFER_TOGGLE,

        pc.MACHINE_POWER_TOGGLE, pc.MACHINE_POWER_RESET,

        pc.KEYBOARD_TOGGLE_HOST_LAYOUT, pc.JOYSTICKS_TOGGLE_MODE, pc.JOYKEYS_TOGGLE_MODE, pc.TOUCH_TOGGLE_MODE, pc.TOUCH_TOGGLE_DIR_BIG, pc.TURBO_FIRE_TOGGLE,
        pc.HAPTIC_FEEDBACK_TOGGLE_MODE,

        pc.COPY_STRING, pc.OPEN_PASTE_STRING, pc.OPEN_ENTER_STRING, pc.CAPTURE_SCREEN,

        pc.DISK_SELECT, pc.DISK_PREVIOUS, pc.DISK_NEXT,     // just operates the DiskSelectDialog

        pc.SCREEN_OPEN_NETPLAY
    ]);


    init();

};
