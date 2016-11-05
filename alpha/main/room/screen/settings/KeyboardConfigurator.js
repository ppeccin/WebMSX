// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.KeyboardConfigurator = function(controllersHub, returnFocusElement) {
"use strict";

    var self = this;

    function init() {
        setupKeyboard();
    }

    this.keyboardSettingsStateUpdate = function() {
        this.refresh();
    };

    this.refresh = function() {
        keyboardNameElement.innerHTML = "Current Keyboard:&nbsp;&nbsp;" + domKeyboard.getCurrentKeyboardDesc();
        refreshUnmappedIndicator();
    };

    this.getMappingForControl = function(key) {
        return domKeyboard.getKeyMapping(msxKeyEditing) || [];
    };

    this.customizeControl = function(key, port, mapping) {
        domKeyboard.customizeKey(key, mapping);
        self.refresh();
        updatePopup();
    };

    function setupKeyboard() {
        keyboardNameElement = document.getElementById("wmsx-inputs-keyboard-name");
        keyboardNameElement.addEventListener("click", function() { controllersHub.toggleKeyboardLayout(); });

        keyboardElement = document.getElementById("wmsx-keyboard");
        keyboardElement.addEventListener("mousedown", mouseDownKeyboard);

        wmsx.VirtualKeyboard.create(keyboardElement, function(keyElement) {
            if (keyElement.wmsxKey) keyElements.push(keyElement);
            keyElement.addEventListener("mouseenter", mouseEnterKey);
            keyElement.addEventListener("mouseleave", mouseLeaveKey);
        });
    }

    function mouseDownKeyboard(e) {
        if (msxKeyEditing && e.which === 3) domKeyboard.clearKey(msxKeyEditing);
        self.refresh();
        updatePopup();
    }

    function mouseEnterKey(e) {
        if (e.target.wmsxKey) {
            keyElementEditing = e.target;
            msxKeyEditing = keyElementEditing.wmsxKey;
            updatePopup()
        } else
            mouseLeaveKey();
    }

    function mouseLeaveKey() {
        keyElementEditing = msxKeyEditing = null;
        updatePopup();
    }

    function updatePopup() {
        if (!msxKeyEditing) {
            popup.hide();
            returnFocusElement.focus();
            return;
        }

        // Position
        var keyRec = keyElementEditing.getBoundingClientRect();
        var x = keyRec.left + keyRec.width / 2;
        var y = keyRec.top;

        popup.show(self, msxKeyEditing, 0, x, y, POPUP_HEADING, POPUP_FOOTER);
    }

    function refreshUnmappedIndicator() {
        for (var k = 0; k < keyElements.length; ++k) {
            var map = domKeyboard.getKeyMapping(keyElements[k].wmsxKey);
            keyElements[k].classList.toggle("wmsx-keyboard-key-unmapped", !map || map.length === 0);
        }
    }

    var keyboardElement;
    var domKeyboard = controllersHub.getKeyboard();

    var keyElements = [];
    var keyElementEditing = null, msxKeyEditing = null;
    var keyboardNameElement;

    var popup = wmsx.ControlMappingPopup.get();

    var POPUP_HEADING = "Key mapped to:";
    var POPUP_FOOTER = "Press new key.<br>(right-click to clear)";


    init();

};
