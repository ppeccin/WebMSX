// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched Disk ROM. Multiple format, used for all Disk ROM manufacturers. Accesses and commands the Disk Drive
wmsx.CartridgeDiskPatched = function(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = wmsx.Util.arrayFill(new Array(65536), 0xff);
        self.bytes = bytes;
        var content = self.rom.content;
        // Uses position from info if present
        var start = rom.info.s ? Number.parseInt(rom.info.s) : 0x4000;   // Start at 0x4000 by default
        var len = content.length;
        for(var i = 0; i < len; i++)
            bytes[start + i] = content[i];
    }

    this.connect = function(machine) {
        driver = new wmsx.ImageDiskDriver();
        driver.connect(this, machine);
    };

    this.disconnect = function(machine) {
        if (driver) driver.disconnect(this, machine);
    };

    this.powerOff = function() {
        if (driver) driver.powerOff();
    };

    this.read = function(address) {
        return bytes[address];
    };


    var bytes;
    this.bytes = null;

    this.rom = null;
    this.format = null;

    var driver;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: wmsx.Util.compressArrayToStringBase64(bytes)
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        this.format = wmsx.SlotFormats[s.f];
        bytes = wmsx.Util.uncompressStringBase64ToArray(s.b);
        this.bytes = bytes;
    };


    if (rom && format) init(this);

};

wmsx.CartridgeDiskPatched.prototype = wmsx.Slot.base;

wmsx.CartridgeDiskPatched.createFromSaveState = function(state) {
    var cart = new wmsx.CartridgeDiskPatched(null, null);
    cart.loadState(state);
    return cart;
};
