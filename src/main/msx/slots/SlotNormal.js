// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Normal, un-banked ROMs of size 8K, 16K, 32K, 48K or 64K. Position in slot depends on size, header (start address) and info hints
// 0x0000 - 0xffff

wmsx.SlotNormal = function(rom) {

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.arrayFill(new Array(65536), 0xff);
        self.bytes = bytes;
        var content = self.rom.content;
        // If 64K or 48K size, it fits just fine starting at 0x0000
        if (content.length === 65536 || content.length === 49152) {
            for (var i = 0, len = content.length; i < len; i++) bytes[i] = content[i];
            return
        }
        // Uses position from info if present
        var position = rom.info.s ? Number.parseInt(rom.info.s) : -1;
        // If 32K size, position at 0x0000, 0x4000 or 0x8000
        if (content.length === 32768) {
            // If no info position present, try to determine by the ROM header
            if (position < 0) {
                // Maybe position is 0x4000 (start at 0x4000-0xbfff or BASIC at >= 0x8000
                if ((content[0x0000] === 65 && content[0x0001] === 66 && ((content[0x0003] >= 0x40 && content[0x0003] < 0xc0) || content[0x0009] >= 0x80))
                    || (content[0x4000] === 65 && content[0x4001] === 66 && ((content[0x4003] >= 0x40 && content[0x4003] < 0xc0) || content[0x4009] >= 0x80))) {
                    position = 0x4000;
                } else {
                    // Maybe position is 0x8000 (start at >= 0x8000 or BASIC at >= 0x0000)
                    if (content[0x0000] === 65 && content[0x0001] === 66 && (content[0x0003] >= 0x80 || content[0x0009] >= 0x80))
                        position = 0x8000;
                    else     // Then it must be 0x0000
                        position = 0x0000;
                }
            }
            for (i = 0; i < 32768; i++) bytes[position + i] = content[i];
            return;
        }
        // If 8K or 16K size, position at 0x0000, 0x4000 or 0x8000
        if (content.length === 8192 || content.length === 16384) {
            // If no info position present, try to determine by the ROM header
            if (position < 0) {
                // Maybe position is 0x4000 (start < 0x8000)
                if (content[0x0003] >= 0x40 && content[0x0003] < 0x80) {
                    position = 0x4000;
                } else {
                    // Maybe position is 0x8000 (start at >= 0x8000 or BASIC at >= 0x8000)
                    if (content[0x0003] >= 0x80 || content[0x0009] >= 0x80)
                        position = 0x8000;
                    else     // Then it must be 0x0000
                        position = 0x0000;
                }
            }
            // Mirror m times so it reaches at least 0x7fff, or 0xbfff
            var end = position < 0x8000 ? 0x8000 : 0xc000;
            for (var m = position; m < end; m += content.length)
                for (i = 0; i < content.length; i++) bytes[m + i] = content[i];
        }
    }


    this.read = function(address) {
        return bytes[address];
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.Unbanked;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(state) {
        this.rom = wmsx.ROM.loadState(state.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
    };


    if (rom) init(this);

};

wmsx.SlotNormal.prototype = wmsx.Slot.base;

wmsx.SlotNormal.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.SlotNormal();
    cart.loadState(state);
    return cart;
};
