// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// You may change any of these after loading the project and before starting the Emulator

WMSX = {

    VERSION:                        "version 0.1",              // Don't change this one!

    BIOS_AUTO_LOAD_URL:             "",                         // Full or relative URL of BIOS
    ROM_AUTO_LOAD_URL:              "",                         // Full or relative URL of ROM  (Cartridge A)
    TAPE_AUTO_LOAD_URL:             "",                         // Full or relative URL of TAPE
    AUTO_START:                     true,                       // Set false to start emulator manually with MSX.start()
    SCREEN_ELEMENT_ID:              "msx-screen",
    CONSOLE_PANEL_ELEMENT_ID:       "msx-console-panel",
    CARTRIDGE_CHANGE_DISABLED:      false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    SCREEN_FILTER_MODE:             1,                          // 0..3
    SCREEN_CRT_MODE:                -1,                         // -1 = auto, 0 .. 4 = mode
    SCREEN_OPENING_SIZE:            2.5,                        // 1 .. 4, 0.5 steps
    SCREEN_SHARP_SIZE:              2,                          // 1 .. 4. Don't change! :-)
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover, 2 = Original Javatari
    SCREEN_NATURAL_FPS:             60,                         // 60, 50 fps
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192. More buffer = more delay
    IMAGES_PATH:                    window.WMSX_IMAGES_PATH || "msx/"

};

wmsx = window.wmsx || {};           // Namespace for all classes and objects
