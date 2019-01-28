// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ROM = function(source, content, info, formatHint) {
"use strict";

    this.source = wmsx.Util.leafFilename(source);
    this.content = content;
    this.info = info || wmsx.SlotCreator.produceInfo(this, formatHint);

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
        var emb = wmsx.EmbeddedFiles.get(this.source);
        this.content = emb && emb.content;
    };

};

wmsx.ROM.loadState = function(state) {
    return new wmsx.ROM(state.s, null, state.i);
};
