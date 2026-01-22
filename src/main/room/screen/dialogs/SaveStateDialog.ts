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
        syncTime = WMSX.userPreferences.current.syncTimeLoadState;
        refresh();
        dialog.classList.add("wmsx-show");
        dialog.focus();

        wmsx.Util.scaleToFitParentHeight(dialog, mainElement, wmsx.ScreenGUI.BAR_HEIGHT);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm) {
            var option = slotOptions[slotSelected];
            var control = save ? option.save : option.load;
            if (option.peripheral) peripheralControls.processControlActivated(control);
            else machineControls.processControlState(control, true);
        }
    };

    function refresh() {
        dialog.classList.toggle("wmsx-load", !save);

        header.textContent = "Select Slot to " + (save ? "Save" : "Load");
        var prefix = save ? "Save to " : "Load from ";
        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            li.innerHTML = prefix + slotOptions[i].d;
            li.classList.toggle("wmsx-selected", i === slotSelected);
            li.classList.toggle("wmsx-toggle-checked", stateMedia.isSlotUsed(i + 1));
        }
        refreshListSelection();
        refreshSyncTime();
    }

    function refreshListSelection() {
        for (var i = 0; i < listItems.length; ++i)
            listItems[i].classList.toggle("wmsx-selected", i === slotSelected);
    }

    function refreshSyncTime() {
        syncButton.textContent = syncTime ? "YES" : "NO";
        syncButton.classList.toggle("wmsx-selected", syncTime);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-savestate";
        dialog.classList.add("wmsx-select-dialog");
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

        // Define Sync Time to Host option
        var wDiv = document.createElement('div');
        var ul = document.createElement('ul');
        ul.classList.add("wmsx-quick-options-list");
        li = document.createElement('li');
        var div = document.createElement('div');
        div.innerHTML = "&#128190;&nbsp; Sync time to Host";
        li.appendChild(div);
        syncButton = document.createElement('div');
        syncButton.innerHTML = "NO";
        syncButton.classList.add("wmsx-control");
        li.appendChild(syncButton);
        ul.appendChild(li);
        wDiv.appendChild(ul);
        dialog.appendChild(wDiv);

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
        wmsx.Util.onTapOrMouseDownWithBlockUIG(dialog, function(e, uigStart) {
            if (e.target.wmsxSlot >= 0) {
                if (uigStart) wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                slotSelected = e.target.wmsxSlot;
                refreshListSelection();
                if (!uigStart) setTimeout(hideConfirm, 120);  // UIG
            }
        });

        // Toggle Sync Time option with tap or mousedown
        wmsx.Util.onTapOrMouseDownWithBlock(syncButton, function(e) {
            wmsx.ControllersHub.hapticFeedbackOnTouch(e);
            syncTime = !syncTime;
            refreshSyncTime();
            WMSX.userPreferences.current.syncTimeLoadState = syncTime;
            WMSX.userPreferences.setDirty();
            WMSX.userPreferences.save();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            var keyCode = domKeys.codeNewForKeyboardEvent(e);
            // Abort
            if (keyCode === ESC_KEY) hideAbort();
            // Confirm
            else if (CONFIRM_KEYS.indexOf(keyCode) >= 0) hideConfirm();
            // Select
            else if (SELECT_KEYS[keyCode]) {
                slotSelected += SELECT_KEYS[keyCode];
                if (slotSelected < 0) slotSelected = 0; else if (slotSelected > 10) slotSelected = 10;
                refreshListSelection();
            }
            return wmsx.Util.blockEvent(e);
        });
    }


    var save = false;
    var slotSelected = 0;

    var dialog, list, syncButton;
    var listItems = [];
    var visible = false;
    var header;
    var syncTime = false;

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

    var domKeys = wmsx.DOMKeys;

    var ESC_KEY = domKeys.VK_ESCAPE.wc;
    var CONFIRM_KEYS = [ domKeys.VK_ENTER.wc, domKeys.VK_SPACE.wc ];
    var SELECT_KEYS = {};
    SELECT_KEYS[domKeys.VK_UP.wc] = -1;
    SELECT_KEYS[domKeys.VK_DOWN.wc] = 1;

};