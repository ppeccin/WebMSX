// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// PSGs AY-3-8910/YM2149 supported

wmsx.PSG = function() {

    function init() {
        mixedAudioChannels = new wmsx.PSGMixedAudioChannels();
        audioSignal = new wmsx.AudioSignal(mixedAudioChannels);
        registers[14] = 0x3f3f;     // Special 16 bits storing 2 sets of values for 2 Joysticks inputs
        registers[15] = 0x0f;
    }

    this.connectBus = function(bus) {
        bus.connectOutputDevice(0xa0, this.outputA0);
        bus.connectOutputDevice(0xa1, this.outputA1);
        bus.connectInputDevice(0xa2,  this.inputA2);
    };

    this.powerOn = function() {
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
            mixedAudioChannels.setPeriodA(((registers[1] & 0x0f) << 8) | registers[0]);
        } else if (registerAddress === 2 || registerAddress === 3) {
            mixedAudioChannels.setPeriodB(((registers[3] & 0x0f) << 8) | registers[2]);
        } else if (registerAddress === 4 || registerAddress === 5) {
            mixedAudioChannels.setPeriodC(((registers[5] & 0x0f) << 8) | registers[4]);
        } else if (registerAddress === 6) {
            mixedAudioChannels.setPeriodN(val & 0x1f);
        } else if (registerAddress === 7) {
            mixedAudioChannels.setMixerControl(val);
        } else if (registerAddress === 8) {
            mixedAudioChannels.setAmplitudeA(val);
        } else if (registerAddress === 9) {
            mixedAudioChannels.setAmplitudeB(val);
        } else if (registerAddress === 10) {
            mixedAudioChannels.setAmplitudeC(val);
        } else if (registerAddress === 11 || registerAddress === 12) {
            mixedAudioChannels.setPeriodE((registers[12] << 8) | registers[11]);
        } else if (registerAddress === 13) {
            mixedAudioChannels.setEnvelopeControl(val);
        }
    };

    this.inputA2 = function() {
        if (registerAddress === 14) {       // Special register14. Read value depends on register15 bit6
            if (registers[15] & 0x40) return registers[14] >>> 8;
            else return registers[14] & 0xff;
        }
        return registers[registerAddress];
    };

    this.setPulseSignal = function(boo) {
        mixedAudioChannels.setPulseSignal(boo);
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
    var mixedAudioChannels;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ra: registerAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(registers),
            a: audioSignal.saveState()
        };
    };

    this.loadState = function(s) {
        registerAddress = s.ra;
        registers = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r, registers);
        registers[14] = 0x3f3f;                                  // reset Joysticks inputs
        audioSignal.loadState(s.a);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};