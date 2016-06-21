// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Dual Disk Drive ( A: = drive 0, B: = drive 1 )
wmsx.FileDiskDrive = function() {
    var self = this;

    function init() {
        emptyStack(0);
        emptyStack(1);
    }

    this.connect = function(pDiskDriveSocket) {
        diskDriveSocket = pDiskDriveSocket;
        diskDriveSocket.connectDrive(this);
        images.connect(diskDriveSocket);
    };

    this.connectPeripherals = function(pScreen, pDownloader) {
        screen = pScreen;
        fileDownloader = pDownloader;
    };

    this.loadDiskStackFromFiles = function (drive, name, files, altPower, addToStack, filesFromZip) {
        if (addToStack && maxStackReachedMessage(drive)) return [];

        var stack = [];
        var maxStack = addToStack ? MAX_STACK - driveStack[drive].length : MAX_STACK;
        try {
            for (var i = 0; i < files.length && stack.length < maxStack; i++) {
                var file = files[i];
                if (filesFromZip && file.content === undefined) file.content = file.asUint8Array();
                var disk = checkFileIsValidImage(file);
                if (disk) stack.push(disk);
            }
            if (stack.length > 0) {
                loadStack(drive, stack, altPower, addToStack);
                stackLoadedMessage(drive, null, stack.length, addToStack);
                return stack;
            }
        } catch(ez) {
            console.log(ez.stack);      // Error decompressing files. Abort
        }
        return null;
    };

    this.loadAsDiskFromFiles = function (drive, name, files, altPower, addToStack, type) {
        var content = images.createFromFiles(0xF9, files);
        if (!content) return null;
        if (addToStack && maxStackReachedMessage(drive)) return [];

        type = type || "Files as Disk";
        name = name || ("New " + type + ".dsk");
        var stack = [{ name: name, content: content }];
        loadStack(drive, stack, altPower, addToStack);
        stackLoadedMessage(drive, type, stack.length, addToStack);
        return stack;
    };

    this.insertNewDisk = function(drive, mediaType, unformatted) {     // Cycle among format options if no mediaType given
        if (!mediaType) {
            if (++(nextNewDiskFormatOption[drive]) >= this.FORMAT_OPTIONS_MEDIA_TYPES.length) nextNewDiskFormatOption[drive] = 0;
            mediaType = this.FORMAT_OPTIONS_MEDIA_TYPES[nextNewDiskFormatOption[drive]];
        }
        var fileName = "New " + this.MEDIA_TYPE_INFO[mediaType].desc + " Disk.dsk";
        var content = unformatted ? images.createNewBlankDisk(mediaType) : images.createNewFormattedDisk(mediaType);

        // Add a new disk to the stack?
        var add = driveStack[drive].length === 0 || !driveBlankDiskAdded[drive];    // Only add 1 disk to loaded stacks, always to the bottom
        if (add) driveStack[drive].push({});

        curDisk[drive] = driveStack[drive].length - 1;
        replaceCurrentDisk(drive, fileName, content);
        driveBlankDiskAdded[drive] = true;

        add = add && driveStack[drive].length > 1;
        screen.showOSD((add ? "New " : "") + "Blank" + (!unformatted ? " Formatted" : "") + " Disk " + (add ? "added. " : "inserted. ") + currentDiskDesc(drive), true);

        if (add) self.openDiskSelectDialog(drive, 0, true);
    };

    this.removeStack = function(drive) {
        if (noDiskInsertedMessage(drive)) return;

        var wasStack = driveStack[drive].length > 1;
        emptyStack(drive);
        driveDiskChanged[drive] = null;

        screen.showOSD((wasStack ? "Disk Stack in Drive " : "Disk ") + driveName[drive] + " removed", true);
        fireMediaStateUpdate(drive);
    };

    this.saveDiskFile = function(drive) {
        if (noDiskInsertedMessage(drive)) return;

        try {
            fileDownloader.startDownloadBinary(makeFileNameToSave(getCurrentDisk(drive).name), new Uint8Array(getCurrentDisk(drive).content), "Disk " + driveName[drive] + " file");
        } catch(ex) {
            // give up
        }
    };

    this.autoPowerCycle = function(altPower) {
        if (getCurrentDisk(0)) diskDriveSocket.autoPowerCycle(altPower);       // Only if Drive A: has a disk
    };

    this.openDiskSelectDialog = function(drive, inc, altPower) {
        if (noDiskInsertedMessage(drive)) return;
        screen.openDiskSelectDialog(drive, inc, altPower);
    };

    this.insertDisk = function(drive, num) {
        setCurrentDiskNum(drive, num);
        diskInsertedMessage(drive);
        fireMediaStateUpdate(drive);
    };

    this.getDriveStack = function(drive) {
        return driveStack[drive];
    };

    this.getCurrentDiskNum = function(drive) {
        return curDisk[drive];
    };

    this.getCurrentDiskDesc = function(drive) {
        return currentDiskDesc(drive);
    };

    this.getCurrentDiskNumDesc = function(drive) {
        return currentDiskNumDesc(drive);
    };

    this.moveDiskInStack = function (drive, from, to) {
        var stack = driveStack[drive];
        if (from < 0 || to < 0 || from > stack.length -1 || to > stack.length -1) return;
        var disk = stack[curDisk[drive]];
        stack.splice(to, 0, stack.splice(from, 1)[0]);
        if (disk) curDisk[drive] = stack.indexOf(disk);
        fireMediaStateUpdate(drive);
    };

    function checkFileIsValidImage(file, stopRecursion) {
        var zip = wmsx.Util.checkContentIsZIP(file.content);
        if (zip && !stopRecursion) {
            try {
                var files = wmsx.Util.getZIPFilesSorted(zip);
                for (var f in files) {
                    files[f].content = files[f].asUint8Array();
                    var res = checkFileIsValidImage(files[f], true);
                    if (res) return res;
                }
            } catch (ez) {
                console.log(ez.stack);      // Error decompressing files. Abort
            }
            return null;
        }

        if (!checkContentIsValidImage(file.content)) return null;

        var fileName = file.name.split("/").pop();
        return { name: fileName, content: file.content };
    }

    function checkContentIsValidImage(content) {
        return self.MEDIA_TYPE_VALID_SIZES.has(content.length) ? content : null;            // Valid image size
        //(anyContent || content[0] === 0xe9 || content[0] === 0xeb);                       // Valid boot sector?
    }

    function emptyStack(drive) {
        driveStack[drive].length = 0;
        curDisk[drive] = -1;
    }

    function loadStack(drive, stack, altPower, add) {
        if (add) {
            driveStack[drive] = driveStack[drive].concat(stack);
        } else {
            driveStack[drive] = stack;
            driveBlankDiskAdded[drive] = false;
            setCurrentDiskNum(drive, 0);
        }
        fireMediaStateUpdate(drive);
        if (driveStack[drive].length > 1) self.openDiskSelectDialog(drive, 0, altPower);
        else self.autoPowerCycle(altPower);
    }

    function replaceCurrentDisk(drive, name, content) {     // Affects only current disk from stack
        getCurrentDisk(drive).name = name;
        getCurrentDisk(drive).content = content;
        driveDiskChanged[drive] = true;
        fireMediaStateUpdate(drive);
        return content;
    }

    function makeFileNameToSave(fileName) {
        if (!fileName) return "New Disk.dsk";

        var period = fileName.lastIndexOf(".");
        fileName = period < 0 ? fileName : fileName.substr(0, period);
        return fileName + ".dsk";
    }

    // DiskDriver interface methods

    this.diskHasChanged = function(drive) {
        if (driveDiskChanged[drive]) {
            driveDiskChanged[drive] = false;
            return true;
        }
        return driveDiskChanged[drive];         // false = no, null = unknown
    };

    this.isDiskInserted = function(drive) {
        return !!getCurrentDisk(drive);
    };

    this.diskWriteProtected = function(drive) {
        return false;
    };

    this.readSectors = function(drive, logicalSector, quantSectors) {
        if (!this.isDiskInserted(drive)) return null;
        var dContent = getCurrentDisk(drive).content;
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
        if (!this.isDiskInserted(drive)) return false;

        var dContent = getCurrentDisk(drive).content;
        if (!quantBytes) quantBytes = bytes.length;

        // Disk boundary check
        if ((startByte >= dContent.length) || (startByte + quantBytes > dContent.length)) return false;

        for (var i = 0; i < quantBytes; i++)
            dContent[startByte + i] = bytes[i];

        return true;
    };

    // Returns the extra time for motor to spin (drive LED simulation)
    this.motorOn = function(drive) {
        if (driveMotorOffTimer[drive]) {
            clearTimeout(driveMotorOffTimer[drive]);
            driveMotorOffTimer[drive] = null;
        }
        if (driveMotor[drive]) return 0;
        driveMotor[drive] = true;
        fireMotorStateUpdate();
        return MOTOR_SPINUP_EXTRA_ITERATIONS;
    };

    this.allMotorsOff = function(resetDelay) {          // Simulated delay
        motorOff(0, resetDelay);
        motorOff(1, resetDelay);
    };

    this.allMotorsOffNow = function() {                 // Instantly with no delays
        driveMotor[0] = driveMotor[1] = false;
        fireMotorStateUpdate();
    };

    this.formatCurrentDisk = function(drive, mediaType) {
        return images.formatDisk(mediaType, getCurrentDisk(drive).content);
    };

    // Add a delay before turning the motor off (drive LED simulation)
    function motorOff(drive, resetDelay) {
        if (!driveMotor[drive]) return;
        if (driveMotorOffTimer[drive] && resetDelay) {
            clearTimeout(driveMotorOffTimer[drive]);
            driveMotorOffTimer[drive] = null;
        }
        if (!driveMotorOffTimer[drive])
            driveMotorOffTimer[drive] = setTimeout(function() {
                driveMotorOffTimer[drive] = null;
                driveMotor[drive] = false;
                fireMotorStateUpdate();
            }, MOTOR_SPINDOWN_EXTRA_MILLIS);
    }

    function setCurrentDiskNum(drive, num) {
        curDisk[drive] = num;
        driveDiskChanged[drive] = true;
    }

    function getCurrentDisk(drive) {
        return driveStack[drive][curDisk[drive]];
    }

    function fireMediaStateUpdate(drive) {
        screen.diskDrivesMediaStateUpdate(drive);
        fireMotorStateUpdate();
    }

    function fireMotorStateUpdate() {
        screen.diskDrivesMotorStateUpdate(getCurrentDisk(0), driveMotor[0], getCurrentDisk(1), driveMotor[1]);
    }

    function noDiskInsertedMessage(drive) {
        if (!self.isDiskInserted(drive)) {
            screen.showOSD("No Disk in Drive " + driveName[drive], true, true);
            return true;
        } else
            return false;
    }

    function maxStackReachedMessage(drive) {
        if (driveStack[drive].length >= MAX_STACK) {
            screen.showOSD("Maximum Stack size in Drive " + driveName[drive] + " (" + driveStack[drive].length + " disks)", true, true);
            return true;
        } else
            return false;
    }

    function stackLoadedMessage(drive, type, quant, added) {
        type = type || "Disk";
        var mes = added ? "" + quant + " " + type + (quant > 1 ? "s" : "") + " added to Drive " + driveName[drive]
            : quant > 1 ? "" + quant + " Disks loaded in Drive " + driveName[drive]
            : currentDiskDesc(drive);
        screen.showOSD(mes, true);
    }

    function diskInsertedMessage(drive) {
        if (noDiskInsertedMessage(drive)) return;
        screen.showOSD(currentDiskDesc(drive), true);
    }

    function currentDiskDesc(drive) {
        var disk = getCurrentDisk(drive);
        return [ "Disk " + driveName[drive], currentDiskNumDesc(drive), disk && disk.name].join(" ");
    }

    function currentDiskNumDesc(drive) {
        return driveStack[drive].length > 1 ? "(" + (curDisk[drive] + 1) + "/" + driveStack[drive].length + ") " : "";
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        var stack = [[], []];
        for (var d = 0; d < driveStack[0].length; ++d) stack[0].push( { name: driveStack[0][d].name, content: wmsx.Util.compressInt8BitArrayToStringBase64(driveStack[0][d].content) });
        for (    d = 0; d < driveStack[1].length; ++d) stack[1].push( { name: driveStack[1][d].name, content: wmsx.Util.compressInt8BitArrayToStringBase64(driveStack[1][d].content) });
        return {
            s: stack,
            c: curDisk,
            b: driveBlankDiskAdded,
            g: driveDiskChanged,
            m: driveMotor
        };
    };

    this.loadState = function(state) {
        var oldStack = driveStack;
        driveStack[0].length = driveStack[1].length = 0;
        var stack = state.s;
        for (var d = 0; d < stack[0].length; ++d) driveStack[0].push( { name: stack[0][d].name, content: wmsx.Util.uncompressStringBase64ToInt8BitArray(stack[0][d].content, oldStack[0][d] && oldStack[0][d].content) });
        for (    d = 0; d < stack[1].length; ++d) driveStack[1].push( { name: stack[1][d].name, content: wmsx.Util.uncompressStringBase64ToInt8BitArray(stack[1][d].content, oldStack[1][d] && oldStack[1][d].content) });
        curDisk = state.c;
        driveBlankDiskAdded = state.b;
        driveDiskChanged = state.g;
        driveMotor = state.m;
        fireMediaStateUpdate(0); fireMediaStateUpdate(1);
        this.allMotorsOff(true);
    };


    this.eval = function(str) {
        return eval(str);
    };

    var images = new wmsx.DiskImages();

    var screen;
    var fileDownloader;
    var diskDriveSocket;

    var driveStack   = [[], []];                    // Several disks can be loaded for each drive
    var curDisk      = [0, 0];                      // Current disk from stack inserted in drive

    var driveBlankDiskAdded = [ false, false ];

    var driveDiskChanged    = [ null, null ];         // true = yes, false = no, null = unknown
    var driveMotor          = [ false, false ];
    var driveMotorOffTimer  = [ null, null ];

    var driveName = [ "A:", "B:" ];
    var nextNewDiskFormatOption = [ -1, -1 ];

    var BYTES_PER_SECTOR = 512;                     // Fixed for now, for all disks

    var MOTOR_SPINUP_EXTRA_ITERATIONS = 100000;
    var MOTOR_SPINDOWN_EXTRA_MILLIS = 2300;

    var MAX_STACK = wmsx.FileDiskDrive.MAX_STACK;

    this.FORMAT_OPTIONS_MEDIA_TYPES = images.FORMAT_OPTIONS_MEDIA_TYPES;
    this.MEDIA_TYPE_INFO = images.MEDIA_TYPE_INFO;
    this.MEDIA_TYPE_VALID_SIZES = images.MEDIA_TYPE_VALID_SIZES;
    this.MEDIA_TYPE_DPB = images.MEDIA_TYPE_DPB;


    init();

};

wmsx.FileDiskDrive.MAX_STACK = 5;