// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with (n >= 4) * 8K banks, mapped in 4 8K banks starting at 0x4000
// Controls an internal SCC sound chip
// 0x4000 - 0xbfff

wmsx.CartridgeKonamiSCC = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = Array.prototype.slice.call(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 8192) | 0;
    }

    this.connect = function(machine) {
        scc.setAudioSocket(machine.getAudioSocket());
        if (sccConnected) connectSCC();     // needed after LoadStates
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
        bank1Offset = bank2Offset = bank3Offset = bank4Offset = -0x4000;
        sccSelected = sccConnected = false;
        scc.reset();
    };

    this.write = function(address, value) {
        if (address >= 0x5000 && address <= 0x57ff) {
            bank1Offset = (value % numBanks) * 0x2000 - 0x4000;
            return;
        }
        if (address >= 0x7000 && address <= 0x77ff) {
            bank2Offset = (value % numBanks) * 0x2000 - 0x6000;
            return;
        }
        if (address >= 0x9000 && address <= 0x97ff) {
            bank3Offset = (value % numBanks) * 0x2000 - 0x8000;
            if ((value & 0x3f) === 0x3f) {                           // Special value to activate the SCC
                sccSelected = true;
                if (!sccConnected) connectSCC();
            } else
                sccSelected = false;
            return;
        }
        if(sccSelected && address >= 0x9800 && address <= 0x9fff) {
            scc.write(address, value);
            return;
        }
        if (address >= 0xb000 && address <= 0xb7ff)
            bank4Offset = (value % numBanks) * 0x2000 - 0xa000;
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            case 0x4000:
                return bytes[bank1Offset + address];
            case 0x6000:
                return  bytes[bank2Offset + address];
            case 0x8000:
                if (address >= 0x9800)
                    return sccSelected ? scc.read(address) : bytes[bank3Offset + address];
                else
                    return bytes[bank3Offset + address];
            case 0xa000:
                return bytes[bank4Offset + address];
            default:
                return 0xff;
        }
    };

    function connectSCC() {
        scc.connectAudio();
        sccConnected = true;
    }


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var bank3Offset;
    var bank4Offset;
    var numBanks;

    var scc = new wmsx.SCCIAudio();        // will be in SCC mode by default;
    var sccSelected = false;
    var sccConnected = false;

    this.rom = null;
    this.format = wmsx.SlotFormats.KonamiSCC;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank1Offset,
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset,
            n: numBanks,
            scc: scc.saveState(),
            scs: sccSelected,
            scn: sccConnected
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        numBanks = s.n;
        scc.loadState(s.scc);
        sccSelected = s.scs;
        sccConnected = s.scn;

        if (sccConnected) connectSCC();
    };


    if (rom) init(this);


    this.eval = function(arg) {
        return eval(arg);
    }


};

wmsx.CartridgeKonamiSCC.prototype = wmsx.Slot.base;

wmsx.CartridgeKonamiSCC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeKonamiSCC();
    cart.loadState(state);
    return cart;
};
