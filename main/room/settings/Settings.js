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
            "HELP": "0",
            "CONTROLS": "-560px",
            "ABOUT": "-1120px"
        }[page];
        var selectionPosition = {
            "HELP": "0",
            "CONTROLS": "33.3%",
            "ABOUT": "66.6%"
        }[page];

        if (contentPosition) self["jt-content"].style.left = contentPosition;
        if (selectionPosition) self["jt-menu-selection"].style.left = selectionPosition;

        self["jt-menu-help"].classList[page === "HELP" ? "add" : "remove"]("selected");
        self["jt-menu-controls"].classList[page === "CONTROLS" ? "add" : "remove"]("selected");
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
        self["jt-menu-help"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("HELP");
        });
        self["jt-menu-controls"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("CONTROLS");
        });
        self["jt-menu-about"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("ABOUT");
        });

        // Double click for key redefinition
        for (var control in controlKeys) {
            (function(localControl) {
                self[localControl].addEventListener("mousedown", function (e) {
                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();
                    reyRedefinitionStart(localControl);
                });
            })(control);
        }

        // Controls Actions
        self["jt-controls-defaults"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            controlsDefaults();
        });
        self["jt-controls-revert"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            controlsRevert();
        });

        // Generic Console Controls Commands
        for (var key in controlsCommandKeys) {
            (function(keyLocal) {
                self[controlsCommandKeys[key]].addEventListener("mousedown", function (e) {
                    if (e.preventDefault) e.preventDefault();
                    WMSX.room.controls.processKeyEvent(keyLocal, true, wmsx.DOMConsoleControls.KEY_ALT_MASK);
                    keyRedefinitonStop();   // will refresh
                });
            })(key | 0);    // must be a number to simulate a keyCode
        }
    };

    var refreshData = function () {
        self["jt-browserinfo"].innerHTML = navigator.userAgent;

        //if (WMSX.room.controls.isPaddleMode()) {
        //    self["jt-control-p1-controller"].style.backgroundPositionY = "-91px";
        //    self["jt-control-p2-controller"].style.backgroundPositionY = "-91px";
        //    self["jt-control-p1-up-label"].innerHTML = self["jt-control-p2-up-label"].innerHTML = "+ Speed";
        //    self["jt-control-p1-down-label"].innerHTML = self["jt-control-p2-down-label"].innerHTML = "- Speed";
        //} else {
        //    self["jt-control-p1-controller"].style.backgroundPositionY = "0";
        //    self["jt-control-p2-controller"].style.backgroundPositionY = "0";
        //    self["jt-control-p1-up-label"].innerHTML = self["jt-control-p2-up-label"].innerHTML = "Up";
        //    self["jt-control-p1-down-label"].innerHTML = self["jt-control-p2-down-label"].innerHTML = "Down";
        //
        //}
        //var swapped = WMSX.room.controls.isP1ControlsMode();
        //self["jt-control-p1-label"].innerHTML = "Player " + (swapped ? "2" : "1");
        //self["jt-control-p2-label"].innerHTML = "Player " + (swapped ? "1" : "2");

        for (var control in controlKeys) {
            if (control === controlRedefining) {
                self[control].classList.add("redefining");
                self[control].classList.remove("undefined");
                self[control].innerHTML = "?";
            } else {
                self[control].classList.remove("redefining");
                var keyInfo = wmsx.DOMKeysByCode[WMSX.preferences[controlKeys[control]]];
                if (keyInfo) {
                    self[control].classList.remove("undefined");
                    self[control].innerHTML = keyInfo.n;
                } else {
                    self[control].classList.add("undefined");
                    self[control].innerHTML = "-";
                }
            }
        }
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
        if (!wmsx.KeysByCode[keyCode]) return;
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
        "jt-control-p1-button1": "KP0BUT",
        "jt-control-p1-button2": "KP0BUT2",
        "jt-control-p1-up": "KP0UP",
        "jt-control-p1-left": "KP0LEFT",
        "jt-control-p1-right": "KP0RIGHT",
        "jt-control-p1-down": "KP0DOWN",
        "jt-control-p2-button1": "KP1BUT",
        "jt-control-p2-button2": "KP1BUT2",
        "jt-control-p2-up": "KP1UP",
        "jt-control-p2-left": "KP1LEFT",
        "jt-control-p2-right": "KP1RIGHT",
        "jt-control-p2-down": "KP1DOWN"
    };

    var controlRedefining = null;

    var controlsCommandKeys = {};
        controlsCommandKeys[wmsx.DOMMachineControls.KEY_TOGGLE_P1_MODE] = "jt-controls-swap-keys";
        controlsCommandKeys[wmsx.DOMMachineControls.KEY_TOGGLE_JOYSTICK] = "jt-controls-swap-gamepads";
        controlsCommandKeys[wmsx.DOMMachineControls.KEY_TOGGLE_PADDLE] = "jt-controls-toggle-paddles";

    var preferencesChanged = false;

    var KEY_ESC = 27;        // VK_ESC

};

