// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched Disk ROM. Multiple format, used for all Disk ROM manufacturers. Accesses and commands the Disk Drive
wmsx.CartridgeDiskPatched = function(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = wmsx.Util.arrayFill(new Array(65536), 0x00);
        self.bytes = bytes;
        var content = self.rom.content;
        contentStart = 0x4000;                  // Always start at 0x4000
        contentLength = 16384;                  // Always 16K
        for(var i = 0; i < contentLength; i++)
            bytes[contentStart + i] = content[i];
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

    var contentStart;
    var contentLength;

    this.rom = null;
    this.format = null;

    var driver;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            cs: contentStart,
            cl: contentLength,
            b: btoa(wmsx.Util.uInt8ArrayToByteString(bytes, contentStart, contentLength))
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        this.format = wmsx.SlotFormats[s.f];
        contentStart = s.cs; contentLength = s.cl;
        bytes = wmsx.Util.byteStringToUInt8Array(atob(s.b), 65536, contentStart, 0);
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
