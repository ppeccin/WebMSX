// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.preferences = {};

WMSX.preferences.defaults = {};

WMSX.preferences.loadDefaults = function() {
    for (var pref in WMSX.preferences.defaults)
        WMSX.preferences[pref] = WMSX.preferences.defaults[pref];
};

WMSX.preferences.load = function() {
    try {
        WMSX.preferences.loadDefaults();
        var loaded = JSON.parse(localStorage.msxprefs || "{}");
        for (var pref in WMSX.preferences.defaults)
            if (loaded[pref]) WMSX.preferences[pref] = loaded[pref];
    } catch(e) {
        // giveup
    }
};

WMSX.preferences.save = function() {
    try {
        localStorage.msxprefs = JSON.stringify(WMSX.preferences);
    } catch (e) {
        // giveup
    }
};


