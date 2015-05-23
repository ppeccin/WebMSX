// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

TestRam64K = function(rom, init) {

    var data = Util.arrayFill(new Array(65536), 256);     // pSTOP instruction
    this.bytes = data;

    if (!rom) {
        //Util.arrayFillFunc(data, function() {
        //    return (Math.random() * 256) | 0;
        //});
    } else {
        for(var i = 0, len = rom.length; i < len; i++) {
            data[init + i] = rom [i];
        }
    }


    this.write = function(address, value) {
        data[address] = value;
    };

    this.read = function(address) {
        return data[address];
    };

    this.output = function(port, value) {
        Util.log("OUT " + (port & 255).toString(16) + ", " + value.toString(16));
    };

    this.input = function(port) {
        Util.log("IN " + (port & 255).toString(16));
        return 0;
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
    }

};