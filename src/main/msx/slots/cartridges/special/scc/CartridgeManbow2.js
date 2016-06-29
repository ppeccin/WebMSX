// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Space Manbow 2 512KB Mapper with 64KB SRAM
// 512KB, mapped in 4 8K banks starting at 0x4000
// Last 64KB are read/write SRAM
// Controls an internal SCC-I sound chip in SCC mode
// 0x4000 - 0xbfff

wmsx.CartridgeManbow2 = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(512 * 1024);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++) bytes[i] = content[i];
        bankSelMask = (512 / 8) - 1;       // Fixed
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
        bank1Offset = bank2Offset = bank3Offset = bank4Offset = -0x4000;
        sccSelected = sccConnected = false;
        scc.reset();
    };

    this.read = function(address) {
        // wmsx.Util.log("Read: " + wmsx.Util.toHex4(address));
        switch (address & 0xe000) {
            case 0x4000:
                return bytes[bank1Offset + address];
            case 0x6000:
                return bytes[bank2Offset + address];
            case 0x8000:
                return sccSelected && address >= 0x9800 ? scc.read(address) : bytes[bank3Offset + address];
            case 0xa000:
                return bytes[bank4Offset + address];
            default:
                return 0xff;
        }
    };

   this.write = function(address, value) {
        //wmsx.Util.log("Write: " + wmsx.Util.toHex4(address) + ', ' + value);

        switch (address & 0xe000) {
            case 0x4000:
                writeMem(bank1Offset + address, value);
                if (address >= 0x5000 && address <= 0x57ff)
                    bank1Offset = (value & bankSelMask) * 0x2000 - 0x4000;
                return;
            case 0x6000:
                writeMem(bank2Offset + address, value);
                if (address >= 0x7000 && address <= 0x77ff)
                    bank2Offset = (value & bankSelMask) * 0x2000 - 0x6000;
                return;
            case 0x8000:
                if (sccSelected && address >= 0x9800) scc.write(address, value);
                writeMem(bank3Offset + address, value);
                if (address >= 0x9000 && address <= 0x97ff) {
                    bank3Offset = (value & bankSelMask) * 0x2000 - 0x8000;
                    sccSelected = (value & 0x3f) === 0x3f;               // Special value to activate the SCC
                    if (sccSelected && !sccConnected) connectSCC();
                }
                return;
            case 0xa000:
                writeMem(bank4Offset + address, value);
                if (address >= 0xb000 && address <= 0xb7ff)
                    bank4Offset = (value & bankSelMask) * 0x2000 - 0xa000;
        }
    };

    function writeMem(address, value) {
        if (address >= 458752) bytes[address] = value;      // only last 64K writable
    }

    function connectSCC() {
        scc.connectAudio();
        sccConnected = true;
    }


    var bytes;
    this.bytes = null;

    var bank1Offset, bank2Offset, bank3Offset, bank4Offset;
    var bankSelMask;

    var scc = new wmsx.SCCIAudio();
    var sccSelected = false;
    var sccConnected = false;

    this.rom = null;
    this.format = wmsx.SlotFormats.Manbow2;


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
        scc.loadState(s.scc);
        sccSelected = s.scs;
        sccConnected = s.scn;

        if (sccConnected) connectSCC();
    };

    this.eval = function(str) {
        return eval(str);
    };


    if (rom) init(this);

};

wmsx.CartridgeManbow2.prototype = wmsx.Slot.base;

wmsx.CartridgeManbow2.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeManbow2();
    cart.loadState(state);
    return cart;
};
