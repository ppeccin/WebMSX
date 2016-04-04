// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Works only with INTEGRAL dividers of the main frequency. Not used for now, too slow

wmsx.ClockMultiplexer = function(mainPulses) {

    this.addSlave = function(pulse, divider) {
        if (slavesPulse.indexOf(pulse) >= 0) return;
        wmsx.Util.arrayAdd(slavesPulse, pulse);
        wmsx.Util.arrayAdd(slavesDivider, divider);
        wmsx.Util.arrayAdd(slavesNextPulse, 0);
    };

    this.removeSlave = function(pulse) {
        var index = slavesPulse.indexOf(pulse);
        if (index < 0) return;
        slavesPulse.splice(index, 1);
        slavesDivider.splice(index, 1);
        slavesNextPulse.splice(index, 1);
    };

    this.reset = function() {
        for (var i = slavesPulse.length - 1; i >= 0; i = i -1)
            slavesNextPulse[i] = 0;
        nextSlavePulse = 0;
    };

    this.pulses = function(total) {
        // If total will not reach next slave pulse, send all to main and stop
        if (total < nextSlavePulse) {
            nextSlavePulse -= total;
            return mainPulses(total);
        }

        do {
            // Send just enough pulses to reach next slave pulse
            mainPulses(nextSlavePulse);
            total -= nextSlavePulse;

            // Send ONE pulse to all slaves needed (nextPulse == 0) and collect new nextPulse
            var minNewNext = 32767;        // Big integer!
            for (var i = slavesPulse.length - 1; i >= 0; i = i -1) {
                var next = slavesNextPulse[i];
                if (next === 0) {
                    slavesPulse[i]();
                    next = slavesNextPulse[i] = slavesDivider[i];
                }
                if (next < minNewNext) minNewNext = next;
            }

            // Update nextPulse tracking
            nextSlavePulse = minNewNext;
            for (i = slavesPulse.length - 1; i >= 0; i = i -1)
                slavesNextPulse[i] -= minNewNext;

        } while (total > nextSlavePulse);

        // Send remaining pulses to main
        if (total > 0) {
            mainPulses(total);
            nextSlavePulse -= total;
        }

    };


    var nextSlavePulse = 0;

    var slavesPulse = [];
    var slavesDivider = [];
    var slavesNextPulse = [];

};
