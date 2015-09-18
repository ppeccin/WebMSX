// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.preferences = {};

WMSX.preferences.defaults = {
    JP1DEVICE   : -1,  // -1 = auto
    JP1XAXIS    : 0,
    JP1XAXISSIG : 1,
    JP1YAXIS    : 1,
    JP1YAXISSIG : 1,
    JP1PAXIS    : 0,
    JP1PAXISSIG : 1,
    JP1BUT1     : 0,
    JP1BUT2     : 1,
    JP1PAUSE    : 8,
    JP1FAST     : 7,
    JP1SLOW     : 6,
    JP1DEADZONE : 0.3,
    JP1PCENTER  : 0.3,
    JP1PSENS    : 0.75,

    JP2DEVICE   : -1,  // -1 = auto
    JP2XAXIS    : 0,
    JP2XAXISSIG : 1,
    JP2YAXIS    : 1,
    JP2YAXISSIG : 1,
    JP2PAXIS    : 0,
    JP2PAXISSIG : 1,
    JP2BUT1     : 0,
    JP2BUT2     : 1,
    JP2PAUSE    : 8,
    JP2FAST     : 7,
    JP2SLOW     : 6,
    JP2DEADZONE : 0.3,
    JP2PCENTER  : 0.3,
    JP2PSENS    : 0.75
};

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


