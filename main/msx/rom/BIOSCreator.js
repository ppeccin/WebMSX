// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

BIOSCreator = {};

BIOSCreator.createBIOSFromRom = function(rom) {

    // TODO Using file extension for now
    if (rom.source.toUpperCase().lastIndexOf(".BIOS") !== rom.source.length - 5) return null;

    return new BIOS(rom);

};

