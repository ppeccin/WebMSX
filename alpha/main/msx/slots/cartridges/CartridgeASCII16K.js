// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 16K banks, mapped in 2 16K banks starting at 0x4000
// Support for normal ASCII16 ROMS and MSX Write (extra switching addresses)
// 0x4000 - 0xbfff

wmsx.CartridgeASCII16K = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 16384) | 0;
        setExtraSwicthes(format);
    }

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = -0x4000; bank2Offset = -0x8000;
    };

    this.write = function(address, value) {
        if ((address >= 0x6000 && address < 0x6800) || address === extraBank1Switch) {
            bank1Offset = ((value % numBanks) << 14) - 0x4000;
            return;
        }
        if ((address >= 0x7000 && address < 0x7800) || address === extraBank2Switch)
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

    function setExtraSwicthes(format) {
        if (format === wmsx.SlotFormats.MSXWrite) {
            extraBank1Switch = 0x6fff;
            extraBank2Switch = 0x7fff;
        } else {
            extraBank1Switch = -1; extraBank2Switch = -1;
        }
    }


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var numBanks;

    var extraBank1Switch, extraBank2Switch;

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
            n: numBanks
        };
    };

    this.loadState = function(s) {
        this.format = wmsx.SlotFormats[s.f];
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        numBanks = s.n;
        setExtraSwicthes(this.format);
    };


    if (rom) init(this);

};

wmsx.CartridgeASCII16K.prototype = wmsx.Slot.base;

wmsx.CartridgeASCII16K.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeASCII16K();
    cart.loadState(state);
    return cart;
};
