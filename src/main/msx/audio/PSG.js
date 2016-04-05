// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// PSGs AY-3-8910/YM2149 supported

wmsx.PSG = function(audioSocket) {

    function init() {
        registers[14] = 0x3f3f;     // Special 16 bits storing 2 sets of values for 2 Joysticks inputs
        registers[15] = 0x0f;
    }

    this.connectBus = function(bus) {
        bus.connectInputDevice( 0xa0, wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(0xa0, this.outputA0);
        bus.connectInputDevice( 0xa1, wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(0xa1, this.outputA1);
        bus.connectInputDevice( 0xa2, this.inputA2);
        bus.connectOutputDevice(0xa2, wmsx.DeviceMissing.outputPortIgnored);
    };

    this.powerOn = function() {
        audioChannel.powerOn();
    };

    this.powerOff = function() {
        audioChannel.powerOff();
    };

    this.reset = function() {
        audioChannel.reset();
    };

    this.getAudioChannel = function() {
        return audioChannel;
    };

    this.outputA0 = function(val) {
        registerAddress = val > 15 ? 0 : val;
    };

    this.outputA1 = function(val) {
        registers[registerAddress] = val;
        switch(registerAddress) {
            case 0: case 1:
                audioChannel.setPeriodA(((registers[1] & 0x0f) << 8) | registers[0]);
                break;
            case 2: case 3:
                audioChannel.setPeriodB(((registers[3] & 0x0f) << 8) | registers[2]);
                break;
            case 4: case 5:
                audioChannel.setPeriodC(((registers[5] & 0x0f) << 8) | registers[4]);
                break;
            case 6:
                audioChannel.setPeriodN(val & 0x1f);
                break;
            case 7:
                audioChannel.setMixerControl(val);
                break;
            case 8:
                audioChannel.setAmplitudeA(val);
                break;
            case 9:
                audioChannel.setAmplitudeB(val);
                break;
            case 10:
                audioChannel.setAmplitudeC(val);
                break;
            case 11: case 12:
                audioChannel.setPeriodE((registers[12] << 8) | registers[11]);
                break;
            case 13:
                audioChannel.setEnvelopeControl(val);
                break;
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

    var audioChannel = new wmsx.PSGAudio(audioSocket);


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ra: registerAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(registers),
            ac: audioChannel.saveState()
        };
    };

    this.loadState = function(s) {
        registerAddress = s.ra;
        registers = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r, registers);
        registers[14] = 0x3f3f;                                 // reset Joysticks inputs
        audioChannel.loadState(s.ac);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};