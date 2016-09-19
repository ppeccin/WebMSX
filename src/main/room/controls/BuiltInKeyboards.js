// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

(function() {

    // Base mapping
    var d = wmsx.DOMKeys;
    var base = {
        D0             : d.VK_0,
        D1             : d.VK_1,
        D2             : d.VK_2,
        D3             : d.VK_3,
        D4             : d.VK_4,
        D5             : d.VK_5,
        D6             : d.VK_6,
        D7             : d.VK_7,
        D8             : d.VK_8,
        D9             : d.VK_9,
        MINUS          : d.VK_MINUS,
        EQUAL          : d.VK_EQUALS,
        BACKSLASH      : d.VK_BACKSLASH,
        OPEN_BRACKET   : d.VK_OPEN_BRACKET,
        CLOSE_BRACKET  : d.VK_CLOSE_BRACKET,
        SEMICOLON      : d.VK_SEMICOLON,
        QUOTE          : d.VK_QUOTE,
        BACKQUOTE      : d.VK_BACKQUOTE,
        COMMA          : d.VK_COMMA,
        PERIOD         : d.VK_PERIOD,
        SLASH          : d.VK_SLASH,
        DEAD           : [ d.VK_CONTEXT, d.VK_END ],
        A              : d.VK_A,
        B              : d.VK_B,
        C              : d.VK_C,
        D              : d.VK_D,
        E              : d.VK_E,
        F              : d.VK_F,
        G              : d.VK_G,
        H              : d.VK_H,
        I              : d.VK_I,
        J              : d.VK_J,
        K              : d.VK_K,
        L              : d.VK_L,
        M              : d.VK_M,
        N              : d.VK_N,
        O              : d.VK_O,
        P              : d.VK_P,
        Q              : d.VK_Q,
        R              : d.VK_R,
        S              : d.VK_S,
        T              : d.VK_T,
        U              : d.VK_U,
        V              : d.VK_V,
        W              : d.VK_W,
        X              : d.VK_X,
        Y              : d.VK_Y,
        Z              : d.VK_Z,
        SHIFT          : [ d.VK_LSHIFT, d.VK_RSHIFT ],
        CONTROL        : [ d.VK_LCONTROL ],
        CAPSLOCK       : d.VK_CAPS_LOCK,
        GRAPH          : [ d.VK_LALT, d.VK_PAGE_UP ],
        CODE           : [ d.VK_RALT, d.VK_RCONTROL, d.VK_PAGE_DOWN ],
        F1             : d.VK_F1,
        F2             : d.VK_F2,
        F3             : d.VK_F3,
        F4             : d.VK_F4,
        F5             : d.VK_F5,
        ESCAPE         : [ d.VK_ESCAPE, d.VK_ALTERNATE_ESC ],
        TAB            : d.VK_TAB,
        STOP           : [ d.VK_PAUSE, d.VK_BREAK, d.VK_F9 ],
        BACKSPACE      : d.VK_BACKSPACE,
        SELECT         : [ d.VK_SCROLL_LOCK, d.VK_F10 ],
        ENTER          : [ d.VK_ENTER, d.VK_NUM_ENTER ],
        SPACE          : d.VK_SPACE,
        HOME           : [ d.VK_HOME, d.VK_NUM_HOME ],
        INSERT         : [ d.VK_INSERT, d.VK_NUM_INSERT ],
        DELETE         : [ d.VK_DELETE, d.VK_NUM_DELETE ],
        UP             : [ d.VK_UP, d.VK_NUM_UP ],
        DOWN           : [ d.VK_DOWN, d.VK_NUM_DOWN ],
        RIGHT          : [ d.VK_RIGHT, d.VK_NUM_RIGHT ],
        LEFT           : [ d.VK_LEFT, d.VK_NUM_LEFT ],
        NUM_MULTIPLY   : d.VK_NUM_MULTIPLY,
        NUM_PLUS       : d.VK_NUM_PLUS,
        NUM_DIVIDE     : d.VK_NUM_DIVIDE,
        NUM_0          : d.VK_NUM_0,
        NUM_1          : d.VK_NUM_1,
        NUM_2          : d.VK_NUM_2,
        NUM_3          : d.VK_NUM_3,
        NUM_4          : d.VK_NUM_4,
        NUM_5          : d.VK_NUM_5,
        NUM_6          : d.VK_NUM_6,
        NUM_7          : d.VK_NUM_7,
        NUM_8          : d.VK_NUM_8,
        NUM_9          : d.VK_NUM_9,
        NUM_MINUS      : d.VK_NUM_MINUS,
        NUM_COMMA      : d.VK_NUM_COMMA,
        NUM_PERIOD     : d.VK_NUM_PERIOD,
        YES            : d.VK_VOID,
        NO             : d.VK_VOID
    };

    // Apply browser differences to BASE
    switch (wmsx.Util.browserInfo().name) {
        case "FIREFOX":
            base.MINUS =     d.VK_FF_MINUS;
            base.EQUAL =     d.VK_FF_EQUAL;
            base.SEMICOLON = d.VK_FF_SEMICOLON;
    }

    // Define built-in keyboards

    // Default (US)
    var us = {};
    for (var k in base) us[k] = base[k];

    // BR
    var br = {};
    for (k in base) br[k] = base[k];
    // BR specific browser differences
    switch (wmsx.Util.browserInfo().name) {
        case "FIREFOX":
            br.DEAD =          [ d.VK_FF_BR_TILDE, d.VK_CONTEXT, d.VK_END ];
            break;
        default:
            br.QUOTE =         d.VK_BR_QUOTE;
            br.OPEN_BRACKET =  d.VK_BR_OPEN_BRACKET;
            br.CLOSE_BRACKET = d.VK_BR_CLOSE_BRACKET;
            br.BACKQUOTE =     d.VK_BR_ACUTE;
            br.SEMICOLON =     d.VK_BR_SEMICOLON;
            br.SLASH =         d.VK_BR_SLASH;
            br.BACKSLASH =     d.VK_BR_BACKSLASH;
            br.DEAD =          [ d.VK_BR_TILDE, d.VK_CONTEXT, d.VK_END ];
    }

    wmsx.BuiltInKeyboards = {
        all: [ "en-US", "pt-BR" ],
        "en-US": us,
        "pt-BR": br
    };

})();
