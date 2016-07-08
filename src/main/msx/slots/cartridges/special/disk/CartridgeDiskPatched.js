// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched 16K Disk ROM. Multiple format, used for all Disk ROM manufacturers. Accesses and commands the Disk Drive
// 0x4000 - 0x80ff

wmsx.CartridgeDiskPatched = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = new Array(0x4100);
        wmsx.Util.arrayCopy(rom.content, 0, bytes);
        wmsx.Util.arrayFill(bytes, 0xff, 0x4000);
        self.bytes = bytes;
    }

    this.connect = function(machine) {
        driver = new wmsx.ImageDiskDriver();
        driver.connect(this, machine);
    };

    this.disconnect = function(machine) {
        if (driver) driver.disconnect(this, machine);
    };

    this.powerOff = function() {
        if (driver) driver.powerOff();
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8100)
            return bytes[address - 0x4000];
        return 0xff;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to the Disk Driver
        return driver.cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return driver.cpuExtensionFinish(s);
    };

    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.DiskPatch;

    var driver;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
    };


    if (rom) init(this);

};

wmsx.CartridgeDiskPatched.prototype = wmsx.Slot.base;

wmsx.CartridgeDiskPatched.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeDiskPatched(null, null);
    cart.loadState(state);
    return cart;
};
