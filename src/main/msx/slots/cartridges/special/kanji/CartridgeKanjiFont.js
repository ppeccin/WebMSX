// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Kanji Font device  (JIS 1/2 16x16)
// NO memory mapped. Provides only access to device ports

wmsx.CartridgeKanjiFont = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = Array.prototype.slice.call(rom.content);
        self.bytes = bytes;
        jis2 = bytes.length === 262144;
    }

    this.connect = function(machine) {
        // JIS 1
        machine.bus.connectInputDevice( 0xd8, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectInputDevice( 0xd9, this.inputD9);
        machine.bus.connectOutputDevice(0xd8, this.outputD8);
        machine.bus.connectOutputDevice(0xd9, this.outputD9);
        // JIS 2
        machine.bus.connectInputDevice( 0xda, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectInputDevice( 0xdb, this.inputDB);
        machine.bus.connectOutputDevice(0xda, this.outputDA);
        machine.bus.connectOutputDevice(0xdb, this.outputDB);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectInputDevice( 0xd8, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectInputDevice( 0xd9, this.inputD9);
        machine.bus.disconnectOutputDevice(0xd8, this.outputD8);
        machine.bus.disconnectOutputDevice(0xd9, this.outputD9);
        machine.bus.disconnectInputDevice( 0xda, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectInputDevice( 0xdb, this.inputDB);
        machine.bus.disconnectOutputDevice(0xda, this.outputDA);
        machine.bus.disconnectOutputDevice(0xdb, this.outputDB);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
        charToRead1 = charToRead2 = 0;
        readAddress1 = readAddress2 = 0;
    };

    this.read = function(address) {
        return 0xff;
    };

    this.write = function(address, value) {
    };

    this.outputD8 = function (val) {
        charToRead1 = (charToRead1 & 0xfc0) | (val & 0x3f);
        readAddress1 = charToRead1 << 5;
    };

    this.outputD9 = function (val) {
        charToRead1 = (charToRead1 & 0x03f) | ((val & 0x3f) << 6);
        readAddress1 = charToRead1 << 5;

        //console.log("Set 1: " + charToRead1);
    };

    this.inputD9 = function () {
        return bytes[readAddress1++ & 0x1ffff];
    };

    this.outputDA = function (val) {
        charToRead2 = (charToRead2 & 0xfc0) | (val & 0x3f);
        readAddress2 = charToRead2 << 5;
    };

    this.outputDB = function (val) {
        charToRead2 = (charToRead2 & 0x03f) | ((val & 0x3f) << 6);
        readAddress2 = charToRead2 << 5;

        //console.log("Set 2: " + charToRead2);
    };

    this.inputDB = function () {
        return jis2 ? bytes[0x20000 + (readAddress2++ & 0x1ffff)] : 0xff;
    };


    var charToRead1, charToRead2;
    var readAddress1, readAddress2;
    var jis2 = false;

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
            c1: charToRead1, r1: readAddress1,
            c2: charToRead2, r2: readAddress2,
            j2: jis2
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        charToRead1 = s.c1; readAddress1 = s.r1;
        charToRead2 = s.c2; readAddress2 = s.r2;
        jis2 = s.j2;
    };


    if (rom) init(this);

};

wmsx.CartridgeKanjiFont.prototype = wmsx.Slot.base;

wmsx.CartridgeKanjiFont.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeKanjiFont();
    cart.loadState(state);
    return cart;
};
