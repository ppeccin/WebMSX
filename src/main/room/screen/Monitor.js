// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Monitor = function(display) {
"use strict";

    this.connectInternalVideoSignal = function(videoSignal) {
        intSignal = videoSignal;
        intSignal.connectMonitor(this);
        colorMode = WMSX.SCREEN_COLORS >= 0 && WMSX.SCREEN_COLORS <= 3 ? WMSX.SCREEN_COLORS : 0;
        paletteMode = WMSX.VDP_PALETTE >= 0 && WMSX.VDP_PALETTE <= 5 ? WMSX.VDP_PALETTE : 2;        // default = 2 (V9928)
        updateColorAndPaletteMode();
        updateOutputMode();
    };

    this.connectExternalVideoSignal = function(videoSignal) {
        extSignal = videoSignal;
        extSignal.connectMonitor(this);

        if (WMSX.SCREEN_VIDEO_OUT >= 0) this.setOutputMode(WMSX.SCREEN_VIDEO_OUT, true);
        else updateOutputMode();
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

    this.setOutputMode = function(mode, skipMes) {
        outputMode = !extSignal ? -1 : mode < -1 ? -1 : mode > 4 ? 4 : mode;
        updateOutputMode();
        if (!skipMes) showOutputModeOSD();
    };

    this.setOutputModeDual = function() {
        if (outputMode === 4) {
            outputDualPri ^= 1;     // toggle screens
            updateOutputMode();
            showOutputModeOSD();
        } else
            this.setOutputMode(4);
    };

    function updateOutputMode() {
        outputEffective = outputMode === -1 ? outputAuto : outputMode;

        intSignal.videoSignalDisplayStateUpdate(outputEffective !== 1, outputEffective === 2);
        if (extSignal) extSignal.videoSignalDisplayStateUpdate(outputEffective !== 0, outputEffective === 2);

        if (outputEffective >= 1) extSignal.refreshDisplayMetrics();    // External Signal takes precedence when displayed
        else intSignal.refreshDisplayMetrics();

        display.videoOutputModeUpdate(outputMode, outputEffective, outputAuto === 0, getOutputModeShortDesc(-1), extSignal && extSignal.getSignalName(), outputDualPri);
    }

    this.toggleColorMode = function(dec) {
        if (dec) colorMode = colorMode <= 0 ? 3 : colorMode - 1;            // 0..3
        else     colorMode = colorMode >= 3 ? 0 : colorMode + 1;
        updateColorAndPaletteMode();

        display.showOSD("Screen Color Mode: " + COLOR_MODE_DESC[colorMode], true);
    };

    this.togglePaletteMode = function(dec) {
        if (dec) paletteMode = paletteMode <= 0 ? 5 : paletteMode - 1;      // 0..5
        else     paletteMode = paletteMode >= 5 ? 0 : paletteMode + 1;
        updateColorAndPaletteMode();

        display.showOSD("MSX1 Palette: " + PALETTE_MODE_DESC[paletteMode], true);
    };

    function updateColorAndPaletteMode() {
        intSignal.setColorAndPaletteMode(colorMode, paletteMode);
        if (extSignal) extSignal.setColorAndPaletteMode(colorMode, paletteMode);
    }

    this.newFrame = function(signal, image, sourceX, sourceY, sourceWidth, sourceHeight) {
        // Should we display this signal?
        if (isSignalActive(signal))
            display.refresh(image, sourceX, sourceY, sourceWidth, sourceHeight, (signal === intSignal) | 0);
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

    this.setDisplayMetrics = function(signal, renderWidth, renderHeight) {
        if (isSignalActive(signal))
            display.displayMetrics(renderWidth, renderHeight);
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
            case 1:  return extSignal ? extSignal.getSignalName() : "External";
            case 2:  return "Superimposed";
            case 3:  return "Mixed";
            case 4:  var ext = extSignal ? extSignal.getSignalName() : "External"; return "Dual Screen " + (outputDualPri ? "(" + ext + " + Internal)" : "(Internal + " + ext + ")");
            default: return "Auto (" + getOutputModeDesc(outputAuto) + ")";
        }
    }

    function getOutputModeShortDesc(mode) {
        switch (mode) {
            case 0:  return "Internal";
            case 1:  return extSignal ? extSignal.getSignalName() : "External";
            case 2:  return "Superimp";
            case 3:  return "Mixed";
            case 4:  return "Dual";
            default: return "Auto (" + getOutputModeShortDesc(outputAuto) + ")";
        }
    }

    function isSignalActive(signal) {
        return (outputEffective !== 1 && signal === intSignal) || (outputEffective !== 0 && signal === extSignal);

    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m: outputMode, me: outputEffective, ma: outputAuto, md: outputDualPri,
            cm: colorMode, pm: paletteMode
        };
    };

    this.loadState = function(s) {
        if (s) {
            outputMode = s.m; outputAuto = s.ma; outputDualPri = s.md !== undefined ? s.md : 1;
            colorMode = s.cm || 0; paletteMode = s.pm || 0;
        } else {
            outputMode = -1; outputAuto = 0; outputDualPri = 1;
            colorMode = 0; paletteMode = 2;
        }
        updateColorAndPaletteMode();
        updateOutputMode();
    };


    var outputMode = -1, outputAuto = 0, outputEffective = 0, outputDualPri = 1;

    var colorMode = 0;
    var paletteMode = 2;

    var intSignal, extSignal;

    var displayAspectX;
    var displayScaleY;


    var COLOR_MODE_DESC = [ "Color", "B&W", "Green Phosphor", "Amber Phosphor" ];
    var PALETTE_MODE_DESC = [ "WebMSX Original", "V9918", "V9928", "V9938", "Toshiba", "Fujitsu FM-X" ];

};

wmsx.Monitor.SCALE_STEP = 0.05;
wmsx.Monitor.ASPECT_STEP = 0.01;


