// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX2 16K BIOS Extension ROM
// 0x0000 -> Size

wmsx.SlotMSX2BIOSExt = function(rom) {
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
        else
            return 0xff;
    };


    var bytes;
    this.bytes = null;

    var size;

    this.rom = null;
    this.format = wmsx.SlotFormats.MSX2BIOSExt;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: this.lightState() ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        if (s.b)
            bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        else {
            this.rom.reloadEmbeddedContent();
            bytes = wmsx.Util.asNormalArray(this.rom.content);
        }
        this.bytes = bytes;
        size = bytes.length;
    };


    if (rom) init(this);

};

wmsx.SlotMSX2BIOSExt.prototype = wmsx.Slot.base;

wmsx.SlotMSX2BIOSExt.recreateFromSaveState = function(state, previousSlot) {
    var ext = previousSlot || new wmsx.SlotMSX2BIOSExt();
    ext.loadState(state);
    return ext;
};

