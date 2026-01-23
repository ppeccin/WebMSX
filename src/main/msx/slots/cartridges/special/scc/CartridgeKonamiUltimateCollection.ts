// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Konami and KonamiSCC mapper Cartridge with up to 8MB
// Controls an internal SCC-I sound chip (in SCC or SCC-I mode)
// Also a PCM DAC similar to the one in CartridgeSynthesizer
// 0x4000 - 0xbfff

wmsx.CartridgeKonamiUltimateCollection = function(rom) {
    "use strict";

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.arrayFill(new Array(8388608), 0xff);
        self.bytes = bytes;
        if (rom.content.length > 0) wmsx.Util.arrayCopy(rom.content, 0, bytes);
    }

    this.getDataDesc = function() {
        return "Flash";
    };

    this.loadData = function(name, arrContent) {
        if (arrContent.length === 0 || arrContent.length > 8388608 || (rom.content.length & 0x1fff) !== 0) return null;

        wmsx.Util.arrayCopy(arrContent, 0, bytes);
        sramContentName = name;
        return arrContent;
    };

    this.getDataToSave = function() {
        sramModif = false;
        cartridgeSocket.fireCartridgesModifiedStateUpdate();
        var content = new Uint8Array(bytes);
        return { fileName: sramContentName || "KonamiUltimateCollection.dat", content: content, desc: this.getDataDesc() };
    };

    this.dataModified = function() {
        return sramModif;
    };

    this.connect = function(machine) {
        cartridgeSocket = machine.getCartridgeSocket();
        scc.setAudioSocket(machine.getAudioSocket());
        pcm.setAudioSocket(machine.getAudioSocket());

        if (sccConnected) connectSCC();     // needed in LoadStates
        if (pcmConnected) connectPCM();
    };

    this.disconnect = function(machine) {
        scc.disconnectAudio();
        pcm.disconnectAudio();
    };

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
        scc.disconnectAudio();
        pcm.disconnectAudio();
        this.reset();
    };

    this.reset = function() {
        mapperMode = 0; banksOffset = 0; addressOffset = 0;
        bank1No = 0; bank2No = 1; bank3No = 2; bank4No = 3;
        sccSelected = scciSelected = sccConnected = false; pcmConnected = false;
        scc.reset(); setSCCMode(0);
        pcm.reset();
    };

    this.read = function(address) {
        // wmsx.Util.log("Read: " + wmsx.Util.toHex4(address));

        switch (address & 0xe000) {
            case 0x4000:
                return bytes[addressOffset | (((bank1No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
            case 0x6000:
                return bytes[addressOffset | (((bank2No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
            case 0x8000:
                if (!(address & 0x0100) && address >= 0x9800 && address < 0x9ffe && sccSelected && sccMode === 0x00) return scc.read(address);
                else return bytes[addressOffset | (((bank3No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
            case 0xa000:
                if (!(address & 0x0100) && address >= 0xb800 && address < 0xbffe && scciSelected && sccMode === 0x20) return scc.read(address);
                else return bytes[addressOffset | (((bank4No + banksOffset) & 0xff) << 13) | (address & 0x1fff)];
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
        if (!(mapperMode & 0x04)) {                                     // mapper reg enabled
            if (address === 0x7fff) {
                mapperMode = value;
                addressOffset = (value & 0xc0) << 15;
            } else if (address === 0x7ffe)
                banksOffset = value;
        }

        // Memory Write
        if (mapperMode & 0x10) {                                        // write enabled
            switch (address & 0xe000) {
                case 0x4000: bytes[addressOffset | (((bank1No + banksOffset) & 0xff) << 13) | (address & 0x1fff)] =  value; sramModif = true; break;
                case 0x6000: bytes[addressOffset | (((bank2No + banksOffset) & 0xff) << 13) | (address & 0x1fff)] =  value; sramModif = true; break;
                case 0x8000: bytes[addressOffset | (((bank3No + banksOffset) & 0xff) << 13) | (address & 0x1fff)] =  value; sramModif = true; break;
                case 0xa000: bytes[addressOffset | (((bank4No + banksOffset) & 0xff) << 13) | (address & 0x1fff)] =  value; sramModif = true; break;
            }
        }

        // PCM DAC
        if ((mapperMode & 0x08) && (address & 0xc010) === 0x4000) {     // DAC enabled, 0x4000 - 0x400f, 0x4020 - 0x402f, 0x4040 - -0x404f, .. , 0x7fe0 - 0x7fef
            if (!pcmConnected) connectPCM();
            pcm.setSampleValue(value);
        }

        // Bank Switching
        if (!(mapperMode & 0x02)) {                                     // bank switching enabled
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
                        if (!(mapperMode & 0x08) && address >= 0x5000 && address <= 0x57ff)     // DAC disabled?
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

    function setSCCMode(pMode) {
        sccMode = pMode & 0x30;                         // sccMode & 0x10 disables SCC access!
        scc.setSCCIMode((pMode & 0x20) !== 0);

        // console.log("SCCMode:", sccMode);
    }

    function connectSCC() {
        scc.connectAudio();
        sccConnected = true;
    }

    function connectPCM() {
        pcm.connectAudio();
        pcmConnected = true;
    }


    var cartridgeSocket;

    var bytes;
    this.bytes = null;

    var mapperMode = 0, banksOffset = 0, addressOffset = 0;

    var bank1No = 0, bank2No = 1, bank3No = 2, bank4No = 3;

    var scc = new wmsx.SCCIAudio();
    var sccMode = 0, sccSelected = false, scciSelected = false;
    var sccConnected = false;

    var pcm = new wmsx.PCM8BitAudio();
    var pcmConnected = false;

    var sramContentName;
    var sramModif = false;

    this.rom = null;
    this.format = wmsx.SlotFormats.KonamiUltimateCollection;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressInt8BitArrayToStringBase64(bytes),
            mm: mapperMode, bo: banksOffset, ao: addressOffset,
            b1: bank1No, b2: bank2No, b3: bank3No, b4: bank4No,
            scm: sccMode, scc: scc.saveState(), scs: sccSelected, sis: scciSelected, scn: sccConnected,
            pcm: pcm.saveState(), pcn: pcmConnected
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.uncompressStringBase64ToInt8BitArray(s.b, bytes);
        this.bytes = bytes;
        mapperMode = s.mm; banksOffset = s.bo; addressOffset = s.ao;
        bank1No = s.b1; bank2No = s.b2; bank3No = s.b3; bank4No = s.b4;
        setSCCMode(s.scm); scc.loadState(s.scc); sccSelected = s.scs; scciSelected = s.sis; sccConnected = s.scn;
        pcm.loadState(s.pcm); pcmConnected = s.pcn;

        if (sccConnected) connectSCC();
        if (pcmConnected) connectPCM();
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
