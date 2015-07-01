// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoStandard = {
    NTSC: {
        name: "NTSC",
        width: 256,
        height: 192,
        totalWidth: 342,
        totalHeight: 262,
        fps: 60
    },
    PAL: {
        name: "PAL",
        width: 256,
        height: 192,
        totalWidth: 342,
        totalHeight: 313,
        fps: 50      // So it can match 1 frame each 20ms. Was 50.22364217252396 or 50.3846153846153847
    }
};

