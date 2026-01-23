// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// ROMs with n * 16K banks, mapped in 1 16K bank starting at 0x8000
// 0x8000 - 0xbfff, monitor all bus writes to address 0x0000 to perform bank switching

wmsx.CartridgeSuperLodeRunner = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        numBanks = (bytes.length / 16384) | 0;
    }

    this.connect = function(machine) {
        machine.bus.setWriteMonitor(busWriteMonitor);
    };

    this.disconnect = function(machine) {
        machine.bus.setWriteMonitor(null);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bank1Offset = 0x8000;
    };

    this.read = function(address) {
        if (address >= 0x8000 && address < 0xc000)
            return bytes[bank1Offset + address];
        return 0xff;
    };

    function busWriteMonitor(address, val) {
        if (address === 0x0000) bank1Offset = ((val % numBanks) << 14) - 0x8000;
    }


    var bytes;
    this.bytes = null;

    var bank1Offset;
    var numBanks;

    this.rom = null;
    this.format = wmsx.SlotFormats.SuperLodeRunner;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bank1Offset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1Offset = s.b1;
        numBanks = (bytes.length / 16384) | 0;
    };


    if (rom) init(this);

};

wmsx.CartridgeSuperLodeRunner.prototype = wmsx.Slot.base;

wmsx.CartridgeSuperLodeRunner.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeSuperLodeRunner();
    cart.loadState(state);
    return cart;
};
