// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Missing less used formats

wmsx.SlotFormats = {

    "Empty": {
        name: "Empty",
        desc: "Empty Slot",
        priority: 1001,
        embeddedURL: "@[Empty].rom",
        priorityForRom: function (rom) {
            // Only 0K content. Must be selected via info format hint
            return (!rom || !rom.content || rom.content.length === 0) ? this.priority : null;
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
        priority: 1002,
        priorityForRom: function (rom) {
            // Not Possible to load Expanded Slots
            return null;
        },
        createFromROM: null,
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotExpanded.recreateFromSaveState(state, previousSlot);
        }
    },

    "ExpandedS": {
        name: "ExpandedS",
        desc: "System Expanded Slot",
        priority: 1003,
        priorityForRom: function (rom) {
            // Not Possible to load Expanded Slots
            return null;
        },
        createFromROM: null,
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotExpandedSpecial.recreateFromSaveState(state, previousSlot);
        }
    },

    "BIOS": {
        name: "BIOS",
        desc: "Main BIOS",
        priority: 201,
        priorityForRom: function (rom) {
            // Any 16K or 32K content starting with "F3 C3" (DI; JP) or "F3 18" (DI; JR)
            return ((rom.content.length === 16384 || rom.content.length === 32768) && rom.content[0x0000] === 0xF3
                    && (rom.content[0x0001] === 0xC3 || rom.content[0x0001] === 0x18)) ? this.priority : null;
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
        desc: "MSX2/2+ BIOS Extension",
        priority: 202,
        priorityForRom: function (rom) {
            // Any multiple of 16K content starting with the BIOS Extension identifier "CD"
            return (rom.content.length ^ 16384 === 0 && rom.content[0] === 67 && rom.content[1] === 68) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotMSX2BIOSExt(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotMSX2BIOSExt.recreateFromSaveState(state, previousSlot);
        }
    },

    "RAMNormal": {
        name: "RAMNormal",
        desc: "Normal RAM 64K",
        priority: 1011,
        embeddedURL: "@[RAMNormal].rom",
        priorityForRom: function (rom) {
            // Only 0K content. Must be selected via info format hint
            return (rom.content.length === 0) ? this.priority : null;
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
        priority: 1012,
        embeddedURL: "@[RAMMapper].rom",
        priorityForRom: function (rom) {
            // Only 0K content. Must be selected via info format hint
            return (rom.content.length === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotRAMMapper(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotRAMMapper.recreateFromSaveState(state, previousSlot);
        }
    },

    // Special Expansion Cartridges

    "DiskPatch": {
        name: "DiskPatch",
        desc: "Generic Patched Disk BIOS",
        priority: 1301,
        embeddedURL: "@[DiskPatch].rom",
        priorityForRom: function (rom) {
            // Only DiskPatched 16K content. Must be selected via info format hint
            return (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "SCCExpansion": {
        name: "SCCExpansion",
        desc: "SCC Sound Cartridge",
        priority: 1501,
        embeddedURL: "@[SCCExpansion].rom",
        priorityForRom: function (rom) {
            // Only 0K content. Must be selected via info format hint
            return (rom.content.length === 0) ? this.priority : null;
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
        desc: "SCC-I (SCC+) Sound Cartridge",
        priority: 1502,
        embeddedURL: "@[SCCIExpansion].rom",
        priorityForRom: function (rom) {
            // 0K, or any <= 128K content, multiple of 8K. Must be selected via info format hint
            return (rom.content.length <= 131072 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSCCIExpansion(rom, false);      // Start in SCC compatibility mode (default for SCC-I cartridges)
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSCCIExpansion.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSXMUSIC": {
        name: "MSXMUSIC",
        desc: "MSX-MUSIC Extension",
        priority: 1504,
        embeddedURL: "@[MSXMUSIC].rom",
        priorityForRom: function (rom) {
            // Only 16K content. Must be selected via info format hint
            return (rom.content.length === 16384) ? this.priority : null;
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
        priority: 1505,
        priorityForRom: function (rom) {
            // Only 64K content. Must be selected via info format hint
            return (rom.content.length === 65536) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeFMPAC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeFMPAC.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSXDOS2": {
        name: "MSXDOS2",
        desc: "MSX-DOS 2 ROM Mapper",
        priority: 1506,
        embeddedURL: "@[MSXDOS2]v22.rom",
        priorityForRom: function (rom) {
            // Only 64K content. Must be selected via info format hint
            return (rom.content.length === 65536) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDOS2(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDOS2.recreateFromSaveState(state, previousSlot);
        }
    },

    "PACExpansion": {
        name: "PACExpansion",
        desc: "PAC SRAM Cartridge",
        priority: 1507,
        embeddedURL: "@[PACExpansion].rom",
        priorityForRom: function (rom, insertedCartridge) {
            // Only 0K content selected via info format hint
            if (rom.content.length === 0) return this.priority;
            // Or 8206 size (PAC file) only when slot is empty or there is already a PAC cartridge present
            if (wmsx.CartridgePAC.isPACFileContentValid(rom.content)
                && (!insertedCartridge || insertedCartridge.format === wmsx.SlotFormats.PACExpansion || insertedCartridge.format === wmsx.SlotFormats.FMPAC))
                    return this.priority - wmsx.SlotCreator.FORMAT_PRIORITY_BOOST;
            return null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgePAC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgePAC.recreateFromSaveState(state, previousSlot);
        }
    },

    "Kanji1": {
        name: "Kanji1",
        desc: "Kanji Font",
        priority: 1508,
        embeddedURL: "@[Kanji1].rom",
        priorityForRom: function (rom) {
            // 128K or 256K content. Must be selected via info format hint
            return (rom.content.length === 131072 || rom.content.length === 262144) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKanjiFont(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeKanjiFont.recreateFromSaveState(state, previousSlot);
        }
    },

    // Common formats used in titles

    "Normal": {
        name: "Normal",
        desc: "Normal ROM",
        priority: 901,
        priorityForRom: function (rom) {
            // Any 8K or 16K content starting with the Cartridge identifier "AB"
            if ((rom.content.length === 8192 || rom.content.length === 16384)
                && rom.content[0] === 65 && rom.content[1] === 66) return this.priority;
            // Any 32K with the Cartridge identifier "AB" at 0x0000 or 0x4000
            if (rom.content.length === 32768
                && ((rom.content[0] === 65 && rom.content[1] === 66)
                || (rom.content[0x4000] === 65 && rom.content[0x4001] === 66))) return this.priority;
            // Any 64K or 48K content, with the Cartridge identifier "AB" at 0x4000 or 0x8000
            if ((rom.content.length === 65536 || rom.content.length === 49152)
                && ((rom.content[0x4000] === 65 && rom.content[0x4001] === 66)
                || (rom.content[0x8000] === 65 && rom.content[0x8001] === 66))) return this.priority;
            return null;
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
        priority: 911,
        priorityForRom: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            return (rom.content.length > 32768 && (rom.content.length & 0x1fff) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) ? this.priority : null;
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
        priority: 912,
        priorityForRom: function (rom) {
            // Any >32K content, multiple of 16K, starting with the Cartridge identifier "AB"
            return (rom.content.length > 32768 && (rom.content.length & 0x3fff) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) ? this.priority : null;
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
        priority: 913,
        priorityForRom: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            return (rom.content.length > 32768 && (rom.content.length & 0x1fff) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) ? this.priority : null;
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
        priority: 914,
        priorityForRom: function (rom) {
            // Any >= 8K content, multiple of 8K, starting with the Cartridge identifier "AB"
            return (rom.content.length >= 8192 && (rom.content.length & 0x1fff) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKonamiSCC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeKonamiSCC.recreateFromSaveState(state, previousSlot);
        }
    },

    "KonamiSCCI": {
        name: "KonamiSCCI",
        desc: "SCC-I (SCC+) Sound Cartridge (in SCC-I mode)",
        priority: 1503,
        priorityForRom: function (rom) {
            // 0K, or any <= 128K content, multiple of 8K. Must be selected via info format hint
            return (rom.content.length <= 131072 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSCCIExpansion(rom, true);     // Start in SCC-I mode. Special format!
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSCCIExpansion.recreateFromSaveState(state, previousSlot);
        }
    },

    "RType": {
        name: "RType",
        desc: "R-Type Mapper Cartridge",
        priority: 1101,
        priorityForRom: function (rom) {
            // Only R-Type 384K content. Must be selected via info format hint
            return (rom.content.length === 393216) ? this.priority : null;
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
        priority: 1102,
        priorityForRom: function (rom) {
            // Only CrossBlaim 64K content. Must be selected via info format hint
            return (rom.content.length === 65536) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeCrossBlaim(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeCrossBlaim.recreateFromSaveState(state, previousSlot);
        }
    },

    "Manbow2": {
        name: "Manbow2",
        desc: "Space Manbow 2 SCC Mapper Cartridge",
        priority: 1103,
        priorityForRom: function (rom) {
            // Only Manbow2 512K content. Must be selected via info format hint
            return (rom.content.length === 524288) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeManbow2(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeManbow2.recreateFromSaveState(state, previousSlot);
        }
    }

};

// Synonyms

wmsx.SlotFormats.Snatcher = wmsx.SlotFormats.SCCIExpansion;
wmsx.SlotFormats.SDSnatcher = wmsx.SlotFormats.SCCIExpansion;
