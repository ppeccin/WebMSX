// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.presets = {

    DEFAULT: {
        _INCLUDE:       "MSX2"
    },

    // MSX2 Machine

    MSX2: {
        MACHINE_TYPE:   2,
        SLOT_0_0_URL:   "wmsx/roms/MSX2N.bios",
        SLOT_0_1_URL:   "wmsx/roms/MSX2NEXT.bios",
        SLOT_0_2_URL:   "wmsx/roms/Disk.rom"
    },

    DOS2: {
        SLOT_0_3_URL:   "wmsx/roms/MSXDOS22v3.rom"
    },

    RAM64: {
        RAM_SIZE: 64
    },

    RAM128: {
        RAM_SIZE: 128
    },

    RAM256: {
        RAM_SIZE: 256
    },

    RAM512: {
        RAM_SIZE: 512
    },

    RAM1024: {
        RAM_SIZE: 1024
    },

    RAM2048: {
        RAM_SIZE: 2048
    },

    RAM4096: {
        RAM_SIZE: 4096
    },

    // MSX1 Machine

    MSX1: {
        MACHINE_TYPE:   1,
        SLOT_0_URL:     "wmsx/roms/MSX1NTSCa.bios",
        SLOT_3_0_URL:   "wmsx/roms/Disk.rom"
    },

    MSX1NTSC: {
        SLOT_0_URL:     "wmsx/roms/MSX1NTSCa.bios"
    },

    MSX1PAL: {
        SLOT_0_URL:     "wmsx/roms/MSX1PALa.bios"
    },

    MSX1NODISK: {
        SLOT_3_0_URL:   ""
    },

    // Genral add-ons and config options

    SCC: {
        SLOT_3_1_URL:   "wmsx/roms/[SCCExpansion].rom"
    },

    SCCI: {
        SLOT_3_1_URL:   "wmsx/roms/[SCCIExpansion].rom"
    },

    NOVSYNCH: {
        SCREEN_VSYNCH_MODE: 0
    },

    FORCEVSYNCH: {
        SCREEN_VSYNCH_MODE: 2
    },

    EMPTY: {
    },

    // Specific machines

    EXPERT: {
        MACHINE_TYPE:   1,
        SLOT_0_URL:     "wmsx/roms/Expert10.bios",
        SLOT_3_0_URL:   "wmsx/roms/DiskCDX2.rom"
    }

};


WMSX.presets.applyConfig = function() {
    WMSX.presets.applyPresets("DEFAULT, " + (WMSX.PRESETS || ""));
};

WMSX.presets.applyPresets = function(presetsString) {
    var presetNames = (presetsString || "").trim().toUpperCase().split(",");
    for (var i = 0; i < presetNames.length; i++) {
        var presetName = presetNames[i].trim();
        if (presetName) WMSX.presets.applyPreset(presetName);
    }
};

WMSX.presets.applyPreset = function(presetName) {
    var presetPars = WMSX.presets[presetName];
    if (presetPars) {
        wmsx.Util.log("Applying preset: " + presetName);
        for (var par in presetPars) {
            var parName = par.trim().toUpperCase();
            if (parName === "_INCLUDE")
                WMSX.presets.applyPresets(presetPars[parName]);         // Another Presets referenced by _INCLUDE
            else
                WMSX[parName] = presetPars[par];                        // Normal Parameter to set
        }
    } else {
        wmsx.Util.log("Preset \"" + presetName + "\" not found, skipping...");
    }
};
