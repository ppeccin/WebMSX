// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskBIOSCPUExtension = function(cpu, bus) {

    cpu.setExtensionHandler([0xa, 0xb, 0xc, 0xd, 0xe], diskBIOSCPUExtension);

    this.connectDrive = function(pDrive) {
        drive = pDrive;
    };

    this.patchDiskBIOS = function(bios) {
        patchDiskBIOS(bios);
    };

    function diskBIOSCPUExtension(s) {
        switch (s.extNum) {
            case 0xa:
                return DSKIO(s.F, s.A, s.B, s.C, s.DE, s.HL);
            case 0xb:
                return DSKCHG(s.F, s.A, s.B, s.C, s.HL);
            case 0xc:
                return GETDPB();
            case 0xd:
                return DSKFMT();
            case 0xe:
                return MTOFF();
        }
    }

    function patchDiskBIOS(bios) {
        var bytes = bios.bytes;

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
        console.log("DSKIO: " + wmsx.Util.toHex2(F) + ", " + wmsx.Util.toHex2(A) + ", "
            + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        // Carry set = write, reset = read
        if (F & 1) return DSKIOWrite(F, A, B, C, DE, HL);
        else return DSKIORead(F, A, B, C, DE, HL);
    }

    function DSKIORead(F, A, B, C, DE, HL) {
        var res = drive.readSectors(A, B, C, DE);

        // Error
        if (res.error !== undefined)
            return { F: F | 1, A: res.error, B: res.sectorsRemaining };


        console.log("Bytes read: " + res.bytesRead.length);


        // Transfer bytes read
        var bytes = res.bytesRead;
        for (var i = 0; i < bytes.length; i++)
            bus.write(HL + i, bytes[i]);

        // Success
        return { F: F & 1, B: res.sectorsRead };
    }

    function DSKIOWrite(F, A, B, C, DE, HL) {
        var res = drive.writeSectors(A, B, C, DE);

        return { F: F | 1, A: res.error, B: res.sectorsRemaining };
    }

    function DSKCHG(F, A, B, C, HL) {
        console.log("DSKCHG: " + wmsx.Util.toHex2(F) + ", " + wmsx.Util.toHex2(A) + ", "
            + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(HL));

        return { F: F & ~1, B: 1 };
    }

    function GETDPB() {
        console.log("GETDPB");
    }

    function DSKFMT() {
        console.log("DSKFMT");
    }

    function MTOFF() {
        console.log("MTOFF");
    }


    var drive;

};