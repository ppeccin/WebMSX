// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskBIOSCPUExtension = function(cpu, bus) {

    cpu.setExtensionHandler([0xa, 0xb, 0xc, 0xd, 0xe], diskBIOSCPUExtension);

    this.connectDrive = function(pDrive) {
        drive = pDrive;
    };

    this.patchDiskBIOS = function(bios) {
        if (bios) patchDiskBIOS(bios);
    };

    function diskBIOSCPUExtension(s) {
        switch (s.extNum) {
            case 0xa:
                return DSKIO(s.F, s.A, s.B, s.C, s.DE, s.HL);
            case 0xb:
                return DSKCHG(s.F, s.A, s.B, s.C, s.HL);
            case 0xc:
                return GETDPB(s.A, s.B, s.C, s.HL);
            case 0xd:
                return DSKFMT();
            case 0xe:
                return MTOFF();
        }
    }

    function patchDiskBIOS(bios) {
        var bytes = bios.bytes;

        bytes[0x7ff8] = 0;                  // Init for PHILLIPS interface?

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

        // CHOICE routine not patched

        // DSKFMT routine (EXT D)
        bytes[0x401c] = 0xed;
        bytes[0x401d] = 0xed;
        bytes[0x401e] = 0xc9;

        // MTOFF routine (EXT E)
        bytes[0x401f] = 0xed;
        bytes[0x4020] = 0xee;
        bytes[0x4021] = 0xc9;
    }

    function DSKIO(F, A, B, C, DE, HL) {
        if (F & 1) return DSKIOWrite(F, A, B, C, DE, HL);
        else return DSKIORead(F, A, B, C, DE, HL);
    }

    function DSKIORead(F, A, B, C, DE, HL) {
        console.log("DSKIO Read: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        var bytes = drive.readSectors(DE, B);

        // Not Ready error if can't read
        if (!bytes) {
            console.log("DSKIO Read error");
            return { F: F | 1, A: 2, B: B };        // All sectors to read still remaining
        }

        // Transfer bytes read
        writeToMemory(bytes, HL);

        // Success
        return { F: F & ~1, B: 0};
    }

    function DSKIOWrite(F, A, B, C, DE, HL) {
        console.log("DSKIO Write: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        // Disk Write Protected
        return { F: F | 1, A: 0, B: B };            // All sectors to write still remaining
    }

    function DSKCHG(F, A, B, C, HL) {
        console.log("DSKCHG: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(HL));

        var res = drive.diskHasChanged();       // true = yes, false = no, null = unknown

        // Success, Disk not changed
        if (res === false) {
            console.log("---- Result: NO");
            return { F: F & ~1, B: 1 };
        }

        // Disk changed or unknown, read disk to determine media type
        var bytes = drive.readSectors(0, 2);

        // Not Ready error if can't read
        if (!bytes) {
            console.log("DSKCHG error");
            return {F: F | 1, A: 2, B: 0};
        }

        console.log("---- Result: " + (res === true ? "YES" : "UNKNOWN"));

        // Get just the fist byte from FAT for now
        var mediaDeskFromDisk = bytes[512];
        GETDPB(A, mediaDeskFromDisk, C, HL);

        // Success, Disk changed or unknown and new DPB transferred
        return { F: F & ~1, B: (res === true ? 0xff : 0) };          // B = -1 (FFh) if disk changed
    }

    function GETDPB(A, B, C, HL) {
        console.log("GETDPB: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(HL));

        var mediaDesc = B === 0 ? C : B;
        if (mediaDesc < 0xF8) return;           // Invalid Media Descriptor

        console.log("---- Result: " + wmsx.Util.toHex2(mediaDesc));

        var dpb = DPBS_FOR_MEDIA_DESCIPTORS[mediaDesc];
        writeToMemory(dpb, HL + 1);
    }

    function DSKFMT() {
        console.log("DSKFMT");
    }

    function MTOFF() {
        console.log("MTOFF");
    }

    function writeToMemory(bytes, address) {
        for (var i = 0; i < bytes.length; i++)
            bus.write(address + i, bytes[i]);
    }

    var drive;


    var DPBS_FOR_MEDIA_DESCIPTORS = {
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
    }

};