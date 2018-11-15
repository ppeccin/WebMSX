// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CompressedSystemFilesGenerator = {

    generate: function() {

        var list = this.fileList.slice(0);
        for (var i = 0; i < list.length; ++i) list[i] = { url: WMSX_SYSTEM_ROMS_PATH + list[i], originalFilename: list[i] };

        var d = new wmsx.MultiDownloader(
            list,
            function onAllSuccess(specs) {
                var romsFile =
                    "// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.\n\n" +
                    "wmsx.CompressedSystemFiles = {";

                var first = true;

                for (i = 0; i < specs.length; ++i) {
                    console.log("Packing: " + specs[i].url);
                    if (!first) romsFile += ",";
                    romsFile += '\n\n   "' + specs[i].originalFilename + '": "' + wmsx.Util.compressInt8BitArrayToStringBase64(specs[i].content) + '"';
                    first = false;
                }

                romsFile += "\n\n};";

                var f = new wmsx.FileDownloader();
                f.connectPeripherals(wmsx.CompressedSystemFilesGenerator);             // Dummy screen for OSD
                f.registerForDownloadElement(document.getElementsByTagName("body")[0]);
                f.startDownloadBinary("CompressedSystemFiles.js", romsFile, "CompressedSystemFiles file");
            }
        );

        d.start();
    },

    showOSD: function() {}

};

wmsx.CompressedSystemFilesGenerator.fileList = [
    "MSX1_JAP.bios",
    "MSX1_PAL.bios",
    "MSX2_JAP.bios",
    "MSX2_PAL.bios",
    "MSX2EXT_JAP.bios",
    "MSX2EXT_PAL.bios",
    "MSX2P_JAP.bios",
    "MSX2P_PAL.bios",
    "MSX2PEXT_JAP.bios",
    "[KanjiBasic].bios",        // Must be concatenated with all MSX2P_EXTs. Optional for MSX2_EXTs. Invalid for MSX1
    "[Kanji1].rom",
    "[DiskPatch].rom",
    "[Nextor16Patch].rom",
    "[MSXMUSIC].rom",
    // "[MSXDOS2]v22.rom",      // No more since Nextor support
    "[Empty].rom",
    "[RAMNormal].rom",
    "[RAMMapper].rom",
    "[SCCExpansion].rom",
    "[SCCIExpansion].rom",
    "[PACExpansion].rom",
    "Disk16MHeader.dat",
    "Disk32MHeader.dat",
    "Disk64MHeader.dat",
    "Disk128MHeader.dat",
    "DOS1Boot.zip",
    "NextorBoot.zip",
    "[MoonSound].rom"
];
