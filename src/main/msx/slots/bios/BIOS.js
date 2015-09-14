// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// 16K or 32K BIOS. Always positioned at 0x0000
wmsx.BIOS = function(rom) {

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.arrayFill(new Array(65536), 0xff);
        self.bytes = bytes;
        var content = self.rom.content;
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
        self.originalVideoStandard = ((bytes[0x2b] & 0x80) === 0) ? wmsx.VideoStandard.NTSC : wmsx.VideoStandard.PAL;
    }

    this.connect = function(machine) {
        basicExtension = new wmsx.BASICExtension(machine.bus);
        cassetteDriver = new wmsx.ImageCassetteDriver();
        cassetteDriver.connect(this, machine);
    };

    this.disconnect = function(machine) {
        if (cassetteDriver) cassetteDriver.disconnect(this, machine);
    };

    this.getBASICExtension = function() {
        return basicExtension;
    };

    this.powerOn = function(paused) {
    };

    this.powerOff = function() {
        if (cassetteDriver) cassetteDriver.powerOff();
    };

    this.write = function(address, value) {
        //console.log ("Write over BIOS ROM at " + address.toString(16) + " := " + value.toString(16));
        // ROMs cannot be modified
    };

    this.read = function(address) {
        //console.log ("BIOS ROM read: " + address.toString(16) + ", " + bytes[address].toString(16));
        return bytes[address];
    };

    this.setVideoStandardForced = function(forcedVideoStandard) {
        if (forcedVideoStandard === wmsx.VideoStandard.PAL) bytes[0x2b] |= 0x80;
        else bytes[0x2b] &= ~0x80;
    };

    this.setVideoStandardUseOriginal = function() {
        if (this.originalVideoStandard === wmsx.VideoStandard.PAL) bytes[0x2b] |= 0x80;
        else bytes[0x2b] &= ~0x80;
    };

    this.dump = function(from, quant) {
        wmsx.Util.dump(bytes, from, quant);
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = wmsx.SlotFormats.BIOS;

    this.originalVideoStandard = null;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            v: this.originalVideoStandard,
            b: wmsx.Util.compressArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(state) {
        this.rom = wmsx.ROM.loadState(state.r);
        this.originalVideoStandard = state.v;
        bytes = wmsx.Util.uncompressStringBase64ToArray(state.b);
        this.bytes = bytes;
    };


    var cassetteDriver;
    var basicExtension;


    if (rom) init(this);

};

wmsx.BIOS.createFromSaveState = function(state) {
    var bios = new wmsx.BIOS();
    bios.loadState(state);
    return bios;
};

