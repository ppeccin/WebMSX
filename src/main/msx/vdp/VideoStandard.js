// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoStandard = {
    NTSC: {
        name: "NTSC",
        desc: "NTSC 60Hz",
        width: 256,
        height: 192,
        totalWidth: 342,
        totalHeight: 262,
        startingScanline: -8,
        finishingScanline: 262 - 8,
        fps: 60
    },
    PAL: {
        name: "PAL",
        desc: "PAL 50Hz",
        width: 256,
        height: 192,
        totalWidth: 342,
        totalHeight: 313,
        startingScanline: -8,
        finishingScanline: 313 -8,
        fps: 60      // Will synch with 60Hz and perform pulldown. Original is 50.22364217252396, or 50.3846153846153847
    }
};

