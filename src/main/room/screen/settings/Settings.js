// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SettingsDialog = function(mainElement, controllersHub, machineTypeSocket) {
"use strict";

    var self = this;

    this.show = function (atPage) {
        if (!cover) {
            create();
            setTimeout(function() {
                self.show(atPage);
            }, 0);
            return;
        }

        if (!this.position()) return;

        this.setPage(atPage || page);
        this["wmsx-cover"].classList.add("wmsx-show");
        this["wmsx-modal"].classList.add("wmsx-show");
        visible = true;
        setTimeout(function() {
            self["wmsx-modal"].focus();
        }, 50);
    };

    this.hide = function () {
        if (!visible) return;
        self.hideLesser();
        WMSX.room.screen.focus();
    };

    this.hideLesser = function () {
        WMSX.userPreferences.save();
        self["wmsx-modal"].classList.remove("wmsx-show");
        self["wmsx-cover"].classList.remove("wmsx-show");
        visible = false;
    };

    this.setPage = function (pPage) {
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
            if (h >= 456 + wmsx.ScreenGUI.BAR_HEIGHT) h -= wmsx.ScreenGUI.BAR_HEIGHT + 3;
            else h += 8;
        }
        this["wmsx-modal"].style.top =  "" + (((h - 456) / 2) | 0) + "px";
        this["wmsx-modal"].style.left = "" + (((w - 600) / 2) | 0) + "px";

        return true;
    };

    this.keyboardSettingsStateUpdate = function() {
        if (visible && keyboardConfigurator) keyboardConfigurator.keyboardSettingsStateUpdate();
    };

    this.controllersSettingsStateUpdate = function () {
        if (visible && portsConfigurator) portsConfigurator.controllersSettingsStateUpdate();
    };

    function create() {
        wmsx.Util.insertCSS(wmsx.SettingsGUI.css());

        cover = document.createElement("div");
        cover.id = "wmsx-cover";
        cover.innerHTML = wmsx.SettingsGUI.html();
        cover.tabIndex = -1;
        mainElement.appendChild(cover);

        delete wmsx.SettingsGUI.html;
        delete wmsx.SettingsGUI.css;
        delete wmsx.SettingsGUI;

        setFields();
        setEvents();
    }

    // Automatically set fields for each child element that has the "id" attribute
    function setFields() {
        traverseDOM(cover, function (element) {
            if (element.id) self[element.id] = element;
        });

        function traverseDOM(element, func) {
            func(element);
            var child = element.childNodes;
            for (var i = 0; i < child.length; i++) {
                traverseDOM(child[i], func);
            }
        }
    }

    function setEvents() {
        // Close the modal with a click outside
        cover.addEventListener("mousedown", function (e) {
            self.hide();
            return wmsx.Util.blockEvent(e);
        });
        document.documentElement.addEventListener("mousedown", function (e) {
            self.hideLesser();
        });
        // But do not close the modal with a click inside
        self["wmsx-modal"].addEventListener("mousedown", function (e) {
            e.stopPropagation();
        });
        // Close with the back button
        wmsx.Util.onEventOrTapWithBlock(self["wmsx-back"], "mousedown", self.hide);

        // Several key events
        cover.addEventListener("keydown", function (e) {
            processKeyEvent(e, true);
        });
        cover.addEventListener("keyup", function (e) {
            processKeyEvent(e, false);
        });

        // Tabs
        wmsx.Util.onEventOrTapWithBlock(self["wmsx-menu-general"], "mousedown", function (e) {
            self.setPage("GENERAL");
        });
        wmsx.Util.onEventOrTapWithBlock(self["wmsx-menu-inputs"], "mousedown", function (e) {
            self.setPage("INPUTS");
        });
        wmsx.Util.onEventOrTapWithBlock(self["wmsx-menu-ports"], "mousedown", function (e) {
            self.setPage("PORTS");
        });
        wmsx.Util.onEventOrTapWithBlock(self["wmsx-menu-media"], "mousedown", function (e) {
            self.setPage("MEDIA");
        });
        wmsx.Util.onEventOrTapWithBlock(self["wmsx-menu-about"], "mousedown", function (e) {
            self.setPage("ABOUT");
        });
    }

    function refreshAboutPage() {
        self["wmsx-browserinfo"].innerHTML = navigator.userAgent;
    }

    function refreshInputsPage() {
        if (!keyboardConfigurator) keyboardConfigurator = new wmsx.KeyboardConfigurator(controllersHub, cover, machineTypeSocket);
        keyboardConfigurator.refreshForJapanese();
        keyboardConfigurator.refresh();
    }

    function refreshPortsPage() {
        if (!portsConfigurator) portsConfigurator = new wmsx.PortsConfigurator(controllersHub, cover);
        portsConfigurator.refresh();
    }

    function processKeyEvent(e, press) {
        e.returnValue = false;  // IE
        var code = wmsx.DOMKeys.codeForKeyboardEvent(e);

        if (press && code === KEY_ESC) {
            self.hide();
            return wmsx.Util.blockEvent(e);
        }
    }


    var cover;
    var page = "GENERAL";
    var visible = false;

    var keyboardConfigurator, portsConfigurator;

    var KEY_ESC = wmsx.DOMKeys.VK_ESCAPE.c;

};

