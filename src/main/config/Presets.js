// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.presets = {

    DEFAULT: {
        BIOS_URL:       "wmsx/roms/MSX1NTSCa.bios",
        EXPANSION0_URL: "wmsx/roms/Disk.rom"
    },

    NTSC: {
        BIOS_URL:       "wmsx/roms/MSX1NTSCa.bios"
    },

    PAL: {
        BIOS_URL:       "wmsx/roms/MSX1PALa.bios"
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
        EXPANSION1_URL: "wmsx/roms/SCCExpansion.rom"
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
            for (par in preset)
                WMSX[par.trim().toUpperCase()] = preset[par];
        } else {
            wmsx.Util.log("Preset \"" + presetName + "\" not found, skipping...");
        }
    }

};
