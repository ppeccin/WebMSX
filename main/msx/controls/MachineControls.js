// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MachineControls = {

    JOY0_UP: 11, JOY0_DOWN: 12, JOY0_LEFT: 13, JOY0_RIGHT: 14, JOY0_BUTTON1: 15, JOY0_BUTTON2: 16,
    JOY1_UP: 21, JOY1_DOWN: 22, JOY1_LEFT: 23, JOY1_RIGHT: 24, JOY1_BUTTON1: 25, JOY1_BUTTON2: 26,
    PADDLE0_POSITION: 31, PADDLE1_POSITION: 41,		// Position from 380 (Left) to 190 (Center) to 0 (Right); -1 = disconnected, won't charge POTs
    PADDLE0_BUTTON: 35, PADDLE1_BUTTON: 45,

    POWER: 51, RESET: 52, POWER_OFF: 53, POWER_FRY: 54,

    DEBUG: 101, TRACE: 102, PAUSE: 103, FRAME: 104, FAST_SPEED: 105, SLOW_SPEED: 106,

    SPRITE_MODE: 107, PALETTE: 108, VIDEO_STANDARD: 112,

    DEFAULTS: 120,

    SAVE_STATE_0: {to: 0}, SAVE_STATE_1: {to: 1}, SAVE_STATE_2: {to: 2}, SAVE_STATE_3: {to: 3}, SAVE_STATE_4: {to: 4}, SAVE_STATE_5: {to: 5},
    SAVE_STATE_6: {to: 6}, SAVE_STATE_7: {to: 7}, SAVE_STATE_8: {to: 8}, SAVE_STATE_9: {to: 9}, SAVE_STATE_10: {to: 10}, SAVE_STATE_11: {to: 11}, SAVE_STATE_12: {to: 12},
    LOAD_STATE_0: {from: 0}, LOAD_STATE_1: {from: 1}, LOAD_STATE_2: {from: 2}, LOAD_STATE_3: {from: 3}, LOAD_STATE_4: {from: 4}, LOAD_STATE_5: {from: 5},
    LOAD_STATE_6: {from: 6}, LOAD_STATE_7: {from: 7}, LOAD_STATE_8: {from: 8}, LOAD_STATE_9: {from: 9}, LOAD_STATE_10: {from: 10}, LOAD_STATE_11: {from: 11}, LOAD_STATE_12: {from: 12},

    SAVE_STATE_FILE: 201,

    IGNORED: 999

};
