// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Controls only an internal SCC sound chip
wmsx.CartridgeSCCExpansion = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
    }

    this.connect = function(machine) {
        scc.setAudioSocket(machine.getAudioSocket());
        if (sccConnected) connectSCC();     // needed in LoadStates
    };

    this.disconnect = function(machine) {
        scc.disconnectAudio();
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        scc.disconnectAudio();
    };

    this.reset = function() {
        sccSelected = sccConnected = false;
        scc.reset();
    };

    this.write = function(address, value) {
        //wmsx.Util.log("Write: " + wmsx.Util.toHex4(address) + ", value: " + wmsx.Util.toHex2(value));

        if (address >= 0x9000 && address <= 0x97ff) {
            if ((value & 0x3f) === 0x3f) {                           // Special value to activate the SCC
                sccSelected = true;
                if (!sccConnected) connectSCC();
            } else
                sccSelected = false;
            return;
        }
        if (sccSelected && address >= 0x9800 && address <= 0x9fff)
            scc.write(address, value);
    };

    this.read = function(address) {
        var res;
        if (sccSelected && address >= 0x9800 && address <= 0x9fff)
            res = scc.read(address);
        else
            res = 0x00;

        //wmsx.Util.log("Read: " + wmsx.Util.toHex4(address) + ", value: " + wmsx.Util.toHex2(res));

        return res;
    };

    function connectSCC() {
        scc.connectAudio();
        sccConnected = true;
    }


    var scc = new wmsx.SCCIAudio();
    var sccSelected = false;
    var sccConnected = false;

    this.rom = null;
    this.format = wmsx.SlotFormats.SCCExpansion;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            scc: scc.saveState(),
            scs: sccSelected,
            scn: sccConnected
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        scc.loadState(s.scc);
        sccSelected = s.scs;
        sccConnected = s.scn;

        if (sccConnected) connectSCC();
    };


    if (rom) init(this);

};

wmsx.CartridgeSCCExpansion.prototype = wmsx.Slot.base;

wmsx.CartridgeSCCExpansion.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeSCCExpansion();
    cart.loadState(state);
    return cart;
};
