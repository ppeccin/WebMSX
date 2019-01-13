// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// PSGs AY-3-8910/YM2149 supported

wmsx.PSG = function(controllersSocket, secondary) {
"use strict";

    this.connectBus = function(bus) {
        var basePort = secondary ? 0x10 : 0xa0;
        bus.connectInputDevice( basePort,     wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(basePort,     this.outputA0);
        bus.connectInputDevice( basePort + 1, wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(basePort + 1, this.outputA1);
        bus.connectInputDevice( basePort + 2, this.inputA2);
        bus.connectOutputDevice(basePort + 2, wmsx.DeviceMissing.outputPortIgnored);
        if (powerIsOn) audioChannel.connectAudio();
    };

    this.disconnectBus = function(bus) {
        var basePort = secondary ? 0x10 : 0xa0;
        bus.disconnectInputDevice( basePort,     wmsx.DeviceMissing.inputPortIgnored);
        bus.disconnectOutputDevice(basePort,     this.outputA0);
        bus.disconnectInputDevice( basePort + 1, wmsx.DeviceMissing.inputPortIgnored);
        bus.disconnectOutputDevice(basePort + 1, this.outputA1);
        bus.disconnectInputDevice( basePort + 2, this.inputA2);
        bus.disconnectOutputDevice(basePort + 2, wmsx.DeviceMissing.outputPortIgnored);
        audioChannel.disconnectAudio();
    };

    this.setAudioSocket = function(audioSocket) {
        audioChannel.setAudioSocket(audioSocket);
    };

    this.powerOn = function() {
        powerIsOn = true;
        audioChannel.powerOn();
        register[15] = 0x0f;
    };

    this.powerOff = function() {
        powerIsOn = false;
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
        register[registerAddress] = val;
        switch(registerAddress) {
            case 0: case 1:
                audioChannel.setPeriodA(((register[1] & 0x0f) << 8) | register[0]); break;
            case 2: case 3:
                audioChannel.setPeriodB(((register[3] & 0x0f) << 8) | register[2]); break;
            case 4: case 5:
                audioChannel.setPeriodC(((register[5] & 0x0f) << 8) | register[4]); break;
            case 6:
                audioChannel.setPeriodN(val & 0x1f); break;
            case 7:
                audioChannel.setMixerControl(val); break;
            case 8:
                audioChannel.setAmplitudeA(val); break;
            case 9:
                audioChannel.setAmplitudeB(val); break;
            case 10:
                audioChannel.setAmplitudeC(val); break;
            case 11: case 12:
                audioChannel.setPeriodE((register[12] << 8) | register[11]); break;
            case 13:
                audioChannel.setEnvelopeControl(val); break;
            // case 14:
                // register 14 is read-only
            case 15:
                // Bits 4 and 5 mapped to external ports
                if (controllersSocket) {
                    controllersSocket.writeControllerPin8Port(0, (val & 0x10) >> 4);
                    controllersSocket.writeControllerPin8Port(1, (val & 0x20) >> 5);
                }
                break;
        }
    };

    this.inputA2 = function() {
        if (registerAddress !== 14) return register[registerAddress];

        // External port mapped to register 14. Port 0 or 1 defined by register 15 bit 6
        var port = (register[15] >> 6) & 1;

        return controllersSocket ? controllersSocket.readControllerPort(port): 0x3f;
    };


    var powerIsOn = false;

    var registerAddress = 0;
    var register = wmsx.Util.arrayFill(new Array(16), 0);

    var audioChannel = new wmsx.PSGAudio(secondary);


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            p: powerIsOn,
            ra: registerAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(register),
            ac: audioChannel.saveState()
        };
    };

    this.loadState = function(s) {
        powerIsOn = s.p !== undefined ? s.p : true;
        registerAddress = s.ra;
        register = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r, register);
        audioChannel.loadState(s.ac);
    };


    this.eval = function(str) {
        return eval(str);
    };

};