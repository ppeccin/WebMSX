// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.userPreferences = { };

WMSX.userPreferences.compatibleVersions = new Set([ 0, 1 ]);

WMSX.userPreferences.defaults = function() {
"use strict";

    var m = wmsx.KeyboardKeys;
    var j = wmsx.JoystickButtons;

    var k = wmsx.DOMKeys;
    var g = wmsx.GamepadButtons;

    return {

        prefsVersion: 1,

        keyboard: undefined,        // auto
        customKeyboards: { },

        joysticks: [
            {
                buttons: {
                    UP:        [ g.GB_UP ],
                    DOWN:      [ g.GB_DOWN ],
                    LEFT:      [ g.GB_LEFT ],
                    RIGHT:     [ g.GB_RIGHT ],
                    A:         [ g.GB_1, g.GB_3 ],
                    B:         [ g.GB_2, g.GB_3 ],
                    X:         [ ],
                    Y:         [ ],
                    L:         [ g.GB_L1, g.GB_L2 ],
                    R:         [ g.GB_R1, g.GB_R2 ],
                    BACK:      [ g.GB_BACK ],
                    START:     [ g.GB_START ]
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
                    UP:        [ g.GB_UP ],
                    DOWN:      [ g.GB_DOWN ],
                    LEFT:      [ g.GB_LEFT ],
                    RIGHT:     [ g.GB_RIGHT ],
                    A:         [ g.GB_1, g.GB_3 ],
                    B:         [ g.GB_2, g.GB_3 ],
                    X:         [ ],
                    Y:         [ ],
                    L:         [ g.GB_L1, g.GB_L2 ],
                    R:         [ g.GB_R1, g.GB_R2 ],
                    BACK:      [ g.GB_BACK ],
                    START:     [ g.GB_START ]
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
            directional: "JOYSTICK",       // JOYSTICK, KEYBOARD
            buttons: {
                T_A: j.A,
                T_B: j.B,
                T_C: j.AB,
                T_D: m.ESCAPE,
                T_E: m.ENTER,
                T_F: m.F1,
                T_G: m.SPACE
            }
        }
    };
};

WMSX.userPreferences.load = function() {
    // Load from Local Storage
    try {
        WMSX.userPreferences.current = JSON.parse(localStorage.wmsxprefs || "{}");
        // Migrations
        if (WMSX.userPreferences.current.version) delete WMSX.userPreferences.current.version;
        if (!WMSX.userPreferences.current.prefsVersion) WMSX.userPreferences.current.prefsVersion = 0;
    } catch(e) {
        // Give up
    }

    // Absent or incompatible version
    if (!WMSX.userPreferences.current || !WMSX.userPreferences.compatibleVersions.has(WMSX.userPreferences.current.prefsVersion))
        WMSX.userPreferences.current = {};

    // Fill missing properties
    var defs = WMSX.userPreferences.defaults();
    for (var pref in defs)
        if (!WMSX.userPreferences.current[pref]) WMSX.userPreferences.current[pref] = defs[pref];
};

WMSX.userPreferences.save = function() {
    if (!WMSX.userPreferences.isDirty) return;

    try {
        WMSX.userPreferences.current.wmsxVersion = WMSX.VERSION;
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
