// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// 16K or 32K Main BIOS ROM
// 0x0000 - 0x7fff,

wmsx.SlotBIOS = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = new Array(0x8000);
        wmsx.Util.arrayCopy(rom.content, 0, bytes);
        wmsx.Util.arrayFill(bytes, 0xff, rom.content.length);
        self.bytes = bytes;
        self.originalVideoStandard = ((bytes[0x2b] & 0x80) === 0) ? wmsx.VideoStandard.NTSC : wmsx.VideoStandard.PAL;
    }

    this.connect = function(machine) {
        keyboardExtension = new wmsx.BIOSKeyboardExtension(machine.bus);
        cassetteDriver = new wmsx.ImageCassetteDriver();
        cassetteDriver.connect(this, machine);
        turboDriver = new wmsx.TurboDriver();
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
        if (address < 0x8000)
            return bytes[address];
        else
            return 0xff;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to the Cassette Driver or Turbo Driver
        return s.extNum < 8 ? cassetteDriver.cpuExtensionBegin(s) : turboDriver.cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to the Cassette Driver or Turbo Driver
        return s.extNum < 8 ? cassetteDriver.cpuExtensionFinish(s) : turboDriver.cpuExtensionFinish(s);
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

    this.rom = null;
    this.format = wmsx.SlotFormats.BIOS;

    this.originalVideoStandard = null;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            v: this.originalVideoStandard.name,
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            ke: keyboardExtension.saveState(),
            td: turboDriver.saveState()
        };
    };

    this.loadState = function(state) {
        this.rom = wmsx.ROM.loadState(state.r);
        this.originalVideoStandard = wmsx.VideoStandard[state.v];
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        if (state.ke) keyboardExtension.loadState(state.ke);
        if (state.td) turboDriver.loadState(state.td);
        else turboDriver.reset();
    };


    var cassetteDriver;
    var turboDriver;
    var keyboardExtension;


    if (rom) init(this);

};

wmsx.SlotBIOS.prototype = wmsx.Slot.base;

wmsx.SlotBIOS.recreateFromSaveState = function (state, previousSlot) {
    var bios = previousSlot || new wmsx.SlotBIOS();
    bios.loadState(state);
    return bios;
};

