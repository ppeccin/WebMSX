// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DeviceMissing = {

    self: this,

    inputPort: function (port) {
        if (self.debugMode && !wmsx.Util.arrayHasElement(wmsx.DeviceMissing.IGNORED_PORTS, port & 255))
            console.log("Missing IN " + (port & 255).toString(16));
        return 0xff;
    },

    outputPort: function (val, port) {
        if (self.debugMode && !wmsx.Util.arrayHasElement(wmsx.DeviceMissing.IGNORED_PORTS, port & 255))
            console.log("Missing OUT " + (port & 255).toString(16) + ", " + val.toString(16));
    },

    inputPortIgnored: function (port) {
        return 0xff;
    },

    outputPortIgnored: function (val, port) {
    },

    IGNORED_PORTS: [

        0x90, 0x91, 0x93,                   // Printer
        0xb8, 0xb9, 0xba, 0xbb,             // Card Reader?

        0x80, 0x81, 0x82, 0x83,             // RS-232
        0x84, 0x85, 0x86, 0x87,

        //0xd8, 0xd9, 0xda, 0xdb,             // Kanji ROM
        //0xdc, 0xdd,

        0x7c, 0x7d,                         // MSX-MUSIC
        0xc0, 0xc1, 0xc2, 0xc3, 0xc4,       // MSX-AUDIO, MoonSound, MSX-INTERFACE
        0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
        0xca, 0xcb, 0xcc, 0xcd, 0xce,
        0xcf

    ],

    setDebugMode: function(mode) {
        self.debugMode = mode;
    },

    debugMode: 0

};