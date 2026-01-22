// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ROM = function(source, content, info, formatHint, startAddress) {
"use strict";

    this.source = wmsx.Util.leafFilename(source);
    this.content = content;
    this.info = info || wmsx.SlotCreator.produceInfo(this, formatHint, startAddress);

    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: this.source,
            i: this.info
            // content not needed in savestates
        };
    };

    this.reloadEmbeddedContent = function() {
        if (this.content || !wmsx.EmbeddedFiles.isEmbeddedURL(this.source)) return;

        this.source = wmsx.Configurator.adaptROMSourceForOldState(this.source);
        var emb = wmsx.EmbeddedFiles.get(this.source);
        if (!emb) throw new Error("Cannot reload embedded content: " + this.source);

        this.content = emb.content;
    };

};

wmsx.ROM.loadState = function(state) {
    var source = wmsx.Configurator.adaptROMSourceForOldState(state.s);
    return new wmsx.ROM(source, null, state.i);
};
