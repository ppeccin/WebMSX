// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// WebMSX version 2.0

// Main Emulator parameters.
// You may change any of these after loading the project and before starting the Emulator
// It is also possible to override values dynamically via URL query parameters
// Machine type and components are defined via Configuration Presets

WMSX = {

    // Machine Configuration Presets to apply. See Presets section below
    PRESETS:                        "",

    // Full or relative URL of Media files to load
    CARTRIDGE1_URL:                 "",
    CARTRIDGE2_URL:                 "",
    DISKA_URL:                      "",
    DISKB_URL:                      "",
    TAPE_URL:                       "",
    STATE_LOAD_URL:                 "",

    // General configuration
    AUTO_START_DELAY:               1200,                       // Negative = No Auto-Start, Positive = Start then wait milliseconds before Power-on
    MEDIA_CHANGE_DISABLED:          false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    SCREEN_ELEMENT_ID:              "wmsx-screen",
    SCREEN_FILTER_MODE:             1,                          // 0..3
    SCREEN_CRT_MODE:                1,                          // 0..1
    SCREEN_DEFAULT_SCALE:           1,                          // 0.5 .. N, 0.1 steps
    SCREEN_DEFAULT_ASPECT:          1.1,                        // 0.1 steps
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover
    SCREEN_MSX1_COLOR_MODE:         0,                          // 0..5
    SCREEN_FORCE_HOST_NATIVE_FPS:   -1,                         // Set 60 or 50 to force value. -1 = Autodetect. Don't change! :-)
    SCREEN_VSYNCH_MODE:             1,                          // 0 = disabled, 1 = auto (when matches), 2 = forced
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192. 0 = disable. More buffer = more delay
    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "wmsx/images/",

    ALLOW_URL_PARAMETERS:           false,                      // Allows user to override any of these parameters via URL query parameters

    VERSION:                        "2.0"                       // Don't change!

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
        MACHINE_TYPE:       3,
        _INCLUDE:           "MSX2BASE, MSXMUSIC",
        SLOT_0_URL:         "@MSX2P_NTSC.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_NTSC.bios"
    },

    MSX2PPAL: {
        MACHINE_TYPE:       3,
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX2BASE, MSXMUSIC",
        SLOT_0_URL:         "@MSX2P_PAL.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_PAL.bios"
    },

    MSX2PJAP: {
        MACHINE_TYPE:       3,
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX2BASE, MSXMUSIC",
        SLOT_0_URL:         "@MSX2P_JAP.bios",
        SLOT_3_1_URL:       "@MSX2PEXT_JAP.bios"
    },

    // MSX2 Machine Presets

    MSX2: {
        _INCLUDE:           "MSX2NTSC"
    },

    MSX2NTSC: {
        MACHINE_TYPE:       2,
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX2BASE",
        SLOT_0_URL:         "@MSX2_NTSC.bios",
        SLOT_3_1_URL:       "@MSX2EXT_NTSC.bios"
    },

    MSX2PAL: {
        MACHINE_TYPE:       2,
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX2BASE",
        SLOT_0_URL:         "@MSX2_PAL.bios",
        SLOT_3_1_URL:       "@MSX2EXT_PAL.bios"
    },

    MSX2JAP: {
        MACHINE_TYPE:       2,
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX2BASE",
        SLOT_0_URL:         "@MSX2_JAP.bios",
        SLOT_3_1_URL:       "@MSX2EXT_JAP.bios"
    },

    // MSX2/2+ Common

    MSX2BASE: {
        BIOS_SLOT:          [0],
        CARTRIDGE1_SLOT:    [1],
        CARTRIDGE2_SLOT:    [3, 0],
        EXPANSION_SLOTS:    [[2, 2], [2, 3]],
        SLOT_2_URL:         "@[RAMMapper].rom",
        _INCLUDE:           "MSX2DISK, RAM512"
    },

    MSX2DISK: {
        SLOT_3_2_URL:       "@DISK.rom"
    },

    MSXMUSIC: {
        SLOT_3_3_URL:       "@MSXMUSIC.rom"
    },

    DOS2: {
        SLOT_2_2_URL:       "@MSXDOS22v3.rom"
    },

    RAM64: {
        RAM_SIZE: 64
    },
    RAM128: {
        RAM_SIZE: 128
    },
    RAM256: {
        RAM_SIZE: 256
    },
    RAM512: {
        RAM_SIZE: 512
    },
    RAM1024: {
        RAM_SIZE: 1024
    },
    RAM2048: {
        RAM_SIZE: 2048
    },
    RAM4096: {
        RAM_SIZE: 4096
    },

    // MSX1 Machine Presets

    MSX1: {
        _INCLUDE:           "MSX1NTSC"
    },

    MSX1NTSC: {
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX1BASE",
        SLOT_0_URL:         "@MSX1_NTSC.bios"
    },

    MSX1PAL: {
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX1BASE",
        SLOT_0_URL:         "@MSX1_PAL.bios"
    },

    MSX1JAP: {
        _EXCLUDE:           "DEFAULT",
        _INCLUDE:           "MSX1BASE",
        SLOT_0_URL:         "@MSX1_JAP.bios"
    },

    MSX1BASE: {
        MACHINE_TYPE:       1,
        BIOS_SLOT:          [0],
        CARTRIDGE1_SLOT:    [1],
        CARTRIDGE2_SLOT:    [3, 0],
        EXPANSION_SLOTS:    [[3, 2], [3, 3]],
        SLOT_2_URL:         "@[RAM64K].rom",
        _INCLUDE:           "MSX1DISK"
    },

    MSX1DISK: {
        SLOT_3_1_URL:       "@DISK.rom"
    },

    // Specific Machines Presets

    EXPERT: {
        _INCLUDE:           "MSX1BASE",
        SLOT_0_URL:         "@EXPERT10.bios"
    },

    EMPTY: {
        _EXCLUDE:           "DEFAULT",
        MACHINE_TYPE:       3,
        BIOS_SLOT:          [0],
        CARTRIDGE1_SLOT:    [1],
        CARTRIDGE2_SLOT:    [3, 0],
        EXPANSION_SLOTS:    [[3, 2], [3, 3]]
    },

    // General Add-ons options

    NODISK: {
        _EXCLUDE:           "MSX1DISK, MSX2DISK"
    },

    NORAMMAPPER: {
        SLOT_2_URL:         "@[RAM64K].rom"
    },

    SCC: {
        SLOT_2_3_URL:       "@[SCCExpansion].rom"
    },

    SCCI: {
        SLOT_2_3_URL:       "@[SCCIExpansion].rom"
    },

    FMPAC: {
        CARTRIDGE2_URL:     "@FMPAC.rom"
    },

    // Configuration Helper Presets

    NOVSYNCH: {
        SCREEN_VSYNCH_MODE: 0
    },

    FORCEVSYNCH: {
        SCREEN_VSYNCH_MODE: 2
    }

};

wmsx = window.wmsx || {};           // Namespace for all classes and objects
