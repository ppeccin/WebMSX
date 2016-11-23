// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.VirtualKeyboard = {

    create: function(mainElement, keysCallback, shift, japanese) {
        "use strict";

        var inner = document.createElement("div");
        inner.style.position = "absolute";
        mainElement.appendChild(inner);

        // Create Keyboard
        var keyElements = [];
        for (var s in this.sections) {
            var section = document.createElement("div");
            section.classList.add("wmsx-keyboard-" + s);
            inner.appendChild(section);
            var rows = this.sections[s];
            var rowY = 0;
            for (var r = 0; r < rows.length; ++r) {
                var rowDiv = document.createElement("div");
                rowDiv.style.top = "" + rowY + "px";
                rowY += this.sectionRowHeight[s];
                section.appendChild(rowDiv);
                var row = rows[r];
                var keyX = 1;
                for (var c = 0; c < row.length; ++c) {
                    var keyID = row[c];
                    var keyName = "wmsx-keyboard-" + keyID.toLowerCase();
                    var keyElement = document.createElement("div");
                    if (s !== "arrows") {
                        var w = this.keyWidth[keyID] || this.sectionKeyWidth[s];
                        keyElement.style.width = "" + w + "px";
                        keyElement.style.left = "" + keyX + "px";
                        keyX += this.keySpace[keyID] || (w + 1);
                    }
                    keyElement.classList.add("wmsx-keyboard-key");
                    keyElement.classList.add(keyName);
                    if (this.dark.indexOf(keyName) >= 0) keyElement.classList.add("wmsx-keyboard-key-dark");
                    keyElement.wmsxKeyID = keyID;
                    keyElement.wmsxKey = this.idToMSMKey[keyID] || keyID;
                    rowDiv.appendChild(keyElement);
                    keyElements.push(keyElement);
                    if (keysCallback) keysCallback(keyElement);
                }
            }
        }

        this.updateKeysLabels(keyElements, shift, japanese);
        return keyElements;
    },

    updateKeysLabels: function(keyElements, shift, japanese) {
        "use strict";
        for (var k = keyElements.length - 1; k >= 0; --k) {
            var keyElement = keyElements[k];
            if (this.blankKeys.has(keyElement.wmsxKeyID)) continue;
            var label = shift
                ? (japanese && (wmsx.KeyboardKeys[keyElement.wmsxKey].jsn || wmsx.KeyboardKeys[keyElement.wmsxKey].jn)) || wmsx.KeyboardKeys[keyElement.wmsxKey].ssn || wmsx.KeyboardKeys[keyElement.wmsxKey].sn
                : (japanese && wmsx.KeyboardKeys[keyElement.wmsxKey].jn) || wmsx.KeyboardKeys[keyElement.wmsxKey].sn;
            label = this.finalLabels[label] || label;
            if (keyElement.wmsxLabel !== label) {
                keyElement.wmsxLabel = label;
                keyElement.innerHTML = label;
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

    sectionRowHeight: {
        alpha: 25, num: 23, arrows: 50
    },

    sectionKeyWidth: {
        alpha: 26, num: 22
    },

    keyWidth: {
        F1: 39, F2: 39, F3: 39, F4: 39, F5: 39, STOP: 39, SELECT: 39, HOME: 39, INSERT: 39, DELETE: 39,
        ESCAPE: 29, BACKSPACE: 28, TAB: 41, CONTROL: 48, SHIFT: 61, SHIFT2: 61, ENTER: 36, ENTER_X1: 13, ENTER_X2: 30,
        SPACE: 189, CAPSLOCK: 38, DEAD: 38, GRAPH: 46, CODE: 46
    },

    keySpace: {
        STOP: 50, ENTER_X1: 13, CAPSLOCK: 55
    },

    dark: [
        "wmsx-keyboard-escape", "wmsx-keyboard-tab", "wmsx-keyboard-control", "wmsx-keyboard-shift", "wmsx-keyboard-capslock", "wmsx-keyboard-graph",
        "wmsx-keyboard-backspace", "wmsx-keyboard-enter", "wmsx-keyboard-enter_x1", "wmsx-keyboard-enter_x2", "wmsx-keyboard-shift2", "wmsx-keyboard-code", "wmsx-keyboard-dead",
        "wmsx-keyboard-num_divide", "wmsx-keyboard-num_multiply", "wmsx-keyboard-num_minus", "wmsx-keyboard-num_plus"
    ],

    idToMSMKey: {
        "ENTER_X1": "ENTER", "ENTER_X2": "ENTER", "SHIFT2": "SHIFT"
    },

    finalLabels: {   // Instead of the original labels
        STP: "STOP", HOM: "HOME", CTR: "CTRL", SHF: "SHIFT", CAP: "CAPS", SPC: "SPACE", GRA: "GRAPH", COD: "CODE", DED: "DEAD"
    },

    blankKeys: new Set([ "ENTER_X1", "ENTER_X2", "UP", "DOWN", "LEFT", "RIGHT" ])

};
