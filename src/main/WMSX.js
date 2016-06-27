// WebMSX version 2.0
// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// May be overridden dynamically by URL query parameters, if ALLOW_URL_PARAMETERS = true.
// Machine type and Components are defined by Configuration Presets.

WMSX = {

    MACHINE:                        "MSX2PA",                   // Machine Type. See Machine Configuration

    PRESETS:                        "",                         // Configuration Presets to apply. See Presets Configuration

    // Full or relative URL of Media files to load
    CARTRIDGE1_URL:                 "",
    CARTRIDGE2_URL:                 "",
    DISKA_URL:                      "",
    DISKB_URL:                      "",
    TAPE_URL:                       "",
    STATE_LOAD_URL:                 "",

    // Extensions
    EXTENSIONS:                     { },

    // General configuration
    AUTO_START_DELAY:               1200,                       // Negative = No Auto-Start, Positive = Start then wait milliseconds before Power-on
    MEDIA_CHANGE_DISABLED:          false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    SCREEN_ELEMENT_ID:              "wmsx-screen",
    SCREEN_FILTER_MODE:             1,                          // 0..3
    SCREEN_CRT_MODE:                1,                          // 0..1
    SCREEN_DEFAULT_SCALE:           1.1,                        // 0.5 .. N, 0.1 steps
    SCREEN_DEFAULT_ASPECT:          1.1,                        // 0.1 steps
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover
    SCREEN_MSX1_COLOR_MODE:         0,                          // 0..5
    SCREEN_FORCE_HOST_NATIVE_FPS:   -1,                         // Set 60 or 50 to force value. -1 = Autodetect. Don't change! :-)
    SCREEN_VSYNCH_MODE:             1,                          // 0 = disabled, 1 = auto (when matches), 2 = forced (only for 60/50Hz)
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192. 0 = disable. More buffer = more delay
    KEYBOARD_JAPAN_LAYOUT:          1,                          // 0 = ANSI, 1 = JIS
    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "images/",

    BIOS_SLOT:                      [0],
    CARTRIDGE1_SLOT:                [1],
    CARTRIDGE2_SLOT:                [2],
    EXPANSION_SLOTS:                [[2, 2], [2, 3]],
    RAMMAPPER_SIZE:                 256,

    ALLOW_URL_PARAMETERS:           false                       // Allows user to override any of these parameters via URL query parameters

};

WMSX.MACHINES_CONFIG = {
    EMPTY:  { desc: "MSX2+ Barebone (NTSC)", presets: "EMPTY"},
    MSX2PA: { desc: "MSX2+ America (NTSC)",  presets: "MSX2PA"},
    MSX2PE: { desc: "MSX2+ Europe (PAL)",    presets: "MSX2PE"},
    MSX2PJ: { desc: "MSX2+ Japan (NTSC)",    presets: "MSX2PJ"},
    MSX2A:  { desc: "MSX2 America (NTSC)",   presets: "MSX2A"},
    MSX2E:  { desc: "MSX2 Europe (PAL)",     presets: "MSX2E"},
    MSX2J:  { desc: "MSX2 Japan (NTSC)",     presets: "MSX2J"},
    MSX1A:  { desc: "MSX America (NTSC)",    presets: "MSX1A"},
    MSX1E:  { desc: "MSX Europe (PAL)",      presets: "MSX1E"},
    MSX1J:  { desc: "MSX Japan (NTSC)",      presets: "MSX1J"}
};

WMSX.EXTENSIONS_CONFIG = {
    DISK:                       { desc: "Floppy Drives", SLOT: [3, 2],          format: "DiskPatched" },
    RAMMAPPER:                  { desc: "RAM Mapper",    SLOT: [3, 0],          format: "RAMMapper",     mutual: "RAM64K" },
    RAM64K:                     {                        SLOT: [3, 0],          format: "RAM64K",        mutual: "RAMMAPPER" },
    MSXMUSIC:                   { desc: "MSX-MUSIC",     SLOT: [3, 3],          format: "MSXMUSIC" },
    DOS2:                       { desc: "MSX-DOS 2",     SLOT: [2, 3],          format: "DOS2",          require: "RAMMAPPER, DISK", requireFlag: "MSX2" },
    KANJI:                      { desc: "KANJI Fonts",   SLOT: [2, 1],          format: "Kanji1",        requireFlag: "KANJIBASIC" },
    SCC:                        { desc: "Konami SCC",    SLOT: [1], SLOT2: [2], format: "SCCExpansion",  remove: "SCCI, PAC" },
    SCCI:                       { desc: "Konami SCC-I",  SLOT: [1], SLOT2: [2], format: "SCCIExpansion", remove: "SCC, PAC" },
    PAC:                        { desc: "PAC SRAM",      SLOT: [1], SLOT2: [2], format: "PACExpansion",  remove: "SCC, SCCI" }
};

WMSX.PRESETS_CONFIG = {

    // MSX2+ Machine Presets

    MSX2P: {
        _INCLUDE:           "MSX2PA"
    },
    MSX2PA: {
        _INCLUDE:           "MSX2PBASE",
        MACHINE:            "MSX2PA",
        SLOT_0_URL:         "@MSX2P_NTSC.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_NTSC.bios, @MSXKANJI.bios"
    },
    MSX2PE: {
        _INCLUDE:           "MSX2PBASE",
        MACHINE:            "MSX2PE",
        SLOT_0_URL:         "@MSX2P_PAL.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_PAL.bios, @MSXKANJI_PAL.bios"
    },
    MSX2PJ: {
        _INCLUDE:           "MSX2PBASE, KANJI",
        MACHINE:            "MSX2PJ",
        SLOT_0_URL:         "@MSX2P_JAP.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_JAP.bios, @MSXKANJI.bios"
    },

    MSX2PBASE: {
        _INCLUDE:           "MSX2BASE",
        MACHINE_TYPE:       3,
        KANJIBASIC:         true
    },

    // MSX2 Machine Presets

    MSX2: {
        _INCLUDE:           "MSX2A"
    },
    MSX2A: {
        _INCLUDE:           "MSX2BASE",
        MACHINE:            "MSX2A",
        SLOT_0_URL:         "@MSX2_NTSC.bios",
        SLOT_3_1_URL:       "@MSX2EXT_NTSC.bios"
    },
    MSX2E: {
        _INCLUDE:           "MSX2BASE",
        MACHINE:            "MSX2E",
        SLOT_0_URL:         "@MSX2_PAL.bios",
        SLOT_3_1_URL:       "@MSX2EXT_PAL.bios"
    },
    MSX2J: {
        _INCLUDE:           "MSX2BASE, KANJI",
        MACHINE:            "MSX2J",
        SLOT_0_URL:         "@MSX2_JAP.bios",
        SLOT_3_1_URL:       "@MSX2EXT_JAP.bios, @MSXKANJI.bios",
        KANJIBASIC:         true
    },

    MSX2BASE: {
        _INCLUDE:           "MSX1BASE, RAMMAPPER, MSXMUSIC",
        MACHINE_TYPE:       2,
        MSX2:               true
    },

    // MSX1 Machine Presets

    MSX1: {
        _INCLUDE:           "MSX1A"
    },
    MSX1A: {
        _INCLUDE:           "MSX1BASE",
        MACHINE:            "MSX1A",
        SLOT_0_URL:         "@MSX1_NTSC.bios"
    },
    MSX1E: {
        _INCLUDE:           "MSX1BASE",
        MACHINE:            "MSX1E",
        SLOT_0_URL:         "@MSX1_PAL.bios"
    },
    MSX1J: {
        _INCLUDE:           "MSX1BASE",
        MACHINE:            "MSX1J",
        SLOT_0_URL:         "@MSX1_JAP.bios"
    },

    MSX1BASE: {
        _INCLUDE:           "RAM64K, DISK, NOMSXMUSIC, NOKANJI, NODOS2",
        MACHINE_TYPE:       1,
        MSX2:               false,
        KANJIBASIC:         false,
        SLOT_3_1_URL:       "@[Empty].rom"
    },

    // Specific Machines Presets

    EMPTY: {
        MACHINE_TYPE:       3
    },

    // Extensions Options Presets

    DISK:   { "EXTENSIONS.DISK": 1 },
    NODISK: { "EXTENSIONS.DISK": 0 },

    RAMMAPPER: { "EXTENSIONS.RAMMAPPER": 1, "EXTENSIONS.RAM64K": 0 },
    RAM64K:    { "EXTENSIONS.RAMMAPPER": 0, "EXTENSIONS.RAM64K": 1 },

    MSXMUSIC:   { "EXTENSIONS.MSXMUSIC": 1 },
    NOMSXMUSIC: { "EXTENSIONS.MSXMUSIC": 0 },

    KANJI:   { "EXTENSIONS.KANJI":  1 },
    NOKANJI: { "EXTENSIONS.KANJI":  0 },

    DOS2:   { "EXTENSIONS.DOS2":  1 },
    NODOS2: { "EXTENSIONS.DOS2":  0 },

    SCC:   { "EXTENSIONS.SCC": 1 },
    SCCS2: { "EXTENSIONS.SCC": 2 },

    SCCI:  { "EXTENSIONS.SCCI": 1 },
    SCCI2: { "EXTENSIONS.SCCI": 2 },

    PAC:   { "EXTENSIONS.PAC": 1 },
    PACS2: { "EXTENSIONS.PAC": 2 },

    // Configuration Helper Presets

    RAM128:  { RAMMAPPER_SIZE: 128 },
    RAM256:  { RAMMAPPER_SIZE: 256 },
    RAM512:  { RAMMAPPER_SIZE: 512 },
    RAM1024: { RAMMAPPER_SIZE: 1024 },
    RAM2048: { RAMMAPPER_SIZE: 2048 },
    RAM4096: { RAMMAPPER_SIZE: 4096 },

    NOVSYNCH:     { SCREEN_VSYNCH_MODE: 0},
    VSYNCHAUTO:   { SCREEN_VSYNCH_MODE: 1},
    VSYNCHFORCED: { SCREEN_VSYNCH_MODE: 2}

};

wmsx = window.wmsx || {};           // Namespace for all classes and objects
