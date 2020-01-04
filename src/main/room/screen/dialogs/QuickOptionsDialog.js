// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.QuickOptionsDialog = function(mainElement, machineTypeSocket, machineControls, peripheralControls) {
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

    this.machineTypeStateUpdate = function() {
        if (visible) refresh();
    };

    function refresh() {
        var machineType = machineTypeSocket.getMachineType();
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var report = item.peripheral ? peripheralControls.getControlReport(item.control) : machineControls.getControlReport(item.control);
            item.value = report.label;
            item.selected = report.active;
            controlsItems[i].wmsxText.innerText = item.value;
            controlsItems[i].classList.toggle("wmsx-selected", !!item.selected);
            if (item.machineType) item.element.classList.toggle("wmsx-hidden", item.machineType > machineType);
        }
        dialog.style.height = "" + (machineType >= wmsx.Machine.MACHINE_TYPE.MSXTR ? 386 : 352) + "px";
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-quick-options";
        dialog.tabIndex = -1;

        var mc = wmsx.MachineControls;
        var pc = wmsx.PeripheralControls;

        items = [
            { label: "NTSC / PAL",                    control: mc.VIDEO_STANDARD },
            { label: "R800 CPU Clock",                control: mc.R800_CLOCK_MODE,        machineType: wmsx.Machine.MACHINE_TYPE.MSXTR },
            { label: "Z80 CPU Clock",                 control: mc.Z80_CLOCK_MODE },
            { label: "VDP Clock",                     control: mc.VDP_CLOCK_MODE },
            { label: "Sprites Mode",                  control: mc.SPRITE_MODE },
            { label: "Turbo Fire",                    control: pc.TURBO_FIRE_TOGGLE,      peripheral: true },
            { label: "&#128190;&nbsp; VSync",         control: mc.VSYNCH },
            { label: "&#128190;&nbsp; CRT Filter",    control: pc.SCREEN_CRT_FILTER,      peripheral: true },
            { label: "&#128190;&nbsp; CRT Scanlines", control: pc.SCREEN_CRT_SCANLINES,   peripheral: true },
            { label: "&#128190;&nbsp; Audio Buffer",  control: pc.SPEAKER_BUFFER_TOGGLE,  peripheral: true }
        ];

        // Define list
        var list = document.createElement('ul');
        list.classList.add("wmsx-quick-options-list");

        for (var i = 0; i < items.length; ++i) {
            var li = document.createElement("li");
            items[i].element = li;
            var label = document.createElement("div");
            label.innerHTML = items[i].label;
            li.appendChild(label);
            var control = document.createElement("div");
            control.classList.add("wmsx-control");
            var b = document.createElement("button");
            b.wmsxControlItem = items[i];
            b.wmsxDec = true;
            b.classList.add("wmsx-control-dec");
            control.appendChild(b);
            var text = document.createElement("span");
            control.wmsxText = text;
            control.appendChild(text);
            b = document.createElement("button");
            b.wmsxControlItem = items[i];
            b.classList.add("wmsx-control-inc");
            control.appendChild(b);
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
                    peripheralControls.processControlActivated(item.control, false, e.target.wmsxDec);
                    refresh();
                } else
                    machineControls.processControlState(item.control, true, e.target.wmsxDec);    // will receive update notification and auto refresh
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
