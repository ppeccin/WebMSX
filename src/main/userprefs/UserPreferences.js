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
                X:         [ g.JB_3 ],
                Y:         [ g.JB_4 ],
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
            prefs: {
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
                A:         [ g.JB_1 ],
                B:         [ g.JB_2 ],
                X:         [ g.JB_3 ],
                Y:         [ g.JB_4 ],
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
            prefs: {
                device:    -1,  // -1 = auto
                xAxis:     0,
                xAxisSig:  1,
                yAxis:     1,
                yAxisSig:  1,
                deadzone:  0.3
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


