// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotRAM64K = function(content) {

    function init(self) {
        bytes = content;
        self.bytes = bytes;
    }

    this.read = function(address) {
        //console.log ("RAM read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return bytes[address];
    };

    this.write = function(address, value) {
        //console.log ("RAM write: " + address.toString(16) + ", " + value.toString(16));
        bytes[address] = value;
    };


    var bytes;
    this.bytes = null;

    this.format = wmsx.SlotFormats.RAM64K;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            b: btoa(wmsx.Util.uInt8ArrayToByteString(bytes))
        };
    };

    this.loadState = function(state) {
        bytes = wmsx.Util.byteStringToUInt8Array(atob(state.b));
    };


    if (content) init(this);

};

wmsx.SlotRAM64K.prototype = wmsx.Slot.base;

wmsx.SlotRAM64K.createNewEmpty = function() {
    return new wmsx.SlotRAM64K(wmsx.Util.arrayFill(new Array(65536), 0xff));
};

wmsx.SlotRAM64K.createFromSaveState = function(state) {
    var ram = new wmsx.SlotRAM64K();
    ram.loadState(state);
    return ram;
};