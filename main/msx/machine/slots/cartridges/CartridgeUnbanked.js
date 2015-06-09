// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Unbanked ROMs of size 8K, 16K, 32K or 64K. Position in slot depends on size, header (start address) and info hints
CartridgeUnbanked = function(rom) {
    var self = this;

    function init() {
        self.rom = rom;
        bytes = Util.arrayFill(new Array(65536), 0xff);
        var content = self.rom.content;
        // If 32K, position at 0x4000
        if (content.length === 32768) {
            for (var i = 0; i < 32768; i++)
                bytes[0x4000 + i] = content[i];
        }
        // If 8K or 16K, mirror 2 or 1 times starting at 0x4000                 // TODO solve starting position. BASIC roms!
        else if (content.length === 8192 || content.length === 16384) {
            for (var n = 0x4000, len = content.length; n < 0x8000; n += len) {
                for (i = 0; i < len; i++) {
                    bytes[n + i] = content[i];
                }
            }
        }
        // If 64K, it fits just fine
        else if (content.length === 65536) {
            for (i = 0; i < 65536; i++) {
                bytes[i] = content[i];
            }
        }
    }

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
    };

    this.write = function(address, value) {
        // ROMs cannot be modified
    };

    this.read = function(address) {
        return bytes[address];
    };

    this.dump = function(from, quant) {
        var res = "";
        var i;
        for(i = from; i <= from + quant; i++) {
            res = res + i.toString(16, 2) + " ";
        }
        res += "\n";
        for(i = from; i <= from + quant; i++) {
            var val = this.read(i);
            res = res + (val != undefined ? val.toString(16, 2) + " " : "? ");
        }
        return res;
    };


    var bytes;

    this.rom = null;
    this.format = SlotFormats.Unbanked;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(Util.uInt8ArrayToByteString(bytes))
        };
    };

    this.loadState = function(state) {
        this.rom = ROM.loadState(state.r);
        bytes = Util.byteStringToUInt8Array(atob(state.b));
    };


    if (rom) init();

};

CartridgeUnbanked.createFromSaveState = function(state) {
    var cart = new CartridgeUnbanked();
    cart.loadState(state);
    return cart;
};
