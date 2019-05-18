// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// C-Bios v0.29

wmsx.EmbeddedSystemFiles = {

    embedFiles: function () {
        // Compressed ROMs and other files
        for (var f in wmsx.CompressedSystemFiles) wmsx.EmbeddedFiles.embedFileCompressedContent(f, wmsx.CompressedSystemFiles[f]);
        delete wmsx.CompressedSystemFiles;

        // ROMs based on diffs from others
        for (var d in this.fileDiffs) wmsx.EmbeddedFiles.embedFileDiff(d, this.fileDiffs[d]);
    },

    fileDiffs: {

        "cbios_main_msx1_eu.rom": { based: "@cbios_main_msx1.rom", diffs: {
            0x2b: [ 0xa1 ],                                             // PAL flag
            0x259d: [ 0x35 ]                                            // INT Freq
        }},

        "cbios_main_msx2_eu.rom": { based: "@cbios_main_msx2.rom", diffs: {
            0x2b: [ 0xa1 ],                                             // PAL flag
            0xfad: [ 0x02 ],                                            // ???
            0x25b4: [ 0x35 ]                                            // INT Freq
        }},

        "cbios_main_msx2+_eu.rom": { based: "@cbios_main_msx2+.rom", diffs: {
            0x2b: [ 0xa1 ],                                             // PAL flag
            0xfad: [ 0x02 ],                                            // ???
            0x25b4: [ 0x35 ]                                            // INT Freq
        }}

    }

};

wmsx.EmbeddedSystemFiles.embedFiles();

wmsx.SlotFormats.MSXMUSIC.embeddedURL = "@cbios_music[MSXMUSIC].rom";