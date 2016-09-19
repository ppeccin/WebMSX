// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SettingsDialog = function(controllersHub) {
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
        this.cover.focus();
    };

    this.hide = function () {
        WMSX.userPreferences.save();
        this["wmsx-modal"].classList.remove("wmsx-show");
        this["wmsx-cover"].classList.remove("wmsx-show");
        WMSX.room.screen.focus();
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
        if (keyboardConfigurator) keyboardConfigurator.keyboardSettingsStateUpdate();
    };

    this.controllersSettingsStateUpdate = function () {
        if (portsConfigurator) portsConfigurator.controllersSettingsStateUpdate();
    };

    var create = function () {
        var styles = document.createElement('style');
        styles.type = 'text/css';
        styles.innerHTML = wmsx.SettingsGUI.css();
        document.head.appendChild(styles);

        self.cover = document.createElement("div");
        self.cover.innerHTML = wmsx.SettingsGUI.html();
        self.cover.style.outline = "none";
        self.cover.tabIndex = -1;
        document.body.appendChild(self.cover);

         // Supress context menu
        self.cover.addEventListener("contextmenu", function stopContextMenu(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        delete wmsx.SettingsGUI.html;
        delete wmsx.SettingsGUI.css;
        delete wmsx.SettingsGUI;

        setFields();
        setEvents();

        self["wmsx-modal"].tabIndex = -1;
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

    var setEvents = function () {
        // Close the modal with a click outside
        self.cover.addEventListener("mousedown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.hide();
        });
        // But do not close the modal with a click inside
        self["wmsx-modal"].addEventListener("mousedown", function (e) {
            e.stopPropagation();
        });
        // Close with the back button
        self["wmsx-back"].addEventListener("mousedown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.hide();
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
            e.preventDefault();
            self.setPage("GENERAL");
        });
        self["wmsx-menu-inputs"].addEventListener("mousedown", function (e) {
            e.preventDefault();
            self.setPage("INPUTS");
        });
        self["wmsx-menu-ports"].addEventListener("mousedown", function (e) {
            e.preventDefault();
            self.setPage("PORTS");
        });
        self["wmsx-menu-media"].addEventListener("mousedown", function (e) {
            e.preventDefault();
            self.setPage("MEDIA");
        });
        self["wmsx-menu-about"].addEventListener("mousedown", function (e) {
            e.preventDefault();
            self.setPage("ABOUT");
        });

        //// Generic Controls Commands
        //for (var key in controlsCommandKeys) {
        //    (function(keyLocal) {
        //        self[controlsCommandKeys[key]].addEventListener("mousedown", function (e) {
        //            e.preventDefault();
        //            WMSX.room.machineControls.processKeyEvent(keyLocal, true, wmsx.DOMConsoleControls.KEY_ALT_MASK);
        //            keyRedefinitonStop();   // will refresh
        //        });
        //    })(key | 0);    // must be a number to simulate a keyCode
        //}
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
        e.preventDefault();
        e.stopPropagation();
        var code = wmsx.DOMKeys.codeForKeyboardEvent(e);

        if (press && code === KEY_ESC) self.hide();
        else return WMSX.room.machineControls.processKey(code, press);

        return false;
    };


    this.cover = null;

    var keyboardConfigurator, portsConfigurator;

    var KEY_ESC = wmsx.DOMKeys.VK_ESCAPE.c;

};

