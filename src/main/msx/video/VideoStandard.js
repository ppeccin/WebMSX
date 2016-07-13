// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoStandard = {
    NTSC: {
        name: "NTSC",
        desc: "NTSC 60Hz",
        totalWidth: 342,
        totalHeight: 262,
        topBorderHeight: 16,                    // for 212 lines (LN = 1)
        targetFPS: 60,
        pulldowns: {
            60: { // Hz
                frequency: 60,
                linesPerCycle: 262,             // Normal 1:1 cadence. Exact V-synch to 60 Hz
                firstStepCycleLinesAdjust: 0,
                steps: 1
            },
            120: { // Hz
                frequency: 120,
                linesPerCycle: 131,             // 0:1 pulldown. 1 frame generated each 2 frames shown
                firstStepCycleLinesAdjust: 0,
                steps: 2
            },
            50: { // Hz
                frequency: 50,
                linesPerCycle: 314,             // 1:1:1:1:2 pulldown. 6 frames generated each 5 frames shown
                firstStepCycleLinesAdjust: +2,
                steps: 5
            },
            100: { // Hz
                frequency: 100,
                linesPerCycle: 157,             // 0:1:0:1:1:0:1:0:1:1 pulldown. 6 frames generated each 10 frames shown
                firstStepCycleLinesAdjust: +2,
                steps: 10
            },
            0: { // Hz (host frequency not detected)
                frequency: 50,
                linesPerCycle: 314,             // 1:1:1:1:2 pulldown. 6 frames generated each 5 frames shown
                firstStepCycleLinesAdjust: +2,
                steps: 5
            }
        }
    },
    PAL: {
        name: "PAL",
        desc: "PAL 50Hz",
        totalWidth: 342,
        totalHeight: 313,
        topBorderHeight: 43,                    // for 212 lines (LN = 1)
        targetFPS: 50,                          // Original is 50.22364217252396, or 50.3846153846153847
        pulldowns: {
            50: { // Hz
                frequency: 50,
                linesPerCycle: 313,             // Normal 1:1 cadence. Exact V-synch to 50 Hz
                firstStepCycleLinesAdjust: 0,
                steps: 1
            },
            100: { // Hz
                frequency: 100,
                linesPerCycle: 156,             // 0:1 pulldown. 1 frame generated each 2 frames shown
                firstStepCycleLinesAdjust: +1,
                steps: 2
            },
            60: { // Hz
                frequency: 60,
                linesPerCycle: 261,             // 0:1:1:1:1:1 pulldown. 5 frames generated each 6 frames shown
                firstStepCycleLinesAdjust: -1,
                steps: 6
            },
            120: { // Hz
                frequency: 120,
                linesPerCycle: 130,             // 0:0:1:0:1:0:0:1:0:1:0:1 pulldown. 5 frames generated each 12 frames shown
                firstStepCycleLinesAdjust: +5,
                steps: 12
            },
            0: { // Hz (host frequency not detected)
                frequency: 50,
                linesPerCycle: 313,             // Normal 1:1 cadence
                firstStepCycleLinesAdjust: 0,
                steps: 1
            }
        }
    }
};

