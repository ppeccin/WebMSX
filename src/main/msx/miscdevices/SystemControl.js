// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Hold System Control flags used in MSX2, MSX2+ and TurboR
// Optional Device

wmsx.SystemControl = function(msx2p) {

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
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
    };

    this.inputF3 = function() {

        //console.log("Reading F3");

        return 0xff;
    };

    this.outputF3 = function(val) {

        //console.log("Writing F3: " + val.toString(16));

    };

    this.inputF4 = function() {

        //console.log("Reading F4: " + bootFlags.toString(16));

        return bootFlags;
    };

    this.outputF4 = function(val) {

        //console.log("Writing F4: " + val.toString(16));

        bootFlags = val & 0xff;
    };


    var isMSX2P = msx2p;

    var BOOT_FLAGS_POWERON = 0xff;
    var bootFlags;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m2p: isMSX2P,
            bf: bootFlags
        };
    };

    this.loadState = function(s) {
        isMSX2P = s.m2p;
        bootFlags = s.bf;
    };

};

wmsx.SystemControl.recreateFromSavestate = function(instance, s) {
    if (s) {
        if (!instance) instance = new wmsx.SystemControl();
        instance.loadState(s);
        return instance
    } else
        return null;
};