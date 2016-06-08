// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// PAC Expansion Cartridge with 8K SRAM, mapped only in page 1 at 0x4000
// 0x4000 - 0x7fff

wmsx.CartridgePAC = function(rom) {
    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        sram = wmsx.Util.arrayFill(new Array(0x2000), 0);
        for(var i = 0, len = sram.length; i < len; i++)
            sram[i] = content[i];
        self.sram = sram;
    }

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
        }
        // SRAM write
        else if (sramActive && address >= 0x4000 && address <= 0x5ffd) {
            sram[address - 0x4000] = value;
        }
    };

    this.read = function(address) {
        // SRAM read
        if (sramActive && address >= 0x4000 && address <= 0x5fff)
            return sram[address - 0x4000];
        else
            return 0xff;
    };

    var sram;
    var sramActive;
    this.sram = null;

    var machine;

    this.rom = null;
    this.format = wmsx.SlotFormats.PACExpansion;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            sa: sramActive,
            s: wmsx.Util.compressInt8BitArrayToStringBase64(sram)
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        sramActive = s.sa;
        sram = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.s, sram);
    };


    if (rom) init(this);

};

wmsx.CartridgePAC.prototype = wmsx.Slot.base;

wmsx.CartridgePAC.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgePAC();
    cart.loadState(state);
    return cart;
};
