// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SystemROMsPacker = {

    pack: function() {

        var list = wmsx.SystemROMsPacker.fileList.slice(0);
        for (var i = 0; i < list.length; ++i) list[i] = { url: WMSX_SYSTEM_ROMS_PATH + list[i], originalFilename: list[i] };

        var d = new wmsx.MultiDownloader(
            list,
            function(specs) {
                var romsFile = "wmsx.MultiDownloader.addEmbeddedFiles({";
                var first = true;

                for (i = 0; i < specs.length; ++i) {
                    console.log("Packing: " + specs[i].url);
                    if (!first) romsFile += ",";
                    romsFile += '\n\n\t"' + specs[i].originalFilename + '": "' + wmsx.Util.compressInt8BitArrayToStringBase64(specs[i].content) + '"';
                    first = false;
                }

                romsFile += "\n\n});";

                var f = new wmsx.FileDownloader();
                f.registerForDownloadElement(document.getElementsByTagName("body")[0]);
                f.startDownload("SystemROMs.js", romsFile);
            }
        );

        d.start();
    }

};

wmsx.SystemROMsPacker.fileList = [
    "DISK.rom",
    "EXPERT10.bios",
    "FMPAC.rom",
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
