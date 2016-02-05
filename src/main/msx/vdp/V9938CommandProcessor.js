// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Commands perform all operation instantaneously at the first cycle. Duration is estimated and does not consider VRAM access slots

wmsx.V9938CommandProcessor = function() {

    this.connectVDP = function(pVDP, pVRAM, pRegister, pStatus) {
        vdp = pVDP;
        vram = pVRAM;
        register = pRegister;
        status = pStatus;
    };

    this.reset = function() {
        ecInProgress = false; ecTransferReady = false;
        ecWriteHandler = null; ecReadHandler = null;
        ecFinishingCycle = 0;
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
        if (ecWriteHandler) ecWriteHandler(val);
    };

    this.cpuRead = function() {
        if (ecReadHandler) ecReadHandler();
    };

    this.updateStatus = function() {
        if (ecInProgress) {
            var cycles = vdp.updateCycles();
            if (cycles >= ecFinishingCycle) ecFinish();
        }

        status[2] = (status[2] & ~0x81) | (ecTransferReady << 7) | ecInProgress;
    };

    this.setVDPModeData = function(modeData, pSignalMetrics) {
        mode = modeData.code;
        modeWidth = pSignalMetrics.width;
        layoutLineBytes = modeData.layLineBytes;
    };

    function ecGetSX() {
        return (((register[33] & 0x01) << 8) | register[32]);
    }

    function ecGetSY() {
        return (((register[35] & 0x03) << 8) | register[34]);
    }
    function ecSetSY(val) {
        register[35] = (val >> 8) & 0x03; register[34] = val & 0xff;
    }

    function ecGetDX() {
        return ((register[37] & 0x01) << 8) | register[36];
    }

    function ecGetDY() {
        return ((register[39] & 0x03) << 8) | register[38];
    }
    function ecSetDY(val) {
        register[39] = (val >> 8) & 0x03; register[38] = val & 0xff;
    }

    function ecGetNX() {
        return (((register[41] & 0x01) << 8) | register[40]) || 512;      // Max size if 0
    }

    function ecGetNY() {
        return (((register[43] & 0x03) << 8) | register[42]) || 1024;     // Max size if 0
    }
    function ecSetNY(val) {
        register[43] = (val >> 8) & 0x03; register[42] = val & 0xff;
    }

    function ecGetDIX() {
        return register[45] & 0x04 ? -1 : 1;
    }

    function ecGetDIY() {
        return register[45] & 0x08 ? -1 : 1;
    }

    function ecGetCLR() {
        return register[44];
    }
    function ecSetCLR(val) {
        register[44] = val;
    }

    function ecGetMAJ() {
        return register[45] & 0x01;
    }

    function ecGetEQ() {
        return (register[45] & 0x02) === 0;           // doc says the opposite
    }

    function ecGetLOP() {
        switch(register[46] & 0x0f) {
            case 0x00: return logicalOperationIMP;
            case 0x01: return logicalOperationAND;
            case 0x02: return logicalOperationOR;
            case 0x03: return logicalOperationXOR;
            case 0x04: return logicalOperationNOT;
            case 0x08: return logicalOperationTIMP;
            case 0x09: return logicalOperationTAND;
            case 0x0a: return logicalOperationTOR;
            case 0x0b: return logicalOperationTXOR;
            case 0x0c: return logicalOperationTNOT;
            default:   return logicalOperationIMP;
        }
    }

    function HMMC() {
        // Collect parameters
        var dx = ecGetDX();
        ecDY = ecGetDY();
        ecNX = ecGetNX();
        ecNY = ecGetNY();
        ecDIX = ecGetDIX();
        ecDIY = ecGetDIY();

        //console.log("HMMC Start dx: " + dx + ", dy: " + ecDY + ", nx: " + ecNX + ", ny: " + ecNY + ", dix: " + ecDIX + ", diy: " + ecDIY);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255; ecNX = 1;
        }

        // Adjust for whole-byte operation
        switch (mode) {
            case 0x03:
            case 0x05:
                dx >>>= 1; ecNX >>>= 1; break;
            case 0x04:
                dx >>>= 2; ecNX >>>= 2; break;
            case 0x07:
        }

        // Limit rect size
        ecNX = ecDIX === 1 ? min(ecNX, layoutLineBytes - dx) : min(ecNX, dx + 1);
        ecENY = ecDIY === 1 ? ecNY : min(ecNY, ecDY + 1);              // Top limit only

        ecDestPos = ecDY * layoutLineBytes + dx;

        ecWriteStart(HMMCNextWrite, ecNX * ecENY, 0, 1, 50);         // 50L estimated
    }

    function HMMCNextWrite(co) {

        //console.log("HMMC Write ecCX: " + ecCX + ", ecCY: " + ecCY);

        vram[ecDestPos & VRAM_LIMIT] = co;

        ecCX = ecCX + 1;
        if (ecCX >= ecNX) {
            ecDestPos -= ecDIX * (ecNX - 1);
            ecCX = 0; ecCY = ecCY + 1;
            if (ecCY >= ecENY) { ecInProgress = false; ecWriteHandler = false; }
            else ecDestPos += ecDIY * layoutLineBytes;
        } else {
            ecDestPos += ecDIX;
        }

        // Set visible changed register state
        ecSetDY(ecDY + ecDIY * ecCY);
        ecSetNY(ecNY - ecCY);
    }

    function YMMM() {
        // Collect parameters
        var sy = ecGetSY();
        var dx = ecGetDX();
        var dy = ecGetDY();
        var ny = ecGetNY();
        var dix = ecGetDIX();
        var diy = ecGetDIY();

        //console.log("YMMM sy: " + sy + ", dx: " + dx + ", dy: " + dy + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255;
        }

        // Adjust for whole-byte operation
        switch (mode) {
            case 0x03:
            case 0x05:
                dx >>>= 1; break;
            case 0x04:
                dx >>>= 2; break;
            case 0x07:
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
        ecSetSY(sy + diy * eny);
        ecSetDY(dy + diy * eny);
        ecSetNY(ny - eny);

        ecStart(nx * eny, 40 + 24, eny, 0);     	//  40R  24W   0L
    }

    function HMMM() {
        // Collect parameters
        var sx = ecGetSX();
        var sy = ecGetSY();
        var dx = ecGetDX();
        var dy = ecGetDY();
        var nx = ecGetNX();
        var ny = ecGetNY();
        var dix = ecGetDIX();
        var diy = ecGetDIY();

        //console.log("HMMM sx: " + sx + ", sy: " + sy + ", dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (sx >= modeWidth || dx >= modeWidth) {
            sx &= 255; dx &= 255; nx = 1;
        }

        // Adjust for whole-byte operation
        switch (mode) {
            case 0x03:
            case 0x05:
                sx >>>= 1; dx >>>= 1; nx >>>= 1; break;
            case 0x04:
                sx >>>= 2; dx >>>= 2; nx >>>= 2; break;
            case 0x07:
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
        ecSetSY(sy + diy * eny);
        ecSetDY(dy + diy * eny);
        ecSetNY(ny - eny);

        ecStart(nx * eny, 64 + 24, eny, 64);      	//  64R 24W   64L
    }

    function HMMV() {
        // Collect parameters
        var dx = ecGetDX();
        var dy = ecGetDY();
        var nx = ecGetNX();
        var ny = ecGetNY();
        var co = ecGetCLR();
        var dix = ecGetDIX();
        var diy = ecGetDIY();

        //console.log("HMMV dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", co: " + co.toString(16));

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255; nx = 1;
        }

        // Adjust for whole-byte operation
        switch (mode) {
            case 0x03:
            case 0x05:
                dx >>>= 1; nx >>>= 1; break;
            case 0x04:
                dx >>>= 2; nx >>>= 2; break;
            case 0x07:
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
        ecSetDY(dy + diy * eny);
        ecSetNY(ny - eny);

        ecStart(nx * eny, 48, eny, 56);     	//  48W   56L
    }

    function LMMC() {
        // Collect parameters
        ecDX = ecGetDX();
        ecDY = ecGetDY();
        ecNX = ecGetNX();
        ecNY = ecGetNY();
        ecDIX = ecGetDIX();
        ecDIY = ecGetDIY();
        ecLOP = ecGetLOP();

        //console.log("LMMC START x: " + ecDX + ", y: " + ecDY + ", nx: " + ecNX + ", ny: " + ecNY + ", dix: " + ecDIX + ", diy: " + ecDIY);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (ecDX >= modeWidth) {
            ecDX &= 255; ecNX = 1;
        }

        // Limit rect size
        ecNX = ecDIX === 1 ? min(ecNX, modeWidth - ecDX) : min(ecNX, ecDX + 1);
        ecENY = ecDIY === 1 ? ecNY : min(ecNY, ecDY + 1);            // Top limit only

        ecWriteStart(LMMCNextWrite, ecNX * ecENY, 0, 1, 60);     	//  60L estimated
    }

    function LMMCNextWrite(co) {

        //console.log("LMMC Write ecCX: " + ecCX + ", ecCY: " + ecCY);

        logicalPSET(ecDX, ecDY, co, ecLOP);

        ecCX = ecCX + 1;
        if (ecCX >= ecNX) {
            ecDX -= ecDIX * (ecNX - 1);
            ecCX = 0; ecCY = ecCY + 1; ecDY += ecDIY;
            if (ecCY >= ecENY) { ecInProgress = false; ecWriteHandler = false; }
        } else {
            ecDX += ecDIX;
        }

        // Set visible changed register state
        ecSetDY(ecDY);
        ecSetNY(ecNY - ecCY);
    }

    function LMCM() {
        // Collect parameters
        ecSX = ecGetSX();
        ecSY = ecGetSY();
        ecNX = ecGetNX();
        ecNY = ecGetNY();
        ecDIX = ecGetDIX();
        ecDIY = ecGetDIY();

        //console.log("LMCM START x: " + ecSX + ", y: " + ecSY + ", nx: " + ecNX + ", ny: " + ecNY + ", dix: " + ecDIX + ", diy: " + ecDIY);

        // If out of horizontal limits, wrap X and narrow to only 1 unit wide. Will trigger only for modes with width = 256
        if (ecSX >= modeWidth) {
            ecSX &= 255; ecNX = 1;
        }

        // Limit rect size
        ecNX = ecDIX === 1 ? min(ecNX, modeWidth - ecSX) : min(ecNX, ecSX + 1);
        ecENY = ecDIY === 1 ? ecNY : min(ecNY, ecSY + 1);            // Top limit only

        ecReadStart(LMCMNextRead, ecNX * ecENY, 0, 1, 60);           // 60L estimated
    }

    function LMCMNextRead() {
        status[7] = normalPGET(ecSX, ecSY);

        ecCX = ecCX + 1;
        if (ecCX >= ecNX) {
            ecSX -= ecDIX * (ecNX - 1);
            ecCX = 0; ecCY = ecCY + 1; ecSY += ecDIY;
            if (ecCY >= ecENY) { ecInProgress = false; ecReadHandler = false; }
        } else {
            ecSX += ecDIX;
        }

        // Set visible changed register state
        ecSetSY(ecSY);
        ecSetNY(ecNY - ecCY);
    }

    function LMMM() {
        // Collect parameters
        var sx = ecGetSX();
        var sy = ecGetSY();
        var dx = ecGetDX();
        var dy = ecGetDY();
        var nx = ecGetNX();
        var ny = ecGetNY();
        var dix = ecGetDIX();
        var diy = ecGetDIY();
        var op = ecGetLOP();

        //console.log("LMMM sx: " + sx + ", sy: " + sy + ", dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy);

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
        ecSetSY(sy);
        ecSetDY(dy);
        ecSetNY(ny - eny);

        ecStart(nx * eny, 64 + 32 + 24, eny, 64);      // 64R 32R 24W   64L
    }

    function LMMV() {
        // Collect parameters
        var dx = ecGetDX();
        var dy = ecGetDY();
        var nx = ecGetNX();
        var ny = ecGetNY();
        var co = ecGetCLR();
        var dix = ecGetDIX();
        var diy = ecGetDIY();
        var op = ecGetLOP();

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
        ecSetDY(dy);
        ecSetNY(ny - eny);

        ecStart(nx * eny, 72 + 24, eny, 64);      // 72R 24W   64L
    }

    function LINE() {
        // Collect parameters
        var dx = ecGetDX();
        var dy = ecGetDY();
        var nx = ecGetNX() & 511;       // Range 0 - 511.  Value 0 is OK
        var ny = ecGetNY() & 1023;      // Range 0 - 1023. Value 0 is OK
        var co = ecGetCLR();
        var dix = ecGetDIX();
        var diy = ecGetDIY();
        var maj = ecGetMAJ();
        var op = ecGetLOP();

        //console.log("LINE dx: " + dx + ", dy: " + dy + ", nx: " + nx + ", ny: " + ny + ", dix: " + dix + ", diy: " + diy + ", maj: " + maj);

        // No X wrap, no rect size limit  TODO Verify

        // Perform operation
        var e = 0;
        if (maj === 0) {
            for (var n = 0; n <= nx; n = n + 1) {
                logicalPSET(dx, dy, co, op);
                dx += dix; e += ny;
                if ((e << 1) >= nx) {
                    dy += diy; e -= nx;
                }
            }
        } else {
            for (n = 0; n <= nx; n = n + 1) {
                logicalPSET(dx, dy, co, op);
                dy += diy; e += ny;
                if ((e << 1) >= nx) {
                    dx += dix; e -= nx;
                }
            }
        }

        // Final registers state
        ecSetDY(dy);

        ecStart(nx, 88 + 24, ny, 32);      // 88R 24W   32L
    }

    function SRCH() {
        // Collect parameters
        var sx = ecGetSX();
        var sy = ecGetSY();
        var co = ecGetCLR();
        var dix = ecGetDIX();
        var eq = ecGetEQ();

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

        ecStart(Math.abs(x - sx) + 1, 86, 1, 50);      // 86R  50L estimated
    }

    function PSET() {
        // Collect parameters
        var dx = ecGetDX();
        var dy = ecGetDY();
        var co = ecGetCLR();
        var op = ecGetLOP();

        //console.log("PSET dx: " + dx + ", dy: " + dy);

        // If out of horizontal limits, wrap X. Will trigger only for modes with width = 256
        if (dx >= modeWidth) {
            dx &= 255;
        }

        logicalPSET(dx, dy, co, op);

        // No registers changed

        ecStart(0, 0, 1, 40);      // 40 total estimated
    }

    function POINT() {
        // Collect parameters
        var sx = ecGetSX();
        var sy = ecGetSY();

        //console.log("POINT sx: " + sx + ", sy: " + sy);

        // If out of horizontal limits, wrap X. Will trigger only for modes with width = 256
        if (sx >= modeWidth) {
            sx &= 255;
        }

        var co = normalPGET(sx, sy);

        // Final registers state
        ecSetCLR(co);
        status[7] = co;

        ecStart(0, 0, 1, 40);      // 40 total estimated
    }

    function STOP() {

        //console.log("STOP: " + ecWriteHandler);

        ecInProgress = false;
    }

    function normalPGET(x, y) {
        var shift, mask;
        switch (mode) {
            case 0x03:
            case 0x05:
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; mask = 0x0f << shift; break;
            case 0x04:
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; mask = 0x03 << shift; break;
            case 0x07:
                shift = 0; mask = 0xff;
        }
        // Perform operation
        var pos = y * layoutLineBytes + x;
        return (vram[pos & VRAM_LIMIT] & mask) >> shift;
    }

    function logicalPSET(x, y, co, op) {
        var shift, mask;
        switch (mode) {
            case 0x03:
            case 0x05:
                shift = (x & 0x1) ? 0 : 4;
                x >>>= 1; co = (co & 0x0f) << shift; mask = 0x0f << shift; break;
            case 0x04:
                shift = (3 - (x & 0x3)) * 2;
                x >>>= 2; co = (co & 0x03) << shift; mask = 0x03 << shift; break;
            case 0x07:
                mask = 0xff;
        }
        // Perform operation
        var pos = y * layoutLineBytes + x;
        vram[pos & VRAM_LIMIT] = op(vram[pos & VRAM_LIMIT], co, mask);
    }

    function logicalPCOPY(dx, dy, sx, sy, op) {
        var sShift, dShift, mask;
        switch (mode) {
            case 0x03:
            case 0x05:
                sShift = (sx & 0x1) ? 0 : 4; dShift = (dx & 0x1) ? 0 : 4;
                sx >>>= 1; dx >>>= 1; mask = 0x0f; break;
            case 0x04:
                sShift = (3 - (sx & 0x3)) * 2; dShift = (3 - (dx & 0x3)) * 2;
                sx >>>= 2; dx >>>= 2; mask = 0x03; break;
            case 0x07:
                sShift = dShift = 0;
                mask = 0xff;
        }

        // Perform operation
        var sPos = sy * layoutLineBytes + sx;
        var dPos = dy * layoutLineBytes + dx;
        var co = ((vram[sPos & VRAM_LIMIT] >> sShift) & mask) << dShift;
        vram[dPos & VRAM_LIMIT] = op(vram[dPos & VRAM_LIMIT], co, mask << dShift);
    }

    function logicalOperationIMP(dest, src, mask) {
        return (dest & ~mask) | src;
    }

    function logicalOperationAND(dest, src, mask) {
        return dest & (src | ~mask);
    }

    function logicalOperationOR(dest, src, mask) {
        return dest | src;
    }

    function logicalOperationXOR(dest, src, mask) {
        return (dest & ~mask) | ((dest ^ src) & mask);
    }

    function logicalOperationNOT(dest, src, mask) {
        return (dest & ~mask) | (!src & mask);
    }

    function logicalOperationTIMP(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | src;
    }

    function logicalOperationTAND(dest, src, mask) {
        return src === 0 ? dest : dest & (src | ~mask);
    }

    function logicalOperationTOR(dest, src, mask) {
        return src === 0 ? dest : dest | src;
    }

    function logicalOperationTXOR(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | ((dest ^ src) & mask);
    }

    function logicalOperationTNOT(dest, src, mask) {
        return src === 0 ? dest : (dest & ~mask) | (!src & mask);
    }

    function min(a, b) {
        return a < b ? a : b;
    }

    function max(a, b) {
        return a > b ? a : b;
    }

    function ecStart(pixels, cyclesPerPixel, lines, cyclesPerLine) {
        ecInProgress = true;
        ecTransferReady = false;
        ecWriteHandler = null;
        ecReadHandler = null;
        ecEstimateDuration(pixels, cyclesPerPixel, lines, cyclesPerLine);
    }

    function ecEstimateDuration(pixels, cyclesPerPixel, lines, cyclesPerLine) {
        var cycles = vdp.updateCycles();
        ecFinishingCycle = cycles + ((pixels * cyclesPerPixel * COMMAND_PER_PIXEL_DURATION_FACTOR + lines * cyclesPerLine) | 0);

        //console.log ("+++++ Duration: " + (ecFinishingCycle - cycles));
    }

    function ecWriteStart(handler, pixels, cyclesPerPixel, lines, cyclesPerLine) {
        ecStart(pixels, cyclesPerPixel, lines, cyclesPerLine);

        ecCX = 0; ecCY = 0;
        ecWriteHandler = handler;
        ecTransferReady = true;

        // Perform first iteration with current data
        ecWriteHandler(ecGetCLR());
    }

    function ecReadStart(handler, pixels, cyclesPerPixel, lines, cyclesPerLine) {
        ecStart(pixels, cyclesPerPixel, lines, cyclesPerLine);

        ecCX = 0; ecCY = 0;
        ecReadHandler = handler;
        ecTransferReady = true;

        // Perform first iteration
        ecReadHandler();
    }

    function ecFinish() {
        ecInProgress = false;
        ecTransferReady = false;
        ecWriteHandler = null;
        ecReadHandler = null;
        register[46] &= ~0xf0;
    }


    var VRAM_LIMIT = wmsx.V9938.VRAM_LIMIT;
    var COMMAND_HANDLERS = { HMMCNextWrite: HMMCNextWrite, LMMCNextWrite: LMMCNextWrite, LMCMNextRead: LMCMNextRead };      // Used for savestates
    var COMMAND_PER_PIXEL_DURATION_FACTOR = 1.1;


    // Main VDP connections
    var vdp, vram, register, status;

    var ecInProgress = false, ecTransferReady = false, ecWriteHandler = null, ecReadHandler = null, ecFinishingCycle = 0;
    var ecSX, ecSY, ecDX, ecDY, ecNX, ecNY, ecENY, ecDIX, ecDIY, ecCX, ecCY, ecDestPos, ecLOP;

    var mode;
    var modeWidth;
    var layoutLineBytes;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ecP: ecInProgress, ecT: ecTransferReady,
            ecW: ecWriteHandler && ecWriteHandler.name, ecR: ecReadHandler && ecReadHandler.name, ecF: ecFinishingCycle,
            ecSX: ecSX, ecSY: ecSY, ecDX: ecDX, ecDY: ecDY, ecNX: ecNX, ecNY: ecNY, ecENY: ecENY,
            ecDIX: ecDIX, ecDIY: ecDIY, ecCX: ecCX, ecCY: ecCY, ecDP: ecDestPos, ecL: ecLOP
        };
    };

    this.loadState = function(s) {
        ecInProgress = s.ecP; ecTransferReady = s.ecT;
        ecWriteHandler = COMMAND_HANDLERS[s.ecW]; ecReadHandler = COMMAND_HANDLERS[s.ecR]; ecFinishingCycle = s.ecF;
        ecSX = s.ecSX; ecSY = s.ecSY; ecDX = s.ecDX; ecDY = s.ecDY; ecNX = s.ecNX; ecNY = s.ecNY; ecENY = s.ecENY;
        ecDIX = s.ecDIX; ecDIY = s.ecDIY; ecCX = s.ecCX; ecCY = s.ecCY; ecDestPos = s.ecDP; ecLOP = s.ecL;
    };


    this.eval = function(str) {
        return eval(str);
    };

};
