// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

(function() {

    // Base mapping (en-US)
    var k = wmsx.DOMKeysNew;
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
        BACKSLASH      : [ k.VK_BACKSLASH, k.VK_INT_BACKSLASH ],
        OPEN_BRACKET   : k.VK_OPEN_BRACKET,
        CLOSE_BRACKET  : k.VK_CLOSE_BRACKET,
        SEMICOLON      : k.VK_SEMICOLON,
        QUOTE          : k.VK_QUOTE,
        BACKQUOTE      : k.VK_BACKQUOTE,
        COMMA          : k.VK_COMMA,
        PERIOD         : k.VK_PERIOD,
        SLASH          : k.VK_SLASH,
        DEAD           : [ k.VK_INT_RO, k.VK_RCONTROL, k.VK_END ],
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
        CODE           : [ k.VK_RALT, k.VK_PAGE_DOWN ],
        F1             : k.VK_F1,
        F2             : k.VK_F2,
        F3             : k.VK_F3,
        F4             : k.VK_F4,
        F5             : k.VK_F5,
        ESCAPE         : [ k.VK_ESCAPE, { wc: k.VK_F1.wc | k.ALT, n: [ "Alt", "F1" ] } ],
        TAB            : k.VK_TAB,
        STOP           : [ k.VK_PAUSE, k.VK_BREAK, k.VK_F9 ],
        BACKSPACE      : k.VK_BACKSPACE,
        SELECT         : [ k.VK_SCROLL_LOCK, k.VK_F10 ],
        ENTER          : [ k.VK_ENTER, k.VK_NUM_ENTER ],
        SPACE          : k.VK_SPACE,
        HOME           : [ k.VK_HOME, { wc: k.VK_EQUALS.wc | k.ALT, n: [ "Alt", "=" ] } ],
        INSERT         : [ k.VK_INSERT, { wc: k.VK_OPEN_BRACKET.wc | k.ALT, n: [ "Alt", "[" ] } ],
        DELETE         : [ k.VK_DELETE, { wc: k.VK_CLOSE_BRACKET.wc | k.ALT, n: [ "Alt", "]" ] } ],
        UP             : k.VK_UP,
        DOWN           : k.VK_DOWN,
        RIGHT          : k.VK_RIGHT,
        LEFT           : k.VK_LEFT,
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

/*
    // Apply browser differences to BASE (en-US)
    switch (wmsx.Util.browserInfo().name) {
        case "FIREFOX":
            base.MINUS =     k.VK_FF_MINUS;
            base.EQUAL =     k.VK_FF_EQUALS;
            base.HOME =      [ k.VK_HOME, k.VK_NUM_HOME, { wc: k.VK_FF_EQUALS.wc | k.ALT, n: [ "Alt", "=" ] } ];
            base.SEMICOLON = k.VK_FF_SEMICOLON;
    }
*/

    // Define built-in keyboards

    // Default (en-US)
    var us = {};
    for (var key in base) us[key] = base[key];

    // pt-BR
    var br = {};
    for (key in base) br[key] = base[key];

    // pt-BR specific keys positions
    br.BACKSLASH =     k.VK_INT_BACKSLASH;
    br.OPEN_BRACKET =  k.VK_BR_OPEN_BRACKET;
    br.CLOSE_BRACKET = k.VK_BR_CLOSE_BRACKET;
    br.SEMICOLON =     k.VK_BR_SEMICOLON;
    br.QUOTE =         k.VK_BR_QUOTE;
    br.BACKQUOTE =     k.VK_BR_ACUTE;
    br.SLASH =         k.VK_BR_SLASH;
    br.DEAD =          [ k.VK_BR_TILDE, k.VK_RCONTROL, k.VK_END ];

    // ja-JP
    var jp = {};
    for (key in base) jp[key] = base[key];

    // ja-JP specific keys positions
    jp.EQUAL =         k.VK_JP_CIRCUMFLEX;
    jp.BACKSLASH =     [ k.VK_INT_YEN, k.VK_INT_BACKSLASH ];
    jp.OPEN_BRACKET =  k.VK_JP_ARROBA;
    jp.CLOSE_BRACKET = k.VK_JP_OPEN_BRACKET;
    jp.QUOTE =         k.VK_JP_COLLON;
    jp.BACKQUOTE =     k.VK_JP_CLOSE_BRACKET;
    jp.DEAD =          k.VK_INT_RO;


    // Available Keyboards
    wmsx.BuiltInKeyboards = {
        all: [ "en-US", "pt-BR", "ja-JP" ],
        "en-US": us,
        "pt-BR": br,
        "ja-JP": jp
    };

})();
