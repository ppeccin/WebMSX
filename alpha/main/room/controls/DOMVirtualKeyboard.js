// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMVirtualKeyboard = function(mainElement, keyboard) {
"use strict";

    var self = this;

    function init() {
        wmsx.VirtualKeyboard.create(mainElement, setKeyEvents);
    }

    function setKeyEvents(keyElement) {
        keyElement.addEventListener("touchstart", keyTouchStart);
        keyElement.addEventListener("touchend", keyTouchEnd);
    }

    function keyTouchStart(e) {
        blockEvent(e);
        var msxKey = e.target.wmsxKey;
        if (msxKey) keyboard.processMSXKey(msxKey, true);
    }

    function keyTouchEnd(e) {
        blockEvent(e);
        var msxKey = e.target.wmsxKey;
        if (msxKey) keyboard.processMSXKey(msxKey, false);
    }

    function blockEvent(e) {
        e.stopPropagation();
        e.preventDefault();
    }


    init();

};