// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main BIOS ROM content >= 16K & <= 32K, starting at 0x0000. Can be bundled with other BIOS/ROMs
// Also handles turbo R DRAM mode. Redirects reads to top of RAM
// 0x0000 - ????

wmsx.SlotBIOS = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
        topAddress = bytes.length;
        self.originalVideoStandard = ((bytes[0x2b] & 0x80) === 0) ? wmsx.VideoStandard.NTSC : wmsx.VideoStandard.PAL;
    }

    this.connect = function(pMachine) {
        machine = pMachine;
        machine.setBIOS(this);
        machine.trd.connectBIOS(this);
        keyboardExtension.connect(machine);
        cassetteDriver.connect(this, machine);
        turboDriver.connect(machine);
    };

    this.disconnect = function(pMachine) {
        machine = undefined;
        if (cassetteDriver) cassetteDriver.disconnect(this, pMachine);
        if (turboDriver) turboDriver.disconnect(this, pMachine);
        pMachine.trd.disconnectBIOS(this);
        pMachine.setBIOS(null);
    };

    this.connectRAM = function(pRam, pRamBase) {
        ramBytes = pRam.bytes;
        ramBase = ramBytes.length - pRamBase;
    };
    this.disconnectRAM = function(pRam) {
        if (ramBytes !== pRam.bytes) return;
        ramBytes = undefined;
        dramMode = false;
    };

    this.getKeyboardExtension = function() {
        return keyboardExtension;
    };

    this.getTurboDriver = function () {
        return turboDriver;
    };

    this.powerOff = function() {
        if (turboDriver) turboDriver.powerOff();
        if (cassetteDriver) cassetteDriver.powerOff();
    };

    this.reset = function() {
        if (turboDriver) turboDriver.reset();
        dramMode = false;
    };

    this.setDRAMMode = function(state) {
        dramMode = !!state;
    };

    this.read = function(address) {
        if (address < topAddress)
            return dramMode ? ramBytes[ramBase + address] : bytes[address];
        else
            return 0xff;
    };

    // this.write = function(address, value) {
    //     wmsx.Util.log ("BIOS write: " + address.toString(16) + ", " + value.toString(16) + ". SlotConf: " + WMSX.room.machine.bus.getPrimarySlotConfig().toString(16));
    // };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to the Cassette Driver, TurboRDevices or Turbo Driver
        return s.extNum < 0xe9
            ? cassetteDriver.cpuExtensionBegin(s)
            : s.extNum < 0xee
                ? machine.trd.cpuExtensionBegin(s)
                : turboDriver.cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to the Cassette Driver, TurboRDevices or Turbo Driver
        return s.extNum < 0xe9
            ? cassetteDriver.cpuExtensionFinish(s)
            : s.extNum < 0xee
                ? machine.trd.cpuExtensionFinish(s)
                : turboDriver.cpuExtensionFinish(s);
    };

    this.setVideoStandardForced = function(forcedVideoStandard) {
        if (forcedVideoStandard === wmsx.VideoStandard.PAL) bytes[0x2b] |= 0x80;
        else bytes[0x2b] &= ~0x80;
    };

    this.setVideoStandardUseOriginal = function() {
        if (this.originalVideoStandard === wmsx.VideoStandard.PAL) bytes[0x2b] |= 0x80;
        else bytes[0x2b] &= ~0x80;
    };


    var machine;

    var bytes;
    this.bytes = null;

    var topAddress;

    var dramMode = false, ramBytes, ramBase = 0;

    var cassetteDriver = new wmsx.ImageCassetteDriver();
    var keyboardExtension = new wmsx.BIOSKeyboardExtension();
    var turboDriver = new wmsx.TurboDriver(this);

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
            td: turboDriver.saveState(),
            dr: dramMode
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
            if (machine) machine.trd.patchPCMBIOS(bytes);   // Patch now if already connected!
        }
        this.bytes = bytes;
        topAddress = bytes.length;
        if (machine) cassetteDriver.patchTapeBIOS(bytes, machine);  // Backward compatibility, if already connected, always re-patch BIOS now to correct CPU Extensions used
        if (s.ke) keyboardExtension.loadState(s.ke);
        turboDriver.loadState(s.td);
        dramMode = !!s.dr;                                          // Backward compatibility, will be false for old states
    };


    if (rom) init(this);

};

wmsx.SlotBIOS.prototype = wmsx.Slot.base;

wmsx.SlotBIOS.recreateFromSaveState = function (state, previousSlot) {
    var bios = previousSlot || new wmsx.SlotBIOS();
    bios.loadState(state);
    return bios;
};

