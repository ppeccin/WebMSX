// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Investigate slow putImage()

// This implementation is line-accurate
// Original base clock: 10738635 Hz which is 3x CPU clock
wmsx.VDP = function(cpu, psg) {
    var self = this;

    function init() {
        videoSignal = new wmsx.VDPVideoSignal();
        initColorCodePatternValues();
        initFrameResources();
        cpuClockPulses = cpu.clockPulses;
        psgClockPulses = psg.getAudioOutput().audioClockPulses;
        self.setDefaults();
    }

    this.connectBus = function(bus) {
    };

    this.powerOn = function(paused) {
        reset();
    };

    this.powerOff = function() {
        videoSignal.signalOff();
    };

    this.setVideoStandard = function(pVideoStandard) {
        videoStandard = pVideoStandard;
    };

    this.getVideoOutput = function() {
        return videoSignal;
    };

    // 342 pixel clocks, 228 CPU clocks per scanline
    // 59736 CPU clocks per frame for NTSC, 71364 for PAL
    this.frame = function() {
        //console.log(cpu.eval("cycles"));
        //cpu.eval("cycles = 0");

        // CPU and PSG cycles during inactive display scan (X lines, depends on video standard)
        if (videoStandard === wmsx.VideoStandard.NTSC) {
            for (i = 498; i > 0; i--) {                        // 15960 CPU clocks, 498 PSG clocks interleaved
                cpuClockPulses(32);
                psgClockPulses(1);
            }
            cpuClockPulses(24);
        } else {                                               // 27588 CPU clocks, 862 PSG clocks interleaved
            for (i = 862; i > 0; i--) {
                cpuClockPulses(32);
                psgClockPulses(1);
            }
            cpuClockPulses(4);
        }

        // Visible display scan. Will interleave 43776 CPU and 1368 PSG clocks
        updatePlanes();

        // Request interrupt
        status |= 0x80;
        updateIRQ();

        finishFrame();
    };

    this.input99 = function() {
        // Status Register Read
        var prevStatus = status;

        dataToWrite = null;
        status = 0;
        updateIRQ();

        return prevStatus;
    };

    function updateBackdropColor() {
        backdropColor = register7 & 0x0f;
        if (backdropColor === 0) backdropColor = 1;        // Backdrop transparency not implemented yet. Force to Black
        backdropRGB = colorRGBs[backdropColor];
        backdropValues = colorCodePatternValues[backdropColor * 256];
    }

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
                    signalBlanked = (register1 & 0x40) === 0;
                } else if (reg === 2) {
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
                   spriteAttrTableAddress = (dataToWrite & 0x7f) * 0x80;
                   vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
               } else if (reg === 6) {
                   spritePatternTableAddress = (dataToWrite & 0x07) * 0x800;
                   vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
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
            //console.log("VRAM Read Wrapped");
            vramPointer = 0;
        }
        return res;
    };

    this.output98 = function(val) {
        dataToWrite = null;
        vram[vramPointer++] = val;               // VRAM Write
        if (vramPointer > 16383) {
            //console.log("VRAM Write Wrapped");
            vramPointer = 0;
        }
    };

    this.togglePalettes = function() {
        currentPalette++;
        if (currentPalette >= palettes.length) currentPalette = 0;
        videoSignal.showOSD("Color Mode: " + palettes[currentPalette].name, true);
        setColorCodePatternValues();
    };

    this.setDefaults = function() {
        currentPalette = WMSX.SCREEN_COLOR_MODE;
        setColorCodePatternValues();
    };

    function reset() {
        status = 0; dataToWrite = null;
        register0 = register1 = register3 = register4 = register7 = 0;
        vramWriteMode = false;
        signalBlanked = true;
        updateMode();
        updateBackdropColor();
    }

    function updateIRQ() {
        if ((status & 0x80) && (register1 & 0x20))
            cpu.INT = 0;                // Active
        else
            cpu.INT = 1;
    }

    function updateMode() {
        var oldMode = mode;
        mode = ((register1 & 0x18) >>> 2) | ((register0 & 0x02) >>> 1);
        if (mode !== oldMode && (mode === 1 || oldMode === 1)) {
            patternTableAddress = (register4 & 0x07) * 0x800;
            colorTableAddress = register3 * 0x40;
            if (mode === 1) updateMode1Specifics();
            vramColorTable = vram.subarray(colorTableAddress);
            vramPatternTable = vram.subarray(patternTableAddress);
        }
    }

    function updateMode1Specifics() {                     // Special rules for register 3 and 4 when in mode 1
        colorTableAddress &= 0x2000;
        patternTableAddress &= 0x2000;
        patternNameMask = (register4 << 8) | 0xff;        // Mask for the upper 2 bits of the 10 bits patternName
        colorNameMask = (register3 << 3) | 0x07;          // Mask for the upper 7 bits of the 10 bits color name
    }

    function updatePlanes() {
        // Update pattern planes
        if (mode === 1) updatePatternPlaneMode1();
        else if (mode === 0) updatePatternPlaneMode0();
        else if (mode === 4) updatePatternPlaneMode4();
        else if (mode === 2) updatePatternPlaneMode2();
    }

    function updatePatternPlaneMode0() {                                    // Graphics 1 (Screen 1)
        var bufferPos = 0;
        var patPos, name, patternLine, pattern, colorCode, colorCodeValuesStart, values;

        for (var line = 0; line < 192; line++) {
            // 228 CPU and 7,125 PSG clocks per line
            for (var i = 7; i > 0; i--) {
                cpuClockPulses(32);
                psgClockPulses(1);
            }
            cpuClockPulses(4);

            // Pattern line
            if (signalBlanked) values = backdropValues;
            else patPos = (line >>> 3) << 5;                                // line / 8 * 32
            for (var col = 0; col < 32; col++) {
                if (!signalBlanked) {
                    name = vramNameTable[patPos++];
                    patternLine = (name << 3) + (line & 0x07);              // name * 8 (8 bytes each pattern) + line inside pattern
                    pattern = vramPatternTable[patternLine];
                    colorCode = vramColorTable[name >>> 3];                 // name / 8 (1 color for each 8 patterns)
                    if ((colorCode & 0x0f) === 0) colorCode |= backdropColor;
                    colorCodeValuesStart = colorCode << 8;                  // colorCode * 256 (256 patterns for each colorCode)
                    values = colorCodePatternValues[colorCodeValuesStart + pattern];
                }
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;                                             // Advance 8 pixels
            }

            // Sprites
            if (!signalBlanked) updateSpritePlanes(line);

            // 1 additional PSG clock each 8th line
            if ((line & 0x07) === 0) psgClockPulses(1);
        }
    }

    function updatePatternPlaneMode1() {                                    // Graphics 2 (Screen 2)
        var bufferPos = 0;
        var patPos, lineInPattern, name, blockExtra, patternMask, patLine, pattern, colorMask, colorLine, colorCode, colorCodeValuesStart, values;

        for (var line = 0; line < 192; line++) {
            // 228 CPU and 7,125 PSG clocks per line
            for (var i = 7; i > 0; i--) {
                cpuClockPulses(32);
                psgClockPulses(1);
            }
            cpuClockPulses(4);

            // Pattern line
            lineInPattern = (line & 0x07);
            if (signalBlanked)
                values = backdropValues;
            else {
                blockExtra = (line & 0xc0) << 2;                            // + 0x100 for each third block of the screen (8 pattern lines)
                patPos = (line >>> 3) << 5;                                 // line / 8 * 32
            }
            for (var col = 0; col < 32; col++) {
                if (!signalBlanked) {
                    name = vramNameTable[patPos++] | blockExtra;
                    patLine = ((name & patternNameMask) << 3) + lineInPattern;  // (8 bytes each pattern) + line inside pattern
                    pattern = vramPatternTable[patLine];
                    colorLine = ((name & colorNameMask) << 3) + lineInPattern;  // (8 bytes each pattern) + line inside pattern
                    colorCode = vramColorTable[colorLine];
                    if ((colorCode & 0x0f) === 0) colorCode |= backdropColor;
                    colorCodeValuesStart = colorCode << 8;                  // colorCode * 256 (256 patterns for each colorCode)
                    values = colorCodePatternValues[colorCodeValuesStart + pattern];
                }
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;                                             // Advance 8 pixels
            }

            // Sprites
            if (!signalBlanked) updateSpritePlanes(line);

            // 1 additional PSG clock each 8th line
            if (lineInPattern === 0) psgClockPulses(1);
        }
    }

    function updatePatternPlaneMode2() {                                    // Multicolor (Screen 3)
        var bufferPos = 0;
        var patPos, extraPatPos, name, nameExt, patternLine, pattern, colorCode, colorCodeValuesStart, values;

        for (var line = 0; line < 192; line++) {
            // 228 CPU and 7,125 PSG clocks per line
            for (var i = 7; i > 0; i--) {
                cpuClockPulses(32);
                psgClockPulses(1);
            }
            cpuClockPulses(4);

            // Pattern line
            if (signalBlanked)
                values = backdropValues;
            else {
                patPos = (line >>> 3) << 5;                            // line / 8 * 32
                extraPatPos = ((line >>> 3) & 0x03) << 1;              // (pattern line % 4) * 2
            }
            for (var col = 0; col < 32; col++) {
                if (!signalBlanked) {
                    name = vramNameTable[patPos++];
                    patternLine = (name << 3) + ((line >> 2) & 0x01) + extraPatPos;   // name * 8 + position (2 bytes each)
                    colorCode = vramPatternTable[patternLine];
                    if ((colorCode & 0x0f) === 0) colorCode |= backdropColor;
                    colorCodeValuesStart = colorCode << 8;                            // colorCode * 256 (256 patterns for each colorCode)
                    values = colorCodePatternValues[colorCodeValuesStart + 0xf0];     // Always solid blocks of front and back colors
                }
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 8;
            }

            // Sprites
            if (!signalBlanked) updateSpritePlanes(line);

            // 1 additional PSG clock each 8th line
            if ((line & 0x07) === 0) psgClockPulses(1);
        }
    }

    function updatePatternPlaneMode4() {                                    // Text (Screen 0)
        var bufferPos = 0;
        var patPos, name, patternLine, pattern, values, colorCode, colorCodeValuesStart, borderValues;

        for (var line = 0; line < 192; line++) {
            // 228 CPU and 7,125 PSG clocks per line
            for (var i = 7; i > 0; i--) {
                cpuClockPulses(32);
                psgClockPulses(1);
            }
            cpuClockPulses(4);

            // Pattern line
            if (signalBlanked) {
                values = backdropValues;
                borderValues = values;
            } else {
                colorCode = register7;                                          // Fixed text color for all screen
                if ((colorCode & 0x0f) === 0) colorCode |= backdropColor;
                colorCodeValuesStart = colorCode << 8;                          // (colorCode * 256) 256 patterns for each colorCode
                borderValues = colorCodePatternValues[colorCodeValuesStart];
                patPos = (line >>> 3) * 40;                                     // line / 8 * 40
            }
            frameBackBuffer.set(borderValues, bufferPos);                   // 8 pixels left margin
            bufferPos += 8;
            for (var col = 0; col < 40; col++) {
                if (!signalBlanked) {
                    name = vramNameTable[patPos++];
                    patternLine = (name << 3) + (line & 0x07);              // name * 8 (8 bytes each pattern) + line inside pattern
                    pattern = vramPatternTable[patternLine];
                    values = colorCodePatternValues[colorCodeValuesStart + pattern];
                }
                frameBackBuffer.set(values, bufferPos);
                bufferPos += 6;                                             // Advance 6 pixels
            }
            frameBackBuffer.set(borderValues, bufferPos);                   // 8 pixels right margin
            bufferPos += 8;

            // Sprite system deactivated

            // 1 additional PSG clock each 8th line
            if ((line & 0x07) === 0) psgClockPulses(1);
        }
    }

    function updateSpritePlanes(line) {
        if (vramSpriteAttrTable[0] === 208) return;                         // Sprites deactivated

        var colorValuesStart, patternStart, name, color, pattern, values;
        var sprite, drawn = 0, invalid = -1;
        var atrPos, y, x;
        var s, f;
        var size = register1 & 0x03;
        var bufferPos = line << 8;                                          // line * 256

        spriteCollision = false;

        if (size === 2) {                                                   // 16x16 normal
            for (atrPos = 0; atrPos < 128; atrPos += 4) {                   // Max of 32 sprites
                sprite = atrPos >> 2;
                y = vramSpriteAttrTable[atrPos];
                if (y === 208) break;                                       // Stop Sprite processing for the line, as per spec
                if (y >= 225) y = -256 + y;                                 // Signed value from -31 to -1
                y++;                                                        // -1 (255) is line 0 per spec, so add 1
                if ((y < (line - 15)) || (y > line)) continue;              // Not visible at line
                if (++drawn > 4) {                                          // Max of 4 sprites drawn. Store the first invalid (5th)
                    invalid = sprite;
                    break;
                }
                x = vramSpriteAttrTable[atrPos + 1];
                color = vramSpriteAttrTable[atrPos + 3];
                if (color & 0x80) x -= 32;                                  // Early Clock bit, X to be 32 to the left
                if (x < -15) continue;                                      // Not visible (out to the left)
                name = vramSpriteAttrTable[atrPos + 2];
                colorValuesStart = (color & 0x0f) << 8;                     // Color * 256 patterns per color
                patternStart = ((name & 0xfc) << 3) + (line - y);
                // Left half
                s = x >= 0 ? 0 : -x; f = x <= 248 ? 8 : 256 - x;
                if (s < f) {
                    pattern = vramSpritePatternTable[patternStart];
                    values = spriteColorCodePatternValues[colorValuesStart + pattern];
                    copySprite(frameBackBuffer, bufferPos + x, values, s, f);
                }
                // Right half
                s = x >= -8 ? 0 : -8 - x; f = x <= 240 ? 8 : 248 - x;
                if (s < f) {
                    pattern = vramSpritePatternTable[patternStart + 16];
                    values = spriteColorCodePatternValues[colorValuesStart + pattern];
                    copySprite(frameBackBuffer, bufferPos + x + 8, values, s, f);
                }
            }
        } else if (size === 0) {                                            // 8x8 normal
            for (atrPos = 0; atrPos < 128; atrPos += 4) {                   // Max of 32 sprites
                sprite = atrPos >> 2;
                y = vramSpriteAttrTable[atrPos];
                if (y === 208) break;                                       // Stop Sprite processing for the line, as per spec
                if (y >= 225) y = -256 + y;                                 // Signed value from -31 to -1
                y++;                                                        // -1 (255) is line 0 per spec, so add 1
                if ((y < (line - 7)) || (y > line)) continue;               // Not visible at line
                if (++drawn > 4) {                                          // Max of 4 sprites drawn. Store the first invalid (5th)
                    invalid = sprite;
                    break;
                }
                x = vramSpriteAttrTable[atrPos + 1];
                color = vramSpriteAttrTable[atrPos + 3];
                if (color & 0x80) x -= 32;                                  // Early Clock bit, X to be 32 to the left
                if (x < -7) continue;                                       // Not visible (out to the left)
                name = vramSpriteAttrTable[atrPos + 2];
                colorValuesStart = (color & 0x0f) << 8;                     // Color * 256 patterns per color
                patternStart = (name << 3) + (line - y);
                s = x >= 0 ? 0 : -x; f = x <= 248 ? 8 : 256 - x;
                if (s < f) {
                    pattern = vramSpritePatternTable[patternStart];
                    values = spriteColorCodePatternValues[colorValuesStart + pattern];
                    copySprite(frameBackBuffer, bufferPos + x, values, s, f);
                }
            }
        } else if (size === 3) {                                            // 16x16 double
            for (atrPos = 0; atrPos < 128; atrPos += 4) {                   // Max of 32 sprites
                sprite = atrPos >> 2;
                y = vramSpriteAttrTable[atrPos];
                if (y === 208) break;                                       // Stop Sprite processing for the line, as per spec
                if (y >= 225) y = -256 + y;                                 // Signed value from -31 to -1
                y++;                                                        // -1 (255) is line 0 per spec, so add 1
                if ((y < (line - 31)) || (y > line)) continue;              // Not visible at line
                if (++drawn > 4) {                                          // Max of 4 sprites drawn. Store the first invalid (5th)
                    invalid = sprite;
                    break;
                }
                x = vramSpriteAttrTable[atrPos + 1];
                color = vramSpriteAttrTable[atrPos + 3];
                if (color & 0x80) x -= 32;                                  // Early Clock bit, X to be 32 to the left
                if (x < -31) continue;                                      // Not visible (out to the left)
                name = vramSpriteAttrTable[atrPos + 2];
                colorValuesStart = (color & 0x0f) << 8;                     // Color * 256 patterns per color
                patternStart = ((name & 0xfc) << 3) + ((line - y) >>> 1);   // Double line height
                // Left half
                s = x >= 0 ? 0 : -x; f = x <= 240 ? 16 : 256 - x;
                if (s < f) {
                    pattern = vramSpritePatternTable[patternStart];
                    values = spriteColorCodePatternValues[colorValuesStart + pattern];
                    copySprite2x(frameBackBuffer, bufferPos + x, values, s, f);
                }
                // Right half
                s = x >= -16 ? 0 : -16 - x; f = x <= 224 ? 16 : 240 - x;
                if (s < f) {
                    pattern = vramSpritePatternTable[patternStart + 16];
                    values = spriteColorCodePatternValues[colorValuesStart + pattern];
                    copySprite2x(frameBackBuffer, bufferPos + x + 16, values, s, f);
                }
            }
        } else {                                                            // 8x8 double
            for (atrPos = 0; atrPos < 128; atrPos += 4) {                   // Max of 32 sprites
                sprite = atrPos >> 2;
                y = vramSpriteAttrTable[atrPos];
                if (y === 208) break;                                       // Stop Sprite processing for the line, as per spec
                if (y >= 225) y = -256 + y;                                 // Signed value from -31 to -1
                y++;                                                        // -1 (255) is line 0 per spec, so add 1
                if ((y < (line - 15)) || (y > line)) continue;              // Not visible at line
                if (++drawn > 4) {                                          // Max of 4 sprites drawn. Store the first invalid (5th)
                    invalid = sprite;
                    break;
                }
                x = vramSpriteAttrTable[atrPos + 1];
                color = vramSpriteAttrTable[atrPos + 3];
                if (color & 0x80) x -= 32;                                  // Early Clock bit, X to be 32 to the left
                if (x < -15) continue;                                      // Not visible (out to the left)
                name = vramSpriteAttrTable[atrPos + 2];
                colorValuesStart = (color & 0x0f) << 8;                     // Color * 256 patterns per color
                patternStart = (name << 3) + ((line - y) >>> 1);            // Double line height
                s = x >= 0 ? 0 : -x; f = x <= 240 ? 16 : 256 - x;
                if (s < f) {
                    pattern = vramSpritePatternTable[patternStart];
                    values = spriteColorCodePatternValues[colorValuesStart + pattern];
                    copySprite2x(frameBackBuffer, bufferPos + x, values, s, f);
                }
            }
        }

        if (spriteCollision) {
            //console.log("Collision");
            status |= 0x20;
        }
        if ((status & 0x40) === 0) {                          // Only set if 5S are still unset
            if (invalid >= 0) {
                //console.log("Invalid sprite: " + invalid);
                status = status | 0x40 | invalid;
            } else
                status = status | sprite;
        }
    }

    function copySprite(dest, pos, source, start, finish) {
        for (var i = start; i < finish; i++) {
            var s = source[i];
            if (s === 0) continue;
            var d = dest[pos + i];
            // Transparent sprites (color 0x01000000) just "mark" its presence setting dest Alpha to Full, so collisions can be detected
            if (d < 0xff000000) dest[pos + i] = s === 0x01000000 ? (d | 0xff000000) : s;
            else spriteCollision = true;
        }
    }

    function copySprite2x(dest, pos, source, start, finish) {
        for (var i = start; i < finish; i++) {
            var s = source[(i >>> 1)];
            if (s === 0) continue;
            var d = dest[pos + i];
            // Transparent sprites (color 0x01000000) just "mark" its presence setting dest Alpha to Full, so collisions can be detected
            if (d < 0xff000000) dest[pos + i] = s === 0x01000000 ? (d | 0xff000000) : s;
            else spriteCollision = true;
        }
    }

    function finishFrame() {
        // Finish audio signal (generate additional samples each frame to adjust to sample rate)
        psg.getAudioOutput().finishFrame();
        // Update image and send to monitor
        frameContext.putImageData(frameImageData, 0, 0);
        videoSignal.newFrame(frameCanvas, backdropRGB);
    }

    function initFrameResources() {
        frameCanvas = document.createElement('canvas');
        frameCanvas.width = 256;    // Native VPD resolution
        frameCanvas.height = 192;
        frameContext = frameCanvas.getContext("2d");
        frameImageData = frameContext.getImageData(0, 0, 256, 192);
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
                }
            }
        }
    }

    function setColorCodePatternValues() {
        colorRGBs = palettes[currentPalette].colors;
        var sizePerColorCode = 256 * 8;
        for (var front = 0; front < 16; front++) {
            var colorFront = colorRGBs[front];
            for (var pattern = 0; pattern < 256; pattern++) {
                for (var back = 0; back < 16; back++) {
                    var colorBack = colorRGBs[back];
                    var colorCode = (front << 4) + back;
                    var patternValues = colorCodePatternValues[colorCode * 256 + pattern];
                    var spritePatternValues = back === 0 ? spriteColorCodePatternValues[front * 256 + pattern] : null;
                    for (var bit = 7; bit >= 0; bit--) {
                        var pixel = (pattern >>> bit) & 1;
                        patternValues[7 - bit] = pixel ? colorFront : colorBack;
                        // Full Alpha front color or Full Transparent for Sprites
                        if (spritePatternValues && pixel) spritePatternValues[7 - bit] = colorFront + 0x01000000;
                    }
                }
            }
        }
        updateBackdropColor();
    }


    // Registers, pointers, temporary data

    var status = 0;
    var mode = 0;
    var videoStandard = wmsx.VideoStandard.NTSC;

    var register0 = 0;
    var register1 = 0;
    var register3 = 0;
    var register4 = 0;
    var register7 = 0;

    var backdropColor = 0;
    var backdropRGB = 0;
    var backdropValues = [];
    var signalBlanked = true;
    var spriteCollision = false;

    var nameTableAddress = 0;
    var colorTableAddress = 0;
    var patternTableAddress = 0;
    var spriteAttrTableAddress = 0;
    var spritePatternTableAddress = 0;

    var patternNameMask, colorNameMask;     // Special masks from register3 and register4 for mode 1 only

    var dataToWrite = null;
    var vramPointer = 0;
    var vramWriteMode = false;


    // VRAM

    var vram = new Uint8Array(16384);
    var vramNameTable = vram;
    var vramColorTable = vram;
    var vramPatternTable = vram;
    var vramSpriteAttrTable = vram;
    var vramSpritePatternTable = vram;
    this.vram = vram;


    // Planes as off-screen canvases
    var frameCanvas, frameContext, frameImageData, frameBackBuffer;


    // Pre calculated 8-pixel RGBA values for all color and 8-bit pattern combinations (actually ABRG endian)
    // Pattern plane paints with these colors (Alpha = 0xfe), Sprite planes paint with Full Alpha = 0xff

    var colorsMSX1 =   new Uint32Array([ 0x00000000, 0xfe000000, 0xfe40c820, 0xfe78d858, 0xfee85050, 0xfef47078, 0xfe4850d0, 0xfef0e840, 0xfe5050f4, 0xfe7878f4, 0xfe50c0d0, 0xfe80c8e0, 0xfe38b020, 0xfeb858c8, 0xfec8c8c8, 0xfeffffff ]);
    var colorsMSX2 =   new Uint32Array([ 0x00000000, 0xfe000000, 0xfe20d820, 0xfe68f468, 0xfef42020, 0xfef46848, 0xfe2020b0, 0xfef4d848, 0xfe2020f4, 0xfe6868f4, 0xfe20d8d8, 0xfe90d8d8, 0xfe209020, 0xfeb048d8, 0xfeb0b0b0, 0xfefbfbfb ]);
    var colorsMSXPB =  new Uint32Array([ 0x00000000, 0xfe000000, 0xfe808080, 0xfea0a0a0, 0xfe5c5c5c, 0xfe7c7c7c, 0xfe707070, 0xfeb0b0b0, 0xfe7c7c7c, 0xfe989898, 0xfeb0b0b0, 0xfec0c0c0, 0xfe707070, 0xfe808080, 0xfec4c4c4, 0xfefbfbfb ]);
    var colorsMSXGR =  new Uint32Array([ 0x00000000, 0xfe000000, 0xfe108010, 0xfe10a010, 0xfe105c10, 0xfe107c10, 0xfe107010, 0xfe10b010, 0xfe107c10, 0xfe109810, 0xfe10b010, 0xfe10c010, 0xfe107010, 0xfe107c10, 0xfe10c010, 0xfe10f810 ]);
    var colorsMSXAB =  new Uint32Array([ 0x00000000, 0xfe000000, 0xfe005880, 0xfe006ca0, 0xfe00405c, 0xfe00547c, 0xfe004c70, 0xfe0078b0, 0xfe00547c, 0xfe006898, 0xfe0078b0, 0xfe0084c0, 0xfe004c70, 0xfe005880, 0xfe0084c4, 0xfe00abfa ]);
    var colorsMSX1VV = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe28ca07, 0xfe65e23d, 0xfef04444, 0xfef46d70, 0xfe1330d0, 0xfef0e840, 0xfe4242f3, 0xfe7878f4, 0xfe30cad0, 0xfe89dcdc, 0xfe20a906, 0xfec540da, 0xfebcbcbc, 0xfeffffff ]);
    //var colorsMyMSX1 = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe42c821, 0xfe78dc5e, 0xfeed5554, 0xfefc767d, 0xfe4d52d4, 0xfef5eb42, 0xfe5455fc, 0xfe7879ff, 0xfe54c1d4, 0xfe80cee6, 0xfe3bb021, 0xfeba5bc9, 0xfecccccc, 0xfeffffff ]);
    //var colorsMyMSX2 = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe20db20, 0xfe6dff6d, 0xfeff2020, 0xfeff6d30, 0xfe2020b6, 0xfeffdb49, 0xfe2020ff, 0xfe6d6dff, 0xfe20dbdb, 0xfe92dbdb, 0xfe209220, 0xfeb649db, 0xfeb6b6b6, 0xfeffffff ]);

    var palettes = [
        { name : "MSX1", colors: colorsMSX1VV },
        { name: "MSX1 Soft", colors: colorsMSX1 },
        { name: "MSX2", colors: colorsMSX2 },
        { name: "Black & White", colors: colorsMSXPB}, { name: "Green Phosphor", colors: colorsMSXGR}, { name: "Amber", colors: colorsMSXAB }
    ];

    var currentPalette = 0;
    var colorRGBs;

    var colorValuesRaw = new Uint32Array(16 * 16 * 256 * 8);        // 16 front colors * 16 back colors * 256 patterns * 8 pixels
    var colorCodePatternValues = new Array(256 * 256);              // 256 colorCodes * 256 patterns

    var spriteColorValuesRaw = new Uint32Array(16 * 256 * 8);       // 16 colors * 256 patterns * 8 pixels
    var spriteColorCodePatternValues = new Array(16 * 256);         // 16 colorCodes * 256 patterns


    // Connections

    var videoSignal;

    var cpuClockPulses;
    var psgClockPulses;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: status, m: mode, r0: register0, r1: register1, r3: register3, r4: register4, r7: register7,
            nt: nameTableAddress, ct: colorTableAddress, pt: patternTableAddress, sat: spriteAttrTableAddress, spt: spritePatternTableAddress,
            d: dataToWrite, vp: vramPointer, vw: vramWriteMode,
            vram: wmsx.Util.compressArrayToStringBase64(vram),
            vs: videoStandard.name
        };
    };

    this.loadState = function(s) {
        status = s.s; mode = s.m; register0 = s.r0; register1 = s.r1; register3 = s.r3; register4 = s.r4; register7 = s.r7;
        nameTableAddress = s.nt; colorTableAddress = s.ct; patternTableAddress = s.pt; spriteAttrTableAddress = s.sat; spritePatternTableAddress = s.spt;
        dataToWrite = s.d; vramPointer = s.vp; vramWriteMode = s.vw;
        vram = wmsx.Util.uncompressStringBase64ToArray(s.vram);         // Already UInt8Array
        vramNameTable = vram.subarray(nameTableAddress);
        vramColorTable = vram.subarray(colorTableAddress);
        vramPatternTable = vram.subarray(patternTableAddress);
        vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
        vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
        signalBlanked = (register1 & 0x40) === 0;
        if (mode === 1) updateMode1Specifics();
        updateBackdropColor();
        this.setVideoStandard(wmsx.VideoStandard[s.vs]);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};
