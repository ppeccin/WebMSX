// WebMSX version 2.0
// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// May be overridden dynamically by URL query parameters, if ALLOW_URL_PARAMETERS = true.
// Machine type and Components are defined by Configuration Presets.

WMSX = {

    MACHINE:                        "",                         // Machine Type. See Machine Configuration. Leave blank for auto-detection

    PRESETS:                        "",                         // Configuration Presets to apply. See Presets Configuration

    // Full or relative URL of Media files to load
    CARTRIDGE1_URL:                 "",
    CARTRIDGE2_URL:                 "",
    DISKA_URL:                      "",                         // Image files
    DISKB_URL:                      "",
    DISKA_FILES_URL:                "",                         // Files to load "as Disk". For several files, use a ZIP file
    DISKB_FILES_URL:                "",
    TAPE_URL:                       "",
    STATE_URL:                      "",
    AUTODETECT_URL:                 "",

    // Forcing ROM formats
    CARTRIDGE1_FORMAT:              "",                         // Normal, ASCII8, ASCII16, Konami, KonamiSCC, KonamiSCCI, FMPAC, MSXDOS2, RType, CrossBlaim, Manbow2
    CARTRIDGE2_FORMAT:              "",

    // Basic loading/typing commands. Not needed for AUTOEXEC.BAS, AUTOEXEC.BAT or Tape Images
    BASIC_RUN:                      "",
    BASIC_LOAD:                     "",
    BASIC_ENTER:                    "",
    BASIC_TYPE:                     "",

    // Extensions
    EXTENSIONS:                     { },

    // General configuration
    BIOS_SLOT:                      [0],
    BIOSEXT_SLOT:                   [2, 1],
    CARTRIDGE1_SLOT:                [1],
    CARTRIDGE2_SLOT:                [2],
    EXPANSION_SLOTS:                [[3, 2], [3, 3]],
    RAMMAPPER_SIZE:                 512,

    AUTO_START:                     true,
    AUTO_POWER_ON_DELAY:            1600,                       // -1: no auto Power-ON, >= 0: wait specified milliseconds before Power-ON
    MEDIA_CHANGE_DISABLED:          false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_ELEMENT_ID:              "wmsx-screen",
    SCREEN_FULLSCREEN_MODE:         -1,                         // -2: disabled, -1: auto, 0: off, 1: on
    SCREEN_CRT_MODE:                -1,                         // -1: auto, 0: off, 1: on
    SCREEN_FILTER_MODE:             -1,                         // -2: browser default, -1: auto, 0..3: smoothing level
    SCREEN_DEFAULT_SCALE:           -1,                         // 0.5 .. N, 0.1 steps. -1: auto
    SCREEN_DEFAULT_ASPECT:          1.1,                        // 0.1 steps
    SCREEN_CONTROL_BAR:             1,                          // 0: on hover, 1: always
    SCREEN_FORCE_HOST_NATIVE_FPS:   -1,                         // -1: auto. Don't change! :-)
    SCREEN_VSYNCH_MODE:             1,                          // -1: disabled, 0: off, 1: on
    AUDIO_MONITOR_BUFFER_BASE:      -1,                         // 1 .. 6. -1: auto, 0: disable audio. More buffer = more delay. Don't change! :-)
    AUDIO_MONITOR_BUFFER_SIZE:      -1,                         // 256, 512, 1024, 2048, 4096, 8192. -1: auto. More buffer = more delay. Don't change! :-)
    AUDIO_SIGNAL_BUFFER_RATIO:      1.4,                        // Signal buffer based on monitor buffer
    AUDIO_SIGNAL_ADD_FRAMES:        3,                          // Additional frames of audio in signal buffer
    MOUSE_MODE:                     0,                          // -1: disabled, 0: auto, 1: enabled at port 1, 2: enabled at port 2
    TOUCH_MODE:                     0,                          // -1: disabled, 0: auto, 1: enabled at port 1, 2: enabled at port 2
    KEYBOARD_JAPAN_LAYOUT:          1,                          // 0: ANSI, 1: JIS
    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "images/",

    ALLOW_URL_PARAMETERS:           true                        // Allows user to override any of these parameters via URL query parameters

};

WMSX.MACHINES_CONFIG = {
    EMPTY:  { desc: "MSX2+ Barebone (NTSC)" },
    MSX2P:  { desc: "MSX2+ Auto Detect",    autoType: 3 },
    MSX2:   { desc: "MSX2 Auto Detect",     autoType: 2 },
    MSX1:   { desc: "MSX Auto Detect",      autoType: 1 },
    MSX2PA: { desc: "MSX2+ America (NTSC)", type: 3, presets: "_MSX2PA"},
    MSX2PE: { desc: "MSX2+ Europe (PAL)",   type: 3, presets: "_MSX2PE"},
    MSX2PJ: { desc: "MSX2+ Japan (NTSC)",   type: 3, presets: "_MSX2PJ", japanese: true },
    MSX2A:  { desc: "MSX2 America (NTSC)",  type: 2, presets: "_MSX2A"},
    MSX2E:  { desc: "MSX2 Europe (PAL)",    type: 2, presets: "_MSX2E"},
    MSX2J:  { desc: "MSX2 Japan (NTSC)",    type: 2, presets: "_MSX2J",  japanese: true },
    MSX1A:  { desc: "MSX America (NTSC)",   type: 1, presets: "_MSX1A"},
    MSX1E:  { desc: "MSX Europe (PAL)",     type: 1, presets: "_MSX1E"},
    MSX1J:  { desc: "MSX Japan (NTSC)",     type: 1, presets: "_MSX1J",  japanese: true }
};

WMSX.EXTENSIONS_CONFIG = {
    DISK:      { desc: "Floppy Drives", SLOT: [2, 2],             format: "DiskPatch" },
    RAMMAPPER: { desc: "RAM Mapper",    SLOT: [3],                format: "RAMMapper",     mutual: "RAMNORMAL" },
    RAMNORMAL: {                        SLOT: [3],                format: "RAMNormal",     mutual: "RAMMAPPER" },
    MSXMUSIC:  { desc: "MSX-MUSIC",     SLOT: [2, 3],             format: "MSXMUSIC" },
    DOS2:      { desc: "MSX-DOS 2",     SLOT: [3, 3],             format: "MSXDOS2",       require: "RAMMAPPER, DISK", requireFlag: "MSX2" },
    KANJI:     { desc: "KANJI Fonts",   SLOT: [3, 1],             format: "Kanji1" },
    SCCI:      { desc: "Konami SCC+",   SLOT: [1], SLOT2: [2, 0], format: "SCCIExpansion", remove: "SCC, PAC" },
    SCC:       { desc: "Konami SCC",    SLOT: [1], SLOT2: [2, 0], format: "SCCExpansion",  remove: "SCCI, PAC" },
    PAC:       { desc: "PAC SRAM",      SLOT: [1], SLOT2: [2, 0], format: "PACExpansion",  remove: "SCC, SCCI" }
};

WMSX.PRESETS_CONFIG = {

    // Extensions Options Presets

    DISK:   { "EXTENSIONS.DISK": 1 },
    NODISK: { "EXTENSIONS.DISK": 0 },

    RAMMAPPER: { "EXTENSIONS.RAMMAPPER": 1, "EXTENSIONS.RAMNORMAL": 0 },
    RAMNORMAL: { "EXTENSIONS.RAMMAPPER": 0, "EXTENSIONS.RAMNORMAL": 1 },

    MSXMUSIC:   { "EXTENSIONS.MSXMUSIC": 1 },
    NOMSXMUSIC: { "EXTENSIONS.MSXMUSIC": 0 },

    KANJI:   { "EXTENSIONS.KANJI":  1 },
    NOKANJI: { "EXTENSIONS.KANJI":  0 },

    DOS2:   { "EXTENSIONS.DOS2":  1 },
    NODOS2: { "EXTENSIONS.DOS2":  0 },

    SCCI:  { "EXTENSIONS.SCCI": 1 },
    SCCI2: { "EXTENSIONS.SCCI": 2 },

    SCC:  { "EXTENSIONS.SCC": 1 },
    SCC2: { "EXTENSIONS.SCC": 2 },

    PAC:  { "EXTENSIONS.PAC": 1 },
    PAC2: { "EXTENSIONS.PAC": 2 },

    // Configuration Helper Presets

    RAM128:      { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 128 },
    RAM256:      { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 256 },
    RAM512:      { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 512 },
    RAM1024:     { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 1024 },
    RAM2048:     { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 2048 },
    RAM4096:     { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 4096 },
    NORAMMAPPER: { _INCLUDE: "RAMNORMAL"},

    VSYNCHDISABLED: { SCREEN_VSYNCH_MODE: -1 },
    VSYNCHOFF:      { SCREEN_VSYNCH_MODE: 0 },
    VSYNCHON:       { SCREEN_VSYNCH_MODE: 1 },

    ALTSLOTCONFIG: {
        BIOSEXT_SLOT:                      [3, 1],
        EXPANSION_SLOTS:                   [[2, 2], [2, 3]],
        "EXTENSIONS_CONFIG.DISK.SLOT":     [3, 2],
        "EXTENSIONS_CONFIG.MSXMUSIC.SLOT": [3, 3],
        "EXTENSIONS_CONFIG.DOS2.SLOT":     [2, 3],
        "EXTENSIONS_CONFIG.KANJI.SLOT":    [2, 1]
    },

    // MSX2+ Machine Presets. Do not use directly

    _MSX2PA: {
        _INCLUDE:           "_MSX2PBASE",
        BIOS_URL:           "@MSX2P_NTSC.bios",
        BIOSEXT_URL:        "@MSX2PEXT_NTSC.bios | @[KanjiBasic].bios"
    },
    _MSX2PE: {
        _INCLUDE:           "_MSX2PBASE",
        BIOS_URL:           "@MSX2P_PAL.bios",
        BIOSEXT_URL:        "@MSX2PEXT_PAL.bios | @KanjiBasic_PAL.bios"
    },
    _MSX2PJ: {
        _INCLUDE:           "_MSX2PBASE, KANJI",
        BIOS_URL:           "@MSX2P_JAP.bios",
        BIOSEXT_URL:        "@MSX2PEXT_JAP.bios | @[KanjiBasic].bios"
    },
    _MSX2PBASE: {
        _INCLUDE:           "_MSX2BASE"
    },

    // MSX2 Machine Presets. Do not use directly

    _MSX2A: {
        _INCLUDE:           "_MSX2BASE",
        BIOS_URL:           "@MSX2_NTSC.bios",
        BIOSEXT_URL:        "@MSX2EXT_NTSC.bios"
    },
    _MSX2E: {
        _INCLUDE:           "_MSX2BASE",
        BIOS_URL:           "@MSX2_PAL.bios",
        BIOSEXT_URL:        "@MSX2EXT_PAL.bios"
    },
    _MSX2J: {
        _INCLUDE:           "_MSX2BASE, KANJI",
        BIOS_URL:           "@MSX2_JAP.bios",
        BIOSEXT_URL:        "@MSX2EXT_JAP.bios | @[KanjiBasic].bios"
    },
    _MSX2BASE: {
        _INCLUDE:           "_BASE, RAM512, MSXMUSIC",
        MSX2:               true
    },

    // MSX1 Machine Presets. Do not use directly

    _MSX1A: {
        _INCLUDE:           "_MSX1BASE",
        BIOS_URL:           "@MSX1_NTSC.bios"
    },
    _MSX1E: {
        _INCLUDE:           "_MSX1BASE",
        BIOS_URL:           "@MSX1_PAL.bios"
    },
    _MSX1J: {
        _INCLUDE:           "_MSX1BASE",
        BIOS_URL:           "@MSX1_JAP.bios"
    },
    _MSX1BASE: {
        _INCLUDE:           "_BASE, NOMSXMUSIC, NODOS2",
        BIOSEXT_URL:        "@[Empty].rom"
    },

    // Base Machines Presets. Do not use directly

    _BASE: {
        _INCLUDE:           "RAMNORMAL, DISK, NOKANJI",
        MSX2:               false
    }

};

wmsx = window.wmsx || {};           // Namespace for all classes and objects
