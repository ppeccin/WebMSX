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
            return true;
        } catch(ex) {
            screen.showOSD(desc + " save FAILED!", true, true);
            wmsx.Util.error(ex);
            return false;
        }
    };

    this.startDownloadURL = function (fileName, url, desc) {
        try {
            if (!saveType) setup();

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

    function setup() {
        saveType = wmsx.Util.isIOSDevice() ? "DATA" : "BLOB";

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
