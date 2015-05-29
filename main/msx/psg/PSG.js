// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function PSG() {

    function init() {
        audioSignal = new PSGAudioSignal();
        audioChannel = audioSignal.getMixedAudioChannel();
        registers[14] = registers[15] = 0x3f;
    }

    this.connectEngine = function(pEngine) {
        engine = pEngine;
    };

    this.powerOn = function(paused) {
        audioSignal.signalOn();
    };

    this.powerOff = function() {
        audioSignal.signalOff();
    };

    this.getAudioOutput = function() {
        return audioSignal;
    };

    this.clockPulse  = function() {
        audioSignal.audioClockPulse();
    };

    this.finishFrame = function() {
        audioSignal.finishFrame();
    };

    this.outputA0 = function(port, val) {

        //console.log("Register Select: " + val);

        registerAddress = val > 15 ? 0 : val;
    };

    this.outputA1 = function(port, val) {
        //console.log("Register Write: " + val);

        registers[registerAddress] = val;
        if (registerAddress === 0 || registerAddress === 1) {
            audioChannel.setPeriodA(((registers[1] & 0x0f) << 8) | registers[0]);
        } else if (registerAddress === 2 || registerAddress === 3) {
            audioChannel.setPeriodB(((registers[3] & 0x0f) << 8) | registers[2]);
        } else if (registerAddress === 4 || registerAddress === 5) {
            audioChannel.setPeriodC(((registers[5] & 0x0f) << 8) | registers[4]);
        } else if (registerAddress === 6) {
            audioChannel.setPeriodN(val & 0x1f);
        } else if (registerAddress === 7) {
            audioChannel.setMixerControl(val);
        } else if (registerAddress === 8) {
            audioChannel.setAmplitudeA(val);
        } else if (registerAddress === 9) {
            audioChannel.setAmplitudeB(val);
        } else if (registerAddress === 10) {
            audioChannel.setAmplitudeC(val);
        }
    };

    this.inputA2 = function(port) {
        return registers[registerAddress];
    };


    var registerAddress = 0;
    var registers = Util.arrayFill(new Array(16), 0);

    var audioSignal;
    var audioChannel;

    var engine;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
        };
    };

    this.loadState = function(s) {
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

}