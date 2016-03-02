// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// WebMSX version 2.0

// Main Emulator parameters.
// You may change any of these after loading the project and before starting the Emulator
// Also possible to override values dynamically via URL query parameters

WMSX = {

    PRESETS:                        "",                         // Machine configuration presets to apply, comma separated. Overwrites parameters below and DEFAULT preset

    CARTRIDGE1_URL:                 "",                         // Full or relative URL of Media files to load
    CARTRIDGE2_URL:                 "",
    DISKA_URL:                      "",
    DISKB_URL:                      "",
    TAPE_URL:                       "",
    STATE_LOAD_URL:                 "",

    MACHINE_TYPE:                   2,                          // 1 for MSX1, 2 for MSX2
    RAM_SIZE:                       64,                         // 64, 128, 256, 512, 1024, 2048, 4096 KB Main RAM (fixed in 64KB for MSX1)
    AUTO_START_DELAY:               2400,                       // Negative = No Auto-Start, Positive = Start then wait specified milliseconds before Power-on
    MEDIA_CHANGE_DISABLED:          false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    SCREEN_ELEMENT_ID:              "wmsx-screen",
    SCREEN_FILTER_MODE:             1,                          // 0..3
    SCREEN_CRT_MODE:                1,                          // 0..1
    SCREEN_DEFAULT_SCALE:           1,                          // 0.5 .. N, 0.125 steps
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover
    SCREEN_MSX1_COLOR_MODE:         0,                          // 0..5
    SCREEN_FORCE_HOST_NATIVE_FPS:   -1,                         // Set 60 or 50 to force value. -1 = Autodetect. Don't change! :-)
    SCREEN_VSYNCH_MODE:             1,                          // 0 = disabled, 1 = auto (when matches), 2 = forced
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192. 0 = disable. More buffer = more delay
    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "wmsx/images/",

    ALLOW_URL_PARAMETERS:           false,                      // Allows user to override any of these parameters via URL query parameters

    VERSION:                        "2.0"                       // Don't change!

};

wmsx = window.wmsx || {};           // Namespace for all classes and objects