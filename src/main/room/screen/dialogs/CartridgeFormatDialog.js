// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CartridgeFormatDialog = function(screen, mainElement, machine, cartridgeSlot) {
"use strict";

    var self = this;

    this.show = function (pPort, pAltPower) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pPort, pAltPower);
            }, 0);
        }

        port = pPort;
        altPower = pAltPower;
        cartridge = cartridgeSlot.cartridgeInserted(port);
        if (!cartridge) return;

        format = cartridge.format.name;
        saveFormat = !!userROMFormats.getForROM(cartridge.rom);
        saveFormatEnabled = !!cartridge.rom.info.h;             // No save when hash unavailable

        visible = true;
        dialog.classList.add("wmsx-show");
        refreshList();
        dialog.focus();

        wmsx.Util.scaleToFitParentHeight(dialog, mainElement, wmsx.ScreenGUI.BAR_HEIGHT);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm) {
            var formatName = userFormatOptions[optionSelected];
            var isAuto = formatName === userFormatOptions[0];
            var newCart = wmsx.SlotCreator.changeCartridgeFormat(cartridge, wmsx.SlotFormats[formatName]);
            if (saveFormat) userROMFormats.setForROM(cartridge.rom, formatName, isAuto);
            cartridgeSlot.insertCartridge(newCart, port, altPower || !machine.powerIsOn, true);
            screen.showOSD("ROM Format: " + formatName + (isAuto ? " (Auto)" : ""), true);
        }
        cartridge = undefined;
    };

    function refreshList() {
        optionSelected = 0;
        cartridge.reinsertROMContent();
        userFormatOptions = wmsx.SlotCreator.getUserFormatOptionNames(cartridge.rom);
        var autoOption = wmsx.SlotCreator.getBestFormatOption(cartridge.rom);
        if (!autoOption) autoOption = wmsx.SlotFormats.Normal;  // default
        userFormatOptions.unshift(autoOption.name);
        for (var i = 0; i < listItems.length; ++i) {
            if (i < userFormatOptions.length) {
                if (userFormatOptions[i] === format) optionSelected = i;
                listItems[i].innerHTML = i === 0 ? "AUTO: " + autoOption.name : userFormatOptions[i];
                listItems[i].classList.add("wmsx-visible");
            } else
                listItems[i].classList.remove("wmsx-visible");
        }
        if (cartridge.format === autoOption) optionSelected = 0;
        refreshListSelection();
        refreshSaveFormat();
    }

    function refreshListSelection() {
        var selItem;
        for (var i = 0; i < userFormatOptions.length; ++i) {
            if (i === optionSelected) {
                selItem = listItems[i];
                selItem.classList.add("wmsx-selected");
            } else
                listItems[i].classList.remove("wmsx-selected");
        }

        // Scroll to selected item if needed
        if (list.scrollTop > selItem.offsetTop) {
            list.scrollTop = selItem.offsetTop;
        } else if (list.scrollTop + list.offsetHeight < selItem.offsetTop + 26 + 2) {
            list.scrollTop = selItem.offsetTop - (list.offsetHeight - 26 - 2);        // item height ~ 26px
        }
    }

    function refreshSaveFormat() {
        saveButton.textContent = saveFormatEnabled ? saveFormat ? "YES" : "NO" : "- -";
        saveButton.classList.toggle("wmsx-selected", saveFormat);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-cartridge-format";
        dialog.classList.add("wmsx-select-dialog");
        dialog.style.width = "280px";
        dialog.style.height = "374px";
        dialog.tabIndex = -1;

        var header = document.createTextNode("Select ROM Format");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');
        for (var i = 0, len = wmsx.SlotFormatsUserOptions.length + 1; i < len; ++i) {   // + 1 for Auto
            var li = document.createElement("li");
            li.wmsxIndex = i;
            li.classList.add("wmsx-visible");
            li.style.textAlign = "center";
            listItems.push(li);
            list.appendChild(li);
        }
        dialog.appendChild(list);

        // Define Remember selection option
        var wDiv = document.createElement('div');
        var ul = document.createElement('ul');
        ul.classList.add("wmsx-quick-options-list");
        li = document.createElement('li');
        var div = document.createElement('div');
        div.innerHTML = "&#128190;&nbsp; Remember Choice";
        li.appendChild(div);
        saveButton = document.createElement('div');
        saveButton.innerHTML = "NO";
        saveButton.classList.add("wmsx-control");
        li.appendChild(saveButton);
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

        // Select with tap or mousedown
        wmsx.Util.onTapOrMouseDownWithBlock(dialog, function(e) {
            if (e.target.wmsxIndex >= 0) {
                wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                optionSelected = e.target.wmsxIndex;
                refreshListSelection();
                setTimeout(hideConfirm, 120);
            }
        });

        // Toggle Save Format option with tap or mousedown
        wmsx.Util.onTapOrMouseDownWithBlock(saveButton, function(e) {
            if (!saveFormatEnabled) return;
            wmsx.ControllersHub.hapticFeedbackOnTouch(e);
            saveFormat = !saveFormat;
            refreshSaveFormat();
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
                optionSelected += SELECT_KEYS[keyCode];
                if (optionSelected < 0) optionSelected = 0; else if (optionSelected >= userFormatOptions.length) optionSelected = userFormatOptions.length - 1;
                refreshListSelection();
            }
            return wmsx.Util.blockEvent(e);
        });
    }


    var port = 0;
    var altPower = false;
    var cartridge;
    var format = "";
    var optionSelected = 0;
    var userFormatOptions = [];

    var dialog, list, saveButton;
    var listItems = [];
    var visible = false;
    var saveFormat = false, saveFormatEnabled = false;

    var userROMFormats = WMSX.userROMFormats;

    var domKeys = wmsx.DOMKeys;

    var ESC_KEY = domKeys.VK_ESCAPE.wc;
    var CONFIRM_KEYS = [ domKeys.VK_ENTER.wc, domKeys.VK_SPACE.wc ];
    var SELECT_KEYS = {};
    SELECT_KEYS[domKeys.VK_UP.wc] = -1;
    SELECT_KEYS[domKeys.VK_DOWN.wc] = 1;

};