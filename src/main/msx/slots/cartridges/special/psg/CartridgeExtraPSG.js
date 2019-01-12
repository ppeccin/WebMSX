// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Kanji Font device  (JIS 1/2 16x16)
// NO memory mapped. Provides only access to device ports

wmsx.CartridgeExtraPSG = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
    }

    this.connect = function(machine) {
        psg.setAudioSocket(machine.getAudioSocket());
        psg.connectBus(machine.bus);
    };

    this.disconnect = function(machine) {
        psg.disconnectBus(machine.bus);
    };

    this.powerOn = function() {
        psg.powerOn();
    };

    this.powerOff = function() {
        psg.powerOff();
    };

    this.reset = function() {
        psg.reset();
    };


    var psg = new wmsx.PSG(null, true);     // No controllers, secondary

    this.rom = null;
    this.format = wmsx.SlotFormats.ExtraPSG;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            p: psg.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        psg.loadState(s.p);
    };


    if (rom) init(this);

};

wmsx.CartridgeExtraPSG.prototype = wmsx.Slot.base;

wmsx.CartridgeExtraPSG.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeExtraPSG();
    cart.loadState(state);
    return cart;
};
