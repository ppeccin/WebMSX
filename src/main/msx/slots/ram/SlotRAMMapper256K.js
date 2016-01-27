// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotRAMMapper256K = function(content) {

    function init(self) {
        bytes = content;
        self.bytes = bytes;
    }

    this.powerOff = function() {
        // Lose content
        wmsx.Util.arrayFill(bytes, 0x00);
        wmsx.Util.arrayFill(offsets, 0);
    };

    this.connectBus = function(bus) {
        bus.connectOutputDevice(0xfc, this.outputFC);
        bus.connectOutputDevice(0xfd, this.outputFD);
        bus.connectOutputDevice(0xfe, this.outputFE);
        bus.connectOutputDevice(0xff, this.outputFF);
    };

    this.outputFC = function(val) {
        offsets[0] = (val & 0x0f) * 16384;
    };
    this.outputFD = function(val) {
        offsets[1] = (val & 0x0f) * 16384 - 16384;
    };
    this.outputFE = function(val) {
        offsets[2] = (val & 0x0f) * 16384 - 32768;
    };
    this.outputFF = function(val) {
        offsets[3] = (val & 0x0f) * 16384 - 49152;
    };


    this.read = function(address) {
        //wmsx.Util.log ("RAM Mapper read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return bytes[address + offsets[address >>> 14]];
    };

    this.write = function(address, value) {
        //wmsx.Util.log ("RAM Mapper write: " + address.toString(16) + ", " + value.toString(16));
        bytes[address + offsets[address >>> 14]] = value;
    };


    var bytes;
    var offsets = [ 0, 0, 0, 0];
    this.bytes = null;

    this.format = wmsx.SlotFormats.RAMMapper256K;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            b: wmsx.Util.compressArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(state) {
        bytes = wmsx.Util.uncompressStringBase64ToArray(state.b);
        this.bytes = bytes;
    };


    if (content) init(this);

};

wmsx.SlotRAMMapper256K.prototype = wmsx.Slot.base;

wmsx.SlotRAMMapper256K.createNewEmpty = function() {
    return new wmsx.SlotRAMMapper256K(wmsx.Util.arrayFill(new Array(262144), 0x00));
};

wmsx.SlotRAMMapper256K.createFromSaveState = function(state) {
    var ram = new wmsx.SlotRAMMapper256K();
    ram.loadState(state);
    return ram;
};