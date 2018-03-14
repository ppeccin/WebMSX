// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Configurator = {

    applyConfig: function() {

        var urlParams = {};

        // Override parameters with values set in URL, if allowed
        if (WMSX.ALLOW_URL_PARAMETERS) {
            urlParams = parseURLParams();
            // First override base MACHINE and PRESETS parameters
            if (urlParams.MACHINE) { this.applyParam("MACHINE", urlParams.MACHINE); delete urlParams.MACHINE }
            if (urlParams.PRESETS) { this.applyParam("PRESETS", urlParams.PRESETS); delete urlParams.PRESETS }
        }

        // Apply main Machine configuration
        WMSX.MACHINE = (WMSX.MACHINE || "").trim().toUpperCase();
        if (WMSX.MACHINE && !WMSX.MACHINES_CONFIG[WMSX.MACHINE]) return wmsx.Util.message("Invalid Machine: " + WMSX.MACHINE);
        if (!WMSX.MACHINES_CONFIG[WMSX.MACHINE] || WMSX.MACHINES_CONFIG[WMSX.MACHINE].autoType) WMSX.MACHINE = this.detectDefaultMachine();
        this.applyPresets(WMSX.MACHINES_CONFIG[WMSX.MACHINE].presets);

        // Apply additional presets
        this.applyPresets(WMSX.PRESETS);

        // Apply additional single parameter overrides
        for (var param in urlParams) this.applyParam(param, urlParams[param]);

        // Ensure the correct types of the parameters
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

        function normalizeParameterTypes() {
            WMSX.RAMMAPPER_SIZE |= 0;
            WMSX.AUTO_POWER_ON_DELAY |= 0;
            WMSX.MEDIA_CHANGE_DISABLED = WMSX.MEDIA_CHANGE_DISABLED === true || WMSX.MEDIA_CHANGE_DISABLED == "true";
            WMSX.SCREEN_RESIZE_DISABLED = WMSX.SCREEN_RESIZE_DISABLED === true || WMSX.SCREEN_RESIZE_DISABLED == "true";
            WMSX.SCREEN_FULLSCREEN_MODE = WMSX.SCREEN_FULLSCREEN_MODE |= 0;
            WMSX.SCREEN_FILTER_MODE |= 0;
            WMSX.SCREEN_CRT_MODE |= 0;
            WMSX.SCREEN_DEFAULT_SCALE = parseFloat(WMSX.SCREEN_DEFAULT_SCALE);
            WMSX.SCREEN_DEFAULT_ASPECT = parseFloat(WMSX.SCREEN_DEFAULT_ASPECT);
            WMSX.SCREEN_CONTROL_BAR |= 0;
            WMSX.SCREEN_MSX1_COLOR_MODE |= 0;
            WMSX.SCREEN_FORCE_HOST_NATIVE_FPS |= 0;
            WMSX.SCREEN_VSYNCH_MODE |= 0;
            WMSX.AUDIO_MONITOR_BUFFER_BASE |= 0;
            WMSX.AUDIO_MONITOR_BUFFER_SIZE |= 0;
            WMSX.AUDIO_SIGNAL_BUFFER_RATIO = parseFloat(WMSX.AUDIO_SIGNAL_BUFFER_RATIO);
            WMSX.AUDIO_SIGNAL_ADD_FRAMES |= 0;
            WMSX.CPU_TURBO_MODE |= 0;
            WMSX.VDP_TURBO_MODE |= 0;
            WMSX.CPU_SOFT_TURBO_MULTI |= 0;
            WMSX.VDP_SOFT_TURBO_MULTI |= 0;
            WMSX.DEBUG_MODE |= 0;
            WMSX.SPRITES_DEBUG_MODE |= 0;
        }
    },

    applyPresets: function(presetList, silent) {
        var presetNames = (presetList || "").trim().toUpperCase().split(",");
        // Apply list in order
        for (var i = 0; i < presetNames.length; i++)
            this.applyPreset(presetNames[i].trim(), silent);
    },

    applyPreset: function(presetName, silent) {
        if (!presetName) return;
        var presetPars = WMSX.PRESETS_CONFIG[presetName];
        if (presetPars) {
            if (!silent) wmsx.Util.log("Applying preset: " + presetName);
            for (var par in presetPars) {
                var parName = par.trim().toUpperCase();
                if (parName[0] !== "_") this.applyParam(parName, presetPars[par]);              // Normal Parameter to set
                else if (parName === "_INCLUDE") this.applyPresets(presetPars[par], true);      // Preset to include, silent
            }
        } else
            wmsx.Util.warning("Preset \"" + presetName + "\" not found, skipping...");
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

    slotURLSpecs: function() {
        var urlSpecs = [];

        // BIOS AND BIOS Extension URLs
        if (WMSX.BIOS_URL) addSpec(WMSX.BIOS_URL, WMSX.BIOS_SLOT);
        if (WMSX.BIOSEXT_URL) addSpec(WMSX.BIOSEXT_URL, WMSX.BIOSEXT_SLOT);

        // Any URL specified in the format SLOT_N_N_URL
        for (var key in WMSX) {
            if (wmsx.Util.stringStartsWith(key, "SLOT") && wmsx.Util.stringEndsWith(key, "URL")) {
                var nums = key.match(/[0-9]+/g);
                if (nums) {
                    var pos = nums.map(function(strNum) { return strNum | 0; });
                    addSpec(WMSX[key], pos);
                }
            }
        }

        function addSpec(url, pos) {
            urlSpecs[urlSpecs.length] = {
                url: url,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContentAsSlot(res.url, res.content, pos, true, true);      // internal
                }
            };
        }

        return urlSpecs;
    },

    mediaURLSpecs: function() {
        // URLs specified by fixed media loading parameters
        var OPEN_TYPE = wmsx.FileLoader.OPEN_TYPE;
        return [
            WMSX.AUTODETECT_URL && {
                url: WMSX.AUTODETECT_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.AUTO, 0, true);
                }
            },
            WMSX.CARTRIDGE1_URL && {
                url: WMSX.CARTRIDGE1_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.ROM, 0, true, false, WMSX.CARTRIDGE1_FORMAT);
                }
            },
            WMSX.CARTRIDGE2_URL && {
                url: WMSX.CARTRIDGE2_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.ROM, 1, true, false, WMSX.CARTRIDGE2_FORMAT);
                }
            },
            WMSX.DISKA_URL && {
                url: WMSX.DISKA_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.DISK, 0, true);
                }
            },
            (!WMSX.DISKA_URL && WMSX.DISKA_FILES_URL) ? {
                url: WMSX.DISKA_FILES_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.AUTO_AS_DISK, 0, true);
                }
            } : null,
            WMSX.DISKB_URL && {
                url: WMSX.DISKB_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.DISK, 1, true);
                }
            },
            (!WMSX.DISKB_URL && WMSX.DISKB_FILES_URL) ? {
                url: WMSX.DISKB_FILES_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.AUTO_AS_DISK, 1, true);
                }
            } : null,
            WMSX.HARDDISK_URL && {    // TODO Test
                url: WMSX.HARDDISK_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.DISK, 2, true);
                }
            },
            (!WMSX.HARDDISK_URL && WMSX.HARDDISK_FILES_URL) ? {
                url: WMSX.HARDDISK_FILES_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.AUTO_AS_DISK, 2, true);
                }
            } : null,
            WMSX.TAPE_URL && {
                url: WMSX.TAPE_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.TAPE, 0, true);
                }
            }
        ];
    },

    extensionsInitialURLSpecs: function() {
        return WMSX.room.machine.getExtensionsSocket().getInitialLoaderURLSpecs();
    },

    detectDefaultMachine: function() {
        var type = (WMSX.MACHINES_CONFIG[WMSX.MACHINE] && WMSX.MACHINES_CONFIG[WMSX.MACHINE].autoType) || 3;

        var lang = wmsx.Util.userLanguage();
        var langSuffix = "A";                                 // Default American machine
        if (lang.indexOf("ja") === 0) langSuffix = "J";       // Japanese machine
                                                              // TODO Detect other countries/locations?
        var typePreffix;
        switch (type) {
            case 3: typePreffix = "MSX2P"; break;
            case 2: typePreffix = "MSX2"; break;
            case 1: typePreffix = "MSX1"; break;
        }

        var machine = typePreffix + langSuffix;

        wmsx.Util.log("Machine auto-detection: " + machine);
        return machine;
    },

    abbreviations: {
        P: "PRESETS",
        M: "MACHINE",
        PRESET: "PRESETS",
        ROM: "CARTRIDGE1_URL",
        CART: "CARTRIDGE1_URL",
        CART1: "CARTRIDGE1_URL",
        CART2: "CARTRIDGE2_URL",
        ROM_FORMAT: "CARTRIDGE1_FORMAT",
        CART_FORMAT: "CARTRIDGE1_FORMAT",
        CART1_FORMAT: "CARTRIDGE1_FORMAT",
        CART2_FORMAT: "CARTRIDGE2_FORMAT",
        DISK: "DISKA_URL",
        DISK_FILES: "DISKA_FILES_URL",
        DISKA: "DISKA_URL",
        DISKB: "DISKB_URL",
        DISKA_FILES: "DISKA_FILES_URL",
        DISKB_FILES: "DISKB_FILES_URL",
        TAPE: "TAPE_URL",
        ANY: "AUTODETECT_URL",
        AUTO: "AUTODETECT_URL",
        AUTODETECT: "AUTODETECT_URL",
        STATE: "STATE_URL",
        SAVESTATE: "STATE_URL",
        JOIN: "NETPLAY_JOIN",
        NICK: "NETPLAY_NICK",
        JOYKEYS: "JOYKEYS_MODE",
        VERSION: "VERSION_CHANGE_ATTEMPTED"      // Does not allow version to be changed ;-)
    }

};
