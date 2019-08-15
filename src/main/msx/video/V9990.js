// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// V9990 VDP
// This implementation is line-accurate
// Digitize, Superimpose, Color Bus, External Synch, B/W Mode, Wait Function not supported
// Original base clock: 2147727 Hz which is 6x CPU clock

wmsx.V9990 = function(machine, vdp, cpu) {
"use strict";

    var self = this;

    function init() {
        videoSignal = new wmsx.VideoSignal("V9990", self);
        initFrameResources(false);
        initColorCaches();
        initDebugPatternTables();
        modeData = modes[-1];
        typeData = types[-1];
        self.setDefaults();
        commandProcessor = new wmsx.V9990CommandProcessor();
        commandProcessor.connectV9990(self, vram, register);
        commandProcessor.setV9990ModeData(modeData, typeData, imageWidth, imageHeight);
    }

    this.connect = function(machine) {
        machine.vdp.connectSlave(this);
        machine.bus.connectInputDevice( 0x60, this.input60);
        machine.bus.connectOutputDevice(0x60, this.output60);
        machine.bus.connectInputDevice( 0x61, this.input61);
        machine.bus.connectOutputDevice(0x61, this.output61);
        machine.bus.connectInputDevice( 0x62, this.input62);
        machine.bus.connectOutputDevice(0x62, this.output62);
        machine.bus.connectInputDevice( 0x63, this.input63);
        machine.bus.connectOutputDevice(0x63, this.output63);
        machine.bus.connectInputDevice( 0x64, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectOutputDevice(0x64, this.output64);
        machine.bus.connectInputDevice( 0x65, this.input65);
        machine.bus.connectOutputDevice(0x65, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.connectInputDevice( 0x66, this.input66);
        machine.bus.connectOutputDevice(0x66, this.output66);
        machine.bus.connectInputDevice( 0x67, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectOutputDevice(0x67, this.output67);
        // 0x68 - 0x6f not used
    };

    this.disconnect = function(machine) {
        machine.vdp.connectSlave(undefined);
        machine.bus.disconnectInputDevice( 0x60, this.input60);
        machine.bus.disconnectOutputDevice(0x60, this.output60);
        machine.bus.disconnectInputDevice( 0x61, this.input61);
        machine.bus.disconnectOutputDevice(0x61, this.output61);
        machine.bus.disconnectInputDevice( 0x62, this.input62);
        machine.bus.disconnectOutputDevice(0x62, this.output62);
        machine.bus.disconnectInputDevice( 0x63, this.input63);
        machine.bus.disconnectOutputDevice(0x63, this.output63);
        machine.bus.disconnectInputDevice( 0x64, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0x64, this.output64);
        machine.bus.disconnectInputDevice( 0x65, this.input65);
        machine.bus.disconnectOutputDevice(0x65, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.disconnectInputDevice( 0x66, this.input66);
        machine.bus.disconnectOutputDevice(0x66, this.output66);
        machine.bus.disconnectInputDevice( 0x67, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0x67, this.output67);
        // 0x68 - 0x6f not used
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

        // logInfo("VideoStandard set: " + videoStandard.name);
    };

    this.setVSynchMode = function(mode) {
        vSynchMode = mode;
        updateSynchronization();
    };

    this.getVideoSignal = function() {
        return videoSignal;
    };

    // VRAM Data Read
    this.input60 = function() {
        var res = vramReadData;
        if (vramPointerReadInc)
            if (++vramPointerRead > VRAM_LIMIT) vramPointerRead &= VRAM_LIMIT;
        vramReadData = vram[vramPointerRead];
        return res;
    };

    // VRAM Data Write
    this.output60 = function(val) {
        //if (vramPointerWrite >= 0x7c000) logInfo("VRAM " + vramPointerWrite.toString(16) + ": " + val.toString(16));

        vram[vramPointerWrite] = val;
        if (vramPointerWriteInc)
            if (++vramPointerWrite > VRAM_LIMIT) vramPointerWrite &= VRAM_LIMIT;
    };

    // Palette Data Read
    this.input61 = function() {
        if ((palettePointer & 0x03) === 3) {
            // Dummy read and stay at same RGB entry
            if (palettePointerReadInc) palettePointer &= 0xfc;
            return 0;
        }
        var res = paletteRAM[palettePointer];
        if (palettePointerReadInc) {
            if ((palettePointer & 0x03) === 2) palettePointer = (palettePointer + 2) & 0xff;    // Jump one byte to the next RGB entry
            else ++palettePointer;
        }
        return res;
    };

    // Palette Data Write
    this.output61 = function(val) {
        //logInfo("PaletteWrite " + palettePointer.toString(16) + ": " + val.toString(16));

        if ((palettePointer & 0x03) === 3) {
            // Ignore write and stay at same RGB entry
            palettePointer &= ~0x03;
            return;
        }
        val &= (palettePointer & 0x03) === 0 ? 0x9f : 0x1f;                                 // 5 bits R/G/B, YS bit for R only
        if (val !== paletteRAM[palettePointer]) {
            paletteRAM[palettePointer] = val;
            updatePaletteValue(palettePointer >> 2);
        }
        if ((palettePointer & 0x03) === 2) palettePointer = (palettePointer + 2) & 0xff;    // Jump one byte to the next RGB entry
        else ++palettePointer;
    };

    // Command Data Read
    this.input62 = function() {
        return commandProcessor.cpuRead();
    };

    // Command Data Write
    this.output62 = function(val) {
        commandProcessor.cpuWrite(val);
    };

    // Register Data Read
    this.input63 = function() {
        var res = register[registerSelect] | REG_READ_OR[registerSelect];

        // if (registerSelect === 17 || registerSelect === 18) logInfo("Reg READ " + registerSelect + " = " + res.toString(16));

        if (registerSelectReadInc)
            if (++registerSelect > 0x3f) registerSelect &= 0x3f;
        return res;
    };

    // Register Data Write
    this.output63 = function(val) {
        // if (registerSelect === 17 || registerSelect === 18) logInfo("Reg Write " + registerSelect + " : " + val.toString(16));

        registerWrite(registerSelect, val);
        if (registerSelectWriteInc)
            if (++registerSelect > 0x3f) registerSelect &= 0x3f;
    };

    // Register Select Write
    this.output64 = function(val) {
        registerSelect = val & 0x3f;
        registerSelectWriteInc = (val & 0x80) === 0;
        registerSelectReadInc =  (val & 0x40) === 0;

        // logInfo("Register Select : " + val.toString(16));
    };

    // Status Read
    this.input65 = function() {
        // if (self.TEST) logInfo("Status READ = " + status.toString(16));

        return status;
    };

    // Interrupt Flags Read
    this.input66 = function() {
        // logInfo("Int Flags READ = " + interruptFlags.toString(16));

        return interruptFlags;
    };

    // Interrupt Flags Write
    this.output66 = function(val) {
        if ((val & 0x07) === 0) return;

        // logInfo("Int Flags WRITE : " + val.toString(16));

        interruptFlags &= ~val;
        updateIRQ()
    };

    // System Control Write
    this.output67 = function(val) {
        var mod = systemControl ^ val;
        systemControl = val;

        if (mod & 0x02) {                              // SRS
            logInfo("SOFT RESET: " + ((systemControl & 0x02) ? "ON" : "OFF"));
            if ((systemControl & 0x02) !== 0) self.reset();
        }
        if (mod & 0x01) {                              // MCS
            status = (status & ~0x04) | ((systemControl & 0x01) << 2);
            updateMode();
        }
    };

    this.setVDPTurboMulti = function(multi) {
        commandProcessor.setVDPTurboMulti(multi);
    };

    this.getVDPTurboMulti = function() {
        return commandProcessor.getVDPTurboMulti();
    };

    this.setDefaults = function() {
        self.setDebugMode(STARTING_DEBUG_MODE);
        self.setSpriteDebugMode(STARTING_SPRITES_DEBUG_MODE);
    };

    this.reset = function() {
        registerSelect = 0; registerSelectReadInc = true; registerSelectWriteInc = true;
        vramPointerRead = 0; vramPointerWrite = 0; vramPointerReadInc = true; vramPointerWriteInc = true; vramReadData = 0;
        palettePointer = 0; palettePointerReadInc = true;
        paletteOffsetA = 0; paletteOffsetB = 0; paletteOffset = 0;
        ysEnabled = false;
        scrollXOffset = 0; scrollYOffset = 0; scrollXBOffset = 0; scrollYBOffset = 0; scrollYMax = 0;
        planeAEnabled = true; planeBEnabled = true;
        vramEOLineShift = 0; vramEOLineAdd = 0;

        frame = cycles = lastBUSCyclesComputed = 0;
        verticalAdjust = horizontalAdjust = 0;
        backdropColor = 0; backdropValue = solidBlackValue; backdropCacheUpdatePending = true;
        dispEnabled = false; dispChangePending = false;
        horizontalIntLine = 0;
        vramInterleaving = false;
        renderMetricsChangePending = false;
        refreshWidth = refreshHeight = 0;
        frameVideoStandard = videoStandard; framePulldown = pulldown;
        currentScanline = -1;
        initVRAM();
        initRegisters();
        initColorPalette();
        commandProcessor.reset();
        updateSignalMetrics(true);
        updateIRQ();
        updateMode();
        updateBackdropColor();
        updateSynchronization();
        beginFrame();
    };

    this.updateCycles = function() {
        return vdp.updateCycles();
    };

    this.getScreenText = function() {
    };

    this.setStatusTR = function (val) {
        if (val) status |= 0x80;
        else status &= ~0x80;
    };

    this.setStatusBD = function (val) {
        if (val) status |= 0x10;
        else status &= ~0x10;
    };

    this.setStatusCE = function (val) {
        // TODO V9990: Handle CE int flag and update IRQ
        if (val) status |= 0x01;
        else status &= ~0x01;
    };

    function updateVRAMReadPointer() {
        vramPointerRead = ((register[5] << 16) | (register[4] << 8) | register[3]) & VRAM_LIMIT;
        vramPointerReadInc = (register[5] & 0x80) === 0;
        vramReadData = vram[vramPointerRead];
    }

    function updateVRAMWritePointer() {
        vramPointerWrite = ((register[2] << 16) | (register[1] << 8) | register[0]) & VRAM_LIMIT;
        vramPointerWriteInc = (register[2] & 0x80) === 0;
    }

    function updatePalettePointer() {
        palettePointer = register[14];

        //logInfo("PalettePointer " + palettePointer.toString(16));
    }

    function updatePalettePointerReadInc() {
        palettePointerReadInc = (register[13] & 0x10) === 0;    // PLTAIH
    }

    function updatePaletteOffsets() {
        paletteOffsetA = (register[13] & 0x03) << 4;
        paletteOffsetB = (register[13] & 0x0c) << 2;
        paletteOffset = (paletteOffsetB << 2) | paletteOffsetA;
    }

    function updateYSEnabled() {
        //ysEnabled = (register[8] & 0x20) !== 0;          // YSE
        for (var e = 63; e >= 0; --e) updatePaletteValue(e);
    }

    function registerWrite(reg, val) {
        var add;
        var mod = register[reg] ^ val;
        register[reg] = val & REG_WRITE_MASK[reg];

        // logInfo("Reg: " + reg + ": " + val.toString(16));

        switch (reg) {
            case 0: case 1: case 2:
                updateVRAMWritePointer();
                break;
            case 3: case 4: case 5:
                updateVRAMReadPointer();
                break;
            case 6:
                if (mod & 0xf0) updateMode();                   // DSPM, DCKM (will also update Type)
                else if (mod & 0xc3) updateType();              // DSPM, CLRM (will also update ImageSize)
                else if (mod & 0x0c) updateImageSize();         // XIMM
                break;
            case 7:
                if (mod & 0x08) updateVideoStandardSoft();      // PAL
                if (mod & 0x40) updateMode();                   // C25M (will also update RenderMetrics)
                else if (mod & 0x02) updateRenderMetrics();     // IL
                break;
            case 8:
                if (mod & 0x80) {                               // DISP
                    dispChangePending = true;                   // only detected at VBLANK
                    //logInfo("Blanking: " + !!(val & 0x40));
                }
                if (mod & 0x20) updateYSEnabled();              // YSE
                break;
            case 9:
                if (mod & 0x07) updateIRQ();                    // IECE, IEH, IEV
                break;
            case 13:
                if (mod & 0xe0) updateType();                   // PLTM, YAE (will also update ImageSize)
                if (mod & 0x10) updatePalettePointerReadInc();  // PLTAIH
                if (mod & 0x0f) updatePaletteOffsets();         // PLTO5-2
                break;
            case 14:
                updatePalettePointer();
                break;
            case 15:
                if (mod & 0x3f) updateBackdropColor();          // BDC
                break;
            case 16:
                if (mod & 0x0f)
                    horizontalAdjust = -7 + ((val & 0x0f) ^ 0x07);
                if (mod & 0xf0) {
                    verticalAdjust = -7 + ((val >>> 4) ^ 0x07);
                    updateSignalMetrics(false);
                }
                break;
            case 18:
                if (mod & 0xc0) updateScrollYMax();             // R512, R256
                // fall through
            case 17: case 19: case 20:
                updateScroll();
                break;
            case 22:
                if (mod & 0xc0) updatePlanesEnabled();          // *SDA, *SDB
                // fall through
            case 21: case 23: case 24:
                updateScrollB();
                break;
            case 25:
                updateSpritePattAddress();
                break;
            case 52:
                commandProcessor.startCommand(val);
                break;
        }


        return;

        switch (reg) {

            case 1:
                //if (mod) logInfo("Register1: " + val.toString(16));

                if (mod & 0x40) {                                        // BL
                    dispChangePending = true;      // only at next line

                    //logInfo("Blanking: " + !!(val & 0x40));
                }
                // if (mod & 0x18) updateMode();                            // Mx
                // if (mod & 0x04) updateBlinking();                        // CDR  (Undocumented, changes reg 13 timing to lines instead of frames)
                // if (mod & 0x03) updateSpritesConfig();                   // SI, MAG
                break;
            case 10:
                if ((mod & 0x07) === 0) break;
            // else fall through
            case 3:
                add = ((register[10] << 14) | (register[3] << 6)) & 0x1ffff;
                // colorTableAddress = add & modeData.colorTBase;
                // colorTableAddressMask = add | colorTableAddressMaskBase;

                //logInfo("Setting: " + val.toString(16) + " to ColorTableAddress: " + colorTableAddress.toString(16));

                break;
            case 4:
                if ((mod & 0x3f) === 0) break;
                add = (val << 11) & 0x1ffff;
                // patternTableAddress = add & modeData.patTBase;
                // patternTableAddressMask = add | patternTableAddressMaskBase;

                //logInfo("Setting: " + val.toString(16) + " to PatternTableAddress: " + patternTableAddress.toString(16));

                break;
            case 11:
                if ((mod & 0x03) === 0) break;
            // else fall through
            case 5:
                add = ((register[11] << 15) | (register[5] << 7)) & 0x1ffff;
                // spriteAttrTableAddress = add & modeData.sprAttrTBase;

                //logInfo("SpriteAttrTable: " + spriteAttrTableAddress.toString(16));

                break;
            case 6:
                // if (mod & 0x3f) updateSpritePatternTableAddress();
                break;
            case 7:
                if (mod & (modeData.bdPaletted ? 0x0f : 0xff)) updateBackdropColor();  // BD
                break;
            case 8:
                //if (mod & 0x20) updateTransparency();                    // TP
                // if (mod & 0x02) updateSpritesConfig();                   // SPD
                break;
            case 9:
                if (mod & 0x80) updateSignalMetrics(false);              // LN
                if (mod & 0x08) updateRenderMetrics(false);              // IL
                // if (mod & 0x04) updateLayoutTableAddressMask();          // EO
                if (mod & 0x02) updateVideoStandardSoft();               // NT
                break;
            case 13:
                //updateBlinking();                                        // Always, even with no change
                break;
            case 14:
                if (mod & 0x07) vramPointerWrite = ((val & 0x07) << 14) | (vramPointerWrite & 0x3fff);

                //console.log("Setting reg14: " + val.toString(16) + ". VRAM Pointer: " + vramPointer.toString(16));

                break;
            case 18:
                if (mod & 0x0f) horizontalAdjust = -7 + ((val & 0x0f) ^ 0x07);
                if (mod & 0xf0) {
                    verticalAdjust = -7 + ((val >>> 4) ^ 0x07);
                    updateSignalMetrics(false);
                }
                break;
            case 19:
                horizontalIntLine = (val - register[23]) & 255;

                // logInfo("Line Interrupt set: " + val + ", reg23: " + register[23]);

                break;
            case 23:
                horizontalIntLine = (register[19] - val) & 255;

                //logInfo("Vertical offset set: " + val);

                break;
            case 25:
                // if (mod & 0x18) updateMode();                        // YJK, YAE
                // leftMask = (val & 0x02) !== 0;                       // MSK
                // leftScroll2Pages = (val & 0x01) !== 0;               // SP2
                break;
            case 26:
                // leftScrollChars = val & 0x3f;                        // H08-H03
                // leftScrollCharsInPage = leftScrollChars & 31;
                break;
            case 27:
                // rightScrollPixels = val & 0x07;             // H02-H01

                // logInfo("Reg17 - Right Scroll set: " + val);

                break;
            case 44:
                commandProcessor.cpuWrite(val);
                break;
            case 46:
                commandProcessor.startCommand(val);
                break;
        }
    }

    function updatePaletteValue(entry) {
        //logInfo("updatePaletteValue entry " + entry + ": " + val);

        var index = entry << 2;
        var r = paletteRAM[index];
        var value = ysEnabled && (r & 0x80) ? superImposeValue : 0xff000000        // YS
            | (color5to8bits[paletteRAM[index + 2]]) << 16
            | (color5to8bits[paletteRAM[index + 1]]) << 8
            | color5to8bits[r & 0x1f];

        paletteValuesReal[entry] = value;

        if (debugModeSpriteHighlight) value &= DEBUG_DIM_ALPHA_MASK;
        paletteValues[entry] = value;

        if (entry === backdropColor) updateBackdropValue();
    }

    this.setDebugMode = function (mode) {
        debugMode = (mode + 8) % 8;
        var oldDebugModeSpriteHighlight = debugModeSpriteHighlight;
        debugModeSpriteHighlight = debugMode >= 1 && debugMode <= 3;
        debugModeSpriteInfo = debugMode === 2 || debugMode === 3;
        debugModeSpriteInfoNumbers = debugMode === 2;
        // mode 3 is SpriteInfoName
        debugModeSpritesHidden = debugMode >= 4;
        var oldDebugModePatternInfo = debugModePatternInfo;
        debugModePatternInfo = debugMode >= 5;
        debugModePatternInfoBlocks = debugMode === 6;
        debugModePatternInfoNames = debugMode === 7;
        if (oldDebugModeSpriteHighlight !== debugModeSpriteHighlight || oldDebugModePatternInfo !== debugModePatternInfo) debugAdjustPalette();
        initFrameResources(debugModeSpriteHighlight);
        updateLineActiveType();
        updateSpritePattAddress();
    };

    this.setSpriteDebugMode = function(mode) {
        spriteDebugMode = mode >= 0 ? mode % 4 : 4 + mode;
        spriteDebugModeLimit = (spriteDebugMode === 0) || (spriteDebugMode === 2);
    };

    function debugAdjustPalette() {
        for (var entry = 0; entry < 64; entry++) updatePaletteValue(entry);
    }

    function updateSynchronization() {
        // According to the native video frequency detected, target Video Standard and vSynchMode, use a specific pulldown configuration
        if (vSynchMode === 1) {    // ON
            // Will V-synch to host freq if detected and supported, or use optimal timer configuration)
            pulldown = videoStandard.pulldowns[machine.getVideoClockSocket().getVSynchNativeFrequency()] || videoStandard.pulldowns.TIMER;
        } else {                        // OFF, DISABLED
            // No V-synch. Always use the optimal timer configuration)
            pulldown = videoStandard.pulldowns.TIMER;
        }

        // console.log("Update Synchronization. Pulldown " + pulldown.standard + " " + pulldown.frequency);
    }

    this.cycleEventRefresh = function() {
        refresh();
    };

    this.lineEventStartActiveDisplay = function() {
        status &= ~0x20;                                                                        // HR = 0

        // Verify and change sections of the screen
        if (currentScanline === frameStartingActiveScanline)
            enterActiveDisplay();
    };

    this.lineEventRenderLine = function() {
        if (currentScanline >= startingVisibleTopBorderScanline
            && currentScanline < startingInvisibleScanline) renderLine();                       // Only render if visible
    };

    this.lineEventEndActiveDisplay = function() {
        status |= 0x20;                                                                         // HR = 1

        if (currentScanline - frameStartingActiveScanline === horizontalIntLine)
            triggerHorizontalInterrupt();

        if (currentScanline - frameStartingActiveScanline === signalActiveHeight - 1)
            enterBorderDisplay();
    };

    this.lineEventEnd = function() {
        currentScanline = currentScanline + 1;
        if (currentScanline >= finishingScanline) finishFrame();
    };

    this.triggerCommandCompletionInterrupt = function() {
        if (interruptFlags & 0x04) return;          // CE already == 1 ?
        interruptFlags |= 0x04;                     // CE = 1
        updateIRQ();

        // logInfo("Command Completion Int. Ints " + ((register[9] & 0x04) ?  "ENABLED" : "disabled"));
    };

    function triggerVerticalInterrupt() {
        if (interruptFlags & 0x01) return;          // VI already == 1 ?
        interruptFlags |= 0x01;                     // VI = 1
        updateIRQ();

        // logInfo("Vertical Frame Int reached. Ints " + ((register[9] & 0x01) ?  "ENABLED" : "disabled"));
    }

    function triggerHorizontalInterrupt() {
        if (interruptFlags & 0x02) return;          // HI already == 1 ?
        interruptFlags |= 0x02;                     // HI = 1
        updateIRQ();

        // logInfo("Horizontal Int Line reached. Ints " + ((register[9] & 0x02) ?  "ENABLED" : "disabled"));
    }

    function updateIRQ() {
        if (register[9] & interruptFlags) {         // (IEV == 1 & VI == 1) || (IEH == 1 & HI == 1) || (IECE == 1 & CE == 1) all bits aligned
            cpu.setINTChannel(1, 0);                // V9990 using fixed channel 1. TODO V9990: INT if multiple V9990s connected?

            // logInfo(">>>  INT ON");
        } else {
            cpu.setINTChannel(1, 1);

            // logInfo(">>>  INT OFF");
        }
    }

    function updateVRAMInterleaving() {
        if (modeData.vramInter === true && !vramInterleaving) vramEnterInterleaving();
        else if (modeData.vramInter === false && vramInterleaving) vramExitInterleaving();
    }

    function vramEnterInterleaving() {
        return;

        var e = 0;
        var o = VRAM_SIZE >> 1;
        var aux = vram.slice(0, o);                 // Only first halt needs to be saved. Verify: Optimize slice?
        for (var i = 0; i < VRAM_SIZE; i += 2) {
            vram[i] = aux[e++];
            vram[i + 1] = vram[o++];
        }
        vramInterleaving = true;

        //console.log("VRAM ENTERING Interleaving");
    }

    function vramExitInterleaving() {
        return;

        var h = VRAM_SIZE >> 1;
        var e = 0;
        var o = h;
        var aux = vram.slice(h);                    // Only last half needs to be saved. Verify: Optimize slice?
        for (var i = 0; i < h; i += 2) {
            vram[e++] = vram[i];
            vram[o++] = vram[i + 1];
        }
        for (i = 0; i < h; i += 2) {
            vram[e++] = aux[i];
            vram[o++] = aux[i + 1];
        }
        vramInterleaving = false;

        //console.log("VRAM EXITING Interleaving");
    }

    function updateMode() {
        // 0 MCS C25M HSCN DSPM(2) DCKM(2)
        var modeBits = ((systemControl & 0x01) << 6) | ((register[7] & 0x40) >> 1) | ((register[7] & 0x01) << 4) | (register[6] >> 4);
        if ((modeBits & 0x0c) === 0x0c) modeBits = 0x0c;    // Special case for Stand-by mode (ignore other bits)

        modeData = modes[modeBits] || modes[-1];

        updateType();              // Also updateImageSize()
        updateSpritePattAddress();
        updateVRAMInterleaving();
        updateLineActiveType();
        updateSignalMetrics(false);
        updateRenderMetrics(false);

        logInfo("Update Mode: " + modeData.name + ", modeBits: " + modeBits.toString(16));
    }

    function updateType() {
        // DSPM(2) PLTM(2) YAE 0 CLRM(2)
        var typeBits = (register[6] & 0xc3) | (register[13] >> 5 << 3);
        if ((typeBits & 0xc0) === 0xc0) typeBits = 0xc0;        // Special case for Stand-by mode (ignore other bits)
        if ((typeBits & 0x30) < 0x20)   typeBits &= ~0x08;      // Special case for PLTM < 2, ignore YAE

        typeData = types[typeBits] || types[-1];

        updateImageSize();

        logInfo("Update Type: " + typeData.name + ", typeBits: " + typeBits.toString(16));
    }

    function updateImageSize() {
        if (modeData.name === "P1")      { imageWidth = 256; imageHeight = 2048 }       // Pattern Generator Bitmap configuration as per doc. Ignore XIMM
        else if (modeData.name === "P2") { imageWidth = 512; imageHeight = 2048 }
        else {
            imageWidth = 256 << ((register[6] & 0x0c) >> 2);        // XIMM
            imageHeight = VRAM_SIZE / ((imageWidth * typeData.bpp) >> 3);
        }

        updateScrollYMax();
        commandProcessor.setV9990ModeData(modeData, typeData, imageWidth, imageHeight);
    }

    function updateScroll() {
        scrollXOffset = register[19] | (register[20] << 3);
        scrollYOffset = register[17] | ((register[18] & 0x1f) << 8);
    }

    function updateScrollB() {
        scrollXBOffset = register[23] | (register[24] << 3);
        scrollYBOffset = register[21] | (register[22] << 8);
    }

    function updateScrollYMax() {
        scrollYMax = (register[18] & 0x80) ? 511 : (register[18] & 0x40) ? 255
            : modeData.name === "P1" || modeData.name === "P2" ? 511 : imageHeight - 1;
    }

    function updatePlanesEnabled() {
        planeAEnabled = (register[22] & 0x80) === 0;
        planeBEnabled = (register[22] & 0x40) === 0;
    }

    function updateSpritePattAddress() {
        spritePattAddress = modeData.name === "P1" ? (register[25] & 0x0e) << 14 : (register[25] & 0x0f) << 15;
    }

    function updateVideoStandardSoft() {
        var pal = (register[7] & 0x08) !== 0;
        machine.setVideoStandardSoft(pal ? wmsx.VideoStandard.PAL : wmsx.VideoStandard.NTSC);

        //logInfo("VideoStandard soft: " + (pal ? "PAL" : "NTSC"));
    }

    function updateSignalMetrics(force) {
        signalActiveHeight = modeData.height;

        // Render starts at first Top Border line
        // Total Vertical Border height is 16. UX decision: Visible top and bottom border height with no Vertical Adjust is 8. No Border in overscan modes
        var border = modeData.hasBorders * 8;
        var vertAdjust = verticalAdjust;

        startingVisibleTopBorderScanline = 16 - (16 - border);                                      // 0-7 Top Border lines left invisible (NTSC no overscan)
        startingActiveScanline = startingVisibleTopBorderScanline + border + vertAdjust;
        var startingVisibleBottomBorderScanline = startingActiveScanline + signalActiveHeight;
        startingInvisibleScanline = startingVisibleBottomBorderScanline + border - vertAdjust;      // Remaining left invisible: Bottom border, Bottom Erase, Sync and Top Erase
        finishingScanline = frameVideoStandard.totalHeight;

        if (force) frameStartingActiveScanline = startingActiveScanline;

         //logInfo("Update Signal Metrics: " + force + ", activeHeight: " + signalActiveHeight);
    }

    function updateRenderMetrics(force) {
        var newRenderWidth, newRenderHeight, newPixelWidth, newPixelHeight, pixelHeightDiv, changed = false;

        newPixelWidth = 2 >> (modeData.pixelWidthDiv - 1);
        newRenderWidth = modeData.width + modeData.hasBorders * 8 * 2 * modeData.pixelWidthDiv;

        pixelHeightDiv = modeData.allowIL && (register[7] & 0x02) ? 2 : 1;            // IL
        newPixelHeight = 2 >> (pixelHeightDiv - 1);
        newRenderHeight = (modeData.height + modeData.hasBorders * 8 * 2) * pixelHeightDiv;

        renderMetricsChangePending = false;

        if (newRenderWidth === renderWidth && newRenderHeight === renderHeight) return;

        // Only change width if forced (loadState and beginFrame)
        if (newRenderWidth !== renderWidth) {
            if (force) {
                renderWidth = newRenderWidth;
                changed = true;
            } else
                renderMetricsChangePending = true;
        }

        // Only change height if forced (loadState and beginFrame)
        if (newRenderHeight !== renderHeight) {
            if (force) {
                cleanFrameBuffer();
                renderHeight = newRenderHeight;
                changed = true;
            } else
                renderMetricsChangePending = true;
        }

        if (changed) videoSignal.setPixelMetrics(newPixelWidth, newPixelHeight);

        //logInfo("Update Render Metrics. " + force + " Asked: " + newRenderWidth + "x" + newRenderHeight + ", set: " + renderWidth + "x" + renderHeight);
    }

    function enterActiveDisplay() {
        status &= ~0x40;                                                                    // VR = 0
        if (dispChangePending) updateDispEnabled();
        setActiveDisplay();
    }

    function setActiveDisplay() {
        renderLine = renderLineActive;
    }

    function enterBorderDisplay() {
        status |= 0x40;                                                                     // VR = 1
        setBorderDisplay();
        triggerVerticalInterrupt();
    }

    function setBorderDisplay() {
        renderLine = renderLineBackdrop;
    }

    function updateDispEnabled() {
        if (dispEnabled !== ((register[8] & 0x80) !== 0)) {
            dispEnabled = !dispEnabled;
            updateLineActiveType();
        }
        dispChangePending = false;
    }

    function updateLineActiveType() {
        var wasActive = renderLine === renderLineActive;

        renderLineActive = modeData.name === "SBY" ? renderLineModeSBY              // Stand-by
            : !dispEnabled ? renderLineBackdrop                                     // DISP, but only detected at VBLANK
            // : debugModePatternInfo ? modeData.renderLinePatInfo
            : modeData.renderLine;

        if (wasActive) renderLine = renderLineActive;

        //logInfo("Update Line Active Type: " + renderLineActive.name);
    }

    function updateBackdropColor() {
        backdropColor = register[15] & 0x3f;

        //console.log("Backdrop Color: " + backdropColor + ", currentLine: " + currentScanline);

        updateBackdropValue();
    }

    function updateBackdropValue() {
        var value = debugModePatternInfo ? debugBackdropValue : paletteValuesReal[backdropColor];
        if (backdropValue === value) return;
        // value = 0xff205020;

        backdropValue = value;
        backdropCacheUpdatePending = true;

        //logInfo("Backdrop Value: " + backdropValue.toString(16));
    }

    function updateBackdropLineCache() {
        wmsx.Util.arrayFill(backdropLineCache, backdropValue);

        backdropCacheUpdatePending = false;

        //console.log("Update BackdropCaches");
    }

    function renderLineBackdrop() {
        if (backdropCacheUpdatePending) updateBackdropLineCache();
        frameBackBuffer.set(backdropLineCache, bufferPosition);
        bufferPosition += bufferLineAdvance;
        //logInfo("renderLineBorders");
    }

    function paintBackdrop8(bufferPos) {
        frameBackBuffer[bufferPos]   = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
    }

    function paintBackdrop8a(bufferPos) {
        for (var i = 8; i > 0; --i, ++bufferPos) frameBackBuffer[bufferPos] = backdropValue;
    }

    function paintBackdrop16(bufferPos) {
        frameBackBuffer[bufferPos]   = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
    }

    function paintBackdrop16a(bufferPos) {
        for (var i = 16; i > 0; --i, ++bufferPos) frameBackBuffer[bufferPos] = backdropValue;
    }

    function paintBackdrop32(bufferPos) {
        frameBackBuffer[bufferPos]   = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
    }

    function paintBackdrop32a(bufferPos) {
        for (var i = 32; i > 0; --i, ++bufferPos) frameBackBuffer[bufferPos] = backdropValue;
    }

    function paintBackdrop64(bufferPos) {
        if (backdropCacheUpdatePending) updateBackdropLineCache();
        frameBackBuffer.set(backdrop64, bufferPos);
    }

    function paintBackdrop256(bufferPos) {
        if (backdropCacheUpdatePending) updateBackdropLineCache();
        frameBackBuffer.set(backdrop256, bufferPos);
    }

    function paintBackdrop512(bufferPos) {
        if (backdropCacheUpdatePending) updateBackdropLineCache();
        frameBackBuffer.set(backdrop512, bufferPos);
    }

    function paintBackdropFullLine(bufferPos) {
        if (backdropCacheUpdatePending) updateBackdropLineCache();
        frameBackBuffer.set(backdropLineCache, bufferPos);
    }

    function renderLineModeSBY() {
        frameBackBuffer.set(standByLineCache, bufferPosition);
        bufferPosition += bufferLineAdvance;

        //logInfo("renderLineStandBy");
    }

    function renderLineModeP1() {       // Normal pixel width
        // Line
        renderLineTypePP1(bufferPosition + horizontalAdjust + 8);

        // Borders
        paintBackdrop16(bufferPosition + horizontalAdjust - 8); paintBackdrop16(bufferPosition + horizontalAdjust + 8 + 256);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeP2() {       // Half pixel width
        // Line
        renderLineTypePP2(bufferPosition + (horizontalAdjust << 1) + 16);

        // Borders
        paintBackdrop32(bufferPosition + (horizontalAdjust << 1) - 16); paintBackdrop32(bufferPosition + (horizontalAdjust << 1) + 16 + 512);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB0() {       // Normal pixel width
        // Line
        typeData.renderLine(bufferPosition + horizontalAdjust, 192);

        // Overscan: No Borders, only trimming
        paintBackdrop8(bufferPosition + horizontalAdjust - 8); paintBackdrop8(bufferPosition + horizontalAdjust + 192);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB1() {       // Normal pixel width
        // Line
        typeData.renderLine(bufferPosition + horizontalAdjust + 8, 256);

        // Borders
        paintBackdrop16(bufferPosition + horizontalAdjust - 8); paintBackdrop16(bufferPosition + horizontalAdjust + 8 + 256);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB2() {       // Normal pixel width
        // Line
        typeData.renderLine(bufferPosition + horizontalAdjust, 384);

        // Overscan: No Borders, only trimming
        paintBackdrop8(bufferPosition + horizontalAdjust - 8); paintBackdrop8(bufferPosition + horizontalAdjust + 384);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB3() {       // Half pixel width
        // Line
        typeData.renderLine(bufferPosition + (horizontalAdjust << 1) + 16, 512);

        // Borders
        paintBackdrop32(bufferPosition + (horizontalAdjust << 1) - 16); paintBackdrop32(bufferPosition + (horizontalAdjust << 1) + 16 + 512);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB4() {       // Half pixel width
        // Line
        typeData.renderLine(bufferPosition + (horizontalAdjust << 1), 768);

        // Overscan: No Borders, only trimming
        paintBackdrop16(bufferPosition + (horizontalAdjust << 1) - 16); paintBackdrop16(bufferPosition + (horizontalAdjust << 1) + 768);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB5() {       // Half pixel width
        // Line
        typeData.renderLine(bufferPosition + (horizontalAdjust << 1), 640);

        // No Borders, only trimming
        paintBackdrop16(bufferPosition + (horizontalAdjust << 1) - 16); paintBackdrop16(bufferPosition + (horizontalAdjust << 1) + 640);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB6() {       // Half pixel width
        // Line
        typeData.renderLine(bufferPosition + (horizontalAdjust << 1), 640);

        // No Borders, only trimming
        paintBackdrop16(bufferPosition + (horizontalAdjust << 1) - 16); paintBackdrop16(bufferPosition + (horizontalAdjust << 1) + 640);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineModeB7() {       // Quarter pixel width
        // Line
        typeData.renderLine(bufferPosition + (horizontalAdjust << 2) + 32, 1024);

        // Borders
        paintBackdrop64(bufferPosition + (horizontalAdjust << 2) - 32); paintBackdrop64(bufferPosition + (horizontalAdjust << 2) + 32 + 1024);

        bufferPosition += bufferLineAdvance;
    }

    function renderLineTypeSBY(bufferPosition, quantPixels) {
        for (var b = 0; b < quantPixels; ++b)
            frameBackBuffer[bufferPosition + b] = standByValue;
    }

    function renderLineTypePP1(bufferPosition) {
        var buffPos, realLine, lineInPattern, scrollX;
        var namePosBase, namePos, pattPosBase, name, pattPixelPos, v, c;

        // Backdrop
        paintBackdrop256(bufferPosition);

        // Plane B
        if (planeBEnabled) {
            scrollX = scrollXBOffset & 511;                                                         // Image max X = 511
            buffPos = bufferPosition - (scrollX & 7);
            realLine = (currentScanline - frameStartingActiveScanline + scrollYBOffset) & scrollYMax;
            lineInPattern = realLine & 7;
            namePosBase = 0x7e000 + ((realLine >> 3) << 6 << 1);
            namePos = scrollX >> 3 << 1;
            pattPosBase = 0x40000 | (lineInPattern << 7);
            for (var b = (scrollX & 7) ? 33 : 32; b > 0; --b, namePos = (namePos + 2) & 127) {      // 64 names * 2 bytes each
                name = vram[namePosBase + namePos] | (vram[namePosBase + namePos + 1] << 8);
                pattPixelPos = pattPosBase + ((name >> 5 << 10) | ((name & 0x1f) << 2));

                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
            }

            // Sprites A > SP > B, PR1 = 1 (0x20)
            renderSpritesLine(bufferPosition, currentScanline - frameStartingActiveScanline, 0x20, 256, 0x3fe00);
        }

        // Plane A
        if (planeAEnabled) {
            scrollX = scrollXOffset & 511;                                                          // Image max X = 511
            buffPos = bufferPosition - (scrollX & 7);
            realLine = (currentScanline - frameStartingActiveScanline + scrollYOffset) & scrollYMax;
            lineInPattern = realLine & 7;
            namePosBase = 0x7c000 + ((realLine >> 3) << 6 << 1);
            namePos = scrollX >> 3 << 1;
            pattPosBase = 0x00000 | (lineInPattern << 7);
            for (b = (scrollX & 7) ? 33 : 32; b > 0; --b, namePos = (namePos + 2) & 127) {          // 64 names * 2 bytes each
                name = vram[namePosBase + namePos] | (vram[namePosBase + namePos + 1] << 8);
                pattPixelPos = pattPosBase + ((name >> 5 << 10) | ((name & 0x1f) << 2));

                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
            }

            // Sprites SP > A > B, PR1 = 0
            renderSpritesLine(bufferPosition, currentScanline - frameStartingActiveScanline, 0x00, 256, 0x3fe00);
        }
    }

    function renderLineTypePP2(bufferPosition) {
        var buffPos, realLine, lineInPattern, scrollX;
        var namePosBase, namePos, pattPosBase, name, pattPixelPos, v, c;

        // Backdrop
        paintBackdrop512(bufferPosition);

        // Sprites Plane > SP, PR1 = 1 (0x20)
        renderSpritesLine(bufferPosition, currentScanline - frameStartingActiveScanline, 0x20, 512, 0x7be00);

        // Plane
        if (planeAEnabled) {
            scrollX = scrollXOffset & 1023;                                                         // Image max X = 1023
            buffPos = bufferPosition - (scrollX & 7);
            realLine = (currentScanline - frameStartingActiveScanline + scrollYOffset) & scrollYMax;
            lineInPattern = realLine & 7;
            namePosBase = 0x7c000 + ((realLine >> 3) << 7 << 1);
            namePos = scrollX >> 3 << 1;
            pattPosBase = 0x00000 | (lineInPattern << 8);
            for (var b = (scrollX & 7) ? 65 : 64; b > 0; --b, namePos = (namePos + 2) & 255) {      // 128 names * 2 bytes each
                name = vram[namePosBase + namePos] | (vram[namePosBase + namePos + 1] << 8);
                pattPixelPos = pattPosBase + ((name >> 6 << 11) | ((name & 0x3f) << 2));

                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetA | c]; ++buffPos;
                v = vram[pattPixelPos]; ++pattPixelPos;
                c = v >> 4;   if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
                c = v & 0x0f; if (c > 0) frameBackBuffer[buffPos] = paletteValues[paletteOffsetB | c]; ++buffPos;
            }

            // Sprites SP > Plane, PR1 = 0
            renderSpritesLine(bufferPosition, currentScanline - frameStartingActiveScanline, 0x00, 512, 0x7be00);
        }
    }

    function renderSpritesLine(bufferPosition, line, pr1, width, atrPos) {
        var palOff = 0, name = 0, info = 0, y = 0, spriteLine = 0, x = 0, pattPixelPos = 0, s = 0, f = 0;

        spritesGlobalPriority -= 128;

        var limit = 16;
        for (var sprite = 0; sprite < 125; ++sprite, atrPos += 4) {
            info = vram[atrPos + 3];
            if (info & 0x10) continue;                                      // PR0 = 1 : Sprite not shown

            y = vram[atrPos];
            spriteLine = (line - y - 1) & 255;
            if (spriteLine >= 16) continue;                                 // Not visible at line

            --limit;                                                        // Sprite already counts towards limit

            if ((info & 0x20) === pr1) {                                    // PR1 === asked?
                x = vram[atrPos + 2] | ((info & 0x03) << 8);
                if (x < width || x >= 1024 - 16) {                          // Only if not out to the right, or wrapping
                    palOff = (info & 0xc0) >> 2;
                    name = debugModeSpriteInfoNumbers ? sprite << 2 : vram[atrPos + 1];
                    if (width === 256) pattPixelPos = spritePattAddress + (spriteLine << 7) + ((name >> 4 << 11) | ((name & 0x0f) << 3));
                    else               pattPixelPos = spritePattAddress + (spriteLine << 8) + ((name >> 5 << 12) | ((name & 0x1f) << 3));

                    if (x >= width) x -= 1024;
                    paintSprite(bufferPosition, x, spritesGlobalPriority + sprite, pattPixelPos, palOff);
                }
            }

            if (limit <= 0 && spriteDebugModeLimit) break;                  // Max number of sprites per line reached
        }
    }

    function paintSprite(bufferPosition, x, spritePri, pattPixelPos, palOff) {
        var v = 0, c = 0, p = x + 16;
        var buffPos = bufferPosition + x;
        for (var i = 8; i > 0; --i, ++pattPixelPos) {
            v = vram[pattPixelPos];
            c = v >> 4;   if (c > 0 && spritesLinePriorities[p] >= spritePri) { frameBackBuffer[buffPos] = paletteValuesReal[palOff | c]; spritesLinePriorities[p] = spritePri; } ++p; ++buffPos;
            c = v & 0x0f; if (c > 0 && spritesLinePriorities[p] >= spritePri) { frameBackBuffer[buffPos] = paletteValuesReal[palOff | c]; spritesLinePriorities[p] = spritePri; } ++p; ++buffPos;
        }
    }

    function renderLineTypeBD16(bufferPosition, quantPixels) {
        var buffPos, realLine, quantBytes, scrollXMaxBytes, extraByte;
        var byteYBase, byteXPos, v;

        realLine = (((currentScanline - frameStartingActiveScanline + scrollYOffset) << vramEOLineShift) + vramEOLineAdd) & scrollYMax;
        byteYBase = realLine * (imageWidth << 1);               // 0.5 ppb (16 bpp)
        scrollXMaxBytes = (imageWidth << 1) - 1;                // 0.5 ppb
        byteXPos = modeData.width > 256
            ? ((scrollXOffset & ~1) << 1) & scrollXMaxBytes     // 0.5 ppb, ignore bit 0
            : (scrollXOffset << 1) & scrollXMaxBytes;           // 0.5 ppb

        quantBytes = quantPixels << 1;                          // 0.5 ppb
        buffPos = bufferPosition;

        for (var b = quantBytes; b > 0; b -= 2, byteXPos = (byteXPos + 2) & scrollXMaxBytes) {
            v = vram[byteYBase + byteXPos] | (vram[byteYBase + byteXPos + 1] << 8);
            frameBackBuffer[buffPos++] = 0xff000000
                | (color5to8bits[v & 0x1f] << 16)               // B
                | (color5to8bits[(v >> 10) & 0x1f]) << 8        // G
                | color5to8bits[(v >> 5) & 0x1f];               // R
        }
    }

    function renderLineTypeBD8(bufferPosition, quantPixels) {
        var buffPos, realLine, quantBytes, scrollXMaxBytes, extraByte;
        var byteYBase, byteXPos, v, pixelB;

        realLine = (((currentScanline - frameStartingActiveScanline + scrollYOffset) << vramEOLineShift) + vramEOLineAdd) & scrollYMax;
        byteYBase = realLine * imageWidth;                      // 1 ppb
        scrollXMaxBytes = imageWidth - 1;                       // 1 ppb
        byteXPos = scrollXOffset & scrollXMaxBytes;             // 1 ppb

        quantBytes = quantPixels;                               // 1 ppb
        buffPos = bufferPosition;

        for (var b = quantBytes; b > 0; --b, byteXPos = (byteXPos + 1) & scrollXMaxBytes) {
            v = vram[byteYBase + byteXPos];
            frameBackBuffer[buffPos++] = 0xff000000
                | (color2to8bits[v & 0x03] << 16)               // B
                | (color3to8bits[(v >> 5) & 0x07]) << 8         // G
                | color3to8bits[(v >> 2) & 0x07];               // R
        }
    }

    function renderLineTypeBP6(bufferPosition, quantPixels) {
        var buffPos, realLine, quantBytes, scrollXMaxBytes, extraByte;
        var byteYBase, byteXPos, v;

        realLine = (((currentScanline - frameStartingActiveScanline + scrollYOffset) << vramEOLineShift) + vramEOLineAdd) & scrollYMax;
        byteYBase = realLine * imageWidth;                      // 1 ppb
        scrollXMaxBytes = imageWidth - 1;                       // 1 ppb
        byteXPos = scrollXOffset & scrollXMaxBytes;             // 1 ppb

        quantBytes = quantPixels;                               // 1 ppb
        buffPos = bufferPosition;

        for (var b = quantBytes; b > 0; --b, byteXPos = (byteXPos + 1) & scrollXMaxBytes) {
            v = vram[byteYBase + byteXPos];
            frameBackBuffer[buffPos++] = paletteValues[v & 0x3f];
        }
    }

    function renderLineTypeBP4(bufferPosition, quantPixels) {
        var buffPos, realLine, quantBytes, scrollXMaxBytes, leftPixels;
        var byteYBase, byteXPos, v;
        realLine = (((currentScanline - frameStartingActiveScanline + scrollYOffset) << vramEOLineShift) + vramEOLineAdd) & scrollYMax;
        byteYBase = realLine * (imageWidth >> 1);               // 2 ppb
        scrollXMaxBytes = (imageWidth >> 1) - 1;                // 2 ppb
        byteXPos = (scrollXOffset >> 1) & scrollXMaxBytes;      // 2 ppb

        leftPixels = scrollXOffset & 1;                         // 2 ppb
        quantBytes = (quantPixels >> 1) + leftPixels;           // 2 ppb
        buffPos = bufferPosition - leftPixels;

        for (var b = quantBytes; b > 0; --b, byteXPos = (byteXPos + 1) & scrollXMaxBytes) {
            v = vram[byteYBase + byteXPos];
            frameBackBuffer[buffPos++] = paletteValues[paletteOffsetB | (v >> 4)];
            frameBackBuffer[buffPos++] = paletteValues[paletteOffsetB | (v & 0x0f)];
        }
    }

    function renderLineTypeBP2(bufferPosition, quantPixels) {
        var buffPos, realLine, quantBytes, scrollXMaxBytes, leftPixels;
        var byteYBase, byteXPos, v;
        realLine = (((currentScanline - frameStartingActiveScanline + scrollYOffset) << vramEOLineShift) + vramEOLineAdd) & scrollYMax;
        byteYBase = realLine * (imageWidth >> 2);               // 4 ppb
        scrollXMaxBytes = (imageWidth >> 2) - 1;                // 4 ppb
        byteXPos = (scrollXOffset >> 2) & scrollXMaxBytes;      // 4 ppb

        leftPixels = scrollXOffset & 3;                         // 4 ppb
        quantBytes = (quantPixels >> 2) + (leftPixels ? 1 : 0); // 4 ppb
        buffPos = bufferPosition - leftPixels;

        for (var b = quantBytes; b > 0; --b, byteXPos = (byteXPos + 1) & scrollXMaxBytes) {
            v = vram[byteYBase + byteXPos];
            frameBackBuffer[buffPos++] = paletteValues[paletteOffset | (v >> 6)];
            frameBackBuffer[buffPos++] = paletteValues[paletteOffset | ((v >> 4) & 0x03)];
            frameBackBuffer[buffPos++] = paletteValues[paletteOffset | ((v >> 2) & 0x03)];
            frameBackBuffer[buffPos++] = paletteValues[paletteOffset | (v & 0x03)];
        }
    }

    function stretchCurrentLine() {
        var end = 256 + 8*2;
        var s = bufferPosition + end - 1, d = bufferPosition + (end << 1) - 2;
        for (var i = end; i > 0; --i, --s, d = d - 2)
            frameBackBuffer[d] = frameBackBuffer[d + 1] = frameBackBuffer[s];

        //logInfo("Stretch currentLine");
    }

    function stretchFromCurrentToTopScanline() {
        var end = 256 + 8*2;
        var pos = bufferPosition;
        for (var line = currentScanline; line >= startingVisibleTopBorderScanline; --line, pos -= bufferLineAdvance) {
            var s = pos + end - 1, d = pos + (end << 1) - 2;
            for (var i = end; i > 0; --i, --s, d = d - 2)
                frameBackBuffer[d] = frameBackBuffer[d + 1] = frameBackBuffer[s];
        }

        //logInfo("Stretch to top");
    }

    function cleanFrameBuffer() {
        // wmsx.Util.arrayFill(frameBackBuffer, backdropValue);
        frameBackBuffer.fill(notPaintedValue);

        //logInfo("Clear Buffer");
    }

    function refresh() {
        // Send frame to monitor
        videoSignal.newFrame(frameCanvas, 0, 0, refreshWidth, refreshHeight);
        refreshWidth = refreshHeight = 0;

        //logInfo("V9990 REFRESH. currentScanline: " + currentScanline);
    }

    function beginFrame() {
        // Adjust for pending VideoStandard/Pulldown changes
        if (framePulldown !== pulldown) {
            frameVideoStandard = videoStandard;
            framePulldown = pulldown;
            updateSignalMetrics(false);
        }

        if (renderMetricsChangePending) updateRenderMetrics(true);
        // else cleanFrameBuffer();

        // Field alternance
        status ^= 0x02;                    // Invert EO (Second Field Status flag)

        // Interlace
        if (modeData.allowIL && register[7] & 0x02) {                   // IL
            bufferLineAdvance = PAINT_WIDTH << 1;                       // 2 lines at once
            var doubleRes = (register[7] & 0x04) !== 0;                 // EO (Double Resolution)
            vramEOLineShift = doubleRes ? 1 : 0;
            if (status & 0x02) {                                        // EO (Second Field Status flag)
                bufferPosition = PAINT_WIDTH << 1;                      // Start from line 2
                vramEOLineAdd = doubleRes ? 1 : 0;
            } else {
                bufferPosition = PAINT_WIDTH;                           // Normal start from line 1
                vramEOLineAdd = 0;
            }
        } else {
            bufferLineAdvance = PAINT_WIDTH;                            // 1 line
            bufferPosition = PAINT_WIDTH;                               // Start from line 1 (after Left-overflow)
            vramEOLineShift = 0;
            vramEOLineAdd = 0;
        }

        currentScanline = 0;
        frameStartingActiveScanline = startingActiveScanline;

        if (currentScanline >= frameStartingActiveScanline) enterActiveDisplay();
    }

    function finishFrame() {
        //var cpuCycles = cpu.getCycles();
        //wmsx.Util.log("Frame FINISHED. CurrentScanline: " + currentScanline + ", CPU cycles: " + (cpuCycles - debugFrameStartCPUCycle));
        //debugFrameStartCPUCycle = cpuCycles;

        // Update frame image from backbuffer
        refreshWidth = renderWidth;
        refreshHeight = renderHeight;
        frameContext.putImageData(frameImageData, 0, -1, 0, 1, refreshWidth, refreshHeight);     // from line 1 of backBuffer
        frame = frame + 1;

        //logInfo("Finish Frame");

        beginFrame();
    }

    function initVRAM() {
        for(var i = 0; i < VRAM_SIZE; i += 1024) {
            wmsx.Util.arrayFill(vram, 0x00, i, i + 512);
            wmsx.Util.arrayFill(vram, 0xff, i + 512, i + 1024);
        }
    }

    function initRegisters() {
        status = 0; interruptFlags = 0; systemControl = 0;
        wmsx.Util.arrayFill(register, 0);
        wmsx.Util.arrayFill(paletteRAM, 0);
        register[7] = videoStandard === wmsx.VideoStandard.PAL ? 0x08 : 0;      // PAL mode bit
    }

    function initFrameResources(useAlpha) {
        if (frameCanvas && (frameContextUsingAlpha || !useAlpha)) return;       // never go back to non alpha

        frameContextUsingAlpha = !!useAlpha;
        frameCanvas = document.createElement('canvas');
        // Maximum V9990 resolution including borders and extra space for painting
        frameCanvas.width = PAINT_WIDTH;                            // 32 pixels for Right-overflow
        frameCanvas.height = wmsx.V9990.SIGNAL_MAX_HEIGHT + 1;      // +1 extra line at the top for Left-overflow
        frameContext = frameCanvas.getContext("2d", { alpha: frameContextUsingAlpha, antialias: false });

        if (!frameImageData) {
            frameImageData = frameContext.createImageData(frameCanvas.width, frameCanvas.height + 1 + 1);                                           // +1 line for the Backdrop cache, +1 for the Standby cache
            frameBackBuffer = new Uint32Array(frameImageData.data.buffer, 0, frameCanvas.width * frameCanvas.height);                               // Contains Left-overflow extra, not the other 2
            backdropLineCache = new Uint32Array(frameImageData.data.buffer, frameCanvas.width * frameCanvas.height * 4, frameCanvas.width);         // Backdrop extra line
            standByLineCache =  new Uint32Array(frameImageData.data.buffer, frameCanvas.width * (frameCanvas.height + 1) * 4, frameCanvas.width);   // Standby extra line

            backdrop64 =  new Uint32Array(frameImageData.data.buffer, frameCanvas.width * frameCanvas.height * 4, 64);
            backdrop256 = new Uint32Array(frameImageData.data.buffer, frameCanvas.width * frameCanvas.height * 4, 256);
            backdrop512 = new Uint32Array(frameImageData.data.buffer, frameCanvas.width * frameCanvas.height * 4, 512);

            wmsx.Util.arrayFill(standByLineCache, standByValue);
        }
    }

    function initColorPalette() {
        for (var c = 0; c < 64; ++c)
            paletteValuesReal[c] = paletteValues[c] = solidBlackValue;
    }

    function initColorCaches() {
        // Pre calculate all 256 colors encoded in 8 bits GRB
        for (var c = 0; c <= 0xff; ++c)
            colors256Values[c] = 0xff000000 | (color2to8bits[c & 0x3] << 16) | (color3to8bits[c >>> 5] << 8) | color3to8bits[(c >>> 2) & 0x7];
    }

    function initDebugPatternTables() {
        var digitPatterns = [
            ["111", "101", "101", "101", "111"], ["110", "010", "010", "010", "111"], ["111", "001", "111", "100", "111"], ["111", "001", "111", "001", "111"], ["101", "101", "111", "001", "001"],
            ["111", "100", "111", "001", "111"], ["111", "100", "111", "101", "111"], ["111", "001", "001", "001", "001"], ["111", "101", "111", "101", "111"], ["111", "101", "111", "001", "001"],
            ["110", "001", "111", "101", "111"], ["100", "100", "111", "101", "110"], ["000", "111", "100", "100", "111"], ["001", "001", "111", "101", "111"], ["110", "101", "111", "100", "011"], ["011", "100", "110", "100", "100"]
        ];
        var pos6 = DEBUG_PAT_DIGI6_TABLE_ADDRESS, pos8 = DEBUG_PAT_DIGI8_TABLE_ADDRESS, pos16 = DEBUG_PAT_DIGI16_TABLE_ADDRESS, posB = DEBUG_PAT_BLOCK_TABLE_ADDRESS;
        for (var info = 0; info < 256; info++) {
            var dig1 = (info / 16) | 0;
            var dig2 = info % 16;
            // 8 x 8, 6 x 8
            for (var i = 0; i < 5; i++) {
                vram[pos6++] = parseInt(digitPatterns[dig1][i] + digitPatterns[dig2][i] + "00", 2);
                vram[pos8++] = parseInt(digitPatterns[dig1][i] + "0" + digitPatterns[dig2][i] + "0", 2);
            }
            vram[pos6++] = vram[pos8++] = parseInt("00000000", 2);
            vram[pos6++] = vram[pos8++] = parseInt("01111100", 2);
            vram[pos6++] = vram[pos8++] = parseInt("00000000", 2);
            // 16 x 16
            vram[pos16++] = parseInt("11111111", 2);
            for (i = 0; i < 4; i++) vram[pos16++] = parseInt("10000000", 2);
            for (i = 0; i < 5; i++) vram[pos16++] = parseInt("1000" + digitPatterns[dig1][i] + "0", 2);
            for (i = 0; i < 5; i++) vram[pos16++] = parseInt("10000000", 2);
            for (i = 0; i < 2; i++) vram[pos16++] = parseInt("11111111", 2);
            for (i = 0; i < 4; i++) vram[pos16++] = parseInt("00000001", 2);
            for (i = 0; i < 5; i++) vram[pos16++] = parseInt("0" + digitPatterns[dig2][i] + "0001", 2);
            for (i = 0; i < 5; i++) vram[pos16++] = parseInt("00000001", 2);
            vram[pos16++] = parseInt("11111111", 2);
        }
        vram[posB] = vram [posB + 7] = 0;
        vram[posB + 1] = vram[posB + 2] = vram[posB + 3] = vram[posB + 4] = vram[posB + 5] = vram[posB + 6] = 0x7e;
    }


    var LINE_WIDTH = wmsx.V9990.SIGNAL_MAX_WIDTH;
    var PAINT_WIDTH = LINE_WIDTH + 32;                      // 32 additional pixels for Right-overflow during painting

    var SPRITE_MAX_PRIORITY = 9000000000000000;    // 0x3fffffff;   (v8 sint?)
    var DEBUG_DIM_ALPHA_MASK = 0x40ffffff;

    var VRAM_LIMIT = wmsx.V9990.VRAM_LIMIT;
    var VRAM_SIZE = VRAM_LIMIT + 1;
    var DEBUG_PAT_DIGI6_TABLE_ADDRESS = VRAM_SIZE;                                      // Debug pattern tables placed on top of normal VRAM
    var DEBUG_PAT_DIGI8_TABLE_ADDRESS = DEBUG_PAT_DIGI6_TABLE_ADDRESS + 256 * 8;
    var DEBUG_PAT_DIGI16_TABLE_ADDRESS = DEBUG_PAT_DIGI8_TABLE_ADDRESS + 256 * 8;
    var DEBUG_PAT_BLOCK_TABLE_ADDRESS = DEBUG_PAT_DIGI16_TABLE_ADDRESS + 256 * 8 * 4;
    var VRAM_TOTAL_SIZE = DEBUG_PAT_BLOCK_TABLE_ADDRESS + 8;

    var STARTING_DEBUG_MODE = WMSX.DEBUG_MODE;
    var STARTING_SPRITES_DEBUG_MODE = WMSX.SPRITES_DEBUG_MODE;

    var REG_WRITE_MASK = [                                  // * = undocumented mask (real mask in manual)
        0xff, 0xff, 0x87, 0xff, 0xff, 0x87,                 // 00 - 05  VRAM Addresses
        0xff, 0xff,                                         // 06 - 07  Screen Mode                     *07 (0x7f)
        0xff,                                               // 08       Control
        0x87, 0xff, 0x83, 0x0f,                             // 09 - 12  Interrupt                       *09 (0x07)
        0xff, 0xff,                                         // 13 - 14  Palette Control/Pointer
        0xff,                                               // 15       Backdrop Color                  *15 (0x3f)
        0xff,                                               // 16       Display Adjust
        0xff, 0xdf, 0x07, 0xff, 0xff, 0xc1, 0x07, 0x3f,     // 17 - 24  Scroll Control                  *22  0x01)
        0xcf,                                               // 25       Sprite Pat Generator Address    *25 (0x0f)
        0xff,                                               // 26       LCD Control                     *26 (0x1f)
        0xff,                                               // 27       Priority Control                *27 (0x0f)
        0x0f,                                               // 28       Sprite Palette Control
        0x00, 0x00, 0x00,                                   // 29 - 31  Invalid
        0xff, 0x07, 0xff, 0x0f, 0xff, 0x07, 0xff, 0x0f,     // 32 - 52  Command Write
        0xff, 0x0f, 0xff, 0x0f, 0x0f, 0x1f, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff,
        0x00, 0x00,                                         // 53 - 54  Command Read
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00      // 56 - 63  Invalid
    ];

    var REG_READ_OR = [
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff,                 // 00 - 05  VRAM Addresses
        0x00, 0x00,                                         // 06 - 07  Screen Mode
        0x00,                                               // 08       Control
        0x00, 0x00, 0x00, 0x00,                             // 09 - 12  Interrupt
        0xff, 0xff,                                         // 13 - 14  Palette Control/Pointer
        0x00,                                               // 15       Backdrop Color
        0x00,                                               // 16       Display Adjust
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,     // 17 - 24  Scroll Control
        0x00,                                               // 25       Sprite Pat Generator Address
        0x00,                                               // 26       LCD Control
        0x00,                                               // 27       Priority Control
        0xff,                                               // 28       Sprite Palette Control
        0xff, 0xff, 0xff,                                   // 29 - 31  Invalid
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,     // 32 - 52  Command Write
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff,
        0x00, 0x00,                                         // 53 - 54  Command Read
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff      // 56 - 63  Invalid
    ];

    // Frame as off-screen canvas
    var frameCanvas, frameContext, frameImageData, frameBackBuffer;
    var backdropLineCache, standByLineCache, backdrop64, backdrop256, backdrop512;        // Cached full line backdrop and standby values, will share the same buffer as the frame itself for fast copying
    var frameContextUsingAlpha = false;

    var vram = new Uint8Array(VRAM_TOTAL_SIZE);   // wmsx.Util.arrayFill(new Array(VRAM_TOTAL_SIZE), 0);
    this.vram = vram;
    var vramInterleaving = false;

    var frame = 0;

    var vSynchMode = 0;
    var videoStandard = wmsx.VideoStandard.NTSC, pulldown;

    var bufferPosition = 0;
    var bufferLineAdvance = 0;
    var currentScanline = -1;

    var cycles = 0, lastBUSCyclesComputed = 0;

    var signalActiveHeight = 0;
    var finishingScanline = 0;
    var startingActiveScanline = 0, frameStartingActiveScanline = 0;
    var startingVisibleTopBorderScanline = 0;
    var startingInvisibleScanline = 0;

    var frameVideoStandard = videoStandard, framePulldown;                  // Delays VideoStandard change until next frame

    var horizontalIntLine = 0;

    var oldStatus = wmsx.Util.arrayFill(new Array(10), 0);

    var status = 0, interruptFlags = 0, systemControl = 0;
    var registerSelect = 0, registerSelectReadInc = true, registerSelectWriteInc = true;
    var vramPointerRead = 0, vramPointerWrite = 0, vramPointerReadInc = true, vramPointerWriteInc = true, vramReadData = 0;
    var palettePointer = 0, palettePointerReadInc = true;
    var paletteOffsetA = 0, paletteOffsetB = 0, paletteOffset = 0;
    var ysEnabled = false;

    var register = new Array(64);
    var paletteRAM = new Array(256);          // 64 entries x 3+1 bytes (R, G, B, unused)

    var modeData, typeData;

    var backdropColor = 0;
    var backdropCacheUpdatePending = true;

    var imageWidth = 0, imageHeight = 0;
    var scrollXOffset = 0, scrollYOffset = 0, scrollXBOffset = 0, scrollYBOffset = 0, scrollYMax = 0;
    var planeAEnabled = true, planeBEnabled = true;

    var verticalAdjust = 0, horizontalAdjust = 0;

    var spritePattAddress = 0;
    var spritesGlobalPriority = SPRITE_MAX_PRIORITY;        // Decreasing value for priority control. Never resets and lasts for years!
    var spritesLinePriorities = wmsx.Util.arrayFill(new Array(512 + 16 + 16 + 8), SPRITE_MAX_PRIORITY);     // Max P2 res + 16 for Left-overflow + 16 for Right-overflow + 8 slack

    var dispChangePending = false, dispEnabled = false;
    var renderMetricsChangePending = false, renderWidth = 0, renderHeight = 0;
    var refreshWidth = 0, refreshHeight = 0;

    var vramEOLineShift = 0, vramEOLineAdd = 0;

    var modes = {};
    modes[0x0c] = { name: "SBY", width:  256, height: 212, pixelWidthDiv: 1, hasBorders: 1, allowIL: false, renderLine: renderLineModeSBY };
    modes[0x00] = { name:  "P1", width:  256, height: 212, pixelWidthDiv: 1, hasBorders: 1, allowIL: false, renderLine:  renderLineModeP1 };
    modes[0x05] = { name:  "P2", width:  512, height: 212, pixelWidthDiv: 2, hasBorders: 1, allowIL: false, renderLine:  renderLineModeP2 };
    modes[0x48] = { name: "B0*", width:  192, height: 240, pixelWidthDiv: 1, hasBorders: 0, allowIL:  true, renderLine:  renderLineModeB0 };       // Undocumented, B1 Overscan?
    modes[0x08] = { name:  "B1", width:  256, height: 212, pixelWidthDiv: 1, hasBorders: 1, allowIL:  true, renderLine:  renderLineModeB1 };
    modes[0x49] = { name:  "B2", width:  384, height: 240, pixelWidthDiv: 1, hasBorders: 0, allowIL:  true, renderLine:  renderLineModeB2 };       // B1 Overscan
    modes[0x09] = { name:  "B3", width:  512, height: 212, pixelWidthDiv: 2, hasBorders: 1, allowIL:  true, renderLine:  renderLineModeB3 };
    modes[0x4a] = { name:  "B4", width:  768, height: 240, pixelWidthDiv: 2, hasBorders: 0, allowIL:  true, renderLine:  renderLineModeB4 };       // B3 Overscan
    modes[0x1a] = { name:  "B5", width:  640, height: 400, pixelWidthDiv: 2, hasBorders: 0, allowIL: false, renderLine:  renderLineModeB5 };
    modes[0x3a] = { name:  "B6", width:  640, height: 480, pixelWidthDiv: 2, hasBorders: 0, allowIL: false, renderLine:  renderLineModeB6 };
    modes[0x0a] = { name: "B7*", width: 1024, height: 212, pixelWidthDiv: 4, hasBorders: 1, allowIL:  true, renderLine:  renderLineModeB7 };       // Undocumented, Weird!
    modes[  -1] = modes[0x0c];

    var types = {};
    types[0xc0] = { name:   "SBY", bpp:  4, ppb:  2, renderLine:  renderLineTypeSBY };
    types[0x01] = { name:   "PP1", bpp:  4, ppb:  2, renderLine:  renderLineTypePP1 };
    types[0x41] = { name:   "PP2", bpp:  4, ppb:  2, renderLine:  renderLineTypePP2 };
    types[0xb2] = { name:  "BYUV", bpp:  8, ppb:  1, renderLine:  renderLineTypeBD8 };
    types[0xba] = { name: "BYUVP", bpp:  8, ppb:  1, renderLine:  renderLineTypeBD8 };
    types[0xa2] = { name:  "BYJK", bpp:  8, ppb:  1, renderLine:  renderLineTypeBD8 };
    types[0xaa] = { name: "BYJKP", bpp:  8, ppb:  1, renderLine:  renderLineTypeBD8 };
    types[0x83] = { name:  "BD16", bpp: 16, ppb:  0, renderLine: renderLineTypeBD16 };
    types[0x92] = { name:   "BD8", bpp:  8, ppb:  1, renderLine:  renderLineTypeBD8 };
    types[0x82] = { name:   "BP6", bpp:  8, ppb:  1, renderLine:  renderLineTypeBP6 };
    types[0x81] = { name:   "BP4", bpp:  4, ppb:  2, renderLine:  renderLineTypeBP4 };
    types[0x80] = { name:   "BP2", bpp:  2, ppb:  4, renderLine:  renderLineTypeBP2 };
    types[  -1] = types[0xc0];

    var renderLine, renderLineActive;           // Update functions for current mode

    var solidBlackValue =  0xff000000;
    var notPaintedValue  = 0xffff00ff;          // Pink
    var superImposeValue = 0xff500000;          // Dark Blue
    var standByValue =     0xff000060;          // Dark Red
    var backdropValue =    solidBlackValue;

    var color2to8bits = [ 0, 90, 172, 255 ];                        // 8 bit B values for 2 bit B colors
    var color3to8bits = [ 0, 32, 74, 106, 148, 180, 222, 255 ];     // 8 bit R,G values for 3 bit R,G colors
    var color5to8bits = [ 0, 8, 16, 24, 32, 41, 49, 57, 65, 74, 82, 90, 98, 106, 115, 123, 131, 139, 148, 156, 164, 172, 180, 189, 197, 205, 213, 222, 230, 238, 246, 255 ];    // 8 bit R,G,B values for 5 bit R,G,B colors
    var colors256Values = new Uint32Array(256);                     // 32 bit ABGR values for 8 bit BGR colors

    var paletteValues =      new Uint32Array(64);     // 32 bit ABGR palette values ready to paint with transparency (backdropValue) pre-computed in position 0, dimmed when in debug
    var paletteValuesReal =  new Uint32Array(64);     // 32 bit ABGR palette values ready to paint with real solid palette values, used for Sprites, NEVER dimmed for debug


   // Sprite and Debug Modes controls

    var debugMode = 0;
    var debugModeSpriteHighlight = false, debugModeSpriteInfo = false, debugModeSpriteInfoNumbers = false, debugModeSpritesHidden = false;
    var debugModePatternInfo = false, debugModePatternInfoBlocks = false, debugModePatternInfoNames = false;

    var spriteDebugMode = 0;
    var spriteDebugModeLimit = true;

    var debugBackdropValue    = 0xff2a2a2a;

    var debugLineStartBUSCycles = 0;


    // Connections

    var videoSignal;
    var commandProcessor;


    // Savestate  -------------------------------------------

    this.saveState = function(extended) {
        var s = {
            l: currentScanline, b: bufferPosition, ba: bufferLineAdvance, ad: renderLine === renderLineActive,
            fs: frameStartingActiveScanline,
            f: frame, c: cycles, cc: lastBUSCyclesComputed,
            vp: vramPointerWrite,
            ha: horizontalAdjust, va: verticalAdjust, hil: horizontalIntLine,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(register),
            p: wmsx.Util.storeInt16BitArrayToStringBase64(paletteRAM),
            vram: wmsx.Util.compressInt8BitArrayToStringBase64(vram, VRAM_SIZE),
            vrint: vramInterleaving,
            cp: commandProcessor.saveState()
        };
        if (extended) {
            s.dm = debugMode;
            s.sd = spriteDebugMode;
        }
        return s;
    };

    this.loadState = function(s) {
        register = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r, register);
        paletteRAM = wmsx.Util.restoreStringBase64ToInt16BitArray(s.p, paletteRAM);
        vram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.vram, vram, true);
        currentScanline = s.l; bufferPosition = s.b; bufferLineAdvance = s.ba;
        if (s.ad) setActiveDisplay(); else setBorderDisplay();
        frame = s.f || 0; cycles = s.c; lastBUSCyclesComputed = s.cc;
        vramPointerWrite = s.vp;
        horizontalAdjust = s.ha; verticalAdjust = s.va; horizontalIntLine = s.hil;
        vramInterleaving = s.vrint;
        commandProcessor.loadState(s.cp);
        commandProcessor.connectV9990(this, vram, register);
        frameVideoStandard = videoStandard; framePulldown = pulldown;
        updateSignalMetrics(true);
        if (s.fs !== undefined) frameStartingActiveScanline = s.fs;       // backward compatibility
        updateIRQ();
        updateMode();
        debugAdjustPalette();
        updateBackdropColor();
        updateRenderMetrics(true);

        // Extended
        if (s.dm !== undefined) self.setDebugMode(s.dm);
        if (s.sd !== undefined) self.setSpriteDebugMode(s.sd);
    };


    init();

    function logInfo(text) {
        var busLineCycles = cpu.getBUSCycles() - debugLineStartBUSCycles;
        var vdpLineCycles = busLineCycles * 6;
        console.log("V9990 " + text
            // + ". Frame: " + frame
            + ", currentScanLine: " + currentScanline
            + ", activeRenderScanline: " + (currentScanline - frameStartingActiveScanline)
            // + ", activeHeigh: " + signalActiveHeight
            // + ", x: " + ((vdpLineCycles - 258) / 4) + ", vdpCycle:" + vdpLineCycles + ", cpuCycle: " + busLineCycles
        );
    }
    this.logInfo = logInfo;

    this.eval = function(str) {
        return eval(str);
    };

    this.TEST = 0;

    this.register = register;
    this.registerWrite = registerWrite;

    window.V9990 = this;

};

wmsx.V9990.VRAM_LIMIT = 0x7ffff;      // 512K

wmsx.V9990.SIGNAL_MAX_WIDTH = 512 + 16 * 2;
wmsx.V9990.SIGNAL_MAX_HEIGHT = (212 + 8 * 2) * 2;

// wmsx.V9990.SIGNAL_MAX_WIDTH =  1024 + 32 * 2;        // B7 mode, 0.5 pixel width
// wmsx.V9990.SIGNAL_MAX_HEIGHT = 480 + 16 * 2;         // B6 mode, 1 pixel height
