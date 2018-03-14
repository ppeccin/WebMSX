// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.NewHardDiskDialog = function(mainElement, peripheralControls) {
"use strict";

    var self = this;

    this.show = function(pAltPower, pBootable) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(altPower, pBootable);
            }, 0);
        }

        visible = true;
        altPower = pAltPower;
        bootable = pBootable;
        refreshListSelection();
        dialog.classList.add("wmsx-show");
        dialog.focus();

        wmsx.Util.scaleToFitParent(dialog, mainElement, wmsx.ScreenGUI.BAR_HEIGHT);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm) {
            var mediaType = mediaTypes[optionSelected];
            peripheralControls.processControlActivated(wmsx.PeripheralControls.HARDDISK_NEW, altPower, false, { m: mediaType, b: bootable });
        }
    };

    function refreshListSelection() {
        for (var i = 0; i < listItems.length; ++i)
            listItems[i].classList.toggle("wmsx-selected", i === optionSelected);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-new-hard-disk";
        dialog.classList.add("wmsx-select-dialog");
        dialog.style.width = "280px";
        dialog.style.height = "175px";
        dialog.tabIndex = -1;

        header = document.createTextNode("Select Disk Size");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');
        list.style.width = "80%";

        for (var i = 0; i < mediaTypes.length; ++i) {
            var li = document.createElement("li");
            li.classList.add("wmsx-visible");
            li.style.textAlign = "center";
            var info = mediaInfo[mediaTypes[i]];
            li.innerHTML = info.desc + " Disk &nbsp;&nbsp;&nbsp;" + info.secDesc;
            li.wmsxOption = i;
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

        // Select with tap or mousedown
        wmsx.Util.onTapOrMouseDownWithBlock(dialog, function(e) {
            if (e.target.wmsxOption >= 0) {
                wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                optionSelected = e.target.wmsxOption;
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
                if (optionSelected < 0) optionSelected = 0; else if (optionSelected >= listItems.length) optionSelected = listItems.length - 1;
                refreshListSelection();
            }
            return wmsx.Util.blockEvent(e);
        });
    }


    var save = false;
    var optionSelected = 0;

    var dialog, list;
    var listItems = [];
    var visible = false;
    var altPower = false;
    var bootable = false;
    var header;

    var mediaTypes = wmsx.DiskImages.HARDDISK_FORMAT_OPTIONS_MEDIA_TYPES;
    var mediaInfo = wmsx.DiskImages.MEDIA_TYPE_INFO;

    var c = wmsx.MachineControls;
    var p = wmsx.PeripheralControls;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[k.VK_UP.c] = -1;
    SELECT_KEYS[k.VK_DOWN.c] = 1;

};