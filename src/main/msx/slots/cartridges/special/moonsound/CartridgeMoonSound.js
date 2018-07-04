// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX-MUSIC Expansion with 16K ROM
// Controls a YM2413 FM sound chip
// 0x4000 - 0x7fff

wmsx.CartridgeMoonSound = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
    }

    this.connect = function(machine) {
        opl4.connect(machine);
    };

    this.disconnect = function(machine) {
        opl4.disconnect(machine);
    };

    this.powerOn = function() {
        opl4.powerOn();
        this.reset();
    };

    this.powerOff = function() {
        opl4.powerOff();
    };

    this.reset = function() {
        opl4.reset();
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8000)      // page 1 only
            return bytes[address - 0x4000];
        return 0xff;
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.MoonSound;

    var opl4 = new wmsx.OPL4Audio("MoonSound");
    this.opl4 = opl4;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            opl4: opl4.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        opl4.loadState(s.opl4);
    };


    if (rom) init(this);

};

wmsx.CartridgeMoonSound.prototype = wmsx.Slot.base;

wmsx.CartridgeMoonSound.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMoonSound();
    cart.loadState(state);
    return cart;
};
