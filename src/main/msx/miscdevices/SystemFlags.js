// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Hold System Control Flags used in MSX2, MSX2+ and TurboR

wmsx.SystemFlags = function() {
"use strict";

    this.setMachineType = function(type) {
        // Ports F3/F4 active for >= MSX2+, port A7 active for >= turboR
        machineType = type;
    };

    this.connectBus = function(bus) {
        bus.connectInputDevice( 0xf3, this.inputF3);                            // VDP Mode  (2+ only)
        bus.connectOutputDevice(0xf3, this.outputF3);
        bus.connectInputDevice( 0xf4, this.inputF4);                            // System Boot flags (2+ only)
        bus.connectOutputDevice(0xf4, this.outputF4);

        bus.connectInputDevice( 0xa7, this.inputA7);
        bus.connectOutputDevice(0xa7, this.outputA7);

        bus.connectInputDevice( 0xf5, wmsx.DeviceMissing.outputPortIgnored);    // System Control flags, unsupported
        bus.connectOutputDevice(0xf5, wmsx.DeviceMissing.outputPortIgnored);
        bus.connectInputDevice( 0xf6, wmsx.DeviceMissing.inputPortIgnored);     // Color Bus, unsupported
        bus.connectOutputDevice(0xf6, wmsx.DeviceMissing.outputPortIgnored);
        bus.connectInputDevice( 0xf7, wmsx.DeviceMissing.inputPortIgnored);     // AV Control, unsupported
        bus.connectOutputDevice(0xf7, wmsx.DeviceMissing.outputPortIgnored);
        bus.connectInputDevice( 0xf8, wmsx.DeviceMissing.inputPortIgnored);     // Optional AV Control (PAL), unsupported
        bus.connectOutputDevice(0xf8, wmsx.DeviceMissing.outputPortIgnored);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
        bootFlags = machineType >= MSXTR ? 0x00 : 0xff;     // Normal for turboR, inverted for MSX2+
        vdpFlags = 0x00;
        pauseFlag = 0x00;
    };

    this.inputF3 = function() {
        return machineType >= MSX2P ? vdpFlags : 0xff;
    };

    this.outputF3 = function(val) {
        if (machineType >= MSX2P) vdpFlags = val;
    };

    this.inputF4 = function() {
        return machineType >= MSX2P ? bootFlags : 0xff;
    };

    this.outputF4 = function(val) {
        if (machineType >= MSX2P) bootFlags = val;
    };

    this.inputA7 = function() {
        return machineType >= MSXTR ? pauseFlag : 0xff;
    };

    this.outputA7 = function(val) {
        if (machineType >= MSXTR) pauseFlag = val;
    };


    var MSX1 = wmsx.Machine.MACHINE_TYPE.MSX1;
    var MSX2P = wmsx.Machine.MACHINE_TYPE.MSX2P;
    var MSXTR = wmsx.Machine.MACHINE_TYPE.MSXTR;

    var machineType = 1;
    var active;

    var bootFlags = 0;
    var vdpFlags = 0;
    var pauseFlag = 0;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            bf: bootFlags,
            vf: vdpFlags,
            mt: machineType
        };
    };

    this.loadState = function(s) {
        bootFlags = s.bf;
        vdpFlags = s.vf;
        machineType = s.mt !== undefined ? s.mt : (s.a !== undefined ? s.a : s.m2p) ? MSX2P : MSX1;    // Backward compatibility
    };

};
