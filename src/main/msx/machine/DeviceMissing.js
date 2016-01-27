// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DeviceMissing = {

    inputPort: function() {
        //wmsx.Util.log ("Empty IN, PC:" + wmsx.Util.toHex4(WMSX.room.machine.cpu.eval("PC")));
        return 0xff;
    },

    outputPort: function(val) {
        //wmsx.Util.log ("Empty OUT val: " + val.toString(16) + " PC:" + wmsx.Util.toHex4(WMSX.room.machine.cpu.eval("PC")));
    }

};

wmsx.DeviceMissing.IGNORED_PORTS = [

    0x90, 0x91, 0x93,                   // Printer
    0xb8, 0xb9, 0xba, 0xbb,             // Card Reader?

    0x80, 0x81, 0x82, 0x83,
    0x84, 0x85, 0x86, 0x87,             // RS-232

    0xd8, 0xd9, 0xda, 0xdb,             // Kanji ROM
    0xdc, 0xdd,

    0x7c, 0x7d,                         // MSX-MUSIC, MSX-AUDIO, MoonSound, MSX-INTERFACE
    0xc0, 0xc1, 0xc2, 0xc3, 0xc4,
    0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
    0xca, 0xcb, 0xcc, 0xcd, 0xce,
    0xcf,

    0xf5, 0xf7, 0xf8                   // System / AV Control

];