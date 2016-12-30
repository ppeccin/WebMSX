// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SaveStateDialog = function(mainElement, machineControls, peripheralControls, stateMedia) {
"use strict";

    var self = this;

    this.show = function (pSave) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pSave);
            }, 0);
        }

        save = pSave;
        visible = true;
        refreshList();
        dialog.classList.add("wmsx-show");
        dialog.focus();

        var availHeight = mainElement.clientHeight - wmsx.ScreenGUI.BAR_HEIGHT - 20;      //  bar - tolerance
        var height = dialog.clientHeight;
        var scale = height < availHeight ? 1 : availHeight / height;
        dialog.style.transform = "translateY(-" + ((wmsx.ScreenGUI.BAR_HEIGHT / 2) | 0) + "px) scale(" + scale.toFixed(4) + ")";

        //console.error("SAVESTATE availHeight: " + availHeight + ", height: " + height + ", final: " + height * scale);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm) {
            var option = slotOptions[slotSelected];
            var control = save ? option.save : option.load;
            if (option.peripheral) peripheralControls.controlActivated(control);
            else machineControls.controlStateChanged(control, true);
        }
    };

    function refreshList() {
        header.textContent = "Select Slot to " + (save ? "Save" : "Load");
        var prefix = save ? "Save to " : "Load from ";
        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            li.innerHTML = prefix + slotOptions[i].d;
            li.classList.toggle("wmsx-selected", i === slotSelected);
            li.classList.toggle("wmsx-toggle-checked", stateMedia.isSlotUsed(i));
        }
        refreshListSelection();
    }

    function refreshListSelection() {
        for (var i = 0; i < listItems.length; ++i)
            listItems[i].classList.toggle("wmsx-selected", i === slotSelected);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-savestate";
        dialog.classList.add("wmsx-select-dialog");
        dialog.style.width = "280px";
        dialog.style.height = "" + (43 + 11 * 33) + "px";
        dialog.tabIndex = -1;

        header = document.createTextNode("Select Slot");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');
        list.style.width = "80%";

        for (var i = 0; i < slotOptions.length; ++i) {
            var li = document.createElement("li");
            li.classList.add("wmsx-visible");
            if (i < slotOptions.length - 1) li.classList.add("wmsx-toggle");
            li.style.textAlign = "center";
            li.innerHTML = slotOptions[i].d;
            li.wmsxSlot = i;
            li.wmsxNeedsUIG = true;         // Will open dialog or download file!
            listItems.push(li);
            list.appendChild(li);
        }
        dialog.appendChild(list);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        function hideAbort()   { self.hide(false); }
        function hideConfirm() { self.hide(true); }

        // Do not close with taps or clicks inside
        wmsx.Util.onTapOrMouseDownWithBlock(dialog, function() {
            dialog.focus();
        });

        // Select with tap or mousedown (UIG)
        wmsx.Util.onTapOrMouseDownWithBlockUIG(dialog, function(e) {
            if (e.target.wmsxSlot >= 0) {
                wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                slotSelected = e.target.wmsxSlot;
                refreshListSelection();
                setTimeout(hideConfirm, 120);
            }
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            // Abort
            if (e.keyCode === ESC_KEY) hideAbort();
            // Confirm
            else if (CONFIRM_KEYS.indexOf(e.keyCode) >= 0) hideConfirm();
            // Select
            else if (SELECT_KEYS[e.keyCode]) {
                slotSelected += SELECT_KEYS[e.keyCode];
                if (slotSelected < 0) slotSelected = 0; else if (slotSelected > 10) slotSelected = 10;
                refreshListSelection();
            }
            return wmsx.Util.blockEvent(e);
        });
    }


    var save = false;
    var slotSelected = 0;

    var dialog, list;
    var listItems = [];
    var visible = false;
    var header;

    var c = wmsx.MachineControls;
    var p = wmsx.PeripheralControls;
    var slotOptions = [
        { d: "Slot 1", load: c.LOAD_STATE_1,            save: c.SAVE_STATE_1 },
        { d: "Slot 2", load: c.LOAD_STATE_2,            save: c.SAVE_STATE_2 },
        { d: "Slot 3", load: c.LOAD_STATE_3,            save: c.SAVE_STATE_3 },
        { d: "Slot 4", load: c.LOAD_STATE_4,            save: c.SAVE_STATE_4 },
        { d: "Slot 5", load: c.LOAD_STATE_5,            save: c.SAVE_STATE_5 },
        { d: "Slot 6", load: c.LOAD_STATE_6,            save: c.SAVE_STATE_6 },
        { d: "Slot 7", load: c.LOAD_STATE_7,            save: c.SAVE_STATE_7 },
        { d: "Slot 8", load: c.LOAD_STATE_8,            save: c.SAVE_STATE_8 },
        { d: "Slot 9", load: c.LOAD_STATE_9,            save: c.SAVE_STATE_9 },
        { d: "Slot 10", load: c.LOAD_STATE_10,          save: c.SAVE_STATE_10 },
        { d: "File",   load: p.MACHINE_LOAD_STATE_FILE, save: p.MACHINE_SAVE_STATE_FILE, peripheral: true }
    ];

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[k.VK_UP.c] = -1;
    SELECT_KEYS[k.VK_DOWN.c] = 1;

};