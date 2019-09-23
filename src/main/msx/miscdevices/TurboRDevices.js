// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Turbo R Pause and S1990 devices

wmsx.TurboRDevices = function(cpu) {
"use strict";

    this.setMachineType = function(type) {
        active = type >= wmsx.Machine.MACHINE_TYPE.MSXTR;
    };

    this.connectBus = function(pBus) {
        bus = pBus;
        bus.connectInputDevice( 0xa7, this.inputA7);            // Pause Switch
        bus.connectOutputDevice(0xa7, this.outputA7);           // R800 and Pause Leds

        bus.connectInputDevice( 0xe4, this.inputE4);            // S1990 Register Select
        bus.connectOutputDevice(0xe4, this.outputE4);
        bus.connectInputDevice( 0xe5, this.inputE5);            // S1990 Register Access
        bus.connectOutputDevice(0xe5, this.outputE5);

        bus.connectInputDevice( 0xe6, this.inputE6);            // 16 bit Counter Read
        bus.connectInputDevice( 0xe7, this.inputE7);

        bus.connectOutputDevice(0xe6, this.outputE6);           // 16 bit Counter Reset
        bus.connectOutputDevice(0xe7, wmsx.DeviceMissing.outputPortIgnored());
    };

    this.connectBIOS = function(slot) {
        bios = slot;
        if (ram) bios.connectRAM(ram, 65536);
    };
    this.disconnectBIOS = function(slot) {
        if (bios === slot) bios = undefined;
    };

    this.connectBIOSExt = function(slot) {
        biosExt = slot;
        if (ram) biosExt.connectRAM(ram, 32768);
    };
    this.disconnectBIOSExt = function(slot) {
        if (biosExt === slot) biosExt = undefined;
    };

    this.connectRAM = function(slot) {
        if (ram) return;        // Connects only to the first RAM Mapper connected to the system
        ram = slot;
        if (bios) bios.connectRAM(ram, 65536);
        if (biosExt) biosExt.connectRAM(ram, 32768);
    };
    this.disconnectRAM = function(slot) {
        if (ram !== slot) return;
        if (bios) bios.disconnectRAM(ram);
        if (biosExt) biosExt.disconnectRAM(ram);
        ram = undefined;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
        leds = 0x00;
        registerSelect = 0;
        register6 = 0x60;
        this.outputE6(0);       // reset counter
    };

    this.outputA7 = function(val) {
        // console.log("tR LEDS write: " + val.toString(16));

        if (active) leds = val & 0x81;      // bit 7: R800 LED (1 = on), bit 1: Z80 pause??? (1 = yes), bit 0: pause LED (1 = on)
    };
    this.inputA7 = function() {
        var res = active ? window.TRPAUSE : 0xff;

        // console.log("tR pause read: " + res.toString(16));

        return res;           // bit 0: pause switch (1 = on). turbo R never paused here!
    };

    this.outputE4 = function(val) {
        // console.log("S1990 Register select write: " + val.toString(16));

        if (active) registerSelect = val;
    };
    this.inputE4 = function() {
        var res = active ? registerSelect : 0xff;

        // console.log("S1990 Register select read: " + res.toString(16));

        return res;
    };

    this.outputE5 = function(val) {
        // console.log("S1990 Register: " + registerSelect.toString(16) + " write: " + val.toString(16) + ", PC: " + WMSX.room.machine.cpu.eval("PC").toString(16));

        if (registerSelect === 6) {
            var newVal = val & 0x60;
            if (register6 === newVal) return;
            register6 = newVal;

            cpu.setR800Mode((register6 & 0x20) === 0);
            var dramMode = (register6 & 0x40) === 0;
            bios.setDRAMMode(dramMode);
            biosExt.setDRAMMode(dramMode);
            ram.setDRAMMode(dramMode);
        }
    };
    this.inputE5 = function() {
        var res =
              registerSelect === 5 ? register5
            : registerSelect === 6 ? register6
            : 0xff;

        // var pri = bus.getPrimarySlotConfig();
        // console.log("S1990 Register: " + registerSelect.toString(16) + " read: " + res.toString(16)
        //     + " Slots: " + wmsx.Util.toHex2(pri)
        //     + " Sub Slots: " + wmsx.Util.toHex2(~bus.slots[pri >> 6].read(0xffff) & 0xff));

        return res;
    };

    this.outputE6 = function(val) {
        // console.log("S1990 Counter reset");

        counterBase = cpu.getBUSCycles();
    };
    this.inputE6 = function() {
        // console.log("S1990 Counter LOW read");

        return active ? getCounterValue() & 0xff : 0xff;
    };
    this.inputE7 = function() {
        // console.log("S1990 Counter HIGH read");

        return active ? getCounterValue() >> 8 : 0xff;
    };

    function getCounterValue() {
        return ((cpu.getBUSCycles() - counterBase) / 14) & 0xffff;
    }


    var bus;
    var active = false;

    var leds = 0x00;
    var registerSelect = 0;
    var register5 = 0x00;           // bit 6: Firmware Switch (0=right(OFF), 1=left(ON))  NEVER CHANGED, firmware always inactive
    var register6 = 0x60;          	// bit 6: ROM mode (0=DRAM, 1=ROM), bit 5: Processor mode (0=R800, 1=Z80)
    var counterBase = 0;

    var bios, biosExt, ram;


    // TODO Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: active,
            ld: leds,
            rs: registerSelect,
            r6: register6,
            cb: counterBase
        };
    };

    this.loadState = function(s) {
        // Backward Compatibility
        if (!s) {
            active = false;
            this.reset();
            return;
        }

        active =  s.a;
        leds = s.ld;
        registerSelect = s.rs;
        register6 = s.r6;
        counterBase = s.cb;
    };


    window.TRPAUSE = 0;

};
