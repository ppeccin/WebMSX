// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PasteDialog = function(mainElement, screen, keyboard) {
"use strict";

    var self = this;

    this.toggle = function() {
        if (this.cover && this.cover.style.visibility === "visible") this.hide();
        else this.show();
    };

    this.show = function () {
        keyboard.cancelTypeString();
        if (!this.cover) {
            create();
            self.show();
            return;
        }
        setTimeout(function() {
            self.cover.classList.add("wmsx-show");
            self.cover.wmsxOpen = true;
            self.box.focus();
        }, 0);
    };

    this.hide = function () {
        if (!this.cover) return;
        self.cover.classList.remove("wmsx-show");
        self.cover.wmsxOpen = false;
        screen.focus();
    };

    var create = function () {
        self.cover = document.createElement("div");
        self.cover.id = "wmsx-paste-cover";
        mainElement.appendChild(self.cover);

        self.box = document.createElement("input");
        self.box.id = "wmsx-paste-box";
        self.box.value = "\uD83D\uDCCB   PASTE NOW";
        self.box.readOnly = "readonly";
        self.box.innerHTML = "PASTE NOW!";
        self.cover.appendChild(self.box);

        setEvents();
    };

    var setEvents = function () {
        // Close the modal with ESC or ALT-V/Ins. Ignore common keys like SPACE, ENTER, ARROWS, etc
        self.cover.addEventListener("keydown", function (e) {
            e.stopPropagation();

            // Close
            if (e.keyCode === ESC_KEY || ((e.keyCode === EXIT_KEY || e.keyCode === EXIT_KEY2) && e.altKey && !e.ctrlKey && !e.shiftKey)) {
                e.preventDefault();
                self.hide();
                return;
            }

           // Block default
           if (e.preventDefault && ALLOW_DEFAULT_KEYS.indexOf(e.keyCode) < 0) e.preventDefault();
        });

        // Close the modal with a click outside the box...
        self.cover.addEventListener("mousedown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.hide();
        });
        // ... but not with a click inside
        self.box.addEventListener("mousedown", function (e) {
            e.stopPropagation();
        });

        // Capture the paste event
        self.box.addEventListener("paste", function(e) {
            if (!self.cover.wmsxOpen) return;

            if (e.clipboardData && e.clipboardData.getData) {
                var str = e.clipboardData.getData("text/plain");
                if (str) {
                    self.hide();
                    keyboard.typeString(str);
                }
            }
        });
    };

    this.cover = null;
    this.box = null;

    var k = wmsx.DOMKeys;
    var ALLOW_DEFAULT_KEYS = [
        k.VK_V.c, k.VK_INSERT.c
    ];
    var ESC_KEY = k.VK_ESCAPE.c, EXIT_KEY = k.VK_V.c, EXIT_KEY2 = k.VK_INSERT.c;

};
