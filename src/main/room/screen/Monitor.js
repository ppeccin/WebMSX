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

    this.setDisplayOptimalScale = function() {
        if (display != null) {
            var scY = display.displayOptimalScaleY(displayAspectX);
            setDisplayScale(displayAspectX, scY);
        } else {
            // Default window size
            setDisplayScale(WMSX.SCREEN_DEFAULT_ASPECT, WMSX.SCREEN_DEFAULT_SCALE);
        }
        displayCenter();
    };

    this.setDefaults = function() {
        displayAspectX = WMSX.SCREEN_DEFAULT_ASPECT;
        this.setDisplayOptimalScale();
        display.crtModeSetDefault();
        display.crtFilterSetDefault();
    };

    this.setDebugMode = function(boo) {
        display.setDebugMode(boo);
    };

    this.crtModeToggle = function() {
        display.crtModeToggle();
    };

    this.crtFilterToggle = function() {
        display.crtFilterToggle();
    };

    this.fullscreenToggle = function() {
        display.displayToggleFullscreen();
    };

    this.displayAspectDecrease = function() {
        setDisplayScale(displayAspectX - wmsx.Monitor.SCALE_STEP, displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(1) + "x", true);
    };

    this.displayAspectIncrease = function() {
        setDisplayScale(displayAspectX + wmsx.Monitor.SCALE_STEP, displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(1) + "x", true);
    };

    this.displayScaleDecrease = function() {
        setDisplayScale(displayAspectX, displayScaleY - wmsx.Monitor.SCALE_STEP);
        this.showOSD("Display Size: " + displayScaleY.toFixed(1) + "x", true);
    };

    this.displayScaleIncrease = function() {
        setDisplayScale(displayAspectX, displayScaleY + wmsx.Monitor.SCALE_STEP);
        this.showOSD("Display Size: " + displayScaleY.toFixed(1) + "x", true);
    };

    var setDisplayScale = function(aspectX, scaleY) {
        displayAspectX = aspectX;
        if (displayAspectX < 0.5) displayAspectX = 0.5;
        if (displayAspectX > 2.5) displayAspectX = 2.5;
        displayScaleY = scaleY;
        if (displayScaleY < 0.5) displayScaleY = 0.5;
        if (!display) return;
        display.displayScale(displayAspectX, displayScaleY);
        //display.displayMinimumSize((wmsx.Monitor.BASE_WIDTH * wmsx.Monitor.DEFAULT_SCALE_X / wmsx.Monitor.DEFAULT_SCALE_Y) | 0, wmsx.Monitor.BASE_HEIGHT);
    };

    var crtSetModeForCartridges = function(cartridge1, cartridge2) {
        // Nothing yet available to set in ROMDatabase
    };

    var displayCenter = function() {
        if (display) display.displayCenter();
    };


    var videoSignal;
    var cartridgeSocket;

    var displayAspectX;
    var displayScaleY;

    init(this);

};

wmsx.Monitor.SCALE_STEP = 0.1;


