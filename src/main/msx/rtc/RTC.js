// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.RTC = function() {

    function init() {
    }

    this.connectBus = function(bus) {
        bus.connectOutputDevice(0xb4, this.outputB4);
        bus.connectOutputDevice(0xb5, this.outputB5);
        bus.connectInputDevice(0xb5,  this.inputB5);
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.outputB4 = function(val) {
        registerAddress = val & 0xf;
    };

    this.outputB5 = function(val) {
        //console.log("RTC Register: " + registerAddress.toString(16) + " Write: " + val.toString(16));

        val &= 0xf;

        if (registerAddress >= 0xd) {
            registers[registerAddress] = val;
            switch (registerAddress) {
                case 0xd: mode = val & 0x3; break;
                case 0xe:
                case 0xf: break;
            }
        } else {
            if (mode >= 2) {
                ram[mode & 1][registerAddress] = val;
            } else {
                registers[registerAddress] = val;
            }
        }
    };

    this.inputB5 = function() {
        var res = 0;

        if (mode >= 2) {
            res = ram[mode & 1][registerAddress];
        } else {
            res = registers[registerAddress];
        }

        //console.log("RTC Register: " + registerAddress.toString(16) + " Read: " + res.toString(16));

        return res;
    };


    var registerAddress = 0;
    var registers = wmsx.Util.arrayFill(new Array(16), 0);

    var mode = 0;
    var ram = [ wmsx.Util.arrayFill(new Array(16), 0), wmsx.Util.arrayFill(new Array(16), 0) ];


    // Savestate  -------------------------------------------           // TODO Make it work

    this.saveState = function() {
        return {
            ra: registerAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(registers)
        };
    };

    this.loadState = function(s) {
        registerAddress = s.ra;
        registers = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r, registers);
        mode = registers[0xd] & 0x3;
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};