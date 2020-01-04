// WebMSX version 6.0.98
// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// May be overridden dynamically by JS code, external Config File or URL query parameters

WMSX = {

    // Main Setup
    ENVIRONMENT:                     0,                         // 0: Default Emulator Environment. 1..99: Custom User Environment
    CONFIG_URL:                     "",                         // Configuration file to merge. Processed before URL parameters
    MACHINE:                        "",                         // Machine Type. See Machine Configuration. Leave blank for auto-detection
    PRESETS:                        "",                         // Configuration Presets to apply. See Presets Configuration

    // Full or relative URL of Media files to load
    CARTRIDGE1_URL:                 "",                         // ROM file
    CARTRIDGE2_URL:                 "",
    DISKA_URL:                      "",                         // Disk Image file
    DISKB_URL:                      "",
    HARDDISK_URL:                   "",
    DISKA_FILES_URL:                "",                         // File to load into a Disk. For several files, use a ZIP file
    DISKB_FILES_URL:                "",
    HARDDISK_FILES_URL:             "",
    TAPE_URL:                       "",                         // Disk Image file
    STATE_URL:                      "",                         // Save State file
    AUTODETECT_URL:                 "",                         // Open any file in auto-detect mode

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
    BIOS_SLOT:                      [0],                        // Slot to use when loading ROM of type
    CARTRIDGE1_SLOT:                [1],
    CARTRIDGE2_SLOT:                [2],
    EXPANSION1_SLOT:                [2, 1],
    EXPANSION2_SLOT:                [2, 2],
    BIOSEXT_SLOT:                   [3, 1],
    RAMMAPPER_SIZE:                 512,                        // 64, 128, 256, 512, 1024, 2048, 4096: RAM Mapper size in KB when active
    RAMNORMAL_SIZE:                 64,                         // 16..64: Normal RAM size in KB when active
    MEGARAM_SIZE:                   2048,                       // 256, 512, 1024, 2048: MegaRAM size in KB
    EXTENSIONS:                     { },                        // Extensions active. See Extensions Configuration. Use Presets to activate/deactivate
    RTC_ACTIVE:                     -1,                         // -1: auto; 0: not present; 1: present
    VDP_TYPE:                       -1,                         // -1: auto; 1: V9918; 2: V9938; 3: V9958
    VDP_PALETTE:                    2,                          // 0: WebMSX Original; 1: V9918; 2: V9928; 3: V9938; 4: Toshiba; 5: Fujitsu FM-X

    // General options
    VOL:                            1.0,                        // Master Volume factor
    SPEED:                          100,                        // Default emulation speed (in %)
    AUTO_START:                     true,
    AUTO_POWER_ON_DELAY:            1200,                       // -1: no auto Power-ON; >= 0: wait specified milliseconds before Power-ON
    MEDIA_CHANGE_DISABLED:          false,                      // Prevents user form changing Machine Type, Extensions and Medias (Disks, Carts, Tapes)
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
    SCREEN_VIDEO_OUT:               -1,                         // -1: auto; 0: Internal VDP; 1: External V9990; 2: Superimposed; 3: Mixed
    SCREEN_COLORS:                  0,                          // 0: Color (default); 1: B&W; 2: Green Phosphor; 3: Amber Phosphor
    AUDIO_MONITOR_BUFFER_BASE:      -3,                         // -3: user set (default auto); -2: disable audio; -1: auto; 0: browser default; 1..6: base value. More buffer = more delay
    AUDIO_MONITOR_BUFFER_SIZE:      -1,                         // -1: auto; 256, 512, 1024, 2048, 4096, 8192, 16384: buffer size.     More buffer = more delay. Don't change! :-)
    AUDIO_SIGNAL_BUFFER_RATIO:      2,                          // Internal Audio Signal buffer based on Monitor buffer
    AUDIO_SIGNAL_ADD_FRAMES:        3,                          // Additional frames in internal Audio Signal buffer based on Monitor buffer
    JOYSTICKS_MODE:                 0,                          // -1: disabled; 0: auto; 1: auto (swapped)
    JOYKEYS_MODE:                   -1,                         // -1: disabled; 0: enabled at port 1; 1: enabled at port 2; 2: enabled at both ports; 3: enabled at both ports (swapped)
    MOUSE_MODE:                     -1,                         // -1: disabled; 0: auto; 1: enabled at port 1; 2: enabled at port 2
    TOUCH_MODE:                     0,                          // -1: disabled; 0: auto; 1: enabled at port 1; 2: enabled at port 2
    R800_CLOCK_MODE:                0,                          // 0: auto (soft-turbo possible); (0..2]: R800 CPU clock multiplier;
    R800_TIMING:                    1,                          // 0: off, 1: on; 2: VDP waits only. Precise R800/S1990 timings. Turn off for faster and lighter emulation
    Z80_CLOCK_MODE:                 0,                          // 0: auto (soft-turbo possible); (0..8]: Z80 CPU clock multiplier;
    VDP_CLOCK_MODE:                 0,                          // 0: auto (soft-turbo possible); (0..8]: VDP Command Engine clock multiplier; 9: instantaneous
    Z80_SOFT_TURBO_MULTI:           1.5,                        // 1..8 Z80 CPU clock multiplier when in AUTO mode and activated by software or CPU_SOFT_TURBO_AUTO_ON
    VDP_SOFT_TURBO_MULTI:           1,                          // 1..9 VDP Command Engine clock multiplier when in AUTO mode and activated by software or CPU_SOFT_TURBO_AUTO_ON
    CPU_SOFT_TURBO_AUTO_ON:         0,                          // 0: off, 1: on. Automatically activates the CPU Soft Turbo when supported by machine
    CPU_FAKE_TR_TURBO:              -1,                         // -1: auto; 0: off; 1: on. Simulated tR CHGCPU Turbo activation. Auto ON for 2+, never for tR
    CPU_PANA_TURBO:                 -1,                         // -1: auto; 0: off; 1: on. Simulated Panasonic Turbo activation. Auto ON for 2+, never for tR
    KEYBOARD_JAPAN_LAYOUT:          1,                          // 0: ANSI; 1: JIS
    DEBUG_MODE:                     0,                          // 0: off; 1..7: debug mode. Don't change! :-)
    SPRITES_DEBUG_MODE:             0,                          // 0: off; 1: unlimited; 2: no collisions; 3: both. May cause problems :-)
    ROM_MAX_HASH_SIZE_KB:           4096,                       // Maximum ROM size for Hash calculation
    HARDDISK_MIN_SIZE_KB:           720,                        // Minimum file size to be accepted as HardDisk image (besides all valid Floppy formats)
    DISK_ROM_START_PAGE:            0,                          // 0..1: Change starting page for ROMs > 16KB when format is DiskPatch
    LIGHT_STATES:                   true,

    PSG_VOL:                        "f",                        // 0..f (hex digit):       PSG Volume adjust. Set globally or for each channel (4 values)
    PSG_PAN:                        "8",                        // 0; 1..8..f (hex digit): PSG PanPot adjust. Set globally or for each channel (4 values)
    SCC_VOL:                        "f",                        // SCC Volume adjust. Same as above (5 values)
    SCC_PAN:                        "8",                        // SCC PanPot adjust. Same as above (5 values)
    OPLL_VOL:                       "f",                        // OPLL Volume adjust. Same as above (14 values)
    OPLL_PAN:                       "8",                        // OPLL PanPot adjust. Same as above (14 values)

    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "images/",
    FILE_SEPARATOR_REGEX:           /[\\/?:]/,
    PAGE_BACK_CSS:                  "",                         // CSS to modify page background color. Applied to the body element

    WEB_EXTENSIONS_SERVER:          "webmsx.herokuapp.com",     // Server address for NetPlay!

    STATE_VERSION:                  600,
    STATE_VERSIONS_ACCEPTED:        { 9: true, 50: true, 51: true, 511: true, 520: true, 530: true, 600: true },

    ALLOW_URL_PARAMETERS:           true                        // Allows user to override any of these parameters via URL query parameters

};

WMSX.MACHINES_CONFIG = {
    MSXTR:   { DESCX: "MSX turbo R Auto Detect",    AUTO_TYPE: 4 },
    MSX2P:   { DESCX: "MSX2+ Auto Detect",          AUTO_TYPE: 3 },
    MSX2:    { DESCX: "MSX2 Auto Detect",           AUTO_TYPE: 2 },
    MSX1:    { DESCX: "MSX Auto Detect",            AUTO_TYPE: 1 },
    MSXTRA:  { DESC:  "MSX turbo R America (NTSC)", TYPE: 4, PRESETS: "_MSXTRA" },
    MSXTRE:  { DESC:  "MSX turbo R Europe (PAL)",   TYPE: 4, PRESETS: "_MSXTRE" },
    MSXTRJ:  { DESC:  "MSX turbo R Japan (NTSC)",   TYPE: 4, PRESETS: "_MSXTRJ",  LANG: "ja" },
    MSX2PA:  { DESC:  "MSX2+ America (NTSC)",       TYPE: 3, PRESETS: "_MSX2PA" },
    MSX2PE:  { DESC:  "MSX2+ Europe (PAL)",         TYPE: 3, PRESETS: "_MSX2PE" },
    MSX2PJ:  { DESC:  "MSX2+ Japan (NTSC)",         TYPE: 3, PRESETS: "_MSX2PJ",  LANG: "ja" },
    MSX2A:   { DESC:  "MSX2 America (NTSC)",        TYPE: 2, PRESETS: "_MSX2A" },
    MSX2E:   { DESC:  "MSX2 Europe (PAL)",          TYPE: 2, PRESETS: "_MSX2E" },
    MSX2J:   { DESC:  "MSX2 Japan (NTSC)",          TYPE: 2, PRESETS: "_MSX2J",   LANG: "ja" },
    MSX1A:   { DESC:  "MSX America (NTSC)",         TYPE: 1, PRESETS: "_MSX1A" },
    MSX1E:   { DESC:  "MSX Europe (PAL)",           TYPE: 1, PRESETS: "_MSX1E" },
    MSX1J:   { DESC:  "MSX Japan (NTSC)",           TYPE: 1, PRESETS: "_MSX1J",   LANG: "ja" },
    EMPTYTR: { DESCX: "MSX2 turbo R Empty (NTSC)",  TYPE: 4, PRESETS: "_EMPTY" },
    EMPTY2P: { DESCX: "MSX2+ Empty (NTSC)",         TYPE: 3, PRESETS: "_EMPTY" },
    EMPTY2:  { DESCX: "MSX2 Empty (NTSC)",          TYPE: 2, PRESETS: "_EMPTY" },
    EMPTY1:  { DESCX: "MSX Empty (NTSC)",           TYPE: 1, PRESETS: "_EMPTY" }
};

WMSX.EXTENSIONS_CONFIG = {
    HARDDISK:  { DESC: "Hard Drive",    URL: "@[Nextor16Patch].rom", SLOT: [2, 3], SLOT2: [3, 2], TOGGLE: "DISK", CHANGE: { RAMMAPPER: 1 } },
    DISK:      { DESC: "Floppy Drives", URL: "@[DiskPatch].rom",     SLOT: [2, 3], SLOT2: [3, 2], TOGGLE: "HARDDISK" },
    RAMMAPPER: { DESC: "RAM Mapper",    URL: "@[RAMMapper].rom",     SLOT: [3],                   MUTUAL: "RAMNORMAL" },
    RAMNORMAL: {                        URL: "@[RAMNormal].rom",     SLOT: [3],                   MUTUAL: "RAMMAPPER" },
    KANJI:     { DESC: "Kanji Support", URL: "@[Kanji1].rom",        SLOT: [4, 0],                BOUND:  [ "KANJIDRV", "MSXJE" ] },
    KANJIDRV:  {                        URL: "@KanjiBasicOnly.bios", SLOT: [2, 1] },
    MSXJE:     {                        URL: "@[MSXJE].rom",         SLOT: [2, 2] },
    V9990:     { DESC: "V9990 Video",   URL: "@[V9990].rom",         SLOT: [4, 3] },
    MSXMUSIC:  { DESC: "MSX-MUSIC",     URL: "@[MSXMUSIC].rom",      SLOT: [3, 3],                BOUND:  [ "MSXMUSICX" ] },
    MSXMUSICX: {                        URL: "",                     SLOT: [0, 2] },
    OPL4:      { DESC: "OPL4 Wave",     URL: "@[OPL4].rom",          SLOT: [4, 1] },
    DOUBLEPSG: { DESC: "Double PSG",    URL: "@[ExtraPSG].rom",      SLOT: [4, 2] },
    SCCI:      { DESC: "Konami SCC+",   URL: "@[SCCIExpansion].rom", SLOT: [1],    SLOT2: [2], CHANGE: { SCC:  0, PAC: 0, MEGARAM: 0 } },
    SCC:       {                        URL: "@[SCCExpansion].rom",  SLOT: [1],    SLOT2: [2], CHANGE: { SCCI: 0, PAC: 0, MEGARAM: 0 } },
    PAC:       { DESC: "PAC SRAM",      URL: "@[PACExpansion].rom",  SLOT: [1],    SLOT2: [2], CHANGE: { SCCI: 0, SCC: 0, MEGARAM: 0 } },
    MEGARAM:   { DESC: "MegaRAM",       URL: "@[MegaRAM].rom",       SLOT: [1],    SLOT2: [2], CHANGE: { SCCI: 0, SCC: 0, PAC: 0 } }
};

WMSX.PRESETS_CONFIG = {

    // Extensions Options Presets. Must be specified in this order

    // Hard Disk: Nextor Removable Device
    HARDDISK:   { "EXTENSIONS.HARDDISK": 1 },
    HARDDISKC:  { "EXTENSIONS.HARDDISK": 2 },
    DOS2:       { "EXTENSIONS.HARDDISK": 1 },
    NOHARDDISK: { "EXTENSIONS.HARDDISK": 0 },

    // Floppy Disk Drives
    DISK:      { "EXTENSIONS.DISK": 2 },
    DISKA:     { "EXTENSIONS.DISK": 1 },
    NODISK:    { "EXTENSIONS.DISK": 0 },

    // RAM type
    RAMMAPPER: { "EXTENSIONS.RAMMAPPER": 1 },
    RAMNORMAL: { "EXTENSIONS.RAMMAPPER": 0 },

    // Japanese character support
    KANJI:   { "EXTENSIONS.KANJI":  1 },
    NOKANJI: { "EXTENSIONS.KANJI":  0 },
    NOMSXJE: { "EXTENSIONS_CONFIG.MSXJE.URL": "" },

    // V9990 Video
    V9990: { "EXTENSIONS.V9990":  1 },

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

    // Boosted Machine Preset
    BOOSTED: { Z80_CLOCK_MODE: 3, VDP_CLOCK_MODE: 3, BOOT_DURATION_AUTO: 165, _INCLUDE: "HARDDISK" },

    // Special Machine-defined modifications to Extensions
    DISKEXTN:    { "EXTENSIONS_CONFIG.DISK.URL": "@[DiskPatch].rom" },
    DISKEXTTR:   { "EXTENSIONS_CONFIG.DISK.URL": "@[DiskPatchDOS2TR].rom" },
    MSXMUSEXTN:  { "EXTENSIONS_CONFIG.MSXMUSIC.URL": "@[MSXMUSIC].rom",   "EXTENSIONS_CONFIG.MSXMUSIC.SLOT": [3, 3], "EXTENSIONS_CONFIG.MSXMUSICX.SLOT": [0, 2] },
    MSXMUSEXTTR: { "EXTENSIONS_CONFIG.MSXMUSIC.URL": "@[MSXMUSIC]TR.rom", "EXTENSIONS_CONFIG.MSXMUSIC.SLOT": [0, 2], "EXTENSIONS_CONFIG.MSXMUSICX.SLOT": [3, 3] },
    KANJIDRVN:   { "EXTENSIONS_CONFIG.KANJI.BOUND": [ "KANJIDRV", "MSXJE" ] },
    KANJIDRVP:   { "EXTENSIONS_CONFIG.KANJI.BOUND": [ "MSXJE" ], "EXTENSIONS.KANJIDRV": 0 },
    RAMN:        { "RAMMAPPER_SIZE": 512 },
    RAMTR:       { "RAMMAPPER_SIZE": 1024 },

    // Alternate Slot Configuration: try to keep RAM alone on primary Slot 3
    ALTSLOTCONFIG: {
        EXPANSION1_SLOT:                   [3, 2],
        EXPANSION2_SLOT:                   [3, 3],
        "PRESETS_CONFIG.DISK":             { "EXTENSIONS.DISK": 1 },
        "PRESETS_CONFIG.MSXMUSEXTN":       { "EXTENSIONS_CONFIG.MSXMUSIC.URL": "@[MSXMUSIC].rom",   "EXTENSIONS_CONFIG.MSXMUSIC.SLOT": [2, 2], "EXTENSIONS_CONFIG.MSXMUSICX.SLOT": [0, 2] },
        "PRESETS_CONFIG.MSXMUSEXTTR":      { "EXTENSIONS_CONFIG.MSXMUSIC.URL": "@[MSXMUSIC]TR.rom", "EXTENSIONS_CONFIG.MSXMUSIC.SLOT": [0, 2], "EXTENSIONS_CONFIG.MSXMUSICX.SLOT": [2, 2] },
        "EXTENSIONS_CONFIG.KANJIDRV.SLOT": [2, 1],
        "EXTENSIONS_CONFIG.MSXJE.SLOT":    [3, 3]
    },

    // MSX2 tR Machine Presets. Do not use directly
    _MSXTRA: {
        _INCLUDE:           "_MSXTRBASE",
        SLOT00_URL:         "@MSXTR_NTSC.bios",
        SLOT03_URL:         "@MSXTROPEN_NTSC.bios", SLOT03_FORMAT: "PlainROM", SLOT03_START: "0x4000",
        SLOT31_URL:         "@MSXTREXT_NTSC.bios | @KanjiBasicOnly.bios",
        BOOT_DURATION_AUTO: 380
    },
    _MSXTRE: {
        _INCLUDE:           "_MSXTRBASE",
        SLOT00_URL:         "@MSXTR_PAL.bios",
        SLOT03_URL:         "@MSXTROPEN_PAL.bios", SLOT03_FORMAT: "PlainROM", SLOT03_START: "0x4000",
        SLOT31_URL:         "@MSXTREXT_PAL.bios | @KanjiBasicOnly.bios",
        BOOT_DURATION_AUTO: 380
    },
    _MSXTRJ: {
        _INCLUDE:           "_MSXTRBASE, KANJI",
        SLOT00_URL:         "@MSXTR_JAP.bios",
        SLOT03_URL:         "@MSXTROPEN_NTSC.bios", SLOT03_FORMAT: "PlainROM", SLOT03_START: "0x4000",
        SLOT31_URL:         "@MSXTREXT_JAP.bios | @KanjiBasicOnly.bios",
        BOOT_DURATION_AUTO: 380
    },
    _MSXTRBASE: {
        _INCLUDE:           "_MSX2BASE, DISKEXTTR, MSXMUSEXTTR, KANJIDRVP, RAMTR"
    },

    // MSX2+ Machine Presets. Do not use directly
    _MSX2PA: {
        _INCLUDE:           "_MSX2PBASE",
        SLOT0P_URL:         "@MSX2P_NTSC.bios",
        SLOT31_URL:         "@MSX2PEXT_NTSC.bios | @KanjiBasic2PLogo_NTSC.bios",
        BOOT_DURATION_AUTO: 380
    },
    _MSX2PE: {
        _INCLUDE:           "_MSX2PBASE",
        SLOT0P_URL:         "@MSX2P_PAL.bios",
        SLOT31_URL:         "@MSX2PEXT_PAL.bios | @KanjiBasic2PLogo_PAL.bios",
        BOOT_DURATION_AUTO: 395
    },
    _MSX2PJ: {
        _INCLUDE:           "_MSX2PBASE, KANJI",
        SLOT0P_URL:         "@MSX2P_JAP.bios",
        SLOT31_URL:         "@MSX2PEXT_JAP.bios | @KanjiBasic2PLogo_NTSC.bios",
        BOOT_DURATION_AUTO: 380
    },
    _MSX2PBASE: {
        _INCLUDE:           "_MSX2BASE, KANJIDRVP"
    },

    // MSX2 Machine Presets. Do not use directly
    _MSX2A: {
        _INCLUDE:           "_MSX2BASE",
        SLOT0P_URL:         "@MSX2_NTSC.bios",
        SLOT31_URL:         "@MSX2EXT_NTSC.bios",
        BOOT_DURATION_AUTO: 385
    },
    _MSX2E: {
        _INCLUDE:           "_MSX2BASE",
        SLOT0P_URL:         "@MSX2_PAL.bios",
        SLOT31_URL:         "@MSX2EXT_PAL.bios",
        BOOT_DURATION_AUTO: 400
    },
    _MSX2J: {
        _INCLUDE:           "_MSX2BASE, KANJI",
        SLOT0P_URL:         "@MSX2_JAP.bios",
        SLOT31_URL:         "@MSX2EXT_JAP.bios",
        BOOT_DURATION_AUTO: 360
    },
    _MSX2BASE: {
        _INCLUDE:           "_BASE, RAMMAPPER, DISK, MSXMUSIC, NOKANJI"
    },

    // MSX1 Machine Presets. Do not use directly
    _MSX1A: {
        _INCLUDE:           "_MSX1BASE",
        SLOT0P_URL:         "@MSX1_NTSC.bios",
        BOOT_DURATION_AUTO: 375
    },
    _MSX1E: {
        _INCLUDE:           "_MSX1BASE",
        SLOT0P_URL:         "@MSX1_PAL.bios",
        BOOT_DURATION_AUTO: 375
    },
    _MSX1J: {
        _INCLUDE:           "_MSX1BASE",
        SLOT0P_URL:         "@MSX1_JAP.bios",
        BOOT_DURATION_AUTO: 230
    },
    _MSX1BASE: {
        _INCLUDE:           "_BASE, RAMNORMAL, DISK, NOHARDDISK, NOMSXMUSIC, NOKANJI",
        SLOT31_URL :        ""       // MSX1 has no BIOS Extension on slot 3-1, clear
    },

    // Base Machines Presets. Do not use directly
    _EMPTY: {
        _INCLUDE:           "_BASE",
        EXTENSIONS:         { },
        SLOT0P_URL:         "",
        SLOT1P_URL:         "",
        SLOT2P_URL:         "",
        SLOT3P_URL:         "",
        SLOT4P_URL:         ""      // Special Device I/O only slot
    },
    _BASE: {
        _INCLUDE:           "DISKEXTN, MSXMUSEXTN, KANJIDRVN, RAMN"
    }

};

WMSX.params = {};                   // Additional parameter overrides

wmsx = window.wmsx || {};           // Namespace
