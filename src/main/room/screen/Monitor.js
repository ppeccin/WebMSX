// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Monitor = function() {

    this.connectDisplay = function(monitorDisplay) {
        display = monitorDisplay;
        this.setDefaults();
    };

    this.connect = function(pVideoSignal, pCartridgeSocket) {
        cartridgeSocket = pCartridgeSocket;
        cartridgeSocket.addCartridgesStateListener(this);
        videoSignal = pVideoSignal;
        videoSignal.connectMonitor(this);
    };

    this.newFrame = function(image) {
        display.refresh(image, sourceX, sourceY, sourceWidth, sourceHeight);
    };

    this.signalOff = function() {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap) {
        display.showOSD(message, overlap);
    };

    this.cartridgesStateUpdate = function(cartridge1, cartridge2) {
        crtSetModeForCartridges(cartridge1, cartridge2);
    };

    this.setDisplayDefaultSize = function() {
        if (display != null) {
            var scX = display.displayDefaultOpeningScaleX(wmsx.Monitor.CONTENT_WIDTH, wmsx.Monitor.CONTENT_HEIGHT);
            setDisplayScale(scX, scX / DEFAULT_SCALE_ASPECT_X);
        } else
            setDisplayScale(WMSX.SCREEN_DEFAULT_SCALE, WMSX.SCREEN_DEFAULT_SCALE);
        displayCenter();
    };

    this.setDefaults = function() {
        this.setDisplayDefaultSize();
        crtModeSetDefault();
        display.crtFilterSetDefault();
    };

    this.crtModeToggle = function() {
        display.showOSD("CRT modes not available yet!", true);
        //setCrtMode(crtMode + 1);
        //display.showOSD("CRT mode: " + CRT_MODE_NAMES[crtMode], true);
    };

    this.crtFilterToggle = function() {
        display.crtFilterToggle();
    };

    this.debugModesCycle = function() {
        debug++;
        if (debug > 4) debug = 0;
    };

    this.fullscreenToggle = function() {
        display.displayToggleFullscreen();
    };

    this.displayScaleXDecrease = function() {
        setDisplayScale(displayScaleX - 0.25, displayScaleY);
    };

    this.displayScaleXIncrease = function() {
        setDisplayScale(displayScaleX + 0.25, displayScaleY);
    };

    this.displayScaleYDecrease = function() {
        setDisplayScale(displayScaleX, displayScaleY - 0.25);
    };

    this.displayScaleYIncrease = function() {
        setDisplayScale(displayScaleX, displayScaleY + 0.25);
    };

    this.displaySizeDecrease = function() {
        setDisplayScaleDefaultAspect(displayScaleY - 0.25);
    };

    this.displaySizeIncrease = function() {
        setDisplayScaleDefaultAspect(displayScaleY + 0.25);
    };

    var setDisplayScale = function(x, y) {
        displayScaleX = x;
        if (displayScaleX < 0.5) displayScaleX = 0.5;
        displayScaleY = y;
        if (displayScaleY < 0.5) displayScaleY = 0.5;
        if (!display) return;
        display.displayScale(displayScaleX, displayScaleY);
        //display.displayMinimumSize((wmsx.Monitor.BASE_WIDTH * wmsx.Monitor.DEFAULT_SCALE_X / wmsx.Monitor.DEFAULT_SCALE_Y) | 0, wmsx.Monitor.BASE_HEIGHT);
    };

    var setDisplayScaleDefaultAspect = function(y) {
        var scaleY = y;
        if (scaleY < 0.5) scaleY = 0.5;
        setDisplayScale(scaleY * DEFAULT_SCALE_ASPECT_X, scaleY);
    };

    var crtSetModeForCartridges = function(cartridge1, cartridge2) {
        // Only change mode if in Default is in AUTO (not forced)
        if (CRT_MODE === -1 && (crtMode === 0 || crtMode === 1)) {
            var cart = cartridge1 || cartridge2;
            setCrtMode(!cart ? 0 : cart.rom.info.crt || 0);
        }
    };

    var displayCenter = function() {
        if (display) display.displayCenter();
    };

    var crtModeSetDefault = function() {
        setCrtMode(CRT_MODE < 0 ? 0 : CRT_MODE);
    };

    var setCrtMode = function(mode) {
        var newMode = mode > 4 || mode < 0 ? 0 : mode;
        if (crtMode === newMode) return;
        crtMode = newMode;
    };


    var display;

    var videoSignal;
    var cartridgeSocket;

    var displayScaleX;
    var displayScaleY;

    var debug = 0;

    var sourceX = wmsx.Monitor.RENDERED_BORDER_WIDTH - wmsx.Monitor.VISIBLE_BORDER_WIDTH;
    var sourceY = wmsx.Monitor.RENDERED_BORDER_HEIGHT - wmsx.Monitor.VISIBLE_BORDER_HEIGHT;
    var sourceWidth =  wmsx.Monitor.CONTENT_WIDTH;
    var sourceHeight = wmsx.Monitor.CONTENT_HEIGHT;

    var DEFAULT_SCALE_ASPECT_X = 1;
    var CRT_MODE = WMSX.SCREEN_CRT_MODE;
    var CRT_MODE_NAMES = [ "OFF", "Phosphor", "Phosphor Scanlines", "RGB", "RGB Phosphor" ];

    var crtMode = -1;


};

wmsx.Monitor.ACTIVE_WIDTH =  256;
wmsx.Monitor.ACTIVE_HEIGHT = 192;
wmsx.Monitor.RENDERED_BORDER_WIDTH =  8;
wmsx.Monitor.RENDERED_BORDER_HEIGHT = 8;
wmsx.Monitor.VISIBLE_BORDER_WIDTH =  8;
wmsx.Monitor.VISIBLE_BORDER_HEIGHT = 8;
wmsx.Monitor.CONTENT_WIDTH =  wmsx.Monitor.ACTIVE_WIDTH + wmsx.Monitor.VISIBLE_BORDER_WIDTH * 2;
wmsx.Monitor.CONTENT_HEIGHT = wmsx.Monitor.ACTIVE_HEIGHT + wmsx.Monitor.VISIBLE_BORDER_HEIGHT * 2;
