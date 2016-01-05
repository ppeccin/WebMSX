// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.presets = {

    DEFAULT: {
        MACHINE_TYPE:   1,
        BIOS_URL:       "wmsx/roms/MSX1NTSCa.bios",
        EXPANSION0_URL: "wmsx/roms/Disk.rom"
    },

    MSX1: {
    },

    MSX2: {
        MACHINE_TYPE:   2,
        BIOS_URL:       "wmsx/roms/MSX2NTSCa.bios",       // "wmsx/roms/MSX2PAL.bios",       // TODO Fix
        EXPANSION1_URL: "wmsx/roms/MSX2EXT.bios"          // "wmsx/roms/MSX2EXT.bios"
    },

    MSX2NTSC: {
        MACHINE_TYPE:   2,
        BIOS_URL:       "wmsx/roms/MSX2NTSC.bios",       // TODO Provide
        EXPANSION1_URL: "wmsx/roms/MSX2EXT.bios"
    },

    MSX2PAL: {
        MACHINE_TYPE:   2,
        BIOS_URL:       "wmsx/roms/MSX2PAL.bios",
        EXPANSION1_URL: "wmsx/roms/MSX2EXT.bios"
    },

    NTSC: {
        BIOS_URL:       "wmsx/roms/MSX1NTSCa.bios"
    },

    PAL: {
        BIOS_URL:       "wmsx/roms/MSX1PALa.bios"
    },

    NOVSYNCH: {
        SCREEN_VSYNCH_MODE: 0
    },

    FORCEVSYNCH: {
        SCREEN_VSYNCH_MODE: 2
    },

    NODISK: {
        EXPANSION0_URL: ""
    },

    EMPTY: {
        BIOS_URL:       "",
        EXPANSION0_URL: "",
        EXPANSION1_URL: ""
    },

    // Optional Expansions

    SCC: {
        EXPANSION2_URL: "wmsx/roms/[SCCExpansion].rom"
    },

    SCCI: {
        EXPANSION2_URL: "wmsx/roms/[SCCIExpansion].rom"
    },

    SCCPLUS: {
        EXPANSION2_URL: "wmsx/roms/[SCCIExpansion].rom"
    },

    // Specific machines

    EXPERT: {
        BIOS_URL:       "wmsx/roms/Expert10.bios",
        EXPANSION0_URL: "wmsx/roms/DiskCDX2.rom"
    }

};

WMSX.presets.apply = function() {

    var presetsString = (WMSX.PRESETS || "").trim().toUpperCase();
    var presetNames = presetsString.split(",");
    presetNames.unshift("DEFAULT");

    for (var i = 0; i < presetNames.length; i++) {
        var presetName = presetNames[i].trim();
        if (!presetName) continue;
        var preset = WMSX.presets[presetName];
        if (preset) {
            wmsx.Util.log("Applying preset: " + presetName);
            for (var par in preset)
                WMSX[par.trim().toUpperCase()] = preset[par];
        } else {
            wmsx.Util.log("Preset \"" + presetName + "\" not found, skipping...");
        }
    }

};
