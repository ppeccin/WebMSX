// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoStandard = {
    NTSC: {
        name: "NTSC",
        desc: "NTSC 60Hz",
        totalWidth: 342,
        totalHeight: 262,
        targetFPS: 60,
        pulldowns: {
            60: { // Hz
                linesPerCycle: 262,             // Normal 1:1 cadence. May V-synch to 60 Hz
                firstFrameLinesAdjust: 0
            },
            50: { // Hz
                linesPerCycle: 314,             // 1:1:1:1:2 pulldown. 6 frames generated each 5 frames shown. 5th frame is not displayed
                firstFrameLinesAdjust: +2
            }
        }
    },
    PAL: {
        name: "PAL",
        desc: "PAL 50Hz",
        totalWidth: 342,
        totalHeight: 313,
        targetFPS: 50,                          // Original is 50.22364217252396, or 50.3846153846153847
        pulldowns: {
            60: { // Hz
                linesPerCycle: 261,             // 0:1:1:1:1:1 pulldown. 5 frames generated each 6 frames shown. 1st frame repeats last frame
                firstFrameLinesAdjust: -1
            },
            50: { // Hz
                linesPerCycle: 313,             // Normal 1:1 cadence. May V-synch to 50 Hz
                firstFrameLinesAdjust: 0
            }
        }
    }
};

