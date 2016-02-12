// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotRAMMapper256K = function(content) {

    function init(self) {
        bytes = content;
        self.bytes = bytes;
    }

    this.powerOff = function() {
        // Lose content
        wmsx.Util.arrayFill(bytes, 0x00);
        wmsx.Util.arrayFill(pageOffsets, 0);
    };

    this.connect = function(machine) {
        machine.bus.connectOutputDevice(0xfc, this.outputFC);
        machine.bus.connectOutputDevice(0xfd, this.outputFD);
        machine.bus.connectOutputDevice(0xfe, this.outputFE);
        machine.bus.connectOutputDevice(0xff, this.outputFF);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectOutputDevice(0xfc);
        machine.bus.disconnectOutputDevice(0xfd);
        machine.bus.disconnectOutputDevice(0xfe);
        machine.bus.disconnectOutputDevice(0xff);
    };

    this.outputFC = function(val) {
        pageOffsets[0] = (val & 0x0f) * 16384;
    };
    this.outputFD = function(val) {
        pageOffsets[1] = (val & 0x0f) * 16384 - 16384;
    };
    this.outputFE = function(val) {
        pageOffsets[2] = (val & 0x0f) * 16384 - 32768;
    };
    this.outputFF = function(val) {
        pageOffsets[3] = (val & 0x0f) * 16384 - 49152;
    };

    this.read = function(address) {
        //wmsx.Util.log ("RAM Mapper read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return bytes[address + pageOffsets[address >>> 14]];
    };

    this.write = function(address, value) {
        //wmsx.Util.log ("RAM Mapper write: " + address.toString(16) + ", " + value.toString(16));
        bytes[address + pageOffsets[address >>> 14]] = value;
    };


    var bytes;
    var pageOffsets = [ 0, 0, 0, 0 ];

    this.bytes = null;

    this.format = wmsx.SlotFormats.RAMMapper256K;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            p0: pageOffsets[0], p1: pageOffsets[1], p2: pageOffsets[2], p3: pageOffsets[3]
        };
    };

    this.loadState = function(state) {
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        pageOffsets[0] = state.p0; pageOffsets[1] = state.p1; pageOffsets[2] = state.p2; pageOffsets[3] = state.p3;
    };


    if (content) init(this);

};

wmsx.SlotRAMMapper256K.prototype = wmsx.Slot.base;

wmsx.SlotRAMMapper256K.createNewEmpty = function() {
    return new wmsx.SlotRAMMapper256K(wmsx.Util.arrayFill(new Array(262144), 0x00));
};

wmsx.SlotRAMMapper256K.recreateFromSaveState = function(state, previousSlot) {
    var ram = previousSlot || new wmsx.SlotRAMMapper256K();
    ram.loadState(state);
    return ram;
};