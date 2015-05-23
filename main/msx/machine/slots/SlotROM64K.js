// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

SlotROM64K = function(rom) {

    function init() {
        if (rom) {
            for(var i = 0, len = rom.length; i < len; i++)
                bytes[i] = rom [i];
        }
    }

    this.write = function(address, value) {
        // ROMs cannot be modified
        console.log ("ROM write: " + address.toString(16) + ", " + value.toString(16));
    };

    this.read = function(address) {
        //console.log ("ROM read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return bytes[address];
    };

    this.dump = function(from, to) {
        var res = "";
        var i;
        for(i = from; i <= to; i++) {
            res = res + i.toString(16, 2) + " ";
        }
        res += "\n";
        for(i = from; i <= to; i++) {
            var val = this.read(i);
            res = res + (val != undefined ? val.toString(16, 2) + " " : "? ");
        }
        return res;
    };


    var bytes = Util.arrayFill(new Array(65536), 0xff);
    this.bytes = bytes;


    init();

};