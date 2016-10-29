// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Behaves like the "Snatcher/SD Snatcher Sound Cartridge" upgraded to 128KB RAM
// 128KB RAM, mapped in 4 8K banks starting at 0x4000
// Accepts ROMs of 128KB max. Mirrored twice if ROM is <= 64KB
// Controls an internal SCC-I sound chip (in SCC or SCC-I mode)
// 0x4000 - 0xbfff

wmsx.CartridgeSCCIExpansion = function(rom, startInSCCI) {
"use strict";

    function init(self) {
        self.rom = rom;
        var content = rom.content;
        bytes = wmsx.Util.arrayFill(new Array(128 * 1024), 0xff);
        self.bytes = bytes;
        if (content.length > 0) {
            self.preLoadedContentSize = content.length;
            wmsx.Util.arrayCopy(content, 0, bytes);
            if (content.length <= 65536) wmsx.Util.arrayCopy(content, 0, bytes, 65536);    // Mirror
        }
        startingMode = startInSCCI ? 0x20 : 0x00;      // Start in SCC-I mode for special format KonamiSCCI. Start in SCC compatibility mode for format SCCIExpansion
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
        if (this.preLoadedContentSize === 0)
            wmsx.Util.arrayFill(bytes, 0xff);
    };

    this.reset = function() {
        bank1Offset = bank2Offset = bank3Offset = bank4Offset = -0x4000;
        sccSelected = scciSelected = sccConnected = false;
        scc.reset();
        setMode(startingMode);
    };

    this.read = function(address) {
        // wmsx.Util.log("Read: " + wmsx.Util.toHex4(address));
        switch (address & 0xe000) {
            case 0x4000:
                return bytes[bank1Offset + address];
            case 0x6000:
                return bytes[bank2Offset + address];
            case 0x8000:
                if (address >= 0x9800 && sccSelected && !scciMode) return scc.read(address);
                else return bytes[bank3Offset + address];
            case 0xa000:
                if (address >= 0xb800 && scciSelected && scciMode) return scc.read(address);
                else return bytes[bank4Offset + address];
            default:
                return 0xff;
        }
    };

    this.write = function(address, value) {
        // wmsx.Util.log("Write: " + wmsx.Util.toHex4(address) + ', ' + value);

        // Mode Register
        if (address === 0xbffe || address === 0xbfff) {
            setMode(value);
            return
        }

        switch (address & 0xe000) {
            case 0x4000:
                if (bank1RamMode)
                    bytes[bank1Offset + address] = value;
                else if (address >= 0x5000 && address <= 0x57ff)
                    bank1Offset = ((value & 0x0f) << 13) - 0x4000;
                return;
            case 0x6000:
                if (bank2RamMode)
                    bytes[bank2Offset + address] = value;
                else if (address >= 0x7000 && address <= 0x77ff)
                    bank2Offset = ((value & 0x0f) << 13) - 0x6000;
                return;
            case 0x8000:
                if (bank3RamMode)
                    bytes[bank3Offset + address] = value;
                else if (address >= 0x9000 && address <= 0x97ff) {
                    bank3Offset = ((value & 0x0f) << 13) - 0x8000;
                    sccSelected = (value & 0x3f) === 0x3f;               // Special value to activate the SCC
                    if (sccSelected && !sccConnected) connectSCC();
                } else if ((address >= 0x9800) && sccSelected && !scciMode)
                    scc.write(address, value);
                return;
            case 0xa000:
                if (bank4RamMode)
                    bytes[bank4Offset + address] = value;
                else if (address >= 0xb000 && address <= 0xb7ff) {
                    bank4Offset = ((value & 0x0f) << 13) - 0xa000;
                    scciSelected = (value & 0x80) === 0x80;              // Special value to activate the SCC-I
                    if (scciSelected && !sccConnected) connectSCC();
                } else if ((address >= 0xb800) && scciSelected && scciMode)
                    scc.write(address, value);
        }
    };

    function setMode(pMode) {
        //wmsx.Util.log("SCCI Expansion mode: " + wmsx.Util.toHex2(pMode) + ": " + ((bank1Offset + 0x4000)/0x2000) + ", " + ((bank2Offset + 0x6000)/0x2000) + ", " + ((bank3Offset + 0x8000)/0x2000) + ", " + ((bank4Offset + 0xa000)/0x2000));

        mode = pMode;
        scciMode = (pMode & 0x20) !== 0;
        scc.setSCCIMode(scciMode);
        var ramMode = (pMode & 0x10) !== 0;
        bank4RamMode = ramMode;
        bank3RamMode = ramMode || (scciMode && ((pMode & 0x04) !== 0));
        bank2RamMode = ramMode || ((pMode & 0x02) !== 0);
        bank1RamMode = ramMode || ((pMode & 0x01) !== 0);
    }

    function connectSCC() {
        scc.connectAudio();
        sccConnected = true;
    }


    var bytes;
    this.bytes = null;

    var startingMode = 0;      // Star in SCC compatibility mode (default for SCC-I cartridges)

    var mode;
    var scciMode;
    var bank4RamMode, bank3RamMode, bank2RamMode, bank1RamMode;

    var bank1Offset, bank2Offset, bank3Offset, bank4Offset;

    var scc = new wmsx.SCCIAudio();
    var sccSelected, scciSelected = false;
    var sccConnected = false;

    this.rom = null;
    this.format = wmsx.SlotFormats.SCCIExpansion;
    this.preLoadedContentSize = 0;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            pcs: this.preLoadedContentSize,
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            sm: startingMode,
            m: mode,
            b1: bank1Offset,
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset,
            scc: scc.saveState(),
            scs: sccSelected,
            sis: scciSelected,
            scn: sccConnected
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        this.preLoadedContentSize = s.pcs || 0;
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        startingMode = s.sm || 0;
        setMode(s.m !== undefined ? s.m : startingMode);
        scc.loadState(s.scc);
        sccSelected = s.scs;
        scciSelected = s.sis;
        sccConnected = s.scn;

        if (sccConnected) connectSCC();
    };

    this.eval = function(str) {
        return eval(str);
    };


    if (rom) init(this);

};

wmsx.CartridgeSCCIExpansion.prototype = wmsx.Slot.base;

wmsx.CartridgeSCCIExpansion.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeSCCIExpansion();
    cart.loadState(state);
    return cart;
};
