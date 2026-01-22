// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Multiple Formats: ASCII16SRAM2, ASCII16SRAM8
// ROMs with n * 16K banks, mapped in 2 16K banks starting at 0x4000
// 2K or 8K SRAM, depending on format
// 0x4000 - 0xbfff

wmsx.CartridgeASCII16KSRAM = function(rom, format) {
    "use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 16384) | 0;
        var sramSize = format === wmsx.SlotFormats.ASCII16SRAM2 ? 2048 : 8192;
        sramSizeMask = sramSize - 1;
        sram = wmsx.Util.arrayFill(new Array(sramSize), 0);
        self.sram = sram;
        var aboveROMBankBit = 1 << Math.ceil(wmsx.Util.log2(numBanks));                         // Bit above max ROM bank number
        romSelectMask = aboveROMBankBit - 1;                                                    // Bits for ROM Bank Select
        sramSelectMask = Math.max(0x10, aboveROMBankBit);                                       // Bit above max ROM bank number, starting at bit 4 minimum
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
        bank1 = bank2 = 0;
    };

    this.write = function(address, value) {
        // Bank select
        if (address >= 0x6000 && address < 0x6800) {
            bank1 = value;
            return;
        }
        if (address >= 0x7000 && address < 0x7800) {
            bank2 = value;
            return;
        }
        // SRAM write bank 2
        if (address >= 0x8000 && address < 0xc000 && (bank2 & sramSelectMask)) {
            sram[(address - 0x8000) & sramSizeMask] = value;
            if (!sramModif) {
                sramModif = true;
                cartridgeSocket.fireCartridgesModifiedStateUpdate();
            }
        }
    };

    this.read = function(address) {
        switch (address & 0xc000) {
            case 0x4000: return bank1 & sramSelectMask
                ? sram[(address - 0x4000) & sramSizeMask]                                       // SRAM access. Mirror if necessary
                : bytes[(((bank1 & romSelectMask) % numBanks) << 14) + address - 0x4000];       // ROM  access. Mirror if necessary
            case 0x8000: return bank2 & sramSelectMask
                ? sram[(address - 0x8000) & sramSizeMask]
                : bytes[(((bank2 & romSelectMask) % numBanks) << 14) + address - 0x8000];
            default:     return 0xff;
        }
    };


    var bytes;
    this.bytes = null;

    var bank1;
    var bank2;
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

wmsx.CartridgeASCII16KSRAM.prototype = wmsx.Slot.base;

wmsx.CartridgeASCII16KSRAM.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeASCII16KSRAM();
    cart.loadState(state);
    return cart;
};
