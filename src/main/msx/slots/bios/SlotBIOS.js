// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main BIOS ROM content >= 16K & <= 64K, starting at 0x0000. Can be bundled with other BIOS/ROMs
// 0x0000 - ????

wmsx.SlotBIOS = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        topAddress = bytes.length;
        self.originalVideoStandard = ((bytes[0x2b] & 0x80) === 0) ? wmsx.VideoStandard.NTSC : wmsx.VideoStandard.PAL;
        cassetteDriver.patchBIOS(bytes);
    }

    this.connect = function(machine) {
        keyboardExtension.connect(machine);
        cassetteDriver.connect(this, machine);
        turboDriver.connect(this, machine);
        machine.setBIOS(this);
    };

    this.disconnect = function(machine) {
        if (cassetteDriver) cassetteDriver.disconnect(this, machine);
        machine.setBIOS(null);
    };

    this.getKeyboardExtension = function() {
        return keyboardExtension;
    };

    this.getTurboDriver = function () {
        return turboDriver;
    };

    this.powerOff = function() {
        if (cassetteDriver) cassetteDriver.powerOff();
    };

    this.reset = function() {
        if (turboDriver) turboDriver.reset();
    };

    this.read = function(address) {
        if (address < topAddress)
            return bytes[address];
        else
            return 0xff;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to the Cassette Driver or Turbo Driver
        return s.extNum < 0xe8 ? cassetteDriver.cpuExtensionBegin(s) : turboDriver.cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to the Cassette Driver or Turbo Driver
        return s.extNum < 0xe8 ? cassetteDriver.cpuExtensionFinish(s) : turboDriver.cpuExtensionFinish(s);
    };

    this.setVideoStandardForced = function(forcedVideoStandard) {
        if (forcedVideoStandard === wmsx.VideoStandard.PAL) bytes[0x2b] |= 0x80;
        else bytes[0x2b] &= ~0x80;
    };

    this.setVideoStandardUseOriginal = function() {
        if (this.originalVideoStandard === wmsx.VideoStandard.PAL) bytes[0x2b] |= 0x80;
        else bytes[0x2b] &= ~0x80;
    };


    var bytes;
    this.bytes = null;

    var topAddress;

    var cassetteDriver = new wmsx.ImageCassetteDriver();
    var keyboardExtension = new wmsx.BIOSKeyboardExtension();
    var turboDriver = new wmsx.TurboDriver();

    this.rom = null;
    this.format = wmsx.SlotFormats.BIOS;

    this.originalVideoStandard = null;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            v: this.originalVideoStandard.name,
            b: this.lightState() ? null : wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            ke: keyboardExtension.saveState(),
            td: turboDriver.saveState()
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        this.originalVideoStandard = wmsx.VideoStandard[s.v];
        if (s.b)
            bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        else {
            this.rom.reloadEmbeddedContent();
            if (!bytes || bytes.length !== this.rom.content.length) bytes = new Array(this.rom.content.length);
            wmsx.Util.arrayCopy(this.rom.content, 0, bytes);
            cassetteDriver.patchBIOS(bytes);
        }
        this.bytes = bytes;
        topAddress = bytes.length;
        if (s.ke) keyboardExtension.loadState(s.ke);
        turboDriver.loadState(s.td);
    };


    if (rom) init(this);

};

wmsx.SlotBIOS.prototype = wmsx.Slot.base;

wmsx.SlotBIOS.recreateFromSaveState = function (state, previousSlot) {
    var bios = previousSlot || new wmsx.SlotBIOS();
    bios.loadState(state);
    return bios;
};

