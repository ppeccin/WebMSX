// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Hold System Control flags used in MSX2, MSX2+ and TurboR

wmsx.SystemControl = function(msx2, msx2p) {

    this.connectBus = function(bus) {
        if (msx2p) {
            bus.connectInputDevice( 0xf3, this.inputF3);              // VDP Mode
            bus.connectOutputDevice(0xf3, this.outputF3);
            bus.connectInputDevice( 0xf4, this.inputF4);              // System Boot flags
            bus.connectOutputDevice(0xf4, this.outputF4);
            bus.connectInputDevice( 0xf5, this.inputUnavailable);     // System Control flags
            bus.connectOutputDevice(0xf5, this.outputUnavailable);
            bus.connectInputDevice( 0xf6, this.inputUnavailable);     // Color Bus
            bus.connectOutputDevice(0xf6, this.outputUnavailable);
            bus.connectInputDevice( 0xf7, this.inputUnavailable);     // AV Control
            bus.connectOutputDevice(0xf7, this.outputUnavailable);
            bus.connectInputDevice( 0xf8, this.inputUnavailable);     // Optional AV Control (PAL)
            bus.connectOutputDevice(0xf8, this.outputUnavailable);
        }
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

        console.log("Reading F3");

        return 0xff;
    };

    this.outputF3 = function(val) {

        console.log("Writing F3: " + val.toString(16));

    };

    this.inputF4 = function() {

        console.log("Reading F4: " + bootFlags.toString(16));

        return bootFlags;
    };

    this.outputF4 = function(val) {

        console.log("Writing F4: " + val.toString(16));

        bootFlags = val & 0xff;
    };

    this.inputUnavailable = function(port) {

        //console.log("Reading " + (port & 255).toString(16));

        return 0xff;
    };

    this.outputUnavailable = function(val, port) {
        //console.log("Writing " + (port & 255).toString(16) + ": " + val.toString(16));
    };


    var BOOT_FLAGS_POWERON = 0xff;

    var bootFlags;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
        };
    };

    this.loadState = function(s) {
    };

};