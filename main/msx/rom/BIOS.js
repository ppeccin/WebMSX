// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

BIOS = function(rom) {
    var self = this;

    function init() {
        self.rom = rom;
        var content = self.rom.content;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.write = function(address, value) {
        //console.log ("Write over BIOS ROM at " + address.toString(16) + " := " + value.toString(16));
        // ROMs cannot be modified
    };

    this.read = function(address) {
        //console.log ("BIOS ROM read: " + address.toString(16) + ", " + bytes[address].toString(16));
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

// Assumes any 32K content not starting with the Cartridge identifier "AB" is a BIOS
BIOS.createFromROM = function(rom) {
    if (rom.content.length === 32768 && rom.content[0] !== 65 && rom.content[1] !== 66)
        return new BIOS(rom);
};



