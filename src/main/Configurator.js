// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Configurator = {

    applyConfig: function() {
        var params = parseURLParams();

        // First use all parameters from chosen presets
        WMSX.PRESETS = params.PRESETS || WMSX.PRESETS;
        this.applyPresets();

        // Then replace parameters for values passed in URL
        for (var param in params)
            if (WMSX[param] !== undefined) WMSX[param] = params[param];

        // Ensures the correct types of the parameters
        normalizeParameters();


        function parseURLParams() {
            if (this.parameters) return this.parameters;

            var search = (window.location.search || "").split('+').join(' ');
            var reg = /[?&]?([^=]+)=([^&]*)/g;
            var tokens;

            this.parameters = {};
            while (tokens = reg.exec(search)) {
                var parName = decodeURIComponent(tokens[1]).trim().toUpperCase();
                parName = wmsx.Configurator.abbreviations[parName] || parName;
                this.parameters[parName] = decodeURIComponent(tokens[2]).trim();
            }

            return this.parameters;
        }

        function normalizeParameters() {
            WMSX.MACHINE_TYPE = WMSX.MACHINE_TYPE | 0;
            WMSX.RAM_SIZE = WMSX.RAM_SIZE | 0;
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
            WMSX.RAM_SLOT = WMSX.RAM_SLOT | 0;
            WMSX.AUDIO_BUFFER_SIZE = WMSX.AUDIO_BUFFER_SIZE | 0;
        }
    },

    applyPresets: function() {
        var finalPresets = [];
        // Collect final list of Presets to apply
        visitPresets("DEFAULT, " + (WMSX.PRESETS || ""), finalPresets, true);
        // Apply list
        for (var i = 0; i < finalPresets.length; i++)
            applyPreset(finalPresets[i]);


        function visitPresets(presetsString, finalPresets, include) {
            var presetNames = (presetsString || "").trim().toUpperCase().split(",");
            for (var i = 0; i < presetNames.length; i++) {
                var presetName = presetNames[i].trim();
                if (!presetName) continue;
                var presetPars = WMSX.presets[presetName];
                if (presetPars) {
                    for (var par in presetPars) {
                        var parName = par.trim().toUpperCase();
                        // Update final preset collection
                        if (include) wmsx.Util.arrayIfAbsentAdd(finalPresets, presetName);
                        else wmsx.Util.arrayRemoveAllElement(finalPresets, presetName);
                        // Include or Exclude Presets referenced by _INCLUDE / _EXCLUDE
                        if (parName === "_INCLUDE")
                            visitPresets(presetPars[parName], finalPresets, include);
                        else if (parName === "_EXCLUDE")
                            visitPresets(presetPars[parName], finalPresets, !include);
                    }
                } else {
                    wmsx.Util.log("Preset \"" + presetName + "\" not found, skipping...");
                }
            }
        }

        function applyPreset(presetName) {
            var presetPars = WMSX.presets[presetName];
            if (presetPars) {
                wmsx.Util.log("Applying preset: " + presetName);
                for (var par in presetPars) {
                    var parName = par.trim().toUpperCase();
                    if (parName[0] !== "_") WMSX[parName] = presetPars[par];              // Normal Parameter to set
                }
            }
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
