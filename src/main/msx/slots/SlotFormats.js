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
        desc: "Special System Expanded Slot",
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
            return ((rom.content.length & 0x3fff) === 0 && rom.content[0] === 67 && rom.content[1] === 68) ? this.priority : null;
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
        desc: "Konami SCC Sound Cartridge",
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
        desc: "Konami SCC-I (SCC+) Sound Mapper Cartridge",
        priority: 1502,
        embeddedURL: "@[SCCIExpansion].rom",
        priorityForRom: function (rom) {
            // 0K, or any <= 128K content. Must be selected via info format hint
            return rom.content.length <= 131072 ? this.priority : null;
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
        desc: "MSX-MUSIC Sound Extension",
        priority: 1503,
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

    "MSXDOS2": {
        name: "MSXDOS2",
        desc: "MSX-DOS 2 Mapper Cartridge",
        priority: 1504,
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
        priority: 1505,
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
        priority: 1506,
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
        desc: "Normal ROM, Mirroring Auto",     // Will choose either Mirrored or NotMirrored
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
            return new wmsx.SlotNormal(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotNormal.recreateFromSaveState(state, previousSlot);
        }
    },

    "Mirrored": {
        name: "Mirrored",
        desc: "Normal ROM, Mirrored",
        priority: 902,
        priorityForRom: function (rom) {
            // Same rules of Normal. Can be selected by hint or automatically selected by ROM analysis
            return wmsx.SlotFormats.Normal.priorityForRom(rom);
        },
        createFromROM: function (rom) {
            return new wmsx.SlotNormal(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotNormal.recreateFromSaveState(state, previousSlot);
        }
    },

    "NotMirrored": {
        name: "NotMirrored",
        desc: "Normal ROM, Not Mirrored",
        priority: 903,
        priorityForRom: function (rom) {
            // Same rules of Normal. Can be selected by hint or automatically selected by ROM analysis
            return wmsx.SlotFormats.Normal.priorityForRom(rom);
        },
        createFromROM: function (rom) {
            return new wmsx.SlotNormal(rom, this);
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
            // Any >= 8K content, multiple of 8K, starting with the Cartridge identifier "AB"
            return (rom.content.length >= 8192 && (rom.content.length & 0x1fff) === 0
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
            // Any >= 16K content, multiple of 16K, starting with the Cartridge identifier "AB"
            return (rom.content.length >= 16384 && (rom.content.length & 0x3fff) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII16K(rom, this);
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
            // Any >= 8K content, multiple of 8K, starting with the Cartridge identifier "AB"
            return (rom.content.length >= 8192 && (rom.content.length & 0x1fff) === 0
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
        desc: "KonamiSCC Sound Mapper Cartridge",
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
        desc: "Konami SCC-I (SCC+) Sound Mapper Cartridge (in SCC-I mode)",
        priority: 1101,
        priorityForRom: function (rom) {
            // 0K, or any <= 128K content. Must be selected via info format hint
            return rom.content.length <= 131072 ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSCCIExpansion(rom, true);     // Start in SCC-I mode. Special format!
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSCCIExpansion.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII8SRAM2": {
        name: "ASCII8SRAM2",
        desc: "ASCII 8K SRAM 2K Mapper Cartridge",
        priority: 1102,
        priorityForRom: function (rom) {
            // Any >= 8K and <= 1024 content , multiple of 8K. Must be selected via info format hint
            return (rom.content.length >= 8192 && rom.content.length <= 1048576 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8KSRAM(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII8KSRAM.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII8SRAM8": {
        name: "ASCII8SRAM8",
        desc: "ASCII 8K SRAM 8K Mapper Cartridge",
        priority: 1103,
        priorityForRom: function (rom) {
            // Any >= 8K and <= 1024 content , multiple of 8K. Must be selected via info format hint
            return (rom.content.length >= 8192 && rom.content.length <= 1048576 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8KSRAM(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII8KSRAM.recreateFromSaveState(state, previousSlot);
        }
    },

    "KoeiSRAM8": {
        name: "KoeiSRAM8",
        desc: "Koei SRAM 8K Mapper Cartridge",
        priority: 1104,
        priorityForRom: function (rom) {
            // Any >= 8K and <= 1024 content , multiple of 8K. Must be selected via info format hint
            return (rom.content.length >= 8192 && rom.content.length <= 1048576 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8KSRAM(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII8KSRAM.recreateFromSaveState(state, previousSlot);
        }
    },

    "KoeiSRAM32": {
        name: "KoeiSRAM32",
        desc: "Koei SRAM 32K Mapper Cartridge",
        priority: 1105,
        priorityForRom: function (rom) {
            // Any >= 8K and <= 1024 content , multiple of 8K. Must be selected via info format hint
            return (rom.content.length >= 8192 && rom.content.length <= 1048576 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8KSRAM(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII8KSRAM.recreateFromSaveState(state, previousSlot);
        }
    },

    "Wizardry": {
        name: "Wizardry",
        desc: "Wizardry SRAM Mapper Cartridge",
        priority: 1106,
        priorityForRom: function (rom) {
            // Any >= 8K and <= 1024 content , multiple of 8K. Must be selected via info format hint
            return (rom.content.length >= 8192 && rom.content.length <= 1048576 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8KSRAM(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII8KSRAM.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII16SRAM2": {
        name: "ASCII16SRAM2",
        desc: "ASCII 16K SRAM 2K Mapper Cartridge",
        priority: 1107,
        priorityForRom: function (rom) {
            // Any >= 16K and <= 2048K content, multiple of 16K. Must be selected via info format hint
            return (rom.content.length >= 16384 && rom.content.length <= 2097152 && (rom.content.length & 0x3fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII16KSRAM(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII16KSRAM.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII16SRAM8": {
        name: "ASCII16SRAM8",
        desc: "ASCII 16K SRAM 8K Mapper Cartridge",
        priority: 1108,
        priorityForRom: function (rom) {
            // Any >= 16K and <= 2048K content, multiple of 16K. Must be selected via info format hint
            return (rom.content.length >= 16384 && rom.content.length <= 2097152 && (rom.content.length & 0x3fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII16KSRAM(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII16KSRAM.recreateFromSaveState(state, previousSlot);
        }
    },

    "RType": {
        name: "RType",
        desc: "R-Type Mapper Cartridge",
        priority: 1111,
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
        priority: 1112,
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
        desc: "Space Manbow 2 SCC Sound Mapper Cartridge",
        priority: 1113,
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
    },

    "Majutsushi": {
        name: "Majutsushi",
        desc: "Konami Hai no Majutsushi PCM Mapper Cartridge",
        priority: 1114,
        priorityForRom: function (rom) {
            // Hai no Majutsushi or similar content, multiple of 8K. Must be selected via info format hint
            return (rom.content.length > 0 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeMajutsushi(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeMajutsushi.recreateFromSaveState(state, previousSlot);
        }
    },

    "Synthesizer": {
        name: "Synthesizer",
        desc: "Konami Synthesizer PCM Cartridge",
        priority: 1115,
        priorityForRom: function (rom) {
            // "Konami Synthesizer or similar content, content <= 32K multiple of 8K. Must be selected via info format hint
            return (rom.content.length > 0 && rom.content.length <= 32768 && (rom.content.length & 0x1fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSynthesizer(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSynthesizer.recreateFromSaveState(state, previousSlot);
        }
    },

    "GameMaster2": {
        name: "GameMaster2",
        desc: "Konami Game Master 2 SRAM Mapper Cartridge",
        priority: 1116,
        priorityForRom: function (rom) {
            // Only Game Master 2 128K content. Must be selected via info format hint
            return (rom.content.length === 131072) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeGameMaster2(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeGameMaster2.recreateFromSaveState(state, previousSlot);
        }
    },

    "HarryFox": {
        name: "HarryFox",
        desc: "HarryFox Mapper Cartridge",
        priority: 1117,
        priorityForRom: function (rom) {
            // Only Harry Fox 64K content. Must be selected via info format hint
            return (rom.content.length === 65536) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeHarryFox(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeHarryFox.recreateFromSaveState(state, previousSlot);
        }
    },

    "Halnote": {
        name: "Halnote",
        desc: "Halnote SRAM Mapper Cartridge",
        priority: 1118,
        priorityForRom: function (rom) {
            // Only Halnote 1024K content. Must be selected via info format hint
            return (rom.content.length === 1048576) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeHalnote(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeHalnote.recreateFromSaveState(state, previousSlot);
        }
    },

    "AlQuran": {
        name: "AlQuran",
        desc: "The Holy Quran Mapper Cartridge (Encoded)",
        priority: 1119,
        priorityForRom: function (rom) {
            // Only Holy Quran 1024K content. Must be selected via info format hint
            return (rom.content.length === 1048576) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeAlQuran(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeAlQuran.recreateFromSaveState(state, previousSlot);
        }
    },

    "AlQuranDecoded": {
        name: "AlQuranDecoded",
        desc: "The Holy Quran Mapper Cartridge (Decoded)",
        priority: 1120,
        priorityForRom: function (rom) {
            // Only Holy Quran 1024K content. Must be selected via info format hint
            return (rom.content.length === 1048576) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeAlQuran(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeAlQuran.recreateFromSaveState(state, previousSlot);
        }
    },

    "SuperSwangi": {
        name: "SuperSwangi",
        desc: "Super Swangi Mapper Cartridge",
        priority: 1121,
        priorityForRom: function (rom) {
            // Only Super Swangi content, multiple of 16K. Must be selected via info format hint
            return (rom.content.length >= 16384 && (rom.content.length & 0x3fff) === 0) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSuperSwangi(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSuperSwangi.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSXWrite": {
        name: "MSXWrite",
        desc: "MSX Write Mapper Cartridge",
        priority: 1122,
        priorityForRom: function (rom) {
            // Only MSX Write 512K content. Must be selected via info format hint
            return (rom.content.length === 524288) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII16K(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII16K.recreateFromSaveState(state, previousSlot);
        }
    },

    "Zemina80in1": {
        name: "Zemina80in1",
        desc: "Zemina 80 in 1 Mapper Cartridge",
        priority: 1123,
        priorityForRom: function (rom) {
            // Only Zemina 80 in 1 content, multiple of 8K. Must be selected via info format hint
            return (rom.content.length & 0x1fff) === 0 ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeZemina80(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeZemina80.recreateFromSaveState(state, previousSlot);
        }
    },

    "Zemina90in1": {
        name: "Zemina90in1",
        desc: "Zemina 90 in 1 Mapper Cartridge",
        priority: 1124,
        priorityForRom: function (rom) {
            // Only Zemina 90 in 1 content, multiple of 16K. Must be selected via info format hint
            return (rom.content.length & 0x3fff) === 0 ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeZemina90(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeZemina90.recreateFromSaveState(state, previousSlot);
        }
    },

    "Zemina126in1": {
        name: "Zemina126in1",
        desc: "Zemina 126 in 1 Mapper Cartridge",
        priority: 1125,
        priorityForRom: function (rom) {
            // Only Zemina 126 in 1 content, multiple of 16K. Must be selected via info format hint
            return (rom.content.length & 0x3fff) === 0 ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeZemina126(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeZemina126.recreateFromSaveState(state, previousSlot);
        }
    },

    "FMPAC": {
        name: "FMPAC",
        desc: "FM-PAC SRAM Sound Mapper Cartridge",
        priority: 1151,
        priorityForRom: function (rom) {
            // Only FMPAC 64K content. Must be selected via info format hint
            return (rom.content.length === 65536) ? this.priority : null;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeFMPAC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeFMPAC.recreateFromSaveState(state, previousSlot);
        }
    }
};

// Temporary approximations for formats not yet supported/verified

wmsx.SlotFormats.GenericKonami = wmsx.SlotFormats.Normal;
wmsx.SlotFormats.Manbow2_2 =     wmsx.SlotFormats.Manbow2;     // Maybe actually the same (MegaFlash SCC)
wmsx.SlotFormats.HamarajaNight = wmsx.SlotFormats.Manbow2;     // Maybe actually the same (MegaFlash SCC)
wmsx.SlotFormats.Kanji12 =       wmsx.SlotFormats.Kanji1;      // Kanji1 supports both formats
wmsx.SlotFormats.FMPAK =         wmsx.SlotFormats.FMPAC;       // Maybe actually the same
