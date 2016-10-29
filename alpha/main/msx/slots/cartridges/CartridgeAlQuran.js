// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// The Holy Quran ROMs with 1024K, mapped in 4 8K banks starting at 0x4000
// Encoded or pre Decoded variations
// 0x4000 - 0xbfff

wmsx.CartridgeAlQuran = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        if (format === wmsx.SlotFormats.AlQuran) decodeROM();
    }

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = -0x4000; bank2Offset = -0x6000; bank3Offset = -0x8000; bank4Offset = -0xa000;
    };

    this.write = function(address, value) {
        if (address < 0x5000)
            return;
        if (address < 0x5400) {
            bank1Offset = ((value & 0x7f) << 13) - 0x4000;
            return;
        }
        if (address < 0x5800) {
            bank2Offset = ((value & 0x7f) << 13) - 0x6000;
            return;
        }
        if (address < 0x5c00) {
            bank3Offset = ((value & 0x7f) << 13) - 0x8000;
            return;
        }
        if (address < 0x6000)
            bank4Offset = ((value & 0x7f) << 13) - 0xa000;
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

    function decodeROM() {
        // ROM can be encoded using simple bit operations. NOT TESTED! Could not find original encoded ROM. Decoding info from OpenMSX
        var decode = new Array(256);
        for (var i = 0; i < 256; ++i)
            decode[i] = (((i << 4) & 0x50) | ((i >> 3) & 0x05) | ((i << 1) & 0xa0) | ((i << 2) & 0x08) | ((i >> 6) & 0x02)) ^ 0x4d;
        for (var b = 0, len = bytes.length; b < len; ++b)
            bytes[b] = decode[bytes[b]];
    }


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var bank3Offset;
    var bank4Offset;

    this.rom = null;
    this.format = format;


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
        this.format = wmsx.SlotFormats[s.f];
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
    };


    if (rom) init(this);

};

wmsx.CartridgeAlQuran.prototype = wmsx.Slot.base;

wmsx.CartridgeAlQuran.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeAlQuran();
    cart.loadState(state);
    return cart;
};
