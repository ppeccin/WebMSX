// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PSG = function() {

    function init() {
        audioSignal = new wmsx.PSGAudioSignal();
        audioChannel = audioSignal.getMixedAudioChannel();
        registers[14] = 0x3f3f;     // Special 16 bits storing 2 sets of values for 2 Joysticks inouts
        registers[15] = 0x0f;
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

    this.outputA0 = function(val) {
        registerAddress = val > 15 ? 0 : val;
    };

    this.outputA1 = function(val) {
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
        } else if (registerAddress === 11 || registerAddress === 12) {
            audioChannel.setPeriodE((registers[12] << 8) | registers[11]);
        } else if (registerAddress === 13) {
            audioChannel.setEnvelopeControl(val);
        }
    };

    this.inputA2 = function() {
        if (registerAddress === 14) {       // Special register14. Read value depends on register15 bit6
            if (registers[15] & 0x40) return registers[14] >>> 8;
            else return registers[14] & 0xff;
        }
        return registers[registerAddress];
    };


    // Joysticks interface

    this.joystickControlStateChanged = function(control, state) {
        // control already defines bit of register 14 to set
        if (state) registers[14] &= ~control;
        else registers[14] |= control;
    };

    this.joystickControlValueChanged = function(control, value) {
        // Used only for Paddles Mode, not supported yet
    };


    var registerAddress = 0;
    var registers = wmsx.Util.arrayFill(new Array(16), 0);      // register14 is special, uses 16 bits for 2 sets of Joysticks inputs
    var register15LowInputMode = false;                         // TODO Take this into account?

    var audioSignal;
    var audioChannel;

    var joystickControls = wmsx.JoysticksControls;

    var engine;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ra: registerAddress,
            r: wmsx.Util.storeArrayToStringBase64(registers),
            a: audioChannel.saveState()

        };
    };

    this.loadState = function(s) {
        registerAddress = s.ra;
        registers = wmsx.Util.restoreStringBase64ToArray(s.r);
        registers[14] = 0x3f3f;                                  // reset Joysticks inputs
        audioChannel.loadState(s.a);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};