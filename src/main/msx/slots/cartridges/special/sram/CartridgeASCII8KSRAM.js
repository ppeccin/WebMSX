// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Multiple Formats: ASCII8SRAM2, ASCII8SRAM8, KoeiSRAM8, KoeiSRAM32, Wizardry (8K)
// ROMs with n * 8K banks, mapped in 4 8K banks starting at 0x4000
// 2K, 8K or 32K SRAM, depending on format
// 0x4000 - 0xbfff

wmsx.CartridgeASCII8KSRAM = function(rom, format) {
    "use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 8192) | 0;
        var sramSize = format === wmsx.SlotFormats.KoeiSRAM32 ? 32768 : format === wmsx.SlotFormats.ASCII16SRAM2 ? 2048 : 8192;
        sramSizeMask = sramSize - 1;
        sram = wmsx.Util.arrayFill(new Array(sramSize), 0);
        self.sram = sram;
        var aboveROMBankBit = Math.max(0x20, 1 << Math.ceil(wmsx.Util.log2(numBanks)));         // Bit above max ROM bank number. Starting at bit 5 minimum
        romSelectMask = aboveROMBankBit - 1;
        sramSelectMask = format === wmsx.SlotFormats.Wizardry ? 0x80 : aboveROMBankBit;         // Bits for SRAM Bank Select
    }

    this.connect = function(machine) {
        cartridgeSocket = machine.getCartridgeSocket();
    };

    this.getDataDesc = function() {
        return "SRAM";
    };

    this.loadData = function(name, arrContent) {
        var size = sramSizeMask + 1;
        if (arrContent.length !== size) return null;

        for (var i = 0; i < size; ++i) sram[i] = arrContent[i];
        sramContentName = name;
        return arrContent;
    };

    this.getDataToSave = function() {
        sramModif = false;
        cartridgeSocket.fireCartridgesModifiedStateUpdate();
        var content = new Uint8Array(sram);
        return { fileName: sramContentName || "Data.sram", content: content, desc: this.getDataDesc() };
    };

    this.dataModified = function() {
        return sramModif;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1 = bank2 = bank3 = bank4 = 0;
    };

    this.write = function(address, value) {
        if (address < 0x6000 || address >= 0xc000)
            return;
        // Bank select
        if (address < 0x6800) {
            bank1 = value;
            return;
        }
        if (address < 0x7000) {
            bank2 = value;
            return;
        }
        if (address < 0x7800) {
            bank3 = value;
            return;
        }
        if (address < 0x8000) {
            bank4 = value;
            return;
        }
        // SRAM write bank 3
        if (address < 0xa000 && (bank3 & sramSelectMask)) {
            sram[(((bank3 & 0x03) << 13) + address - 0x8000) & sramSizeMask] = value;
            if (!sramModif) {
                sramModif = true;
                cartridgeSocket.fireCartridgesModifiedStateUpdate();
            }
            return;
        }
        // SRAM write bank 4
        if (bank4 & sramSelectMask) {
            sram[(((bank4 & 0x03) << 13) + address - 0xa000) & sramSizeMask] = value;
            if (!sramModif) {
                sramModif = true;
                cartridgeSocket.fireCartridgesModifiedStateUpdate();
            }
        }
    };

    this.read = function(address) {
        switch (address & 0xe000) {
            case 0x4000: return bank1 & sramSelectMask
                ? sram[(((bank1 & 0x03) << 13) + address - 0x4000) & sramSizeMask]              // SRAM access. Mirror if necessary
                : bytes[(((bank1 & romSelectMask) % numBanks) << 13) + address - 0x4000];       // ROM  access. Mirror if necessary
            case 0x6000: return bank2 & sramSelectMask
                ? sram[(((bank2 & 0x03) << 13) + address - 0x6000) & sramSizeMask]
                : bytes[(((bank2 & romSelectMask) % numBanks) << 13) + address - 0x6000];
            case 0x8000: return bank3 & sramSelectMask
                ? sram[(((bank3 & 0x03) << 13) + address - 0x8000) & sramSizeMask]
                : bytes[(((bank3 & romSelectMask) % numBanks) << 13) + address - 0x8000];
            case 0xa000: return bank4 & sramSelectMask
                ? sram[(((bank4 & 0x03) << 13) + address - 0xa000) & sramSizeMask]
                : bytes[(((bank4 & romSelectMask) % numBanks) << 13) + address - 0xa000];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank1;
    var bank2;
    var bank3;
    var bank4;
    var numBanks;
    var romSelectMask;
    var sramSelectMask;

    var sram;
    this.sram = null;
    var sramSizeMask;
    var sramContentName;
    var sramModif = false;

    var cartridgeSocket;

    this.rom = null;
    this.format = format;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank1,
            b2: bank2,
            b3: bank3,
            b4: bank4,
            n: numBanks,
            rsm: romSelectMask,
            s: wmsx.Util.compressInt8BitArrayToStringBase64(sram),
            sn: sramContentName,
            ssm: sramSelectMask,
            d: sramModif
        };
    };

    this.loadState = function(s) {
        this.format = wmsx.SlotFormats[s.f];
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1 = s.b1;
        bank2 = s.b2;
        bank3 = s.b3;
        bank4 = s.b4;
        numBanks = s.n;
        romSelectMask = s.rsm;
        sram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.s, sram);
        this.sram = sram;
        sramSizeMask = sram.length - 1;
        sramContentName = s.sn;
        sramSelectMask = s.ssm;
        sramModif = !!s.d;
    };


    if (rom) init(this);

};

wmsx.CartridgeASCII8KSRAM.prototype = wmsx.Slot.base;

wmsx.CartridgeASCII8KSRAM.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeASCII8K();
    cart.loadState(state);
    return cart;
};
