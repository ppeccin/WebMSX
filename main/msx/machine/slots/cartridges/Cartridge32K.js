// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Cartridge32K = function(rom) {
    var self = this;

    function init() {
        self.rom = rom;
        bytes = Util.arrayFill(new Array(65536), 0xff);
        var content = self.rom.content;
        if (content.length === 32768) {
            for(var i = 0, len = content.length; i < len; i++)
                bytes[16384 + i] = content[i];
        } else {
            for(i = 0, len = content.length; i < len; i++) {
                //bytes[i] = content[i];
                bytes[0x4000 + i] = content[i];
                //bytes[0x8000 + i] = content[i];
                //bytes[0xc000 + i] = content[i];
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
    this.format = SlotFormats.Cartridge32K;


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

Cartridge32K.createFromSaveState = function(state) {
    var cart = new Cartridge32K();
    cart.loadState(state);
    return cart;
};
