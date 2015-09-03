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
        diskChanged = true;
        screen.showOSD("Disk loaded.", true);
        fireStateUpdate();

        return diskContent;
    };

    this.removeDisk = function() {
        diskFileName = null;
        diskContent = null;
        diskChanged = null;
        screen.showOSD("Disk removed", true);
        fireStateUpdate();
    };


    // Access interface methods

    this.diskHasChanged = function() {
        if (diskChanged) {
            diskChanged = false;
            return true;
        }
        return diskChanged;         // false = no, null = unknowm
    };

    this.readSectors = function(logicalSector, quant) {
        // Disk presence check
        if (!diskContent) {
            console.log("------ NO DISK!");
            return null;
        }
        var startByte = logicalSector * diskBytesPerSector;
        var finishByte = startByte + quant * diskBytesPerSector;
        // Disk boundary check
        if (!diskContent || (startByte > diskContent.length) || (finishByte > diskContent.length -1)) {
            console.log("------ OUT OF DISK!");
            return null;
        }

        return diskContent.slice(startByte, finishByte);
    };


    function fireStateUpdate() {
        // screen.tapeStateUpdate(diskContent.length > 0, motor);
    }


    var basicExtension;
    var diskDriveSocket;
    var screen;
    var fileDownloader;

    var diskBytesPerSector = 512;

    var diskFileName = null;
    var diskContent = null;
    var diskChanged = null;      // true = yes, false = no, null = unknown

};