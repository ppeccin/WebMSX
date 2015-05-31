// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

PSGMixedAudioChannel = function() {

    function init() {
        createVolumeCurve();
    }

    this.nextSample = function() {
        // Update values
        if (toneA) {
            periodACountdown -= 4;
            if (periodACountdown <= 0) {
                periodACountdown += periodA;
                currentSampleA = currentSampleA ? 0 : 1;
            }
        }
        if (toneB) {
            periodBCountdown -= 4;
            if (periodBCountdown <= 0) {
                periodBCountdown += periodB;
                currentSampleB = currentSampleB ? 0 : 1;
            }
        }
        if (toneC) {
            periodCCountdown -= 4;
            if (periodCCountdown <= 0) {
                periodCCountdown += periodC;
                currentSampleC = currentSampleC ? 0 : 1;
            }
        }
        if (noiseA || noiseB || noiseC) {
            periodNCountdown -= 2;
            if (periodNCountdown <= 0) {
                periodNCountdown += periodN;
                currentSampleN = nextLFSR();
            }
        }
        if ((directionE !== 0)) {  // } && (envelopeA || envelopeB || envelopeC)) {
            periodECountdown -= 2;
            if (periodECountdown <= 0) {
                periodECountdown += periodE;
                currentValueE += directionE;
                if (currentValueE < 0 || currentValueE > 15) {
                    if (continueE) {
                        cycleEnvelope(alternateE, holdE);
                    } else {
                        attackE = true;
                        cycleEnvelope(true, true);      // will set 0 and stop direction
                    }
                }
                setEnvelopeAmplitudes();
            }
        }

        // Mix tone with noise
        var sampleA = (toneA ? currentSampleA : 0) | (noiseA ? currentSampleN : 0);
        var sampleB = (toneB ? currentSampleB : 0) | (noiseB ? currentSampleN : 0);
        var sampleC = (toneC ? currentSampleC : 0) | (noiseC ? currentSampleN : 0);

        return sampleA * amplitudeA + sampleB * amplitudeB + sampleC * amplitudeC;
    };

    this.setPeriodA = function(newPeriod) {
        if (periodA === newPeriod) return;
        periodACountdown = ((periodACountdown / periodA) * newPeriod) | 0;
        if (periodACountdown <= 0) periodBCountdown = newPeriod;
        periodA = newPeriod;
    };

    this.setPeriodB = function(newPeriod) {
        if (periodB === newPeriod) return;
        periodBCountdown = ((periodBCountdown / periodB) * newPeriod) | 0;
        if (periodBCountdown <= 0) periodBCountdown = newPeriod;
        periodB = newPeriod;
    };

    this.setPeriodC = function(newPeriod) {
        if (periodC === newPeriod) return;
        periodCCountdown = ((periodCCountdown / periodC) * newPeriod) | 0;
        if (periodCCountdown <= 0) periodBCountdown = newPeriod;
        periodC = newPeriod;
    };

    this.setPeriodN = function(newPeriod) {
        if (periodN === newPeriod) return;
        periodNCountdown = ((periodNCountdown / periodN) * newPeriod) | 0;
        if (periodNCountdown <= 0) periodBCountdown = newPeriod;
        periodN = newPeriod;
    };

    this.setPeriodE = function(newPeriod) {
        if (periodE === newPeriod) return;
        periodECountdown = ((periodECountdown / periodE) * newPeriod) | 0;
        if (periodECountdown <= 0) periodBCountdown = newPeriod;
        periodE = newPeriod;
    };

    this.setAmplitudeA = function(newAmplitude) {
     if (newAmplitude & 0x10) {
            envelopeA = true; amplitudeA = volumeCurve[currentValueE];
        } else {
            envelopeA = false; amplitudeA = volumeCurve[newAmplitude & 0x0f];
        }
    };

    this.setAmplitudeB = function(newAmplitude) {
        if (newAmplitude & 0x10) {
            envelopeB = true; amplitudeB = volumeCurve[currentValueE];
        } else {
            envelopeB = false; amplitudeB = volumeCurve[newAmplitude & 0x0f];
        }
    };

    this.setAmplitudeC = function(newAmplitude) {
        if (newAmplitude & 0x10) {
            envelopeC = true; amplitudeC = volumeCurve[currentValueE];
        } else {
            envelopeC = false; amplitudeC = volumeCurve[newAmplitude & 0x0f];
        }
    };

    this.setMixerControl = function(control) {
        toneA = (control & 0x01) === 0; noiseA = (control & 0x08) === 0;
        toneB = (control & 0x02) === 0; noiseB = (control & 0x10) === 0;
        toneC = (control & 0x04) === 0; noiseC = (control & 0x20) === 0;
    };

    this.setEnvelopeControl = function(control) {

        console.log("Envelope Control: " + Util.toHex2(control));

        continueE =  (control & 0x08) > 0;
        attackE =    (control & 0x04) > 0;
        alternateE = (control & 0x02) > 0;
        holdE =      (control & 0x01) > 0;
        cycleEnvelope(false, false);
        setEnvelopeAmplitudes();
    };

    function cycleEnvelope(alternate, hold) {
        if (alternate ^ hold) attackE = !attackE;
        currentValueE = attackE ? 0 : 15;
        directionE = hold ? 0 : attackE ? 1 : -1;
    }

    function setEnvelopeAmplitudes() {
        if (envelopeA) amplitudeA = volumeCurve[currentValueE];
        if (envelopeB) amplitudeB = volumeCurve[currentValueE];
        if (envelopeC) amplitudeC = volumeCurve[currentValueE];
    }

    function nextLFSR() {
        var carry = lfsr & 0x01;					                // bit 0
        var push = ((lfsr >> 17) ^ (lfsr >> 6) ^ carry) & 0x01;	    // bit 17 XOR bit 6 XOR bit 0
        lfsr = (push << 17) | (lfsr >>> 1);			                // shift right, push to left
        return carry;
    }

    function createVolumeCurve() {
        for (var v = 0; v < 16; v++)
            volumeCurve[v] = (Math.pow(CHANNEL_AMP_CURVE_POWER, v / 15) - 1) / (CHANNEL_AMP_CURVE_POWER - 1) * CHANNEL_MAX_AMP;
    }


    var periodA = 0;
    var periodACountdown = 0;
    var currentSampleA = 0;
    var amplitudeA = 0;
    var toneA = false;
    var noiseA = false;
    var envelopeA = false;

    var periodB = 0;
    var periodBCountdown = 0;
    var currentSampleB = 0;
    var amplitudeB = 0;
    var toneB = false;
    var noiseB = false;
    var envelopeB = false;

    var periodC = 0;
    var periodCCountdown = 0;
    var currentSampleC = 0;
    var amplitudeC = 0;
    var toneC = false;
    var noiseC = false;
    var envelopeC = false;

    var periodN = 0;
    var periodNCountdown = 0;
    var currentSampleN = 0;

    var periodE = 0;
    var periodECountdown = 0;
    var currentValueE = 0;
    var directionE = 0;
    var continueE = false;
    var attackE = false;
    var alternateE = false;
    var holdE = false;

    var lfsr = 0x3fffe;             // Noise generator. 18-bit Linear Feedback Shift Register

    var volumeCurve = new Array(16);

    var CHANNEL_AMP_CURVE_POWER = 16;
    var CHANNEL_MAX_AMP = 0.25;


    init();

};
