// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with (n >= 2) * 16K banks, mapped in 2 16K banks starting at 0x4000
wmsx.CartridgeASCII16K = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
        numBanks = (content.length / 16384) | 0;
    }

    this.powerOn = function() {
        bank1Offset = bank2Offset = -0x4000;
    };

    this.write = function(address, value) {
        if (address >= 0x6000 && address < 0x7000)
            bank1Offset = (value % numBanks) * 0x4000 - 0x4000;
        else if (address >= 0x7000 && address < 0x8000)
            bank2Offset = (value % numBanks) * 0x4000 - 0x8000;
    };

    this.read = function(address) {
        if (address < 0x8000)
            return bytes[bank1Offset + address];    // May underflow if address < 0x4000
        else
            return bytes[bank2Offset + address];
    };


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.ASCII16;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressUInt8ArrayToStringBase64(bytes),
            b1: bank1Offset,
            b2: bank2Offset,
            n: numBanks
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToUInt8Array(s.b);
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        numBanks = s.n;
    };


    if (rom) init(this);

};

wmsx.CartridgeASCII16K.prototype = wmsx.Slot.base;

wmsx.CartridgeASCII16K.createFromSaveState = function(state) {
    var cart = new wmsx.CartridgeASCII16K();
    cart.loadState(state);
    return cart;
};
