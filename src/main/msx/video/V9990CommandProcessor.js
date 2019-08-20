// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Commands perform all operation instantaneously at the first cycle. Duration is estimated and does not consider VRAM access slots

wmsx.V9990CommandProcessor = function() {
"use strict";

    this.connectV9990 = function(pV9990, pVRAM, pRegister) {
        v9990 = pV9990;
        vram = pVRAM;
        register = pRegister;
    };

    this.reset = function() {
        STOP();
    };

    this.startCommand = function(val) {
        switch (val & 0xf0) {
            case 0x00:
                STOP(); break;
            case 0x10:
                LMMC(); break;
            case 0x20:
                LMMV(); break;
            case 0x30:
                LMCM(); break;
            case 0x40:
                LMMM(); break;
            // case 0xf0:
            //     HMMC(); break;
            // case 0xe0:
            //     YMMM(); break;
            // case 0xd0:
            //     HMMM(); break;
            // case 0xc0:
            //     HMMV(); break;
            // case 0x70:
            //     LINE(); break;
            // case 0x60:
            //     SRCH(); break;
            // case 0x50:
            //     PSET(); break;
            // case 0x40:
            //     POINT(); break;
            default:
                console.log(">>>> V9990 Command: " + val.toString(16) + ". DispSprites: " + dispAndSpritesMode);
            //    wmsx.Util.error("Unsupported V9938 Command: " + val.toString(16));
        }
    };

    this.cpuWrite = function(val) {
        if (writeHandler) writeHandler(val);
        else {
            writeReady = true;
            v9990.setStatusTR(0);
        }
        //else console.log("Write UNHANDLED: " + val.toString(16));
    };

    this.cpuRead = function() {
        var res = readData;

        if (readHandler) readHandler();
        else v9990.setStatusTR(0);
        //else console.log("Read UNHANDLED");

        return res;
    };

    this.updateStatus = function() {
        if (CE && finishingCycle >= 0 && (finishingCycle === 0 || v9990.updateCycles() >= finishingCycle))
            finish();
    };

    this.setV9990ModeData = function(pModeData, pTypeData, pImageWidth, pImageHeight) {
        modeData = pModeData;
        typeData = pTypeData;
        imageWidth = pImageWidth;
        imageWidthMask = pImageWidth - 1;
        imageHeight = pImageHeight;
        imageHeightMask = pImageHeight - 1;
        imageWidthBytes = (imageWidth * typeData.bpp) >> 3;
        typeBPP = typeData.bpp;

        // ???
        colosPPBShift = typeData.ppb >> 1;
        colorPPBMask = ~0 << colosPPBShift;
    };

    this.setV9990DisplayAndSpritesEnabled = function(disp, sprites) {
        dispAndSpritesMode = disp ? sprites ? 2 : 1 : 0;
    };

    this.setV9990TurboMulti = function(multi) {
        // console.log("SET V9990 MULTI:" + multi);

        turboClockMulti = multi < 0 || multi > 8 ? 0 : multi;   // 0..8
    };

    this.getV9990TurboMulti = function() {
        return turboClockMulti;
    };

    function getSX() {
        return (((register[33] & 0x07) << 8) | register[32]) & imageWidthMask;
    }

    function getSY() {
        return (((register[35] & 0x0f) << 8) | register[34]) & imageHeightMask;
    }
    function setSY(val) {
        register[35] = (val >> 8) & 0x0f; register[34] = val & 0xff;
    }

    function getDX() {
        return (((register[37] & 0x07) << 8) | register[36]) & imageWidthMask;
    }

    function getDY() {
        return (((register[39] & 0x0f) << 8) | register[38]) & imageHeightMask;
    }
    function setDY(val) {
        register[39] = (val >> 8) & 0x0f; register[38] = val & 0xff;
    }

    function getNX() {
        return ((((((register[41] & 0x07) << 8) | register[40]) || 2048) - 1) & imageWidthMask) + 1;
    }

    function getNY() {
        return ((((((register[43] & 0x0f) << 8) | register[42]) || 4096) - 1) & imageHeightMask) + 1;
    }
    function setNY(val) {
        register[43] = (val >> 8) & 0x0f; register[42] = val & 0xff;
    }

    function getDIX() {
        return register[44] & 0x04 ? -1 : 1;
    }

    function getDIY() {
        return register[44] & 0x08 ? -1 : 1;
    }

    function getMAJ() {
        return register[44] & 0x01;
    }

    function getNEQ() {
        return (register[44] & 0x02) !== 0;
    }

    function getLOP() {
        return LOGICAL_OPERATIONS[register[45] & 0x1f];
    }

    function getFC() {
        return (register[49] << 8) | register[48];
    }
    function setFC(val) {
        register[48] = val & 255;
        register[49] = val >> 8;
    }

    function setBX(val) {
        register[53] = val & 255;
        register[54] = val >> 8;
    }

    function LMMC() {
        // Collect parameters
        DX = getDX();
        DY = getDY();
        NX = getNX();
        NY = getNY();
        DIX = getDIX();
        DIY = getDIY();
        LOP = getLOP();

        // console.log("LMMC START x: " + DX + ", y: " + DY + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        EDX = DX;

        writeStart(LMMCNextWrite);
    }

    function LMMCNextWrite(cd) {
        // console.log("LMMC Write CX: " + CX + ", CY: " + CY);

        switch (typeBPP) {
            case 16:
                if (writeDataPending === null)
                    writeDataPending = cd;
                else {
                    LMMCNextPut((cd << 8) | writeDataPending);
                    writeDataPending = null;
                }
                break;
            case 8:
                LMMCNextPut(cd);
                break;
            case 4:
                LMMCNextPut(cd >> 4);
                if (CE) LMMCNextPut(cd & 0x0f);
                break;
            case 2:
                LMMCNextPut(cd >> 6);
                if (CE) LMMCNextPut((cd >> 4) & 0x03);
                if (CE) LMMCNextPut((cd >> 2) & 0x03);
                if (CE) LMMCNextPut(cd & 0x03);
                break;
        }
    }

    function LMMCNextPut(sc) {
        // console.log("LMMC Put CX: " + CX + ", CY: " + CY);

        logicalPSET(EDX, DY, sc, LOP);

        CX = CX + 1;
        if (CX >= NX) {
            EDX = DX;
            CX = 0; CY = CY + 1; DY = (DY + DIY) & imageHeightMask;
            if (CY >= NY) {
                finish();
            }
        } else {
            EDX = (EDX + DIX) & imageWidthMask;
        }

        // Set visible changed register state
        // setDY(DY);
        // setNY(NY - CY);
    }

    function LMMV() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var fc = getFC();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();

        // console.log("LMMV dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", fc: " + fc.toString(16));

        // Perform operation
        for (var cy = ny; cy > 0; --cy) {
            var edx = dx;
            for (var cx = nx; cx > 0; --cx) {
                logicalPSET(edx, dy, fc, op);
                edx = (edx + dix) & imageWidthMask;
            }
            dy = (dy + diy) & imageHeightMask;
        }

        // Final registers state
        // setDY(dy);
        // setNY(ny - ny);

        start(LMMVTiming, nx * ny, ny);
    }

    function LMCM() {
        // Collect parameters
        SX = getSX();
        SY = getSY();
        NX = getNX();
        NY = getNY();
        DIX = getDIX();
        DIY = getDIY();

        // console.log("LMCM START x: " + SX + ", y: " + SY + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        ESX = SX;

        readStart(LMCMNextRead);
    }

    function LMCMNextRead() {
        switch (typeBPP) {
            case 16:
                if (readDataPending === null) {
                    readDataPending = LMCMNextGet();
                    readData = readDataPending & 0xff;
                } else {
                    readData = readDataPending >> 8;
                    readDataPending = null;
                }
                break;
            case 8:
                readData = LMCMNextGet();
                break;
            case 4:
                readData = LMCMNextGet() << 4;
                if (CE) readData |= LMCMNextGet();
                break;
            case 2:
                readData = LMCMNextGet() << 6;
                if (CE) readData |= LMCMNextGet() << 4;
                if (CE) readData |= LMCMNextGet() << 2;
                if (CE) readData |= LMCMNextGet();
                break;
        }
    }

    function LMCMNextGet() {
        var sc = normalPGET(ESX, SY);

        CX = CX + 1;
        if (CX >= NX) {
            ESX = SX;
            CX = 0; CY = CY + 1; SY = (SY + DIY) & imageHeightMask;
            if (CY >= NY) finish();
        } else {
            ESX = (ESX + DIX) & imageWidthMask;
        }

        // Set visible changed register state
        // setSY(SY);
        // setNY(NY - CY);

        return sc;
    }

    function LMMM() {
        // Collect parameters
        var sx = getSX();
        var sy = register[33] & 0x02 ? getSY() : getSY();
        var dx = getDX();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();

        // console.log("LMMM sx: " + sx + ", sy: " + sy + ", dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", op: " + op.name);

        // Perform operation
        for (var cy = ny; cy > 0; --cy) {
            var esx = sx, edx = dx;
            for (var cx = nx; cx > 0; --cx) {
                logicalPCOPY(edx, dy, esx, sy, op);
                esx = (esx + dix) & imageWidthMask; edx = (edx + dix) & imageWidthMask;
            }
            sy = (sy + diy) & imageHeightMask; dy = (dy + diy) & imageHeightMask;
        }

        // Final registers state
        // setSY(sy);
        // setDY(dy);
        // setNY(0);

        start(LMMMTiming, nx * ny, ny);
    }

    function HMMC() {
        // Collect parameters
        var dx = getDX();
        DY = getDY();
        NX = getNX();
        NY = getNY();
        DIX = getDIX();
        DIY = getDIY();

        //console.log("HMMC Start dx: " + dx + ", dy: " + DY + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        // Adjust for whole-byte operation
        dx >>= colosPPBShift; NX >>= colosPPBShift;

        // Horizontal limits. Wrap X and narrow to only 1 unit wide
        if (dx >= imageWidthBytes) {
            dx &= imageWidthBytes - 1; NX = 1;
        } else {
            NX = NX || imageWidthBytes;                                             // max width if 0
            NX = DIX === 1 ? min(NX, imageWidthBytes - dx) : min(NX, dx + 1);       // limit width
        }

        // Vertical limit, top only
        NY = NY || 1024;                                // max height if 0
        ENY = DIY === 1 ? NY : min(NY, DY + 1);

        destPos = DY * imageWidthBytes + dx;

        writeStart(HMMCNextWrite);
    }

    function HMMCNextWrite(co) {
        //console.log("HMMC Write CX: " + CX + ", CY: " + CY + ", CO: " + co.toString(16));

        vram[destPos & VRAM_LIMIT] = co;

        CX = CX + 1;
        if (CX >= NX) {
            destPos -= DIX * (NX - 1);
            CX = 0; CY = CY + 1;
            if (CY >= ENY) {
                finish();
                // SDSnatcher Melancholia fix: TR not reset when command ends
            }
            else destPos += DIY * imageWidthBytes;
        } else {
            destPos += DIX;
        }

        // Set visible changed register state
        setDY(DY + DIY * CY);
        setNY(NY - CY);
    }

    function YMMM() {
        // Collect parameters
        var sy = getSY();
        var dx = getDX();
        var dy = getDY();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();

        //console.log("YMMM sy: " + sy + ", dx: " + dx + ", dy: " + dy + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

        // Adjust for whole-byte operation
        dx >>= colosPPBShift;

        // Horizontal limits, wrap X and narrow to only 1 unit wide
        if (dx >= imageWidthBytes) dx &= imageWidthBytes - 1;
        var nx = dix === 1 ? imageWidthBytes - dx : dx + 1;

        // Vertical limit, top only
        ny = ny || 1024;                                        // max height if 0
        var eny = diy === 1 ? ny : min(ny, min(sy, dy) + 1);

        // Perform operation
        var sPos = sy * imageWidthBytes + dx;
        var dPos = dy * imageWidthBytes + dx;
        var yStride = -(dix * nx) + imageWidthBytes * diy;
        for (var cy = eny; cy > 0; cy = cy - 1) {
            for (var cx = nx; cx > 0; cx = cx - 1) {
                vram[dPos & VRAM_LIMIT] = vram[sPos & VRAM_LIMIT];
                sPos += dix; dPos += dix;
            }
            sPos += yStride; dPos += yStride;
        }

        // Final registers state
        setSY(sy + diy * eny);
        setDY(dy + diy * eny);
        setNY(ny - eny);

        start(null, nx * eny, eny);     	//  40R  24W   0L
    }

    function HMMM() {
        // Collect parameters
        var sx = getSX();
        var sy = getSY();
        var dx = getDX();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();

        //console.log("HMMM sx: " + sx + ", sy: " + sy + ", dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

        // Adjust for whole-byte operation
        sx >>= colosPPBShift; dx >>= colosPPBShift; nx >>= colosPPBShift;

        // Horizontal limits, wrap X and narrow to only 1 unit wide
        if (sx >= imageWidthBytes || dx >= imageWidthBytes) {
            sx &= imageWidthBytes - 1; dx &= imageWidthBytes - 1; nx = 1;
        } else {
            nx = nx || imageWidthBytes;                                                             // max width if 0
            nx = dix === 1 ? min(nx, imageWidthBytes - max(sx, dx)) : min(nx, min(sx, dx) + 1);     // limit width
        }

        // Vertical limit, top only
        ny = ny || 1024;                                        // max height if 0
        var eny = diy === 1 ? ny : min(ny, min(sy, dy) + 1);

        // Perform operation
        var sPos = sy * imageWidthBytes + sx;
        var dPos = dy * imageWidthBytes + dx;
        var yStride = -(dix * nx) + imageWidthBytes * diy;
        for (var cy = eny; cy > 0; cy = cy - 1) {
            for (var cx = nx; cx > 0; cx = cx - 1) {
                vram[dPos & VRAM_LIMIT] = vram[sPos & VRAM_LIMIT];
                sPos += dix; dPos += dix;
            }
            sPos += yStride; dPos += yStride;
        }

        // Final registers state
        setSY(sy + diy * eny);
        setDY(dy + diy * eny);
        setNY(ny - eny);

        start(null, nx * eny, eny);      	//  64R 24W   64L
    }

    function HMMV() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var fc = getFC();
        var dix = getDIX();
        var diy = getDIY();

        //console.log("HMMV dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", fc: " + fc.toString(16));

        // Adjust for whole-byte operation
        dx >>= colosPPBShift; nx >>= colosPPBShift;

        // Horizontal limits, wrap X and narrow to only 1 unit wide
        if (dx >= imageWidthBytes) {
            dx &= imageWidthBytes - 1; nx = 1;
        } else {
            nx = nx || imageWidthBytes;                                             // max width if 0
            nx = dix === 1 ? min(nx, imageWidthBytes - dx) : min(nx, dx + 1);       // limit width
        }

        // Vertical limit, top only
        ny = ny || 1024;                                // max height if 0
        var eny = diy === 1 ? ny : min(ny, dy + 1);

        // Perform operation
        var pos = dy * imageWidthBytes + dx;
        var yStride = -(dix * nx) + imageWidthBytes * diy;
        for (var cy = eny; cy > 0; cy = cy - 1) {
            for (var cx = nx; cx > 0; cx = cx - 1) {
                vram[pos & VRAM_LIMIT] = fc;
                pos += dix;
            }
            pos += yStride;
        }

        // Final registers state
        setDY(dy + diy * eny);
        setNY(ny - eny);

        start(null, nx * eny, eny);     	//  48W   56L
    }

    function LINE() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var nx = getNX();             // Range 0 - 511.  Value 0 is OK
        var ny = getNY();             // Range 0 - 1023. Value 0 is OK
        var fc = getFC();
        var dix = getDIX();
        var diy = getDIY();
        var maj = getMAJ();
        var op = getLOP();

        //console.log("LINE dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", maj: " + maj);

        // Limits control
        var maxX = imageWidth - 1;

        // If out of horizontal limits, wrap X
        dx &= maxX;

        // Timming control
        var nMinor = 0;

        // Perform operation
        var e = 0;
        if (maj === 0) {
            for (var n = 0; n <= nx; n = n + 1) {
                logicalPSET(dx, dy, fc, op);
                dx += dix;
                if (ny > 0) {
                    e += ny;
                    if ((e << 1) >= nx) {
                        dy += diy; e -= nx; nMinor = nMinor + 1;
                    }
                }
                if (dx > maxX || dx < 0 || dy < 0) break;       // No bottom limit
            }
        } else {
            for (n = 0; n <= nx; n = n + 1) {
                logicalPSET(dx, dy, fc, op);
                dy += diy;
                if (ny > 0) {
                    e += ny;
                    if ((e << 1) >= nx) {
                        dx += dix; e -= nx; nMinor = nMinor + 1;
                    }
                }
                if (dx > maxX || dx < 0 || dy < 0) break;       // No bottom limit
            }
        }

        // Final registers state
        setDY(dy);

        start(null, n, nMinor);      // 88R 24W   32L
    }

    function SRCH() {
        // Collect parameters
        var sx = getSX();
        var sy = getSY();
        var fc = getFC();
        var dix = getDIX();
        var eq = !getNEQ();

        //console.log("SRCH sx: " + sx + ", sy: " + sy + ", fc: " + fc + ", eq: " + eq + ", dix: " + dix);

        // Horizontal limits
        if (sx >= imageWidth) sx &= imageWidth - 1;

        // Search boundary X
        var stopX = dix === 1 ? imageWidth : -1;

        // Perform operation
        var x = sx, found = false;
        if (eq)
            do {
                if (normalPGET(x, sy) === fc) {
                    found = true; break;
                }
                x = x + dix;
            } while (x !== stopX);
        else
            do {
                if (normalPGET(x, sy) !== fc) {
                    found = true; break;
                }
                x = x + dix;
            } while (x !== stopX);

        v9990.setStatusBD(found);
        setBX(x);

        // No registers changed

        start(null, Math.abs(x - sx) + 1, 1);      // 86R  50L estimated
    }

    function PSET() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var fc = getFC();
        var op = getLOP();

        //console.log("PSET dx: " + dx + ", dy: " + dy);

        // Horizontal limits
        if (dx >= imageWidth) dx &= imageWidth - 1;

        logicalPSET(dx, dy, fc, op);

        // No registers changed

        start(null, 0, 1);      // 40 total estimated
    }

    function POINT() {
        // Collect parameters
        var sx = getSX();
        var sy = getSY();

        //console.log("POINT sx: " + sx + ", sy: " + sy);

        // Horizontal limits
        if (sx >= imageWidth) sx &= imageWidth - 1;

        var cd = normalPGET(sx, sy);

        // Final registers state
        readData = cd;

        start(null, 0, 1);      // 40 total estimated
    }

    function STOP() {

        // console.log("STOP: " + (writeHandler && writeHandler.name));

        finish(true);
        // SDSnatcher Melancholia fix: TR not reset when command ends
    }

    function normalPGET(x, y) {
        var shift, mask;
        switch (typeBPP) {
            case 16:
                x <<= 1;
                // Perform operation
                var pos = (y * imageWidthBytes + x) & VRAM_LIMIT;
                return vram[pos] | (vram[pos + 1] << 8);
            case 8:
                shift = 0; mask = 0xff;
                break;
            case 4:
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; mask = 0x0f << shift;
                break;
            case 2:
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; mask = 0x03 << shift;
                break;
        }
        // Perform operation
        pos = (y * imageWidthBytes + x) & VRAM_LIMIT;
        return (vram[pos] & mask) >> shift;
    }

    function logicalPSET(x, y, sc, op) {
        var shift, mask;
        switch (typeBPP) {
            case 16:
                x <<= 1;
                // Perform operation
                var pos = (y * imageWidthBytes + x) & VRAM_LIMIT;
                var dc = vram[pos] | (vram[pos + 1] << 8);
                var wc = op(dc, sc, 0xffff);
                vram[pos] = wc & 0xff;
                vram[pos + 1] = wc >> 8;
                return;
            case 8: default:
                mask = 0xff;
                break;
            case 4:
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; sc = (sc & 0x0f) << shift; mask = 0x0f << shift;
                break;
            case 2:
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; sc = (sc & 0x03) << shift; mask = 0x03 << shift;
                break;
        }

        // Perform operation
        pos = (y * imageWidthBytes + x) & VRAM_LIMIT;
        vram[pos] = op(vram[pos], sc, mask);
    }

    function logicalPCOPY(dx, dy, sx, sy, op) {
        var sShift, dShift, mask;
        switch (typeBPP) {
            case 16:
                sx <<= 1; dx <<= 1;
                // Perform operation
                var sPos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
                var dPos = (dy * imageWidthBytes + dx) & VRAM_LIMIT;
                var sc = vram[sPos] | (vram[sPos + 1] << 8);
                var dc = vram[dPos] | (vram[dPos + 1] << 8);
                var wc = op(dc, sc, 0xffff);
                vram[dPos] = wc & 0xff;
                vram[dPos + 1] = wc >> 8;
                return;
            case 8:
                sShift = dShift = 0;
                mask = 0xff;
                break;
            case 4:
                sShift = (sx & 0x1) ? 0 : 4; dShift = (dx & 0x1) ? 0 : 4;
                sx >>>= 1; dx >>>= 1; mask = 0x0f;
                break;
            case 2:
                sShift = (3 - (sx & 0x3)) * 2; dShift = (3 - (dx & 0x3)) * 2;
                sx >>>= 2; dx >>>= 2; mask = 0x03;
                break;
        }

        // Perform operation
        sPos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
        dPos = (dy * imageWidthBytes + dx) & VRAM_LIMIT;
        sc = ((vram[sPos] >> sShift) & mask) << dShift;
        vram[dPos] = op(vram[dPos], sc, mask << dShift);
    }



    function lopNULL(dest, src, mask) {
        return (dest & ~mask);
    }

    function lopNOR(dest, src, mask) {
        return (dest & ~mask) | (~(dest | src) & mask);
    }

    function lopEXD(dest, src, mask) {
        return dest & (dest & ~src);
    }

    function lopNOTS(dest, src, mask) {
        return (dest & ~mask) | (~src & mask);
    }

    function lopEXS(dest, src, mask) {
        return (dest & ~mask) | (src & ~dest);
    }

    function lopNOTD(dest, src, mask) {
        return (dest & ~mask) | (~dest & mask);
    }

    function lopXOR(dest, src, mask) {
        return dest ^ src;
    }

    function lopNAND(dest, src, mask) {
        return (dest & ~mask) | (~(dest & src) & mask);
    }

    function lopAND(dest, src, mask) {
        return dest & (src | ~mask);
    }

    function lopEQV(dest, src, mask) {
        return (dest & ~mask) | (~(dest ^ src) & mask);
    }

    function lopD(dest, src, mask) {
        return dest;
    }

    function lopNEXS(dest, src, mask) {
        return (dest & ~mask) | ((~src | dest) & mask);
    }

    function lopS(dest, src, mask) {
        return (dest & ~mask) | src;
    }

    function lopNEXD(dest, src, mask) {
        return dest | ((~dest | src) & mask);
    }

    function lopOR(dest, src, mask) {
        return dest | src;
    }

    function lopID(dest, src, mask) {
        return dest | mask;
    }

    function lopTNULL(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask);
    }

    function lopTNOR(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~(dest | src) & mask);
    }

    function lopTEXD(dest, src, mask) {
        return src === 0 ? dest : dest & (dest & ~src);
    }

    function lopTNOTS(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~src & mask);
    }

    function lopTEXS(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (src & ~dest);
    }

    function lopTNOTD(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~dest & mask);
    }

    function lopTXOR(dest, src, mask) {
        return src === 0 ? dest : dest ^ src;
    }

    function lopTNAND(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~(dest & src) & mask);
    }

    function lopTAND(dest, src, mask) {
        return src === 0 ? dest : dest & (src | ~mask);
    }

    function lopTEQV(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~(dest ^ src) & mask);
    }

    function lopTD(dest, src, mask) {
        return src === 0 ? dest : dest;
    }

    function lopTNEXS(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | ((~src | dest) & mask);
    }

    function lopTS(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | src;
    }

    function lopTNEXD(dest, src, mask) {
        return src === 0 ? dest : dest | ((~dest | src) & mask);
    }

    function lopTOR(dest, src, mask) {
        return src === 0 ? dest : dest | src;
    }

    function lopTID(dest, src, mask) {
        return src === 0 ? dest : dest | mask;
    }




    function min(a, b) {
        return a < b ? a : b;
    }

    function max(a, b) {
        return a > b ? a : b;
    }

    function start(timing, pixels, lines, infinite) {
        CE = 1;
        v9990.setStatusCE(CE);
        writeHandler = null;
        readHandler = null;
        estimateDuration(timing, pixels, lines, infinite);
    }

    function estimateDuration(timing, pixels, lines, infinite) {
        if (infinite)
            finishingCycle = -1;    // infinite
        else if (!timing || turboClockMulti === 0) {
            finishingCycle = 0;     // instantaneous
            finish();
        } else {
            var bppInfo = timing[modeData.cmdTiming][dispAndSpritesMode];
            var pixelsPerFrame = bppInfo[typeBPP] || bppInfo;
            var cyclesPerPixel = BASE_CLOCK / 50 / 256 / pixelsPerFrame;                                                // / 50 / 256 because timing is for 256 pixel blocks per PAL frame
            var duration = ((pixels * cyclesPerPixel * COMMAND_PER_PIXEL_DURATION_FACTOR) / turboClockMulti) | 0;       // no cycles per line info available
            finishingCycle = v9990.updateCycles() + duration;

            // Instantaneous
            // finishingCycle = 0;
            // finish();

            //console.log ("+++++ Duration: " + duration);
        }
    }

    function writeStart(handler) {
        start(null, 0, 0, true);      // Commands driven by CPU writes do not have a duration and finish when last write is performed

        CX = 0; CY = 0;
        writeHandler = handler;
        writeDataPending = null;
        v9990.setStatusTR(1);

        // Perform first iteration with last written data, only if available
        if (writeReady) {
            writeHandler(getFC());
            writeReady = false;
        }
    }

    function readStart(handler) {
        start(null, 0, 0, true);      // Commands driven by CPU reads do not have a duration and finish when last read is performed

        CX = 0; CY = 0;
        readHandler = handler;
        readDataPending = null;
        v9990.setStatusTR(1);

        // Perform first iteration
        readHandler();
    }

    function finish(stop) {
        CE = 0;
        v9990.setStatusCE(CE);
        if (!stop) v9990.triggerCommandCompletionInterrupt();
        writeHandler = null;
        writeReady = false;
        writeDataPending = null;
        readDataPending = null;
        readHandler = null;

        //console.log("FINISH");
    }


    var BASE_CLOCK = wmsx.V9990.BASE_CLOCK;

    var VRAM_LIMIT = wmsx.V9990.VRAM_LIMIT;
    var COMMAND_HANDLERS = { HMMCNextWrite: HMMCNextWrite, LMMCNextWrite: LMMCNextWrite, LMCMNextRead: LMCMNextRead };      // Used for savestates
    var COMMAND_PER_PIXEL_DURATION_FACTOR = 1;

    var LOGICAL_OPERATIONS = [
        lopNULL,           // 0000
        lopNOR,            // 0001
        lopEXD,            // 0010
        lopNOTS,           // 0011
        lopEXS,            // 0100
        lopNOTD,           // 0101
        lopXOR,            // 0110
        lopNAND,           // 0111
        lopAND,            // 1000
        lopEQV,            // 1001
        lopD,              // 1010
        lopNEXS,           // 1011
        lopS,              // 1100
        lopNEXD,           // 1101
        lopOR,             // 1110
        lopID,             // 1111
        lopTNULL,          // 0000 + T
        lopTNOR,           // 0001 + T
        lopTEXD,           // 0010 + T
        lopTNOTS,          // 0011 + T
        lopTEXS,           // 0100 + T
        lopTNOTD,          // 0101 + T
        lopTXOR,           // 0110 + T
        lopTNAND,          // 0111 + T
        lopTAND,           // 1000 + T
        lopTEQV,           // 1001 + T
        lopTD,             // 1010 + T
        lopTNEXS,          // 1011 + T
        lopTS,             // 1100 + T
        lopTNEXD,          // 1101 + T
        lopTOR,            // 1110 + T
        lopTID             // 1111 + T
    ];

    // Turbo
    var turboClockMulti = 1;

    // Main V9990 connections
    var v9990, vram, register;

    var CE = 0;
    var SX = 0, SY = 0, DX = 0, DY = 0, NX = 0, NY = 0, ENY = 0, EDX = 0, ESX = 0, DIX = 0, DIY = 0, CX = 0, CY = 0, destPos = 0, LOP;
    var writeReady = false, readData = 0, writeDataPending = null, readDataPending = null, writeHandler = null, readHandler = null;
    var finishingCycle = 0;     // -1: infinite duration, 0: instantaneous, > 0 finish at cycle

    var modeData, typeData;

    var dispAndSpritesMode = 0;  // 0: DISP off, 1: DISP on SPD off, 2: DISP on SPD on

    var typeBPP = 8, colosPPBShift = 0, colorPPBMask = 0;
    var imageWidth = 0, imageHeight = 0, imageWidthMask = 0, imageHeightMask = 0;
    var imageWidthBytes = 0;



    // Timing data for default Base Clock 21MHz (XTAL)
    // Number of 256 pixel blocks transferable in 1 PAL frame for each Mode/Type, BPP, and Sprites ON / Sprites OFF / Display OFF
    // No information available about additional cycles per line. Only per pixel average will be used
    // Therefore => Cycles Per Pixel = BaseClock / 50 / 256 / value

    var LMMVTiming = [
        /* Normal Bitmap  */  [
                /* DISP off SPD --- */  { 2: 0x02d3, 4: 0x0219, 8: 0x0190, 16: 0x00c8 },
                /* DISP on  SPD off */  { 2: 0x02d0, 4: 0x020e, 8: 0x018a, 16: 0x00c7 },
                /* DISP on  SPD on  */  { 2: 0x02ab, 4: 0x01f6, 8: 0x0174, 16: 0x00bc }
        ],
        /* Oversan Bitmap */  [ { 2: 0x01e1, 4: 0x0160, 8: 0x0106, 16: 0x0083 }, { 2: 0x01de, 4: 0x015d, 8: 0x0102, 16: 0x0081 }, { 2: 0x01b9, 4: 0x013b, 8: 0x00e8, 16: 0x0074 } ],
        /* P1 Pattern     */  [ 0x0189, 0x00da, 0x00a7 ],
        /* P2 Pattern     */  [ 0x0210, 0x0140, 0x00fb ]
    ];

    var LMMMTiming = [
        [ { 2: 0x0271, 4: 0x0182, 8: 0x00c1, 16: 0x0060 }, { 2: 0x0271, 4: 0x0178, 8: 0x00bc, 16: 0x005f }, { 2: 0x0242, 4: 0x0161, 8: 0x00b0, 16: 0x0059 } ],
        [ { 2: 0x0199, 4: 0x00f8, 8: 0x007b, 16: 0x003e }, { 2: 0x0192, 4: 0x00f3, 8: 0x0078, 16: 0x003c }, { 2: 0x0169, 4: 0x00d7, 8: 0x006c, 16: 0x0036 } ],
        [ 0x00ba, 0x0068, 0x0050 ],
        [ 0x0173, 0x00d1, 0x00a0 ]
    ];

    var BMLLTiming = [
        [ 0x00c1, 0x00bc, 0x00b1 ],
        [ 0x007b, 0x0078, 0x006b ],
        [ 0x00ba, 0x0067, 0x004f ],
        [ 0x00ba, 0x0067, 0x004f ]
    ];

    var BMXLTiming = [
        [ { 2: 0x0272, 4: 0x0183, 8: 0x00c2, 16: 0x0061 }, { 2: 0x0272, 4: 0x0179, 8: 0x00bd, 16: 0x005f }, { 2: 0x0247, 4: 0x0164, 8: 0x00b1, 16: 0x005a } ],
        [ { 2: 0x01a1, 4: 0x00fa, 8: 0x007d, 16: 0x003e }, { 2: 0x019b, 4: 0x00f3, 8: 0x0079, 16: 0x003c }, { 2: 0x016c, 4: 0x00d8, 8: 0x006c, 16: 0x0036 } ],
        [ 0x00e4, 0x0081, 0x0064 ],
        [ 0x0174, 0x00d2, 0x00a0 ]
    ];

    var BMLXTiming = [
        [ { 2: 0x0271, 4: 0x0182, 8: 0x00c1, 16: 0x0060 }, { 2: 0x0271, 4: 0x0178, 8: 0x00bc, 16: 0x005f }, { 2: 0x0242, 4: 0x0161, 8: 0x00b0, 16: 0x0059 } ],
        [ { 2: 0x0199, 4: 0x00f8, 8: 0x007b, 16: 0x003e }, { 2: 0x0192, 4: 0x00f3, 8: 0x0078, 16: 0x003c }, { 2: 0x0169, 4: 0x00d7, 8: 0x006c, 16: 0x0036 } ],
        [ 0x00c3, 0x0073, 0x005a ],
        [ 0x0173, 0x00d1, 0x00a0 ]
    ];


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ce: CE,
            wr: writeReady, wh: writeHandler && writeHandler.name, rh: readHandler && readHandler.name, fc: finishingCycle,
            SX: SX, SY: SY, DX: DX, DY: DY, NX: NX, NY: NY, ENY: ENY,
            DIX: DIX, DIY: DIY, CX: CX, CY: CY, LOP: LOP && LOGICAL_OPERATIONS.indexOf(LOP), dp: destPos,
            tcm: turboClockMulti
        };
    };

    this.loadState = function(s) {
        CE = s.ce;
        writeReady = s.wr; writeHandler = COMMAND_HANDLERS[s.wh]; readHandler = COMMAND_HANDLERS[s.rh]; finishingCycle = s.fc;
        SX = s.SX; SY = s.SY; DX = s.DX; DY = s.DY; NX = s.NX; NY = s.NY; ENY = s.ENY;
        DIX = s.DIX; DIY = s.DIY; CX = s.CX; CY = s.CY; LOP = s.LOP >= 0 ? LOGICAL_OPERATIONS[s.LOP] : undefined; destPos = s.dp;
        turboClockMulti = s.tcm !== undefined ? s.tcm : 1;
    };


    this.eval = function(str) {
        return eval(str);
    };

};


/*

                     RAW DATA PAL                     CODE 42MHz                     COMPUTED 42MHz

                LMMM BMLL BMXL BMLX LMMV       LMMM BMLL BMXL BMLX LMMV         LMMM BMLL BMXL BMLX LMMV
S1    BX  2bpp: 0242 00b1 0247 0242 02ab          6   20    6    6    5
S0    BX  2bpp: 0271 00bc 0272 0271 02d0          5   18    5    5    5
D0    BX  2bpp: 0271 00c1 0272 0271 02d3          5   18    5    5    5

                LMMM BMLL BMXL BMLX LMMV       LMMM BMLL BMXL BMLX LMMV         LMMM BMLL BMXL BMLX LMMV
      BX  4bpp: 0161 00b1 0164 0161 01f6         10   20   10   10    7          9.5   19  9.4  9.5  6.7
      BX  4bpp: 0178 00bc 0179 0178 020e          9   18    9    9    6          8.9 17.6  8.9  8.9  6.4
      BX  4bpp: 0182 00c1 0183 0182 0219          9   18    9    9    6          8.7 17.4  8.7  8.7  6.2

                LMMM BMLL BMXL BMLX LMMV       LMMM BMLL BMXL BMLX LMMV         LMMM BMLL BMXL BMLX LMMV
      BX  8bpp: 00b0 00b0 00b1 00b0 0174         20   20   20   20    9
      BX  8bpp: 00bc 00bc 00bd 00bc 018a         18   18   18   18    8
      BX  8bpp: 00c1 00c1 00c2 00c1 0190         17   18   17   17    8

                LMMM BMLL BMXL BMLX LMMV       LMMM BMLL BMXL BMLX LMMV         LMMM BMLL BMXL BMLX LMMV
      BX  16pp: 0059 00b3 005a 0059 00bc         39   20   39   39   18
      BX 16bpp: 005f 00be 005f 005f 00c7         35   18   35   35   17
      BX 16bpp: 0060 00c1 0061 0060 00c8         35   18   35   35   17


                LMMM BMLL BMXL BMLX LMMV       LMMM BMLL BMXL BMLX LMMV         LMMM BMLL BMXL BMLX LMMV
          P1    0050 004f 0064 005a 00a7        115  118   85   84   56         41.9 42.5 33.6 37.3 20.1
          P1    0068 0067 0081 0073 00da         52   52   41   44   25         32.3 32.6   26 29.2 15.4
          P1    00ba 00ba 00e4 00c3 0189         18   18   14   17    9           18   18 14.7 17.2  8.5

                LMMM BMLL BMXL BMLX LMMV       LMMM BMLL BMXL BMLX LMMV         LMMM BMLL BMXL BMLX LMMV
          P2    00a0 004f 00a0 00a0 00fb         57  118   57   57   28           21 42.5   21   21 13.4
          P2    00d1 0067 00d2 00d1 0140         25   52   25   25   15         16.1 32.6   16 16.1 10.5
          P2    0173 00ba 0174 0173 0210          9   18    9    9    6            9   18    9    9  6.4


    var LMMVCyclesPP = {
        BX: { S1: { 2: 5, 4: 7, 8: 9, 16: 18 }, S0: { 2: 5, 4: 6, 8: 8, 16: 17 }, D0: { 2: 5, 4: 6, 8: 8, 16: 17 } },
        P1: { S1: 56, S0: 25, D0: 9 },
        P2: { S1: 28, S0: 15, D0: 6 }
    };

    var LMMMCyclesPP = {
        BX: { S1: { 2: 6, 4: 10, 8: 20, 16: 39 }, S0: { 2: 5, 4: 9, 8: 18, 16: 35 }, D0: { 2: 5, 4: 9, 8: 17, 16: 35 } },
        P1: { S1: 115, S0: 52, D0: 18 },
        P2: { S1:  57, S0: 25, D0:  9 }
    };

    var BMLLCyclesPP = {
        BX: { S1:  20, S0: 18, D0: 18 },
        P1: { S1: 118, S0: 52, D0: 18 },
        P2: { S1: 118, S0: 52, D0: 18 }
    };

    var BMXLCyclesPP = {
        BX: { S1: { 2: 6, 4: 10, 8: 20, 16: 39 }, S0: { 2: 5, 4: 9, 8: 18, 16: 35 }, D0: { 2: 5, 4: 9, 8: 17, 16: 35 } },
        P1: { S1: 85, S0: 41, D0: 14 },
        P2: { S1: 57, S0: 25, D0:  9 }
    };

    var BMLXCyclesPP = {
        BX: { S1: { 2: 6, 4: 10, 8: 20, 16: 39 }, S0: { 2: 5, 4: 9, 8: 18, 16: 35 }, D0: { 2: 5, 4: 9, 8: 17, 16: 35 } },
        P1: { S1: 84, S0: 44, D0: 17 },
        P2: { S1: 57, S0: 25, D0:  9 }
    };

*/

