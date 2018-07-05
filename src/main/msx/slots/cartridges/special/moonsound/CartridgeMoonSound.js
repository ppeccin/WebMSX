// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MoonSound OPL4 Music Cartridge with 2M ROM + 2M SRAM
// Controls a YMF278B sound chip
// ROM and RAM here will be accessed by the OPL4 directly, not mapped to MSX memory space

wmsx.CartridgeMoonSound = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content, 0, 0x400000);
        wmsx.Util.arrayFill(bytes, 0, 0x200000);
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

    this.opl4ReadMemory = function(address) {
        return bytes[address & 0x3fffff];
    };

    this.opl4WriteMemory = function(address, val) {
        if ((address & 0x3fffff) < 0x200000) return;    // ROM

        bytes[address & 0x3fffff] = val;                // RAM
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.MoonSound;

    var opl4 = new wmsx.OPL4Audio("MoonSound", this);
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
