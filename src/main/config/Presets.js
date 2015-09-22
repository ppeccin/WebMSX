// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.presets = {

    DEFAULT: {
        BIOS_URL:       "wmsx/roms/MSX1NTSCa.bios",
        EXPANSION0_URL: "wmsx/roms/Disk.rom"
    },

    NODISK: {
        BIOS_URL:       "wmsx/roms/MSX1NTSCa.bios"
    },

    EMPTY: {
    },

    // Specific machines

    EXPERT: {
        BIOS_URL:       "wmsx/roms/Expert10.bios",
        EXPANSION0_URL: "wmsx/roms/DiskCDX2.rom"
    }

};

WMSX.presets.apply = function() {

    var presetName = (WMSX.PRESET || "").trim().toUpperCase();
    var preset = WMSX.presets[presetName];
    if (preset) {
        wmsx.Util.log("Applying preset: " + presetName);
    } else {
        preset = WMSX.presets.DEFAULT;
        wmsx.Util.log("Preset \"" + presetName + "\" not found. Applying default preset");
    }

    for (par in preset)
        WMSX[par.trim().toUpperCase()] = preset[par];

};
