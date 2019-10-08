// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched DOS2 + Disk ROM content = 64K, starting at 0x4000
// Disk ROM will be patched at 0x0000
// 0x4000 - 0x7FFF

wmsx.CartridgeDiskPatchedDOS2TR = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = new Array(rom.content.length);
        wmsx.Util.arrayCopy(rom.content, 0, bytes);
        self.bytes = bytes;
        // DOS2 Disk Driver on the first page at 0x0000
        driver.patchDiskBIOS(bytes, -0x4000, 0x4000, 0x47d6, 0x48c6, 0x7824);
        // DOS1 Disk Driver on the last page at 0xc000
        driver.patchDiskBIOS(bytes, 0x8000, 0x4000, 0x576f, 0x5850, 0x782a);
    }

    this.connect = function(machine) {
        driver.connect(this, machine);
        machine.getDiskDriveSocket().diskInterfaceConnected(this);
        machine.getDiskDriveSocket().dos2ROMConnected(this);
    };

    this.disconnect = function(machine) {
        driver.disconnect(this, machine);
        machine.getDiskDriveSocket().diskInterfaceDisconnected(this);
        machine.getDiskDriveSocket().dos2ROMDisconnected(this);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.reset = function() {
        bankOffset = -0x4000;
    };

    this.powerOff = function() {
        driver.powerOff();
    };

    this.read = function(address) {
        if (address >= 0x4000 && address < 0x8000)      // page 1 only
            return bytes[bankOffset + address];
        return 0xff;
    };

    this.write = function(address, value) {
        if (address === 0x7ff0)
            bankOffset = ((value & 0x03) << 14) - 0x4000;
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

    this.rom = null;
    this.format = wmsx.SlotFormats.DiskPatchDOS2TR;

    var driver = new wmsx.ImageDiskDriver(true);        // DOS2

    var bankOffset;


    // TODO Test Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: this.lightState() ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            d: driver.saveState(),
            b1: bankOffset
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        if (s.b)
            bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        else {
            this.rom.reloadEmbeddedContent();
            var len = this.rom.content.length;
            if (!bytes || bytes.length !== len) bytes = new Array(len);
            wmsx.Util.arrayCopy(this.rom.content, 0, bytes);
            driver.patchDiskBIOS(bytes, -0x4000, 0x4000, 0x47d6, 0x48c6, 0x7824);
            driver.patchDiskBIOS(bytes, 0x8000, 0x4000, 0x576f, 0x5850, 0x782a);
        }
        this.bytes = bytes;
        bankOffset = s.b1;
        driver.loadState(s.d);
    };


    if (rom) init(this);

};

wmsx.CartridgeDiskPatchedDOS2TR.prototype = wmsx.Slot.base;

wmsx.CartridgeDiskPatchedDOS2TR.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeDiskPatchedDOS2TR(null);
    cart.loadState(state);
    return cart;
};
