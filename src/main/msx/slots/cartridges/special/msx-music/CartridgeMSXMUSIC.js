// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX-MUSIC Expansion with 16K ROM
// Controls a YM2413 FM sound chip
// 0x4000 - 0x7fff

wmsx.CartridgeMSXMUSIC = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.connect = function(machine) {
        fm.connect(machine);
    };

    this.disconnect = function(machine) {
        fm.disconnect(machine);
    };

    this.powerOn = function() {
        fm.powerOn();
        this.reset();
    };

    this.powerOff = function() {
        fm.powerOff();
    };

    this.reset = function() {
        fm.reset();
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8000)      // page 1 only
            return bytes[address - 0x4000];
        else
            return 0xff;
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.MSXMUSIC;

    var fm = new wmsx.YM2413Audio("MSX-MUSIC");
    this.fm = fm;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            fm: fm.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        fm.loadState(s.fm);
    };


    if (rom) init(this);

};

wmsx.CartridgeMSXMUSIC.prototype = wmsx.Slot.base;

wmsx.CartridgeMSXMUSIC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMSXMUSIC();
    cart.loadState(state);
    return cart;
};
