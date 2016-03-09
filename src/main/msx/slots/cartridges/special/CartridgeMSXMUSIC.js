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
        fm = new wmsx.YM2413MixedAudioChannels();
        self.fm = fm;
    }

    this.connect = function(machine) {
        machine.bus.connectOutputDevice(0x7c, fm.output7C);
        machine.bus.connectOutputDevice(0x7d, fm.output7D);
        fm.connectAudioSocket(machine.getAudioSocket());
    };

    this.disconnect = function(machine) {
        if (machine.bus.getOutputDevice(0x7c) === fm.output7C) machine.bus.disconnectInputDevice(0x7c);
        if (machine.bus.getOutputDevice(0x7d) === fm.output7D) machine.bus.disconnectInputDevice(0x7d);
    };

    this.powerOn = function() {
        fm.connectAudio();
    };

    this.powerOff = function() {
        fm.disconnectAudio();
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

    var fm;
    this.fm = null;

    var audioSocket;

    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            // TODO Make it work
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


    if (rom) init();

};

wmsx.CartridgeMSXMUSIC.prototype = wmsx.Slot.base;

wmsx.CartridgeMSXMUSIC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMSXMUSIC();
    cart.loadState(state);
    return cart;
};
