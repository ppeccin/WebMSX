// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.userPreferences = { };

WMSX.userPreferences.currentVersion = 1;
WMSX.userPreferences.compatibleVersions = new Set([ 1 ]);

WMSX.userPreferences.defaults = function() {
"use strict";

    var m = wmsx.KeyboardKeys;
    var j = wmsx.JoystickButtons;

    var k = wmsx.DOMKeys;
    var g = wmsx.GamepadButtons;

    return {

        keyboard: undefined,        // auto
        customKeyboards: { },

        joysticks: [
            {
                buttons: {
                    J_UP:        [ g.GB_UP ],
                    J_DOWN:      [ g.GB_DOWN ],
                    J_LEFT:      [ g.GB_LEFT ],
                    J_RIGHT:     [ g.GB_RIGHT ],
                    J_A:         [ g.GB_1, g.GB_3 ],
                    J_B:         [ g.GB_2, g.GB_3 ],
                    J_X:         [ ],
                    J_Y:         [ ],
                    J_L:         [ g.GB_L1, g.GB_L2 ],
                    J_R:         [ g.GB_R1, g.GB_R2 ],
                    J_BACK:      [ g.GB_BACK ],
                    J_START:     [ g.GB_START ]
                },
                virtualButtonsKeys: {
                    J_X:         [ ],
                    J_Y:         [ ],
                    J_L:         [ { c: k.VK_F12.c | k.SHIFT, n: [ "Shift", "F12" ] } ],
                    J_R:         [ k.VK_F12 ],
                    J_BACK:      [ k.VK_ESCAPE ],
                    J_START:     [ { c: k.VK_P.c | k.ALT, n: [ "Alt", "P" ] } ]
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
                    J_UP:        [ g.GB_UP ],
                    J_DOWN:      [ g.GB_DOWN ],
                    J_LEFT:      [ g.GB_LEFT ],
                    J_RIGHT:     [ g.GB_RIGHT ],
                    J_A:         [ g.GB_1, g.GB_3 ],
                    J_B:         [ g.GB_2, g.GB_3 ],
                    J_X:         [ ],
                    J_Y:         [ ],
                    J_L:         [ g.GB_L1, g.GB_L2 ],
                    J_R:         [ g.GB_R1, g.GB_R2 ],
                    J_BACK:      [ g.GB_BACK ],
                    J_START:     [ g.GB_START ]
                },
                virtualButtonsKeys: {
                    J_X:         [ ],
                    J_Y:         [ ],
                    J_L:         [ { c: k.VK_F12.c | k.SHIFT, n: [ "Shift", "F12" ] } ],
                    J_R:         [ k.VK_F12 ],
                    J_BACK:      [ k.VK_ESCAPE ],
                    J_START:     [ { c: k.VK_P.c | k.ALT, n: [ "Alt", "P" ] } ]
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
                    J_UP:        [ k.VK_UP, k.VK_NUM_UP ],
                    J_DOWN:      [ k.VK_DOWN, k.VK_NUM_DOWN ],
                    J_LEFT:      [ k.VK_LEFT, k.VK_NUM_LEFT ],
                    J_RIGHT:     [ k.VK_RIGHT, k.VK_NUM_RIGHT ],
                    J_A:         [ k.VK_SPACE, k.VK_LSHIFT, k.VK_INSERT ],
                    J_B:         [ k.VK_LALT, k.VK_LCONTROL, k.VK_DELETE, k.VK_M ]
                }
            },
            {
                buttons: {
                    J_UP:        [ k.VK_T ],
                    J_DOWN:      [ k.VK_G ],
                    J_LEFT:      [ k.VK_F ],
                    J_RIGHT:     [ k.VK_H ],
                    J_A:         [ k.VK_A ],
                    J_B:         [ k.VK_Z ]
                }
            }
        ],

        touch: {
            directional: "JOYSTICK",       // JOYSTICK, KEYBOARD
            directionalBig: false,
            buttons: {
                T_A: j.J_A,
                T_B: j.J_B,
                T_C: j.J_AB,
                T_D: m.ESCAPE,
                T_E: m.SPACE,
                T_F: m.F1,
                T_G: m.ENTER
            }
        },

        hapticFeedback: true,

        audioBufferBase: -1,                // auto

        netPlaySessionName: "",
        netPlayNick: ""

    };
};

WMSX.userPreferences.load = function() {
    var prefs;

    // Load from Local Storage
    try {
        prefs = JSON.parse(localStorage.wmsxprefs || "{}");
        // Migrations from old to new version control fields
        if (prefs.version) delete prefs.version;
    } catch(e) {
        // Give up
    }

    // Absent or incompatible version
    if (!prefs || !WMSX.userPreferences.compatibleVersions.has(prefs.prefsVersion)) {
        // Create new empty preferences and keep settings as possible
        var oldPrefs = prefs;
        prefs = {};
        if (oldPrefs) {
            // Migration from version < 1 to version 1: Keep only keyboard settings
            prefs.keyboard = oldPrefs.keyboard;
            prefs.customKeyboards = oldPrefs.customKeyboards;
        }
    }

    // Fill missing properties with defaults
    var defs = WMSX.userPreferences.defaults();
    for (var pref in defs)
        if (prefs[pref] === undefined) prefs[pref] = defs[pref];

    // Update preferences version to current
    prefs.prefsVersion = WMSX.userPreferences.currentVersion;

    WMSX.userPreferences.current = prefs;
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
