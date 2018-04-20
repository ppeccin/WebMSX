// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

// TODO Accept ESC only when Locked
wmsx.KeyboardConfigurator = function(controllersHub, modalElement, machineTypeSocket) {
"use strict";

    var self = this;

    function init() {
        japanese = machineTypeSocket.isJapaneseMachine();
        setupKeyboard();
    }

    this.keyboardSettingsStateUpdate = function() {
        this.refresh();
    };

    this.refresh = function() {
        keyboardNameElement.innerHTML = "Host Layout:&nbsp;&nbsp;" + domKeyboard.getCurrentKeyboardDesc();
        refreshUnmappedIndicator();
    };

    this.refreshForJapanese = function() {
        var jap = machineTypeSocket.isJapaneseMachine();
        if (jap !== japanese) {
            japanese = jap;
            wmsx.VirtualKeyboard.updateKeysLabels(keysElements, false, japanese);
        }
    };

    this.getMappingForControl = function(key) {
        return domKeyboard.getKeyMapping(msxKeyEditing) || [];
    };

    this.customizeControl = function(key, port, mapping) {
        domKeyboard.customizeKey(key, mapping);
        self.refresh();
        updatePopup();
    };

    this.cancelKeyEditing = function() {
        keyEditingLocked = false;
        mouseLeaveKey();
    };

    this.clearControlEditing = function() {
        if (!msxKeyEditing) return;
        domKeyboard.clearKey(msxKeyEditing);
        self.refresh();
        updatePopup();
    };

    function setupKeyboard() {
        keyboardNameElement = document.getElementById("wmsx-inputs-keyboard-name");
        keyboardNameElement.addEventListener("click", function() { controllersHub.toggleKeyboardLayout(); });

        modalElement.addEventListener("mousedown", mouseDownModal, true);

        keyboardElement = document.getElementById("wmsx-keyboard");
        keysElements = wmsx.VirtualKeyboard.create(keyboardElement, function(keyElement) {
            if (keyElement.wmsxKey) keyElements.push(keyElement);
            keyElement.addEventListener("mouseenter", mouseEnterKey);
            keyElement.addEventListener("mouseleave", mouseLeaveKey);
        }, false, japanese);
    }

    function mouseDownModal(e) {
        var msxKey = e.target.wmsxKey;
        if (msxKey) {
            if (msxKeyEditing === msxKey) {
                if (e.which === 1) keyEditingLocked = !keyEditingLocked;
                else if (e.which === 3) domKeyboard.clearKey(msxKeyEditing);
            } else {
                keyElementEditing = e.target;
                msxKeyEditing = keyElementEditing.wmsxKey;
                keyEditingLocked = e.which === 1;
            }
        } else {
            keyEditingLocked = false;
            mouseLeaveKey();
        }

        self.refresh();
        updatePopup();
    }

    function mouseEnterKey(e) {
        if (keyEditingLocked) return;
        if (e.target.wmsxKey) {
            keyElementEditing = e.target;
            msxKeyEditing = keyElementEditing.wmsxKey;
            updatePopup()
        } else
            mouseLeaveKey();
    }

    function mouseLeaveKey() {
        if (keyEditingLocked) return;
        keyElementEditing = msxKeyEditing = null;
        updatePopup();
    }

    function updatePopup() {
        if (!msxKeyEditing) {
            popup.hide();
            modalElement.focus();
            return;
        }

        // Position
        var keyRec = keyElementEditing.getBoundingClientRect();
        var x = keyRec.left + keyRec.width / 2;
        var y = keyRec.top;

        popup.show(self, msxKeyEditing, 0, x, y, POPUP_HEADING, POPUP_FOOTER, keyEditingLocked);
    }

    function refreshUnmappedIndicator() {
        for (var k = 0; k < keyElements.length; ++k) {
            var map = domKeyboard.getKeyMapping(keyElements[k].wmsxKey);
            keyElements[k].classList.toggle("wmsx-keyboard-key-unmapped", !map || map.length === 0);
        }
    }

    var keyboardElement, keysElements;
    var domKeyboard = controllersHub.getKeyboard();

    var keyElements = [];
    var keyElementEditing = null, msxKeyEditing = null, keyEditingLocked = false;
    var keyboardNameElement;

    var japanese = false;

    var popup = wmsx.ControlMappingPopup.get();

    var POPUP_HEADING = "Key mapped to host keys:";
    var POPUP_FOOTER = "Press new key.<br>(click to lock, right-click to clear)";


    init();

};
