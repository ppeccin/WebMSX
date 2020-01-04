// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.EmbeddedSystemFiles = {

    embedFiles: function () {
        // Compressed ROMs and other system files
        for (var f in wmsx.CompressedSystemFiles) wmsx.EmbeddedFiles.embedFileCompressedContent(f, wmsx.CompressedSystemFiles[f]);
        delete wmsx.CompressedSystemFiles;

        // ROMs based on diffs from others
        for (var d in this.fileDiffs) wmsx.EmbeddedFiles.embedFileDiff(d, this.fileDiffs[d]);
    },

    fileDiffs: {

        // MSX1 NTSC Main Bios+Basic, based on PAL version
        "MSX1_NTSC.bios": { based: "@MSX1_PAL.bios", diffs: {
            0x2b: [ 0x11 ],                                             // NTSC flag
            0x7754: [ 0x40, 0x00, 0x45, 0x14 ]                          // PLAY NTSC timing
        }},

        // MSX2 NTSC Main Bios+Basic, based on PAL version
        "MSX2_NTSC.bios": { based: "@MSX2_PAL.bios", diffs: {
            0x2b: [ 0x11 ],                                             // NTSC flag
            0x7bd7: [ 0x00 ],                                           // reg9 NTSC init
            0x7754: [ 0x40, 0x00, 0x45, 0x14 ]                          // PLAY NTSC timing
        }},

        // MSX2 NTSC Ext Bios, based on PAL version
        "MSX2EXT_NTSC.bios": { based: "@MSX2EXT_PAL.bios", diffs: {
            0x29ff: [ 0x00 ],                                           // reg9 NTSC init
            0x2b56: [ 0x00 ]                                            // reg9 NTSC init
        }},

        // MSX2+ NTSC Main Bios+Basic, based on PAL version
        "MSX2P_NTSC.bios": { based: "@MSX2P_PAL.bios", diffs: {
            0x2b: [ 0x11 ],                                             // NTSC flag
            0x7754: [ 0x40, 0x00, 0x45, 0x14 ]                          // PLAY NTSC timing
        }},

        // MSX2+ NTSC Ext Bios, based on PAL version
        "MSX2PEXT_NTSC.bios": { based: "@MSX2PEXT_PAL.bios", diffs: {
                                                                                                // TODO Country?
            0x2c63: [ 0x00 ]                                            // reg9 NTSC init
        }},

        // MSX2+ PAL Ext Bios, based on JAP version
        "MSX2PEXT_PAL.bios": { based: "@MSX2PEXT_JAP.bios", diffs: {
            0x57e: [ 0x00, 0x05, 0x02, 0x0f, 0x04, 0x04 ],              // mode & colors        // TODO Country?
            0x2c63: [ 0x02 ]                                            // reg9 PAL init
        }},

        // MSX2+ PAL KanjiBasic + Logo, based on NTSC version
        "KanjiBasic2PLogo_PAL.bios": { based: "@KanjiBasic2PLogo_NTSC.bios", diffs: {
            0x3c9b: [ 0x02 ]                                            // reg9 PAL init
        }},

        // MSX2+ NTSC Bootlogo, based on PAL version
        "MSX2POPEN_NTSC.bios": { based: "@MSX2POPEN_PAL.bios", diffs: {
            0x3c9b: [ 0x00 ]                                            // reg9 NTSC init
        }},

        // MSX tR NTSC Main Bios+Basic, based on PAL version
        "MSXTR_NTSC.bios": { based: "@MSXTR_PAL.bios", diffs: {
            0x2b: [ 0x11 ],                                             // NTSC flag
            0x42d: [ 0x3e, 0x50, 0xd3, 0xaa ],                          // PAL init removed
            0x58c: [ 0x14 ],                                            // key repeat timing
            0xc97: [ 0x02 ],                                            // key scan freq
            0xcf1: [ 0x01 ],                                            // key repeat timing
            0xd4a: [ 0x14 ],                                            // key repeat timing
            0x7754: [ 0x40, 0x00, 0x45, 0x14 ]                          // PLAY NTSC timing
        }},

        // MSX tR NTSC Ext Bios, based on PAL version
        "MSXTREXT_NTSC.bios": { based: "@MSXTREXT_PAL.bios", diffs: {
            0x581: [ 0x01 ],                                            // country
            0x2c6c: [ 0x00 ]                                            // reg9 NTSC init
        }},

        // MSX tR NTSC Bootlogo, based on PAL version
        "MSXTROPEN_NTSC.bios": { based: "@MSXTROPEN_PAL.bios", diffs: {
            0x3c3e: [ 0x00 ]                                            // reg9 NTSC init
        }},


        // Old versions files for Savestate backward compatibility

        "[MoonSound].rom": { based: "@[OPL4].rom", diffs: {} }

    }

};

wmsx.EmbeddedSystemFiles.embedFiles();
