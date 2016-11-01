// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SettingsDialog = function(mainElement, controllersHub) {
"use strict";

    var self = this;

    this.show = function (page) {
        if (!this.cover) {
            create();
            setTimeout(function() {
                self.show(page);
            }, 0);
            return;
        }
        if (page) this.setPage(page);
        this["wmsx-cover"].classList.add("wmsx-show");
        this["wmsx-modal"].classList.add("wmsx-show");
        visible = true;
        setTimeout(function() {
            self["wmsx-modal"].focus();
        }, 50);
    };

    this.hide = function () {
        self.hideLesser();
        WMSX.room.screen.focus();
    };

    this.hideLesser = function () {
        WMSX.userPreferences.save();
        self["wmsx-modal"].classList.remove("wmsx-show");
        self["wmsx-cover"].classList.remove("wmsx-show");
        visible = false;
    };

    this.setPage = function (page) {
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

        self["wmsx-menu-general"].classList[page === "GENERAL" ? "add" : "remove"]("wmsx-selected");
        self["wmsx-menu-media"].classList[page === "MEDIA" ? "add" : "remove"]("wmsx-selected");
        self["wmsx-menu-inputs"].classList[page === "INPUTS" ? "add" : "remove"]("wmsx-selected");
        self["wmsx-menu-ports"].classList[page === "PORTS" ? "add" : "remove"]("wmsx-selected");
        self["wmsx-menu-about"].classList[page === "ABOUT" ? "add" : "remove"]("wmsx-selected");

        switch(page) {
            case "ABOUT":
                refreshAboutPage(); break;
            case "INPUTS":
                refreshInputsPage(); break;
            case "PORTS":
                refreshPortsPage();
        }
    };

    this.keyboardSettingsStateUpdate = function() {
        if (visible && keyboardConfigurator) keyboardConfigurator.keyboardSettingsStateUpdate();
    };

    this.controllersSettingsStateUpdate = function () {
        if (visible && portsConfigurator) portsConfigurator.controllersSettingsStateUpdate();
    };

    var create = function () {
        var styles = document.createElement('style');
        styles.type = 'text/css';
        styles.innerHTML = wmsx.SettingsGUI.css();
        document.head.appendChild(styles);

        self.cover = document.createElement("div");
        self.cover.id = "wmsx-cover";
        self.cover.innerHTML = wmsx.SettingsGUI.html();
        self.cover.tabIndex = -1;
        mainElement.appendChild(self.cover);

         // Supress context menu
        self.cover.addEventListener("contextmenu", blockEvent);

        delete wmsx.SettingsGUI.html;
        delete wmsx.SettingsGUI.css;
        delete wmsx.SettingsGUI;

        setFields();
        setEvents();
    };

    // Automatically set fields for each child element that has the "id" attribute
    var setFields = function () {
        traverseDOM(self.cover, function (element) {
            if (element.id) self[element.id] = element;
        });

        function traverseDOM(element, func) {
            func(element);
            var child = element.childNodes;
            for (var i = 0; i < child.length; i++) {
                traverseDOM(child[i], func);
            }
        }
    };

    function blockEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    var setEvents = function () {
        // Close the modal with a click outside
        self.cover.addEventListener("mousedown", function (e) {
            self.hide();
            return blockEvent(e);
        });
        document.documentElement.addEventListener("mousedown", function (e) {
            self.hideLesser();
        });
        // But do not close the modal with a click inside
        self["wmsx-modal"].addEventListener("mousedown", function (e) {
            e.stopPropagation();
        });
        // Close with the back button
        self["wmsx-back"].addEventListener("mousedown", function (e) {
            self.hide();
            return blockEvent(e);
        });

        // Several key events
        self.cover.addEventListener("keydown", function (e) {
            processKeyEvent(e, true);
        });
        self.cover.addEventListener("keyup", function (e) {
            processKeyEvent(e, false);
        });

        // Tabs
        self["wmsx-menu-general"].addEventListener("mousedown", function (e) {
            self.setPage("GENERAL");
            return blockEvent(e);
        });
        self["wmsx-menu-inputs"].addEventListener("mousedown", function (e) {
            self.setPage("INPUTS");
            return blockEvent(e);
        });
        self["wmsx-menu-ports"].addEventListener("mousedown", function (e) {
            self.setPage("PORTS");
            return blockEvent(e);
        });
        self["wmsx-menu-media"].addEventListener("mousedown", function (e) {
            self.setPage("MEDIA");
            return blockEvent(e);
        });
        self["wmsx-menu-about"].addEventListener("mousedown", function (e) {
            self.setPage("ABOUT");
            return blockEvent(e);
        });
    };

    var refreshAboutPage = function () {
        self["wmsx-browserinfo"].innerHTML = navigator.userAgent;
    };

    var refreshInputsPage = function() {
        if (!keyboardConfigurator) keyboardConfigurator = new wmsx.KeyboardConfigurator(controllersHub, self.cover);
        keyboardConfigurator.refresh();
    };

    var refreshPortsPage = function() {
        if (!portsConfigurator) portsConfigurator = new wmsx.PortsConfigurator(controllersHub, self.cover);
        portsConfigurator.refresh();
    };

    var processKeyEvent = function(e, press) {
        e.returnValue = false;  // IE
        var code = wmsx.DOMKeys.codeForKeyboardEvent(e);

        if (press && code === KEY_ESC) {
            blockEvent(e);
            self.hide();
        }
    };


    var visible = false;
    this.cover = null;

    var keyboardConfigurator, portsConfigurator;

    var KEY_ESC = wmsx.DOMKeys.VK_ESCAPE.c;

};

