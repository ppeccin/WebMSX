// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Based on Host clock
// Alarm and 16Hz/1Hz outputs not observable by MSX so not supported

wmsx.RTC = function(disabled) {             // Can be disabled for MSX1

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
        regAddress = val & 0xf;
    };

    this.outputB5 = function(val) {
        val &= 0xf;
        if (regAddress < 0xd) {
            switch (mode) {
                case 0:
                    regClock[regAddress] = val; break;            // clock
                case 1:
                    regAlarm[regAddress] = val; break;            // alarm, 12/24, leap year
                case 2: case 3:
                    ram[mode & 1][regAddress] = val;              // ram
            }
        } else {
            regClock[regAddress] = val;
            switch (regAddress) {
                case 0xd:
                    mode = val & 0x3;                             // mode

                    console.log("RTC Mode: " + (val >> 2).toString(16) + " : " + mode);

                    setClockEnabled((val & 0x8) !== 0);
                    break;
                case 0xe:

                    console.log("RTC Test: " + val.toString(16));

                    break;                                        // test
                case 0xf:

                    console.log("RTC Reset: " + val.toString(16));

                    break;                                        // reset
            }
        }

        //console.log("RTC Register: " + regAddress.toString(16) + " Write: " + val.toString(16));
    };

    this.inputB5 = function() {
        var res;
        if (regAddress < 0xd) {
            switch (mode) {
                case 0:
                    if (clockEnabled) clockFromLiveToRegisters(false);
                    res = regClock[regAddress];                   // clock
                    break;
                case 1:
                    res = regAlarm[regAddress];                   // alarm, 12/24, leap year
                    break;
                case 2:
                    res = ram[mode & 1][regAddress];              // ram
            }
        } else {
            switch (regAddress) {
                case 0xd:
                    res = (clockEnabled ? 0x8 : 0x0) | mode;      // mode
                    break;
                case 0xe:
                case 0xf:
                    res = 0xf;                                    // test, reset, write only
            }
        }

        //console.log("RTC Register: " + regAddress.toString(16) + " Read: " + res.toString(16));

        return res;
    };

    function setClockEnabled(enabled) {
        if (clockEnabled === enabled) return;

        if (enabled) {
            clockFromRegistersToOffset();             // Compute offset from registers then unfreeze
            clockEnabled = true;
        } else {
            clockEnabled = false;                   // Freeze then transfer to registers
            clockFromLiveToRegisters(true);         // Force update
        }
    }

    function clockFromLiveToRegisters(force) {
        var now = Date.now();
        if ((now - clockLastUpdate) < 1000 && !force) return;   // Update only once per second in case of reads from clock registers with the clock running

        clockLastUpdate = now;
        clockLastValue = now + clockOffset;
        var date = new Date(clockLastValue);

        regClock[0x0] = date.getSeconds() % 10;                  //  1 second counter
        regClock[0x1] = (date.getSeconds() / 10) | 0;            // 10 second counter
        regClock[0x2] = date.getMinutes() % 10;                  //  1 minute counter
        regClock[0x3] = (date.getMinutes() / 10) | 0;            // 10 minute counter
        regClock[0x4] = date.getHours() % 10;                    //  1 hour counter
        regClock[0x5] = (date.getHours() / 10) | 0;              // 10 hour counter
        regClock[0x6] = date.getDay() + 1;                       // day of week counter
        regClock[0x7] = date.getDate() % 10;                     //  1 day counter
        regClock[0x8] = (date.getDate() / 10) | 0;               // 10 day counter
        regClock[0x9] = (date.getMonth() + 1) % 10;              //  1 month counter
        regClock[0xa] = ((date.getMonth() + 1) / 10) | 0;        // 10 month counter
        regClock[0xb] = (date.getFullYear() - 1980) % 10;        //  1 year counter
        regClock[0xc] = ((date.getFullYear() - 1980) / 10) | 0;  // 10 year counter

        console.log("RTC read from Host CLock with offset: " + clockOffset);
    }

    function clockFromRegistersToOffset() {
        var second = regClock[0x0] + regClock[0x1] * 10;
        var minute = regClock[0x2] + regClock[0x3] * 10;
        var hour   = regClock[0x4] + regClock[0x5] * 10;
        // no day of week needed
        var day    = regClock[0x7] + regClock[0x8] * 10;
        var month  = regClock[0x9] + regClock[0xa] * 10 - 1;
        var year   = regClock[0xb] + regClock[0xc] * 10 + 1980;

        var nowFromRegs = new Date(year, month, day, hour, minute, second).getTime();

        var nowFromRegsSecond = (nowFromRegs / 1000) | 0;
        var lastUpdateSecond =  (clockLastValue / 1000) | 0;

        // Do not change offset if setting to the same second
        if (nowFromRegsSecond === lastUpdateSecond) return;

        var now = Date.now();
        clockLastUpdate = now;
        clockLastValue = nowFromRegs;

        clockOffset = clockLastValue - now;

        console.log("RTC computed offset from Host Clock: " + clockOffset);
    }


    var mode = 0;
    var clockEnabled = true;

    var regClock = wmsx.Util.arrayFill(new Array(16), 0);
    var regAlarm = wmsx.Util.arrayFill(new Array(16), 0);
    var ram = [ wmsx.Util.arrayFill(new Array(16), 0), wmsx.Util.arrayFill(new Array(16), 0) ];

    var regAddress = 0;
    var clockOffset = 0;
    var clockLastUpdate, clockLastValue = -1;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m: mode,
            c: clockEnabled,
            co: clockOffset, clu: clockLastUpdate, clv: clockLastValue,
            rc: wmsx.Util.storeInt8BitArrayToStringBase64(regClock),
            rm: wmsx.Util.storeInt8BitArrayToStringBase64(regAlarm),
            r0: wmsx.Util.storeInt8BitArrayToStringBase64(ram[0]),
            r1: wmsx.Util.storeInt8BitArrayToStringBase64(ram[1]),
            ra: regAddress
        };
    };

    this.loadState = function(s) {
        mode = s.m;
        clockEnabled = s.c;
        clockOffset = s.co; clockLastUpdate = s.clu; clockLastValue = s.clv;
        regClock = wmsx.Util.restoreStringBase64ToInt8BitArray(s.rc, regClock);
        regAlarm = wmsx.Util.restoreStringBase64ToInt8BitArray(s.rm, regAlarm);
        ram[0] = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r0, ram[0]);
        ram[1] = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r1, ram[1]);
        regAddress = s.ra;
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};