// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Configurator = {

    applyConfig: function() {
        var params = parseURLParams();

        // First use all parameters from chosen presets
        if (params.PRESETS) WMSX.PRESETS += (WMSX.PRESETS ? ", " : "") + params.PRESETS;
        if (!machineSpecified(WMSX.PRESETS)) WMSX.PRESETS = "DEFAULT, " + WMSX.PRESETS;
        this.applyPresets(WMSX.PRESETS);

        // Then override specific parameters with values set in URL
        for (var param in params) this.applyParam(param, params[param]);

        // Ensures the correct types of the parameters
        normalizeParameterTypes();

        function parseURLParams() {
            var search = (window.location.search || "").split('+').join(' ');
            var reg = /[?&]?([^=]+)=([^&]*)/g;
            var tokens;
            var parameters = {};
            while (tokens = reg.exec(search)) {
                var parName = decodeURIComponent(tokens[1]).trim().toUpperCase();
                parName = wmsx.Configurator.abbreviations[parName] || parName;
                parameters[parName] = decodeURIComponent(tokens[2]).trim();
            }
            return parameters;
        }

        function machineSpecified(presetList) {
            var presetNames = (presetList || "").trim().toUpperCase().split(",");
            for (var i = 0; i < presetNames.length; ++i) {
                var presetPars = WMSX.presets[presetNames[i]];
                if (presetPars) {
                    for (var par in presetPars) {
                        var parName = par.trim().toUpperCase();
                        if (parName === "MACHINE_TYPE") return true;
                        else if (parName === "_INCLUDE") if (machineSpecified(presetPars[par])) return true;
                    }
                }
            }
            return false;
        }

        function normalizeParameterTypes() {
            WMSX.MACHINE_TYPE = WMSX.MACHINE_TYPE | 0;
            WMSX.RAMMAPPER_SIZE = WMSX.RAMMAPPER_SIZE | 0;
            WMSX.AUTO_START_DELAY = WMSX.AUTO_START_DELAY | 0;
            WMSX.MEDIA_CHANGE_DISABLED = WMSX.MEDIA_CHANGE_DISABLED === true || WMSX.MEDIA_CHANGE_DISABLED == "true";
            WMSX.SCREEN_RESIZE_DISABLED = WMSX.SCREEN_RESIZE_DISABLED === true || WMSX.SCREEN_RESIZE_DISABLED == "true";
            WMSX.SCREEN_FULLSCREEN_DISABLED = WMSX.SCREEN_FULLSCREEN_DISABLED === true || WMSX.SCREEN_FULLSCREEN_DISABLED == "true";
            WMSX.SCREEN_FILTER_MODE = WMSX.SCREEN_FILTER_MODE | 0;
            WMSX.SCREEN_CRT_MODE = WMSX.SCREEN_CRT_MODE | 0;
            WMSX.SCREEN_DEFAULT_SCALE = parseFloat(WMSX.SCREEN_DEFAULT_SCALE);
            WMSX.SCREEN_DEFAULT_ASPECT = parseFloat(WMSX.SCREEN_DEFAULT_ASPECT);
            WMSX.SCREEN_CONTROL_BAR = WMSX.SCREEN_CONTROL_BAR | 0;
            WMSX.SCREEN_MSX1_COLOR_MODE = WMSX.SCREEN_MSX1_COLOR_MODE | 0;
            WMSX.SCREEN_FORCE_HOST_NATIVE_FPS = WMSX.SCREEN_FORCE_HOST_NATIVE_FPS | 0;
            WMSX.SCREEN_VSYNCH_MODE = WMSX.SCREEN_VSYNCH_MODE | 0;
            WMSX.AUDIO_BUFFER_SIZE = WMSX.AUDIO_BUFFER_SIZE | 0;
        }
    },

    applyPresets: function(presetList) {
        var presetNames = (presetList || "").trim().toUpperCase().split(",");
        // Apply list in order
        for (var i = 0; i < presetNames.length; i++)
            this.applyPreset(presetNames[i].trim());
    },

    applyPreset: function(presetName) {
        if (!presetName) return;
        var presetPars = WMSX.presets[presetName];
        if (presetPars) {
            wmsx.Util.log("Applying preset: " + presetName);
            for (var par in presetPars) {
                var parName = par.trim().toUpperCase();
                if (parName[0] !== "_") this.applyParam(parName, presetPars[par]);      // Normal Parameter to set
                else if (parName === "_INCLUDE") this.applyPresets(presetPars[par]);    // Preset to include
            }
        } else
            wmsx.Util.log("Preset \"" + presetName + "\" not found, skipping...");
    },

    applyParam: function(name, value) {
        if (name.indexOf(".") < 0)
            WMSX[name] = value;
        else {
            var obj = WMSX;
            var parts = name.split('.');
            for (var p = 0; p < parts.length - 1; ++p) {
                obj = obj[parts[p]];
            }
            obj[parts[parts.length - 1]] = value;
        }
    },

    abbreviations: {
        P: "PRESETS",
        M: "PRESETS",
        PRESET: "PRESETS",
        TYPE: "MACHINE_TYPE",
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
