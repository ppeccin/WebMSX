// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Multi Device Drive ( Floppy Drives A: & B: = drive 0 & 1, Nextor Device = drive 2 )

wmsx.FileDiskDrive = function(room) {
"use strict";

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

    this.loadDiskStackFromFiles = function (drive, files, altPower, addToStack, filesFromZip) {
        // Nextor Device never add to stack, always replace
        if (drive === 2) addToStack = false;
        else if (addToStack && maxStackReachedMessage(drive)) return [];

        var stack = [];
        var maxStack = drive === 2 ? 1 : addToStack ? MAX_STACK - driveStack[drive].length : MAX_STACK;
        try {
            for (var i = 0; i < files.length && stack.length < maxStack; i++) {
                var file = files[i];
                if (filesFromZip && file.content === undefined) file.content = file.asUint8Array();
                var disks = checkFileHasValidImages(file, drive === 2);     // Nextor accepts any sized content
                if (disks) stack.push.apply(stack, disks);
            }
            if (stack.length > 0) {
                if (stack.length > maxStack) stack = stack.slice(0, maxStack);
                loadStack(drive, stack, null, altPower, addToStack);
                return stack;
            }
        } catch(ez) {
            wmsx.Util.error(ez);      // Error decompressing files. Abort
        }
    };

    this.loadAsDiskFromFiles = function (drive, name, files, altPower, addToStack, type) {

        // TODO Testing Nextor
        drive = 2;

        // Nextor Device never add to stack, always replace
        if (drive === 2) addToStack = false;
        else if (addToStack && maxStackReachedMessage(drive)) return [];

        // Writes on the current disk or create a new one?
        var currentContent = drive === 2 && this.isDiskInserted(drive) ? getCurrentDisk(drive).content : undefined;    // Nextor aways write to current if any
        var newContent = currentContent || images.createNewFormattedDisk(0xF9);

        var suc = images.writeFilesToImage(newContent, files);
        if (!suc) return;

        if (currentContent) {
            screen.showOSD("Files written to current disk", true);
            driveDiskChanged[drive] = true;
            return this.getDriveStack(drive);
        } else {
            type = type || "Files as Disk";
            name = name || ("New " + type + ".dsk");
            var stack = [{name: name, content: newContent}];
            loadStack(drive, stack, type, altPower, addToStack);
            return stack;
        }
    };

    this.loadSerializedStack = function (drive, stackContent, type, altPower, add) {
        loadStack(drive, deserializeStack(stackContent), type, altPower, add);
    };

    this.insertNewDisk = function(drive, mediaType, unformatted) {     // Cycle among format options if no mediaType given
        if (!mediaType) {
            if (++(nextNewDiskFormatOption[drive]) >= this.FORMAT_OPTIONS_MEDIA_TYPES.length) nextNewDiskFormatOption[drive] = 0;
            mediaType = this.FORMAT_OPTIONS_MEDIA_TYPES[nextNewDiskFormatOption[drive]];
        }

        if (room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 11, d: drive, m: mediaType, u: unformatted });

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

        if (add && room.netPlayMode !== 2) self.openDiskSelectDialog(drive, 0, true);
    };

    this.removeStack = function(drive) {
        if (noDiskInsertedMessage(drive)) return;

        var wasStack = driveStack[drive].length > 1;
        emptyStack(drive);
        driveDiskChanged[drive] = null;

        screen.showOSD((wasStack ? "Disk Stack in Drive " : "Disk ") + driveName[drive] + " removed", true);
        fireMediaStateUpdate(drive);
    };

    this.insertDiskFromStack = function(drive, num, altPower) {
        setCurrentDiskNum(drive, num);
        diskInsertedMessage(drive);
        fireMediaStateUpdate(drive);

        if (getCurrentDisk(0) || getCurrentDisk(2)) diskDriveSocket.autoPowerCycle(altPower);       // Only if Drive A: or Nextor Device have a disk
    };

    this.moveDiskInStack = function (drive, from, to) {
        var stack = driveStack[drive];
        if (from < 0 || to < 0 || from > stack.length -1 || to > stack.length -1) return;

        var disk = stack[curDisk[drive]];
        stack.splice(to, 0, stack.splice(from, 1)[0]);
        if (disk) curDisk[drive] = stack.indexOf(disk);
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

    this.openDiskSelectDialog = function(drive, inc, altPower) {
        if (noDiskInsertedMessage(drive)) return;
        screen.openDiskSelectDialog(drive, inc, altPower);
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

    function checkFileHasValidImages(file, anySize, stopRecursion) {
        // Zip File?
        if (!stopRecursion) {
            var zip = wmsx.Util.checkContentIsZIP(file.content);
            if (zip) {
                try {
                    var files = wmsx.Util.getZIPFilesSorted(zip);
                    for (var f in files) {
                        files[f].content = files[f].asUint8Array();
                        var res = checkFileHasValidImages(files[f], anySize, true);
                        if (res) return res;
                    }
                } catch (ez) {
                    wmsx.Util.error(ez);      // Error decompressing files. Abort
                }
                return null;
            }
        }

        // GZip File?
        var gzip = wmsx.Util.checkContentIsGZIP(file.content);
        if (gzip) return checkFileHasValidImages({ name: file.name, content: gzip }, anySize, true);

        // Normal File
        var quant = checkContentIsValidImages(file.content, anySize);
        if (quant) {
            var name = file.name.split("/").pop();
            if (quant === 1) return [{ name: name, content: wmsx.Util.asNormalArray(file.content) }];

            var disks = new Array(quant);
            var size = (file.content.length / quant) | 0;
            for (var i = 0, pos = 0; i < quant; ++i, pos += size)
                disks[i] = { name: name + (i+1), content: wmsx.Util.asNormalArray(file.content, pos, size) };
            return disks;
        }

        return null;
    }

    function checkContentIsValidImages(content, anySize) {
        if (anySize || MEDIA_TYPE_VALID_SIZES_SET.has(content.length))
            return 1;

        for (var i = 0, len = MEDIA_TYPE_VALID_SIZES.length; i < len; ++i) {
            var size = MEDIA_TYPE_VALID_SIZES[i];
            if (content.length % size === 0) return (content.length / size) | 0;
        }

        return 0;
    }

    function emptyStack(drive) {
        driveStack[drive].length = 0;
        curDisk[drive] = -1;
    }

    function loadStack(drive, stack, type, altPower, add) {
        if (room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 10, d: drive, s: serializeStack(stack), t: type, p: altPower, a: add });

        if (add) {
            driveStack[drive] = driveStack[drive].concat(stack);
            if (!getCurrentDisk(drive)) setCurrentDiskNum(drive, 0);
        } else {
            driveStack[drive] = stack;
            driveBlankDiskAdded[drive] = false;
            setCurrentDiskNum(drive, 0);
        }
        stackLoadedMessage(drive, type, stack.length, add);
        fireMediaStateUpdate(drive);

        if (driveStack[drive].length > 1) {
            if (!altPower && room.netPlayMode !== 2) self.openDiskSelectDialog(drive, 0, altPower);
        } else
        if (getCurrentDisk(0) || getCurrentDisk(2)) diskDriveSocket.autoPowerCycle(altPower);       // Only if Drive A: or Nextor Device have a disk

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

        return wmsx.Util.leafFilenameNoExtension(fileName) + ".dsk";
    }

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
        screen.diskDrivesMotorStateUpdate(getCurrentDisk(0), driveMotor[0], getCurrentDisk(1), driveMotor[1], getCurrentDisk(2), driveMotor[2]);
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

    function serializeStack(stack) {
        var res = new Array(stack.length);
        for (var d = 0; d < stack.length; ++d)
            res[d] = { name: stack[d].name, content: wmsx.Util.compressInt8BitArrayToStringBase64(stack[d].content) };
        return res;
    }

    function deserializeStack(stack, oldStack) {
        if (oldStack) {
            oldStack.length = stack.length;
            for (var d = 0; d < stack.length; ++d)
                oldStack[d] = { name: stack[d].name, content: wmsx.Util.uncompressStringBase64ToInt8BitArray(stack[d].content, oldStack[d] && oldStack[d].content) };
        } else {
            var res = new Array(stack.length);
            for (d = 0; d < stack.length; ++d)
                res[d] = { name: stack[d].name, content: wmsx.Util.uncompressStringBase64ToInt8BitArray(stack[d].content) };
            return res;
        }
    }

    // DiskDriver interface methods  ----------------

    this.diskHasChanged = function(drive) {
        if (driveDiskChanged[drive]) {
            driveDiskChanged[drive] = false;
            return true;
        }
        return driveDiskChanged[drive];         // false = no, null = unknown
    };

    this.getTotalSectorsAvailable = function(drive) {
        if (!this.isDiskInserted(drive)) return null;
        return (getCurrentDisk(drive).content.length / BYTES_PER_SECTOR) | 0;
    };

    this.isDiskInserted = function(drive) {
        return !!getCurrentDisk(drive);
    };

    this.diskWriteProtected = function(drive) {
        return false;
    };

    this.readByte = function(drive, position) {
        if (!this.isDiskInserted(drive)) return null;
        var dContent = getCurrentDisk(drive).content;
        // Disk boundary check
        return position >= dContent.length ? null : dContent[position];
    };

    this.readSectorsToSlot = function(drive, logicalSector, quantSectors, slot, address) {
        if (!this.isDiskInserted(drive)) return false;
        var dContent = getCurrentDisk(drive).content;
        var startByte = logicalSector * BYTES_PER_SECTOR;
        var quantBytes = quantSectors * BYTES_PER_SECTOR;

        // Disk boundary check
        if ((startByte >= dContent.length) || (startByte + quantBytes > dContent.length)) return false;

        // Transfer
        for (var i = 0; i < quantBytes; i++)
            slot.write(address + i, dContent[startByte + i]);

        return true;
    };

    this.writeSectorsFromSlot = function(drive, logicalSector, quantSectors, slot, address) {
        if (!this.isDiskInserted(drive)) return false;
        var dContent = getCurrentDisk(drive).content;
        var startByte =  logicalSector * BYTES_PER_SECTOR;
        var quantBytes = quantSectors * BYTES_PER_SECTOR;

        // Disk boundary check
        if ((startByte >= dContent.length) || (startByte + quantBytes > dContent.length)) return false;

        // Transfer
        for (var i = 0; i < quantBytes; i++)
            dContent[startByte + i] = slot.read(address + i);

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


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: [ serializeStack(driveStack[0]), serializeStack(driveStack[1]) ],
            c: curDisk,
            b: driveBlankDiskAdded,
            g: driveDiskChanged,
            m: driveMotor
        };
    };

    this.loadState = function(state) {
        deserializeStack(state.s[0], driveStack[0]);
        deserializeStack(state.s[1], driveStack[1]);
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

    var driveStack   = [[], [], []];                    // Several disks can be loaded for each Floppy drive, just one for Nextor Device
    var curDisk      = [0, 0, 0];                       // Current disk from stack inserted in drive

    var driveBlankDiskAdded = [ false, false, false ];

    var driveDiskChanged    = [ null, null, null ];     // true = yes, false = no, null = unknown
    var driveMotor          = [ false, false, false ];
    var driveMotorOffTimer  = [ null, null, null ];

    var driveName = [ "A:", "B:", "Nextor" ];
    var nextNewDiskFormatOption = [ -1, -1, -1 ];

    var BYTES_PER_SECTOR = 512;                         // Fixed for now, for all disks

    var MOTOR_SPINUP_EXTRA_ITERATIONS = 100000;
    var MOTOR_SPINDOWN_EXTRA_MILLIS = 2300;

    var MAX_STACK = wmsx.FileDiskDrive.MAX_STACK;

    var MEDIA_TYPE_VALID_SIZES = images.MEDIA_TYPE_VALID_SIZES;
    var MEDIA_TYPE_VALID_SIZES_SET = new Set(MEDIA_TYPE_VALID_SIZES);

    this.FORMAT_OPTIONS_MEDIA_TYPES = images.FORMAT_OPTIONS_MEDIA_TYPES;
    this.MEDIA_TYPE_INFO = images.MEDIA_TYPE_INFO;
    this.MEDIA_TYPE_DPB = images.MEDIA_TYPE_DPB;


    init();

};

wmsx.FileDiskDrive.MAX_STACK = 10;