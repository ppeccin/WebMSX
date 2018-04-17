// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// General, immutable info about host keys on different browsers and keyboard languages/layouts

wmsx.DOMKeysNew = {};

wmsx.DOMKeysNew.SHIFT =     0x10000;
wmsx.DOMKeysNew.CONTROL =   0x20000;
wmsx.DOMKeysNew.ALT =       0x40000;
wmsx.DOMKeysNew.META =      0x80000;

wmsx.DOMKeysNew.LOCLEFT =  0x100000;
wmsx.DOMKeysNew.LOCRIGHT = 0x200000;
wmsx.DOMKeysNew.LOCNUM =   0x300000;

wmsx.DOMKeysNew.IGNORE_ALL_MODIFIERS_MASK = ~(wmsx.DOMKeysNew.SHIFT | wmsx.DOMKeysNew.CONTROL | wmsx.DOMKeysNew.ALT | wmsx.DOMKeysNew.META);


(function(k, left, right, num) {

    // All known Web keys

    k.VK_1 = { wc: 1,  d: "Digit1", c: 49, n: "1" };
    k.VK_2 = { wc: 2,  d: "Digit2", c: 50, n: "2" };
    k.VK_3 = { wc: 3,  d: "Digit3", c: 51, n: "3" };
    k.VK_4 = { wc: 4,  d: "Digit4", c: 52, n: "4" };
    k.VK_5 = { wc: 5,  d: "Digit5", c: 53, n: "5" };
    k.VK_6 = { wc: 6,  d: "Digit6", c: 54, n: "6" };
    k.VK_7 = { wc: 7,  d: "Digit7", c: 55, n: "7" };
    k.VK_8 = { wc: 8,  d: "Digit8", c: 56, n: "8" };
    k.VK_9 = { wc: 9,  d: "Digit9", c: 57, n: "9" };
    k.VK_0 = { wc: 10, d: "Digit0", c: 48, n: "0" };

    k.VK_F1 =  { wc: 21, d: "F1",  c: 112, n: "F1" };
    k.VK_F2 =  { wc: 22, d: "F2",  c: 113, n: "F2" };
    k.VK_F3 =  { wc: 23, d: "F3",  c: 114, n: "F3" };
    k.VK_F4 =  { wc: 24, d: "F4",  c: 115, n: "F4" };
    k.VK_F5 =  { wc: 25, d: "F5",  c: 116, n: "F5" };
    k.VK_F6 =  { wc: 26, d: "F6",  c: 117, n: "F6" };
    k.VK_F7 =  { wc: 27, d: "F7",  c: 118, n: "F7" };
    k.VK_F8 =  { wc: 28, d: "F8",  c: 119, n: "F8" };
    k.VK_F9 =  { wc: 29, d: "F9",  c: 120, n: "F9" };
    k.VK_F10 = { wc: 30, d: "F10", c: 121, n: "F10" };
    k.VK_F11 = { wc: 31, d: "F11", c: 122, n: "F11" };
    k.VK_F12 = { wc: 32, d: "F12", c: 123, n: "F12" };

    k.VK_Q = { wc: 101, d: "KeyQ", c: 81, n: "Q" };
    k.VK_W = { wc: 102, d: "KeyW", c: 87, n: "W" };
    k.VK_E = { wc: 103, d: "KeyE", c: 69, n: "E" };
    k.VK_R = { wc: 104, d: "KeyR", c: 82, n: "R" };
    k.VK_T = { wc: 105, d: "KeyT", c: 84, n: "T" };
    k.VK_Y = { wc: 106, d: "KeyY", c: 89, n: "Y" };
    k.VK_U = { wc: 107, d: "KeyU", c: 85, n: "U" };
    k.VK_I = { wc: 108, d: "KeyI", c: 73, n: "I" };
    k.VK_O = { wc: 109, d: "KeyO", c: 79, n: "O" };
    k.VK_P = { wc: 110, d: "KeyP", c: 80, n: "P" };
    k.VK_A = { wc: 111, d: "KeyA", c: 65, n: "A" };
    k.VK_S = { wc: 112, d: "KeyS", c: 83, n: "S" };
    k.VK_D = { wc: 113, d: "KeyD", c: 68, n: "D" };
    k.VK_F = { wc: 114, d: "KeyF", c: 70, n: "F" };
    k.VK_G = { wc: 115, d: "KeyG", c: 71, n: "G" };
    k.VK_H = { wc: 116, d: "KeyH", c: 72, n: "H" };
    k.VK_J = { wc: 117, d: "KeyJ", c: 74, n: "J" };
    k.VK_K = { wc: 118, d: "KeyK", c: 75, n: "K" };
    k.VK_L = { wc: 119, d: "KeyL", c: 76, n: "L" };
    k.VK_Z = { wc: 120, d: "KeyZ", c: 90, n: "Z" };
    k.VK_X = { wc: 121, d: "KeyX", c: 88, n: "X" };
    k.VK_C = { wc: 122, d: "KeyC", c: 67, n: "C" };
    k.VK_V = { wc: 123, d: "KeyV", c: 86, n: "V" };
    k.VK_B = { wc: 124, d: "KeyB", c: 66, n: "B" };
    k.VK_N = { wc: 125, d: "KeyN", c: 78, n: "N" };
    k.VK_M = { wc: 126, d: "KeyM", c: 77, n: "M" };

    k.VK_ESCAPE =    { wc: 201, d: "Escape",      c: 27,  n: "Esc" };
    k.VK_BACKSPACE = { wc: 202, d: "Backspace",   c: 8,   n: "BackSpc" };
    k.VK_TAB =       { wc: 203, d: "Tab",         c: 9,   n: "Tab" };
    k.VK_ENTER =     { wc: 204, d: "Enter",       c: 13,  n: "Enter" };
    k.VK_SPACE =     { wc: 205, d: "Space",       c: 32,  n: "Space" };

    k.VK_BACKQUOTE =     { wc: 221, d: "Backquote",     c: 192, n: "`" };
    k.VK_MINUS =         { wc: 222, d: "Minus",         c: 189, n: "-" };
    k.VK_EQUALS =        { wc: 223, d: "Equal",         c: 187, n: "=" };
    k.VK_INT_YEN =       { wc: 224, d: "IntlYen",       c: 0,   n: "¥" };
    k.VK_OPEN_BRACKET =  { wc: 225, d: "BracketLeft",   c: 219, n: "[" };
    k.VK_CLOSE_BRACKET = { wc: 226, d: "BracketRight",  c: 221, n: "]" };
    k.VK_SEMICOLON =     { wc: 227, d: "Semicolon",     c: 186, n: ";" };
    k.VK_QUOTE =         { wc: 228, d: "Quote",         c: 222, n: "'" };
    k.VK_BACKSLASH =     { wc: 229, d: "Backslash",     c: 220, n: "\\" };
    k.VK_INT_BACKSLASH = { wc: 230, d: "IntlBackslash", c: 226, n: "L-\\" };
    k.VK_COMMA =         { wc: 231, d: "Comma",         c: 188, n: "," };
    k.VK_PERIOD =        { wc: 232, d: "Period",        c: 190, n: "." };
    k.VK_SLASH =         { wc: 233, d: "Slash",         c: 191, n: "/" };
    k.VK_INT_RO =        { wc: 234, d: "IntlRo",        c: 193, n: "ろ" };

    k.VK_INSERT =    { wc: 251, d: "Insert",   c: 45, n: "Ins" };
    k.VK_DELETE =    { wc: 252, d: "Delete",   c: 46, n: "Del" };
    k.VK_HOME =      { wc: 253, d: "Home",     c: 36, n: "Home" };
    k.VK_END =       { wc: 254, d: "End",      c: 35, n: "End" };
    k.VK_PAGE_UP =   { wc: 255, d: "PageUp",   c: 33, n: "PgUp" };
    k.VK_PAGE_DOWN = { wc: 256, d: "PageDown", c: 34, n: "PgDown" };

    k.VK_UP =    { wc: 271, d: "ArrowUp",    c: 38, n: "Up" };
    k.VK_DOWN =  { wc: 272, d: "ArrowDown",  c: 40, n: "Down" };
    k.VK_LEFT =  { wc: 273, d: "ArrowLeft",  c: 37, n: "Left" };
    k.VK_RIGHT = { wc: 274, d: "ArrowRight", c: 39, n: "Right" };

    k.VK_PRINT_SCREEN = { wc: 281, d: "PrintScreen", c: 44,  n: "PrtScr" };
    k.VK_SCROLL_LOCK =  { wc: 282, d: "ScrollLock",  c: 145, n: "ScrLck" };
    k.VK_PAUSE =        { wc: 283, d: "Pause",       c: 19,  n: "Pause" };
    k.VK_BREAK =        { wc: 284, d: "",            c: 3,   n: "Break" };
    k.VK_CONTEXT =      { wc: 285, d: "ContextMenu", c: 93,  n: "Context" };

    k.VK_LSHIFT =      { wc: 301, d: "ShiftLeft",    c: 16 | left,  n: "L-Shift" };
    k.VK_LCONTROL =    { wc: 302, d: "ControlLeft",  c: 17 | left,  n: "L-Control" };
    k.VK_LALT =        { wc: 303, d: "AltLeft",      c: 18 | left,  n: "L-Alt" };
    k.VK_LMETA =       { wc: 304, d: "MetaLeft",     c: 91 | left,  n: "L-Meta" };
    k.VK_RSHIFT =      { wc: 305, d: "ShiftRight",   c: 16 | right, n: "R-Shift" };
    k.VK_RCONTROL =    { wc: 306, d: "ControlRight", c: 17 | right, n: "R-Control" };
    k.VK_RALT =        { wc: 307, d: "AltRight",     c: 18 | right, n: "R-Alt" };
    k.VK_RMETA =       { wc: 308, d: "MetaRight",    c: 91 | right, n: "R-Meta" };
    k.VK_CAPS_LOCK =   { wc: 309, d: "CapsLock",     c: 20,         n: "CapsLock" };
    k.VK_NON_CONVERT = { wc: 310, d: "NonConvert",   c: 29,         n: "NonConvert" };
    k.VK_CONVERT =     { wc: 311, d: "Convert",      c: 28,         n: "Convert" };
    k.VK_KANA =        { wc: 312, d: "KanaMode",     c: 0,          n: "Kana" };

    k.VK_NUMLOCK =      { wc: 401, d: "NumLock",        c: 144,       n: "NumLock" };
    k.VK_NUM_COMMA =    { wc: 402, d: "NumpadComma",    c: 110 | num, n: "Num ," };
    k.VK_NUM_DIVIDE =   { wc: 403, d: "NumpadDivide",   c: 111 | num, n: "Num /" };
    k.VK_NUM_MULTIPLY = { wc: 404, d: "NumpadMultiply", c: 106 | num, n: "Num *" };
    k.VK_NUM_MINUS =    { wc: 405, d: "NumpadSubtract", c: 109 | num, n: "Num -" };
    k.VK_NUM_PLUS =     { wc: 406, d: "NumpadAdd",      c: 107 | num, n: "Num +" };
    k.VK_NUM_PERIOD =   { wc: 407, d: "NumpadDecimal",  c: 194 | num, n: "Num ." };
    k.VK_NUM_ENTER =    { wc: 408, d: "NumpadEnter",    c: 13 | num,  n: "Num Enter" };
    k.VK_NUM_1 =        { wc: 421, d: "Numpad1",        c: 97 | num,  n: "Num 1" };
    k.VK_NUM_2 =        { wc: 422, d: "Numpad2",        c: 98 | num,  n: "Num 2" };
    k.VK_NUM_3 =        { wc: 423, d: "Numpad3",        c: 99 | num,  n: "Num 3" };
    k.VK_NUM_4 =        { wc: 424, d: "Numpad4",        c: 100 | num, n: "Num 4" };
    k.VK_NUM_5 =        { wc: 425, d: "Numpad5",        c: 101 | num, n: "Num 5" };
    k.VK_NUM_6 =        { wc: 426, d: "Numpad6",        c: 102 | num, n: "Num 6" };
    k.VK_NUM_7 =        { wc: 427, d: "Numpad7",        c: 103 | num, n: "Num 7" };
    k.VK_NUM_8 =        { wc: 428, d: "Numpad8",        c: 104 | num, n: "Num 8" };
    k.VK_NUM_9 =        { wc: 429, d: "Numpad9",        c: 105 | num, n: "Num 9" };
    k.VK_NUM_0 =        { wc: 430, d: "Numpad0",        c: 96 | num,  n: "Num 0" };

    k.VK_VOID = { wc: -1, d: "", c: -1, n: "Unbound" };

    // Define additional collections for key identification
    k.keysByCode = {};
    k.keysByLegacyCode = {};
    for (var key in k) {
        var code = k[key].d;
        var legCode = k[key].c;
        if (code) k.keysByCode[code] = k[key];
        if (legCode > 0) k.keysByLegacyCode[legCode] = k[key];
    }

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

wmsx.DOMKeysNew.isModifierKey = function(e) {
    var keyCode = e.keyCode;
    return keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 91;
};

wmsx.DOMKeysNew.codeNewForKeyboardEvent = function(e) {
    // TODO Custom New Keys
    var key = this.keysByCode[e.code] || this.keysByLegacyCode[e.keyCode];
    if (!key) return -1;

    // Does not return modifiers for modifier keys SHIFT, CONTROL, ALT, META
    if (this.isModifierKey(e))
        return key.wc;
    else
        return key.wc
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
