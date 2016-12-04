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
    };

    this.hide = function() {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
    };

    function refresh() {
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var report = item.peripheral ? peripheralControls.getControlReport(item.control) : machineControls.getControlReport(item.control);
            item.value = report.label;
            item.selected = report.active;
            listItems[i].innerHTML = item.value;
            listItems[i].classList.toggle("wmsx-selected", !!item.selected);
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-quick-options";
        dialog.tabIndex = -1;

        var mc = wmsx.MachineControls;
        var pc = wmsx.PeripheralControls;

        items = [
            { label: "NTSC / PAL",    control: mc.VIDEO_STANDARD },
            { label: "CPU Turbo",     control: mc.CPU_TURBO_MODE },
            { label: "Sprites Mode",  control: mc.SPRITE_MODE },
            { label: "Turbo Fire",    control: pc.TURBO_FIRE_TOGGLE,  peripheral: true }
        ];

        // Define list
        var labels = document.createElement('ul');
        var controls = document.createElement('ul');

        for (var i = 0; i < items.length; ++i) {
            var li = document.createElement("li");
            li.innerHTML = items[i].label;
            labels.appendChild(li);
            li = document.createElement("li");
            li.wmsxItem = i;
            li.classList.add("wmsx-control");
            listItems.push(li);
            controls.appendChild(li);
        }

        dialog.appendChild(labels);
        dialog.appendChild(controls);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        // Do not close with taps or clicks inside
        wmsx.Util.onEventsOrTapWithBlock(dialog, "mousedown", function() { dialog.focus(); });

        // Click or Tap on options
        for (var i = 0; i < items.length; ++i)
            wmsx.Util.onEventsOrTapWithBlock(listItems[i], "mousedown", controlClicked);

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            // Exit
            if (EXIT_KEYS.indexOf(e.keyCode) >= 0) self.hide();
            return wmsx.Util.blockEvent(e);
        });
    }

    function controlClicked(e) {
        wmsx.Util.hapticFeedbackOnTouch(e);
        var item = items[e.target.wmsxItem];
        if (item.peripheral) peripheralControls.controlActivated(item.control, false, false);
        else machineControls.controlStateChanged(item.control, true);
        refresh();
    }


    var visible = false;
    var dialog, list;
    var items, listItems = [];

    var k = wmsx.DOMKeys;
    var EXIT_KEYS = [ k.VK_ESCAPE.c, k.VK_ENTER.c, k.VK_SPACE.c ];

};
