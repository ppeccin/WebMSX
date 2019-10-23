// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX2 Standard RAM Mapper. Supports sizes from 128KB to 4MB
// Also handles turbo R DRAM mode. Prevents writes to last 64KB when in DRAM mode
// 0x0000 - 0xffff

wmsx.SlotRAMMapper = function(rom) {
"use strict";

    function init(self) {
        self.rom = rom;
        var i = 0;
        while (VALID_SIZES[i] < WMSX.RAMMAPPER_SIZE && i < VALID_SIZES.length - 1) i++;
        var size = VALID_SIZES[i];
        bytes = wmsx.Util.arrayFill(new Array(size * 1024), 0);
        self.bytes = bytes;
        pageMask = (bytes.length >> 14) - 1;
        pageReadBackOR = 0xff & ~pageMask;
        dramModeStart = bytes.length - 65536;

        // console.log("RAMMApper init: " + size);
    }

    this.connect = function(machine) {
        machine.bus.connectInputDevice(0xfc, this.inputAll);
        machine.bus.connectInputDevice(0xfd, this.inputAll);
        machine.bus.connectInputDevice(0xfe, this.inputAll);
        machine.bus.connectInputDevice(0xff, this.inputAll);
        machine.bus.connectOutputDevice(0xfc, this.outputFC);
        machine.bus.connectOutputDevice(0xfd, this.outputFD);
        machine.bus.connectOutputDevice(0xfe, this.outputFE);
        machine.bus.connectOutputDevice(0xff, this.outputFF);
        machine.trd.connectRAM(this);
    };

    this.refreshConnect = function() {
        // Updates size if necessary
        if (WMSX.RAMMAPPER_SIZE * 1024 !== bytes.length) init(self);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectInputDevice(0xfc, this.inputAll);
        machine.bus.disconnectInputDevice(0xfd, this.inputAll);
        machine.bus.disconnectInputDevice(0xfe, this.inputAll);
        machine.bus.disconnectInputDevice(0xff, this.inputAll);
        machine.bus.disconnectOutputDevice(0xfc, this.outputFC);
        machine.bus.disconnectOutputDevice(0xfd, this.outputFD);
        machine.bus.disconnectOutputDevice(0xfe, this.outputFE);
        machine.bus.disconnectOutputDevice(0xff, this.outputFF);
        machine.trd.disconnectRAM(this);
    };

    this.setDRAMMode = function(state) {
        dramModeOff = !state;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        // Lose content
        wmsx.Util.arrayFill(bytes, 0x00);
    };

    this.reset = function() {
        page0Offset = page1Offset = page2Offset = page3Offset = 0;
        dramModeOff = true;
    };

    this.outputFC = function(val) {
        page0Offset = (val & pageMask) << 14;
    };
    this.outputFD = function(val) {
        page1Offset = ((val & pageMask) << 14) - 0x4000;
    };
    this.outputFE = function(val) {
        page2Offset = ((val & pageMask) << 14) - 0x8000;
    };
    this.outputFF = function(val) {
        page3Offset = ((val & pageMask) << 14) - 0xc000;
    };

    this.inputAll = function(port) {
        switch (port & 255) {
            case 0xfc: return pageReadBackOR | (page0Offset >> 14);
            case 0xfd: return pageReadBackOR | (page1Offset + 0x4000) >> 14;
            case 0xfe: return pageReadBackOR | (page2Offset + 0x8000) >> 14;
            case 0xff: return pageReadBackOR | (page3Offset + 0xc000) >> 14;
        }
        // console.warn("RAM Mapper readback on port", port.toString(16), ", result:", res.toString(16));
        // return res;
    };

    this.read = function(address) {
        // wmsx.Util.log ("RAM Mapper read: " + address.toString(16) + ", " + bytes[address].toString(16) + ". SlotConf: " + WMSX.room.machine.bus.getPrimarySlotConfig().toString(16));

        switch (address & 0xc000) {
            case 0x0000: return bytes[address + page0Offset];
            case 0x4000: return bytes[address + page1Offset];
            case 0x8000: return bytes[address + page2Offset];
            case 0xc000: return bytes[address + page3Offset];
        }
    };

    this.write = function(address, value) {
        // wmsx.Util.log ("RAM Mapper write: " + address.toString(16) + ", " + value.toString(16) + ". SlotConf: " + WMSX.room.machine.bus.getPrimarySlotConfig().toString(16));

        switch (address & 0xc000) {
            case 0x0000: if (dramModeOff || (address + page0Offset < dramModeStart)) bytes[address + page0Offset] = value; return;
            case 0x4000: if (dramModeOff || (address + page1Offset < dramModeStart)) bytes[address + page1Offset] = value; return;
            case 0x8000: if (dramModeOff || (address + page2Offset < dramModeStart)) bytes[address + page2Offset] = value; return;
            case 0xc000: if (dramModeOff || (address + page3Offset < dramModeStart)) bytes[address + page3Offset] = value; return;
        }
    };


    var page0Offset = 0, page1Offset = 0, page2Offset = 0, page3Offset = 0;
    var pageMask = 0;
    var pageReadBackOR = 0;

    var dramModeOff = true, dramModeStart = 0;

    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.RAMMapper;

    var VALID_SIZES = [64, 128, 256, 512, 1024, 2048, 4096];


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            p0: page0Offset, p1: page1Offset, p2: page2Offset, p3: page3Offset,
            dr: !dramModeOff
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        pageMask = (bytes.length >> 14) - 1;
        page0Offset = s.p0; page1Offset = s.p1; page2Offset = s.p2; page3Offset = s.p3;
        pageReadBackOR = 0xff & ~pageMask;
        dramModeStart = bytes.length - 65536;
        dramModeOff = !s.dr;                // Backward compatibility, will be true in old states
    };


    if (rom) init(this);

    this.eval = function(str) {
        return eval(str);
    };

};

wmsx.SlotRAMMapper.prototype = wmsx.Slot.base;

wmsx.SlotRAMMapper.recreateFromSaveState = function(state, previousSlot) {
    var ram = previousSlot || new wmsx.SlotRAMMapper();
    ram.loadState(state);
    return ram;
};