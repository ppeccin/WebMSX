// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// V9990 Video Cartridge
// Adds a V9990 VDP with included 512KB VRAM
// Also responds to the v7040 Superimpose/Mix chip control port, then switchs modes on Monitor

wmsx.CartridgeV9990 = function(rom) {
"use strict";

    var self = this;

    function init() {
        self.rom = rom;
    }

    this.connect = function(machine) {
        v9990.connect(machine, this);
        machine.getVideoSocket().connectExternalVideoSignal(v9990.getVideoSignal());

        // v7040 control port: GenLock, Superimpose, Mixed mode detection
        machine.bus.connectInputDevice( 0x6f, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.connectOutputDevice(0x6f, this.output6f);
    };

    this.disconnect = function(machine) {
        v9990.disconnect(machine);
        machine.getVideoSocket().disconnectExternalVideoSignal(v9990.getVideoSignal());

        machine.bus.disconnectInputDevice( 0x6f, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0x6f, this.output6f);
    };

    this.powerOn = function() {
        v9990.powerOn();
    };

    this.powerOff = function() {
        v9990.powerOff();
        this.resetOutputAutoMode();
    };

    this.reset = function() {
        v9990.reset();
        this.resetOutputAutoMode();
    };

    this.resetOutputAutoMode = function() {
        self.output6f(0x10);
    };

    this.v9990DisplayEnabled = function() {
        if (mode === 0) this.output6f(0);      // When in default mode (Internal) and V9990 is activated, set mode = 1 (V9990) automatically
    };

    this.output6f = function(val) {
        //console.log("v7040 Control:", val.toString(16));

        control = val;
        updateAutoMode();
    };

    function updateAutoMode() {
        switch (control & 0x1a) {
            case 0x10: case 0x12:           // GEN = 1, TRAN = 0, MIX = *
                mode = 0; break;            // Internal
            case 0x18:                      // GEN = 1, TRAN = 1, MIX = 0
                mode = 2; break;            // Superimposed
            case 0x1a:                      // GEN = 1, TRAN = 1, MIX = 1
                mode = 3; break;            // Mixed
            default:                        // GEN = 0, TRAN = *, MIX = *
                mode = 1; break;            // V9990
        }
        v9990.getVideoSignal().setOutputAutoMode(mode);
    }


    this.rom = null;
    this.format = wmsx.SlotFormats.V9990;


    var v9990 = new wmsx.V9990();
    this.v9990 = v9990;

    var control = 0x10;
    var mode = 0;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        var light = this.lightState();
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            c: control,
            vdp: v9990.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        control = s.c;
        v9990.loadState(s.vdp);
        updateAutoMode();

        //console.log("V9990 LoadState length:", JSON.stringify(s).length);
    };


    if (rom) init();

};

wmsx.CartridgeV9990.prototype = wmsx.Slot.base;

wmsx.CartridgeV9990.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeV9990();
    cart.loadState(state);
    return cart;
};
