// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotFormats = {

    "Empty": {
        name: "Empty",
        desc: "Empty Slot",
        priority: 101,
        tryFormat: function (rom) {
            // Any empty ROM
            if (!rom || !rom.content || rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotEmpty(this);
        },
        createFromSaveState: function (state) {
            return wmsx.SlotEmpty.createFromSaveState(state);
        }
    },

    "BIOS": {
        name: "BIOS",
        desc: "BIOS 16K/32K/64K Slot",
        priority: 102,
        tryFormat: function (rom) {
            // Assumes any 16K or 32K content without the Cartridge identifier "AB" is a BIOS
            if ((rom.content.length === 16384 && (rom.content[0] !== 65 || rom.content[1] !== 66))
                || (rom.content.length === 32768 && (rom.content[0] !== 65 || rom.content[1] !== 66) && (rom.content[0x4000] !== 65 || rom.content[0x4001] !== 66))
            ) // || (rom.content.length === 65536 && (rom.content[0x4001] !== 65 || rom.content[0x4001] !== 66) && (rom.content[0x8001] !== 65 || rom.content[0x8001] !== 66)))
                return this;
        },
        createFromROM: function (rom) {
            return new wmsx.BIOS(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.BIOS.createFromSaveState(state);
        }
    },

    "RAM64K": {
        name: "RAM64K",
        desc: "RAM 64K Slot",
        priority: 103,
        tryFormat: function (rom) {
            // Not Possible to load RAMs yet
            return null;
        },
        createFromROM: null,
        createFromSaveState: function (state) {
            return wmsx.SlotRAM64K.createFromSaveState(state);
        }
    },

    "Unbanked": {
        name: "Unbanked",
        desc: "Unbanked Cartridge",
        priority: 111,
        tryFormat: function (rom) {
            // Any 8K or 16K content starting with the Cartridge identifier "AB"
            if ((rom.content.length === 8192 || rom.content.length === 16384)
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
            // Any 32K with the Cartridge identifier "AB" at 0x0000 or 0x4000
            if (rom.content.length === 32768
                && ((rom.content[0] === 65 && rom.content[1] === 66)
                || (rom.content[0x4000] === 65 && rom.content[0x4001] === 66))) return this;
            // Any 64K content, with the Cartridge identifier "AB" at 0x4000 or 0x8000
            if (rom.content.length === 65536
                && ((rom.content[0x4000] === 65 && rom.content[0x4001] === 66)
                || (rom.content[0x8000] === 65 && rom.content[0x8001] === 66))) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeUnbanked(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.CartridgeUnbanked.createFromSaveState(state);
        }
    },

    "ASCII8": {
        name: "ASCII8",
        desc: "ASCII 8K Mapper Cartridge",
        priority: 112,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8K(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.CartridgeASCII8K.createFromSaveState(state);
        }
    },

    "ASCII16": {
        name: "ASCII16",
        desc: "ASCII 16K Mapper Cartridge",
        priority: 113,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 16K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 16384) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII16K(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.CartridgeASCII16K.createFromSaveState(state);
        }
    },

    "Konami": {
        name: "Konami",
        desc: "Konami 8K Mapper Cartridge",
        priority: 114,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKonami(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.CartridgeKonami.createFromSaveState(state);
        }
    },

    "KonamiSCC": {
        name: "KonamiSCC",
        desc: "KonamiSCC 8K Mapper Cartridge",
        priority: 114,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKonamiSCC(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.CartridgeKonamiSCC.createFromSaveState(state);
        }
    },

    "R-Type": {
        name: "R-Type",
        desc: "R-Type 384K Mapper Cartridge",
        priority: 121,
        tryFormat: function (rom) {
            // Only R-Type 384K content. Must be selected via info format hint
            if (rom.content.length === 393216) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeRType(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.CartridgeRType.createFromSaveState(state);
        }
    },

    "CrossBlaim": {
        name: "CrossBlaim",
        desc: "CrossBlaim 64K Mapper Cartridge",
        priority: 122,
        tryFormat: function (rom) {
            // Only CrossNlaim 64K content. Must be selected via info format hint
            if (rom.content.length === 65536) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeCrossBlaim(rom);
        },
        createFromSaveState: function (state) {
            return wmsx.CartridgeCrossBlaim.createFromSaveState(state);
        }
    }
};
