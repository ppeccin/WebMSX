// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Special 384K ROM with 24 * 16K banks. Bank 1 at 0x4000 fixed at page 0x0f, bank 2 at 0x8000 variable
CartridgeRType = function(rom) {
    var self = this;

    function init() {
        self.rom = rom;
        var content = self.rom.content;
        bytes = Util.arrayFill(new Array(content.length), 0xff);
        for(var i = 0, len = content.length; i < len; i++)
            bytes[i] = content[i];
    }

    this.powerOn = function(paused) {
        bank2Offset = -0x8000;
    };

    this.powerOff = function() {
    };

    this.write = function(address, value) {
        // bank1 fixed at page 0x0f
        if (address >= 0x7000 && address < 0x8000)
            bank2Offset = (value % 24) * 0x4000 - 0x8000;
    };

    this.read = function(address) {
        if (address < 0x8000)
            return bytes[229376 + address];         // Bank 1 fixed at page 0x0f, so 0x0f * 16304 - 0x4000
        else
            return bytes[bank2Offset + address];
    };

    this.dump = function(from, quant) {
        var res = "";
        var i;
        for(i = from; i <= from + quant; i++) {
            res = res + i.toString(16, 2) + " ";
        }
        res += "\n";
        for(i = from; i <= from + quant; i++) {
            var val = this.read(i);
            res = res + (val != undefined ? val.toString(16, 2) + " " : "? ");
        }
        return res;
    };


    var bytes;

    var bank2Offset;

    this.rom = null;
    this.format = SlotFormats.ASCII16;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(Util.uInt8ArrayToByteString(bytes)),
            b2: bank2Offset
        };
    };

    this.loadState = function(s) {
        this.rom = ROM.loadState(s.r);
        bytes = Util.byteStringToUInt8Array(atob(s.b));
        bank2Offset = s.b2;
    };


    if (rom) init();

};

CartridgeRType.createFromSaveState = function(state) {
    var cart = new CartridgeRType();
    cart.loadState(state);
    return cart;
};
