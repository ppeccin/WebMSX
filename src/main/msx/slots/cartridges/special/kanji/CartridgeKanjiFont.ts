// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Kanji Font device  (JIS 1/2 16x16)
// NO memory mapped. Provides only access to device ports

wmsx.CartridgeKanjiFont = function(rom) {
"use strict";

    var self = this;

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        jis2 = bytes.length === 0x40000;
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

        wmsx.CartridgeKanjiFont.connectedInstance = this;
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

        if (wmsx.CartridgeKanjiFont.connectedInstance === this) wmsx.CartridgeKanjiFont.connectedInstance = undefined;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.readKanji = function(address) {
        return jis2 || address < 0x20000 ? bytes[address] : 0xff;
    };

    this.reset = function() {
        readAddress1 = 0;
        readAddress2 = 0x20000;
    };

    this.read = function(address) {
        return 0xff;
    };

    this.write = function(address, value) {
    };

    this.outputD8 = function (val) {
        readAddress1 = (readAddress1 & 0x1f800) | ((val & 0x3f) << 5);
    };

    this.outputD9 = function (val) {
        readAddress1 = ((val & 0x3f) << 11) | (readAddress1 & 0x007e0) ;
    };

    this.inputD9 = function () {
        var res = self.readKanji(readAddress1);
        readAddress1 = (readAddress1 & 0x1ffe0) | ((readAddress1 + 1) & 0x1f);
        return res;
    };

    this.outputDA = function (val) {
        readAddress2 = (readAddress2 & 0x3f800) | ((val & 0x3f) << 5);
    };

    this.outputDB = function (val) {
        readAddress2 = 0x20000 | ((val & 0x3f) << 11) | (readAddress2 & 0x007e0) ;
    };

    this.inputDB = function () {
        var res = self.readKanji(readAddress2);
        readAddress2 = (readAddress2 & 0x3ffe0) | ((readAddress2 + 1) & 0x1f);
        return res;
    };


    var readAddress1 = 0, readAddress2 = 0;
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
            b: this.lightState() ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            r1: readAddress1,
            r2: readAddress2,
            j2: jis2
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
        readAddress1 = s.r1;
        readAddress2 = s.r2 | 0x20000;          // Backward compatibility
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

wmsx.CartridgeKanjiFont.connectedInstance = undefined;
