// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// This implementation is line-accurate
// Commands run instantaneously (take 0 cycles)
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
        mode = 0; modeData = modes[mode];
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
        // Generate correct amount of lines per cycle, according to the current pulldown cadence
        frameEvents();

        // Finish audio signal (generate any missing samples to adjust to sample rate)
        psg.getAudioOutput().finishFrame();

        // Send updated image to Monitor if needed
        if (refreshPending) refresh();
    };

    this.input98 = function() {
        // VRAM Read
        dataToWrite = null;
        var res = vram[vramPointer++];
        if (vramPointer === vramLimit) {
            //wmsx.Util.log("VRAM Read Wrapped, vramPointer: " + vramPointer.toString(16) + ", register14: " + register[14].toString(16));
            vramPointer &= vramLimit;
        }
        return res;
    };

    this.output98 = function(val) {

        //wmsx.Util.log("VRAM Write: " + val.toString(16) + " at: " + vramPointer.toString(16));

        // VRAM Write
        dataToWrite = null;
        vram[vramPointer++] = val;
        if (vramPointer === vramLimit) {
            //wmsx.Util.log("VRAM Write Wrapped, vramPointer: " + vramPointer.toString(16) + ", register14: " + register[14].toString(16));
            vramPointer &= vramLimit;
        }
    };

    this.input99 = function() {
        // Status Register Read
        dataToWrite = null;
        var reg = register[15];
        var prevStatus = status[reg];

        //if (reg < 2) logInfo("Reading status " + reg + ", " + prevStatus.toString(16));

        switch(reg) {
            case 0:
                status[0] = 0; updateIRQ(); break;
            case 1:
                status[1] &= ~0x81;                     // FL = 0
                if ((register[0] & 0x10) && (status[1] & 0x01)) {
                    status[1] &= ~0x01;                // FH = 0, only if interrupts are enabled (IE1 = 1)
                    updateIRQ();
                }
                break;
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
                vramPointer = ((register[14] & 0x07) << 14) | ((val & 0x3f) << 8) | dataToWrite;

                //console.log("Setting via out: " + val.toString(16) + ". VRAM Pointer: " + vramPointer.toString(16) + ". reg14: " + register[14].toString(16));

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
        if (reg !== 17) registerWrite(reg, val);
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

    this.toggleSpriteDebugModes = function() {
        spriteDebugMode = ++spriteDebugMode % 4;
        spriteDebugModeLimit = (spriteDebugMode === 0) || (spriteDebugMode === 2);
        spriteDebugModeCollisions = spriteDebugMode < 2;
        videoSignal.showOSD("Sprites Mode" + (spriteDebugMode > 0 ? " " + spriteDebugMode : "") + ": "
            + ["Normal", "Unlimited", "NO Collisions", "Unlimited, No Collisions"][spriteDebugMode], true);
    };

    this.setDefaults = function() {
        spriteDebugMode = 0;
        setDebugMode(0);
    };

    this.reset = function() {
        frame = 0;
        wmsx.Util.arrayFill(status, 0);
        wmsx.Util.arrayFill(register, 0);
        wmsx.Util.arrayFill(paletteRegister, 0);
        nameTableAddress = colorTableAddress = patternTableAddress = spriteAttrTableAddress = spritePatternTableAddress = 0;
        nameTableAddressMask = colorTableAddressMask = patternTableAddressMask = spriteAttrTableAddressMask = spritePatternTableAddressMask = -1;
        vramLimit = VRAM_LIMIT_9938; dataToWrite = null; vramPointer = 0; paletteFirstWrite = null;
        executingCommandHandler = null;
        currentScanline = videoStandard.startingScanline;
        backdropColor = 0;
        sprites2Enabled = true;
        initColorPalette();
        updateIRQ();
        updateMode();
        updateLineFunctions();
        updateSpriteFunctions();
        updateBackdropValue();
        updateSynchronization();
    };

    function registerWrite(reg, val) {
        if (reg > 46) return;
        var add;
        var old = register[reg];
        register[reg] = val;

        //logInfo((source || "") + "Reg: " + reg + " = " + val.toString(16) + ", was: " + old.toString(16));

        switch (reg) {
            case 0:

                //if (val !== old) logInfo("Register0: " + val.toString(16));

                if ((val & 0x10) !== (old & 0x10)) updateIRQ();                             // IE1
                if ((val & 0x0e) !== (old & 0x0e)) updateMode();                            // Mx
                break;
            case 1:

                //if (val !== old) logInfo("Register1: " + val.toString(16));

                if ((val & 0x20) !== (old & 0x20)) updateIRQ();                             // IE0
                if ((val & 0x18) !== (old & 0x18)) updateMode();                            // Mx
                else if ((val & 0x40) !== (old & 0x40)) updateLineFunctions();              // BL. Already ok if mode was updated
                if ((val & 0x03) !== (old & 0x03)) updateSpriteFunctions();                 // SI, MAG
                break;
            case 2:
                add = (val << 10) & 0x1ffff;
                nameTableAddress = add & modeData.nameTBase;
                nameTableAddressMask = add & ~modeData.nameTBase | nameTableAddressBaseMask;

                //logInfo("Setting: " + val.toString(16) + " to NameTableAddress: " + nameTableAddress.toString(16));

                break;
            case 3:
            case 10:
                add = ((register[10] << 14) | (register[3] << 6)) & 0x1ffff ;
                colorTableAddress = add & modeData.colorTBase;
                colorTableAddressMask = add & ~modeData.colorTBase | colorTableAddressBaseMask;
                break;
            case 4:
                add = (val << 11) & 0x1ffff ;
                patternTableAddress = add & modeData.patTBase;
                patternTableAddressMask = add & ~modeData.patTBase | patternTableAddressBaseMask;
                break;
            case 5:
            case 11:
                add = ((register[11] << 15) | (register[5] << 7)) & 0x1ffff ;
                spriteAttrTableAddress = add & modeData.sprAttrTBase;
                spriteAttrTableAddressMask = add & ~modeData.sprAttrTBase | modeData.sprAttrTBaseM;

                //logInfo("SpriteAttrTable: " + spriteAttrTableAddress.toString(16));

                break;
            case 6:
                add = (val << 11) & 0x1ffff ;
                spritePatternTableAddress = add & modeData.sprPatTBase;
                spritePatternTableAddressMask = add & ~modeData.sprPatTBase | spritePatternTableAddressBaseMask;
                updateSpritePatternTables();

                //logInfo("SpritePatTable: " + spritePatternTableAddress.toString(16));

                break;
            case 7:
                if ((val & 0x0f) !== (old & 0x0f)) updateBackdropColor();                   // BD
                break;
            case 8:
                if ((val & 0x20) !== (old & 0x20)) updateTransparency();                    // TP
                if ((val & 0x02) !== (old & 0x02)) sprites2Enabled = (val & 0x02) === 0;    // SPD
                break;
            case 9:
                if ((val & 0x80) !== (old & 0x80)) updateSignalMetrics();                   // LN
                break;
            case 14:
                // VRAM Address Pointer high (A16-A14)
                vramPointer = ((val & 0x07) << 14) | (vramPointer & 0x3fff);

                //console.log("Setting reg14: " + val.toString(16) + ". VRAM Pointer: " + vramPointer.toString(16));

                break;
            case 16:
                paletteFirstWrite = null;
                break;
            case 19:
                horizontalIntLine = (val - register[23]) & 255;

                //logInfo("Line Interrupt set: " + val);

                break;
            case 23:
                horizontalIntLine = (register[19] - val) & 255;

                //logInfo("Vertical offset set: " + val);

                break;
            case 44:
                if (executingCommandHandler) executingCommandHandler(val);
                break;
            case 46:

                //console.log(">>>> VDP Command: " + val.toString(16));

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
        cycleTotalLines = videoStandard.pulldowns[desiredBaseFrequency].linesPerCycle;      // Always generate this amount of lines per cycle
        pulldownFirstFrameLinesAdjust = videoStandard.pulldowns[desiredBaseFrequency].firstFrameLinesAdjust;      // Unless its the first pulldown frame and is adjusted
    }

    // Total frame lines: 262 for NTSC, 313 for PAL
    // Total frame CPU clocks: 59736 for NTSC, 71364 for PAL
    function frameEvents() {
        // Adjust for pulldown cadence if this frame is the first pulldown frame
        var totalLines = cycleTotalLines + (currentScanline === startingScanline ? pulldownFirstFrameLinesAdjust : 0);

        for (var i = 0; i < totalLines; i++) {
            lineEvents();
            if ((currentScanline >= 0) && (currentScanline < finishingActiveScanline)) {
                updateLineActive();
            } else if ((currentScanline >= finishingBottomBorderScanline) && (currentScanline < finishingScanline)) {
                if (currentScanline === (finishingScanline - 1)) {
                    finishFrame();
                    continue;
                }
            } else {
                updateLineBlanked();
            }
            currentScanline++;
        }
    }

    // Total line clocks: VDP: 1368, CPU: 228 CPU, PSG 7.125 PSG
    // Timing should be different for mode T1 and T2 since borders are wider. Ignoring for now.
    // This implementation starts each scanline at the Beginning of the Right Border, and ends with the Ending of the Visible Display
    function lineEvents() {
        // Right border: 59 clocks
        // Right erase: 27 clocks
        // Sync signal: 100 clocks
        // Left erase: 102 clocks

        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(15);

        // Left border: 56 clocks
        if (currentScanline === -1) status[2] &= ~0x40;                                     // VR = 0 at the scanline before first visible scanline
        if (currentScanline === finishingActiveScanline) triggerVerticalInterrupt();        // F = 1, VR = 1 at the scanline after last visible scanline
        if ((status[1] & 0x01) && ((register[0] & 0x10) === 0))  status[1] &= ~0x01;        // FH = 0 if interrupts disabled (IE1 = 0)

        cpuClockPulses(9);

        // Visible Display: 1024 clocks
        status[2] &= ~0x20;                                                                 // HR = 0

        cpuClockPulses(8);  psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse(); cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(33); psgClockPulse();

        // End of Visible Display

        status[2] |= 0x20;                                                                  // HR = 1
        if (currentScanline === horizontalIntLine) triggerHorizontalInterrupt();            // FH = 1 at the horizontal interrupt line

        // TODO 1 additional PSG clock each 8 lines
    }

    function triggerVerticalInterrupt() {
        status[2] |= 0x40;                  // VR = 1
        if ((status[0] & 0x80) === 0) {
            status[0] |= 0x80;              // F = 1
            updateIRQ();
        }

        //logInfo("Bottom Line reached. Ints " + ((register[1] & 0x20) ?  "ENABLED" : "disabled"));

    }

    function triggerHorizontalInterrupt() {
        if ((status[1] & 0x01) === 0) {
            status[1] |= 0x01;              // FH = 1
            updateIRQ();
        }

        //logInfo("Horizontal Int Line reached. Ints " + ((register[0] & 0x10) ?  "ENABLED" : "disabled"));

    }

    function updateIRQ() {
        if (((status[0] & 0x80) && (register[1] & 0x20))            // F === 1 and IE0 === 1
            || ((status[1] & 0x01) && (register[0] & 0x10))) {      // FH === 1 and IE1 === 1
            cpu.setINT(0);
        } else {
            cpu.setINT(1);
        }

        //if ((status[0] & 0x80) && (register[1] & 0x20)) logInfo(">>>>  INT VERTICAL");
        //if ((status[1] & 0x01) && (register[0] & 0x10)) logInfo(">>>>  INT HORIZONTAL");
    }

    function updateMode() {
        var add;
        var oldMode = mode;
        mode = (register[1] & 0x18) | ((register[0] & 0x0e) >>> 1);
        modeData = modes[mode];

        //console.log("Update Mode: " + mode.toString(16));

        // Adjust VRAM address limits based on mode (9938 vs 9918 modes)
        vramLimit = (mode & 0x19) === mode ? VRAM_LIMIT_9918 : VRAM_LIMIT_9938;

        // Update Tables base addresses
        add = (register[2] << 10) & 0x1ffff;
        nameTableAddress = add & modeData.nameTBase;
        nameTableAddressMask = add & ~modeData.nameTBase | nameTableAddressBaseMask;
        add = ((register[10] << 14) | (register[3] << 6)) & 0x1ffff ;
        colorTableAddress = add & modeData.colorTBase;
        colorTableAddressMask = add & ~modeData.colorTBase | colorTableAddressBaseMask;
        add = (register[4] << 11) & 0x1ffff ;
        patternTableAddress = add & modeData.patTBase;
        patternTableAddressMask = add & ~modeData.patTBase | patternTableAddressBaseMask;
        add = ((register[11] << 15) | (register[5] << 7)) & 0x1ffff ;
        spriteAttrTableAddress = add & modeData.sprAttrTBase;
        spriteAttrTableAddressMask = add & ~modeData.sprAttrTBase | modeData.sprAttrTBaseM;
        add = (register[6] << 11) & 0x1ffff ;
        spritePatternTableAddress = add & modeData.sprPatTBase;
        spritePatternTableAddressMask = add & ~modeData.sprPatTBase | spritePatternTableAddressBaseMask;
        updateSpritePatternTables();

        updateSignalMetrics();
        updateLineFunctions();
        updateSpriteFunctions();
        nameTableLineSize = modeData.nameLineSize;
        if ((mode === 4) || (oldMode === 4)) updateBackdropCaches();
    }

    function updateSignalMetrics() {
        signalMetrics = register[9] & 0x80 ? modeData.sigMetricsExt : modeData.sigMetrics;
        finishingActiveScanline = signalMetrics.height;
        finishingBottomBorderScanline = finishingActiveScanline + 8;
        videoSignal.setSignalMetrics(signalMetrics);
    }

    function updateLineFunctions() {

        //logInfo("Blank " + ((register[1] & 0x40) === 0 ? "ON" : "OFF"));

        updateLineActive = (register[1] & 0x40) === 0 ? updateLineBlanked : debugModePatternInfo ? modeData.updLineDeb : modeData.updLine;
        blankedLineValues = modeData.blankedLineValues;
    }

    function updateSpriteFunctions() {
        var mode = modeData.spriteMode;
        updateSpritesLine = mode === 1 ? updateSpritesLineFunctionsMode1[register[1] & 0x03] : mode === 2 ? updateSpritesLineFunctionsMode2[register[1] & 0x03] : null;
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

    function updateLineBlanked() {
        var bufferPos = (currentScanline + 8) * 544;
        frameBackBuffer.set(blankedLineValues, bufferPos);
        // Sprites deactivated
    }

    function updateLineModeT1() {                                           // Text (Screen 0 width 40)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;
        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + (realLine >>> 3) * 40;              // line / 8 * 40
        var patPosFinal = patPos + 40;
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var colorCode = register[7];                                        // fixed text color for all line
        var on =  colorPalette[colorCode >>> 4];
        var off = colorPalette[colorCode & 0xf];
        while (patPos < patPosFinal) {
            var name = vram[patPos++];
            var pattern = vram[(name << 3) + lineInPattern];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 6;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8;
        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        // Sprites deactivated
    }

    function updateLineModeT2() {                                           // Text (Screen 0 width 80)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop16(bufferPos);
        bufferPos += 16;
        paintBackdrop16(bufferPos);
        bufferPos += 16;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + (realLine >>> 3) * 80;              // line / 8 * 80
        var patPosFinal = patPos + 80;
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var colorCode = register[7];                                        // fixed text color for all line
        var on =  colorPalette[colorCode >>> 4];
        var off = colorPalette[colorCode & 0xf];
        while (patPos < patPosFinal) {
            var name = vram[patPos++];
            var pattern = vram[(name << 3) + lineInPattern];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 6;
        }

        paintBackdrop16(bufferPos);
        bufferPos += 16;
        paintBackdrop16(bufferPos);
        bufferPos += 16;

        // Sprites deactivated
    }

    function updateLineModeMC() {                                           // Multicolor (Screen 3)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + ((realLine >>> 3) << 5);            // line / 8 * 32
        var patPosFinal = patPos + 32;
        var extraPatPos = patternTableAddress + (((realLine >>> 3) & 0x03) << 1) + ((realLine >> 2) & 0x01);    // (pattern line % 4) * 2
        while (patPos < patPosFinal) {
            var name = vram[patPos++];
            var patternLine = (name << 3) + extraPatPos;                    // name * 8 + extra position
            var colorCode = vram[patternLine];
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, 0xf0, on, off);                 // always solid blocks of front and back colors;
            bufferPos += 8;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG1() {                                           // Graphics 1 (Screen 1)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + ((realLine >>> 3) << 5);            // line / 8 * 32
        var patPosFinal = patPos + 32;
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        while (patPos < patPosFinal) {
            var name = vram[patPos++];
            var pattern = vram[((name << 3) + lineInPattern)];              // name * 8 (8 bytes each pattern) + line inside pattern
            var colorCode = vram[colorTableAddress + (name >>> 3)];         // name / 8 (1 color for each 8 patterns)
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG2() {                                           // Graphics 2 (Screen 2)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + ((realLine >>> 3) << 5);            // line / 8 * 32
        var patPosFinal = patPos + 32;
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var lineInColor = colorTableAddress + (realLine & 0x07);
        var blockExtra = (realLine & 0xc0) << 2;                            // + 0x100 for each third block of the screen (8 pattern lines)
        while (patPos < patPosFinal) {
            var name = vram[patPos++] | blockExtra;
            var pattern = vram[(name << 3) + lineInPattern];
            var colorCode = vram[(name << 3) + lineInColor];                // (8 bytes each pattern) + line inside pattern
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG3() {                                           // Graphics 3 (Screen 4)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + ((realLine >>> 3) << 5);            // line / 8 * 32
        var patPosFinal = patPos + 32;
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var lineInColor = colorTableAddress + (realLine & 0x07);
        var blockExtra = (realLine & 0xc0) << 2;                            // + 0x100 for each third block of the screen (8 pattern lines)
        while (patPos < patPosFinal) {
            var name = vram[patPos++] | blockExtra;
            var pattern = vram[(name << 3) + lineInPattern];
            var colorCode = vram[(name << 3) + lineInColor];                // (8 bytes each pattern) + line inside pattern
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        if (sprites2Enabled) updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG4() {                                           // Graphics 4 (Screen 5)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var pixelsPos = nameTableAddress + (realLine << 7);
        var pixelsPosFinal = pixelsPos + 128;
        while (pixelsPos < pixelsPosFinal) {
            var pixels = vram[pixelsPos++];
            frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 4];
            frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x0f];
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        if (sprites2Enabled) updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG5() {                                           // Graphics 5 (Screen 6)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop16G5(bufferPos);
        bufferPos += 16;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var pixelsPos = nameTableAddress + (realLine << 7);
        var pixelsPosFinal = pixelsPos + 128;
        while (pixelsPos < pixelsPosFinal) {
            var pixels = vram[pixelsPos++];
            frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 6];
            frameBackBuffer[bufferPos++] = colorPalette[(pixels >>> 4) & 0x03];
            frameBackBuffer[bufferPos++] = colorPalette[(pixels >>> 2) & 0x03];
            frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x03];
        }

        paintBackdrop16G5(bufferPos);
        bufferPos += 16;

        if (sprites2Enabled) updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG6() {                                           // Graphics 6 (Screen 7)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 16;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var pixelsPos = nameTableAddress + (realLine << 8);
        var pixelsPosFinal = pixelsPos + 256;
        while (pixelsPos < pixelsPosFinal) {
            var pixels = vram[pixelsPos++];
            frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 4];
            frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x0f];
        }

        paintBackdrop16G5(bufferPos);
        bufferPos += 16;

        if (sprites2Enabled) updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG7() {                                           // Graphics 7 (Screen 8)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var pixelsPos = nameTableAddress + (realLine << 8);                 // consider the scan start offset in reg23
        var pixelsPosFinal = pixelsPos + 256;
        while (pixelsPos < pixelsPosFinal) {
            frameBackBuffer[bufferPos++] = colors256[vram[pixelsPos++]];
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        if (sprites2Enabled) updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeT1Debug() {                                      // Text (Screen 0)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;
        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + ((realLine >>> 3) * 40);            // line / 8 * 40
        var patPosFinal = patPos + 40;
        var lineInPattern = realLine & 0x07;
        while (patPos < patPosFinal) {
            var name = vram[patPos++];
            if (debugModePatternInfoNames) {
                var colorCode = name === 0x20 ? 0x41 : 0xf1;
                var pattern = debugPatTableDigits8[name * 8 + lineInPattern];
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
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 6;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8;
        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        // Sprites deactivated
    }

    function updateLineModeMCDebug() {                                      // Multicolor (Screen 3)
        if (!debugModePatternInfoNames) return updateLineModeMC();

        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + ((realLine >>> 3) << 5);            // line / 8 * 32
        var patPosFinal = patPos + 32;
        while (patPos < patPosFinal) {
            var name = vram[patPos++];
            var pattern = debugPatTableDigits8[name * 8 + (realLine & 0x07)];
            var colorCode = 0xf1;
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG1Debug() {                                      // Graphics 1 (Screen 1)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var patPos = nameTableAddress + ((realLine >>> 3) << 5);
        var patPosFinal = patPos + 32;
        var lineInPattern = realLine & 0x07;
        while (patPos < patPosFinal) {
            var name = vram[patPos++];
            if (debugModePatternInfoNames) {
                var colorCode = name === 0 || name === 0x20 ? 0x41 : 0xf1;
                var pattern = debugPatTableDigits8[name * 8 + lineInPattern];
            } else if (debugModePatternInfoBlocks) {
                colorCode = vram[colorTableAddress + (name >>> 3)];
                pattern = debugPatTableBlocks[lineInPattern];
            } else {
                colorCode = 0xf1;
                pattern = vram[patternTableAddress + (name << 3) + lineInPattern];
            }
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        updateSpritesLine(realLine, bufferPos - 264 - 272);
    }

    function updateLineModeG2Debug() {                                      // Graphics 2 (Screen 2)
        var bufferPos = (currentScanline + 8) * 544;

        paintBackdrop8(bufferPos);
        bufferPos += 8;

        var realLine = (currentScanline + register[23]) & 255;              // consider the scan start offset in reg23
        var lineInPattern = realLine & 0x07;
        var blockExtra = (realLine & 0xc0) << 2;
        var patPos = nameTableAddress + ((realLine >>> 3) << 5);
        var patPosFinal = patPos + 32;
        while (patPos < patPosFinal) {
            var name = vram[patPos++] | blockExtra;
            if (debugModePatternInfoNames) {
                name &= 0xff;
                var colorCode = name === 0 || name === 0x20 ? 0x41 : 0xf1;
                var pattern = debugPatTableDigits8[name * 8 + lineInPattern];
            } else if (debugModePatternInfoBlocks) {
                colorCode = vram[(colorTableAddress + (name << 3) + lineInPattern)];
                pattern = debugPatTableBlocks[lineInPattern];
            } else {
                colorCode = 0xf1;
                pattern = vram[patternTableAddress + (name << 3) + lineInPattern];
            }
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        paintBackdrop8(bufferPos);
        bufferPos += 8 + 272;

        updateSpritesLine(realLine, bufferPos - 264 + 272);
    }

    function paintPattern(bufferPos, pattern, on, off) {
        frameBackBuffer[bufferPos++] = pattern & 0x80 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x40 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x20 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x10 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x08 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x04 ? on : off;
        frameBackBuffer[bufferPos++] = pattern & 0x02 ? on : off;
        frameBackBuffer[bufferPos] =   pattern & 0x01 ? on : off;
    }

    function paintBackdrop8(bufferPos) {
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos++] = backdropValue;
        frameBackBuffer[bufferPos] =   backdropValue;
    }

    function paintBackdrop16(bufferPos) {
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

    function paintBackdrop16G5(bufferPos) {
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

        var atrPos, name, color, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;


        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 7) continue;                                   // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -7) continue;                                       // Not visible (out to the left)
            }
            color &= 0x0f;
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + (name << 3) + spriteLine;
            pattern = vram[lineInPattern];
            s = x <= 248 ? 0 : x - 248;
            f = x >= 0 ? 8 : 8 + x;
            paintSprite1(frameBackBuffer, bufferPos + x + (8 - f), pattern, color, s, f, invalid < 0);
        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("8x8 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                     // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function updateSprites1LineSize1(line, bufferPos) {                     // Mode 1, 8x8 double
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, name, color, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 15) continue;                                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) x -= 32;                                      // Early Clock bit, X to be 32 to the left
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -15) continue;                                      // Not visible (out to the left)
            }
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + (name << 3) + (spriteLine >>> 1);    // Double line height
            pattern = vram[lineInPattern];
            s = x <= 240 ? 0 : x - 240;
            f = x >= 0 ? 16 : 16 + x;
            paintSprite1D(frameBackBuffer, bufferPos + x + (16 - f), pattern, color, s, f, invalid < 0);

        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("8x8 double Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                      // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function updateSprites1LineSize2(line, bufferPos) {                     // Mode 1, 16x16 normal
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, color, name, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 15) continue;                                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -15) continue;                                      // Not visible (out to the left)
            }
            color &= 0x0f;
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + ((name & 0xfc) << 3) + spriteLine;
            pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            s = x <= 240 ? 0 : x - 240;
            f = x >= 0 ? 16 : 16 + x;
            paintSprite1(frameBackBuffer, bufferPos + x + (16 - f), pattern, color, s, f, invalid < 0);
        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                     // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function updateSprites1LineSize3(line, bufferPos) {                     // Mode 1, 16x16 double
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, name, color, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            atrPos += 4;
            sprite++;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec

            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 31) continue;                                  // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -31) continue;                                      // Not visible (out to the left)
            }
            color &= 0x0f;
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + ((name & 0xfc) << 3) + (spriteLine >>> 1);    // Double line height
            pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            s = x <= 224 ? 0 : x - 224;
            f = x >= 0 ? 32 : 32 + x;
            paintSprite1D(frameBackBuffer, bufferPos + x + (32 - f), pattern, color, s, f, invalid < 0);
        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("16x16 double Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                      // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function paintSprite1(dest, pos, pattern, color, start, finish, collide) {
        var value = colorPalette[color] | 0xff000000;
        for (var i = finish - 1; i >= start; i--, pos++) {
            var s = (pattern >> i) & 0x01;
            if (s === 0) continue;
            var destValue = dest[pos];
            // Transparent sprites (color = 0) just "mark" their presence setting dest Alpha to Full, so collisions can be detected
            if (destValue < 0xff000000) dest[pos] = color === 0 ? destValue | 0xff000000 : value;
            else if (!spritesCollided) spritesCollided = collide;
        }
    }

    function paintSprite1D(dest, pos, pattern, color, start, finish, collide) {
        var value = colorPalette[color] | 0xff000000;
        for (var i = finish - 1; i >= start; i--, pos++) {
            var s = (pattern >> (i >>> 1)) & 0x01;
            if (s === 0) continue;
            var destValue = dest[pos];
            // Transparent sprites (color = 0) just "mark" their presence setting dest Alpha to Full, so collisions can be detected
            if (destValue < 0xff000000) dest[pos] = color === 0 ? destValue | 0xff000000 : value;
            else if (!spritesCollided) spritesCollided = collide;
        }
    }

    function updateSprites2LineSize0(line, bufferPos) {                     // Mode 2, 8x8 normal
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            sprite++;
            atrPos += 4;
            colorPos += 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 7) continue;                                   // Not visible at line

            color = vram[colorPos + spriteLine];
            cc = (color & 0x40);
            if (cc) {
                if (spritePri === SPRITE_MAX_PRIORITY) continue;            // Must have a higher priority Main Sprite (CC = 0) to show this one
            } else spritePri = sprites2GlobalPriority + sprite;

            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (9th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }

            if (color === 0) continue;

            x = vram[atrPos + 1];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -7) continue;                                       // Not visible (out to the left)
            }
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + (name << 3) + spriteLine;
            pattern = vram[lineInPattern];
            s = x <= 248 ? 0 : x - 248;
            f = x >= 0 ? 8 : 8 + x;
            x += (8 - f);
            if (cc)
                paintSprite2CC(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f);
            else
                paintSprite2(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f, ((color & 0x20) === 0) && (invalid < 0));       // Consider IC bit
        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                     // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function updateSprites2LineSize1(line, bufferPos) {                     // Mode 2, 8x8 double
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            sprite++;
            atrPos += 4;
            colorPos += 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 15) continue;                                  // Not visible at line

            color = vram[colorPos + (spriteLine >>> 1)];                    // Double line height
            cc = (color & 0x40);
            if (cc) {
                if (spritePri === SPRITE_MAX_PRIORITY) continue;            // Must have a higher priority Main Sprite (CC = 0) to show this one
            } else spritePri = sprites2GlobalPriority + sprite;

            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (9th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }

            if (color === 0) continue;

            x = vram[atrPos + 1];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -15) continue;                                      // Not visible (out to the left)
            }
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + (name << 3) + (spriteLine >>> 1);    // Double line height
            pattern = vram[lineInPattern];
            s = x <= 240 ? 0 : x - 240;
            f = x >= 0 ? 16 : 16 + x;
            x += (16 - f);
            if (cc)
                paintSprite2DCC(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f);
            else
                paintSprite2D(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f, ((color & 0x20) === 0) && (invalid < 0));       // Consider IC bit
        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                     // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function updateSprites2LineSize2(line, bufferPos) {                     // Mode 2, 16x16 normal
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            sprite++;
            atrPos += 4;
            colorPos += 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 15) continue;                                  // Not visible at line

            color = vram[colorPos + spriteLine];
            cc = (color & 0x40);
            if (cc) {
                if (spritePri === SPRITE_MAX_PRIORITY) continue;            // Must have a higher priority Main Sprite (CC = 0) to show this one
            } else spritePri = sprites2GlobalPriority + sprite;

            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (9th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }

            if (color === 0) continue;

            x = vram[atrPos + 1];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -15) continue;                                      // Not visible (out to the left)
            }
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + ((name & 0xfc) << 3) + spriteLine;
            pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            s = x <= 240 ? 0 : x - 240;
            f = x >= 0 ? 16 : 16 + x;
            x += (16 - f);
            if (cc)
                paintSprite2CC(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f);
            else
                paintSprite2(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f, ((color & 0x20) === 0) && (invalid < 0));       // Consider IC bit
        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                     // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function updateSprites2LineSize3(line, bufferPos) {                     // Mode 2, 16x16 double
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i++) {                                      // Max of 32 sprites
            sprite++;
            atrPos += 4;
            colorPos += 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine > 31) continue;                                  // Not visible at line

            color = vram[colorPos + (spriteLine >>> 1)];                    // Double line height
            cc = (color & 0x40);
            if (cc) {
                if (spritePri === SPRITE_MAX_PRIORITY) continue;            // Must have a higher priority Main Sprite (CC = 0) to show this one
            } else spritePri = sprites2GlobalPriority + sprite;

            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (9th)
                if (invalid < 0) invalid = sprite;
                if (spriteDebugModeLimit) break;
            }

            if (color === 0) continue;

            x = vram[atrPos + 1];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x < -31) continue;                                      // Not visible (out to the left)
            }
            name = vram[atrPos + 2];
            lineInPattern = spritePatternTableAddress + ((name & 0xfc) << 3) + (spriteLine >>> 1);    // Double line height
            pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            s = x <= 224 ? 0 : x - 224;
            f = x >= 0 ? 32 : 32 + x;
            x += (32 - f);
            if (cc)
                paintSprite2DCC(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f);
            else
                paintSprite2D(bufferPos + x, spritePri, x, pattern, color & 0xf, s, f, ((color & 0x20) === 0) && (invalid < 0));       // Consider IC bit
        }

        if (spritesCollided && spriteDebugModeCollisions) {
            //wmsx.Util.log("16x16 normal Collision");
            status[0] |= 0x20;
        }
        if ((status[0] & 0x40) === 0) {                                     // Only set if 5S is still unset
            if (invalid >= 0) {
                //wmsx.Util.log("Invalid sprite: " + invalid);
                status[0] = status[0] & ~0x1f | 0x40 | invalid;
            } else if (sprite > (status[0] & 0x1f)) status[0] = status[0] & ~0x1f | sprite;
        }
    }

    function paintSprite2(bufferPos, spritePri, x, pattern, color, start, finish, collide) {
        for (var i = finish - 1; i >= start; i--, x++, bufferPos++) {
            var s = (pattern >> i) & 0x01;
            if (s === 0) continue;
            if (sprites2LinePriorities[x] < spritePri) {                                    // Higher priority sprite already there
                if (collide && !spritesCollided) spritesCollided = true;
                continue;
            }
            sprites2LinePriorities[x] = spritePri;                                          // Register new priority
            sprites2LineColors[x] = color;                                                  // Register new color
            frameBackBuffer[bufferPos] = colorPalette[color] | 0xff000000;
        }
    }

    function paintSprite2CC(bufferPos, spritePri, x, pattern, color, start, finish) {
        var finalColor;
        for (var i = finish - 1; i >= start; i--, x++, bufferPos++) {
            var s = (pattern >> i) & 0x01;
            if (s === 0) continue;
            var prevSpritePri = sprites2LinePriorities[x];
            if (prevSpritePri < spritePri) continue;                                        // Higher priority sprite already there
            if (prevSpritePri === spritePri)
                finalColor = color | sprites2LineColors[x];                                 // Mix if same priority
            else {
                sprites2LinePriorities[x] = spritePri;                                      // Otherwise register new priority
                finalColor = color;
            }
            sprites2LineColors[x] = finalColor;                                             // Register new color
            frameBackBuffer[bufferPos] = colorPalette[finalColor] | 0xff000000;
        }
    }

    function paintSprite2D(bufferPos, spritePri, x, pattern, color, start, finish, collide) {
        for (var i = finish - 1; i >= start; i--, x++, bufferPos++) {
            var s = (pattern >> (i >>> 1)) & 0x01;
            if (s === 0) continue;
            if (sprites2LinePriorities[x] < spritePri) {                                    // Higher priority sprite already there
                if (collide && !spritesCollided) spritesCollided = true;
                continue;
            }
            sprites2LinePriorities[x] = spritePri;                                          // Register new priority
            sprites2LineColors[x] = color;                                                  // Register new color
            frameBackBuffer[bufferPos] = colorPalette[color] | 0xff000000;
        }
    }

    function paintSprite2DCC(bufferPos, spritePri, x, pattern, color, start, finish) {
        var finalColor;
        for (var i = finish - 1; i >= start; i--, x++, bufferPos++) {
            var s = (pattern >> (i >>> 1)) & 0x01;
            if (s === 0) continue;
            var prevSpritePri = sprites2LinePriorities[x];
            if (prevSpritePri < spritePri) continue;                                        // Higher priority sprite already there
            if (prevSpritePri === spritePri)
                finalColor = color | sprites2LineColors[x];                                 // Mix if same priority
            else {
                sprites2LinePriorities[x] = spritePri;                                      // Otherwise register new priority
                finalColor = color;
            }
            sprites2LineColors[x] = finalColor;                                             // Register new color
            frameBackBuffer[bufferPos] = colorPalette[finalColor] | 0xff000000;
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
        status[2] |= 0x81;

        // Perform first iteration with current data
        executingCommandHandler(register[44]);
    }

    function executingCommandFinish() {

        //if (executingCommandHandler === HMMCNextData) console.log(executingCommandHandler.name + " Finish");
        //else console.log(">>>> NO COMMAND TO FINISH");

        executingCommandHandler = null;
        status[2] &= ~0x81;          // Clear CE and TR
        register[46] &= ~0xf0;
    }

    function refresh() {
        // Update frame image and send to monitor
        frameContext.putImageData(frameImageData, 0, 0, 0, 0, signalMetrics.totalWidth, signalMetrics.totalHeight);
        videoSignal.newFrame(frameCanvas, 0, 0, signalMetrics.totalWidth, signalMetrics.totalHeight);
        refreshPending = false;
    }

    function finishFrame() {

        //wmsx.Util.log("Frame FINISHED. CurrentScanline: " + currentScanline + ", CPU cycles: " + cpu.eval("cycles"));
        //cpu.eval("cycles = 0");

        // Begin a new frame
        refreshPending = true;
        currentScanline = startingScanline;
        frame++
    }

    function updateSpritePatternTables() {
        // TODO Revise for Debug modes
        //var vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
        //spritePatternTable8  = debugModeSpriteInfo ? debugPatTableDigits8  : vramSpritePatternTable;
        //spritePatternTable16 = debugModeSpriteInfo ? debugPatTableDigits16 : vramSpritePatternTable;
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


    var VRAM_LIMIT_9918 = 0x03FFF;      // 16K
    var VRAM_LIMIT_9938 = 0x1FFFF;      // 128K
    var SPRITE_MAX_PRIORITY = 9000000000000000;

    // Registers, pointers, control data

    var desiredBaseFrequency;       // Will depend on VideoStandard and detected Host Native Video Frequency
    var frame = 0;

    var videoStandard;
    var vSynchMode;
    var currentScanline;
    var startingScanline;
    var finishingActiveScanline;
    var finishingBottomBorderScanline;
    var finishingScanline;
    var cycleTotalLines;
    var pulldownFirstFrameLinesAdjust;
    var refreshPending;

    var horizontalIntLine = 0;

    var status = new Array(10);
    var register = new Array(47);
    var paletteRegister = new Array(16);

    var mode;
    var modeData;
    var signalMetrics;

    var spritesCollided;
    var sprites2Enabled;
    var sprites2LinePriorities = wmsx.Util.arrayFill(new Array(256), SPRITE_MAX_PRIORITY);
    var sprites2LineColors =     wmsx.Util.arrayFill(new Array(256), 0);
    var sprites2GlobalPriority = SPRITE_MAX_PRIORITY;      // Decreasing value for sprite priority control. Never resets!

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

    var nameTableLineSize;

    var nameTableAddress;                           // Dynamic values, set by software
    var colorTableAddress;
    var patternTableAddress;
    var spriteAttrTableAddress;
    var spritePatternTableAddress;

    var nameTableAddressMask;                       // Dynamic values, depends on mode
    var colorTableAddressMask;
    var patternTableAddressMask;
    var spriteAttrTableAddressMask;
    var spritePatternTableAddressMask;

    var nameTableAddressBaseMask = ~(-1 << 10);     // Fixed base values for all modes
    var colorTableAddressBaseMask = ~(-1 << 6);
    var patternTableAddressBaseMask = ~(-1 << 11);
    // var spriteAttrTableAddressBaseMask = Defined for each mode
    var spritePatternTableAddressBaseMask = ~(-1 << 11);

    var signalMetrics256 =  { width: 256, height: 192, totalWidth: 272, totalHeight: 208 };
    var signalMetrics256e = { width: 256, height: 212, totalWidth: 272, totalHeight: 228 };
    var signalMetrics512 =  { width: 512, height: 192, totalWidth: 544, totalHeight: 208 };
    var signalMetrics512e = { width: 512, height: 212, totalWidth: 544, totalHeight: 228 };

    var updateSpritesLineFunctionsMode1 = [updateSprites1LineSize0, updateSprites1LineSize1, updateSprites1LineSize2, updateSprites1LineSize3 ];
    var updateSpritesLineFunctionsMode2 = [updateSprites2LineSize0, updateSprites2LineSize1, updateSprites2LineSize2, updateSprites2LineSize3 ];

    var modes = wmsx.Util.arrayFillFunc(new Array(32), function(i) {
        return    { name: "Invalid",   sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, nameTBase: -1 << 10, colorTBase: -1 <<  6, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, sprAttrTBaseM:           0, sprPatTBase: -1 << 11, nameLineSize:   0, updLine: updateLineBlanked, updLineDeb: updateLineBlanked,     blankedLineValues: backdropFullLine256Values, spriteMode: 0 };
    });

    modes[0x10] = { name: "Screen 0",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTBase: -1 << 10, colorTBase: -1 <<  6, patTBase: -1 << 11, sprAttrTBase:        0, sprAttrTBaseM:           0, sprPatTBase:        0, nameLineSize:   0, updLine: updateLineModeT1,  updLineDeb: updateLineModeT1Debug, blankedLineValues: backdropFullLine256Values, spriteMode: 0 };
    modes[0x12] = { name: "Screen 0+", sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512,  nameTBase: -1 << 12, colorTBase: -1 <<  9, patTBase: -1 << 11, sprAttrTBase:        0, sprAttrTBaseM:           0, sprPatTBase:        0, nameLineSize:   0, updLine: updateLineModeT2,  updLineDeb: updateLineModeT2     , blankedLineValues: backdropFullLine512Values, spriteMode: 0 };
    modes[0x08] = { name: "Screen 3",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTBase: -1 << 10, colorTBase:        0, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, sprAttrTBaseM: ~(-1 <<  7), sprPatTBase: -1 << 11, nameLineSize:   0, updLine: updateLineModeMC,  updLineDeb: updateLineModeMCDebug, blankedLineValues: backdropFullLine256Values, spriteMode: 1 };
    modes[0x00] = { name: "Screen 1",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTBase: -1 << 10, colorTBase: -1 <<  6, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, sprAttrTBaseM: ~(-1 <<  7), sprPatTBase: -1 << 11, nameLineSize:   0, updLine: updateLineModeG1,  updLineDeb: updateLineModeG1Debug, blankedLineValues: backdropFullLine256Values, spriteMode: 1 };
    modes[0x01] = { name: "Screen 2",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTBase: -1 << 10, colorTBase: -1 << 13, patTBase: -1 << 13, sprAttrTBase: -1 <<  7, sprAttrTBaseM: ~(-1 <<  7), sprPatTBase: -1 << 11, nameLineSize:   0, updLine: updateLineModeG2,  updLineDeb: updateLineModeG2Debug, blankedLineValues: backdropFullLine256Values, spriteMode: 1 };
    modes[0x02] = { name: "Screen 4",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256,  nameTBase: -1 << 10, colorTBase: -1 <<  6, patTBase: -1 << 11, sprAttrTBase: -1 << 10, sprAttrTBaseM: ~(-1 <<  9), sprPatTBase: -1 << 11, nameLineSize:   0, updLine: updateLineModeG3,  updLineDeb: updateLineModeG3     , blankedLineValues: backdropFullLine256Values, spriteMode: 2 };
    modes[0x03] = { name: "Screen 5",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, nameTBase: -1 << 15, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprAttrTBaseM: ~(-1 <<  9), sprPatTBase: -1 << 11, nameLineSize: 128, updLine: updateLineModeG4,  updLineDeb: updateLineModeG4     , blankedLineValues: backdropFullLine256Values, spriteMode: 2 };
    modes[0x04] = { name: "Screen 6",  sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512e, nameTBase: -1 << 15, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprAttrTBaseM: ~(-1 <<  9), sprPatTBase: -1 << 11, nameLineSize: 128, updLine: updateLineModeG5,  updLineDeb: updateLineModeG5     , blankedLineValues: backdropFullLine512Values, spriteMode: 2 };
    modes[0x05] = { name: "Screen 7",  sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512e, nameTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprAttrTBaseM: ~(-1 <<  9), sprPatTBase: -1 << 11, nameLineSize: 256, updLine: updateLineModeG6,  updLineDeb: updateLineModeG6     , blankedLineValues: backdropFullLine512Values, spriteMode: 2 };
    modes[0x07] = { name: "Screen 8",  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, nameTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprAttrTBaseM: ~(-1 <<  9), sprPatTBase: -1 << 11, nameLineSize: 256, updLine: updateLineModeG7,  updLineDeb: updateLineModeG7     , blankedLineValues: backdropFullLine256Values, spriteMode: 2 };   // TODO bit 16 position!

    var updateLineActive, updateSpritesLine, blankedLineValues;         // Update functions for current mode


    // VRAM

    var vram = new Uint8Array(VRAM_LIMIT_9938 + 1);
    var vramLimit = VRAM_LIMIT_9938;
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

    var spriteDebugMode;
    var spriteDebugModeLimit = true;
    var spriteDebugModeCollisions = true;

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
        console.log(text + ". Frame: " + frame + ", line: " + currentScanline);
    }
    this.logInfo = logInfo;

    this.eval = function(str) {
        return eval(str);
    };

};

