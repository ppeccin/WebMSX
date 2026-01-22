// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PasteDialog = function(mainElement, screen, machineControls) {
"use strict";

    var self = this;

    this.toggle = function() {
        if (cover && cover.style.visibility === "visible") this.hide();
        else this.show();
    };

    this.show = function () {
        if (!cover) {
            create();
            self.show();
            return;
        }
        setTimeout(function() {
            cover.classList.add("wmsx-show");
            box.focus();
            visible = true;
        }, 0);
    };

    this.hide = function () {
        if (!visible) return;
        cover.classList.remove("wmsx-show");
        visible = false;
        screen.focus();
    };

    var create = function () {
        cover = document.createElement("div");
        cover.id = "wmsx-paste-cover";
        mainElement.appendChild(cover);

        box = document.createElement("input");
        box.id = "wmsx-paste-box";
        box.value = "\uD83D\uDCCB   PASTE NOW";
        box.readOnly = "readonly";
        box.innerHTML = "PASTE NOW!";
        cover.appendChild(box);

        setEvents();
    };

    var setEvents = function () {
        // Do not close with taps or clicks inside
        wmsx.Util.onTapOrMouseDownWithBlock(cover, function() {
            box.focus();
        });

        // Close the modal with ESC or ALT-V/Ins. Ignore common keys like SPACE, ENTER, ARROWS, etc
        cover.addEventListener("keydown", function (e) {
            e.stopPropagation();
            var keyCode = domKeys.codeNewForKeyboardEvent(e);
            // Close
            if (keyCode === ESC_KEY || keyCode === EXIT_KEY1 || keyCode === EXIT_KEY2) {
                e.preventDefault();
                self.hide();
                return;
            }
           // Block default
           if (ALLOW_DEFAULT_KEYS.indexOf(keyCode) < 0) e.preventDefault();
        });

        // Capture the paste event
        box.addEventListener("paste", function(e) {
            if (!visible) return;

            if (e.clipboardData && e.clipboardData.getData) {
                var str = e.clipboardData.getData("text/plain");
                if (str) {
                    self.hide();
                    machineControls.processControlState(wmsx.MachineControls.TYPE_STRING, true, false, str);
                }
            }
        });
    };


    var cover, box;
    var visible = false;

    var domKeys = wmsx.DOMKeys;

    var ALLOW_DEFAULT_KEYS = [
        // Ctrl V, Shift Ins, Shift Num-Ins
        domKeys.VK_V.wc | domKeys.CONTROL, domKeys.VK_INSERT.wc | domKeys.SHIFT, domKeys.VK_NUM_0.wc | domKeys.SHIFT
    ];
    var ESC_KEY = domKeys.VK_ESCAPE.wc, EXIT_KEY1 = domKeys.VK_V.wc | domKeys.ALT, EXIT_KEY2 = domKeys.VK_INSERT.wc | domKeys.ALT;

};
