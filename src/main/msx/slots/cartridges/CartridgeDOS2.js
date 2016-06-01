// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// DOS 2 ROM with 64K, in 4 * 16K banks, mapped only in page 1 at 0x4000
// 0x4000 - 0x7fff

wmsx.CartridgeDOS2 = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.connect = function(machine) {
        machine.getDiskDriveSocket().dos2CartridgeConnected(this);
    };

    this.disconnect = function(machine) {
        machine.getDiskDriveSocket().dos2CartridgeDisconnected(this);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bankOffset = -0x4000;
    };

    this.write = function(address, value) {
        if (address === 0x7ffe)
            bankOffset = ((value & 0x03) << 14) - 0x4000;
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8000)      // page 1 only
            return bytes[bankOffset + address];
        else
            return 0xff;
    };


    var bytes;
    this.bytes = null;

    var bankOffset;

    this.rom = null;
    this.format = wmsx.SlotFormats.DOS2;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bankOffset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bankOffset = s.b1;
    };


    if (rom) init(this);

};

wmsx.CartridgeDOS2.prototype = wmsx.Slot.base;

wmsx.CartridgeDOS2.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeDOS2();
    cart.loadState(state);
    return cart;
};
