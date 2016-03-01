// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.URLParameters = {

    apply: function() {
        var params = this.parseURLParams();

        // First use all parameters from chosen presets
        WMSX.PRESETS = params.PRESETS || WMSX.PRESETS;
        WMSX.presets.apply();

        // Then replace parameters for values passed in URL
        for (var param in params)
            if (WMSX[param] !== undefined) WMSX[param] = params[param];

        this.normalizeParameters();
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
            this.parameters[parName] = decodeURIComponent(tokens[2]).trim();
        }

        return this.parameters;
    },

    abbreviations: {
        TYPE: "MACHINE_TYPE",
        RAM: "RAM_MAPPER_SIZE",
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
        PRESET: "PRESETS",
        VERSION: "VERSION_CHANGE_ATTEMPTED"      // Does not allow version to be changed ;-)
    },

    normalizeParameters: function () {
        WMSX.MACHINE_TYPE = WMSX.MACHINE_TYPE | 0;
        WMSX.RAM_MAPPER_SIZE = WMSX.RAM_MAPPER_SIZE | 0;
        WMSX.AUTO_START_DELAY = WMSX.AUTO_START_DELAY | 0;
        WMSX.MEDIA_CHANGE_DISABLED = WMSX.MEDIA_CHANGE_DISABLED === true || WMSX.MEDIA_CHANGE_DISABLED == "true";
        WMSX.SCREEN_RESIZE_DISABLED = WMSX.SCREEN_RESIZE_DISABLED === true || WMSX.SCREEN_RESIZE_DISABLED == "true";
        WMSX.SCREEN_FULLSCREEN_DISABLED = WMSX.SCREEN_FULLSCREEN_DISABLED === true || WMSX.SCREEN_FULLSCREEN_DISABLED == "true";
        WMSX.SCREEN_FILTER_MODE = WMSX.SCREEN_FILTER_MODE | 0;
        WMSX.SCREEN_CRT_MODE = WMSX.SCREEN_CRT_MODE | 0;
        WMSX.SCREEN_DEFAULT_SCALE = parseFloat(WMSX.SCREEN_DEFAULT_SCALE);
        WMSX.SCREEN_CONTROL_BAR = WMSX.SCREEN_CONTROL_BAR | 0;
        WMSX.SCREEN_MSX1_COLOR_MODE = WMSX.SCREEN_MSX1_COLOR_MODE | 0;
        WMSX.SCREEN_FORCE_HOST_NATIVE_FPS = WMSX.SCREEN_FORCE_HOST_NATIVE_FPS | 0;
        WMSX.SCREEN_VSYNCH_MODE = WMSX.SCREEN_VSYNCH_MODE | 0;
        WMSX.RAM_SLOT = WMSX.RAM_SLOT | 0;
        WMSX.AUDIO_BUFFER_SIZE = WMSX.AUDIO_BUFFER_SIZE | 0;
    }

};
