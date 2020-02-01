// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Turbo R S1990 devices
// Also controls CPU Pause Key for all machines

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
        val &= 0x81;
        if (!active || leds === val) return;

        leds = val;
        updateLeds();
    };
    this.inputA7 = function() {
        return active ? cpuPause && (register6 & 0x20) === 0 ? 0x01 : 0x00 : 0xff;     // bit 0: R800 pause switch (1 = on), report only in R800 mode!
    };

    this.outputE4 = function(val) {
        if (active) registerSelect = val;
    };
    this.inputE4 = function() {
        return active ? registerSelect : 0xff;
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

            // Update R800 DRAM Led status only if R800 Mode is on or R800 Led is off
            if (!(register6 & 0x20) || !(leds & 0x80)) r800DramLed = (register6 & 0x40) ? 0 : 1;

            // Update Leds if R800 Led is on or if DRAM Mode changed
            if ((leds & 0x80) || (mod & 0x40)) updateLeds();
        }
    };
    this.inputE5 = function() {
        return registerSelect === 5 ? register5
             : registerSelect === 6 ? register6
             : 0xff;
    };

    this.outputE6 = function(val) {
        counterBase = cpu.getBUSCycles();
    };
    this.inputE6 = function() {
        return active ? getCounterValue() & 0xff : 0xff;
    };
    this.inputE7 = function() {
        return active ? getCounterValue() >> 8 : 0xff;
    };

    this.isR800LedOn = function() {
        return (leds & 0x80) !== 0;
    };

    this.isCPUPaused = function() {
        return cpuPause;
    };

    this.setCPUPause = function(pause, forceNow) {
        cpuPause = pause;
        if (forceNow) this.vSyncPulse();
    };

    this.vSyncPulse = function() {
        if (cpuPause === z80Paused) return;

        z80Paused = cpuPause;
        updateZ80Pause();
        updateLeds();
    };

    function updateZ80Pause() {
        cpu.setZ80BUSRQ(z80Paused);
    }

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
        ledsSocket.ledStateChanged(2, (leds & 0x01) || (z80Paused && (register6 & 0x20)) ? 1 : 0);
        ledsSocket.ledStateChanged(4, (leds & 0x80) ? 2 + r800DramLed : (register6 & 0x40) ? 0 : 1);
    }

    this.patchPCMBIOS = function(bytes) {
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

    var cpuPause = false;
    var z80Paused = false;
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
            cp: cpuPause,
            zp: z80Paused,
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
            cpuPause = false;
            z80Paused = false;
        } else {
            active = s.a;
            cpuPause = s.cp;
            z80Paused = s.zp;
            leds = s.ld;
            r800DramLed = s.rl || 0;
            registerSelect = s.rs;
            register5 = s.r5;
            register6 = s.r6;
            counterBase = s.cb;
        }

        updateZ80Pause();
        updateLeds();
    };

};
