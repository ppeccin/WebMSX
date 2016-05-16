// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMKeyboard = function(hub, keyForwardControls) {
    var self = this;

    function init() {
        initHostKeys();
        initMatrix();
    }

    this.connect = function(pControllersSocket) {
        controllersSocket = pControllersSocket;
    };

    this.connectPeripherals = function(pScreen) {
        monitor = pScreen.getMonitor();
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.controllersClockPulse = function() {
        if (turboFireSpeed)
            if (--turboFireFlipClockCount <= 0) turboFireFlipClockCount = turboFireSpeed;
    };

    this.readKeyboardPort = function(row) {
        if (turboFireSpeed)
            return row === 8
                ? keyboardRowValues[8] | (turboFireFlipClockCount > 2)
                : keyboardRowValues[row];
        else
            return keyboardRowValues[row];
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

    this.setTurboFireSpeed = function(speed) {
        turboFireSpeed = speed ? speed * speed + 3 : 0;
        turboFireFlipClockCount = 0;
    };

    this.resetControllers = function() {
        keyStateMap = {};
        extraModifiersActive.clear();
        wmsx.Util.arrayFill(keyboardRowValues, 0xff);
    };

    this.keyDown = function(event) {
        //console.log("Keyboard Down: " + event.keyCode + " " + event.altKey);

        if (processKeyEvent(event.keyCode, true, event.altKey, event.ctrlKey)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        } else
            keyForwardControls.keyDown(event);
    };

    this.keyUp = function(event) {
        //console.log("Keyboard Up: " + event.keyCode + " " + event.altKey);

        if (processKeyEvent(event.keyCode, false, event.altKey, event.ctrlKey)) {
            event.returnValue = false;  // IE
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            return false;
        } else
            keyForwardControls.keyUp(event);
    };

    var processKeyEvent = function(keyCode, press, alt, ctrl) {
        var key = keyForEvent(keyCode, alt, ctrl);
        if (!key) return false;
        //console.log(key);

        var state = keyStateMap[key];
        if (!state || (state !== press)) {
            keyStateMap[key] = press;
            if (press) {
                if (key.extraModifier) extraModifiersActive.add(key);
                keyboardRowValues[key[0]] &= ~(1 << key[1]);
                if (turboFireSpeed && key === spaceKey) turboFireFlipClockCount = 3;
            } else {
                if (key.extraModifier) extraModifiersActive.delete(key);
                keyboardRowValues[key[0]] |= (1 << key[1]);
            }
        }
        return true;
    };

    var keyForEvent = function(keyCode, alt, ctrl) {
        var key;
        if (extraModifiersActive.size > 0) {         // If extra modifiers active, ignore ALT unless its also an extra modifier
            if (alt) {
                key = altCodeMap[keyCode];
                return key && key.extraModifier ? key : normalCodeMap[keyCode];
            } else
                key = normalCodeMap[keyCode];
                var mod = key && key.extraModifier;
                return mod && extraModifiersActive.has(mod) ? mod : key;
        } else {
            return alt
                ? ctrl
                    ? ctrlAltCodeMap[keyCode] || altCodeMap[keyCode]
                    : altCodeMap[keyCode]
                : normalCodeMap[keyCode];
        }
    };

    // International Matrix
    var initMatrix = function() {
        self.applyPreferences();

        normalCodeMap = {};
        altCodeMap = {};
        ctrlAltCodeMap = {};

        normalCodeMap[hostKeys.KEY_HOME.c]           = [ 8, 1 ];
        normalCodeMap[hostKeys.KEY_INSERT.c]         = [ 8, 2 ];
        normalCodeMap[hostKeys.KEY_DELETE.c]         = [ 8, 3 ];

        normalCodeMap[hostKeys.KEY_UP.c]             = [ 8, 5 ];
        normalCodeMap[hostKeys.KEY_DOWN.c]           = [ 8, 6 ];
        normalCodeMap[hostKeys.KEY_LEFT.c]           = [ 8, 4 ];
        normalCodeMap[hostKeys.KEY_RIGHT.c]          = [ 8, 7 ];

        normalCodeMap[hostKeys.KEY_F1.c]             = [ 6, 5 ];
        normalCodeMap[hostKeys.KEY_F2.c]             = [ 6, 6 ];
        normalCodeMap[hostKeys.KEY_F3.c]             = [ 6, 7 ];
        normalCodeMap[hostKeys.KEY_F4.c]             = [ 7, 0 ];
        normalCodeMap[hostKeys.KEY_F5.c]             = [ 7, 1 ];

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

        // Map "normal" keys also to alternatively Ctrl+Alt+key to avoid browsers hotkeys with Ctrl
        ctrlAltCodeMap[hostKeys.KEY_Q.c] = normalCodeMap[hostKeys.KEY_Q.c] = [ 4, 6 ];
        ctrlAltCodeMap[hostKeys.KEY_W.c] = normalCodeMap[hostKeys.KEY_W.c] = [ 5, 4 ];
        ctrlAltCodeMap[hostKeys.KEY_E.c] = normalCodeMap[hostKeys.KEY_E.c] = [ 3, 2 ];
        ctrlAltCodeMap[hostKeys.KEY_R.c] = normalCodeMap[hostKeys.KEY_R.c] = [ 4, 7 ];
        ctrlAltCodeMap[hostKeys.KEY_T.c] = normalCodeMap[hostKeys.KEY_T.c] = [ 5, 1 ];
        ctrlAltCodeMap[hostKeys.KEY_Y.c] = normalCodeMap[hostKeys.KEY_Y.c] = [ 5, 6 ];
        ctrlAltCodeMap[hostKeys.KEY_U.c] = normalCodeMap[hostKeys.KEY_U.c] = [ 5, 2 ];
        ctrlAltCodeMap[hostKeys.KEY_I.c] = normalCodeMap[hostKeys.KEY_I.c] = [ 3, 6 ];
        ctrlAltCodeMap[hostKeys.KEY_O.c] = normalCodeMap[hostKeys.KEY_O.c] = [ 4, 4 ];
        ctrlAltCodeMap[hostKeys.KEY_P.c] = normalCodeMap[hostKeys.KEY_P.c] = [ 4, 5 ];
        ctrlAltCodeMap[hostKeys.KEY_A.c] = normalCodeMap[hostKeys.KEY_A.c] = [ 2, 6 ];
        ctrlAltCodeMap[hostKeys.KEY_S.c] = normalCodeMap[hostKeys.KEY_S.c] = [ 5, 0 ];
        ctrlAltCodeMap[hostKeys.KEY_D.c] = normalCodeMap[hostKeys.KEY_D.c] = [ 3, 1 ];
        ctrlAltCodeMap[hostKeys.KEY_F.c] = normalCodeMap[hostKeys.KEY_F.c] = [ 3, 3 ];
        ctrlAltCodeMap[hostKeys.KEY_G.c] = normalCodeMap[hostKeys.KEY_G.c] = [ 3, 4 ];
        ctrlAltCodeMap[hostKeys.KEY_H.c] = normalCodeMap[hostKeys.KEY_H.c] = [ 3, 5 ];
        ctrlAltCodeMap[hostKeys.KEY_J.c] = normalCodeMap[hostKeys.KEY_J.c] = [ 3, 7 ];
        ctrlAltCodeMap[hostKeys.KEY_K.c] = normalCodeMap[hostKeys.KEY_K.c] = [ 4, 0 ];
        ctrlAltCodeMap[hostKeys.KEY_L.c] = normalCodeMap[hostKeys.KEY_L.c] = [ 4, 1 ];
        ctrlAltCodeMap[hostKeys.KEY_Z.c] = normalCodeMap[hostKeys.KEY_Z.c] = [ 5, 7 ];
        ctrlAltCodeMap[hostKeys.KEY_X.c] = normalCodeMap[hostKeys.KEY_X.c] = [ 5, 5 ];
        ctrlAltCodeMap[hostKeys.KEY_C.c] = normalCodeMap[hostKeys.KEY_C.c] = [ 3, 0 ];
        ctrlAltCodeMap[hostKeys.KEY_V.c] = normalCodeMap[hostKeys.KEY_V.c] = [ 5, 3 ];
        ctrlAltCodeMap[hostKeys.KEY_B.c] = normalCodeMap[hostKeys.KEY_B.c] = [ 2, 7 ];
        ctrlAltCodeMap[hostKeys.KEY_N.c] = normalCodeMap[hostKeys.KEY_N.c] = [ 4, 3 ];
        ctrlAltCodeMap[hostKeys.KEY_M.c] = normalCodeMap[hostKeys.KEY_M.c] = [ 4, 2 ];

        normalCodeMap[hostKeys.KEY_ESCAPE.c]         = [ 7, 2 ];
        normalCodeMap[hostKeys.KEY_TAB.c]            = [ 7, 3 ];
        normalCodeMap[hostKeys.KEY_BACKSPACE.c]      = [ 7, 5 ];
        normalCodeMap[hostKeys.KEY_ENTER.c]          = [ 7, 7 ];

        spaceKey = [ 8, 0 ];
        normalCodeMap[hostKeys.KEY_SPACE.c]          = spaceKey;

        normalCodeMap[hostKeys.KEY_MINUS.c]          = [ 1, 2 ];
        normalCodeMap[hostKeys.KEY_MINUS2.c]         = [ 1, 2 ];
        normalCodeMap[hostKeys.KEY_EQUAL.c]          = [ 1, 3 ];
        normalCodeMap[hostKeys.KEY_EQUAL2.c]         = [ 1, 3 ];
        normalCodeMap[hostKeys.KEY_BACKSLASH.c]      = [ 1, 4 ];
        normalCodeMap[hostKeys.KEY_OPEN_BRACKET.c]   = [ 1, 5 ];
        normalCodeMap[hostKeys.KEY_CLOSE_BRACKET.c]  = [ 1, 6 ];

        normalCodeMap[hostKeys.KEY_COMMA.c]          = [ 2, 2 ];
        normalCodeMap[hostKeys.KEY_PERIOD.c]         = [ 2, 3 ];
        normalCodeMap[hostKeys.KEY_SEMICOLON.c]      = [ 1, 7 ];
        normalCodeMap[hostKeys.KEY_SEMICOLON2.c]     = [ 1, 7 ];
        normalCodeMap[hostKeys.KEY_SLASH.c]          = [ 2, 4 ];

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

        normalCodeMap[hostKeys.KEY_SHIFT.c]          = [ 6, 0 ];
        altCodeMap[hostKeys.KEY_SHIFT.c]             = [ 6, 0 ];
        normalCodeMap[hostKeys.KEY_CONTROL.c]        = [ 6, 1 ];
        altCodeMap[hostKeys.KEY_CONTROL.c]           = [ 6, 1 ];
        normalCodeMap[hostKeys.KEY_CAPS_LOCK.c]      = [ 6, 3 ];

        normalCodeMap[hostKeys.KEY_GRAPH.c]          = [ 6, 2 ];
        normalCodeMap[hostKeys.KEY_CODE.c]           = [ 6, 4 ];
        normalCodeMap[hostKeys.KEY_DEAD.c]           = [ 2, 5 ];
        normalCodeMap[hostKeys.KEY_DEAD2.c]          = [ 2, 5 ];
        normalCodeMap[hostKeys.KEY_DEAD3.c]          = [ 2, 5 ];

        normalCodeMap[hostKeys.KEY_STOP.c]           = [ 7, 4 ];
        normalCodeMap[hostKeys.KEY_STOP2.c]          = [ 7, 4 ];
        normalCodeMap[hostKeys.KEY_STOP3.c]          = [ 7, 4 ];
        normalCodeMap[hostKeys.KEY_SELECT.c]         = [ 7, 6 ];
        normalCodeMap[hostKeys.KEY_SELECT2.c]        = [ 7, 6 ];


        // Extra mappings involving ALT to overcome certain missing keys

        var graphExMod = [ 6, 2 ]; graphExMod.extraModifier = graphExMod;
        altCodeMap[hostKeys.KEY_GRAPH_EXTRA.c] = graphExMod; normalCodeMap[hostKeys.KEY_GRAPH_EXTRA.c].extraModifier = graphExMod;
        altCodeMap[hostKeys.KEY_GRAPH_EXTRA2.c] = graphExMod; normalCodeMap[hostKeys.KEY_GRAPH_EXTRA2.c].extraModifier = graphExMod;

        var codeExMod = [ 6, 4 ]; codeExMod.extraModifier = codeExMod;
        altCodeMap[hostKeys.KEY_CODE_EXTRA.c] = codeExMod; normalCodeMap[hostKeys.KEY_CODE_EXTRA.c].extraModifier = codeExMod;
        altCodeMap[hostKeys.KEY_CODE_EXTRA2.c] = codeExMod; normalCodeMap[hostKeys.KEY_CODE_EXTRA2.c].extraModifier = codeExMod;

        var deadExMod = [ 2, 5 ]; deadExMod.extraModifier = deadExMod;
        altCodeMap[hostKeys.KEY_DEAD_EXTRA.c] = deadExMod; normalCodeMap[hostKeys.KEY_DEAD_EXTRA.c].extraModifier = deadExMod;

        var stopExMod = [ 7, 4 ]; stopExMod.extraModifier = stopExMod;
        altCodeMap[hostKeys.KEY_STOP_EXTRA.c] = stopExMod; normalCodeMap[hostKeys.KEY_STOP_EXTRA.c].extraModifier = stopExMod;

        var selectExMod = [ 7, 6 ]; selectExMod.extraModifier = selectExMod;
        altCodeMap[hostKeys.KEY_SELECT_EXTRA.c] = selectExMod; normalCodeMap[hostKeys.KEY_SELECT_EXTRA.c].extraModifier = selectExMod;

        var escapeExMod = [ 7, 2 ]; escapeExMod.extraModifier = escapeExMod;
        altCodeMap[hostKeys.KEY_ESCAPE_EXTRA.c] = escapeExMod; normalCodeMap[hostKeys.KEY_ESCAPE_EXTRA.c].extraModifier = escapeExMod;
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
            KEY_STOP3: wmsx.DOMKeys.VK_F9,
            KEY_STOP_EXTRA: wmsx.DOMKeys.VK_OPEN_BRACKET,

            KEY_SELECT: wmsx.DOMKeys.VK_SCROLL_LOCK,
            KEY_SELECT2: wmsx.DOMKeys.VK_F10,
            KEY_SELECT_EXTRA: wmsx.DOMKeys.VK_CLOSE_BRACKET,

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
            KEY_CONTROL: wmsx.DOMKeys.VK_CONTROL,
            KEY_CAPS_LOCK: wmsx.DOMKeys.VK_CAPS_LOCK,

            KEY_GRAPH: wmsx.DOMKeys.VK_PAGE_UP,
            KEY_GRAPH_EXTRA: wmsx.DOMKeys.VK_F9,
            KEY_GRAPH_EXTRA2: wmsx.DOMKeys.VK_COMMA,
            KEY_CODE:  wmsx.DOMKeys.VK_PAGE_DOWN,
            KEY_CODE_EXTRA: wmsx.DOMKeys.VK_F10,
            KEY_CODE_EXTRA2: wmsx.DOMKeys.VK_PERIOD,
            KEY_DEAD:  wmsx.DOMKeys.VK_END,
            KEY_DEAD2: wmsx.DOMKeys.VK_UNBOUND,
            KEY_DEAD3: wmsx.DOMKeys.VK_UNBOUND,
            KEY_DEAD_EXTRA: wmsx.DOMKeys.VK_SLASH,

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

        initHostKeysForKeyboard(wmsx.DOMKeys.getKeyboard());
    };

    var initHostKeysForKeyboard = function(keyboard) {
        switch (keyboard.name) {
            case "pt-BR":
                hostKeys.KEY_DEAD2 = wmsx.DOMKeys.BR_VK_TILDE;
                hostKeys.KEY_DEAD3 = wmsx.DOMKeys.BR_VK_TILDE_FF;
        }
    };

    this.applyPreferences = function() {
    };


    var controllersSocket;
    var monitor;

    var keyStateMap = {};
    var extraModifiersActive = new Set();
    var keyboardRowValues = wmsx.Util.arrayFill(new Array(16), 0xff);            // only 11 rows used

    var normalCodeMap;
    var altCodeMap;
    var ctrlAltCodeMap;

    var hostKeys;

    var spaceKey;
    var turboFireSpeed = 0, turboFireFlipClockCount = 0;


    init();

};

