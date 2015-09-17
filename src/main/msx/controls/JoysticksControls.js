// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.JoysticksControls = {

    // Control codes define which bit to set in PSG register 14 (16 bits used to store values for 2 Joysticks)
    JOY1_UP: 0x0001, JOY1_DOWN: 0x0002, JOY1_LEFT: 0x0004, JOY1_RIGHT: 0x0008, JOY1_BUTTON1: 0x0010, JOY1_BUTTON2: 0x0020,
    JOY2_UP: 0x0100, JOY2_DOWN: 0x0200, JOY2_LEFT: 0x0400, JOY2_RIGHT: 0x1000, JOY2_BUTTON1: 0x1000, JOY2_BUTTON2: 0x2000,

    // Position from 380 (Left) to 190 (Center) to 0 (Right); -1 = disconnected, won't charge POTs
    PADDLE1_POSITION: 0x10001, PADDLE1_BUTTON1: 0x10002, PADDLE1_BUTTON2: 0x10003,
    PADDLE2_POSITION: 0x10004, PADDLE2_BUTTON1: 0x10005, PADDLE2_BUTTON2: 0x10006

};
