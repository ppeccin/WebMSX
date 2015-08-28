// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// WebMSX version 0.9

// Main Emulator parameters.
// You may change any of these after loading the project and before starting the Emulator

WMSX = {

    BIOS_AUTO_LOAD_URL:             "",                         // Full or relative URL of BIOS
    CART1_AUTO_LOAD_URL:            "",                         // Full or relative URL of ROM (Cartridge 1)
    TAPE_AUTO_LOAD_URL:             "",                         // Full or relative URL of TAPE
    AUTO_START_DELAY:               1200,                       // Negative = No Auto-Start, Positive = Start then wait specified milliseconds before Auto-Load/Power-on
    SCREEN_ELEMENT_ID:              "wmsx-screen",
    CONSOLE_PANEL_ELEMENT_ID:       "wmsx-console-panel",
    CARTRIDGE_CHANGE_DISABLED:      false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    SCREEN_FILTER_MODE:             1,                          // 0..3
    SCREEN_CRT_MODE:                -1,                         // 0..4, -1 = auto
    SCREEN_OPENING_SIZE:            2.5,                        // 1..4, 0.5 steps
    SCREEN_SHARP_SIZE:              2,                          // 1..4. Don't change! :-)
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover, 2 = Original Javatari
    SCREEN_NATURAL_FPS:             60,                         // 60, 50 fps. Don't change! :-)
    SCREEN_COLOR_MODE:              0,                          // 0..5
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192. 0 = disable. More buffer = more delay
    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "wmsx/",

    VERSION:                        "version 0.9"               // Don't change!

};

wmsx = window.wmsx || {};           // Namespace for all classes and objects
