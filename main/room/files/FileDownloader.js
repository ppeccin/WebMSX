// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileDownloader = function() {

    this.registerForDownloadElement = function (element) {
        downloadLinkElementParent = element;
    };

    this.startDownload = function (fileName, data) {
        if (!downloadLinkElement) createDownloadLinkElement();

        // Release previous URL
        if (downloadLinkElement.href) (window.URL || window.webkitURL).revokeObjectURL(downloadLinkElement.href);

        var blob = new Blob([data], {type: "data:application/octet-stream"});
        downloadLinkElement.download = fileName && fileName.trim();
        downloadLinkElement.href = (window.URL || window.webkitURL).createObjectURL(blob);
        downloadLinkElement.click();
    };

    function createDownloadLinkElement() {
        downloadLinkElement = document.createElement('a');
        downloadLinkElement.style.display = "none";
        downloadLinkElement.href = "#";
        downloadLinkElementParent.appendChild(downloadLinkElement);
    }


    var downloadLinkElement;
    var downloadLinkElementParent;

};
