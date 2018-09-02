// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// OPL4 FM/Wave Sound Chip

wmsx.OPL4Audio = function(pName, cart) {
"use strict";

    var self = this;

    function init(self) {

        window.OPL4 = self;

        name = pName || "OPL4";
        self.fm = fm = new wmsx.OPL4AudioFM(self);
        self.wave = wave = new wmsx.OPL4AudioWave(self, fm);
    }

    this.connect = function(machine) {
        fm.connect(machine);
        wave.connect(machine);
        audioSocket = machine.getAudioSocket();
        if (audioConnected) connectAudio();
    };

    this.disconnect = function(machine) {
        fm.disconnect(machine);
        wave.disconnect(machine);
        disconnectAudio();
        audioSocket = null;
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        disconnectAudio();
    };

    this.reset = function() {
        // Start with audio disconnected
        connectAudio();

        fm.reset();
        wave.reset();
    };

    this.audioClockPulse = function() {
        try {
            fm.audioClockPulse();
        } catch (e) {
            window.E = e;
            console.error(e);
        }
    };

    this.nextSample = function() {
        try {
            return wave.nextSample();
        } catch (e) {
            window.E = e;
            console.error(e);
            return 0;
        }
    };

    this.memoryRead = cart.opl4ReadMemory;

    this.memoryWrite = cart.opl4WriteMemory;

    function connectAudio() {
        if (audioSocket) {
            if (!audioSignal) audioSignal = new wmsx.AudioSignal(name, self, VOLUME, SAMPLE_RATE, true, CLOCK);
            audioSocket.connectAudioSignal(audioSignal);
            audioConnected = true;
        }
    }

    function disconnectAudio() {
        if (audioSocket && audioSignal) audioSocket.disconnectAudioSignal(audioSignal);
        audioConnected = false;
    }


    var name;
    var audioConnected = false;

    var fm, wave;

    var audioSocket, audioSignal;

    var VOLUME = 0.65 * (7 / 24 / 32768);     // 24 channels, samples -32768 .. +32768
    var SAMPLE_RATE = 44100;                  // Main CPU clock / 81.2734693877551 = 44100 Hz
    var CLOCK = 49780;                        // Main CPU clock / 72 = 49780 Hz


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            n: name,
            ac: audioConnected,
            fm: fm.saveState(),
            wv: wave.saveState()
        };
    };

    this.loadState = function(s) {
        this.reset();

        name = s.n;
        audioConnected = s.ac;

        fm.loadState(s.fm);
        wave.loadState(s.wv);

        if (audioConnected) connectAudio();
    };


    init(this);

    this.eval = function(str) {
        return eval(str);
    };

};
