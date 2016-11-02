// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.JoystickButtons = {

    // Real MSX buttons, register mask
    J_UP:     { button: "J_UP",    mask: 0x01, n: "UP" },
    J_DOWN:   { button: "J_DOWN",  mask: 0x02, n: "DOWN" },
    J_LEFT:   { button: "J_LEFT",  mask: 0x04, n: "LEFT" },
    J_RIGHT:  { button: "J_RIGHT", mask: 0x08, n: "RIGHT" },
    J_A:      { button: "J_A",     mask: 0x10, n: "A" },
    J_B:      { button: "J_B",     mask: 0x20, n: "B" },

    J_AB:     { button: "J_AB",    mask: 0x30, n: "AB" },        // Special case, both A and B buttons

    // Virtual buttons, no valid mask
    J_X:      { button: "J_X",     n: "X" },
    J_Y:      { button: "J_Y",     n: "Y" },
    J_L:      { button: "J_L",     n: "L" },
    J_R:      { button: "J_R",     n: "R" },
    J_BACK:   { button: "J_BACK",  n: "BACK" },
    J_START:  { button: "J_START", n: "START" }

};

