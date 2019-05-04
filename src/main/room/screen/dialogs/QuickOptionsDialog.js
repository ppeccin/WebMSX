// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.QuickOptionsDialog = function(mainElement, machineControls, peripheralControls) {
    "use strict";

    var self = this;

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        refresh();
        visible = true;
        dialog.classList.add("wmsx-show");
        dialog.focus();

        wmsx.Util.scaleToFitParentHeight(dialog, mainElement, wmsx.ScreenGUI.BAR_HEIGHT);
    };

    this.hide = function() {
        if (!visible) return;
        WMSX.userPreferences.save();
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
    };

    this.quickOptionsControlsStateUpdate = function() {
        if (visible) refresh();
    };

    this.machineTurboModesStateUpdate = function() {
        if (visible) refresh();
    };

    function refresh() {
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var report = item.peripheral ? peripheralControls.getControlReport(item.control) : machineControls.getControlReport(item.control);
            item.value = report.label;
            item.selected = report.active;
            controlsItems[i].innerHTML = item.value;
            controlsItems[i].classList.toggle("wmsx-selected", !!item.selected);
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-quick-options";
        dialog.tabIndex = -1;

        var mc = wmsx.MachineControls;
        var pc = wmsx.PeripheralControls;

        items = [
            { label: "NTSC / PAL",                  control: mc.VIDEO_STANDARD },
            { label: "CPU Turbo",                   control: mc.CPU_TURBO_MODE },
            { label: "VDP Turbo",                   control: mc.VDP_TURBO_MODE },
            { label: "Sprites Mode",                control: mc.SPRITE_MODE },
            { label: "Turbo Fire",                  control: pc.TURBO_FIRE_TOGGLE,       peripheral: true },
            { label: "&#128190;&nbsp; V-Synch",     control: mc.VSYNCH },
            { label: "&#128190;&nbsp; CRT Filter",  control: pc.SCREEN_CRT_FILTER,       peripheral: true },
            { label: "&#128190;&nbsp; Audio Buffer", control: pc.SPEAKER_BUFFER_TOGGLE,  peripheral: true }
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
            controlsItems.push(control);
        }

        dialog.appendChild(list);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        // Do not close with taps or clicks inside, select with tap or mousedown
        wmsx.Util.onTapOrMouseDownWithBlock(dialog, function(e) {
            if (e.target.wmsxControlItem) {
                wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                var item = e.target.wmsxControlItem;
                if (item.peripheral) {
                    peripheralControls.processControlActivated(item.control, false, false);     // TODO Offer AltFunc
                    refresh();
                } else
                    machineControls.processControlState(item.control, true, false);    // TODO Offer AltFunc // will receive update notification and auto refresh
            } else
                dialog.focus();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            // Exit
            var keyCode = domKeys.codeNewForKeyboardEvent(e);
            if (EXIT_KEYS.indexOf(keyCode) >= 0) self.hide();
            return wmsx.Util.blockEvent(e);
        });
    }


    var visible = false;
    var dialog, list;
    var items, controlsItems = [];

    var domKeys = wmsx.DOMKeys;

    var EXIT_KEYS = [ domKeys.VK_ESCAPE.wc ];

};
