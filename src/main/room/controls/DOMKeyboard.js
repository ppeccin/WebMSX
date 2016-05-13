// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMKeyboard = function() {
    var self = this;

    function init() {
        initHostKeys();
        initMatrix();
    }

    this.connect = function(pKeyboardSocket) {
        keyboardSocket = pKeyboardSocket;
    };

    this.connectPeripherals = function(pScreen) {
        monitor = pScreen.getMonitor();
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.addInputElements = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener("keydown", this.keyDown);
            elements[i].addEventListener("keyup", this.keyUp);
        }
    };

    this.toggleHostKeyboards = function() {
        wmsx.DOMKeys.setKeyboard(wmsx.DOMKeys.getKeyboard().code + 1);
        monitor.showOSD("Host Keyboard: " + wmsx.DOMKeys.getKeyboard().name, true);
        initHostKeys();
        initMatrix();
    };

    this.liftAllKeys = function() {
        keyboardSocket.keyboardReset();
        keyStateMap = {};
    };

    this.keyDown = function(event) {
        //console.log("Keyboard: " + event.keyCode + " " + event.location);
        var modifiers = 0 | (event.altKey ? KEY_ALT_MASK : 0);
        if (processKeyEvent(event.keyCode, true, modifiers)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        }
    };

    this.keyUp = function(event) {
        var modifiers = 0 | (event.ctrlKey ? KEY_CTRL_MASK : 0) | (event.altKey ? KEY_ALT_MASK : 0) | (event.shiftKey ? KEY_SHIFT_MASK : 0);
        if (processKeyEvent(event.keyCode, false, modifiers)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        }
    };

    this.processKeyEvent = function(keyCode, press, modifiers) {
        var key = keyForEvent(keyCode, modifiers);
        if (!key) return false;

        var state = keyStateMap[key];
        if (!state || (state !== press)) {
            keyStateMap[key] = press;
            keyboardSocket.keyboardKeyChanged(key, press);
        }
        return true;
    };
    var processKeyEvent = this.processKeyEvent;

    var keyForEvent = function(keyCode, modif) {
        if (modif & KEY_ALT_MASK)
            return altCodeMap[keyCode];     // Special "extra" bindings with ALT
        else
            return normalCodeMap[keyCode];
    };

    // International Matrix
    var initMatrix = function() {
        self.applyPreferences();

        normalCodeMap = {};
        altCodeMap = {};

        normalCodeMap[hostKeys.KEY_F1.c]             = [ 6, 5 ];
        normalCodeMap[hostKeys.KEY_F2.c]             = [ 6, 6 ];
        normalCodeMap[hostKeys.KEY_F3.c]             = [ 6, 7 ];
        normalCodeMap[hostKeys.KEY_F4.c]             = [ 7, 0 ];
        normalCodeMap[hostKeys.KEY_F5.c]             = [ 7, 1 ];

        normalCodeMap[hostKeys.KEY_STOP.c]           = [ 7, 4 ];
        normalCodeMap[hostKeys.KEY_STOP2.c]          = [ 7, 4 ];
        altCodeMap[hostKeys.KEY_STOP_EXTRA.c]        = [ 7, 4 ];
        normalCodeMap[hostKeys.KEY_SELECT.c]         = [ 7, 6 ];
        altCodeMap[hostKeys.KEY_SELECT_EXTRA.c]      = [ 7, 6 ];

        normalCodeMap[hostKeys.KEY_HOME.c]           = [ 8, 1 ];
        normalCodeMap[hostKeys.KEY_INSERT.c]         = [ 8, 2 ];
        normalCodeMap[hostKeys.KEY_DELETE.c]         = [ 8, 3 ];

        normalCodeMap[hostKeys.KEY_UP.c]             = [ 8, 5 ];
        normalCodeMap[hostKeys.KEY_DOWN.c]           = [ 8, 6 ];
        normalCodeMap[hostKeys.KEY_LEFT.c]           = [ 8, 4 ];
        normalCodeMap[hostKeys.KEY_RIGHT.c]          = [ 8, 7 ];

        normalCodeMap[hostKeys.KEY_1.c]              = [ 0, 1 ];
        normalCodeMap[hostKeys.KEY_2.c]              = [ 0, 2 ];
        normalCodeMap[hostKeys.KEY_3.c]              = [ 0, 3 ];
        normalCodeMap[hostKeys.KEY_4.c]              = [ 0, 4 ];
        normalCodeMap[hostKeys.KEY_5.c]              = [ 0, 5 ];
        normalCodeMap[hostKeys.KEY_6.c]              = [ 0, 6 ];
        normalCodeMap[hostKeys.KEY_7.c]              = [ 0, 7 ];
        normalCodeMap[hostKeys.KEY_8.c]              = [ 1, 0 ];
        normalCodeMap[hostKeys.KEY_9.c]              = [ 1, 1 ];
        normalCodeMap[hostKeys.KEY_0.c]              = [ 0, 0 ];

        normalCodeMap[hostKeys.KEY_Q.c]              = [ 4, 6 ];
        normalCodeMap[hostKeys.KEY_W.c]              = [ 5, 4 ];
        normalCodeMap[hostKeys.KEY_E.c]              = [ 3, 2 ];
        normalCodeMap[hostKeys.KEY_R.c]              = [ 4, 7 ];
        normalCodeMap[hostKeys.KEY_T.c]              = [ 5, 1 ];
        normalCodeMap[hostKeys.KEY_Y.c]              = [ 5, 6 ];
        normalCodeMap[hostKeys.KEY_U.c]              = [ 5, 2 ];
        normalCodeMap[hostKeys.KEY_I.c]              = [ 3, 6 ];
        normalCodeMap[hostKeys.KEY_O.c]              = [ 4, 4 ];
        normalCodeMap[hostKeys.KEY_P.c]              = [ 4, 5 ];
        normalCodeMap[hostKeys.KEY_A.c]              = [ 2, 6 ];
        normalCodeMap[hostKeys.KEY_S.c]              = [ 5, 0 ];
        normalCodeMap[hostKeys.KEY_D.c]              = [ 3, 1 ];
        normalCodeMap[hostKeys.KEY_F.c]              = [ 3, 3 ];
        normalCodeMap[hostKeys.KEY_G.c]              = [ 3, 4 ];
        normalCodeMap[hostKeys.KEY_H.c]              = [ 3, 5 ];
        normalCodeMap[hostKeys.KEY_J.c]              = [ 3, 7 ];
        normalCodeMap[hostKeys.KEY_K.c]              = [ 4, 0 ];
        normalCodeMap[hostKeys.KEY_L.c]              = [ 4, 1 ];
        normalCodeMap[hostKeys.KEY_Z.c]              = [ 5, 7 ];
        normalCodeMap[hostKeys.KEY_X.c]              = [ 5, 5 ];
        normalCodeMap[hostKeys.KEY_C.c]              = [ 3, 0 ];
        normalCodeMap[hostKeys.KEY_V.c]              = [ 5, 3 ];
        normalCodeMap[hostKeys.KEY_B.c]              = [ 2, 7 ];
        normalCodeMap[hostKeys.KEY_N.c]              = [ 4, 3 ];
        normalCodeMap[hostKeys.KEY_M.c]              = [ 4, 2 ];

        normalCodeMap[hostKeys.KEY_ESCAPE.c]         = [ 7, 2 ];
        altCodeMap[hostKeys.KEY_ESCAPE_EXTRA.c]      = [ 7, 2 ];
        normalCodeMap[hostKeys.KEY_TAB.c]            = [ 7, 3 ];
        normalCodeMap[hostKeys.KEY_BACKSPACE.c]      = [ 7, 5 ];
        normalCodeMap[hostKeys.KEY_ENTER.c]          = [ 7, 7 ];
        normalCodeMap[hostKeys.KEY_SPACE.c]          = [ 8, 0 ];

        normalCodeMap[hostKeys.KEY_MINUS.c]          = [ 1, 2 ];
        normalCodeMap[hostKeys.KEY_MINUS2.c]         = [ 1, 2 ];
        normalCodeMap[hostKeys.KEY_EQUAL.c]          = [ 1, 3 ];
        normalCodeMap[hostKeys.KEY_EQUAL2.c]         = [ 1, 3 ];
        normalCodeMap[hostKeys.KEY_BACKSLASH.c]      = [ 1, 4 ];
        normalCodeMap[hostKeys.KEY_OPEN_BRACKET.c]   = [ 1, 5 ];
        normalCodeMap[hostKeys.KEY_CLOSE_BRACKET.c]  = [ 1, 6 ];

        normalCodeMap[hostKeys.KEY_SHIFT.c]          = [ 6, 0 ];
        altCodeMap[hostKeys.KEY_SHIFT_EXTRA.c]       = [ 6, 0 ];
        normalCodeMap[hostKeys.KEY_CONTROL.c]        = [ 6, 1 ];
        altCodeMap[hostKeys.KEY_CONTROL_EXTRA.c]     = [ 6, 1 ];
        normalCodeMap[hostKeys.KEY_CAPS_LOCK.c]      = [ 6, 3 ];
        normalCodeMap[hostKeys.KEY_GRAPH.c]          = [ 6, 2 ];
        normalCodeMap[hostKeys.KEY_CODE.c]           = [ 6, 4 ];
        normalCodeMap[hostKeys.KEY_CODE2.c]          = [ 6, 4 ];
        normalCodeMap[hostKeys.KEY_CODE3.c]          = [ 6, 4 ];

        normalCodeMap[hostKeys.KEY_COMMA.c]          = [ 2, 2 ];
        normalCodeMap[hostKeys.KEY_PERIOD.c]         = [ 2, 3 ];
        normalCodeMap[hostKeys.KEY_SEMICOLON.c]      = [ 1, 7 ];
        normalCodeMap[hostKeys.KEY_SEMICOLON2.c]     = [ 1, 7 ];
        normalCodeMap[hostKeys.KEY_SLASH.c]          = [ 2, 4 ];

        normalCodeMap[hostKeys.KEY_DEAD.c]           = [ 2, 5 ];
        normalCodeMap[hostKeys.KEY_DEAD2.c]          = [ 2, 5 ];
        normalCodeMap[hostKeys.KEY_DEAD3.c]          = [ 2, 5 ];

        normalCodeMap[hostKeys.KEY_QUOTE.c]          = [ 2, 0 ];
        normalCodeMap[hostKeys.KEY_BACKQUOTE.c]      = [ 2, 1 ];

        normalCodeMap[hostKeys.KEY_NUM_0.c]          = [ 9, 3 ];
        normalCodeMap[hostKeys.KEY_NUM_1.c]          = [ 9, 4 ];
        normalCodeMap[hostKeys.KEY_NUM_2.c]          = [ 9, 5 ];
        normalCodeMap[hostKeys.KEY_NUM_3.c]          = [ 9, 6 ];
        normalCodeMap[hostKeys.KEY_NUM_4.c]          = [ 9, 7 ];
        normalCodeMap[hostKeys.KEY_NUM_5.c]          = [ 10, 0 ];
        normalCodeMap[hostKeys.KEY_NUM_6.c]          = [ 10, 1 ];
        normalCodeMap[hostKeys.KEY_NUM_7.c]          = [ 10, 2 ];
        normalCodeMap[hostKeys.KEY_NUM_8.c]          = [ 10, 3 ];
        normalCodeMap[hostKeys.KEY_NUM_9.c]          = [ 10, 4 ];
        normalCodeMap[hostKeys.KEY_NUM_MINUS.c]      = [ 10, 5 ];
        normalCodeMap[hostKeys.KEY_NUM_PLUS.c]       = [ 9, 1 ];
        normalCodeMap[hostKeys.KEY_NUM_MULTIPLY.c]   = [ 9, 0 ];
        normalCodeMap[hostKeys.KEY_NUM_DIVIDE.c]     = [ 9, 2 ];
        normalCodeMap[hostKeys.KEY_NUM_PERIOD.c]     = [ 10, 7 ];
        normalCodeMap[hostKeys.KEY_NUM_COMMA.c]      = [ 10, 6 ];
    };

    var initHostKeys = function() {
        hostKeys = {

            KEY_F1: wmsx.DOMKeys.VK_F1,
            KEY_F2: wmsx.DOMKeys.VK_F2,
            KEY_F3: wmsx.DOMKeys.VK_F3,
            KEY_F4: wmsx.DOMKeys.VK_F4,
            KEY_F5: wmsx.DOMKeys.VK_F5,

            KEY_1: wmsx.DOMKeys.VK_1,
            KEY_2: wmsx.DOMKeys.VK_2,
            KEY_3: wmsx.DOMKeys.VK_3,
            KEY_4: wmsx.DOMKeys.VK_4,
            KEY_5: wmsx.DOMKeys.VK_5,
            KEY_6: wmsx.DOMKeys.VK_6,
            KEY_7: wmsx.DOMKeys.VK_7,
            KEY_8: wmsx.DOMKeys.VK_8,
            KEY_9: wmsx.DOMKeys.VK_9,
            KEY_0: wmsx.DOMKeys.VK_0,

            KEY_Q: wmsx.DOMKeys.VK_Q,
            KEY_W: wmsx.DOMKeys.VK_W,
            KEY_E: wmsx.DOMKeys.VK_E,
            KEY_R: wmsx.DOMKeys.VK_R,
            KEY_T: wmsx.DOMKeys.VK_T,
            KEY_Y: wmsx.DOMKeys.VK_Y,
            KEY_U: wmsx.DOMKeys.VK_U,
            KEY_I: wmsx.DOMKeys.VK_I,
            KEY_O: wmsx.DOMKeys.VK_O,
            KEY_P: wmsx.DOMKeys.VK_P,
            KEY_A: wmsx.DOMKeys.VK_A,
            KEY_S: wmsx.DOMKeys.VK_S,
            KEY_D: wmsx.DOMKeys.VK_D,
            KEY_F: wmsx.DOMKeys.VK_F,
            KEY_G: wmsx.DOMKeys.VK_G,
            KEY_H: wmsx.DOMKeys.VK_H,
            KEY_J: wmsx.DOMKeys.VK_J,
            KEY_K: wmsx.DOMKeys.VK_K,
            KEY_L: wmsx.DOMKeys.VK_L,
            KEY_Z: wmsx.DOMKeys.VK_Z,
            KEY_X: wmsx.DOMKeys.VK_X,
            KEY_C: wmsx.DOMKeys.VK_C,
            KEY_V: wmsx.DOMKeys.VK_V,
            KEY_B: wmsx.DOMKeys.VK_B,
            KEY_N: wmsx.DOMKeys.VK_N,
            KEY_M: wmsx.DOMKeys.VK_M,

            KEY_ESCAPE: wmsx.DOMKeys.VK_ESCAPE,
            KEY_ESCAPE_EXTRA: wmsx.DOMKeys.VK_F1,
            KEY_TAB: wmsx.DOMKeys.VK_TAB,
            KEY_ENTER: wmsx.DOMKeys.VK_ENTER,
            KEY_BACKSPACE: wmsx.DOMKeys.VK_BACKSPACE,

            KEY_SPACE: wmsx.DOMKeys.VK_SPACE,

            KEY_STOP: wmsx.DOMKeys.VK_PAUSE,
            KEY_STOP2: wmsx.DOMKeys.VK_CTRL_PAUSE,
            KEY_SELECT: wmsx.DOMKeys.VK_SCROLL_LOCK,

            KEY_HOME: wmsx.DOMKeys.VK_HOME,
            KEY_INSERT: wmsx.DOMKeys.VK_INSERT,
            KEY_DELETE: wmsx.DOMKeys.VK_DELETE,

            KEY_UP: wmsx.DOMKeys.VK_UP,
            KEY_DOWN: wmsx.DOMKeys.VK_DOWN,
            KEY_LEFT: wmsx.DOMKeys.VK_LEFT,
            KEY_RIGHT: wmsx.DOMKeys.VK_RIGHT,

            KEY_MINUS: wmsx.DOMKeys.VK_MINUS,
            KEY_MINUS2: wmsx.DOMKeys.VK_MINUS_FF,
            KEY_EQUAL: wmsx.DOMKeys.VK_EQUALS,
            KEY_EQUAL2: wmsx.DOMKeys.VK_EQUALS_FF,

            KEY_OPEN_BRACKET: wmsx.DOMKeys.VK_OPEN_BRACKET,
            KEY_CLOSE_BRACKET: wmsx.DOMKeys.VK_CLOSE_BRACKET,
            KEY_BACKSLASH: wmsx.DOMKeys.VK_BACKSLASH,

            KEY_COMMA: wmsx.DOMKeys.VK_COMMA,
            KEY_PERIOD: wmsx.DOMKeys.VK_PERIOD,
            KEY_SEMICOLON: wmsx.DOMKeys.VK_SEMICOLON,
            KEY_SEMICOLON2: wmsx.DOMKeys.VK_SEMICOLON_FF,
            KEY_SLASH: wmsx.DOMKeys.VK_SLASH,

            KEY_QUOTE: wmsx.DOMKeys.VK_QUOTE,
            KEY_BACKQUOTE: wmsx.DOMKeys.VK_BACKQUOTE,

            KEY_SHIFT: wmsx.DOMKeys.VK_SHIFT,
            KEY_SHIFT_EXTRA: wmsx.DOMKeys.VK_SHIFT,
            KEY_CONTROL: wmsx.DOMKeys.VK_CONTROL,
            KEY_CONTROL_EXTRA: wmsx.DOMKeys.VK_CONTROL,
            KEY_CAPS_LOCK: wmsx.DOMKeys.VK_CAPS_LOCK,

            KEY_GRAPH: wmsx.DOMKeys.VK_PAGE_UP,
            KEY_CODE:  wmsx.DOMKeys.VK_PAGE_DOWN,
            KEY_CODE2: wmsx.DOMKeys.VK_UNBOUND,
            KEY_CODE3: wmsx.DOMKeys.VK_UNBOUND,
            KEY_DEAD:  wmsx.DOMKeys.VK_END,
            KEY_DEAD2: wmsx.DOMKeys.VK_UNBOUND,
            KEY_DEAD3: wmsx.DOMKeys.VK_UNBOUND,

            KEY_NUM_0: wmsx.DOMKeys.VK_NUM_0,
            KEY_NUM_1: wmsx.DOMKeys.VK_NUM_1,
            KEY_NUM_2: wmsx.DOMKeys.VK_NUM_2,
            KEY_NUM_3: wmsx.DOMKeys.VK_NUM_3,
            KEY_NUM_4: wmsx.DOMKeys.VK_NUM_4,
            KEY_NUM_5: wmsx.DOMKeys.VK_NUM_5,
            KEY_NUM_6: wmsx.DOMKeys.VK_NUM_6,
            KEY_NUM_7: wmsx.DOMKeys.VK_NUM_7,
            KEY_NUM_8: wmsx.DOMKeys.VK_NUM_8,
            KEY_NUM_9: wmsx.DOMKeys.VK_NUM_9,
            KEY_NUM_MINUS: wmsx.DOMKeys.VK_NUM_MINUS,
            KEY_NUM_PLUS: wmsx.DOMKeys.VK_NUM_PLUS,
            KEY_NUM_MULTIPLY: wmsx.DOMKeys.VK_NUM_MULTIPLY,
            KEY_NUM_DIVIDE: wmsx.DOMKeys.VK_NUM_DIVIDE,
            KEY_NUM_PERIOD: wmsx.DOMKeys.VK_NUM_PERIOD,
            KEY_NUM_COMMA: wmsx.DOMKeys.VK_NUM_COMMA.c

        };

        hostKeys.KEY_SELECT_EXTRA =  hostKeys.KEY_OPEN_BRACKET;
        hostKeys.KEY_STOP_EXTRA =    hostKeys.KEY_CLOSE_BRACKET;

        initHostKeysForKeyboard(wmsx.DOMKeys.getKeyboard());
    };

    var initHostKeysForKeyboard = function(keyboard) {
        switch (keyboard.name) {
            case "pt-BR":
                hostKeys.KEY_DEAD2 = wmsx.DOMKeys.BR_VK_TILDE;
                hostKeys.KEY_DEAD3 = wmsx.DOMKeys.BR_VK_TILDE_FF;
                hostKeys.KEY_CODE2 = wmsx.DOMKeys.BR_VK_CEDILLA;
                hostKeys.KEY_CODE3 = wmsx.DOMKeys.BR_VK_CEDILLA_FF;
        }
    };

    this.applyPreferences = function() {
    };


    var keyboardSocket;
    var monitor;

    var keyStateMap =  {};

    var normalCodeMap;
    var altCodeMap;
    var hostKeys;


    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;

    init();

};

