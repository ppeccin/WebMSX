// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.presets = {

    DEFAULT: {
        MACHINE_TYPE:   2,
        BIOS_URL:       "wmsx/roms/MSX2N.bios",
        EXPANSION0_URL: "wmsx/roms/Disk.rom",
        EXPANSION1_URL: "wmsx/roms/MSX2NEXT.bios"
    },

    MSX2: {
    },

    RAM128: {
        RAM_MAPPER_SIZE: 128
    },

    RAM256: {
        RAM_MAPPER_SIZE: 256
    },

    RAM512: {
        RAM_MAPPER_SIZE: 512
    },

    RAM1024: {
        RAM_MAPPER_SIZE: 1024
    },

    RAM2048: {
        RAM_MAPPER_SIZE: 2048
    },

    RAM4096: {
        RAM_MAPPER_SIZE: 4096
    },

    MSX1: {
        MACHINE_TYPE:   1,
        BIOS_URL:       "wmsx/roms/MSX1NTSCa.bios",
        EXPANSION1_URL: "wmsx/roms/Empty.rom"
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

    DOS2: {
        CARTRIDGE2_URL: "wmsx/roms/MSXDOS22v3.rom"
    },

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
        MACHINE_TYPE:   1,
        BIOS_URL:       "wmsx/roms/Expert10.bios",
        EXPANSION0_URL: "wmsx/roms/DiskCDX2.rom"
    },

    HBF900: {
        MACHINE_TYPE:   2,
        BIOS_URL:       "wmsx/roms/hbf900bios.rom",
        EXPANSION0_URL: "wmsx/roms/hbf900disk.rom",
        EXPANSION1_URL: "wmsx/roms/hbf900sub.rom"
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
