// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// PSGs AY-3-8910/YM2149 supported

wmsx.PSG = function(audioSocket, mouseSocket) {

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
        register[15] = 0x0f;
    };

    this.powerOff = function() {
        audioChannel.powerOff();
    };

    this.reset = function() {
        mouseReadCycle[0] = mouseReadCycle[1] = -1;
        audioChannel.reset();
    };

    this.getAudioChannel = function() {
        return audioChannel;
    };

    this.outputA0 = function(val) {
        registerAddress = val > 15 ? 0 : val;
    };

    this.outputA1 = function(val) {
        var mod = register[registerAddress] ^ val;
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
            case 15:
                if (mod & 0x10) {
                    ++mouseReadCycle[0];
                    if (mouseReadCycle[0] === 0) mouseSocket.readMouseDeltaState(0, mouseDeltaState[0]);

                    //console.log("Mouse port 0 UpCycle");

                } else {
                    mouseReadCycle[0] = -1;

                    //console.log("Mouse port 0 RESET Cycle");

                }
                if (mod & 0x20){

                    //console.log("Mouse port 1 UpCycle");

                    ++mouseReadCycle[1];
                    if (mouseReadCycle[1] === 0) mouseSocket.readMouseDeltaState(1, mouseDeltaState[1]);
                } else {
                    mouseReadCycle[1] = -1;

                    //console.log("Mouse port 1 RESET Cycle");

                }

        }
    };

    this.inputA2 = function() {
        if (registerAddress !== 14) return register[registerAddress];

        // Special register 14. Read value depends on register 15 bit 6 and mouseReadCycle
        var port = (register[15] >> 6) & 1;

        // If mouse read is pending, return it, otherwise return joystick state
        if (mouseReadCycle[port] >= 0)
            return getMousePortState(port);
        else
            return joysticksPortState[port];
    };

    function getMousePortState(port) {
        var res = 0;
        var dState = mouseDeltaState[port];
        switch (mouseReadCycle[port]) {
            case 0:
                res = dState.dX >> 4; break;
            case 1:
                res = dState.dX; break;
            case 2:
                res = dState.dY >> 4; break;
            case 3:
                res = dState.dY; break;
        }
        res &= 0xf;

        //if (port === 0) console.log("Reading mouse port: " + port + ", mouseCycle: " + mouseReadCycle[port], " ret: " + res);

        return res;
    }


    // Joysticks interface

    this.joystickControlStateChanged = function(control, state) {
        // Control defines bit of register 14 to set. Bit 15 stores the port (0/1)
        var port = (control >> 15) & 1;
        if (state) joysticksPortState[port] &= ~(control & 0xff);
        else joysticksPortState[port] |= (control & 0xff)
    };

    this.joystickControlValueChanged = function(control, value) {
        // Used only for Paddles Mode, not supported yet
    };


    // Mouse interface

    this.writeMouseButtonsState = function(port, state) {
        joysticksPortState[port] &= ~0x30;
        joysticksPortState[port] |= (~state.buttons & 3) << 4;       // Only button 1 and 2
    };


    var registerAddress = 0;
    var register = wmsx.Util.arrayFill(new Array(16), 0);

    var joysticksPortState = [ 0x3f, 0x3f ];

    var mouseReadCycle = [ -1, -1 ];                                // 0: dX hi, 1: dX low, 2: dY hi, 3: dY low, -1: none
    var mouseDeltaState = [
        new wmsx.MouseControls.MouseDeltaState(),
        new wmsx.MouseControls.MouseDeltaState()
    ];

    var audioChannel = new wmsx.PSGAudio(audioSocket);


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            ra: registerAddress,
            r: wmsx.Util.storeInt8BitArrayToStringBase64(register),
            ac: audioChannel.saveState()
        };
    };

    this.loadState = function(s) {
        registerAddress = s.ra;
        register = wmsx.Util.restoreStringBase64ToInt8BitArray(s.r, register);
        joysticksPortState[0] = joysticksPortState[1] = 0x3f;                       // reset Joysticks inputs
        mouseDeltaState[0].reset(); mouseDeltaState[1].reset();                     // reset Mouse inputs
        audioChannel.loadState(s.ac);
    };


    this.eval = function(str) {
        return eval(str);
    };

};