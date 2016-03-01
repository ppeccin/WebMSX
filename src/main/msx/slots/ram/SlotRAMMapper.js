// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX2 Standard RAM Mapper. Supports sizes from 128KB to 4MB

wmsx.SlotRAMMapper = function(content, size) {

    function init(self) {
        if (content) {
            bytes = content;
        } else {
            bytes = new Array(size);
        }
        self.bytes = bytes;
        pages = (bytes.length / 16384) | 0;
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
        pageOffsets[0] = (val % pages) * 16384;
    };
    this.outputFD = function(val) {
        pageOffsets[1] = (val % pages) * 16384 - 16384;
    };
    this.outputFE = function(val) {
        pageOffsets[2] = (val % pages) * 16384 - 32768;
    };
    this.outputFF = function(val) {
        pageOffsets[3] = (val % pages) * 16384 - 49152;
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
    var pages = 0;

    this.bytes = null;

    this.format = wmsx.SlotFormats.RAMMapper;


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


    init(this);

};

wmsx.SlotRAMMapper.prototype = wmsx.Slot.base;

wmsx.SlotRAMMapper.createNewEmpty = function(size) {
    return new wmsx.SlotRAMMapper(null, size);
};

wmsx.SlotRAMMapper.recreateFromSaveState = function(state, previousSlot) {
    var ram = previousSlot || new wmsx.SlotRAMMapper(null, 0);
    ram.loadState(state);
    return ram;
};