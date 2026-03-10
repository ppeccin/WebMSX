// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 16K banks, mapped in 2 16K banks starting at 0x4000
// 0x4000 - 0xbfff

wmsx.CartridgeASCII16X = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 16384) | 0;
    }

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = -0x4000; bank2Offset = -0x8000;
    };

    this.write = function(address, value) {
        if ((address & 0x3000) === 0x2000)
            bank1Offset = ((((address & 0x0f00) | value) % numBanks) << 14) - 0x4000;
        else if ((address & 0x3000) === 0x3000)
            bank2Offset = ((((address & 0x0f00) | value) % numBanks) << 14) - 0x8000;
    };

    this.read = function(address) {
        switch (address & 0xc000) {
            case 0x0000:
                return bytes[bank2Offset + address + 0x8000];
            case 0x4000:
                return bytes[bank1Offset + address];
            case 0x8000:
                return bytes[bank2Offset + address];
            case 0xC000:
                return bytes[bank1Offset + address - 0x8000];
        }
    };


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.ASCII16X;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank1Offset,
            b2: bank2Offset,
            n: numBanks
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        numBanks = s.n;
    };


    if (rom) init(this);

};

wmsx.CartridgeASCII16X.prototype = wmsx.Slot.base;

wmsx.CartridgeASCII16X.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeASCII16X();
    cart.loadState(state);
    return cart;
};
