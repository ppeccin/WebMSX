// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 8K banks, mapped in 4 8K banks starting at 0x4000
// Simple PCM DAC with unsigned 8 bit samples
// 0x4000 - 0xbfff

wmsx.CartridgeMajutsushi = function(rom) {
    "use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 8192) | 0;
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
        bank2Offset = bank3Offset = bank4Offset = -0x4000;
        pcm.reset();
    };

    this.write = function(address, value) {
        // bank 1 is fixed at 0x0000
        if (address >= 0x5000 && address < 0x5fff)
            pcm.setSampleValue(value);
        else if (address >= 0x6000 && address < 0x7fff)
            bank2Offset = (value % numBanks) * 0x2000 - 0x6000;
        else if (address >= 0x8000 && address < 0x9fff)
            bank3Offset = (value % numBanks) * 0x2000 - 0x8000;
        else if (address >= 0xa000 && address < 0xbfff)
            bank4Offset = (value % numBanks) * 0x2000 - 0xa000;
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            case 0x4000: return bytes[address - 0x4000];
            case 0x6000: return bytes[bank2Offset + address];
            case 0x8000: return bytes[bank3Offset + address];
            case 0xa000: return bytes[bank4Offset + address];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank2Offset;
    var bank3Offset;
    var bank4Offset;
    var numBanks;

    var pcm = new wmsx.PCM8BitAudio();

    this.rom = null;
    this.format = wmsx.SlotFormats.Majutsushi;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset,
            n: numBanks,
            p: pcm.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        numBanks = s.n;
        pcm.loadState(s.p);
    };


    if (rom) init(this);

};

wmsx.CartridgeMajutsushi.prototype = wmsx.Slot.base;

wmsx.CartridgeMajutsushi.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeMajutsushi();
    cart.loadState(state);
    return cart;
};
