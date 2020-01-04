// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Configurator = {

    applyConfig: function(then) {
        this.backupOriginalConfig();

        // Process parameter overrides (including URL parameters)
        this.parseParams();

        // Process Config file if asked
        if (WMSX.params.CONFIG_URL) this.applyParam("CONFIG_URL", WMSX.params.CONFIG_URL);
        if (WMSX.CONFIG_URL) this.readThenApplyConfigFile(then);
        else this.applyConfigDetails(then);
    },

    readThenApplyConfigFile: function(then) {
        var self = this;
        new wmsx.MultiDownloader(
            [{ url: WMSX.CONFIG_URL.trim() }],
            function onAllSuccess(urls) {
                self.applyConfigFile(urls[0].content, then);
            },
            function onAnyError(url) {
                return wmsx.Util.message(url.errorMessage);
            }
        ).start();      // Asynchronous since URL is not an Embedded file
    },

    applyConfigDetails: function(then) {
        // First apply modifications to Presets configurations including Alternate Slot Configuration Preset itself (special case)
        this.applyPresetsConfigModifications();

        // Define Machine
        if (WMSX.params.MACHINE) this.applyParam("MACHINE", WMSX.params.MACHINE);
        WMSX.MACHINE = WMSX.MACHINE.trim().toUpperCase();
        if (WMSX.MACHINE && !WMSX.MACHINES_CONFIG[WMSX.MACHINE]) return wmsx.Util.message("Invalid Machine: " + WMSX.MACHINE);
        if (!WMSX.MACHINES_CONFIG[WMSX.MACHINE] || WMSX.MACHINES_CONFIG[WMSX.MACHINE].AUTO_TYPE) WMSX.MACHINE = this.detectDefaultMachine();
        delete WMSX.params.MACHINE;

        // Apply all parameters from Machine, Presets and Single Parameters from URL
        this.applyFinalConfig();

        // Apply user asked page CSS
        if(WMSX.PAGE_BACK_CSS) document.body.style.background = WMSX.PAGE_BACK_CSS;

        // Auto activate HardDrive Extension if not active and user trying to load HardDisk file
        if ((WMSX.HARDDISK_URL || WMSX.HARDDISK_FILES_URL) && !WMSX.EXTENSIONS.HARDDISK) {
            WMSX.EXTENSIONS.HARDDISK = 1;
            if (WMSX.EXTENSIONS.DISK) WMSX.EXTENSIONS.DISK = 2;
        }

        then();
    },

    applyFinalConfig: function () {
        // Apply Presets from Machine configuration
        this.applyPresets(WMSX.MACHINES_CONFIG[WMSX.MACHINE].PRESETS);
        // Apply additional Presets over Machine configuration
        this.applyPresets(WMSX.PRESETS);
        // Apply additional Single Parameters overrides (including URL parameters)
        for (var par in WMSX.params) this.applyParam(par, WMSX.params[par]);
        // Ensure the correct types of the parameters after all settings applied
        this.normalizeParameterTypes();
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
        if (name.indexOf(".") < 1)
            WMSX[name] = value;
        else {
            var obj = WMSX;
            var parts = name.split('.');
            for (var p = 0; p < parts.length - 1; ++p) obj = obj && obj[parts[p]];
            if (obj) obj[parts[parts.length - 1]] = value;
        }
    },

    applyPresetsConfigModifications: function() {
        if (WMSX.params.PRESETS) this.applyParam("PRESETS", WMSX.params.PRESETS);
        delete WMSX.params.PRESETS;

        // Apply Presets modifications
        for (var p in WMSX.params) if (wmsx.Util.stringStartsWith(p, "PRESETS_CONFIG")) this.applyParam(p, WMSX.params[p]);

        // Apply Alternate Slot Config Preset if asked (special case, also modifies other presets)
        if ((WMSX.PRESETS || "").toUpperCase().indexOf("ALTSLOTCONFIG") < 0) return;
        this.applyPreset("ALTSLOTCONFIG");
        WMSX.PRESETS = WMSX.PRESETS.replace(/ALTSLOTCONFIG/gi, "");      // remove from list
    },

    applyConfigFile: function(configString, then) {
        try {
            var config = JSON.parse(wmsx.Util.int8BitArrayToByteString(configString));
        } catch (e) {
            return wmsx.Util.message("Invalid Configuration file format:\n" + e);
        }

        wmsx.Util.applyPatchObject(WMSX, config);

        this.applyConfigDetails(then);
    },

    parseParams: function() {
        if (WMSX.ALLOW_URL_PARAMETERS) {
            var search = (window.location.search || "").split('+').join(' ');
            var reg = /[?&]?([^=]+)=([^&]*)/g;
            var tokens;
            while (tokens = reg.exec(search))
                WMSX.params[decodeURIComponent(tokens[1]).trim().toUpperCase()] = decodeURIComponent(tokens[2]).trim();
        }
        // Replace abbreviations
        for (var parName in WMSX.params) {
            var newName = wmsx.Configurator.abbreviations[parName];
            if (newName) {
                WMSX.params[newName] = WMSX.params[parName];
                delete WMSX.params[parName];
            }
        }
    },

    normalizeParameterTypes: function() {
        // Object parameters
        var obj, p;
        obj = WMSX.MACHINES_CONFIG = WMSX.MACHINES_CONFIG || {}; for (p in obj) if (!obj[p]) delete obj[p];
        obj = WMSX.EXTENSIONS_CONFIG = WMSX.EXTENSIONS_CONFIG || {}; for (p in obj) if (!obj[p]) delete obj[p];
        obj = WMSX.PRESETS_CONFIG = WMSX.PRESETS_CONFIG || {}; for (p in obj) if (!obj[p]) delete obj[p];
        obj = WMSX.EXTENSIONS = WMSX.EXTENSIONS || {};

        // Numeric parameters
        WMSX.ENVIRONMENT |= 0;
        WMSX.RAMMAPPER_SIZE |= 0;
        WMSX.RAMNORMAL_SIZE |= 0;
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
        var turboMulti = Number.parseFloat(WMSX.Z80_CLOCK_MODE);
        WMSX.Z80_CLOCK_MODE = isNaN(turboMulti) ? 0 : Number.parseFloat(turboMulti.toFixed(2));
        turboMulti = Number.parseFloat(WMSX.Z80_SOFT_TURBO_MULTI);
        WMSX.Z80_SOFT_TURBO_MULTI = isNaN(turboMulti) ? 1.5 : Number.parseFloat(turboMulti.toFixed(2));
        turboMulti = Number.parseFloat(WMSX.VDP_CLOCK_MODE);
        WMSX.VDP_CLOCK_MODE = isNaN(turboMulti) ? 0 : Number.parseFloat(turboMulti.toFixed(2));
        turboMulti = Number.parseFloat(WMSX.VDP_SOFT_TURBO_MULTI);
        WMSX.VDP_SOFT_TURBO_MULTI = isNaN(turboMulti) ? 2 : Number.parseFloat(turboMulti.toFixed(2));
        turboMulti = Number.parseFloat(WMSX.R800_CLOCK_MODE);
        WMSX.R800_CLOCK_MODE = isNaN(turboMulti) ? 0 : Number.parseFloat(turboMulti.toFixed(2));
        WMSX.CPU_SOFT_TURBO_AUTO_ON |= 0;
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
        WMSX.PANA_TURBO |= 0;
        WMSX.FAKE_TR_TURBO |= 0;
        WMSX.R800_WAITS |= 0;

        // Boolean parameters (only single parameters known)
        WMSX.MEDIA_CHANGE_DISABLED = WMSX.MEDIA_CHANGE_DISABLED === true || WMSX.MEDIA_CHANGE_DISABLED === "true";
        WMSX.SCREEN_RESIZE_DISABLED = WMSX.SCREEN_RESIZE_DISABLED === true || WMSX.SCREEN_RESIZE_DISABLED === "true";
        WMSX.LIGHT_STATES = WMSX.LIGHT_STATES === true || WMSX.LIGHT_STATES === "true";

        // Slot parameters (arrays with numbers). Any parameter ending with "SLOT" or "SLOT2"
        deepNormalizeSlotParams(WMSX);

        function deepNormalizeSlotParams(obj) {
            if (!obj || obj.constructor !== Object) return false;
            for (var p in obj) {
                var innerObj = obj[p];
                if (deepNormalizeSlotParams(innerObj)) continue;
                if (wmsx.Util.stringEndsWith(p, "SLOT") || wmsx.Util.stringEndsWith(p, "SLOT2")) normalizeNumberArray(obj, p, innerObj);
            }
            return true;
        }

        function normalizeNumberArray(obj, prop, value) {
            if (value.constructor === Array) return;
            var nums = ("" + value).match(/[0-9]/g);
            if (!nums) return;
            obj[prop] = nums.map(function(strNum) { return strNum | 0; });
        }
    },

    slotURLSpecs: function() {
        var urlSpecs = [];

        // Any URL specified in the format SLOTXY_URL, where X = primary slot number and Y = secondary slot number (optional) or P (force primary)
        // Also consider as ROM Format Hint any parameter in the format SLOTXY_FORMAT
        for (var key in WMSX) {
            if (wmsx.Util.stringStartsWith(key, "SLOT") && wmsx.Util.stringEndsWith(key, "_URL")) {
                var url = WMSX[key];
                delete WMSX[key];
                if (url !== null && url !== undefined) {
                    var nums = key.match(/[0-9P]/g);
                    if (nums) {
                        var pos = nums.map(function(strNum) { return strNum === "P" ? -1 : strNum | 0; });
                        if (pos[0] >= 0) {
                            var formatParam = "SLOT" + nums[0] + (nums[1] || "") + "_FORMAT";
                            var format = url ? WMSX[formatParam] : null;
                            delete WMSX[formatParam];

                            var startAddrParam = "SLOT" + nums[0] + (nums[1] || "") + "_START";
                            var startAddr = url ? WMSX[startAddrParam] : null;
                            delete WMSX[startAddrParam];

                            addSpec(url || "@[Empty].rom", pos, format, startAddr);
                        }
                    }
                }
            }
        }

        function addSpec(url, pos, format, startAddr) {
            urlSpecs[urlSpecs.length] = {
                url: url,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadFromContentAsSlot(res.url, res.content, pos, true, format, startAddr, true);      // internal
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
        var type = (WMSX.MACHINES_CONFIG[WMSX.MACHINE] && WMSX.MACHINES_CONFIG[WMSX.MACHINE].AUTO_TYPE) || 3;

        var lang = wmsx.Util.userLanguage();
        var langSuffix = "A";                                 // Default American machine
        if (lang.indexOf("ja") === 0) langSuffix = "J";       // Japanese machine

        var machine = "" + WMSX.MACHINE + langSuffix;

        // If Machine not found, get the first <= type (trust enumeration order)
        if (!WMSX.MACHINES_CONFIG[machine])
            for (machine in WMSX.MACHINES_CONFIG) if (WMSX.MACHINES_CONFIG[machine].TYPE <= type) break;

        wmsx.Util.log("Machine auto-detection: " + machine);
        return machine;
    },

    saveState: function() {
        return {
            mc: WMSX.MACHINES_CONFIG,
            ec: WMSX.EXTENSIONS_CONFIG,
            pc: WMSX.PRESETS_CONFIG
        }
    },

    loadState: function(s, cfg) {
        // Store loading state version
        this.loadingStateVersion = s.v || 0;

        console.log("Loading State version: " + this.loadingStateVersion);

        // Load config from state if present
        if (cfg) {
            WMSX.MACHINES_CONFIG = cfg.mc;
            WMSX.EXTENSIONS_CONFIG = cfg.ec;
            WMSX.PRESETS_CONFIG = cfg.pc;
        } else {
            // Backward compatibility. For State versions < 530, cfg will be null, so restore original config and adapt
            this.adaptForOldState(s);
        }
        for (var i = 0; i < this.listeners.length; ++i) this.listeners[i].configurationStateUpdate();
    },

    // Only for state versions < 530, as they have no Config saved
    adaptForOldState: function(s) {
        // Make config compatible with old State
        WMSX.MACHINES_CONFIG = JSON.parse(this.originalConfig.MACHINES_CONFIG);
        WMSX.EXTENSIONS_CONFIG = JSON.parse(this.originalConfig.EXTENSIONS_CONFIG);
        WMSX.PRESETS_CONFIG = JSON.parse(this.originalConfig.PRESETS_CONFIG);
        if (s.v < 50) {
            WMSX.EXTENSIONS_CONFIG.HARDDISK.SLOT =  [2, 2];
            WMSX.EXTENSIONS_CONFIG.DISK.SLOT =      [2, 2];
            WMSX.EXTENSIONS_CONFIG.MSXMUSIC.SLOT =  [2, 3];
            WMSX.EXTENSIONS_CONFIG.KANJI.SLOT =     [3, 1];
            WMSX.EXPANSION1_SLOT =                  [3, 2];
            WMSX.EXPANSION2_SLOT =                  [3, 3];
        } else if (s.v < 51) {
            WMSX.EXTENSIONS_CONFIG.HARDDISK.SLOT2 = [3, 3];
            WMSX.EXTENSIONS_CONFIG.DISK.SLOT2 =     [3, 3];
            WMSX.EXTENSIONS_CONFIG.MSXMUSIC.SLOT =  [3, 2];
            WMSX.EXTENSIONS_CONFIG.KANJI.SLOT =     [2, 1];
            WMSX.EXPANSION1_SLOT =                  [2, 2];
            WMSX.EXPANSION2_SLOT =                  [2, 3];
        } else {
            WMSX.EXTENSIONS_CONFIG.HARDDISK.SLOT2 = [3, 3];
            WMSX.EXTENSIONS_CONFIG.DISK.SLOT2 =     [3, 3];
            WMSX.EXTENSIONS_CONFIG.MSXMUSIC.SLOT =  [3, 2];
        }
    },

    adaptROMSourceForOldState: function(source) {
        if (this.loadingStateVersion >= 600) return source;

        var newSource = source;
        for (var i in this.romSourcePre600Adapts)
            newSource = newSource.split(this.romSourcePre600Adapts[i][0]).join(this.romSourcePre600Adapts[i][1]);

        console.log(this.loadingStateVersion, source, " ===> ", newSource);

        return newSource;
    },

    backupOriginalConfig: function () {
        this.originalConfig.MACHINES_CONFIG = JSON.stringify(WMSX.MACHINES_CONFIG);
        this.originalConfig.EXTENSIONS_CONFIG = JSON.stringify(WMSX.EXTENSIONS_CONFIG);
        this.originalConfig.PRESETS_CONFIG = JSON.stringify(WMSX.PRESETS_CONFIG);
    },

    addConfigurationStateListener: function(listener) {
        if (this.listeners.indexOf(listener) >= 0) return;
        this.listeners.push(listener);
    },

    loadingStateVersion: 0,

    listeners: [],

    originalConfig: {},

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
        RAM_SIZE: "RAMNORMAL_SIZE",
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
        TURBO: "Z80_CLOCK_MODE",
        CPU_TURBO: "Z80_CLOCK_MODE",
        CPU_TURBO_MODE: "Z80_CLOCK_MODE",
        Z80_CLOCK: "Z80_CLOCK_MODE",
        R800_CLOCK: "R800_CLOCK_MODE",
        VDP_TURBO: "VDP_CLOCK_MODE",
        VDP_CLOCK: "VDP_CLOCK_MODE",
        VERSION: "VERSION_CHANGE_ATTEMPTED"      // Does not allow version to be changed ;-)
    },

    romSourcePre600Adapts: [
        [ "@MSX2P_PAL.bios",        "@MSX2P_PAL_54.bios" ],
        [ "@MSX2P_NTSC.bios",       "@MSX2P_NTSC_54.bios" ],
        [ "@MSX2PEXT_PAL.bios",     "@MSX2PEXT_PAL_54.bios" ],
        [ "@MSX2PEXT_NTSC.bios",    "@MSX2PEXT_NTSC_54.bios" ],
        [ "@KanjiBasic.bios",       "@KanjiBasic_NTSC_54.bios" ],
        [ "@KanjiBasic_PAL.bios",   "@KanjiBasic_PAL_54.bios" ],
        [ "@[KanjiBasic].bios",     "@KanjiBasic_NTSC_54.bios" ]         // older
    ]

};
