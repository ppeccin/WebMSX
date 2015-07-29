// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Monitor = function() {

    function init(self) {
        controls = new wmsx.DOMPeripheralControls(self);
    }

    this.connectDisplay = function(monitorDisplay) {
        display = monitorDisplay;
        setDisplayDefaultSize();
    };

    this.connectPeripherals = function(pROMLoader, pCassetteDeck) {
        romLoader = pROMLoader;
        cassetteDeck = pCassetteDeck;
    };

    this.connect = function(pVideoSignal, pCartridgeSocket) {
        cartridgeSocket = pCartridgeSocket;
        cartridgeSocket.addCartridgesStateListener(this);
        videoSignal = pVideoSignal;
        videoSignal.connectMonitor(this);
    };

    this.addControlInputElements = function(elements) {
        controls.addInputElements(elements);
    };

    this.newFrame = function(image, backdropColor) {
        display.refresh(image, frameOriginX, frameOriginY, backdropColor);
    };

    this.signalOff = function() {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap) {
        display.showOSD(message, overlap);
    };

    this.cartridgesStateUpdate = function(cartridge1, cartridge2) {
        // Only change mode if not forced
        if (CRT_MODE >= 0) return;
        if (crtMode === 0 || crtMode === 1) {
            var cart = cartridge1 || cartridge2;
            setCrtMode(!cart ? 0 : cart.rom.info.crt || 0);
        }
    };

    var setDisplayDefaultSize = function() {
        if (display != null) {
            var scX = display.displayDefaultOpeningScaleX(wmsx.Monitor.BASE_WIDTH, wmsx.Monitor.BASE_HEIGHT);
            setDisplayScale(scX, scX / DEFAULT_SCALE_ASPECT_X);
        } else
            setDisplayScale(wmsx.Monitor.DEFAULT_SCALE_X, wmsx.Monitor.DEFAULT_SCALE_Y);
        displayCenter();
    };

    var displayUpdateSize = function() {
        if (!display) return;
        display.displaySize((wmsx.Monitor.CONTENT_WIDTH * displayScaleX) | 0, (wmsx.Monitor.CONTENT_HEIGHT * displayScaleY) | 0);
        //display.displayMinimumSize((wmsx.Monitor.BASE_WIDTH * wmsx.Monitor.DEFAULT_SCALE_X / wmsx.Monitor.DEFAULT_SCALE_Y) | 0, wmsx.Monitor.BASE_HEIGHT);
    };

    var setDisplayScale = function(x, y) {
        displayScaleX = x;
        if (displayScaleX < 1) displayScaleX = 1;
        displayScaleY = y;
        if (displayScaleY < 1) displayScaleY = 1;
        displayUpdateSize();
    };

    var setDisplayScaleDefaultAspect = function(y) {
        var scaleY = y;
        if (scaleY < 1) scaleY = 1;
        setDisplayScale(scaleY * DEFAULT_SCALE_ASPECT_X, scaleY);
    };

    var displayCenter = function() {
        if (display) display.displayCenter();
    };

    var toggleFullscreen = function() {
        display.displayToggleFullscreen();
    };

    var crtModeToggle = function() {
        setCrtMode(crtMode + 1);
    };

    var setCrtMode = function(mode) {
        var newMode = mode > 4 || mode < 0 ? 0 : mode;
        if (crtMode === newMode) return;
        crtMode = newMode;
        display.showOSD("CRT mode: " + CRT_MODE_NAMES[crtMode], true);
    };

    var exit = function() {
        display.exit();
    };

    var cleanBackBuffer = function() {
        // Put a nice green for detection of undrawn lines, for debug purposes
        if (backBuffer) wmsx.Util.arrayFill(backBuffer, 0xff00ff00);
    };

    var cartridgeChangeDisabledWarning = function() {
        if (WMSX.CARTRIDGE_CHANGE_DISABLED) {
            display.showOSD("Cartridge change is disabled", true);
            return true;
        }
        return false;
    };


    // Controls Interface  -----------------------------------------

    var peripheralControls = wmsx.PeripheralControls;

    this.controlActivated = function(control) {
        // All controls are Press-only and repeatable
        switch(control) {
            case peripheralControls.CARTRIDGE1_LOAD_FILE:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(true, false);
                break;
            case peripheralControls.CARTRIDGE1_LOAD_URL:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(true, false);
                break;
            case peripheralControls.CARTRIDGE1_REMOVE:
                if (!cartridgeChangeDisabledWarning()) cartridgeSocket.insert(null, 1, true);
                break;
            case peripheralControls.CARTRIDGE2_LOAD_FILE:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(true, true);
                break;
            case peripheralControls.CARTRIDGE2_LOAD_URL:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(true, true);
                break;
            case peripheralControls.CARTRIDGE2_REMOVE:
                if (!cartridgeChangeDisabledWarning()) cartridgeSocket.insert(null, 2, true);
                break;
            case peripheralControls.TAPE_LOAD_FILE:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(true);
                break;
            case peripheralControls.TAPE_LOAD_URL:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(true);
                break;
            case peripheralControls.TAPE_LOAD_FILE_NO_AUTO_RUN:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(false);
                break;
            case peripheralControls.TAPE_LOAD_URL_NO_AUTO_RUN:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(false);
                break;
            case peripheralControls.TAPE_LOAD_EMPTY:
                if (!cartridgeChangeDisabledWarning()) cassetteDeck.loadEmpty();
                break;
            case peripheralControls.TAPE_SAVE_FILE:
                if (!cartridgeChangeDisabledWarning()) cassetteDeck.saveFile();
                break;
            case peripheralControls.TAPE_REWIND:
                if (!cartridgeChangeDisabledWarning()) cassetteDeck.rewind();
                break;
            case peripheralControls.TAPE_TO_END:
                if (!cartridgeChangeDisabledWarning()) cassetteDeck.seekToEnd();
                break;
            case peripheralControls.TAPE_SEEK_BACK:
                if (!cartridgeChangeDisabledWarning()) cassetteDeck.seekBackward();
                break;
            case peripheralControls.TAPE_SEEK_FWD:
                if (!cartridgeChangeDisabledWarning()) cassetteDeck.seekForward();
                break;
            case peripheralControls.TAPE_AUTO_RUN:
                cassetteDeck.typeCurrentAutoRunCommand();
                break;
            case peripheralControls.SCREEN_CRT_MODES:
                crtModeToggle(); break;
            case peripheralControls.SCREEN_CRT_FILTER:
                display.toggleCRTFilter(); break;
            case peripheralControls.SCREEN_STATS:
                showStats = !showStats; display.showOSD(null, true); break;
            case peripheralControls.SCREEN_DEBUG:
                debug++;
                if (debug > 4) debug = 0;
                break;
            case peripheralControls.SCREEN_SIZE_DEFAULT:
                setDisplayDefaultSize(); break;
            case peripheralControls.SCREEN_FULLSCREEN:
                toggleFullscreen(); break;
            case peripheralControls.EXIT:
                exit(); break;
        }
        if (fixedSizeMode) return;
        switch(control) {
            case peripheralControls.SCREEN_SCALE_X_MINUS:
                setDisplayScale(displayScaleX - 0.5, displayScaleY); break;
            case peripheralControls.SCREEN_SCALE_X_PLUS:
                setDisplayScale(displayScaleX + 0.5, displayScaleY); break;
            case peripheralControls.SCREEN_SCALE_Y_MINUS:
                setDisplayScale(displayScaleX, displayScaleY - 0.5); break;
            case peripheralControls.SCREEN_SCALE_Y_PLUS:
                setDisplayScale(displayScaleX, displayScaleY + 0.5); break;
            case peripheralControls.SCREEN_SIZE_MINUS:
                setDisplayScaleDefaultAspect(displayScaleY - 0.5); break;
            case peripheralControls.SCREEN_SIZE_PLUS:
                setDisplayScaleDefaultAspect(displayScaleY + 0.5); break;
        }
    };


    var display;
    var romLoader;
    var cassetteDeck;

    var videoSignal;
    var cartridgeSocket;
    var controls;

    var backBuffer;

    var displayScaleX;
    var displayScaleY;

    var debug = 0;
    var showStats = false;
    var fixedSizeMode = WMSX.SCREEN_RESIZE_DISABLED;

    var frameOriginX = wmsx.Monitor.BORDER_WIDTH;
    var frameOriginY = wmsx.Monitor.BORDER_HEIGHT;
    var DEFAULT_SCALE_ASPECT_X = 1;
    var CRT_MODE = WMSX.SCREEN_CRT_MODE;
    var CRT_MODE_NAMES = [ "OFF", "Phosphor", "Phosphor Scanlines", "RGB", "RGB Phosphor" ];

    var crtMode = CRT_MODE < 0 ? 0 : CRT_MODE;


    init(this);

};

wmsx.Monitor.BASE_WIDTH = 256;
wmsx.Monitor.BASE_HEIGHT = 192;
wmsx.Monitor.BORDER_WIDTH = 6;
wmsx.Monitor.BORDER_HEIGHT = 6;
wmsx.Monitor.CONTENT_WIDTH = wmsx.Monitor.BASE_WIDTH + wmsx.Monitor.BORDER_WIDTH * 2;
wmsx.Monitor.CONTENT_HEIGHT = wmsx.Monitor.BASE_HEIGHT + wmsx.Monitor.BORDER_HEIGHT * 2;
wmsx.Monitor.DEFAULT_SCALE_X = WMSX.SCREEN_OPENING_SIZE;
wmsx.Monitor.DEFAULT_SCALE_Y = WMSX.SCREEN_OPENING_SIZE;
