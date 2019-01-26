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
        if (this.content) return true;
        if (!wmsx.EmbeddedFiles.isEmbeddedURL(this.source)) return false;
        var emb = wmsx.EmbeddedFiles.get(this.source);
        if (!emb) return false;
        this.content = emb.content;
        return true;
    };



};

wmsx.ROM.loadState = function(state) {
    return new wmsx.ROM(state.s, null, state.i);
};
