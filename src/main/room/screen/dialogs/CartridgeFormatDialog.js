// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CartridgeFormatDialog = function(mainElement, cartridgeSocket) {
"use strict";

    var self = this;

    this.show = function (pPort) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pPort);
            }, 0);
        }

        port = pPort;
        cartridge = cartridgeSocket.cartridgeInserted(port);
        if (!cartridge) return;

        format = cartridge.format.name;
        visible = true;
        refreshList();
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
            var option = allFormatOptions[optionSelected];
            var control = port ? option.save : option.load;
            if (option.peripheral) peripheralControls.processControlActivated(control);
            else machineControls.processControlState(control, true);
        }
        cartridge = undefined;
    };

    function refreshList() {
        optionSelected = 0;
        cartridge.reinsertROMContent();
        userFormatOptions = wmsx.SlotCreator.getUserFormatOptionNames(cartridge.rom);
        var autoOption = wmsx.SlotCreator.getBestFormatOption(cartridge.rom);
        if (!autoOption) autoOption = wmsx.SlotFormats.Normal;  // default
        // Special case for Normal (Mirrored or NotMirrored)
        if (autoOption === wmsx.SlotFormats.Normal && cartridge.originalFormatName)
            autoOption = wmsx.SlotFormats[cartridge.originalFormatName];
        userFormatOptions.unshift(autoOption.name);
        for (var i = 0; i < listItems.length; ++i) {
            if (i < userFormatOptions.length) {
                if (userFormatOptions[i] === format) optionSelected = i;
                listItems[i].innerHTML = i === 0 ? "AUTO: " + autoOption.name : wmsx.SlotFormats[userFormatOptions[i]].name;
                listItems[i].classList.add("wmsx-visible");
            } else
                listItems[i].classList.remove("wmsx-visible");
        }
        if (autoOption && cartridge.format === autoOption) optionSelected = 0;
        refreshListSelection();
    }

    function refreshListSelection() {
        for (var i = 0; i < userFormatOptions.length; ++i)
            listItems[i].classList.toggle("wmsx-selected", i === optionSelected);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-cartridge-format";
        dialog.classList.add("wmsx-select-dialog");
        dialog.style.width = "280px";
        dialog.style.height = "" + (43 + 10 * 33) + "px";
        dialog.tabIndex = -1;

        header = document.createTextNode("Select ROM Format");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');
        list.style.width = "80%";

        for (var i = 0; i < allFormatOptions.length; ++i) {
            var li = document.createElement("li");
            li.wmsxIndex = i;
            li.classList.add("wmsx-visible");
            // if (i < allFormatOptions.length - 1) li.classList.add("wmsx-toggle");
            li.style.textAlign = "center";
            li.innerHTML = allFormatOptions[i];
            li.wmsxFormat = allFormatOptions[i];
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
                optionSelected = e.target.wmsxIndex;
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
                optionSelected += SELECT_KEYS[e.keyCode];
                if (optionSelected < 0) optionSelected = 0; else if (optionSelected >= userFormatOptions.length) optionSelected = userFormatOptions.length - 1;
                refreshListSelection();
            }
            return wmsx.Util.blockEvent(e);
        });
    }


    var port = 0;
    var cartridge;
    var format = "";
    var optionSelected = 0;
    var userFormatOptions = [];

    var dialog, list;
    var listItems = [];
    var visible = false;
    var header;

    var allFormatOptions = wmsx.SlotFormatsUserOptions;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[k.VK_UP.c] = -1;
    SELECT_KEYS[k.VK_DOWN.c] = 1;

};