// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements a simple unsigned 8 bit PCM audio. 0x80: center, 0xff: max positive, 0x00: max negative

wmsx.PCM8BitAudio = function() {
"use strict";

    this.setAudioSocket = function(pAudioSocket) {
        audioSocket = pAudioSocket;
    };

    this.connectAudio = function() {
        if (!audioSignal) audioSignal = new wmsx.AudioSignal("PCM 8 bit", this, SAMPLE_RATE, VOLUME);
        if (audioSocket) audioSocket.connectAudioSignal(audioSignal);
    };

    this.disconnectAudio = function() {
        if (audioSignal && audioSocket) audioSocket.disconnectAudioSignal(audioSignal);
    };

    this.reset = function() {
        currentSample = 0;
    };

    this.setSampleValue = function(val) {
        currentSample = val - 0x80;       // To signed 8 bits
    };

    this.nextSample = function() {
        return currentSample * CHANNEL_MAX_VOLUME;
    };


    var currentSample;

    var audioSignal;
    var audioSocket;

    var CHANNEL_MAX_VOLUME = 0.25 / 128;                       // Sample values in the range -128..+127

    var VOLUME = 0.65;
    var SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 32;       // Same as PSG Audio. Main cpu clock / 32 = 112005hz


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: currentSample
        }
    };

    this.loadState = function(s) {
        currentSample = s.s;
    };

};
