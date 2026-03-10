// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 16K banks, mapped in 3 16K banks starting at 0x0000
// 0x0000 - 0xbfff

wmsx.CartridgeNeo16 = function(rom) {
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
        bank0Offset = -0x0000; bank1Offset = -0x4000; bank2Offset = -0x8000;
    };

    this.write = function(address, value) {
        var bank = (address >> 11) & 0x07;
        if (bank === 2) {
            bank0Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | ((bank0Offset >> 14) & 0x00ff)) % numBanks) << 14)     // Set bank register MSB
                : (((((bank0Offset >> 14) & 0xff00) | value) % numBanks) << 14);                    // Set bank register LSB
            return;
        }
        if (bank === 4) {
            bank1Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank1Offset + 0x4000) >> 14) & 0x00ff)) % numBanks) << 14) - 0x4000
                : ((((((bank1Offset + 0x4000) >> 14) & 0xff00) | value) % numBanks) << 14) - 0x4000;
            return;
        }
        if (bank === 6) {
            bank2Offset = (address & 1)
                ? (((((value & 0x0f) << 8) | (((bank2Offset + 0x8000) >> 14) & 0x00ff)) % numBanks) << 14) - 0x8000
                : ((((((bank2Offset + 0x8000) >> 14) & 0xff00) | value) % numBanks) << 14) - 0x8000;
        }
    };

    this.read = function(address) {
        switch (address & 0xc000) {
            case 0x0000: return bytes[bank0Offset + address];
            case 0x4000: return bytes[bank1Offset + address];
            case 0x8000: return bytes[bank2Offset + address];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank0Offset;
    var bank1Offset;
    var bank2Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.Neo16;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b0: bank0Offset,
            b1: bank1Offset,
            b2: bank2Offset,
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
        numBanks = s.n;
    };


    if (rom) init(this);

};

wmsx.CartridgeNeo16.prototype = wmsx.Slot.base;

wmsx.CartridgeNeo16.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeNeo16();
    cart.loadState(state);
    return cart;
};
