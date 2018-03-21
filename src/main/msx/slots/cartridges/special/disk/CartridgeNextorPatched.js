// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched 128K Nextor Kernel in ASCII16 mapper. Accesses and commands the Disk Drive
// Based on Nextor version 2.0.4 stable. Driver Development Guide from 4/2014

// ROM with 128K, in 8 * 16K banks, mapped only in page 1 at 0x4000
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
        machine.getDiskDriveSocket().hardDiskInterfaceConnected(this);
    };

    this.disconnect = function(machine) {
        if (driver) driver.disconnect(this, machine);
        machine.getDiskDriveSocket().hardDiskInterfaceDisconnected(this);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        if (driver) driver.powerOff();
    };

    this.reset = function() {
        bankOffset = -0x4000;
    };

    this.write = function(address, value) {
        if ((address >= 0x6000 && address < 0x6800) )
            bankOffset = ((value & 0x07) << 14) - 0x4000;
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8000)      // page 1
            return bytes[bankOffset + address];
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

    var bankOffset;

    this.rom = null;
    this.format = wmsx.SlotFormats.Nextor16Patch;

    var driver;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            b1: bankOffset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bankOffset = s.b1;
    };


    if (rom) init(this);

};

wmsx.CartridgeNextorPatched.prototype = wmsx.Slot.base;

wmsx.CartridgeNextorPatched.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeNextorPatched();
    cart.loadState(state);
    return cart;
};
