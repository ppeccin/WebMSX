// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Controls an internal SCC-I sound chip (in SCC or SCC-I mode)
// 0x4000 - 0xbfff

// TODO DAC

wmsx.CartridgeKonamiUltimateCollection = function(rom) {
    "use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.asNormalArray(rom.content);
        self.bytes = bytes;
    }

    this.connect = function(machine) {
        scc.setAudioSocket(machine.getAudioSocket());
        if (sccConnected) connectSCC();     // needed in LoadStates
    };

    this.disconnect = function(machine) {
        scc.disconnectAudio();
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        scc.disconnectAudio();
    };

    this.reset = function() {
        mapperMode = 0; banksOffset = 0; addressOffset = 0;
        bank1No = 0; bank2No = 1; bank3No = 2; bank4No = 3;
        sccSelected = scciSelected = sccConnected = false;
        scc.reset();
        setSCCMode(0);
    };

    this.read = function(address) {
        // wmsx.Util.log("Read: " + wmsx.Util.toHex4(address));

        // SCC Read
        if (!(address & 0x0100)) {
            if ((address >= 0x9800 && address < 0x9ffe && sccSelected && sccMode === 0x00)
                || (address >= 0xb800 && address < 0xbffe && scciSelected && sccMode === 0x20))
                return scc.read(address);
        }

        switch (address & 0xe000) {
            case 0x4000:
                return bytes[addressOffset | (((bank1No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
            case 0x6000:
                return bytes[addressOffset | (((bank2No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
            case 0x8000:
                return bytes[addressOffset | (((bank3No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
            case 0xa000:
                return bytes[addressOffset | (((bank4No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
            default:
                return 0xff;
        }
    };

    this.write = function(address, value) {
        // wmsx.Util.log("Write: " + wmsx.Util.toHex4(address) + ', ' + value);

        // SCC Write
        if (!(address & 0x0100)) {
            if ((sccMode === 0x00 && address >= 0x9800 && address < 0x9ffe && sccSelected)
                || (sccMode === 0x20 && address >= 0xb800 && address < 0xbffe && scciSelected))
                return scc.write(address, value);
        }

        // Mapper and Offset registers
        if (!(mapperMode & 0x04)) {                                 // mapper reg enabled
            if (address === 0x7fff)      setMapperMode(value);
            else if (address === 0x7ffe) setMapperOffset(value);
        }

        // Bank Switching
        if (!(mapperMode & 0x02)) {                                 // bank switching enabled
            if (!(mapperMode & 0x20)) {
                // KonamiSCC
                switch (address & 0xe000) {
                    case 0x4000:
                        if (address >= 0x5000 && address <= 0x57ff)
                            bank1No = value;
                        break;
                    case 0x6000:
                        if (address >= 0x7000 && address <= 0x77ff)
                            bank2No = value;
                        break;
                    case 0x8000:
                        if (address >= 0x9000 && address <= 0x97ff) {
                            bank3No = value;
                            sccSelected = (value & 0x3f) === 0x3f;               // Special value to activate the SCC
                        }
                        break;
                    case 0xa000:
                        if (address >= 0xb000 && address <= 0xb7ff) {
                            bank4No = value;
                            scciSelected = (value & 0x80) === 0x80;              // Special value to activate the SCC-I
                        }
                        break;
                }
            } else {
                // Konami
                switch (address & 0xe000) {
                    case 0x4000:
                        if ((mapperMode & 0x08) === 0 && address >= 0x5000 && address <= 0x57ff)     // DAC disabled?
                            bank1No = value;
                        break;
                    case 0x6000:
                        bank2No = value;
                        break;
                    case 0x8000:
                        bank3No = value;
                        sccSelected = (value & 0x3f) === 0x3f;                  // Special value to activate the SCC
                        break;
                    case 0xa000:
                        bank4No = value;
                        scciSelected = (value & 0x80) === 0x80;                 // Special value to activate the SCC-I
                        break;
                }
            }

            // SCC Mode register
            if (address === 0xbffe || address === 0xbfff)
                setSCCMode(value);

            if ((sccSelected || scciSelected) && !sccConnected) connectSCC();
        }
    };

    function setMapperMode(value) {
        mapperMode = value;
        addressOffset = (value & 0xc0) << 15;

        // console.log("MapperMode:", value.toString(16));
    }

    function setMapperOffset(value) {
        banksOffset = value;

        // console.log("MapperOffset:", value);
    }

    function setSCCMode(pMode) {
        sccMode = pMode & 0x30;                         // sccMode & 0x10 disables SCC access!
        scc.setSCCIMode((pMode & 0x20) !== 0);

        // console.log("SCCMode:", sccMode);
    }

    function connectSCC() {
        scc.connectAudio();
        sccConnected = true;
    }


    var bytes;
    this.bytes = null;

    var sccMode, mapperMode, banksOffset, addressOffset;

    var bank1No, bank2No, bank3No, bank4No;

    var scc = new wmsx.SCCIAudio();
    var sccSelected, scciSelected = false;
    var sccConnected = false;

    this.rom = null;
    this.format = wmsx.SlotFormats.KonamiUltimateCollection;


    // TODO Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            m: sccMode,
            b1: bank1No,
            b2: bank2No,
            b3: bank3No,
            b4: bank4No,
            scc: scc.saveState(),
            scs: sccSelected,
            sis: scciSelected,
            scn: sccConnected
        };
    };

    this.loadState = function(s) {
        this.format = wmsx.SlotFormats[s.f];
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        bank1No = s.b1;
        bank2No = s.b2;
        bank3No = s.b3;
        bank4No = s.b4;
        setSCCMode(s.m);
        scc.loadState(s.scc);
        sccSelected = s.scs;
        scciSelected = s.sis;
        sccConnected = s.scn;

        if (sccConnected) connectSCC();
    };

    this.eval = function(str) {
        return eval(str);
    };


    if (rom) init(this);

};

wmsx.CartridgeKonamiUltimateCollection.prototype = wmsx.Slot.base;

wmsx.CartridgeKonamiUltimateCollection.recreateFromSaveState = function(state, previousSlot) {
    var cart = previousSlot || new wmsx.CartridgeKonamiUltimateCollection();
    cart.loadState(state);
    return cart;
};


/*
    Documentation from Manuel Pazos (producer of the cartridge)

   Konami Ultimate Collection shares some features of MegaFlashROM SCC+ SD.
   It uses the same flashROM, SCC/SCC+, Konami and Konami SCC mappers, etc.

    [OFFSET REGISTER (#7FFE)]
    7-0: Bank offset

    [MAPPER REGISTER (#7FFF)]
    7     A21 \
    6     A20 / FlashROM address lines to switch 2 MB banks.
    5     Mapper mode  :   Select Konami mapper (0=SCC or 1=normal). [1]
    4     Flash write enable
    3     Disable #4000-#5FFF mapper in Konami mode, Enable DAC (works like the DAC of Synthesizer or Majutsushi)
    2     Disable mapper register
    1     Disable mapper (bank switching)
    0     no function anymore (was mapper limits)

 */
