// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Hold System Control Flags used in MSX2, MSX2+ and TurboR

wmsx.SystemFlags = function() {
"use strict";

    this.setMachineType = function(type) {
        active = type >= 3;     // auto: Only for MSX2+ or better
    };

    this.connectBus = function(bus) {
        bus.connectInputDevice( 0xf3, this.inputF3);                            // VDP Mode  (2+ only)
        bus.connectOutputDevice(0xf3, this.outputF3);
        bus.connectInputDevice( 0xf4, this.inputF4);                            // System Boot flags (2+ only)
        bus.connectOutputDevice(0xf4, this.outputF4);
        bus.connectInputDevice( 0xf5, wmsx.DeviceMissing.outputPortIgnored);    // System Control flags
        bus.connectOutputDevice(0xf5, wmsx.DeviceMissing.outputPortIgnored);
        bus.connectInputDevice( 0xf6, wmsx.DeviceMissing.inputPortIgnored);     // Color Bus
        bus.connectOutputDevice(0xf6, wmsx.DeviceMissing.outputPortIgnored);
        bus.connectInputDevice( 0xf7, wmsx.DeviceMissing.inputPortIgnored);     // AV Control
        bus.connectOutputDevice(0xf7, wmsx.DeviceMissing.outputPortIgnored);
        bus.connectInputDevice( 0xf8, wmsx.DeviceMissing.inputPortIgnored);     // Optional AV Control (PAL)
        bus.connectOutputDevice(0xf8, wmsx.DeviceMissing.outputPortIgnored);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
        bootFlags = BOOT_FLAGS_POWERON;
        vdpFlags = VDP_FLAGS_POWERON;
    };

    this.inputF3 = function() {
        return active ? vdpFlags : 0xff;
    };

    this.outputF3 = function(val) {
        if (active) vdpFlags = val;
    };

    this.inputF4 = function() {
        return active ? bootFlags : 0xff;
    };

    this.outputF4 = function(val) {
        if (active) bootFlags = val;
    };


    var active;

    var BOOT_FLAGS_POWERON = 0xff;
    var VDP_FLAGS_POWERON = 0x00;

    var bootFlags;
    var vdpFlags;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: active,
            bf: bootFlags,
            vf: vdpFlags
        };
    };

    this.loadState = function(s) {
        active = s.a !== undefined ? s.a : s.m2p;    // Backward compatibility
        bootFlags = s.bf;
        vdpFlags = s.vf;
    };

};
