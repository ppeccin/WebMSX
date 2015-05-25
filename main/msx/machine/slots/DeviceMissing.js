// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

DeviceMissing = function() {

    this.inputPort = function(port) {
        Util.log ("Empty IN " + port.toString(16));
        return 0xff
    };

    this.outputPort = function(port, val) {
        //console.log ("Empty OUT " + port.toString(16) + ", " + val.toString(16));
    }

};

