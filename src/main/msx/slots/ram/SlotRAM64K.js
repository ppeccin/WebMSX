// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Standard 64K RAM Slot
// 0x0000 - 0xffff

wmsx.SlotRAM64K = function(rom) {

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.arrayFill(new Array(65536), 0x00);
        self.bytes = bytes;
    }

    this.powerOff = function() {
        // Lose content
        wmsx.Util.arrayFill(bytes, 0x00);
    };

    this.read = function(address) {
        //wmsx.Util.log ("RAM read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return bytes[address];
    };

    this.write = function(address, value) {
        //wmsx.Util.log ("RAM write: " + address.toString(16) + ", " + value.toString(16));
        bytes[address] = value;
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.RAM64K;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(state) {
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
    };


    if (rom) init(this);

};

wmsx.SlotRAM64K.prototype = wmsx.Slot.base;

wmsx.SlotRAM64K.recreateFromSaveState = function(state, previousSlot) {
    var ram = previousSlot || new wmsx.SlotRAM64K();
    ram.loadState(state);
    return ram;
};