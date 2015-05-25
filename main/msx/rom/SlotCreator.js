// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

SlotCreator = {};

SlotCreator.createFromROM = function(rom) {
    var bios = BIOS.createFromROM(rom);
    if (bios) return bios;
    var cartridge = Cartridge32K.createFromROM(rom);
    if (cartridge) return cartridge;

    var ex = new Error("ROM not supported");
    ex.msxlasturl = true;
    throw ex;
};

