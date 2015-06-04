// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function PPI(audioOutput) {

    this.connectEngine = function(pEngine) {
        engine = pEngine;
    };

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
    };

    this.inputA8 = function(port) {
        return engine.getPrimarySlotConfig();
    };

    this.outputA8 = function(port, val) {
        engine.setPrimarySlotConfig(val);
    };

    this.inputA9 = function(port) {
        return keyboardRowValues[keyboardRowSelected];
    };

    this.inputAA = function(port) {
        return registerC;
    };

    this.outputAA = function(port, val) {
        registerC  = val;
        updateKeyboardConfig(val);
        updateCasseteSignal(val);
    };

    this.outputAB = function(port, val) {
        if ((val & 0x01) === 0) registerC &= ~(1 << ((val & 0x0e) >>> 1));
        else registerC |= (1 << ((val & 0x0e) >>> 1));

        var bit = (val & 0x0e) >>> 1;
        if (bit <= 3 || bit === 7) {
            updateKeyboardConfig(registerC);
        } else if (bit === 5) {
            updateCasseteSignal(registerC);
        }
    };

    function updateKeyboardConfig(reg) {
        keyboardRowSelected = reg & 0x0f;
        if (keyClickSignal === ((reg & 0x80) > 0)) return;
        keyClickSignal = !keyClickSignal;
        audioOutput.setExternalAddedValue(keyClickSignal ? KEY_CLICK_AUDIO_VALUE : 0);
    }

    function updateCasseteSignal(val) {
        //audioOutput.setExternalAddedValue((registerC & 0x20) > 0 ? KEY_CLICK_AUDIO_VALUE : 0);
    }


    // Keyboard Socket interface

    this.keyboardKeyChanged = function(key, press) {
        if (press) keyboardRowValues[key[0]] &= ~(1 << key[1]);
        else keyboardRowValues[key[0]] |= (1 << key[1]);
    };


    var registerC = 0;
    var keyClickSignal = false;
    var casseteSignal = false;

    var keyboardRowSelected = 0;
    var keyboardRowValues = Util.arrayFill(new Array(16), 0xff);            // only 11 rows used

    var engine;

    var KEY_CLICK_AUDIO_VALUE = 0.24;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            c: registerC
        };
    };

    this.loadState = function(s) {
        registerC = s.c || 0;
        updateKeyboardConfig(registerC);
        keyboardRowValues = Util.arrayFill(new Array(16), 0xff);
    };

}