// WebMSX version 2.0
// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// May be overridden dynamically by URL query parameters, if ALLOW_URL_PARAMETERS = true.
// Machine type and components are defined by Configuration Presets.

WMSX = {

    // Machine Configuration Presets to apply. See Presets section below...
    PRESETS:                        "",                         // Default: MSX2+ NTSC, 512K RAM, 2 Drives, MSX-MUSIC

    // Full or relative URL of Media files to load
    CARTRIDGE1_URL:                 "",
    CARTRIDGE2_URL:                 "",
    DISKA_URL:                      "",
    DISKB_URL:                      "",
    TAPE_URL:                       "",
    STATE_LOAD_URL:                 "",

    // Extensions
    EXTENSIONS: {
        DISK:                       false,
        RAMMAPPER:                  false,
        MSXMUSIC:                   false,
        SCC:                        false,
        SCCI:                       false,
        DOS2:                       false
    },

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
    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "images/",

    EXTENSIONS_CONFIG: {
        RAMMAPPER:                  { desc: "RAM Mapper",    slot: [3, 0], url: "@[RAMMapper].rom",     mutual: "NORMALRAM" },
        NORMALRAM:                  {                        slot: [3, 0], url: "@[RAM64K].rom",        mutual: "RAMMAPPER" },
        DISK:                       { desc: "Floppy Drives", slot: [3, 2], url: "@DISK.rom"},
        DOS2:                       { desc: "MSX-DOS 2",     slot: [2, 2], url: "@MSXDOS22v3.rom",      require: "DISK" },
        MSXMUSIC:                   { desc: "MSX-MUSIC",     slot: [3, 3], url: "@MSXMUSIC.rom" },
        SCC:                        { desc: "Konami SCC",    slot: [2, 3], url: "@[SCCExpansion].rom",  exclude: "SCCI" },
        SCCI:                       { desc: "Konami SCC-I",  slot: [2, 3], url: "@[SCCIExpansion].rom", exclude: "SCC" }
    },

    BIOS_SLOT:                      [0],
    CARTRIDGE1_SLOT:                [1],
    CARTRIDGE2_SLOT:                [2],
    EXPANSION_SLOTS:                [[2, 1], [2, 2]],

    ALLOW_URL_PARAMETERS:           false                       // Allows user to override any of these parameters via URL query parameters

};

WMSX.presets = {

    DEFAULT: {
        _INCLUDE:           "MSX2PNTSC"
    },

    // MSX2+ Machine Presets

    MSX2P: {
        _INCLUDE:           "MSX2PNTSC"
    },

    MSX2PNTSC: {
        _INCLUDE:           "MSX2PBASE",
        SLOT_0_URL:         "@MSX2P_NTSC.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_NTSC.bios"
    },

    MSX2PPAL: {
        _INCLUDE:           "MSX2PBASE",
        SLOT_0_URL:         "@MSX2P_PAL.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_PAL.bios"
    },

    MSX2PJAP: {
        _INCLUDE:           "MSX2PBASE",
        SLOT_0_URL:         "@MSX2P_JAP.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_JAP.bios"
    },

    MSX2PBASE: {
        _INCLUDE:           "MSX2BASE",
        MACHINE_TYPE:       3
    },

    // MSX2 Machine Presets

    MSX2: {
        _INCLUDE:           "MSX2NTSC"
    },

    MSX2NTSC: {
        _INCLUDE:           "MSX2BASE",
        SLOT_0_URL:         "@MSX2_NTSC.bios",
        SLOT_3_1_URL:       "@MSX2EXT_NTSC.bios"
    },

    MSX2PAL: {
        _INCLUDE:           "MSX2BASE",
        SLOT_0_URL:         "@MSX2_PAL.bios",
        SLOT_3_1_URL:       "@MSX2EXT_PAL.bios"
    },

    MSX2JAP: {
        _INCLUDE:           "MSX2BASE",
        SLOT_0_URL:         "@MSX2_JAP.bios",
        SLOT_3_1_URL:       "@MSX2EXT_JAP.bios"
    },

    // MSX2/2+ Common

    MSX2BASE: {
        _INCLUDE:           "MSX1BASE, RAMMAPPER, RAM512, MSXMUSIC",
        MACHINE_TYPE:       2
    },

    // MSX1 Machine Presets

    MSX1: {
        _INCLUDE:           "MSX1NTSC"
    },

    MSX1NTSC: {
        _INCLUDE:           "MSX1BASE",
        SLOT_0_URL:         "@MSX1_NTSC.bios"
    },

    MSX1PAL: {
        _INCLUDE:           "MSX1BASE",
        SLOT_0_URL:         "@MSX1_PAL.bios"
    },

    MSX1JAP: {
        _INCLUDE:           "MSX1BASE",
        SLOT_0_URL:         "@MSX1_JAP.bios"
    },

    MSX1BASE: {
        MACHINE_TYPE:       1,
        SLOT_3_URL:         "@[RAM64K].rom",
        _INCLUDE:           "DISK"
    },

    // Specific Machines Presets

    EMPTY: {
        MACHINE_TYPE:         3
    },

    // Extensions Options

    DISK: {
        "EXTENSIONS.DISK": true
    },
    NODISK: {
        "EXTENSIONS.DISK": false
    },

    RAMMAPPER: {
        "EXTENSIONS.RAMMAPPER": true
    },
    NORAMMAPPER: {
        "EXTENSIONS.RAMMAPPER": false
    },

    MSXMUSIC: {
        "EXTENSIONS.MSXMUSIC": true
    },
    NOMSXMUSIC: {
        "EXTENSIONS.MSXMUSIC": false
    },

    DOS2: {
        "EXTENSIONS.DOS2":  true
    },

    SCC: {
        "EXTENSIONS.SCC": true
    },
    SCCI: {
        "EXTENSIONS.SCCI": true
    },

    // Configuration Helper Presets

    NOVSYNCH: {
        SCREEN_VSYNCH_MODE: 0
    },
    VSYNCHAUTO: {
        SCREEN_VSYNCH_MODE: 1
    },
    VSYNCHFORCED: {
        SCREEN_VSYNCH_MODE: 2
    },

    RAM64: {
        RAMMAPPER_SIZE: 64
    },
    RAM128: {
        RAMMAPPER_SIZE: 128
    },
    RAM256: {
        RAMMAPPER_SIZE: 256
    },
    RAM512: {
        RAMMAPPER_SIZE: 512
    },
    RAM1024: {
        RAMMAPPER_SIZE: 1024
    },
    RAM2048: {
        RAMMAPPER_SIZE: 2048
    },
    RAM4096: {
        RAMMAPPER_SIZE: 4096
    }

};

wmsx = window.wmsx || {};           // Namespace for all classes and objects
