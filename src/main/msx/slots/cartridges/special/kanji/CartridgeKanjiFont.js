// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Kanji Font device  (JIS 1/2 16x16)
// NO memory mapped. Provides only access to device ports

wmsx.CartridgeKanjiFont = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.connect = function(machine) {
        machine.bus.connectInputDevice( 0xd8, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectInputDevice( 0xd9, this.inputD9);
        machine.bus.connectOutputDevice(0xd8, this.outputD8);
        machine.bus.connectOutputDevice(0xd9, this.outputD9);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectInputDevice( 0xd8, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectInputDevice( 0xd9, this.inputD9);
        machine.bus.disconnectOutputDevice(0xd8, this.outputD8);
        machine.bus.disconnectOutputDevice(0xd9, this.outputD9);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
        charToRead = 0;
        readAddress = 0;
    };

    this.outputD8 = function (val) {
        charToRead = (charToRead & 0xfc0) | (val & 0x3f);
        readAddress = charToRead << 5;
    };

    this.outputD9 = function (val) {
        charToRead = (charToRead & 0x03f) | ((val & 0x3f) << 6);
        readAddress = charToRead << 5;
    };

    this.inputD9 = function () {
        return bytes[readAddress++];
    };


    var charToRead;
    var readAddress;

    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.Kanji1;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
    };


    if (rom) init(this);


    this.eval = function(arg) {
        return eval(arg);
    }


};

wmsx.CartridgeKanjiFont.prototype = wmsx.Slot.base;

wmsx.CartridgeKanjiFont.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeKanjiFont();
    cart.loadState(state);
    return cart;
};
