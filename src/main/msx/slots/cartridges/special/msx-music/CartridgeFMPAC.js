// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Finish implementing mapper

wmsx.CartridgeFMPAC = function(rom) {
    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.connect = function(machine) {
        fm.connect(machine);
    };

    this.disconnect = function(machine) {
        fm.disconnect(machine);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        this.reset();
    };

    this.reset = function() {
        fm.reset();
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.FMPAC;

    var fm = new wmsx.YM2413MixedAudioChannels();
    this.fm = fm;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            // TODO Make it work
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            fm: fm.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        fm.loadState(s.fm);
    };


    if (rom) init(self);

};

wmsx.CartridgeFMPAC.prototype = wmsx.Slot.base;

wmsx.CartridgeFMPAC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeFMPAC();
    cart.loadState(state);
    return cart;
};
