// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Real Time Clock chip. MSX2, MSX2+ and TurboR
// Based on Host clock. Alarm and 16Hz/1Hz outputs not observable by MSX so not implemented

wmsx.RTC = function() {
"use strict";

    this.setMachineType = function(type) {
        isMSX2 = type >= 2;
        wmsx.Util.arrayFill(ram[0], 0); wmsx.Util.arrayFill(ram[1], 0);     // clear RAM
    };

    this.connectBus = function(bus) {
        bus.connectInputDevice( 0xb4, wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(0xb4, this.outputB4);
        bus.connectInputDevice( 0xb5, this.inputB5);
        bus.connectOutputDevice(0xb5, this.outputB5);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.reset = function() {
        mode = 0;
        setClockRunning(true);
    };

    this.outputB4 = function(val) {
        if (isMSX2) regAddress = val & 0xf;
    };

    this.outputB5 = function(val) {
        if (!isMSX2) return;

        val &= 0xf;
        if (regAddress < 0xd) {
            switch (mode) {
                case 0:
                    regClock[regAddress] = val & CLOCK_REG_MASK[regAddress];
                    break;
                case 1:
                    if (regAddress === 0xa) set24HMode(val);      // switch 12/24 mode if needed
                    regAlarm[regAddress] = val & ALARM_REG_MASK[regAddress];
                    break;
                case 2: case 3:
                    ram[mode & 1][regAddress] = val;
            }
        } else {
            switch (regAddress) {
                case 0xd:
                    mode = val & 0x3;
                    setClockRunning((val & 0x8) !== 0);
                    break;
                case 0xe:
                    break;                                        // test
                case 0xf:
                    break;                                        // reset
            }
        }

        //console.log("RTC Register: " + regAddress.toString(16) + " Write: " + val.toString(16));
    };

    this.inputB5 = function() {
        if (!isMSX2) return 0xff;

        var res;
        if (regAddress < 0xd) {
            switch (mode) {
                case 0:
                    if (clockRunning) clockFromLiveToRegisters(false);
                    res = regClock[regAddress];
                    break;
                case 1:
                    res = regAlarm[regAddress];
                    break;
                case 2: case 3:
                    res = ram[mode & 1][regAddress];
            }
        } else {
            switch (regAddress) {
                case 0xd:
                    res = (clockRunning ? 0x8 : 0x0) | mode;
                    break;
                case 0xe:
                case 0xf:
                    res = 0xf;                                    // test, reset, write only
            }
        }

        //console.log("RTC Register: " + regAddress.toString(16) + " Read: " + res.toString(16));

        return res;
    };

    function setClockRunning(enabled) {
        //console.log("RTC set running: " + enabled);

        if (clockRunning === enabled) return;

        if (enabled) {
            clockFromRegistersToOffset();             // Compute offset from registers then unfreeze
            clockRunning = true;
        } else {
            clockRunning = false;                     // Freeze then transfer to registers
            clockFromLiveToRegisters(true);           // Force update
        }
    }

    function clockFromLiveToRegisters(force) {
        var now = Date.now();
        if ((now - clockLastUpdate) < 1000 && !force) return;   // Update only once per second in case of reads from clock registers while the clock is running

        clockLastUpdate = now;
        clockLastValue = now + clockOffset;
        var date = new Date(clockLastValue);

        regClock[0x0] = date.getSeconds() % 10;                        //  1 second counter
        regClock[0x1] = (date.getSeconds() / 10) | 0;                  // 10 second counter
        regClock[0x2] = date.getMinutes() % 10;                        //  1 minute counter
        regClock[0x3] = (date.getMinutes() / 10) | 0;                  // 10 minute counter
        if (regAlarm[0xa]) {    // 24h mode, &ha
            regClock[0x4] = date.getHours() % 10;                      //  1 hour counter
            regClock[0x5] = (date.getHours() / 10) | 0;                // 10 hour counter
        } else {                // 12h mode
            regClock[0x4] = date.getHours() % 12 % 10;                 //  1 hour counter
            regClock[0x5] = ((date.getHours() % 12) / 10) | 0;         // 10 hour counter
            if (date.getHours() >= 12) regClock[0x5] |= 2;             //  PM flag
        }
        regClock[0x6] = date.getDay() + 1;                             // day of week counter
        regClock[0x7] = date.getDate() % 10;                           //  1 day counter
        regClock[0x8] = (date.getDate() / 10) | 0;                     // 10 day counter
        regClock[0x9] = (date.getMonth() + 1) % 10;                    //  1 month counter
        regClock[0xa] = ((date.getMonth() + 1) / 10) | 0;              // 10 month counter
        regClock[0xb] = (date.getFullYear() - 1980) % 10;              //  1 year counter
        regClock[0xc] = ((date.getFullYear() - 1980) / 10) | 0;        // 10 year counter

        //console.log("Read:", date,"24H:",!!(regAlarm[0xa] & 1));

        //console.log("RTC read from Host Clock with offset: " + clockOffset);
    }

    function clockFromRegistersToOffset() {
        var second = regClock[0x0] + regClock[0x1] * 10;
        var minute = regClock[0x2] + regClock[0x3] * 10;
        var hour;
        if (regAlarm[0xa] & 1)
            hour   = regClock[0x4] + regClock[0x5] * 10;                                                // 24h mode
        else
            hour   = regClock[0x4] + ((regClock[0x5] & 2) ? 12 : 0) + ((regClock[0x5] & 1) ? 10 : 0);   // 12h mode
        // no day of week needed
        var day    = regClock[0x7] + regClock[0x8] * 10;
        var month  = regClock[0x9] + regClock[0xa] * 10 - 1;
        var year   = regClock[0xb] + regClock[0xc] * 10 + 1980;

        var nowFromRegs = new Date(year, month, day, hour, minute, second).getTime();

        var nowFromRegsSecond = (nowFromRegs / 1000) | 0;
        var lastValueSecond =  (clockLastValue / 1000) | 0;

        // Do not change offset if setting to the same second to avoid delays
        if (nowFromRegsSecond === lastValueSecond) return;

        var now = Date.now();
        clockLastUpdate = now;
        clockLastValue = nowFromRegs;

        clockOffset = clockLastValue - now;

        //console.log("RTC computed offset from Host Clock: " + clockOffset);
    }

    function set24HMode(val) {
        val &= 1;
        if ((regAlarm[0xa] & 1) === val) return;

        var h;
        if (val) {
            // Switch to 24H mode
            h = regClock[4] + ((regClock[5] & 2) ? 12 : 0) + ((regClock[5] & 1) ? 10 : 0);
            regClock[5] = (h / 10) | 0;
            regClock[4] = h % 10;
       } else {
            // Switch to 12H mode
            h = regClock[4] + regClock[5] * 10;
            regClock[5] = (h >= 12 ? 2 : 0) | (h % 12 >= 10 ? 1 : 0);
            regClock[4] = h % 12 % 10;
        }
    }


    var isMSX2;

    var mode = 0;
    var time = 0;
    var clockRunning = true;

    var regClock = wmsx.Util.arrayFill(new Array(13), 0);
    var regAlarm = wmsx.Util.arrayFill(new Array(13), 0);
    var ram = [ new Array(13), new Array(13) ];

    var regAddress = 0;
    var clockOffset = 0;
    var clockLastUpdate, clockLastValue = -1;

    var CLOCK_REG_MASK = [ 0xf, 0x7, 0xf, 0x7, 0xf, 0x3, 0x7, 0xf, 0x3, 0xf, 0x1, 0xf, 0xf ];
    var ALARM_REG_MASK = [ 0x0, 0x0, 0xf, 0x7, 0xf, 0x3, 0x7, 0xf, 0x3, 0x0, 0x1, 0x3, 0x0 ];


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m2: isMSX2,
            m: mode,
            t: Date.now(),
            c: clockRunning,
            co: clockOffset, clu: clockLastUpdate, clv: clockLastValue,
            rc: wmsx.Util.storeInt8BitArrayToStringBase64(regClock),
            rm: wmsx.Util.storeInt8BitArrayToStringBase64(regAlarm),
            r0: wmsx.Util.storeInt8BitArrayToStringBase64(ram[0]),
            r1: wmsx.Util.storeInt8BitArrayToStringBase64(ram[1]),
            ra: regAddress
        };
    };

    this.loadState = function(s) {
        isMSX2 = s.m2;
        mode = s.m;
        clockRunning = s.c;
        clockOffset = s.co + (s.t - Date.now());           // Adjust offset to load time
        clockLastUpdate = s.clu; clockLastValue = s.clv;
        regClock = wmsx.Util.restoreStringBase64ToInt8BitArray(s.rc, regClock);
        regAlarm = wmsx.Util.restoreStringBase64ToInt8BitArray(s.rm, regAlarm);
        ram[0] = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r0, ram[0]);
        ram[1] = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r1, ram[1]);
        regAddress = s.ra;
    };

};
