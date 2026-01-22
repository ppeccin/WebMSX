// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PPI = function(psgAudioChannel, controllersSocket, ledsSocket) {
"use strict";

    this.connectBus = function(pBus) {
        bus = pBus;
        bus.connectInputDevice( 0xa8, this.inputA8);
        bus.connectOutputDevice(0xa8, this.outputA8);
        bus.connectInputDevice( 0xa9, this.inputA9);
        bus.connectOutputDevice(0xa9, wmsx.DeviceMissing.outputPortIgnored);
        bus.connectInputDevice( 0xaa, this.inputAA);
        bus.connectOutputDevice(0xaa, this.outputAA);
        bus.connectInputDevice( 0xab, wmsx.DeviceMissing.inputPortIgnored);
        bus.connectOutputDevice(0xab, this.outputAB);
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        this.reset();
    };

    this.reset = function() {
        registerC = 0x50;              // Everything OFF. Motor and CapsLed = 1 means OFF
        keyboardRowSelected = 0;
        updatePulseSignal();
        updateCapsLed();
    };

    this.inputA8 = function() {
        return bus.getPrimarySlotConfig();
    };

    this.outputA8 = function(val) {
        bus.setPrimarySlotConfig(val);
    };

    this.inputA9 = function() {
        return controllersSocket.readKeyboardPort(keyboardRowSelected);
    };

    this.inputAA = function() {
        return registerC;
    };

    this.outputAA = function(val) {
        var mod = registerC ^ val;
        if (!mod) return;
        registerC = val;
        if (mod & 0x0f) updateKeyboardConfig();
        if (mod & 0xa0) updatePulseSignal();
        if (mod & 0x40) updateCapsLed();
    };

    this.outputAB = function(val) {
        var bit = (val & 0x0e) >>> 1;
        if ((val & 0x01) === 0) registerC &= ~(1 << bit);
        else registerC |= 1 << bit;

        if (bit <= 3) updateKeyboardConfig();
        else if (bit === 5 || bit === 7) updatePulseSignal();
        else if (bit === 6) updateCapsLed();
    };

    function updateKeyboardConfig() {
        keyboardRowSelected = registerC & 0x0f;
    }

    function updatePulseSignal() {
        psgAudioChannel.setPulseSignal((registerC & 0xa0) > 0);     // Cassette or KeyClick
    }

    function updateCapsLed() {
        ledsSocket.ledStateChanged(0, (~registerC & 0x40) >> 6);
    }


    var bus;

    var registerC = 0x50;              // Everything OFF. Motor and CapsLed = 1 means OFF
    var keyboardRowSelected = 0;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            c: registerC
        };
    };

    this.loadState = function(s) {
        registerC = s.c || 0;
        updateKeyboardConfig();
        updatePulseSignal();
        updateCapsLed();
    };

};