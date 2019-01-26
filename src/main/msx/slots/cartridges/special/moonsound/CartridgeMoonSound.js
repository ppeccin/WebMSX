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
        var emb = wmsx.EmbeddedFiles.isEmbeddedURL(this.rom.source);
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: emb ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes),                          // ROM + RAM
            ra: !emb ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes, 0x200000, 0x200000),    // only RAM
            opl4: opl4.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        if (s.b)
            bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);                           // ROM + RAM
        else {
            if (!bytes) bytes = new Array(0x400000);
            bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.ra, bytes, true, null, 0x200000);    // RAM
            this.rom.reloadEmbeddedContent();
            wmsx.Util.arrayCopy(this.rom.content, 0, bytes);                                              // ROM
        }
        this.bytes = bytes;
        opl4.loadState(s.opl4);

        //console.log("MoonSound LoadState length:", JSON.stringify(s).length);
    };


    if (rom) init(this);

};

wmsx.CartridgeMoonSound.prototype = wmsx.Slot.base;

wmsx.CartridgeMoonSound.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMoonSound();
    cart.loadState(state);
    return cart;
};
