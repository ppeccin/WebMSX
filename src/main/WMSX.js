// WebMSX version 5.3.99
// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// May be overridden dynamically by URL query parameters

WMSX = {

    MACHINE:                        "",                         // Machine Type. See Machine Configuration. Leave blank for auto-detection

    PRESETS:                        "",                         // Configuration Presets to apply. See Presets Configuration

    // Full or relative URL of Media files to load
    CARTRIDGE1_URL:                 "",
    CARTRIDGE2_URL:                 "",
    DISKA_URL:                      "",                         // Image files
    DISKB_URL:                      "",
    HARDDISK_URL:                   "",
    DISKA_FILES_URL:                "",                         // File to load into a Disk. For several files, use a ZIP file
    DISKB_FILES_URL:                "",
    HARDDISK_FILES_URL:             "",
    TAPE_URL:                       "",
    STATE_URL:                      "",
    AUTODETECT_URL:                 "",

    // Forcing ROM formats
    CARTRIDGE1_FORMAT:              "",                         // Normal, ASCII8, ASCII16, Konami, KonamiSCC, KonamiSCCI, FMPAC, etc...
    CARTRIDGE2_FORMAT:              "",

    // BASIC loading/typing commands. Not needed for AUTOEXEC.BAS, AUTOEXEC.BAT or Tape Images
    BASIC_RUN:                      "",
    BASIC_LOAD:                     "",
    BASIC_BRUN:                     "",
    BASIC_BLOAD:                    "",
    BASIC_TYPE:                     "",
    BASIC_ENTER:                    "",

    // Boot Options
    BOOT_KEYS:                      "",                         // Keys to keep pressed at every boot, comma separated
    BOOT_KEYS_ONCE:                 "",                         // Same as above, but only on first boot (do not use both)
    BOOT_KEYS_FRAMES:               -1,                         // -1: auto; > 0: number of frames for Boot Keys
    FAST_BOOT:                       0,                         // 0: off; 1: auto (same as Boot Keys frames); > 1: number of frames for 10x speed at boot

    // NetPlay
    NETPLAY_JOIN:                   "",                         // Join NetPlay! Session automatically
    NETPLAY_NICK:                   "",                         // NetPlay! Nickname, optional

    // Internal Machine configuration
    BIOS_SLOT:                      [0],
    BIOSEXT_SLOT:                   [3, 1],
    CARTRIDGE1_SLOT:                [1],
    CARTRIDGE2_SLOT:                [2],
    EXPANSION_SLOTS:                [[2, 1], [2, 2]],
    RAMMAPPER_SIZE:                 512,                        // 64, 128, 256, 512, 1024, 2048, 4096: RAM Mapper size in KB
    EXTENSIONS:                     { },

    // General options
    VOL:                            1.0,                        // Master Volume factor
    SPEED:                          100,                        // Default emulation speed (in %)
    AUTO_START:                     true,
    AUTO_POWER_ON_DELAY:            1200,                       // -1: no auto Power-ON; >= 0: wait specified milliseconds before Power-ON
    MEDIA_CHANGE_DISABLED:          false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_ELEMENT_ID:              "wmsx-screen",
    SCREEN_FULLSCREEN_MODE:         -1,                         // -2: disabled; -1: auto; 0: off; 1: on (Full Screen); 2: on (Full Windowed)
    SCREEN_FILTER_MODE:             -3,                         // -3: user set (default auto); -2: browser default; -1: auto; 0..3: smoothing level
    SCREEN_CRT_SCANLINES:           -1,                         // -1: user set (default off); 0: off; 1..10: level
    SCREEN_CRT_PHOSPHOR:            -1,                         // -1: auto; 0: off; 1: on
    SCREEN_DEFAULT_SCALE:           -1,                         // -1: auto; 0.5..N in 0.05 steps: scale
    SCREEN_DEFAULT_ASPECT:          1.14,                       // in 0.01 steps
    SCREEN_CONTROL_BAR:             1,                          // 0: on hover; 1: always
    SCREEN_FORCE_HOST_NATIVE_FPS:   -1,                         // -1: auto. Don't change! :-)
    SCREEN_VSYNC_MODE:              -2,                         // -2: user set (default auto); -1: disabled; 0: off; 1: auto (on when available)
    AUDIO_MONITOR_BUFFER_BASE:      -3,                         // -3: user set (default auto); -2: disable audio; -1: auto; 0: browser default; 1..6: base value. More buffer = more delay
    AUDIO_MONITOR_BUFFER_SIZE:      -1,                         // -1: auto; 256, 512, 1024, 2048, 4096, 8192, 16384: buffer size.     More buffer = more delay. Don't change! :-)
    AUDIO_SIGNAL_BUFFER_RATIO:      2,                          // Internal Audio Signal buffer based on Monitor buffer
    AUDIO_SIGNAL_ADD_FRAMES:        3,                          // Additional frames in internal Audio Signal buffer based on Monitor buffer
    JOYSTICKS_MODE:                 0,                          // -1: disabled; 0: auto; 1: auto (swapped)
    JOYKEYS_MODE:                   -1,                         // -1: disabled; 0: enabled at port 1; 1: enabled at port 2; 2: enabled at both ports; 3: enabled at both ports (swapped)
    MOUSE_MODE:                     -1,                         // -1: disabled; 0: auto; 1: enabled at port 1; 2: enabled at port 2
    TOUCH_MODE:                     0,                          // -1: disabled; 0: auto; 1: enabled at port 1; 2: enabled at port 2
    CPU_TURBO_MODE:                 0,                          // -1: off; 0: auto (software activation); (0..8]: CPU clock multiplier; 1: 2x multiplier (backward compatibility)
    VDP_TURBO_MODE:                 0,                          // -1: off; 0: auto (software activation); 2..8: VDP Command Engine clock multiplier; 9: instantaneous
    CPU_SOFT_TURBO_MULTI:           2,                          // 1..8 CPU clock multiplier when in AUTO mode and activated by software
    VDP_SOFT_TURBO_MULTI:           4,                          // 1..9 VDP Command Engine clock multiplier when in AUTO mode and activated by software
    KEYBOARD_JAPAN_LAYOUT:          1,                          // 0: ANSI; 1: JIS
    DEBUG_MODE:                     0,                          // 0: off; 1..7: debug mode. Don't change! :-)
    SPRITES_DEBUG_MODE:             0,                          // 0: off; 1: unlimited; 2: no collisions; 3: both. May cause problems :-)
    ROM_MAX_HASH_SIZE_KB:           3072,                       // Maximum ROM size for Hash calculation
    HARDDISK_MIN_SIZE_KB:           720,                        // Minimum file size to be accepted as HardDisk image (besides all valid Floppy formats)
    MEGARAM_SIZE:                   2048,                       // 256, 512, 1024, 2048: MegaRAM size in KB
    DISK_ROM_START_PAGE:            0,                          // 0..1: Change starting page for ROMs > 16KB when format is DiskPatch
    LIGHT_STATES:                   true,

    PSG_VOL:                        "f",                        // 0..f (hex digit):       PSG Volume adjust. Set globally or for each channel (4 values)
    PSG_PAN:                        "8",                        // 0; 1..8..f (hex digit): PSG PanPot adjust. Set globally or for each channel (4 values)
    SCC_VOL:                        "f",                        // SCC Volume adjust. Same as above (5 values)
    SCC_PAN:                        "8",                        // SCC PanPot adjust. Same as above (5 values)
    OPLL_VOL:                       "f",                        // OPLL Volume adjust. Same as above (14 values)
    OPLL_PAN:                       "8",                        // OPLL PanPot adjust. Same as above (14 values)

    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "images/",
    PAGE_BACK_CSS:                  "",                         // CSS to modify page background color. Applied to the body element

    WEB_EXTENSIONS_SERVER:          "webmsx.herokuapp.com",     // Server address for NetPlay

    ALLOW_URL_PARAMETERS:           true                        // Allows user to override any of these parameters via URL query parameters

};

WMSX.MACHINES_CONFIG = {
    MSX2PP:   { desc: "MSX2++ Auto Detect",     autoType: 4 },
    MSX2P:    { desc: "MSX2+ Auto Detect",      autoType: 3 },
    MSX2:     { desc: "MSX2 Auto Detect",       autoType: 2 },
    MSX1:     { desc: "MSX Auto Detect",        autoType: 1 },
    MSX2PPA:  { desc: "MSX2++ America (NTSC)",  type: 4, presets: "_MSX2PPA", lang: "en" },
    MSX2PPE:  { desc: "MSX2++ Europe (PAL)",    type: 4, presets: "_MSX2PPE", lang: "en" },
    MSX2PPJ:  { desc: "MSX2++ Japan (NTSC)",    type: 4, presets: "_MSX2PPJ", lang: "ja" },
    MSX2PA:   { desc: "MSX2+ America (NTSC)",   type: 3, presets: "_MSX2PA",  lang: "en" },
    MSX2PE:   { desc: "MSX2+ Europe (PAL)",     type: 3, presets: "_MSX2PE",  lang: "en" },
    MSX2PJ:   { desc: "MSX2+ Japan (NTSC)",     type: 3, presets: "_MSX2PJ",  lang: "ja" },
    MSX2A:    { desc: "MSX2 America (NTSC)",    type: 2, presets: "_MSX2A",   lang: "en" },
    MSX2E:    { desc: "MSX2 Europe (PAL)",      type: 2, presets: "_MSX2E",   lang: "en" },
    MSX2J:    { desc: "MSX2 Japan (NTSC)",      type: 2, presets: "_MSX2J",   lang: "ja" },
    MSX1A:    { desc: "MSX America (NTSC)",     type: 1, presets: "_MSX1A",   lang: "en" },
    MSX1E:    { desc: "MSX Europe (PAL)",       type: 1, presets: "_MSX1E",   lang: "en" },
    MSX1J:    { desc: "MSX Japan (NTSC)",       type: 1, presets: "_MSX1J",   lang: "ja" },
    EMPTY2PP: { desc: "MSX2++ Barebone",        type: 4 },
    EMPTY2P:  { desc: "MSX2+ Barebone",         type: 3 },
    EMPTY2:   { desc: "MSX2 Barebone",          type: 2 },
    EMPTY:    { desc: "MSX Barebone",           type: 1 }
};

WMSX.EXTENSIONS_CONFIG = {
    HARDDISK:  { desc: "Hard Drive",    format: "Nextor16Patch", OP1_SLOT: [2, 3], OP2_SLOT: [3, 3], toggle: "DISK", change: { RAMMAPPER: 1 } },
    DISK:      { desc: "Floppy Drives", format: "DiskPatch",     OP1_SLOT: [2, 3], OP2_SLOT: [3, 3], toggle: "HARDDISK" },
    RAMMAPPER: { desc: "RAM Mapper",    format: "RAMMapper",     OP1_SLOT: [3],                      mutual: "RAMNORMAL" },
    RAMNORMAL: {                        format: "RAMNormal",     OP1_SLOT: [3],                      mutual: "RAMMAPPER" },
    KANJI:     { desc: "KANJI Fonts",   format: "Kanji1",        OP1_SLOT: [4, 0] },
    MSXMUSIC:  { desc: "MSX-MUSIC",     format: "MSXMUSIC",      OP1_SLOT: [3, 2] },
    OPL4:      { desc: "OPL4 Wave",     format: "MoonSound",     OP1_SLOT: [4, 1] },
    DOUBLEPSG: { desc: "Double PSG",    format: "ExtraPSG",      OP1_SLOT: [4, 2] },
    SCCI:      { desc: "Konami SCC+",   format: "SCCIExpansion", OP1_SLOT: [1],    OP2_SLOT: [2], change: { SCC:  0, PAC: 0, MEGARAM: 0 } },
    SCC:       {                        format: "SCCExpansion",  OP1_SLOT: [1],    OP2_SLOT: [2], change: { SCCI: 0, PAC: 0, MEGARAM: 0 } },
    PAC:       { desc: "PAC SRAM",      format: "PACExpansion",  OP1_SLOT: [1],    OP2_SLOT: [2], change: { SCCI: 0, SCC: 0, MEGARAM: 0 } },
    MEGARAM:   { desc: "MegaRAM",       format: "MegaRAM",       OP1_SLOT: [1],    OP2_SLOT: [2], change: { SCCI: 0, SCC: 0, PAC: 0 } }
};

WMSX.PRESETS_CONFIG = {

    // Extensions Options Presets. Should be specified in this order

    // Hard Disk: Nextor Removable Device
    HARDDISK:   { "EXTENSIONS.HARDDISK": 1, "EXTENSIONS.DISK": 2, _INCLUDE: "RAMMAPPER" },
    HARDDISKC:  { "EXTENSIONS.HARDDISK": 2, "EXTENSIONS.DISK": 1, _INCLUDE: "RAMMAPPER" },
    DOS2:       { "EXTENSIONS.HARDDISK": 1, "EXTENSIONS.DISK": 2, _INCLUDE: "RAMMAPPER" },
    NOHARDDISK: { "EXTENSIONS.HARDDISK": 0 },

    // Floppy Disk Drives
    DISK:     { "EXTENSIONS.DISK": 2 },
    DISKA:    { "EXTENSIONS.DISK": 1 },
    NODISK:   { "EXTENSIONS.DISK": 0 },

    // RAM type
    RAMMAPPER: { "EXTENSIONS.RAMMAPPER": 1, "EXTENSIONS.RAMNORMAL": 0 },
    RAMNORMAL: { "EXTENSIONS.RAMMAPPER": 0, "EXTENSIONS.RAMNORMAL": 1 },

    // Japanese character support
    KANJI:   { "EXTENSIONS.KANJI":  1 },
    NOKANJI: { "EXTENSIONS.KANJI":  0 },

    // Sound Devices
    MSXMUSIC:   { "EXTENSIONS.MSXMUSIC": 1 },
    NOMSXMUSIC: { "EXTENSIONS.MSXMUSIC": 0 },
    DOUBLEPSG:  { "EXTENSIONS.DOUBLEPSG": 1 },
    OPL4:       { "EXTENSIONS.OPL4": 1 },

    // Other Cartridge extensions

    SCCI:  { "EXTENSIONS.SCCI": 1 },
    SCCI2: { "EXTENSIONS.SCCI": 2 },

    SCC:  { "EXTENSIONS.SCC": 1 },
    SCC2: { "EXTENSIONS.SCC": 2 },

    PAC:  { "EXTENSIONS.PAC": 1 },
    PAC2: { "EXTENSIONS.PAC": 2 },

    MEGARAM:  { "EXTENSIONS.MEGARAM": 1 },
    MEGARAM2: { "EXTENSIONS.MEGARAM": 2 },

    // Configuration Helper Presets

    RAM128:      { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 128 },
    RAM256:      { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 256 },
    RAM512:      { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 512 },
    RAM1024:     { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 1024 },
    RAM2048:     { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 2048 },
    RAM4096:     { _INCLUDE: "RAMMAPPER", RAMMAPPER_SIZE: 4096 },
    NORAMMAPPER: { _INCLUDE: "RAMNORMAL"},

    MEGARAM256:  { _INCLUDE: "MEGARAM", MEGARAM_SIZE: 256 },
    MEGARAM512:  { _INCLUDE: "MEGARAM", MEGARAM_SIZE: 512 },
    MEGARAM1024: { _INCLUDE: "MEGARAM", MEGARAM_SIZE: 1024 },
    MEGARAM2048: { _INCLUDE: "MEGARAM", MEGARAM_SIZE: 2048 },

    VSYNCDISABLED: { SCREEN_VSYNC_MODE: -1 },
    VSYNCOFF:      { SCREEN_VSYNC_MODE: 0 },
    VSYNCON:       { SCREEN_VSYNC_MODE: 1 },

    PSGSTEREO:  { PSG_PAN: "4c8" },
    PSGSTEREO2: { PSG_PAN: "8c4" },
    SCCSTEREO:  { SCC_PAN: "8c4c4" },
    SCCSTEREO2: { PSG_PAN: "4c4c8" },
    OPLLSTEREO: { OPLL_PAN: "4c4c4c4c488888" },
    ALLSTEREO:  { _INCLUDE: "PSGSTEREO,  SCCSTEREO,  OPLLSTEREO" },
    ALLSTEREO2: { _INCLUDE: "PSGSTEREO2, SCCSTEREO2, OPLLSTEREO" },

    // Alternate Slot Configuration: try to keep RAM alone on Slot 3

    ALTSLOTCONFIG: {
        BIOSEXT_SLOT:                           [2, 1],
        EXPANSION_SLOTS:                        [[3, 2], [3, 3]],
        "EXTENSIONS_CONFIG.MSXMUSIC.OP1_SLOT":  [2, 2],
        "PRESETS_CONFIG.DISK":                  { "EXTENSIONS.DISK": 1 }
    },

    // MSX2++ Machine Presets. Do not use directly

    _MSX2PPA: {
        _INCLUDE:           "_MSX2PA, _MSX2PPBASE",
        BOOT_DURATION_AUTO: 165
    },
    _MSX2PPE: {
        _INCLUDE:           "_MSX2PE, _MSX2PPBASE",
        BOOT_DURATION_AUTO: 175
    },
    _MSX2PPJ: {
        _INCLUDE:           "_MSX2PJ, _MSX2PPBASE",
        BOOT_DURATION_AUTO: 165
    },
    _MSX2PPBASE: {
        _INCLUDE:           "HARDDISK, RAM1024",
        M_CPU_TURBO_MODE:     4,
        CPU_SOFT_TURBO_MULTI: 4,
        M_VDP_TURBO_MODE:     4,
        VDP_SOFT_TURBO_MULTI: 4
    },

    // MSX2+ Machine Presets. Do not use directly

    _MSX2PA: {
        _INCLUDE:           "_MSX2PBASE",
        BIOS_URL:           "@MSX2P_NTSC.bios",
        BIOSEXT_URL:        "@MSX2PEXT_NTSC.bios | @[KanjiBasic].bios",
        BOOT_DURATION_AUTO: 380
    },
    _MSX2PE: {
        _INCLUDE:           "_MSX2PBASE",
        BIOS_URL:           "@MSX2P_PAL.bios",
        BIOSEXT_URL:        "@MSX2PEXT_PAL.bios | @KanjiBasic_PAL.bios",
        BOOT_DURATION_AUTO: 395
    },
    _MSX2PJ: {
        _INCLUDE:           "_MSX2PBASE, KANJI",
        BIOS_URL:           "@MSX2P_JAP.bios",
        BIOSEXT_URL:        "@MSX2PEXT_JAP.bios | @[KanjiBasic].bios",
        BOOT_DURATION_AUTO: 380
    },
    _MSX2PBASE: {
        _INCLUDE:           "_MSX2BASE",
        MSX2P:              true
    },

    // MSX2 Machine Presets. Do not use directly

    _MSX2A: {
        _INCLUDE:           "_MSX2BASE",
        BIOS_URL:           "@MSX2_NTSC.bios",
        BIOSEXT_URL:        "@MSX2EXT_NTSC.bios",
        BOOT_DURATION_AUTO: 385
    },
    _MSX2E: {
        _INCLUDE:           "_MSX2BASE",
        BIOS_URL:           "@MSX2_PAL.bios",
        BIOSEXT_URL:        "@MSX2EXT_PAL.bios",
        BOOT_DURATION_AUTO: 400
    },
    _MSX2J: {
        _INCLUDE:           "_MSX2BASE, KANJI",
        BIOS_URL:           "@MSX2_JAP.bios",
        BIOSEXT_URL:        "@MSX2EXT_JAP.bios | @[KanjiBasic].bios",
        BOOT_DURATION_AUTO: 360
    },
    _MSX2BASE: {
        _INCLUDE:           "_BASE, RAM512, MSXMUSIC",
        MSX2:               true
    },

    // MSX1 Machine Presets. Do not use directly

    _MSX1A: {
        _INCLUDE:           "_MSX1BASE",
        BIOS_URL:           "@MSX1_NTSC.bios",
        BOOT_DURATION_AUTO: 375
    },
    _MSX1E: {
        _INCLUDE:           "_MSX1BASE",
        BIOS_URL:           "@MSX1_PAL.bios",
        BOOT_DURATION_AUTO: 375
    },
    _MSX1J: {
        _INCLUDE:           "_MSX1BASE",
        BIOS_URL:           "@MSX1_JAP.bios",
        BOOT_DURATION_AUTO: 230
    },
    _MSX1BASE: {
        _INCLUDE:           "_BASE, NOMSXMUSIC, NOHARDDISK",
        BIOSEXT_URL:        "@[Empty].rom"
    },

    // Base Machines Presets. Do not use directly

    _BASE: {
        _INCLUDE:           "RAMNORMAL, DISK, NOKANJI",
        M_CPU_TURBO_MODE:   0,
        M_VDP_TURBO_MODE:   0,
        MSX2:               false,
        MSX2P:              false
    }

};

wmsx = window.wmsx || {};           // Namespace
