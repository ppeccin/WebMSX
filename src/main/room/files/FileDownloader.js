// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileDownloader = function() {

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.registerForDownloadElement = function (element) {
        downloadLinkElementParent = element;
    };

    this.startDownloadBinary = function (fileName, data, desc) {
        try {
            if (!downloadLinkElement) createDownloadLinkElement();

            // Release previous URL
            if (downloadLinkElement.href) (window.URL || window.webkitURL).revokeObjectURL(downloadLinkElement.href);

            var blob = new Blob([data], {type: "data:application/octet-stream"});
            downloadLinkElement.download = fileName && fileName.trim();
            downloadLinkElement.href = (window.URL || window.webkitURL).createObjectURL(blob);
            downloadLinkElement.click();
            screen.showOSD(desc + " saved", true);
        } catch(ex) {
            screen.showOSD(desc + " save FAILED!", true, true);
            console.log(ex.stack);
        }
    };

    this.startDownloadURL = function (fileName, url, desc) {
        try {
            if (!downloadLinkElement) createDownloadLinkElement();

            // Release previous URL
            if (downloadLinkElement.href) (window.URL || window.webkitURL).revokeObjectURL(downloadLinkElement.href);

            downloadLinkElement.download = fileName && fileName.trim();
            downloadLinkElement.href = url;
            downloadLinkElement.click();
            screen.showOSD(desc + " saved", true);
        } catch(ex) {
            screen.showOSD(desc + " save FAILED!", true, true);
            console.log(ex.stack);
        }
    };

    function createDownloadLinkElement() {
        downloadLinkElement = document.createElement('a');
        downloadLinkElement.style.display = "none";
        downloadLinkElement.href = "#";
        downloadLinkElementParent.appendChild(downloadLinkElement);
    }


    var downloadLinkElement;
    var downloadLinkElementParent;
    var screen;

};
