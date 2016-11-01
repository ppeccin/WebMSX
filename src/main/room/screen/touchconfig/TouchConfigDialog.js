// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.TouchConfigDialog = function(mainElement, touchControls) {
    "use strict";

    var self = this;

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        visible = true;
        dialog.classList.add("wmsx-show");
        dialog.focus();
        touchControls.startTouchDetection(self);
        refresh();
    };

    this.hide = function (confirm) {
        touchControls.stopTouchDetection(self);
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm);   // TODO Save
    };

    this.touchControlDetected = function(control) {
        editing = control;
        refresh();
    };

    function refresh() {
        if (editing === "T_DIR") {
            directional.classList.add("wmsx-show");
            button.classList.remove("wmsx-show");
            wmsx.DOMTouchControls.styleDirectionalMapping(directional, prefs.directional);
        } else {
            button.classList.add("wmsx-show");
            directional.classList.remove("wmsx-show");
            wmsx.DOMTouchControls.styleButtonMapping(button, prefs.buttons[editing]);
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-touch-config";
        dialog.tabIndex = -1;

        header = document.createElement("div");
        header.innerHTML = "Tap Control<br>to modify mapping";
        dialog.appendChild(header);

        minus = document.createElement("div");
        minus.id = "wmsx-touch-config-minus";
        dialog.appendChild(minus);

        plus = document.createElement("div");
        plus.id = "wmsx-touch-config-plus";
        dialog.appendChild(plus);

        directional = wmsx.DOMTouchControls.createDirectional("wmsx-touch-config-dir");
        dialog.appendChild(directional);

        button = wmsx.DOMTouchControls.createButton("wmsx-touch-config-button");
        dialog.appendChild(button);

        setupEvents();

        mainElement.appendChild(dialog);

        prefs = WMSX.userPreferences.current.touch;

        dirSequence = [ "JOYSTICK", "KEYBOARD"];

        buttonSequence = [ null ];
        buttonSequence.push(wmsx.JoystickButtons.J_A.button);
        buttonSequence.push(wmsx.JoystickButtons.J_B.button);
        buttonSequence.push(wmsx.JoystickButtons.J_AB.button);
        for (var k in wmsx.KeyboardKeys) buttonSequence.push(k);
    }

    function setupEvents() {
        function hideAbort()   { self.hide(false); }
        function hideConfirm() { self.hide(true); }

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Abort
            if (e.keyCode === ESC_KEY) hideAbort();
            // Confirm
            else if (CONFIRM_KEYS.indexOf(e.keyCode) >= 0) hideConfirm();
            // Select
            else if (SELECT_KEYS[e.keyCode]) {
                var isDirectional = editing === "T_DIR";
                var sequence =  isDirectional ? dirSequence : buttonSequence;
                var mapping =   isDirectional ? prefs.directional : prefs.buttons[editing];
                var curButton = isDirectional ? mapping : mapping && (mapping.button || mapping.key);
                var curIdx = wmsx.Util.arrayFindIndex(sequence, function(x) {
                    return x === curButton
                });
                var newIdx = curIdx + SELECT_KEYS[e.keyCode];
                if (newIdx < 0) newIdx = 0; else if (newIdx >= sequence.length) newIdx = sequence.length - 1;
                var newMapping = sequence[newIdx];
                if (isDirectional) {
                    prefs.directional = newMapping;
                    touchControls.updateMappingFor(editing, newMapping);
                } else {
                    prefs.buttons[editing] = newMapping && (wmsx.JoystickButtons[newMapping] || wmsx.KeyboardKeys[newMapping]);
                    touchControls.updateMappingFor(editing, prefs.buttons[editing]);
                }
                refresh();
            }

            return false;
        });

        // Hide on lost focus
        //dialog.addEventListener("blur", hideAbort, true);
        //dialog.addEventListener("focusout", hideAbort, true);

        // Supress context menu
        dialog.addEventListener("contextmenu", function stopContextMenu(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }


    var visible = false;

    var dialog, header, directional, button, minus, plus;

    var dirSequence, buttonSequence;

    var editing = null;
    var prefs;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[k.VK_LEFT.c] = -1;
    SELECT_KEYS[k.VK_RIGHT.c] = 1;

};
