// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// V9990 Video Cartridge
// Controls a V9990 VDP with included 512KB VRAM

wmsx.CartridgeV9990 = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
    }

    this.connect = function(machine) {
        if (!v9990) {
            v9990 = new wmsx.V9990(machine, machine.vdp, machine.cpu);
            this.v9990 = v9990;
        }
        v9990.connect(machine);
        machine.getVideoSocket().connectSecVideoSignal(v9990.getVideoSignal());
    };

    this.disconnect = function(machine) {
        v9990.disconnect(machine);
        machine.getVideoSocket().disconnectSecVideoSignal(v9990.getVideoSignal());
    };

    this.powerOn = function() {
        v9990.powerOn();
    };

    this.powerOff = function() {
        v9990.powerOff();
    };

    this.reset = function() {
        v9990.reset();
    };


    this.rom = null;
    this.format = wmsx.SlotFormats.MoonSound;

    var v9990;
    this.v9990 = v9990;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        var light = this.lightState();
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            vdp: v9990.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        v9990.loadState(s.vdp);

        //console.log("V9990 LoadState length:", JSON.stringify(s).length);
    };


    if (rom) init(this);

};

wmsx.CartridgeV9990.prototype = wmsx.Slot.base;

wmsx.CartridgeV9990.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeV9990();
    cart.loadState(state);
    return cart;
};
