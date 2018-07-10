// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PPI = function(psgAudioChannel, controllersSocket) {
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
    };

    this.powerOff = function() {
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
        if (registerC === val) return;
        registerC  = val;
        updateKeyboardConfig();
        updateCassetteSignal();
    };

    this.outputAB = function(val) {
        if ((val & 0x01) === 0) registerC &= ~(1 << ((val & 0x0e) >>> 1));
        else registerC |= (1 << ((val & 0x0e) >>> 1));

        var bit = (val & 0x0e) >>> 1;
        if (bit <= 3 || bit === 7) {
            updateKeyboardConfig();
        } else if (bit === 5) {
            updateCassetteSignal();
        }
    };

    function updateKeyboardConfig() {
        keyboardRowSelected = registerC & 0x0f;
        if (keyClickSignal === ((registerC & 0x80) > 0)) return;
        keyClickSignal = !keyClickSignal;
        psgAudioChannel.setPulseSignal(keyClickSignal);
    }

    function updateCassetteSignal() {
        if (casseteSignal === ((registerC & 0x20) > 0)) return;
        casseteSignal = !casseteSignal;
        psgAudioChannel.setPulseSignal(casseteSignal);
    }


    var registerC = 0;
    var keyClickSignal = false;
    var casseteSignal = false;

    var keyboardRowSelected = 0;

    var bus;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            c: registerC
        };
    };

    this.loadState = function(s) {
        registerC = s.c || 0;
        updateKeyboardConfig(registerC);
        updateCassetteSignal(registerC);
    };

};