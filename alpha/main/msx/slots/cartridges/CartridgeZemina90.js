// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 16K banks, mapped in 2 16K banks starting at 0x4000
// 0x4000 - 0xbfff

wmsx.CartridgeZemina90 = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
    }

    this.connect = function(machine) {
        machine.bus.connectOutputDevice(0x77, this.output77);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectOutputDevice(0x77, this.output77);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        this.output77(0);
    };

    this.read = function(address) {
        if (address < 0x4000)
            return 0xff;
        if (address < 0x8000)
            return bytes[bank1Offset + address];
        if (address < 0xc000)
            return bank2Swap
                ? bytes[(bank2Offset + address) ^ 0x2000]     // Swap first and last 8K blocks
                : bytes[bank2Offset + address];
        return 0xff;
    };

    this.output77 = function (val, port) {
        banksConfig = val;
        var page = val & 0x3f;
        var mode = val >> 6;    // mode 0, 1: bank1 and bank2 on same page; mode 2: bank 1 = page & ~1, bank 2 = page | 1; mode 3: bank2 = bank1 with 8K blocks swapped
        if (mode === 2) {
            bank1Offset = ((page & 0x3e) << 14) - 0x4000;
            bank2Offset = ((page | 0x01) << 14) - 0x8000;
        } else {
            bank1Offset = (page << 14) - 0x4000;
            bank2Offset = (page << 14) - 0x8000;
        }
        bank2Swap = mode === 3;
    };


    var bytes;
    this.bytes = null;

    var banksConfig;
    var bank1Offset;
    var bank2Offset;
    var bank2Swap;

    this.rom = null;
    this.format = wmsx.SlotFormats.Zemina90in1;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            bc: banksConfig
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        this.output77(s.bc);
    };


    if (rom) init(this);

};

wmsx.CartridgeZemina90.prototype = wmsx.Slot.base;

wmsx.CartridgeZemina90.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeZemina90();
    cart.loadState(state);
    return cart;
};
