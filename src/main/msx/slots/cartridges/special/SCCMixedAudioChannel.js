// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SCCMixedAudioChannel = function() {

    function init() {
        createVolumeCurve();
    }

    this.nextSample = function() {
        // Update values
        if (amplitude1 > 0 && period1 > 0) {
            period1Count += 2;
            if (period1Count >= period1) {
                period1Count = (period1Count - period1) & 1;     // Preserve the remainder (0 or 1) for odd dividers, as the step is 2
                currentSample1 = channel1Samples[sample1Count];
                if (++sample1Count > 31) sample1Count = 0;
            }
        }
        if (amplitude2 > 0 && period2 > 0) {
            period2Count += 2;
            if (period2Count >= period2) {
                period2Count = (period2Count - period2) & 1;
                currentSample2 = channel2Samples[sample2Count];
                if (++sample2Count > 31) sample2Count = 0;
            }
        }
        if (amplitude3 > 0 && period3 > 0) {
            period3Count += 2;
            if (period3Count >= period3) {
                period3Count = (period3Count - period3) & 1;
                currentSample3 = channel3Samples[sample3Count];
                if (++sample3Count > 31) sample3Count = 0;
            }
        }
        if (amplitude4 > 0 && period4 > 0) {
            period4Count += 2;
            if (period4Count >= period4) {
                period4Count = (period4Count - period4) & 1;
                currentSample4 = channel4Samples[sample4Count];
                if (++sample4Count > 31) sample4Count = 0;
            }
        }
        if (amplitude5 > 0 && period5 > 0) {
            period5Count += 2;
            if (period5Count >= period5) {
                period5Count = (period5Count - period5) & 1;
                currentSample5 = channel5Samples[sample5Count];
                if (++sample5Count > 31) sample5Count = 0;
            }
        }

        return currentSample1 * amplitude1
            + currentSample2 * amplitude2
            - currentSample3 * amplitude3
            + currentSample4 * amplitude4
            - currentSample5 * amplitude5;
    };

    this.write = function(address, value) {

        //console.log("SCC Write: " + wmsx.Util.toHex4(address) + " val: " + wmsx.Util.toHex2(value));

        address &= 0xff;
        if (address < 0x80) {                               // Wavetable access
            setSample(address >>> 5, address & 0x1f, value);
        } else if (address < 0xa0) {
            address &= 0xe0;
            if (address < 0x8a) {                           // Frequency access
                setPeriod((address - 0x80) >>> 1, value, address & 0x01);
            } else if (address < 0x8f) {                    // Volume access
                setAmplitude(address - 0x8a, value);
            } else {                                        // Mixer access
                setMixer(value);
            }
        } else if (address < 0xe0) {                        // No function
        } else {                                            // Test register
        }
    };

    this.read = function(address) {
        //console.log("SCC Read: " + wmsx.Util.toHex4(address));
        address &= ~0xff;
        if (address < 0x80)                              // Wavetable access
            return channelSamples[address >>> 5][address & 0x1f];
        // All other registers always return 0xff
        return 0xff;
    };

    function setSample(channel, sample, val) {
        channelSamples[channel][sample] = val < 128 ? val : -256 + val;
    }

    function setPeriod(channel, period) {
        switch(channel) {
            case 1: period1 = period < 2 ? 0 : period; break;       // Dividers 0 and 1 not supported
            case 2: period2 = period < 2 ? 0 : period; break;
            case 3: period3 = period < 2 ? 0 : period; break;
            case 4: period4 = period < 2 ? 0 : period; break;
            case 5: period5 = period < 2 ? 0 : period; break;
        }
    }

    function setAmplitude(channel, ampli, b) {
        switch(channel) {
            case 1: amplitude1 = b ? ((amplitude1 & 0xff) | ((ampli & 0x0f)) << 8) : ((amplitude1 & 0xff00) | ampli); break;
            case 2: amplitude2 = b ? ((amplitude2 & 0xff) | ((ampli & 0x0f)) << 8) : ((amplitude2 & 0xff00) | ampli); break;
            case 3: amplitude3 = b ? ((amplitude3 & 0xff) | ((ampli & 0x0f)) << 8) : ((amplitude3 & 0xff00) | ampli); break;
            case 4: amplitude4 = b ? ((amplitude4 & 0xff) | ((ampli & 0x0f)) << 8) : ((amplitude4 & 0xff00) | ampli); break;
            case 5: amplitude5 = b ? ((amplitude5 & 0xff) | ((ampli & 0x0f)) << 8) : ((amplitude5 & 0xff00) | ampli); break;
        }
    }

    function setMixer(mixer) {
        channel1 = (mixer & 0x01) !== 0;
        channel2 = (mixer & 0x02) !== 0;
        channel3 = (mixer & 0x04) !== 0;
        channel4 = (mixer & 0x08) !== 0;
        channel5 = (mixer & 0x10) !== 0;
    }

    function createVolumeCurve() {
        for (var v = 0; v < 16; v++)
            volumeCurve[v] = (Math.pow(CHANNEL_AMP_CURVE_POWER, v / 15) - 1) / (CHANNEL_AMP_CURVE_POWER - 1) * CHANNEL_MAX_AMP;
    }


    var psgAudioOutput;

    var channel1 = false;
    var channel1Samples = new Array(32);
    var period1 = 0;
    var period1Count = 0;
    var sample1Count = 0;
    var currentSample1 = 0;
    var amplitude1 = 0;

    var channel2 = true;
    var channel2Samples = new Array(32);
    var period2 = 0;
    var period2Count = 0;
    var sample2Count = 0;
    var currentSample2 = 0;
    var amplitude2 = 0;

    var channel3 = false;
    var channel3Samples = new Array(32);
    var period3 = 0;
    var period3Count = 0;
    var sample3Count = 0;
    var currentSample3 = 0;
    var amplitude3 = 0;

    var channel4 = false;
    var channel4Samples = new Array(32);
    var period4 = 0;
    var period4Count = 0;
    var sample4Count = 0;
    var currentSample4 = 0;
    var amplitude4 = 0;

    var channel5 = false;
    var channel5Samples = new Array(32);
    var period5 = 0;
    var period5Count = 0;
    var sample5Count = 0;
    var currentSample5 = 0;
    var amplitude5 = 0;

    var channelSamples = [ channel1Samples, channel2Samples, channel3Samples, channel4Samples, channel5Samples];

    var volumeCurve = new Array(16);

    var CHANNEL_AMP_CURVE_POWER = 30;
    var CHANNEL_MAX_AMP = 0.3;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
        };
    };

    this.loadState = function(s) {
    };


    init();

};
