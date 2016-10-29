// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Special encoded ROMs with 32K. Encoder info from OpenMSX
// 0x4000 - 0xbfff

wmsx.CartridgeDooly = function(rom) {
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
        encoding = 0;
    };

    this.write = function(address, value) {
        if (address >= 0x4000 && address < 0xc000) encoding = value & 0x07;
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0xc000) {
            var res = bytes[address - 0x4000];
            switch (encoding) {
                case 0:
                    return res;
                case 1:
                    return (res & 0xf8) | (res << 2 & 0x04) | (res >> 1 & 0x03);
                case 4:
                    return (res & 0xf8) | (res >> 2 & 0x01) | (res << 1 & 0x06);
                case 2: case 5: case 6:
                    switch (res & 0x07) {
                        case 1: case 2: case 4:
                            return res & 0xf8;
                        case 3: case 5: case 6:
                            if (encoding == 2) return (res & 0xf8) | (((res << 2 & 0x04) | (res >> 1 & 0x03)) ^ 0x07);
                            if (encoding == 5) return res ^ 0x07;
                            if (encoding == 6) return (res & 0xf8) | (((res >> 2 & 0x01) | (res << 1 & 0x06)) ^ 0x07);
                            // fall-through
                        default:
                            return res;
                    }
                default:
                    return res | 0x07;
            }
        }
        return 0xff;
    };


    var bytes;
    this.bytes = null;

    var encoding;

    this.rom = null;
    this.format = wmsx.SlotFormats.Dooly;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            e: encoding
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        encoding = s.e;
    };


    if (rom) init(this);

};

wmsx.CartridgeDooly.prototype = wmsx.Slot.base;

wmsx.CartridgeDooly.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeDooly();
    cart.loadState(state);
    return cart;
};
