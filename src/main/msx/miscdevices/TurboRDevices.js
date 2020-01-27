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
        this.patchPCMBIOS(bios.bytes);
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
        r800DramLed = 0;
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
        return active ? r800Pause : 0xff;
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
            var mod = val ^ register6;
            if (!mod) return;

            register6 = newVal;
            cpu.setR800Mode((register6 & 0x20) === 0);
            setDRAMMode((register6 & 0x40) === 0);

            // Update R800 DRAM Led status only if R800 Mode is on R800 Led is off
            if (!(register6 & 0x20) || !(leds & 0x80)) r800DramLed = (register6 & 0x40) ? 0 : 1;

            // Update Leds if R800 Led is on or if DRAM Mode changed
            if ((leds & 0x80) || (mod & 0x40)) updateLeds();
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

    this.setR800Pause = function(pause) {
        r800Pause = pause ? 0x01 : 0x00;
    };

    this.isR800LedOn = function() {
        return (leds & 0x80) !== 0;
    };

    function setDRAMMode(dramMode) {
        bus.setDRAMMode(ram && dramMode);
        bios.setDRAMMode(ram && dramMode);
        biosExt.setDRAMMode(ram && dramMode);
        if (ram) ram.setDRAMMode(dramMode);
    }

    function getCounterValue() {
        return ((cpu.getBUSCycles() - counterBase) / 14) & 0xffff;
    }

    function updateLeds() {
        ledsSocket.ledStateChanged(3, (leds & 0x80) ? 2 + r800DramLed : (register6 & 0x40) ? 0 : 1);
    }

    this.patchPCMBIOS = function(bytes) {
        // console.log("Patch PCB BIOS, active: ", active);

        if (!active) return;

        // PCMPLY routine (EXT c)
        bytes[0x0186] = 0xed;
        bytes[0x0187] = 0xec;
        bytes[0x0188] = 0xc9;

        // PCMREC routine (EXT d)
        bytes[0x0189] = 0xed;
        bytes[0x018a] = 0xed;
        bytes[0x018b] = 0xc9;
    };

    this.cpuExtensionBegin = function(s) {
        switch (s.extNum) {
            case 0xec:
                return PCMPLY(s.F);
            case 0xed:
                return PCMREC(s.F);
        }
    };

    this.cpuExtensionFinish = function(s) {
        // No Finish operation
    };

    function PCMPLY(F) {
        // console.log("PCMPLY");
        return { F: F |= 0x01 };        // Set C flag = fail
    }

    function PCMREC(F) {
        // console.log("PCMREC");
        return { F: F |= 0x01 };        // Set C flag = fail
    }

    
    var bus;
    var active = false;

    var r800Pause = 0x00;           // bit 0: R800 pause switch (1 = on)
    var leds = 0x00;                // bit 7: R800 LED (1 = on), bit 1: Z80 pause??? (1 = yes), bit 0: pause LED (1 = on)
    var r800DramLed = 0;
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
            rl: r800DramLed,
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

        active = s.a;
        leds = s.ld;
        r800DramLed = s.rl || 0;
        registerSelect = s.rs;
        register5 = s.r5;
        register6 = s.r6;
        counterBase = s.cb;
        updateLeds();
    };

};
