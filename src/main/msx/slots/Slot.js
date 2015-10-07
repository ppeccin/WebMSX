// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Abstract base Slot
wmsx.Slot = function() {

    this.connect = function(machine) {
    };

    this.disconnect = function(machine) {
    };

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
    };

    this.reset = function() {
    };

    this.write = function(address, value) {
    };

    this.cpuExtensionBegin = function(s) {
    };

    this.cpuExtensionFinish = function(s) {
    };

    this.dump = function(from, quant) {
        wmsx.Util.dump(this.bytes, from, quant);
    };

};

wmsx.Slot.base = new wmsx.Slot();