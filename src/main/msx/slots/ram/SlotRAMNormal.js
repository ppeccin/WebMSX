// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Standard 64K RAM Slot
// 0x0000 - 0xffff

wmsx.SlotRAMNormal = function(rom) {
"use strict";

    function init(self, rom) {
        self.rom = rom;
        var size = WMSX.RAMNORMAL_SIZE;
        if (size < 1) size = 1; else if (size > 64) size = 64;          // Spec says minimum is 16K, but we will allow less
        bytes = new Uint8Array(size * 1024);   // wmsx.Util.arrayFill(new Array(size * 1024), 0);
        baseAddress = 65536 - bytes.length;
        self.bytes = bytes;
    }

    this.refreshConnect = function() {
        // Updates size if necessary
        if (WMSX.RAMNORMAL_SIZE * 1024 !== bytes.length) init(this, this.rom);
    };

    this.powerOff = function() {
        // Lose content
        wmsx.Util.arrayFill(bytes, 0x00);
    };

    this.read = function(address) {
        //wmsx.Util.log ("RAM read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return address >= baseAddress
            ? bytes[address - baseAddress]
            : 0xff;
    };

    this.write = function(address, value) {
        //wmsx.Util.log ("RAM write: " + address.toString(16) + ", " + value.toString(16));
        if (address >= baseAddress) bytes[address - baseAddress] = value;
    };



    var bytes;
    this.bytes = null;

    var baseAddress = 0;

    this.rom = null;
    this.format = wmsx.SlotFormats.RAMNormal;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(state) {
        this.rom = wmsx.ROM.loadState(state.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        baseAddress = 65536 - bytes.length;
    };


    if (rom) init(this, rom);

};

wmsx.SlotRAMNormal.prototype = wmsx.Slot.base;

wmsx.SlotRAMNormal.recreateFromSaveState = function(state, previousSlot) {
    var ram = previousSlot || new wmsx.SlotRAMNormal();
    ram.loadState(state);
    return ram;
};