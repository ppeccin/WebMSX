// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.TextEntryDialog = function(mainElement, screen, machineControls) {
    "use strict";

    var self = this;

    this.toggle = function() {
        if (visible) this.hide(false);
        else this.show();
    };

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        dialog.classList.add("wmsx-show");
        visible = true;
        input.focus();
    };

    this.hide = function(confirm) {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm) machineControls.processControlState(wmsx.MachineControls.TYPE_STRING, true, false, input.value);
    };

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-text-entry-dialog";
        dialog.tabIndex = -1;

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

        mainElement.appendChild(dialog);

        setupEvents();
    }

    function setupEvents() {
        // Do not close with taps or clicks inside, finish with ok or cancel button
        wmsx.Util.onTapOrMouseDownWithBlock(dialog, function(e) {
            if (e.target === ok || e.target === cancel) {
                wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                self.hide(e.target === ok);
            } else
                dialog.focus();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            e.stopPropagation();
            var keyCode = domKeys.codeNewForKeyboardEvent(e);
            // Confirm
            if (keyCode === CONFIRM_KEY) {
                e.preventDefault();
                self.hide(true);
            }
            // Abort
            if (keyCode === ABORT_KEY || keyCode === TOGGLE_KEY) {
                e.preventDefault();
                self.hide(false);
            }
        });

        // Allow context menu in input
        input.addEventListener("contextmenu", function stopContextMenu(e) {
            e.stopPropagation();
        });
        // Allow selection in input
        wmsx.Util.addEventsListener(input, "touchstart touchmove touchend mousedown mousemove mouseup", function(e) {
            e.stopPropagation();
        });
    }


    var visible = false;
    var dialog, topbar, input, ok, cancel;

    var domKeys = wmsx.DOMKeys;

    var ABORT_KEY = domKeys.VK_ESCAPE.wc, TOGGLE_KEY = domKeys.VK_B.wc | domKeys.ALT;
    var CONFIRM_KEY = domKeys.VK_ENTER.wc | domKeys.CONTROL;

};
