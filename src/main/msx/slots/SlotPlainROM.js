// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Any ROM Content. Used for Unknown ROMs while testing

wmsx.SlotPlainROM = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        baseAddress = rom.info.s !== undefined ? rom.info.s : 0;
        topAddress = baseAddress + bytes.length;
    }

    this.read = function(address) {
        if (address >= baseAddress && address < topAddress)
            return bytes[address - baseAddress];

        return 0xff;
    };


    var bytes;
    this.bytes = null;

    var topAddress, baseAddress;

    this.rom = null;
    this.format = wmsx.SlotFormats.PlainROM;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            ba: baseAddress
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        baseAddress = s.ba;
        topAddress = baseAddress + bytes.length;
    };


    if (rom) init(this);

};

wmsx.SlotPlainROM.prototype = wmsx.Slot.base;

wmsx.SlotPlainROM.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.SlotPlainROM();
    cart.loadState(state);
    return cart;
};
