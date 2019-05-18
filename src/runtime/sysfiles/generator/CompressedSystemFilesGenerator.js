// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CompressedSystemFilesGenerator = {

    generate: function() {

        var list = wmsx.CompressedSystemFilesList.slice(0);
        for (var i = 0; i < list.length; ++i) list[i] = { url: WMSX_SYSTEM_ROMS_PATH + list[i], originalFilename: list[i].split("/").pop() };

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
                    romsFile += '\n\n    "' + specs[i].originalFilename + '": "' + wmsx.Util.compressInt8BitArrayToStringBase64(specs[i].content) + '"';
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
