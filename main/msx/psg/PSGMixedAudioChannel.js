// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

PSGMixedAudioChannel = function() {

    this.nextSample = function() {
        // Update values
        if (--periodACountdown < 0) {
            periodACountdown += periodA;
            currentSampleA = currentSampleA ? 0 : 1;
        }
        if (--periodBCountdown < 0) {
            periodBCountdown += periodB;
            currentSampleB = currentSampleB ? 0 : 1;
        }
        if (--periodCCountdown < 0) {
            periodCCountdown += periodC;
            currentSampleC = currentSampleC ? 0 : 1;
        }
        if (--periodNCountdown < 0) {
            periodNCountdown += periodN;
            currentSampleN = nextLFSR();
        }

        // Mix tone with noise
        var sampleA = (toneA ? currentSampleA : 0)  | (noiseA ? currentSampleN : 0);
        var sampleB = (toneB ? currentSampleB : 0)  | (noiseB ? currentSampleN : 0);
        var sampleC = (toneC ? currentSampleC : 0)  | (noiseC ? currentSampleN : 0);

        var res =
            sampleA * (amplitudeA / 16) * CHANNEL_AMPL +
            sampleB * (amplitudeB / 16) * CHANNEL_AMPL +
            sampleC * (amplitudeC / 16) * CHANNEL_AMPL;

        //if (res) console.log("Sample: " + res);

        return res;
    };

    this.setPeriodA = function(newPeriod) {
        newPeriod >>= 1;
        if (periodA === newPeriod) return;
        periodACountdown = ((periodACountdown / periodA) * newPeriod) | 0;
        periodA = newPeriod;
    };

    this.setPeriodB = function(newPeriod) {
        newPeriod >>= 1;
        if (periodB === newPeriod) return;
        periodBCountdown = ((periodBCountdown / periodB) * newPeriod) | 0;
        periodB = newPeriod;
    };

    this.setPeriodC = function(newPeriod) {
        newPeriod >>= 1;
        if (periodC === newPeriod) return;
        periodCCountdown = ((periodCCountdown / periodC) * newPeriod) | 0;
        periodC = newPeriod;
    };

    this.setPeriodN = function(newPeriod) {
        newPeriod >>= 1;
        if (periodN === newPeriod) return;
        periodNCountdown = ((periodNCountdown / periodN) * newPeriod) | 0;
        periodN = newPeriod;
    };

    this.setAmplitudeA = function(newAmplitude) {
        amplitudeA = newAmplitude & 0x0f;
    };

    this.setAmplitudeB = function(newAmplitude) {
        amplitudeB = newAmplitude & 0x0f;
    };

    this.setAmplitudeC = function(newAmplitude) {
        amplitudeC = newAmplitude & 0x0f;
    };

    this.setMixerControl = function(control) {
        toneA = (control & 0x01) === 0; noiseA = (control & 0x08) === 0;
        toneB = (control & 0x02) === 0; noiseB = (control & 0x10) === 0;
        toneC = (control & 0x04) === 0; noiseC = (control & 0x20) === 0;
    };


    function nextLFSR() {
        var carry = lfsr & 0x01;					                // bit 0
        var push = ((lfsr >> 17) ^ (lfsr >> 6) ^ carry) & 0x01;	    // bit 17 XOR bit 6 XOR bit 0
        lfsr = (push << 17) | (lfsr >>> 1);			                // shift right, push to left
        return carry;
    }


    var periodA = 0;
    var periodACountdown = 0;
    var currentSampleA = 0;
    var amplitudeA = 0;
    var toneA = false;
    var noiseA = false;

    var periodB = 0;
    var periodBCountdown = 0;
    var currentSampleB = 0;
    var amplitudeB = 0;
    var toneB = false;
    var noiseB = false;

    var periodC = 0;
    var periodCCountdown = 0;
    var currentSampleC = 0;
    var amplitudeC = 0;
    var toneC = false;
    var noiseC = false;

    var periodN = 0;
    var periodNCountdown = 0;
    var currentSampleN = 0;

    var lfsr = 0x3fffe;             // Noise generator. 18-bit Linear Feedback Shift Register


    var CHANNEL_AMPL = 0.4;

};
