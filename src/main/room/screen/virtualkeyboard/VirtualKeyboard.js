// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.VirtualKeyboard = {

    create: function(mainElement, keysCallback) {
        "use strict";

        var inner = document.createElement("div");
        inner.style.position = "relative";
        mainElement.appendChild(inner);

        // Create Keyboard
        for (var s in this.sections) {
            var section = document.createElement("div");
            section.classList.add("wmsx-keyboard-" + s);
            inner.appendChild(section);
            var rows = this.sections[s];
            for (var r = 0; r < rows.length; ++r) {
                var rowDiv = document.createElement("div");
                section.appendChild(rowDiv);
                var row = rows[r];
                for (var c = 0; c < row.length; ++c) {
                    var key = row[c];
                    var keyName = "wmsx-keyboard-" + key.toLocaleLowerCase();
                    var keyElement = document.createElement("div");
                    keyElement.classList.add("wmsx-keyboard-key");
                    keyElement.classList.add(keyName);
                    if (this.dark.indexOf(keyName) >= 0) keyElement.classList.add("wmsx-keyboard-key-dark");
                    var msxKey = this.translations[key] || key;
                    if (wmsx.KeyboardKeys[msxKey]) {
                        keyElement.wmsxKey = msxKey;
                        keyElement.innerHTML = this.labels[msxKey] || wmsx.KeyboardKeys[msxKey].sn;
                    }
                    rowDiv.appendChild(keyElement);
                    if (keysCallback) keysCallback(keyElement);
                }
            }
        }
    },

    sections: {    // MSX key names
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
    },

    labels: {   // Instead of the 3-char shot names
        STOP: "STOP", HOME: "HOME", CONTROL: "CTRL", SHIFT: "SHIFT", SPACE: "SPACE", GRAPH: "GRAPH", CODE: "CODE", DEAD: "DEAD",
        LEFT: "&#9668;", UP: "&#9650;", DOWN: "&#9660;", RIGHT: "&#9658;"
    },

    dark: [
        "wmsx-keyboard-escape", "wmsx-keyboard-tab", "wmsx-keyboard-control", "wmsx-keyboard-shift", "wmsx-keyboard-capslock", "wmsx-keyboard-graph",
        "wmsx-keyboard-backspace", "wmsx-keyboard-enter", "wmsx-keyboard-enter_x1", "wmsx-keyboard-enter_x2", "wmsx-keyboard-shift2", "wmsx-keyboard-code", "wmsx-keyboard-dead",
        "wmsx-keyboard-num_divide", "wmsx-keyboard-num_multiply", "wmsx-keyboard-num_minus", "wmsx-keyboard-num_plus"
    ],

    translations: {
        "ENTER_X1": "#NONE#", "ENTER_X2": "#NONE#", "SHIFT2": "SHIFT"
    }

};
