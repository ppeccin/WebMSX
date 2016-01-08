// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// This implementation is line-accurate
// Original base clock: 10738635 Hz which is 3x CPU clock
wmsx.V9938 = function(cpu, psg) {
    var self = this;

    function init() {
        videoSignal = new wmsx.VDPVideoSignal(signalMetrics256);
        cpuClockPulses = cpu.clockPulses;
        psgClockPulse = psg.getAudioOutput().audioClockPulse;
        initFrameResources();
        initColorCaches();
        initDebugPatternTables();
        mode = 0;
        self.setDefaults();
    }

    this.connectBus = function(bus) {
        bus.connectInputDevice(0x98,  this.input98);
        bus.connectOutputDevice(0x98, this.output98);
        bus.connectInputDevice(0x99,  this.input99);
        bus.connectOutputDevice(0x99, this.output99);
        bus.connectOutputDevice(0x9a, this.output9a);
        bus.connectOutputDevice(0x9b, this.output9b);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        videoSignal.signalOff();
    };

    this.setVideoStandard = function(pVideoStandard) {
        videoStandard = pVideoStandard;
        updateSynchronization();
        if (currentScanline >= videoStandard.finishingScanline) currentScanline = videoStandard.startingScanline;       // When going from PAL to NTSC
    };

    this.setVSynchMode = function(mode) {
        vSynchMode = mode;
        updateSynchronization();
    };

    this.getVideoOutput = function() {
        return videoSignal;
    };

    this.getDesiredBaseFrequency = function () {
        return desiredBaseFrequency;
    };

    this.clockPulse = function() {
        // Finish video signal (generate any missing lines up to the max per cycle)
        updateLines(1000);

        // Finish audio signal (generate any missing samples to adjust to sample rate)
        psg.getAudioOutput().finishFrame();

        // Send updated image to Monitor if needed
        if (refreshPending) refresh();

        // Prepare for next cycle. Adjust for pulldown cadence if the next frame is the first pulldown frame
        cycleLines = (currentScanline === startingScanline) ? pulldownFirstFrameStartingLine : 0;

        frame++
    };

    this.input98 = function() {
        // VRAM Read
        dataToWrite = null;
        var res = vram[vramPointer++];
        if (vramPointer > VRAM_LIMIT) {
            //wmsx.Util.log("VRAM Read Wrapped, vramPointer: " + vramPointer.toString(16) + ", register14: " + register[14].toString(16));
            vramPointer &= VRAM_LIMIT;
        }
        return res;
    };

    this.output98 = function(val) {

        //if (vramPointer > 0x7400) wmsx.Util.log("VRAM Write: " + val.toString(16) + " at: " + vramPointer.toString(16));

        // VRAM Write
        dataToWrite = null;
        vram[vramPointer++] = val;
        if (vramPointer > VRAM_LIMIT) {
            //wmsx.Util.log("VRAM Write Wrapped, vramPointer: " + vramPointer.toString(16) + ", register14: " + register[14].toString(16));
            vramPointer &= VRAM_LIMIT;
        }
    };

    this.input99 = function() {
        // Status Register Read
        dataToWrite = null;
        var reg = register[15];
        var prevStatus = status[reg];

        switch(reg) {
            case 0:
                status[0] = 0; updateIRQ(); break;
            case 1:
                status[1] &= ~0x81; updateIRQ(); break;             // FL, FH
        }

        return prevStatus;
    };

    this.output99 = function(val) {
        if (dataToWrite === null) {
            // First write. Data to write to register or VRAM Address Pointer low (A7-A0)
            dataToWrite = val;
        } else {
            // Second write
            if (val & 0x80) {
                // Register write
                registerWrite(val & 0x3f, dataToWrite);
            } else {
                // VRAM Address Pointer middle (A13-A8) and mode (r/w)
                vramWriteMode = val & 0x40;
                vramPointer = ((vramPointer & 0x1c000) | ((val & 0x3f) << 8) | dataToWrite) & VRAM_LIMIT;
            }
            dataToWrite = null;
        }
    };

    this.output9a = function(val) {
        // Palette Write
        if (paletteFirstWrite === null) {
            paletteFirstWrite = val;
        } else {
            setPaletteRegister(register[16], (val << 8) | paletteFirstWrite);
            if (++register[16] > 15) register[16] = 0;
            paletteFirstWrite = null;
        }
    };

    this.output9b = function(val) {
        // Indirect Register Write
        var reg = register[17] & 0x3f;
        if ((reg <= 46) && (reg !== 17)) registerWrite(reg, val);
        if ((register[17] & 0x80) === 0) register[17] = (reg + 1) & 0x3f;       // Increment if needed
    };

    this.togglePalettes = function() {
        videoSignal.showOSD("Color Mode not supported for MSX2 yet!", true);
    };

    this.toggleDebugModes = function() {
        setDebugMode((debugMode + 1) % 8);
        videoSignal.showOSD("Debug Mode" + (debugMode > 0 ? " " + debugMode : "") + ": "
            + [ "OFF", "Sprites Highlighted", "Sprite Numbers", "Sprite Names",
                "Sprites Hidden", "Pattern Bits", "Pattern Color Blocks", "Pattern Names"][debugMode], true);
    };

    this.toggleSpriteModes = function() {
        spriteMode = ++spriteMode % 4;
        spriteModeLimit = (spriteMode === 0) || (spriteMode === 2);
        spriteModeCollisions = spriteMode < 2;
        videoSignal.showOSD("Sprites Mode" + (spriteMode > 0 ? " " + spriteMode : "") + ": "
            + ["Normal", "Unlimited", "NO Collisions", "Unlimited, No Collisions"][spriteMode], true);
    };

    this.setDefaults = function() {
        spriteMode = 0;
        setDebugMode(0);
    };

    this.reset = function() {
        frame = 0;
        wmsx.Util.arrayFill(status, 0);
        wmsx.Util.arrayFill(register, 0);
        wmsx.Util.arrayFill(paletteRegister, 0);
        nameTableAddress = colorTableAddress = patternTableAddress = spriteAttrTableAddress = spritePatternTableAddress = spriteColorTableAddress = 0;
        dataToWrite = null; vramWriteMode = false; vramPointer = 0; paletteFirstWrite = null;
        executingCommandHandler = null;
        currentScanline = videoStandard.startingScanline;
        backdropColor = 0;
        initColorPalette();
        updateIRQ();
        updateMode();
        updateLineFunctions();
        updateSpriteFunctions();
        updateBackdropValue();
        updateSynchronization();
    };

    function registerWrite(reg, val) {
        var old = register[reg];
        register[reg] = val;
        switch (reg) {
            case 0:
                if ((val & 0x10) !== (old & 0x10)) updateIRQ();                     // IE1
                if ((val & 0x0e) !== (old & 0x0e)) updateMode();                    // Mx
                break;
            case 1:
                if ((val & 0x20) !== (old & 0x20)) updateIRQ();                     // IE0
                if ((val & 0x18) !== (old & 0x18)) updateMode();                    // Mx
                else if ((val & 0x40) !== (old & 0x40)) updateLineFunctions();      // BL. Already ok if mode was updated
                if ((val & 0x03) !== (old & 0x03)) updateSpriteFunctions();         // SI, MAG
                break;
            case 2:
                nameTableAddress = (val << 10) & modes[mode].nameTMask;
                break;
            case 3:
            case 10:
                colorTableAddress = ((register[10] << 14) | (register[3] << 6)) & modes[mode].colorTMask;
                break;
            case 4:
                patternTableAddress = (val << 11) & modes[mode].patTMask;
                break;
            case 5:
            case 11:
                spriteAttrTableAddress = ((register[11] << 15) | (register[5] << 7)) & modes[mode].sprAttrTMask;
                spriteColorTableAddress = spriteAttrTableAddress - 512;             // Fixed offset based on Attr Table

                //logInfo("SpriteAttrTableAddress: " + ((register[11] << 15) | (register[5] << 7)).toString(16));

                break;
            case 6:
                spritePatternTableAddress = (val << 11) & modes[mode].sprPatTMask;
                updateSpritePatternTables();
                break;
            case 7:
                if ((val & 0x0f) !== (old & 0x0f)) updateBackdropColor();           // BD
                break;
            case 8:
                if ((val & 0x20) !== (old & 0x20)) updateTransparency();            // TP
                break;
            case 9:
                if ((val & 0x80) !== (old & 0x80)) updateSignalMetrics();           // LN
                break;
            case 14:
                // VRAM Address Pointer high (A16-A14)
                vramPointer = (((val & 0x07) << 14) | (vramPointer & 0x3fff)) & VRAM_LIMIT;
                break;
            case 16:
                paletteFirstWrite = null;
                break;
            case 44:
                if (executingCommandHandler) executingCommandHandler(val);
                break;
            case 46:

                //console.log(">>>> VDP Command: " + (val & 0xf0).toString(16));

                switch (val & 0xf0) {
                    case 0xf0:
                        HMMC(); break;
                    case 0xd0:
                        HMMM(); break;
                    case 0xc0:
                        HMMV(); break;
                    case 0xb0:
                        LMMC(); break;
                    case 0x90:
                        LMMM(); break;
                    case 0x80:
                        LMMV(); break;
                    case 0x70:
                        LINE(); break;
                    case 0x50:
                        PSET(); break;
                    case 0x00:
                        STOP(); break;
                    default:
                        wmsx.Util.log("Unsupported V9938 Command: " + val.toString(16));
                }
        }
    }

    function setPaletteRegister(reg, val) {
        if (paletteRegister[reg] === val) return;

        //console.log("Palette Register: " + reg + " = " + val.toString(16));

        paletteRegister[reg] = val;
        var value = colors512[((val & 0x700) >> 2) | ((val & 0x70) >> 1) | (val & 0x07)];     // 11 bit GRB to 9 bit GRB

        // Special case for color 0
        if (reg === 0) {
            color0SetValue = value;
            if (color0Solid) colorPalette[0] = value;
        } else
            colorPalette[reg] = value;

        if (reg === backdropColor) updateBackdropValue();
        else if ((mode === 4) && (reg <= 3)) updateBackdropCachesG5();
    }

    function setDebugMode(mode) {
        debugMode = mode;
        debugModeSpriteInfo = mode >= 2 && mode <= 3;
        debugModeSpriteInfoNames = mode === 3;
        debugModePatternInfo = mode >= 5;
        debugModePatternInfoBlocks = mode === 6;
        debugModePatternInfoNames = mode === 7;
        updateLineFunctions();
        updateSpritePatternTables();
        updateBackdropValue();
    }

    function updateSynchronization() {
        // Use the native frequency (60Hz or 50Hz) if detected and VSynch matches or is forced, otherwise use the Video Standard target FPS
        var hostFreq = wmsx.Clock.HOST_NATIVE_FPS;
        desiredBaseFrequency = videoStandard.targetFPS;
        if ((vSynchMode === 2) && (hostFreq > 0)) desiredBaseFrequency = hostFreq;

        startingScanline = videoStandard.startingScanline;
        finishingScanline = videoStandard.finishingScanline;
        cycleTotalLines = videoStandard.pulldowns[desiredBaseFrequency].linesPerCycle;      // Always generate this amount of lines per clock
        pulldownFirstFrameStartingLine = videoStandard.pulldowns[desiredBaseFrequency].firstFrameStartingLine;
        cycleLines = pulldownFirstFrameStartingLine;
    }

    // 262 lines per frame for NTSC, 313 lines for PAL
    // 342 total pixel clocks per line, 256 visible pixels, 228 CPU clocks and 7.125 PSG clocks
    // 59736 total CPU clocks per frame for NTSC, 71364 for PAL
    function updateLines(lines) {
        var toCycleLine = cycleLines + lines; if (toCycleLine > cycleTotalLines) toCycleLine = cycleTotalLines;

        while (cycleLines < toCycleLine) {
            var toScanline = currentScanline + (toCycleLine - cycleLines);

            // Visible top border scanlines (8)
            if (currentScanline < 0) updateLinesBorder(toScanline < 0 ? toScanline : 0);
            if (cycleLines >= toCycleLine) return;

            // Visible active scanlines (192 for both NSTC and PAL). Loop (while) is to support mode changes during visible scanlines
            if (currentScanline < finishingActiveScanline) {
                status[2] &= ~0x40;
                lineClockCPUandPSG();
                while((currentScanline < finishingActiveScanline) && (cycleLines < toCycleLine)) updateLinesActive(toScanline < finishingActiveScanline ? toScanline : finishingActiveScanline);
            }

            // End of visible scan, request interrupt
            if (currentScanline === finishingActiveScanline) triggerVerticalInterrupt();
            if (cycleLines >= toCycleLine) return;

            // Visible bottom border scanlines (8)
            if (currentScanline < finishingBottomBorderScanline) updateLinesBorder(toScanline < finishingBottomBorderScanline ? toScanline : finishingBottomBorderScanline);
            if (cycleLines >= toCycleLine) return;

            // Invisible scanlines (enough to fill the remaining lines for the video standard)
            if (currentScanline < finishingScanline) updateLinesInvisible(toScanline < finishingScanline ? toScanline : finishingScanline);

            if (currentScanline === finishingScanline) finishFrame();
        }
    }

    function triggerVerticalInterrupt() {
        status[0] |= 0x80;
        status[2] |= 0x40;
        updateIRQ();
    }

    function triggerHorizontalInterrupt() {
        status[1] |= 0x01;
        updateIRQ();
    }

    function updateIRQ() {
        cpu.INT = ((status[0] & 0x80) && (register[1] & 0x20))
            || ((register[0] & 0x10) && (status[1] & 0x01))
            ? 0 : 1;
    }

    // 228 CPU clocks and 7,125 PSG clocks interleaved
    function lineClockCPUandPSG() {
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); // TODO 1 additional PSG clock each 8th line
    }

    function updateMode(force) {
        var oldMode = mode;
        mode = (register[1] & 0x18) | ((register[0] & 0x0e) >>> 1);

        //console.log("Update Mode: " + mode.toString(16));

        var m = modes[mode];
        nameTableAddress = (register[2] << 10) & m.nameTMask;
        patternTableAddress = (register[4] << 11) & m.patTMask;
        colorTableAddress = ((register[10] << 14) | (register[3] << 6)) & m.colorTMask;
        spriteAttrTableAddress = ((register[11] << 15) | (register[5] << 7)) & m.sprAttrTMask;
        spriteColorTableAddress = spriteAttrTableAddress - 512;             // Fixed offset based on Attr Table
        spritePatternTableAddress = (register[6] << 11) & m.sprPatTMask;
        updateSpritePatternTables();
        nameTableLineSize = m.nameLineSize;
        updateSignalMetrics();
        updateLineFunctions();
        if ((mode === 4) || (oldMode === 4)) updateBackdropCaches();
    }

    function updateSignalMetrics() {
        signalMetrics = register[9] & 0x80 ? modes[mode].sigMetricsExt : modes[mode].sigMetrics;
        finishingActiveScanline = signalMetrics.height;
        finishingBottomBorderScanline = finishingActiveScanline + 8;
        videoSignal.setSignalMetrics(signalMetrics);
    }

    function updateLineFunctions() {
        updateLinesActive = (register[1] & 0x40) === 0 ? modes[mode].updLinesBlanked : debugModePatternInfo ? modes[mode].updLinesDeb : modes[mode].updLines;
        updateLinesBorder = modes[mode].updLinesBorder;
        modeStable = false;
    }

    function updateSpriteFunctions() {
        updateSpritesLine = updateSpritesLineFunctions[register[1] & 0x03];
    }

    function updateTransparency() {
        color0Solid = !!(register[8] & 0x20);

        //console.log("TP: " + color0Solid + ", currentLine: " + currentScanline);

        colorPalette[0] = color0Solid ? color0SetValue : backdropValue;
    }

    function updateBackdropColor() {
        backdropColor = register[7] & 0x0f;

        //console.log("Backdrop Color: " + backdropColor + ", currentLine: " + currentScanline);

        updateBackdropValue();
    }

    function updateBackdropValue() {
        var value = debugModePatternInfo ? debugBackdropValue : backdropColor === 0 ? color0SetValue : colorPalette[backdropColor];

        if (backdropValue === value) return;

        backdropValue = value;
        if (!color0Solid) colorPalette[0] = value;
        updateBackdropCaches();
    }

    function updateBackdropCaches() {

        //console.log("Update BackdropCaches");

        // Special case for Graphic5 (Screen 6)
        if (mode === 4 && !debugModePatternInfo) updateBackdropCachesG5();
        else wmsx.Util.arrayFill(backdropFullLine512Values, backdropValue);
    }

    function updateBackdropCachesG5() {
        var odd = colorPalette[backdropColor >>> 2];
        var even = colorPalette[backdropColor & 0x03];
        for (var i = 0; i < 544; i += 2) {
            backdropFullLine512Values[i] = odd;
            backdropFullLine512Values[i + 1] = even;
        }
    }

    function updateLinesInvisible(toLine) {
        // No Horizontal Interrupt possible
        for (var i = toLine - currentScanline; i > 0; i--)
            lineClockCPUandPSG();
        cycleLines += (toLine - currentScanline);
        currentScanline = toLine;
    }

    function updateLinesBorder256(toLine) {
        var line = currentScanline, bufferPos = (line + 8) * 544;
        while (line < toLine) {
            lineClockCPUandPSG();
            // No Horizontal Interrupt possible
            frameBackBuffer.set(backdropFullLine256Values, bufferPos);
            bufferPos += 544;
            // Sprites deactivated
            line++;
        }
        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesBorder512(toLine) {
        var line = currentScanline, bufferPos = (line + 8) * 544;
        while (line < toLine) {
            lineClockCPUandPSG();
            // No Horizontal Interrupt possible
            frameBackBuffer.set(backdropFullLine512Values, bufferPos);
            bufferPos += 544;
            // Sprites deactivated
            line++;
        }
        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesBlanked256(toLine) {
        var line = currentScanline, bufferPos = (line + 8) * 544;
        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();
            frameBackBuffer.set(backdropFullLine256Values, bufferPos);
            bufferPos += 544;
            // Sprites deactivated
            line++;
            if (line >= toLine) break;
            lineClockCPUandPSG();
        } while (modeStable);
        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesBlanked512(toLine) {
        var line = currentScanline, bufferPos = (line + 8) * 544;
        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();
            frameBackBuffer.set(backdropFullLine512Values, bufferPos);
            bufferPos += 544;
            // Sprites deactivated
            line++;
            if (line >= toLine) break;
            lineClockCPUandPSG();
        } while (modeStable);
        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeT1(toLine) {                                        // Text (Screen 0 width 40)
        var patPos, patPosFinal, lineInPattern, name, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;
            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + (lineOff >>> 3) * 40;                   // line / 8 * 40
            patPosFinal = patPos + 40;
            lineInPattern = patternTableAddress + (lineOff & 0x07);
            colorCode = register[7];                                            // fixed text color for all line
            on =  colorPalette[colorCode >>> 4];
            off = colorPalette[colorCode & 0xf];
            while (patPos < patPosFinal) {
                name = vram[patPos++];
                pattern = vram[(name << 3) + lineInPattern];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 6;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;
            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            // Sprites deactivated

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeT2(toLine) {                                        // Text (Screen 0 width 80)
        var patPos, patPosFinal, lineInPattern, name, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop16(bufferPos);
            bufferPos += 16;
            setBackBufferToBackdrop16(bufferPos);
            bufferPos += 16;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + (lineOff >>> 3) * 80;                   // line / 8 * 80
            patPosFinal = patPos + 80;
            lineInPattern = patternTableAddress + (lineOff & 0x07);
            colorCode = register[7];                                            // fixed text color for all line
            on =  colorPalette[colorCode >>> 4];
            off = colorPalette[colorCode & 0xf];
            while (patPos < patPosFinal) {
                name = vram[patPos++];
                pattern = vram[(name << 3) + lineInPattern];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 6;
            }

            setBackBufferToBackdrop16(bufferPos);
            bufferPos += 16;
            setBackBufferToBackdrop16(bufferPos);
            bufferPos += 16;

            // Sprites deactivated

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeMC(toLine) {                                        // Multicolor (Screen 3)
        var patPos, extraPatPos, patPosFinal, name, patternLine, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + ((lineOff >>> 3) << 5);                 // line / 8 * 32
            patPosFinal = patPos + 32;
            extraPatPos = patternTableAddress + (((lineOff >>> 3) & 0x03) << 1) + ((lineOff >> 2) & 0x01);    // (pattern line % 4) * 2
            while (patPos < patPosFinal) {
                name = vram[patPos++];
                patternLine = (name << 3) + extraPatPos;                        // name * 8 + extra position
                colorCode = vram[patternLine];
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, 0xf0, on, off);                // always solid blocks of front and back colors;
                bufferPos += 8;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG1(toLine) {                                        // Graphics 1 (Screen 1)
        var patPos, patPosFinal, name, lineInPattern, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + ((lineOff >>> 3) << 5);                 // line / 8 * 32
            patPosFinal = patPos + 32;
            lineInPattern = patternTableAddress + (lineOff & 0x07);
            while (patPos < patPosFinal) {
                name = vram[patPos++];
                pattern = vram[((name << 3) + lineInPattern)];                  // name * 8 (8 bytes each pattern) + line inside pattern
                colorCode = vram[colorTableAddress + (name >>> 3)];             // name / 8 (1 color for each 8 patterns)
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 8;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while(modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG2(toLine) {                                        // Graphics 2 (Screen 2)
        var patPos, patPosFinal, lineInPattern, lineInColor, name, blockExtra, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + ((lineOff >>> 3) << 5);                 // line / 8 * 32
            patPosFinal = patPos + 32;
            lineInPattern = patternTableAddress + (lineOff & 0x07);
            lineInColor = colorTableAddress + (lineOff & 0x07);
            blockExtra = (lineOff & 0xc0) << 2;                                 // + 0x100 for each third block of the screen (8 pattern lines)
            while (patPos < patPosFinal) {
                name = vram[patPos++] | blockExtra;
                pattern = vram[(name << 3) + lineInPattern];
                colorCode = vram[(name << 3) + lineInColor];                    // (8 bytes each pattern) + line inside pattern
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 8;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG3(toLine) {                                        // Graphics 3 (Screen 4)
        var patPos, patPosFinal, lineInPattern, lineInColor, name, blockExtra, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + ((lineOff >>> 3) << 5);                 // line / 8 * 32
            patPosFinal = patPos + 32;
            lineInPattern = patternTableAddress + (lineOff & 0x07);
            lineInColor = colorTableAddress + (lineOff & 0x07);
            blockExtra = (lineOff & 0xc0) << 2;                                 // + 0x100 for each third block of the screen (8 pattern lines)
            while (patPos < patPosFinal) {
                name = vram[patPos++] | blockExtra;
                pattern = vram[(name << 3) + lineInPattern];
                colorCode = vram[(name << 3) + lineInColor];                    // (8 bytes each pattern) + line inside pattern
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 8;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            //updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG4(toLine) {                                        // Graphics 4 (Screen 5)
        var pixelsPos, pixelsPosFinal, pixels;
        var line = currentScanline, bufferPos = (line + 8) * 544, realLine;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            realLine = (line + register[23]) & 255;

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            pixelsPos = nameTableAddress + (realLine << 7);                     // consider the scan start offset in reg23
            pixelsPosFinal = pixelsPos + 128;
            while (pixelsPos < pixelsPosFinal) {
                pixels = vram[pixelsPos++];
                frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 4];
                frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x0f];
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            updateSprites2LineSize2(realLine, bufferPos - 264 - 272);           // consider the scan start offset in reg23

            line++;

            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG5(toLine) {                                        // Graphics 5 (Screen 6)
        var pixelsPos, pixelsPosFinal, pixels;
        var line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdropG5(bufferPos);
            bufferPos += 16;

            pixelsPos = nameTableAddress + (((line + register[23]) & 255) << 7);      // consider the scan start offset in reg23
            pixelsPosFinal = pixelsPos + 128;
            while (pixelsPos < pixelsPosFinal) {
                pixels = vram[pixelsPos++];
                frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 6];
                frameBackBuffer[bufferPos++] = colorPalette[(pixels >>> 4) & 0x03];
                frameBackBuffer[bufferPos++] = colorPalette[(pixels >>> 2) & 0x03];
                frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x03];
            }

            setBackBufferToBackdropG5(bufferPos);
            bufferPos += 16;

            //updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG6(toLine) {                                        // Graphics 6 (Screen 7)
        var pixelsPos, pixelsPosFinal, pixels;
        var line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 16;

            pixelsPos = nameTableAddress + (((line + register[23]) & 255) << 8);    // consider the scan start offset in reg23
            pixelsPosFinal = pixelsPos + 256;
            while (pixelsPos < pixelsPosFinal) {
                pixels = vram[pixelsPos++];
                frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 4];
                frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x0f];
            }

            setBackBufferToBackdropG5(bufferPos);
            bufferPos += 16;

            //updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG7(toLine) {                                        // Graphics 7 (Screen 8)
        var pixelsPos, pixelsPosFinal;
        var line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            pixelsPos = nameTableAddress + (((line + register[23]) & 255) << 8);      // consider the scan start offset in reg23
            pixelsPosFinal = pixelsPos + 256;
            while (pixelsPos < pixelsPosFinal) {
                frameBackBuffer[bufferPos++] = colors256[vram[pixelsPos++]];
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            //updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeT1Debug(toLine) {                                   // Text (Screen 0)
        var patPos, patPosFinal, lineInPattern, name, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;
            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + ((lineOff >>> 3) * 40);                 // line / 8 * 40
            patPosFinal = patPos + 40;
            lineInPattern = lineOff & 0x07;
            while (patPos < patPosFinal) {
                name = vram[patPos++];
                if (debugModePatternInfoNames) {
                    colorCode = name === 0x20 ? 0x41 : 0xf1;
                    pattern = debugPatTableDigits8[name * 8 + lineInPattern];
                    // Squish digits to fit 6 pixels wide
                    if (lineInPattern <= 5) {
                        pattern = (pattern & 0xe0) | ((pattern & 0x0e) << 1);   // TODO Darken 2nd digit
                    } else if (lineInPattern === 6)
                        pattern = 0x78;
                } else if (debugModePatternInfoBlocks) {
                    colorCode = register[7];                                    // Real text color for all blocks
                    pattern = debugPatTableBlocks[lineInPattern];
                } else {
                    colorCode = 0xf1;
                    pattern = vram[patternTableAddress + (name << 3) + lineInPattern];
                }
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 6;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;
            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            // Sprites deactivated

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeMCDebug(toLine) {                                   // Multicolor (Screen 3)
        if (!debugModePatternInfoNames) return updateLinesModeMC(toLine);

        var patPos, patPosFinal, name, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + ((lineOff >>> 3) << 5);                 // line / 8 * 32
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vram[patPos++];
                pattern = debugPatTableDigits8[name * 8 + (lineOff & 0x07)];
                colorCode = 0xf1;
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 8;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            updateSpritesLine(line, bufferPos - 264 - 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG1Debug(toLine) {                                   // Graphics 1 (Screen 1)
        var patPos, patPosFinal, lineInPattern, name, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            if (line === register[19]) triggerHorizontalInterrupt();

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            patPos = nameTableAddress + ((lineOff >>> 3) << 5);
            patPosFinal = patPos + 32;
            lineInPattern = lineOff & 0x07;
            while (patPos < patPosFinal) {
                name = vram[patPos++];
                if (debugModePatternInfoNames) {
                    colorCode = name === 0 || name === 0x20 ? 0x41 : 0xf1;
                    pattern = debugPatTableDigits8[name * 8 + lineInPattern];
                } else if (debugModePatternInfoBlocks) {
                    colorCode = vram[colorTableAddress + (name >>> 3)];
                    pattern = debugPatTableBlocks[lineInPattern];
                } else {
                    colorCode = 0xf1;
                    pattern = vram[patternTableAddress + (name << 3) + lineInPattern];
                }
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 8;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            updateSpritesLine(line, bufferPos - 264 - 272);
            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while(modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesModeG2Debug(toLine) {                                   // Graphics 2 (Screen 2)
        if (line === register[19]) triggerHorizontalInterrupt();

        var patPos, patPosFinal, lineInPattern, name, blockExtra, pattern, colorCode, on, off;
        var lineOff, line = currentScanline, bufferPos = (line + 8) * 544;

        modeStable = true;
        do {
            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8;

            lineOff = (line + register[23]) & 255;                              // consider the scan start offset in reg23
            lineInPattern = lineOff & 0x07;
            blockExtra = (lineOff & 0xc0) << 2;
            patPos = nameTableAddress + ((lineOff >>> 3) << 5);
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vram[patPos++] | blockExtra;
                if (debugModePatternInfoNames) {
                    name &= 0xff;
                    colorCode = name === 0 || name === 0x20 ? 0x41 : 0xf1;
                    pattern = debugPatTableDigits8[name * 8 + lineInPattern];
                } else if (debugModePatternInfoBlocks) {
                    colorCode = vram[(colorTableAddress + (name << 3) + lineInPattern)];
                    pattern = debugPatTableBlocks[lineInPattern];
                } else {
                    colorCode = 0xf1;
                    pattern = vram[patternTableAddress + (name << 3) + lineInPattern];
                }
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                setBackBufferPattern(bufferPos, pattern, on, off);
                bufferPos += 8;
            }

            setBackBufferToBackdrop(bufferPos);
            bufferPos += 8 + 272;

            updateSpritesLine(line, bufferPos - 264 + 272);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function setBackBufferPattern(bufferPos, pattern, on, off) {
        frameBackBuffer[bufferPos++] = pattern & 0x80 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x40 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x20 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x10 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x08 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x04 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x02 ? on : off;
        frameBackBuffer[bufferPos] =   pattern & 0x01 ? on : off;
    }

    function setBackBufferToBackdrop(bufferPos) {
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos] =   backdropValue;
    }

    function setBackBufferToBackdrop16(bufferPos) {
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos] =   backdropValue;
    }

    function setBackBufferToBackdropG5(bufferPos) {
        var odd =  backdropFullLine512Values[0];
        var even = backdropFullLine512Values[1];
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos++] = even;
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos++] = even;
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos++] = even;
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos++] = even;
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos++] = even;
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos++] = even;
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos++] = even;
        frameBackBuffer[bufferPos++] = odd;
        frameBackBuffer[bufferPos] =   even;
    }

    function updateSprites1LineSize0(line, bufferPos) {                     // Mode 1, 8x8 normal
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, patternStart, name, color, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;


        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 7)) || (y > line)) continue;                   // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -7) continue;                                           // Not visible (out to the left)
            name = vram[atrPos + 2];
            color &= 0x0f;
            patternStart = spritePatternTableAddress + (name << 3) + (line - y);
            s = x >= 0 ? 0 : -x;
            f = x <= 248 ? 8 : 256 - x;
            if (s < f) {
                pattern = vram[patternStart];
                copySprite(frameBackBuffer, bufferPos + x, pattern, color, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("8x8 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                      // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] |= 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] |= sprite;
        }
    }

    function updateSprites1LineSize1(line, bufferPos) {                     // Mode 1, 8x8 double
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, patternStart, name, color, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 15)) || (y > line)) continue;                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -15) continue;                                          // Not visible (out to the left)
            name = vram[atrPos + 2];
            color &= 0x0f;
            patternStart = spritePatternTableAddress + (name << 3) + ((line - y) >>> 1);    // Double line height
            s = x >= 0 ? 0 : -x;
            f = x <= 240 ? 16 : 256 - x;
            if (s < f) {
                pattern = vram[patternStart];
                copySprite2x(frameBackBuffer, bufferPos + x, pattern, color, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("8x8 double Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                      // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] |= 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] |= sprite;
        }
    }

    function updateSprites1LineSize2(line, bufferPos) {                     // Mode 1, 16x16 normal
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, color, patternStart, name, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 15)) || (y > line)) continue;                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -15) continue;                                          // Not visible (out to the left)
            name = vram[atrPos + 2];
            color &= 0x0f;
            patternStart = spritePatternTableAddress + ((name & 0xfc) << 3) + (line - y);
            // Left half
            s = x >= 0 ? 0 : -x;
            f = x <= 248 ? 8 : 256 - x;
            if (s < f) {
                pattern = vram[patternStart];
                copySprite(frameBackBuffer, bufferPos + x, pattern, color, s, f, invalid < 0);
            }
            // Right half
            s = x >= -8 ? 0 : -8 - x;
            f = x <= 240 ? 8 : 248 - x;
            if (s < f) {
                pattern = vram[patternStart + 16];
                copySprite(frameBackBuffer, bufferPos + x + 8, pattern, color, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                      // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] |= 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] |= sprite;
        }
    }

    function updateSprites1LineSize3(line, bufferPos) {                     // Mode 1, 16x16 double
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, patternStart, name, color, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 31)) || (y > line)) continue;                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -31) continue;                                          // Not visible (out to the left)
            name = vram[atrPos + 2];
            color &= 0x0f;
            patternStart = spritePatternTableAddress + ((name & 0xfc) << 3) + ((line - y) >>> 1);    // Double line height
            // Left half
            s = x >= 0 ? 0 : -x;
            f = x <= 240 ? 16 : 256 - x;
            if (s < f) {
                pattern = vram[patternStart];
                copySprite2x(frameBackBuffer, bufferPos + x, pattern, color, s, f, invalid < 0);
            }
            // Right half
            s = x >= -16 ? 0 : -16 - x;
            f = x <= 224 ? 16 : 240 - x;
            if (s < f) {
                pattern = vram[patternStart + 16];
                copySprite2x(frameBackBuffer, bufferPos + x + 16, pattern, color, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("16x16 double Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                      // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] |= 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] |= sprite;
        }
    }

    function updateSprites2LineSize2(line, bufferPos) {                     // Mode 2, 16x16 normal
        var spat = spriteAttrTableAddress + 512;

        if (vram[spat] === 216) return;                   // No sprites to show!

        var atrPos, colorPos, color, patternStart, name, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        atrPos = spat - 4;
        colorPos = spat - 512 - 16;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            sprite++;
            atrPos += 4;
            colorPos += 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 15)) || (y > line)) continue;                  // Not visible at line
            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[colorPos + (line - y)];

            //if (color & 0x40) continue;

            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -15) continue;                                          // Not visible (out to the left)
            color &= 0x0f;
            name = vram[atrPos + 2];
            patternStart = spritePatternTableAddress + ((name & 0xfc) << 3) + (line - y);
            // Left half
            s = x >= 0 ? 0 : -x;
            f = x <= 248 ? 8 : 256 - x;
            if (s < f) {
                pattern = vram[patternStart];
                copySprite(frameBackBuffer, bufferPos + x, pattern, color, s, f, invalid < 0);
            }
            // Right half
            s = x >= -8 ? 0 : -8 - x;
            f = x <= 240 ? 8 : 248 - x;
            if (s < f) {
                pattern = vram[patternStart + 16];
                copySprite(frameBackBuffer, bufferPos + x + 8, pattern, color, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                      // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] |= 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] |= sprite;
        }
    }

    function copySprite(dest, pos, pattern, color, start, finish, collide) {
        for (var i = start; i < finish; i++) {
            var s = (pattern >> (7 - i)) & 0x01;
            if (s === 0) continue;
            var destValue = dest[pos + i];
            // Transparent sprites (color = 0) just "mark" their presence setting dest Alpha to Full, so collisions can be detected
            if (destValue < 0xff000000) dest[pos + i] = (color === 0 ? destValue : colorPalette[color]) | 0xff000000;
            else if (!spritesCollided) spritesCollided = collide;
        }
    }

    function copySprite2x(dest, pos, pattern, color, start, finish, collide) {
        for (var i = start; i < finish; i++) {
            var s = (pattern >> (7 - (i >>> 1))) & 0x01;
            if (s === 0) continue;
            var destValue = dest[pos + i];
            // Transparent sprites (color = 0) just "mark" their presence setting dest Alpha to Full, so collisions can be detected
            if (destValue < 0xff000000) dest[pos + i] = (color === 0 ? destValue : colorPalette[color]) | 0xff000000;
            else if (!spritesCollided) spritesCollided = collide;
        }
    }

    function HMMC() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        var x = (((register[37] & 0x01) << 8) | register[36]);
        var y = (((register[39] & 0x03) << 8) | register[38]);
        executingCommandNX = (((register[41] & 0x03) << 8) | register[40]);
        executingCommandNY = (((register[43] & 0x07) << 8) | register[42]);
        executingCommandDIX = register[45] & 0x04 ? -1 : 1;
        executingCommandDIY = register[45] & 0x08 ? -1 : 1;

        //console.log("HMMC Start x: " + x + ", y: " + y + ", nx: " + executingCommandNX + ", ny: " + executingCommandNY + ", dix: " + executingCommandDIX + ", diy: " + executingCommandDIY);

        switch (mode) {
            case 0x03:
            case 0x05:
                x >>>= 1; executingCommandNX >>>= 1; break;
            case 0x04:
                x >>>= 2; executingCommandNX >>>= 2; break;
            case 0x07:
        }

        executingCommandDestPos = y * nameTableLineSize + x;

        executingCommandStart(HMMCNextData);
    }

    function HMMCNextData(co) {
        //console.log("CPU Color: " + co + ", X: " + executingCommandCX + ", Y: " + executingCommandCY);

        vram[executingCommandDestPos] = co;

        executingCommandCX++;
        if (executingCommandCX >= executingCommandNX) {
            executingCommandDestPos -= executingCommandDIX * (executingCommandNX - 1);
            executingCommandCX = 0; executingCommandCY++;
            if (executingCommandCY >= executingCommandNY) executingCommandFinish();
            else executingCommandDestPos += executingCommandDIY * nameTableLineSize;
        } else {
            executingCommandDestPos += executingCommandDIX;
        }
    }

    function HMMM() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        var srcX = (((register[33] & 0x01) << 8) | register[32]);
        var srcY = (((register[35] & 0x03) << 8) | register[34]);
        var destX = (((register[37] & 0x01) << 8) | register[36]);
        var destY = (((register[39] & 0x03) << 8) | register[38]);
        var nx = (((register[41] & 0x03) << 8) | register[40]);
        var ny = (((register[43] & 0x07) << 8) | register[42]);
        var dix = register[45] & 0x04 ? -1 : 1;
        var diy = register[45] & 0x08 ? -1 : 1;

        //console.log("HMMM srcX: " + srcX + ", srcY: " + srcY + ", destX: " + destX + ", destY: " + destY + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

        switch (mode) {
            case 0x03:
            case 0x05:
                srcX >>>= 1; destX >>>= 1; nx >>>= 1; break;
            case 0x04:
                srcX >>>= 2; destX >>>= 2; nx >>>= 2; break;
            case 0x07:
        }

        // Perform operation
        var srcPos = srcY * nameTableLineSize + srcX;
        var destPos = destY * nameTableLineSize + destX;
        var yStride = -(dix * nx) + nameTableLineSize * diy;
        for (var cy = 0; cy < ny; cy++) {
            for (var cx = 0; cx < nx; cx++) {
                vram[destPos] = vram[srcPos];
                srcPos += dix; destPos += dix;
            }
            srcPos += yStride; destPos += yStride;
        }

        // Finish
        status[2] &= ~1;
        register[46] &= ~0xf0;
    }

    function HMMV() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        var x = (((register[37] & 0x01) << 8) | register[36]);
        var y = (((register[39] & 0x03) << 8) | register[38]);
        var nx = (((register[41] & 0x03) << 8) | register[40]);
        var ny = (((register[43] & 0x07) << 8) | register[42]);
        var co = register[44];
        var dix = register[45] & 0x04 ? -1 : 1;
        var diy = register[45] & 0x08 ? -1 : 1;

        //console.log("HMMV x: " + x + ", y: " + y + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", co: " + co.toString(16));

        switch (mode) {
            case 0x03:
            case 0x05:
                x >>>= 1; nx >>>= 1; break;
            case 0x04:
                x >>>= 2; nx >>>= 2; break;
            case 0x07:
        }

        // Perform operation
        var pos = y * nameTableLineSize + x;
        var yStride = -(dix * nx) + nameTableLineSize * diy;
        for (var cy = 0; cy < ny; cy++) {
            for (var cx = 0; cx < nx; cx++) {
                vram[pos] = co;
                pos += dix;
            }
            pos += yStride;
        }

        // Finish
        status[2] &= ~1;
        register[46] &= ~0xf0;
    }

    function LMMC() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        executingCommandDestX = (((register[37] & 0x01) << 8) | register[36]);
        executingCommandDestY = (((register[39] & 0x03) << 8) | register[38]);
        executingCommandNX = (((register[41] & 0x03) << 8) | register[40]);
        executingCommandNY = (((register[43] & 0x07) << 8) | register[42]);
        executingCommandDIX = register[45] & 0x04 ? -1 : 1;
        executingCommandDIY = register[45] & 0x08 ? -1 : 1;
        executingCommandLogicalOperation = logicalOperationSelect(register[46] & 0x0f);

        //console.log("LMMC START x: " + executingCommandDestX + ", y: " + executingCommandDestY + ", nx: " + executingCommandNX + ", ny: " + executingCommandNY + ", dix: " + executingCommandDIX + ", diy: " + executingCommandDIY);

        executingCommandStart(LMMCNextData);
    }

    function LMMCNextData(co) {
        logicalPSET(executingCommandDestX, executingCommandDestY, co, executingCommandLogicalOperation);

        executingCommandCX++;
        if (executingCommandCX >= executingCommandNX) {
            executingCommandDestX -= executingCommandDIX * (executingCommandNX - 1);
            executingCommandCX = 0; executingCommandCY++;
            if (executingCommandCY >= executingCommandNY) executingCommandFinish();
            else executingCommandDestY += executingCommandDIY;
        } else {
            executingCommandDestX += executingCommandDIX;
        }
    }

    function LMMM() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        var srcX = (((register[33] & 0x01) << 8) | register[32]);
        var srcY = (((register[35] & 0x03) << 8) | register[34]);
        var destX = (((register[37] & 0x01) << 8) | register[36]);
        var destY = (((register[39] & 0x03) << 8) | register[38]);
        var nx = (((register[41] & 0x03) << 8) | register[40]);
        var ny = (((register[43] & 0x07) << 8) | register[42]);
        var dix = register[45] & 0x04 ? -1 : 1;
        var diy = register[45] & 0x08 ? -1 : 1;
        var op = logicalOperationSelect(register[46] & 0x0f);

        //console.log("LMMM srcX: " + srcX + ", srcY: " + srcY + ", destX: " + destX + ", destY: " + destY + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

        // Perform operation
        for (var cy = 0; cy < ny; cy++) {
            for (var cx = 0; cx < nx; cx++) {
                logicalPCOPY(destX, destY, srcX, srcY, op);
                srcX += dix; destX += dix;
            }
            srcX -= dix * nx; destX -= dix * nx;
            srcY += diy; destY += diy;
        }

        // Finish
        status[2] &= ~1;
        register[46] &= ~0xf0;
    }

    function LMMV() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        var destX = (((register[37] & 0x01) << 8) | register[36]);
        var destY = (((register[39] & 0x03) << 8) | register[38]);
        var nx = (((register[41] & 0x03) << 8) | register[40]);
        var ny = (((register[43] & 0x07) << 8) | register[42]);
        var co = register[44];
        var dix = register[45] & 0x04 ? -1 : 1;
        var diy = register[45] & 0x08 ? -1 : 1;
        var op = logicalOperationSelect(register[46] & 0x0f);

        //console.log("LMMV destX: " + destX + ", destY: " + destY + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", co: " + co.toString(16));

        // Perform operation
        for (var cy = 0; cy < ny; cy++) {
            for (var cx = 0; cx < nx; cx++) {
                logicalPSET(destX, destY, co, op);
                destX += dix;
            }
            destX -= dix * nx;
            destY += diy;
        }

        // Finish
        status[2] &= ~1;
        register[46] &= ~0xf0;
    }

    function LINE() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        var dx = (((register[37] & 0x01) << 8) | register[36]);
        var dy = (((register[39] & 0x03) << 8) | register[38]);
        var nx = (((register[41] & 0x03) << 8) | register[40]);
        var ny = (((register[43] & 0x07) << 8) | register[42]);
        var co = register[44];
        var dix = register[45] & 0x04 ? -1 : 1;
        var diy = register[45] & 0x08 ? -1 : 1;
        var maj = register[45] & 0x01;
        var op = logicalOperationSelect(register[46] & 0x0f);

        //console.log("LINE dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", maj: " + maj);

        // Perform operation
        var x = dx;
        var y = dy;
        var e = 0;
        if (maj === 0) {
            for (var n = 0; n <= nx; n++) {
                logicalPSET(x, y, co, op);
                x += dix; e += ny;
                if ((e << 1) >= nx) {
                    y += diy; e -= nx;
                }
            }
        } else {
            for (n = 0; n <= nx; n++) {
                logicalPSET(x, y, co, op);
                y += diy; e += ny;
                if ((e << 1) >= nx) {
                    x += dix; e -= nx;
                }
            }
        }

        // Finish
        status[2] &= ~1;
        register[46] &= ~0xf0;
    }

    function PSET() {
        // Begin
        status[2] |= 1;

        // Collect parameters
        var dx = (((register[37] & 0x01) << 8) | register[36]);
        var dy = (((register[39] & 0x03) << 8) | register[38]);
        var co = register[44];
        var op = logicalOperationSelect(register[46] & 0x0f);

        //console.log("PSET dx: " + dx + ", dy: " + dy);

        logicalPSET(dx, dy, co, op);

        // Finish
        status[2] &= ~1;
        register[46] &= ~0xf0;
    }

    function STOP() {

        //console.log("STOP: " + executingCommandHandler);

        executingCommandHandler = null;
        status[2] &= ~1;
    }

    function logicalPSET(x, y, co, op) {
        var shift, mask;
        switch (mode) {
            case 0x03:
            case 0x05:
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; co = (co & 0x0f) << shift; mask = 0x0f << shift; break;
            case 0x04:
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; co = (co & 0x03) << shift; mask = 0x03 << shift; break;
            case 0x07:
                mask = 0xff;
        }
        // Perform operation
        var pos = y * nameTableLineSize + x;
        vram[pos] = op(vram[pos], co, mask);
    }

    function logicalPCOPY(dX, dY, sX, sY, op) {
        var sShift, dShift, mask;
        switch (mode) {
            case 0x03:
            case 0x05:
                sShift = (sX & 0x1) ? 0 : 4; dShift = (dX & 0x1) ? 0 : 4;
                sX >>>= 1; dX >>>= 1; mask = 0x0f; break;
            case 0x04:
                sShift = (3 - (sX & 0x3)) * 2; dShift = (3 - (dX & 0x3)) * 2;
                sX >>>= 2; dX >>>= 2; mask = 0x03; break;
            case 0x07:
                sShift = dShift = 0;
                mask = 0xff;
        }

        // Perform operation
        var sPos = sY * nameTableLineSize + sX;
        var dPos = dY * nameTableLineSize + dX;
        var co = ((vram[sPos] >> sShift) & mask) << dShift;
        vram[dPos] = op(vram[dPos], co, mask << dShift);
    }

    function logicalOperationSelect(op) {

        //console.log("Logical Operation Selected: " + op);

        switch(op) {
            case 0x00: return logicalOperationIMP;
            case 0x08: return logicalOperationTIMP;
            default:
                console.log ("Invalid logical operation: " + op);
                return logicalOperationInvalid;
        }
    }

    function logicalOperationInvalid(dest, src, mask) {
        return dest;
    }

    function logicalOperationIMP(dest, src, mask) {
        return (dest & ~mask) | src;
    }

    function logicalOperationTIMP(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | src;
    }

    function logicalOperation15(dest, src, mask) {
        return 0xff;
    }

    function logicalOperation14(dest, src, mask) {
        return 0xee;
    }

    function executingCommandStart(handler) {
        // Init counters
        executingCommandCX = 0;
        executingCommandCY = 0;
        executingCommandHandler = handler;

        // Set CE and TR
        status[2] |= 81;

        // Perform first iteration with current data
        executingCommandHandler(register[44]);
    }

    function executingCommandFinish() {

        //if (executingCommandHandler === HMMCNextData) console.log(executingCommandHandler.name + " Finish");
        //else console.log(">>>> NO COMMAND TO FINISH");

        executingCommandHandler = null;
        status[2] &= ~81;          // Clear CE and TR
        register[46] &= ~0xf0;
    }

    function refresh() {
        // Update frame image and send to monitor
        frameContext.putImageData(frameImageData, 0, 0, 0, 0, signalMetrics.totalWidth, signalMetrics.totalHeight);
        videoSignal.newFrame(frameCanvas, 0, 0, signalMetrics.totalWidth, signalMetrics.totalHeight);
        refreshPending = false;
    }

    function finishFrame() {
        refreshPending = true;

        // Begin a new frame
        currentScanline = startingScanline;

        //wmsx.Util.log("Frame FINISHED. CPU cycles: " + cpu.eval("cycles"));
        //cpu.eval("cycles = 0");
    }

    function updateSpritePatternTables() {
        var vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
        spritePatternTable8  = debugModeSpriteInfo ? debugPatTableDigits8  : vramSpritePatternTable;
        spritePatternTable16 = debugModeSpriteInfo ? debugPatTableDigits16 : vramSpritePatternTable;
    }

    function initFrameResources() {
        frameCanvas = document.createElement('canvas');
        // Maximum VPD resolution + 16 pixel borders
        frameCanvas.width =  512 + 16 + 16;          // 544
        frameCanvas.height = 424 + 16 + 16;          // 456
        frameContext = frameCanvas.getContext("2d");
        //frameImageData = frameContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
        frameImageData = frameContext.createImageData(frameCanvas.width, frameCanvas.height);
        frameBackBuffer = new Uint32Array(frameImageData.data.buffer);
    }

    function initColorPalette() {
        for (var c = 0; c < 16; c++) colorPalette[c] = colors512[paletteInitialValues[c]];
        color0SetValue = colorPalette[0];
    }

    function initColorCaches() {



        // Pre calculate all 512 colors encoded in 9 bits, and all 256 colors encoded in 8 bits
        for (var c = 0; c <= 0x1ff; c++) {
            if (c & 1) colors256[c >>> 1] = 0xfe000000 | (color2to8bits[(c >>> 1) & 0x3] << 16) | (color3to8bits[c >>> 6] << 8) | color3to8bits[(c >>> 3) & 0x7];
            colors512[c] = 0xfe000000 | (color3to8bits[c & 0x7] << 16) | (color3to8bits[c >>> 6] << 8) | color3to8bits[(c >>> 3) & 0x7];
        }
    }

    function initDebugPatternTables() {
        var digitPatterns = [
            ["111", "101", "101", "101", "111"], ["110", "010", "010", "010", "111"], ["111", "001", "111", "100", "111"], ["111", "001", "111", "001", "111"], ["101", "101", "111", "001", "001"],
            ["111", "100", "111", "001", "111"], ["111", "100", "111", "101", "111"], ["111", "001", "001", "001", "001"], ["111", "101", "111", "101", "111"], ["111", "101", "111", "001", "001"],
            ["110", "001", "111", "101", "111"], ["100", "100", "111", "101", "110"], ["000", "111", "100", "100", "111"], ["001", "001", "111", "101", "111"], ["110", "101", "111", "100", "011"], ["011", "100", "110", "100", "100"]
        ];
        var pos8 = 0, pos16 = 0, i = 0;
        for (var info = 0; info < 256; info++) {
            var dig1 = (info / 16) | 0;
            var dig2 = info % 16;
            // 8 x 8
            for (i = 0; i < 5; i++) debugPatTableDigits8[pos8++] = Number.parseInt(digitPatterns[dig1][i] + "0" + digitPatterns[dig2][i] + "0", 2);
            debugPatTableDigits8[pos8++] = Number.parseInt("00000000", 2);
            debugPatTableDigits8[pos8++] = Number.parseInt("01111100", 2);
            debugPatTableDigits8[pos8++] = Number.parseInt("00000000", 2);
            // 16 x 16
            debugPatTableDigits16[pos16++] = Number.parseInt("11111111", 2);
            for (i = 0; i < 4; i++) debugPatTableDigits16[pos16++] = Number.parseInt("10000000", 2);
            for (i = 0; i < 5; i++) debugPatTableDigits16[pos16++] = Number.parseInt("1000" + digitPatterns[dig1][i] + "0", 2);
            for (i = 0; i < 5; i++) debugPatTableDigits16[pos16++] = Number.parseInt("10000000", 2);
            for (i = 0; i < 2; i++) debugPatTableDigits16[pos16++] = Number.parseInt("11111111", 2);
            for (i = 0; i < 4; i++) debugPatTableDigits16[pos16++] = Number.parseInt("00000001", 2);
            for (i = 0; i < 5; i++) debugPatTableDigits16[pos16++] = Number.parseInt("0" + digitPatterns[dig2][i] + "0001", 2);
            for (i = 0; i < 5; i++) debugPatTableDigits16[pos16++] = Number.parseInt("00000001", 2);
            debugPatTableDigits16[pos16++] = Number.parseInt("11111111", 2);
        }
        debugPatTableBlocks[0] = debugPatTableBlocks[7] = 0;
        debugPatTableBlocks[1] = debugPatTableBlocks[2] = debugPatTableBlocks[3] = debugPatTableBlocks[4] = debugPatTableBlocks[5] = debugPatTableBlocks[6] = 0x7e;
    }


    var VRAM_LIMIT = 0x1FFFF;
    var frame = 0;

    // Registers, pointers, control data

    var desiredBaseFrequency;       // Will depend on VideoStandard and detected Host Native Video Frequency

    var videoStandard;
    var vSynchMode;
    var currentScanline;
    var finishingActiveScanline;
    var finishingBottomBorderScanline;
    var startingScanline;
    var finishingScanline;
    var cycleLines;
    var cycleTotalLines;
    var pulldownFirstFrameStartingLine;
    var refreshPending;

    var status = new Array(10);
    var register = new Array(47);
    var paletteRegister = new Array(16);

    var mode;
    var signalMetrics;

    var modeStable;
    var spritesCollided;

    var dataToWrite;
    var vramPointer = 0;
    var vramWriteMode = false;
    var paletteFirstWrite;

    var executingCommandHandler = null;
    var executingCommandDX, executingCommandDY, executingCommandNX, executingCommandNY, executingCommandDIX, executingCommandDIY, executingCommandSrctPos, executingCommandDestPos, executingCommandLogicalOperation;
    var executingCommandDestX, executingCommandDestY, executingCommandSrcX, executingCommandSrcY, executingCommandCX, executingCommandCY;

    var backdropColor;
    var backdropValue;
    var backdropFullLine512Values = new Uint32Array(544);
    var backdropFullLine256Values = backdropFullLine512Values.subarray(272);

    var nameTableAddress = 0;
    var colorTableAddress = 0;
    var patternTableAddress = 0;
    var spriteAttrTableAddress = 0;
    var spritePatternTableAddress = 0;
    var spriteColorTableAddress = 0;
    var nameTableLineSize = 0;

    var signalMetrics256 =  { width: 256, height: 192, totalWidth: 272, totalHeight: 208 };
    var signalMetrics256e = { width: 256, height: 212, totalWidth: 272, totalHeight: 228 };
    var signalMetrics512 =  { width: 512, height: 192, totalWidth: 544, totalHeight: 208 };
    var signalMetrics512e = { width: 512, height: 212, totalWidth: 544, totalHeight: 228 };

    var modes = wmsx.Util.arrayFillFunc(new Array(32), function(i) {
        return    { name: "Invalid",   sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, nameTMask: 0x1fc00, patTMask: 0x1f800, colorTMask: 0x1ffc0, sprAttrTMask: 0x1ff80, sprPatTMask: 0x1f800, nameLineSize: 000, updLines: updateLinesBlanked256, updLinesDeb: updateLinesBlanked256, updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };
    });

    modes[0x10] = { name: "Screen 0",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTMask: 0x1fc00, patTMask: 0x1f800, colorTMask: 0x00000, sprAttrTMask: 0x00000, sprPatTMask: 0x00000, nameLineSize: 000, updLines: updateLinesModeT1,  updLinesDeb: updateLinesModeT1Debug, updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };
    modes[0x12] = { name: "Screen 0+", sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512,  nameTMask: 0x1f000, patTMask: 0x1ffff, colorTMask: 0x1fe00, sprAttrTMask: 0x00000, sprPatTMask: 0x00000, nameLineSize: 000, updLines: updateLinesModeT2,  updLinesDeb: updateLinesModeT2     , updLinesBlanked: updateLinesBlanked512, updLinesBorder: updateLinesBorder512 };
    modes[0x08] = { name: "Screen 3",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTMask: 0x1fc00, patTMask: 0x1f800, colorTMask: 0x1ffc0, sprAttrTMask: 0x1ff80, sprPatTMask: 0x1f800, nameLineSize: 000, updLines: updateLinesModeMC,  updLinesDeb: updateLinesModeMCDebug, updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };
    modes[0x00] = { name: "Screen 1",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTMask: 0x1fc00, patTMask: 0x1f800, colorTMask: 0x1ffc0, sprAttrTMask: 0x1ff80, sprPatTMask: 0x1f800, nameLineSize: 000, updLines: updateLinesModeG1,  updLinesDeb: updateLinesModeG1Debug, updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };
    modes[0x01] = { name: "Screen 2",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTMask: 0x1fc00, patTMask: 0x1e000, colorTMask: 0x1e000, sprAttrTMask: 0x1ff80, sprPatTMask: 0x1f800, nameLineSize: 000, updLines: updateLinesModeG2,  updLinesDeb: updateLinesModeG2Debug, updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };
    modes[0x02] = { name: "Screen 4",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTMask: 0x1fc00, patTMask: 0x1e000, colorTMask: 0x1e000, sprAttrTMask: 0x1ff80, sprPatTMask: 0x1f800, nameLineSize: 000, updLines: updateLinesModeG3,  updLinesDeb: updateLinesModeG3     , updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };
    modes[0x03] = { name: "Screen 5",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, nameTMask: 0x18000, patTMask: 0x00000, colorTMask: 0x00000, sprAttrTMask: 0x1fc00, sprPatTMask: 0x1f800, nameLineSize: 128, updLines: updateLinesModeG4,  updLinesDeb: updateLinesModeG4     , updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };
    modes[0x04] = { name: "Screen 6",  sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512e, nameTMask: 0x18000, patTMask: 0x00000, colorTMask: 0x00000, sprAttrTMask: 0x1fc00, sprPatTMask: 0x1f800, nameLineSize: 128, updLines: updateLinesModeG5,  updLinesDeb: updateLinesModeG5     , updLinesBlanked: updateLinesBlanked512, updLinesBorder: updateLinesBorder512 };
    modes[0x05] = { name: "Screen 7",  sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512e, nameTMask: 0x10000, patTMask: 0x00000, colorTMask: 0x00000, sprAttrTMask: 0x1fc00, sprPatTMask: 0x1f800, nameLineSize: 256, updLines: updateLinesModeG6,  updLinesDeb: updateLinesModeG6     , updLinesBlanked: updateLinesBlanked512, updLinesBorder: updateLinesBorder512 };
    modes[0x07] = { name: "Screen 8",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, nameTMask: 0x10000, patTMask: 0x00000, colorTMask: 0x00000, sprAttrTMask: 0x1fc00, sprPatTMask: 0x1f800, nameLineSize: 256, updLines: updateLinesModeG7,  updLinesDeb: updateLinesModeG7     , updLinesBlanked: updateLinesBlanked256, updLinesBorder: updateLinesBorder256 };   // TODO bit 16 position!

    var updateLinesActive, updateLinesBorder, updateSpritesLine;     // Update functions for current mode
    var updateSpritesLineFunctions = [updateSprites1LineSize0, updateSprites1LineSize1, updateSprites1LineSize2, updateSprites1LineSize3 ];


    // VRAM

    var vram = new Uint8Array(VRAM_LIMIT + 1);
    this.vram = vram;


    // Planes as off-screen canvas

    var frameCanvas, frameContext, frameImageData, frameBackBuffer;

    var colorPalette = new Uint32Array(16);     // 32 bit ABGR palette values ready to paint

    var colors256 = new Uint32Array(256);       // 32 bit ABGR values for 8 bit GRB colors
    var colors512 = new Uint32Array(512);       // 32 bit ABGR values for 9 bit GRB colors
    var color2to8bits = [ 0, 73, 146, 255 ];
    var color3to8bits = [ 0, 36, 73, 109, 146, 182, 219, 255 ];

    var color0Solid = false;
    var color0SetValue;

    var paletteInitialValues = [ 0x000, 0x000, 0x189, 0x1db, 0x04f, 0x0d7, 0x069, 0x197, 0x079, 0x0fb, 0x1b1, 0x1b4, 0x109, 0x0b5, 0x16d, 0x1ff ];

   // Sprite and Debug Modes controls

    var debugMode;
    var debugModeSpriteInfo, debugModeSpriteInfoNames;
    var debugModePatternInfo, debugModePatternInfoBlocks, debugModePatternInfoNames;

    var spriteMode;
    var spriteModeLimit = true;
    var spriteModeCollisions = true;

    var debugPatTableDigits8 =  new Uint8Array(256 * 8);            // 8x8
    var debugPatTableDigits16 = new Uint8Array(256 * 8 * 4);        // 16x16
    var debugPatTableBlocks =   new Uint8Array(8);                  // 8x8
    var debugBackdropValue    = 0xfe2a2a2a;

    var spritePatternTable8, spritePatternTable16;                  // Tables to use depending on Debug/Non-Debug Modes


    // Connections

    var videoSignal;

    var cpuClockPulses;
    var psgClockPulse;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        // TODO Implement
        return {
        };
    };

    this.loadState = function(s) {
        // TODO Implement
    };


    init();


    function logInfo(text) {
        console.log(text + ". Frame: " + frame + " , line: " + currentScanline);
    }


    this.eval = function(str) {
        return eval(str);
    };

};

