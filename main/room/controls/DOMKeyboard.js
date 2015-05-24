// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

DOMKeyboard = function() {
    var self = this;

    function init() {
        initKeys();
    }

    this.connect = function(pKeyboardSocket) {
        keyboardSocket = pKeyboardSocket;
    };

    this.connectPeripherals = function(screen, consolePanel) {
        //gamepadControls.connectScreen(screen);
        this.addInputElements(screen.keyControlsInputElements());
        if (consolePanel) this.addInputElements(consolePanel.keyControlsInputElements());
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.destroy = function() {
    };

    this.addInputElements = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener("keydown", this.keyDown);
            elements[i].addEventListener("keyup", this.keyUp);
        }
    };

    this.keyDown = function(event) {
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
        if (checkLocalControlKey(keyCode, modifiers, press)) return true;
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

    var checkLocalControlKey = function(keyCode, modif, press) {
        return false;
    };

    var keyForEvent = function(keyCode, modif) {
        if (modif & KEY_ALT_MASK) return;
        return normalCodeMap[keyCode];
    };

    var initKeys = function() {
        self.applyPreferences();

        // International US layout
        normalCodeMap[KEY_F1]             = [ 6, 5 ];
        normalCodeMap[KEY_F2]             = [ 6, 6 ];
        normalCodeMap[KEY_F3]             = [ 6, 7 ];
        normalCodeMap[KEY_F4]             = [ 7, 0 ];
        normalCodeMap[KEY_F5]             = [ 7, 1 ];
        normalCodeMap[KEY_PAUSE]          = [ 7, 4 ];       // STOP
        normalCodeMap[KEY_PAUSE_CTR]      = [ 7, 4 ];       // STOP with CTRL
        normalCodeMap[KEY_SCRL_LOCK]      = [ 7, 6 ];       // SELECT
        normalCodeMap[KEY_HOME]           = [ 8, 1 ];
        normalCodeMap[KEY_INSERT]         = [ 8, 2 ];
        normalCodeMap[KEY_DELETE]         = [ 8, 3 ];
        normalCodeMap[KEY_UP]             = [ 8, 5 ];
        normalCodeMap[KEY_DOWN]           = [ 8, 6 ];
        normalCodeMap[KEY_LEFT]           = [ 8, 4 ];
        normalCodeMap[KEY_RIGHT]          = [ 8, 7 ];
        normalCodeMap[KEY_ESCAPE]         = [ 7, 2 ];
        normalCodeMap[KEY_QUOTE]          = [ 2, 0 ];
        normalCodeMap[KEY_1]              = [ 0, 1 ];
        normalCodeMap[KEY_2]              = [ 0, 2 ];
        normalCodeMap[KEY_3]              = [ 0, 3 ];
        normalCodeMap[KEY_4]              = [ 0, 4 ];
        normalCodeMap[KEY_5]              = [ 0, 5 ];
        normalCodeMap[KEY_6]              = [ 0, 6 ];
        normalCodeMap[KEY_7]              = [ 0, 7 ];
        normalCodeMap[KEY_8]              = [ 1, 0 ];
        normalCodeMap[KEY_9]              = [ 1, 1 ];
        normalCodeMap[KEY_0]              = [ 0, 0 ];
        normalCodeMap[KEY_MINUS]          = [ 1, 2 ];
        normalCodeMap[KEY_MINUS2]         = [ 1, 2 ];
        normalCodeMap[KEY_EQUAL]          = [ 1, 3 ];
        normalCodeMap[KEY_EQUAL2]         = [ 1, 3 ];
        normalCodeMap[KEY_BACK_SLASH]     = [ 1, 4 ];
        normalCodeMap[KEY_BACKSPACE]      = [ 7, 5 ];
        normalCodeMap[KEY_TAB]            = [ 7, 3 ];
        normalCodeMap[KEY_Q]              = [ 4, 6 ];
        normalCodeMap[KEY_W]              = [ 5, 4 ];
        normalCodeMap[KEY_E]              = [ 3, 2 ];
        normalCodeMap[KEY_R]              = [ 4, 7 ];
        normalCodeMap[KEY_T]              = [ 5, 1 ];
        normalCodeMap[KEY_Y]              = [ 5, 6 ];
        normalCodeMap[KEY_U]              = [ 5, 2 ];
        normalCodeMap[KEY_I]              = [ 3, 6 ];
        normalCodeMap[KEY_O]              = [ 4, 4 ];
        normalCodeMap[KEY_P]              = [ 4, 5 ];
        normalCodeMap[KEY_ACUTE]          = [ 2, 5 ];
        normalCodeMap[KEY_OPEN_BRACKET]   = [ 1, 5 ];
        normalCodeMap[KEY_CLOSE_BRACKET]  = [ 1, 6 ];
        normalCodeMap[KEY_ENTER]          = [ 7, 7 ];
        normalCodeMap[KEY_CONTROL]        = [ 6, 1 ];
        normalCodeMap[KEY_A]              = [ 2, 6 ];
        normalCodeMap[KEY_S]              = [ 5, 0 ];
        normalCodeMap[KEY_D]              = [ 3, 1 ];
        normalCodeMap[KEY_F]              = [ 3, 3 ];
        normalCodeMap[KEY_G]              = [ 3, 4 ];
        normalCodeMap[KEY_H]              = [ 3, 5 ];
        normalCodeMap[KEY_J]              = [ 3, 7 ];
        normalCodeMap[KEY_K]              = [ 4, 0 ];
        normalCodeMap[KEY_L]              = [ 4, 1 ];
        normalCodeMap[KEY_CEDILLA]        = [ 2, 5 ];
        normalCodeMap[KEY_SEMICOLON]      = [ 1, 7 ];
        normalCodeMap[KEY_TILDE]          = [ 2, 1 ];
        normalCodeMap[KEY_SHIFT]          = [ 6, 0 ];
        normalCodeMap[KEY_Z]              = [ 5, 7 ];
        normalCodeMap[KEY_X]              = [ 5, 5 ];
        normalCodeMap[KEY_C]              = [ 3, 0 ];
        normalCodeMap[KEY_V]              = [ 5, 3 ];
        normalCodeMap[KEY_B]              = [ 2, 7 ];
        normalCodeMap[KEY_N]              = [ 4, 3 ];
        normalCodeMap[KEY_M]              = [ 4, 2 ];
        normalCodeMap[KEY_COMMA]          = [ 2, 2 ];
        normalCodeMap[KEY_PERIOD]         = [ 2, 3 ];
        normalCodeMap[KEY_SLASH]          = [ 2, 4 ];
        normalCodeMap[KEY_CAPS_LOCK]      = [ 6, 3 ];
        normalCodeMap[KEY_PAGE_UP]        = [ 6, 2 ];   // GRA
        normalCodeMap[KEY_PAGE_DOWN]      = [ 6, 4 ];   // CODE
        normalCodeMap[KEY_SPACE]          = [ 8, 0 ];

        normalCodeMap[KEY_NUM_0]          = [ 9, 3 ];
        normalCodeMap[KEY_NUM_1]          = [ 9, 4 ];
        normalCodeMap[KEY_NUM_2]          = [ 9, 5 ];
        normalCodeMap[KEY_NUM_3]          = [ 9, 6 ];
        normalCodeMap[KEY_NUM_4]          = [ 9, 7 ];
        normalCodeMap[KEY_NUM_5]          = [ 10, 0 ];
        normalCodeMap[KEY_NUM_6]          = [ 10, 1 ];
        normalCodeMap[KEY_NUM_7]          = [ 10, 2 ];
        normalCodeMap[KEY_NUM_8]          = [ 10, 3 ];
        normalCodeMap[KEY_NUM_9]          = [ 10, 4 ];
        normalCodeMap[KEY_NUM_MINUS]      = [ 10, 5 ];
        normalCodeMap[KEY_NUM_PLUS]       = [ 9, 1 ];
        normalCodeMap[KEY_NUM_MULTIPLY]   = [ 9, 0 ];
        normalCodeMap[KEY_NUM_DIVIDE]     = [ 9, 2 ];
        normalCodeMap[KEY_NUM_PERIOD]     = [ 10, 7 ];
        normalCodeMap[KEY_NUM_COMMA]      = [ 10, 6 ];
    };

    this.applyPreferences = function() {
    };


    var keyboardSocket;

    var normalCodeMap = {};
    var keyStateMap =  {};


    // Default Key Values

    var KEY_F1               = DOMKeys.VK_F1.c;
    var KEY_F2               = DOMKeys.VK_F2.c;
    var KEY_F3               = DOMKeys.VK_F3.c;
    var KEY_F4               = DOMKeys.VK_F4.c;
    var KEY_F5               = DOMKeys.VK_F5.c;

    var KEY_PAUSE            = DOMKeys.VK_PAUSE.c;
    var KEY_PAUSE_CTR        = 3;
    var KEY_SCRL_LOCK        = DOMKeys.VK_SCROLL_LOCK.c;

    var KEY_HOME             = DOMKeys.VK_HOME.c;
    var KEY_INSERT           = DOMKeys.VK_INSERT.c;
    var KEY_DELETE           = DOMKeys.VK_DELETE.c;

    var KEY_UP               = DOMKeys.VK_UP.c;
    var KEY_DOWN             = DOMKeys.VK_DOWN.c;
    var KEY_LEFT             = DOMKeys.VK_LEFT.c;
    var KEY_RIGHT            = DOMKeys.VK_RIGHT.c;

    var KEY_ESCAPE           = DOMKeys.VK_ESCAPE.c;
    var KEY_1                = DOMKeys.VK_1.c;
    var KEY_2                = DOMKeys.VK_2.c;
    var KEY_3                = DOMKeys.VK_3.c;
    var KEY_4                = DOMKeys.VK_4.c;
    var KEY_5                = DOMKeys.VK_5.c;
    var KEY_6                = DOMKeys.VK_6.c;
    var KEY_7                = DOMKeys.VK_7.c;
    var KEY_8                = DOMKeys.VK_8.c;
    var KEY_9                = DOMKeys.VK_9.c;
    var KEY_0                = DOMKeys.VK_0.c;
    var KEY_MINUS            = DOMKeys.VK_MINUS.c;
    var KEY_MINUS2           = DOMKeys.VK_MINUS2.c;
    var KEY_EQUAL            = DOMKeys.VK_EQUALS.c;
    var KEY_EQUAL2           = DOMKeys.VK_EQUALS2.c;
    var KEY_BACK_SLASH       = DOMKeys.VK_BACK_SLASH.c;
    var KEY_BACKSPACE        = DOMKeys.VK_BACKSPACE.c;

    var KEY_TAB              = DOMKeys.VK_TAB.c;
    var KEY_Q                = DOMKeys.VK_Q.c;
    var KEY_W                = DOMKeys.VK_W.c;
    var KEY_E                = DOMKeys.VK_E.c;
    var KEY_R                = DOMKeys.VK_R.c;
    var KEY_T                = DOMKeys.VK_T.c;
    var KEY_Y                = DOMKeys.VK_Y.c;
    var KEY_U                = DOMKeys.VK_U.c;
    var KEY_I                = DOMKeys.VK_I.c;
    var KEY_O                = DOMKeys.VK_O.c;
    var KEY_P                = DOMKeys.VK_P.c;
    var KEY_OPEN_BRACKET     = DOMKeys.VK_OPEN_BRACKET.c;
    var KEY_CLOSE_BRACKET    = DOMKeys.VK_CLOSE_BRACKET.c;
    var KEY_ENTER            = DOMKeys.VK_ENTER.c;

    var KEY_CONTROL          = DOMKeys.VK_CONTROL.c;
    var KEY_A                = DOMKeys.VK_A.c;
    var KEY_S                = DOMKeys.VK_S.c;
    var KEY_D                = DOMKeys.VK_D.c;
    var KEY_F                = DOMKeys.VK_F.c;
    var KEY_G                = DOMKeys.VK_G.c;
    var KEY_H                = DOMKeys.VK_H.c;
    var KEY_J                = DOMKeys.VK_J.c;
    var KEY_K                = DOMKeys.VK_K.c;
    var KEY_L                = DOMKeys.VK_L.c;
    var KEY_CEDILLA          = DOMKeys.VK_CEDILLA.c;
    var KEY_SEMICOLON        = DOMKeys.VK_SEMICOLON.c;
    var KEY_QUOTE            = DOMKeys.VK_QUOTE.c;
    var KEY_TILDE            = DOMKeys.VK_TILDE.c;

    var KEY_SHIFT            = DOMKeys.VK_SHIFT.c;
    var KEY_Z                = DOMKeys.VK_Z.c;
    var KEY_X                = DOMKeys.VK_X.c;
    var KEY_C                = DOMKeys.VK_C.c;
    var KEY_V                = DOMKeys.VK_V.c;
    var KEY_B                = DOMKeys.VK_B.c;
    var KEY_N                = DOMKeys.VK_N.c;
    var KEY_M                = DOMKeys.VK_M.c;
    var KEY_COMMA            = DOMKeys.VK_COMMA.c;
    var KEY_PERIOD           = DOMKeys.VK_PERIOD.c;
    var KEY_SLASH            = DOMKeys.VK_SLASH.c;
    var KEY_ACUTE            = DOMKeys.VK_ACUTE.c;

    var KEY_CAPS_LOCK        = DOMKeys.VK_CAPS_LOCK.c;
    var KEY_SPACE            = DOMKeys.VK_SPACE.c;

    var KEY_PAGE_UP          = DOMKeys.VK_ALT.c;
    var KEY_PAGE_DOWN        = DOMKeys.VK_PAGE_DOWN.c;

    var KEY_NUM_0            = DOMKeys.VK_NUM_0.c;
    var KEY_NUM_1            = DOMKeys.VK_NUM_1.c;
    var KEY_NUM_2            = DOMKeys.VK_NUM_2.c;
    var KEY_NUM_3            = DOMKeys.VK_NUM_3.c;
    var KEY_NUM_4            = DOMKeys.VK_NUM_4.c;
    var KEY_NUM_5            = DOMKeys.VK_NUM_5.c;
    var KEY_NUM_6            = DOMKeys.VK_NUM_6.c;
    var KEY_NUM_7            = DOMKeys.VK_NUM_7.c;
    var KEY_NUM_8            = DOMKeys.VK_NUM_8.c;
    var KEY_NUM_9            = DOMKeys.VK_NUM_9.c;
    var KEY_NUM_MINUS        = DOMKeys.VK_NUM_MINUS.c;
    var KEY_NUM_PLUS         = DOMKeys.VK_NUM_PLUS.c;
    var KEY_NUM_MULTIPLY     = DOMKeys.VK_NUM_MULTIPLY.c;
    var KEY_NUM_DIVIDE       = DOMKeys.VK_NUM_DIVIDE.c;
    var KEY_NUM_PERIOD       = DOMKeys.VK_NUM_PERIOD.c;
    var KEY_NUM_COMMA        = DOMKeys.VK_NUM_COMMA.c;


    var KEY_CTRL_MASK  = 1;
    var KEY_ALT_MASK   = 2;
    var KEY_SHIFT_MASK = 4;

    init();

};

