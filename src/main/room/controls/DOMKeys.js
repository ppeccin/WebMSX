// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMKeysImpl = function() {

    var self = this;

    function initKeys() {
        self.VK_F1 = {c: 112, n: "F1"};
        self.VK_F2 = {c: 113, n: "F2"};
        self.VK_F3 = {c: 114, n: "F3"};
        self.VK_F4 = {c: 115, n: "F4"};
        self.VK_F5 = {c: 116, n: "F5"};
        self.VK_F6 = {c: 117, n: "F6"};
        self.VK_F7 = {c: 118, n: "F7"};
        self.VK_F8 = {c: 119, n: "F8"};
        self.VK_F9 = {c: 120, n: "F9"};
        self.VK_F10 = {c: 121, n: "F10"};
        self.VK_F11 = {c: 122, n: "F11"};
        self.VK_F12 = {c: 123, n: "F12"};

        self.VK_1 = {c: 49, n: "1"};
        self.VK_2 = {c: 50, n: "2"};
        self.VK_3 = {c: 51, n: "3"};
        self.VK_4 = {c: 52, n: "4"};
        self.VK_5 = {c: 53, n: "5"};
        self.VK_6 = {c: 54, n: "6"};
        self.VK_7 = {c: 55, n: "7"};
        self.VK_8 = {c: 56, n: "8"};
        self.VK_9 = {c: 57, n: "9"};
        self.VK_0 = {c: 48, n: "0"};

        self.VK_Q = {c: 81, n: "Q"};
        self.VK_W = {c: 87, n: "W"};
        self.VK_E = {c: 69, n: "E"};
        self.VK_R = {c: 82, n: "R"};
        self.VK_T = {c: 84, n: "T"};
        self.VK_Y = {c: 89, n: "Y"};
        self.VK_U = {c: 85, n: "U"};
        self.VK_I = {c: 73, n: "I"};
        self.VK_O = {c: 79, n: "O"};
        self.VK_P = {c: 80, n: "P"};
        self.VK_A = {c: 65, n: "A"};
        self.VK_S = {c: 83, n: "S"};
        self.VK_D = {c: 68, n: "D"};
        self.VK_F = {c: 70, n: "F"};
        self.VK_G = {c: 71, n: "G"};
        self.VK_H = {c: 72, n: "H"};
        self.VK_J = {c: 74, n: "J"};
        self.VK_K = {c: 75, n: "K"};
        self.VK_L = {c: 76, n: "L"};
        self.VK_Z = {c: 90, n: "Z"};
        self.VK_X = {c: 88, n: "X"};
        self.VK_C = {c: 67, n: "C"};
        self.VK_V = {c: 86, n: "V"};
        self.VK_B = {c: 66, n: "B"};
        self.VK_N = {c: 78, n: "N"};
        self.VK_M = {c: 77, n: "M"};

        self.VK_ESCAPE = {c: 27, n: "Esc"};
        self.VK_ENTER = {c: 13, n: "Enter"};
        self.VK_SPACE = {c: 32, n: "Space"};
        self.VK_TAB = {c: 9, n: "Tab"};
        self.VK_BACKSPACE = {c: 8, n: "Bkspc"};

        self.VK_SHIFT = {c: 16, n: "Shift"};
        self.VK_CONTROL = {c: 17, n: "Ctrl"};
        self.VK_ALT = {c: 18, n: "Alt"};

        self.VK_CAPS_LOCK = {c: 20, n: "CpsLck"};
        self.VK_PRINT_SCREEN = {c: 44, n: "PrtScr"};
        self.VK_SCROLL_LOCK = {c: 145, n: "ScrLck"};
        self.VK_PAUSE = {c: 19, n: "Pause"};
        self.VK_CTRL_PAUSE = {c: 3, n: "Pause"};

        self.VK_INSERT = {c: 45, n: "Ins"};
        self.VK_DELETE = {c: 46, n: "Del"};
        self.VK_HOME = {c: 36, n: "Home"};
        self.VK_END = {c: 35, n: "End"};
        self.VK_PAGE_UP = {c: 33, n: "PgUp"};
        self.VK_PAGE_DOWN = {c: 34, n: "PgDown"};

        self.VK_UP = {c: 38, n: "Up"};
        self.VK_DOWN = {c: 40, n: "Down"};
        self.VK_LEFT = {c: 37, n: "Left"};
        self.VK_RIGHT = {c: 39, n: "Right"};

        self.VK_NUM_LOCK = {c: 144, n: "Num"};
        self.VK_NUM_COMMA = {c: 110, n: "Num ,"};
        self.VK_NUM_DIVIDE = {c: 111, n: "Num /"};
        self.VK_NUM_MULTIPLY = {c: 106, n: "Num *"};
        self.VK_NUM_MINUS = {c: 109, n: "Num -"};
        self.VK_NUM_PLUS = {c: 107, n: "Num +"};
        self.VK_NUM_PERIOD = {c: 194, n: "Num ."};
        self.VK_NUM_0 = {c: 96, n: "Num 0"};
        self.VK_NUM_1 = {c: 97, n: "Num 1"};
        self.VK_NUM_2 = {c: 98, n: "Num 2"};
        self.VK_NUM_3 = {c: 99, n: "Num 3"};
        self.VK_NUM_4 = {c: 100, n: "Num 4"};
        self.VK_NUM_5 = {c: 101, n: "Num 5"};
        self.VK_NUM_6 = {c: 102, n: "Num 6"};
        self.VK_NUM_7 = {c: 103, n: "Num 7"};
        self.VK_NUM_8 = {c: 104, n: "Num 8"};
        self.VK_NUM_9 = {c: 105, n: "Num 9"};
        self.VK_NUM_CENTER = {c: 12, n: "Num Cntr"};

        self.VK_QUOTE = {c: 222, n: "'"};
        self.VK_BACKQUOTE = {c: 192, n: "`"};

        self.VK_MINUS = {c: 189, n: "-"};
        self.VK_MINUS_FF = {c: 173, n: "-"};
        self.VK_EQUALS = {c: 187, n: "="};
        self.VK_EQUALS_FF = {c: 61, n: "="};
        self.VK_OPEN_BRACKET = {c: 219, n: "["};
        self.VK_CLOSE_BRACKET = {c: 221, n: "]"};
        self.VK_COMMA = {c: 188, n: ","};
        self.VK_PERIOD = {c: 190, n: "."};
        self.VK_SEMICOLON = {c: 186, n: ";"};
        self.VK_SEMICOLON_FF = {c: 59, n: ";"};
        self.VK_SLASH = {c: 191, n: "/"};
        self.VK_BACKSLASH = {c: 220, n: "\\"};

        // BR key codes and additional keys
        self.BR_VK_QUOTE = {c: 192, n: "'"};
        self.BR_VK_OPEN_BRACKET = {c: 221, n: "["};
        self.BR_VK_CLOSE_BRACKET = {c: 220, n: "]"};
        self.BR_VK_TILDE = {c: 222, n: "~"};
        self.BR_VK_TILDE_FF = {c: 176, n: "~"};
        self.BR_VK_ACUTE = {c: 219, n: "´"};
        self.BR_VK_SEMICOLON = {c: 191, n: ";"};
        self.BR_VK_SLASH = {c: 193, n: "/"};
        self.BR_VK_BACKSLASH = {c: 226, n: "\\"};
        self.BR_VK_CEDILLA = {c: 186, n: "Ç"};
        self.BR_VK_CEDILLA_FF = {c: 0, n: "Ç"};

        self.VK_UNBOUND = {c: -1, n: "Unbound"};
    }

    this.setUSKeys = function () {
        initKeys();
    };

    this.setBRKeys = function () {
        initKeys();

        // Apply modifications
        // Apparently FF does not need these since it already does the translations itself
        if (wmsx.Util.browserInfo().name != "FIREFOX") {
            self.VK_QUOTE = self.BR_VK_QUOTE;
            self.VK_OPEN_BRACKET = self.BR_VK_OPEN_BRACKET;
            self.VK_CLOSE_BRACKET = self.BR_VK_CLOSE_BRACKET;
            self.VK_BACKQUOTE = self.BR_VK_ACUTE;
            self.VK_SEMICOLON = self.BR_VK_SEMICOLON;
            self.VK_SLASH = self.BR_VK_SLASH;
            self.VK_BACKSLASH = self.BR_VK_BACKSLASH;
        }
    };

    this.supportedKeyboards = function() {
        return keyboards;
    };

    this.setKeyboard = function (code) {
        currentKeyboard = code >= keyboards.length ? 0 : code;
        keyboards[currentKeyboard].set();
    };

    this.getKeyboard = function () {
        return keyboards[currentKeyboard];
    };

    var setDefaultLocalKeyboard = function () {
        // Try to guess a matching keyboard from the navigator language. Defaults to en-US
        var lang = wmsx.Util.userLanguage();
        var code = 0;
        for (var i = 0; i < keyboards.length; i++)
            if (lang.indexOf(keyboards[i].name) === 0) {
                code = i; break;
            }
        self.setKeyboard(code);
    };


    var keyboards = [
        { code: 0, name: "en-US", set: self.setUSKeys },
        { code: 1, name: "pt-BR", set: self.setBRKeys }
    ];

    var currentKeyboard;


    setDefaultLocalKeyboard();

};

wmsx.DOMKeys = new wmsx.DOMKeysImpl();


//function initByCode() {
//    this.byCode = {};
//    for (var key in this)
//        if (key.indexOf("VK") === 0)
//            this.byCode[this[key].c] = this[key];
//}
