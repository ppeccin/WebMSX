// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 8K banks, mapped in 6 8K banks starting at 0x0000
// 0x0000 - 0xbfff

wmsx.CartridgeNeo8 = function(rom) {
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
        bank0Offset = -0x0000; bank1Offset = -0x2000; bank2Offset = -0x4000; bank3Offset = -0x6000; bank4Offset = -0x8000; bank5Offset = -0xa000;
    };

    this.write = function(address, value) {
        var bank = (address >> 11) & 0x07;
        if (bank === 2) {
            bank0Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank0Offset >> 13)) & 0x00ff)) % numBanks) << 13)   // Set bank register MSB
                : (((((bank0Offset >> 13) & 0xff00) | value) % numBanks) << 13);                    // Set bank register LSB
            return;
        }
        if (bank === 3) {
            bank1Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank1Offset + 0x2000) >> 13) & 0x00ff)) % numBanks) << 13) - 0x2000
                : ((((((bank1Offset + 0x2000) >> 13) & 0xff00) | value) % numBanks) << 13) - 0x2000;
            return;
        }
        if (bank === 4) {
            bank2Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank2Offset + 0x4000) >> 13) & 0x00ff)) % numBanks) << 13) - 0x4000
                : ((((((bank2Offset + 0x4000) >> 13) & 0xff00) | value) % numBanks) << 13) - 0x4000;
            return;
        }
        if (bank === 5) {
            bank3Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank3Offset + 0x6000) >> 13) & 0x00ff)) % numBanks) << 13) - 0x6000
                : ((((((bank3Offset + 0x6000) >> 13) & 0xFF00) | value) % numBanks) << 13) - 0x6000;
            return;
        }
        if (bank === 6) {
            bank4Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank4Offset + 0x8000) >> 13) & 0x00ff)) % numBanks) << 13) - 0x8000
                : ((((((bank4Offset + 0x8000) >> 13) & 0xff00) | value) % numBanks) << 13) - 0x8000;
            return;
        }
        if (bank === 7) {
            bank5Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank5Offset + 0xa000) >> 13) & 0x00ff)) % numBanks) << 13) - 0xa000
                : ((((((bank5Offset + 0xa000) >> 13) & 0xff00) | value) % numBanks) << 13) - 0xa000;
        }
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            case 0x0000: return bytes[bank0Offset + address];
            case 0x2000: return bytes[bank1Offset + address];
            case 0x4000: return bytes[bank2Offset + address];
            case 0x6000: return bytes[bank3Offset + address];
            case 0x8000: return bytes[bank4Offset + address];
            case 0xa000: return bytes[bank5Offset + address];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank0Offset;
    var bank1Offset;
    var bank2Offset;
    var bank3Offset;
    var bank4Offset;
    var bank5Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.Neo8;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b0: bank0Offset,
            b1: bank1Offset,
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset,
            b5: bank5Offset,
            n: numBanks
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank0Offset = s.b0;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        bank5Offset = s.b5;
        numBanks = s.n;
    };


    if (rom) init(this);

};

wmsx.CartridgeNeo8.prototype = wmsx.Slot.base;

wmsx.CartridgeNeo8.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeNeo8();
    cart.loadState(state);
    return cart;
};
