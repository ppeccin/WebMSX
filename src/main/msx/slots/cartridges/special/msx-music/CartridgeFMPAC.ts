// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// FM-PAC Expansion Cartridge with 64K ROM (4 * 16K pages) and 8K SRAM, mapped only in page 1 at 0x4000
// Controls a YM2413 FM sound chip
// 0x4000 - 0x7fff

wmsx.CartridgeFMPAC = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        sram = wmsx.Util.arrayFill(new Array(0x2000), 0);
        self.sram = sram;
    }

    this.getDataDesc = function() {
        return "SRAM";
    };

    this.loadData = function(name, arrContent) {
        if (!wmsx.CartridgePAC.isPACFileContentValid(arrContent)) return null;

        loadSRAM(name, arrContent);
        return sram;
    };

    this.getDataToSave = function() {
        sramModif = false;
        cartridgeSocket.fireCartridgesModifiedStateUpdate();
        var content = wmsx.CartridgePAC.buildPACFileContentToSave(sram);
        return { fileName: sramContentName || "PAC SRAM.pac", content: content, desc: this.getDataDesc() };
    };

    this.connect = function(pMachine) {
        machine = pMachine;
        cartridgeSocket = machine.getCartridgeSocket();
        updateFMEnable();
    };

    this.disconnect = function(machine) {
        opll.disconnect(machine);
    };

    this.dataModified = function() {
        return sramModif;
    };

    this.powerOn = function() {
        opll.powerOn();
        this.reset();
    };

    this.powerOff = function() {
        opll.powerOff();
    };

    this.reset = function() {
        sramActive = false;
        bankOffset = -0x4000;
        fmEnable = 0;                  // FM starts disabled
        updateFMEnable();
        opll.reset();
    };

    this.write = function(address, value) {
        switch (address) {
            case 0x7ff4:                                            // FM port writes
                opll.output7C(value);
                break;
            case 0x7ff5:
                opll.output7D(value);
                break;
            case 0x7ff6:                                            // FM enable/disable
                fmEnable = value & 0x11;
                updateFMEnable();
                break;
            case 0x7ff7:                                            // ROM bank switch
                bankOffset = ((value & 0x03) << 14) - 0x4000;
                break;
            case 0x5ffe:
            case 0x5fff:                                            // SRAM enable/disable
                sram[address - 0x4000] = value;
                sramActive = sram[0x1ffe] === 0x4d && sram[0x1fff] === 0x69;
        }

        // SRAM write
        if (sramActive && address >= 0x4000 && address <= 0x5ffd) {
            sram[address - 0x4000] = value;
            if (!sramModif) {
                sramModif = true;
                cartridgeSocket.fireCartridgesModifiedStateUpdate();
            }
        }
    };

    this.read = function(address) {
        // FM enable/disable read
        if (address === 0x7ff6)
            return fmEnable;
        // ROM bank read
        if (address === 0x7ff7)
            return (bankOffset + 0x4000) >> 14;
        // SRAM read
        if (sramActive) {
            if (address >= 0x4000 && address <= 0x5fff)
                return sram[address - 0x4000];
            return 0xff;
        }
        // ROM read
        if (address >= 0x4000 && address < 0x8000)
            return bytes[bankOffset + address];
        // Empty read
        return 0xff;
    };

    function updateFMEnable() {
        if (machine) {
            if (fmEnable & 1) opll.connect(machine);        // bit 0 switches FM on/off
            else opll.disconnect(machine);
        }
    }

    function loadSRAM(name, content) {
        sramContentName = name;
        var start = wmsx.CartridgePAC.DATA_FILE_IDENTIFIER.length;
        for(var i = 0, finish = sram.length - 2; i < finish; i++)
            sram[i] = content[start + i];
    }


    var bytes;
    this.bytes = null;

    var sram;
    var sramActive;
    this.sram = null;
    var sramContentName;
    var sramModif = false;

    var cartridgeSocket;

    var fmEnable;
    var bankOffset;

    var machine;

    this.rom = null;
    this.format = wmsx.SlotFormats.FMPAC;

    var opll = new wmsx.YM2413Audio("FM-PAC");
    this.opll = opll;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bankOffset,
            fe: fmEnable,
            sa: sramActive,
            s: wmsx.Util.compressInt8BitArrayToStringBase64(sram),
            sn: sramContentName,
            fm: opll.saveState(),
            d: sramModif
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bankOffset = s.b1;
        fmEnable = s.fe;
        sramActive = s.sa;
        sram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.s, sram);
        sramContentName = s.sn;
        opll.loadState(s.fm);
        sramModif = !!s.d;
        updateFMEnable();
    };


    if (rom) init(this);

};

wmsx.CartridgeFMPAC.prototype = wmsx.Slot.base;

wmsx.CartridgeFMPAC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeFMPAC();
    cart.loadState(state);
    return cart;
};
