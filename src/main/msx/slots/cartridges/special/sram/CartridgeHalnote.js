// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// 1024K ROMs with 128 * 8K banks, mapped in 4 8K banks starting at 0x4000, and 2 2K sub-banks starting at 0x7000 (upper half of ROM)
// 16K SRAM, enabled at 0x0000
// 0x0000 - 0xbfff

wmsx.CartridgeHalnote = function(rom) {
    "use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        sram = wmsx.Util.arrayFill(new Array(16384), 0);
        self.sram = sram;
    }

    this.connect = function(machine) {
        cartridgeSocket = machine.getCartridgeSocket();
    };

    this.getDataDesc = function() {
        return "SRAM";
    };

    this.loadData = function(name, arrContent) {
        if (arrContent.length !== 16384) return null;

        for (var i = 0; i < 16384; ++i) sram[i] = arrContent[i];
        sramContentName = name;
        return arrContent;
    };

    this.getDataToSave = function() {
        sramModif = false;
        cartridgeSocket.fireCartridgesModifiedStateUpdate();
        var content = new Uint8Array(sram);
        return { fileName: sramContentName || "Halnote.sram", content: content, desc: this.getDataDesc() };
    };

    this.dataModified = function() {
        return sramModif;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = -0x4000; bank2Offset = -0x6000; bank3Offset = -0x8000; bank4Offset = -0xa000;
        subBank1Offset = 0x80000 -0x7000; subBank2Offset = 0x80000 -0x7800;
        subBanksEnabled = sramEnabled = false;
    };

    this.write = function(address, value) {
        // Bank Switching
        switch (address) {
            case 0x4fff:
                bank1Offset = ((value & 0x7f) << 13) - 0x4000;
                sramEnabled = (value & 0x80) !== 0;
                return;
            case 0x6fff:
                bank2Offset = ((value & 0x7f) << 13) - 0x6000;
                subBanksEnabled = (value & 0x80) !== 0;
                return;
            case 0x8fff:
                bank3Offset = ((value & 0x7f) << 13) - 0x8000;
                return;
            case 0xafff:
                bank4Offset = ((value & 0x7f) << 13) - 0xa000;
                return;
            // SubBanks
            case 0x77ff:
                subBank1Offset = (value << 11) - 0x7000 + 0x80000;
                return;
            case 0x7fff:
                subBank2Offset = (value << 11) - 0x7800 + 0x80000;
                return;
        }

        // SRAM Write?
        if (sramEnabled && address < 0x4000) {
            if (!sramModif && sram[address] !== value) {
                sramModif = true;
                cartridgeSocket.fireCartridgesModifiedStateUpdate();
            }
            sram[address] = value;
        }
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            // SRAM
            case 0x0000:
            case 0x2000:
                return sramEnabled ? sram[address] : 0xff;
            // ROM
            case 0x4000:
                return bytes[bank1Offset + address];
            case 0x6000:
                // SubBanks
                if (address >= 0x7000 && subBanksEnabled)
                    return bytes[(address < 0x7800 ? subBank1Offset : subBank2Offset) + address];
                return bytes[bank2Offset + address];
            case 0x8000:
                return bytes[bank3Offset + address];
            case 0xa000:
                return bytes[bank4Offset + address];
            default:
                return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var bank2Offset;
    var bank3Offset;
    var bank4Offset;
    var subBank1Offset;
    var subBank2Offset;
    var subBanksEnabled;

    var sram;
    this.sram = null;
    var sramEnabled;
    var sramContentName;
    var sramModif = false;

    var cartridgeSocket;

    this.rom = null;
    this.format = wmsx.SlotFormats.Halnote;


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
            sb1: subBank1Offset,
            sb2: subBank2Offset,
            sbe: subBanksEnabled,
            s: wmsx.Util.compressInt8BitArrayToStringBase64(sram),
            se: sramEnabled,
            sn: sramContentName,
            d: sramModif
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
        subBank1Offset = s.sb1;
        subBank2Offset = s.sb2;
        subBanksEnabled = s.sbe;
        sram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.s, sram);
        this.sram = sram;
        sramEnabled = s.se;
        sramContentName = s.sn;
        sramModif = !!s.d;
    };


    if (rom) init(this);

};

wmsx.CartridgeHalnote.prototype = wmsx.Slot.base;

wmsx.CartridgeHalnote.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeHalnote();
    cart.loadState(state);
    return cart;
};
