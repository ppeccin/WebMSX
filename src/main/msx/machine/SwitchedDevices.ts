// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SwitchedDevices = function() {
    "use strict";

    this.connect = function(bus) {
        bus.connectInputDevice( 0x40, this.input40);
        bus.connectOutputDevice(0x40, this.output40);
        for (var p = 0x41; p <= 0x4f; ++p) {
            bus.connectInputDevice( p, this.inputPort);
            bus.connectOutputDevice(p, this.outputPort);
        }
    };

    this.reset = function() {
        activeDevice = 0;
    };

    this.connectSwitchedDevice = function(port, device) {
        if (!device) return;
        devices[port] = device;
    };

    this.disconnectSwitchedDevice = function(port, device) {
        if (devices[port] !== device) return;
        devices[port] = undefined;
        if (activeDevice === port) activeDevice = 0;
    };

    this.input40 = function () {
        return ~activeDevice & 0xff;
    };

    this.output40 = function (val) {
        activeDevice = devices[val] ? val : 0;
    };

    this.inputPort = function (port) {
        return activeDevice ? devices[activeDevice].switchedPortInput(port & 0xff) : 0xff;
    };

    this.outputPort = function (val, port) {
        if (activeDevice) devices[activeDevice].switchedPortOutput(val, port & 0xff);
    };


    var devices = new Array(256);
    var activeDevice = 0;

};