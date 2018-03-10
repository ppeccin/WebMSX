// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Multi Device Drive ( Floppy Drives A: & B: = drive 0 & 1, Nextor Device = drive 2 )

wmsx.FileDiskDrive = function(room) {
"use strict";

    var self = this;

    function init() {
        emptyStack(0);
        emptyStack(1);
        emptyStack(2);
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
        // Nextor Device never adds to stack, always replaces
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

    this.loadAsDiskFromFiles = function (drive, name, files, altPower, addToStack) {
        // Writes on the current disk or create a new one?
        var content;
        var curDisk = getCurrentDisk(drive);
        if (curDisk) {
            content = curDisk.content;
        } else {
            try {
                var mediaType = drive === 2 ? images.nextorMediaTypeNeededForFiles(files) : this.FORMAT_OPTIONS_MEDIA_TYPES[0];
            } catch (e) {
                console.error(e);
                mediaType = drive === 2 ? this.NEXTOR_FORMAT_OPTIONS_MEDIA_TYPES[1] : this.FORMAT_OPTIONS_MEDIA_TYPES[0];
            }
            content = images.createNewDisk(mediaType);
        }

        try {
            var filesWritten = images.writeFilesToImage(content, files);
            if (!filesWritten) return;
        } catch (e) {
            console.error(e);
            throw e;
        }

        if (curDisk) {
            screen.showOSD(currentDiskDesc(drive) + " (" + filesWritten + (filesWritten === 1 ? " file" : " files") + " added to disk)", true);
            curDisk.content = content;
            replaceCurrentDisk(drive, curDisk, true);     // true = send net operation
            return this.getDriveStack(drive);
        } else {
            name = (name || ("New " + this.MEDIA_TYPE_INFO[mediaType].desc)) + ".dsk";
            var stack = [{ name: name, content: content }];
            loadStack(drive, stack, null, altPower, false, "(" + filesWritten + (filesWritten === 1 ? " file" : " files") + " added to disk)");
            return stack;
        }
    };

    this.loadSerializedStack = function (drive, stackContent, type, altPower, add) {
        // Cannot reuse old stack if adding!
        loadStack(drive, deserializeStack(stackContent, add ? undefined : driveStack[drive]), type, altPower, add);
    };

    this.replaceCurrentDiskSerialized = function (drive, disk) {
        var oldDisk = getCurrentDisk(drive);
        replaceCurrentDisk(drive, deserializeDisk(disk, oldDisk));
    };

    this.insertNewDisk = function(drive, mediaType, boot, unformatted) {
        if (drive !== 2 && maxStackReachedMessage(drive)) return;

        // Choose a default format option if no mediaType given
        if (!mediaType) mediaType = drive === 2 ? this.NEXTOR_FORMAT_OPTIONS_MEDIA_TYPES[0] : this.FORMAT_OPTIONS_MEDIA_TYPES[0];

        if (room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 11, d: drive, m: mediaType, b: boot, u: unformatted });

        var info = this.MEDIA_TYPE_INFO[mediaType];

        var fileName = "New " + this.MEDIA_TYPE_INFO[mediaType].desc + (boot ? " Boot" : "") + " Disk.dsk";
        var content = images.createNewDisk(mediaType, unformatted);

        // Add a new disk to the stack?
        var add = driveStack[drive].length === 0 || drive !== 2;    // Add 1 disk to loaded stacks, always to the bottom. Nextor never adds
        if (add) driveStack[drive].push({});

        curDisk[drive] = driveStack[drive].length - 1;
        replaceCurrentDisk(drive, { name: fileName, content: content });

        if (boot) images.makeBootDisk(content);

        var added = add && driveStack[drive].length > 1;
        diskInsertedMessage(drive);

        if (added && room.netPlayMode !== 2) self.openDiskSelectDialog(drive, 0, true);
    };

    this.removeStack = function(drive) {
        if (noDiskInsertedMessage(drive)) return;

        var wasStack = driveStack[drive].length > 1;
        emptyStack(drive);

        screen.showOSD((wasStack ? "Disk Stack in " : "Disk in ") + driveName[drive] + " removed", true);
        fireMediaStateUpdate(drive);
    };

    this.insertDiskFromStack = function(drive, num, altPower) {
        setCurrentDiskNum(drive, num);
        diskInsertedMessage(drive);
        fireMediaStateUpdate(drive);
        autoPower(altPower);
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
            var disk = getCurrentDisk(drive);
            fileDownloader.startDownloadBinary(makeFileNameToSave(disk.name),
                disk.content.constructor === Uint8Array ? disk.content : new Uint8Array(disk.content),
                driveName[drive] + " Image file");
        } catch(ex) {
            // give up
        }
    };

    this.openDiskSelectDialog = function(drive, inc, altPower) {
        if (noDiskInsertedMessage(drive)) return;
        screen.openDiskSelectDialog(drive, inc, altPower);
    };

    this.openNewNextorDiskDialog = function(altPower, bootable) {
        screen.openNewNextorDiskDialog(altPower, bootable);
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
            if (quant === 1) return [{ name: name, content: file.content }];    // Using content directly now. Was: wmsx.Util.asNormalArray(file.content)

            var disks = new Array(quant);
            var size = (file.content.length / quant) | 0;
            for (var i = 0, pos = 0; i < quant; ++i, pos += size)
                disks[i] = { name: name + (i+1), content: file.content.slice(pos, pos + size) };    // Using content directly now. Was wmsx.Util.asNormalArray(file.content, pos, size)*/
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
        driveDiskChanged[drive] = null;
    }

    function loadStack(drive, stack, type, altPower, add, appendMessage) {
        if (room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 10, d: drive, s: serializeStack(stack), t: type, p: altPower, a: add });

        if (add) {
            driveStack[drive] = driveStack[drive].concat(stack);
            if (!getCurrentDisk(drive)) setCurrentDiskNum(drive, 0);
        } else {
            driveStack[drive] = stack;
            setCurrentDiskNum(drive, 0);
        }
        stackLoadedMessage(drive, type, stack.length, add, appendMessage);
        fireMediaStateUpdate(drive);

        if (driveStack[drive].length > 1) {
            if (!altPower && room.netPlayMode !== 2) self.openDiskSelectDialog(drive, 0, altPower);
        } else
            autoPower(altPower);
    }

    function autoPower(altPower) {
        // Only if Drive A: or Nextor Device has a disk
        if ((diskDriveSocket.hasDiskInterface() && getCurrentDisk(0))
            || (diskDriveSocket.hasNextorInterface() && getCurrentDisk(2))) diskDriveSocket.autoPowerCycle(altPower);
    }

    function replaceCurrentDisk(drive, disk, sendNetOp) {     // Affects only current disk from stack
        if (sendNetOp && room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 12, d: drive, k: serializeDisk(disk) });

        driveStack[drive][curDisk[drive]] = disk;
        driveDiskChanged[drive] = true;
        fireMediaStateUpdate(drive);
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
            }, MOTOR_SPINDOWN_EXTRA_MILLIS[drive]);
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
            screen.showOSD("No Disk in " + driveName[drive], true, true);
            return true;
        } else
            return false;
    }

    function maxStackReachedMessage(drive) {
        if (driveStack[drive].length >= MAX_STACK) {
            screen.showOSD("Maximum Stack size in " + driveName[drive] + " (" + driveStack[drive].length + " disks)", true, true);
            return true;
        } else
            return false;
    }

    function stackLoadedMessage(drive, type, quant, added, appendMessage) {
        type = type || "Disk";
        var mes = added ? "" + quant + " " + type + (quant > 1 ? "s" : "") + " added to " + driveName[drive]
            : quant > 1 ? "" + quant + " Disks loaded in " + driveName[drive]
            : currentDiskDesc(drive);
        screen.showOSD(mes + (appendMessage ? " " + appendMessage : ""), true);
    }

    function diskInsertedMessage(drive) {
        if (noDiskInsertedMessage(drive)) return;
        screen.showOSD(currentDiskDesc(drive), true);
    }

    function currentDiskDesc(drive) {
        var disk = getCurrentDisk(drive);
        var numDesc = currentDiskNumDesc(drive);
        return driveName[drive] + " " + (numDesc ? numDesc + " " : "") + (disk ? disk.name : "");
    }

    function currentDiskNumDesc(drive) {
        return driveStack[drive].length > 1 ? "(" + (curDisk[drive] + 1) + "/" + driveStack[drive].length + ")" : "";
    }

    function serializeStack(stack) {
        var res = new Array(stack.length);
        for (var d = 0; d < stack.length; ++d)
            res[d] = serializeDisk(stack[d]);
        return res;
    }

    function serializeDisk(disk) {
        return { name: disk.name, content: wmsx.Util.compressInt8BitArrayToStringBase64(disk.content) };
    }

    function deserializeStack(stack, oldStack) {
        if (oldStack) {
            // Try to reuse oldStack
            oldStack.length = stack.length;
            for (var d = 0; d < stack.length; ++d)
                oldStack[d] = deserializeDisk(stack[d], oldStack[d]);
            return oldStack;
        } else {
            var res = new Array(stack.length);
            for (d = 0; d < stack.length; ++d)
                res[d] = deserializeDisk(stack[d]);
            return res;
        }
    }

    function deserializeDisk(disk, oldDisk) {
        // Try to reuse oldDisk content buffer
        return { name: disk.name, content: wmsx.Util.uncompressStringBase64ToInt8BitArray(disk.content, oldDisk && oldDisk.content, false, Uint8Array) };
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

    // Returns the extra time for motor to spin up (drive LED simulation)
    this.motorOn = function(drive) {
        if (driveMotorOffTimer[drive]) {
            clearTimeout(driveMotorOffTimer[drive]);
            driveMotorOffTimer[drive] = null;
        }
        if (driveMotor[drive]) return 0;
        driveMotor[drive] = true;
        fireMotorStateUpdate();
        return MOTOR_SPINUP_EXTRA_ITERATIONS[drive];
    };

    // No motor spin up time
    this.motorFlash = function(drive) {
        if (driveMotor[drive]) return;
        driveMotor[drive] = true;
        fireMotorStateUpdate();
        motorOff(drive);
    };

    this.allMotorsOff = function(resetDelay) {          // Simulated delay
        motorOff(0, resetDelay);
        motorOff(1, resetDelay);
        motorOff(2);
    };

    this.allMotorsOffNow = function() {                 // Instantly with no delays
        driveMotor[0] = driveMotor[1] = driveMotor[2] = false;
        fireMotorStateUpdate();
    };

    this.formatCurrentDisk = function(drive, mediaType) {
        return images.formatDisk(mediaType, getCurrentDisk(drive).content);
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        clearDisconnectedDiskInterfaces();
        return {
            s: [ serializeStack(driveStack[0]), serializeStack(driveStack[1]), serializeStack(driveStack[2]) ],
            c: curDisk,
            g: driveDiskChanged,
            m: driveMotor
        };
    };

    this.loadState = function(state) {
        deserializeStack(state.s[0], driveStack[0]);
        deserializeStack(state.s[1], driveStack[1]);
        if (state.s[2]) deserializeStack(state.s[2], driveStack[2]);
        else clearNextorDrive();
        curDisk = state.c;
        driveDiskChanged = state.g;
        driveMotor = state.m;
        fireMediaStateUpdate(0); fireMediaStateUpdate(1); fireMediaStateUpdate(2);
        this.allMotorsOff(true);
    };

    function clearDisconnectedDiskInterfaces() {
        if (!diskDriveSocket.hasDiskInterface()) {
            emptyStack(0); emptyStack(1);
            driveMotor[0] = driveMotor[1] = false;
            fireMediaStateUpdate(0); fireMediaStateUpdate(1);
        }
        if (!diskDriveSocket.hasNextorInterface()) clearNextorDrive();
    }

    function clearNextorDrive() {
        emptyStack(2);
        driveMotor[2] = false;
        fireMediaStateUpdate(2);
    }


    this.eval = function(str) {
        return eval(str);
    };


    var images = new wmsx.DiskImages(room);

    var screen;
    var fileDownloader;
    var diskDriveSocket;

    var driveStack   = [[], [], []];                    // Several disks can be loaded for each Floppy drive, just one for Nextor Device
    var curDisk      = [0, 0, 0];                       // Current disk from stack inserted in drive

    var driveDiskChanged    = [ null, null, null ];     // true = yes, false = no, null = unknown
    var driveMotor          = [ false, false, false ];
    var driveMotorOffTimer  = [ null, null, null ];

    var driveName = [ "Drive A:", "Drive B:", "Nextor Drive:" ];

    var BYTES_PER_SECTOR = 512;                         // Fixed for now, for all disks

    var MOTOR_SPINUP_EXTRA_ITERATIONS = [ 100000, 100000, 0 ];
    var MOTOR_SPINDOWN_EXTRA_MILLIS = [ 2300, 2300, 50 ];

    var MAX_STACK = wmsx.FileDiskDrive.MAX_STACK;

    var MEDIA_TYPE_VALID_SIZES = images.MEDIA_TYPE_VALID_SIZES;
    var MEDIA_TYPE_VALID_SIZES_SET = new Set(MEDIA_TYPE_VALID_SIZES);

    this.MEDIA_TYPE_INFO = images.MEDIA_TYPE_INFO;
    this.MEDIA_TYPE_DPB = images.MEDIA_TYPE_DPB;
    this.FORMAT_OPTIONS_MEDIA_TYPES = images.FORMAT_OPTIONS_MEDIA_TYPES;
    this.NEXTOR_FORMAT_OPTIONS_MEDIA_TYPES = images.NEXTOR_FORMAT_OPTIONS_MEDIA_TYPES;
    this.NEXTOR_MEDIA_TYPE_HEADER_INFO = images.NEXTOR_MEDIA_TYPE_HEADER_INFO;

    init();

};

wmsx.FileDiskDrive.MAX_STACK = 10;