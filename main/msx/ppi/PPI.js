// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function PPI() {

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
        return keyboardRowSelected | 0x50;
    };

    this.outputAA = function(port, val) {
        keyboardRowSelected = val & 0x0f;
    };

    this.outputAB = function(port, val) {
    };


    // Keyboard Socket interface

    this.keyboardKeyChanged = function(key, press) {
        if (press) keyboardRowValues[key[0]] &= ~(1 << key[1]);
        else keyboardRowValues[key[0]] |= (1 << key[1]);
    };


    var keyboardRowSelected = 0;
    var keyboardRowValues = Util.arrayFill(new Array(16), 0xff);            // only 11 rows used

    var engine;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
        };
    };

    this.loadState = function(s) {
        keyboardRowSelected = 0;
        keyboardRowValues = Util.arrayFill(new Array(16), 0xff);
    };

}