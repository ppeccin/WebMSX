// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CompressedSystemROMsGenerator = {

    generate: function() {

        var list = this.fileList.slice(0);
        for (var i = 0; i < list.length; ++i) list[i] = { url: WMSX_SYSTEM_ROMS_PATH + list[i], originalFilename: list[i] };

        var d = new wmsx.MultiDownloader(
            list,
            function onAllSuccess(specs) {
                var romsFile =
                    "// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.\n\n" +
                    "wmsx.CompressedSystemROMs = {";

                var first = true;

                for (i = 0; i < specs.length; ++i) {
                    console.log("Packing: " + specs[i].url);
                    if (!first) romsFile += ",";
                    romsFile += '\n\n   "' + specs[i].originalFilename + '": "' + wmsx.Util.compressInt8BitArrayToStringBase64(specs[i].content) + '"';
                    first = false;
                }

                romsFile += "\n\n};";

                var f = new wmsx.FileDownloader();
                f.connectPeripherals(wmsx.CompressedSystemROMsGenerator);             // Dummy screen for OSD
                f.registerForDownloadElement(document.getElementsByTagName("body")[0]);
                f.startDownloadBinary("CompressedSystemROMs.js", romsFile, "CompressedSystemROMs file");
            }
        );

        d.start();
    },

    showOSD: function() {}

};

wmsx.CompressedSystemROMsGenerator.fileList = [
    "MSX1_JAP.bios",
    "MSX1_PAL.bios",
    "MSX2_JAP.bios",
    "MSX2_PAL.bios",
    "MSX2EXT_JAP.bios",
    "MSX2EXT_PAL.bios",
    "MSX2P_JAP.bios",
    "MSX2P_PAL.bios",
    "MSX2PEXT_JAP.bios",
    "DISK.rom",
    "MSXMUSIC.rom",
    "MSXDOS22v3.rom",
    "[Empty].rom",
    "[RAM64K].rom",
    "[RAMMapper].rom",
    "[SCCExpansion].rom",
    "[SCCIExpansion].rom",
    "[PACExpansion].rom"
];
