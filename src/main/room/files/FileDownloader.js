// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileDownloader = function() {
"use strict";

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.registerForDownloadElement = function (element) {
        downloadLinkElementParent = element;
    };

    this.startDownloadBinary = function (fileName, data, desc) {
        try {
            if (!saveType) setup();
            if (checkNone()) return;

            var href;
            if (saveType === "BLOB") {
                // Release previous URL
                if (downloadLinkElement.href) (window.URL || window.webkitURL).revokeObjectURL(downloadLinkElement.href);
                var blob = new Blob([data], {type: "data:application/octet-stream"});
                href = (window.URL || window.webkitURL).createObjectURL(blob);
            } else
                href = "data:application/octet-stream;base64," + btoa(typeof data === "string" ? data : wmsx.Util.int8BitArrayToByteString(data));

            downloadLinkElement.download = fileName && fileName.trim();
            downloadLinkElement.href = href;
            downloadLinkElement.click();

            screen.showOSD(desc + " saved", true);
        } catch(ex) {
            screen.showOSD(desc + " save FAILED!", true, true);
            wmsx.Util.error(ex);
        }
    };

    this.startDownloadURL = function (fileName, url, desc) {
        try {
            if (!saveType) setup();
            if (checkNone()) return;

            if (saveType === "BLOB")
                // Release previous URL
                if (downloadLinkElement.href) (window.URL || window.webkitURL).revokeObjectURL(downloadLinkElement.href);

            downloadLinkElement.download = fileName && fileName.trim();
            downloadLinkElement.href = url;
            downloadLinkElement.click();

            screen.showOSD(desc + " saved", true);
        } catch(ex) {
            screen.showOSD(desc + " save FAILED!", true, true);
            wmsx.Util.error(ex);
        }
    };

    function checkNone() {
        if (saveType === "NONE") {
            alert("Unfortunately file saving in WebApps is broken in this version of iOS. The file could not be saved. If you really need to save a file, you must run WebMSX on the official homepage." );
            return true;
        }
    }

    function setup() {
        saveType = wmsx.Util.isIOSDevice()
            ? wmsx.Util.isBrowserStandaloneMode() ? "NONE" : "DATA"
            : wmsx.Util.browserInfo().name === "SAFARI" ? "DATA" : "BLOB";

        // No need to create link element if we won't use it
        if (saveType === "NONE") return;

        downloadLinkElement = document.createElement('a');
        downloadLinkElement.style.display = "none";
        downloadLinkElement.target = "_blank";
        downloadLinkElement.href = "#";
        downloadLinkElementParent.appendChild(downloadLinkElement);
    }


    var saveType;
    var downloadLinkElement;
    var downloadLinkElementParent;
    var screen;

};
