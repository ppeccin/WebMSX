// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// RAM with min 32 * 8K banks and max 256 * 8K banks, mapped in 4 8K banks starting at 0x4000
// Read and Write modes
// 0x4000 - 0xbfff
// Port 0x8e

wmsx.CartridgeMegaRAM = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 8192) | 0;
    }

    this.connect = function(machine) {
        machine.bus.connectInputDevice( 0x8e, this.input8E);
        machine.bus.connectOutputDevice(0x8e, this.output8E);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectInputDevice( 0x8e, this.input8E);
        machine.bus.disconnectOutputDevice(0x8e, this.output8E);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = -0x4000; bank2Offset = -0x6000; bank3Offset = -0x8000; bank4Offset = -0xa000;
        var writeMode = false;
    };

    this.input8E = function () {
        var writeMode = true;
    };

    this.output8E = function (val) {
        var writeMode = false;
    };

    this.write = function(address, value) {
        if (address < 0x4000)
            return;
        if (address < 0x6000) {
            if (writeMode) bytes[bank1Offset + address] = value;
            else bank1Offset = ((value % numBanks) << 13) - 0x4000;
            return;
        }
        if (address < 0x8000) {
            if (writeMode) bytes[bank2Offset + address] = value;
            else bank2Offset = ((value % numBanks) << 13) - 0x6000;
            return;
        }
        if (address < 0xa000) {
            if (writeMode) bytes[bank3Offset + address] = value;
            else bank3Offset = ((value % numBanks) << 13) - 0x8000;
            return;
        }
        if (address < 0xc000) {
            if (writeMode) bytes[bank4Offset + address] = value;
            else bank4Offset = ((value % numBanks) << 13) - 0xa000;
        }
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            case 0x4000: return bytes[bank1Offset + address];
            case 0x6000: return bytes[bank2Offset + address];
            case 0x8000: return bytes[bank3Offset + address];
            case 0xa000: return bytes[bank4Offset + address];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var bank3Offset;
    var bank4Offset;
    var numBanks;
    var writeMode = false;

    this.rom = null;
    this.format = wmsx.SlotFormats.MegaRAM;

    var SIZES = [ 32, 64, 64, 128, 128, 128, 128, 256 ];    // In number of banks


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank1Offset,
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset,
            n: numBanks
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        numBanks = s.n;
    };


    if (rom) init(this);

};

wmsx.CartridgeMegaRAM.prototype = wmsx.Slot.base;

wmsx.CartridgeMegaRAM.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMegaRAM();
    cart.loadState(state);
    return cart;
};
