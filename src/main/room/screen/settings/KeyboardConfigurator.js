// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.KeyboardConfigurator = function(controllersHub, keyboardElement) {
    var self = this;

    function init() {
        setupKeyboard();
        domKeyboard.addKeyboardChangeListener(self);
    }

    this.keyboardChanged = function() {
        this.refresh();
    };

    this.refresh = function() {
        keyboardNameElement.innerHTML = "Current Keyboard:&nbsp;&nbsp;" + domKeyboard.getKeyboard();
        refreshUnmappedIndicator();
    };

    function setupKeyboard() {
        keyboardElement.tabIndex = "-1";

        // Set Popup
        popup = document.getElementById("wmsx-keyboard-popup");
        popupKeys = document.getElementById("wmsx-keyboard-popup-keys");

        // Create Keyboard
        for (var s in sections) {
            var section = document.createElement("div");
            section.id = "wmsx-keyboard-" + s;
            keyboardElement.appendChild(section);
            var rows = sections[s];
            for (var r = 0; r < rows.length; ++r) {
                var rowDiv = document.createElement("div");
                section.appendChild(rowDiv);
                var row = rows[r];
                for (var c = 0; c < row.length; ++c) {
                    var key = row[c];
                    var keyElement = document.createElement("div");
                    keyElement.id = "wmsx-keyboard-" + key.toLocaleLowerCase();
                    keyElement.classList.add("wmsx-keyboard-key");
                    if (dark.indexOf(keyElement.id) >= 0) keyElement.classList.add("wmsx-keyboard-key-dark");
                    keyElement.innerHTML = labels[key] || key;
                    var msxKey = translations[key] || key;
                    if (wmsx.KeyboardKeys[msxKey]) {
                        keyElement.msxKey = msxKey;
                        keyElements.push(keyElement);
                    }
                    rowDiv.appendChild(keyElement);
                    setupMouseEnterLeaveEvents(keyElement);
                }
            }
        }
        setupMouseEnterLeaveEvents(keyboardElement);
        keyboardElement.addEventListener("mousedown",  mouseDownKeyboard);
        keyboardElement.addEventListener("keydown", keyDown);        // New key pressed to be assigned to MSX key (non-modifiers only)
        keyboardElement.addEventListener("keyup", keyUp);          // New key released to be assigned to MSX key (modifiers only)

        keyboardNameElement = document.getElementById("wmms-inputs-keyboard-name");
    }

    function setupMouseEnterLeaveEvents(keyElement) {
        keyElement.addEventListener("mouseenter", mouseEnterKey);
        keyElement.addEventListener("mouseleave", mouseLeaveKey);
    }

    function mouseEnterKey(e) {
        keyboardElement.focus();
        if (e.target.msxKey) {
            keyElementEditing = e.target;
            msxKeyEditing = keyElementEditing.msxKey;
            modifPending = null;
            updatePopup()
        } else
            mouseLeaveKey();
    }

    function mouseLeaveKey() {
        keyElementEditing = msxKeyEditing = modifPending = null;
        updatePopup()
    }

    function mouseDownKeyboard(e) {
        if (msxKeyEditing && e.which === 3) domKeyboard.clearKey(msxKeyEditing);
        modifPending = null;
        updatePopup();
        self.refresh();
    }

    function keyDown(e) {
        if (!msxKeyEditing) return;

        // Modifier keys are accepted only on release
        if (wmsx.DOMKeys.isModifierKeyCode(e.keyCode))
            modifPending = e.keyCode;
        else
            customizeKey(e);

        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function keyUp(e) {
        if (!msxKeyEditing) return;

        // Modifier keys are accepted only on release, and oly the last one depressed
        if (modifPending === e.keyCode) customizeKey(e);

        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function customizeKey(e) {
        var mapping = {c: wmsx.DOMKeys.codeForKeyboardEvent(e), n: wmsx.DOMKeys.nameForKeyboardEvent(e)};
        domKeyboard.customizeKey(msxKeyEditing, mapping);
        updatePopup();
        self.refresh();
        modifPending = null;
    }

    function updatePopup() {
        if (!msxKeyEditing) {
            // Hide
            popup.style.display = "none";
            return;
        }

        // Show. Define contents
        popup.style.display = "block";
        var mapped = domKeyboard.getKeyMapping(msxKeyEditing) || [];
        if (mapped.length === 0) popupKeys.innerHTML = "- none -";
        else {
            var inner = "";
            for (var i = 0; i < mapped.length; i++) inner += (i > 0 ? "&nbsp;,&nbsp;" : "") + keyHTMLForMapping(mapped[i]);
            popupKeys.innerHTML = inner;
        }

        // Position
        var keyRec = keyElementEditing.getBoundingClientRect();
        var popRec = popup.getBoundingClientRect();
        var x = (keyRec.left + keyRec.width / 2 - popRec.width / 2) | 0;
        var y = (keyRec.top - popRec.height - POPUP_DIST) | 0;
        popup.style.top = "" + y + "px";
        popup.style.left = "" + x + "px";
    }

    function keyHTMLForMapping(mapping) {
        var names = !mapping.n || mapping.n.constructor !== Array ? [ mapping.n ] : mapping.n;
        var res = "";
        for (var i = 0, len = names.length; i < len; ++i) {
            if (i > 0) res += (len > 1 && i === (len-1)) ? "&nbsp;+&nbsp;" : "&nbsp;";
            res += '<DIV class = "wmsx-key">' + names[i] + '</DIV>';
        }
        return res;
    }

    function refreshUnmappedIndicator() {
        for (var k = 0; k < keyElements.length; ++k) {
            var map = domKeyboard.getKeyMapping(keyElements[k].msxKey);
            if (!map || map.length === 0) keyElements[k].classList.add("wmsx-keyboard-key-unmapped");
            else keyElements[k].classList.remove("wmsx-keyboard-key-unmapped");
        }
    }


    var domKeyboard = controllersHub.getKeyboard();

    var keyElements = [];
    var keyElementEditing = null, msxKeyEditing = null, modifPending = null;
    var keyboardNameElement;

    var popup, popupKeys;
    var POPUP_BORDER_WIDTH = 8, POPUP_DIST = 14;


    var sections = {    // MSX key names
        alpha: [
            ["F1", "F2", "F3", "F4", "F5", "STOP", "SELECT", "HOME", "INSERT", "DELETE"],
            ["ESCAPE", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D0", "MINUS", "EQUAL", "BACKSLASH", "BACKSPACE"],
            ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "OPEN_BRACKET", "CLOSE_BRACKET", "ENTER_X1", "ENTER_X2"],
            ["CONTROL", "A", "S", "D", "F", "G", "H", "J", "K", "L", "SEMICOLON", "QUOTE", "BACKQUOTE", "ENTER"],
            ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", "COMMA", "PERIOD", "SLASH", "SHIFT2"],
            ["CAPSLOCK", "GRAPH", "SPACE", "CODE", "DEAD"]
        ],
        num: [
            ["NUM_7", "NUM_8", "NUM_9", "NUM_DIVIDE"],
            ["NUM_4", "NUM_5", "NUM_6", "NUM_MULTIPLY"],
            ["NUM_1", "NUM_2", "NUM_3", "NUM_MINUS"],
            ["NUM_0", "NUM_PERIOD", "NUM_COMMA", "NUM_PLUS"]
        ],
        arrows: [
            ["LEFT", "UP", "RIGHT", "DOWN" ]
        ]
    };

    var labels = {
        SELECT: "SEL", INSERT: "INS", DELETE: "DEL",
        ESCAPE: "ESC", D1: "1", D2: "2", D3: "3", D4: "4", D5: "5", D6: "6", D7: "7", D8: "8", D9: "9", D0: "0", MINUS: "-", EQUAL: "=", BACKSLASH: "\\", BACKSPACE: "BS",
        SEMICOLON: ";", QUOTE: "'", BACKQUOTE: "`",
        CONTROL: "CTRL", OPEN_BRACKET: "[", CLOSE_BRACKET: "]", ENTER: "RET", ENTER_X1: " ", ENTER_X2: " ",
        SHIFT2: "SHIFT", COMMA: ",", PERIOD: ".", SLASH: "/", CAPSLOCK: "CAPS",
        NUM_DIVIDE: "/", NUM_MULTIPLY: "*", NUM_MINUS: "-", NUM_PLUS: "+", NUM_PERIOD: ".", NUM_COMMA: ",",
        NUM_1: "1", NUM_2: "2", NUM_3: "3", NUM_4: "4", NUM_5: "5", NUM_6: "6", NUM_7: "7", NUM_8: "8", NUM_9: "9", NUM_0: "0",
        LEFT: "&#9668;", UP: "&#9650;", DOWN: "&#9660;", RIGHT: "&#9658;"
    };

    var dark = [
        "wmsx-keyboard-escape", "wmsx-keyboard-tab", "wmsx-keyboard-control", "wmsx-keyboard-shift", "wmsx-keyboard-capslock", "wmsx-keyboard-graph",
        "wmsx-keyboard-backspace", "wmsx-keyboard-enter", "wmsx-keyboard-enter_x1", "wmsx-keyboard-enter_x2", "wmsx-keyboard-shift2", "wmsx-keyboard-code", "wmsx-keyboard-dead",
        "wmsx-keyboard-num_divide", "wmsx-keyboard-num_multiply", "wmsx-keyboard-num_minus", "wmsx-keyboard-num_plus"
    ];

    var translations = {
        "ENTER_X1": "#NONE#", "ENTER_X2": "#NONE#", "SHIFT2": "SHIFT"
    };


    init();

};
