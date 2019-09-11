// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Any ROM Content. Used for Unknown ROMs while testing

wmsx.SlotPlainROM = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        size = bytes.length;
    }

    this.read = function(address) {
        if (address < size)
            return bytes[address];

        return 0xff;
    };


    var bytes;
    this.bytes = null;

    var size;

    this.rom = null;
    this.format = wmsx.SlotFormats.PlainROM;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        size = bytes.length;
    };


    if (rom) init(this);

};

wmsx.SlotPlainROM.prototype = wmsx.Slot.base;

wmsx.SlotPlainROM.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.SlotPlainROM();
    cart.loadState(state);
    return cart;
};
