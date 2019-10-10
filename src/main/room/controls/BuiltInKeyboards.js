// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

(function() {

    // Base mapping. English Machine, Host Keyboard: en-US
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
        BACKSLASH      : [ k.VK_BACKSLASH, k.VK_INT_BACKSLASH, k.VK_INT_YEN ],
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
        ESCAPE         : [ k.VK_ESCAPE, { wc: k.VK_BACKQUOTE.wc | k.ALT, n: [ "Alt", "`" ] } ],
        TAB            : k.VK_TAB,
        STOP           : [ k.VK_PAUSE, k.VK_BREAK, k.VK_F9 ],
        BACKSPACE      : k.VK_BACKSPACE,
        SELECT         : [ k.VK_SCROLL_LOCK, k.VK_F10 ],
        ENTER          : [ k.VK_ENTER, k.VK_NUM_ENTER ],
        SPACE          : k.VK_SPACE,
        HOME           : [ k.VK_HOME, { wc: k.VK_OPEN_BRACKET.wc | k.ALT, n: [ "Alt", "[" ] } ],
        INSERT         : [ k.VK_INSERT, { wc: k.VK_CLOSE_BRACKET.wc | k.ALT, n: [ "Alt", "]" ] } ],
        DELETE         : [ k.VK_DELETE, { wc: k.VK_BACKSLASH.wc | k.ALT, n: [ "Alt", "\\" ] } ],
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

    // English Machine, Host keyboard: en-US (default)
    var en_US = {};
    for (var key in base) en_US[key] = base[key];

    // English Machine, Host keyboard: pt-BR
    var en_BR = {};
    for (key in base) en_BR[key] = base[key];
    en_BR.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_BR_QUOTE.wc | k.ALT, n: [ "Alt", "'" ] } ];
    en_BR.BACKSLASH =     [ k.VK_BR_BACKSLASH, k.VK_INT_YEN ];
    en_BR.OPEN_BRACKET =  k.VK_BR_OPEN_BRACKET;
    en_BR.CLOSE_BRACKET = k.VK_BR_CLOSE_BRACKET;
    en_BR.SEMICOLON =     k.VK_BR_SEMICOLON;
    en_BR.QUOTE =         k.VK_BR_QUOTE;
    en_BR.BACKQUOTE =     k.VK_BR_ACUTE;
    en_BR.SLASH =         k.VK_BR_SLASH;
    en_BR.DEAD =          [ k.VK_BR_TILDE, k.VK_BR_CEDILLA, k.VK_RCONTROL, k.VK_END ];
    en_BR.HOME =          [ k.VK_HOME, { wc: k.VK_BR_OPEN_BRACKET.wc | k.ALT, n: [ "Alt", "[" ] } ];
    en_BR.INSERT =        [ k.VK_INSERT, { wc: k.VK_BR_CLOSE_BRACKET.wc | k.ALT, n: [ "Alt", "]" ] } ];
    en_BR.DELETE =        [ k.VK_DELETE, { wc: k.VK_BR_SLASH.wc | k.ALT, n: [ "Alt", "/" ] } ];

    // English Machine, Host keyboard: ja-JP
    var en_JP = {};
    for (key in base) en_JP[key] = base[key];
    en_JP.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_JP_YEN.wc | k.ALT, n: [ "Alt", "¥" ] } ];
    en_JP.EQUAL =         k.VK_JP_CIRCUMFLEX;
    en_JP.BACKSLASH =     [ k.VK_JP_YEN, k.VK_INT_BACKSLASH ];
    en_JP.OPEN_BRACKET =  k.VK_JP_OPEN_BRACKET;
    en_JP.CLOSE_BRACKET = k.VK_JP_CLOSE_BRACKET;
    en_JP.QUOTE =         k.VK_JP_COLLON;
    en_JP.BACKQUOTE =     k.VK_JP_ARROBA;
    en_JP.DEAD =          [ k.VK_JP_RO, k.VK_RCONTROL, k.VK_END ];
    en_JP.CAPSLOCK =      k.VK_JP_NON_CONVERT;
    en_JP.HOME =          [ k.VK_HOME, { wc: k.VK_JP_OPEN_BRACKET.wc | k.ALT, n: [ "Alt", "[" ] } ];
    en_JP.INSERT =        [ k.VK_INSERT, { wc: k.VK_JP_CLOSE_BRACKET.wc | k.ALT, n: [ "Alt", "]" ] } ];
    en_JP.DELETE =        [ k.VK_DELETE, { wc: k.VK_JP_RO.wc | k.ALT, n: [ "Alt", "\\ ろ" ] } ];

    // English Machine, Host keyboard: es-ES
    var en_ES = {};
    for (key in base) en_ES[key] = base[key];
    en_ES.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_ES_ORDINAL.wc | k.ALT, n: [ "Alt", "º" ] } ];
    en_ES.MINUS =         k.VK_ES_MINUS;
    en_ES.EQUAL =         k.VK_ES_INV_EXCLA;
    en_ES.BACKSLASH =     [ k.VK_ES_ORDINAL, k.VK_INT_YEN ];
    en_ES.OPEN_BRACKET =  k.VK_ES_GRAVE;
    en_ES.CLOSE_BRACKET = k.VK_ES_PLUS;
    en_ES.SEMICOLON =     k.VK_ES_ENNE;
    en_ES.QUOTE =         k.VK_ES_QUOTE;
    en_ES.BACKQUOTE =     k.VK_ES_ACUTE;
    en_ES.SLASH =         k.VK_ES_LESSER;
    en_ES.DEAD =          [ k.VK_ES_CEDILLA, k.VK_INT_RO, k.VK_RCONTROL, k.VK_END ];
    en_ES.HOME =          [ k.VK_HOME, { wc: k.VK_ES_GRAVE.wc | k.ALT, n: [ "Alt", "`" ] } ];
    en_ES.INSERT =        [ k.VK_INSERT, { wc: k.VK_ES_PLUS.wc | k.ALT, n: [ "Alt", "+" ] } ];
    en_ES.DELETE =        [ k.VK_DELETE, { wc: k.VK_ES_CEDILLA.wc | k.ALT, n: [ "Alt", "Ç" ] } ];

    // English Machine, Host keyboard: nl-NL
    var en_NL = {};
    for (key in base) en_NL[key] = base[key];
    en_NL.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_NL_ARROBA.wc | k.ALT, n: [ "Alt", "@" ] } ];
    en_NL.MINUS =         k.VK_NL_MINUS;
    en_NL.EQUAL =         k.VK_NL_ORDINAL;
    en_NL.BACKSLASH =     [ k.VK_NL_CLOSE_BRACKET, k.VK_INT_YEN ];
    en_NL.OPEN_BRACKET =  k.VK_NL_UMLAUT;
    en_NL.CLOSE_BRACKET = k.VK_NL_STAR;
    en_NL.SEMICOLON =     k.VK_NL_PLUS;
    en_NL.QUOTE =         k.VK_NL_ACUTE;
    en_NL.BACKQUOTE =     k.VK_NL_ARROBA;
    en_NL.SLASH =         k.VK_NL_SLASH;
    en_NL.DEAD =          [ k.VK_NL_LESSER, k.VK_INT_RO, k.VK_RCONTROL, k.VK_END ];
    en_NL.HOME =          [ k.VK_HOME, { wc: k.VK_NL_UMLAUT.wc | k.ALT, n: [ "Alt", "¨" ] } ];
    en_NL.INSERT =        [ k.VK_INSERT, { wc: k.VK_NL_STAR.wc | k.ALT, n: [ "Alt", "*" ] } ];
    en_NL.DELETE =        [ k.VK_DELETE, { wc: k.VK_NL_LESSER.wc | k.ALT, n: [ "Alt", "<" ] } ];

    // English Machine, Host keyboard: it-IT
    var en_IT = {};
    for (key in base) en_IT[key] = base[key];
    en_IT.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_IT_BACKSLASH.wc | k.ALT, n: [ "Alt", "\\" ] } ];
    en_IT.MINUS =         k.VK_IT_MINUS;
    en_IT.EQUAL =         k.VK_IT_GRAVE_I;
    en_IT.BACKSLASH =     [ k.VK_IT_BACKSLASH, k.VK_INT_YEN ];
    en_IT.OPEN_BRACKET =  k.VK_IT_GRAVE_E;
    en_IT.CLOSE_BRACKET = k.VK_IT_PLUS;
    en_IT.SEMICOLON =     k.VK_IT_GRAVE_O;
    en_IT.QUOTE =         k.VK_IT_QUOTE;
    en_IT.BACKQUOTE =     k.VK_IT_GRAVE_A;
    en_IT.SLASH =         k.VK_IT_LESSER;
    en_IT.DEAD =          [ k.VK_IT_GRAVE_U, k.VK_INT_RO, k.VK_RCONTROL, k.VK_END ];
    en_IT.HOME =          [ k.VK_HOME, { wc: k.VK_IT_GRAVE_E.wc | k.ALT, n: [ "Alt", "è" ] } ];
    en_IT.INSERT =        [ k.VK_INSERT, { wc: k.VK_IT_PLUS.wc | k.ALT, n: [ "Alt", "+" ] } ];
    en_IT.DELETE =        [ k.VK_DELETE, { wc: k.VK_IT_GRAVE_U.wc | k.ALT, n: [ "Alt", "ù" ] } ];


    // Japanese Machine, Host keyboard: en-US
    var ja_US = {};
    for (key in base) ja_US[key] = base[key];
    ja_US.OPEN_BRACKET =  k.VK_BACKQUOTE;
    ja_US.CLOSE_BRACKET = k.VK_OPEN_BRACKET;
    ja_US.BACKQUOTE =     k.VK_CLOSE_BRACKET;

    // Japanese Machine, Host keyboard: pt-BR
    var ja_BR = {};
    for (key in base) ja_BR[key] = base[key];
    ja_BR.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_BR_QUOTE.wc | k.ALT, n: [ "Alt", "'" ] } ];
    ja_BR.BACKSLASH =     [ k.VK_BR_BACKSLASH, k.VK_INT_YEN ];
    ja_BR.OPEN_BRACKET =  [ k.VK_BR_QUOTE, k.VK_BR_ACUTE ];
    ja_BR.CLOSE_BRACKET = k.VK_BR_OPEN_BRACKET;
    ja_BR.SEMICOLON =     k.VK_BR_SEMICOLON;
    ja_BR.QUOTE =         k.VK_BR_CEDILLA;
    ja_BR.BACKQUOTE =     k.VK_BR_CLOSE_BRACKET;
    ja_BR.SLASH =         k.VK_BR_SLASH;
    ja_BR.DEAD =          [ k.VK_BR_TILDE, k.VK_RCONTROL, k.VK_END ];
    ja_BR.HOME =          [ k.VK_HOME, { wc: k.VK_BR_OPEN_BRACKET.wc | k.ALT, n: [ "Alt", "[" ] } ];
    ja_BR.INSERT =        [ k.VK_INSERT, { wc: k.VK_BR_CLOSE_BRACKET.wc | k.ALT, n: [ "Alt", "]" ] } ];
    ja_BR.DELETE =        [ k.VK_DELETE, { wc: k.VK_BR_SLASH.wc | k.ALT, n: [ "Alt", "/" ] } ];

    // Japanese Machine, Host keyboard: ja-JP
    var ja_JP = {};
    for (key in base) ja_JP[key] = base[key];
    ja_JP.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_JP_YEN.wc | k.ALT, n: [ "Alt", "¥" ] } ];
    ja_JP.EQUAL =         k.VK_JP_CIRCUMFLEX;
    ja_JP.BACKSLASH =     [ k.VK_JP_YEN, k.VK_INT_BACKSLASH ];
    ja_JP.OPEN_BRACKET =  k.VK_JP_ARROBA;
    ja_JP.CLOSE_BRACKET = k.VK_JP_OPEN_BRACKET;
    ja_JP.QUOTE =         k.VK_JP_COLLON;
    ja_JP.BACKQUOTE =     k.VK_JP_CLOSE_BRACKET;
    ja_JP.DEAD =          [ k.VK_JP_RO, k.VK_RCONTROL, k.VK_END ];
    ja_JP.CAPSLOCK =      k.VK_JP_NON_CONVERT;
    ja_JP.HOME =          [ k.VK_HOME, { wc: k.VK_JP_OPEN_BRACKET.wc | k.ALT, n: [ "Alt", "[" ] } ];
    ja_JP.INSERT =        [ k.VK_INSERT, { wc: k.VK_JP_CLOSE_BRACKET.wc | k.ALT, n: [ "Alt", "]" ] } ];
    ja_JP.DELETE =        [ k.VK_DELETE, { wc: k.VK_JP_RO.wc | k.ALT, n: [ "Alt", "\\ ろ" ] } ];

    // Japanese Machine, Host keyboard: es-ES
    var ja_ES = {};
    for (key in base) ja_ES[key] = base[key];
    ja_ES.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_ES_ORDINAL.wc | k.ALT, n: [ "Alt", "º" ] } ];
    ja_ES.MINUS =         k.VK_ES_MINUS;
    ja_ES.EQUAL =         k.VK_ES_INV_EXCLA;
    ja_ES.BACKSLASH =     [ k.VK_ES_ORDINAL, k.VK_INT_YEN ];
    ja_ES.OPEN_BRACKET =  k.VK_ES_QUOTE;
    ja_ES.CLOSE_BRACKET = k.VK_ES_GRAVE;
    ja_ES.SEMICOLON =     k.VK_ES_ENNE;
    ja_ES.QUOTE =         k.VK_ES_ACUTE;
    ja_ES.BACKQUOTE =     k.VK_ES_PLUS;
    ja_ES.SLASH =         k.VK_ES_LESSER;
    ja_ES.DEAD =          [ k.VK_ES_CEDILLA, k.VK_INT_RO, k.VK_RCONTROL, k.VK_END ];
    ja_ES.HOME =          [ k.VK_HOME, { wc: k.VK_ES_GRAVE.wc | k.ALT, n: [ "Alt", "`" ] } ];
    ja_ES.INSERT =        [ k.VK_INSERT, { wc: k.VK_ES_PLUS.wc | k.ALT, n: [ "Alt", "+" ] } ];
    ja_ES.DELETE =        [ k.VK_DELETE, { wc: k.VK_ES_CEDILLA.wc | k.ALT, n: [ "Alt", "Ç" ] } ];

    // Japanese Machine, Host keyboard: nl-NL
    var ja_NL = {};
    for (key in base) ja_NL[key] = base[key];
    ja_NL.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_NL_ARROBA.wc | k.ALT, n: [ "Alt", "@" ] } ];
    ja_NL.MINUS =         k.VK_NL_MINUS;
    ja_NL.EQUAL =         k.VK_NL_ORDINAL;
    ja_NL.BACKSLASH =     [ k.VK_NL_CLOSE_BRACKET, k.VK_INT_YEN ];
    ja_NL.OPEN_BRACKET =  k.VK_NL_ARROBA;
    ja_NL.CLOSE_BRACKET = k.VK_NL_UMLAUT;
    ja_NL.SEMICOLON =     k.VK_NL_PLUS;
    ja_NL.QUOTE =         k.VK_NL_ACUTE;
    ja_NL.BACKQUOTE =     k.VK_NL_STAR;
    ja_NL.SLASH =         k.VK_NL_SLASH;
    ja_NL.DEAD =          [ k.VK_NL_LESSER, k.VK_INT_RO, k.VK_RCONTROL, k.VK_END ];
    ja_NL.HOME =          [ k.VK_HOME, { wc: k.VK_NL_UMLAUT.wc | k.ALT, n: [ "Alt", "¨" ] } ];
    ja_NL.INSERT =        [ k.VK_INSERT, { wc: k.VK_NL_STAR.wc | k.ALT, n: [ "Alt", "*" ] } ];
    ja_NL.DELETE =        [ k.VK_DELETE, { wc: k.VK_NL_LESSER.wc | k.ALT, n: [ "Alt", "<" ] } ];

    // Japanese Machine, Host keyboard: es-ES
    var ja_IT = {};
    for (key in base) ja_IT[key] = base[key];
    ja_IT.ESCAPE =        [ k.VK_ESCAPE, { wc: k.VK_IT_BACKSLASH.wc | k.ALT, n: [ "Alt", "\\" ] } ];
    ja_IT.MINUS =         k.VK_IT_MINUS;
    ja_IT.EQUAL =         k.VK_IT_GRAVE_I;
    ja_IT.BACKSLASH =     [ k.VK_IT_BACKSLASH, k.VK_INT_YEN ];
    ja_IT.OPEN_BRACKET =  k.VK_IT_QUOTE;
    ja_IT.CLOSE_BRACKET = k.VK_IT_GRAVE_E;
    ja_IT.SEMICOLON =     k.VK_IT_GRAVE_O;
    ja_IT.QUOTE =         k.VK_IT_GRAVE_A;
    ja_IT.BACKQUOTE =     k.VK_IT_PLUS;
    ja_IT.SLASH =         k.VK_IT_LESSER;
    ja_IT.DEAD =          [ k.VK_IT_GRAVE_U, k.VK_INT_RO, k.VK_RCONTROL, k.VK_END ];
    ja_IT.HOME =          [ k.VK_HOME, { wc: k.VK_IT_GRAVE_E.wc | k.ALT, n: [ "Alt", "è" ] } ];
    ja_IT.INSERT =        [ k.VK_INSERT, { wc: k.VK_IT_PLUS.wc | k.ALT, n: [ "Alt", "+" ] } ];
    ja_IT.DELETE =        [ k.VK_DELETE, { wc: k.VK_IT_GRAVE_U.wc | k.ALT, n: [ "Alt", "ù" ] } ];


    // Available Keyboards
    wmsx.BuiltInKeyboards = {
        en: {
            "en-US": en_US,
            "pt-BR": en_BR,
            "ja-JP": en_JP,
            "es-ES": en_ES,
            "nl-NL": en_NL,
            "it-IT": en_IT
        },
        ja: {
            "en-US": ja_US,
            "pt-BR": ja_BR,
            "ja-JP": ja_JP,
            "es-ES": ja_ES,
            "nl-NL": ja_NL,
            "it-IT": ja_IT
        }
    };

})();
