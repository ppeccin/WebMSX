// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Implement Drive B:

// Dual Disk Drive ( A: = drive 0, B: = drive 1 )
wmsx.FileDiskDrive = function() {

    var self = this;

    this.connect = function(diskDriveSocket) {
        diskDriveSocket.connectDrive(this);
    };

    this.connectPeripherals = function(pScreen, pDownloader) {
        screen = pScreen;
        fileDownloader = pDownloader;
    };

    this.loadDiskFile = function(drive, name, arrContent, autoPower) {
        if ((arrContent[0] !== 0xEB) && (arrContent[0] !== 0xE9))
            return null;

        diskFileName[drive] = name;
        diskContent[drive] = arrContent.slice(0);
        diskChanged[drive] = true;
        screen.showOSD("Disk " + (drive === 0 ? "A:" : "B:") + " loaded", true);
        fireStateUpdate();

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
            var fileName = diskFileName[drive] || "NewDisk.dsk";
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

    // Access interface methods

    this.diskHasChanged = function(drive) {
        if (diskChanged[drive]) {
            diskChanged[drive] = false;
            return true;
        }
        return diskChanged[drive];         // false = no, null = unknowm
    };

    this.diskPresent = function(drive) {
        return diskContent[drive] && diskContent[drive].length;
    };

    this.diskWriteProtected = function(drive) {
        return false;
    };

    this.readSectors = function(drive, logicalSector, quantSectors) {
        if (!this.diskPresent(drive)) return null;
        var dContent = diskContent[drive];
        var startByte = logicalSector * diskBytesPerSector;
        var finishByte = startByte + quantSectors * diskBytesPerSector;
        // Disk boundary check
        if ((startByte > dContent.length) || (finishByte > dContent.length - 1)) return null;

        return dContent.slice(startByte, finishByte);
    };

    this.writeSectors = function(drive, logicalSector, quantSectors, bytes) {
        if (!this.diskPresent(drive)) return false;
        var dContent = diskContent[drive];
        var startByte = logicalSector * diskBytesPerSector;
        var quantBytes = quantSectors * diskBytesPerSector;
        // Disk boundary check
        if ((startByte > dContent.length) || (startByte + quantBytes > dContent.length - 1)) return false;

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

    this.allMotorsOff = function() {
        diskMotor[0] = diskMotor[1] = false;
        fireStateUpdate();
    };

    this.motorOffOperation = function(drive) {
        return drive === 1 ? motorOffDriveB : motorOffDriveA;
    };

    // Add a delay before turning the motor off (drive LED simulation)
    function motorOff(drive) {
        if (!diskMotor[drive]) return;
        if (diskMotorOffTimer[drive]) window.clearTimeout(diskMotorOffTimer[drive]);
        diskMotorOffTimer[drive] = window.setTimeout(function() {
            diskMotorOffTimer[drive] = null;
            diskMotor[drive] = false;
            fireStateUpdate();
        }, MOTOR_SPINDOWN_EXTRA_MILLIS);
    }

    function motorOffDriveA() {
        motorOff(0);
    }

    function motorOffDriveB() {
        motorOff(1);
    }

    function fireStateUpdate() {
        screen.diskDrivesStateUpdate(self.diskPresent(0), diskMotor[0], self.diskPresent(1), diskMotor[1]);
    }


    var screen;
    var fileDownloader;

    var diskFileName = [ null, null ];
    var diskContent =  [ null, null ];
    var diskChanged =  [ null, null ];            // true = yes, false = no, null = unknown
    var diskMotor =    [ false, false ];

    var diskMotorOffTimer = [ null, null ];

    var diskBytesPerSector = 512;                 // Fixed for now, for all disks
    this.bytesPerSector = diskBytesPerSector;

    var MOTOR_SPINUP_EXTRA_ITERATIONS = 280000;
    var MOTOR_SPINDOWN_EXTRA_MILLIS = 2300;

};