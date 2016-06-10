// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Disk Driver for disk images. Implements driver public calls using the CPU extension protocol
wmsx.ImageDiskDriver = function() {

    this.connect = function(diskBIOS, machine) {
        drive = machine.getDiskDriveSocket().getDrive();
        bus = machine.bus;
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
        // Starting with offset 0x4000

        // INIHRD routine (EXT 8)
        bytes[0x176F] = 0xed;
        bytes[0x1770] = 0xe8;
        bytes[0x1771] = 0x00;   // NOP
        // DRIVES routine (EXT 9)
        bytes[0x1850] = 0xed;
        bytes[0x1851] = 0xe9;
        bytes[0x1852] = 0x00;   // NOP

        // DOS Kernel jump table for Driver routines

        // DSKIO routine (EXT A)
        bytes[0x0010] = 0xed;
        bytes[0x0011] = 0xea;
        bytes[0x0012] = 0xc9;
        // DSKCHG routine (EXT B)
        bytes[0x0013] = 0xed;
        bytes[0x0014] = 0xeb;
        bytes[0x0015] = 0xc9;
        // GETDPB routine (EXT C)
        bytes[0x0016] = 0xed;
        bytes[0x0017] = 0xec;
        bytes[0x0018] = 0xc9;
        // CHOICE routine (EXT D)
        bytes[0x0019] = 0xed;
        bytes[0x001a] = 0xed;
        bytes[0x001b] = 0xc9;
        // DSKFMT routine (EXT E)
        bytes[0x001c] = 0xed;
        bytes[0x001d] = 0xee;
        bytes[0x001e] = 0xc9;
        // MTOFF routine (EXT F)
        bytes[0x001f] = 0xed;
        bytes[0x0020] = 0xef;
        bytes[0x0021] = 0xc9;

        // It seem the Disk BIOS routines just assume the CHOICE message will reside in the same slot as the Disk BIOS itself.
        // So we must put the message in the same slot and make that memory region readable
        // Lets use a memory space in page 2 of this same slot and hope it works
        for (var i = 0; i < CHOICE_STRING.length; i++)
            bytes[CHOICE_STRING_ADDRESS - 0x4000 + i] = CHOICE_STRING.charCodeAt(i);
    }

    function INIHRD(F, HL) {
        // wmsx.Util.log("INIHRD");
        // no real initialization required
    }

    function DRIVES(F, HL) {
        // wmsx.Util.log("DRIVES: " + wmsx.Util.toHex2(F) + ", " + wmsx.Util.toHex4(HL));

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
        var bytes = drive.readSectors(A, DE, B);

        // Not Ready error if can't read
        if (!bytes)
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Transfer bytes read
        writeToMemory(bytes, HL);

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
        if (drive.diskWriteProtected(A))
            return { F: F | 1, A: 0, B: B, extraIterations: spinTime };

        var res = drive.writeSectors(A, DE, B, readFromMemory(HL, B * BYTES_PER_SECTOR));

        // Not Ready error if can't write
        if (!res)
            return { F: F | 1, A: 2, B: B, extraIterations: spinTime };

        // Success
        return { F: F & ~1, B: 0, extraIterations: spinTime + B * EXTRA_ITERATIONS_PER_SECTOR };
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

        var mediaType = B === 0 ? C : B;
        if (mediaType < 0xF8) return;           // Invalid Media Descriptor

        var dpb = drive.MEDIA_TYPE_DPB[mediaType];
        writeToMemory(dpb, HL + 1);
    }

    function CHOICE() {
        // wmsx.Util.log("CHOICE" + " Slots: " + wmsx.Util.toHex2(WMSX.room.machine.bus.getPrimarySlotConfig()));

        return { HL: CHOICE_STRING_ADDRESS };
    }

    function DSKFMT(F, A, DE) {
        // wmsx.Util.log("DSKFMT" + " Slots: " + wmsx.Util.toHex2(WMSX.room.machine.bus.getPrimarySlotConfig()));

        var d = DE >>> 8;
        var f = A - 1;

        // Bad Parameter error if Disk or Format Option is invalid. Only options 0 and 1 supported
        if ((f < 0 || f > 1) || (d < 0 || d > 1))
            return { F: F | 1, A: 12 };

        // Disk Write Protected error
        if (drive.diskWriteProtected(d))
            return { F: F | 1, A: 0 };

        var mediaType = drive.FORMAT_OPTIONS_MEDIA_TYPES[f];

        drive.insertNewEmptyDisk(d, mediaType);

        drive.motorOn(d);
        drive.formatDisk(d, mediaType);

        return { F: F & ~1, extraIterations: EXTRA_ITERATIONS_FORMAT};
    }

    function MTOFF() {
         //wmsx.Util.log("MTOFF");

        drive.allMotorsOffNow();
    }

    function readFromMemory(address, quant) {
        // wmsx.Util.log("Read memory: " + wmsx.Util.toHex4(address) + ", " + quant);
        var slot = getSlotForMemoryAccess(address);
        var res = new Array(quant);
        for (var i = 0; i < quant; i++)
            res[i] = slot.read(address + i);

        return res;
    }

    function writeToMemory(bytes, address) {
        var slot = getSlotForMemoryAccess(address);
        for (var i = 0; i < bytes.length; i++)
            slot.write(address + i, bytes[i]);
    }

    function getSlotForMemoryAccess(address) {
        // If address is in DISK-BIOS range, force to RAM slot as per F342h
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


    var drive;
    var bus;


    var BYTES_PER_SECTOR = 512;                 // Fixed for now, for all disks

    var CHOICE_STRING = "A new disk will be created.\r\nPlease choose format:\r\n1) 720KB, Double Sided\r\n2) 360KB, Single Sided\r\n\0";
    var CHOICE_STRING_ADDRESS = 0x8040;

    var EXTRA_ITERATIONS_PER_SECTOR = 5000;
    var EXTRA_ITERATIONS_FORMAT = 2000000;

};


