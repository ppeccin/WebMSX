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
                // console.log(">>>> V9990 Command: " + val.toString(16));
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

    this.setV9990ModeData = function(pModeData, pTypeData, pImageWidth, pImageHeight) {
        modeData = pModeData;
        typeData = pTypeData;
        imageWidth = pImageWidth;
        imageWidthMask = pImageWidth - 1;
        imageHeight = pImageHeight;
        imageHeightMask = pImageHeight - 1;
        imageWidthBytes = (imageWidth * typeData.bpp) >> 3;
        colorPPB = typeData.ppb;

        // ???
        colosPPBShift = colorPPB >> 1;
        colorPPBMask = ~0 << colosPPBShift;
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

        if (writeDataPending === null) return writeDataPending = cd;

        var sc = (cd << 8) | writeDataPending;
        writeDataPending = null;

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

        start(nx * ny, 72 + 24, ny, 64);      // 72R 24W   64L
    }

    function LMCM() {
        // Collect parameters
        SX = getSX();
        SY = getSY();
        NX = getNX();
        NY = getNY();
        DIX = getDIX();
        DIY = getDIY();

        console.log("LMCM START x: " + SX + ", y: " + SY + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        ESX = SX;

        readStart(LMCMNextRead);
    }

    function LMCMNextRead() {
        readData = normalPGET(ESX, SY);

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

        start(nx * ny, 64 + 32 + 24, ny, 64);      // 64R 32R 24W   64L
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

        start(nx * eny, 40 + 24, eny, 0);     	//  40R  24W   0L
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

        start(nx * eny, 64 + 24, eny, 64);      	//  64R 24W   64L
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

        start(nx * eny, 48, eny, 56);     	//  48W   56L
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

        start(n, 88 + 24, nMinor, 32);      // 88R 24W   32L
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

        start(Math.abs(x - sx) + 1, 86, 1, 50);      // 86R  50L estimated
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

        start(0, 0, 1, 40);      // 40 total estimated
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

        start(0, 0, 1, 40);      // 40 total estimated
    }

    function STOP() {

        // console.log("STOP: " + (writeHandler && writeHandler.name));

        finish(true);
        // SDSnatcher Melancholia fix: TR not reset when command ends
    }

    function normalPGET(x, y) {
        var shift, mask;
        switch (colorPPB) {
            case 2:
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; mask = 0x0f << shift; break;
            case 4:
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; mask = 0x03 << shift; break;
            default:  // including 1
                shift = 0; mask = 0xff;
        }
        // Perform operation
        var pos = (y * imageWidthBytes + x) & VRAM_LIMIT;
        return (vram[pos] & mask) >> shift;
    }

    function logicalPSET(x, y, co, op) {
        var shift, mask;
        switch (colorPPB) {
            case 0: // 16bbp
                x <<= 1;
                // Perform operation
                var pos = (y * imageWidthBytes + x) & VRAM_LIMIT;
                var val = op(vram[pos] | (vram[pos + 1] << 8), co, 0xffff);
                vram[pos] = val & 0xff;
                vram[pos + 1] = val >> 8;
                break;
            case 2: // 4bpp
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; co = (co & 0x0f) << shift; mask = 0x0f << shift; break;
            case 4: // 2bpp
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; co = (co & 0x03) << shift; mask = 0x03 << shift; break;
            default: // including 1, 8bpp and 6bpp
                mask = 0xff;
        }

        // Perform operation
        pos = (y * imageWidthBytes + x) & VRAM_LIMIT;
        vram[pos] = op(vram[pos], co, mask);
    }

    function logicalPCOPY(dx, dy, sx, sy, op) {
        var sShift, dShift, mask;
        switch (colorPPB) {
            case 0: // 16bbp
                sx <<= 1; dx <<= 1;
                // Perform operation
                var sPos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
                var dPos = (dy * imageWidthBytes + dx) & VRAM_LIMIT;
                var sc = vram[sPos] | (vram[sPos + 1] << 8);
                var dc = vram[dPos] | (vram[dPos + 1] << 8);
                var wc = op(dc, sc, 0xffff);
                vram[dPos] = wc & 0xff;
                vram[dPos + 1] = wc >> 8;
                break;
            case 2: // 4bpp
                sShift = (sx & 0x1) ? 0 : 4; dShift = (dx & 0x1) ? 0 : 4;
                sx >>>= 1; dx >>>= 1; mask = 0x0f; break;
            case 4: // 2bpp
                sShift = (3 - (sx & 0x3)) * 2; dShift = (3 - (dx & 0x3)) * 2;
                sx >>>= 2; dx >>>= 2; mask = 0x03; break;
            default: // including 1, 8bpp and 6bpp
                sShift = dShift = 0;
                mask = 0xff;
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

    function start(pixels, cyclesPerPixel, lines, cyclesPerLine, infinite) {
        v9990.setStatusCE(1);
        writeHandler = null;
        readHandler = null;
        estimateDuration(pixels, cyclesPerPixel, lines, cyclesPerLine, infinite);
    }

    function estimateDuration(pixels, cyclesPerPixel, lines, cyclesPerLine, infinite) {
        if (infinite)
            finishingCycle = -1;    // infinite
        else if (turboClockMulti === 0) {
            finishingCycle = 0;     // instantaneous
            finish();
        } else {
            var duration = ((pixels * cyclesPerPixel * COMMAND_PER_PIXEL_DURATION_FACTOR + lines * cyclesPerLine) / turboClockMulti) | 0;
            finishingCycle = v9990.updateCycles() + duration;

            // TODO V9990: Command duration. Instantaneous for now
            finishingCycle = 0;
            finish();

            //console.log ("+++++ Duration: " + duration);
        }
    }

    function writeStart(handler) {
        start(0, 0, 0, 0, true);      // Commands driven by CPU writes do not have a duration and finish when last write is performed

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
        start(0, 0, 0, 0, true);      // Commands driven by CPU reads do not have a duration and finish when last read is performed

        CX = 0; CY = 0;
        readHandler = handler;
        v9990.setStatusTR(1);

        // Perform first iteration
        readHandler();
    }

    function finish(stop) {
        v9990.setStatusCE(0);
        if (!stop) v9990.triggerCommandCompletionInterrupt();
        writeHandler = null;
        writeReady = false;
        writeDataPending = null;
        readHandler = null;

        //console.log("FINISH");
    }


    var VRAM_LIMIT = wmsx.V9990.VRAM_LIMIT;
    var COMMAND_HANDLERS = { HMMCNextWrite: HMMCNextWrite, LMMCNextWrite: LMMCNextWrite, LMCMNextRead: LMCMNextRead };      // Used for savestates
    var COMMAND_PER_PIXEL_DURATION_FACTOR = 1.1;

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

    var SX = 0, SY = 0, DX = 0, DY = 0, NX = 0, NY = 0, ENY = 0, EDX = 0, ESX = 0, DIX = 0, DIY = 0, CX = 0, CY = 0, destPos = 0, LOP;
    var writeReady = false, readData = 0, writeDataPending = null, writeHandler = null, readHandler = null;
    var finishingCycle = 0;     // -1: infinite duration, 0: instantaneous, > 0 finish at cycle

    var modeData, typeData;
    var colorPPB = 0, colosPPBShift = 0, colorPPBMask = 0;
    var imageWidth = 0, imageHeight = 0, imageWidthMask = 0, imageHeightMask = 0;
    var imageWidthBytes = 0;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            wr: writeReady, wh: writeHandler && writeHandler.name, rh: readHandler && readHandler.name, fc: finishingCycle,
            SX: SX, SY: SY, DX: DX, DY: DY, NX: NX, NY: NY, ENY: ENY,
            DIX: DIX, DIY: DIY, CX: CX, CY: CY, LOP: LOP && LOGICAL_OPERATIONS.indexOf(LOP), dp: destPos,
            tcm: turboClockMulti
        };
    };

    this.loadState = function(s) {
        writeReady = s.wr; writeHandler = COMMAND_HANDLERS[s.wh]; readHandler = COMMAND_HANDLERS[s.rh]; finishingCycle = s.fc;
        SX = s.SX; SY = s.SY; DX = s.DX; DY = s.DY; NX = s.NX; NY = s.NY; ENY = s.ENY;
        DIX = s.DIX; DIY = s.DIY; CX = s.CX; CY = s.CY; LOP = s.LOP >= 0 ? LOGICAL_OPERATIONS[s.LOP] : undefined; destPos = s.dp;
        turboClockMulti = s.tcm !== undefined ? s.tcm : 1;
    };


    this.eval = function(str) {
        return eval(str);
    };

};
