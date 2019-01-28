// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched 16K Disk ROM. Multiple format, used for all Disk ROM manufacturers. Accesses and commands the Disk Drive
// 0x4000 - 0x80ff

wmsx.CartridgeDiskPatched = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = new Array(0x4100);      // Additional 0x100 bytes for CHOICE string
        wmsx.Util.arrayCopy(rom.content, 0, bytes);
        self.bytes = bytes;
        driver.patchDiskBIOS(bytes);
    }

    this.connect = function(machine) {
        driver.connect(this, machine);
        machine.getDiskDriveSocket().diskInterfaceConnected(this);
    };

    this.disconnect = function(machine) {
        driver.disconnect(this, machine);
        machine.getDiskDriveSocket().diskInterfaceDisconnected(this);
    };

    this.powerOff = function() {
        driver.powerOff();
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
        // Receive all CPU Extensions and pass to the Disk Driver
        return driver.cpuExtensionFinish(s);
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.DiskPatch;

    var driver = new wmsx.ImageDiskDriver();


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: this.lightState() ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            d: driver.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        if (s.b)
            bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        else {
            this.rom.reloadEmbeddedContent();
            if (!bytes) bytes = new Array(0x4100);
            wmsx.Util.arrayCopy(this.rom.content, 0, bytes);
            driver.patchDiskBIOS(bytes);
        }
        this.bytes = bytes;
        driver.loadState(s.d);
    };


    if (rom) init(this);

};

wmsx.CartridgeDiskPatched.prototype = wmsx.Slot.base;

wmsx.CartridgeDiskPatched.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeDiskPatched(null, null);
    cart.loadState(state);
    return cart;
};
