// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.EmbeddedSystemFiles = {

    embedFiles: function () {
        // Compressed ROMs and other files
        for (var f in wmsx.CompressedSystemFiles) wmsx.EmbeddedFiles.embedFileCompressedContent(f, wmsx.CompressedSystemFiles[f]);
        delete wmsx.CompressedSystemFiles;

        // ROMs based on diffs from others
        for (var d in this.fileDiffs) wmsx.EmbeddedFiles.embedFileDiff(d, this.fileDiffs[d]);
    },

    fileDiffs: {

        "MSX1_NTSC.bios": { based: "MSX1_PAL.bios", diffs: {
            0x2b: [ 0x11 ],                                             // NTSC flag
            0x7754: [ 0x40, 0x00, 0x45, 0x14 ]                          // PLAY NTSC timing
        }},

        "MSX2_NTSC.bios": { based: "MSX2_PAL.bios", diffs: {
            0x2b: [ 0x11 ],                                             // NTSC flag
            0x7bd7: [ 0x00 ],                                           // reg9 NTSC init
            0x7754: [ 0x40, 0x00, 0x45, 0x14 ]                          // PLAY NTSC timing
        }},

        "MSX2EXT_NTSC.bios": { based: "MSX2EXT_PAL.bios", diffs: {
            0x29ff: [ 0x00 ],                                           // reg9 NTSC init
            0x2b56: [ 0x00 ]                                            // reg9 NTSC init
        }},

        "MSX2PEXT_PAL.bios": { based: "MSX2PEXT_JAP.bios", diffs: {
            0x57e: [ 0x00, 0x05, 0x02, 0x0f, 0x04, 0x04 ],              // mode & colors
            0x2c63: [ 0x02 ]                                            // reg9 PAL init
        }},

        "MSX2P_NTSC.bios": { based: "MSX2P_PAL.bios", diffs: {
            0x2b: [ 0x11 ],                                             // NTSC flag
            0x7754: [ 0x40, 0x00, 0x45, 0x14 ]                          // PLAY NTSC timing
        }},

        "MSX2PEXT_NTSC.bios": { based: "MSX2PEXT_PAL.bios", diffs: {
            0x2c63: [ 0x00 ]                                            // reg9 NTSC init
        }},

        "KanjiBasic_PAL.bios": { based: "[KanjiBasic].bios", diffs: {
            0x3c9b: [ 0x02 ]                                            // reg9 PAL init
        }}

    }

};

wmsx.EmbeddedSystemFiles.embedFiles();
