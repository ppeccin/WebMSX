// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MachineSelectDialog = function(mainElement, machineTypeSocket, peripheralControls) {
"use strict";

    var self = this;

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        visible = true;
        machineSelected = machineTypeSocket.getMachine();
        dialog.classList.add("wmsx-show");
        dialog.focus();
        refresh();

        var availHeight = mainElement.clientHeight - wmsx.ScreenGUI.BAR_HEIGHT - 20;      //  bar - tolerance
        var height = dialog.clientHeight;
        var scale = height < availHeight ? 1 : availHeight / height;
        dialog.style.transform = "translateY(-" + ((wmsx.ScreenGUI.BAR_HEIGHT / 2) | 0) + "px) scale(" + scale.toFixed(4) + ")";

        //console.error("MACHINE SEL SCALE availHeight: " + availHeight + ", height: " + height + ", final: " + height * scale);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm) peripheralControls.processControlActivated(wmsx.PeripheralControls.MACHINE_SELECT, false, false, machineSelected);
    };

    this.machineTypeStateUpdate = function() {
        if (!visible) return;
        machineSelected = machineTypeSocket.getMachine();
        refresh();
    };

    function refresh() {
        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            li.classList.toggle("wmsx-selected", li.wmsxMachine === machineSelected);
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-machineselect";
        dialog.classList.add("wmsx-select-dialog");
        dialog.style.width = "280px";
        dialog.tabIndex = -1;

        var header = document.createTextNode("Select Machine");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');
        list.style.width = "80%";
        var height = 43;

        for (var i = 0; i < machines.length; ++i) {
            if (!WMSX.MACHINES_CONFIG[machines[i]].type) continue;       // Exclude EMPTY and AUTO options from list
            var li = document.createElement("li");
            li.classList.add("wmsx-visible");
            li.style.textAlign = "center";
            li.innerHTML = WMSX.MACHINES_CONFIG[machines[i]].desc;
            li.wmsxMachine = machines[i];
            listItems.push(li);
            list.appendChild(li);
            height += 33;
        }
        dialog.style.height = "" + height + "px";
        dialog.appendChild(list);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        function hideAbort()   { self.hide(false); }
        function hideConfirm() { self.hide(true); }

        // Do not close with taps or clicks inside, select with tap or mousedown
        wmsx.Util.onTapOrMouseDownWithBlock(dialog, function(e) {
            if (e.target.wmsxMachine) {
                wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                machineSelected = e.target.wmsxMachine;
                refresh();
                setTimeout(hideConfirm, 120);
            } else
                dialog.focus();
            return false;
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
                var idx = machines.indexOf(machineSelected) + SELECT_KEYS[keyCode];
                var newMachine = machines[idx];
                if (newMachine && WMSX.MACHINES_CONFIG[newMachine].type) {      // Exclude EMPTY and AUTO options
                    machineSelected = newMachine;
                    refresh();
                }
            }
            return wmsx.Util.blockEvent(e);
        });
    }


    var machines = Object.keys(WMSX.MACHINES_CONFIG);
    var machineSelected;

    var dialog, list;
    var listItems = [];
    var visible = false;

    var domKeys = wmsx.DOMKeysNew;

    var ESC_KEY = domKeys.VK_ESCAPE.wc;
    var CONFIRM_KEYS = [ domKeys.VK_ENTER.wc, domKeys.VK_SPACE.wc ];
    var SELECT_KEYS = {};
        SELECT_KEYS[domKeys.VK_UP.wc] = -1;
        SELECT_KEYS[domKeys.VK_DOWN.wc] = 1;

};