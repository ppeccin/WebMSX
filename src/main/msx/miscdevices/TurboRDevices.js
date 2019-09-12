// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Turbo R Pause and S1990 devices

wmsx.TurboRDevices = function() {
"use strict";

    this.setMachineType = function(type) {
        active = type >= wmsx.Machine.MACHINE_TYPE.MSXTR;
    };

    this.connectBus = function(bus) {
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

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
        leds = 0x00;
        registerSelect = 0;
        register6 = 0x60;
    };

    this.inputA7 = function() {
        var res = active ? 0 : 0xff;

        // console.log("tR pause read: " + res.toString(16));

        return res;           // bit 0: pause switch (1 = on). turbo R never paused here!
    };
    this.outputA7 = function(val) {
        console.log("tR LEDS write: " + val.toString(16));

        if (active) leds = val & 0x81;      // bit 7: R800 LED (1 = on), bit 0: pause LED (1 = on)
    };

    this.inputE4 = function() {
        var res = active ? registerSelect : 0xff;

        console.log("S19990 Register select read: " + res.toString(16));

        return res;
    };
    this.outputE4 = function(val) {
        console.log("S19990 Register select write: " + val.toString(16));

        if (active) registerSelect = val;
    };

    this.inputE5 = function() {
        var res = active && registerSelect === 6 ? register6 : 0xff;

        console.log("S19990 Register: " + registerSelect.toString(16) + " read: " + res.toString(16));

        return res;
    };
    this.outputE5 = function(val) {
        console.log("S19990 Register: " + registerSelect.toString(16) + " write: " + val.toString(16));

        if (active && registerSelect === 6) register6 = val & 0x60;
    };

    this.inputE6 = function() {
        console.log("S19990 Timer LOW read");

        return active ? 0xff : 0xff;
    };
    this.inputE7 = function() {
        console.log("S19990 Timer HIGH read");

        return active ? 0xff : 0xff;
    };

    this.outputE6 = function(val) {
        console.log("S19990 Timer reset: " + val.toString(16));
    };


    var active = false;

    var leds = 0;
    var registerSelect = 0;
    var register6 = 0x60;          	// bit 6: ROM mode (0=DRAM, 1=ROM), bit 5: Processor mode (0=R800, 1=Z80)


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: active,
            ld: leds,
            rs: registerSelect,
            r6: register6
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
        register6 = s.r6
    };

};
