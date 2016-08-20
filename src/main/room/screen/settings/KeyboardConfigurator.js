// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.KeyboardConfigurator = function(controllersHub) {

    this.setupKeyboard = function (mainElement) {
        popup = document.getElementById("wmsx-keyboard-popup");
        popup.innerHTML = popupHTML;
        popupKeyNone = document.getElementById("wmsx-keyboard-popup-keyNone");
        for (var i = 0; i < 3; ++i) {
            popupKeys[i] = document.getElementById("wmsx-keyboard-popup-key" + (i + 1));
            popupKeysLabel[i] = document.getElementById("wmsx-keyboard-popup-key" + (i + 1) + "-label");
        }

        var styles = document.createElement('style');
        styles.type = 'text/css';
        styles.innerHTML = css;
        document.head.appendChild(styles);

        for (var s in sections) {
            var section = document.createElement("div");
            section.id = "wmsx-keyboard-" + s;
            mainElement.appendChild(section);
            var rows = sections[s];
            for (var r = 0; r < rows.length; ++r) {
                var rowDiv = document.createElement("div");
                section.appendChild(rowDiv);
                var row = rows[r];
                for (var c = 0; c < row.length; ++c) {
                    var key = row[c];
                    var keyElement = document.createElement("div");
                    keyElement.id = "wmsx-keyboard-" + (s !== "alpha" ? s + "-" : "") + key.toLocaleLowerCase();
                    keyElement.classList.add("wmsx-keyboard-key");
                    if (dark.indexOf(keyElement.id) >= 0) keyElement.classList.add("wmsx-keyboard-key-dark");
                    keyElement.innerHTML = labels[key] || key;
                    keyElement.msxKey = key;
                    rowDiv.appendChild(keyElement);
                    setupKeyEvents(keyElement);
                }
            }
        }
    };

    function setupKeyEvents(keyElement) {
        if (ignored.indexOf(keyElement.msxKey) >= 0) return;

        keyElement.addEventListener("mouseenter", function mouseEnter() {
            showPopup(keyElement);
        });
        keyElement.addEventListener("mouseleave", function mouseLeave() {
            hidePopup();
        });
    }

    function showPopup(keyElement) {
        // Define contents
        var mapped = domKeyboard.getKeyMapping(keyElement.msxKey) || [];
        for (var i = 0; i < 3; i++) {
            popupKeys[i].style.display = mapped[i] ? "inline" : "none";
            popupKeysLabel[i].innerHTML = mapped[i] && mapped[i].n;
        }
        popupKeyNone.style.display = mapped.length === 0 ? "inline" : "none";

        // Position
        popup.style.display = "block";
        var keyRec = keyElement.getBoundingClientRect();
        var popRec = popup.getBoundingClientRect();
        var x = (keyRec.left + keyRec.width / 2 - popRec.width / 2) | 0;
        var y = (keyRec.top - popRec.height - POPUP_DIST) | 0;
        popup.style.top = "" + y + "px";
        popup.style.left = "" + x + "px";
        //
        //'left: ' + ((POPUP_WIDTH / 2 - + POPUP_BORDER_WIDTH - 9) | 0) + 'px;' +

    }

    function hidePopup() {
        popup.style.display = "none";
    }


    var domKeyboard = controllersHub.getKeyboard();

    var popup, popupKeyNone, popupKeys = [], popupKeysLabel = [];
    var POPUP_BORDER_WIDTH = 8, POPUP_DIST = 14;


    var sections = {    // MSX key names
        alpha: [
            ["F1", "F2", "F3", "F4", "F5", "STOP", "SELECT", "HOME", "INSERT", "DELETE"],
            ["ESCAPE", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D0", "MINUS", "EQUAL", "BACKSLASH", "BACKSPACE"],
            ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "OPEN_BRACKET", "CLOSE_BRACKET", "ENTER_X1", "ENTER_X2"],
            ["CONTROL", "A", "S", "D", "F", "G", "H", "J", "K", "L", "SEMICOLON", "QUOTE", "BACKQUOTE", "ENTER"],
            ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", "COMMA", "PERIOD", "SLASH", "SHIFT"],
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
        COMMA: ",", PERIOD: ".", SLASH: "/", CAPSLOCK: "CAPS",
        NUM_DIVIDE: "/", NUM_MULTIPLY: "*", NUM_MINUS: "-", NUM_PLUS: "+", NUM_PERIOD: ".", NUM_COMMA: ",",
        NUM_1: "1", NUM_2: "2", NUM_3: "3", NUM_4: "4", NUM_5: "5", NUM_6: "6", NUM_7: "7", NUM_8: "8", NUM_9: "9", NUM_0: "0",
        LEFT: "&#9668;", UP: "&#9650;", DOWN: "&#9660;", RIGHT: "&#9658;"
    };

    var dark = [
        "wmsx-keyboard-escape", "wmsx-keyboard-tab", "wmsx-keyboard-control", "wmsx-keyboard-shift", "wmsx-keyboard-capslock", "wmsx-keyboard-graph",
        "wmsx-keyboard-backspace", "wmsx-keyboard-enter", "wmsx-keyboard-enter_x1", "wmsx-keyboard-enter_x2", "wmsx-keyboard-shift", "wmsx-keyboard-code", "wmsx-keyboard-dead",
        "wmsx-keyboard-num_divide", "wmsx-keyboard-num_multiply", "wmsx-keyboard-num_minus", "wmsx-keyboard-num_plus"
    ];

    var ignored = [
        "ENTER_X1", "ENTER_X2"
    ];


    var popupHTML =
        'Key mapped to:' +
        '<br>' +
        '<div class="wmsx-command">' +
            '<span id="wmsx-keyboard-popup-keyNone">none</span>' +
            '<span id="wmsx-keyboard-popup-key1"><div id="wmsx-keyboard-popup-key1-label" class="wmsx-key"></div></span>' +
            '<span id="wmsx-keyboard-popup-key2">&nbsp;,&nbsp<div id="wmsx-keyboard-popup-key2-label" class="wmsx-key"></div></span>' +
            '<span id="wmsx-keyboard-popup-key3">&nbsp;,&nbsp<div id="wmsx-keyboard-popup-key3-label" class="wmsx-key"></div></span>' +
        '</div>' +
        '<div>(press new key)</div>';

    var css =
        '#wmsx-inputs #wmsx-keyboard-outer {' +
            'margin-left: -8px;' +
            'width: 522px;' +
            'height: 162px;' +
            'padding: 12px 0 0 14px;' +
            'background: rgb(74, 74, 74);' +
            'overflow: hidden;' +
            'border-radius: 1px 1px 0px 0px;' +
            'box-shadow: 0px 1px 0 1px rgb(10, 10, 10);' +
        '}' +

        '#wmsx-inputs #wmsx-keyboard-popup {' +
            'display: none;' +
            'position: fixed;' +
            'top: 1000px;' +
            'left: 1000px;' +
            'padding: 5px 8px;' +
            'text-align: center;' +
            'vertical-align: top;' +
            'border-radius: 6px;' +
            'border: ' + POPUP_BORDER_WIDTH + 'px white solid;' +
            'background: rgb(220, 220, 220);' +
            'box-shadow: 0px 3px 3px 2px rgba(0, 0, 0, .55);' +
            'box-sizing: border-box;' +
        '}' +
        '#wmsx-inputs #wmsx-keyboard-popup .wmsx-command {' +
            'margin: 8px 0 7px;' +
            'font-weight: 600;' +
        '}' +

        '#wmsx-inputs #wmsx-keyboard-popup:after {' +
            'content: "";' +
            'position: absolute;' +
            'bottom: 0;' +
            'left: 0;' +
            'right: 0;' +
            'width: 0;' +
            'margin: 0 auto;' +
            'border-width: 10px;' +
            'border-style: solid;' +
            'border-color: transparent white white transparent;' +
            'box-shadow: 4px 4px 2px 0 rgba(0, 0, 0, .55);' +
            'transform: translateY(' + (POPUP_BORDER_WIDTH * 2) + 'px) rotate(45deg) ;' +
            '-webkit-transform: translateY(' + (POPUP_BORDER_WIDTH * 2) + 'px) rotate(45deg) ;' +
        '}' +

        '#wmsx-inputs #wmsx-keyboard {' +
            'position: relative;' +
            'width: 1000px;' +
        '}' +

        '.wmsx-keyboard-key {' +
            'position: relative;' +
            'display: inline-block;' +
            'width: 25px;' +
            'height: 24px;' +
            'padding: 4px 0px;' +
            'margin-right: 1px;' +
            'box-sizing: border-box;' +
            'font-weight: 500;' +
            'font-size: 10px;' +
            'line-height: 10px;' +
            'text-align: center;' +
            'vertical-align: top;' +
            'color: white;' +
            'background: rgb(172, 172, 172);' +
            'border-style: solid;' +
            'border-width: 1px 3px 5px;' +
            'border-color: rgba(0, 0, 0, .25);' +
            'border-top-color: rgba(0, 0, 0, .10);' +
            'border-bottom-color: rgba(0, 0, 0, .5);' +
            'border-radius: 3px 3px 0px 0px;' +
            'box-shadow: 0 1px 0 1px rgb(0, 0, 0);' +
            'cursor: pointer;' +
        '}' +
        '.wmsx-keyboard-key.wmsx-keyboard-key-dark {' +
            'background: rgb(127, 127, 127);' +
        '}' +

        '#wmsx-keyboard-alpha, #wmsx-keyboard-num, #wmsx-keyboard-arrows {' +
            'position: absolute;' +
        '}' +
        '#wmsx-keyboard-num {' +
            'left: 413px;' +
        '}' +
        '#wmsx-keyboard-arrows {' +
            'top: 106px;' +
            'left: 413px;' +
        '}' +

        '#wmsx-keyboard-f1, #wmsx-keyboard-f2, #wmsx-keyboard-f3, #wmsx-keyboard-f4, #wmsx-keyboard-f5, ' +
        '#wmsx-keyboard-stop, #wmsx-keyboard-select, #wmsx-keyboard-home, #wmsx-keyboard-insert, #wmsx-keyboard-delete {' +
            'width: 37px;' +
            'height: 18px;' +
            'padding: 2px 0px;' +
            'font-size: 9px;' +
            'line-height: 9px;' +
            'border-width: 1px 2px 4px;' +
            'margin-bottom: 12px;' +
        '}' +
        '#wmsx-keyboard-stop, #wmsx-keyboard-select, #wmsx-keyboard-home, #wmsx-keyboard-insert, #wmsx-keyboard-delete {' +
            'width: 37px;' +
        '}' +
        '#wmsx-keyboard-stop {' +
            'background: rgb(240, 80, 60);' +
            'margin-left: 18px;' +
        '}' +
        '#wmsx-keyboard-escape, #wmsx-keyboard-backspace {' +
            'width: 29px;' +
        '}' +
        '#wmsx-keyboard-tab {' +
            'width: 41px;' +
        '}' +
        '#wmsx-keyboard-control {' +
            'width: 48px;' +
        '}' +
        '#wmsx-keyboard-shift {' +
            'width: 61px;' +
        '}' +
        '#wmsx-keyboard-enter {' +
            'width: 36px;' +
            'border-radius: 2px 0px 0px 0px;' +
            'border-top-width: 0px;' +
        '}' +
        '#wmsx-keyboard-enter_x1 {' +
            'width: 13px;' +
            'min-width: 0px;' +
            'margin-right: 0px;' +
            'border-radius: 2px 0px 0px 0px;' +
            'border-width: 1px;' +
            'border-right: none;' +
            'box-shadow: -1px 1px 0 0 rgb(0, 0, 0)' +
        '}' +
        '#wmsx-keyboard-enter_x2 {' +
            'width: 30px;' +
            'border-bottom: none;' +
            'border-radius: 0px 3px 0px 0px;' +
            'box-shadow: 1px 1px 0 0 rgb(0, 0, 0)' +
        '}' +
        '#wmsx-keyboard-space {' +
            'width: 181px;' +
        '}' +
        '#wmsx-keyboard-capslock {' +
            'margin-left: 15px;' +
            'width: 38px;' +
        '}' +
        '#wmsx-keyboard-dead {' +
            'width: 38px;' +
        '}' +
        '#wmsx-keyboard-graph, #wmsx-keyboard-code {' +
            'width: 46px;' +
        '}' +

        '#wmsx-keyboard-num .wmsx-keyboard-key {' +
            'width: 23px;' +
            'height: 23px;' +
        '}' +

        '#wmsx-keyboard-arrows .wmsx-keyboard-key {' +
            'font-size: 8px;' +
            'line-height: 8px;' +
            'background: rgb(70, 85, 180);' +
            'border-width: 1px 2px 4px;' +
            'border-radius: 2px 2px 0px 0px;' +
        '}' +
        '#wmsx-keyboard-arrows #wmsx-keyboard-arrows-left, #wmsx-keyboard-arrows #wmsx-keyboard-arrows-right {' +
            'top: 5px;' +
            'width: 26px;' +
            'height: 34px;' +
            'padding-top: 11px;' +
        '}' +
        '#wmsx-keyboard-arrows #wmsx-keyboard-arrows-up, #wmsx-keyboard-arrows #wmsx-keyboard-arrows-down {' +
            'width: 41px;' +
            'height: 22px;' +
            'padding-top: 5px;' +
        '}' +
        '#wmsx-keyboard-arrows #wmsx-keyboard-arrows-down {' +
            'position: absolute;' +
            'top: 22px;' +
            'left: 27px;' +
        '}' +

        '';

};
