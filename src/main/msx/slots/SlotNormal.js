// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Normal, un-banked ROMs of size 8K, 16K, 32K, 48K or 64K. Position in slot depends on size, header (start address) and info hints
// Mirror auto detected if not forced by format specified
// 0x0000 - 0xffff

wmsx.SlotNormal = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        var size = bytes.length;
        sizeMask = size - 1;
        self.format = format;

        // Determine startingPage and mirroring based on size, Header and ROM Info
        var startingPage = 0;
        mirrored = format === wmsx.SlotFormats.Mirrored ? true : format === wmsx.SlotFormats.NotMirrored ? false : null;       // Force mirroring?

        // If 64K or 48K, force startingPage to 0
        if (size === 0x10000 || size === 0xc000)
            startingPage = 0;
        else {
            // 32K or less. Use position from info if present and mirror by default
            var position = rom.info.s ? parseInt(rom.info.s) : -1;
            if (position >= 0)
                startingPage = position >> 14;
                // Do not Mirror by default
            else {
                // Search for the first Header with valid Handlers
                var lowestHandlerPage = null;
                var lowestBasicPage = null;
                var headerPosition = 0;
                for (; headerPosition < size; headerPosition += 0x4000) {
                    var info = getLowestHandlerInfo(headerPosition);
                    if (info != null) {
                        lowestHandlerPage = info.lowestHandlerPage;
                        lowestBasicPage = info.lowestBasicPage;
                        break;
                    }
                }
                // If no Handler found, force startingPage to 1
                if (lowestHandlerPage === null)
                    startingPage = 1;
                else {
                    // If 32K, position at page 0, 1 or 2. Headers possible at 0x0000 or 0x4000
                    if (size === 0x8000) {
                        if (headerPosition === 0x0000) {
                            if (lowestHandlerPage === 3) startingPage = 2;
                            else startingPage = 1;
                        } else {    // headerPosition === 0x4000
                            if (lowestHandlerPage === 0) startingPage = 0;
                            else startingPage = 1;
                        }
                    } else {
                        // If 16K or less, position at page 1 or 2. Headers only possible at 0x0000
                        startingPage = lowestHandlerPage === 2 ? 2 : 1;
                        // DO NOT Mirror by default if startingPage = 2 and basicPage = 2
                        if (mirrored === null && startingPage === 2 && lowestBasicPage === 2) mirrored = false;
                    }
                }
                // Mirror by default
                if (mirrored === null) mirrored = true;
            }
        }

        mirrored = !!mirrored;
        baseAddress = startingPage << 14;
        topAddress = Math.min(baseAddress + size, 0x10000);

        wmsx.Util.log("Address: 0x" + wmsx.Util.toHex4(baseAddress) + " - 0x" + wmsx.Util.toHex4(topAddress - 1) + ", Mirrored: " + mirrored);
    }

    this.read = function(address) {
        if (address >= baseAddress && address < topAddress)
            return bytes[address - baseAddress];

        if (mirrored)
            return bytes[(address + 0x10000 - baseAddress) & sizeMask];

        return 0xff;
    };

    // Check header for Starting Address, CALL handler, Device Handlers or BASIC Starting Address
    function getLowestHandlerInfo(headerPosition) {
        if (bytes[headerPosition] !== 65 || bytes[headerPosition + 1] !== 66) return null;       // Not a header!
        var lowestBasic = null;
        var lowestHandler = 0xffff;
        var addr = headerPosition + 2;
        for (; addr <= headerPosition + 8; addr += 2) {
            var handler = (bytes[addr + 1] << 8) | bytes[addr];
            if (handler === 0) continue;        // Invalid handler
            if (handler < lowestHandler) lowestHandler = handler;
            if (addr === headerPosition + 8 && (!lowestBasic || handler < lowestBasic)) lowestBasic = handler;
        }
        if (lowestHandler === 0xffff)
            return null;                            // No handler found
        else
        // Page of handlers
        return { lowestHandlerPage: lowestHandler >> 14, lowestBasicPage: lowestBasic !== null ? lowestBasic >> 14 : null };
    }


    var bytes;
    this.bytes = null;

    var baseAddress, topAddress, sizeMask;
    var mirrored;

    this.rom = null;
    this.format = null;     // Set by init()


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            ba: baseAddress
        };
    };

    this.loadState = function(s) {
        this.format = wmsx.SlotFormats[s.f];
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        baseAddress = s.ba;
        topAddress = baseAddress + bytes.length;
        sizeMask = bytes.length - 1;
        mirrored = this.format === wmsx.SlotFormats.Mirrored;
    };


    if (rom) init(this);

};

wmsx.SlotNormal.prototype = wmsx.Slot.base;

wmsx.SlotNormal.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.SlotNormal();
    cart.loadState(state);
    return cart;
};
