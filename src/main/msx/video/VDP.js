// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// V9958/V9938/V9918 VDPs supported
// This implementation is line-accurate
// Digitize, Superimpose, LightPen, Mouse, Color Bus, External Synch, B/W Mode, Wait Function not supported
// Original base clock: 21477270 Hz which is 6x CPU clock. Rectified to real 60Hz: 21504960 Hz

wmsx.VDP = function(machine, cpu) {
"use strict";

    var self = this;

    function init() {
        videoSignal = new wmsx.VideoSignal(self, "Internal", "Internal");
        cpuBusClockPulses = cpu.busClockPulses;
        cpuR800RefreshPause = cpu.r800MemoryRefreshPause;
        audioClockPulse32 = machine.getAudioSocket().audioClockPulse32;
        initColorCaches();
        initFrameResources(false);
        initDebugPatternTables();
        initSpritesConflictMap();
        modeData = modes[0];
        backdropCacheUpdatePending = true;
        self.setDefaults();
        commandProcessor = new wmsx.VDPCommandProcessor();
        commandProcessor.connectVDP(self, vram, register, status);
        commandProcessor.setVDPModeData(modeData);

        renderWidth = wmsx.VDP.SIGNAL_START_WIDTH_V9938;
        renderHeight = WMSX.MACHINES_CONFIG[WMSX.MACHINE].TYPE === 1 ? wmsx.VDP.SIGNAL_HEIGHT_V9918 : wmsx.VDP.SIGNAL_START_HEIGHT_V9938;
    }

    this.setMachineType = function(machineType) {
        var type = WMSX.VDP_TYPE > 0 ? WMSX.VDP_TYPE : machineType;     // auto: According to Machine Type
        isV9918 = type <=  M_TYPES.MSX1;
        isV9938 = type === M_TYPES.MSX2;
        isV9958 = type >=  M_TYPES.MSX2P;
    };

    this.connectBus = function(bus) {
        bus.connectInputDevice( 0x98, this.input98);
        bus.connectOutputDevice(0x98, this.output98);
        bus.connectInputDevice( 0x99, this.input99);
        bus.connectOutputDevice(0x99, this.output99);
        bus.connectInputDevice( 0x9a, wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(0x9a, this.output9a);
        bus.connectInputDevice( 0x9b, wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(0x9b, this.output9b);
    };

    this.connectSlave = function(pSlave) {
        slave = pSlave;
        if (slave) slave.setVideoStandard(videoStandard);
        updateSignalMetrics(true);
        updateRenderMetrics(true);
        // this.refreshDisplayMetrics();
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

        if (slave) slave.setVideoStandard(videoStandard);

        //logInfo("VideoStandard set: " + videoStandard.name);
    };

    this.setVSynchMode = function(mode) {
        vSynchMode = mode;
        updateSynchronization();
    };

    this.getVideoSignal = function() {
        return videoSignal;
    };

    this.getDesiredVideoPulldown = function () {
        return pulldown;
    };

    this.videoClockPulse = function() {
        // Generate correct amount of lines per cycle, according to the current pulldown cadence
        cycleEvents();

        // Send updated image to Monitor if needed
        if (refreshWidth) refresh();
    };

    // VRAM Read
    this.input98 = function() {
        dataFirstWrite = null;
        var res = dataPreRead;
        dataPreRead = vram[vramPointer];
        ++vramPointer;
        checkVRAMPointerWrap();
        return res;
    };

    // VRAM Write
    this.output98 = function(val) {
        //if ((vramPointer >= spriteAttrTableAddress + 512) /* && (vramPointer <= spriteAttrTableAddress + 512 + 32 * 4) */)
        //    logInfo("VRAM Write: " + val.toString(16) + " at: " + vramPointer.toString(16));

        dataFirstWrite = null;
        vram[vramPointer] = dataPreRead = val;
        ++vramPointer;
        checkVRAMPointerWrap();
    };

    // Status Register Read
    this.input99 = function() {
        dataFirstWrite = null;
        var reg = register[15];

        var res;
        switch(reg) {
            case 0:
                res = getStatus0();                     // Dynamic value. status[0] is never accurate
                break;
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

                // if (self.TEST) return status[2] & ~0x40;

                res = status[2];

                // var deb = cpu.DEBUG;
                // if (deb) console.log(res.toString(16));
                // if (deb &&                                   (res & 0x81) !== 0) logInfo("Reading Command Status NOT READY: " + res.toString(16));
                // if (deb && (register[46] & 0xf0) === 0xb0 && (res & 0x81) === 0x81) console.log("Reading Command Status PROGRESS and Transfer READY");
                // if (deb && (register[46] & 0xf0) === 0xb0 && (res & 0x81) === 0x01) console.log("Reading Command Status PROGRESS and Transfer NOT READY");
                // if (deb &&                                   (res & 0x81) === 0x00) console.log("Reading Command Status IDLE and Transfer NOT READY");
                // if (deb &&                                   (res & 0x81) === 0x80) console.log("Reading Command Status IDLE and Transfer READY");

                // logInfo("VDP Status2 Read : " + res.toString(16));

                break;
            case 3: case 4: case 6:
                res = status[reg];
                break;
            case 5:
                res = status[5];
                spritesCollisionX = spritesCollisionY = -1;             // Clear collision coordinates and status registers
                status[3] = status[4] = status[5] = status[6] = 0;
                break;
            case 7:
                res = status[7];
                commandProcessor.cpuRead();
                break;
            case 8: case 9:
                res = status[reg];
                break;
            default:
                res = 0xff;                       // Invalid register
        }

        //logInfo("Reading status " + reg + ", " + res.toString(16));

        return res;
    };

    // Register/VRAM Address write
    this.output99 = function(val) {
        if (dataFirstWrite === null) {
            // First write. Data to write to register or VRAM Address Pointer low (A7-A0)
            dataFirstWrite = val;
            // On V9918, the VRAM pointer low gets written right away
            if (isV9918) vramPointer = (vramPointer & ~0xff) | val;
        } else {
            // Second write
            if (val & 0x80) {
                // Register write
                if (isV9918) {
                    registerWrite(val & 0x07, dataFirstWrite);
                    // On V9918, the VRAM pointer high gets also written when writing to registers
                    vramPointer = (vramPointer & 0x1c0ff) | ((val & 0x3f) << 8);
                } else {
                    // On V9938 register write only if "WriteMode = 0"
                    if ((val & 0x40) === 0) registerWrite(val & 0x3f, dataFirstWrite);
                }
            } else {
                // VRAM Address Pointer middle (A13-A8). Finish VRAM Address Pointer setting
                vramPointer = (vramPointer & 0x1c000) | ((val & 0x3f) << 8) | dataFirstWrite;
                // Pre-read VRAM if "WriteMode = 0"
                if ((val & 0x40) === 0) {
                    dataPreRead = vram[vramPointer];
                    ++vramPointer;
                    checkVRAMPointerWrap();
                }
            }
            dataFirstWrite = null;
        }
    };

    // Palette Write
    this.output9a = function(val) {
        if (isV9918) return;
        if (paletteFirstWrite === null) {
            paletteFirstWrite = val;
        } else {
            paletteRegisterWrite(register[16], (val << 8) | paletteFirstWrite, false);
            if (++register[16] > 15) register[16] = 0;
            paletteFirstWrite = null;
        }
    };

    // Indirect Register Write
    this.output9b = function(val) {
        if (isV9918) return;
        var reg = register[17] & 0x3f;
        if (reg !== 17) registerWrite(reg, val);
        if ((register[17] & 0x80) === 0) register[17] = (reg + 1) & 0x3f;       // Increment if needed
    };

    this.toggleDebugModes = function(dec) {
        setDebugMode(debugMode + (dec ? -1 : 1));
        videoSignal.showOSD("Debug Mode" + (debugMode > 0 ? " " + debugMode : "") + ": "
            + [ "OFF", "Sprites Highlighted", "Sprite Numbers", "Sprite Names",
                "Sprites Hidden", "Pattern Bits", "Pattern Color Blocks", "Pattern Names"][debugMode], true);
        return debugMode;
    };

    this.toggleSpriteDebugModes = function(dec) {
        setSpriteDebugMode(spriteDebugMode + (dec ? -1 : 1));
        videoSignal.showOSD("Sprites Mode" + (spriteDebugMode > 0 ? " " + spriteDebugMode : "") + ": "
            + ["Normal", "Unlimited", "NO Collisions", "Unlimited, No Collisions"][spriteDebugMode], true);
    };

    this.getSpriteDebugModeQuickDesc = function() {
        return ["Normal", "Unlimited", "No Collis.", "Both"][spriteDebugMode];
    };

    this.setVDPTurboMulti = function(multi) {
        commandProcessor.setVDPTurboMulti(multi);
    };

    this.getVDPTurboMulti = function() {
        return commandProcessor.getVDPTurboMulti();
    };

    this.setDefaults = function() {
        setDebugMode(STARTING_DEBUG_MODE);
        setSpriteDebugMode(STARTING_SPRITES_DEBUG_MODE);
    };

    this.videoSignalDisplayStateUpdate = function(displayed, superimposeActive) {
        videoDisplayed = displayed;

        //console.log("VDP displayed:", displayed);
    };

    this.refreshDisplayMetrics = function () {
        videoSignal.setDisplayMetrics(renderWidth, renderHeight);
    };

    this.resetOutputAutoMode = function() {
        // Ignore
    };

    this.reset = function() {
        frame = cycles = lastBUSCyclesComputed = 0;
        dataFirstWrite = null; dataPreRead = 0; vramPointer = 0; paletteFirstWrite = null;
        verticalAdjust = horizontalAdjust = 0;
        leftMask = leftScroll2Pages = false; leftScrollChars = leftScrollCharsInPage = rightScrollPixels = 0;
        backdropColor = backdropValue = 0;
        spritesCollided = false; spritesCollisionX = spritesCollisionY = spritesInvalid = -1; spritesMaxComputed = 0;
        verticalIntReached = false; horizontalIntLine = 0;
        vramInterleaving = false;
        renderMetricsChangePending = false;
        refreshWidth = refreshHeight = 0;
        frameVideoStandard = videoStandard; framePulldown = pulldown;
        currentScanline = -1;
        initRegisters();
        initColorPalette();
        commandProcessor.reset();
        updateSignalMetrics(true);
        updateIRQ();
        updateMode(true);
        updateSpritesConfig();
        updateBackdropColor();
        updateTransparency();
        updateSynchronization();
        updateBlinking();
        beginFrame();
    };

    this.updateCycles = function() {
        var busCycles = cpu.getBUSCycles();
        if (busCycles === lastBUSCyclesComputed) return cycles;

        var elapsed = (busCycles - lastBUSCyclesComputed) * 6;
        lastBUSCyclesComputed = busCycles;
        cycles += elapsed;

        return cycles;
    };

    this.getScreenText = function() {
        var cols = modeData.textCols;
        if (!cols) return null;

        var lines = (register[9] & 0x80) ? 27 : 24;
        var linesStr = [];

        for (var line = 0; line < lines; ++line) {
            linesStr.push(wmsx.Util.int8BitArrayToByteString(vram, layoutTableAddress + line * cols, cols).replace(/\s+$/,""));      // right trim
        }

        return linesStr.join("\n").replace(/[\x00\xff]/g, " ").replace(/\s+$/,"");      // right trim
    };

    function registerWrite(reg, val) {
        if (reg > 46) return;

        var add;
        var mod = register[reg] ^ val;
        register[reg] = val;

        //logInfo("Reg: " + reg + " = " + val.toString(16));

        switch (reg) {
            case 0:

                //if (mod) logInfo("Register0: " + val.toString(16));

                if (mod & 0x10) {                                        // IE1
                    // Clear FH bit immediately when IE becomes 0? Not as per https://www.mail-archive.com/msx@stack.nl/msg13886.html
                    // We clear it only at the beginning of the next line if IE === 0
                    // Laydock2 has glitches on WebMSX with Turbo and also on a real Expert3 at 10MHz
                    // if (((val & 0x10) === 0) && (status[1] & 0x01)) status[1] &= ~0x01;
                    updateIRQ();
                }
                if (mod & 0x0e) updateMode();                            // Mx
                break;
            case 1:

                //if (mod) logInfo("Register1: " + val.toString(16));

                if (mod & 0x20) updateIRQ();                             // IE0
                if (mod & 0x40) {                                        // BL
                    blankingChangePending = true;      // only at next line

                    //logInfo("Blanking: " + !!(val & 0x40));
                }
                if (mod & 0x18) updateMode();                            // Mx
                if (mod & 0x04) updateBlinking();                        // CDR  (Undocumented, changes reg 13 timing to lines instead of frames)
                if (mod & 0x03) updateSpritesConfig();                   // SI, MAG
                break;
            case 2:
                if (mod & 0x7f) updateLayoutTableAddress();
                break;
            case 10:
                if ((mod & 0x07) === 0) break;
                // else fall through
            case 3:
                add = ((register[10] << 14) | (register[3] << 6)) & 0x1ffff;
                colorTableAddress = add & modeData.colorTBase;
                colorTableAddressMask = add | colorTableAddressMaskBase;

                //logInfo("Setting: " + val.toString(16) + " to ColorTableAddress: " + colorTableAddress.toString(16));

                break;
            case 4:
                if ((mod & 0x3f) === 0) break;
                add = (val << 11) & 0x1ffff;
                patternTableAddress = add & modeData.patTBase;
                patternTableAddressMask = add | patternTableAddressMaskBase;

                //logInfo("Setting: " + val.toString(16) + " to PatternTableAddress: " + patternTableAddress.toString(16));

                break;
            case 11:
                if ((mod & 0x03) === 0) break;
                // else fall through
            case 5:
                add = ((register[11] << 15) | (register[5] << 7)) & 0x1ffff;
                spriteAttrTableAddress = add & modeData.sprAttrTBase;

                //logInfo("SpriteAttrTable: " + spriteAttrTableAddress.toString(16));

                break;
            case 6:
                if (mod & 0x3f) updateSpritePatternTableAddress();
                break;
            case 7:
                if (mod & (modeData.bdPaletted ? 0x0f : 0xff)) updateBackdropColor();  // BD
                break;
            case 8:
                if (mod & 0x20) updateTransparency();                    // TP
                if (mod & 0x02) updateSpritesConfig();                   // SPD
                break;
            case 9:
                if (mod & 0x80) updateSignalMetrics(false);              // LN
                if (mod & 0x08) updateRenderMetrics(false);              // IL
                if (mod & 0x04) updateLayoutTableAddressMask();          // EO
                if (mod & 0x02) updateVideoStandardSoft();               // NT
                break;
            case 13:
                updateBlinking();                                        // Always, even with no change
                break;
            case 14:
                if (mod & 0x07) vramPointer = ((val & 0x07) << 14) | (vramPointer & 0x3fff);

                //console.log("Setting reg14: " + val.toString(16) + ". VRAM Pointer: " + vramPointer.toString(16));

                break;
            case 16:
                paletteFirstWrite = null;
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
                if (isV9958) {
                    if (mod & 0x18) updateMode();                        // YJK, YAE
                    leftMask = (val & 0x02) !== 0;                       // MSK
                    leftScroll2Pages = (val & 0x01) !== 0;               // SP2
                }
                break;
            case 26:
                if (isV9958) {
                    leftScrollChars = val & 0x3f;                        // H08-H03
                    leftScrollCharsInPage = leftScrollChars & 31;
                }
                break;
            case 27:
                if (isV9958) rightScrollPixels = val & 0x07;             // H02-H01

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

    function updateLayoutTableAddress() {
        // Interleaved modes (G6, G7, YJK, YAE) have different address bits position in reg 2. Only A16 can be specified for base address, A10 always set in mask
        var add = modeData.vramInter ?((register[2] & 0x3f) << 11) | (1 << 10) : (register[2] & 0x7f) << 10;

        layoutTableAddress =  add & modeData.layTBase;
        layoutTableAddressMaskSetValue = add | layoutTableAddressMaskBase;
        updateLayoutTableAddressMask();

        //logInfo(/* "Setting: " + reg.toString(16) + " to " + */ "LayoutTableAddress: " + layoutTableAddress.toString(16));
    }

    // Consider Alternative Page (EO and Blink)
    function updateLayoutTableAddressMask() {
        layoutTableAddressMask = layoutTableAddressMaskSetValue &
            (blinkEvenPage || ((register[9] & 0x04) && (status[2] & 0x02) === 0) ? modeData.blinkPageMask : ~0);
    }

    function updateSpritePatternTableAddress() {
        spritePatternTableAddress = debugModeSpriteInfo
            ? spritesSize === 16 ? DEBUG_PAT_DIGI16_TABLE_ADDRESS : DEBUG_PAT_DIGI8_TABLE_ADDRESS
            : (register[6] << 11) & 0x1ffff;

        //logInfo("SpritePatTable: " + spritePatternTableAddress.toString(16));
    }

    function getStatus0() {
        var res = 0;

        // Vertical Int
        if (verticalIntReached) {                   // F
            res |= 0x80;
            verticalIntReached = false;
            updateIRQ();
        }

        // Collision
        if (spritesCollided) {
            res |= 0x20;                            // C
            spritesCollided = false;
        }

        // Invalid Sprite, otherwise Greatest Sprite number drawn
        if (spritesInvalid >= 0) {
            res |= 0x40 | spritesInvalid;           // 5S, 5SN
            spritesInvalid = -1;
        } else
            res |= spritesMaxComputed;              // 5SN

        spritesMaxComputed = 0;

        //console.log("Status0 read: " + res.toString(16));

        return res;                                 // Everything is cleared at this point (like status[0] == 0)
    }

    function checkVRAMPointerWrap() {
        if ((vramPointer & 0x3fff) === 0) {
            //wmsx.Util.log("VRAM Read Wrapped, vramPointer: " + vramPointer.toString(16) + ", register14: " + register[14].toString(16));
            if (modeData.isV9938) register[14] = (register[14] + 1) & 0x07;
            vramPointer = register[14] << 14;
        }
    }

    function paletteRegisterWrite(reg, val, force) {
        if (paletteRegister[reg] === val && !force) return;

        //logInfo("Palette register " + reg + ": " + val);

        paletteRegister[reg] = val;

        var value = getColorValueForPaletteValue(val);
        colorPaletteReal[reg] = value;

        if (debugModeSpriteHighlight) value &= DEBUG_DIM_ALPHA_MASK;
        colorPaletteSolid[reg] = value;
        // Special case for color 0
        if (reg === 0) {
            if (color0Solid) colorPalette[0] = value;
        } else
            colorPalette[reg] = value;

        if (reg === backdropColor) updateBackdropValue();
        else if (modeData.tiled && reg <= 3) backdropCacheUpdatePending = true;
    }

    function getColorValueForPaletteValue(val) {
        return colors9bitValues[((val & 0x700) >>> 2) | ((val & 0x70) >>> 1) | (val & 0x07)];     // 9 bit GRB
    }

    function setDebugMode(mode) {
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
        updateSpritesConfig();
        updateSpritePatternTableAddress();

        if (slave) slave.setDebugMode(debugMode);

        videoSignal.setDebugMode(debugMode > 0);
    }

    function setSpriteDebugMode(mode) {
        spriteDebugMode = mode >= 0 ? mode % 4 : 4 + mode;
        spriteDebugModeLimit = (spriteDebugMode === 0) || (spriteDebugMode === 2);
        spriteDebugModeCollisions = spriteDebugMode < 2;

        if (slave) slave.setSpriteDebugMode(spriteDebugMode);
    }

    function debugAdjustPalette() {
        if (isV9918)
            initColorPalette();
        else
            for (var reg = 0; reg < 16; reg++) paletteRegisterWrite(reg, paletteRegister[reg], true);
    }

    function updateSynchronization() {
        // According to the native video frequency detected, target Video Standard and vSynchMode, use a specific pulldown configuration
        if (vSynchMode === 1) {    // ON
            // Will V-synch to host freq if detected and supported, or use optimal timer configuration)
            pulldown = videoStandard.pulldowns[machine.getVideoClockSocket().getVSynchNativeFrequency()] || videoStandard.pulldowns.TIMER;
        } else {                   // OFF, DISABLED
            // No V-synch. Always use the optimal timer configuration)
            pulldown = videoStandard.pulldowns.TIMER;
        }

        // console.log("Update Synchronization. Pulldown " + pulldown.standard + " " + pulldown.frequency);
    }

    // Total frame lines: 262 for NTSC, 313 for PAL
    // Total frame CPU clocks: 59736 for NTSC, 71364 for PAL
    function cycleEvents() {
        var cycleLines = framePulldown.linesPerCycle;

        // Adjust pulldown cadence if necessary
        if (pulldown.steps > 1 && (frame % pulldown.steps) === 0) cycleLines += pulldown.firstStepCycleLinesAdjust;

        for (var i = cycleLines; i > 0; --i) {

            lineEvents();
        }
    }

    // Total line clocks: VDP: 1368, CPU: 228, PSG 7.125
    // Timing should be different for mode T1 and T2 since borders are wider. Ignoring for now.
    function lineEvents() {
        // Start of line
        // debugLineStartBUSCycles = cpu.getBUSCycles();

        // Page blinking per line (undocumented CDR bit set)
        if (blinkPerLine && blinkPageDuration > 0)
            if (clockPageBlinking()) updateLayoutTableAddressMask();

        // Verify and change sections of the screen
        if (currentScanline === startingActiveScanline) setActiveDisplay();
        else if (currentScanline - frameStartingActiveScanline === signalActiveHeight) setBorderDisplay();

        // Sync signal: 100 clocks
        // Left erase: 102 clocks

        cpuR800RefreshPause();

        cpuBusClockPulses(33); audioClockPulse32();

        // Left border: 56 clocks

        if (blankingChangePending) updateLineActiveType();

        if ((status[1] & 0x01) && ((register[0] & 0x10) === 0)) status[1] &= ~0x01;                 // FH = 0 if interrupts disabled (IE1 = 0)
        if (currentScanline === startingActiveScanline - 1) status[2] &= ~0x40;                     // VR = 0 at the scanline before first Active scanline
        else if (currentScanline - frameStartingActiveScanline === signalActiveHeight)              // VR = 1, F = 1 at the first Bottom Border line
            triggerVerticalInterrupt();

        cpuBusClockPulses(10);

        // Active Display: 1024 clocks

        status[2] &= ~0x20;                                                                         // HR = 0

        if (slave) slave.lineEventStartActiveDisplay();

        cpuBusClockPulses(22); audioClockPulse32();
        cpuBusClockPulses(33); audioClockPulse32();
        cpuBusClockPulses(32); audioClockPulse32();

        // ~ Middle of Active Line

        if (currentScanline >= startingVisibleTopBorderScanline
            && currentScanline < startingInvisibleScanline ) renderLine();                          // Only render if visible and displayed

        if (slave) slave.lineEventRenderLine();

        cpuR800RefreshPause();

        cpuBusClockPulses(33); audioClockPulse32();
        cpuBusClockPulses(32); audioClockPulse32();
        cpuBusClockPulses(18);

        // End of Active Display

        status[2] |= 0x20;                                                                          // HR = 1
        if (currentScanline - frameStartingActiveScanline === horizontalIntLine)
            triggerHorizontalInterrupt();                                                           // FH = 1

        if (slave) slave.lineEventEndActiveDisplay();

        // Right border: 59 clocks
        // Right erase: 27 clocks

        cpuBusClockPulses(15); audioClockPulse32();
        if ((currentScanline & 0x7) === 0) audioClockPulse32();                                     // One more audioClock32 each 8 lines

        // End of line

        ++currentScanline;
        if (currentScanline >= finishingScanline) finishFrame();

        if (slave) slave.lineEventEnd();

    }

    function triggerVerticalInterrupt() {
        status[2] |= 0x40;                  // VR = 1
        if (!verticalIntReached) {
            verticalIntReached = true;      // Like F = 1
            updateIRQ();
        }

        // logInfo("Vertical Frame Int reached. Ints " + ((register[1] & 0x20) ?  "ENABLED" : "disabled"));
    }

    function triggerHorizontalInterrupt() {
        if ((status[1] & 0x01) === 0) {
            status[1] |= 0x01;              // FH = 1
            updateIRQ();
        }

        // logInfo("Horizontal Int Line reached. Ints " + ((register[0] & 0x10) ?  "ENABLED" : "disabled"));
    }

    function updateIRQ() {
        if ((verticalIntReached && (register[1] & 0x20))            // Like F == 1 and IE0 == 1
            || ((status[1] & 0x01) && (register[0] & 0x10))) {      // FH == 1 and IE1 == 1
            cpu.setINTChannel(0, 0);                                // VDP uses fixed channel 0
        } else {
            cpu.setINTChannel(0, 1);
        }

        //if (verticalIntReached && (register[1] & 0x20)) logInfo(">>>  VDP INT VERTICAL");
        //if ((status[1] & 0x01) && (register[0] & 0x10)) logInfo(">>>  VDP INT HORIZONTAL");
    }

    function updateVRAMInterleaving() {
        if (modeData.vramInter === true && !vramInterleaving) vramEnterInterleaving();
        else if (modeData.vramInter === false && vramInterleaving) vramExitInterleaving();
    }

    function vramEnterInterleaving() {
        var e = 0;
        var o = VRAM_SIZE >> 1;
        var aux = vram.slice(0, o);                 // Only first halt needs to be saved. Verify: Optimize slice?
        for (var i = 0; i < VRAM_SIZE; i += 2, ++e, ++o) {
            vram[i] = aux[e];
            vram[i + 1] = vram[o];
        }
        vramInterleaving = true;

        //console.log("VRAM ENTERING Interleaving");
    }

    function vramExitInterleaving() {
        var h = VRAM_SIZE >> 1;
        var e = 0;
        var o = h;
        var aux = vram.slice(h);                    // Only last half needs to be saved. Verify: Optimize slice?
        for (var i = 0; i < h; i += 2, ++e, ++o) {
            vram[e] = vram[i];
            vram[o] = vram[i + 1];
        }
        for (i = 0; i < h; i += 2, ++e, ++o) {
            vram[e] = aux[i];
            vram[o] = aux[i + 1];
        }
        vramInterleaving = false;

        //console.log("VRAM EXITING Interleaving");
    }

    function setMode(m) {
        registerWrite(0, (register[0] & ~0x0e) | ((m & 0x07) << 1));
        registerWrite(1, (register[1] & ~0x18) | (m & 0x18));
    }

    function updateMode(forceRenderMetrics) {
        var oldData = modeData;

        // All Mx bits. Ignore YAE, YJK. Ignore M4, M5 if V9918
        var modeBits = (register[1] & 0x18) | ((register[0] & (isV9918 ? 0x02 : 0x0e)) >>> 1);
        commandProcessor.setVDPModeData(modes[modeBits]);       // Independent of YJK modes!

        // If YJK is set in any non-TEXT mode, modeData for rendering is determined by YAE, YJK only
        if (isV9958 && (register[25] & 0x08) !== 0 && (modeBits & 0x10) === 0) modeBits = 0x20 | ((register[25] & 0x18) >> 3);
        modeData = modes[modeBits];

        // Update Tables base addresses
        var add;
        updateLayoutTableAddress();
        add = ((register[10] << 14) | (register[3] << 6)) & 0x1ffff ;
        colorTableAddress = add & modeData.colorTBase;
        colorTableAddressMask = add | colorTableAddressMaskBase;
        add = (register[4] << 11) & 0x1ffff;
        patternTableAddress = add & modeData.patTBase;
        patternTableAddressMask = add | patternTableAddressMaskBase;
        add = ((register[11] << 15) | (register[5] << 7)) & 0x1ffff ;
        spriteAttrTableAddress = add & modeData.sprAttrTBase;
        updateSpritePatternTableAddress();

        // Color modes
        if (modeData.bdPaletted !== oldData.bdPaletted) updateBackdropColor();
        if (modeData.tiled !== oldData.tiled) backdropCacheUpdatePending = true;

        updateVRAMInterleaving();
        updateLineActiveType();
        updateRenderMetrics(forceRenderMetrics);

        //logInfo("Update Mode: " + modeData.name + ". Reg0: " + register[0].toString(16));
    }

    function updateVideoStandardSoft() {
        //logInfo("PC: " + cpu.eval("PC").toString(16) + ", reg9: " + register[9].toString(16) + ", slots: " + machine.bus.getPrimarySlotConfig().toString(16));
        //wmsx.Util.dumpSlot(WMSX.room.machine.bus.slots[3].subSlots[0], cpu.eval("SP"), 30);

        var pal = (register[9] & 0x02);
        machine.setVideoStandardSoft(pal ? wmsx.VideoStandard.PAL : wmsx.VideoStandard.NTSC);

        //logInfo("VideoStandard soft: " + (pal ? "PAL" : "NTSC"));
    }

    function updateSignalMetrics(force) {
        var addBorder;

        // Fixed metrics for V9918 with no slave (V9990)
        if (isV9918 && !slave) {
            signalActiveHeight = 192; addBorder = 0;
        } else {
            if (!isV9918 && (register[9] & 0x80)) { signalActiveHeight = 212; addBorder = 0; }         // LN
            else { signalActiveHeight = 192; addBorder = 10; }
        }

        // Render starts at first Top Border line
        // Total Top border height is 16. UX decision: Visible top and bottom border height with no Vertical Adjust is 8
        startingVisibleTopBorderScanline = 16 - 8;                                                              // 0-7 Top Border lines left invisible (NTSC with LN = 0)
        startingActiveScanline = startingVisibleTopBorderScanline + 8 + addBorder + verticalAdjust;
        var startingVisibleBottomBorderScanline = startingActiveScanline + signalActiveHeight;
        startingInvisibleScanline = startingVisibleBottomBorderScanline + 8 + addBorder - verticalAdjust;       // Remaining left invisible: Bottom border, Bottom Erase, Sync and Top Erase
        finishingScanline = frameVideoStandard.totalHeight;

        if (force) frameStartingActiveScanline = startingActiveScanline;

        // logInfo("Update Signal Metrics: " + force + ", activeHeight: " + signalActiveHeight);
    }

    function updateRenderMetrics(force) {
        var newRenderWidth, newRenderHeight, changed = false, clean = false;

        // Fixed metrics for V9918 with no slave (V9990)
        if (isV9918 && !slave) {
            newRenderWidth = wmsx.VDP.SIGNAL_WIDTH_V9918;
            newRenderHeight = wmsx.VDP.SIGNAL_HEIGHT_V9918;
        } else {
            newRenderWidth = modeData.width === 512 ? 512 + 16 * 2 : 256 + 8 * 2;
            newRenderHeight = !isV9918 && (register[9] & 0x08) ? 424 + 16 * 2 : 212 + 8 * 2;
        }

        renderMetricsChangePending = false;

        if (newRenderWidth === renderWidth && newRenderHeight === renderHeight) return;

        // console.error("Update Render Metrics. " + force + " Asked: " + newRenderWidth + "x" + newRenderHeight + ", set: " + renderWidth + "x" + renderHeight);

        // Only change width if before visible display (beginFrame), or if going to higher width
        if (newRenderWidth !== renderWidth) {
            if (currentScanline < startingVisibleTopBorderScanline || newRenderWidth > renderWidth) {
                if (currentScanline >= startingVisibleTopBorderScanline) {
                    if (force) clean = true;
                    else stretchFromCurrentToTopScanline();
                }
                renderWidth = newRenderWidth;
                changed = true;
            } else
                renderMetricsChangePending = true;
        }

        // Only change height if forced (loadState and beginFrame)
        if (newRenderHeight !== renderHeight) {
            if (force) {
                if (currentScanline >= startingVisibleTopBorderScanline || newRenderHeight > renderHeight) clean = true;
                renderHeight = newRenderHeight;
                changed = true;
            } else
                renderMetricsChangePending = true;
        }

        if (clean) cleanFrameBuffer();
        if (changed) self.refreshDisplayMetrics();
    }

    function setActiveDisplay() {
        renderLine = renderLineActive;
    }

    function setBorderDisplay() {
        renderLine = renderLineBorders;
    }

    function updateLineActiveType() {
        var wasActive = renderLine === renderLineActive;

        renderLineActive = (register[1] & 0x40) === 0 ? renderLineBlanked
            : debugModePatternInfo ? modeData.renderLinePatInfo
            : modeData.renderLine;

        if (wasActive) renderLine = renderLineActive;
        blankingChangePending = false;
    }

    function updateSpritesConfig() {
        spritesEnabled = !debugModeSpritesHidden && (register[8] & 0x02) === 0;        // SPD
        spritesSize = (register[1] & 0x02) ? 16 : 8;        // SI
        spritesMag = register[1] & 0x01;                    // MAG

        //logInfo("Sprites enabled: " + spritesEnabled + ", size: " + spritesSize + ", mag: " + spritesMag);
    }

    function updateTransparency() {
        color0Solid = (register[8] & 0x20) !== 0;
        colorPalette[0] = color0Solid ? colorPaletteSolid[0] : backdropValue;

        //console.log("TP: " + color0Solid + ", currentLine: " + currentScanline);
    }

    function updateBackdropColor() {
        backdropColor = register[7] & (modeData.bdPaletted ? 0x0f : 0xff);

        //console.log("Backdrop Color: " + backdropColor + ", currentLine: " + currentScanline);

        updateBackdropValue();
    }

    function updateBackdropValue() {
        var value = debugModePatternInfo ? debugBackdropValue
            : modeData.bdPaletted ? colorPaletteSolid[backdropColor]     // From current palette (solid regardless of TP)
            : colors8bitValues[backdropColor];                           // From all 256 colors

        if (backdropValue === value) return;
        backdropValue = value;
        if (!color0Solid) colorPalette[0] = value;
        backdropCacheUpdatePending = true;

        //logInfo("Backdrop Value: " + backdropValue.toString(16));
    }

    function updateBackdropLineCache() {
        if (modeData.tiled && !debugModePatternInfo) {          // Special case for tiled mode (G5, Screen 6)
            var odd = colorPaletteSolid[backdropColor >>> 2]; var even = colorPaletteSolid[backdropColor & 0x03];
            for (var i = 0; i < LINE_WIDTH; i += 2) {
                backdropLineCache[i] = odd; backdropLineCache[i + 1] = even;
            }
            backdropTileOdd = odd; backdropTileEven = even;
        } else {
            wmsx.Util.arrayFill(backdropLineCache, backdropValue);
            if (modeData.tiled) backdropTileOdd = backdropTileEven = backdropValue;
        }

        backdropCacheUpdatePending = false;

        //console.log("Update BackdropCaches");
    }

    function updateBlinking() {
        blinkPerLine = (register[1] & 0x04) !== 0;               // Set tlinking speed per line instead of frame, based on undocumented CDR bit
        if ((register[13] >>> 4) === 0) {
            blinkEvenPage = false; blinkPageDuration = 0;        // Force page to be fixed on the Odd page
        } else if ((register[13] & 0x0f) === 0) {
            blinkEvenPage = true;  blinkPageDuration = 0;        // Force page to be fixed on the Even page
        } else {
            blinkEvenPage = true;  blinkPageDuration = 1;        // Force next page to be the Even page and let alternance start
        }
        updateLayoutTableAddressMask();                          // To reflect correct page
    }

    function clockPageBlinking() {
        if (--blinkPageDuration === 0) {
            blinkEvenPage = !blinkEvenPage;
            blinkPageDuration = ((register[13] >>> (blinkEvenPage ? 4 : 0)) & 0x0f) * 10;   // Duration in frames or lines depending on undocumented CDR bit
            return true;
        }
        return false;
    }

    function renderLineBorders() {
        if (!videoDisplayed) return;

        if (backdropCacheUpdatePending) updateBackdropLineCache();
        frameBackBuffer.set(backdropLineCache, bufferPosition);
        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineBlanked() {
        renderLineBorders();
    }

    function getRealLine() {
        return (currentScanline - frameStartingActiveScanline + register[23]) & 255;
    }

    // V9958: Only Left Masking and Right Pixel Scroll supported. Left Char Scroll and Scroll Pages not supported
    function renderLineModeT1() {                                           // Text (Screen 0 width 40)
        if (!videoDisplayed) return;

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var realLine = getRealLine();
        var colorCode = register[7];                                        // fixed text color for all line
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var on =  colorPalette[colorCode >>> 4];
        var off = colorPalette[colorCode & 0xf];

        var namePos = layoutTableAddress + (realLine >>> 3) * 40;

        paintBackdrop8(bufferPos); bufferPos += 8;                          // Text padding
        for (var c = 0; c < 40; ++c) {
            var name = vram[namePos]; ++namePos;                            // no masking needed
            var pattern = vram[(name << 3) + lineInPattern];                // no masking needed
            paintPattern6(bufferPos, pattern, on, off);
            bufferPos += 6;
        }
        paintBackdrop8(bufferPos); bufferPos += 8;                          // Text padding
        bufferPos -= rightScrollPixels + 256;

        // Sprites deactivated
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    // V9958: Only Left Masking and Right Pixel Scroll supported. Left Char Scroll and Scroll Pages not supported
    function renderLineModeT2() {                                           // Text (Screen 0 width 80)
        if (!videoDisplayed) return;

        paintBackdrop32(bufferPosition); paintBackdrop32(bufferPosition + 512);

        var bufferPos = bufferPosition + 16 + ((horizontalAdjust + rightScrollPixels) << 1);
        var realLine = getRealLine();
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var name, pattern, colorCode, on, off;

        var namePos = layoutTableAddress + (realLine >>> 3) * 80;

        paintBackdrop16(bufferPos); bufferPos += 16;                        // Text padding
        if (blinkEvenPage) {                                                // Blink only in Even page
            var blinkPos = colorTableAddress + (realLine >>> 3) * 10;
            var blinkBit = 7;
            for (var c = 0; c < 80; ++c) {
                var blink = (vram[blinkPos & colorTableAddressMask] >>> blinkBit) & 1;
                name = vram[namePos & layoutTableAddressMask]; ++namePos;
                colorCode = register[blink ? 12 : 7];                       // special colors from register12 if blink bit for position is set
                pattern = vram[(name << 3) + lineInPattern];                // no masking needed
                on = blink ? colorPaletteSolid[colorCode >>> 4] : colorPalette[colorCode >>> 4];    // color 0 is always solid in blink
                off = blink ? colorPaletteSolid[colorCode & 0xf] : colorPalette[colorCode & 0xf];
                paintPattern6(bufferPos, pattern, on, off);
                if (--blinkBit < 0) { ++blinkPos; blinkBit = 7; }
                bufferPos += 6;
            }
        } else {
            colorCode = register[7];
            on =  colorPalette[colorCode >>> 4];
            off = colorPalette[colorCode & 0xf];
            for (c = 0; c < 80; ++c) {
                name = vram[namePos & layoutTableAddressMask]; ++namePos;
                pattern = vram[(name << 3) + lineInPattern];                // no masking needed
                paintPattern6(bufferPos, pattern, on, off);
                bufferPos += 6;
            }
        }
        paintBackdrop16(bufferPos); bufferPos += 16;                        // Text padding
        bufferPos -= (rightScrollPixels << 1) + 512;

        // Sprites deactivated
        if (leftMask) paintBackdrop16(bufferPos); // { paintPattern8(bufferPos, 255, 0xff0000ff, 0); paintPattern8(bufferPos + 8, 255, 0xff0000ff, 0); }
        if (rightScrollPixels) paintBackdrop16(bufferPos + 512); // { paintPattern8(bufferPos + 512, 255, 0xff0000ff, 0); paintPattern8(bufferPos + 512 + 8, 255, 0xff0000ff, 0); }

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeMC() {                                           // Multicolor (Screen 3)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode1(realLine, 0);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var extraPatPos = patternTableAddress + (((realLine >>> 3) & 0x03) << 1) + ((realLine >>> 2) & 0x01);    // (pattern line % 4) * 2

        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;    // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos]; ++namePos;                            // no masking needed
            var patternLine = (name << 3) + extraPatPos;                    // name * 8 + extra position, no masking needed
            var colorCode = vram[patternLine];                              // no masking needed
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern8(bufferPos, 0xf0, on, off);                        // always solid blocks of front and back colors;
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode1(realLine, bufferPos);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG1() {                                           // Graphics 1 (Screen 1)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode1(realLine, 0);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var lineInPattern = patternTableAddress + (realLine & 0x07);

        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;    // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos]; ++namePos;                            // no masking needed
            var colorCode = vram[colorTableAddress + (name >>> 3)];         // name / 8 (1 color for each 8 patterns), no masking needed
            var pattern = vram[((name << 3) + lineInPattern)];              // name * 8 (8 bytes each pattern) + line inside pattern, no masking needed
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern8(bufferPos, pattern, on, off);
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode1(realLine, bufferPos);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG2() {                                           // Graphics 2 (Screen 2)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode1(realLine, 0);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var lineInColor = colorTableAddress + (realLine & 0x07);
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var blockExtra = (realLine & 0xc0) << 2;                            // + 0x100 for each third block of the screen (8 pattern lines)

        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;     // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos] | blockExtra; ++namePos;                              // no masking needed
            var colorCode = vram[((name << 3) + lineInColor) & colorTableAddressMask];     // (8 bytes each pattern) + line inside pattern
            var pattern = vram[((name << 3) + lineInPattern) & patternTableAddressMask];
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern8(bufferPos, pattern, on, off);
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode1(realLine, bufferPos);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG3() {                                           // Graphics 3 (Screen 4)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2(realLine, 0, colorPaletteReal);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var lineInColor = colorTableAddress + (realLine & 0x07);
        var lineInPattern = patternTableAddress + (realLine & 0x07);
        var blockExtra = (realLine & 0xc0) << 2;                            // + 0x100 for each third block of the screen (8 pattern lines)

        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;    // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos] | blockExtra; ++namePos;                             // no masking needed
            var colorCode = vram[((name << 3) + lineInColor) & colorTableAddressMask];    // (8 bytes each pattern) + line inside pattern
            var pattern = vram[((name << 3) + lineInPattern) & patternTableAddressMask];
            var on =  colorPalette[colorCode >>> 4];
            var off = colorPalette[colorCode & 0xf];
            paintPattern8(bufferPos, pattern, on, off);
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode2(realLine, bufferPos, colorPaletteReal);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG4() {                                           // Graphics 4 (Screen 5)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2(realLine, 0, colorPaletteReal);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var pixelsPosBase = layoutTableAddress + (realLine << 7);
        var pixelsPos = pixelsPosBase + (leftScrollCharsInPage << 2);
        if (leftScroll2Pages && leftScrollChars < 32) pixelsPos &= modeData.evenPageMask; // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) pixelsPos = leftScroll2Pages && leftScrollChars >= 32 ? pixelsPosBase & modeData.evenPageMask : pixelsPosBase;

            var pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode2(realLine, bufferPos, colorPaletteReal);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG5() {                                           // Graphics 5 (Screen 6)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2Tiled(realLine, 0);

        paintBackdrop32Tiled(bufferPosition); paintBackdrop32Tiled(bufferPosition + 512);

        var bufferPos = bufferPosition + 16 + ((horizontalAdjust + rightScrollPixels) << 1);
        var pixelsPosBase = layoutTableAddress + (realLine << 7);
        var pixelsPos = pixelsPosBase + (leftScrollCharsInPage << 2);
        if (leftScroll2Pages && leftScrollChars < 32) pixelsPos &= modeData.evenPageMask; // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        if (color0Solid)                                                    // Normal paint for TP = 1
            for (var c = 0; c < 32; ++c) {
                if (c === scrollCharJump) pixelsPos = leftScroll2Pages && leftScrollChars >= 32 ? pixelsPosBase & modeData.evenPageMask : pixelsPosBase;

                var pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels >>> 6];          ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 4) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 2) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels & 0x03];         ++bufferPos;
                pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels >>> 6];          ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 4) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 2) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels & 0x03];         ++bufferPos;
                pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels >>> 6];          ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 4) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 2) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels & 0x03];         ++bufferPos;
                pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels >>> 6];          ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 4) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[(pixels >>> 2) & 0x03]; ++bufferPos;
                frameBackBuffer[bufferPos] = colorPaletteSolid[pixels & 0x03];         ++bufferPos;
            }
        else                                                                // Tiling for color 0 for TP = 0
            for (c = 0; c < 32; ++c) {
                if (c === scrollCharJump) pixelsPos = leftScroll2Pages && leftScrollChars >= 32 ? pixelsPosBase & modeData.evenPageMask : pixelsPosBase;

                pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = (pixels & 0xc0) ? colorPaletteSolid[pixels >>> 6] : backdropTileOdd;           ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x30) ? colorPaletteSolid[(pixels >>> 4) & 0x03] : backdropTileEven; ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x0c) ? colorPaletteSolid[(pixels >>> 2) & 0x03] : backdropTileOdd;  ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x03) ? colorPaletteSolid[pixels & 0x03] : backdropTileEven;         ++bufferPos;
                pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = (pixels & 0xc0) ? colorPaletteSolid[pixels >>> 6] : backdropTileOdd;           ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x30) ? colorPaletteSolid[(pixels >>> 4) & 0x03] : backdropTileEven; ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x0c) ? colorPaletteSolid[(pixels >>> 2) & 0x03] : backdropTileOdd;  ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x03) ? colorPaletteSolid[pixels & 0x03] : backdropTileEven;         ++bufferPos;
                pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = (pixels & 0xc0) ? colorPaletteSolid[pixels >>> 6] : backdropTileOdd;           ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x30) ? colorPaletteSolid[(pixels >>> 4) & 0x03] : backdropTileEven; ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x0c) ? colorPaletteSolid[(pixels >>> 2) & 0x03] : backdropTileOdd;  ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x03) ? colorPaletteSolid[pixels & 0x03] : backdropTileEven;         ++bufferPos;
                pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
                frameBackBuffer[bufferPos] = (pixels & 0xc0) ? colorPaletteSolid[pixels >>> 6] : backdropTileOdd;           ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x30) ? colorPaletteSolid[(pixels >>> 4) & 0x03] : backdropTileEven; ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x0c) ? colorPaletteSolid[(pixels >>> 2) & 0x03] : backdropTileOdd;  ++bufferPos;
                frameBackBuffer[bufferPos] = (pixels & 0x03) ? colorPaletteSolid[pixels & 0x03] : backdropTileEven;         ++bufferPos;
            }
        bufferPos -= (rightScrollPixels << 1) + 512;

        renderSpritesLineMode2Tiled(realLine, bufferPos);
        if (leftMask) paintBackdrop16Tiled(bufferPos);
        if (rightScrollPixels) paintBackdrop16Tiled(bufferPos + 512);

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG6() {                                           // Graphics 6 (Screen 7)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2Stretched(realLine, 0, colorPaletteReal);

        paintBackdrop32(bufferPosition); paintBackdrop32(bufferPosition + 512);

        var bufferPos = bufferPosition + 16 + ((horizontalAdjust + rightScrollPixels) << 1);
        var pixelsPosBase = layoutTableAddress + (realLine << 8);
        var pixelsPos = pixelsPosBase + (leftScrollCharsInPage << 3);
        if (leftScroll2Pages && leftScrollChars < 32) pixelsPos &= modeData.evenPageMask;   // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) pixelsPos = leftScroll2Pages && leftScrollChars >= 32 ? pixelsPosBase & modeData.evenPageMask : pixelsPosBase;

            var pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
            pixels = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels >>> 4];  ++bufferPos;
            frameBackBuffer[bufferPos] = colorPalette[pixels & 0x0f]; ++bufferPos;
        }
        bufferPos -= (rightScrollPixels << 1) + 512;

        renderSpritesLineMode2Stretched(realLine, bufferPos, colorPaletteReal);
        if (leftMask) paintBackdrop16(bufferPos);
        if (rightScrollPixels) paintBackdrop16(bufferPos + 512);

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG7() {                                           // Graphics 7 (Screen 8)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2(realLine, 0, spritePaletteG7);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var alpha = debugModeSpriteHighlight ? DEBUG_DIM_ALPHA_MASK : 0xffffffff;
        var pixelsPosBase = layoutTableAddress + (realLine << 8);
        var pixelsPos = pixelsPosBase + (leftScrollCharsInPage << 3);
        if (leftScroll2Pages && leftScrollChars < 32) pixelsPos &= modeData.evenPageMask; // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) pixelsPos = leftScroll2Pages && leftScrollChars >= 32 ? pixelsPosBase & modeData.evenPageMask : pixelsPosBase;

            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
            frameBackBuffer[bufferPos] = colors8bitValues[vram[pixelsPos & layoutTableAddressMask]] & alpha; ++pixelsPos; ++bufferPos;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode2(realLine, bufferPos, spritePaletteG7);       // Special fixed palette
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeYJK() {                                          // Bitmap modes in YJK. Both horizontal resolutions (256, 512)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2(realLine, 0, colorPaletteReal);

        paintBackdrop20(bufferPosition); paintBackdrop16(bufferPosition + 256 + 4);

        if (!colorsYJKValues) colorsYJKValues = wmsx.ColorCache.getColorsYJKValues();

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels + 4;    // In YJK modes, the screen is shifted 4 pixels to the rignt
        var pixelsPosBase = layoutTableAddress + (realLine << 8);
        var pixelsPos = pixelsPosBase + (leftScrollCharsInPage << 3);
        if (leftScroll2Pages && leftScrollChars < 32) pixelsPos &= modeData.evenPageMask; // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        var v1, v2, v3, v4, chroma;
        var alpha = 0xff000000 & (debugModeSpriteHighlight ? DEBUG_DIM_ALPHA_MASK : 0xff000000);

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) pixelsPos = leftScroll2Pages && leftScrollChars >= 32 ? pixelsPosBase & modeData.evenPageMask : pixelsPosBase;

            v1 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v2 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v3 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v4 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            chroma = ((v4 & 0x07) << 9) | ((v3 & 0x07) << 6) | ((v2 & 0x07) << 3) | (v1 & 0x07);
            frameBackBuffer[bufferPos] = colorsYJKValues[((v1 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = colorsYJKValues[((v2 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = colorsYJKValues[((v3 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = colorsYJKValues[((v4 & 0xf8) << 9) | chroma]; ++bufferPos;

            v1 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v2 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v3 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v4 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            chroma = ((v4 & 0x07) << 9) | ((v3 & 0x07) << 6) | ((v2 & 0x07) << 3) | (v1 & 0x07);
            frameBackBuffer[bufferPos] = colorsYJKValues[((v1 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = colorsYJKValues[((v2 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = colorsYJKValues[((v3 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = colorsYJKValues[((v4 & 0xf8) << 9) | chroma]; ++bufferPos;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode2(realLine, bufferPos, colorPaletteReal);       // Normal palette
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeYAE() {                                          // Bitmap modes in YJK with YAE. Both horizontal resolutions (256, 512)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2(realLine, 0, colorPaletteReal);

        paintBackdrop20(bufferPosition); paintBackdrop16(bufferPosition + 256 + 4);

        if (!colorsYJKValues) colorsYJKValues = wmsx.ColorCache.getColorsYJKValues();

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels + 4;    // In YJK modes, the screen is shifted 4 pixels to the rignt
        var pixelsPosBase = layoutTableAddress + (realLine << 8);
        var pixelsPos = pixelsPosBase + (leftScrollCharsInPage << 3);
        if (leftScroll2Pages && leftScrollChars < 32) pixelsPos &= modeData.evenPageMask; // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        var v1, v2, v3, v4, y, j, k, chroma;
        var alpha = 0xff000000 & (debugModeSpriteHighlight ? DEBUG_DIM_ALPHA_MASK : 0xff000000);

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) pixelsPos = leftScroll2Pages && leftScrollChars >= 32 ? pixelsPosBase & modeData.evenPageMask : pixelsPosBase;

            v1 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v2 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v3 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v4 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            chroma = ((v4 & 0x07) << 9) | ((v3 & 0x07) << 6) | ((v2 & 0x07) << 3) | (v1 & 0x07);
            frameBackBuffer[bufferPos] = (v1 & 0x8) ? colorPalette[v1 >> 4] : colorsYJKValues[((v1 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = (v2 & 0x8) ? colorPalette[v2 >> 4] : colorsYJKValues[((v2 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = (v3 & 0x8) ? colorPalette[v3 >> 4] : colorsYJKValues[((v3 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = (v4 & 0x8) ? colorPalette[v4 >> 4] : colorsYJKValues[((v4 & 0xf8) << 9) | chroma]; ++bufferPos;

            v1 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v2 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v3 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            v4 = vram[pixelsPos & layoutTableAddressMask]; ++pixelsPos;
            chroma = ((v4 & 0x07) << 9) | ((v3 & 0x07) << 6) | ((v2 & 0x07) << 3) | (v1 & 0x07);
            frameBackBuffer[bufferPos] = (v1 & 0x8) ? colorPalette[v1 >> 4] : colorsYJKValues[((v1 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = (v2 & 0x8) ? colorPalette[v2 >> 4] : colorsYJKValues[((v2 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = (v3 & 0x8) ? colorPalette[v3 >> 4] : colorsYJKValues[((v3 & 0xf8) << 9) | chroma]; ++bufferPos;
            frameBackBuffer[bufferPos] = (v4 & 0x8) ? colorPalette[v4 >> 4] : colorsYJKValues[((v4 & 0xf8) << 9) | chroma]; ++bufferPos;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode2(realLine, bufferPos, colorPaletteReal);       // Normal palette
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeT1PatInfo() {                                // Text (Screen 0)
        if (!videoDisplayed) return;

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var realLine = getRealLine();
        var lineInPattern = realLine & 0x07;

        var namePos = layoutTableAddress + ((realLine >>> 3) * 40);

        paintBackdrop8(bufferPos); bufferPos += 8;                          // Text padding
        for (var c = 0; c < 40; ++c) {
            var name = vram[namePos]; ++namePos;
            if (debugModePatternInfoNames) {
                var on =  name === 0 || name === 0x20 ? 0xffee0000 : 0xffffffff;
                var pattern = vram[DEBUG_PAT_DIGI6_TABLE_ADDRESS + (name << 3) + lineInPattern];
                paintPattern6TInfo(bufferPos, pattern, on, 0xff000000);
            } else {
                pattern = vram[patternTableAddress + (name << 3) + lineInPattern];
                paintPattern6(bufferPos, pattern, 0xffffffff, 0xff000000);
            }
            bufferPos += 6;
        }
        paintBackdrop8(bufferPos); bufferPos += 8;                          // Text padding
        bufferPos -= rightScrollPixels + 256;

        // Sprites deactivated
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeT2PatInfo() {                                // Text (Screen 0 width 80)
        if (!videoDisplayed) return;

        paintBackdrop32(bufferPosition); paintBackdrop32(bufferPosition + 512);

        var bufferPos = bufferPosition + 16 + ((horizontalAdjust + rightScrollPixels) << 1);
        var realLine = getRealLine();
        var lineInPattern = realLine & 0x07;
        var name, pattern, on;

        var namePos = layoutTableAddress + (realLine >>> 3) * 80;

        paintBackdrop16(bufferPos); bufferPos += 16;                        // Text padding
        if (blinkEvenPage) {                                                // Blink only in Even page
            var blinkPos = colorTableAddress + (realLine >>> 3) * 10;
            var blinkBit = 7;
            for (var c = 0; c < 80; ++c) {
                var blink = (vram[blinkPos & colorTableAddressMask] >>> blinkBit) & 1;
                name = vram[namePos & layoutTableAddressMask]; ++namePos;
                if (debugModePatternInfoNames) {
                    on = name === 0 || name === 0x20 ? 0xffee0000 : 0xffffffff;
                    if (blink) on &= 0xffa0a0a0;
                    pattern = vram[DEBUG_PAT_DIGI6_TABLE_ADDRESS + (name << 3) + lineInPattern];
                    paintPattern6TInfo(bufferPos, pattern, on, 0xff000000);
                } else {
                    pattern = vram[patternTableAddress + (name << 3) + lineInPattern];      // no masking needed
                    paintPattern6(bufferPos, pattern, blink ? 0xffa0a0a0 : 0xffffffff, 0xff000000);
                }
                if (--blinkBit < 0) { ++blinkPos; blinkBit = 7; }
                bufferPos += 6;
            }
        } else {
            for (c = 0; c < 80; ++c) {
                name = vram[namePos & layoutTableAddressMask]; ++namePos;
                if (debugModePatternInfoNames) {
                    on = name === 0 || name === 0x20 ? 0xffee0000 : 0xffffffff;
                    pattern = vram[DEBUG_PAT_DIGI6_TABLE_ADDRESS + (name << 3) + lineInPattern];
                    paintPattern6TInfo(bufferPos, pattern, on, 0xff000000);
                } else {
                    pattern = vram[patternTableAddress + (name << 3) + lineInPattern];      // no masking needed
                    paintPattern6(bufferPos, pattern, 0xffffffff, 0xff000000);
                }
                bufferPos += 6;
            }
        }
        paintBackdrop16(bufferPos); bufferPos += 16;                        // Text padding
        bufferPos -= (rightScrollPixels << 1) + 512;

        // Sprites deactivated
        if (leftMask) paintBackdrop16(bufferPos); // { paintPattern8(bufferPos, 255, 0xff0000ff, 0); paintPattern8(bufferPos + 8, 255, 0xff0000ff, 0); }
        if (rightScrollPixels) paintBackdrop16(bufferPos + 512); // { paintPattern8(bufferPos + 512, 255, 0xff0000ff, 0); paintPattern8(bufferPos + 512 + 8, 255, 0xff0000ff, 0); }

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function paintPattern6TInfo(bufferPos, pattern, on, off) {
        var low = on & 0x97ffffff;
        frameBackBuffer[bufferPos]     = pattern & 0x80 ? on : off; frameBackBuffer[bufferPos + 1] = pattern & 0x40 ? on : off; frameBackBuffer[bufferPos + 2] = pattern & 0x20 ? on : off;
        frameBackBuffer[bufferPos + 3] = pattern & 0x10 ? low : off;  frameBackBuffer[bufferPos + 4] = pattern & 0x08 ? low : off;  frameBackBuffer[bufferPos + 5] = pattern & 0x04 ? low : off;
    }

    function renderLineModeMCPatInfo() {                                // Multicolor (Screen 3)
        if (!debugModePatternInfoNames) return renderLineModeMC();

        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode1(realLine, 0);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;    // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos]; ++namePos;
            var pattern = vram[DEBUG_PAT_DIGI8_TABLE_ADDRESS + (name << 3) + (realLine & 0x07)];
            paintPattern8(bufferPos, pattern, 0xffffffff, 0xff000000);
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode1(realLine, bufferPos);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG1PatInfo() {                                // Graphics 1 (Screen 1)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode1(realLine, 0);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var lineInPattern = realLine & 0x07;
        var pattern, on, off;

        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;    // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos]; ++namePos;
            if (debugModePatternInfoNames) {
                on =  name === 0 || name === 0x20 ? 0xffee0000 : 0xffffffff;
                off = 0xff000000;
                pattern = vram[DEBUG_PAT_DIGI8_TABLE_ADDRESS + (name << 3) + lineInPattern];
            } else if (debugModePatternInfoBlocks) {
                var colorCode = vram[colorTableAddress + (name >>> 3)];
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                pattern = vram[DEBUG_PAT_BLOCK_TABLE_ADDRESS + lineInPattern];
            } else {
                on =  0xffffffff;
                off = 0xff000000;
                pattern = vram[patternTableAddress + (name << 3) + lineInPattern];
            }
            paintPattern8(bufferPos, pattern, on, off);
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode1(realLine, bufferPos);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG2PatInfo() {                                // Graphics 2 (Screen 2)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode1(realLine, 0);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var lineInPattern = realLine & 0x07;
        var blockExtra = (realLine & 0xc0) << 2;
        var pattern, on, off;

        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;     // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos] | blockExtra; ++namePos;
            if (debugModePatternInfoNames) {
                name &= 0xff;
                on =  name === 0 || name === 0x20 ? 0xffee0000 : 0xffffffff;
                off = 0xff000000;
                pattern = vram[DEBUG_PAT_DIGI8_TABLE_ADDRESS + (name << 3) + lineInPattern];
            } else if (debugModePatternInfoBlocks) {
                var colorCode = vram[(colorTableAddress + (name << 3) + lineInPattern) & colorTableAddressMask];
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                pattern = vram[DEBUG_PAT_BLOCK_TABLE_ADDRESS + lineInPattern];
            } else {
                on =  0xffffffff;
                off = 0xff000000;
                pattern = vram[(patternTableAddress + (name << 3) + lineInPattern) & patternTableAddressMask];
            }
            paintPattern8(bufferPos, pattern, on, off);
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode1(realLine, bufferPos);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function renderLineModeG3PatInfo() {                                // Graphics 3 (Screen 4)
        var realLine = getRealLine();
        if (!videoDisplayed) return renderSpritesLineMode2(realLine, 0, colorPaletteReal);

        paintBackdrop16(bufferPosition); paintBackdrop16(bufferPosition + 256);

        var bufferPos = bufferPosition + 8 + horizontalAdjust + rightScrollPixels;
        var lineInPattern = realLine & 0x07;
        var blockExtra = (realLine & 0xc0) << 2;
        var pattern, on, off;

        var namePosBase = layoutTableAddress + ((realLine >>> 3) << 5);
        var namePos = namePosBase + leftScrollCharsInPage;
        if (leftScroll2Pages && leftScrollChars < 32) namePos &= modeData.evenPageMask;    // Start at even page
        var scrollCharJump = leftScrollCharsInPage ? 32 - leftScrollCharsInPage : -1;

        for (var c = 0; c < 32; ++c) {
            if (c === scrollCharJump) namePos = leftScroll2Pages && leftScrollChars >= 32 ? namePosBase & modeData.evenPageMask : namePosBase;
            var name = vram[namePos] | blockExtra; ++namePos;
            if (debugModePatternInfoNames) {
                name &= 0xff;
                on =  name === 0 || name === 0x20 ? 0xffee0000 : 0xffffffff;
                off = 0xff000000;
                pattern = vram[DEBUG_PAT_DIGI8_TABLE_ADDRESS + (name << 3) + lineInPattern];
            } else if (debugModePatternInfoBlocks) {
                var colorCode = vram[(colorTableAddress + (name << 3) + lineInPattern) & colorTableAddressMask];
                on =  colorPalette[colorCode >>> 4];
                off = colorPalette[colorCode & 0xf];
                pattern = vram[DEBUG_PAT_BLOCK_TABLE_ADDRESS + lineInPattern];
            } else {
                on =  0xffffffff;
                off = 0xff000000;
                pattern = vram[(patternTableAddress + (name << 3) + lineInPattern) & patternTableAddressMask];
            }
            paintPattern8(bufferPos, pattern, on, off);
            bufferPos += 8;
        }
        bufferPos -= rightScrollPixels + 256;

        renderSpritesLineMode2(realLine, bufferPos, colorPaletteReal);
        if (leftMask) paintBackdrop8(bufferPos);
        if (rightScrollPixels) paintBackdrop8(bufferPos + 256);

        if (renderWidth > 500) stretchCurrentLine();

        bufferPosition = bufferPosition + bufferLineAdvance;
    }

    function paintPattern6(bufferPos, pattern, on, off) {
        frameBackBuffer[bufferPos]   = pattern & 0x80 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x40 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x20 ? on : off;
        frameBackBuffer[++bufferPos] = pattern & 0x10 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x08 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x04 ? on : off;
    }

    function paintPattern6a(bufferPos, pattern, on, off) {
        for (var i = 6; i > 0; --i, ++bufferPos) frameBackBuffer[bufferPos] = (pattern >> i) & 0x04 ? on : off;
    }

    function paintPattern8(bufferPos, pattern, on, off) {
        frameBackBuffer[bufferPos]   = pattern & 0x80 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x40 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x20 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x10 ? on : off;
        frameBackBuffer[++bufferPos] = pattern & 0x08 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x04 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x02 ? on : off; frameBackBuffer[++bufferPos] = pattern & 0x01 ? on : off;
    }

    function paintBackdrop8(bufferPos) {
        frameBackBuffer[bufferPos]   = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
    }

    function paintBackdrop16(bufferPos) {
        frameBackBuffer[bufferPos]   = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
    }

    function paintBackdrop20(bufferPos) {
        frameBackBuffer[bufferPos]   = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
        frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue; frameBackBuffer[++bufferPos] = backdropValue;
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

    function paintBackdrop16Tiled(bufferPos) {
        var odd = backdropTileOdd; var even = backdropTileEven;
        frameBackBuffer[bufferPos]   = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
    }

    function paintBackdrop32Tiled(bufferPos) {
        var odd = backdropTileOdd; var even = backdropTileEven;
        frameBackBuffer[bufferPos]   = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
        frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even; frameBackBuffer[++bufferPos] = odd; frameBackBuffer[++bufferPos] = even;
    }

    function renderSpritesLineMode1(line, bufferPos) {
        if (debugModeSpritesHidden || vram[spriteAttrTableAddress] === 208) return;    // No sprites to show!

        var size = spritesSize << spritesMag;
        var atrPos, color, name, lineInPattern, pattern;
        var sprite = -1, drawn = 0, y, spriteLine, x, s, f;
        spritesGlobalPriority -= 32;

        atrPos = spriteAttrTableAddress - 4;
        for (var i = 0; i < 32; ++i) {                                // Max of 32 sprites
            atrPos = atrPos + 4;
            sprite = sprite + 1;
            y = vram[atrPos];
            if (y === 208) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine >= size) continue;                               // Not visible at line
            if (++drawn > 4) {                                              // Max of 4 sprites drawn. Store the first invalid (5th)
                if (spritesInvalid < 0 && !verticalIntReached) spritesInvalid = sprite;
                if (spriteDebugModeLimit) return;
            }
            x = vram[atrPos + 1];
            color = vram[atrPos + 3];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x <= -size) continue;                                   // Not visible (out to the left)
            }
            color &= 0x0f;
            if (spritesSize === 16) {
                name = debugModeSpriteInfoNumbers ? sprite << 2: vram[atrPos + 2] & 0xfc;
                lineInPattern = spritePatternTableAddress + (name << 3) + (spriteLine >>> spritesMag);
                pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            } else {
                name = debugModeSpriteInfoNumbers ? sprite : vram[atrPos + 2];
                pattern = vram[spritePatternTableAddress + (name << 3) + (spriteLine >>> spritesMag)];
            }
            s = x <= 256 - size ? 0 : x - (256 - size);
            f = x >= 0 ? size : size + x;
            x += (size - f);
            paintSpriteMode1(x, line, bufferPos + x, spritesGlobalPriority + sprite, pattern, color, s, f, spritesMag, spriteDebugModeCollisions && (drawn < 5));
        }
        if (spritesInvalid < 0 && sprite > spritesMaxComputed) spritesMaxComputed = sprite;
    }

    function paintSpriteMode1(x, y, bufferPos, spritePri, pattern, color, start, finish, magShift, collide) {
        for (var i = finish - 1; i >= start; --i, ++x, ++bufferPos) {
            var s = (pattern >>> (i >>> magShift)) & 0x01;
            if (s === 0) continue;
            if (spritesLinePriorities[x] < spritePri) {                                     // Higher priority sprite already there
                if (collide && !spritesCollided) setSpritesCollision(x, y);
                if (color !== 0 && spritesLineColors[x] === 0) {                            // Paint only if not transparent and higher priority was transparent
                    spritesLineColors[x] = color;                                           // Register new color
                    frameBackBuffer[bufferPos] = colorPaletteReal[color];
                }
            } else {                                                                        // No higher priority there
                spritesLinePriorities[x] = spritePri;                                       // Register new priority
                spritesLineColors[x] = color;                                               // Register new color
                if (color !== 0) frameBackBuffer[bufferPos] = colorPaletteReal[color];      // Paint only if not transparent
            }
        }
    }

    function renderSpritesLineMode2(line, bufferPos, palette) {
        if (!spritesEnabled || vram[spriteAttrTableAddress + 512] === 216) return;          // No sprites to show!

        var size = spritesSize << spritesMag;
        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, y, spriteLine, x, s, f, cc;
        spritesGlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; ++i) {                                // Max of 32 sprites
            sprite = sprite + 1;
            atrPos = atrPos + 4;
            colorPos = colorPos + 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine >= size) continue;                               // Not visible at line
            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (9th)
                if (spritesInvalid < 0 && !verticalIntReached) spritesInvalid = sprite;
                if (spriteDebugModeLimit) return;
            }
            spriteLine >>>= spritesMag;                                     // Adjust for Mag
            color = vram[colorPos + spriteLine];
            cc = color & 0x40;
            if (cc) {
                if (spritePri === SPRITE_MAX_PRIORITY || debugModeSpriteInfo) continue;   // Must have a higher priority Main Sprite (CC = 0) to show this one and not showing info
            } else spritePri = spritesGlobalPriority + sprite;
            if ((color & 0xf) === 0 && !color0Solid) continue;              // Nothing to paint. Consider TP
            x = vram[atrPos + 1];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x <= -size) continue;                                   // Not visible (out to the left)
            }
            if (spritesSize === 16) {
                name = debugModeSpriteInfoNumbers ? sprite << 2: vram[atrPos + 2] & 0xfc;
                lineInPattern = spritePatternTableAddress + (name << 3) + spriteLine;
                pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            } else {
                name = debugModeSpriteInfoNumbers ? sprite : vram[atrPos + 2];
                pattern = vram[spritePatternTableAddress + (name << 3) + spriteLine];
            }
            s = x <= 256 - size ? 0 : x - (256 - size);
            f = x >= 0 ? size : size + x;
            x += (size - f);
            if (cc) paintSpriteMode2CC (x, bufferPos + x, spritePri, pattern, color & 0xf, palette, s, f, spritesMag);
            else paintSpriteMode2(x, line, bufferPos + x, spritePri, pattern, color & 0xf, palette, s, f, spritesMag, spriteDebugModeCollisions && ((color & 0x20) === 0) && (drawn < 9));       // Consider IC
        }
        if (spritesInvalid < 0 && sprite > spritesMaxComputed) spritesMaxComputed = sprite;
    }

    function paintSpriteMode2(x, y, bufferPos, spritePri, pattern, color, palette, start, finish, magShift, collide) {
        for (var i = finish - 1; i >= start; --i, ++x, ++bufferPos) {
            var s = (pattern >>> (i >>> magShift)) & 0x01;
            if (s === 0) continue;
            if (spritesLinePriorities[x] < spritePri) {                                     // Higher priority sprite already there
                if (collide && !spritesCollided) setSpritesCollision(x, y);
                continue;
            }
            spritesLinePriorities[x] = spritePri;                                           // Register new priority
            spritesLineColors[x] = color;                                                   // Register new color
            frameBackBuffer[bufferPos] = palette[color];
        }
    }

    function paintSpriteMode2CC(x, bufferPos, spritePri, pattern, color, palette, start, finish, magShift) {
        var finalColor;
        for (var i = finish - 1; i >= start; --i, ++x, ++bufferPos) {
            var s = (pattern >>> (i >>> magShift)) & 0x01;
            if (s === 0) continue;
            var prevSpritePri = spritesLinePriorities[x];
            if (prevSpritePri < spritePri) continue;                                        // Higher priority sprite already there
            if (prevSpritePri === spritePri)
                finalColor = color | spritesLineColors[x];                                  // Mix if same priority
            else {
                spritesLinePriorities[x] = spritePri;                                       // Otherwise register new priority
                finalColor = color;
            }
            spritesLineColors[x] = finalColor;                                              // Register new color
            frameBackBuffer[bufferPos] = palette[finalColor];
        }
    }

    function renderSpritesLineMode2Tiled(line, bufferPos) {
        if (!spritesEnabled || vram[spriteAttrTableAddress + 512] === 216) return;          // No sprites to show!

        var size = spritesSize << spritesMag;
        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, y, spriteLine, x, s, f, cc;
        spritesGlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; ++i) {                                // Max of 32 sprites
            sprite = sprite + 1;
            atrPos = atrPos + 4;
            colorPos = colorPos + 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine >= size) continue;                               // Not visible at line
            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (9th)
                if (spritesInvalid < 0 && !verticalIntReached) spritesInvalid = sprite;
                if (spriteDebugModeLimit) return;
            }
            spriteLine >>>= spritesMag;                                     // Adjust for Mag
            color = vram[colorPos + spriteLine];
            cc = color & 0x40;
            if (cc) {
                if (spritePri === SPRITE_MAX_PRIORITY || debugModeSpriteInfo) continue;   // Must have a higher priority Main Sprite (CC = 0) to show this one and not showing info
            } else spritePri = spritesGlobalPriority + sprite;
            if ((color & 0xf) === 0 && !color0Solid) continue;              // Nothing to paint. Consider TP
            x = vram[atrPos + 1];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x <= -size) continue;                                   // Not visible (out to the left)
            }
            if (spritesSize === 16) {
                name = debugModeSpriteInfoNumbers ? sprite << 2 : vram[atrPos + 2] & 0xfc;
                lineInPattern = spritePatternTableAddress + (name << 3) + spriteLine;
                pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            } else {
                name = debugModeSpriteInfoNumbers ? sprite : vram[atrPos + 2];
                pattern = vram[spritePatternTableAddress + (name << 3) + spriteLine];
            }
            s = x <= 256 - size ? 0 : x - (256 - size);
            f = x >= 0 ? size : size + x;
            x += (size - f);
            if (cc) paintSpriteMode2TiledCC(x, bufferPos + (x << 1), spritePri, pattern, color & 0xf, s, f, spritesMag);
            else paintSpriteMode2Tiled(x, line, bufferPos + (x << 1), spritePri, pattern, color & 0xf, s, f, spritesMag, spriteDebugModeCollisions && ((color & 0x20) === 0) && (drawn < 9));       // Consider IC
        }
        if (spritesInvalid < 0 && sprite > spritesMaxComputed) spritesMaxComputed = sprite;
    }

    function paintSpriteMode2Tiled(x, y, bufferPos, spritePri, pattern, color, start, finish, magShift, collide) {
        for (var i = finish - 1; i >= start; --i, ++x, bufferPos += 2) {
            var s = (pattern >>> (i >>> magShift)) & 0x01;
            if (s === 0) continue;
            if (spritesLinePriorities[x] < spritePri) {                                     // Higher priority sprite already there
                if (collide && !spritesCollided) setSpritesCollision(x, y);
                continue;
            }
            spritesLinePriorities[x] = spritePri;                                           // Register new priority
            spritesLineColors[x] = color;                                                   // Register new color
            frameBackBuffer[bufferPos] = colorPaletteReal[color >>> 2];
            frameBackBuffer[bufferPos + 1] = colorPaletteReal[color & 0x03];
        }
    }

    function paintSpriteMode2TiledCC(x, bufferPos, spritePri, pattern, color, start, finish, magShift) {
        var finalColor;
        for (var i = finish - 1; i >= start; --i, ++x, bufferPos += 2) {
            var s = (pattern >>> (i >>> magShift)) & 0x01;
            if (s === 0) continue;
            var prevSpritePri = spritesLinePriorities[x];
            if (prevSpritePri < spritePri) continue;                                        // Higher priority sprite already there
            if (prevSpritePri === spritePri)
                finalColor = color | spritesLineColors[x];                                  // Mix if same priority
            else {
                spritesLinePriorities[x] = spritePri;                                       // Otherwise register new priority
                finalColor = color;
            }
            spritesLineColors[x] = finalColor;                                              // Register new color
            frameBackBuffer[bufferPos] = colorPaletteReal[finalColor >>> 2];
            frameBackBuffer[bufferPos + 1] = colorPaletteReal[finalColor & 0x03];
        }
    }

    function renderSpritesLineMode2Stretched(line, bufferPos) {
        if (!spritesEnabled || vram[spriteAttrTableAddress + 512] === 216) return;          // No sprites to show!

        var size = spritesSize << spritesMag;
        var atrPos, colorPos, color, name, lineInPattern, pattern;
        var sprite = -1, spritePri = SPRITE_MAX_PRIORITY, drawn = 0, y, spriteLine, x, s, f, cc;
        spritesGlobalPriority -= 32;

        atrPos = spriteAttrTableAddress + 512 - 4;
        colorPos = spriteAttrTableAddress - 16;
        for (var i = 0; i < 32; ++i) {                                // Max of 32 sprites
            sprite = sprite + 1;
            atrPos = atrPos + 4;
            colorPos = colorPos + 16;
            y = vram[atrPos];
            if (y === 216) break;                                           // Stop Sprite processing for the line, as per spec
            spriteLine = (line - y - 1) & 255;
            if (spriteLine >= size) continue;                               // Not visible at line
            if (++drawn > 8) {                                              // Max of 8 sprites drawn. Store the first invalid (9th)
                if (spritesInvalid < 0 && !verticalIntReached) spritesInvalid = sprite;
                if (spriteDebugModeLimit) return;
            }
            spriteLine >>>= spritesMag;                                     // Adjust for Mag
            color = vram[colorPos + spriteLine];
            cc = color & 0x40;
            if (cc) {
                if (spritePri === SPRITE_MAX_PRIORITY || debugModeSpriteInfo) continue;   // Must have a higher priority Main Sprite (CC = 0) to show this one and not showing info
            } else spritePri = spritesGlobalPriority + sprite;
            if ((color & 0xf) === 0 && !color0Solid) continue;              // Nothing to paint. Consider TP
            x = vram[atrPos + 1];
            if (color & 0x80) {
                x -= 32;                                                    // Early Clock bit, X to be 32 to the left
                if (x <= -size) continue;                                   // Not visible (out to the left)
            }
            if (spritesSize === 16) {
                name = debugModeSpriteInfoNumbers ? sprite << 2: vram[atrPos + 2] & 0xfc;
                lineInPattern = spritePatternTableAddress + (name << 3) + spriteLine;
                pattern = (vram[lineInPattern] << 8) | vram[lineInPattern + 16];
            } else {
                name = debugModeSpriteInfoNumbers ? sprite : vram[atrPos + 2];
                pattern = vram[spritePatternTableAddress + (name << 3) + spriteLine];
            }
            s = x <= 256 - size ? 0 : x - (256 - size);
            f = x >= 0 ? size : size + x;
            x += (size - f);
            if (cc) paintSpriteMode2StretchedCC(x, bufferPos + (x << 1), spritePri, pattern, color & 0xf, s, f, spritesMag);
            else paintSpriteMode2Stretched(x, line, bufferPos + (x << 1), spritePri, pattern, color & 0xf, s, f, spritesMag, spriteDebugModeCollisions && ((color & 0x20) === 0) && (drawn < 9));       // Consider IC
        }
        if (spritesInvalid < 0 && sprite > spritesMaxComputed) spritesMaxComputed = sprite;
    }

    function paintSpriteMode2Stretched(x, y, bufferPos, spritePri, pattern, color, start, finish, magShift, collide) {
        for (var i = finish - 1; i >= start; --i, ++x, bufferPos += 2) {
            var s = (pattern >>> (i >>> magShift)) & 0x01;
            if (s === 0) continue;
            if (spritesLinePriorities[x] < spritePri) {                                     // Higher priority sprite already there
                if (collide && !spritesCollided) setSpritesCollision(x, y);
                continue;
            }
            spritesLinePriorities[x] = spritePri;                                           // Register new priority
            spritesLineColors[x] = color;                                                   // Register new color
            frameBackBuffer[bufferPos] = frameBackBuffer[bufferPos + 1] = colorPaletteReal[color];
        }
    }

    function paintSpriteMode2StretchedCC(x, bufferPos, spritePri, pattern, color, start, finish, magShift) {
        var finalColor;
        for (var i = finish - 1; i >= start; --i, ++x, bufferPos += 2) {
            var s = (pattern >>> (i >>> magShift)) & 0x01;
            if (s === 0) continue;
            var prevSpritePri = spritesLinePriorities[x];
            if (prevSpritePri < spritePri) continue;                                        // Higher priority sprite already there
            if (prevSpritePri === spritePri)
                finalColor = color | spritesLineColors[x];                                  // Mix if same priority
            else {
                spritesLinePriorities[x] = spritePri;                                       // Otherwise register new priority
                finalColor = color;
            }
            spritesLineColors[x] = finalColor;                                              // Register new color
            frameBackBuffer[bufferPos] = frameBackBuffer[bufferPos + 1] = colorPaletteReal[finalColor];
        }
    }

    function setSpritesCollision(x, y) {
        spritesCollided = true;
        if (spritesCollisionX >= 0) return;                             // Only set if clear
        spritesCollisionX = x + 12; spritesCollisionY = y + 8;          // Additions as per spec
        if ((register[8] & 0xc0) === 0) {                               // Only report if Mouse (MS) and LightPen (LP) are disabled
            status[3] = spritesCollisionX & 255;
            status[4] = 0xfe | (spritesCollisionX >>> 8);
            status[5] = spritesCollisionY & 255;
            status[6] = 0xfc | (spritesCollisionY >>> 8);
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

        // console.error("Stretch to top, currentScanline: " + currentScanline);
    }

    function cleanFrameBuffer() {
        wmsx.Util.arrayFill(frameBackBuffer, modeData.tiled ? 0xff000000 : backdropValue);

        // console.error("Clear Buffer");
    }

    function refresh() {
        // Send frame to monitor
        videoSignal.newFrame(frameCanvas, 0, 0, refreshWidth, refreshHeight);
        refreshWidth = refreshHeight = 0;

        if (slave) slave.cycleEventRefresh();

        //logInfo("REFRESH. currentScanline: " + currentScanline);
    }

    function beginFrame() {
        // Adjust for pending VideoStandard/Pulldown changes
        if (framePulldown !== pulldown) {
            frameVideoStandard = videoStandard;
            framePulldown = pulldown;
            updateSignalMetrics(false);
        }

        currentScanline = 0;
        frameStartingActiveScanline = startingActiveScanline;

        if (renderMetricsChangePending) updateRenderMetrics(true);

        // Page blinking per frame
        if (!blinkPerLine && blinkPageDuration > 0) clockPageBlinking();

        // Field alternance
        status[2] ^= 0x02;                    // Invert EO (Display Field flag)

        // Interlace
        if (!isV9918 && (register[9] & 0x08)) {                         // IL
            bufferPosition = (status[2] & 0x02) ? LINE_WIDTH : 0;       // EO
            bufferLineAdvance = LINE_WIDTH * 2;
        } else {
            bufferPosition = 0;
            bufferLineAdvance = LINE_WIDTH;
        }

        // Update mask to reflect correct page (Blink and EO)
        updateLayoutTableAddressMask();
    }

    function finishFrame() {
        //var cpuCycles = cpu.getCycles();
        //wmsx.Util.log("Frame FINISHED. CurrentScanline: " + currentScanline + ", CPU cycles: " + (cpuCycles - debugFrameStartCPUCycle));
        //debugFrameStartCPUCycle = cpuCycles;

        // Update frame image from backbuffer
        refreshWidth = renderWidth;
        refreshHeight = renderHeight;
        frameContext.putImageData(frameImageData, 0, 0, 0, 0, refreshWidth, refreshHeight);
        ++frame;

        // console.error("Finish Frame");

        beginFrame();
    }

    function initRegisters() {
        wmsx.Util.arrayFill(register, 0);
        wmsx.Util.arrayFill(status, 0);
        register[9] = videoStandard === wmsx.VideoStandard.PAL ? 0x02 : 0;      // NT (PAL mode bit)
        status[1] = isV9958 ? 0x04 : 0x00;    // VDP ID (mask 0x3e), 0x00 = V9938, 0x02 = V9958
        status[2] = 0x0c;                     // Fixed "1" bits
        status[4] = 0xfe;                     // Fixed "1" bits
        status[6] = 0xfc;                     // Fixed "1" bits
        status[9] = 0xfe;                     // Fixed "1" bits
    }

    function initFrameResources(useAlpha) {
        if (frameCanvas && (frameContextUsingAlpha || !useAlpha)) return;     // never go back to non alpha

        frameContextUsingAlpha = !!useAlpha;
        frameCanvas = document.createElement('canvas');
        // Maximum VPD resolution including borders
        frameCanvas.width = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
        frameCanvas.height = wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938;
        frameContext = frameCanvas.getContext("2d", { alpha: frameContextUsingAlpha, antialias: false });

        if (!frameImageData) {
            frameImageData = frameContext.createImageData(frameCanvas.width, frameCanvas.height + 1 + 1);                                               // One extra line for right-overflow and one for the backdrop cache
            frameBackBuffer = new Uint32Array(frameImageData.data.buffer, 0, frameCanvas.width * (frameCanvas.height + 1));                             // First extra line (right-overflow)
            backdropLineCache = new Uint32Array(frameImageData.data.buffer, frameCanvas.width * (frameCanvas.height + 1) * 4, frameCanvas.width);       // Second extra line
        }
    }

    function initColorCaches() {
        colorsV9918Values = wmsx.ColorCache.getColors4bit9918Values();   // Init now, used by V9918 mode
        colors8bitValues =  wmsx.ColorCache.getColors8bit9938Values();   // Init now, used by Backdrop
        colors9bitValues =  wmsx.ColorCache.getColors9bit9938Values();   // Init now, used by normal Palette
        colorsYJKValues =   undefined;                                   // Lazy, used only by mode YJK, YAE
    }

    function initColorPalette() {
        for (var c = 0; c < 16; ++c) {
            paletteRegister[c] = paletteRegisterInitialValuesV9938[c];
            var value = isV9918
                ? colorsV9918Values[c]
                : getColorValueForPaletteValue(paletteRegister[c]);
            colorPaletteReal[c] = value;
            if (debugModeSpriteHighlight) value &= DEBUG_DIM_ALPHA_MASK;
            colorPalette[c] = value;
            colorPaletteSolid[c] = value;
        }
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

    function initSpritesConflictMap() {
        wmsx.Util.arrayFill(spritesLinePriorities, SPRITE_MAX_PRIORITY);
        wmsx.Util.arrayFill(spritesLineColors, 0);
        spritesGlobalPriority = SPRITE_MAX_PRIORITY;      // Decreasing value for sprite priority control. Never resets and lasts for years!
    }


    var LINE_WIDTH = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
    var SPRITE_MAX_PRIORITY = 9000000000000000;
    var DEBUG_DIM_ALPHA_MASK = 0x40ffffff;

    var VRAM_SIZE = wmsx.VDP.VRAM_LIMIT + 1;
    var DEBUG_PAT_DIGI6_TABLE_ADDRESS = VRAM_SIZE;                                      // Debug pattern tables placed on top of normal VRAM
    var DEBUG_PAT_DIGI8_TABLE_ADDRESS = DEBUG_PAT_DIGI6_TABLE_ADDRESS + 256 * 8;
    var DEBUG_PAT_DIGI16_TABLE_ADDRESS = DEBUG_PAT_DIGI8_TABLE_ADDRESS + 256 * 8;
    var DEBUG_PAT_BLOCK_TABLE_ADDRESS = DEBUG_PAT_DIGI16_TABLE_ADDRESS + 256 * 8 * 4;
    var VRAM_TOTAL_SIZE = DEBUG_PAT_BLOCK_TABLE_ADDRESS + 8;

    var STARTING_DEBUG_MODE = WMSX.DEBUG_MODE;
    var STARTING_SPRITES_DEBUG_MODE = WMSX.SPRITES_DEBUG_MODE;


    // Frame as off screen canvas
    var frameCanvas, frameContext, frameImageData, frameBackBuffer;
    var backdropLineCache;        // Cached full line backdrop values, will share the same buffer as the frame itself for fast copying
    var frameContextUsingAlpha = false;


    var isV9918, isV9938, isV9958;

    var vram = new Uint8Array(VRAM_TOTAL_SIZE);   // wmsx.Util.arrayFill(new Array(VRAM_TOTAL_SIZE), 0);
    this.vram = vram;
    var vramInterleaving;

    var frame;
    var blinkEvenPage, blinkPageDuration, blinkPerLine;

    var vSynchMode;
    var videoStandard = wmsx.VideoStandard.NTSC, pulldown;

    var bufferPosition;
    var bufferLineAdvance;
    var currentScanline;

    var cycles, lastBUSCyclesComputed;

    var signalActiveHeight;
    var finishingScanline;
    var startingActiveScanline, frameStartingActiveScanline;
    var startingVisibleTopBorderScanline;
    var startingInvisibleScanline;

    var frameVideoStandard = videoStandard, framePulldown;                  // Delays VideoStandard change until next frame

    var verticalIntReached = false;
    var horizontalIntLine = 0;

    var status = new Array(10);
    var register = new Array(47);
    var paletteRegister = new Array(16);

    var modeData;

    var renderMetricsChangePending, renderWidth, renderHeight;
    var refreshWidth, refreshHeight;

    var blankingChangePending;
    var backdropCacheUpdatePending;

    var spritesEnabled, spritesSize, spritesMag;
    var spritesCollided, spritesInvalid, spritesMaxComputed, spritesCollisionX, spritesCollisionY;
    var spritesLinePriorities = new Array(256);
    var spritesLineColors = new Array(256);
    var spritesGlobalPriority;

    var vramPointer = 0;
    var paletteFirstWrite;
    var dataFirstWrite = null, dataPreRead = 0;

    var backdropColor;
    var backdropValue;
    var backdropTileOdd, backdropTileEven;

    var verticalAdjust, horizontalAdjust;

    var leftMask, leftScroll2Pages, leftScrollChars, leftScrollCharsInPage, rightScrollPixels;

    var layoutTableAddress;                         // Dynamic values, set by program
    var colorTableAddress;
    var patternTableAddress;
    var spriteAttrTableAddress;
    var spritePatternTableAddress;

    var layoutTableAddressMask;                     // Dynamic values, depends on mode
    var layoutTableAddressMaskSetValue;             // Will contain the orignal mask, with no Alternative Page included
    var colorTableAddressMask;
    var patternTableAddressMask;

    var layoutTableAddressMaskBase = ~(-1 << 10);   // Fixed base values for all modes
    var colorTableAddressMaskBase = ~(-1 << 6);
    var patternTableAddressMaskBase = ~(-1 << 11);

    var modes = wmsx.Util.arrayFill(new Array(0x24),
                  { name: "NUL", isV9938: true,  layTBase:        0, colorTBase:        0, patTBase:        0, sprAttrTBase:        0, width: 256, layLineBytes:   0, evenPageMask:         ~0, blinkPageMask:         ~0, renderLine:   renderLineBlanked, renderLinePatInfo:       renderLineBlanked, ppb: 0, spriteMode: 0, tiled: false, vramInter:  null, bdPaletted:  true, textCols: 0 });

    modes[0x10] = { name:  "T1", isV9938: false, layTBase: -1 << 10, colorTBase:        0, patTBase: -1 << 11, sprAttrTBase:        0, width: 256, layLineBytes:   0, evenPageMask: ~(1 << 15), blinkPageMask:         ~0, renderLine:    renderLineModeT1, renderLinePatInfo: renderLineModeT1PatInfo, ppb: 0, spriteMode: 0, tiled: false, vramInter: false, bdPaletted:  true, textCols: 40 };
    modes[0x12] = { name:  "T2", isV9938: true,  layTBase: -1 << 12, colorTBase: -1 <<  9, patTBase: -1 << 11, sprAttrTBase:        0, width: 512, layLineBytes:   0, evenPageMask: ~(1 << 15), blinkPageMask:         ~0, renderLine:    renderLineModeT2, renderLinePatInfo: renderLineModeT2PatInfo, ppb: 0, spriteMode: 0, tiled: false, vramInter: false, bdPaletted:  true, textCols: 80 };
    modes[0x08] = { name:  "MC", isV9938: false, layTBase: -1 << 10, colorTBase:        0, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, width: 256, layLineBytes:   0, evenPageMask: ~(1 << 15), blinkPageMask:         ~0, renderLine:    renderLineModeMC, renderLinePatInfo: renderLineModeMCPatInfo, ppb: 0, spriteMode: 1, tiled: false, vramInter: false, bdPaletted:  true, textCols: 0 };
    modes[0x00] = { name:  "G1", isV9938: false, layTBase: -1 << 10, colorTBase: -1 <<  6, patTBase: -1 << 11, sprAttrTBase: -1 <<  7, width: 256, layLineBytes:   0, evenPageMask: ~(1 << 15), blinkPageMask:         ~0, renderLine:    renderLineModeG1, renderLinePatInfo: renderLineModeG1PatInfo, ppb: 0, spriteMode: 1, tiled: false, vramInter: false, bdPaletted:  true, textCols: 32 };
    modes[0x01] = { name:  "G2", isV9938: false, layTBase: -1 << 10, colorTBase: -1 << 13, patTBase: -1 << 13, sprAttrTBase: -1 <<  7, width: 256, layLineBytes:   0, evenPageMask: ~(1 << 15), blinkPageMask:         ~0, renderLine:    renderLineModeG2, renderLinePatInfo: renderLineModeG2PatInfo, ppb: 0, spriteMode: 1, tiled: false, vramInter: false, bdPaletted:  true, textCols: 0 };
    modes[0x02] = { name:  "G3", isV9938: true,  layTBase: -1 << 10, colorTBase: -1 << 13, patTBase: -1 << 13, sprAttrTBase: -1 << 10, width: 256, layLineBytes:   0, evenPageMask: ~(1 << 15), blinkPageMask: ~(1 << 15), renderLine:    renderLineModeG3, renderLinePatInfo: renderLineModeG3PatInfo, ppb: 0, spriteMode: 2, tiled: false, vramInter: false, bdPaletted:  true, textCols: 0 };
    modes[0x03] = { name:  "G4", isV9938: true,  layTBase: -1 << 15, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, width: 256, layLineBytes: 128, evenPageMask: ~(1 << 15), blinkPageMask: ~(1 << 15), renderLine:    renderLineModeG4, renderLinePatInfo:        renderLineModeG4, ppb: 2, spriteMode: 2, tiled: false, vramInter: false, bdPaletted:  true, textCols: 0 };
    modes[0x04] = { name:  "G5", isV9938: true,  layTBase: -1 << 15, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, width: 512, layLineBytes: 128, evenPageMask: ~(1 << 15), blinkPageMask: ~(1 << 15), renderLine:    renderLineModeG5, renderLinePatInfo:        renderLineModeG5, ppb: 4, spriteMode: 2, tiled:  true, vramInter: false, bdPaletted:  true, textCols: 0 };
    modes[0x05] = { name:  "G6", isV9938: true,  layTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, width: 512, layLineBytes: 256, evenPageMask: ~(1 << 16), blinkPageMask: ~(1 << 16), renderLine:    renderLineModeG6, renderLinePatInfo:        renderLineModeG6, ppb: 2, spriteMode: 2, tiled: false, vramInter:  true, bdPaletted:  true, textCols: 0 };
    modes[0x07] = { name:  "G7", isV9938: true,  layTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, width: 256, layLineBytes: 256, evenPageMask: ~(1 << 16), blinkPageMask: ~(1 << 16), renderLine:    renderLineModeG7, renderLinePatInfo:        renderLineModeG7, ppb: 1, spriteMode: 2, tiled: false, vramInter:  true, bdPaletted: false, textCols: 0 };
    modes[0x21] = { name: "YJK", isV9938: true,  layTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, width: 256, layLineBytes: 256, evenPageMask: ~(1 << 16), blinkPageMask: ~(1 << 16), renderLine:   renderLineModeYJK, renderLinePatInfo:       renderLineModeYJK, ppb: 1, spriteMode: 2, tiled: false, vramInter:  true, bdPaletted:  true, textCols: 0 };
    modes[0x23] = { name: "YAE", isV9938: true,  layTBase: -1 << 16, colorTBase:        0, patTBase:        0, sprAttrTBase: -1 << 10, width: 256, layLineBytes: 256, evenPageMask: ~(1 << 16), blinkPageMask: ~(1 << 16), renderLine:   renderLineModeYAE, renderLinePatInfo:       renderLineModeYAE, ppb: 1, spriteMode: 2, tiled: false, vramInter:  true, bdPaletted:  true, textCols: 0 };

    var renderLine, renderLineActive;         // Update functions for current mode

    var colorsV9918Values;
    var colors8bitValues;
    var colors9bitValues;
    var colorsYJKValues;

    var color0Solid = false;
    var colorPalette =      new Uint32Array(16);        // 32 bit ABGR palette values ready to paint with transparency pre-computed in position 0, dimmed when in debug
    var colorPaletteSolid = new Uint32Array(16);        // 32 bit ABGR palette values ready to paint with real solid palette values, dimmed when in debug
    var colorPaletteReal =  new Uint32Array(16);        // 32 bit ABGR palette values ready to paint with real solid palette values, used for Sprites, NEVER dimmed for debug

    var spritePaletteG7 =   new Uint32Array([ 0xff000000, 0xff490000, 0xff00006d, 0xff49006d, 0xff006d00, 0xff496d00, 0xff006d6d, 0xff496d6d, 0xff4992ff, 0xffff0000, 0xff0000ff, 0xffff00ff, 0xff00ff00, 0xffffff00, 0xff00ffff, 0xffffffff ]);

    var paletteRegisterInitialValuesV9938 = [      0x000,      0x000,      0x611,      0x733,      0x117,      0x327,      0x151,      0x627,      0x121,      0x373,      0x661,      0x664,      0x411,      0x265,      0x365,      0x777 ];


   // Sprite and Debug Modes controls

    var debugMode = 0;
    var debugModeSpriteHighlight = false, debugModeSpriteInfo = false, debugModeSpriteInfoNumbers = false, debugModeSpritesHidden = false;
    var debugModePatternInfo = false, debugModePatternInfoBlocks = false, debugModePatternInfoNames = false;

    var spriteDebugMode = 0;
    var spriteDebugModeLimit = true;
    var spriteDebugModeCollisions = true;

    var debugBackdropValue    = 0xff2a2a2a;

    var debugLineStartBUSCycles = 0;


    // Connections

    var videoSignal, videoDisplayed = true;
    var cpuBusClockPulses, cpuR800RefreshPause, audioClockPulse32;
    var commandProcessor;

    var slave;

    var M_TYPES = wmsx.Machine.MACHINE_TYPE;


    // Savestate  -------------------------------------------

    this.saveState = function(extended) {
        var s = {
            v1: isV9918, v3: isV9938, v5: isV9958,
            l: currentScanline, b: bufferPosition, ba: bufferLineAdvance, ad: renderLine === renderLineActive,
            fs: frameStartingActiveScanline,
            f: frame, c: cycles, cc: lastBUSCyclesComputed,
            vp: vramPointer, d: dataFirstWrite, dr: dataPreRead, pw: paletteFirstWrite,
            ha: horizontalAdjust, va: verticalAdjust, hil: horizontalIntLine,
            lm: leftMask, ls2: leftScroll2Pages, lsc: leftScrollChars, rsp: rightScrollPixels,
            bp: blinkEvenPage, bpd: blinkPageDuration, bpl: blinkPerLine,
            sc: spritesCollided, sx: spritesCollisionX, sy: spritesCollisionY, si: spritesInvalid, sm: spritesMaxComputed,
            vi: verticalIntReached,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(register), s: wmsx.Util.storeInt8BitArrayToStringBase64(status),
            p: wmsx.Util.storeInt16BitArrayToStringBase64(paletteRegister),
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
        isV9918 = s.v1; isV9938 = s.v3; isV9958 = s.v5;
        // this.refreshDisplayMetrics();
        register = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r, register);
        status = wmsx.Util.restoreStringBase64ToInt8BitArray(s.s, status);
        paletteRegister = wmsx.Util.restoreStringBase64ToInt16BitArray(s.p, paletteRegister);
        vram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.vram, vram, true);
        currentScanline = s.l; bufferPosition = s.b; bufferLineAdvance = s.ba;
        frame = s.f || 0; cycles = s.c; lastBUSCyclesComputed = s.cc;
        vramPointer = s.vp; dataFirstWrite = s.d; dataPreRead = s.dr || 0; paletteFirstWrite = s.pw;
        horizontalAdjust = s.ha; verticalAdjust = s.va; horizontalIntLine = s.hil;
        leftMask = s.lm; leftScroll2Pages = s.ls2; leftScrollChars = s.lsc; rightScrollPixels = s.rsp;
        leftScrollCharsInPage = leftScrollChars & 31;
        blinkEvenPage = s.bp; blinkPageDuration = s.bpd; blinkPerLine = s.bpl !== undefined ? s.bpl : (register[1] & 0x04) !== 0;
        spritesCollided = s.sc; spritesCollisionX = s.sx; spritesCollisionY = s.sy; spritesInvalid = s.si; spritesMaxComputed = s.sm;
        verticalIntReached = s.vi;
        vramInterleaving = s.vrint;
        commandProcessor.loadState(s.cp);
        commandProcessor.connectVDP(this, vram, register, status);
        frameVideoStandard = videoStandard; framePulldown = pulldown;
        updateSignalMetrics(true);
        if (s.fs !== undefined) frameStartingActiveScanline = s.fs;       // backward compatibility
        updateIRQ();
        updateMode(true);
        updateSpritesConfig();
        debugAdjustPalette();
        updateBackdropColor();
        updateTransparency();

        if (s.ad) setActiveDisplay(); else setBorderDisplay();

        // Extended
        if (s.dm !== undefined) setDebugMode(s.dm);
        if (s.sd !== undefined) setSpriteDebugMode(s.sd);
    };


    init();


    // this.TEST = 0;

    function logInfo(text) {
        var busLineCycles = cpu.getBUSCycles() - debugLineStartBUSCycles;
        var vdpLineCycles = busLineCycles * 6;
        console.log("VDP " + text
            // + ". Frame: " + frame
            + ", currentScanLine: " + currentScanline
            + ", activeRenderScanline: " + (currentScanline - frameStartingActiveScanline)
            + ", activeHeigh: " + signalActiveHeight
            // + ", x: " + ((vdpLineCycles - 258) / 4) + ", vdpCycle:" + vdpLineCycles + ", cpuCycle: " + busLineCycles
        );
    }
    this.logInfo = logInfo;

    this.eval = function(str) {
        return eval(str);
    };

};

wmsx.VDP.VRAM_LIMIT = 0x1ffff;      // 128K

wmsx.VDP.SIGNAL_WIDTH_V9918 =  256 + 8 * 2;
wmsx.VDP.SIGNAL_HEIGHT_V9918 = 192 + 8 * 2;

wmsx.VDP.SIGNAL_START_WIDTH_V9938 =  256 + 8 * 2;
wmsx.VDP.SIGNAL_START_HEIGHT_V9938 = 212 + 8 * 2;

wmsx.VDP.SIGNAL_MAX_WIDTH_V9938 =  (256 + 8 * 2) * 2;
wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938 = (212 + 8 * 2) * 2;

wmsx.VDP.BASE_CLOCK = wmsx.Z80.BASE_CLOCK * 6;      // 21504960 Hz
