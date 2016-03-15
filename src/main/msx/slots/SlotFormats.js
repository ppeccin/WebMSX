// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotFormats = {

    "Empty": {
        name: "Empty",
        desc: "Empty Slot",
        priority: 201,
        tryFormat: function (rom) {
            // Any empty ROM
            if (!rom || !rom.content || rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return wmsx.SlotEmpty.singleton;
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotEmpty.singleton;
        }
    },

    "Expanded": {
        name: "Expanded",
        desc: "Expanded Slot",
        priority: 202,
        tryFormat: function (rom) {
            // Not Possible to load Expanded Slots
            return null;
        },
        createFromROM: null,
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotExpanded.recreateFromSaveState(state, previousSlot);
        }
    },

    "BIOS": {
        name: "BIOS",
        desc: "Main BIOS",
        priority: 206,
        tryFormat: function (rom) {
            // Assumes any 16K or 32K content without the Cartridge identifier "AB" or the Extension identifier "CD" is a BIOS
            if (
                (rom.content.length === 16384 && (rom.content[0] !== 65 || rom.content[1] !== 66) && (rom.content[0] !== 67 || rom.content[1] !== 68)) ||
                (rom.content.length === 32768 && (rom.content[0] !== 65 || rom.content[1] !== 66) && (rom.content[0] !== 67 || rom.content[1] !== 68)
                    && (rom.content[0x4000] !== 65 || rom.content[0x4001] !== 66) && (rom.content[0x4000] !== 67 || rom.content[0x4001] !== 68))
            )
                return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotBIOS(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotBIOS.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSX2BIOSExt": {
        name: "MSX2BIOSExt",
        desc: "MSX2 BIOS Extension",
        priority: 207,
        tryFormat: function (rom) {
            // Assumes any 16K content without the BIOS Extension identifier "CD" is a BIOS Extension
            if (rom.content.length === 16384 && rom.content[0] === 67 && rom.content[1] === 68)
                return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotMSX2BIOSExt(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotMSX2BIOSExt.recreateFromSaveState(state, previousSlot);
        }
    },

    "RAM64K": {
        name: "RAM64K",
        desc: "RAM 64K",
        priority: 211,
        tryFormat: function (rom) {
            // Only 0K content. Must be selected via info format hint
            if (rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotRAM64K(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotRAM64K.recreateFromSaveState(state, previousSlot);
        }
    },

    "RAMMapper": {
        name: "RAMMapper",
        desc: "Standard RAM Mapper",
        priority: 221,
        tryFormat: function (rom) {
            // Only 0K content. Must be selected via info format hint
            if (rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotRAMMapper(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotRAMMapper.recreateFromSaveState(state, previousSlot);
        }
    },

    "Normal": {
        name: "Normal",
        desc: "Normal ROM",
        priority: 311,
        tryFormat: function (rom) {
            // Any 8K or 16K content starting with the Cartridge identifier "AB"
            if ((rom.content.length === 8192 || rom.content.length === 16384)
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
            // Any 32K with the Cartridge identifier "AB" at 0x0000 or 0x4000
            if (rom.content.length === 32768
                && ((rom.content[0] === 65 && rom.content[1] === 66)
                || (rom.content[0x4000] === 65 && rom.content[0x4001] === 66))) return this;
            // Any 64K or 48K content, with the Cartridge identifier "AB" at 0x4000 or 0x8000
            if ((rom.content.length === 65536 || rom.content.length === 49152)
                && ((rom.content[0x4000] === 65 && rom.content[0x4001] === 66)
                || (rom.content[0x8000] === 65 && rom.content[0x8001] === 66))) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotNormal(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotNormal.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII8": {
        name: "ASCII8",
        desc: "ASCII 8K Mapper Cartridge",
        priority: 331,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8K(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII8K.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII16": {
        name: "ASCII16",
        desc: "ASCII 16K Mapper Cartridge",
        priority: 332,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 16K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 16384) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII16K(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII16K.recreateFromSaveState(state, previousSlot);
        }
    },

    "Konami": {
        name: "Konami",
        desc: "Konami Mapper Cartridge",
        priority: 333,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKonami(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeKonami.recreateFromSaveState(state, previousSlot);
        }
    },

    "KonamiSCC": {
        name: "KonamiSCC",
        desc: "KonamiSCC Mapper Cartridge",
        priority: 334,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKonamiSCC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeKonamiSCC.recreateFromSaveState(state, previousSlot);
        }
    },

    "RType": {
        name: "R-Type",
        desc: "R-Type Mapper Cartridge",
        priority: 351,
        tryFormat: function (rom) {
            // Only R-Type 384K content. Must be selected via info format hint
            if (rom.content.length === 393216) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeRType(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeRType.recreateFromSaveState(state, previousSlot);
        }
    },

    "CrossBlaim": {
        name: "CrossBlaim",
        desc: "CrossBlaim Mapper Cartridge",
        priority: 352,
        tryFormat: function (rom) {
            // Only CrossBlaim 64K content. Must be selected via info format hint
            if (rom.content.length === 65536) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeCrossBlaim(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeCrossBlaim.recreateFromSaveState(state, previousSlot);
        }
    },

    // Disk Interfaces

    "DiskPatched": {
        name: "DiskPatched",
        desc: "Generic Patched Disk BIOS",
        priority: 401,
        tryFormat: function (rom) {
            // Only DiskPatched 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskWD": {
        name: "DiskWD",
        desc: "WD 2793 based Disk BIOS (Patched)",
        priority: 402,
        tryFormat: function (rom) {
            // Only DiskWD 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskFujitsu": {
        name: "DiskFujitsu",
        desc: "Fujitsu MB8877A based Disk BIOS (Patched)",
        priority: 403,
        tryFormat: function (rom) {
            // Only DiskFujitsu 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskToshiba": {
        name: "DiskToshiba",
        desc: "Toshiba TC8566AF based Disk BIOS (Patched)",
        priority: 404,
        tryFormat: function (rom) {
            // Only DiskToshiba 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskMicrosol": {
        name: "DiskMicrosol",
        desc: "Microsol WD2793 based Disk BIOS (Patched)",
        priority: 405,
        tryFormat: function (rom) {
            // Only DiskMicrosol 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskSVI": {
        name: "DiskSVI",
        desc: "SVI 738 based Disk BIOS (Patched)",
        priority: 406,
        tryFormat: function (rom) {
            // Only DiskSVI 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    // Special Expansion Cartridges

    "SCCExpansion": {
        name: "SCCExpansion",
        desc: "SCC Expansion Cartridge",
        priority: 501,
        tryFormat: function (rom) {
            // Only 0K content. Must be selected via info format hint
            if (rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSCCExpansion(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSCCExpansion.recreateFromSaveState(state, previousSlot);
        }
    },

    "SCCIExpansion": {
        name: "SCCIExpansion",
        desc: "SCC-I (SCC+) Expansion Cartridge",
        priority: 502,
        tryFormat: function (rom) {
            // 0K, 64K or 128K content. Must be selected via info format hint
            if (rom.content.length === 0 || rom.content.length === 65536 || rom.content.length === 131072) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSCCIExpansion(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSCCIExpansion.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSXMUSIC": {
        name: "MSXMUSIC",
        desc: "MSX-MUSIC Basic Extension",
        priority: 503,
        tryFormat: function (rom) {
            // Only 16K content. Must be selected via info format hint
            if (rom.content.length === 16384) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeMSXMUSIC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeMSXMUSIC.recreateFromSaveState(state, previousSlot);
        }
    },

    "FMPAC": {
        name: "FMPAC",
        desc: "FM-PAC Sound Cartridge",
        priority: 504,
        tryFormat: function (rom) {
            // Only 64K content. Must be selected via info format hint
            if (rom.content.length === 65536) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeFMPAC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeFMPAC.recreateFromSaveState(state, previousSlot);
        }
    },

    // MSX2 only

    "DOS2": {
        name: "DOS2",
        desc: "MSX-DOS 2 ROM Mapper",
        priority: 371,
        tryFormat: function (rom) {
            // Only 64K content
            if (rom.content.length === 65536) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDOS2(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDOS2.recreateFromSaveState(state, previousSlot);
        }
    }

};

// Synonyms

wmsx.SlotFormats.Snatcher = wmsx.SlotFormats.SCCIExpansion;
wmsx.SlotFormats.SDSnatcher = wmsx.SlotFormats.SCCIExpansion;

// Backward Compatibility  TODO Remove

wmsx.SlotFormats.SlotExpanded = wmsx.SlotFormats.Expanded;
wmsx.SlotFormats.MSX2BIOSEXT = wmsx.SlotFormats.MSX2BIOSExt;
wmsx.SlotFormats.Unbanked = wmsx.SlotFormats.Normal;
wmsx.SlotFormats.RAMMapper256K = wmsx.SlotFormats.RAMMapper;
