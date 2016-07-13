// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ROM = function(source, content, info) {
"use strict";

    this.source = wmsx.Util.leafFilename(source);
    this.content = content;
    this.info = info || wmsx.SlotCreator.produceInfo(this);

    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: this.source,
            i: this.info
            // content not needed in savestates
        };
    };

};

wmsx.ROM.loadState = function(state) {
    return new wmsx.ROM(state.s, null, state.i);
};
