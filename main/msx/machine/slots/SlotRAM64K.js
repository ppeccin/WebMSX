// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

SlotRAM64K = function() {

    this.write = function(address, value) {
        //console.log ("RAM write: " + address.toString(16) + ", " + value.toString(16));
        bytes[address] = value;
    };

    this.read = function(address) {
        //console.log ("RAM read: " + address.toString(16) + ", " + bytes[address].toString(16));
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
    this.bytes = bytes;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            b: btoa(Util.uInt8ArrayToByteString(bytes))
        };
    };

    this.loadState = function(state) {
        bytes = Util.byteStringToUInt8Array(atob(state.b));
    };

};