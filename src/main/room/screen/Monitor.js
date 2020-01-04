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
        outputMode = !extSignal || mode < -1 ? -1 : mode < 4 ? mode : !display.isDualScreenAllowed() ? -1 : mode > 5 ? 5 : mode;
        updateOutputMode();
        if (!skipMes) showOutputModeOSD();
    };

    this.setOutputModeDual = function() {
        if (!display.isDualScreenAllowed()) return;

        if (outputMode >= 4) {
            outputMode = outputMode === 4 ? 5 : 4;     // toggle priority
            updateOutputMode();
            showOutputModeOSD();
        } else
            this.setOutputMode(outputEffective === 0 ? 4 : 5);
    };

    function updateOutputMode() {
        outputEffective = outputMode === -1 ? outputAuto : outputMode;

        intSignal.videoSignalDisplayStateUpdate(outputEffective !== 1, outputEffective === 2);
        if (extSignal) extSignal.videoSignalDisplayStateUpdate(outputEffective !== 0, outputEffective === 2);

        display.videoOutputModeUpdate(outputMode, outputEffective, outputAuto === 0, getOutputModeShortDesc(-1), extSignal && extSignal.getSignalName());

        intSignal.refreshDisplayMetrics();
        if (extSignal) extSignal.refreshDisplayMetrics();
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
        if (isSignalDisplayed(signal))
            display.refresh(image, sourceX, sourceY, sourceWidth, sourceHeight, signal === intSignal);
    };

    this.signalOff = function(signal) {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap, error) {
        display.showOSD(message, overlap, error);
    };

    this.setDisplayMetrics = function(signal, renderWidth, renderHeight) {
        if (isSignalDisplayed(signal))
            display.displayMetrics(renderWidth, renderHeight, signal === intSignal);
    };

    this.setDebugMode = function(signal, boo) {
        display.setDebugMode(boo);
    };

    this.getScreenText = function() {
        return intSignal.getScreenText();
    };

    function showOutputModeOSD() {
        display.showOSD("Video Output: " + getOutputModeDesc(outputMode), true);
    }

    function getOutputModeDesc(mode) {
        switch (mode) {
            case 0: return "Internal";
            case 1: return extSignal ? extSignal.getSignalName() : "External";
            case 2: return "Superimposed";
            case 3: return "Mixed";
            case 4: case 5: var ext = extSignal ? extSignal.getSignalName() : "External"; return "Dual Screen " + (mode === 4 ? "(Internal + " + ext + ")" : "(" + ext + " + Internal)");
            default: return "Auto (" + getOutputModeDesc(outputAuto) + ")";
        }
    }

    function getOutputModeShortDesc(mode) {
        switch (mode) {
            case 0: return "Internal";
            case 1: return extSignal ? extSignal.getSignalName() : "External";
            case 2: return "Superimp";
            case 3: return "Mixed";
            case 4: case 5: return "Dual";
            default: return "Auto (" + getOutputModeShortDesc(outputAuto) + ")";
        }
    }

    function isSignalDisplayed(signal) {
        return (outputEffective !== 1 && signal === intSignal) || (outputEffective !== 0 && signal === extSignal);
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m: outputMode, me: outputEffective, ma: outputAuto,
            cm: colorMode, pm: paletteMode
        };
    };

    this.loadState = function(s) {
        if (s) {
            outputMode = s.m; outputAuto = s.ma;
            colorMode = s.cm || 0; paletteMode = s.pm || 0;
        } else {
            outputMode = -1; outputAuto = 0;
            colorMode = 0; paletteMode = 2;
        }
        updateColorAndPaletteMode();
        this.setOutputMode(outputMode, true);
    };


    var outputMode = -1, outputAuto = 0, outputEffective = 0;

    var colorMode = 0;
    var paletteMode = 2;

    var intSignal, extSignal;

    var COLOR_MODE_DESC = [ "Color", "B&W", "Green Phosphor", "Amber Phosphor" ];
    var PALETTE_MODE_DESC = [ "WebMSX Original", "V9918", "V9928", "V9938", "Toshiba", "Fujitsu FM-X" ];

};


