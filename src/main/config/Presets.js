// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.presets = {

    DEFAULT: {
        _INCLUDE:           "MSX2"
    },

    // MSX2 Machine

    MSX2: {
        MACHINE_TYPE:       2,
        BIOS_SLOT:          [0, 0],
        CARTRIDGE1_SLOT:    [1],
        CARTRIDGE2_SLOT:    [3, 0],
        EXPANSION_SLOTS:    [[3, 2], [3, 3]],
        SLOT_0_0_URL:       "wmsx/roms/MSX2N.bios",
        SLOT_0_1_URL:       "wmsx/roms/MSX2NEXT.bios",
        SLOT_2_URL:         "wmsx/roms/[RAMMapper].rom",
        _INCLUDE:           "MSX2DISK, RAM256"
    },

    MSX2DISK: {
        SLOT_0_2_URL:       "wmsx/roms/Disk.rom"
    },

    DOS2: {
        SLOT_0_3_URL:       "wmsx/roms/MSXDOS22v3.rom"
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
        _EXCLUDE:           "DEFAULT",
        MACHINE_TYPE:       1,
        BIOS_SLOT:          [0],
        CARTRIDGE1_SLOT:    [1],
        CARTRIDGE2_SLOT:    [3, 0],
        EXPANSION_SLOTS:    [[3, 2], [3, 3]],
        SLOT_0_URL:         "wmsx/roms/MSX1NTSCa.bios",
        SLOT_2_URL:         "wmsx/roms/[RAM64K].rom",
        _INCLUDE:           "MSX1DISK"
    },

    MSX1DISK: {
        SLOT_3_1_URL:       "wmsx/roms/Disk.rom"
    },

    MSX1NTSC: {
        SLOT_0_URL:         "wmsx/roms/MSX1NTSCa.bios"
    },

    MSX1PAL: {
        SLOT_0_URL:         "wmsx/roms/MSX1PALa.bios"
    },

    // Genral add-ons and config options

    NODISK: {
        _EXCLUDE:           "MSX1DISK, MSX2DISK"
    },

    SCC: {
        SLOT_3_3_URL:       "wmsx/roms/[SCCExpansion].rom"
    },

    SCCI: {
        SLOT_3_3_URL:       "wmsx/roms/[SCCIExpansion].rom"
    },

    NOVSYNCH: {
        SCREEN_VSYNCH_MODE: 0
    },

    FORCEVSYNCH: {
        SCREEN_VSYNCH_MODE: 2
    },

    // Specific machines

    EXPERT: {
        _INCLUDE:           "MSX1",
        SLOT_0_URL:         "wmsx/roms/Expert10.bios"
    },

    EMPTY: {
        _EXCLUDE:           "DEFAULT",
        MACHINE_TYPE:       2,
        BIOS_SLOT:          [0, 0],
        CARTRIDGE1_SLOT:    [1],
        CARTRIDGE2_SLOT:    [3, 0],
        EXPANSION_SLOTS:    [[3, 2], [3, 3]]
    }

};


WMSX.presets.applyConfig = function() {
    var finalPresets = [];
    // Collect final list of Presets to apply
    WMSX.presets.visitPresets("DEFAULT, " + (WMSX.PRESETS || ""), finalPresets, true);
    // Apply list
    for (var i = 0; i < finalPresets.length; i++)
        WMSX.presets.applyPreset(finalPresets[i]);
};

WMSX.presets.visitPresets = function(presetsString, finalPresets, include) {
    var presetNames = (presetsString || "").trim().toUpperCase().split(",");
    for (var i = 0; i < presetNames.length; i++) {
        var presetName = presetNames[i].trim();
        var presetPars = WMSX.presets[presetName];
        if (presetPars) {
            for (var par in presetPars) {
                var parName = par.trim().toUpperCase();
                // Update final preset collection
                if (include) wmsx.Util.arrayIfAbsentAdd(finalPresets, presetName);
                else wmsx.Util.arrayRemoveAllElement(finalPresets, presetName);
                // Include or Exclude Presets referenced by _INCLUDE / _EXCLYDE
                if (parName === "_INCLUDE")
                    WMSX.presets.visitPresets(presetPars[parName], finalPresets, include);
                else if (parName === "_EXCLUDE")
                    WMSX.presets.visitPresets(presetPars[parName], finalPresets, !include);
            }
        }
    }
};

WMSX.presets.applyPreset = function(presetName) {
    var presetPars = WMSX.presets[presetName];
    if (presetPars) {
        wmsx.Util.log("Applying preset: " + presetName);
        for (var par in presetPars) {
            var parName = par.trim().toUpperCase();
            if (parName[0] !== "_") WMSX[parName] = presetPars[par];              // Normal Parameter to set
        }
    } else {
        wmsx.Util.log("Preset \"" + presetName + "\" not found, skipping...");
    }
};
