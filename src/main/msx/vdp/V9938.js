// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// This implementation is line-accurate
// Original base clock: 10738635 Hz which is 3x CPU clock
// TODO Implement restrictions for V9918 mode

wmsx.V9938 = function(machine, cpu, psg, isV9918) {
    var self = this;

    function init() {
        signalMetrics = isV9918 ? signalMetricsV9918 : signalMetrics512e;
        videoSignal = new wmsx.VDPVideoSignal(signalMetrics);
        cpuClockPulses = cpu.clockPulses;
        psgClockPulse = psg.getAudioOutput().audioClockPulse;
        initFrameResources();
        initColorCaches();
        initSprites2Control();
        initDebugPatternTables();
        mode = 0; modeData = modes[mode];
        self.setDefaults();
        commandProcessor = new wmsx.V9938CommandProcessor();
        commandProcessor.connectVDP(self, vram, register, status);
        commandProcessor.setVDPModeData(modeData, signalMetrics);
    }

    this.connectBus = function(bus) {
        bus.connectInputDevice(0x98,  this.input98);
        bus.connectOutputDevice(0x98, this.output98);
        bus.connectInputDevice(0x99,  this.input99);
        bus.connectOutputDevice(0x99, isV9918 ? this.output99_V9918 : this.output99_V9938);
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
        updateSignalMetrics();
        if (currentScanline < startingScanline) currentScanline = startingScanline;          // When going from PAL to NTSC
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

    // VRAM Read
    this.input98 = function() {
        dataToWrite = null;
        var res = vram[vramPointer++];
        checkVRAMPointerWrap();
        return res;
    };

    // VRAM Write
    this.output98 = function(val) {

        //if (vramPointer === 0x1e205 || vramPointer === 0x1e605) wmsx.Util.log("VRAM Write: " + val.toString(16) + " at: " + vramPointer.toString(16));

        dataToWrite = null;
        vram[vramPointer++] = val;
        checkVRAMPointerWrap();
    };

    // Status Register Read
    this.input99 = function() {
        dataToWrite = null;
        var reg = register[15];
        if (reg > 9) return 0xff;                       // Invalid register

        var res;
        switch(reg) {
            case 0:
                res = status[0];
                status[0] = 0; updateIRQ(); break;
            case 1:
                res = status[1];
                status[1] &= ~0x80;                     // FL = 0
                if ((register[0] & 0x10) && (status[1] & 0x01)) {
                    status[1] &= ~0x01;                 // FH = 0, only if interrupts are enabled (IE1 = 1)
                    updateIRQ();
                }
                break;
            case 2:
                commandProcessor.updateStatus();
                res = status[2];

                //if ((res & 0x81) !== 0) logInfo("Reading Command Status NOT READY: " + res.toString(16));

                break;
            case 7:
                commandProcessor.cpuRead();
                res = status[7];
                break;
            case 8: case 9:
                res = status[reg];
                break;
        }

        //if (reg === 2) logInfo("Reading status " + reg + ", " + res.toString(16));

        return res;
    };

    // Register/VRAM Address write for V9938
    this.output99_V9938 = function(val) {
        if (dataToWrite === null) {
            // First write. Data to write to register or VRAM Address Pointer low (A7-A0)
            dataToWrite = val;
        } else {
            // Second write
            if (val & 0x80) {
                // Register write only if "WriteMode = 0"
                if ((val & 0x40) === 0) registerWrite(val & 0x3f, dataToWrite);
            } else {
                // VRAM Address Pointer middle (A13-A8) and mode (r/w)
                vramPointer = (vramPointer & 0x1c000) | ((val & 0x3f) << 8) | dataToWrite;

                //console.log("Setting VRAM Pointer via out: " + val.toString(16) + ". Pointer: " + vramPointer.toString(16) + ". reg14: " + register[14].toString(16));

            }
            dataToWrite = null;
        }
    };

    // Register/VRAM Address write for V9918
    this.output99_V9918 = function(val) {
        if (dataToWrite === null) {
            // First write. Data to write to register or VRAM Address Pointer low (A7-A0)
            dataToWrite = val;
            // On V9918, the VRAM pointer low gets written right away
            vramPointer = (vramPointer & ~0xff) | val;
        } else {
            // Second write
            if (val & 0x80) {
                registerWrite(val & 0x3f, dataToWrite);
                // On V9918, the VRAM pointer high gets also written when writing to registers
                vramPointer = (vramPointer & 0x1c0ff) | ((val & 0x3f) << 8);
            } else {
                // VRAM Address Pointer middle (A13-A8) and mode (r/w)
                vramPointer = (vramPointer & 0x1c000) | ((val & 0x3f) << 8) | dataToWrite;

                //console.log("Setting VRAM Pointer via out: " + val.toString(16) + ". Pointer: " + vramPointer.toString(16) + ". reg14: " + register[14].toString(16));

            }
            dataToWrite = null;
        }
    };

    // Palette Write
    this.output9a = function(val) {
        if (paletteFirstWrite === null) {
            paletteFirstWrite = val;
        } else {
            writePaletteRegister(register[16], (val << 8) | paletteFirstWrite);
            if (++register[16] > 15) register[16] = 0;
            paletteFirstWrite = null;
        }
    };

    // Indirect Register Write
    this.output9b = function(val) {
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
        frame = cycles = lastCPUCyclesComputed = 0;
        wmsx.Util.arrayFill(status, 0);
        wmsx.Util.arrayFill(register, 0);
        wmsx.Util.arrayFill(paletteRegister, 0);
        layoutTableAddress = colorTableAddress = patternTableAddress = spriteAttrTableAddress = spritePatternTableAddress = 0;
        layoutTableAddressMask = colorTableAddressMask = patternTableAddressMask = -1;
        dataToWrite = null; vramPointer = 0; paletteFirstWrite = null;
        verticalAdjust = horizontalAdjust = 0;
        backdropColor = 0;
        pendingBlankingChange = false;
        initColorPalette();
        updateIRQ();
        updateMode();
        updateBackdropValue();
        updateSynchronization();
        beginFrame();
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
                if ((val & 0x40) !== (old & 0x40)) {
                    pendingBlankingChange = true;            // BL, only at next line

                    //logInfo("Blanking: " + !!(val & 0x40));

                }
                if ((val & 0x18) !== (old & 0x18)) updateMode();                            // Mx
                else if ((val & 0x03) !== (old & 0x03)) updateSpritesLineType();            // SI, MAG. Already ok if mode was updated
                break;
            case 2:
                add = (mode === 0x07 ? (val << 11) | 0x400 : val << 10) & 0x1ffff;          // Mode G7 has different A16 position
                layoutTableAddress = add & modeData.layTBase;
                layoutTableAddressMask = add | layoutTableAddressMaskBase;

                //logInfo(/* "Setting: " + val.toString(16) + " to " + */ "NameTableAddress: " + layoutTableAddress.toString(16));

                break;
            case 3:
            case 10:
                add = ((register[10] << 14) | (register[3] << 6)) & 0x1ffff ;
                colorTableAddress = add & modeData.colorTBase;
                colorTableAddressMask = add | colorTableAddressMaskBase;

                //logInfo("Setting: " + val.toString(16) + " to ColorTableAddress: " + colorTableAddress.toString(16));

                break;
            case 4:
                add = (val << 11) & 0x1ffff ;
                patternTableAddress = add & modeData.patTBase;
                patternTableAddressMask = add | patternTableAddressMaskBase;

                //logInfo("Setting: " + val.toString(16) + " to PatternTableAddress: " + patternTableAddress.toString(16));

                break;
            case 5:
            case 11:
                add = ((register[11] << 15) | (register[5] << 7)) & 0x1ffff ;
                spriteAttrTableAddress = add & modeData.sprAttrTBase;

                //logInfo("SpriteAttrTable: " + spriteAttrTableAddress.toString(16));

                break;
            case 6:
                add = (val << 11) & 0x1ffff ;
                spritePatternTableAddress = add & modeData.sprPatTBase;
                updateSpritePatternTables();

                //logInfo("SpritePatTable: " + spritePatternTableAddress.toString(16));

                break;
            case 7:
                if ((val & 0x0f) !== (old & 0x0f)) updateBackdropColor();                   // BD
                break;
            case 8:
                if ((val & 0x20) !== (old & 0x20)) updateTransparency();                    // TP
                if ((val & 0x02) !== (old & 0x02)) updateSpritesLineType();                 // SPD
                break;
            case 9:
                if ((val & 0x80) !== (old & 0x80)) updateSignalMetrics();                   // LN
                if ((val & 0x02) !== (old & 0x02)) updateVideoStandardSoft();               // NT
                break;
            case 14:
                // VRAM Address Pointer high (A16-A14)
                vramPointer = ((val & 0x07) << 14) | (vramPointer & 0x3fff);

                //console.log("Setting reg14: " + val.toString(16) + ". VRAM Pointer: " + vramPointer.toString(16));

                break;
            case 16:
                paletteFirstWrite = null;
                break;
            case 18:
                if ((val & 0x0f) !== (old & 0x0f)) horizontalAdjust = -7 + ((val & 0x0f) ^ 0x07);
                if ((val & 0xf0) !== (old & 0xf0)) {
                    verticalAdjust = -7 + ((val >>> 4) ^ 0x07);
                    updateSignalMetrics();
                }
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
                commandProcessor.cpuWrite(val);
                break;
            case 46:
                commandProcessor.startCommand(val);
                break;
        }
    }

    this.updateCycles = function() {
        var cpuCycles = cpu.getCycles();
        if (cpuCycles === lastCPUCyclesComputed) return cycles;

        var elapsed = (cpuCycles - lastCPUCyclesComputed) * 6;
        lastCPUCyclesComputed = cpuCycles;
        cycles += elapsed;

        return cycles;
    };


    function checkVRAMPointerWrap() {
        if ((vramPointer & 0x3fff) === 0) {
            //wmsx.Util.log("VRAM Read Wrapped, vramPointer: " + vramPointer.toString(16) + ", register14: " + register[14].toString(16));
            if (modeData.isV9938) register[14] = (register[14] + 1) & 0x07;
            vramPointer = register[14] << 14;
        }
    }

    function writePaletteRegister(reg, val) {
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
        updateLineActiveType();
        updateSpritesLineType();
        updateSpritePatternTables();
        updateBackdropValue();
    }

    function updateSynchronization() {
        // Use the native frequency (60Hz or 50Hz) if detected and VSynch matches or is forced, otherwise use the Video Standard target FPS
        var hostFreq = wmsx.Clock.HOST_NATIVE_FPS;
        desiredBaseFrequency = videoStandard.targetFPS;
        if ((vSynchMode === 2) && (hostFreq > 0)) desiredBaseFrequency = hostFreq;

        scanlinesPerCycle = videoStandard.pulldowns[desiredBaseFrequency].linesPerCycle;                          // Always generate this amount of lines per cycle
        pulldownFirstFrameLinesAdjust = videoStandard.pulldowns[desiredBaseFrequency].firstFrameLinesAdjust;      // Unless its the first pulldown frame and is adjusted
    }

    // Total frame lines: 262 for NTSC, 313 for PAL
    // Total frame CPU clocks: 59736 for NTSC, 71364 for PAL
    function frameEvents() {
        var totalLines = scanlinesPerCycle;

        // Adjust for pulldown cadence if this frame is the first pulldown frame
        if (pulldownFirstFrameLinesAdjust && currentScanline == startingScanline) totalLines += pulldownFirstFrameLinesAdjust;

        for (var i = totalLines; i > 0; i = i - 1) {
            // Verify and change sections of the screen
            if (currentScanline === startingActiveScanline) enterActiveDisplay();
            else if (currentScanline === startingBottomBorderScanline) enterBottomBorder();

            lineEvents();

            currentScanline = currentScanline + 1;

            if (currentScanline === finishingScanline) finishFrame();
        }
    }

    // Total line clocks: VDP: 1368, CPU: 228 CPU, PSG 7.125 PSG
    // Timing should be different for mode T1 and T2 since borders are wider. Ignoring for now.
    // This implementation starts each scanline at the Beginning of the Right Border, and ends with the Ending of the Visible Display
    function lineEvents() {
        // Start of line
        //lineStartCPUCycles = cpu.getCycles();

        if (pendingBlankingChange) updateLineActiveType();

        // Sync signal: 100 clocks
        // Left erase: 102 clocks

        cpuClockPulses(33); psgClockPulse();

        // Left border: 56 clocks

        if (currentScanline === startingActiveScanline - 1) status[2] &= ~0x40;                     // VR = 0 at the scanline before first Active scanline
        if ((status[1] & 0x01) && ((register[0] & 0x10) === 0))  status[1] &= ~0x01;                // FH = 0 if interrupts disabled (IE1 = 0)
        if (currentScanline === startingBottomBorderScanline) triggerVerticalInterrupt();           // VR = 1, F = 1 at the first Bottom Border line

        cpuClockPulses(10);

        // Visible Display: 1024 clocks

        status[2] &= ~0x20;                                                                         // HR = 0

        cpuClockPulses(22); psgClockPulse();
        cpuClockPulses(33); psgClockPulse();
        cpuClockPulses(32); psgClockPulse();

        if (currentScanline >= startingTopBorderScanline) renderLine();                             // ~ Middle of Display area

        cpuClockPulses(33); psgClockPulse();
        cpuClockPulses(32); psgClockPulse();
        cpuClockPulses(18);

        status[2] |= 0x20;                                                                          // HR = 1
        if (currentScanline - startingActiveScanline === horizontalIntLine) triggerHorizontalInterrupt();   // FH = 1

        // Right border: 59 clocks
        // Right erase: 27 clocks

        cpuClockPulses(15);  psgClockPulse();

        // End of line

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
        if (((status[0] & 0x80) && (register[1] & 0x20))            // F == 1 and IE0 == 1
            || ((status[1] & 0x01) && (register[0] & 0x10))) {      // FH == 1 and IE1 == 1
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

        // Update Tables base addresses
        add = (mode === 0x07 ? (register[2] << 11) | 0x400 : register[2] << 10) & 0x1ffff;       // Mode G7 has different A16 position
        layoutTableAddress = add & modeData.layTBase;
        layoutTableAddressMask = add | layoutTableAddressMaskBase;
        add = ((register[10] << 14) | (register[3] << 6)) & 0x1ffff ;
        colorTableAddress = add & modeData.colorTBase;
        colorTableAddressMask = add | colorTableAddressMaskBase;
        add = (register[4] << 11) & 0x1ffff;
        patternTableAddress = add & modeData.patTBase;
        patternTableAddressMask = add | patternTableAddressMaskBase;
        add = ((register[11] << 15) | (register[5] << 7)) & 0x1ffff ;
        spriteAttrTableAddress = add & modeData.sprAttrTBase;
        add = (register[6] << 11) & 0x1ffff;
        spritePatternTableAddress = add & modeData.sprPatTBase;
        updateLineActiveType();
        updateSpritesLineType();
        updateSignalMetrics();              // Will update modeData and signalMetrics to the CommandProcessor
        updateSpritePatternTables();
        if ((mode === 4) || (oldMode === 4)) updateBackdropCaches();
        pendingModeChange = false;

        //logInfo("Update Mode: " + mode.toString(16) + ", colorTableAddress: " + colorTableAddress.toString(16));

    }

    function updateVideoStandardSoft() {
        var pal = (register[9] & 0x02);
        machine.setVideoStandardSoft(pal ? wmsx.VideoStandard.PAL : wmsx.VideoStandard.NTSC);

        //logInfo("VDP VideoStandard: " + (pal ? "PAL" : "NTSC"));
    }

    function updateSignalMetrics() {
        if (!isV9918) signalMetrics = register[9] & 0x80 ? modeData.sigMetricsExt : modeData.sigMetrics;       // LN

        startingTopBorderScanline = 0;
        startingActiveScanline = startingTopBorderScanline + signalMetrics.vertBorderSize + verticalAdjust;
        startingBottomBorderScanline = startingActiveScanline + signalMetrics.height;
        finishingScanline = startingBottomBorderScanline + signalMetrics.vertBorderSize - verticalAdjust;
        startingScanline = finishingScanline - videoStandard.totalHeight;

        videoSignal.setSignalMetrics(signalMetrics);
        commandProcessor.setVDPModeData(modeData, signalMetrics);
    }

    function enterActiveDisplay() {
        renderLine = renderLineActive;

        //logInfo("Active");
    }

    function enterBottomBorder() {
        renderLine = renderLineBorders;

        //logInfo("Bottom Border");
    }

    function updateLineActiveType() {
        var old = renderLineActive;
        renderLineActive = (register[1] & 0x40) ? debugModePatternInfo ? modeData.updLineDeb : modeData.updLine : renderLineActiveBlanked;
        if (renderLine === old) renderLine = renderLineActive;

        pendingBlankingChange = false;
    }

    function updateSpritesLineType() {
        renderSpritesLine =
              modeData.spriteMode === 2 ? (register[8] & 0x02) === 0 ? renderSpritesLineFunctionsMode2[register[1] & 0x03] : null       // SPD, SI, MAG
            : modeData.spriteMode === 1 ? renderSpritesLineFunctionsMode1[register[1] & 0x03]                                           // SI, MAG
            : null;

        //logInfo("SpriteType: " + (renderSpritesLine && renderSpritesLine.name));

    }

    function updateTransparency() {
        color0Solid = !!(register[8] & 0x20);
        colorPalette[0] = color0Solid ? color0SetValue : backdropValue;

        //console.log("TP: " + color0Solid + ", currentLine: " + currentScanline);
    }

    function updateBackdropColor() {
        backdropColor = register[7] & 0x0f;
        updateBackdropValue();

        //console.log("Backdrop Color: " + backdropColor + ", currentLine: " + currentScanline);
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
        var odd = colorPalette[backdropColor >>> 2]; var even = colorPalette[backdropColor & 0x03];
        for (var i = 0; i < 544; i += 2) {
            backdropFullLine512Values[i] = odd; backdropFullLine512Values[i + 1] = even;
        }
    }

    function renderLineBorders() {
        frameBackBuffer.set(backdropFullLine512Values, bufferPosition);
        bufferPosition = bufferPosition + 544;
    }

    function renderLineActiveBlanked() {
        frameBackBuffer.set(backdropFullLine512Values, bufferPosition);
        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeT1() {                                           // Text (Screen 0 width 40)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop16(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 16;
        } else if (horizontalAdjust > 0) {
            paintBackdrop24(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 16 + horizontalAdjust;
        } else {
            paintBackdrop16(bufferPos); paintBackdrop24(bufferPos + 256 - 8); bufferPos += 16 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + (realLine >>> 3) * 40;            // line / 8 * 40
        var patPosFinal = patPos + 40;
        var colorCode = register[7];                                        // fixed text color for all line
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var on =  colorPalette[colorCode >>> 4];
        var off = colorPalette[colorCode & 0xf];
        while (patPos < patPosFinal) {
            var name = vram[patPos++];                                      // No masking needed
            var pattern = vram[(name << 3) + lineInPattern];                // No masking needed
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 6;
        }

        // Sprites deactivated
        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeT2() {                                           // Text (Screen 0 width 80)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop32(bufferPos); paintBackdrop32(bufferPos + 512); bufferPos += 32;
        } else if (horizontalAdjust > 0) {
            paintBackdrop48(bufferPos); paintBackdrop32(bufferPos + 512); bufferPos += 32 + horizontalAdjust * 2;
        } else {
            paintBackdrop32(bufferPos); paintBackdrop48(bufferPos + 512 - 16); bufferPos += 32 + horizontalAdjust * 2;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + (realLine >>> 3) * 80;            // line / 8 * 80
        var patPosFinal = patPos + 80;
        var colorCode = register[7];                                        // fixed text color for all line
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var on =  colorPalette[colorCode >>> 4];
        var off = colorPalette[colorCode & 0xf];
        while (patPos < patPosFinal) {
            var name = vram[patPos++ & layoutTableAddressMask];
            var pattern = vram[(name << 3) + lineInPattern];                // No masking needed
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 6;
        }

        // Sprites deactivated
        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeMC() {                                           // Multicolor (Screen 3)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + ((realLine >>> 3) << 5);          // line / 8 * 32
        var patPosFinal = patPos + 32;
        var extraPatPos = patternTableAddress + (((realLine >>> 3) & 0x03) << 1) + ((realLine >> 2) & 0x01);    // (pattern line % 4) * 2
        while (patPos < patPosFinal) {
            var name = vram[patPos++];                                      // no masking needed
            var patternLine = (name << 3) + extraPatPos;                    // name * 8 + extra position, no masking needed
            var colorCode = vram[patternLine];                              // no masking needed
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, 0xf0, on, off);                 // always solid blocks of front and back colors;
            bufferPos += 8;
        }

        renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG1() {                                           // Graphics 1 (Screen 1)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + ((realLine >>> 3) << 5);          // line / 8 * 32
        var patPosFinal = patPos + 32;
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        while (patPos < patPosFinal) {
            var name = vram[patPos++];                                      // no masking needed
            var colorCode = vram[colorTableAddress + (name >>> 3)];         // name / 8 (1 color for each 8 patterns), no masking needed
            var pattern = vram[((name << 3) + lineInPattern)];              // name * 8 (8 bytes each pattern) + line inside pattern, no masking needed
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG2() {                                           // Graphics 2 (Screen 2)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + ((realLine >>> 3) << 5);          // line / 8 * 32
        var patPosFinal = patPos + 32;
        var lineInColor = colorTableAddress + (realLine & 0x07);
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var blockExtra = (realLine & 0xc0) << 2;                            // + 0x100 for each third block of the screen (8 pattern lines)
        while (patPos < patPosFinal) {
            var name = vram[patPos++] | blockExtra;                         // no masking needed
            var colorCode = vram[((name << 3) + lineInColor) & colorTableAddressMask];     // (8 bytes each pattern) + line inside pattern
            var pattern = vram[((name << 3) + lineInPattern) & patternTableAddressMask];
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG3() {                                           // Graphics 3 (Screen 4)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + ((realLine >>> 3) << 5);          // line / 8 * 32
        var patPosFinal = patPos + 32;
        var lineInColor = colorTableAddress + (realLine & 0x07);
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var blockExtra = (realLine & 0xc0) << 2;                            // + 0x100 for each third block of the screen (8 pattern lines)
        while (patPos < patPosFinal) {
            var name = vram[patPos++] | blockExtra;                         // no masking needed
            var colorCode = vram[((name << 3) + lineInColor) & colorTableAddressMask];    // (8 bytes each pattern) + line inside pattern
            var pattern = vram[((name << 3) + lineInPattern) & patternTableAddressMask];
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        if (renderSpritesLine) renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG4() {                                           // Graphics 4 (Screen 5)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var pixelsPos = layoutTableAddress + (realLine << 7);
        var pixelsPosFinal = pixelsPos + 128;
        while (pixelsPos < pixelsPosFinal) {
            var pixels = vram[pixelsPos++ & layoutTableAddressMask];
            frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 4];
            frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x0f];
        }

        if (renderSpritesLine) renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG5() {                                           // Graphics 5 (Screen 6)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop16G5(bufferPos); paintBackdrop16G5(bufferPos + 16 + 512);
            bufferPos += 16;
        } else if (horizontalAdjust > 0) {
            paintBackdrop32G5(bufferPos); paintBackdrop16G5(bufferPos + 16 + 512);
            bufferPos += 16 + horizontalAdjust * 2;
        } else {
            paintBackdrop16G5(bufferPos); paintBackdrop32G5(bufferPos + 512);
            bufferPos += 16 + horizontalAdjust * 2;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var pixelsPos = layoutTableAddress + (realLine << 7);
        var pixelsPosFinal = pixelsPos + 128;
        while (pixelsPos < pixelsPosFinal) {
            var pixels = vram[pixelsPos++ & layoutTableAddressMask];
            frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 6];
            frameBackBuffer[bufferPos++] = colorPalette[(pixels >>> 4) & 0x03];
            frameBackBuffer[bufferPos++] = colorPalette[(pixels >>> 2) & 0x03];
            frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x03];
        }

        if (renderSpritesLine) renderSpritesLine(realLine, bufferPos - 512);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG6() {                                           // Graphics 6 (Screen 7)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop16(bufferPos); paintBackdrop16(bufferPos + 16 + 512);
            bufferPos += 16;
        } else if (horizontalAdjust > 0) {
            paintBackdrop32(bufferPos); paintBackdrop16(bufferPos + 16 + 512);
            bufferPos += 16 + horizontalAdjust * 2;
        } else {
            paintBackdrop16(bufferPos); paintBackdrop32(bufferPos + 512);
            bufferPos += 16 + horizontalAdjust * 2;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var pixelsPos = layoutTableAddress + (realLine << 8);
        var pixelsPosFinal = pixelsPos + 256;
        while (pixelsPos < pixelsPosFinal) {
            var pixels = vram[pixelsPos++ & layoutTableAddressMask];
            frameBackBuffer[bufferPos++] = colorPalette[pixels >>> 4];
            frameBackBuffer[bufferPos++] = colorPalette[pixels & 0x0f];
        }

        if (renderSpritesLine) renderSpritesLine(realLine, bufferPos - 512);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG7() {                                           // Graphics 7 (Screen 8)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var pixelsPos = layoutTableAddress + (realLine << 8);
        var pixelsPosFinal = pixelsPos + 256;
        while (pixelsPos < pixelsPosFinal) {
            frameBackBuffer[bufferPos++] = colors256[vram[pixelsPos++ & layoutTableAddressMask]];
        }

        if (renderSpritesLine) renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeT1Debug() {                                      // Text (Screen 0)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop16(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 16;
        } else if (horizontalAdjust > 0) {
            paintBackdrop24(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 16 + horizontalAdjust;
        } else {
            paintBackdrop16(bufferPos); paintBackdrop24(bufferPos + 256 - 8); bufferPos += 16 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + ((realLine >>> 3) * 40);          // line / 8 * 40
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

        // Sprites deactivated

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeMCDebug() {                                      // Multicolor (Screen 3)
        if (!debugModePatternInfoNames) return renderLineModeMC();

        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + ((realLine >>> 3) << 5);          // line / 8 * 32
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

        renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG1Debug() {                                      // Graphics 1 (Screen 1)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var patPos = layoutTableAddress + ((realLine >>> 3) << 5);
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

        renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function renderLineModeG2Debug() {                                      // Graphics 2 (Screen 2)
        var bufferPos = bufferPosition;

        if (horizontalAdjust === 0) {
            paintBackdrop8(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8;
        } else if (horizontalAdjust > 0) {
            paintBackdrop16(bufferPos); paintBackdrop8(bufferPos + 8 + 256); bufferPos += 8 + horizontalAdjust;
        } else {
            paintBackdrop8(bufferPos); paintBackdrop16(bufferPos + 256); bufferPos += 8 + horizontalAdjust;
        }

        var realLine = (currentScanline - startingActiveScanline + register[23]) & 255;
        var lineInPattern = realLine & 0x07;
        var blockExtra = (realLine & 0xc0) << 2;
        var patPos = layoutTableAddress + ((realLine >>> 3) << 5);
        var patPosFinal = patPos + 32;
        while (patPos < patPosFinal) {
            var name = vram[patPos++] | blockExtra;
            if (debugModePatternInfoNames) {
                name &= 0xff;
                var colorCode = name === 0 || name === 0x20 ? 0x41 : 0xf1;
                var pattern = debugPatTableDigits8[name * 8 + lineInPattern];
            } else if (debugModePatternInfoBlocks) {
                colorCode = vram[(colorTableAddress + (name << 3) + lineInPattern) & colorTableAddressMask];
                pattern = debugPatTableBlocks[lineInPattern];
            } else {
                colorCode = 0xf1;
                pattern = vram[(patternTableAddress + (name << 3) + lineInPattern) & patternTableAddressMask];
            }
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern(bufferPos, pattern, on, off);
            bufferPos += 8;
        }

        renderSpritesLine(realLine, bufferPos - 256);

        bufferPosition = bufferPosition + 544;
    }

    function paintPattern(bufferPos, pattern, on, off) {
        frameBackBuffer[bufferPos]     = pattern & 0x80 ? on : off; frameBackBuffer[bufferPos + 1] = pattern & 0x40 ? on : off; frameBackBuffer[bufferPos + 2] = pattern & 0x20 ? on : off; frameBackBuffer[bufferPos + 3] = pattern & 0x10 ? on : off;
        frameBackBuffer[bufferPos + 4] = pattern & 0x08 ? on : off; frameBackBuffer[bufferPos + 5] = pattern & 0x04 ? on : off; frameBackBuffer[bufferPos + 6] = pattern & 0x02 ? on : off; frameBackBuffer[bufferPos + 7] = pattern & 0x01 ? on : off;
    }

    function paintBackdrop8(bufferPos) {
        frameBackBuffer[bufferPos]     = backdropValue; frameBackBuffer[bufferPos + 1] = backdropValue; frameBackBuffer[bufferPos + 2] = backdropValue; frameBackBuffer[bufferPos + 3] = backdropValue;
        frameBackBuffer[bufferPos + 4] = backdropValue; frameBackBuffer[bufferPos + 5] = backdropValue; frameBackBuffer[bufferPos + 6] = backdropValue; frameBackBuffer[bufferPos + 7] = backdropValue;
    }

    function paintBackdrop16(bufferPos) {
        frameBackBuffer[bufferPos]      = backdropValue; frameBackBuffer[bufferPos +  1] = backdropValue; frameBackBuffer[bufferPos +  2] = backdropValue; frameBackBuffer[bufferPos +  3] = backdropValue;
        frameBackBuffer[bufferPos +  4] = backdropValue; frameBackBuffer[bufferPos +  5] = backdropValue; frameBackBuffer[bufferPos +  6] = backdropValue; frameBackBuffer[bufferPos +  7] = backdropValue;
        frameBackBuffer[bufferPos +  8] = backdropValue; frameBackBuffer[bufferPos +  9] = backdropValue; frameBackBuffer[bufferPos + 10] = backdropValue; frameBackBuffer[bufferPos + 11] = backdropValue;
        frameBackBuffer[bufferPos + 12] = backdropValue; frameBackBuffer[bufferPos + 13] = backdropValue; frameBackBuffer[bufferPos + 14] = backdropValue; frameBackBuffer[bufferPos + 15] = backdropValue;
    }

    function paintBackdrop24(bufferPos) {
        frameBackBuffer[bufferPos]      = backdropValue; frameBackBuffer[bufferPos +  1] = backdropValue; frameBackBuffer[bufferPos +  2] = backdropValue; frameBackBuffer[bufferPos +  3] = backdropValue;
        frameBackBuffer[bufferPos +  4] = backdropValue; frameBackBuffer[bufferPos +  5] = backdropValue; frameBackBuffer[bufferPos +  6] = backdropValue; frameBackBuffer[bufferPos +  7] = backdropValue;
        frameBackBuffer[bufferPos +  8] = backdropValue; frameBackBuffer[bufferPos +  9] = backdropValue; frameBackBuffer[bufferPos + 10] = backdropValue; frameBackBuffer[bufferPos + 11] = backdropValue;
        frameBackBuffer[bufferPos + 12] = backdropValue; frameBackBuffer[bufferPos + 13] = backdropValue; frameBackBuffer[bufferPos + 14] = backdropValue; frameBackBuffer[bufferPos + 15] = backdropValue;
        frameBackBuffer[bufferPos + 16] = backdropValue; frameBackBuffer[bufferPos + 17] = backdropValue; frameBackBuffer[bufferPos + 18] = backdropValue; frameBackBuffer[bufferPos + 19] = backdropValue;
        frameBackBuffer[bufferPos + 20] = backdropValue; frameBackBuffer[bufferPos + 21] = backdropValue; frameBackBuffer[bufferPos + 22] = backdropValue; frameBackBuffer[bufferPos + 23] = backdropValue;
    }

    function paintBackdrop32(bufferPos) {
        frameBackBuffer[bufferPos]      = backdropValue; frameBackBuffer[bufferPos +  1] = backdropValue; frameBackBuffer[bufferPos +  2] = backdropValue; frameBackBuffer[bufferPos +  3] = backdropValue;
        frameBackBuffer[bufferPos +  4] = backdropValue; frameBackBuffer[bufferPos +  5] = backdropValue; frameBackBuffer[bufferPos +  6] = backdropValue; frameBackBuffer[bufferPos +  7] = backdropValue;
        frameBackBuffer[bufferPos +  8] = backdropValue; frameBackBuffer[bufferPos +  9] = backdropValue; frameBackBuffer[bufferPos + 10] = backdropValue; frameBackBuffer[bufferPos + 11] = backdropValue;
        frameBackBuffer[bufferPos + 12] = backdropValue; frameBackBuffer[bufferPos + 13] = backdropValue; frameBackBuffer[bufferPos + 14] = backdropValue; frameBackBuffer[bufferPos + 15] = backdropValue;
        frameBackBuffer[bufferPos + 16] = backdropValue; frameBackBuffer[bufferPos + 17] = backdropValue; frameBackBuffer[bufferPos + 18] = backdropValue; frameBackBuffer[bufferPos + 19] = backdropValue;
        frameBackBuffer[bufferPos + 20] = backdropValue; frameBackBuffer[bufferPos + 21] = backdropValue; frameBackBuffer[bufferPos + 22] = backdropValue; frameBackBuffer[bufferPos + 23] = backdropValue;
        frameBackBuffer[bufferPos + 24] = backdropValue; frameBackBuffer[bufferPos + 25] = backdropValue; frameBackBuffer[bufferPos + 26] = backdropValue; frameBackBuffer[bufferPos + 27] = backdropValue;
        frameBackBuffer[bufferPos + 28] = backdropValue; frameBackBuffer[bufferPos + 29] = backdropValue; frameBackBuffer[bufferPos + 30] = backdropValue; frameBackBuffer[bufferPos + 31] = backdropValue;
    }

    function paintBackdrop48(bufferPos) {
        frameBackBuffer[bufferPos]      = backdropValue; frameBackBuffer[bufferPos +  1] = backdropValue; frameBackBuffer[bufferPos +  2] = backdropValue; frameBackBuffer[bufferPos +  3] = backdropValue;
        frameBackBuffer[bufferPos +  4] = backdropValue; frameBackBuffer[bufferPos +  5] = backdropValue; frameBackBuffer[bufferPos +  6] = backdropValue; frameBackBuffer[bufferPos +  7] = backdropValue;
        frameBackBuffer[bufferPos +  8] = backdropValue; frameBackBuffer[bufferPos +  9] = backdropValue; frameBackBuffer[bufferPos + 10] = backdropValue; frameBackBuffer[bufferPos + 11] = backdropValue;
        frameBackBuffer[bufferPos + 12] = backdropValue; frameBackBuffer[bufferPos + 13] = backdropValue; frameBackBuffer[bufferPos + 14] = backdropValue; frameBackBuffer[bufferPos + 15] = backdropValue;
        frameBackBuffer[bufferPos + 16] = backdropValue; frameBackBuffer[bufferPos + 17] = backdropValue; frameBackBuffer[bufferPos + 18] = backdropValue; frameBackBuffer[bufferPos + 19] = backdropValue;
        frameBackBuffer[bufferPos + 20] = backdropValue; frameBackBuffer[bufferPos + 21] = backdropValue; frameBackBuffer[bufferPos + 22] = backdropValue; frameBackBuffer[bufferPos + 23] = backdropValue;
        frameBackBuffer[bufferPos + 24] = backdropValue; frameBackBuffer[bufferPos + 25] = backdropValue; frameBackBuffer[bufferPos + 26] = backdropValue; frameBackBuffer[bufferPos + 27] = backdropValue;
        frameBackBuffer[bufferPos + 28] = backdropValue; frameBackBuffer[bufferPos + 29] = backdropValue; frameBackBuffer[bufferPos + 30] = backdropValue; frameBackBuffer[bufferPos + 31] = backdropValue;
        frameBackBuffer[bufferPos + 32] = backdropValue; frameBackBuffer[bufferPos + 33] = backdropValue; frameBackBuffer[bufferPos + 34] = backdropValue; frameBackBuffer[bufferPos + 35] = backdropValue;
        frameBackBuffer[bufferPos + 36] = backdropValue; frameBackBuffer[bufferPos + 37] = backdropValue; frameBackBuffer[bufferPos + 38] = backdropValue; frameBackBuffer[bufferPos + 39] = backdropValue;
        frameBackBuffer[bufferPos + 40] = backdropValue; frameBackBuffer[bufferPos + 41] = backdropValue; frameBackBuffer[bufferPos + 42] = backdropValue; frameBackBuffer[bufferPos + 43] = backdropValue;
        frameBackBuffer[bufferPos + 44] = backdropValue; frameBackBuffer[bufferPos + 45] = backdropValue; frameBackBuffer[bufferPos + 46] = backdropValue; frameBackBuffer[bufferPos + 47] = backdropValue;
    }
    function paintBackdrop16G5(bufferPos) {
        var odd =  backdropFullLine512Values[0]; var even = backdropFullLine512Values[1];
        frameBackBuffer[bufferPos]      = odd; frameBackBuffer[bufferPos +  1] = even; frameBackBuffer[bufferPos +  2] = odd; frameBackBuffer[bufferPos +  3] = even;
        frameBackBuffer[bufferPos +  4] = odd; frameBackBuffer[bufferPos +  5] = even; frameBackBuffer[bufferPos +  6] = odd; frameBackBuffer[bufferPos +  7] = even;
        frameBackBuffer[bufferPos +  8] = odd; frameBackBuffer[bufferPos +  9] = even; frameBackBuffer[bufferPos + 10] = odd; frameBackBuffer[bufferPos + 11] = even;
        frameBackBuffer[bufferPos + 12] = odd; frameBackBuffer[bufferPos + 13] = even; frameBackBuffer[bufferPos + 14] = odd; frameBackBuffer[bufferPos + 15] = even;
    }

    function paintBackdrop32G5(bufferPos) {
        var odd =  backdropFullLine512Values[0]; var even = backdropFullLine512Values[1];
        frameBackBuffer[bufferPos]      = odd; frameBackBuffer[bufferPos +  1] = even; frameBackBuffer[bufferPos +  2] = odd; frameBackBuffer[bufferPos +  3] = even;
        frameBackBuffer[bufferPos +  4] = odd; frameBackBuffer[bufferPos +  5] = even; frameBackBuffer[bufferPos +  6] = odd; frameBackBuffer[bufferPos +  7] = even;
        frameBackBuffer[bufferPos +  8] = odd; frameBackBuffer[bufferPos +  9] = even; frameBackBuffer[bufferPos + 10] = odd; frameBackBuffer[bufferPos + 11] = even;
        frameBackBuffer[bufferPos + 12] = odd; frameBackBuffer[bufferPos + 13] = even; frameBackBuffer[bufferPos + 14] = odd; frameBackBuffer[bufferPos + 15] = even;
        frameBackBuffer[bufferPos + 16] = odd; frameBackBuffer[bufferPos + 17] = even; frameBackBuffer[bufferPos + 18] = odd; frameBackBuffer[bufferPos + 19] = even;
        frameBackBuffer[bufferPos + 20] = odd; frameBackBuffer[bufferPos + 21] = even; frameBackBuffer[bufferPos + 22] = odd; frameBackBuffer[bufferPos + 23] = even;
        frameBackBuffer[bufferPos + 24] = odd; frameBackBuffer[bufferPos + 25] = even; frameBackBuffer[bufferPos + 26] = odd; frameBackBuffer[bufferPos + 27] = even;
        frameBackBuffer[bufferPos + 28] = odd; frameBackBuffer[bufferPos + 29] = even; frameBackBuffer[bufferPos + 30] = odd; frameBackBuffer[bufferPos + 31] = even;
    }

    function renderSprites1LineSize0(line, bufferPos) {                     // Mode 1, 8x8 normal
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, name, color, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;


        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i = i + 1) {                                      // Max of 32 sprites
            atrPos = atrPos + 4;
            sprite = sprite + 1;
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

    function renderSprites1LineSize1(line, bufferPos) {                     // Mode 1, 8x8 double
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, name, color, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i = i + 1) {                                      // Max of 32 sprites
            atrPos = atrPos + 4;
            sprite = sprite + 1;
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

    function renderSprites1LineSize2(line, bufferPos) {                     // Mode 1, 16x16 normal
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, color, name, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i = i + 1) {                                      // Max of 32 sprites
            atrPos = atrPos + 4;
            sprite = sprite + 1;
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

    function renderSprites1LineSize3(line, bufferPos) {                     // Mode 1, 16x16 double
        if (vram[spriteAttrTableAddress] === 208) return;                   // No sprites to show!

        var atrPos, name, color, lineInPattern, pattern;
        var sprite = -1, drawn = 0, invalid = -1, y, spriteLine, x, s, f;
        spritesCollided = false;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; i = i + 1) {                                      // Max of 32 sprites
            atrPos = atrPos + 4;
            sprite = sprite + 1;
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
        for (var i = finish - 1; i >= start; i = i -1, pos = pos + 1) {
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
        for (var i = finish - 1; i >= start; i = i -1, pos = pos + 1) {
            var s = (pattern >> (i >>> 1)) & 0x01;
            if (s === 0) continue;
            var destValue = dest[pos];
            // Transparent sprites (color = 0) just "mark" their presence setting dest Alpha to Full, so collisions can be detected
            if (destValue < 0xff000000) dest[pos] = color === 0 ? destValue | 0xff000000 : value;
            else if (!spritesCollided) spritesCollided = collide;
        }
    }

    function renderSprites2LineSize0(line, bufferPos) {                     // Mode 2, 8x8 normal
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i = i + 1) {                                // Max of 32 sprites
            sprite = sprite + 1;
            atrPos = atrPos + 4;
            colorPos = colorPos + 16;
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

            if ((color & 0xf) === 0) continue;

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

    function renderSprites2LineSize1(line, bufferPos) {                     // Mode 2, 8x8 double
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i = i + 1) {                                // Max of 32 sprites
            sprite = sprite + 1;
            atrPos = atrPos + 4;
            colorPos = colorPos + 16;
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

            if ((color & 0xf) === 0) continue;

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

    function renderSprites2LineSize2(line, bufferPos) {                     // Mode 2, 16x16 normal
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i = i + 1) {                                // Max of 32 sprites
            sprite = sprite + 1;
            atrPos = atrPos + 4;
            colorPos = colorPos + 16;
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

            if ((color & 0xf) === 0) continue;

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

    function renderSprites2LineSize3(line, bufferPos) {                     // Mode 2, 16x16 double
        if (vram[spriteAttrTableAddress + 512] === 216) return;             // No sprites to show!

        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, invalid = -1, y, spriteLine, x, s, f, cc;

        spritesCollided = false;
        sprites2GlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; i = i + 1) {                                // Max of 32 sprites
            sprite = sprite + 1;
            atrPos = atrPos + 4;
            colorPos = colorPos + 16;
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
        for (var i = finish - 1; i >= start; i = i - 1, x = x + 1, bufferPos = bufferPos + 1) {
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
        for (var i = finish - 1; i >= start; i = i - 1, x = x + 1, bufferPos = bufferPos + 1) {
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
        for (var i = finish - 1; i >= start; i = i - 1, x = x + 1, bufferPos = bufferPos + 1) {
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
        for (var i = finish - 1; i >= start; i = i - 1, x = x + 1, bufferPos = bufferPos + 1) {
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

    function refresh() {
        // Send frame to monitor
        videoSignal.newFrame(frameCanvas, 0, 0, signalMetrics.totalWidth, signalMetrics.totalHeight);
        refreshPending = false;
    }

    function beginFrame() {
        currentScanline = startingScanline;
        bufferPosition = 0;

        //logInfo("Begin Frame");
    }

    function finishFrame() {

        //wmsx.Util.log("Frame FINISHED. CurrentScanline: " + currentScanline + ", CPU cycles: " + cpu.eval("cycles"));
        //cpu.eval("cycles = 0");

        // Update frame image from backbuffer
        frameContext.putImageData(frameImageData, 0, 0, 0, 0, signalMetrics.totalWidth, signalMetrics.totalHeight);
        refreshPending = true;
        frame = frame + 1;

        beginFrame();
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
        var colors = isV9918 ? colorPaletteInitialV9918 : colorPaletteInitialV9938;
        for (var c = 0; c < 16; c = c + 1) {
            colorPalette[c] = colors[c];
            paletteRegister[c] = paletteRegisterInitialValuesV9938[c];
        }
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

    function initSprites2Control() {
        sprites2LinePriorities = wmsx.Util.arrayFill(sprites2LinePriorities ? sprites2LinePriorities :new Array(256), SPRITE_MAX_PRIORITY);
        sprites2LineColors =     wmsx.Util.arrayFill(sprites2LineColors ? sprites2LineColors : new Array(256), 0);
        sprites2GlobalPriority = SPRITE_MAX_PRIORITY;      // Decreasing value for sprite priority control. Never resets!
    }


    var SPRITE_MAX_PRIORITY = 9000000000000000;


    var frame;
    var desiredBaseFrequency;       // Will depend on VideoStandard and detected Host Native Video Frequency

    var videoStandard;
    var vSynchMode;

    var bufferPosition;
    var currentScanline;

    var cycles, lastCPUCyclesComputed;

    var startingScanline;
    var finishingScanline;
    var startingActiveScanline;
    var startingTopBorderScanline;
    var startingBottomBorderScanline;
    var startingInvisibleScanline;
    var scanlinesPerCycle;
    var pulldownFirstFrameLinesAdjust;
    var refreshPending;

    var horizontalIntLine = 0;

    var status = new Array(10);
    var register = new Array(47);
    var paletteRegister = new Array(16);

    var mode;
    var modeData;
    var signalMetrics;

    var pendingModeChange;
    var pendingBlankingChange;

    var spritesCollided;
    var sprites2LinePriorities, sprites2LineColors, sprites2GlobalPriority;

    var vramPointer = 0;
    var dataToWrite;
    var paletteFirstWrite;

    var backdropColor;
    var backdropValue;
    var backdropFullLine512Values = new Uint32Array(544);
    var backdropFullLine256Values = backdropFullLine512Values.subarray(272);

    var verticalAdjust, horizontalAdjust;

    var signalMetricsV9918 =  { width: 256, height: 192, vertBorderSize:  8, totalWidth: 272, totalHeight: 208 };
    var signalMetrics256 =    { width: 256, height: 192, vertBorderSize: 18, totalWidth: 272, totalHeight: 228 };
    var signalMetrics256e =   { width: 256, height: 212, vertBorderSize:  8, totalWidth: 272, totalHeight: 228 };
    var signalMetrics512 =    { width: 512, height: 192, vertBorderSize: 18, totalWidth: 544, totalHeight: 228 };
    var signalMetrics512e =   { width: 512, height: 212, vertBorderSize:  8, totalWidth: 544, totalHeight: 228 };

    var layoutTableAddress;                         // Dynamic values, set by software
    var colorTableAddress;
    var patternTableAddress;
    var spriteAttrTableAddress;
    var spritePatternTableAddress;

    var layoutTableAddressMask;                     // Dynamic values, depends on mode
    var colorTableAddressMask;
    var patternTableAddressMask;

    var layoutTableAddressMaskBase = ~(-1 << 10);   // Fixed base values for all modes
    var colorTableAddressMaskBase = ~(-1 << 6);
    var patternTableAddressMaskBase = ~(-1 << 11);

    var modes = wmsx.Util.arrayFillFunc(new Array(32), function(i) {
        return    { code: 0xff, name: "Invalid",   isV9938: true, sigMetrics: signalMetrics256e, sigMetricsExt: signalMetrics256e, layTBase: -1 << 10, colorTBase: -1 <<  6, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, sprPatTBase: -1 << 11, layLineBytes:   0, updLine: renderLineBorders, updLineDeb: renderLineBorders,     spriteMode: 0 };
    });

    modes[0x10] = { code: 0x10, name: "Screen 0",  isV9938: false, sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, layTBase: -1 << 10, colorTBase:        0, patTBase: -1 << 11, sprAttrTBase:        0, sprPatTBase:        0, layLineBytes:   0, updLine: renderLineModeT1,  updLineDeb: renderLineModeT1Debug, spriteMode: 0 };
    modes[0x12] = { code: 0x12, name: "Screen 0+", isV9938: true,  sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512e, layTBase: -1 << 12, colorTBase:        0, patTBase: -1 << 11, sprAttrTBase:        0, sprPatTBase:        0, layLineBytes:   0, updLine: renderLineModeT2,  updLineDeb: renderLineModeT2     , spriteMode: 0 };
    modes[0x08] = { code: 0x08, name: "Screen 3",  isV9938: false, sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, layTBase: -1 << 10, colorTBase:        0, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, sprPatTBase: -1 << 11, layLineBytes:   0, updLine: renderLineModeMC,  updLineDeb: renderLineModeMCDebug, spriteMode: 1 };
    modes[0x00] = { code: 0x00, name: "Screen 1",  isV9938: false, sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, layTBase: -1 << 10, colorTBase: -1 <<  6, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, sprPatTBase: -1 << 11, layLineBytes:   0, updLine: renderLineModeG1,  updLineDeb: renderLineModeG1Debug, spriteMode: 1 };
    modes[0x01] = { code: 0x01, name: "Screen 2",  isV9938: false, sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, layTBase: -1 << 10, colorTBase: -1 << 13, patTBase: -1 << 13, sprAttrTBase: -1 <<  7, sprPatTBase: -1 << 11, layLineBytes:   0, updLine: renderLineModeG2,  updLineDeb: renderLineModeG2Debug, spriteMode: 1 };
    modes[0x02] = { code: 0x02, name: "Screen 4",  isV9938: true,  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, layTBase: -1 << 10, colorTBase: -1 << 13, patTBase: -1 << 13, sprAttrTBase: -1 << 10, sprPatTBase: -1 << 11, layLineBytes:   0, updLine: renderLineModeG3,  updLineDeb: renderLineModeG3     , spriteMode: 2 };
    modes[0x03] = { code: 0x03, name: "Screen 5",  isV9938: true,  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, layTBase: -1 << 15, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprPatTBase: -1 << 11, layLineBytes: 128, updLine: renderLineModeG4,  updLineDeb: renderLineModeG4     , spriteMode: 2 };
    modes[0x04] = { code: 0x04, name: "Screen 6",  isV9938: true,  sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512e, layTBase: -1 << 15, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprPatTBase: -1 << 11, layLineBytes: 128, updLine: renderLineModeG5,  updLineDeb: renderLineModeG5     , spriteMode: 2 };
    modes[0x05] = { code: 0x05, name: "Screen 7",  isV9938: true,  sigMetrics: signalMetrics512, sigMetricsExt: signalMetrics512e, layTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprPatTBase: -1 << 11, layLineBytes: 256, updLine: renderLineModeG6,  updLineDeb: renderLineModeG6     , spriteMode: 2 };
    modes[0x07] = { code: 0x07, name: "Screen 8",  isV9938: true,  sigMetrics: signalMetrics256, sigMetricsExt: signalMetrics256e, layTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, sprPatTBase: -1 << 11, layLineBytes: 256, updLine: renderLineModeG7,  updLineDeb: renderLineModeG7     , spriteMode: 2 };

    var renderLine, renderLineActive, renderSpritesLine, blankedLineValues;         // Update functions for current mode
    var renderSpritesLineFunctionsMode1 = [renderSprites1LineSize0, renderSprites1LineSize1, renderSprites1LineSize2, renderSprites1LineSize3 ];
    var renderSpritesLineFunctionsMode2 = [renderSprites2LineSize0, renderSprites2LineSize1, renderSprites2LineSize2, renderSprites2LineSize3 ];

    var vram = new Uint8Array(wmsx.V9938.VRAM_LIMIT + 1);
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

    var colorPaletteInitialV9938 = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe24db24, 0xfe6dff6d, 0xfeff2424, 0xfeff6d49, 0xfe2424b6, 0xfeffdb49, 0xfe2424ff, 0xfe6d6dff, 0xfe24dbdb, 0xfe92dbdb, 0xfe249224, 0xfeb649db, 0xfeb6b6b6, 0xfeffffff ]);
    var colorPaletteInitialV9918 = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe28ca07, 0xfe65e23d, 0xfef04444, 0xfef46d70, 0xfe1330d0, 0xfef0e840, 0xfe4242f3, 0xfe7878f4, 0xfe30cad0, 0xfe89dcdc, 0xfe20a906, 0xfec540da, 0xfebcbcbc, 0xfeffffff ]);
    var paletteRegisterInitialValuesV9938 = [ 0x000, 0x000, 0x189, 0x1db, 0x04f, 0x0d7, 0x069, 0x197, 0x079, 0x0fb, 0x1b1, 0x1b4, 0x109, 0x0b5, 0x16d, 0x1ff ];


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

    var lineStartCPUCycles = 0;


    // Connections

    var videoSignal;
    var cpuClockPulses;
    var psgClockPulse;
    var commandProcessor;

    // Savestate  -------------------------------------------

    this.saveState = function() {
        // TODO VideoStandard
        return {
            v1: isV9918,
            l: currentScanline, b: bufferPosition,
            c: cycles, cc: lastCPUCyclesComputed,
            vp: vramPointer, d: dataToWrite, pw: paletteFirstWrite,
            ha: horizontalAdjust, va: verticalAdjust, hil: horizontalIntLine,
            pmc: pendingModeChange, pbc: pendingBlankingChange,
            r: wmsx.Util.storeUInt8ArrayToStringBase64(register), s: wmsx.Util.storeUInt8ArrayToStringBase64(status), p: wmsx.Util.storeUInt8ArrayToStringBase64(paletteRegister),
            c0: color0SetValue, pal: wmsx.Util.storeUInt32ArrayToStringBase64(colorPalette),
            vram: wmsx.Util.compressUInt8ArrayToStringBase64(vram),
            cp: commandProcessor.saveState()
        };
    };

    this.loadState = function(s) {
        isV9918 = s.v1;
        currentScanline = s.l; bufferPosition = s.b;
        cycles = s.c; lastCPUCyclesComputed = s.cc;
        vramPointer = s.vp; dataToWrite = s.d; paletteFirstWrite = s.pw;
        horizontalAdjust = s.ha; verticalAdjust = s.va; horizontalIntLine = s.hil;
        pendingModeChange = s.pmc; pendingBlankingChange = s.pbc;
        register = wmsx.Util.restoreStringBase64ToUInt8Array(s.r); status = wmsx.Util.restoreStringBase64ToUInt8Array(s.s); paletteRegister = wmsx.Util.restoreStringBase64ToUInt8Array(s.p);
        color0SetValue = s.c0; colorPalette = wmsx.Util.restoreStringBase64ToUInt32Array(s.pal);
        vram = wmsx.Util.uncompressStringBase64ToUInt8Array(s.vram);         // Already UInt8Array
        commandProcessor.loadState(s.cp);
        commandProcessor.connectVDP(this, vram, register, status);
        updateIRQ();
        updateMode();
        updateBackdropColor();
        updateTransparency();
        initSprites2Control();
    };


    init();


    function logInfo(text) {
        console.log(text + ". Frame: " + frame + ", line: " + (currentScanline - startingActiveScanline) + ", cpuCycle: " + (cpu.getCycles() - lineStartCPUCycles));
    }
    this.logInfo = logInfo;

    this.eval = function(str) {
        return eval(str);
    };

};

wmsx.V9938.VRAM_LIMIT = 0x1ffff;      // 128K
