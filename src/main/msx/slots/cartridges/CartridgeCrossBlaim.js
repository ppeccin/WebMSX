// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Special 64K ROM with 4 16K banks. Bank 1 at 0x4000 fixed at position 0, bank 2 at 0x8000 variable
wmsx.CartridgeCrossBlaim = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank2Offset = 0x4000 - 0x8000;
    };

    this.write = function(address, value) {
        if (address === 0x4045)
            bank2Offset = (value % 4) * 0x4000 - 0x8000;
    };

    this.read = function(address) {
        // bank1 (at 0x4000) is fixed at position 0
        if (address < 0x8000)
            return bytes[address - 0x4000];         // May underflow if address < 0x4000
        else
            return bytes[bank2Offset + address];
    };


    var bytes;
    this.bytes = null;

    var bank2Offset;

    this.rom = null;
    this.format = wmsx.SlotFormats.CrossBlaim;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank2Offset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank2Offset = s.b1;
    };


    if (rom) init(this);

};

wmsx.CartridgeCrossBlaim.prototype = wmsx.Slot.base;

wmsx.CartridgeCrossBlaim.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeCrossBlaim();
    cart.loadState(state);
    return cart;
};
