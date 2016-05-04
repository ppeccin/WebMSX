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

    this.loadDiskFile = function(drive, name, arrContent, altPower) {
        if ((arrContent[0] !== 0xEB) && (arrContent[0] !== 0xE9))
            return null;

        diskFileName[drive] = name;
        diskContent[drive] = arrContent.slice(0);
        diskChanged[drive] = true;
        screen.showOSD("Disk " + (drive === 0 ? "A:" : "B:") + " loaded", true);
        fireStateUpdate();

        diskDriveSocket.autoPowerCycle(altPower);

        return diskContent[drive];
    };

    this.loadEmptyDisk = function(drive) {      // Formatted
        if (++(nextNewDiskFormat[drive]) >= FORMAT_OPTION_DESC.length) (nextNewDiskFormat[drive]) = 0;      // Cycle available formats
        var format = nextNewDiskFormat[drive];
        this.createNewEmptyDisk(drive, format);
        this.formatDisk(drive, format);
        screen.showOSD("New formatted " + FORMAT_OPTION_DESC[format] + " disk loaded in " + (drive === 0 ? "A:" : "B:"), true);
        return diskContent[drive];
    };

    this.createNewEmptyDisk = function(drive, format) {
        diskFileName[drive] = "New Disk " + FORMAT_OPTION_DESC[format] + ".dsk";
        diskContent[drive] = wmsx.Util.arrayFill(new Array(FORMAT_OPTION_SIZE[format]), 0);
        diskChanged[drive] = true;
        fireStateUpdate();
        screen.showOSD("New empty " + FORMAT_OPTION_DESC[format] + " disk loaded in " + (drive === 0 ? "A:" : "B:"), true);
        return diskContent[drive];
    };

    this.removeDisk = function(drive) {
        diskFileName[drive] = null;
        diskContent[drive] = null;
        diskChanged[drive] = null;
        screen.showOSD("Disk " + (drive === 0 ? "A:" : "B:") + " removed", true);
        fireStateUpdate();
    };

    this.saveDiskFile = function(drive) {
        var dContent = diskContent[drive];
        var dName = (drive === 0 ? "A:" : "B:");
        if (!dContent || (dContent.length === 0)) {
            screen.showOSD("Drive " + dName + " is empty!", true);
            return;
        }

        try {
            var fileName = diskFileName[drive] || "New Disk.dsk";
            var data = new ArrayBuffer(dContent.length);
            var view = new Uint8Array(data);
            for (var i = 0; i < dContent.length; i++)
                view[i] = dContent[i];
            fileDownloader.startDownload(fileName, data);
            screen.showOSD("Disk " + dName + " File saved", true);
        } catch(ex) {
            screen.showOSD("Disk " + dName + " File save failed", true);
        }
    };

    // DiskDriver interface methods

    this.diskHasChanged = function(drive) {
        if (diskChanged[drive]) {
            diskChanged[drive] = false;
            return true;
        }
        return diskChanged[drive];         // false = no, null = unknowm
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

    this.formatDisk = function(drive, format) {
        // Write Boot Sector
        self.writeBytes(drive, FORMAT_OPTION_BOOT_SECTOR[format], 0);
        // Write starting bytes of FAT
        self.writeBytes(drive, FORMAT_OPTION_FAT_START[format], 1 * BYTES_PER_SECTOR);
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


    var screen;
    var fileDownloader;
    var diskDriveSocket;

    var diskFileName = [ null, null ];
    var diskContent =  [ null, null ];
    var diskChanged =  [ null, null ];            // true = yes, false = no, null = unknown
    var diskMotor =    [ false, false ];

    var diskMotorOffTimer = [ null, null ];

    var nextNewDiskFormat = [ 0, 0 ];

    var BYTES_PER_SECTOR = 512;                   // Fixed for now, for all disks

    var MOTOR_SPINUP_EXTRA_ITERATIONS = 150000;
    var MOTOR_SPINDOWN_EXTRA_MILLIS = 2300;

    var FORMAT_OPTION_DESC = [ "360KB", "720KB" ];
    var FORMAT_OPTION_SIZE = [ 360 * 1024, 720 * 1024 ];
    var FORMAT_OPTION_BOOT_SECTOR = [
        [
            0xEB, 0xFE, 0x90, 0x4E, 0x4D, 0x53, 0x20, 0x32, 0x2E, 0x30, 0x50, 0x00, 0x02, 0x02, 0x01, 0x00,
            0x02, 0x70, 0x00, 0xD0, 0x02, 0xF8, 0x02, 0x00, 0x09, 0x00, 0x01, 0x00, 0x00, 0x00, 0xD0, 0xED,
            0x53, 0x59, 0xC0, 0x32, 0xD0, 0xC0, 0x36, 0x56, 0x23, 0x36, 0xC0, 0x31, 0x1F, 0xF5, 0x11, 0xAB,
            0xC0, 0x0E, 0x0F, 0xCD, 0x7D, 0xF3, 0x3C, 0xCA, 0x63, 0xC0, 0x11, 0x00, 0x01, 0x0E, 0x1A, 0xCD,
            0x7D, 0xF3, 0x21, 0x01, 0x00, 0x22, 0xB9, 0xC0, 0x21, 0x00, 0x3F, 0x11, 0xAB, 0xC0, 0x0E, 0x27,
            0xCD, 0x7D, 0xF3, 0xC3, 0x00, 0x01, 0x58, 0xC0, 0xCD, 0x00, 0x00, 0x79, 0xE6, 0xFE, 0xFE, 0x02,
            0xC2, 0x6A, 0xC0, 0x3A, 0xD0, 0xC0, 0xA7, 0xCA, 0x22, 0x40, 0x11, 0x85, 0xC0, 0xCD, 0x77, 0xC0,
            0x0E, 0x07, 0xCD, 0x7D, 0xF3, 0x18, 0xB4, 0x1A, 0xB7, 0xC8, 0xD5, 0x5F, 0x0E, 0x06, 0xCD, 0x7D,
            0xF3, 0xD1, 0x13, 0x18, 0xF2, 0x42, 0x6F, 0x6F, 0x74, 0x20, 0x65, 0x72, 0x72, 0x6F, 0x72, 0x0D,
            0x0A, 0x50, 0x72, 0x65, 0x73, 0x73, 0x20, 0x61, 0x6E, 0x79, 0x20, 0x6B, 0x65, 0x79, 0x20, 0x66,
            0x6F, 0x72, 0x20, 0x72, 0x65, 0x74, 0x72, 0x79, 0x0D, 0x0A, 0x00, 0x00, 0x4D, 0x53, 0x58, 0x44,
            0x4F, 0x53, 0x20, 0x20, 0x53, 0x59, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ],
        [
            0xEB, 0xFE, 0x90, 0x4E, 0x4D, 0x53, 0x20, 0x32, 0x2E, 0x30, 0x50, 0x00, 0x02, 0x02, 0x01, 0x00,
            0x02, 0x70, 0x00, 0xA0, 0x05, 0xF9, 0x03, 0x00, 0x09, 0x00, 0x02, 0x00, 0x00, 0x00, 0xD0, 0xED,
            0x53, 0x59, 0xC0, 0x32, 0xD0, 0xC0, 0x36, 0x56, 0x23, 0x36, 0xC0, 0x31, 0x1F, 0xF5, 0x11, 0xAB,
            0xC0, 0x0E, 0x0F, 0xCD, 0x7D, 0xF3, 0x3C, 0xCA, 0x63, 0xC0, 0x11, 0x00, 0x01, 0x0E, 0x1A, 0xCD,
            0x7D, 0xF3, 0x21, 0x01, 0x00, 0x22, 0xB9, 0xC0, 0x21, 0x00, 0x3F, 0x11, 0xAB, 0xC0, 0x0E, 0x27,
            0xCD, 0x7D, 0xF3, 0xC3, 0x00, 0x01, 0x58, 0xC0, 0xCD, 0x00, 0x00, 0x79, 0xE6, 0xFE, 0xFE, 0x02,
            0xC2, 0x6A, 0xC0, 0x3A, 0xD0, 0xC0, 0xA7, 0xCA, 0x22, 0x40, 0x11, 0x85, 0xC0, 0xCD, 0x77, 0xC0,
            0x0E, 0x07, 0xCD, 0x7D, 0xF3, 0x18, 0xB4, 0x1A, 0xB7, 0xC8, 0xD5, 0x5F, 0x0E, 0x06, 0xCD, 0x7D,
            0xF3, 0xD1, 0x13, 0x18, 0xF2, 0x42, 0x6F, 0x6F, 0x74, 0x20, 0x65, 0x72, 0x72, 0x6F, 0x72, 0x0D,
            0x0A, 0x50, 0x72, 0x65, 0x73, 0x73, 0x20, 0x61, 0x6E, 0x79, 0x20, 0x6B, 0x65, 0x79, 0x20, 0x66,
            0x6F, 0x72, 0x20, 0x72, 0x65, 0x74, 0x72, 0x79, 0x0D, 0x0A, 0x00, 0x00, 0x4D, 0x53, 0x58, 0x44,
            0x4F, 0x53, 0x20, 0x20, 0x53, 0x59, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]
    ];
    var FORMAT_OPTION_FAT_START = [ [ 0xF8, 0xFF, 0xFF ], [ 0xF9, 0xFF, 0xFF ] ];

};