// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Verify: NOT TESTED. Could not find ROM
// Super Swangi ROM with n * 16K banks, mapped in 2 16K banks starting at 0x4000
// 0x4000 - 0xbfff

wmsx.CartridgeSuperSwangi = function(rom) {
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
        bank2Offset = -0x8000;
    };

    this.write = function(address, value) {
        // Bank 1 fixed
        if (address === 0x8000)
            bank2Offset = (((value >> 1) % numBanks) << 14) - 0x8000;   // Ignore bit 0?
    };

    this.read = function(address) {
        if (address < 0x4000)
            return 0xff;
        if (address < 0x8000)
            return bytes[address - 0x4000];
        if (address < 0xc000)
            return bytes[bank2Offset + address];
        return 0xff;
    };

    var bytes;
    this.bytes = null;

    var bank2Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.SuperSwangi;


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
        numBanks = (bytes.length / 16384) | 0;
    };


    if (rom) init(this);

};

wmsx.CartridgeSuperSwangi.prototype = wmsx.Slot.base;

wmsx.CartridgeSuperSwangi.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeSuperSwangi();
    cart.loadState(state);
    return cart;
};
