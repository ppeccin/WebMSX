// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// General, immutable info about host keys on different browsers and keyboard languages/layouts
wmsx.DOMKeys = {

    // Common keys (US)

    VK_F1: {c: 112, n: "F1"},
    VK_F2: {c: 113, n: "F2"},
    VK_F3: {c: 114, n: "F3"},
    VK_F4: {c: 115, n: "F4"},
    VK_F5: {c: 116, n: "F5"},
    VK_F6: {c: 117, n: "F6"},
    VK_F7: {c: 118, n: "F7"},
    VK_F8: {c: 119, n: "F8"},
    VK_F9: {c: 120, n: "F9"},
    VK_F10: {c: 121, n: "F10"},
    VK_F11: {c: 122, n: "F11"},
    VK_F12: {c: 123, n: "F12"},

    VK_1: {c: 49, n: "1"},
    VK_2: {c: 50, n: "2"},
    VK_3: {c: 51, n: "3"},
    VK_4: {c: 52, n: "4"},
    VK_5: {c: 53, n: "5"},
    VK_6: {c: 54, n: "6"},
    VK_7: {c: 55, n: "7"},
    VK_8: {c: 56, n: "8"},
    VK_9: {c: 57, n: "9"},
    VK_0: {c: 48, n: "0"},

    VK_Q: {c: 81, n: "Q"},
    VK_W: {c: 87, n: "W"},
    VK_E: {c: 69, n: "E"},
    VK_R: {c: 82, n: "R"},
    VK_T: {c: 84, n: "T"},
    VK_Y: {c: 89, n: "Y"},
    VK_U: {c: 85, n: "U"},
    VK_I: {c: 73, n: "I"},
    VK_O: {c: 79, n: "O"},
    VK_P: {c: 80, n: "P"},
    VK_A: {c: 65, n: "A"},
    VK_S: {c: 83, n: "S"},
    VK_D: {c: 68, n: "D"},
    VK_F: {c: 70, n: "F"},
    VK_G: {c: 71, n: "G"},
    VK_H: {c: 72, n: "H"},
    VK_J: {c: 74, n: "J"},
    VK_K: {c: 75, n: "K"},
    VK_L: {c: 76, n: "L"},
    VK_Z: {c: 90, n: "Z"},
    VK_X: {c: 88, n: "X"},
    VK_C: {c: 67, n: "C"},
    VK_V: {c: 86, n: "V"},
    VK_B: {c: 66, n: "B"},
    VK_N: {c: 78, n: "N"},
    VK_M: {c: 77, n: "M"},

    VK_ESCAPE: {c: 27, n: "ESC"},
    VK_ENTER: {c: 13, n: "Enter"},
    VK_SPACE: {c: 32, n: "Space"},
    VK_TAB: {c: 9, n: "Tab"},
    VK_BACKSPACE: {c: 8, n: "BkSpc"},

    VK_SHIFT: {c: 16, n: "Shift"},
    VK_CONTROL: {c: 17, n: "Ctrl"},
    VK_ALT: {c: 18, n: "Alt"},

    VK_CAPS_LOCK: {c: 20, n: "CpsLck"},
    VK_PRINT_SCREEN: {c: 44, n: "PrtScr"},
    VK_SCROLL_LOCK: {c: 145, n: "ScrLck"},
    VK_PAUSE: {c: 19, n: "Pause"},
    VK_BREAK: {c: 3, n: "Break"},

    VK_INSERT: {c: 45, n: "Ins"},
    VK_DELETE: {c: 46, n: "Del"},
    VK_HOME: {c: 36, n: "Home"},
    VK_END: {c: 35, n: "End"},
    VK_PAGE_UP: {c: 33, n: "PgUp"},
    VK_PAGE_DOWN: {c: 34, n: "PgDown"},

    VK_UP: {c: 38, n: "Up"},
    VK_DOWN: {c: 40, n: "Down"},
    VK_LEFT: {c: 37, n: "Left"},
    VK_RIGHT: {c: 39, n: "Right"},

    VK_NUM_LOCK: {c: 144, n: "Num"},
    VK_NUM_COMMA: {c: 110, n: "Num ,"},
    VK_NUM_DIVIDE: {c: 111, n: "Num /"},
    VK_NUM_MULTIPLY: {c: 106, n: "Num *"},
    VK_NUM_MINUS: {c: 109, n: "Num -"},
    VK_NUM_PLUS: {c: 107, n: "Num +"},
    VK_NUM_PERIOD: {c: 194, n: "Num ."},
    VK_NUM_0: {c: 96, n: "Num 0"},
    VK_NUM_1: {c: 97, n: "Num 1"},
    VK_NUM_2: {c: 98, n: "Num 2"},
    VK_NUM_3: {c: 99, n: "Num 3"},
    VK_NUM_4: {c: 100, n: "Num 4"},
    VK_NUM_5: {c: 101, n: "Num 5"},
    VK_NUM_6: {c: 102, n: "Num 6"},
    VK_NUM_7: {c: 103, n: "Num 7"},
    VK_NUM_8: {c: 104, n: "Num 8"},
    VK_NUM_9: {c: 105, n: "Num 9"},
    VK_NUM_CENTER: {c: 12, n: "Num Cntr"},

    VK_QUOTE: {c: 222, n: "'"},
    VK_BACKQUOTE: {c: 192, n: "`"},
    VK_MINUS: {c: 189, n: "-"},
    VK_EQUALS: {c: 187, n: "="},
    VK_OPEN_BRACKET: {c: 219, n: "["},
    VK_CLOSE_BRACKET: {c: 221, n: "]"},
    VK_COMMA: {c: 188, n: ","},
    VK_PERIOD: {c: 190, n: "."},
    VK_SEMICOLON: {c: 186, n: ";"},
    VK_SLASH: {c: 191, n: "/"},
    VK_BACKSLASH: {c: 220, n: "\\"},

    // Alternate codes for FF
    FF_VK_MINUS: {c: 173, n: "-"},
    FF_VK_EQUAL: {c: 61, n: "="},
    FF_VK_SEMICOLON: {c: 59, n: ";"},

    // BR alternate codes
    BR_VK_QUOTE: {c: 192, n: "'"},
    BR_VK_OPEN_BRACKET: {c: 221, n: "["},
    BR_VK_CLOSE_BRACKET: {c: 220, n: "]"},
    BR_VK_SEMICOLON: {c: 191, n: ";"},
    BR_VK_SLASH: {c: 193, n: "/"},
    BR_VK_BACKSLASH: {c: 226, n: "\\"},

    // BR additional keys
    BR_VK_CEDILLA: {c: 186, n: "Ç"},
    BR_VK_TILDE: {c: 222, n: "~"},
    BR_VK_ACUTE: {c: 219, n: "´"},

    BR_FF_VK_TILDE: {c: 176, n: "~"},
    BR_FF_VK_CEDILLA: {c: 0, n: "Ç"},

    VK_VOID: {c: -1, n: "Unbound"}

};


