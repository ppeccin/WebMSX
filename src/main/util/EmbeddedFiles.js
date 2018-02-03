// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.EmbeddedFiles = {

    get: function(fileName) {
        var comp = this.compressedContent[fileName];
        if (comp !== undefined) return { name: fileName, content: wmsx.Util.uncompressStringBase64ToInt8BitArray(comp) };

        var diff = this.diffsContent[fileName];
        if (diff === undefined) return undefined;

        var base = this.get(diff.based);
        if (base === undefined) return undefined;

        var content = base.content;
        for (var add in diff.diffs) {
            var bytes = diff.diffs[add];
            for (var i = 0; i < bytes.length; ++i) content[(add | 0) + i] = bytes[i];
        }
        return { name: fileName, content: content };
    },

    embedFileCompressedContent: function(fileName, compressedContent) {
        this.compressedContent[fileName] = compressedContent;
    },

    embedFileDiff: function(fileName, diffs) {
        this.diffsContent[fileName] = diffs;
    },

    isEmbeddedURL: function(url) {
        return url && url[0] === "@";
    },

    compressedContent: {},

    diffsContent: {}

};
