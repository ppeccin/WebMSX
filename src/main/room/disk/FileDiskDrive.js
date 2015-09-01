// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileDiskDrive = function() {

    this.connect = function(pDiskDriveSocket) {
        diskDriveSocket = pDiskDriveSocket;
        diskDriveSocket.connectDrive(this);
    };

    this.connectPeripherals = function(pScreen, pDownloader) {
        screen = pScreen;
        fileDownloader = pDownloader;
    };

    this.connectBASICExtension = function(pExtension) {
        basicExtension = pExtension;
    };

    this.loadDiskFile = function(name, arrContent, autoPower) {
        if ((arrContent[0] !== 0xEB) && (arrContent[0] !== 0xE9))
            return null;

        diskFileName = name;
        diskContent = arrContent.slice(0);
        screen.showOSD("Disk loaded.", true);
        fireStateUpdate();

        return diskContent;
    };

    this.loadEmpty = function() {
        diskFileName = null;
        diskContent = [];
        screen.showOSD("Disk removed", true);
        fireStateUpdate();
    };


    // Access interface methods

    this.readSectors = function(drive, quant, mediaDesc, sector) {
        // No Disk
        if (!diskContent)
            return { error: 2, sectorsRemaining: quant };

        var bytes = diskContent.slice(sector * 512, sector * 512 + quant * 512);

        return { bytesRead: bytes, sectorsRead: quant };
    };

    this.writeSectors = function(drive, quant, mediaDesc, sector) {
        return {
            error: 2, sectorsRemaining: quant
        }
    };

    this.diskHasChanged = function(drive, mediaDesc) {
        // No Disk
        if (!diskContent)
            return { error: 2 };
        else
            return {};
    };




    function fireStateUpdate() {
//        screen.tapeStateUpdate(diskContent.length > 0, motor);
    }


    var basicExtension;
    var diskDriveSocket;

    var diskFileName = null;
    var diskContent = null;
    var tapePosition = 0;
    var motor = false;

    var screen;
    var fileDownloader;

};