// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

MSX.preferences = {};

MSX.preferences.defaults = {
};

MSX.preferences.loadDefaults = function() {
    for (var pref in MSX.preferences.defaults)
        MSX.preferences[pref] = MSX.preferences.defaults[pref];
};

MSX.preferences.load = function() {
    try {
        MSX.preferences.loadDefaults();
        var loaded = JSON.parse(localStorage.msxprefs || "{}");
        for (var pref in MSX.preferences.defaults)
            if (loaded[pref]) MSX.preferences[pref] = loaded[pref];
    } catch(e) {
        // giveup
    }
};

MSX.preferences.save = function() {
    try {
        localStorage.msxprefs = JSON.stringify(MSX.preferences);
    } catch (e) {
        // giveup
    }
};


