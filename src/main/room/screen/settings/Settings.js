// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SettingsDialog = function(mainElement, controllersHub, peripheralControls, machineTypeSocket) {
"use strict";

    var self = this;

    this.show = function (atPage) {
        if (!modal) {
            create();
            setTimeout(function() {
                self.show(atPage);
            }, 0);
            return;
        }

        if (!this.position()) return;

        this.setPage(atPage || page);
        modal.classList.add("wmsx-show");
        modal.classList.add("wmsx-show");
        visible = true;
        setTimeout(function() {
            modal.focus();
        }, 50);
    };

    this.hide = function () {
        if (!visible) return;
        if (keyboardConfigurator) keyboardConfigurator.cancelKeyEditing();
        self.hideLesser();
        WMSX.room.screen.focus();
    };

    this.hideLesser = function () {
        WMSX.userPreferences.save();
        modal.classList.remove("wmsx-show");
        modal.classList.remove("wmsx-show");
        visible = false;
    };

    this.setPage = function (pPage) {
        if (keyboardConfigurator) keyboardConfigurator.cancelKeyEditing();
        page = pPage;

        var contentPosition = {
            "GENERAL": "0",
            "MEDIA":  "-600px",
            "INPUTS": "-1200px",
            "PORTS":  "-1800px",
            "ABOUT":  "-2400px"
        }[page];
        var selectionPosition = {
            "GENERAL": "0",
            "MEDIA":   "20%",
            "INPUTS":  "40%",
            "PORTS":   "60%",
            "ABOUT":   "80%"
        }[page];

        if (contentPosition) self["wmsx-content"].style.left = contentPosition;
        if (selectionPosition) self["wmsx-menu-selection"].style.left = selectionPosition;

        self["wmsx-menu-general"].classList.toggle("wmsx-selected", page === "GENERAL");
        self["wmsx-menu-media"].classList.toggle("wmsx-selected", page === "MEDIA");
        self["wmsx-menu-inputs"].classList.toggle("wmsx-selected", page === "INPUTS" );
        self["wmsx-menu-ports"].classList.toggle("wmsx-selected", page === "PORTS");
        self["wmsx-menu-about"].classList.toggle("wmsx-selected", page === "ABOUT");

        switch(page) {
            case "ABOUT":
                refreshAboutPage(); break;
            case "INPUTS":
                refreshInputsPage(); break;
            case "PORTS":
                refreshPortsPage();
        }
    };

    this.isVisible = function() {
        return visible;
    };

    this.position = function() {
        var w = mainElement.clientWidth;
        var h = mainElement.clientHeight;
        if (w < 537 || h < 434) {
            this.hide();
            return false;
        }

        if (w < 600) w -= 2;
        if (WMSX.SCREEN_CONTROL_BAR) {
            if (h >= 440 + wmsx.ScreenGUI.BAR_HEIGHT) h -= wmsx.ScreenGUI.BAR_HEIGHT + 3;
            // else h += 8;
        }
        modal.style.top =  "" + (((h - 440) / 2) | 0) + "px";
        modal.style.left = "" + (((w - 600) / 2) | 0) + "px";

        return true;
    };

    this.keyboardSettingsStateUpdate = function() {
        if (visible && keyboardConfigurator) keyboardConfigurator.keyboardSettingsStateUpdate();
    };

    this.controllersSettingsStateUpdate = function () {
        if (visible && portsConfigurator) portsConfigurator.controllersSettingsStateUpdate();
    };

    function create() {
        wmsx.Util.insertCSS(document, wmsx.SettingsGUI.css());
        mainElement.insertAdjacentHTML("beforeend", wmsx.SettingsGUI.html());

        modal = document.getElementById("wmsx-modal");

        delete wmsx.SettingsGUI.html;
        delete wmsx.SettingsGUI.css;
        delete wmsx.SettingsGUI;

        setFields();
        setEvents();
    }

    // Automatically set fields for each child element that has the "id" attribute
    function setFields() {
        traverseDOM(modal, function (element) {
            if (element.id) self[element.id] = element;
        });

        function traverseDOM(element, func) {
            func(element);
            var child = element.childNodes;
            for (var i = 0; i < child.length; i++) traverseDOM(child[i], func);
        }
    }

    function setEvents() {
        // Do not close with taps or clicks inside
        wmsx.Util.onTapOrMouseDownWithBlock(modal, function() { modal.focus(); });

        // Close with the back button
        wmsx.Util.onTapOrMouseDownWithBlock(self["wmsx-back"], self.hide);

        // Several key events
        modal.addEventListener("keydown", function (e) {
            processKeyEvent(e, true);
        });
        modal.addEventListener("keyup", function (e) {
            processKeyEvent(e, false);
        });

        // Tabs
        wmsx.Util.onTapOrMouseDownWithBlock(self["wmsx-menu-general"], function () {
            self.setPage("GENERAL");
        });
        wmsx.Util.onTapOrMouseDownWithBlock(self["wmsx-menu-inputs"], function () {
            self.setPage("INPUTS");
        });
        wmsx.Util.onTapOrMouseDownWithBlock(self["wmsx-menu-ports"], function () {
            self.setPage("PORTS");
        });
        wmsx.Util.onTapOrMouseDownWithBlock(self["wmsx-menu-media"], function () {
            self.setPage("MEDIA");
        });
        wmsx.Util.onTapOrMouseDownWithBlock(self["wmsx-menu-about"], function () {
            self.setPage("ABOUT");
        });
    }

    function refreshAboutPage() {
        self["wmsx-browserinfo"].innerHTML = navigator.userAgent;
    }

    function refreshInputsPage() {
        if (!keyboardConfigurator) keyboardConfigurator = new wmsx.KeyboardConfigurator(controllersHub, modal, machineTypeSocket);
        keyboardConfigurator.refreshLang();
        keyboardConfigurator.refresh();
    }

    function refreshPortsPage() {
        if (!portsConfigurator) portsConfigurator = new wmsx.PortsConfigurator(controllersHub, peripheralControls, modal);
        portsConfigurator.refresh();
    }

    function processKeyEvent(e, press) {
        var code = domKeys.codeNewForKeyboardEvent(e);
        if (press && code === KEY_ESC) {
            self.hide();
            return wmsx.Util.blockEvent(e);
        }
    }


    var modal;
    var page = "GENERAL";
    var visible = false;

    var keyboardConfigurator, portsConfigurator;

    var domKeys = wmsx.DOMKeys;

    var KEY_ESC = domKeys.VK_ESCAPE.wc;

};

