// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Abstract base Cartrige
wmsx.Cartridge = function() {

    this.connect = function(machine) {
    };

    this.disconnect = function(machine) {
    };

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
    };

    this.write = function(address, value) {
        // ROMs cannot be modified
    };

    this.dump = function(from, quant) {
        wmsx.Util.dump(this.bytes, from, quant);
    };

};

wmsx.Cartridge.base = new wmsx.Cartridge();