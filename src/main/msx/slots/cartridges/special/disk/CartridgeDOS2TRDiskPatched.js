// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched DOS2 + Disk ROM content = 64K, starting at 0x4000
// Disk ROM will be patched at 0x0000
// 0x4000 - 0x7FFF

wmsx.CartridgeDOS2TRDiskPatched = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = new Array(rom.content.length /*+ 0x100*/);      // Additional 0x100 bytes for CHOICE string
        wmsx.Util.arrayCopy(rom.content, 0, bytes);
        self.bytes = bytes;
        // There appears to be a Disk Driver on the first page ar 0x0000
        driver.patchDiskBIOS(
            bytes, 0,
            0x07d6, 0x08c6, 0x3459, 0x379d, 0x3800, 0x381a, 0x3c52, 0x3713, false
        );
        // There appears to be a second Disk Driver on the last page ar 0xc000
        driver.patchDiskBIOS(
            bytes, 0xc000,
                -1,     -1, 0x3495, 0x37cb, 0x380b, 0x3826, 0x3c58, 0x3747, false
        );
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
        if (address === 0x7ff0) {
            // console.log("BANK: " + (value & 3));

            bankOffset = ((value & 0x03) << 14) - 0x4000;
        }
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

    var baseAddress = 0x4000, topAddress = 0x8000;

    this.rom = null;
    this.format = wmsx.SlotFormats.MSXDOS2TRDiskPatch;

    var driver = new wmsx.ImageDiskDriver();

    var bankOffset;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: /* this.lightState() ? null : */ wmsx.Util.compressInt8BitArrayToStringBase64(bytes),        // TODO Not Embedded!
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
            var len = this.rom.content.length /*+ 0x100*/;
            if (!bytes || bytes.length !== len) bytes = new Array(len);
            wmsx.Util.arrayCopy(this.rom.content, 0, bytes);
            driver.patchDiskBIOS(
                bytes, 0,
                0x07d6, 0x08c6, 0x3459, 0x379d, 0x3800, 0x381a, 0x3c52, 0x3713, false
            );
            driver.patchDiskBIOS(
                bytes, 0xc000,
                -1,     -1, 0x3495, 0x37cb, 0x380b, 0x3826, 0x3c58, 0x3747, false
            );
        }
        this.bytes = bytes;
        bankOffset = s.b1;
        driver.loadState(s.d);
    };


    if (rom) init(this);

};

wmsx.CartridgeDOS2TRDiskPatched.prototype = wmsx.Slot.base;

wmsx.CartridgeDOS2TRDiskPatched.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeDOS2TRDiskPatched(null);
    cart.loadState(state);
    return cart;
};
