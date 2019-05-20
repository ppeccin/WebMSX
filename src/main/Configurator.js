// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Configurator = {

    applyConfig: function() {

        var urlParams = {};

        // Override parameters with values set in URL, if allowed
        if (WMSX.ALLOW_URL_PARAMETERS) {
            urlParams = parseURLParams();
            // First override base MACHINE and PRESETS parameters
            if (urlParams.MACHINE) { this.applyParam("MACHINE", urlParams.MACHINE); delete urlParams.MACHINE; }
            if (urlParams.PRESETS) { this.applyParam("PRESETS", urlParams.PRESETS); delete urlParams.PRESETS; }
        }

        // Apply Alternate Slot Configuration first if asked
        this.applyAltConfigPreset();

        // Apply main Machine configuration
        WMSX.MACHINE = (WMSX.MACHINE || "").trim().toUpperCase();
        if (WMSX.MACHINE && !WMSX.MACHINES_CONFIG[WMSX.MACHINE]) return wmsx.Util.message("Invalid Machine: " + WMSX.MACHINE);
        if (!WMSX.MACHINES_CONFIG[WMSX.MACHINE] || WMSX.MACHINES_CONFIG[WMSX.MACHINE].autoType) WMSX.MACHINE = this.detectDefaultMachine();
        this.applyPresets(WMSX.MACHINES_CONFIG[WMSX.MACHINE].presets);

        // Apply additional presets over Machine configuration
        this.applyPresets(WMSX.PRESETS);

        // Apply additional single parameter overrides
        for (var param in urlParams) this.applyParam(param, urlParams[param]);

        // Ensure the correct types of the parameters
        normalizeParameterTypes();

        // Apply user asked page CSS
        if(WMSX.PAGE_BACK_CSS) document.body.style.background = WMSX.PAGE_BACK_CSS;

        // Auto activate HardDrive Extension if not active and user trying to load HardDisk file
        if ((WMSX.HARDDISK_URL || WMSX.HARDDISK_FILES_URL) && !WMSX.EXTENSIONS.HARDDISK) {
            WMSX.EXTENSIONS.HARDDISK = 1;
            if (WMSX.EXTENSIONS.DISK) WMSX.EXTENSIONS.DISK = 2;
        }

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
            // Numeric parameters
            WMSX.ENVIRONMENT |= 0;
            WMSX.RAMMAPPER_SIZE |= 0;
            WMSX.AUTO_POWER_ON_DELAY |= 0;
            WMSX.SCREEN_FULLSCREEN_MODE = WMSX.SCREEN_FULLSCREEN_MODE |= 0;
            WMSX.SCREEN_FILTER_MODE |= 0;
            WMSX.SCREEN_CRT_SCANLINES |= 0;
            WMSX.SCREEN_CRT_PHOSPHOR |= 0;
            WMSX.SCREEN_DEFAULT_SCALE = parseFloat(WMSX.SCREEN_DEFAULT_SCALE);
            WMSX.SCREEN_DEFAULT_ASPECT = parseFloat(WMSX.SCREEN_DEFAULT_ASPECT);
            WMSX.SCREEN_CONTROL_BAR |= 0;
            WMSX.SCREEN_MSX1_COLOR_MODE |= 0;
            WMSX.SCREEN_FORCE_HOST_NATIVE_FPS |= 0;
            WMSX.SCREEN_VSYNC_MODE |= 0;
            WMSX.AUDIO_MONITOR_BUFFER_BASE |= 0;
            WMSX.AUDIO_MONITOR_BUFFER_SIZE |= 0;
            WMSX.AUDIO_SIGNAL_BUFFER_RATIO = parseFloat(WMSX.AUDIO_SIGNAL_BUFFER_RATIO);
            WMSX.AUDIO_SIGNAL_ADD_FRAMES |= 0;
            var turboMulti = Number.parseFloat(WMSX.CPU_TURBO_MODE);
            WMSX.CPU_TURBO_MODE = isNaN(turboMulti) ? 0 : Number.parseFloat(turboMulti.toFixed(2));
            turboMulti = Number.parseFloat(WMSX.CPU_SOFT_TURBO_MULTI);
            WMSX.CPU_SOFT_TURBO_MULTI = isNaN(turboMulti) ? 2 : Number.parseFloat(turboMulti.toFixed(2));
            WMSX.VDP_TURBO_MODE |= 0;
            WMSX.VDP_SOFT_TURBO_MULTI |= 0;
            WMSX.DEBUG_MODE |= 0;
            WMSX.SPRITES_DEBUG_MODE |= 0;
            WMSX.BOOT_KEYS_FRAMES |= 0;
            WMSX.BOOT_DURATION_AUTO |= 0;
            WMSX.FAST_BOOT |= 0;
            WMSX.SPEED |= 0;
            WMSX.JOYSTICKS_MODE |= 0;
            WMSX.JOYKEYS_MODE |= 0;
            WMSX.MOUSE_MODE |= 0;
            WMSX.TOUCH_MODE |= 0;
            WMSX.VOL = Number(WMSX.VOL) || 1;
            WMSX.HARDDISK_MIN_SIZE_KB |= 0;
            WMSX.MEGARAM_SIZE |= 0;

            // Boolean parameters
            WMSX.MEDIA_CHANGE_DISABLED = WMSX.MEDIA_CHANGE_DISABLED === true || WMSX.MEDIA_CHANGE_DISABLED === "true";
            WMSX.SCREEN_RESIZE_DISABLED = WMSX.SCREEN_RESIZE_DISABLED === true || WMSX.SCREEN_RESIZE_DISABLED === "true";
            WMSX.LIGHT_STATES = WMSX.LIGHT_STATES === true || WMSX.LIGHT_STATES === "true";

            // Slot parameters (arrays with numbers)
            for (var p in WMSX) if (wmsx.Util.stringEndsWith(p, "_SLOT")) normalizeNumberArray(WMSX, p, WMSX[p]);
            for (var e in WMSX.EXTENSIONS_CONFIG)
                for (p in WMSX.EXTENSIONS_CONFIG[e]) if (wmsx.Util.stringEndsWith(p, "_SLOT")) normalizeNumberArray(WMSX.EXTENSIONS_CONFIG[e], p, WMSX.EXTENSIONS_CONFIG[e][p]);

            function normalizeNumberArray(obj, prop, value) {
                if (value.constructor === Array) return;
                var nums = ("" + value).match(/[0-9]/g);
                if (!nums) return;
                obj[prop] = nums.map(function(strNum) { return strNum | 0; });
            }
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
        var presetPars = WMSX.PRESETS_CONFIG[presetName] || WMSX.PRESETS_CONFIG[presetName.replace(/(.)_+/g, "$1")];       // Ignore any "_" except first one
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
            for (var p = 0; p < parts.length - 1; ++p) obj = obj && obj[parts[p]];
            if (obj) obj[parts[parts.length - 1]] = value;
        }
    },

    applyAltConfigPreset: function() {
        if ((WMSX.PRESETS || "").toUpperCase().indexOf("ALTSLOTCONFIG") < 0) return;
        this.applyPreset("ALTSLOTCONFIG");
        WMSX.PRESETS = WMSX.PRESETS.replace(/ALTSLOTCONFIG/gi, "");      // remove from list
    },

    slotURLSpecs: function() {
        var urlSpecs = [];

        // BIOS AND BIOS Extension URLs
        if (WMSX.BIOS_URL) addSpec(WMSX.BIOS_URL, WMSX.BIOS_SLOT);
        if (WMSX.BIOSEXT_URL) addSpec(WMSX.BIOSEXT_URL, WMSX.BIOSEXT_SLOT);

        // Any URL specified in the format SLOTN_N_URL
        for (var key in WMSX) {
            if (wmsx.Util.stringStartsWith(key, "SLOT") && wmsx.Util.stringEndsWith(key, "_URL")) {
                var nums = key.match(/[0-9]/g);
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
            WMSX.HARDDISK_URL && {
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

        var typePreffix;
        switch (type) {
            case 4: typePreffix = "MSX2PP"; break;
            case 3: typePreffix = "MSX2P"; break;
            case 2: typePreffix = "MSX2"; break;
            case 1: typePreffix = "MSX1"; break;
        }

        var machine = typePreffix + langSuffix;

        wmsx.Util.log("Machine auto-detection: " + machine);
        return machine;
    },

    upgradeForState: function(state) {
        // No adaptation made if not Main Variation (no old savestates possible!)
        if (WMSX.ENVIRONMENT) return;

        // Adapt Extensions Config. Make current Config compatible with old State
        if (state.v < 50) {
            WMSX.EXTENSIONS_CONFIG.HARDDISK.OP1_SLOT = [2, 2];
            WMSX.EXTENSIONS_CONFIG.DISK.OP1_SLOT =     [2, 2];
            WMSX.EXTENSIONS_CONFIG.MSXMUSIC.OP1_SLOT = [2, 3];
            WMSX.EXTENSIONS_CONFIG.KANJI.OP1_SLOT =    [3, 1];
            WMSX.BIOSEXT_SLOT =                        [2, 1];
            WMSX.EXPANSION_SLOTS =                     [[3, 2], [3, 3]];
            WMSX.OLD_EXTENSION_CONFIG = true;
        } else if (state.v < 51) {
            WMSX.EXTENSIONS_CONFIG.HARDDISK.OP1_SLOT = [2, 3];
            WMSX.EXTENSIONS_CONFIG.DISK.OP1_SLOT =     [2, 3];
            WMSX.EXTENSIONS_CONFIG.MSXMUSIC.OP1_SLOT = [3, 2];
            WMSX.EXTENSIONS_CONFIG.KANJI.OP1_SLOT =    [2, 1];
            WMSX.BIOSEXT_SLOT =                        [3, 1];
            WMSX.EXPANSION_SLOTS =                     [[2, 2], [2, 3]];
            WMSX.OLD_EXTENSION_CONFIG = true;
        }

        // Revert old config to the new Config again
        if (WMSX.OLD_EXTENSION_CONFIG && state.v >= 51) {
            WMSX.EXTENSIONS_CONFIG.HARDDISK.OP1_SLOT = [2, 3];
            WMSX.EXTENSIONS_CONFIG.DISK.OP1_SLOT =     [2, 3];
            WMSX.EXTENSIONS_CONFIG.MSXMUSIC.OP1_SLOT = [3, 2];
            WMSX.EXTENSIONS_CONFIG.KANJI.OP1_SLOT =    [4, 0];
            WMSX.BIOSEXT_SLOT =                        [3, 1];
            WMSX.EXPANSION_SLOTS =                     [[2, 1], [2, 2]];
            WMSX.OLD_EXTENSION_CONFIG = false;
        }
    },

    abbreviations: {
        E: "ENVIRONMENT",
        ENV: "ENVIRONMENT",
        M: "MACHINE",
        P: "PRESETS",
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
        HARDDISK: "HARDDISK_URL",
        HARDDISK_FILES: "HARDDISK_FILES_URL",
        TAPE: "TAPE_URL",
        ANY: "AUTODETECT_URL",
        AUTO: "AUTODETECT_URL",
        AUTODETECT: "AUTODETECT_URL",
        STATE: "STATE_URL",
        SAVESTATE: "STATE_URL",
        JOIN: "NETPLAY_JOIN",
        NICK: "NETPLAY_NICK",
        JOYSTICKS: "JOYSTICKS_MODE",
        JOYKEYS: "JOYKEYS_MODE",
        MOUSE: "MOUSE_MODE",
        TURBO: "CPU_TURBO_MODE",
        CPU_TURBO: "CPU_TURBO_MODE",
        VDP_TURBO: "VDP_TURBO_MODE",
        VERSION: "VERSION_CHANGE_ATTEMPTED"      // Does not allow version to be changed ;-)
    }

};
