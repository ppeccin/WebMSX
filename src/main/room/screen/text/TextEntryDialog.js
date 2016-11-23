// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.TextEntryDialog = function(mainElement, screen, keyboard) {
    "use strict";

    var self = this;

    this.toggle = function() {
        if (visible) this.hide();
        else this.show();
    };

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        visible = true;
        dialog.classList.add("wmsx-show");
        dialog.focus();
    };

    this.hide = function() {
        visible = false;
        dialog.classList.remove("wmsx-show");
        WMSX.room.screen.focus();
    };

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-text-entry-dialog";
        dialog.tabIndex = -1;

        input = document.createElement("input");
        input.id = "wmsx-text-entry-input";
        dialog.appendChild(input);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            //e.preventDefault();
            e.stopPropagation();

            // Abort
            if (e.keyCode === ESC_KEY) self.hide();
            // Confirm
            //else if (CONFIRM_KEYS.indexOf(e.keyCode) >= 0) self.hide();

            //return false;
        });

        // Hide on lost focus
        //if ("onblur" in document) dialog.addEventListener("blur", self.hide, true);
        //else dialog.addEventListener("focusout", self.hide, true);

        // Supress context menu
        dialog.addEventListener("contextmenu", function stopContextMenu(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

    }


    var visible = false;
    var dialog, input;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ k.VK_ENTER.c ];

};
