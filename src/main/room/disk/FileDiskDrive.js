// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Implement Drive B:

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

    this.diskPresent = function() {
        return diskContent && diskContent.length;
    };

    this.diskWriteProtected = function() {
        return false;
    };

    this.readSectors = function(logicalSector, quant) {
        if (!this.diskPresent()) {
            console.log("------ NO DISK!");
            return null;
        }
        var startByte = logicalSector * diskBytesPerSector;
        var finishByte = startByte + quant * diskBytesPerSector;
        // Disk boundary check
        if ((startByte > diskContent.length) || (finishByte > diskContent.length -1)) {
            console.log("------ OUT OF DISK WHILE READING!");
            return null;
        }

        return diskContent.slice(startByte, finishByte);
    };

    this.writeSectors = function(bytes, logicalSector, quant) {
        if (!this.diskPresent()) {
            console.log("------ NO DISK!");
            return false;
        }
        var startByte = logicalSector * diskBytesPerSector;
        var quantBytes = quant * diskBytesPerSector;
        // Disk boundary check
        if ((startByte > diskContent.length) || (startByte + quantBytes > diskContent.length -1)) {
            console.log("------ OUT OF DISK WHILE WRITING!");
            return false;
        }

        for (var i = 0; i < quantBytes; i++)
            diskContent[startByte + i] = bytes[i];

        return true;
    };


    function fireStateUpdate() {
        // screen.tapeStateUpdate(diskContent.length > 0, motor);
    }


    var basicExtension;
    var diskDriveSocket;
    var screen;
    var fileDownloader;

    var diskFileName = null;
    var diskContent = null;
    var diskChanged = null;             // true = yes, false = no, null = unknown

    var diskBytesPerSector = 512;       // Fixed for now
    this.bytesPerSector = diskBytesPerSector;

};