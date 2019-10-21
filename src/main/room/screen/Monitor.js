// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Savestate

wmsx.Monitor = function(display) {
"use strict";

    this.connectInternalVideoSignal = function(videoSignal) {
        intSignal = videoSignal;
        intSignal.connectMonitor(this);
    };

    this.connectExternalVideoSignal = function(videoSignal) {
        extSignal = videoSignal;
        extSignal.connectMonitor(this);
        updateOutputMode();
    };

    this.disconnectExternalVideoSignal = function(videoSignal) {
        if (extSignal === videoSignal) {
            extSignal = undefined;
            outputAuto = 0;
            outputMode = -1;
            updateOutputMode();
        }
    };

    this.toggleOutputMode = function(dec) {
        if (dec) this.setOutputMode(outputMode <= -1 ? 3 : outputMode - 1);
        else     this.setOutputMode(outputMode >= 3 ? -1 : outputMode + 1);
    };

    this.resetOutputAutoMode = function() {
        intSignal.resetOutputAutoMode();
        if (extSignal) extSignal.resetOutputAutoMode();
        if (outputMode !== -1) this.setOutputMode(-1);
    };

    this.setOutputAutoMode = function(signal, mode) {
        var oldEffective = outputEffective;
        outputAuto = mode;
        updateOutputMode();
        if (oldEffective !== outputEffective) showOutputModeOSD();
    };

    this.setOutputMode = function(mode) {
        outputMode = !extSignal ? -1 : mode < -1 ? -1 : mode > 3 ? 3 : mode;
        updateOutputMode();
        showOutputModeOSD();
    };

    function updateOutputMode() {
        outputEffective = outputMode === -1 ? outputAuto : outputMode;
        intSignal.superimposeStateUpdate(outputEffective === 2);
        if (extSignal) extSignal.superimposeStateUpdate(outputEffective === 2);
        display.videoOutputModeUpdate(outputMode, outputEffective, outputAuto === 0, getOutputModeShortDesc(-1), extSignal && extSignal.getSignalDesc());
    }

    this.newFrame = function(signal, image, sourceX, sourceY, sourceWidth, sourceHeight) {
        // Should we display this signal?
        if ((outputEffective === 0 && signal !== intSignal) || (outputEffective === 1 && signal !== extSignal)) return;

        display.refresh(image, sourceX, sourceY, sourceWidth, sourceHeight, signal === intSignal);
    };

    this.signalOff = function(signal) {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap, error) {
        this.showOSDDirect(message, overlap, error);
    };

    this.showOSDDirect = function(message, overlap, error) {
        display.showOSD(message, overlap, error);
    };

    this.setDisplayMetrics = function(signal, targetWidth, targetHeight) {
        display.displayMetrics(targetWidth, targetHeight);
    };

    this.setPixelMetrics = function(signal, pixelWidth, pixelHeight) {
        display.displayPixelMetrics(pixelWidth, pixelHeight);
    };

    this.setDefaults = function() {
        display.crtPhosphorSetDefault();
        display.crtScanlinesSetDefault();
        display.crtFilterSetDefault();
        display.aspectAndScaleSetDefault();
        display.requestReadjust(true);
    };

    this.setDebugMode = function(signal, boo) {
        display.setDebugMode(boo);
    };

    this.crtFilterToggle = function(dec) {
        display.crtFilterToggle(dec);
    };

    this.crtScanlinesToggle = function(dec) {
        display.crtScanlinesToggle(dec);
    };

    this.crtPhosphorToggle = function(dec) {
        display.crtPhosphorToggle(dec);
    };

    this.fullscreenToggle = function(windowed) {
        display.displayToggleFullscreen(windowed);
    };

    this.displayAspectDecrease = function() {
        this.displayScale(normalizeAspectX(displayAspectX - wmsx.Monitor.ASPECT_STEP), displayScaleY);
        this.showOSDDirect("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayAspectIncrease = function() {
        this.displayScale(normalizeAspectX(displayAspectX + wmsx.Monitor.ASPECT_STEP), displayScaleY);
        this.showOSDDirect("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayScaleDecrease = function() {
        this.displayScale(displayAspectX, normalizeScaleY(displayScaleY - wmsx.Monitor.SCALE_STEP));
        this.showOSDDirect("Display Size: " + displayScaleY.toFixed(2) + "x", true);
    };

    this.displayScaleIncrease = function() {
        this.displayScale(displayAspectX, normalizeScaleY(displayScaleY + wmsx.Monitor.SCALE_STEP));
        this.showOSDDirect("Display Size: " + displayScaleY.toFixed(2) + "x", true);
    };

    this.getScreenText = function() {
        return intSignal.getScreenText();
    };

    this.displayScale = function(aspectX, scaleY) {
        displayAspectX = aspectX;
        displayScaleY = scaleY;
        display.displayScale(displayAspectX, displayScaleY);
    };

    function normalizeAspectX(aspectX) {
        var ret = aspectX < 0.5 ? 0.5 : aspectX > 2.5 ? 2.5 : aspectX;
        return Math.round(ret / wmsx.Monitor.ASPECT_STEP) * wmsx.Monitor.ASPECT_STEP;
    }

    function normalizeScaleY(scaleY) {
        var ret = scaleY < 0.5 ? 0.5 : scaleY;
        return Math.round(ret / wmsx.Monitor.SCALE_STEP) * wmsx.Monitor.SCALE_STEP;
    }

    function showOutputModeOSD() {
        display.showOSD("Video Output: " + getOutputModeDesc(outputMode), true);
    }

    function getOutputModeDesc(mode) {
        switch (mode) {
            case 0:  return "Internal";
            case 1:  return extSignal ? extSignal.getSignalDesc() : "External";
            case 2:  return "Superimposed";
            case 3:  return "Mixed";
            default: return "Auto (" + getOutputModeDesc(outputAuto) + ")";
        }
    }

    function getOutputModeShortDesc(mode) {
        switch (mode) {
            case 0:  return "Internal";
            case 1:  return extSignal ? extSignal.getSignalShortDesc() : "External";
            case 2:  return "Superimp";
            case 3:  return "Mixed";
            default: return "Auto (" + getOutputModeShortDesc(outputAuto) + ")";
        }
    }

    function isActiveSignal(signal) {
        return outputEffective <= 0 ? signal === intSignal : signal === extSignal;
    }


    var outputMode = -1, outputAuto = 0, outputEffective = 0;

    var intSignal, extSignal;

    var displayAspectX;
    var displayScaleY;

};

wmsx.Monitor.SCALE_STEP = 0.05;
wmsx.Monitor.ASPECT_STEP = 0.01;


