// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SettingsDialog = function() {
    var self = this;

    this.show = function (page) {
        if (!this.dialog) {
            create();
            setTimeout(function() {
                self.show(page);
            }, 0);
            return;
        }
        preferencesChanged = false;
        controlRedefining = null;
        refreshData();
        if (page) this.setPage(page);
        this["wmsx-cover"].classList.add("wmsx-show");
        this["wmsx-modal"].classList.add("wmsx-show");
        this.dialog.focus();
    };

    this.hide = function () {
        if (preferencesChanged) finishPreferences();
        this["wmsx-modal"].classList.remove("wmsx-show");
        this["wmsx-cover"].classList.remove("wmsx-show");
        WMSX.room.screen.focus();
    };

    this.setPage = function (page) {
        var contentPosition = {
            "GENERAL": "0",
            "MEDIA": "-600px",
            "INPUTS": "-1200px",
            "ABOUT": "-1800px"
        }[page];
        var selectionPosition = {
            "GENERAL": "0",
            "MEDIA": "25%",
            "INPUTS": "50%",
            "ABOUT": "75%"
        }[page];

        if (contentPosition) self["wmsx-content"].style.left = contentPosition;
        if (selectionPosition) self["wmsx-menu-selection"].style.left = selectionPosition;

        self["wmsx-menu-general"].classList[page === "GENERAL" ? "add" : "remove"]("wmsx-selected");
        self["wmsx-menu-media"].classList[page === "MEDIA" ? "add" : "remove"]("wmsx-selected");
        self["wmsx-menu-inputs"].classList[page === "INPUTS" ? "add" : "remove"]("wmsx-selected");
        self["wmsx-menu-about"].classList[page === "ABOUT" ? "add" : "remove"]("wmsx-selected");
    };

    var create = function () {
        var styles = document.createElement('style');
        styles.type = 'text/css';
        styles.innerHTML = wmsx.SettingsGUI.css();
        document.head.appendChild(styles);

        self.dialog = document.createElement("div");
        self.dialog.innerHTML = wmsx.SettingsGUI.html();
        self.dialog.style.outline = "none";
        self.dialog.tabIndex = -1;
        document.body.appendChild(self.dialog);

        // Supress context menu
        self.dialog.addEventListener("contextmenu", function stopContextMenu(e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            return false;
        });

        delete wmsx.SettingsGUI.html;
        delete wmsx.SettingsGUI.css;
        delete wmsx.SettingsGUI;

        setFields();
        setEvents();
    };

    // Automatic set fields for each child element that has the "id" attribute
    var setFields = function () {
        traverseDOM(self.dialog, function (element) {
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
        self.dialog.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            self.hide();
        });
        // But do not close the modal with a click inside
        self["wmsx-modal"].addEventListener("mousedown", function (e) {
            if (e.stopPropagation) e.stopPropagation();
            keyRedefinitonStop();
        });
        // Close with the back button
        self["wmsx-back"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            self.hide();
        });

        // Several key events
        self.dialog.addEventListener("keydown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            processKeyEvent(e);
        });

        // Tabs
        self["wmsx-menu-general"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("GENERAL");
        });
        self["wmsx-menu-inputs"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("INPUTS");
        });
        self["wmsx-menu-media"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("MEDIA");
        });
        self["wmsx-menu-about"].addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            self.setPage("ABOUT");
        });

        //// Generic Controls Commands
        //for (var key in controlsCommandKeys) {
        //    (function(keyLocal) {
        //        self[controlsCommandKeys[key]].addEventListener("mousedown", function (e) {
        //            if (e.preventDefault) e.preventDefault();
        //            WMSX.room.machineControls.processKeyEvent(keyLocal, true, wmsx.DOMConsoleControls.KEY_ALT_MASK);
        //            keyRedefinitonStop();   // will refresh
        //        });
        //    })(key | 0);    // must be a number to simulate a keyCode
        //}
    };

    var refreshData = function () {
        self["wmsx-browserinfo"].innerHTML = navigator.userAgent;
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
        if (WMSX.userPreferences[controlKeys[controlRedefining]] !== keyCode) {
            for (var con in controlKeys)
                if (WMSX.userPreferences[controlKeys[con]] === keyCode)
                    WMSX.userPreferences[controlKeys[con]] = -1;

            WMSX.userPreferences[controlKeys[controlRedefining]] = keyCode;
            preferencesChanged = true;
        }
        keyRedefinitonStop();
    };

    var closeOrKeyRedefinitionStop = function() {
        if (controlRedefining) keyRedefinitonStop();
        else self.hide()
    };

    var controlsDefaults = function () {
        WMSX.userPreferences.loadDefaults();
        preferencesChanged = true;
        keyRedefinitonStop();   // will refresh
    };

    var controlsRevert = function () {
        WMSX.userPreferences.load();
        preferencesChanged = false;
        keyRedefinitonStop();   // will refresh
    };

    var finishPreferences = function () {
        WMSX.room.controls.applyPreferences();
        WMSX.userPreferences.save();
        preferencesChanged = false;
    };

    var controlKeys = {
    };


    this.dialog = null;

    var controlRedefining = null;
    var controlsCommandKeys = {};
        //controlsCommandKeys[wmsx.DOMMachineControls.KEY_TOGGLE_JOYSTICK] = "wmsx-general-swap-joysticks";

    var preferencesChanged = false;

    var KEY_ESC = 27;        // VK_ESC

};

