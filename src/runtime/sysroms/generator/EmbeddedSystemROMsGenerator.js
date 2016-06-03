// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.EmbeddedSystemROMsGenerator = {

    generate: function() {

        var list = wmsx.EmbeddedSystemROMsGenerator.fileList.slice(0);
        for (var i = 0; i < list.length; ++i) list[i] = { url: WMSX_SYSTEM_ROMS_PATH + list[i], originalFilename: list[i] };

        var d = new wmsx.MultiDownloader(
            list,
            function(specs) {
                var romsFile =
                    "wmsx.EmbeddedSystemROMs = {\n\n" +
                    "    embedFiles: function() {\n" +
                    "        for (var f in this.files) wmsx.MultiDownloader.embedCompressedFile(f, this.files[f]);\n" +
                    "        delete this.files;\n" +
                    "    },\n\n" +
                    "    flushNonExtensionFiles: function() {\n" +
                    "        for (var f = 0; f < this.nonExtensionFiles.length; ++f) wmsx.MultiDownloader.flushEmbeddedFile(this.nonExtensionFiles[f]);\n" +
                    "    },\n\n" +
                    "    files: {";

                var first = true;

                for (i = 0; i < specs.length; ++i) {
                    console.log("Packing: " + specs[i].url);
                    if (!first) romsFile += ",";
                    romsFile += '\n\n        "' + specs[i].originalFilename + '": "' + wmsx.Util.compressInt8BitArrayToStringBase64(specs[i].content) + '"';
                    first = false;
                }

                romsFile += "\n\n    },\n\n" +
                    '    nonExtensionFiles: [\n' +
                    '        "MSX1_JAP.bios", "MSX1_NTSC.bios", "MSX1_PAL.bios",\n' +
                    '        "MSX2_JAP.bios", "MSX2_NTSC.bios", "MSX2_PAL.bios", "MSX2EXT_JAP.bios", "MSX2EXT_NTSC.bios", "MSX2EXT_PAL.bios",\n' +
                    '        "MSX2P_JAP.bios", "MSX2P_NTSC.bios", "MSX2P_PAL.bios", "MSX2PEXT_JAP.bios", "MSX2PEXT_NTSC.bios", "MSX2PEXT_PAL.bios"\n' +
                    "    ]\n\n};\n\n" +
                    "wmsx.EmbeddedSystemROMs.embedFiles();";

                var f = new wmsx.FileDownloader();
                f.registerForDownloadElement(document.getElementsByTagName("body")[0]);
                f.startDownloadBinary("SystemROMs.js", romsFile);
            }
        );

        d.start();
    }

};

wmsx.EmbeddedSystemROMsGenerator.fileList = [
    "DISK.rom",
    "MSX1_JAP.bios",
    "MSX1_NTSC.bios",
    "MSX1_PAL.bios",
    "MSX2EXT_JAP.bios",
    "MSX2EXT_NTSC.bios",
    "MSX2EXT_PAL.bios",
    "MSX2PEXT_JAP.bios",
    "MSX2PEXT_NTSC.bios",
    "MSX2PEXT_PAL.bios",
    "MSX2P_JAP.bios",
    "MSX2P_NTSC.bios",
    "MSX2P_PAL.bios",
    "MSX2_JAP.bios",
    "MSX2_NTSC.bios",
    "MSX2_PAL.bios",
    "MSXDOS22v3.rom",
    "MSXMUSIC.rom",
    "[EMPTY].rom",
    "[RAM64K].rom",
    "[RAMMapper].rom",
    "[SCCExpansion].rom",
    "[SCCIExpansion].rom"
];
