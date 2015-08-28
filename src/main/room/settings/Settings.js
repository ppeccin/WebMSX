// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Settings = function() {
    var self = this;

    this.show = function (page) {
        if (!this.panel) {
            create(this);
            setTimeout(function() {
                self.show(page);
            }, 0);
            return;
        }
        preferencesChanged = false;
        controlRedefining = null;
        refreshData();
        if (page) this.setPage(page);
        this["jt-cover"].classList.add("show");
        this["jt-modal"].classList.add("show");
        this.panel.focus();
    };

    this.hide = function () {
        if (preferencesChanged) finishPreferences();
        this["jt-modal"].classList.remove("show");
        this["jt-cover"].classList.remove("show");
        WMSX.room.screen.focus();
    };

    this.setPage = function (page) {
        var contentPosition = {
            "GENERAL": "0",
            "MEDIA": "-560px",
            "ABOUT": "-1120px"
        }[page];
        var selectionPosition = {
            "GENERAL": "0",
            "MEDIA": "33.3%",
            "ABOUT": "66.6%"
        }[page];

        if (contentPosition) self["jt-content"].style.left = contentPosition;
        if (selectionPosition) self["jt-menu-selection"].style.left = selectionPosition;

        self["jt-menu-general"].classList[page === "GENERAL" ? "add" : "remove"]("selected");
        self["jt-menu-media"].classList[page === "MEDIA" ? "add" : "remove"]("selected");
        self["jt-menu-about"].classList[page === "ABOUT" ? "add" : "remove"]("selected");
    };

    var create = function () {
        var styles = document.createElement('style');
        styles.type = 'text/css';
        styles.innerHTML = wmsx.SettingsGUI.css();
        document.head.appendChild(styles);

        self.panel = document.createElement("div");
        self.panel.innerHTML = wmsx.SettingsGUI.html();
        self.panel.style.outline = "none";
        self.panel.tabIndex = -1;
        document.body.appendChild(self.panel);

        delete wmsx.SettingsGUI.html;
        delete wmsx.SettingsGUI.css;
        delete wmsx.SettingsGUI;

        setFields();
        setEvents();
    };

    // Automatic set fields for each child element that has the "id" attribute
    var setFields = function () {
        traverseDOM(self.panel, function (element) {
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
        self.panel.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            self.hide();
        });
        // But do not close the modal with a click inside
        self["jt-modal"].addEventListener("mousedown", function (e) {
            if (e.stopPropagation) e.stopPropagation();
            keyRedefinitonStop();
        });
        // Close with the back button
        self["jt-back"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            self.hide();
        });

        // Several key events
        self.panel.addEventListener("keydown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            processKeyEvent(e);
        });

        // Tabs
        self["jt-menu-general"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("GENERAL");
        });
        self["jt-menu-media"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("MEDIA");
        });
        self["jt-menu-about"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("ABOUT");
        });

        // Generic Console Controls Commands
        for (var key in controlsCommandKeys) {
            (function(keyLocal) {
                self[controlsCommandKeys[key]].addEventListener("mousedown", function (e) {
                    if (e.preventDefault) e.preventDefault();
                    WMSX.room.machineControls.processKeyEvent(keyLocal, true, wmsx.DOMConsoleControls.KEY_ALT_MASK);
                    keyRedefinitonStop();   // will refresh
                });
            })(key | 0);    // must be a number to simulate a keyCode
        }
    };

    var refreshData = function () {
        self["jt-browserinfo"].innerHTML = navigator.userAgent;
    };

    var processKeyEvent = function (e) {
        if (e.keyCode === KEY_ESC)
            closeOrKeyRedefinitionStop();
        else if(controlRedefining) keyRedefinitionTry(e.keyCode);
        else {
            if (e.altKey && controlsCommandKeys[e.keyCode]) {
                WMSX.room.controls.keyDown(e);
                refreshData();
            }
        }
    };

    var reyRedefinitionStart = function(control) {
        controlRedefining = control;
        refreshData();
    };

    var keyRedefinitonStop = function() {
        controlRedefining = null;
        refreshData();
    };

    var keyRedefinitionTry = function (keyCode) {
        if (!controlRedefining) return;
        if (!wmsx.DOMKeys.byCode[keyCode]) return;
        if (WMSX.preferences[controlKeys[controlRedefining]] !== keyCode) {
            for (var con in controlKeys)
                if (WMSX.preferences[controlKeys[con]] === keyCode)
                    WMSX.preferences[controlKeys[con]] = -1;

            WMSX.preferences[controlKeys[controlRedefining]] = keyCode;
            preferencesChanged = true;
        }
        keyRedefinitonStop();
    };

    var closeOrKeyRedefinitionStop = function() {
        if (controlRedefining) keyRedefinitonStop();
        else self.hide()
    };

    var controlsDefaults = function () {
        WMSX.preferences.loadDefaults();
        preferencesChanged = true;
        keyRedefinitonStop();   // will refresh
    };

    var controlsRevert = function () {
        WMSX.preferences.load();
        preferencesChanged = false;
        keyRedefinitonStop();   // will refresh
    };

    var finishPreferences = function () {
        WMSX.room.controls.applyPreferences();
        WMSX.preferences.save();
        preferencesChanged = false;
    };

    var controlKeys = {
    };

    var controlRedefining = null;

    var controlsCommandKeys = {};
        //controlsCommandKeys[wmsx.DOMMachineControls.KEY_TOGGLE_JOYSTICK] = "jt-general-swap-joysticks";

    var preferencesChanged = false;

    var KEY_ESC = 27;        // VK_ESC

};

