// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// FM-PAC Expansion Cartridge with 64K ROM (4 * 16K pages) and 8K SRAM, mapped only in page 1 at 0x4000
// Controls a YM2413 FM sound chip
// 0x4000 - 0x7fff

wmsx.CartridgeFMPAC = function(rom) {
    function init(self) {
        self.rom = rom;
        var content = self.rom.content;
        bytes = new Array(content.length);
        self.bytes = bytes;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
        sram = wmsx.Util.arrayFill(new Array(0x2000), 0);
        self.sram = sram;
    }

    this.connect = function(pMachine) {
        machine = pMachine;
        updateFMEnable();
    };

    this.disconnect = function(machine) {
        fm.disconnect(machine);
    };

    this.powerOn = function() {
        fm.powerOn();
        this.reset();
    };

    this.powerOff = function() {
        fm.powerOff();
    };

    this.reset = function() {
        sramActive = false;
        bankOffset = -0x4000;
        fmEnable = 0;                  // FM starts disabled
        updateFMEnable();
        fm.reset();
    };

    this.write = function(address, value) {
        // FM port write
        if (address === 0x7ff4)
            fm.output7C(value);
        else if (address === 0x7ff5)
            fm.output7D(value);
        // FM enable/disable
        else if (address === 0x7ff6) {
            fmEnable = value & 0x11;
            updateFMEnable();
        }
        // ROM bank switch
        else if (address === 0x7ff7)
            bankOffset = ((value & 0x03) << 14) - 0x4000;
        // SRAM enable/disable
        else if (address === 0x5ffe || address === 0x5fff) {
            sram[address - 0x4000] = value;
            sramActive = sram[0x1ffe] === 0x4d && sram[0x1fff] === 0x69;
        }
        // SRAM write
        else if (sramActive && address >= 0x4000 && address <= 0x5ffd) {
            sram[address - 0x4000] = value;
        }
    };

    this.read = function(address) {
        // FM enable/disable read
        if (address === 0x7ff6)
            return fmEnable;
        // ROM bank read
        else if (address === 0x7ff7)
            return (bankOffset + 0x4000) >> 14;
        // SRAM read
        else if (sramActive) {
            if (address >= 0x4000 && address <= 0x5fff)
                return sram[address - 0x4000];
            else
                return 0xff;
        // ROM read
        } else if (address >= 0x4000 && address < 0x8000)
            return bytes[bankOffset + address];
        // Empty read
        else
            return 0xff;
    };

    function updateFMEnable() {
        if (machine) {
            if (fmEnable & 1) fm.connect(machine);        // bit 0 switches FM on/off
            else fm.disconnect(machine);
        }
    }

    var bytes;
    this.bytes = null;

    var sram;
    var sramActive;
    this.sram = null;

    var fmEnable;
    var bankOffset;

    var machine;

    this.rom = null;
    this.format = wmsx.SlotFormats.FMPAC;

    var fm = new wmsx.YM2413Audio("FM-PAC");
    this.fm = fm;


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
            fm: fm.saveState()
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
        fm.loadState(s.fm);
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
