// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Special 384K ROM with 24 * 16K banks. Bank 1 at 0x4000 fixed at page 0x0f, bank 2 at 0x8000 variable
wmsx.CartridgeRType = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.powerOn = function() {
        bank2Offset = -0x8000;
    };

    this.write = function(address, value) {
        // bank1 fixed at page 0x0f
        if (address >= 0x7000 && address < 0x8000)
            bank2Offset = (value % 24) * 0x4000 - 0x8000;
    };

    this.read = function(address) {
        if (address < 0x8000)
            return bytes[229376 + address];         // Bank 1 fixed at page 0x0f, so 0x0f * 16304 - 0x4000
        else
            return bytes[bank2Offset + address];
    };


    var bytes;
    this.bytes = null;

    var bank2Offset;

    this.rom = null;
    this.format = wmsx.SlotFormats.ASCII16;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b2: bank2Offset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank2Offset = s.b2;
    };


    if (rom) init(this);

};

wmsx.CartridgeRType.prototype = wmsx.Slot.base;

wmsx.CartridgeRType.recreateFromSaveState = function(state, previousSlot) {
    var cart = new wmsx.CartridgeRType();
    cart.loadState(state);
    return cart;
};
