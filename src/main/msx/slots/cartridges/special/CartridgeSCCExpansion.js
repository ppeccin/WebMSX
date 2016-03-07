// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Controls only an internal SCC sound chip with audio output through PSG
wmsx.CartridgeSCCExpansion = function(rom) {

    function init(self) {
        self.rom = rom;
    }

    this.connect = function(machine) {
        psgAudioSignal = machine.psg.getAudioSignal();
        if (audioConnectionActive) psgAudioSignal.connectAudioCartridge(scc);
    };

    this.disconnect = function(machine) {
        psgAudioSignal.disconnectAudioCartridge(scc);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        psgAudioSignal.disconnectAudioCartridge(scc);
        sccSelected = sccConnected = false;
        scc.reset();
    };

    this.write = function(address, value) {
        if (address >= 0x9000 && address <= 0x97ff) {
            if ((value & 0x3f) === 0x3f) {                           // Special value to activate the SCC
                sccSelected = true;
                if (!sccConnected) {
                    psgAudioSignal.connectAudioCartridge(scc);
                    sccConnected = true;
                }
            } else
                sccSelected = false;
        }
    };

    this.read = function(address) {
        if (sccSelected && address >= 0x9800 && address <= 0x9fff)
            return scc.read(address);
        else
            return 0xff;
    };


    var scc = new wmsx.SCCIMixedAudioChannels();
    var sccSelected = false;
    var sccConnected = false;
    var audioConnectionActive = false;        // used to restore connection after a loadState
    var psgAudioSignal;

    this.rom = null;
    this.format = wmsx.SlotFormats.SCCExpansion;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            scc: scc.saveState(),
            scs: sccSelected,
            scn: sccConnected,
            scna: psgAudioSignal.getAudioCartridge() === scc
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        scc.loadState(s.scc);
        sccSelected = s.scs;
        sccConnected = s.scn;
        audioConnectionActive = s.scna;      // Will reconnect ro PSG if was connected at saveState
    };


    if (rom) init(this);

};

wmsx.CartridgeSCCExpansion.prototype = wmsx.Slot.base;

wmsx.CartridgeSCCExpansion.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeSCCExpansion();
    cart.loadState(state);
    return cart;
};
