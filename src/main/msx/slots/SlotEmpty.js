// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotEmpty = {};

wmsx.SlotEmpty.impl = function() {

    this.read = function(address) {
        return 0xff;
    };

    this.format = wmsx.SlotFormats.Empty;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name
        };
    };

};

wmsx.SlotEmpty.impl.prototype = wmsx.Slot.base;

wmsx.SlotEmpty.singleton = new wmsx.SlotEmpty.impl();


