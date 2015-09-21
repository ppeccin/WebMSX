// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.presets = {

    DEFAULT: {
        BIOS_URL:       "roms/MSX1NTSCa.bios",
        EXPANSION0_URL: "roms/Disk.rom"
    },

    NODISK: {
        BIOS_URL:       "roms/MSX1NTSCa.bios",
    },

    EMPTY: {
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
