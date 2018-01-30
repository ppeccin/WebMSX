// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.BIOSKeyboardExtension = function(bus) {
"use strict";

    // ADDS string to the type sequence
    this.typeString = function(str) {
        if (str === undefined || str === null) return;
        var addStr = str.toString();
        if (!addStr) return;

        // Normalize to the MSX like break
        addStr = addStr.replace(/\r\n/g, '\r').replace(/\n/g, '\r');

        stringToType = (stringToType || "") + addStr;
    };

    this.cancelTypeString = function() {
        stringToType = null;
        typeFromPosition = 0;
    };

    this.keyboardExtensionClockPulse = function() {
        if (!stringToType) return;

        // Get buffer address info
        // Check if RAM is probably set correctly for BIOS usage (buffer present). Give up if not!
        var readAddress = bus.read(READ_ADDRESS) | (bus.read(READ_ADDRESS + 1) << 8);
        if (readAddress < BUFFER_START || readAddress > BUFFER_END) return;
        var writeAddress = bus.read(WRITE_ADDRESS) | (bus.read(WRITE_ADDRESS + 1) << 8);
        if (writeAddress < BUFFER_START || writeAddress > BUFFER_END) return;

        // Only type if the buffer has space
        var bufSpace = (readAddress - writeAddress - 1); if (bufSpace < 0) bufSpace += 40;
        if (bufSpace <= 0) return;

        // Part of string to be typed
        var str = stringToType.substr(typeFromPosition, bufSpace);

        // Write in buffer and update WriteAddress
        for (var i = 0; i < str.length; i++) {
            bus.write(writeAddress, str.charCodeAt(i) & 255);
            if (++writeAddress > BUFFER_END) writeAddress = BUFFER_START;
        }
        bus.write(WRITE_ADDRESS, writeAddress & 0xff); bus.write(WRITE_ADDRESS + 1, writeAddress >> 8);

        // Update and check for termination
        typeFromPosition += str.length;
        if (typeFromPosition >= stringToType.length) this.cancelTypeString();
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: stringToType && btoa(stringToType),
            p: typeFromPosition
        };
    };

    this.loadState = function(state) {
        stringToType = state.s && atob(state.s);
        typeFromPosition = state.p;
    };


    var stringToType;
    var typeFromPosition = 0;

    var WRITE_ADDRESS = 0xf3f8;     // WriteAddress == ReadAddress means buffer is empty
    var READ_ADDRESS =  0xf3fa;
    var BUFFER_START =  0xfbf0;
    var BUFFER_END =    0xfc17;     // 40 bytes, but only 39 are usable

};
