// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.userPreferences = { };

WMSX.userPreferences.defaults = function() {
"use strict";

    var g = wmsx.GamepadButtons;
    var k = wmsx.DOMKeys;

    return {
        keyboard: undefined,        // auto
        customKeyboards: { },

        joysticks: [
            {
                buttons: {
                    UP:        [ g.JB_UP ],
                    DOWN:      [ g.JB_DOWN ],
                    LEFT:      [ g.JB_LEFT ],
                    RIGHT:     [ g.JB_RIGHT ],
                    A:         [ g.JB_1, g.JB_3 ],
                    B:         [ g.JB_2, g.JB_3 ],
                    X:         [ ],
                    Y:         [ ],
                    L:         [ g.JB_L1, g.JB_L2 ],
                    R:         [ g.JB_R1, g.JB_R2 ],
                    BACK:      [ g.JB_BACK ],
                    START:     [ g.JB_START ]
                },
                virtualButtonsKeys: {
                    X:         [ ],
                    Y:         [ ],
                    L:         [ { c: k.VK_F12.c | k.SHIFT, n: [ "Shift", "F12" ] } ],
                    R:         [ k.VK_F12 ],
                    BACK:      [ k.VK_ESCAPE ],
                    START:     [ { c: k.VK_P.c | k.ALT, n: [ "Alt", "P" ] } ]
                },
                settings: {
                    device:    -1,  // -1 = auto
                    xAxis:     0,
                    xAxisSig:  1,
                    yAxis:     1,
                    yAxisSig:  1,
                    deadzone:  0.3
                }
            },
            {
                buttons: {
                    UP:        [ g.JB_UP ],
                    DOWN:      [ g.JB_DOWN ],
                    LEFT:      [ g.JB_LEFT ],
                    RIGHT:     [ g.JB_RIGHT ],
                    A:         [ g.JB_1, g.JB_3 ],
                    B:         [ g.JB_2, g.JB_3 ],
                    X:         [ ],
                    Y:         [ ],
                    L:         [ g.JB_L1, g.JB_L2 ],
                    R:         [ g.JB_R1, g.JB_R2 ],
                    BACK:      [ g.JB_BACK ],
                    START:     [ g.JB_START ]
                },
                virtualButtonsKeys: {
                    X:         [ ],
                    Y:         [ ],
                    L:         [ { c: k.VK_F12.c | k.SHIFT, n: [ "Shift", "F12" ] } ],
                    R:         [ k.VK_F12 ],
                    BACK:      [ k.VK_ESCAPE ],
                    START:     [ { c: k.VK_P.c | k.ALT, n: [ "Alt", "P" ] } ]
                },
                settings: {
                    device:    -1,  // -1 = auto
                    xAxis:     0,
                    xAxisSig:  1,
                    yAxis:     1,
                    yAxisSig:  1,
                    deadzone:  0.3
                }
            }
        ],

        joykeys: [
            {
                buttons: {
                    UP:        [ k.VK_UP, k.VK_NUM_UP ],
                    DOWN:      [ k.VK_DOWN, k.VK_NUM_DOWN ],
                    LEFT:      [ k.VK_LEFT, k.VK_NUM_LEFT ],
                    RIGHT:     [ k.VK_RIGHT, k.VK_NUM_RIGHT ],
                    A:         [ k.VK_SPACE, k.VK_LSHIFT, k.VK_INSERT ],
                    B:         [ k.VK_LALT, k.VK_LCONTROL, k.VK_DELETE, k.VK_M ]
                }
            },
            {
                buttons: {
                    UP:        [ k.VK_T ],
                    DOWN:      [ k.VK_G ],
                    LEFT:      [ k.VK_F ],
                    RIGHT:     [ k.VK_H ],
                    A:         [ k.VK_A ],
                    B:         [ k.VK_Z ]
                }
            }
        ],

        touch: {
            buttons: {
                TB_1:      [ "A" ],
                TB_2:      [ "B" ],
                TB_3:      [ "A", "B" ],
                TB_4:      [ ]
            },
            directional:   "JOYSTICK"       // JOYSTICK, KEYBOARD
        }
    };
};

WMSX.userPreferences.load = function() {
    try {
        WMSX.userPreferences.current = JSON.parse(localStorage.wmsxprefs || "{}");
    } catch(e) {
        WMSX.userPreferences.current = {};
    }
    var defs = WMSX.userPreferences.defaults();
    for (var pref in defs)
        if (!WMSX.userPreferences.current[pref]) WMSX.userPreferences.current[pref] = defs[pref];
};

WMSX.userPreferences.save = function() {
    if (!WMSX.userPreferences.isDirty) return;

    try {
        WMSX.userPreferences.current.version = WMSX.VERSION;
        localStorage.wmsxprefs = JSON.stringify(WMSX.userPreferences.current);
        delete WMSX.userPreferences.isDirty;

        wmsx.Util.log("Preferences saved!");
    } catch (e) {
        // give up
    }
};

WMSX.userPreferences.setDirty = function() {
    WMSX.userPreferences.isDirty = true;
};
