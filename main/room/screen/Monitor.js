// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Monitor = function() {

    function init(self) {
        controls = new wmsx.DOMMonitorControls(self);
    }

    this.connectDisplay = function(monitorDisplay) {
        display = monitorDisplay;
        setDisplayDefaultSize();
    };

    this.connectPeripherals = function(pROMLoader) {
        romLoader = pROMLoader;
    };

    this.connect = function(pVideoSignal, pCartridgeSocket) {
        pCartridgeSocket.addInsertionListener(this);
        videoSignal = pVideoSignal;
        videoSignal.connectMonitor(this);
    };

    this.addControlInputElements = function(elements) {
        controls.addInputElements(elements);
    };

    this.newFrame = function(image, backdropColor) {
        display.refresh(image, backdropColor);
    };

    this.signalOff = function() {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap) {
        display.showOSD(message, overlap);
    };

    this.cartridgeInserted = function(cartridge) {
        // Only change mode if not forced
        if (CRT_MODE >= 0) return;
        if (crtMode === 0 || crtMode === 1)
            setCrtMode(!cartridge ? 0 : cartridge.rom.info.c || 0);
    };

    var setDisplayDefaultSize = function() {
        if (display != null) {
            var scX = display.displayDefaultOpeningScaleX(DEFAULT_WIDTH, DEFAULT_HEIGHT);
            setDisplayScale(scX, scX / DEFAULT_SCALE_ASPECT_X);
        } else
            setDisplayScale(DEFAULT_SCALE_X, DEFAULT_SCALE_Y);
        displayCenter();
    };

    var displayUpdateSize = function() {
        if (!display) return;
        display.displaySize(
            (DEFAULT_WIDTH * displayScaleX) | 0, (DEFAULT_HEIGHT * displayScaleY) | 0,
            (BORDER_WIDTH * displayScaleX) | 0, (BORDER_HEIGHT * displayScaleY) | 0
        );
        display.displayMinimumSize((DEFAULT_WIDTH * DEFAULT_SCALE_X / DEFAULT_SCALE_Y) | 0, DEFAULT_HEIGHT);
    };

    var setDisplayScale = function(x, y) {
        displayScaleX = x;
        if (displayScaleX < 1) displayScaleX = 1;
        displayScaleY = y;
        if (displayScaleY < 1) displayScaleY = 1;
        displayUpdateSize();
    };

    var setDisplayScaleDefaultAspect = function(y) {
        var scaleY = y | 0;
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

    var monControls = wmsx.Monitor.Controls;

    this.controlActivated = function(control) {
        // All controls are Press-only and repeatable
        switch(control) {
            case monControls.LOAD_CARTRIDGE_FILE:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(true);
                break;
            case monControls.LOAD_CARTRIDGE_FILE_NO_AUTO_POWER:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(false);
                break;
            case monControls.LOAD_CARTRIDGE_URL:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(true);
                break;
            case monControls.LOAD_CARTRIDGE_URL_NO_AUTO_POWER:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(false);
                break;
            case monControls.CRT_MODES:
                crtModeToggle(); break;
            case monControls.CRT_FILTER:
                display.toggleCRTFilter(); break;
            case monControls.STATS:
                showStats = !showStats; display.showOSD(null, true); break;
            case monControls.DEBUG:
                debug++;
                if (debug > 4) debug = 0;
                break;
            case monControls.SIZE_DEFAULT:
                setDisplayDefaultSize(); break;
            case monControls.FULLSCREEN:
                toggleFullscreen(); break;
            case monControls.EXIT:
                exit(); break;
        }
        if (fixedSizeMode) return;
        switch(control) {
            case monControls.SCALE_X_MINUS:
                setDisplayScale(displayScaleX - 0.5, displayScaleY); break;
            case monControls.SCALE_X_PLUS:
                setDisplayScale(displayScaleX + 0.5, displayScaleY); break;
            case monControls.SCALE_Y_MINUS:
                setDisplayScale(displayScaleX, displayScaleY - 0.5); break;
            case monControls.SCALE_Y_PLUS:
                setDisplayScale(displayScaleX, displayScaleY + 0.5); break;
            case monControls.SIZE_MINUS:
                setDisplayScaleDefaultAspect(displayScaleY - 1); break;
            case monControls.SIZE_PLUS:
                setDisplayScaleDefaultAspect(displayScaleY + 1); break;
        }
    };


    var display;
    var romLoader;

    var videoSignal;
    var controls;

    var backBuffer;

    var displayScaleX;
    var displayScaleY;

    var debug = 0;
    var showStats = false;
    var fixedSizeMode = WMSX.SCREEN_RESIZE_DISABLED;

    var DEFAULT_WIDTH = 256;
    var DEFAULT_HEIGHT = 192;
    var DEFAULT_SCALE_X = 2;
    var DEFAULT_SCALE_Y = 2;
    var DEFAULT_SCALE_ASPECT_X = 1;
    var BORDER_WIDTH = 6;
    var BORDER_HEIGHT = 6;
    var CRT_MODE = WMSX.SCREEN_CRT_MODE;
    var CRT_MODE_NAMES = [ "OFF", "Phosphor", "Phosphor Scanlines", "RGB", "RGB Phosphor" ];

    var crtMode = CRT_MODE < 0 ? 0 : CRT_MODE;


    init(this);

};

wmsx.Monitor.Controls = {
    WIDTH_PLUS: 1, HEIGHT_PLUS: 2,
    WIDTH_MINUS: 3, HEIGHT_MINUS: 4,
    SCALE_X_PLUS: 9, SCALE_Y_PLUS: 10,
    SCALE_X_MINUS: 11, SCALE_Y_MINUS: 12,
    SIZE_PLUS: 13, SIZE_MINUS: 14,
    SIZE_DEFAULT: 15,
    FULLSCREEN: 16,
    LOAD_CARTRIDGE_FILE: 21, LOAD_CARTRIDGE_FILE_NO_AUTO_POWER: 22,
    LOAD_CARTRIDGE_URL: 23, LOAD_CARTRIDGE_URL_NO_AUTO_POWER: 24,
    LOAD_CARTRIDGE_PASTE: 25,
    CRT_FILTER: 31, CRT_MODES: 32,
    DEBUG: 41, STATS: 42,
    EXIT: 51
};