// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

(function() {

    // Base mapping
    var k = wmsx.DOMKeys;
    var base = {
        D0             : k.VK_0,
        D1             : k.VK_1,
        D2             : k.VK_2,
        D3             : k.VK_3,
        D4             : k.VK_4,
        D5             : k.VK_5,
        D6             : k.VK_6,
        D7             : k.VK_7,
        D8             : k.VK_8,
        D9             : k.VK_9,
        MINUS          : k.VK_MINUS,
        EQUAL          : k.VK_EQUALS,
        BACKSLASH      : k.VK_BACKSLASH,
        OPEN_BRACKET   : k.VK_OPEN_BRACKET,
        CLOSE_BRACKET  : k.VK_CLOSE_BRACKET,
        SEMICOLON      : k.VK_SEMICOLON,
        QUOTE          : k.VK_QUOTE,
        BACKQUOTE      : k.VK_BACKQUOTE,
        COMMA          : k.VK_COMMA,
        PERIOD         : k.VK_PERIOD,
        SLASH          : k.VK_SLASH,
        DEAD           : [ k.VK_CONTEXT, k.VK_END ],
        A              : k.VK_A,
        B              : k.VK_B,
        C              : k.VK_C,
        D              : k.VK_D,
        E              : k.VK_E,
        F              : k.VK_F,
        G              : k.VK_G,
        H              : k.VK_H,
        I              : k.VK_I,
        J              : k.VK_J,
        K              : k.VK_K,
        L              : k.VK_L,
        M              : k.VK_M,
        N              : k.VK_N,
        O              : k.VK_O,
        P              : k.VK_P,
        Q              : k.VK_Q,
        R              : k.VK_R,
        S              : k.VK_S,
        T              : k.VK_T,
        U              : k.VK_U,
        V              : k.VK_V,
        W              : k.VK_W,
        X              : k.VK_X,
        Y              : k.VK_Y,
        Z              : k.VK_Z,
        SHIFT          : [ k.VK_LSHIFT, k.VK_RSHIFT ],
        CONTROL        : [ k.VK_LCONTROL ],
        CAPSLOCK       : k.VK_CAPS_LOCK,
        GRAPH          : [ k.VK_LALT, k.VK_PAGE_UP ],
        CODE           : [ k.VK_RALT, k.VK_RCONTROL, k.VK_PAGE_DOWN ],
        F1             : k.VK_F1,
        F2             : k.VK_F2,
        F3             : k.VK_F3,
        F4             : k.VK_F4,
        F5             : k.VK_F5,
        ESCAPE         : [ k.VK_ESCAPE, k.VK_ALTERNATE_ESC ],
        TAB            : k.VK_TAB,
        STOP           : [ k.VK_PAUSE, k.VK_BREAK, k.VK_F9 ],
        BACKSPACE      : k.VK_BACKSPACE,
        SELECT         : [ k.VK_SCROLL_LOCK, k.VK_F10 ],
        ENTER          : [ k.VK_ENTER, k.VK_NUM_ENTER ],
        SPACE          : k.VK_SPACE,
        HOME           : [ k.VK_HOME, k.VK_NUM_HOME ],
        INSERT         : [ k.VK_INSERT, k.VK_NUM_INSERT ],
        DELETE         : [ k.VK_DELETE, k.VK_NUM_DELETE ],
        UP             : [ k.VK_UP, k.VK_NUM_UP ],
        DOWN           : [ k.VK_DOWN, k.VK_NUM_DOWN ],
        RIGHT          : [ k.VK_RIGHT, k.VK_NUM_RIGHT ],
        LEFT           : [ k.VK_LEFT, k.VK_NUM_LEFT ],
        NUM_MULTIPLY   : k.VK_NUM_MULTIPLY,
        NUM_PLUS       : k.VK_NUM_PLUS,
        NUM_DIVIDE     : k.VK_NUM_DIVIDE,
        NUM_0          : k.VK_NUM_0,
        NUM_1          : k.VK_NUM_1,
        NUM_2          : k.VK_NUM_2,
        NUM_3          : k.VK_NUM_3,
        NUM_4          : k.VK_NUM_4,
        NUM_5          : k.VK_NUM_5,
        NUM_6          : k.VK_NUM_6,
        NUM_7          : k.VK_NUM_7,
        NUM_8          : k.VK_NUM_8,
        NUM_9          : k.VK_NUM_9,
        NUM_MINUS      : k.VK_NUM_MINUS,
        NUM_COMMA      : k.VK_NUM_COMMA,
        NUM_PERIOD     : k.VK_NUM_PERIOD,
        YES            : k.VK_VOID,
        NO             : k.VK_VOID
    };

    // Apply browser differences to BASE
    switch (wmsx.Util.browserInfo().name) {
        case "FIREFOX":
            base.MINUS =     k.VK_FF_MINUS;
            base.EQUAL =     k.VK_FF_EQUAL;
            base.SEMICOLON = k.VK_FF_SEMICOLON;
    }

    // Define built-in keyboards

    // Default (US)
    var us = {};
    for (var key in base) us[key] = base[key];

    // BR
    var br = {};
    for (key in base) br[key] = base[key];
    // BR specific browser differences
    switch (wmsx.Util.browserInfo().name) {
        case "FIREFOX":
            br.DEAD =          [ k.VK_FF_BR_TILDE, k.VK_CONTEXT, k.VK_END ];
            break;
        default:
            br.QUOTE =         k.VK_BR_QUOTE;
            br.OPEN_BRACKET =  k.VK_BR_OPEN_BRACKET;
            br.CLOSE_BRACKET = k.VK_BR_CLOSE_BRACKET;
            br.BACKQUOTE =     k.VK_BR_ACUTE;
            br.SEMICOLON =     k.VK_BR_SEMICOLON;
            br.SLASH =         k.VK_BR_SLASH;
            br.BACKSLASH =     k.VK_BR_BACKSLASH;
            br.DEAD =          [ k.VK_BR_TILDE, k.VK_CONTEXT, k.VK_END ];
    }

    wmsx.BuiltInKeyboards = {
        all: [ "Default", "pt-BR" ],
        "Default": us,
        "pt-BR": br
    };

})();
