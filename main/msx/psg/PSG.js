// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function PSG() {

    function init() {
        audioSignal = new PSGAudioSignal();
    }

    this.connectEngine = function(pEngine) {
        engine = pEngine;
    };

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
    };

    this.getAudioOutput = function() {
        return audioSignal;
    };

    this.outputA0 = function(port, val) {
    };

    this.outputA1 = function(port, val) {
    };

    this.inputA2 = function(port) {
        return 0x3f;
    };


    var audioSignal;
    var engine;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
        };
    };

    this.loadState = function(s) {
    };


    init();

}