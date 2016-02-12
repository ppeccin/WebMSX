// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX2 16K BIOS Extension. Always at 0x0000
wmsx.MSX2BIOSEXT = function(rom) {

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.arrayFill(new Array(65536), 0xff);
        self.bytes = bytes;
        var content = self.rom.content;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.write = function(address, value) {
        // ROMs cannot be modified
        //wmsx.Util.log ("Write over BIOS EXT ROM at " + address.toString(16) + " := " + value.toString(16));
    };

    this.read = function(address) {
        return bytes[address];
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.MSX2BIOSEXT;


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
    };


    if (rom) init(this);

};

wmsx.MSX2BIOSEXT.prototype = wmsx.Slot.base;

wmsx.MSX2BIOSEXT.recreateFromSaveState = function(state, previousSlot) {
    var ext = new wmsx.MSX2BIOSEXT();
    ext.loadState(state);
    return ext;
};

