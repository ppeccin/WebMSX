// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CartridgeMSXMUSIC = function(rom) {
    var self = this;

    function init() {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.connect = function(machine) {
        machine.bus.connectOutputDevice(0x7c, this.output7C);
        machine.bus.connectOutputDevice(0x7d, this.output7D);
    };

    this.disconnect = function(machine) {
        if (machine.bus.getOutputDevice(0x7c) === this.output7C) machine.bus.disconnectInputDevice(0x7c);
        if (machine.bus.getOutputDevice(0x7d) === this.output7D) machine.bus.disconnectInputDevice(0x7d);
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.output7C = function () {

    };
    this.output7D = function () {

    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8000)      // page 1 only
            return bytes[address - 0x4000];
        else
            return 0xff;
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.MSXMUSIC;


    if (rom) init();

};

wmsx.CartridgeMSXMUSIC.prototype = wmsx.Slot.base;

wmsx.CartridgeMSXMUSIC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMSXMUSIC();
    cart.loadState(state);
    return cart;
};
