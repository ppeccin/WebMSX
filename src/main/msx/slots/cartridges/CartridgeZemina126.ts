// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 16K banks, mapped in 2 16K banks starting at 0x4000
// 0x4000 - 0xbfff

wmsx.CartridgeZemina126 = function(rom) {
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
        bank1Offset = bank2Offset = -0x4000;
    };

    this.write = function(address, value) {
        if (address === 0x4000) {
            bank1Offset = ((value % numBanks) << 14) - 0x4000;
            return;
        }
        if (address === 0x4001)
            bank2Offset = ((value % numBanks) << 14) - 0x8000;
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
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.Zemina126in1;


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
        numBanks = (bytes.length / 16384) | 0;
    };


    if (rom) init(this);

};

wmsx.CartridgeZemina126.prototype = wmsx.Slot.base;

wmsx.CartridgeZemina126.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeZemina126();
    cart.loadState(state);
    return cart;
};
