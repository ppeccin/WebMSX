// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX-AUDIO cartridge
// Optional ROM mapped at 0x4000-0xbfff, Y8950 at I/O 0xc0-0xc3 plus DAC/MIDI mirrors.

wmsx.CartridgeMSXAUDIO = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content || []);
        self.bytes = bytes;
    }

    this.connect = function(machine) {
        y8950.connect(machine);
        y8950.connectMIDI(machine);
    };

    this.disconnect = function(machine) {
        y8950.disconnectMIDI(machine);
        y8950.disconnect(machine);
    };

    this.powerOn = function() {
        y8950.powerOn();
        this.reset();
    };

    this.powerOff = function() {
        y8950.powerOff();
    };

    this.reset = function() {
        y8950.reset();
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0xc000) {
            var val = bytes[address - 0x4000];
            return val === undefined ? 0xff : val;
        }
        return 0xff;
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.MSXAUDIO;

    var y8950 = new wmsx.Y8950Audio("MSX-AUDIO");
    this.y8950 = y8950;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: this.lightState() ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            y: y8950.saveState()
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
        y8950.loadState(s.y);
    };


    if (rom) init(this);

};

wmsx.CartridgeMSXAUDIO.prototype = wmsx.Slot.base;

wmsx.CartridgeMSXAUDIO.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMSXAUDIO();
    cart.loadState(state);
    return cart;
};
