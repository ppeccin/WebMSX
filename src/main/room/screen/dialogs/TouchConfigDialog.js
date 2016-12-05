// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.TouchConfigDialog = function(fsElement, mainElement, controllersHub, peripheralControls) {
    "use strict";

    var self = this;

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        visible = true;
        fsElement.classList.add("wmsx-touch-config-active");
        dialog.focus();
        editing = editingSequence = null; editingSeqIndex = -1;
        touchControls.startTouchDetection(self);
        refresh();
        refreshOptions();
    };

    this.hide = function() {
        if (!visible) return;
        touchControls.stopTouchDetection(self);
        WMSX.userPreferences.save();
        fsElement.classList.remove("wmsx-touch-config-active");
        visible = false;
        WMSX.room.screen.focus();
    };

    this.touchControlDetected = function(control, e) {
        wmsx.Util.hapticFeedbackOnTouch(e);

        editing = control;
        var isDirectional = editing === "T_DIR";
        editingSequence = isDirectional ? dirSequence : buttonSequence;
        var mapping = isDirectional ? prefs.directional : prefs.buttons[editing];
        var curMapping = isDirectional ? mapping : mapping && (mapping.button || mapping.key);
        editingSeqIndex = wmsx.Util.arrayFindIndex(editingSequence, function (x) {
            return x === curMapping
        });

        refresh();
    };

    this.controllersSettingsStateUpdate = function() {
        if (visible) refreshOptions();
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
        minus.classList.toggle("wmsx-disabled", editingSeqIndex <= 0);
        plus.classList.toggle("wmsx-disabled", !editingSequence || editingSeqIndex >= editingSequence.length - 1);
    }

    function refreshOptions() {
        var state = controllersHub.getSettingsState();
        var port = state.touchPortSet;
        var active = state.touchActive;

        optionsItems[0].innerHTML = port === 0 ? "Port 1" : port === 1 ? "Port 2" : "OFF";
        optionsItems[0].classList.toggle("wmsx-selected", port >= 0);
        optionsItems[0].classList.toggle("wmsx-inactive", !active);

        optionsItems[1].innerHTML = wmsx.Util.hapticFeedbackEnabled ? "ON" : "OFF";
        optionsItems[1].classList.toggle("wmsx-selected", wmsx.Util.hapticFeedbackEnabled);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-touch-config";
        dialog.tabIndex = -1;

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

        // Options and modes
        var items = [
            { label: "Touch Controller", control: wmsx.PeripheralControls.TOUCH_TOGGLE_MODE },
            { label: "Haptic Feedback",  control: wmsx.PeripheralControls.HAPTIC_FEEDBACK_TOGGLE_MODE }
        ];

        // Define list
        var list = document.createElement('ul');
        list.classList.add("wmsx-quick-options-list");

        for (var i = 0; i < items.length; ++i) {
            var li = document.createElement("li");
            var label = document.createElement("div");
            label.innerHTML = items[i].label;
            li.appendChild(label);
            var control = document.createElement("div");
            control.classList.add("wmsx-control");
            control.wmsxControlItem = items[i];
            li.appendChild(control);
            list.appendChild(li);
            optionsItems.push(control);
        }
        dialog.appendChild(list);

        setupEvents();

        mainElement.appendChild(dialog);

        dirSequence = [ "JOYSTICK", "KEYBOARD"];

        buttonSequence = [ null ];
        buttonSequence.push(wmsx.JoystickButtons.J_A.button);
        buttonSequence.push(wmsx.JoystickButtons.J_B.button);
        buttonSequence.push(wmsx.JoystickButtons.J_AB.button);
        for (var k in wmsx.KeyboardKeys) buttonSequence.push(k);

    }

    function modifyControl(inc, haptic) {
        if (!editing) return;
        editingSeqIndex += inc;
        if (editingSeqIndex < 0) return editingSeqIndex = 0;
        else if (editingSeqIndex >= editingSequence.length) return editingSeqIndex = editingSequence.length - 1;

        if (haptic) wmsx.Util.hapticFeedback();
        var newMapping = editingSequence[editingSeqIndex];
        if (!(editing === "T_DIR")) newMapping = newMapping && (wmsx.JoystickButtons[newMapping] || wmsx.KeyboardKeys[newMapping]);
        touchControls.customizeControl(editing, newMapping);
        refresh();
    }

    function setupEvents() {
        // Do not close with taps or clicks inside, select options buttons
        wmsx.Util.onEventsOrTapWithBlock(dialog, "mousedown", function(e) {
            if (e.target.wmsxControlItem) {
                peripheralControls.controlActivated(e.target.wmsxControlItem.control, true);
                refreshOptions();
            } else
                dialog.focus();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            // Exit
            if (EXIT_KEYS.indexOf(e.keyCode) >= 0) self.hide();
            // Select
            else if (SELECT_KEYS[e.keyCode]) modifyControl(SELECT_KEYS[e.keyCode]);
            return wmsx.Util.blockEvent(e);
        });

        // Clicking or tapping arrow buttons modify control
        wmsx.Util.addEventsListener(minus, "touchstart mousedown", function(e) { modifyButtonPressed(e, -1); });
        wmsx.Util.addEventsListener(plus,  "touchstart mousedown", function(e) { modifyButtonPressed(e, +1); });
        wmsx.Util.addEventsListener(minus, "touchend mouseup", modifyButtonReleased);
        wmsx.Util.addEventsListener(plus,  "touchend mouseup", modifyButtonReleased);
    }

    function modifyButtonPressed(e, inc) {
        modifyButtonReleased(e);
        var touch = e.type === "touchstart";
        modifyControl(inc, touch);
        modifyKeyTimeout = setTimeout(function repeat() {
            modifyControl(inc, touch);
            modifyKeyTimeout = setTimeout(repeat, 35);
        }, 400);
    }

    function modifyButtonReleased(e) {
        e.preventDefault();
        e.stopPropagation();
        if (modifyKeyTimeout) clearTimeout(modifyKeyTimeout);
    }


    var visible = false;
    var dialog, directional, button, minus, plus;
    var optionsItems = [];

    var editing, editingSequence, editingSeqIndex;
    var modifyKeyTimeout;
    var dirSequence, buttonSequence;

    var prefs = WMSX.userPreferences.current.touch;
    var touchControls = controllersHub.getTouchControls();

    var k = wmsx.DOMKeys;
    var EXIT_KEYS = [ k.VK_ESCAPE.c, k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[k.VK_LEFT.c] = -1;
    SELECT_KEYS[k.VK_RIGHT.c] = 1;

};
