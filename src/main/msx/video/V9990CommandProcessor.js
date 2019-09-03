// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Commands perform all operation instantaneously at the first cycle. Duration is estimated
// All color values and write mask, i.e. FC, BC and WM (also SC, DC, WC) are processed as BIG-ENDIAN (high byte first). So FC, BC and WM are read from registers and get H/L bytes swapped
// This is done so universally FC can be consumed L byte first then H byte in painting commands, associating higher bits of FC with lower X positions directly
// Could be improved a lot if we actually perform all operations in 16 bits...

wmsx.V9990CommandProcessor = function() {
"use strict";

    var self = this;

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
            case 0x80:
                BMXL(); break;
            case 0x90:
                BMLX(); break;
            case 0xa0:
                BMLL(); break;
            case 0xb0:
                LINE(); break;
            case 0xc0:
                SRCH(); break;
            case 0xd0:
                POINT(); break;
            case 0xe0:
                PSET(); break;
            case 0xf0:
                ADVN(); break;
            default:
                // console.log(">>>> V9990 Command: " + val.toString(16) + ". DispSprites: " + dispAndSpritesMode);
                // wmsx.Util.error("Unsupported V9938 Command: " + val.toString(16));
        }
    };

    this.cpuWrite = function(val) {
        if (writeHandler) writeHandler(val);
        else v9990.setStatusTR(0);
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
        isP1 = pModeData.name === "P1";

        // ???
        colosPPBShift = typeData.ppB >> 1;
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
    function setSX(val) {
        val = (getSX() & ~imageWidthMask) | (val & imageWidthMask);
        register[33] = (val >> 8) & 0x0f; register[32] = val & 0xff;
    }

    function getSY() {
        return (((register[35] & 0x0f) << 8) | register[34]) & imageHeightMask;
    }
    function setSY(val) {
        val = (getSY() & ~imageHeightMask) | (val & imageHeightMask);
        register[35] = (val >> 8) & 0x0f; register[34] = val & 0xff;
    }

    function getSYP1Offset() {
        return isP1 && (register[33] & 0x02) ? 2048 : 0;        // SX9 bit in P1 mode -> start at Plane B
    }

    function getSA() {
        return ((register[35] & 0x07) << 16) | (register[34] << 8) | register[32];
    }
    function setSA(val) {
        register[35] = (val >> 16) & 0x07; register[34] = (val >> 8) & 0xff; register[32] = val & 0xff;
    }

    function getDX() {
        return (((register[37] & 0x07) << 8) | register[36]) & imageWidthMask;
    }
    function setDX(val) {
        val = (getDX() & ~imageWidthMask) | (val & imageWidthMask);
        register[37] = (val >> 8) & 0x07; register[36] = val & 0xff;
    }

    function getDY() {
        return (((register[39] & 0x0f) << 8) | register[38]) & imageHeightMask;
    }
    function setDY(val) {
        val = (getDY() & ~imageHeightMask) | (val & imageHeightMask);
        register[39] = (val >> 8) & 0x0f; register[38] = val & 0xff;
    }

    function getDYP1Offset() {
        return isP1 && (register[37] & 0x02) ? 2048 : 0;        // DX9 bit in P1 mode -> start at Plane B
    }

    function getDA() {
        return ((register[39] & 0x07) << 16) | (register[38] << 8) | register[36];
    }
    function setDA(val) {
        register[39] = (val >> 16) & 0x07; register[38] = (val >> 8) & 0xff; register[36] = val & 0xff;
    }

    function getNX() {
        return (((register[41] & 0x07) << 8) | register[40]) || 2048;
    }

    function getNY() {
        return (((register[43] & 0x0f) << 8) | register[42]) || 4096;
    }

    function getNA() {
        return (((register[43] & 0x07) << 16) | (register[42] << 8) | register[40]) || 524288;
    }

    function getMJ() {
        return ((register[41] & 0x0f) << 8) | register[40];
    }

    function getMI() {
        return ((register[43] & 0x0f) << 8) | register[42];
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

    function getWM(yP1Offset) {
        // return (register[46] << 8) | register[47];   // WM H/L swapped
        return isP1
            ? yP1Offset === 0
                ? (register[46] << 8) | register[46]    // Always High byte for VRAM0
                : (register[47] << 8) | register[47]    // Always Low byte for VRAM1
            : (register[46] << 8) | register[47];       // All 16 bits range
    }

    function getWMForAddr(wm, pos) {
        return (pos & 1) ? wm & 0xff : wm >> 8;         // WM H/L is swapped, so Low byte is for ODD addr
    }

    function getFC(yP1Offset) {
        // return (register[48] << 8) | register[49];   // FC H/L swapped
        return isP1
            ? yP1Offset === 0
                ? (register[48] << 8) | register[48]    // Only High byte for VRAM0
                : (register[49] << 8) | register[49]    // Only Low byte for VRAM1
            : (register[48] << 8) | register[49];       // All 16 bits range
    }

    function getAYME() {
        return (register[52] >> 2) & 0x03;
    }

    function getAXME() {
        return register[52] & 0x03;
    }

    function setBX(val) {
        register[54] = val >> 8; register[53] = val & 0xff;
    }

    function LMMC() {
        // Collect parameters
        DX = getDX();
        DYP1Off = getDYP1Offset();
        DY = getDY();
        NX = getNX();
        NY = getNY();
        DIX = getDIX();
        DIY = getDIY();
        LOP = getLOP();
        WM = getWM(DYP1Off);

        // console.log("LMMC START x: " + DX + ", y: " + DY + " + " + DYP1Off + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        EDX = DX;
        CX = 0; CY = 0;
        SX = 0;

        writeStart(LMMCNextWrite);
    }

    function LMMCNextWrite(cd) {
        // console.log("LMMC Write CX: " + CX + ", CY: " + CY);

        switch (typeBPP) {
            case 16:
                if (writeDataPending === null)
                    writeDataPending = cd;
                else {
                    LMMCNextPixel((writeDataPending << 8) | cd);      // SC has H/L bytes swapped
                    writeDataPending = null;
                }
                break;
            case 8:
                LMMCNextPixel((cd << 8) | cd);
                break;
            case 4:
                cd |= cd << 8;
                LMMCNextPixel(cd);
                if (CE) LMMCNextPixel(cd);
                break;
            case 2:
                cd |= cd << 8;
                LMMCNextPixel(cd);
                if (CE) LMMCNextPixel(cd);
                if (CE) LMMCNextPixel(cd);
                if (CE) LMMCNextPixel(cd);
                break;
        }

        // Set changed register state after finishing
        if (!CE) {
            setDY(DY);
            v9990.setStatusTR(0);
        }
    }

    function LMMCNextPixel(sc) {      // sc is 16 bits
        // console.log("LMMC Put CX: " + CX + ", CY: " + CY);

        logicalPSETX(EDX, DY | DYP1Off, SX, sc, LOP, WM);

        ++CX; ++SX;
        if (CX >= NX) {
            EDX = DX;
            CX = 0; ++CY; DY = (DY + DIY) & imageHeightMask;
            if (CY >= NY) {
                finish();
            }
        } else {
            EDX = (EDX + DIX) & imageWidthMask;
        }
    }

    function LMMV() {
        // Collect parameters
        var dx = getDX();
        var dyP1Off = getDYP1Offset();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();
        var wm = getWM(dyP1Off);
        var fc = getFC(dyP1Off);

        // console.log("LMMV dx: " + dx + ", dy: " + dy + " + " + dyP1Off + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", fc: " + fc.toString(16));

        // Perform operation
        for (var cy = ny; cy > 0; --cy) {
            var edx = dx;
            for (var cx = 0; cx < nx; ++cx) {
                logicalPSETX(edx, dy | dyP1Off, edx, fc, op, wm);
                edx = (edx + dix) & imageWidthMask;
            }
            dy = (dy + diy) & imageHeightMask;
        }

        // Set changed register state after finishing
        setDY(dy);

        start(LMMVTiming, nx * ny, ny);
    }

    function LMCM() {
        // Collect parameters
        SX = getSX();
        SYP1Off = getSYP1Offset();
        SY = getSY();
        NX = getNX();
        NY = getNY();
        DIX = getDIX();
        DIY = getDIY();

        // console.log("LMCM START x: " + SX + ", y: " + SY + " + " + SYP1Off + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        ESX = SX;
        CX = 0; CY = 0;

        readStart(LMCMNextRead);
    }

    function LMCMNextRead() {
        switch (typeBPP) {
            case 16:
                if (readDataPending === null) {
                    readDataPending = LMCMNextPixel(0);        // SC has H/L bytes swapped
                    readData = readDataPending >> 8;
                } else {
                    readData = readDataPending & 0xff;
                    readDataPending = null;
                }
                break;
            case 8:
                readData = LMCMNextPixel(1);
                break;
            case 4:
                readData = (readData & 0x0f) | LMCMNextPixel(2);
                if (CE) readData = (readData & 0xf0) | LMCMNextPixel(3);
                break;
            case 2:
                readData = (readData & 0x3f) | LMCMNextPixel(4);
                if (CE) readData = (readData & 0xcf) | LMCMNextPixel(5);
                if (CE) readData = (readData & 0xf3) | LMCMNextPixel(6);
                if (CE) readData = (readData & 0xfc) | LMCMNextPixel(7);
                break;
        }

        // Set changed register state after finishing
        if (!CE) {
            setSY(SY);
            v9990.setStatusTR(0);
        }
    }

    function LMCMNextPixel(dx) {
        var sc = normalPGETX(ESX, SY | SYP1Off, dx);

        ++CX;
        if (CX >= NX) {
            ESX = SX;
            CX = 0; ++CY; SY = (SY + DIY) & imageHeightMask;
            if (CY >= NY) finish();
        } else {
            ESX = (ESX + DIX) & imageWidthMask;
        }

        return sc;
    }

    function LMMM() {
        // Collect parameters
        var sx = getSX();
        var syP1Off = getSYP1Offset();
        var sy = getSY();
        var dx = getDX();
        var dyP1Off = getDYP1Offset();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();
        var wm = getWM(dyP1Off);

        // console.log("LMMM sx: " + sx + ", sy: " + sy + " + " + syP1Off + ", dx: " + dx + ", dy: " + dy + " + " + dyP1Off + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", op: " + op.name);

        // Perform operation
        for (var cy = ny; cy > 0; --cy) {
            var esx = sx, edx = dx;
            for (var cx = nx; cx > 0; --cx) {
                logicalPCOPYXX(edx, dy | dyP1Off, esx, sy | syP1Off, op, wm);
                esx = (esx + dix) & imageWidthMask; edx = (edx + dix) & imageWidthMask;
            }
            sy = (sy + diy) & imageHeightMask; dy = (dy + diy) & imageHeightMask;
        }

        // Set changed register state after finishing
        setSY(sy);
        setDY(dy);

        start(LMMMTiming, nx * ny, ny);
    }

    function BMXL() {
        // Collect parameters
        var sa = getSA();
        var dx = getDX();
        var dyP1Off = getDYP1Offset();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();
        var wm = getWM(dyP1Off);

        // console.log("BMXL sa: " + sa.toString(16) + ", dx: " + dx + ", dy: " + dy + " + " + dyP1Off + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

        // Perform operation
        var sc = 0;
        var sx = 0, cb = 0;                 // cb counts bits per pixel
        for (var cy = ny; cy > 0; --cy) {
            var edx = dx;
            for (var cx = 0; cx < nx; ++cx) {
                // Only read when new BYTE(s) needed
                if ((cb & 0x07) === 0) {
                    if (typeData === 16) { sc = (vram[sa] << 8) | vram[sa + 1]; sa = (sa + 2) & VRAM_LIMIT; }
                    else                 { sc = vram[sa]; sc |= sc << 8;        sa = (sa + 1) & VRAM_LIMIT; }
                }
                logicalPSETX(edx, dy | dyP1Off, sx, sc, op, wm);
                edx = (edx + dix) & imageWidthMask; ++sx; cb += typeBPP;
            }
            dy = (dy + diy) & imageHeightMask;
        }

        // Set changed register state after finishing
        setSA(sa);
        setDY(dy);

        start(BMXLTiming, nx * ny, ny);
    }

    function BMLX() {
        // Collect parameters
        var sx = getSX();
        var syP1Off = getSYP1Offset();
        var sy = getSY();
        var da = getDA();
        var nx = getNX();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();
        var wm = getWM(0);

        // console.log("BMLX sx: " + sx + ", sy: " + sy + " + " + syP1Off + ", da: " + da.toString(16) + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", op: " + op.name);

        // Perform operation
        var dx = 0, cb = 0;                     // cb counts bits per pixel
        for (var cy = ny; cy > 0; --cy) {
            var esx = sx;
            for (var cx = nx; cx > 0; --cx) {
                logicalPCOPYLX((da + (cb >> 3)) & VRAM_LIMIT, dx, esx, sy | syP1Off, op, wm);
                esx = (esx + dix) & imageWidthMask; ++dx; cb += typeBPP;
            }
            sy = (sy + diy) & imageHeightMask;
        }

        // Set changed register state after finishing
        setSY(sy);
        setDA(da);

        start(BMLXTiming, nx * ny, ny);
    }

    function BMLL() {
        // Collect parameters
        var sa = getSA();
        var da = getDA();
        var na = getNA();
        var dix = getDIX();
        var op = getLOP();
        var wm = getWM(0);

        // console.log("BMLL sa: " + sa.toString(16) + ", da: " + da.toString(16) + ", na: " + na + ", dix: " + dix + ", op: " + op.name);

        // Perform operation
        for (var c = na; c > 0; --c) {
            logicalPCOPYLL(da, sa, op, wm);
            sa = (sa + dix) & VRAM_LIMIT; da = (da + dix) & VRAM_LIMIT;
        }

        // Set changed register state after finishing
        setSA(sa);
        setDA(da);

        start(BMLLTiming, na, 0);
    }

    function LINE() {
        // Collect parameters
        var dx = getDX();
        var dyP1Off = getDYP1Offset();
        var dy = getDY();
        var mj = getMJ();
        var mi = getMI();
        var dix = getDIX();
        var diy = getDIY();
        var maj = getMAJ();
        var op = getLOP();
        var wm = getWM(dyP1Off);
        var fc = getFC(dyP1Off);

        // console.log("LINE dx: " + dx + ", dy: " + dy + " + " + dyP1Off + ", mj: " + mj + ", mi: " + mi + ", dix: " + dix + ", diy: " + diy + ", maj: " + maj + ", fc: " + fc.toString(16)  + ", wm: " + wm.toString(16));

        // Timming control
        var nMinor = 0;

        // Perform operation
        var e = 0;
        if (maj === 0) {
            for (var n = mj; n > 0; --n) {
                logicalPSETX(dx, dy | dyP1Off, dx, fc, op, wm);
                dx = (dx + dix) & imageWidthMask;
                if (mi > 0) {
                    e += mi;
                    if ((e << 1) >= mj) {
                        dy = (dy + diy) & imageHeightMask; e -= mj; ++nMinor;
                    }
                }
            }
        } else {
            for (n = mj; n > 0; --n) {
                logicalPSETX(dx, dy | dyP1Off, dx, fc, op, wm);
                dy = (dy + diy) & imageHeightMask;
                if (mi > 0) {
                    e += mi;
                    if ((e << 1) >= mj) {
                        dx = (dx + dix) & imageWidthMask; e -= mj; ++nMinor;
                    }
                }
            }
        }

        // Set changed register state after finishing
        setDX(dx);
        setDY(dy);

        start(LMMVTiming, mj, mi);
    }

    function SRCH() {
        // Collect parameters
        var sx = getSX();
        var syP1Off = getSYP1Offset();
        var sy = getSY() | syP1Off;
        var dix = getDIX();
        var neq = getNEQ();
        var fc = getFC(syP1Off);

        // console.log("SRCH sx: " + sx + ", sy: " + sy + ", fc: " + fc.toString(16) + ", neq: " + neq + ", dix: " + dix);

        // Search boundary X
        var stopX = dix === 1 ? imageWidth : -1;

        // Perform operation
        var x = sx, fcCompare = 0, found = false;
        var fcBits = typeBPP === 16 ? 0xffff : typeBPP === 4 ? 0xf000 : typeBPP === 2 ? 0xc000 : 0xff00;        // default = 8
        var m = (typeData.ppB << 1) - 1; if (m < 0) m = 0;
        var s = typeData.bpp;

        if (neq) {
            do {
                fcCompare = fc & (fcBits >> ((x & m) * s));
                if (normalPGETX(x, sy, x) !== fcCompare) {
                    found = true;
                    break;
                }
                x += dix;
            } while (x !== stopX);
        } else {
            do {
                fcCompare = fc & (fcBits >> ((x & m) * s));
                if (normalPGETX(x, sy, x) === fcCompare) {
                    found = true;
                    break;
                }
                x += dix;
            } while (x !== stopX);
        }

        var sxRes = (((register[33] & 0x07) << 8) | register[32]) & ~imageWidthMask;    // SX only multiple of width
        var finalX = found
            ? sxRes | x
            : dix === 1 ? (sxRes + x) & 0x07ff : 0x07ff;

        // Set changed register state after finishing
        setSX(finalX);
        setBX(finalX);
        v9990.setStatusBD(found);

        // console.log(found, finalX, fcCompare.toString(16));

        start(LMMVTiming, Math.abs(x - sx) + 1, 1);
    }

    function POINT() {
        // Collect parameters
        SX = getSX();
        SY = getSY() | getSYP1Offset();

        // console.log("POINT sx: " + SX + ", sy: " + SY);

        readStart(POINTNextRead);
    }

    function POINTNextRead() {
        switch (typeBPP) {
            case 16:
                if (readDataPending === null) {
                    readDataPending = normalPGETX(SX, SY, 0);        // SC has H/L bytes swapped
                    readData = readDataPending >> 8;
                    return;     // Don't finish yet!
                } else {
                    readData = readDataPending & 0xff;
                    readDataPending = null;
                }
                break;
            case 8:
                readData = normalPGETX(SX, SY, 1);
                break;
            case 4:
                readData = (readData & 0x0f) | normalPGETX(SX, SY, 2);
                break;
            case 2:
                readData = (readData & 0x3f) | normalPGETX(SX, SY, 4);
                break;
        }

        v9990.setStatusTR(0);
        finish();
    }

    function PSET() {
        // Collect parameters
        var dx = getDX();
        var dyP1Off = getDYP1Offset();
        var dy = getDY();
        var op = getLOP();
        var wm = getWM(dyP1Off);
        var fc = getFC(dyP1Off);
        var axme = getAXME();
        var ayme = getAYME();

        // console.log("PSET dx: " + dx + ", dy: " + dy);

        logicalPSETX(dx, dy | dyP1Off, dx, fc, op, wm);

        var incX = axme === 1 ? 1 : axme === 3 ? -1 : 0;
        var incY = ayme === 1 ? 1 : ayme === 3 ? -1 : 0;

        setDX(dx + incX);
        setDY(dy + incY);

        start(LMMVTiming, 1, 1);
    }

    function ADVN() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var axme = getAXME();
        var ayme = getAYME();

        //console.log("ADVN dx: " + dx + ", dy: " + dy);

        var incX = axme === 1 ? 1 : axme === 3 ? -1 : 0;
        var incY = ayme === 1 ? 1 : ayme === 3 ? -1 : 0;

        setDX(dx + incX);
        setDY(dy + incY);

        start(LMMVTiming, 1, 1);
    }

    function STOP() {

        // console.log("STOP: " + (writeHandler && writeHandler.name));

        finish(true);
        // SDSnatcher Melancholia fix: TR not reset when command ends
    }

    function normalPGETX(sx, sy, dx) {       // 16 bits based
        var sShift, dShift, mask;
        switch (typeBPP) {
            case 16:
                sx <<= 1;
                // Perform operation
                var pos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
                return (vram[pos] << 8) | vram[pos + 1];    // SC has H/L bytes swapped
            case 8:
                sShift = 0; dShift = (1 - (dx & 0x1)) << 3;
                mask = 0xff;
                break;
            case 4:
                sShift = (1 - (sx & 0x1)) << 2; dShift = (3 - (dx & 0x3)) << 2;
                sx >>>= 1; mask = 0x0f;
                break;
            case 2:
                sShift = (3 - (sx & 0x3)) << 1; dShift = (7 - (dx & 0x7)) << 1;
                sx >>>= 2; mask = 0x03;
                break;
        }
        // Perform operation
        pos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
        return ((vram[pos] >> sShift) & mask) << dShift;
    }

    function logicalPSETX(dx, dy, sx, sc, op, wm) {      // 16 bits based
        var sShift, dShift, mask;
        switch (typeBPP) {
            case 16:
                dx <<= 1;
                // Perform operation
                var pos = (dy * imageWidthBytes + dx) & VRAM_LIMIT;
                var dc = (vram[pos] << 8) | vram[pos + 1];      // SC and WM have H/L bytes swapped, so we also swap DC
                var wc = op(dc, sc, wm);
                vram[pos] = wc >> 8;                            // WC has H/L bytes swapped
                vram[pos + 1] = wc & 0xff;
                return;
            case 8: default:
                sShift = (1 - (sx & 0x1)) << 3; dShift = 0;
                mask = 0xff;
                break;
            case 4:
                sShift = (3 - (sx & 0x3)) << 2; dShift = (1 - (dx & 0x1)) << 2;
                dx >>>= 1; mask = 0x0f;
                break;
            case 2:
                sShift = (7 - (sx & 0x7)) << 1; dShift = (3 - (dx & 0x3)) << 1;
                dx >>>= 2; mask = 0x03;
                break;
        }

        // Perform operation
        pos = (dy * imageWidthBytes + dx) & VRAM_LIMIT;
        sc = ((sc >> sShift) & mask) << dShift;
        vram[pos] = op(vram[pos], sc, (mask << dShift) & getWMForAddr(wm, pos));
    }

    function logicalPCOPYXX(dx, dy, sx, sy, op, wm) {       // 8 bits based
        var sShift, dShift, mask;
        switch (typeBPP) {
            case 16:
                sx <<= 1; dx <<= 1;
                // Perform operation
                var sPos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
                var dPos = (dy * imageWidthBytes + dx) & VRAM_LIMIT;
                var sc = (vram[sPos] << 8) | vram[sPos + 1];    // WM has H/L bytes swapped, so we also swap SC and DC
                var dc = (vram[dPos] << 8) | vram[dPos + 1];
                var wc = op(dc, sc, wm);
                vram[dPos] = wc >> 8;                           // WC has H/L bytes swapped
                vram[dPos + 1] = wc & 0xff;
                return;
            case 8:
                sShift = dShift = 0;
                mask = 0xff;
                break;
            case 4:
                sShift = (1 - (sx & 0x1)) << 2; dShift = (1 - (dx & 0x1)) << 2;
                sx >>>= 1; dx >>>= 1; mask = 0x0f;
                break;
            case 2:
                sShift = (3 - (sx & 0x3)) << 1; dShift = (3 - (dx & 0x3)) << 1;
                sx >>>= 2; dx >>>= 2; mask = 0x03;
                break;
        }

        // Perform operation
        sPos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
        dPos = (dy * imageWidthBytes + dx) & VRAM_LIMIT;
        sc = ((vram[sPos] >> sShift) & mask) << dShift;
        vram[dPos] = op(vram[dPos], sc, (mask << dShift) & getWMForAddr(wm, dPos));
    }

    function logicalPCOPYLX(da, dx, sx, sy, op, wm) {       // 8 bits based
        var sShift, dShift, mask;
        switch (typeBPP) {
            case 16:
                sx <<= 1;
                // Perform operation
                var sPos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
                var sc = (vram[sPos] << 8) | vram[sPos + 1];    // WM has H/L bytes swapped, so we also swap SC and DC
                var dc = (vram[da] << 8) | vram[da + 1];
                var wc = op(dc, sc, wm);
                vram[da] = wc >> 8;                             // WC has H/L bytes swapped
                vram[da + 1] = wc & 0xff;
                return;
            case 8:
                sShift = dShift = 0;
                mask = 0xff;
                break;
            case 4:
                sShift = (1 - (sx & 0x1)) << 2; dShift = (1 - (dx & 0x1)) << 2;
                sx >>>= 1; mask = 0x0f;
                break;
            case 2:
                sShift = (3 - (sx & 0x3)) << 1; dShift = (3 - (dx & 0x3)) << 1;
                sx >>>= 2; mask = 0x03;
                break;
        }

        // Perform operation
        sPos = (sy * imageWidthBytes + sx) & VRAM_LIMIT;
        sc = ((vram[sPos] >> sShift) & mask) << dShift;
        vram[da] = op(vram[da], sc, (mask << dShift) & getWMForAddr(wm, da));
    }

    function logicalPCOPYLL(da, sa, op, wm) {       // 8 bits based
        // Perform operation
        vram[da] = op(vram[da], vram[sa], getWMForAddr(wm, da));
    }

    function lopNULL(dest, src, mask) {
        return (dest & ~mask);
    }

    function lopNOR(dest, src, mask) {
        return (dest & ~mask) | (~(dest | src) & mask);
    }

    function lopEXD(dest, src, mask) {
        return dest & ~(src & mask);
    }

    function lopNOTS(dest, src, mask) {
        return (dest & ~mask) | (~src & mask);
    }

    function lopEXS(dest, src, mask) {
        return (dest & ~mask) | ((src & ~dest) & mask);
    }

    function lopNOTD(dest, src, mask) {
        return (dest & ~mask) | (~dest & mask);
    }

    function lopXOR(dest, src, mask) {
        return dest ^ (src & mask);
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
        return (dest & ~mask) | (src & mask);
    }

    function lopNEXD(dest, src, mask) {
        return dest | ((~dest | src) & mask);
    }

    function lopOR(dest, src, mask) {
        return dest | (src & mask);
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
        return src === 0 ? dest : dest & ~(src & mask);
    }

    function lopTNOTS(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~src & mask);
    }

    function lopTEXS(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | ((src & ~dest) & mask);
    }

    function lopTNOTD(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~dest & mask);
    }

    function lopTXOR(dest, src, mask) {
        return src === 0 ? dest : dest ^ (src & mask);
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
        return src === 0 ? dest : (dest & ~mask) | (src & mask);
    }

    function lopTNEXD(dest, src, mask) {
        return src === 0 ? dest : dest | ((~dest | src) & mask);
    }

    function lopTOR(dest, src, mask) {
        return src === 0 ? dest : dest | (src & mask);
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
            var blocksPerFrame = bppInfo[typeBPP] || bppInfo;
            var cyclesPerPixel = BASE_CLOCK / 50 / 256 / blocksPerFrame;                                                // / 50 / 256 because timing is for 256 pixel blocks per PAL frame
            var duration = ((pixels * cyclesPerPixel * self.COMMAND_PER_PIXEL_DURATION_FACTOR) / turboClockMulti) | 0;       // no cycles per line info available
            finishingCycle = v9990.updateCycles() + duration;

            // Instantaneous
            // finishingCycle = 0;
            // finish();

            //console.log ("+++++ Duration: " + duration);
        }
    }

    function writeStart(handler) {
        start(null, 0, 0, true);      // Commands driven by CPU writes do not have a duration and finish when last write is performed

        writeHandler = handler;
        writeDataPending = null;
        v9990.setStatusTR(1);
    }

    function readStart(handler) {
        start(null, 0, 0, true);      // Commands driven by CPU reads do not have a duration and finish when last read is performed

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
        writeDataPending = null;
        readDataPending = null;
        readHandler = null;

        //console.log("FINISH");
    }


    var BASE_CLOCK = wmsx.V9990.BASE_CLOCK;

    var VRAM_LIMIT = wmsx.V9990.VRAM_LIMIT;
    var COMMAND_HANDLERS = { LMMCNextWrite: LMMCNextWrite, LMCMNextRead: LMCMNextRead, POINTNextRead: POINTNextRead };      // Used for savestates

    self.COMMAND_PER_PIXEL_DURATION_FACTOR = 0.99;

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
    var SX = 0, SY = 0, SYP1Off = 0, DX = 0, DY = 0, DYP1Off = 0, NX = 0, NY = 0, ENY = 0, EDX = 0, ESX = 0, DIX = 0, DIY = 0, CX = 0, CY = 0, WM = 0, destPos = 0, LOP;
    var readData = 0, writeDataPending = null, readDataPending = null, writeHandler = null, readHandler = null;
    var finishingCycle = 0;     // -1: infinite duration, 0: instantaneous, > 0 finish at cycle

    var modeData, typeData, isP1 = false;

    var dispAndSpritesMode = 0;  // 0: DISP off, 1: DISP on SPD off, 2: DISP on SPD on

    var typeBPP = 8, colosPPBShift = 0, colorPPBMask = 0;
    var imageWidth = 0, imageHeight = 0, imageWidthMask = 0, imageHeightMask = 0;
    var imageWidthBytes = 0;



    // Timing data for default Base Clock 21MHz (XTAL)
    // Number of 256 pixel blocks transferable in 1 PAL frame for each Mode/Type, BPP, and Sprites ON / Sprites OFF / Display OFF
    // No information available about additional cycles per line. Only per pixel average will be used
    // Therefore => Cycles Per Pixel = BaseClock / 50 / 256 / value

    var LMMVTiming = [
        /* Normal Bitmap  */  [ /* DISP off SPD --- */  { 2: 0x02d3, 4: 0x0219, 8: 0x0190, 16: 0x00c8 }, /* DISP on  SPD off */ { 2: 0x02d0, 4: 0x020e, 8: 0x018a, 16: 0x00c7 }, /* DISP on  SPD on  */ { 2: 0x02ab, 4: 0x01f6, 8: 0x0174, 16: 0x00bc }],
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
            wh: writeHandler && writeHandler.name, rh: readHandler && readHandler.name, fc: finishingCycle,
            SX: SX, SY: SY, DX: DX, DY: DY, NX: NX, NY: NY, ENY: ENY,
            DIX: DIX, DIY: DIY, CX: CX, CY: CY, LOP: LOP && LOGICAL_OPERATIONS.indexOf(LOP), dp: destPos,
            tcm: turboClockMulti
        };
    };

    this.loadState = function(s) {
        CE = s.ce;
        writeHandler = COMMAND_HANDLERS[s.wh]; readHandler = COMMAND_HANDLERS[s.rh]; finishingCycle = s.fc;
        SX = s.SX; SY = s.SY; DX = s.DX; DY = s.DY; NX = s.NX; NY = s.NY; ENY = s.ENY;
        DIX = s.DIX; DIY = s.DIY; CX = s.CX; CY = s.CY; LOP = s.LOP >= 0 ? LOGICAL_OPERATIONS[s.LOP] : undefined; destPos = s.dp;
        turboClockMulti = s.tcm !== undefined ? s.tcm : 1;
    };


    this.eval = function(str) {
        return eval(str);
    };

    window.V9990CMD = this;

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

