// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Monitor = function(display) {

    function init(self) {
        self.setDefaults();
    }

    this.connect = function(pVideoSignal, pCartridgeSocket) {
        cartridgeSocket = pCartridgeSocket;
        cartridgeSocket.addCartridgesStateListener(this);
        videoSignal = pVideoSignal;
        videoSignal.connectMonitor(this);
    };

    this.newFrame = function(image, sourceX, sourceY, sourceWidth, sourceHeight) {
        display.refresh(image, sourceX, sourceY, sourceWidth, sourceHeight);
    };

    this.signalOff = function() {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap) {
        display.showOSD(message, overlap);
    };

    this.setSignalHeight = function (height) {
        display.setSignalHeight(height);
    };

    this.cartridgesStateUpdate = function(cartridge1, cartridge2) {
        crtSetModeForCartridges(cartridge1, cartridge2);
    };

    this.setDisplayDefaultSize = function() {
        if (display != null) {
            var scX = display.displayDefaultOpeningScaleX();
            setDisplayScale(scX, scX / wmsx.Monitor.DEFAULT_SCALE_ASPECT_X);
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
        setDisplayScale(displayScaleX - wmsx.Monitor.SCALE_STEP, displayScaleY);
    };

    this.displayScaleXIncrease = function() {
        setDisplayScale(displayScaleX + wmsx.Monitor.SCALE_STEP, displayScaleY);
    };

    this.displayScaleYDecrease = function() {
        setDisplayScale(displayScaleX, displayScaleY - wmsx.Monitor.SCALE_STEP);
    };

    this.displayScaleYIncrease = function() {
        setDisplayScale(displayScaleX, displayScaleY + wmsx.Monitor.SCALE_STEP);
    };

    this.displaySizeDecrease = function() {
        setDisplayScaleDefaultAspect(displayScaleY - wmsx.Monitor.SCALE_STEP);
    };

    this.displaySizeIncrease = function() {
        setDisplayScaleDefaultAspect(displayScaleY + wmsx.Monitor.SCALE_STEP);
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
        setDisplayScale(scaleY * wmsx.Monitor.DEFAULT_SCALE_ASPECT_X, scaleY);
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


    var videoSignal;
    var cartridgeSocket;

    var displayScaleX;
    var displayScaleY;

    var debug = 0;

    var CRT_MODE = WMSX.SCREEN_CRT_MODE;
    var CRT_MODE_NAMES = [ "OFF", "Phosphor", "Phosphor Scanlines", "RGB", "RGB Phosphor" ];

    var crtMode = -1;


    init(this);

};

wmsx.Monitor.DEFAULT_SCALE_ASPECT_X = 1;
wmsx.Monitor.SCALE_STEP = 0.125;


