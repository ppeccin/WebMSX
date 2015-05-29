// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function VDP(cpu, psg) {
    var self = this;

    function init() {
        videoSignal = new VDPVideoSignal();
        initColorCodePatternValues();
        initPlaneResources();
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
    };

    this.getVideoOutput = function() {
        return videoSignal;
    };

    this.frame = function() {
        // Send clock to the CPU
        for (var c = 59736; c > 0; c--)             // 59736 = CPU clocks per frame
            if (!cpu.stop) cpu.clockPulse();

        psg.finishFrame();

        // Update video signal
        updateFrame();

        // Request interrupt
        status |= 0x80;
        updateIRQ();
    };

    this.input99 = function(port) {
        // Status Register Read
        var prevStatus = status;

        dataToWrite = null;
        status &= ~0xa0;
        updateIRQ();

        return prevStatus;
    };

    this.output99 = function(port, val) {
        // Control Write
        if (dataToWrite === null) {
            // First write. Data to write to register or VRAM Address Pointer low
            dataToWrite = val;
        } else {
            // Second write
            if (val & 0x80) {
                // Register write
                var reg = val & 0x07;
                //console.log("VDP Register Write " + Util.toHex2(reg) + " := " + Util.toHex2(dataToWrite));
                if (reg === 0) {
                    register0 = dataToWrite;
                    updateMode();
                } else if (reg === 1) {
                    register1 = dataToWrite;
                    updateIRQ();
                    updateMode();
                    signalBlanked = (register1 & 0x40) === 0;

                    //console.log("Register1 = " + Util.toHex2(register1));
                } else if (reg === 2) {
                    nameTableAddress = (dataToWrite & 0x0f) * 0x400;
                    vramNameTable = vram.subarray(nameTableAddress);
               } else if (reg === 3) {
                    register3 = dataToWrite;
                    colorTableAddress = dataToWrite * 0x40;
                    if (mode === 1) colorTableAddress &= 0x2000;
                    vramColorTable = vram.subarray(colorTableAddress);

                    //console.log("Register3 = " + Util.toHex2(register3));
               } else if (reg === 4) {
                    register4 = dataToWrite;
                    patternTableAddress = (dataToWrite & 0x07) * 0x800;
                    if (mode === 1) patternTableAddress &= 0x2000;
                    vramPatternTable = vram.subarray(patternTableAddress);

                    //console.log("Register4 = " + Util.toHex2(register4));
               } else if (reg === 5) {
                   spriteAttrTableAddress = (dataToWrite & 0x7f) * 0x80;
                   vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
               } else if (reg === 6) {
                   spritePatternTableAddress = (dataToWrite & 0x07) * 0x800;
                   vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
               } else if (reg === 7) {
                   // Text Color and Backdrop Color
                   register7 = dataToWrite;
                   backdropRGB = colorRGBs[register7 & 0x0f];
               }
            } else {
                // VRAM Address Pointer high and mode (r/w)
                vramWriteMode = val & 0x40;

                //if (!vramWriteMode) console.log("Setting VRAM Read Mode");

                vramPointer = ((val & 0x3f) << 8) | dataToWrite;
            }
            dataToWrite = null;
        }
    };

    this.input98 = function(port) {
        dataToWrite = null;

        if (vramWriteMode) console.log("Illegal VRAM Read");

        var res = vram[vramPointer++];            // VRAM Read

        //console.log("VRAM Read: " + Util.toHex2(vramPointer) + ", " + Util.toHex2(res));

        if (vramPointer > 16383) {
            //console.log("VRAM Read Wrapped");
            vramPointer = 0;
        }
        return res;
    };

    this.output98 = function(port, val) {
        dataToWrite = null;

        //console.log(">>> VRAM Write: " + Util.toHex2(vramPointer) + ", " + Util.toHex2(val));

        vram[vramPointer++] = val;               // VRAM Write

        if (!vramWriteMode) console.log("Illegal VRAM Write");

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
        if (cpu.stop) return;           // Debugging

        if ((status & 0x80) && (register1 & 0x20))
            cpu.INT = 0;                // Active
        else
            cpu.INT = 1;
    }

    function updateFrame() {
        if (signalBlanked) {
            // Blank if needed
            if (!patternBlanked) {
                if (patternPlaneBackBuffer.fill) patternPlaneBackBuffer.fill(0);
                else Util.arrayFill(patternPlaneBackBuffer, 0);
                patternBlanked = true;
            }
        } else {
            // Update planes
            if (mode === 1) updatePatternPlaneMode1();
            else if (mode === 0) updatePatternPlaneMode0();
            else if (mode === 4) updatePatternPlaneMode4();
            patternBlanked = false;
        }

        // Update plane image and send to monitor
        patternPlaneContext.putImageData(patternPlaneImageData, -32, -32, 32, 32, 256, 192);
        videoSignal.newFrame(patternPlaneCanvas, backdropRGB);
    }

    function updateMode() {
        mode = ((register1 & 0x18) >>> 2) | ((register0 & 0x02) >>> 1);
    }

    function updatePatternPlaneMode0() {                                    // Graphics 1 (Screen 1)
        var bufferPos = 10272;                                              // First char position
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
                    patternPlaneBackBuffer.set(values, bufferPos);
                    bufferPos += 320;                                       // Advance 1 line
                }
                bufferPos -= 2552;                                          // Go back to the next char starting pixel
                pos++;
            }
            bufferPos += 2304;                                              // Go to the next line starting char pixel
        }
        updateSpritesPlane();
    }

    function updatePatternPlaneMode1() {                                    // Graphics 2 (Screen 2)
        var bufferPos = 10272;                                              // First char position
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
                    patternPlaneBackBuffer.set(values, bufferPos);
                    bufferPos += 320;                                       // Advance 1 line
                }
                bufferPos -= 2552;                                          // Go back to the next char starting pixel
                pos++;
            }
            bufferPos += 2304;                                              // Go to the next line starting char pixel
        }
        updateSpritesPlane();
    }

    function updatePatternPlaneMode4() {                                    // Text (Screen 0)
        var bufferPos = 10272;                                              // First char position
        var pos = 0;
        var colorCode = register7;                                          // Fixed text color for all screen
        var colorCodeValuesStart = colorCode << 8;                          // (colorCode * 256) 256 patterns for each colorCode
        var borderValues = colorCodePatternValues[colorCodeValuesStart];
        for (var line = 0; line < 24; line++) {
            for (var borderLine = 0; borderLine < 8; borderLine++) {
                patternPlaneBackBuffer.set(borderValues, bufferPos);        // 8 pixels left border
                bufferPos += 320;
            }
            bufferPos -= 2552;                                              // Go back to the next char starting pixel
            for (var col = 0; col < 40; col++) {
                var name = vramNameTable[pos];
                var patternStart = name << 3;                               // (name * 8) 8 bytes each
                var patternEnd = patternStart + 8;
                for (var patternLine = patternStart; patternLine < patternEnd; patternLine++) {
                    var pattern = vramPatternTable[patternLine];
                    var values = colorCodePatternValues[colorCodeValuesStart + pattern];
                    patternPlaneBackBuffer.set(values, bufferPos);
                    bufferPos += 320;                                       // Advance 1 line
                }
                bufferPos -= 2554;                                          // Go back to the next char starting pixel (-256 * 8 + 6)
                pos++;
            }
            for (borderLine = 0; borderLine < 8; borderLine++) {
                patternPlaneBackBuffer.set(borderValues, bufferPos);        // 8 pixels right border
                bufferPos += 320;
            }
            bufferPos += -248;                                              // Go to the next line starting char pixel
        }
        // Sprite System deactivated
    }

    function updateSpritesPlane() {
        if ((register1 & 0x03) !== 2) return;
        if (vramSpriteAttrTable[0] === 208) return;
        var collision = null;
        var y, x, name, color;
        var bufferPos = 32;                                              // First possible sprite pixel (-32, 0) position

        for (var line = -32; line < 288; line ++) {
            var atrPos = -4;
            for (var sprite = 31; sprite >= 0; sprite--) {
                atrPos += 4;
                y = vramSpriteAttrTable[atrPos];
                if (y === 208) break;                                    // Stop Sprite processing for the line, as per spec
                if (y >= 225) y = -256 + y - 1;                          // Signed value from -31 to -1. -1 (255) is line 0 per spec
                y++;                                                     // So add 1
                if (y < line - 15 || y > line) continue;
                x = vramSpriteAttrTable[atrPos+1];
                name = vramSpriteAttrTable[atrPos+2];
                color = vramSpriteAttrTable[atrPos+3];
                if (color & 0x80) x -= 32;
                var colorCodeValuesStart = ((color & 0x0f) << 4) << 8;
                var patternStart = ((name & 0xfc) << 3) + (line - y);
                var pattern = vramSpritePatternTable[patternStart];
                var values = colorCodePatternValues[colorCodeValuesStart + pattern];
                copySprite(patternPlaneBackBuffer, bufferPos + x, values);
                pattern = vramSpritePatternTable[patternStart + 16];
                values = colorCodePatternValues[colorCodeValuesStart + pattern];
                copySprite(patternPlaneBackBuffer, bufferPos + x + 8, values);
            }
            bufferPos += 320;
        }

        if (collision !== null) {
            //console.log("Collision at " + collision);
            status |= 0x20;
        }

        function copySprite(dest, pos, source) {
            for (var i = 0; i < 8; i++) {
                if (source[i] === 0) continue;
                if (dest[pos + i] < 0xff000000)
                    dest[pos + i] = source[i] + 0x01000000;
                else
                if (collision === null) collision = line;
            }
        }
    }

    function initPlaneResources() {
        patternPlaneCanvas = document.createElement('canvas');
        patternPlaneCanvas.width = 256;
        patternPlaneCanvas.height = 192;
        patternPlaneContext = patternPlaneCanvas.getContext("2d");
        patternPlaneImageData = patternPlaneContext.createImageData(32 + 256 + 32, 32 + 192 + 32);
        patternPlaneBackBuffer = new Uint32Array(patternPlaneImageData.data.buffer);
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

    var register0 = 0;
    var register1 = 0;
    var register3 = 0;
    var register4 = 0;
    var register7 = 0;

    var backdropRGB = 0;
    var signalBlanked = true;
    var patternBlanked = false;

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
    var patternPlaneCanvas, patternPlaneContext, patternPlaneImageData, patternPlaneBackBuffer;


    // Pre calculated 8-pixel RGBA values for all color and 8-bit pattern combinations  (actually ABRG)
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
            s: status, m: mode, r0: register0, r1: register1, r7: register7,
            nt: nameTableAddress, ct: colorTableAddress, pt: patternTableAddress, sat: spriteAttrTableAddress, spt: spritePatternTableAddress,
            d: dataToWrite, vp: vramPointer, vw: vramWriteMode,
            vram: btoa(Util.uInt8ArrayToByteString(vram))
        };
    };

    this.loadState = function(s) {
        status = s.s; mode = s.m; register0 = s.r0; register1 = s.r1; register7 = s.r7;
        nameTableAddress = s.nt; colorTableAddress = s.ct; patternTableAddress = s.pt; spriteAttrTableAddress = s.sat; spritePatternTableAddress = s.spt;
        dataToWrite = s.d; vramPointer = s.vp; vramWriteMode = s.vw;
        vram = new Uint8Array(Util.byteStringToUInt8Array(atob(s.vram)));
        vramNameTable = vram.subarray(nameTableAddress);
        vramColorTable = vram.subarray(colorTableAddress);
        vramPatternTable = vram.subarray(patternTableAddress);
        vramSpriteAttrTable = vram.subarray(spriteAttrTableAddress);
        vramSpritePatternTable = vram.subarray(spritePatternTableAddress);
        backdropRGB = colorRGBs[register7 & 0x0f];
        blanked = (register1 & 0x40) === 0;
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

}