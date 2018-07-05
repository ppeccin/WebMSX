// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// OPL4 FM/Wave Sound Chip

wmsx.OPL4Audio = function(pName, cart) {
"use strict";

    var self = this;

    function init(self) {
        name = pName || "OPL4";
        fm = new wmsx.OPL4AudioFM(self);
        wave = new wmsx.OPL4AudioWave(self);
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
        disconnectAudio();

        fm.reset();
        wave.reset();
    };

    this.memoryRead = cart.opl4ReadMemory;

    this.memoryWrite = cart.opl4WriteMemory;

    function connectAudio() {
        if (audioSocket) {
            if (!audioSignal) audioSignal = new wmsx.AudioSignal(name, self, SAMPLE_RATE, VOLUME);
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

    var VOLUME = 0.65 * (1.55 / 9 / 256);                               // 9 channels, samples -256..+ 256
    var SAMPLE_RATE = wmsx.Machine.BASE_CPU_CLOCK / 72;                 // Main CPU clock / 72 = 49780hz


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {};
    };

    this.loadState = function(s) {
        this.reset();
        if (audioConnected) connectAudio();
    };


    init(this);

    this.eval = function(str) {
        return eval(str);
    };

};
