// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// This implementation is line-accurate
// Original base clock: 10738635 Hz which is 3x CPU clock
wmsx.V9918 = function(cpu, psg) {
    var self = this;

    function init() {
        videoSignal = new wmsx.VDPVideoSignal(signalMetrics);
        cpuClockPulses = cpu.clockPulses;
        psgClockPulse = psg.getAudioOutput().audioClockPulse;
        initFrameResources();
        initColorCodePatternValues();
        initDebugPatternTables();
        self.setDefaults();
    }

    this.connectBus = function(bus) {
        bus.connectInputDevice(0x98,  this.input98);
        bus.connectOutputDevice(0x98, this.output98);
        bus.connectInputDevice(0x99,  this.input99);
        bus.connectOutputDevice(0x99, this.output99);
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
    };

    this.input99 = function() {
        // Status Register Read
        var prevStatus = status;
        dataToWrite = null;
        status = 0;
        updateIRQ();
        return prevStatus;
    };

    this.output99 = function(val) {
        // Control Write
        if (dataToWrite === null) {
            // First write. Data to write to register or VRAM Address Pointer low
            dataToWrite = val;
        } else {
            // Second write
            if (val & 0x80) {
                // Register write
                var reg = val & 0x07;
                if (reg === 0) {
                    register0 = dataToWrite;
                    updateMode();
                } else if (reg === 1) {
                    register1 = dataToWrite;
                    updateIRQ();
                    updateMode();
                } else if (reg === 2) {
                    register2 = dataToWrite;
                    nameTableAddress = (dataToWrite & 0x0f) * 0x400;
                    vramNameTable = vram.subarray(nameTableAddress);
                } else if (reg === 3) {
                    register3 = dataToWrite;
                    colorTableAddress = dataToWrite * 0x40;
                    if (mode === 1) updateMode1Specifics();
                    vramColorTable = vram.subarray(colorTableAddress);
                } else if (reg === 4) {
                    register4 = dataToWrite;
                    patternTableAddress = (dataToWrite & 0x07) * 0x800;
                    if (mode === 1) updateMode1Specifics();
                    vramPatternTable = vram.subarray(patternTableAddress);
                } else if (reg === 5) {
                    register5 = dataToWrite;
                    spriteAttrTableAddress = (dataToWrite & 0x7f) * 0x80;
                    vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
                } else if (reg === 6) {
                    register6 = dataToWrite;
                    spritePatternTableAddress = (dataToWrite & 0x07) * 0x800;
                    updateSpritePatternTables();
                } else if (reg === 7) {
                    register7 = dataToWrite;
                    updateBackdropColor();
                }
            } else {
                // VRAM Address Pointer high and mode (r/w)
                vramWriteMode = val & 0x40;
                vramPointer = ((val & 0x3f) << 8) | dataToWrite;
            }
            dataToWrite = null;
        }
    };

    this.input98 = function() {
        dataToWrite = null;
        var res = vram[vramPointer++];            // VRAM Read
        if (vramPointer > 16383) {
            //wmsx.Util.log("VRAM Read Wrapped");
            vramPointer = 0;
        }
        return res;
    };

    this.output98 = function(val) {
        dataToWrite = null;
            vram[vramPointer++] = val;               // VRAM Write
        if (vramPointer > 16383) {
            //wmsx.Util.log("VRAM Write Wrapped");
            vramPointer = 0;
        }
    };

    this.togglePalettes = function() {
        currentPalette++;
        if (currentPalette >= palettes.length) currentPalette = 0;
        videoSignal.showOSD("Color Mode: " + palettes[currentPalette].name, true);
        setColorCodePatternValues();
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
        currentPalette = WMSX.SCREEN_MSX1_COLOR_MODE;
        spriteMode = 0;
        setDebugMode(0);        // will call setColorCodePatternValues()
    };

    this.reset = function() {
        status = 0;
        register0 = register1 = register2 = register3 = register4 = register5 = register6 = register7 = 0;
        nameTableAddress = colorTableAddress = patternTableAddress = spriteAttrTableAddress = spritePatternTableAddress = 0;
        vramNameTable = vramColorTable = vramPatternTable = vramSpriteAttrTable = vramSpritePatternTable =  vram.subarray(0);
        dataToWrite = null; vramWriteMode = false; vramPointer = 0;
        updateIRQ();
        updateMode(true);            // force
        updateBackdropColor(true);   // force
        updateSynchronization();
        currentScanline = videoStandard.startingScanline;
    };

    function setDebugMode(mode) {
        debugMode = mode;
        debugModeSpriteInfo = mode >= 2 && mode <= 3;
        debugModeSpriteInfoNames = mode === 3;
        debugModePatternInfo = mode >= 5;
        debugModePatternInfoBlocks = mode === 6;
        debugModePatternInfoNames = mode === 7;
        updateUpdateFunctions();
        updateSpritePatternTables();
        setColorCodePatternValues();
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
            if (currentScanline < 192) {
                lineClockCPUandPSG();
                while((currentScanline < 192) && (cycleLines < toCycleLine)) updateLinesActive(toScanline < 192 ? toScanline : 192);
            }

            // End of visible scan, request interrupt
            if (currentScanline === 192) triggerInterrupt();
            if (cycleLines >= toCycleLine) return;

            // Visible bottom border scanlines (8)
            if (currentScanline < 200) updateLinesBorder(toScanline < 200 ? toScanline : 200);
            if (cycleLines >= toCycleLine) return;

            // Invisible scanlines (enough to fill the remaining lines for the video standard)
            if (currentScanline < finishingScanline) updateLinesInvisible(toScanline < finishingScanline ? toScanline : finishingScanline);

            if (currentScanline === finishingScanline) finishFrame();
        }
    }

    function triggerInterrupt() {
        status |= 0x80;
        updateIRQ();
    }

    function updateIRQ() {
        cpu.INT = ((status & 0x80) && (register1 & 0x20)) ? 0 : 1;
    }

    function updateMode(forceMode1Specifics) {
        var oldMode = mode;
        mode = ((register1 & 0x18) >>> 2) | ((register0 & 0x02) >>> 1);
        if (forceMode1Specifics || ((mode === 1) !== (oldMode === 1))) {
            patternTableAddress = (register4 & 0x07) * 0x800;
            colorTableAddress = register3 * 0x40;
            if (mode === 1) updateMode1Specifics();
            vramColorTable = vram.subarray(colorTableAddress);
            vramPatternTable = vram.subarray(patternTableAddress);
        }
        updateUpdateFunctions();
        modeStable = false;
    }

    function updateMode1Specifics() {                     // Special rules for register 3 and 4 when in mode 1
        colorTableAddress &= 0x2000;
        patternTableAddress &= 0x2000;
        patternNameMask = (register4 << 8) | 0xff;        // Mask for the upper 2 bits of the 10 bits patternName
        colorNameMask = (register3 << 3) | 0x07;          // Mask for the upper 7 bits of the 10 bits color name
    }

    function updateUpdateFunctions() {
        updateLinesActive = (register1 & 0x40) === 0 ? updateLinesBlanked : debugModePatternInfo ? updateLinesDebugFunctions[mode] : updateLinesFunctions[mode];
        updateSpritesLine = updateSpritesLineFunctions[register1 & 0x03];
    }

    function updateBackdropColor(force) {
        var newColor = (register7 & 0x0f) || 1;           // Backdrop transparency is always set to Black
        if ((newColor === backdropColor) && !force) return;

        backdropColor = newColor;
        backdropValues = debugModePatternInfo ? backdropValuesDebug : colorCodePatternValues[backdropColor << 8];
        for (var i = 264; i >= 0; i -= 8) backdropFullLineValues.set(backdropValues, i);
        colorCodeStartPositions[0] = ((backdropColor << 4) | backdropColor) << 8;
        for (i = 1; i < 16; i++ ) colorCodeStartPositions[i] = ((backdropColor << 4) | i) << 8;
        for (i = 0x10; i < 0x100; i += 0x10) colorCodeStartPositions[i] = (i | backdropColor) << 8;
    }

    // 228 CPU clocks and 7,125 PSG clocks interleaved
    function lineClockCPUandPSG() {
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); // TODO 1 additional PSG clock each 8th line
    }

    function updateLinesInvisible(toLine) {
        for (var i = toLine - currentScanline; i > 0; i--)
            lineClockCPUandPSG();
        cycleLines += (toLine - currentScanline);
        currentScanline = toLine;
    }

    function updateLinesBorder(toLine) {
        var line = currentScanline, bufferPos = (line + 8) * 272;
        while (line < toLine) {
            lineClockCPUandPSG();
            frameBackBuffer.set(backdropFullLineValues, bufferPos);
            bufferPos += 272;
            // Sprites deactivated
            line++;
        }
        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesBlanked(toLine) {
        var line = currentScanline, bufferPos = (line + 8) * 272;
        modeStable = true;
        do {
            frameBackBuffer.set(backdropFullLineValues, bufferPos);
            bufferPos += 272;
            // Sprites deactivated
            line++;
            if (line >= toLine) break;
            lineClockCPUandPSG();
        } while (modeStable);
        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode0(toLine) {                                         // Graphics 1 (Screen 1)
        var patPos, patPosFinal, name, patternLine, pattern, colorCode, values;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left border
            bufferPos += 8;

            patPos = (line >>> 3) << 5;                                         // line / 8 * 32
            var lineInPattern = line & 0x07;
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++];
                patternLine = (name << 3) + lineInPattern;                      // name * 8 (8 bytes each pattern) + line inside pattern
                pattern = vramPatternTable[patternLine];
                colorCode = vramColorTable[name >>> 3];                         // name / 8 (1 color for each 8 patterns)
                values = colorCodePatternValues[colorCodeStartPositions[colorCode] + pattern];    // colorCode start + pattern
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;
            }

            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right border
            bufferPos += 8;

            updateSpritesLine(line, bufferPos - 264);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while(modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode1(toLine) {                                         // Graphics 2 (Screen 2)
        var patPos, patPosFinal, lineInPattern, name, blockExtra, patLine, pattern, colorLine, colorCode, values;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left border
            bufferPos += 8;

            patPos = (line >>> 3) << 5;                                         // line / 8 * 32
            lineInPattern = line & 0x07;
            blockExtra = (line & 0xc0) << 2;                                    // + 0x100 for each third block of the screen (8 pattern lines)
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++] | blockExtra;
                colorLine = ((name & colorNameMask) << 3) + lineInPattern;      // (8 bytes each pattern) + line inside pattern
                colorCode = vramColorTable[colorLine];
                patLine = ((name & patternNameMask) << 3) + lineInPattern;      // (8 bytes each pattern) + line inside pattern
                pattern = vramPatternTable[patLine];
                values = colorCodePatternValues[colorCodeStartPositions[colorCode] + pattern];    // colorCode start + pattern
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;
            }

            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right border
            bufferPos += 8;

            updateSpritesLine(line, bufferPos - 264);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode2(toLine) {                                         // Multicolor (Screen 3)
        var patPos, extraPatPos, patPosFinal, name, patternLine, colorCode, values;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left border
            bufferPos += 8;

            patPos = (line >>> 3) << 5;                                         // line / 8 * 32
            extraPatPos = (((line >>> 3) & 0x03) << 1) + ((line >> 2) & 0x01);  // (pattern line % 4) * 2
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++];
                patternLine = (name << 3) + extraPatPos;                        // name * 8 + extra position
                colorCode = vramPatternTable[patternLine];
                values = colorCodePatternValues[colorCodeStartPositions[colorCode] + 0xf0];   // always solid blocks of front and back colors
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;
            }

            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right border
            bufferPos += 8;

            updateSpritesLine(line, bufferPos - 264);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode4(toLine) {                                         // Text (Screen 0)
        var patPos, patPosFinal, lineInPattern, name, pattern, colorCodeValuesStart, values;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            colorCodeValuesStart = colorCodeStartPositions[register7];          // fixed text color for all line

            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left border
            bufferPos += 8;
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left text margin
            bufferPos += 8;

            patPos = (line >>> 3) * 40;                                         // line / 8 * 40
            patPosFinal = patPos + 40;
            lineInPattern = line & 0x07;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++];
                pattern = vramPatternTable[(name << 3) + lineInPattern];
                values = colorCodePatternValues[colorCodeValuesStart + pattern];
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 6;                                                 // advance 6 pixels
            }

            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right text margin
            bufferPos += 8;
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right border
            bufferPos += 8;

            // Sprites deactivated

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode0Debug(toLine) {                                    // Graphics 1 (Screen 1)
        var patPos, patPosFinal, name, pattern, colorCode, values;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            frameBackBuffer.set(backdropValues, bufferPos);
            bufferPos += 8;

            patPos = (line >>> 3) << 5;
            var lineInPattern = line & 0x07;
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++];
                if (debugModePatternInfoNames) {
                    colorCode = name === 0 || name === 0x20 ? 0x41 : 0xf1;
                    pattern = debugPatTableDigits8[name * 8 + lineInPattern];
                } else if (debugModePatternInfoBlocks) {
                    colorCode = vramColorTable[name >>> 3];
                    pattern = debugPatTableBlocks[lineInPattern];
                } else {
                    colorCode = 0xf1;
                    pattern = vramPatternTable[((name << 3) + lineInPattern)];
                }
                values = colorCodePatternValues[colorCodeStartPositions[colorCode] + pattern];
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;
            }

            frameBackBuffer.set(backdropValues, bufferPos);
            bufferPos += 8;

            updateSpritesLine(line, bufferPos - 264);
            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while(modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode1Debug(toLine) {                                    // Graphics 2 (Screen 2)
        var patPos, patPosFinal, lineInPattern, name, blockExtra, pattern, colorLine, colorCode, values;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            frameBackBuffer.set(backdropValues, bufferPos);
            bufferPos += 8;

            patPos = (line >>> 3) << 5;
            lineInPattern = line & 0x07;
            blockExtra = (line & 0xc0) << 2;
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++] | blockExtra;
                if (debugModePatternInfoNames) {
                    name &= 0xff;
                    colorCode = name === 0 || name === 0x20 ? 0x41 : 0xf1;
                    pattern = debugPatTableDigits8[name * 8 + lineInPattern];
                } else if (debugModePatternInfoBlocks) {
                    colorLine = ((name & colorNameMask) << 3) + lineInPattern;
                    colorCode = vramColorTable[colorLine];
                    pattern = debugPatTableBlocks[lineInPattern];
                } else {
                    colorCode = 0xf1;
                    pattern = vramPatternTable[(((name & patternNameMask) << 3) + lineInPattern)];
                }
                values = colorCodePatternValues[colorCodeStartPositions[colorCode] + pattern];
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;
            }

            frameBackBuffer.set(backdropValues, bufferPos);
            bufferPos += 8;

            updateSpritesLine(line, bufferPos - 264);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode2Debug(toLine) {                                    // Multicolor (Screen 3)
        if (!debugModePatternInfoNames) return updateLinesMode2(toLine);

        var patPos, patPosFinal, name, values, pattern;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left border
            bufferPos += 8;

            patPos = (line >>> 3) << 5;                                         // line / 8 * 32
            patPosFinal = patPos + 32;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++];
                pattern = debugPatTableDigits8[name * 8 + (line & 0x07)];
                values = colorCodePatternValues[colorCodeStartPositions[0xf1] + pattern];
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;
            }

            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right border
            bufferPos += 8;

            updateSpritesLine(line, bufferPos - 264);

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateLinesMode4Debug(toLine) {                                    // Text (Screen 0)
        var patPos, patPosFinal, lineInPattern, name, pattern, colorCodeValuesStart, values;
        var line = currentScanline, bufferPos = (line + 8) * 272;

        modeStable = true;
        do {
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left border
            bufferPos += 8;
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels left text margin
            bufferPos += 8;

            patPos = (line >>> 3) * 40;                                         // line / 8 * 40
            patPosFinal = patPos + 40;
            lineInPattern = line & 0x07;
            while (patPos < patPosFinal) {
                name = vramNameTable[patPos++];
                if (debugModePatternInfoNames) {
                    colorCodeValuesStart = colorCodeStartPositions[name === 0x20 ? 0x41 : 0xf1];
                    pattern = debugPatTableDigits8[name * 8 + lineInPattern];
                    values = colorCodePatternValues[colorCodeValuesStart + pattern];
                    wmsx.Util.arrayCopy(values, 0, tempValues);
                    values = tempValues;
                    // Squish digits to fit 6 pixels wide
                    if (lineInPattern <= 5) {
                        for (var i = 3; i < 6; i++) values[i] = values[i + 1] & 0x8fffffff;    // Darken the 2nd digit
                    } else if (lineInPattern === 6)
                        values[5] = 0;
                } else if (debugModePatternInfoBlocks) {
                    colorCodeValuesStart = colorCodeStartPositions[register7];  // real text color for all blocks
                    pattern = debugPatTableBlocks[lineInPattern];
                    values = colorCodePatternValues[colorCodeValuesStart + pattern];
                } else {
                    colorCodeValuesStart = colorCodeStartPositions[0xf1];
                    pattern = vramPatternTable[(name << 3) + lineInPattern];
                    values = colorCodePatternValues[colorCodeValuesStart + pattern];
                }
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 6;                                                 // advance 6 pixels
            }

            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right text margin
            bufferPos += 8;
            frameBackBuffer.set(backdropValues, bufferPos);                     // 8 pixels right border
            bufferPos += 8;

            // Sprites deactivated

            line++;
            if (line >= toLine) break;

            lineClockCPUandPSG();
        } while (modeStable);

        cycleLines += (line - currentScanline);
        currentScanline = line;
    }

    function updateSpritesLineSize0(line, bufferPos) {                      // 8x8 normal
        if (vramSpriteAttrTable[0] === 208) return;                         // Sprites deactivated

        var atrPos, colorValuesStart, patternStart, name, color, pattern, values;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        for (atrPos = 0; atrPos < 128; atrPos += 4) {                       // Max of 32 sprites
            sprite++;
            y = vramSpriteAttrTable[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 7)) || (y > line)) continue;                   // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vramSpriteAttrTable[atrPos + 1];
            color = vramSpriteAttrTable[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -7) continue;                                           // Not visible (out to the left)
            name = vramSpriteAttrTable[atrPos + 2];
            colorValuesStart = (color & 0x0f) << 8;                         // Color * 256 patterns per color
            patternStart = (!debugModeSpriteInfo ? name << 3 : (debugModeSpriteInfoNames ? name : sprite) << 3) + (line - y);
            s = x >= 0 ? 0 : -x;
            f = x <= 248 ? 8 : 256 - x;
            if (s < f) {
                pattern = spritePatternTable8[patternStart];
                values = spriteColorCodePatternValues[colorValuesStart + pattern];
                copySprite(frameBackBuffer, bufferPos + x, values, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("8x8 normal Collision");
            status |= 0x20;
        }
        if ((status & 0x40) === 0) {                                        // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status |= 0x40 | invalid;
            } else if (sprite > (status & 0x1f)) status |= sprite;
        }
    }

    function updateSpritesLineSize1(line, bufferPos) {                      // 8x8 double
        if (vramSpriteAttrTable[0] === 208) return;                         // Sprites deactivated

        var atrPos, colorValuesStart, patternStart, name, color, pattern, values;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        for (atrPos = 0; atrPos < 128; atrPos += 4) {                       // Max of 32 sprites
            sprite++;
            y = vramSpriteAttrTable[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 15)) || (y > line)) continue;                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vramSpriteAttrTable[atrPos + 1];
            color = vramSpriteAttrTable[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -15) continue;                                          // Not visible (out to the left)
            name = vramSpriteAttrTable[atrPos + 2];
            colorValuesStart = (color & 0x0f) << 8;                         // Color * 256 patterns per color
            patternStart = (!debugModeSpriteInfo ? name << 3 : (debugModeSpriteInfoNames ? name : sprite) << 3) + ((line - y) >>> 1);    // Double line height
            s = x >= 0 ? 0 : -x;
            f = x <= 240 ? 16 : 256 - x;
            if (s < f) {
                pattern = spritePatternTable8[patternStart];
                values = spriteColorCodePatternValues[colorValuesStart + pattern];
                copySprite2x(frameBackBuffer, bufferPos + x, values, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("8x8 double Collision");
            status |= 0x20;
        }
        if ((status & 0x40) === 0) {                                        // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status |= 0x40 | invalid;
            } else if (sprite > (status & 0x1f)) status |= sprite;
        }
    }

    function updateSpritesLinesSize2(line, bufferPos) {                     // 16x16 normal
        if (vramSpriteAttrTable[0] === 208) return;                         // Sprites deactivated

        var atrPos, colorValuesStart, patternStart, name, color, pattern, values;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        for (atrPos = 0; atrPos < 128; atrPos += 4) {                       // Max of 32 sprites
            sprite++;
            y = vramSpriteAttrTable[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 15)) || (y > line)) continue;                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vramSpriteAttrTable[atrPos + 1];
            color = vramSpriteAttrTable[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -15) continue;                                          // Not visible (out to the left)
            name = vramSpriteAttrTable[atrPos + 2];
            colorValuesStart = (color & 0x0f) << 8;                         // Color * 256 patterns per color
            patternStart = (!debugModeSpriteInfo ? (name & 0xfc) << 3 : (debugModeSpriteInfoNames ? name : sprite) << 5) + (line - y);
            // Left half
            s = x >= 0 ? 0 : -x;
            f = x <= 248 ? 8 : 256 - x;
            if (s < f) {
                pattern = spritePatternTable16[patternStart];
                values = spriteColorCodePatternValues[colorValuesStart + pattern];
                copySprite(frameBackBuffer, bufferPos + x, values, s, f, invalid < 0);
            }
            // Right half
            s = x >= -8 ? 0 : -8 - x;
            f = x <= 240 ? 8 : 248 - x;
            if (s < f) {
                pattern = spritePatternTable16[patternStart + 16];
                values = spriteColorCodePatternValues[colorValuesStart + pattern];
                copySprite(frameBackBuffer, bufferPos + x + 8, values, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status |= 0x20;
        }
        if ((status & 0x40) === 0) {                                        // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status |= 0x40 | invalid;
            } else if (sprite > (status & 0x1f)) status |= sprite;
        }
    }

    function updateSpritesLineSize3(line, bufferPos) {                      // 16x16 double
        if (vramSpriteAttrTable[0] === 208) return;                         // Sprites deactivated

        var atrPos, colorValuesStart, patternStart, name, color, pattern, values;
        var sprite = -1, drawn = 0, invalid = -1, y, x, s, f;
        spritesCollided = false;

        for (atrPos = 0; atrPos < 128; atrPos += 4) {                       // Max of 32 sprites
            sprite++;
            y = vramSpriteAttrTable[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            if (y >= 225) y = -256 + y;                                     // Signed value from -31 to -1
            y++;                                                            // -1 (255) is line 0 per spec, so add 1
            if ((y < (line - 31)) || (y > line)) continue;                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteModeLimit) break;
            }
            x = vramSpriteAttrTable[atrPos + 1];
            color = vramSpriteAttrTable[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (x < -31) continue;                                          // Not visible (out to the left)
            name = vramSpriteAttrTable[atrPos + 2];
            colorValuesStart = (color & 0x0f) << 8;                         // Color * 256 patterns per color
            patternStart = (!debugModeSpriteInfo ? (name & 0xfc) << 3 : (debugModeSpriteInfoNames ? name : sprite) << 5) + ((line - y) >>> 1);    // Double line height
            // Left half
            s = x >= 0 ? 0 : -x;
            f = x <= 240 ? 16 : 256 - x;
            if (s < f) {
                pattern = spritePatternTable16[patternStart];
                values = spriteColorCodePatternValues[colorValuesStart + pattern];
                copySprite2x(frameBackBuffer, bufferPos + x, values, s, f, invalid < 0);
            }
            // Right half
            s = x >= -16 ? 0 : -16 - x;
            f = x <= 224 ? 16 : 240 - x;
            if (s < f) {
                pattern = spritePatternTable16[patternStart + 16];
                values = spriteColorCodePatternValues[colorValuesStart + pattern];
                copySprite2x(frameBackBuffer, bufferPos + x + 16, values, s, f, invalid < 0);
            }
        }

        if (spritesCollided && spriteModeCollisions) {
            //wmsx.Util.log("16x16 double Collision");
            status |= 0x20;
        }
        if ((status & 0x40) === 0) {                                        // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status |= 0x40 | invalid;
            } else if (sprite > (status & 0x1f)) status |= sprite;
        }
    }

    function copySprite(dest, pos, source, start, finish, collide) {
        for (var i = start; i < finish; i++) {
            var s = source[i];
            if (s === 0) continue;
            var d = dest[pos + i];
            // Transparent sprites (color 0x01000000) just "mark" their presence setting dest Alpha to Full, so collisions can be detected
            if (d < 0xff000000) dest[pos + i] = s === 0x01000000 ? (d | 0xff000000) : s;
            else if (!spritesCollided) spritesCollided = collide;
        }
    }

    function copySprite2x(dest, pos, source, start, finish, collide) {
        for (var i = start; i < finish; i++) {
            var s = source[(i >>> 1)];
            if (s === 0) continue;
            var d = dest[pos + i];
            // Transparent sprites (color 0x01000000) just "mark" their presence setting dest Alpha to Full, so collisions can be detected
            if (d < 0xff000000) dest[pos + i] = s === 0x01000000 ? (d | 0xff000000) : s;
            else if (!spritesCollided) spritesCollided = collide;
        }
    }

    function refresh() {
        // Update frame image and send to monitor
        frameContext.putImageData(frameImageData, 0, 0);
        videoSignal.newFrame(frameCanvas, 0, 0, 272, 208);
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
        vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
        spritePatternTable8  = debugModeSpriteInfo ? debugPatTableDigits8  : vramSpritePatternTable;
        spritePatternTable16 = debugModeSpriteInfo ? debugPatTableDigits16 : vramSpritePatternTable;
    }

    function initFrameResources() {
        frameCanvas = document.createElement('canvas');
        // Maximum VPD resolution + 16 pixel borders
        frameCanvas.width = 256 + 8 + 8;          // 272
        frameCanvas.height = 192 + 8 + 8;         // 208
        frameContext = frameCanvas.getContext("2d");
        //frameImageData = frameContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
        frameImageData = frameContext.createImageData(frameCanvas.width, frameCanvas.height);
        frameBackBuffer = new Uint32Array(frameImageData.data.buffer);
    }

    function initColorCodePatternValues() {
        var sizePerColorCode = 256 * 8;
        for (var front = 0; front < 16; front++) {
            for (var pattern = 0; pattern < 256; pattern++) {
                var position = front * sizePerColorCode + pattern * 8;
                var patternValues = spriteColorValuesRaw.subarray(position, position + 8);
                spriteColorCodePatternValues[front * 256 + pattern] = patternValues;
                for (var back = 0; back < 16; back++) {
                    var colorCode = (front << 4) + back;
                    position = colorCode * sizePerColorCode + pattern * 8;
                    patternValues = colorValuesRaw.subarray(position, position + 8);
                    colorCodePatternValues[colorCode * 256 + pattern] = patternValues;
                    // colorCode translation
                    if (pattern === 0) colorCodeStartPositions[colorCode] = colorCode * 256;
                }
            }
        }
    }

    function setColorCodePatternValues() {
        var colorRGBs = debugMode >= 1 && debugMode <= 3  ? colorsDim : palettes[currentPalette].colors;
        var spriteColorTransp = debugModeSpriteInfo ? 0xfe00f8f8 : 0x01000000;
        var spriteColorBack   = debugModeSpriteInfo ? 0xfe501616 : 0;
        for (var front = 0; front < 16; front++) {
            var colorFront = colorRGBs[front];
            var spriteColorFront = palettes[currentPalette].colors[front] | 0xff000000;     // Always full alpha
            for (var pattern = 0; pattern < 256; pattern++) {
                for (var back = 0; back < 16; back++) {
                    var colorBack = colorRGBs[back];
                    var colorCode = (front << 4) + back;
                    var patternValues = colorCodePatternValues[colorCode * 256 + pattern];
                    var spritePatternValues = back === 0 ? spriteColorCodePatternValues[front * 256 + pattern] : null;
                    for (var bit = 7; bit >= 0; bit--) {
                        var pixel = (pattern >>> bit) & 1;
                        patternValues[7 - bit] = pixel ? colorFront : colorBack;
                        if (!spritePatternValues) continue;
                        // Full Alpha front color or Special Transparent for Sprites
                        if (pixel) spritePatternValues[7 - bit] = (debugMode >= 4) || (front === 0) ? spriteColorTransp : spriteColorFront;
                        else spritePatternValues[7 - bit] = spriteColorBack;
                    }
                }
            }
        }
        updateBackdropColor(true);  // force
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


    // Registers, pointers, control data

    var desiredBaseFrequency;       // Will depend on VideoStandard and detected Host Native Video Frequency

    var videoStandard;
    var vSynchMode;
    var currentScanline;
    var startingScanline;
    var finishingScanline;
    var cycleLines;
    var cycleTotalLines;
    var pulldownFirstFrameStartingLine;
    var refreshPending;

    var register0, register1, register2, register3, register4, register5, register6, register7;

    var status;
    var mode;
    var modeStable;
    var spritesCollided;

    var dataToWrite;
    var vramPointer = 0;
    var vramWriteMode = false;

    var backdropColor = -1;
    var backdropValues;
    var backdropFullLineValues = new Uint32Array(34 * 8);

    var nameTableAddress = 0;
    var colorTableAddress = 0;
    var patternTableAddress = 0;
    var spriteAttrTableAddress = 0;
    var spritePatternTableAddress = 0;

    var patternNameMask, colorNameMask;     // Special masks from register3 and register4 for mode 1 only

    var updateLinesFunctions =       [updateLinesMode0, updateLinesMode1, updateLinesMode2, updateLinesBlanked, updateLinesMode4, updateLinesBlanked, updateLinesBlanked, updateLinesBlanked];
    var updateLinesDebugFunctions =  [updateLinesMode0Debug, updateLinesMode1Debug, updateLinesMode2Debug, updateLinesBlanked, updateLinesMode4Debug, updateLinesBlanked, updateLinesBlanked, updateLinesBlanked];
    var updateSpritesLineFunctions = [updateSpritesLineSize0, updateSpritesLineSize1, updateSpritesLinesSize2, updateSpritesLineSize3 ];

    var updateLinesActive;                  // Update function for current mode
    var updateSpritesLine;                  // Update function for current mode

    var tempValues = new Uint32Array(8);    // Temporary storage for modified pattern values

    // VRAM

    var vram = new Uint8Array(16384);
    var vramNameTable = vram;
    var vramColorTable = vram;
    var vramPatternTable = vram;
    var vramSpriteAttrTable = vram;
    var vramSpritePatternTable = vram;
    this.vram = vram;

    // Planes as off-screen canvas

    var frameCanvas, frameContext, frameImageData, frameBackBuffer;

    // Palettes

    var colorsMSX1 =   new Uint32Array([ 0x00000000, 0xfe000000, 0xfe40c820, 0xfe78d858, 0xfee85050, 0xfef47078, 0xfe4850d0, 0xfef0e840, 0xfe5050f4, 0xfe7878f4, 0xfe50c0d0, 0xfe80c8e0, 0xfe38b020, 0xfeb858c8, 0xfec8c8c8, 0xfeffffff ]);
    var colorsMSX2 =   new Uint32Array([ 0x00000000, 0xfe000000, 0xfe20d820, 0xfe68f468, 0xfef42020, 0xfef46848, 0xfe2020b0, 0xfef4d848, 0xfe2020f4, 0xfe6868f4, 0xfe20d8d8, 0xfe90d8d8, 0xfe209020, 0xfeb048d8, 0xfeb0b0b0, 0xfefbfbfb ]);
    var colorsMSXPB =  new Uint32Array([ 0x00000000, 0xfe000000, 0xfe808080, 0xfea0a0a0, 0xfe5c5c5c, 0xfe7c7c7c, 0xfe707070, 0xfeb0b0b0, 0xfe7c7c7c, 0xfe989898, 0xfeb0b0b0, 0xfec0c0c0, 0xfe707070, 0xfe808080, 0xfec4c4c4, 0xfefbfbfb ]);
    var colorsMSXGR =  new Uint32Array([ 0x00000000, 0xfe000000, 0xfe108010, 0xfe10a010, 0xfe105c10, 0xfe107c10, 0xfe107010, 0xfe10b010, 0xfe107c10, 0xfe109810, 0xfe10b010, 0xfe10c010, 0xfe107010, 0xfe107c10, 0xfe10c010, 0xfe10f810 ]);
    var colorsMSXAB =  new Uint32Array([ 0x00000000, 0xfe000000, 0xfe005880, 0xfe006ca0, 0xfe00405c, 0xfe00547c, 0xfe004c70, 0xfe0078b0, 0xfe00547c, 0xfe006898, 0xfe0078b0, 0xfe0084c0, 0xfe004c70, 0xfe005880, 0xfe0084c4, 0xfe00abfa ]);
    var colorsMSX1VV = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe28ca07, 0xfe65e23d, 0xfef04444, 0xfef46d70, 0xfe1330d0, 0xfef0e840, 0xfe4242f3, 0xfe7878f4, 0xfe30cad0, 0xfe89dcdc, 0xfe20a906, 0xfec540da, 0xfebcbcbc, 0xfeffffff ]);
    var colorsDim   =  new Uint32Array([ 0x50505050, 0x50505050, 0x50808080, 0x50a0a0a0, 0x50606060, 0x507c7c7c, 0x50707070, 0x50b0b0b0, 0x507c7c7c, 0x50989898, 0x50b0b0b0, 0x50c0c0c0, 0x50707070, 0x50808080, 0x50c4c4c4, 0x50fbfbfb ]);
    //var colorsMyMSX1 = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe42c821, 0xfe78dc5e, 0xfeed5554, 0xfefc767d, 0xfe4d52d4, 0xfef5eb42, 0xfe5455fc, 0xfe7879ff, 0xfe54c1d4, 0xfe80cee6, 0xfe3bb021, 0xfeba5bc9, 0xfecccccc, 0xfeffffff ]);
    //var colorsMyMSX2 = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe20db20, 0xfe6dff6d, 0xfeff2020, 0xfeff6d30, 0xfe2020b6, 0xfeffdb49, 0xfe2020ff, 0xfe6d6dff, 0xfe20dbdb, 0xfe92dbdb, 0xfe209220, 0xfeb649db, 0xfeb6b6b6, 0xfeffffff ]);

    var palettes = [
        { name : "MSX1", colors: colorsMSX1VV },
        { name: "MSX1 Soft", colors: colorsMSX1 },
        { name: "MSX2", colors: colorsMSX2 },
        { name: "Black & White", colors: colorsMSXPB}, { name: "Green Phosphor", colors: colorsMSXGR}, { name: "Amber", colors: colorsMSXAB }
    ];

    var currentPalette = 0;

    // Pre calculated 8-pixel RGBA values for all color and 8-bit pattern combinations (actually ABRG endian)
    // Pattern plane paints with these colors (Alpha = 0xfe), Sprite planes paint with Full Alpha = 0xff

    var colorValuesRaw = new Uint32Array(16 * 16 * 256 * 8);        // 16 front colors * 16 back colors * 256 patterns * 8 pixels
    var colorCodePatternValues = new Array(256 * 256);              // 256 colorCodes * 256 patterns

    var spriteColorValuesRaw = new Uint32Array(16 * 256 * 8);       // 16 colors * 256 patterns * 8 pixels
    var spriteColorCodePatternValues = new Array(16 * 256);         // 16 colorCodes * 256 patterns

    var colorCodeStartPositions = new Array(256);                   // Translates colorCodes considering the backdrop color, already * 8 (point to start of values)

    var backdropValuesDebug = new Uint32Array([ 0xfe2a2a2a, 0xfe2a2a2a, 0xfe2a2a2a, 0xfe2a2a2a, 0xfe2a2a2a, 0xfe2a2a2a, 0xfe2a2a2a, 0xfe2a2a2a ]);

   // Sprite and Debug Modes controls

    var debugMode;
    var debugModeSpriteInfo, debugModeSpriteInfoNames;
    var debugModePatternInfo, debugModePatternInfoBlocks, debugModePatternInfoNames;

    var spriteMode;
    var spriteModeLimit = true;
    var spriteModeCollisions = true;

    var debugPatTableDigits8  = new Uint8Array(256 * 8);            // 8x8
    var debugPatTableDigits16 = new Uint8Array(256 * 8 * 4);        // 16x16
    var debugPatTableBlocks   = new Uint8Array(8);                  // 8x8

    var spritePatternTable8, spritePatternTable16;                  // Tables to use depending on Debug/Non-Debug Modes

    var signalMetrics = { width: 256, height: 192, totalWidth: 272, totalHeight: 208 };     // Fixed for all modes


    // Connections

    var videoSignal;

    var cpuClockPulses;
    var psgClockPulse;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: status, m: mode, l: currentScanline,
            r0: register0, r1: register1, r2: register1, r3: register3, r4: register4, r5: register1, r6: register1, r7: register7,
            nt: nameTableAddress, ct: colorTableAddress, pt: patternTableAddress, sat: spriteAttrTableAddress, spt: spritePatternTableAddress,
            d: dataToWrite, vp: vramPointer, vw: vramWriteMode,
            vram: wmsx.Util.compressArrayToStringBase64(vram)
        };
    };

    this.loadState = function(s) {
        status = s.s; currentScanline = s.l || startingScanline;
        register0 = s.r0; register1 = s.r1; register2 = s.r2 || 0; register3 = s.r3; register4 = s.r4; register5 = s.r5 || 0; register6 = s.r6 || 0;  register7 = s.r7;
        nameTableAddress = s.nt; colorTableAddress = s.ct; patternTableAddress = s.pt; spriteAttrTableAddress = s.sat; spritePatternTableAddress = s.spt;
        dataToWrite = s.d; vramPointer = s.vp; vramWriteMode = s.vw;
        vram = wmsx.Util.uncompressStringBase64ToArray(s.vram);         // Already UInt8Array
        vramNameTable = vram.subarray(nameTableAddress);
        vramColorTable = vram.subarray(colorTableAddress);
        vramPatternTable = vram.subarray(patternTableAddress);
        vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
        updateSpritePatternTables();
        updateIRQ();
        updateMode(true);           // force
        updateBackdropColor();
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};

