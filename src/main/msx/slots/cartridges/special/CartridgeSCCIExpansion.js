// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Behaves like the "Snatcher/SD Snatcher Sound Cartridge" upgraded to 128KB RAM
// 128KB RAM, mapped in 4 8K banks starting at 0x4000
// Accepts ROMs of 128KB or 64KB (mirrored)
// Controls an internal SCC-I sound chip with audio output through PSG
wmsx.CartridgeSCCIExpansion = function(rom) {

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(128 * 1024);
        self.bytes = bytes;
        if (content.length === 0)
            wmsx.Util.arrayFill(bytes, 0xff);
        else {
            if (content.length === 65536)
                for(var i = 0, len = content.length; i < len; i++) {
                    bytes[i] = content[i];
                    bytes[i + 65536] = content[i];
                }
            else // 128K
                for(i = 0, len = content.length; i < len; i++)
                    bytes[i] = content[i];
        }
       numBanks = 16;       // Fixed
    }

    this.connect = function(machine) {
        psgAudioOutput = machine.psg.getAudioOutput();
        if (sccConnectionOnSavestate) psgAudioOutput.connectAudioCartridge(scc);
    };

    this.disconnect = function(machine) {
        psgAudioOutput.disconnectAudioCartridge(scc);
    };

    this.powerOn = function(paused) {
        this.reset();
    };

    this.powerOff = function() {
        wmsx.Util.arrayFill(bytes, 0xff);
    };

    this.reset = function() {
        bank1Offset = bank2Offset = bank3Offset = bank4Offset = -0x4000;
        sccSelected = sccConnected = false;
        setMode(0);
        scc.reset();
    };

    this.write = function(address, value) {
        // Mode Register
        if (address === 0xbffe || address === 0xbfff)
            return setMode(value);

        if (address >= 0x4000 && address <= 0x5fff) {                // Bank 1 access
            if (bank1RamMode)
                bytes[bank1Offset + address] = value;
            else if (address >= 0x5000 && address <= 0x57ff)
                bank1Offset = (value & 0x0f) * 0x2000 - 0x4000;
        } else if (address >= 0x6000 && address <= 0x7fff) {         // Bank 2 access
            if (bank2RamMode)
                bytes[bank2Offset + address] = value;
            else if (address >= 0x7000 && address <= 0x77ff)
                bank2Offset = (value & 0x0f) * 0x2000 - 0x6000;
        } else if (address >= 0x8000 && address <= 0x9fff) {         // Bank 3 access
            if (bank3RamMode)
                bytes[bank3Offset + address] = value;
            else if (address >= 0x9000 && address <= 0x97ff) {
                bank3Offset = (value & 0x0f) * 0x2000 - 0x8000;
                selectSCC((value & 0x3f) === 0x3f);                  // Special value to activate the SCC
            } else if (sccSelected && (address >= 0x9800))
                scc.write(address, value);
        } else if (address >= 0xa000 && address <= 0xbfff) {         // Bank 4 access
            if (bank4RamMode)
                bytes[bank4Offset + address] = value;
            else if (address >= 0xb000 && address <= 0xb7ff) {
                bank4Offset = (value & 0x0f) * 0x2000 - 0xa000;
                selectSCC(scciMode && ((value & 0x80) === 0x80));    // Special value to activate the SCC-I
            } else if (sccSelected && (address >= 0xb800))
                scc.write(address, value);
        }
    };

    this.read = function(address) {
        if (address < 0x6000)
            return bytes[bank1Offset + address];                     // May underflow if address < 0x4000
        else if (address < 0x8000)
            return bytes[bank2Offset + address];
        else if (address < 0x9800)
            return bytes[bank3Offset + address];
        else if (address < 0xa000)
            return (!scciMode && sccSelected) ? scc.read(address) : bytes[bank3Offset + address];
        else if (address < 0xb800)
            return bytes[bank4Offset + address];
        else
            return (scciMode && sccSelected) ? scc.read(address) : bytes[bank4Offset + address];
    };

    function setMode(pMode) {
        mode = pMode;
        scciMode = (pMode & 0x20) !== 0;
        scc.setSCCIMode(scciMode);
        var ramMode = (pMode & 0x10) !== 0;
        bank4RamMode = ramMode;
        bank3RamMode = scciMode && (ramMode || ((pMode & 0x04) !== 0));
        bank2RamMode = ramMode || ((pMode & 0x02) !== 0);
        bank1RamMode = ramMode || ((pMode & 0x01) !== 0);
    }

    function selectSCC(boo) {
        if (boo) {
            sccSelected = true;
            if (!sccConnected) {
                psgAudioOutput.connectAudioCartridge(scc);
                sccConnected = true;
            }
        } else
            sccSelected = false;
    }


    var bytes;
    this.bytes = null;

    var mode;
    var scciMode;
    var bank4RamMode, bank3RamMode, bank2RamMode, bank1RamMode;

    var bank1Offset, bank2Offset, bank3Offset, bank4Offset;
    var numBanks;

    var scc = new wmsx.SCCMixedAudioChannel();
    var sccSelected = false;
    var sccConnected = false;
    var sccConnectionOnSavestate = false;        // used to restore connection after a loadState
    var psgAudioOutput;

    this.rom = null;
    this.format = wmsx.SlotFormats.SCCIExpansion;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressArrayToStringBase64(bytes),
            m: mode,
            b1: bank1Offset,
            b2: bank2Offset,
            b3: bank3Offset,
            b4: bank4Offset,
            n: numBanks,
            scc: scc.saveState(),
            scs: sccSelected,
            scn: sccConnected,
            scna: psgAudioOutput.getAudioCartridge() === scc
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToArray(s.b);
        this.bytes = bytes;
        bank1Offset = s.b1;
        bank2Offset = s.b2;
        bank3Offset = s.b3;
        bank4Offset = s.b4;
        numBanks = s.n;
        setMode(s.m || 0);
        if (s.hasOwnProperty("scc")) {              // Backward compatibility
            scc.loadState(s.scc);
            sccSelected = s.scs;
            sccConnected = s.scn;
            sccConnectionOnSavestate = s.scna;      // Will reconnect ro PSG if was connected at saveState
        }
    };

    this.eval = function(str) {
        return eval(str);
    };


    if (rom) init(this);

};

wmsx.CartridgeSCCIExpansion.prototype = wmsx.Slot.base;

wmsx.CartridgeSCCIExpansion.createFromSaveState = function(state) {
    var cart = new wmsx.CartridgeSCCIExpansion();
    cart.loadState(state);
    return cart;
};
