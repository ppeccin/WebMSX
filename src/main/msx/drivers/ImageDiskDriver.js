// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// MSX-DOS and SymbOS Disk Driver for disk images. Implements driver public calls using the CPU extension protocol
wmsx.ImageDiskDriver = function(dos2) {
"use strict";

    this.connect = function(diskBIOS, machine) {
        drive = machine.getDiskDriveSocket().getDrive();
        bus = machine.bus;
        // SymbOS FD Driver
        bus.setCpuExtensionHandler(0xf4, this);
        bus.setCpuExtensionHandler(0xf5, this);
        bus.setCpuExtensionHandler(0xf6, this);
    };

    this.disconnect = function(diskBIOS, machine) {
        drive.allMotorsOff();
        // SymbOS FD Driver
        bus.setCpuExtensionHandler(0xf4, undefined);
        bus.setCpuExtensionHandler(0xf5, undefined);
        bus.setCpuExtensionHandler(0xf6, undefined);
    };

    this.powerOff = function() {
        drive.allMotorsOff();
    };

    this.cpuExtensionBegin = function(s) {
        switch (s.extNum) {
            // Normal Floppy Disk Driver
            case 0xe0:
                return INIHRD();
            case 0xe2:
                return DRIVES(s.F, s.HL);
            case 0xe4:
                return DSKIO(s.F, s.A, s.B, s.C, s.DE, s.HL);
            case 0xe5:
                return DSKCHG(s.F, s.A, s.B, s.C, s.HL);
            case 0xe6:
                return GETDPB(s.F, s.A, s.B, s.C, s.HL);
            case 0xe7:
                return CHOICE(s.extPC);
            case 0xe8:
                return DSKFMT(s.F, s.A, s.DE);
            case 0xea:
                return MTOFF();

            // SymbOS FD Driver
            case 0xf4:
                return SYMBOS_FD_DRVINP(s.F, s.C, s.B, s.HL, s.IX, s.IY);
            case 0xf5:
                return SYMBOS_FD_DRVOUT(s.F, s.C, s.B, s.HL, s.IX, s.IY);
            case 0xf6:
                return SYMBOS_FD_DRVACT(s.F, s.C, s.HL);
        }
    };

    this.cpuExtensionFinish = function(s) {
        drive.allMotorsOff();
    };

    this.patchDiskBIOS = function (bytes, patchStart, driverStart, inihrd, drives, dskio, dskchg, getdpb, choice, deskfmt, mtoff, choiceStrAddr) {
        // DOS kernel places where Driver routines with no jump table are called

        // Disk Driver init routines not present on Jump Table
        if (inihrd >= 0) {
            // INIHRD routine (EXT 0)
            bytes[patchStart + inihrd + 0] = 0xed;
            bytes[patchStart + inihrd + 1] = 0xe0;
            bytes[patchStart + inihrd + 2] = 0xc9;
            // DRIVES routine (EXT 2)
            bytes[patchStart + drives + 0] = 0xed;
            bytes[patchStart + drives + 1] = 0xe2;
            bytes[patchStart + drives + 2] = 0xc9;
        }

        if (dskio >= 0) {
            // DOS Kernel Jump Table for Disk Driver routines
            // DSKIO routine (EXT 4)
            bytes[patchStart + dskio + 0] = 0xed;
            bytes[patchStart + dskio + 1] = 0xe4;
            bytes[patchStart + dskio + 2] = 0xc9;
            // DSKCHG routine (EXT 5)
            bytes[patchStart + dskchg + 0] = 0xed;
            bytes[patchStart + dskchg + 1] = 0xe5;
            bytes[patchStart + dskchg + 2] = 0xc9;
            // GETDPB routine (EXT 6)
            bytes[patchStart + getdpb + 0] = 0xed;
            bytes[patchStart + getdpb + 1] = 0xe6;
            bytes[patchStart + getdpb + 2] = 0xc9;
            // CHOICE routine (EXT 7)
            bytes[patchStart + choice + 0] = 0xed;
            bytes[patchStart + choice + 1] = 0xe7;
            bytes[patchStart + choice + 2] = 0xc9;
            // DSKFMT routine (EXT 8)
            bytes[patchStart + deskfmt + 0] = 0xed;
            bytes[patchStart + deskfmt + 1] = 0xe8;
            bytes[patchStart + deskfmt + 2] = 0xc9;
            // MTOFF routine (EXT a)
            bytes[patchStart + mtoff + 0] = 0xed;
            bytes[patchStart + mtoff + 1] = 0xea;
            bytes[patchStart + mtoff + 2] = 0xc9;
        }

        // It seems the Disk BIOS routines just assume the CHOICE message will reside in the same slot as the Disk BIOS itself.
        // So we must put the message in the same slot and make that memory region readable
        // Lets use a memory space in page 2 of this same slot and hope it works
        if (choiceStrAddr >= 0) {
            choiceStringAddress[choice] = choiceStrAddr;
            for (var i = 0; i < CHOICE_STRING.length; i++)
                bytes[patchStart + choiceStrAddr + i] = CHOICE_STRING.charCodeAt(i);
        }
    };

    function INIHRD(F, HL) {
        // wmsx.Util.log("INIHRD");
        // no real initialization required
    }

    function DRIVES(F, HL) {
        // wmsx.Util.log("DRIVES: " + wmsx.Util.toHex2(F));

        return { HL: (HL & 0xff00) | (F & 0x40 ? 1 : 2) };
    }

    // TODO Call FFCF and FFD4 hooks
    function DSKIO(F, A, B, C, DE, HL) {
        if (F & 1) return DSKIOWrite(F, A, B, C, DE, HL);
        else return DSKIORead(F, A, B, C, DE, HL);
    }

    function DSKIORead(F, A, B, C, DE, HL) {
        //var pri = bus.getPrimarySlotConfig();
        //wmsx.Util.log("DSKIO Read: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL)
        //    + " Slots: " + wmsx.Util.toHex2(pri)
        //    + " Sub Slots: " + wmsx.Util.toHex2(~bus.slots[pri >> 6].read(0xffff) & 0xff));
        //WMSX.room.machine.bus.slots[3].subSlots[0].dumpRead(0xf341, 4);

        var spinTime = drive.motorOn(A);
        var suc = drive.readSectorsToSlot(A, DE, B, getSlotForMemoryAccess(HL), HL);

        // Not Ready error if can't read
        if (!suc)
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Success
        return { F: F & ~1, B: 0, extraIterations: spinTime + B * EXTRA_ITERATIONS_PER_SECTOR};
    }

    function DSKIOWrite(F, A, B, C, DE, HL) {
        //wmsx.Util.log("DSKIO Write: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL) + " Slots: " + wmsx.Util.toHex2(WMSX.room.machine.bus.getPrimarySlotConfig()));

        var spinTime = drive.motorOn(A);

        // Not Ready error if Disk not present
        if (!drive.isDiskInserted(A))
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Disk Write Protected
        //if (drive.diskWriteProtected(A))
        //    return { F: F | 1, A: 0, B: B, extraIterations: spinTime };

        var suc = drive.writeSectorsFromSlot(A, DE, B, getSlotForMemoryAccess(HL), HL);

        // Not Ready error if can't write
        if (!suc)
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Success
        return { F: F & ~1, B: 0, extraIterations: spinTime + B * EXTRA_ITERATIONS_PER_SECTOR };
    }

    function DSKCHG(F, A, B, C, HL) {
        // var pri = bus.getPrimarySlotConfig();
        // wmsx.Util.log("DSKCHG: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(HL)
        //    + " Slots: " + wmsx.Util.toHex2(pri)
        //    + " Sub Slots: " + wmsx.Util.toHex2(~bus.slots[pri >> 6].read(0xffff) & 0xff));

        var res = drive.diskHasChanged(A);       // true = yes, false = no, null = unknown

        // Success, Disk not changed
        if (res === false)
            return { F: F & ~1, B: 1 };

        // Disk changed or unknown, read disk to determine media type
        var spinTime = drive.motorOn(A);
        var mediaDeskFromDisk = drive.readByte(A, BYTES_PER_SECTOR);      // Get just the fist byte from FAT (first byte from sector 1)

        // Not Ready error if can't read
        if (mediaDeskFromDisk === null)
            return { F: F | 1, A: 2, B: 0, extraIterations: spinTime };

        if (!dos2) GETDPB(F, A, mediaDeskFromDisk, C, HL, true);

        // Success, Disk changed or unknown and new DPB transferred. B = -1 (FFh) if disk changed
        return { F: F & ~1, B: (res === true ? 0xff : 0), extraIterations: spinTime };
    }

    function GETDPB(F, A, B, C, HL, fromChoice) {
        // var pri = bus.getPrimarySlotConfig();
        // wmsx.Util.log("GETDPB: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(HL)
        //     + " Slots: " + wmsx.Util.toHex2(pri)
        //     + " Sub Slots: " + wmsx.Util.toHex2(~bus.slots[pri >> 6].read(0xffff) & 0xff)
        //     + " From DSKCHG: " + fromChoice);

        var mediaType = B < 0xF8 ? C : B;
        if (mediaType < 0xF8) return { F: F | 1 };           // Invalid Media Descriptor

        var dpb = drive.MEDIA_TYPE_DPB[mediaType];
        writeToMemory(dpb, HL + 1);

        return { F: F & ~1 };
    }

    function CHOICE(extPC) {
        // wmsx.Util.log("CHOICE" + " Slots: " + wmsx.Util.toHex2(WMSX.room.machine.bus.getPrimarySlotConfig()) + ", extPC: " + extPC.toString(16));

        return { HL: choiceStringAddress[extPC] || 0 };     // 0 = no choice, only 1 option
    }

    function DSKFMT(F, A, DE) {
        // wmsx.Util.log("DSKFMT" + " Slots: " + wmsx.Util.toHex2(WMSX.room.machine.bus.getPrimarySlotConfig()));

        var d = DE >>> 8;
        var f = A - 1;

        // Bad Parameter error if Disk or Format Option is invalid. Only options 0 and 1 supported
        if ((f < 0 || f > 1) || (d < 0 || d > 1))
            return { F: F | 1, A: 12 };

        // Disk Write Protected error
        //if (drive.diskWriteProtected(d))
        //    return { F: F | 1, A: 0 };

        var mediaType = drive.FORMAT_OPTIONS_MEDIA_TYPES[f];

        drive.insertNewDisk(d, mediaType, false, true);    // not boot disk, unformatted

        drive.motorOn(d);
        drive.formatCurrentDisk(d, mediaType);

        return { F: F & ~1, extraIterations: EXTRA_ITERATIONS_FORMAT};
    }

    function MTOFF() {
        //wmsx.Util.log("MTOFF");

        drive.allMotorsOffNow();
    }

    function writeToMemory(bytes, address) {
        var slot = getSlotForMemoryAccess(address);
        for (var i = 0; i < bytes.length; i++)
            slot.write(address + i, bytes[i]);
    }

    function getSlotForMemoryAccess(address) {
        // If address is in DISK-BIOS range, force to RAM slot as per RAMAD1 system variable (0xf342)
        // The selected slot will be used for the entire transfer even if it crosses a page boundary
        var slot;
        if (address >= 0x4000 && address <= 0x7fff) {
            var slotSpec = bus.read(0xf342);
            slot = bus.getSlot(slotSpec & 3);
            if ((slotSpec & 0x80) !== 0 && slot.isExpanded()) slot = slot.getSubSlot((slotSpec >> 2) & 3);
        } else {
            slot = bus.getSlotForAddress(address);
            if (slot.isExpanded()) slot = slot.getSubSlotForAddress(address);
        }
        return slot;
    }


    // SymboOS Driver

    function SYMBOS_FD_DRVACT(F, C, HL) {
        // wmsx.Util.log("SYMBOS_FD_DRVACT. C (device): " + wmsx.Util.toHex2(C) + ", HL (info addr): " + wmsx.Util.toHex4(HL) + ", PC: " + WMSX.room.machine.cpu.eval("PC").toString(16));

        // HL points to device information

        delete symbOSDeviceDrive[C];                // Set device as not initialized

        // Drive info
        var drvInfo = bus.read(HL + 26);            // bit [0-1] -> drive (0 = A, 1 = B, 2 = C, 3 = D), bit [2] -> head, bit [3] = DoubleStep, bit [4-7] - > SectorOffset (only after STOACT)
        var driveNum = drvInfo & 0x03;
        // Ignore head

        // Only Drives 0, 1 Supported (A:, B:)
        var available = driveNum <= 1;

        if (available) {
            drive.motorFlash(driveNum);

            // Error if no disk
            if (!drive.isDiskInserted(driveNum)) return { F: F | 1, A: 26 };        // CF = 1, A = Device not ready Error
        }

        // Set Symbos Device registers on memory (all default except Status)
        bus.write(HL + 0, available ? 1 : 0);               // stodatsta <- stotypoky,  Device Status = Ready (1) or Unavailable (0)
        bus.write(HL + 1, 0x82);                            // stodattyp <- stomedfdd,  Device Type = FDD FAT 12 Double Head, removable
        bus.write(HL + 12+0, 0);                            // stodatbeg <- 0 (dword),  Starting Sector = 0
        bus.write(HL + 12+1, 0);
        bus.write(HL + 12+2, 0);
        bus.write(HL + 12+3, 0);
        bus.write(HL + 28, 9);                              // stodatspt <- 9 (word),   Number of sectors per track (max.256)
        bus.write(HL + 29, 0);
        bus.write(HL + 30, 2);                              // stodathed <- 2,          Number of heads (max.16)

        symbOSDeviceDrive[C] = driveNum;                   // Remember for later device accesses

        // OK
        return { F: F & ~1 };     // CF = 0
    }

    function SYMBOS_FD_DRVINP(F, C, B, HL, IX, IY) {
        // wmsx.Util.log("SYMBOS_FD_DRVINP. C (device): " + wmsx.Util.toHex2(C) + ", B (quant): " + wmsx.Util.toHex2(B) + ", HL (dest): " + wmsx.Util.toHex4(HL) + ", IX (sectorL): " + wmsx.Util.toHex4(IX) + ", IY (sectorH): " + wmsx.Util.toHex4(IY) + ", PC: " + WMSX.room.machine.cpu.eval("PC").toString(16));

        var driveNum = symbOSDeviceDrive[C];

        if (driveNum >= 0) drive.motorFlash(driveNum);

        // Error if no disk or Device not initialized
        if (driveNum === undefined || !drive.isDiskInserted(driveNum)) return { F: F | 1, A: 26 };       // CF = 1, A = Device not ready Error

        var suc = drive.readSectorsToSlot(driveNum,  (IY << 16) + IX, B, bus, HL);

        // Error if can't read
        if (!suc) return { F: F | 1, A: 6 };        // CF = 1, A = Unknown disk Error

        // Success
        return { F: F & ~1 };     // CF = 0
    }

    function SYMBOS_FD_DRVOUT(F, C, B, HL, IX, IY) {
        // wmsx.Util.log("SYMBOS_FD_DRVOUT. C (device): " + wmsx.Util.toHex2(C) + ", B (quant): " + wmsx.Util.toHex2(B) + ", HL (dest): " + wmsx.Util.toHex4(HL) + ", IX (sectorL): " + wmsx.Util.toHex4(IX) + ", IY (sectorH): " + wmsx.Util.toHex4(IY) + ", PC: " + WMSX.room.machine.cpu.eval("PC").toString(16));

        var driveNum = symbOSDeviceDrive[C];

        if (driveNum >= 0) drive.motorFlash(driveNum);

        // Error if no disk or Device not initialized
        if (driveNum === undefined || !drive.isDiskInserted(driveNum)) return { F: F | 1, A: 26 };       // CF = 1, A = Device not ready Error

        var suc = drive.writeSectorsFromSlot(driveNum, (IY << 16) + IX, B, bus, HL);

        // Error if can't write
        if (!suc) return { F: F | 1, A: 6 };                                    // CF = 1, A = Unknown disk Error

        // Success
        return { F: F & ~1 };     // CF = 0
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            sd: symbOSDeviceDrive,
            csa: choiceStringAddress
        };
    };

    this.loadState = function(s) {
        symbOSDeviceDrive = (s && s.sd) !== undefined ? s.sd : { };                             // backward compatibility
        choiceStringAddress = s.csa !== undefined ? s.csa : OLD_CHOICE_STRING_ADDRESS;          // backward compatibility
    };


    var drive;
    var bus;

    var symbOSDeviceDrive = { };            // Stores Drive Letter (A: 1, B: 2, ...) for each SymbOS device (0..7)
    var choiceStringAddress = { };          // Choice String address for each CHOICE patched


    var BYTES_PER_SECTOR = 512;             // Fixed for now, for all disks

    // var CHOICE_STRING = "A new disk will be created.\r\nPlease choose format:\r\n1) 720KB, Double Sided\r\n2) 360KB, Single Sided\r\n\0";
    // var CHOICE_STRING = "123456789012345678901234567890123456789012";
    var CHOICE_STRING = "Adding a new Disk...\r\n1) 720KB\r\n2) 360KB\r\n\0";

    var OLD_CHOICE_STRING_ADDRESS = { 0x787f: 0x7893 };

    var EXTRA_ITERATIONS_PER_SECTOR = 5000;
    var EXTRA_ITERATIONS_FORMAT = 2000000;

};


