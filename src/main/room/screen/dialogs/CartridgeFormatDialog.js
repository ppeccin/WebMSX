// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Cartridge oririnalFormatName on Savestate, check scroll bar styling on browsers
wmsx.CartridgeFormatDialog = function(screen, mainElement, cartridgeSocket) {
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
            var newCart = wmsx.SlotCreator.changeCartridgeFormat(cartridge, wmsx.SlotFormats[formatName]);
            cartridgeSocket.insertCartridge(newCart, port);
            screen.showOSD("ROM Format: " + formatName + (optionSelected === 0 ? " (Auto)" : ""), true);
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
        if (autoOption === wmsx.SlotFormats.Normal) {
            var subNormal = cartridge.originalFormatName || cartridge.format.name;
            if (subNormal === "Mirrored" || subNormal === "NotMirrored")
                autoOption = wmsx.SlotFormats[subNormal];
        }
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
        if (list.scrollTop > selItem.offsetTop - 5) {       // margin top and bottom ~ 7px
            list.scrollTop = selItem.offsetTop - 5;
        } else if (list.scrollTop + list.offsetHeight < selItem.offsetTop + 26 + 5) {
            list.scrollTop = selItem.offsetTop - 7 - (list.offsetHeight - 26 - 7 - 7);        // item height ~ 26px
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-cartridge-format";
        dialog.classList.add("wmsx-select-dialog");
        dialog.style.width = "280px";
        dialog.style.height = "374px";
        dialog.tabIndex = -1;

        header = document.createTextNode("Select ROM Format");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');

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
            if (e.target.wmsxIndex >= 0) {
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