// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Special 64K ROM with 4 16K banks
// 0x4000 - 0xbfff

wmsx.CartridgeHarryFox = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
    }

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = bank2Offset = -0x4000;
    };

    this.write = function(address, value) {
        if (address >= 0x6000 && address < 0x7000) {
            bank1Offset = (value & 1 ? 0x8000 : 0) - 0x4000;        // Page 0 or 2
            return;
        }
        if (address >= 0x7000 && address < 0x8000)
            bank2Offset = (value & 1 ? 0xc000 : 0x4000) - 0x8000;   // Page 1 or 3
    };

    this.read = function(address) {
        if (address < 0x4000)
            return 0xff;
        if (address < 0x8000)
            return bytes[bank1Offset + address];
        if (address < 0xc000)
            return bytes[bank2Offset + address];
        return 0xff;
    };


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;

    this.rom = null;
    this.format = wmsx.SlotFormats.HarryFox;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank1Offset,
            b2: bank2Offset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
    };


    if (rom) init(this);

};

wmsx.CartridgeHarryFox.prototype = wmsx.Slot.base;

wmsx.CartridgeHarryFox.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeHarryFox();
    cart.loadState(state);
    return cart;
};
