// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.userROMFormats = {

    init: function() {
        wmsx.SlotCreator.setUserROMFormats(this);
        this.userFormats = JSON.parse(localStorage.wmsxuserformats || "{}");
    },

    getForROM: function(rom) {
        return this.userFormats[rom.info.h];
    },

    setForROM: function(rom, formatName, isAuto) {
        if (!rom.info.h) return;
        if (isAuto) delete this.userFormats[rom.info.h];
        else this.userFormats[rom.info.h] = formatName;

        localStorage.wmsxuserformats = JSON.stringify(this.userFormats);
    }

};

