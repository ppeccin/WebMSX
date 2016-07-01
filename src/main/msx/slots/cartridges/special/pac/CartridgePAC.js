// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// PAC Expansion Cartridge with 8K SRAM, mapped only in page 1 at 0x4000
// 0x4000 - 0x7fff

wmsx.CartridgePAC = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        sram = new Uint8Array(0x2000);
        self.sram = sram;
        if (rom.content.length !== 0) loadSRAM(rom.source, rom.content);
    }

    this.getDataDesc = function() {
        return "PAC Data";
    };

    this.loadData = function(name, arrContent) {
        if (!wmsx.CartridgePAC.isPACFileContentValid(arrContent)) return null;

        loadSRAM(name, arrContent);
        return sram;
    };

    this.getDataToSave = function() {
        var content = wmsx.CartridgePAC.buildPACFileContentToSave(sram);
        return { fileName: sramContentName || (this.getDataDesc() + ".pac"), content: content };
    };

    this.connect = function(pMachine) {
        machine = pMachine;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        sramActive = false;
    };

    this.write = function(address, value) {
        // SRAM enable/disable
        if (address === 0x5ffe || address === 0x5fff) {
            sram[address - 0x4000] = value;
            sramActive = sram[0x1ffe] === 0x4d && sram[0x1fff] === 0x69;
            return;
        }
        // SRAM write
        if (sramActive && address >= 0x4000 && address <= 0x5ffd)
            sram[address - 0x4000] = value;
    };

    this.read = function(address) {
        // SRAM read
        if (sramActive && address >= 0x4000 && address <= 0x5fff)
            return sram[address - 0x4000];
        return 0xff;
    };

    function loadSRAM(name, content) {
        sramContentName = name;
        var start = wmsx.CartridgePAC.DATA_FILE_IDENTIFIER.length;
        for(var i = 0, finish = sram.length - 2; i < finish; i++)
            sram[i] = content[start + i];
    }


    var sram;
    var sramActive;
    this.sram = null;
    var sramContentName;

    var machine;

    this.rom = null;
    this.format = wmsx.SlotFormats.PACExpansion;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            sa: sramActive,
            s: wmsx.Util.compressInt8BitArrayToStringBase64(sram),
            sn: sramContentName
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        sramActive = s.sa;
        sram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.s, sram);
        sramContentName = s.sn;
    };


    if (rom) init(this);

};

wmsx.CartridgePAC.prototype = wmsx.Slot.base;

wmsx.CartridgePAC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgePAC();
    cart.loadState(state);
    return cart;
};

wmsx.CartridgePAC.isPACFileContentValid = function(content) {
    // Only 8206 bytes content, starting with "PAC2 BACKUP DATA"
    if (content.length !== 8206) return false;
    return wmsx.Util.int8BitArrayToByteString(content, 0, wmsx.CartridgePAC.DATA_FILE_IDENTIFIER.length) == wmsx.CartridgePAC.DATA_FILE_IDENTIFIER;
};

wmsx.CartridgePAC.buildPACFileContentToSave = function(sram) {
    var content = new Uint8Array(wmsx.CartridgePAC.DATA_FILE_IDENTIFIER.length + sram.length - 2);
    content.set(wmsx.Util.byteStringToInt8BitArray(wmsx.CartridgePAC.DATA_FILE_IDENTIFIER));
    content.set(sram.slice(0, -2), wmsx.CartridgePAC.DATA_FILE_IDENTIFIER.length);
    return content;
};

wmsx.CartridgePAC.DATA_FILE_IDENTIFIER = "PAC2 BACKUP DATA";