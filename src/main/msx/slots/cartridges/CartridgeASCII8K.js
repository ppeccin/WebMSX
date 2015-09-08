// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with (n >= 4) * 8K banks, mapped in 4 8K banks starting at 0x4000
wmsx.CartridgeASCII8K = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = wmsx.Util.arrayFill(new Array(content.length), 0x00);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
        numBanks = (content.length / 8192) | 0;
    }

    this.powerOn = function(paused) {
        bank1Offset = bank2Offset = bank3Offset = bank4Offset = -0x4000;
    };

    this.write = function(address, value) {
        if (address >= 0x6000 && address < 0x6800)
            bank1Offset = (value % numBanks) * 0x2000 - 0x4000;
        else if (address >= 0x6800 && address < 0x7000)
            bank2Offset = (value % numBanks) * 0x2000 - 0x6000;
        else if (address >= 0x7000 && address < 0x7800)
            bank3Offset = (value % numBanks) * 0x2000 - 0x8000;
        else if (address >= 0x7800 && address < 0x8000)
            bank4Offset = (value % numBanks) * 0x2000 - 0xa000;
    };

    this.read = function(address) {
        if (address < 0x6000)
            return bytes[bank1Offset + address];
        else if (address < 0x8000)
            return bytes[bank2Offset + address];
        else if (address < 0xa000)
            return bytes[bank3Offset + address];
        else
            return bytes[bank4Offset + address];
    };


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var bank3Offset;
    var bank4Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.ASCII8;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(wmsx.Util.uInt8ArrayToByteString(bytes)),
            b1: bank1Offset,
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset,
            n: numBanks
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.byteStringToUInt8Array(atob(s.b));
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        numBanks = s.n;
    };


    if (rom) init(this);

};

wmsx.CartridgeASCII8K.prototype = wmsx.Slot.base;

wmsx.CartridgeASCII8K.createFromSaveState = function(state) {
    var cart = new wmsx.CartridgeASCII8K();
    cart.loadState(state);
    return cart;
};
