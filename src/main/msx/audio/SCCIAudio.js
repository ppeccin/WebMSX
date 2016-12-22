// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the SCC and SCC-I Audio chip. Mode can be switched between SCC and SCC-I

wmsx.SCCIAudio = function() {
"use strict";

    function init(self) {
        createVolumeCurve();
        self.setSCCIMode(false);        // Default in SCC mode for compatibility
    }

    this.setAudioSocket = function(pAudioSocket) {
        audioSocket = pAudioSocket;
    };

    this.connectAudio = function() {
        if (!audioSignal) audioSignal = new wmsx.AudioSignal("SCC", this, SAMPLE_RATE, VOLUME);
        if (audioSocket) audioSocket.connectAudioSignal(audioSignal);
    };

    this.disconnectAudio = function() {
        if (audioSignal && audioSocket) audioSocket.disconnectAudioSignal(audioSignal);
    };

    this.reset = function() {
        this.disconnectAudio();
        setMixer(0);
        amplitude1 = amplitude2 = amplitude3 = amplitude4 = amplitude5 = 0;
        period1 = period2 = period3 = period4 = period5 = 0;
        period1Count = period2Count = period3Count = period4Count = period5Count = 0;
        sample1Count = sample2Count = sample3Count = sample4Count = sample5Count = 0;
        currentSample1 = currentSample2 = currentSample3 = currentSample4 = currentSample5 = 0;
        for (var i = 0; i < 5; i++) wmsx.Util.arrayFill(channelSamples[i], 0);
        this.setSCCIMode(false);
    };

    this.setSCCIMode = function(mode) {
        //console.log("SCCI Audio mode: " + mode);

        if (scciMode === mode) return;
        scciMode = !!mode;
        if (scciMode) {
            this.read = readSCCI;
            this.write = writeSCCI;
        } else {
            this.read = readSCC;
            this.write = writeSCC;
        }
    };

    this.nextSample = function() {
        var sample = 0;

        // Update values only if needed
        if (period1 > 0) {
            if (channel1) sample += currentSample1 * amplitude1;
            period1Count += 32;
            while (period1Count >= period1) {
                period1Count -= period1;
                if (++sample1Count > 31) sample1Count = 0;
                currentSample1 = channel1Samples[sample1Count];
            }
        }
        if (period2 > 0) {
            if (channel2) sample += currentSample2 * amplitude2;
            period2Count += 32;
            while (period2Count >= period2) {
                period2Count -= period2;
                if (++sample2Count > 31) sample2Count = 0;
                currentSample2 = channel2Samples[sample2Count];
            }
        }
        if (period3 > 0) {
            if (channel3) sample += currentSample3 * amplitude3;
            period3Count += 32;
            while (period3Count >= period3) {
                period3Count -= period3;
                if (++sample3Count > 31) sample3Count = 0;
                currentSample3 = channel3Samples[sample3Count];
            }
        }
        if (period4 > 0) {
            if (channel4) sample += currentSample4 * amplitude4;
            period4Count += 32;
            while (period4Count >= period4) {
                period4Count -= period4;
                if (++sample4Count > 31) sample4Count = 0;
                currentSample4 = channel4Samples[sample4Count];
            }
        }
        if (period5 > 0) {
            if (channel5) sample += currentSample5 * amplitude5;
            period5Count += 32;
            while (period5Count >= period5) {
                period5Count -= period5;
                if (++sample5Count > 31) sample5Count = 0;
                currentSample5 = channel5Samples[sample5Count];
            }
        }

        return sample;
    };

    function writeSCC(address, value) {
        //wmsx.Util.log("SCC Write: " + wmsx.Util.toHex4(address) + ", value: " + wmsx.Util.toHex2(value));
        address &= 0xff;
        if (address < 0x80) {                               // Wavetable access
            channelSamples[(address >>> 5)][address & 0x1f] = value < 128 ? value : -256 + value;               // Signed 8 bits
            // If writing to channel 4, also put the same sample to channel 5
            if ((address >>> 5) === 3) channel5Samples[address & 0x1f] = value < 128 ? value : -256 + value;    // Signed 8 bits
            return;
        }
        if (address < 0xa0) {
            address &= 0xef;
            if (address < 0x8a) {                           // Frequency access
                setPeriod((address - 0x80) >>> 1, value, address & 0x01);
                return;
            }
            if (address < 0x8f) {                           // Volume access
                setAmplitude(address - 0x8a, value & 0x0f);
                return;
            }
            setMixer(value);                                // Mixer access
        }
    }                                                       // Test register not implemented

    function readSCC(address) {
        address &= 0xff;
        if (address < 0x80)                                 // Wavetable access
            return channelSamples[address >>> 5][address & 0x1f] & 0xff;     // Unsigned 8 bits
        // All other registers always return 0xff
        else
            return 0xff;

        //wmsx.Util.log("SCC Read: " + wmsx.Util.toHex4(address) + ", value: " + wmsx.Util.toHex2(res));
    }

    function writeSCCI(address, value) {
        //wmsx.Util.log("SCCI Write: " + wmsx.Util.toHex4(address) + ", value: " + wmsx.Util.toHex2(value));
        address &= 0xff;
        if (address < 0xa0) {                               // Wavetable access
            channelSamples[address >>> 5][address & 0x1f] = value < 128 ? value : -256 + value;     // Signed 8 bits
            return;
        }
        if (address < 0xc0) {
            address &= 0xef;
            if (address < 0xaa) {                           // Frequency access
                setPeriod((address - 0xa0) >>> 1, value, address & 0x01);
                return;
            }
            if (address < 0xaf) {                           // Volume access
                setAmplitude(address - 0xaa, value & 0x0f);
                return;
            }
            setMixer(value);                                // Mixer access
        }
    }                                                       // Test register not implemented

    function readSCCI(address) {
        address &= 0xff;
        if (address < 0xa0)                                // Wavetable access
            return channelSamples[address >>> 5][address & 0x1f] & 0xff;     // Unsigned 8 bits
        // All other registers always return 0xff
        return 0xff;
    }

    function setAmplitude(channel, amplitude) {
        switch(channel) {
            case 0: amplitude1 = volumeCurve[amplitude]; break;
            case 1: amplitude2 = volumeCurve[amplitude]; break;
            case 2: amplitude3 = volumeCurve[amplitude]; break;
            case 3: amplitude4 = volumeCurve[amplitude]; break;
            case 4: amplitude5 = volumeCurve[amplitude]; break;
        }
    }

    function setPeriod(channel, period, b) {
        switch(channel) {
            // Dividers 0 to 8 and produce silence
            case 0:
                period1 = b ? ((period1 & 0xff) | ((period & 0x0f)) << 8) : ((period1 & 0xff00) | period);
                //if (period1 <= 8) { period1 = 0; currentSample1 = 0; }
                break;
            case 1:
                period2 = b ? ((period2 & 0xff) | ((period & 0x0f)) << 8) : ((period2 & 0xff00) | period);
                //if (period2 <= 8) { period2 = 0; currentSample2 = 0; }
                break;
            case 2:
                period3 = b ? ((period3 & 0xff) | ((period & 0x0f)) << 8) : ((period3 & 0xff00) | period);
                //if (period3 <= 8) { period3 = 0; currentSample3 = 0; }
                break;
            case 3:
                period4 = b ? ((period4 & 0xff) | ((period & 0x0f)) << 8) : ((period4 & 0xff00) | period);
                //if (period4 <= 8) { period4 = 0; currentSample4 = 0; }
                break;
            case 4:
                period5 = b ? ((period5 & 0xff) | ((period & 0x0f)) << 8) : ((period5 & 0xff00) | period);
                //if (period5 <= 8) { period5 = 0; currentSample5 = 0; }
                break;
        }
    }

    function setMixer(mixer) {
        channel1 = (mixer & 0x01) ? 1 : 0;
        channel2 = (mixer & 0x02) ? 1 : 0;
        channel3 = (mixer & 0x04) ? 1 : 0;
        channel4 = (mixer & 0x08) ? 1 : 0;
        channel5 = (mixer & 0x10) ? 1 : 0;
    }

    function createVolumeCurve() {
        for (var v = 0; v < 16; v++)
            volumeCurve[v] = (Math.pow(CHANNEL_VOLUME_CURVE_POWER, v / 15) - 1) / (CHANNEL_VOLUME_CURVE_POWER - 1) * CHANNEL_MAX_VOLUME;
    }


    var scciMode;

    var channel1 = 0;
    var channel1Samples = wmsx.Util.arrayFill(new Array(32), 0);
    var period1 = 0;
    var period1Count = 0;
    var sample1Count = 0;
    var currentSample1 = 0;
    var amplitude1 = 0;

    var channel2 = 0;
    var channel2Samples = wmsx.Util.arrayFill(new Array(32), 0);
    var period2 = 0;
    var period2Count = 0;
    var sample2Count = 0;
    var currentSample2 = 0;
    var amplitude2 = 0;

    var channel3 = 0;
    var channel3Samples = wmsx.Util.arrayFill(new Array(32), 0);
    var period3 = 0;
    var period3Count = 0;
    var sample3Count = 0;
    var currentSample3 = 0;
    var amplitude3 = 0;

    var channel4 = 0;
    var channel4Samples = wmsx.Util.arrayFill(new Array(32), 0);
    var period4 = 0;
    var period4Count = 0;
    var sample4Count = 0;
    var currentSample4 = 0;
    var amplitude4 = 0;

    var channel5 = false;
    var channel5Samples = wmsx.Util.arrayFill(new Array(32), 0);
    var period5 = 0;
    var period5Count = 0;
    var sample5Count = 0;
    var currentSample5 = 0;
    var amplitude5 = 0;

    var channelSamples = [ channel1Samples, channel2Samples, channel3Samples, channel4Samples, channel5Samples ];

    var volumeCurve = new Array(16);

    var audioSignal;
    var audioSocket;

    var CHANNEL_MAX_VOLUME = 0.23 / 128;        // Sample values in the range -128..+127
    var CHANNEL_VOLUME_CURVE_POWER = 3;         // Sounds more linear than the normal PSG channels

    var VOLUME = 0.65;
    var SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 32;       // main cpu clock / 32 = 112005hz


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            m: scciMode,
            c1: channel1, p1: period1, pc1: period1Count, sc1: sample1Count, cs1: currentSample1, a1: amplitude1,
            c2: channel2, p2: period2, pc2: period2Count, sc2: sample2Count, cs2: currentSample2, a2: amplitude2,
            c3: channel3, p3: period3, pc3: period3Count, sc3: sample3Count, cs3: currentSample3, a3: amplitude3,
            c4: channel4, p4: period4, pc4: period4Count, sc4: sample4Count, cs4: currentSample4, a4: amplitude4,
            c5: channel5, p5: period5, pc5: period5Count, sc5: sample5Count, cs5: currentSample5, a5: amplitude5,
            s1: wmsx.Util.storeInt8BitArrayToStringBase64(channel1Samples),
            s2: wmsx.Util.storeInt8BitArrayToStringBase64(channel2Samples),
            s3: wmsx.Util.storeInt8BitArrayToStringBase64(channel3Samples),
            s4: wmsx.Util.storeInt8BitArrayToStringBase64(channel4Samples),
            s5: wmsx.Util.storeInt8BitArrayToStringBase64(channel5Samples)
        };
    };

    this.loadState = function(s) {
        this.reset();

        channel1 = s.c1; period1 = s.p1; period1Count = s.pc1; sample1Count = s.sc1; currentSample1 = s.cs1; amplitude1 = s.a1;
        channel2 = s.c2; period2 = s.p2; period2Count = s.pc2; sample2Count = s.sc2; currentSample2 = s.cs2; amplitude2 = s.a2;
        channel3 = s.c3; period3 = s.p3; period3Count = s.pc3; sample3Count = s.sc3; currentSample3 = s.cs3; amplitude3 = s.a3;
        channel4 = s.c4; period4 = s.p4; period4Count = s.pc4; sample4Count = s.sc4; currentSample4 = s.cs4; amplitude4 = s.a4;
        channel5 = s.c5; period5 = s.p5; period5Count = s.pc5; sample5Count = s.sc5; currentSample5 = s.cs5; amplitude5 = s.a5;
        channel1Samples = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.s1, channel1Samples);
        channel2Samples = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.s2, channel2Samples);
        channel3Samples = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.s3, channel3Samples);
        channel4Samples = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.s4, channel4Samples);
        channel5Samples = wmsx.Util.restoreStringBase64ToSignedInt8BitArray(s.s5 || s.s4, channel5Samples);
        if (channelSamples[0] !== channel1Samples) channelSamples[0] = channel1Samples;
        if (channelSamples[1] !== channel2Samples) channelSamples[1] = channel2Samples;
        if (channelSamples[2] !== channel3Samples) channelSamples[2] = channel3Samples;
        if (channelSamples[3] !== channel4Samples) channelSamples[3] = channel4Samples;
        if (channelSamples[4] !== channel5Samples) channelSamples[4] = channel5Samples;
        this.setSCCIMode(s.m === true);
    };


    init(this);

};
