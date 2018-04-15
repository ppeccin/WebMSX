// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// General, immutable info about host keys on different browsers and keyboard languages/layouts

wmsx.DOMKeysNew = {};

wmsx.DOMKeysNew.LOC_BIT_SHIFT = 20;

wmsx.DOMKeysNew.SHIFT =     0x10000;
wmsx.DOMKeysNew.CONTROL =   0x20000;
wmsx.DOMKeysNew.ALT =       0x40000;
wmsx.DOMKeysNew.META =      0x80000;

wmsx.DOMKeysNew.LOCNONE =  0x000000;
wmsx.DOMKeysNew.LOCLEFT =  0x100000;
wmsx.DOMKeysNew.LOCRIGHT = 0x200000;
wmsx.DOMKeysNew.LOCNUM =   0x300000;

wmsx.DOMKeysNew.IGNORE_ALL_MODIFIERS_MASK = ~(wmsx.DOMKeysNew.SHIFT | wmsx.DOMKeysNew.CONTROL | wmsx.DOMKeysNew.ALT | wmsx.DOMKeysNew.META);


(function(k, left, right, num) {

    // Common keys (US)

    k.VK_1 = { i: 1,  d: "Digit1", c: 49, n: "1" };
    k.VK_2 = { i: 2,  d: "Digit2", c: 50, n: "2" };
    k.VK_3 = { i: 3,  d: "Digit3", c: 51, n: "3" };
    k.VK_4 = { i: 4,  d: "Digit4", c: 52, n: "4" };
    k.VK_5 = { i: 5,  d: "Digit5", c: 53, n: "5" };
    k.VK_6 = { i: 6,  d: "Digit6", c: 54, n: "6" };
    k.VK_7 = { i: 7,  d: "Digit7", c: 55, n: "7" };
    k.VK_8 = { i: 8,  d: "Digit8", c: 56, n: "8" };
    k.VK_9 = { i: 9,  d: "Digit9", c: 57, n: "9" };
    k.VK_0 = { i: 10, d: "Digit0", c: 48, n: "0" };

    k.VK_F1 =  { i: 21, d: "F1",  c: 112, n: "F1" };
    k.VK_F2 =  { i: 22, d: "F2",  c: 113, n: "F2" };
    k.VK_F3 =  { i: 23, d: "F3",  c: 114, n: "F3" };
    k.VK_F4 =  { i: 24, d: "F4",  c: 115, n: "F4" };
    k.VK_F5 =  { i: 25, d: "F5",  c: 116, n: "F5" };
    k.VK_F6 =  { i: 26, d: "F6",  c: 117, n: "F6" };
    k.VK_F7 =  { i: 27, d: "F7",  c: 118, n: "F7" };
    k.VK_F8 =  { i: 28, d: "F8",  c: 119, n: "F8" };
    k.VK_F9 =  { i: 29, d: "F9",  c: 120, n: "F9" };
    k.VK_F10 = { i: 30, d: "F10", c: 121, n: "F10" };
    k.VK_F11 = { i: 31, d: "F11", c: 122, n: "F11" };
    k.VK_F12 = { i: 32, d: "F12", c: 123, n: "F12" };

    k.VK_Q = { i: 101, d: "KeyQ", c: 81, n: "Q" };
    k.VK_W = { i: 102, d: "KeyW", c: 87, n: "W" };
    k.VK_E = { i: 103, d: "KeyE", c: 69, n: "E" };
    k.VK_R = { i: 104, d: "KeyR", c: 82, n: "R" };
    k.VK_T = { i: 105, d: "KeyT", c: 84, n: "T" };
    k.VK_Y = { i: 106, d: "KeyY", c: 89, n: "Y" };
    k.VK_U = { i: 107, d: "KeyU", c: 85, n: "U" };
    k.VK_I = { i: 108, d: "KeyI", c: 73, n: "I" };
    k.VK_O = { i: 109, d: "KeyO", c: 79, n: "O" };
    k.VK_P = { i: 110, d: "KeyP", c: 80, n: "P" };
    k.VK_A = { i: 111, d: "KeyA", c: 65, n: "A" };
    k.VK_S = { i: 112, d: "KeyS", c: 83, n: "S" };
    k.VK_D = { i: 113, d: "KeyD", c: 68, n: "D" };
    k.VK_F = { i: 114, d: "KeyF", c: 70, n: "F" };
    k.VK_G = { i: 115, d: "KeyG", c: 71, n: "G" };
    k.VK_H = { i: 116, d: "KeyH", c: 72, n: "H" };
    k.VK_J = { i: 117, d: "KeyJ", c: 74, n: "J" };
    k.VK_K = { i: 118, d: "KeyK", c: 75, n: "K" };
    k.VK_L = { i: 119, d: "KeyL", c: 76, n: "L" };
    k.VK_Z = { i: 120, d: "KeyZ", c: 90, n: "Z" };
    k.VK_X = { i: 121, d: "KeyX", c: 88, n: "X" };
    k.VK_C = { i: 122, d: "KeyC", c: 67, n: "C" };
    k.VK_V = { i: 123, d: "KeyV", c: 86, n: "V" };
    k.VK_B = { i: 124, d: "KeyB", c: 66, n: "B" };
    k.VK_N = { i: 125, d: "KeyN", c: 78, n: "N" };
    k.VK_M = { i: 126, d: "KeyM", c: 77, n: "M" };

    k.VK_ESCAPE =    { i: 201, d: "Escape",      c: 27,  n: "Esc" };
    k.VK_BACKSPACE = { i: 202, d: "Backspace",   c: 8,   n: "BackSpc" };
    k.VK_TAB =       { i: 203, d: "Tab",         c: 9,   n: "Tab" };
    k.VK_ENTER =     { i: 204, d: "Enter",       c: 13,  n: "Enter" };
    k.VK_SPACE =     { i: 205, d: "Space",       c: 32,  n: "Space" };

    k.VK_BACKQUOTE =     { i: 221, d: "Backquote",     c: 192, n: "`" };
    k.VK_MINUS =         { i: 222, d: "Minus",         c: 189, n: "-" };
    k.VK_EQUALS =        { i: 223, d: "Equal",         c: 187, n: "=" };
    k.VK_INT_YEN =       { i: 224, d: "IntlYen",       c: 0,   n: "¥" };
    k.VK_OPEN_BRACKET =  { i: 225, d: "BracketLeft",   c: 219, n: "[" };
    k.VK_CLOSE_BRACKET = { i: 226, d: "BracketRight",  c: 221, n: "]" };
    k.VK_SEMICOLON =     { i: 227, d: "Semicolon",     c: 186, n: ";" };
    k.VK_QUOTE =         { i: 228, d: "Quote",         c: 222, n: "'" };
    k.VK_BACKSLASH =     { i: 229, d: "Backslash",     c: 220, n: "\\" };
    k.VK_INT_BACKSLASH = { i: 230, d: "IntlBackslash", c: 226, n: "L-\\" };
    k.VK_COMMA =         { i: 231, d: "Comma",         c: 188, n: "," };
    k.VK_PERIOD =        { i: 232, d: "Period",        c: 190, n: "." };
    k.VK_SLASH =         { i: 233, d: "Slash",         c: 191, n: "/" };
    k.VK_INT_RO =        { i: 234, d: "IntlRo",        c: 193, n: "ろ" };

    k.VK_INSERT =    { i: 251, d: "Insert",   c: 45, n: "Ins" };
    k.VK_DELETE =    { i: 252, d: "Delete",   c: 46, n: "Del" };
    k.VK_HOME =      { i: 253, d: "Home",     c: 36, n: "Home" };
    k.VK_END =       { i: 254, d: "End",      c: 35, n: "End" };
    k.VK_PAGE_UP =   { i: 255, d: "PageUp",   c: 33, n: "PgUp" };
    k.VK_PAGE_DOWN = { i: 256, d: "PageDown", c: 34, n: "PgDown" };

    k.VK_UP =    { i: 271, d: "ArrowUp",    c: 38, n: "Up" };
    k.VK_DOWN =  { i: 272, d: "ArrowDown",  c: 40, n: "Down" };
    k.VK_LEFT =  { i: 273, d: "ArrowLeft",  c: 37, n: "Left" };
    k.VK_RIGHT = { i: 274, d: "ArrowRight", c: 39, n: "Right" };

    k.VK_PRINT_SCREEN = { i: 281, d: "PrintScreen", c: 44,  n: "PrtScr" };
    k.VK_SCROLL_LOCK =  { i: 282, d: "ScrollLock",  c: 145, n: "ScrLck" };
    k.VK_PAUSE =        { i: 283, d: "Pause",       c: 19,  n: "Pause" };
    k.VK_BREAK =        { i: 284, d: "",            c: 3,   n: "Break" };
    k.VK_CONTEXT =      { i: 285, d: "ContextMenu", c: 93,  n: "Context" };

    k.VK_LSHIFT =      { i: 301, d: "ShiftLeft",    c: 16 | left,  n: "L-Shift" };
    k.VK_LCONTROL =    { i: 302, d: "ControlLeft",  c: 17 | left,  n: "L-Control" };
    k.VK_LALT =        { i: 303, d: "AltLeft",      c: 18 | left,  n: "L-Alt" };
    k.VK_LMETA =       { i: 304, d: "MetaLeft",     c: 91 | left,  n: "L-Meta" };
    k.VK_RSHIFT =      { i: 305, d: "ShiftRight",   c: 16 | right, n: "R-Shift" };
    k.VK_RCONTROL =    { i: 306, d: "ControlRight", c: 17 | right, n: "R-Control" };
    k.VK_RALT =        { i: 307, d: "AltRight",     c: 18 | right, n: "R-Alt" };
    k.VK_RMETA =       { i: 308, d: "MetaRight",    c: 91 | right, n: "R-Meta" };
    k.VK_CAPS_LOCK =   { i: 309, d: "CapsLock",     c: 20,         n: "CapsLock" };
    k.VK_NON_CONVERT = { i: 310, d: "NonConvert",   c: 29,         n: "NonConvert" };
    k.VK_CONVERT =     { i: 311, d: "Convert",      c: 28,         n: "Convert" };
    k.VK_KANA =        { i: 312, d: "KanaMode",     c: 0,          n: "Kana" };

    k.VK_NUMLOCK =      { i: 401, d: "NumLock",        c: 144,       n: "NumLock" };
    k.VK_NUM_COMMA =    { i: 402, d: "NumpadComma",    c: 110 | num, n: "Num ," };
    k.VK_NUM_DIVIDE =   { i: 403, d: "NumpadDivide",   c: 111 | num, n: "Num /" };
    k.VK_NUM_MULTIPLY = { i: 404, d: "NumpadMultiply", c: 106 | num, n: "Num *" };
    k.VK_NUM_MINUS =    { i: 405, d: "NumpadSubtract", c: 109 | num, n: "Num -" };
    k.VK_NUM_PLUS =     { i: 406, d: "NumpadAdd",      c: 107 | num, n: "Num +" };
    k.VK_NUM_PERIOD =   { i: 407, d: "NumpadDecimal",  c: 194 | num, n: "Num ." };
    k.VK_NUM_ENTER =    { i: 408, d: "NumpadEnter",    c: 13 | num,  n: "Num Enter" };
    k.VK_NUM_1 =        { i: 421, d: "Numpad1",        c: 97 | num,  n: "Num 1" };
    k.VK_NUM_2 =        { i: 422, d: "Numpad2",        c: 98 | num,  n: "Num 2" };
    k.VK_NUM_3 =        { i: 423, d: "Numpad3",        c: 99 | num,  n: "Num 3" };
    k.VK_NUM_4 =        { i: 424, d: "Numpad4",        c: 100 | num, n: "Num 4" };
    k.VK_NUM_5 =        { i: 425, d: "Numpad5",        c: 101 | num, n: "Num 5" };
    k.VK_NUM_6 =        { i: 426, d: "Numpad6",        c: 102 | num, n: "Num 6" };
    k.VK_NUM_7 =        { i: 427, d: "Numpad7",        c: 103 | num, n: "Num 7" };
    k.VK_NUM_8 =        { i: 428, d: "Numpad8",        c: 104 | num, n: "Num 8" };
    k.VK_NUM_9 =        { i: 429, d: "Numpad9",        c: 105 | num, n: "Num 9" };
    k.VK_NUM_0 =        { i: 430, d: "Numpad0",        c: 96 | num,  n: "Num 0" };

    k.VK_VOID = { i: -1, d: "", c: -1, n: "Unbound" };

    /*
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
*/

})(wmsx.DOMKeysNew, wmsx.DOMKeysNew.LOCLEFT, wmsx.DOMKeysNew.LOCRIGHT, wmsx.DOMKeysNew.LOCNUM);

wmsx.DOMKeysNew.forcedNames = {
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

wmsx.DOMKeysNew.isModifierKeyCode = function(keyCode) {
    return keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 91;
};

wmsx.DOMKeysNew.codeForKeyboardEvent = function(e) {
    var code = e.keyCode;

    // Ignore modifiers for modifier keys SHIFT, CONTROL, ALT, META
    if (this.isModifierKeyCode(code))
        return (code & this.IGNORE_ALL_MODIFIERS_MASK) | (e.location << this.LOC_BIT_SHIFT);

    return code
        | (e.location << this.LOC_BIT_SHIFT)
        | (e.shiftKey ? this.SHIFT : 0)
        | (e.ctrlKey ? this.CONTROL : 0)
        | (e.altKey  ? this.ALT : 0)
        | (e.metaKey ? this.META : 0);
};

wmsx.DOMKeysNew.nameForKeyboardEvent = function(e) {
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
