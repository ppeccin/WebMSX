// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Hold System Control Flags used in MSX2, MSX2+ and TurboR
// Optional Device

wmsx.SystemFlags = function(msx2p) {

    this.connect = function(machine) {
        if (isMSX2P) {
            machine.bus.connectInputDevice( 0xf3, this.inputF3);           // VDP Mode
            machine.bus.connectOutputDevice(0xf3, this.outputF3);
            machine.bus.connectInputDevice( 0xf4, this.inputF4);           // System Boot flags
            machine.bus.connectOutputDevice(0xf4, this.outputF4);
        }
        machine.bus.connectInputDevice( 0xf5, wmsx.DeviceMissing.outputPortIgnored);    // System Control flags
        machine.bus.connectOutputDevice(0xf5, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.connectInputDevice( 0xf6, wmsx.DeviceMissing.inputPortIgnored);     // Color Bus
        machine.bus.connectOutputDevice(0xf6, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.connectInputDevice( 0xf7, wmsx.DeviceMissing.inputPortIgnored);     // AV Control
        machine.bus.connectOutputDevice(0xf7, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.connectInputDevice( 0xf8, wmsx.DeviceMissing.inputPortIgnored);     // Optional AV Control (PAL)
        machine.bus.connectOutputDevice(0xf8, wmsx.DeviceMissing.outputPortIgnored);
    };

    this.disconnect = function(machine) {
        machine.bus.disconnectInputDevice( 0xf3, this.inputF3);
        machine.bus.disconnectOutputDevice(0xf3, this.outputF3);
        machine.bus.disconnectInputDevice( 0xf4, this.inputF4);
        machine.bus.disconnectOutputDevice(0xf4, this.outputF4);
        machine.bus.disconnectInputDevice( 0xf5, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.disconnectOutputDevice(0xf5, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.disconnectInputDevice( 0xf6, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0xf6, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.disconnectInputDevice( 0xf7, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0xf7, wmsx.DeviceMissing.outputPortIgnored);
        machine.bus.disconnectInputDevice( 0xf8, wmsx.DeviceMissing.inputPortIgnored);
        machine.bus.disconnectOutputDevice(0xf8, wmsx.DeviceMissing.outputPortIgnored);
    };

    this.powerOn = function() {
        bootFlags = BOOT_FLAGS_POWERON;
        vdpFlags = VDP_FLAGS_POWERON;
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
    };

    this.inputF3 = function() {
        return vdpFlags;
    };

    this.outputF3 = function(val) {
        vdpFlags = val;
    };

    this.inputF4 = function() {
        return bootFlags;
    };

    this.outputF4 = function(val) {
        bootFlags = val;
    };


    var isMSX2P = msx2p;

    var BOOT_FLAGS_POWERON = 0xff;
    var VDP_FLAGS_POWERON = 0x00;

    var bootFlags;
    var vdpFlags;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m2p: isMSX2P,
            bf: bootFlags,
            vf: vdpFlags
        };
    };

    this.loadState = function(s) {
        isMSX2P = s.m2p;
        bootFlags = s.bf;
        vdpFlags = s.vf;
    };

};

wmsx.SystemFlags.recreateFromSavestate = function(instance, s) {
    if (s) {
        if (!instance) instance = new wmsx.SystemFlags();
        instance.loadState(s);
        return instance
    } else
        return null;
};