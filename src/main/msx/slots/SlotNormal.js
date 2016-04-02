// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Normal, un-banked ROMs of size 8K, 16K, 32K, 48K or 64K. Position in slot depends on size, header (start address) and info hints
// 0x0000 - 0xffff

wmsx.SlotNormal = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        var size = content.length < 0x4000 ? 0x4000 : content.length;
        bytes = new Array(size);
        self.bytes = bytes;
        for(var i = 0; i < size; ++i)
            bytes[i] = content[i % size];

        // Determine startingPage based on size, Header and ROM Info
        var startingPage = 0;

        // If 64K or 48K, force startingPage to 0
        if (size === 0x10000 || size === 0xc000)
            startingPage = 0;
        else {
            // 32K or less. Use position from info if present
            var position = rom.info.s ? Number.parseInt(rom.info.s) : -1;
            if (position >= 0)
                startingPage = position >> 14;
            else {
                // Search for the first Header with valid Handlers
                var lowestHandlerPage = null;
                var headerPosition = 0;
                for (; headerPosition < size; headerPosition += 0x4000) {
                    var page = getLowestHandlerPage(headerPosition);
                    if (page != null) {
                        lowestHandlerPage = page;
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
                    }
                    // If 16K or less, position at page 0, 1 or 2. Headers only possible at 0x0000
                    else {
                        startingPage = lowestHandlerPage;
                    }
                }
            }
        }

        baseAddress = startingPage << 14;
        topAddress = baseAddress + size;
    }


    this.read = function(address) {
        if (address < baseAddress)
            return 0xff;
        if (address < topAddress)
            return bytes[address - baseAddress];
        else
            return 0xff;
    };


    // Check header for Starting Address, CALL handler, Device Handlers or BASIC Starting Address
    function getLowestHandlerPage(headerPosition) {
        if (bytes[headerPosition] !== 65 || bytes[headerPosition + 1] !== 66) return null;       // Not a header!
        var lowest = 0xffff;
        var addr = headerPosition + 2;
        for (; addr <= headerPosition + 8; addr += 2) {
            var handler = (bytes[addr + 1] << 8) | bytes[addr];
            if (handler === 0) continue;        // Invalid handler
            if (handler < lowest) lowest = handler;
        }
        if (lowest === 0xffff)
            return null;                            // No handler found
        else
            return lowest >> 14;                    // Page of handler
    }


    var bytes;
    this.bytes = null;

    var baseAddress, topAddress;

    this.rom = null;
    this.format = wmsx.SlotFormats.Normal;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            ba: baseAddress
        };
    };

    this.loadState = function(state) {
        this.rom = wmsx.ROM.loadState(state.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        baseAddress = state.ba;
        topAddress = baseAddress + bytes.length;
    };


    if (rom) init(this);

};

wmsx.SlotNormal.prototype = wmsx.Slot.base;

wmsx.SlotNormal.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.SlotNormal();
    cart.loadState(state);
    return cart;
};
