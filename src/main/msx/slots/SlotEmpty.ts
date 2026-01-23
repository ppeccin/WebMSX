// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Empty slot
// 0x0000 - 0xffff

wmsx.SlotEmpty = {};
wmsx.SlotEmpty.impl = function() {
"use strict";

    this.read = function(address) {
        // console.log("EMPTY slot read at: " + address.toString(16) + ". SlotConf: " + WMSX.room.machine.bus.getPrimarySlotConfig().toString(16));

        return 0xff;
    };

    // this.write = function(address, value) {
    //     console.log("EMPTY slot write: " + value + ", at: " + address.toString(16) + ". SlotConf: " + WMSX.room.machine.bus.getPrimarySlotConfig().toString(16));
    // };


    this.rom = new wmsx.ROM("EMPTY", [], {n: "EMPTY", h: "", l: "EMPTY"});

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


