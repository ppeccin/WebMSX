// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Dual Disk Drive ( A: = drive 0, B: = drive 1 )
wmsx.FileDiskDrive = function() {
    var self = this;

    this.connect = function(pDiskDriveSocket) {
        diskDriveSocket = pDiskDriveSocket;
        diskDriveSocket.connectDrive(this);
    };

    this.connectPeripherals = function(pScreen, pDownloader) {
        screen = pScreen;
        fileDownloader = pDownloader;
    };

    this.loadDiskFile = function (drive, name, arrContent, altPower, lenient) {
        var size = arrContent.length;
        if (!this.MEDIA_TYPE_VALID_SIZES.has(size)) return null;                                // Invalid image size
        if (!lenient && (arrContent[0] !== 0xe9 && arrContent[0] !== 0xeb)) return null;        // Probably not a disk image

        var content = loadDisk(drive, name, arrContent.slice(0));
        diskDriveSocket.autoPowerCycle(altPower);
        screen.showOSD("" + ((size / 1024) || 0) + "KB Disk loaded in Drive " + driveName(drive), true);

        return content;
    };

    this.loadNewFormattedDisk = function(drive, mediaType) {                // Cycle among format options if no mediaType given
        if (!mediaType) {
            if (++(nextNewDiskFormatOption[drive]) >= this.FORMAT_OPTIONS_MEDIA_TYPES.length) nextNewDiskFormatOption[drive] = 0;
            mediaType = this.FORMAT_OPTIONS_MEDIA_TYPES[nextNewDiskFormatOption[drive]];
        }
        var fileName = "New " + this.MEDIA_TYPE_INFO[mediaType].desc + " Disk.dsk";
        var content = images.createNewFormattedDisk(mediaType);
        loadDisk(drive, fileName, content);
        screen.showOSD("New formatted " + this.MEDIA_TYPE_INFO[mediaType].desc + " Disk loaded in Drive " + driveName(drive), true);
    };

    this.removeDisk = function(drive) {
        if (noDiskMessage(drive)) return;

        diskFileName[drive] = null;
        diskContent[drive] = null;
        diskChanged[drive] = null;

        screen.showOSD("Disk " + driveName(drive) + " removed", true);
        fireStateUpdate();
    };

    this.saveDiskFile = function(drive) {
        if (noDiskMessage(drive)) return;

        try {
            var dContent = diskContent[drive];
            var fileName = makeFileNameToSave(diskFileName[drive]);
            var data = new ArrayBuffer(dContent.length);
            var view = new Uint8Array(data);
            for (var i = 0; i < dContent.length; i++)
                view[i] = dContent[i];
            fileDownloader.startDownloadBinary(fileName, data);
            screen.showOSD("Disk " + driveName(drive) + " file saved", true);
        } catch(ex) {
            screen.showOSD("Disk " + driveName(drive) + " file save failed", true);
            console.log(ex.stack);
        }
    };

    this.loadFilesAsDisk = function(drive, name, files, altPower, type) {
        var content = images.createFromFiles(0xF9, files);
        if (!content) return null;

        type = type || "Files as Disk";
        loadDisk(drive, name || ("New " + type + ".dsk"), content);
        diskDriveSocket.autoPowerCycle(altPower);
        screen.showOSD(type + " loaded in Drive " + driveName(drive), true);

        return content;
    };


    function loadDisk(drive, name, content) {
        diskFileName[drive] = name;
        diskContent[drive] = content;
        diskChanged[drive] = true;
        fireStateUpdate();
        return diskContent[drive];
    }

    function makeFileNameToSave(fileName) {
        if (!fileName) return "New Disk.dsk";

        var period = fileName.lastIndexOf(".");
        fileName = period < 0 ? fileName : fileName.substr(0, period);
        return fileName + ".dsk";
    }

    // DiskDriver interface methods

    this.diskHasChanged = function(drive) {
        if (diskChanged[drive]) {
            diskChanged[drive] = false;
            return true;
        }
        return diskChanged[drive];         // false = no, null = unknown
    };

    this.diskPresent = function(drive) {
        return !!(diskContent[drive] && diskContent[drive].length);
    };

    this.diskWriteProtected = function(drive) {
        return false;
    };

    this.readSectors = function(drive, logicalSector, quantSectors) {
        if (!this.diskPresent(drive)) return null;
        var dContent = diskContent[drive];
        var startByte = logicalSector * BYTES_PER_SECTOR;
        var finishByte = startByte + quantSectors * BYTES_PER_SECTOR;
        // Disk boundary check
        if ((startByte >= dContent.length) || (finishByte > dContent.length)) return null;

        return dContent.slice(startByte, finishByte);
    };

    this.writeSectors = function(drive, logicalSector, quantSectors, bytes) {
        return this.writeBytes(drive, bytes, logicalSector * BYTES_PER_SECTOR, quantSectors * BYTES_PER_SECTOR);
    };

    this.writeBytes = function (drive, bytes, startByte, quantBytes) {
        if (!this.diskPresent(drive)) return false;

        var dContent = diskContent[drive];
        if (!quantBytes) quantBytes = bytes.length;

        // Disk boundary check
        if ((startByte >= dContent.length) || (startByte + quantBytes > dContent.length)) return false;

        for (var i = 0; i < quantBytes; i++)
            dContent[startByte + i] = bytes[i];

        return true;
    };

    // Returns the extra time for motor to spin (drive LED simulation)
    this.motorOn = function(drive) {
        if (diskMotorOffTimer[drive]) {
            window.clearTimeout(diskMotorOffTimer[drive]);
            diskMotorOffTimer[drive] = null;
        }
        if (diskMotor[drive]) return 0;
        diskMotor[drive] = true;
        fireStateUpdate();
        return MOTOR_SPINUP_EXTRA_ITERATIONS;
    };

    this.allMotorsOff = function(resetDelay) {          // Simulated delay
        motorOff(0, resetDelay);
        motorOff(1, resetDelay);
    };

    this.allMotorsOffNow = function() {                 // Instantly with no delays
        diskMotor[0] = diskMotor[1] = false;
        fireStateUpdate();
    };

    this.loadNewEmptyDisk = function(drive, mediaType) {
        var fileName = "New " + this.MEDIA_TYPE_INFO[mediaType].desc + " Disk.dsk";
        var content = images.createNewEmptyDisk(mediaType);
        loadDisk(drive, fileName, content);
        screen.showOSD("New blank " + this.MEDIA_TYPE_INFO[mediaType].desc + " Disk loaded in Drive " + driveName(drive), true);
    };

    this.formatDisk = function(drive, mediaType) {
        return images.formatDisk(mediaType, diskContent[drive]);
    };

    // Add a delay before turning the motor off (drive LED simulation)
    function motorOff(drive, resetDelay) {
        if (!diskMotor[drive]) return;
        if (diskMotorOffTimer[drive] && resetDelay) {
            window.clearTimeout(diskMotorOffTimer[drive]);
            diskMotorOffTimer[drive] = null;
        }
        if (!diskMotorOffTimer[drive])
            diskMotorOffTimer[drive] = window.setTimeout(function() {
                diskMotorOffTimer[drive] = null;
                diskMotor[drive] = false;
                fireStateUpdate();
            }, MOTOR_SPINDOWN_EXTRA_MILLIS);
    }

    function fireStateUpdate() {
        screen.diskDrivesStateUpdate(diskFileName[0], diskMotor[0], diskFileName[1], diskMotor[1]);
    }

    function noDiskMessage(drive) {
        if (!self.diskPresent(drive)) {
            screen.showOSD("No Disk in Drive " + driveName(drive), true);
            return true;
        } else
            return false;
    }

    function driveName(drive) {
        return (drive === 0 ? "A:" : "B:");
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: diskFileName,
            c: [ wmsx.Util.compressInt8BitArrayToStringBase64(diskContent[0]),
                 wmsx.Util.compressInt8BitArrayToStringBase64(diskContent[1]) ],
            g: diskChanged,
            m: diskMotor
        };
    };

    this.loadState = function(state) {
        diskFileName = state.f;
        var a = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.c[0], diskContent[0]);
        var b = wmsx.Util.uncompressStringBase64ToInt8BitArray(state.c[1], diskContent[1]);
        if (diskContent[0] !== a) diskContent[0] = a;
        if (diskContent[1] !== b) diskContent[1] = b;
        diskChanged = state.g;
        diskMotor = state.m;
        fireStateUpdate();
        this.allMotorsOff(true);
    };


    this.eval = function(str) {
        return eval(str);
    };

    var images = new wmsx.DiskImages();

    var screen;
    var fileDownloader;
    var diskDriveSocket;

    var diskFileName = [ null, null ];
    var diskContent =  [ null, null ];
    var diskChanged =  [ null, null ];            // true = yes, false = no, null = unknown
    var diskMotor =    [ false, false ];

    var diskMotorOffTimer = [ null, null ];

    var nextNewDiskFormatOption = [ -1, -1 ];

    var BYTES_PER_SECTOR = 512;                   // Fixed for now, for all disks

    var MOTOR_SPINUP_EXTRA_ITERATIONS = 150000;
    var MOTOR_SPINDOWN_EXTRA_MILLIS = 2300;

    this.FORMAT_OPTIONS_MEDIA_TYPES = images.FORMAT_OPTIONS_MEDIA_TYPES;
    this.MEDIA_TYPE_INFO = images.MEDIA_TYPE_INFO;
    this.MEDIA_TYPE_VALID_SIZES = images.MEDIA_TYPE_VALID_SIZES;
    this.MEDIA_TYPE_BOOT_SECTOR = images.MEDIA_TYPE_BOOT_SECTOR;
    this.MEDIA_TYPE_DPB = images.MEDIA_TYPE_DPB;

};
