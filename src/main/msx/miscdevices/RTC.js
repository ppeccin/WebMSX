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

    this.videoClockPulse = function() {
        // Increments internal time
        time += millisPerVideoClock;
        if (date) date = undefined;
    };

    this.setFps = function(fps) {
        // Calculate increment in milliseconds for each VideoClock Pulse
        millisPerVideoClock = 1000 / fps;
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
            clockFromRegistersToTime();               // Compute offset from registers then unfreeze
            clockRunning = true;
        } else {
            clockRunning = false;                     // Freeze then transfer to registers
            clockFromTimeToRegisters(true);           // Force update
        }
    }

    function clockFromTimeToRegisters() {
        if (!date) date = new Date(Math.floor(time));

        regClock[0x0] = date.getUTCSeconds() % 10;                        //  1 second counter
        regClock[0x1] = (date.getUTCSeconds() / 10) | 0;                  // 10 second counter
        regClock[0x2] = date.getUTCMinutes() % 10;                        //  1 minute counter
        regClock[0x3] = (date.getUTCMinutes() / 10) | 0;                  // 10 minute counter
        if (regAlarm[0xa]) {    // 24h mode, &ha
            regClock[0x4] = date.getUTCHours() % 10;                      //  1 hour counter
            regClock[0x5] = (date.getUTCHours() / 10) | 0;                // 10 hour counter
        } else {                // 12h mode
            regClock[0x4] = date.getUTCHours() % 12 % 10;                 //  1 hour counter
            regClock[0x5] = ((date.getUTCHours() % 12) / 10) | 0;         // 10 hour counter
            if (date.getUTCHours() >= 12) regClock[0x5] |= 2;             //  PM flag
        }
        regClock[0x6] = date.getUTCDay() + 1;                             // day of week counter
        regClock[0x7] = date.getUTCDate() % 10;                           //  1 day counter
        regClock[0x8] = (date.getUTCDate() / 10) | 0;                     // 10 day counter
        regClock[0x9] = (date.getUTCMonth() + 1) % 10;                    //  1 month counter
        regClock[0xa] = ((date.getUTCMonth() + 1) / 10) | 0;              // 10 month counter
        regClock[0xb] = (date.getUTCFullYear() - 1980) % 10;              //  1 year counter
        regClock[0xc] = ((date.getUTCFullYear() - 1980) / 10) | 0;        // 10 year counter

        // console.log("RTC read from time to Registers:", date.toUTCString(), ",24H:", !!(regAlarm[0xa] & 1));
    }

    function clockFromRegistersToTime() {
        if (!date) date = new Date();

        date.setUTCSeconds(regClock[0x0] + regClock[0x1] * 10);
        date.setUTCMinutes(regClock[0x2] + regClock[0x3] * 10);
        if (regAlarm[0xa] & 1)
            date.setUTCHours(regClock[0x4] + regClock[0x5] * 10);                                                // 24h mode
        else
            date.setUTCHours(regClock[0x4] + ((regClock[0x5] & 2) ? 12 : 0) + ((regClock[0x5] & 1) ? 10 : 0));   // 12h mode
        // no day of week needed
        date.setUTCDate(regClock[0x7] + regClock[0x8] * 10);
        date.setUTCMonth(regClock[0x9] + regClock[0xa] * 10 - 1);
        date.setUTCFullYear(regClock[0xb] + regClock[0xc] * 10 + 1980);

        time = date.getTime();

        // console.log("RTC write from Registers to time: " + new Date(time).toUTCString());
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
    var time = Date.now() - (new Date().getTimezoneOffset()) * 60 * 1000;
    var date = undefined;       // Cached Date for stopped clock
    var clockRunning = true;

    var millisPerVideoClock = 1000 / 60;

    var regClock = wmsx.Util.arrayFill(new Array(13), 0);
    var regAlarm = wmsx.Util.arrayFill(new Array(13), 0);
    var ram = [ new Array(13), new Array(13) ];

    var regAddress = 0;
    var clockOffset = 0;

    var CLOCK_REG_MASK = [ 0xf, 0x7, 0xf, 0x7, 0xf, 0x3, 0x7, 0xf, 0x3, 0xf, 0x1, 0xf, 0xf ];
    var ALARM_REG_MASK = [ 0x0, 0x0, 0xf, 0x7, 0xf, 0x3, 0x7, 0xf, 0x3, 0x0, 0x1, 0x3, 0x0 ];


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m2: isMSX2,
            m: mode,
            i: time,
            c: clockRunning,
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
        time = s.i ? s.i : s.co + s.t;      // Backward compatibility
        date = undefined;                   // Clear cached date
        regClock = wmsx.Util.restoreStringBase64ToInt8BitArray(s.rc, regClock);
        regAlarm = wmsx.Util.restoreStringBase64ToInt8BitArray(s.rm, regAlarm);
        ram[0] = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r0, ram[0]);
        ram[1] = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r1, ram[1]);
        regAddress = s.ra;
    };

};
