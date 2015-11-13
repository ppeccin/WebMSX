// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Monitor = function() {

    var self = this;

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
            setDisplayScale(WMSX.SCREEN_OPENING_SIZE, WMSX.SCREEN_OPENING_SIZE);
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
        setDisplayScale(displayScaleX - 0.5, displayScaleY);
    };

    this.displayScaleXIncrease = function() {
        setDisplayScale(displayScaleX + 0.5, displayScaleY);
    };

    this.displayScaleYDecrease = function() {
        setDisplayScale(displayScaleX, displayScaleY - 0.5);
    };

    this.displayScaleYIncrease = function() {
        setDisplayScale(displayScaleX, displayScaleY + 0.5);
    };

    this.displaySizeDecrease = function() {
        setDisplayScaleDefaultAspect(displayScaleY - 0.5);
    };

    this.displaySizeIncrease = function() {
        setDisplayScaleDefaultAspect(displayScaleY + 0.5);
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

    var crtSetModeForCartridges = function(cartridge1, cartridge2) {
        // Only change mode if in Default is in AUTO (not forced)
        if (CRT_MODE === -1 && (crtMode === 0 || crtMode === 1)) {
            var cart = cartridge1 || cartridge2;
            setCrtMode(!cart ? 0 : cart.rom.info.crt || 0);
        }
    };

    var displayUpdateSize = function() {
        if (!display) return;
        display.displaySize((wmsx.Monitor.CONTENT_WIDTH * displayScaleX) | 0, (wmsx.Monitor.CONTENT_HEIGHT * displayScaleY) | 0);
        //display.displayMinimumSize((wmsx.Monitor.BASE_WIDTH * wmsx.Monitor.DEFAULT_SCALE_X / wmsx.Monitor.DEFAULT_SCALE_Y) | 0, wmsx.Monitor.BASE_HEIGHT);
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

    var cleanBackBuffer = function() {
        // Put a nice green for detection of undrawn lines, for debug purposes
        if (backBuffer) wmsx.Util.arrayFill(backBuffer, 0xff00ff00);
    };



    var display;

    var videoSignal;
    var cartridgeSocket;
    var controls;

    var backBuffer;

    var displayScaleX;
    var displayScaleY;

    var debug = 0;
    var fixedSizeMode = WMSX.SCREEN_RESIZE_DISABLED;

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
wmsx.Monitor.VISIBLE_BORDER_WIDTH =  6;
wmsx.Monitor.VISIBLE_BORDER_HEIGHT = 6;
wmsx.Monitor.CONTENT_WIDTH =  wmsx.Monitor.ACTIVE_WIDTH + wmsx.Monitor.VISIBLE_BORDER_WIDTH * 2;
wmsx.Monitor.CONTENT_HEIGHT = wmsx.Monitor.ACTIVE_HEIGHT + wmsx.Monitor.VISIBLE_BORDER_HEIGHT * 2;
