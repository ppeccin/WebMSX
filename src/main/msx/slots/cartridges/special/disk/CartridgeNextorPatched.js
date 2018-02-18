// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched 128K Nextor Kernel in ASCII16 mapper. Accesses and commands the Disk Drive
// Based on Nextor version 2.0.4 stable. Driver Development Guide from 4/2014

// 0x4000 - 0x7fff

wmsx.CartridgeNextorPatched = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        // 8 banks
    }

    this.connect = function(machine) {
        driver = new wmsx.ImageNextorDeviceDriver();
        driver.connect(this, machine);
    };

    this.disconnect = function(machine) {
        if (driver) driver.disconnect(this, machine);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        if (driver) driver.powerOff();
    };

    this.reset = function() {
        bankOffset = bankOffset2 = -0x4000;
    };

    this.write = function(address, value) {
        if ((address >= 0x6000 && address < 0x6800) )
            bankOffset = ((value & 0x07) << 14) - 0x4000;

        if ((address >= 0x7000 && address < 0x7800) )
            bankOffset2 = ((value & 0x07) << 14) - 0x8000;
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8000)      // page 1
            return bytes[bankOffset + address];
        if (address >= 0x8000 && address < 0xc000)      // page 2
            return bytes[bankOffset2 + address];
        return 0xff;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to the Disk Driver
        return driver.cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to the Disk Driver
        return driver.cpuExtensionFinish(s);
    };


    var bytes;
    this.bytes = null;

    var bankOffset, bankOffset2;

    this.rom = null;
    this.format = wmsx.SlotFormats.Nextor16Patch;

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

wmsx.CartridgeNextorPatched.prototype = wmsx.Slot.base;

wmsx.CartridgeNextorPatched.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeNextorPatched(null, null);
    cart.loadState(state);
    return cart;
};
