// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Empty slot
// 0x0000 - 0xffff

wmsx.SlotEmpty = {};
wmsx.SlotEmpty.impl = function() {
"use strict";

    this.read = function(address) {
        return 0xff;
    };

    this.rom = new wmsx.ROM("EMPTY", new Uint8Array(0), {n: "EMPTY", h: "", l: "EMPTY"});

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


