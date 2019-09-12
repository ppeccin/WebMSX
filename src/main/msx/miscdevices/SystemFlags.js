// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// System Control Flags used in >= MSX2+

wmsx.SystemFlags = function() {
"use strict";

    this.setMachineType = function(type) {
        active = type >= wmsx.Machine.MACHINE_TYPE.MSX2P;
        tr = type >= wmsx.Machine.MACHINE_TYPE.MSXTR
    };

    this.connectBus = function(bus) {
        bus.connectInputDevice( 0xf3, this.inputF3);                            // VDP Mode  (2+ only)
        bus.connectOutputDevice(0xf3, this.outputF3);
        bus.connectInputDevice( 0xf4, this.inputF4);                            // System Boot flags (2+ only)
        bus.connectOutputDevice(0xf4, this.outputF4);

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
        bootFlags = tr ? 0x00 : 0xff;     // Normal for turboR, inverted for MSX2+
        vdpFlags = 0x00;
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


    var active = false;
    var tr = false;

    var bootFlags = 0;
    var vdpFlags = 0;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: active,
            tr: tr,
            bf: bootFlags,
            vf: vdpFlags
        };
    };

    this.loadState = function(s) {
        active = s.a !== undefined ? s.a : s.m2p;    // Backward compatibility
        tr = s.tr !== undefined ? s.tr : false;      // Backward compatibility
        bootFlags = s.bf;
        vdpFlags = s.vf;
    };

};
