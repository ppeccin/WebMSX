// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

SlotEmpty = function() {

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
    };

    this.write = function(address, value) {
        //console.log ("Write over Empty Slot at " + address.toString(16) + " := " + value.toString(16));
        // ROMs cannot be modified
    };

    this.read = function(address) {
        //console.log ("Empty Slot read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return 0xff;
    };

    this.format = SlotFormats.Empty;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name
        };
    };

};

SlotEmpty.createFromSaveState = function(state) {
    return new SlotEmpty();
};
