// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Commands perform all operation instantaneously at the first cycle. Duration is estimated and does not consider VRAM access slots

wmsx.VDPCommandProcessor = function() {

    this.connectVDP = function(pVDP, pVRAM, pRegister, pStatus) {
        vdp = pVDP;
        vram = pVRAM;
        register = pRegister;
        status = pStatus;
    };

    this.reset = function() {
        finish();
    };

    this.startCommand = function(val) {

        //console.log(">>>> VDP Command: " + val.toString(16));

        switch (val & 0xf0) {
            case 0xf0:
                HMMC(); break;
            case 0xe0:
                YMMM(); break;
            case 0xd0:
                HMMM(); break;
            case 0xc0:
                HMMV(); break;
            case 0xb0:
                LMMC(); break;
            case 0xa0:
                LMCM(); break;
            case 0x90:
                LMMM(); break;
            case 0x80:
                LMMV(); break;
            case 0x70:
                LINE(); break;
            case 0x60:
                SRCH(); break;
            case 0x50:
                PSET(); break;
            case 0x40:
                POINT(); break;
            case 0x00:
                STOP(); break;
            default:
                wmsx.Util.log("Unsupported V9938 Command: " + val.toString(16));
        }
    };

    this.cpuWrite = function(val) {
        if (writeHandler) writeHandler(val);

        //else console.log("Write UNHANDLED: " + val.toString(16));
    };

    this.cpuRead = function() {
        if (readHandler) readHandler();

        //else console.log("Read UNHANDLED");
    };

    this.updateStatus = function() {
        if (inProgress & finishingCycle > 0) {
            var cycles = vdp.updateCycles();
            if (cycles >= finishingCycle) finish();
        }

        status[2] = (status[2] & ~0x81) | (transferReady << 7) | inProgress;
    };

    this.setVDPModeData = function(pModeData) {
        modeData = pModeData;
        modePPB = modeData.ppb;
        modeWidth = modeData.width;
        layoutLineBytes = modeData.layLineBytes;
    };

    function getSX() {
        return (((register[33] & 0x01) << 8) | register[32]);
    }

    function getSY() {
        return (((register[35] & 0x03) << 8) | register[34]);
    }
    function setSY(val) {
        register[35] = (val >> 8) & 0x03; register[34] = val & 0xff;
    }

    function getDX() {
        return ((register[37] & 0x01) << 8) | register[36];
    }

    function getDY() {
        return ((register[39] & 0x03) << 8) | register[38];
    }
    function setDY(val) {
        register[39] = (val >> 8) & 0x03; register[38] = val & 0xff;
    }

    function getNX() {
        return (((register[41] & 0x01) << 8) | register[40]) || 512;      // Max size if 0
    }

    function getNY() {
        return (((register[43] & 0x03) << 8) | register[42]) || 1024;     // Max size if 0
    }
    function setNY(val) {
        register[43] = (val >> 8) & 0x03; register[42] = val & 0xff;
    }

    function getDIX() {
        return register[45] & 0x04 ? -1 : 1;
    }

    function getDIY() {
        return register[45] & 0x08 ? -1 : 1;
    }

    function getCLR() {
        return register[44];
    }
    function setCLR(val) {
        register[44] = val;
    }

    function getMAJ() {
        return register[45] & 0x01;
    }

    function getEQ() {
        return (register[45] & 0x02) === 0;           // doc says the opposite
    }

    function getLOP() {
        switch(register[46] & 0x0f) {
            case 0x00: return lopIMP;
            case 0x01: return lopAND;
            case 0x02: return lopOR;
            case 0x03: return lopXOR;
            case 0x04: return lopNOT;
            case 0x08: return lopTIMP;
            case 0x09: return lopTAND;
            case 0x0a: return lopTOR;
            case 0x0b: return lopTXOR;
            case 0x0c: return lopTNOT;
            default:   return lopIMP;
        }
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

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255; NX = 1;
        }

        // Adjust for whole-byte operation
        switch (modePPB) {
            case 2:
                dx >>>= 1; NX >>>= 1; break;
            case 4:
                dx >>>= 2; NX >>>= 2; break;
            default:  // including 1
                // Not needed
        }

        // Limit rect size
        NX = DIX === 1 ? min(NX, layoutLineBytes - dx) : min(NX, dx + 1);
        ENY = DIY === 1 ? NY : min(NY, DY + 1);              // Top limit only

        destPos = DY * layoutLineBytes + dx;

        writeStart(HMMCNextWrite);
    }

    function HMMCNextWrite(co) {

        //console.log("HMMC Write CX: " + CX + ", CY: " + CY + ", CO: " + co.toString(16));

        vram[destPos & VRAM_LIMIT] = co;

        CX = CX + 1;
        if (CX >= NX) {
            destPos -= DIX * (NX - 1);
            CX = 0; CY = CY + 1;
            if (CY >= ENY) finish();
            else destPos += DIY * layoutLineBytes;
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

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255;
        }

        // Adjust for whole-byte operation
        switch (modePPB) {
            case 2:
                dx >>>= 1; break;
            case 4:
                dx >>>= 2; break;
            default:  // including 1
                // Not needed
        }

        // Limit rect size
        var nx = dix === 1 ? layoutLineBytes - dx : dx + 1;
        var eny = diy === 1 ? ny : min(ny, min(sy, dy) + 1);              // Top limit only

        // Perform operation
        var sPos = sy * layoutLineBytes + dx;
        var dPos = dy * layoutLineBytes + dx;
        var yStride = -(dix * nx) + layoutLineBytes * diy;
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

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (sx >= modeWidth || dx >= modeWidth) {
            sx &= 255; dx &= 255; nx = 1;
        }

        // Adjust for whole-byte operation
        switch (modePPB) {
            case 2:
                sx >>>= 1; dx >>>= 1; nx >>>= 1; break;
            case 4:
                sx >>>= 2; dx >>>= 2; nx >>>= 2; break;
            default:  // including 1
                // Not needed
        }

        // Limit rect size
        nx = dix === 1 ? min(nx, layoutLineBytes - max(sx, dx)) : min(nx, min(sx, dx) + 1);
        var eny = diy === 1 ? ny : min(ny, min(sy, dy) + 1);              // Top limit only

        // Perform operation
        var sPos = sy * layoutLineBytes + sx;
        var dPos = dy * layoutLineBytes + dx;
        var yStride = -(dix * nx) + layoutLineBytes * diy;
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
        var co = getCLR();
        var dix = getDIX();
        var diy = getDIY();

        //console.log("HMMV dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", co: " + co.toString(16));

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255; nx = 1;
        }

        // Adjust for whole-byte operation
        switch (modePPB) {
            case 2:
                dx >>>= 1; nx >>>= 1; break;
            case 4:
                dx >>>= 2; nx >>>= 2; break;
            default:  // including 1
                // Not needed
        }

        // Limit rect size
        nx = dix === 1 ? min(nx, layoutLineBytes - dx) : min(nx, dx + 1);
        var eny = diy === 1 ? ny : min(ny, dy + 1);              // Top limit only

        // Perform operation
        var pos = dy * layoutLineBytes + dx;
        var yStride = -(dix * nx) + layoutLineBytes * diy;
        for (var cy = eny; cy > 0; cy = cy - 1) {
            for (var cx = nx; cx > 0; cx = cx - 1) {
                vram[pos & VRAM_LIMIT] = co;
                pos += dix;
            }
            pos += yStride;
        }

        // Final registers state
        setDY(dy + diy * eny);
        setNY(ny - eny);

        start(nx * eny, 48, eny, 56);     	//  48W   56L
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

        //console.log("LMMC START x: " + DX + ", y: " + DY + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (DX >= modeWidth) {
            DX &= 255; NX = 1;
        }

        // Limit rect size
        NX = DIX === 1 ? min(NX, modeWidth - DX) : min(NX, DX + 1);
        ENY = DIY === 1 ? NY : min(NY, DY + 1);            // Top limit only

        writeStart(LMMCNextWrite);
    }

    function LMMCNextWrite(co) {

        //console.log("LMMC Write CX: " + CX + ", CY: " + CY);

        logicalPSET(DX, DY, co, LOP);

        CX = CX + 1;
        if (CX >= NX) {
            DX -= DIX * (NX - 1);
            CX = 0; CY = CY + 1; DY += DIY;
            if (CY >= ENY) finish();
        } else {
            DX += DIX;
        }

        // Set visible changed register state
        setDY(DY);
        setNY(NY - CY);
    }

    function LMCM() {
        // Collect parameters
        SX = getSX();
        SY = getSY();
        NX = getNX();
        NY = getNY();
        DIX = getDIX();
        DIY = getDIY();

        //console.log("LMCM START x: " + SX + ", y: " + SY + ", nx: " + NX + ", ny: " + NY + ", dix: " + DIX + ", diy: " + DIY);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (SX >= modeWidth) {
            SX &= 255; NX = 1;
        }

        // Limit rect size
        NX = DIX === 1 ? min(NX, modeWidth - SX) : min(NX, SX + 1);
        ENY = DIY === 1 ? NY : min(NY, SY + 1);            // Top limit only

        readStart(LMCMNextRead);
    }

    function LMCMNextRead() {
        status[7] = normalPGET(SX, SY);

        CX = CX + 1;
        if (CX >= NX) {
            SX -= DIX * (NX - 1);
            CX = 0; CY = CY + 1; SY += DIY;
            if (CY >= ENY) finish();
        } else {
            SX += DIX;
        }

        // Set visible changed register state
        setSY(SY);
        setNY(NY - CY);
    }

    function LMMM() {
        // Collect parameters
        var sx = getSX();
        var sy = getSY();
        var dx = getDX();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();

        //console.log("LMMM sx: " + sx + ", sy: " + sy + ", dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", op: " + op.name);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (sx >= modeWidth || dx >= modeWidth) {
            sx &= 255; dx &= 255; nx = 1;
        }

        // Limit rect size
        nx = dix === 1 ? min(nx, modeWidth - max(sx, dx)) : min(nx, min(sx, dx) + 1);
        var eny = diy === 1 ? ny : min(ny, min(sy, dy) + 1);              // Top limit only

        // Perform operation
        for (var cy = eny; cy > 0; cy = cy - 1) {
            for (var cx = nx; cx > 0; cx = cx - 1) {
                logicalPCOPY(dx, dy, sx, sy, op);
                sx += dix; dx += dix;
            }
            sx -= dix * nx; dx -= dix * nx;
            sy += diy; dy += diy;
        }

        // Final registers state
        setSY(sy);
        setDY(dy);
        setNY(ny - eny);

        start(nx * eny, 64 + 32 + 24, eny, 64);      // 64R 32R 24W   64L
    }

    function LMMV() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var nx = getNX();
        var ny = getNY();
        var co = getCLR();
        var dix = getDIX();
        var diy = getDIY();
        var op = getLOP();

        //console.log("LMMV dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", co: " + co.toString(16));

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255; nx = 1;
        }

        // Limit rect size
        nx = dix === 1 ? min(nx, modeWidth - dx) : min(nx, dx + 1);
        var eny = diy === 1 ? ny : min(ny, dy + 1);              // Top limit only

        // Perform operation
        for (var cy = eny; cy > 0; cy = cy - 1) {
            for (var cx = nx; cx > 0; cx = cx - 1) {
                logicalPSET(dx, dy, co, op);
                dx += dix;
            }
            dx -= dix * nx;
            dy += diy;
        }

        // Final registers state
        setDY(dy);
        setNY(ny - eny);

        start(nx * eny, 72 + 24, eny, 64);      // 72R 24W   64L
    }

    function LINE() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var nx = getNX() & 511;       // Range 0 - 511.  Value 0 is OK
        var ny = getNY() & 1023;      // Range 0 - 1023. Value 0 is OK
        var co = getCLR();
        var dix = getDIX();
        var diy = getDIY();
        var maj = getMAJ();
        var op = getLOP();

        //console.log("LINE dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", maj: " + maj);

        // Limits control
        var maxX = modeWidth - 1;

        // If out of horizontal limits, wrap X
        dx &= maxX;

        // Timming control
        var nMinor = 0;

        // Perform operation
        var e = 0;
        if (maj === 0) {
            for (var n = 0; n <= nx; n = n + 1) {
                logicalPSET(dx, dy, co, op);
                dx += dix; e += ny;
                if ((e << 1) >= nx) {
                    dy += diy; e -= nx; nMinor = nMinor + 1;
                }
                if (dx > maxX || dx < 0 || dy < 0) break;       // No bottom limit
            }
        } else {
            for (n = 0; n <= nx; n = n + 1) {
                logicalPSET(dx, dy, co, op);
                dy += diy; e += ny;
                if ((e << 1) >= nx) {
                    dx += dix; e -= nx; nMinor = nMinor + 1;
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
        var co = getCLR();
        var dix = getDIX();
        var eq = getEQ();

        //console.log("SRCH sx: " + sx + ", sy: " + sy + ", co: " + co + ", eq: " + eq + ", dix: " + dix);

        // If out of horizontal limits, wrap X. Will trigger only for modes with width = 256
        if (sx >= modeWidth) {
            sx &= 255;
        }

        // Search boundary X
        var stopX = dix === 1 ? modeWidth : -1;

        // Perform operation
        var x = sx, found = false;
        if (eq)
            do {
                if (normalPGET(x, sy) === co) {
                    found = true; break;
                }
                x = x + dix;
            } while (x !== stopX);
        else
            do {
                if (normalPGET(x, sy) !== co) {
                    found = true; break;
                }
                x = x + dix;
            } while (x !== stopX);

        status[2] = (status[2] & ~0x10) | (found ? 0x10 : 0);
        status[8] = x & 255;
        status[9] = (x >> 8) & 1;

        // No registers changed

        start(Math.abs(x - sx) + 1, 86, 1, 50);      // 86R  50L estimated
    }

    function PSET() {
        // Collect parameters
        var dx = getDX();
        var dy = getDY();
        var co = getCLR();
        var op = getLOP();

        //console.log("PSET dx: " + dx + ", dy: " + dy);

        // If out of horizontal limits, wrap X. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255;
        }

        logicalPSET(dx, dy, co, op);

        // No registers changed

        start(0, 0, 1, 40);      // 40 total estimated
    }

    function POINT() {
        // Collect parameters
        var sx = getSX();
        var sy = getSY();

        //console.log("POINT sx: " + sx + ", sy: " + sy);

        // If out of horizontal limits, wrap X. Will trigger only for modes with width = 256
        if (sx >= modeWidth) {
            sx &= 255;
        }

        var co = normalPGET(sx, sy);

        // Final registers state
        setCLR(co);
        status[7] = co;

        start(0, 0, 1, 40);      // 40 total estimated
    }

    function STOP() {

        //console.log("STOP: " + writeHandler);

        finish();
    }

    function normalPGET(x, y) {
        var shift, mask;
        switch (modePPB) {
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
        var pos = y * layoutLineBytes + x;
        return (vram[pos & VRAM_LIMIT] & mask) >> shift;
    }

    function logicalPSET(x, y, co, op) {
        var shift, mask;
        switch (modePPB) {
            case 2:
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; co = (co & 0x0f) << shift; mask = 0x0f << shift; break;
            case 4:
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; co = (co & 0x03) << shift; mask = 0x03 << shift; break;
            default:  // including 1
                mask = 0xff;
        }
        // Perform operation
        var pos = y * layoutLineBytes + x;
        vram[pos & VRAM_LIMIT] = op(vram[pos & VRAM_LIMIT], co, mask);
    }

    function logicalPCOPY(dx, dy, sx, sy, op) {
        var sShift, dShift, mask;
        switch (modePPB) {
            case 2:
                sShift = (sx & 0x1) ? 0 : 4; dShift = (dx & 0x1) ? 0 : 4;
                sx >>>= 1; dx >>>= 1; mask = 0x0f; break;
            case 4:
                sShift = (3 - (sx & 0x3)) * 2; dShift = (3 - (dx & 0x3)) * 2;
                sx >>>= 2; dx >>>= 2; mask = 0x03; break;
            default:  // including 1
                sShift = dShift = 0;
                mask = 0xff;
        }

        // Perform operation
        var sPos = sy * layoutLineBytes + sx;
        var dPos = dy * layoutLineBytes + dx;
        var co = ((vram[sPos & VRAM_LIMIT] >> sShift) & mask) << dShift;
        vram[dPos & VRAM_LIMIT] = op(vram[dPos & VRAM_LIMIT], co, mask << dShift);
    }

    function lopIMP(dest, src, mask) {
        return (dest & ~mask) | src;
    }

    function lopAND(dest, src, mask) {
        return dest & (src | ~mask);
    }

    function lopOR(dest, src, mask) {
        return dest | src;
    }

    function lopXOR(dest, src, mask) {
        return dest ^ src;
    }

    function lopNOT(dest, src, mask) {
        return (dest & ~mask) | (~src & mask);
    }

    function lopTIMP(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | src;
    }

    function lopTAND(dest, src, mask) {
        return src === 0 ? dest : dest & (src | ~mask);
    }

    function lopTOR(dest, src, mask) {
        return src === 0 ? dest : dest | src;
    }

    function lopTXOR(dest, src, mask) {
        return dest ^ src;          // source === 0 doesn't matter since XOR 0 does not change bits
    }

    function lopTNOT(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (~src & mask);
    }

    function min(a, b) {
        return a < b ? a : b;
    }

    function max(a, b) {
        return a > b ? a : b;
    }

    function start(pixels, cyclesPerPixel, lines, cyclesPerLine, infinite) {
        inProgress = true;
        transferReady = false;
        writeHandler = null;
        readHandler = null;
        estimateDuration(pixels, cyclesPerPixel, lines, cyclesPerLine, infinite);
    }

    function estimateDuration(pixels, cyclesPerPixel, lines, cyclesPerLine, infinite) {
        if (infinite)
            finishingCycle = -1;
        else {
            var cycles = vdp.updateCycles();
            finishingCycle = cycles + ((pixels * cyclesPerPixel * COMMAND_PER_PIXEL_DURATION_FACTOR + lines * cyclesPerLine) | 0);

            //console.log ("+++++ Duration: " + (finishingCycle - cycles));
        }
    }

    function writeStart(handler) {
        start(0, 0, 0, 0, true);      // Commands driven by CPU writes do not have a duration and finish when last write is performed

        CX = 0; CY = 0;
        writeHandler = handler;
        transferReady = true;

        // Perform first iteration with current data
        writeHandler(getCLR());
    }

    function readStart(handler) {
        start(0, 0, 0, 0, true);      // Commands driven by CPU reads do not have a duration and finish when last read is performed

        CX = 0; CY = 0;
        readHandler = handler;
        transferReady = true;

        // Perform first iteration
        readHandler();
    }

    function finish() {
        inProgress = false;
        transferReady = false;
        writeHandler = null;
        readHandler = null;
        finishingCycle = -1;
        register[46] &= ~0xf0;

        //console.log("FINISH");
    }


    var VRAM_LIMIT = wmsx.VDP.VRAM_LIMIT;
    var COMMAND_HANDLERS = { HMMCNextWrite: HMMCNextWrite, LMMCNextWrite: LMMCNextWrite, LMCMNextRead: LMCMNextRead };      // Used for savestates
    var COMMAND_PER_PIXEL_DURATION_FACTOR = 1.1;


    // Main VDP connections
    var vdp, vram, register, status;

    var inProgress = false, transferReady = false, writeHandler = null, readHandler = null, finishingCycle = 0;
    var SX, SY, DX, DY, NX, NY, ENY, DIX, DIY, CX, CY, LOP, destPos;

    var modeData;
    var modePPB;
    var modeWidth;
    var layoutLineBytes;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ip: inProgress, tr: transferReady,
            wh: writeHandler && writeHandler.name, rh: readHandler && readHandler.name, fc: finishingCycle,
            SX: SX, SY: SY, DX: DX, DY: DY, NX: NX, NY: NY, ENY: ENY,
            DIX: DIX, DIY: DIY, CX: CX, CY: CY, LOP: LOP, dp: destPos
        };
    };

    this.loadState = function(s) {
        inProgress = s.ip; transferReady = s.tr;
        writeHandler = COMMAND_HANDLERS[s.wh]; readHandler = COMMAND_HANDLERS[s.rh]; finishingCycle = s.fc;
        SX = s.SX; SY = s.SY; DX = s.DX; DY = s.DY; NX = s.NX; NY = s.NY; ENY = s.ENY;
        DIX = s.DIX; DIY = s.DIY; CX = s.CX; CY = s.CY; LOP = s.LOP; destPos = s.dp;
    };


    this.eval = function(str) {
        return eval(str);
    };

};
