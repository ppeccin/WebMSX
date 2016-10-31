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
    };

    this.touchControlDetected = function(control) {
        editing = control;
        refresh();
    };

    function refresh() {

        console.log(editing);

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

        var keys = Object.keys(wmsx.KeyboardKeys);
        buttonSequence = [ null ];
        buttonSequence.push(wmsx.JoystickButtons.A);
        buttonSequence.push(wmsx.JoystickButtons.B);
        buttonSequence.push(wmsx.JoystickButtons.AB);
        for (var k in keys) buttonSequence.push(wmsx.KeyboardKeys[k]);
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
                var idx = machines.indexOf(machineSelected) + SELECT_KEYS[e.keyCode];
                var newMachine = machines[idx];
                if (newMachine && WMSX.MACHINES_CONFIG[newMachine].type) {      // Exclude EMPTY and AUTO options
                    //machineSelected = newMachine;
                    refresh();
                }
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

};
