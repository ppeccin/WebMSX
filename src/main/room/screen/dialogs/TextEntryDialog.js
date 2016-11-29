// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.TextEntryDialog = function(mainElement, screen, keyboard) {
    "use strict";

    var self = this;

    this.toggle = function() {
        if (visible) this.hide(false);
        else this.show();
    };

    this.show = function () {
        if (!cover) {
            create();
            return setTimeout(self.show, 0);
        }

        cover.classList.add("wmsx-show");
        visible = true;
        input.focus();
    };

    this.hide = function(confirm) {
        if (!visible) return;
        cover.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm) keyboard.typeString(input.value);
    };

    function create() {
        cover = document.createElement("div");
        cover.id = "wmsx-text-entry-cover";

        dialog = document.createElement("div");
        dialog.id = "wmsx-text-entry-dialog";
        cover.appendChild(dialog);

        input = document.createElement("textarea");
        input.id = "wmsx-text-entry-input";
        input.spellcheck = false;
        input.autocorrect = false;
        input.autocapitalize = false;
        dialog.appendChild(input);

        topbar = document.createElement("div");
        topbar.id = "wmsx-text-entry-dialog-bar";
        dialog.appendChild(topbar);

        ok = document.createElement("div");
        ok.id = "wmsx-text-entry-dialog-ok";
        topbar.appendChild(ok);

        cancel = document.createElement("div");
        cancel.id = "wmsx-text-entry-dialog-cancel";
        topbar.appendChild(cancel);

        mainElement.appendChild(cover);

        setupEvents();
    }

    function setupEvents() {
        wmsx.Util.onEventOrTapWithBlock(ok, "mousedown", okCancelClicked);
        wmsx.Util.onEventOrTapWithBlock(cancel, "mousedown", okCancelClicked);

        // Close the modal with a click outside the dialog...
        wmsx.Util.onEventOrTapWithBlock(cover, "mousedown", function(e) {
            self.hide(false);
        });
        // ... but not with a click inside
        wmsx.Util.onEventOrTap(dialog, "mousedown", function(e) {
            e.stopPropagation();
        });

        // Trap keys, respond to some
        cover.addEventListener("keydown", function(e) {
            e.stopPropagation();

            // Confirm
            if (e.keyCode === CONFIRM_KEY && e.ctrlKey) {
                e.preventDefault();
                self.hide(true);
            }
            // Abort
            if (e.keyCode === ABORT_KEY || (e.keyCode === TOGGLE_KEY && e.altKey)) {
                e.preventDefault();
                self.hide(false);
            }
        });

        // Allow context menu in input
        input.addEventListener("contextmenu", function stopContextMenu(e) {
            e.stopPropagation();
        });
        // Allow mouse selection in input
        input.addEventListener("mousemove", function stopContextMenu(e) {
            e.stopPropagation();
        });
    }

    function okCancelClicked(e) {
        self.hide(e.target === ok);
    }


    var visible = false;
    var cover, dialog, topbar, input, ok, cancel;

    var k = wmsx.DOMKeys;
    var ABORT_KEY = k.VK_ESCAPE.c, TOGGLE_KEY = k.VK_B.c;
    var CONFIRM_KEY = k.VK_ENTER.c;

};
