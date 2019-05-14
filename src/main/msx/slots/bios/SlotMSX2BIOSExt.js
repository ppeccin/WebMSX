// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX2 BIOS Extension ROM content >= 16K & <= 64K, starting at 0x0000. Can be bundled with other BIOS/ROMs
// 0x0000 - ????

wmsx.SlotMSX2BIOSExt = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        topAddress = bytes.length;
    }

    this.read = function(address) {
        if (address < topAddress)
            return bytes[address];
        else
            return 0xff;
    };


    var bytes;
    this.bytes = null;

    var topAddress;

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
            if (!bytes || bytes.length !== this.rom.content.length) bytes = new Array(this.rom.content.length);
            wmsx.Util.arrayCopy(this.rom.content, 0, bytes);
        }
        this.bytes = bytes;
        topAddress = bytes.length;
    };


    if (rom) init(this);

};

wmsx.SlotMSX2BIOSExt.prototype = wmsx.Slot.base;

wmsx.SlotMSX2BIOSExt.recreateFromSaveState = function(state, previousSlot) {
    var ext = previousSlot || new wmsx.SlotMSX2BIOSExt();
    ext.loadState(state);
    return ext;
};

