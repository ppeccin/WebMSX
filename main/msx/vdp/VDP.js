// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Investigate slow putImage()

// This implementation is frame-accurate
wmsx.VDP = function(cpu, psg) {
    var self = this;

    function init() {
        videoSignal = new wmsx.VDPVideoSignal();
        initColorCodePatternValues();
        initFrameResources();
    }

    this.connectEngine = function(pEngine) {
        engine = pEngine;
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

    this.frame = function() {

        // Interleave CPU and PSG cycles
        if (videoStandard === wmsx.VideoStandard.NTSC) {
            for (var i = 1866; i > 0; i--) {                    // 59736 CPU clocks, 1866 PSG clocks
                cpu.clockPulses(32);
                psg.getAudioOutput().audioClockPulses(1);
            }
            cpu.clockPulses(24);
        } else {                                                // 71364 CPU clocks, 2230 PSG clocks
            for (i = 2230; i > 0; i--) {
                cpu.clockPulses(32);
                psg.getAudioOutput().audioClockPulses(1);
            }
            cpu.clockPulses(4);
        }

        // Finish audio signal (generate additional samples each frame to adjust to sample rate)
        psg.getAudioOutput().finishFrame();

        // Update video signal
        updateFrame();

        // Request interrupt
        status |= 0x80;
        updateIRQ();

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
                    signalBlanked = (register1 & 0x40) === 0;
                } else if (reg === 2) {
                    nameTableAddress = (dataToWrite & 0x0f) * 0x400;
                    vramNameTable = vram.subarray(nameTableAddress);
               } else if (reg === 3) {
                    register3 = dataToWrite;
                    colorTableAddress = dataToWrite * 0x40;
                    if (mode === 1) colorTableAddress &= 0x2000;
                    vramColorTable = vram.subarray(colorTableAddress);
               } else if (reg === 4) {
                    register4 = dataToWrite;
                    patternTableAddress = (dataToWrite & 0x07) * 0x800;
                    if (mode === 1) patternTableAddress &= 0x2000;
                    vramPatternTable = vram.subarray(patternTableAddress);
               } else if (reg === 5) {
                   spriteAttrTableAddress = (dataToWrite & 0x7f) * 0x80;
                   vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
               } else if (reg === 6) {
                   spritePatternTableAddress = (dataToWrite & 0x07) * 0x800;
                   vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
               } else if (reg === 7) {
                   register7 = dataToWrite;
                   backdropRGB = colorRGBs[register7 & 0x0f];
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

    function reset() {
        status = 0; dataToWrite = null;
        register0 = register1 = register3 = register4 = register7 = 0;
        backdropRGB = colorRGBs[0];
        vramWriteMode = false;
        signalBlanked = true;
    }

    function updateIRQ() {
        if ((status & 0x80) && (register1 & 0x20))
            cpu.INT = 0;                // Active
        else
            cpu.INT = 1;
    }

    function updateFrame() {
        if (signalBlanked) {
            // Blank if needed
            if (!frameBlanked) {
                if (frameBackBuffer.fill) frameBackBuffer.fill(0);
                else wmsx.Util.arrayFill(frameBackBuffer, 0);
                frameBlanked = true;
            }
        } else {
            // Update planes
            if (mode === 1) updatePatternPlaneMode1();
            else if (mode === 0) updatePatternPlaneMode0();
            else if (mode === 4) updatePatternPlaneMode4();
            else if (mode === 2) updatePatternPlaneMode2();
            frameBlanked = false;
        }

        // Update plane image and send to monitor
        frameContext.putImageData(frameImageData, 0, 0);
        videoSignal.newFrame(frameCanvas, backdropRGB);
    }

    function updateMode() {
        var oldMode = mode;
        mode = ((register1 & 0x18) >>> 2) | ((register0 & 0x02) >>> 1);
        if (mode !== oldMode && (mode === 1 || oldMode === 1)) {
            // Special rule for register 3 and 4 when in mode 1
            colorTableAddress = register3 * 0x40;
            if (mode === 1) colorTableAddress &= 0x2000;
            vramColorTable = vram.subarray(colorTableAddress);
            patternTableAddress = (register4 & 0x07) * 0x800;
            if (mode === 1) patternTableAddress &= 0x2000;
            vramPatternTable = vram.subarray(patternTableAddress);
        }
    }

    function updatePatternPlaneMode0() {                                    // Graphics 1 (Screen 1)
        var bufferPos = 0;
        var pos = 0;
        for (var line = 0; line < 24; line++) {
            for (var col = 0; col < 32; col++) {
                var name = vramNameTable[pos];
                var colorCode = vramColorTable[name >>> 3];                 // (name / 8) 1 color for each 8 patterns
                var colorCodeValuesStart = colorCode << 8;                  // (colorCode * 256) 256 patterns for each colorCode
                var patternStart = name << 3;                               // (name * 8) 8 bytes each
                var patternEnd = patternStart + 8;
                for (var patternLine = patternStart; patternLine < patternEnd; patternLine++) {
                    var pattern = vramPatternTable[patternLine];
                    var values = colorCodePatternValues[colorCodeValuesStart + pattern];
                    frameBackBuffer.set(values, bufferPos);
                    bufferPos += 256;                                       // Advance 1 line
                }
                bufferPos -= 2040;                                          // Go back to the next char starting pixel
                pos++;
            }
            bufferPos += 1792;                                              // Go to the next line starting char pixel
        }
        updateSpritePlanes();
    }

    function updatePatternPlaneMode1() {                                    // Graphics 2 (Screen 2)
        var bufferPos = 0;
        var pos = 0;
        for (var line = 0; line < 24; line++) {
            var nameExt = ((line >> 3) & register4) << 8;                   // line / 8 (each third of screen)
            for (var col = 0; col < 32; col++) {
                var name = vramNameTable[pos] + nameExt;
                var patternStart = name << 3;                               // (name * 8) 8 bytes each
                var patternEnd = patternStart + 8;
                for (var patternLine = patternStart; patternLine < patternEnd; patternLine++) {
                    var pattern = vramPatternTable[patternLine];
                    var colorCode = vramColorTable[patternLine];
                    var colorCodeValuesStart = colorCode << 8;              // (colorCode * 256) 256 patterns for each colorCode
                    var values = colorCodePatternValues[colorCodeValuesStart + pattern];
                    frameBackBuffer.set(values, bufferPos);
                    bufferPos += 256;                                       // Advance 1 line
                }
                bufferPos -= 2040;                                          // Go back to the next char starting pixel
                pos++;
            }
            bufferPos += 1792;                                              // Go to the next line starting char pixel
        }
        updateSpritePlanes();
    }

    function updatePatternPlaneMode2() {                                    // Multicolor (Screen 3)
        var bufferPos = 0;
        var pos = 0;
        for (var line = 0; line < 24; line++) {
            var extraPattPos = (line & 0x03) << 1;                           // (line % 4) * 2
            for (var col = 0; col < 32; col++) {
                var name = vramNameTable[pos];
                var patternStart = (name << 3) + extraPattPos;              // (name * 8 + position) 2 bytes each
                var patternEnd = patternStart + 2;
                for (var patternLine = patternStart; patternLine < patternEnd; patternLine++) {
                    var colorCode = vramPatternTable[patternLine];
                    var colorCodeValuesStart = colorCode << 8;              // (colorCode * 256) 256 patterns for each colorCode
                    var values = colorCodePatternValues[colorCodeValuesStart + 0xf0];   // Always solid blocks of front and back colors
                    frameBackBuffer.set(values, bufferPos);
                    bufferPos += 256;                                       // Advance 1 line
                    frameBackBuffer.set(values, bufferPos);
                    bufferPos += 256;
                    frameBackBuffer.set(values, bufferPos);
                    bufferPos += 256;
                    frameBackBuffer.set(values, bufferPos);
                    bufferPos += 256;
                }
                bufferPos -= 2040;                                          // Go back to the next char starting pixel
                pos++;
            }
            bufferPos += 1792;                                              // Go to the next line starting char pixel
        }
        updateSpritePlanes();
    }

    function updatePatternPlaneMode4() {                                    // Text (Screen 0)
        var bufferPos = 0;
        var pos = 0;
        var colorCode = register7;                                          // Fixed text color for all screen
        var colorCodeValuesStart = colorCode << 8;                          // (colorCode * 256) 256 patterns for each colorCode
        var borderValues = colorCodePatternValues[colorCodeValuesStart];
        for (var line = 0; line < 24; line++) {
            for (var borderLine = 0; borderLine < 8; borderLine++) {
                frameBackBuffer.set(borderValues, bufferPos);               // 8 pixels left border
                bufferPos += 256;
            }
            bufferPos -= 2040;                                              // Go back to the next char starting pixel
            for (var col = 0; col < 40; col++) {
                var name = vramNameTable[pos];
                var patternStart = name << 3;                               // (name * 8) 8 bytes each
                var patternEnd = patternStart + 8;
                for (var patternLine = patternStart; patternLine < patternEnd; patternLine++) {
                    var pattern = vramPatternTable[patternLine];
                    var values = colorCodePatternValues[colorCodeValuesStart + pattern];
                    frameBackBuffer.set(values, bufferPos);
                    bufferPos += 256;                                       // Advance 1 line
                }
                bufferPos -= 2042;                                          // Go back to the next char starting pixel (-256 * 8 + 6)
                pos++;
            }
            for (borderLine = 0; borderLine < 8; borderLine++) {
                frameBackBuffer.set(borderValues, bufferPos);               // 8 pixels right border
                bufferPos += 256;
            }
            bufferPos -= 248;                                               // Go to the next line starting char pixel
        }
        // Sprite System deactivated
    }

    function updateSpritePlanes() {
        if (vramSpriteAttrTable[0] === 208) return;
        var colorCodeValuesStart, patternStart, name, color, pattern, values;
        var drawn;
        var collision = false;
        var invalid = null;
        var y, x;
        var s, f;
        var bufferPos;

        var size = register1 & 0x03;

        if (size === 2) {                                                    // 16x16 normal
            bufferPos = 0;
            for (var line = 0; line < 192; line++) {
                drawn = 0;
                for (var atrPos = 0; atrPos < 128; atrPos += 4) {            // Max of 32 sprites
                    y = vramSpriteAttrTable[atrPos];
                    if (y === 208) break;                                    // Stop Sprite processing for the line, as per spec
                    if (y >= 225) y = -256 + y - 1;                          // Signed value from -31 to -1
                    y++;                                                     // -1 (255) is line 0 per spec, so add 1
                    if (y < (line - 15) || y > line) continue;               // Not visible at line
                    drawn++;
                    if (drawn > 4) {                                         // Max of 4 sprites drawn. Store the first invalid (5th)
                        if (!invalid) invalid = atrPos >> 2;
                        break;
                    }
                    x = vramSpriteAttrTable[atrPos + 1];
                    color = vramSpriteAttrTable[atrPos + 3];
                    if (color & 0x80) x -= 32;                               // Early Clock bit, X to be 32 to the left
                    if (x < -15) continue;                                   // Not visible (out to the left)
                    name = vramSpriteAttrTable[atrPos + 2];
                    colorCodeValuesStart = ((color & 0x0f) << 4) << 8;
                    patternStart = ((name & 0xfc) << 3) + (line - y);
                    // Left half
                    s = x >= 0 ? 0 : -x; f = x <= 248 ? 8 : 256 - x;
                    if (s < f) {
                        pattern = vramSpritePatternTable[patternStart];
                        values = colorCodePatternValues[colorCodeValuesStart + pattern];
                        copySprite(frameBackBuffer, bufferPos + x, values, s, f);
                    }
                    // Right half
                    s = x >= -8 ? 0 : -8 - x; f = x <= 240 ? 8 : 248 - x;
                    if (s < f) {
                        pattern = vramSpritePatternTable[patternStart + 16];
                        values = colorCodePatternValues[colorCodeValuesStart + pattern];
                        copySprite(frameBackBuffer, bufferPos + x + 8, values, s, f);
                    }
                }
                bufferPos += 256;
            }
        } else if (size === 3) {                                             // 16x16 double

        } else if (size === 0) {                                             // 8x8 normal

        } else {                                                             // 8x8 double

        }

        if (collision) {
            //console.log("Collision");
            status |= 0x20;
        }
        if (invalid && ((status & 0x40) === 0)) {
            //console.log("Invalid sprite: " + invalid);
            status = status | 0x40 | invalid;
        }

        // TODO Collisions with transparent (color 0) sprites will not be detected
        function copySprite(dest, pos, source, start, finish) {
            for (var i = start; i < finish; i++) {
                if (source[i] === 0) continue;
                if (dest[pos + i] < 0xff000000) dest[pos + i] = source[i] + 0x01000000;
                else collision = true;
            }
        }
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
        for (var front = 0; front < 16; front++) {
            var colorFront = colorRGBs[front];
            for (var back = 0; back < 16; back++) {
                var colorBack = colorRGBs[back];
                var colorCode = (front << 4) + back;
                for (var pattern = 0; pattern < 256; pattern++) {
                    var sizePerColorCode = 256 * 8;
                    var patternPositionInsideColorCode = pattern * 8;
                    var finalPosition = colorCode * sizePerColorCode + patternPositionInsideColorCode;
                    var patternValues = colorValuesRaw.subarray(finalPosition, finalPosition + 8);
                    for (var bit = 7; bit >= 0; bit--) {
                        var pixel = (pattern >>> bit) & 1;
                        patternValues[7 - bit] = pixel ? colorFront : colorBack;
                    }
                    colorCodePatternValues[colorCode * 256 + pattern] = patternValues;
                }
            }
        }
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

    var backdropRGB = 0;
    var signalBlanked = true;
    var frameBlanked = false;

    var nameTableAddress = 0;
    var colorTableAddress = 0;
    var patternTableAddress = 0;
    var spriteAttrTableAddress = 0;
    var spritePatternTableAddress = 0;

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
    // Obs: Pattern plane paints with these colors (Alpha = 0xfe), Sprite plane paints with Alpha = 0xff

    var colorRGBs = new Uint32Array([ 0x00000000, 0xfe000000, 0xfe42c821, 0xfe78dc5e, 0xfeed5554, 0xfefc767d, 0xfe4d52d4, 0xfef5eb42, 0xfe5455fc, 0xfe7879ff, 0xfe54c1d4, 0xfe80cee6, 0xfe3bb021, 0xfeba5bc9, 0xfecccccc, 0xfeffffff ]);
    var colorValuesRaw = new Uint32Array(16 * 16 * 256 * 8);        // 16 front colors * 16 back colors * 256 patterns * 8 pixels
    var colorCodePatternValues = new Array(256 * 256);              // 256 colorCodes * 256 patterns


    // Connections

    var videoSignal;
    var engine;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: status, m: mode, r0: register0, r1: register1, r3: register3, r4: register4, r7: register7,
            nt: nameTableAddress, ct: colorTableAddress, pt: patternTableAddress, sat: spriteAttrTableAddress, spt: spritePatternTableAddress,
            d: dataToWrite, vp: vramPointer, vw: vramWriteMode,
            vram: btoa(wmsx.Util.uInt8ArrayToByteString(vram)),
            vs: videoStandard.name
        };
    };

    this.loadState = function(s) {
        status = s.s; mode = s.m; register0 = s.r0; register1 = s.r1; register3 = s.r3; register4 = s.r4; register7 = s.r7;
        nameTableAddress = s.nt; colorTableAddress = s.ct; patternTableAddress = s.pt; spriteAttrTableAddress = s.sat; spritePatternTableAddress = s.spt;
        dataToWrite = s.d; vramPointer = s.vp; vramWriteMode = s.vw;
        vram = new Uint8Array(wmsx.Util.byteStringToUInt8Array(atob(s.vram)));
        vramNameTable = vram.subarray(nameTableAddress);
        vramColorTable = vram.subarray(colorTableAddress);
        vramPatternTable = vram.subarray(patternTableAddress);
        vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
        vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
        backdropRGB = colorRGBs[register7 & 0x0f];
        signalBlanked = (register1 & 0x40) === 0;
        frameBlanked = false;
        this.setVideoStandard(wmsx.VideoStandard[s.vs]);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};
