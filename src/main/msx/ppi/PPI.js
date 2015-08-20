// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PPI = function(audioOutput) {

    this.connectEngine = function(pEngine) {
        engine = pEngine;
    };

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
    };

    this.inputA8 = function() {
        return engine.getPrimarySlotConfig();
    };

    this.outputA8 = function(val) {
        engine.setPrimarySlotConfig(val);
    };

    this.inputA9 = function() {
        return keyboardRowValues[keyboardRowSelected];
    };

    this.inputAA = function() {
        return registerC;
    };

    this.outputAA = function(val) {
        if (registerC === val) return;
        registerC  = val;
        updateKeyboardConfig();
        updateCasseteSignal();
    };

    this.outputAB = function(val) {
        if ((val & 0x01) === 0) registerC &= ~(1 << ((val & 0x0e) >>> 1));
        else registerC |= (1 << ((val & 0x0e) >>> 1));

        var bit = (val & 0x0e) >>> 1;
        if (bit <= 3 || bit === 7) {
            updateKeyboardConfig();
        } else if (bit === 5) {
            updateCasseteSignal();
        }
    };

    function updateKeyboardConfig() {
        keyboardRowSelected = registerC & 0x0f;
        if (keyClickSignal === ((registerC & 0x80) > 0)) return;
        keyClickSignal = !keyClickSignal;
        audioOutput.setExternalSignal(keyClickSignal ? KEY_CLICK_AUDIO_VALUE : 0);
    }

    function updateCasseteSignal() {
        if (keyClickSignal === ((registerC & 0x20) > 0)) return;
        casseteSignal = !casseteSignal;
        audioOutput.setExternalSignal(casseteSignal ? KEY_CLICK_AUDIO_VALUE : 0);
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
    var keyboardRowValues = wmsx.Util.arrayFill(new Array(16), 0xff);            // only 11 rows used

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
        updateCasseteSignal(registerC);
        keyboardRowValues = wmsx.Util.arrayFill(new Array(16), 0xff);
    };

}