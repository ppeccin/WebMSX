// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// You may change any of these after loading the project and before starting the Emulator

MSX = {

    VERSION:                        "version 0.1",              // Don't change this one!

    BIOS_AUTO_LOAD_URL:             "",                         // Full or relative URL of BIOS
    ROM_AUTO_LOAD_URL:              "",                         // Full or relative URL of ROM
    AUTO_START:                     true,                       // Set false to start emulator manually with MSX.start()
    SCREEN_ELEMENT_ID:              "msx-screen",
    CONSOLE_PANEL_ELEMENT_ID:       "msx-console-panel",
    CARTRIDGE_CHANGE_DISABLED:      false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    CARTRIDGE_LABEL_COLORS:         "",                         // Space-separated colors for Label, Background, Border. e.g. "#f00 #000 transparent". Leave "" for defaults
    PADDLES_MODE:                   -1,                         // -1 = auto, 0 = off, 1 = 0n
    SCREEN_CRT_MODE:                -1,                         // -1 = auto, 0 .. 4 = mode
    SCREEN_OPENING_SIZE:            2,                          // 1 .. 4
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover, 2 = Original Javatari
    SCREEN_NATURAL_FPS:             60,                         // 60, 50 fps
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192. More buffer = more delay
    IMAGES_PATH:                    window.MSX_IMAGES_PATH || "msx/"

};

//jt = window.jt || {};
