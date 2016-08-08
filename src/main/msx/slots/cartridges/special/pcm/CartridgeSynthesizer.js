// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with <= 32K, multiple of 8K, mirrored
// Simple PCM DAC with unsigned 8 bit samples
// 0x4000 - 0xbfff

wmsx.CartridgeSynthesizer = function(rom) {
    "use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.arrayFill(new Array(32768), 0xff);
        self.bytes = bytes;
        var size = rom.content.length;
        for(var i = 0; i < 32768; ++i) bytes[i] = rom.content[i % size];
    }

    this.connect = function(machine) {
        pcm.setAudioSocket(machine.getAudioSocket());
        pcm.connectAudio();
    };

    this.disconnect = function(machine) {
        pcm.disconnectAudio();
    };

    this.powerOn = function() {
        this.reset();
        pcm.connectAudio();
    };

    this.powerOff = function() {
        pcm.disconnectAudio();
        this.reset();
    };

    this.reset = function() {
        pcm.reset();
    };

    this.write = function(address, value) {
        if ((address & 0xc010) === 0x4000)     // 0x4000 - 0x400f, 0x4020 - 0x402f, 0x4040 - -0x404f, .. , 0x7fe0 - 0x7fef
            pcm.setSampleValue(value);
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0xc000)
            return bytes[address - 0x4000];
        return 0xff;
    };


    var bytes;
    this.bytes = null;

    var pcm = new wmsx.PCM8BitAudio();

    this.rom = null;
    this.format = wmsx.SlotFormats.Synthesizer;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            p: pcm.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        pcm.loadState(s.p);
    };


    if (rom) init(this);

};

wmsx.CartridgeSynthesizer.prototype = wmsx.Slot.base;

wmsx.CartridgeSynthesizer.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeSynthesizer();
    cart.loadState(state);
    return cart;
};
