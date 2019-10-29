// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Turbo R Pause and S1990 devices

wmsx.TurboRDevices = function(cpu, ledsSocket) {
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
        if (slot.format !== wmsx.SlotFormats.RAMMapper) return;

        ram = slot;
        if (bios) bios.connectRAM(ram, 65536);
        if (biosExt) biosExt.connectRAM(ram, 32768);

        // console.error("TRD Connect RAM")
    };
    this.disconnectRAM = function(slot) {
        if (ram !== slot) return;
        if (bios) bios.disconnectRAM(ram);
        if (biosExt) biosExt.disconnectRAM(ram);
        ram = undefined;

        // console.error("TRD Disconnect RAM")
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        this.reset();
    };

    this.reset = function() {
        leds = 0x00;
        ledR800Type = 1;
        registerSelect = 0;
        register6 = 0x60;
        this.outputE6(0);       // reset counter
        updateLeds();
    };

    this.outputA7 = function(val) {
        // console.log("tR LEDS write: " + val.toString(16));

        val &= 0x81;
        if (!active || leds === val) return;

        leds = val;
        updateLeds();
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
            setDRAMMode((register6 & 0x40) === 0);

            // Update led type only if both the led and R800 is on
            if ((register6 & 0x20) === 0) {
                ledR800Type = 1 + ((register6 & 0x40) >> 6);
                if (leds & 0x80) updateLeds();
            }
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

    this.isR800LedOn = function() {
        return (leds & 0x80) !== 0;
    };

    function setDRAMMode(dramMode) {
        bios.setDRAMMode(ram && dramMode);
        biosExt.setDRAMMode(ram && dramMode);
        if (ram) ram.setDRAMMode(dramMode);
    }

    function getCounterValue() {
        return ((cpu.getBUSCycles() - counterBase) / 14) & 0xffff;
    }

    function updateLeds() {
        ledsSocket.ledStateChanged(3, (leds & 0x80) ? ledR800Type : 0);
    }


    var bus;
    var active = false;

    var leds = 0x00;                // bit 7: R800 LED (1 = on), bit 1: Z80 pause??? (1 = yes), bit 0: pause LED (1 = on)
    var ledR800Type = 1;
    var registerSelect = 0;
    var register5 = 0x00;           // bit 6: Firmware Switch (0=right(OFF), 1=left(ON))  NEVER CHANGED, firmware always inactive
    var register6 = 0x60;          	// bit 6: ROM mode (0=DRAM, 1=ROM), bit 5: Processor mode (0=R800, 1=Z80)
    var counterBase = 0;

    var bios, biosExt, ram;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: active,
            ld: leds,
            lr: ledR800Type,
            rs: registerSelect,
            r5: register5,
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
        ledR800Type = s.lr;
        registerSelect = s.rs;
        register5 = s.r5;
        register6 = s.r6;
        counterBase = s.cb;
        updateLeds();
    };


    window.TRPAUSE = 0;      // TODO Global

};
