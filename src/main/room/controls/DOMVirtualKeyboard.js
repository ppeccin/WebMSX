// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMVirtualKeyboard = function(mainElement, keyboard, machineTypeSocket) {
"use strict";

    var self = this;

    function init() {
        machineTypeSocket.addMachineTypeStateListener(self);
        keyElements = wmsx.VirtualKeyboard.create(mainElement, setKeyEvents, shift, lang);
    }

    this.machineTypeStateUpdate = function() {
        var newLang = machineTypeSocket.getMachineLang();
        if (newLang !== lang) {
            lang = newLang;
            if (keyElements) wmsx.VirtualKeyboard.updateKeysLabels(keyElements, shift, lang);
        }
    };

    function setKeyEvents(keyElement) {
        keyElement.addEventListener("touchstart", keyTouchStart);
        keyElement.addEventListener("mousedown", keyTouchStart);
        keyElement.addEventListener("touchend", keyTouchEnd);
        keyElement.addEventListener("mouseup", keyTouchEnd);
    }

    function keyTouchStart(e) {
        blockEvent(e);
        var msxKey = e.target.wmsxKey;
        if (msxKey) {
            keyboard.processMSXKey(msxKey, true);
            if (msxKey === "SHIFT") updateForShift();
        }
    }

    function keyTouchEnd(e) {
        blockEvent(e);
        var msxKey = e.target.wmsxKey;
        if (msxKey) {
            keyboard.processMSXKey(msxKey, false);
            if (msxKey === "SHIFT") updateForShift();
        }
    }

    function updateForShift() {
        var shf = keyboard.isShiftPressed();
        if (shf !== shift) {
            shift = shf;
            if (keyElements) wmsx.VirtualKeyboard.updateKeysLabels(keyElements, shift, lang);
        }
    }

    function blockEvent(e) {
        e.stopPropagation();
        e.preventDefault();
    }


    var keyElements;
    var shift = false, lang = "en";

    init();

};