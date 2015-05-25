// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Cartridge32K = function(rom) {
    var self = this;

    function init() {
        self.rom = rom;
        var content = self.rom.content;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[16384 + i] = content[i];
    }

    this.write = function(address, value) {
        //console.log ("Write over Cartridge ROM at " + address.toString(16) + " := " + value.toString(16));
        // ROMs cannot be modified
    };

    this.read = function(address) {
        //console.log ("Cartridge ROM read: " + address.toString(16) + ", " + bytes[address].toString(16));
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


    var bytes = Util.arrayFill(new Array(65536), 0xff);

    this.rom = null;
    this.bytes = bytes;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            r: rom.saveState(),
            b: btoa(Util.uInt8ArrayToByteString(bytes))
        };
    };

    this.loadState = function(state) {
        this.rom = ROM.loadState(state.r);
        bytes = Util.byteStringToUInt8Array(atob(state.b));
    };


    init();

};

// Assumes any 32K or 16K content starting with the Cartridge identifier "AB" is a Cartridge32K
Cartridge32K.createFromROM = function(rom) {
    if ((rom.content.length === 32768 || rom.content.length === 16384) && rom.content[0] === 65 && rom.content[1] === 66)
        return new Cartridge32K(rom);
};

