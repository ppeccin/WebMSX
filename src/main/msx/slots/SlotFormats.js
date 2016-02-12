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

    "SlotExpanded": {
        name: "SlotExpanded",
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

    "RAM64K": {
        name: "RAM64K",
        desc: "RAM 64K Slot",
        priority: 205,
        tryFormat: function (rom) {
            // Not Possible to load RAMs
            return null;
        },
        createFromROM: null,
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotRAM64K.recreateFromSaveState(state, previousSlot);
        }
    },

    "BIOS": {
        name: "BIOS",
        desc: "BIOS 16K/32K",
        priority: 206,
        tryFormat: function (rom) {
            // Assumes any 16K or 32K content without the Cartridge identifier "AB" is a BIOS
            if (
                //(rom.content.length === 16384 && (rom.content[0] !== 65 || rom.content[1] !== 66)) ||
                (rom.content.length === 32768 && (rom.content[0] !== 65 || rom.content[1] !== 66) && (rom.content[0x4000] !== 65 || rom.content[0x4001] !== 66))
            )
                return this;
        },
        createFromROM: function (rom) {
            return new wmsx.BIOS(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.BIOS.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSX2BIOSEXT": {
        name: "MSX2BIOSEXT",
        desc: "BIOS Extension 16K",
        priority: 207,
        tryFormat: function (rom) {
            // Assumes any 16K content without the Cartridge identifier "AB" is a BIOS Extension
            if ((rom.content.length === 16384 && (rom.content[0] !== 65 || rom.content[1] !== 66)))
                return this;
        },
        createFromROM: function (rom) {
            return new wmsx.MSX2BIOSEXT(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.MSX2BIOSEXT.recreateFromSaveState(state, previousSlot);
        }
    },

    "RAMMapper256K": {
        name: "RAMMapper256K",
        desc: "RAM Mapper 256K Slot",
        priority: 208,
        tryFormat: function (rom) {
            // Not Possible to load RAMs
            return null;
        },
        createFromROM: null,
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotRAMMapper256K.recreateFromSaveState(state, previousSlot);
        }
    },

    "Unbanked": {
        name: "Unbanked",
        desc: "Normal Cartridge",
        priority: 211,
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
            return new wmsx.CartridgeUnbanked(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeUnbanked.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII8": {
        name: "ASCII8",
        desc: "ASCII 8K Mapper Cartridge",
        priority: 231,
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
        priority: 232,
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
        desc: "Konami 8K Mapper Cartridge",
        priority: 233,
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
        desc: "KonamiSCC 8K Mapper Cartridge",
        priority: 234,
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

    "R-Type": {
        name: "R-Type",
        desc: "R-Type 384K Mapper Cartridge",
        priority: 251,
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
        desc: "CrossBlaim 64K Mapper Cartridge",
        priority: 252,
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
        priority: 221,
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
        priority: 222,
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
        priority: 223,
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
        priority: 224,
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
        priority: 225,
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
        priority: 226,
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
        priority: 261,
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
        priority: 261,
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
    }

};
