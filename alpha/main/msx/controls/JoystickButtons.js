// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.JoystickButtons = {

    // Real MSX buttons, register bit number
    UP:     { mask: 0x01, n: "UP" },
    DOWN:   { mask: 0x02, n: "DOWN" },
    LEFT:   { mask: 0x04, n: "LEFT" },
    RIGHT:  { mask: 0x08, n: "RIGHT" },
    A:      { mask: 0x10, n: "A" },
    B:      { mask: 0x20, n: "B" },

    AB:     { mask: 0x30, n: "AB" },        // Special case, both A and B buttons

    // Virtual buttons, no valid mask
    X:      { n: "X" },
    Y:      { n: "Y" },
    L:      { n: "L" },
    R:      { n: "R" },
    BACK:   { n: "BACK" },
    START:  { n: "START" }

};

