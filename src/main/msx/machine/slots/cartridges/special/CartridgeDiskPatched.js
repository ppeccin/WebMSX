// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Patched Disk ROM. Will access and command the Disk Drive
wmsx.CartridgeDiskPatched = function(rom) {

    function init(self) {
        self.rom = rom;
        bytes = wmsx.Util.arrayFill(new Array(65536), 0xff);
        self.bytes = bytes;
        var content = self.rom.content;
        // Always start at 0x4000
        for(var i = 0, len = content.length; i < len; i++)
            bytes[0x4000 + i] = content[i];
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
    this.format = wmsx.SlotFormats.DiskPatched;

    var driver;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(wmsx.Util.uInt8ArrayToByteString(bytes))
        };
    };

    this.loadState = function(s) {
        this.rom = wmsx.ROM.loadState(s.r);
        bytes = wmsx.Util.byteStringToUInt8Array(atob(s.b));
        this.bytes = bytes;
    };


    if (rom) init(this);

};

wmsx.CartridgeDiskPatched.prototype = wmsx.Cartridge.base;

wmsx.CartridgeDiskPatched.createFromSaveState = function(state) {
    var cart = new wmsx.CartridgeDiskPatched();
    cart.loadState(state);
    return cart;
};
