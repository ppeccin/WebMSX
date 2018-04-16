// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// General, immutable info about host keys on different browsers and keyboard languages/layouts

wmsx.DOMKeys = {};

wmsx.DOMKeys.LOC_BIT_SHIFT = 24;

wmsx.DOMKeys.SHIFT =   0x10000;
wmsx.DOMKeys.CONTROL = 0x20000;
wmsx.DOMKeys.ALT =     0x40000;
wmsx.DOMKeys.META =    0x80000;

wmsx.DOMKeys.LOCNONE =  0x0000000;
wmsx.DOMKeys.LOCLEFT =  0x1000000;
wmsx.DOMKeys.LOCRIGHT = 0x2000000;
wmsx.DOMKeys.LOCNUM =   0x3000000;

wmsx.DOMKeys.IGNORE_ALL_MODIFIERS_MASK = ~(wmsx.DOMKeys.SHIFT | wmsx.DOMKeys.CONTROL | wmsx.DOMKeys.ALT | wmsx.DOMKeys.META);


(function(k, left, right, num) {

    // Common keys (US)

    k.VK_F1 = {c: 112, n: "F1" };
    k.VK_F2 = {c: 113, n: "F2" };
    k.VK_F3 = {c: 114, n: "F3" };
    k.VK_F4 = {c: 115, n: "F4" };
    k.VK_F5 = {c: 116, n: "F5" };
    k.VK_F6 = {c: 117, n: "F6" };
    k.VK_F7 = {c: 118, n: "F7" };
    k.VK_F8 = {c: 119, n: "F8" };
    k.VK_F9 = {c: 120, n: "F9" };
    k.VK_F10 = {c: 121, n: "F10" };
    k.VK_F11 = {c: 122, n: "F11" };
    k.VK_F12 = {c: 123, n: "F12" };

    k.VK_1 = {c: 49, n: "1" };
    k.VK_2 = {c: 50, n: "2" };
    k.VK_3 = {c: 51, n: "3" };
    k.VK_4 = {c: 52, n: "4" };
    k.VK_5 = {c: 53, n: "5" };
    k.VK_6 = {c: 54, n: "6" };
    k.VK_7 = {c: 55, n: "7" };
    k.VK_8 = {c: 56, n: "8" };
    k.VK_9 = {c: 57, n: "9" };
    k.VK_0 = {c: 48, n: "0" };

    k.VK_Q = {c: 81, n: "Q" };
    k.VK_W = {c: 87, n: "W" };
    k.VK_E = {c: 69, n: "E" };
    k.VK_R = {c: 82, n: "R" };
    k.VK_T = {c: 84, n: "T" };
    k.VK_Y = {c: 89, n: "Y" };
    k.VK_U = {c: 85, n: "U" };
    k.VK_I = {c: 73, n: "I" };
    k.VK_O = {c: 79, n: "O" };
    k.VK_P = {c: 80, n: "P" };
    k.VK_A = {c: 65, n: "A" };
    k.VK_S = {c: 83, n: "S" };
    k.VK_D = {c: 68, n: "D" };
    k.VK_F = {c: 70, n: "F" };
    k.VK_G = {c: 71, n: "G" };
    k.VK_H = {c: 72, n: "H" };
    k.VK_J = {c: 74, n: "J" };
    k.VK_K = {c: 75, n: "K" };
    k.VK_L = {c: 76, n: "L" };
    k.VK_Z = {c: 90, n: "Z" };
    k.VK_X = {c: 88, n: "X" };
    k.VK_C = {c: 67, n: "C" };
    k.VK_V = {c: 86, n: "V" };
    k.VK_B = {c: 66, n: "B" };
    k.VK_N = {c: 78, n: "N" };
    k.VK_M = {c: 77, n: "M" };

    k.VK_ESCAPE = {c: 27, n: "Esc" };
    k.VK_ENTER = {c: 13, n: "Enter" };
    k.VK_SPACE = {c: 32, n: "Space" };
    k.VK_TAB = {c: 9, n: "Tab" };
    k.VK_BACKSPACE = {c: 8, n: "BackSpc" };

    k.VK_CONTEXT = {c: 93, n: "Context" };

    k.VK_LSHIFT = {c: 16 | left, n: "L-Shift" };
    k.VK_LCONTROL = {c: 17 | left, n: "L-Control" };
    k.VK_LALT = {c: 18 | left, n: "L-Alt" };
    k.VK_LMETA = {c: 91 | left, n: "L-Meta" };

    k.VK_RSHIFT = {c: 16 | right, n: "R-Shift" };
    k.VK_RCONTROL = {c: 17 | right, n: "R-Control" };
    k.VK_RALT = {c: 18 | right, n: "R-Alt" };
    k.VK_RMETA = {c: 91 | right, n: "R-Meta" };

    k.VK_CAPS_LOCK = {c: 20, n: "CapsLock" };
    k.VK_PRINT_SCREEN = {c: 44, n: "PrtScr" };
    k.VK_SCROLL_LOCK = {c: 145, n: "ScrLck" };
    k.VK_PAUSE = {c: 19, n: "Pause" };
    k.VK_BREAK = {c: 3, n: "Break" };

    k.VK_INSERT = {c: 45, n: "Ins" };
    k.VK_DELETE = {c: 46, n: "Del" };
    k.VK_HOME = {c: 36, n: "Home" };
    k.VK_END = {c: 35, n: "End" };
    k.VK_PAGE_UP = {c: 33, n: "PgUp" };
    k.VK_PAGE_DOWN = {c: 34, n: "PgDown" };

    k.VK_NUM_INSERT = {c: 45 | num, n: "Num Ins" };
    k.VK_NUM_DELETE = {c: 46 | num, n: "Num Del" };
    k.VK_NUM_HOME = {c: 36 | num, n: "Num Home" };
    k.VK_NUM_END = {c: 35 | num, n: "Num End" };
    k.VK_NUM_PAGE_UP = {c: 33 | num, n: "Num PgUp" };
    k.VK_NUM_PAGE_DOWN = {c: 34 | num, n: "Num PgDown" };

    k.VK_UP = {c: 38, n: "Up" };
    k.VK_DOWN = {c: 40, n: "Down" };
    k.VK_LEFT = {c: 37, n: "Left" };
    k.VK_RIGHT = {c: 39, n: "Right" };

    k.VK_NUM_UP = {c: 38 | num, n: "Num Up" };
    k.VK_NUM_DOWN = {c: 40 | num, n: "Num Down" };
    k.VK_NUM_LEFT = {c: 37 | num, n: "Num Left" };
    k.VK_NUM_RIGHT = {c: 39 | num, n: "Num Right" };

    k.VK_NUMLOCK = {c: 144, n: "NumLock" };
    k.VK_NUM_COMMA = {c: 110 | num, n: "Num ," };
    k.VK_NUM_DIVIDE = {c: 111 | num, n: "Num /" };
    k.VK_NUM_MULTIPLY = {c: 106 | num, n: "Num *" };
    k.VK_NUM_MINUS = {c: 109 | num, n: "Num -" };
    k.VK_NUM_PLUS = {c: 107 | num, n: "Num +" };
    k.VK_NUM_PERIOD = {c: 194 | num, n: "Num ." };
    k.VK_NUM_0 = {c: 96 | num, n: "Num 0" };
    k.VK_NUM_1 = {c: 97 | num, n: "Num 1" };
    k.VK_NUM_2 = {c: 98 | num, n: "Num 2" };
    k.VK_NUM_3 = {c: 99 | num, n: "Num 3" };
    k.VK_NUM_4 = {c: 100 | num, n: "Num 4" };
    k.VK_NUM_5 = {c: 101 | num, n: "Num 5" };
    k.VK_NUM_6 = {c: 102 | num, n: "Num 6" };
    k.VK_NUM_7 = {c: 103 | num, n: "Num 7" };
    k.VK_NUM_8 = {c: 104 | num, n: "Num 8" };
    k.VK_NUM_9 = {c: 105 | num, n: "Num 9" };
    k.VK_NUM_CLEAR = {c: 12 | num, n: "Num Clear" };
    k.VK_NUM_ENTER = {c: 13 | num, n: "Num Enter" };

    k.VK_QUOTE = {c: 222, n: "'" };
    k.VK_BACKQUOTE = {c: 192, n: "`" };
    k.VK_MINUS = {c: 189, n: "-" };
    k.VK_EQUALS = {c: 187, n: "=" };
    k.VK_OPEN_BRACKET = {c: 219, n: "[" };
    k.VK_CLOSE_BRACKET = {c: 221, n: "]" };
    k.VK_COMMA = {c: 188, n: "," };
    k.VK_PERIOD = {c: 190, n: "." };
    k.VK_SEMICOLON = {c: 186, n: ";" };
    k.VK_SLASH = {c: 191, n: "/" };
    k.VK_BACKSLASH = {c: 220, n: "\\" };

    k.VK_ALTERNATE_ESC = { c: k.VK_F1.c | wmsx.DOMKeys.ALT, n: [ "Alt", "F1" ] };

    // FireFox specific codes (US)
    k.VK_FF_MINUS = {c: 173, n: "-" };
    k.VK_FF_EQUALS = {c: 61, n: "=" };
    k.VK_FF_SEMICOLON = {c: 59, n: ";" };

    // BR alternate codes
    k.VK_BR_QUOTE = {c: 192, n: "'" };
    k.VK_BR_OPEN_BRACKET = {c: 221, n: "[" };
    k.VK_BR_CLOSE_BRACKET = {c: 220, n: "]" };
    k.VK_BR_SEMICOLON = {c: 191, n: ";" };
    k.VK_BR_SLASH = {c: 193, n: "/" };
    k.VK_BR_BACKSLASH = {c: 226, n: "\\" };
    // BR additional keys
    k.VK_BR_CEDILLA = {c: 186, n: "Ç" };
    k.VK_BR_TILDE = {c: 222, n: "~" };
    k.VK_BR_ACUTE = {c: 219, n: "´" };
    k.VK_FF_BR_TILDE = {c: 176, n: "~" };
    //k.VK_FF_BR_CEDILLA = {c: 0, n: "Ç" };

    // JP alternate codes
    k.VK_JP_CIRCUMFLEX = {c: 222, n: "^" };
    k.VK_JP_ARROBA = {c: 192, n: "@" };
    k.VK_JP_OPEN_BRACKET = {c: 219, n: "[" };
    k.VK_JP_SEMICOLLON = {c: 187, n: ";" };
    k.VK_JP_COLLON = {c: 186, n: ":" };
    k.VK_JP_BACKSLASH = {c: 226, n: "\\" };
    k.VK_JP_CAPS_LOCK = {c: 240, n: "CapsLock" };
    k.VK_FF_JP_CIRCUMFLEX = {c: 160, n: "^" };
    k.VK_FF_JP_ARROBA = {c: 64, n: "@" };
    k.VK_FF_JP_SEMICOLLON = {c: 59, n: ";" };
    k.VK_FF_JP_COLLON = {c: 58, n: ":" };
    // JP additional keys
    k.VK_JP_NOCONV = {c: 29, n: "NoConv" };
    k.VK_JP_CONV = {c: 28, n: "Conv" };
    k.VK_JP_KANA = {c: 242, n: "Kana" };

    k.VK_VOID = {c: -1, n: "Unbound"}

})(wmsx.DOMKeys, wmsx.DOMKeys.LOCLEFT, wmsx.DOMKeys.LOCRIGHT, wmsx.DOMKeys.LOCNUM);

wmsx.DOMKeys.forcedNames = {
    27:  "Esc",
    13:  "Enter",
    32:  "Space",
    9:   "Tab",
    8:   "BackSpc",
    16:  "Shift",
    17:  "Control",
    18:  "Alt",
    91:  "Meta",
    93:  "Context",
    20:  "CapsLock",
    44:  "PrtScr",
    145: "ScrLck",
    19:  "Pause",
    3:   "Break",
    45:  "Ins",
    46:  "Del",
    36:  "Home",
    35:  "End",
    33:  "PgUp",
    34:  "PgDown",
    38:  "Up",
    40:  "Down",
    37:  "Left",
    39:  "Right"
};

wmsx.DOMKeys.isModifierKey = function(e) {
    var keyCode = e.keyCode;
    return keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 91;
};

wmsx.DOMKeys.codeForKeyboardEvent = function(e) {
    var code = e.keyCode;

    // Does not return modifiers for modifier keys SHIFT, CONTROL, ALT, META
    if (this.isModifierKey(e))
        return code | (e.location << this.LOC_BIT_SHIFT);

    return code
        | (e.location << this.LOC_BIT_SHIFT)
        | (e.shiftKey ? this.SHIFT : 0)
        | (e.ctrlKey ? this.CONTROL : 0)
        | (e.altKey  ? this.ALT : 0)
        | (e.metaKey ? this.META : 0);
};

wmsx.DOMKeys.nameForKeyboardEvent = function(e) {
    var keyCode = e.keyCode;
    var name = this.forcedNames[keyCode] || e.key;
    var nameUp = name && name.toUpperCase();
    if (!nameUp || nameUp === "UNIDENTIFIED" || nameUp === "UNDEFINED" || nameUp === "UNKNOWN") name = "#" + keyCode;
    else if (nameUp === "DEAD") name = "Dead#" + keyCode;

    if (name.length === 1) name = name.toUpperCase();                           // For normal letters
    else if (name.length > 12) name = name.substr(0, 12);                       // Limit size

    // Add locaiton info
    switch(e.location) {
        case 1: name = "L-" + name; break;
        case 2: name = "R-" + name; break;
        case 3: name = "Num " + name;
    }

    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
        name = [ name ];
        // Add modifiers info
        if (e.metaKey) name.unshift("Meta");
        if (e.altKey) name.unshift("Alt");
        if (e.ctrlKey) name.unshift("Ctrl");
        if (e.shiftKey) name.unshift("Shift");
    }

    return name;
};
