// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Controls the 3 PSG Audio Channels and Pulse Signal Channel

wmsx.PSGAudio = function(audioSocket) {
"use strict";

    var self = this;

    function init() {
        createVolumeCurve();
    }

    this.powerOn = function() {
        this.reset();
        connectAudio();
    };

    this.powerOff = function() {
        disconnectAudio();
    };

    this.reset = function() {
        this.setMixerControl(0xff);
        this.setAmplitudeA(0);
        this.setAmplitudeB(0);
        this.setAmplitudeC(0);
        pulseSignal = false;
    };

    this.nextSample = function() {
        // Update values
        if (amplitudeA > 0 && periodA > 0) {
            periodACount += 2;
            if (periodACount >= periodA) {
                periodACount = (periodACount - periodA) & 1;     // Preserve the remainder (0 or 1) for odd dividers, as the step is 2
                currentSampleA = currentSampleA ? 0 : 1;
            }
        }
        if (amplitudeB > 0 && periodB > 0) {
            periodBCount += 2;
            if (periodBCount >= periodB) {
                periodBCount = (periodBCount - periodB) & 1;
                currentSampleB = currentSampleB ? 0 : 1;
            }
        }
        if (amplitudeC > 0 && periodC > 0) {
            periodCCount += 2;
            if (periodCCount >= periodC) {
                periodCCount = (periodCCount - periodC) & 1;
                currentSampleC = currentSampleC ? 0 : 1;
            }
        }
        if (noiseA || noiseB || noiseC) {
            periodNCountdown += 1;
            if (periodNCountdown >= periodN) {
                periodNCountdown = 0;
                currentSampleN = nextLFSR();
            }
        }
        if ((directionE !== 0)) {
            periodECountdown += 1;
            if (periodECountdown >= periodE) {
                periodECountdown = 0;
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

        // Mix tone with noise. Tone or noise if turned off produce a fixed high value (1). Then add Pulse Signal
        return (amplitudeA > 0 ? ((toneA ? currentSampleA : 1) & (noiseA ? currentSampleN : 1)) * amplitudeA : 0)
             + (amplitudeB > 0 ? ((toneB ? currentSampleB : 1) & (noiseB ? currentSampleN : 1)) * amplitudeB : 0)
             + (amplitudeC > 0 ? ((toneC ? currentSampleC : 1) & (noiseC ? currentSampleN : 1)) * amplitudeC : 0)
             + (pulseSignal ? CHANNEL_MAX_VOLUME : 0);
    };

    this.setPeriodA = function(newPeriod) {
        if (periodA === newPeriod) return;
        if (newPeriod < 2) {
            periodA = 0; currentSampleA = 1;        // Dividers 0 and 1 not supported. Fixed high value (1)
        } else {
            periodA = newPeriod;
        }
    };

    this.setPeriodB = function(newPeriod) {
        if (periodB === newPeriod) return;
        if (newPeriod < 2) {
            periodB = 0; currentSampleB = 1;
        } else {
            periodB = newPeriod;
        }
    };

    this.setPeriodC = function(newPeriod) {
        if (periodC === newPeriod) return;
        if (newPeriod < 2) {
            periodC = 0; currentSampleC = 1;
        } else {
            periodC = newPeriod;
        }
    };

    this.setPeriodN = function(newPeriod) {
        if (periodN === newPeriod) return;
        periodN = newPeriod < 1 ? 1 : newPeriod;    // Dividers0 is the same as 1
    };

    this.setPeriodE = function(newPeriod) {
        if (periodE === newPeriod) return;
        periodE = newPeriod < 1 ? 1 : newPeriod;
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
        continueE =  (control & 0x08) > 0;
        attackE =    (control & 0x04) > 0;
        alternateE = (control & 0x02) > 0;
        holdE =      (control & 0x01) > 0;
        cycleEnvelope(false, false);
        setEnvelopeAmplitudes();
    };

    this.setPulseSignal = function(boo) {
        pulseSignal = boo;
    };

    function connectAudio() {
        if (!audioSignal) audioSignal = new wmsx.AudioSignal("PSG", self, SAMPLE_RATE, VOLUME);
        audioSocket.connectAudioSignal(audioSignal);
    }

    function disconnectAudio() {
        if (audioSignal) audioSocket.disconnectAudioSignal(audioSignal);
    }

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
        // bit 16 = bit 2 XOR bit 0
        lfsr =  (lfsr >>> 1) | ((((lfsr >> 2) ^ (lfsr & 0x01)) & 0x01) << 16);    // shift right, push to left
        return lfsr & 0x01;
    }

    function createVolumeCurve() {
        for (var v = 0; v < 16; v++)
            volumeCurve[v] = (Math.pow(CHANNEL_VOLUME_CURVE_POWER, v / 15) - 1) / (CHANNEL_VOLUME_CURVE_POWER - 1) * CHANNEL_MAX_VOLUME;
    }


    var periodA = 0;
    var periodACount = 0;
    var currentSampleA = 0;
    var amplitudeA = 0;
    var toneA = false;
    var noiseA = false;
    var envelopeA = false;

    var periodB = 0;
    var periodBCount = 0;
    var currentSampleB = 0;
    var amplitudeB = 0;
    var toneB = false;
    var noiseB = false;
    var envelopeB = false;

    var periodC = 0;
    var periodCCount = 0;
    var currentSampleC = 0;
    var amplitudeC = 0;
    var toneC = false;
    var noiseC = false;
    var envelopeC = false;

    var periodN = 1;
    var periodNCountdown = 1;
    var currentSampleN = 0;

    var periodE = 1;
    var periodECountdown = 1;
    var currentValueE = 0;
    var directionE = 0;
    var continueE = false;
    var attackE = false;
    var alternateE = false;
    var holdE = false;

    var pulseSignal = false;

    var lfsr = 0x1fffe;                        // Noise generator. 17-bit Linear Feedback Shift Register

    var volumeCurve = new Float64Array(16);    // Double values

    var audioSignal;

    var CHANNEL_MAX_VOLUME = 0.25;
    var CHANNEL_VOLUME_CURVE_POWER = 30;

    var VOLUME = 0.50;
    var SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 32;       // Main CPU clock / 32 = 112005Hz


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            pa: periodA, pac: periodACount, ca: currentSampleA, aa: amplitudeA, ta: toneA, na: noiseA, ea: envelopeA,
            pb: periodB, pbc: periodBCount, cb: currentSampleB, ab: amplitudeB, tb: toneB, nb: noiseB, eb: envelopeB,
            pc: periodC, pcc: periodCCount, cc: currentSampleC, ac: amplitudeC, tc: toneC, nc: noiseC, ec: envelopeC,
            pn: periodN, pnc: periodNCountdown, cn: currentSampleN,
            pe: periodE, pec: periodECountdown, ce: currentValueE, de: directionE, cne: continueE, ate: attackE, ale: alternateE, he: holdE,
            ps: pulseSignal,
            lf: lfsr
        };
    };

    this.loadState = function(s) {
        periodA = s.pa; periodACount = s.pac; currentSampleA = s.ca; amplitudeA = s.aa; toneA = s.ta; noiseA = s.na; envelopeA = s.ea;
        periodB = s.pb; periodBCount = s.pbc; currentSampleB = s.cb; amplitudeB = s.ab; toneB = s.tb; noiseB = s.nb; envelopeB = s.eb;
        periodC = s.pc; periodCCount = s.pcc; currentSampleC = s.cc; amplitudeC = s.ac; toneC = s.tc; noiseC = s.nc; envelopeC = s.ec;
        periodN = s.pn; periodNCountdown = s.pnc; currentSampleN = s.cn;
        periodE = s.pe; periodECountdown = s.pec; currentValueE = s.ce; directionE = s.de; continueE = s.cne; attackE = s.ate; alternateE = s.ale; holdE = s.he;
        pulseSignal = s.ps;
        lfsr = s.lf;
        if (audioSignal) audioSignal.flush();
    };


    init();

};
