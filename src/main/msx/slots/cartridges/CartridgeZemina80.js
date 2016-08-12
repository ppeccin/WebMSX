// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 8K banks, mapped in 4 8K banks starting at 0x4000
// 0x4000 - 0xbfff

wmsx.CartridgeZemina80 = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 8192) | 0;
    }

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = bank2Offset = bank3Offset = bank4Offset = -0x4000;
    };

    this.write = function(address, value) {
        switch (address) {
            case 0x4000:
                bank1Offset = ((value % numBanks) << 13) - 0x4000;
                return;
            case 0x4001:
                bank2Offset = ((value % numBanks) << 13) - 0x6000;
                return;
            case 0x4002:
                bank3Offset = ((value % numBanks) << 13) - 0x8000;
                return;
            case 0x4003:
                bank4Offset = ((value % numBanks) << 13) - 0xa000;
        }
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            case 0x4000: return bytes[bank1Offset + address];
            case 0x6000: return bytes[bank2Offset + address];
            case 0x8000: return bytes[bank3Offset + address];
            case 0xa000: return bytes[bank4Offset + address];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var bank3Offset;
    var bank4Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.Zemina80in1;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank1Offset,
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        numBanks = (bytes.length / 8192) | 0;
    };


    if (rom) init(this);

};

wmsx.CartridgeZemina80.prototype = wmsx.Slot.base;

wmsx.CartridgeZemina80.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeZemina80();
    cart.loadState(state);
    return cart;
};
