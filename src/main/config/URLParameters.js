// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.URLParameters = {

    apply: function() {
        var params = this.parseURLParams();

        // First use all parameters from chosen preset
        if (params.PRESET !== undefined) WMSX.PRESET = params.PRESET;
        WMSX.presets.apply();

        // Then replace parameters for values passed in URL
        for (var param in params)
            if (WMSX[param] !== undefined) WMSX[param] = params[param];
    },

    parseURLParams: function() {
        if (this.parameters) return this.parameters;

        var search = (window.location.search || "").split('+').join(' ');
        var reg = /[?&]?([^=]+)=([^&]*)/g;
        var tokens;

        this.parameters = {};
        while (tokens = reg.exec(search)) {
            var parName = decodeURIComponent(tokens[1]).trim().toUpperCase();
            parName = this.abbreviations[parName] || parName;
            var parValue = decodeURIComponent(tokens[2]).trim();
            this.parameters[parName] = parValue;
        }

        return this.parameters;
    },

    abbreviations: {
        BIOS: "BIOS_URL",
        EXP: "EXPANSION0_URL",
        EXP0: "EXPANSION0_URL",
        EXP1: "EXPANSION1_URL",
        EXP2: "EXPANSION2_URL",
        ROM: "CARTRIDGE1_URL",
        CART: "CARTRIDGE1_URL",
        CART1: "CARTRIDGE1_URL",
        CART2: "CARTRIDGE2_URL",
        DISK: "DISKA_URL",
        DISKA: "DISKA_URL",
        DISKB: "DISKB_URL",
        TAPE: "TAPE_URL",
        STATE: "STATE_LOAD_URL",
        SAVESTATE: "STATE_LOAD_URL",
        VERSION: "VERSION_CHANGE_ATTEMPTED"      // Does not allow version to be changed ;-)
    }

};
