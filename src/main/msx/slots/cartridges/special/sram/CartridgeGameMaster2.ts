// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// 128K ROMs with 16 * 8K banks, mapped in 4 8K banks starting at 0x4000, and 8K SRAM
// 0x4000 - 0xbfff

wmsx.CartridgeGameMaster2 = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        sram = wmsx.Util.arrayFill(new Array(0x2000), 0);
        self.sram = sram;
    }

    this.connect = function(machine) {
        cartridgeSocket = machine.getCartridgeSocket();
    };

    this.getDataDesc = function() {
        return "SRAM";
    };

    this.loadData = function(name, arrContent) {
        if (arrContent.length !== 8192) return null;

        for (var i = 0; i < 8192; ++i) sram[i] = arrContent[i];
        sramContentName = name;
        return arrContent;
    };

    this.getDataToSave = function() {
        sramModif = false;
        cartridgeSocket.fireCartridgesModifiedStateUpdate();
        var content = new Uint8Array(sram);
        return { fileName: sramContentName || "GameMaster2.sram", content: content, desc: this.getDataDesc() };
    };

    this.dataModified = function() {
        return sramModif;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank2 = 1; bank3 = 2; bank4 = 3;
    };

    this.write = function(address, value) {
        if (address < 0x6000 || address >= 0xc000)
            return;
        // Bank select
        if (address < 0x7000) {
            bank2 = value;
            return;
        }
        if (address >= 0x8000 && address < 0x9000) {
            bank3 = value;
            return;
        }
        if (address >= 0xa000 && address < 0xb000) {
            bank4 = value;
            return;
        }
        // SRAM write
        if (address >= 0xb000 && (bank4 & 0x10)) {
            sram[((bank4 & 0x20) << 7) + address - 0xb000] = value;             // Only 4KB of SRAM visible, in 2 banks (bank in bit 5)
            if (!sramModif) {
                sramModif = true;
                cartridgeSocket.fireCartridgesModifiedStateUpdate();
            }
        }
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            case 0x4000: return bytes[address - 0x4000];                        // bank 1 fixed at 0
            case 0x6000: return bank2 & 0x10
                ? sram[((bank2 & 0x20) << 7) + ((address - 0x6000) & 0xfff)]    // SRAM access if bit 4 = 1. Only 4KB of SRAM visible, in 2 banks (bank in bit 5)
                : bytes[((bank2 & 0x0f) << 13) + address - 0x6000];             // ROM  access if bit 4 = 0. 8K bank in bits 3-0
            case 0x8000: return bank3 & 0x10
                ? sram[((bank3 & 0x20) << 7) + ((address - 0x8000) & 0xfff)]
                : bytes[((bank3 & 0x0f) << 13) + address - 0x8000];
            case 0xa000: return bank4 & 0x10
                ? sram[((bank4 & 0x20) << 7) + ((address - 0xa000) & 0xfff)]
                : bytes[((bank4 & 0x0f) << 13) + address - 0xa000];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank2;
    var bank3;
    var bank4;

    var sram;
    this.sram = null;
    var sramContentName;
    var sramModif = false;

    var cartridgeSocket;

    this.rom = null;
    this.format = wmsx.SlotFormats.GameMaster2;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b2: bank2,
            b3: bank3,
            b4: bank4,
            s: wmsx.Util.compressInt8BitArrayToStringBase64(sram),
            sn: sramContentName,
            d: sramModif
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank2 = s.b2;
        bank3 = s.b3;
        bank4 = s.b4;
        sram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.s, sram);
        this.sram = sram;
        sramContentName = s.sn;
        sramModif = !!s.d;
    };


    if (rom) init(this);

};

wmsx.CartridgeGameMaster2.prototype = wmsx.Slot.base;

wmsx.CartridgeGameMaster2.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeGameMaster2();
    cart.loadState(state);
    return cart;
};
