// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

SlotEmpty = function() {

    this.read = function (address) {
        //console.log ("Empty Read " + address.toString(16));
        return 0xff;
    };

    this.write = function (address, val) {
        //console.log ("Empty Write " + address.toString(16) + ", " + val.toString(16));
    }

};
