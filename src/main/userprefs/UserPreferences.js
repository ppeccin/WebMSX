// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.userPreferences = {};

(function(p) {
    "use strict";

    var g = wmsx.GamepadButtons;
    var k = wmsx.DOMKeys;

    p.joysticks = [
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
                L:         [ g.JB_L2 ],
                R:         [ g.JB_R2 ],
                BACK:      [ g.JB_BACK ],
                START:     [ g.JB_START ]
            },
            virtualButtonsKeys: {
                X:         null,
                Y:         null,
                L:         { c: k.VK_F12.c | k.SHIFT, n: [ "Shift", "F12" ] },
                R:         k.VK_F12,
                BACK:      k.VK_ESCAPE,
                START:     { c: k.VK_P.c | k.ALT, n: [ "Alt", "P" ] }
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
                L:         [ g.JB_L2 ],
                R:         [ g.JB_R2 ],
                BACK:      [ g.JB_BACK ],
                START:     [ g.JB_START ]
            },
            virtualButtonsKeys: {
                X:         null,
                Y:         null,
                L:         { c: k.VK_F12.c | k.SHIFT, n: [ "Shift", "F12" ] },
                R:         k.VK_F12,
                BACK:      k.VK_ESCAPE,
                START:     { c: k.VK_P.c | k.ALT, n: [ "Alt", "P" ] }
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
    ];

    p.joykeys = [
        {
            buttons: {
                UP:        [ k.VK_UP, k.VK_NUM_UP ],
                DOWN:      [ k.VK_DOWN, k.VK_NUM_DOWN ],
                LEFT:      [ k.VK_LEFT, k.VK_NUM_LEFT ],
                RIGHT:     [ k.VK_RIGHT, k.VK_NUM_RIGHT ],
                A:         [ k.VK_SPACE, k.VK_INSERT ],
                B:         [ k.VK_LALT, k.VK_DELETE, k.VK_M ]
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
    ];

})(WMSX.userPreferences);

WMSX.userPreferences.loadDefaults = function() {
    for (var pref in WMSX.userPreferences.defaults)
        WMSX.userPreferences[pref] = WMSX.userPreferences.defaults[pref];
};

WMSX.userPreferences.load = function() {
    try {
        WMSX.userPreferences.loadDefaults();
        var loaded = JSON.parse(localStorage.msxprefs || "{}");
        for (var pref in WMSX.userPreferences.defaults)
            if (loaded[pref]) WMSX.userPreferences[pref] = loaded[pref];
    } catch(e) {
        // giveup
    }
};

WMSX.userPreferences.save = function() {
    try {
        localStorage.msxprefs = JSON.stringify(WMSX.userPreferences);
    } catch (e) {
        // giveup
    }
};


