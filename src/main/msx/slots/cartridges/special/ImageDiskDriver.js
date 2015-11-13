// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Disk Driver for disk images. Implements driver public calls using the CPU extension protocol
wmsx.ImageDiskDriver = function() {

    this.connect = function(diskBIOS, pMachine) {
        machine = pMachine;
        drive = machine.getDiskDriveSocket().getDrive();
        patchDiskBIOS(diskBIOS);
    };

    this.disconnect = function(diskBIOS, machine) {
        drive.allMotorsOff();
    };

    this.powerOff = function() {
        drive.allMotorsOff();
    };

    this.cpuExtensionBegin = function(s) {
        switch (s.extNum) {
            case 0x8:
                return INIHRD();
            case 0x9:
                return DRIVES(s.F, s.HL);
            case 0xa:
                return DSKIO(s.F, s.A, s.B, s.C, s.DE, s.HL);
            case 0xb:
                return DSKCHG(s.F, s.A, s.B, s.C, s.HL);
            case 0xc:
                return GETDPB(s.A, s.B, s.C, s.HL);
            case 0xd:
                return CHOICE();
            case 0xe:
                return DSKFMT(s.F, s.A, s.DE);
            case 0xf:
                return MTOFF();
        }
    };

    this.cpuExtensionFinish = function(s) {
        drive.allMotorsOff();
    };

    function patchDiskBIOS(bios) {
        var bytes = bios.bytes;

        // DOS kernel places where Driver routines with no jump table are called

        // INIHRD routine (EXT 8)
        bytes[0x576F] = 0xed;
        bytes[0x5770] = 0xe8;
        bytes[0x5771] = 0x00;   // NOP
        // DRIVES routine (EXT 9)
        bytes[0x5850] = 0xed;
        bytes[0x5851] = 0xe9;
        bytes[0x5852] = 0x00;   // NOP

        // DOS Kernel jump table for Driver routines

        // DSKIO routine (EXT A)
        bytes[0x4010] = 0xed;
        bytes[0x4011] = 0xea;
        bytes[0x4012] = 0xc9;
        // DSKCHG routine (EXT B)
        bytes[0x4013] = 0xed;
        bytes[0x4014] = 0xeb;
        bytes[0x4015] = 0xc9;
        // GETDPB routine (EXT C)
        bytes[0x4016] = 0xed;
        bytes[0x4017] = 0xec;
        bytes[0x4018] = 0xc9;
        // CHOICE routine (EXT D)
        bytes[0x4019] = 0xed;
        bytes[0x401a] = 0xed;
        bytes[0x401b] = 0xc9;
        // DSKFMT routine (EXT E)
        bytes[0x401c] = 0xed;
        bytes[0x401d] = 0xee;
        bytes[0x401e] = 0xc9;
        // MTOFF routine (EXT F)
        bytes[0x401f] = 0xed;
        bytes[0x4020] = 0xef;
        bytes[0x4021] = 0xc9;

        // It seem the Disk BIOS routines just assume the CHOICE message will reside in the same slot as the Disk BIOS itself.
        // So we must put the message in the same slot and make that memory region readable
        // Lets use a memory space in page 2 of this same slot and hope it works
        for (var i = 0; i < CHOICE_STRING.length; i++)
            bytes[CHOICE_STRING_ADDRESS + i] = CHOICE_STRING.charCodeAt(i);
    }

    function INIHRD(F, HL) {
        // wmsx.Util.log("INIHRD");
        // no real initialization required
    }

    function DRIVES(F, HL) {
        // wmsx.Util.log("DRIVES: " + wmsx.Util.toHex2(F) + ", " + wmsx.Util.toHex4(HL));

        return { HL: (HL & 0xff00) | (F & 0x40 ? 1 : 2) };
    }

    function DSKIO(F, A, B, C, DE, HL) {
        if (F & 1) return DSKIOWrite(F, A, B, C, DE, HL);
        else return DSKIORead(F, A, B, C, DE, HL);
    }

    function DSKIORead(F, A, B, C, DE, HL) {
        //wmsx.Util.log("DSKIO Read: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL) + " Slots: " + wmsx.Util.toHex2(WMSX.room.machine.bus.getPrimarySlotConfig()));

        var spinTime = drive.motorOn(A);
        var bytes = drive.readSectors(A, DE, B);

        // Not Ready error if can't read
        if (!bytes)
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Transfer bytes read
        writeToMemory(bytes, HL);

        // Success
        return { F: F & ~1, B: 0, extraIterations: spinTime };
    }

    function DSKIOWrite(F, A, B, C, DE, HL) {
        //wmsx.Util.log("DSKIO Write: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL) + " Slots: " + wmsx.Util.toHex2(WMSX.room.machine.bus.getPrimarySlotConfig()));

        var spinTime = drive.motorOn(A);

        // Not Ready error if Disk not present
        if (!drive.diskPresent(A))
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Disk Write Protected
        if (drive.diskWriteProtected(A))
            return { F: F | 1, A: 0, B: B, extraIterations: spinTime };

        var res = drive.writeSectors(A, DE, B, readFromMemory(HL, B * BYTES_PER_SECTOR));

        // Not Ready error if can't write
        if (!res)
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Success
        return { F: F & ~1, B: 0, extraIterations: spinTime };
    }

    function DSKCHG(F, A, B, C, HL) {
        // wmsx.Util.log("DSKCHG: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(HL));

        var res = drive.diskHasChanged(A);       // true = yes, false = no, null = unknown

        // Success, Disk not changed
        if (res === false)
            return { F: F & ~1, B: 1 };

        // Disk changed or unknown, read disk to determine media type
        var spinTime = drive.motorOn(A);
        var bytes = drive.readSectors(A, 0, 2);

        // Not Ready error if can't read
        if (!bytes)
            return { F: F | 1, A: 2, B: 0, extraIterations: spinTime };

        // Get just the fist byte from FAT for now
        var mediaDeskFromDisk = bytes[512];
        GETDPB(A, mediaDeskFromDisk, C, HL);

        // Success, Disk changed or unknown and new DPB transferred. B = -1 (FFh) if disk changed
        return { F: F & ~1, B: (res === true ? 0xff : 0), extraIterations: spinTime };
    }

    function GETDPB(A, B, C, HL) {
        // wmsx.Util.log("GETDPB: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(HL));

        var mediaDesc = B === 0 ? C : B;
        if (mediaDesc < 0xF8) return;           // Invalid Media Descriptor

        var dpb = DPBS_FOR_MEDIA_DESCRIPTORS[mediaDesc];
        writeToMemory(dpb, HL + 1);
    }

    function CHOICE() {
        // wmsx.Util.Util.log("CHOICE");

        return { HL: CHOICE_STRING_ADDRESS };
    }

    function DSKFMT(F, A, DE) {
        // wmsx.Util.log("DSKFMT");

        var d = DE >>> 8;
        var f = A - 1;

        // Bad Parameter error if Disk or Format Option is invalid
        if ((f < 0 || f > 1) || (d < 0 || d > 1))
            return { F: F | 1, A: 12 };

        // Disk Write Protected error
        if (drive.diskWriteProtected(d))
            return { F: F | 1, A: 0, extraIterations: spinTime };

        drive.createNewEmptyDisk(d, f);

        drive.motorOn(d);
        drive.formatDisk(d, f);

        return { F: F & ~1, extraIterations: EXTRA_ITERATIONS_FORMAT};
    }

    function MTOFF() {
        // wmsx.Util.log("MTOFF");

        drive.allMotorsOffNow();
    }

    function readFromMemory(address, quant) {
        // wmsx.Util.log("Read memory: " + wmsx.Util.toHex4(address) + ", " + quant);
        var slot = getSlotToMemoryAccess(address);
        var res = new Array(quant);
        for (var i = 0; i < quant; i++)
            res[i] = slot.read(address + i);

        return res;
    }

    function writeToMemory(bytes, address) {
        var slot = getSlotToMemoryAccess(address);
        for (var i = 0; i < bytes.length; i++)
            slot.write(address + i, bytes[i]);
    }

    function getSlotToMemoryAccess(address) {
        var page = address >>> 14;
        if (page === 1) page = 2;           // TODO If page is in DISK-BIOS, assumes the same slot as in page 2 (probably RAM or Cartridge)
        var slotNumber = (machine.bus.getPrimarySlotConfig() >>> (page << 1)) & 0x03;
        return machine.bus.slots[slotNumber];
    }


    var machine;
    var drive;


    var BYTES_PER_SECTOR = 512;                 // Fixed for now, for all disks

    var DPBS_FOR_MEDIA_DESCRIPTORS = {
        // Media F8; 80 Tracks; 9 sectors; 1 side; 3.5" 360 Kb
        0xF8: [0xF8, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0c, 0x00, 0x63, 0x01, 0x02, 0x05, 0x00],
        // Media F9; 80 Tracks; 9 sectors; 2 sides; 3.5" 720 Kb
        0xF9: [0xF9, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0e, 0x00, 0xca, 0x02, 0x03, 0x07, 0x00],
        // Media FA; 80 Tracks; 8 sectors; 1 side; 3.5" 320 Kb
        0xFA: [0xFA, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0a, 0x00, 0x3c, 0x01, 0x01, 0x03, 0x00],
        // Media FB; 80 Tracks; 8 sectors; 2 sides; 3.5" 640 Kb
        0xFB: [0xFB, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0c, 0x00, 0x7b, 0x02, 0x02, 0x05, 0x00],
        // Media FC; 40 Tracks; 9 sectors; 1 side; 5.25" 180 Kb
        0xFC: [0xFC, 0x00, 0x02, 0x0F, 0x04, 0x00, 0x01, 0x01, 0x00, 0x02, 0x40, 0x09, 0x00, 0x60, 0x01, 0x02, 0x05, 0x00],
        // Media FD; 40 Tracks; 9 sectors; 2 sides; 5.25" 360 Kb
        0xFD: [0xFD, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0c, 0x00, 0x63, 0x01, 0x02, 0x05, 0x00],
        // Media FE; 40 Tracks; 8 sectors; 1 side; 5.25" 160 Kb
        0xFE: [0xFE, 0x00, 0x02, 0x0F, 0x04, 0x00, 0x01, 0x01, 0x00, 0x02, 0x40, 0x07, 0x00, 0x3a, 0x01, 0x01, 0x03, 0x00],
        // Media FF; 40 Tracks; 8 sectors; 2 sides; 5.25" 320 Kb
        0xFF: [0xFF, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0a, 0x00, 0x3c, 0x01, 0x01, 0x03, 0x00]
    };

    var CHOICE_STRING = "A new disk will be created.\r\nPlease choose format:\r\n1) 360KB, Single Sided\r\n2) 720KB, Double Sided\r\n\0";
    var CHOICE_STRING_ADDRESS = 0x8100;

    var EXTRA_ITERATIONS_PER_SECTOR = 10000;
    var EXTRA_ITERATIONS_FORMAT = 2000000;

};


