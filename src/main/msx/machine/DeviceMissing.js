// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DeviceMissing = function() {

    this.inputPort = function() {
        //wmsx.Util.log ("Empty IN, PC:" + wmsx.Util.toHex4(WMSX.room.machine.cpu.eval("PC")));
        return 0xff;
    };

    this.outputPort = function(val) {
        //wmsx.Util.log ("Empty OUT val: " + val.toString(16) + " PC:" + wmsx.Util.toHex4(WMSX.room.machine.cpu.eval("PC")));
    }

};

