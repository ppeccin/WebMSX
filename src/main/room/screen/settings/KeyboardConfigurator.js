// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.KeyboardConfigurator = function() {

    this.setupKeyboard = function (mainElement) {
        popup = document.getElementById("wmsx-keyboard-popup");
        popup.innerHTML = popupHTML;
        popupKey = document.getElementById("wmsx-keyboard-popup-key");
        popupKey.innerHTML = "H";

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
                    var name = row[c];
                    var key = document.createElement("div");
                    key.id = "wmsx-keyboard-" + (s !== "alpha" ? s + "-" : "") + name.toLocaleLowerCase();
                    key.classList.add("wmsx-keyboard-key");
                    if (dark.indexOf(key.id) >= 0) key.classList.add("wmsx-keyboard-key-dark");
                    key.innerHTML = (empty.indexOf(key.id) >= 0) ? "" : labels[name] || name;
                    rowDiv.appendChild(key);
                    setupKeyEvents(key);
                }
            }
        }
    };

    function setupKeyEvents(key) {
        key.addEventListener("mouseenter", function mouseEnter() {
            showPopup(key);
        });
        key.addEventListener("mouseleave", function mouseLeave() {
            hidePopup();
        });
    }

    function showPopup(key) {
        var rec = key.getBoundingClientRect();
        var x = (rec.left + rec.width / 2 - POPUP_WIDTH / 2) | 0;
        var y = (rec.top - POPUP_HEIGHT - POPUP_DIST) | 0;

        popup.style.top = "" + y + "px";
        popup.style.left = "" + x + "px";
        popup.style.display = "block";
    }

    function hidePopup() {
        popup.style.display = "none";
    }


    var popup, popupKey;
    var POPUP_WIDTH = 118, POPUP_HEIGHT = 73, POPUP_DIST = 20;


    var sections = {
        alpha: [
            ["F1", "F2", "F3", "F4", "F5", "STOP", "SEL", "HOME", "INS", "DEL"],
            ["ESC", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "MINUS", "EQUAL", "BSLASH", "BS"],
            ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "OBRACKET", "CBRACKET", "RETX1", "RETX2"],
            ["CTRL", "A", "S", "D", "F", "G", "H", "J", "K", "L", "SEMICOLLON", "QUOTE", "GRAVE", "RET"],
            ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", "COMMA", "PERIOD", "SLASH", "SHIFT"],
            ["CAPS", "GRAPH", "SPACE", "CODE", "DEAD"]
        ],
        num: [
            ["7", "8", "9", "SLASH"],
            ["4", "5", "6", "MULTIPLY"],
            ["1", "2", "3", "MINUS"],
            ["0", "PERIOD", "COMMA", "PLUS"]
        ],
        arrows: [
            ["LEFT", "UP", "RIGHT", "DOWN" ]
        ]
    };

    var labels = {
        MINUS: "-", EQUAL: "=", BSLASH: "\\",
        SEMICOLLON: ";", QUOTE: "'", GRAVE: "`",
        OBRACKET: "[", CBRACKET: "]", COMMA: ",", PERIOD: ".", SLASH: "/",
        MULTIPLY: "*", PLUS: "+",
        LEFT: "&#9668;", UP: "&#9650;", DOWN: "&#9660;", RIGHT: "&#9658;"
    };

    var dark = [
        "wmsx-keyboard-esc", "wmsx-keyboard-tab", "wmsx-keyboard-ctrl", "wmsx-keyboard-shift", "wmsx-keyboard-caps", "wmsx-keyboard-graph",
        "wmsx-keyboard-bs", "wmsx-keyboard-ret", "wmsx-keyboard-retx1", "wmsx-keyboard-retx2", "wmsx-keyboard-shift", "wmsx-keyboard-code", "wmsx-keyboard-dead",
        "wmsx-keyboard-num-slash", "wmsx-keyboard-num-multiply", "wmsx-keyboard-num-minus", "wmsx-keyboard-num-plus"
    ];

    var empty = [
        "wmsx-keyboard-retx1", "wmsx-keyboard-retx2", "wmsx-keyboard-arrows-<", "wmsx-keyboard-arrows->", "wmsx-keyboard-arrows-^", "wmsx-keyboard-arrows-v"
    ];


    var popupHTML =
        'Key mapped to:' +
        '<br>' +
        '<div id="wmsx-keyboard-popup-key" class="wmsx-key">' +
        '</div>' +
        '<div>(press new key)</div>';

    var css =
        '#wmsx-inputs #wmsx-keyboard-outer {' +
            'margin-left: -8px;' +
            'width: 522px;' +
            'height: 162px;' +
            'padding: 12px 0 0 14px;' +
            'background: rgb(200, 200, 200);' +
            'background: rgb(72, 72, 72);' +
            'overflow: hidden;' +
            'border-radius: 1px 1px 0px 0px;' +
            'box-shadow: 0px 1px 0 1px rgb(10, 10, 10);' +
        '}' +

        '#wmsx-inputs #wmsx-keyboard-popup {' +
            'display: none;' +
            'position: fixed;' +
            'top: 1000px;' +
            'left: 1000px;' +
            'width: ' + POPUP_WIDTH + 'px;' +
            'height: ' + POPUP_HEIGHT + 'px;' +
            'padding-top: 6px;' +
            'text-align: center;' +
            'border-radius: 6px;' +
            'background: white;' +
            'box-shadow: 0px 3px 3px 2px rgba(0, 0, 0, .55);' +
        '}' +
        '#wmsx-inputs #wmsx-keyboard-popup .wmsx-key {' +
            'margin: 8px 0 7px;' +
        '}' +

        '#wmsx-inputs #wmsx-keyboard-popup:after {' +
            'content: "";' +
            'position: absolute;' +
            'transform: rotate(45deg);' +
            'bottom: -10px;' +
            'left: ' + ((POPUP_WIDTH / 2 - 9) | 0) + 'px;' +
            'border-width: 10px;' +
            'border-style: solid;' +
            'border-color: transparent white white transparent;' +
            'box-shadow: 4px 4px 2px 0 rgba(0, 0, 0, .55);' +
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
            'background: rgb(130, 130, 130);' +
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
        '#wmsx-keyboard-stop, #wmsx-keyboard-sel, #wmsx-keyboard-home, #wmsx-keyboard-ins, #wmsx-keyboard-del {' +
            'width: 37px;' +
            'height: 18px;' +
            'padding: 2px 0px;' +
            'font-size: 9px;' +
            'border-width: 1px 2px 4px;' +
            'margin-bottom: 12px;' +
        '}' +
        '#wmsx-keyboard-stop, #wmsx-keyboard-sel, #wmsx-keyboard-home, #wmsx-keyboard-ins, #wmsx-keyboard-del {' +
            'width: 37px;' +
        '}' +
        '#wmsx-keyboard-stop {' +
            'background: rgb(240, 80, 60);' +
            'margin-left: 18px;' +
        '}' +
        '#wmsx-keyboard-esc, #wmsx-keyboard-bs {' +
            'width: 29px;' +
        '}' +
        '#wmsx-keyboard-tab {' +
            'width: 41px;' +
        '}' +
        '#wmsx-keyboard-ctrl {' +
            'width: 48px;' +
        '}' +
        '#wmsx-keyboard-shift {' +
            'width: 60px;' +
        '}' +
        '#wmsx-keyboard-ret {' +
            'width: 36px;' +
            'border-radius: 2px 0px 0px 0px;' +
            'border-top-width: 0px;' +
        '}' +
        '#wmsx-keyboard-retx1 {' +
            'width: 13px;' +
            'min-width: 0px;' +
            'margin-right: 0px;' +
            'border-radius: 2px 0px 0px 0px;' +
            'border-width: 1px;' +
            'border-right: none;' +
            'box-shadow: -1px 1px 0 0 rgb(0, 0, 0)' +
        '}' +
        '#wmsx-keyboard-retx2 {' +
            'width: 30px;' +
            'border-bottom: none;' +
            'border-radius: 0px 3px 0px 0px;' +
            'box-shadow: 1px 1px 0 0 rgb(0, 0, 0)' +
        '}' +
        '#wmsx-keyboard-space {' +
            'width: 179px;' +
        '}' +
        '#wmsx-keyboard-caps {' +
            'margin-left: 16px;' +
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
            'font-size: 9px;' +
            'background: rgb(70, 85, 180);' +
            'border-width: 1px 2px 4px;' +
            'border-radius: 2px 2px 0px 0px;' +
        '}' +
        '#wmsx-keyboard-arrows #wmsx-keyboard-arrows-left, #wmsx-keyboard-arrows #wmsx-keyboard-arrows-right {' +
            'width: 26px;' +
            'height: 44px;' +
            'padding-top: 15px;' +
        '}' +
        '#wmsx-keyboard-arrows #wmsx-keyboard-arrows-up, #wmsx-keyboard-arrows #wmsx-keyboard-arrows-down {' +
            'width: 41px;' +
            'height: 22px;' +
        '}' +
        '#wmsx-keyboard-arrows #wmsx-keyboard-arrows-down {' +
            'position: absolute;' +
            'top: 22px;' +
            'left: 27px;' +
        '}' +

        '';

};
