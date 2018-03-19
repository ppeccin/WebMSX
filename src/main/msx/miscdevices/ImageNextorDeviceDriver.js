// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Nextor Device-based Driver for disk images. Implements driver public calls using the CPU extension protocol
wmsx.ImageNextorDeviceDriver = function() {
"use strict";

    this.connect = function(kernel, machine) {
        drive = machine.getDiskDriveSocket().getDrive();
        bus = machine.bus;
        patchNextorKernel(kernel);
    };

    this.disconnect = function(kernel, machine) {
    };

    this.powerOff = function() {
    };

    this.cpuExtensionBegin = function(s) {
        switch (s.extNum) {
            case 0x0:
                return DRV_VERSION();
            case 0x1:
                return DRV_INIT(s.A, s.B, s.HL);
            case 0x8:
                return DEV_RW(s.F, s.A, s.B, s.C, s.DE, s.HL);
            case 0x9:
                return DEV_INFO(s.A, s.B, s.HL);
            case 0xa:
                return DEV_STATUS(s.A, s.B);
            case 0xb:
                return LUN_INFO(s.A, s.B, s.HL);
        }
    };

    this.cpuExtensionFinish = function(s) {
        // nothing
    };

    function patchNextorKernel(kernel) {
        var bytes = kernel.bytes;

        // Driver Header  --------------------------------------------

        // DRV_SIGN already correct on base kernel

        // DRV_FLAGS
        bytes[0x1c10e] = 0x01;   // Device-based driver

        // DRV_NAME
        var name = "WebMSX Nextor Device Driver     ";
        for (var b = 0; b < 32; ++b) bytes[0x1c110 + b] = name.charCodeAt(b);


        // Common Routines  ------------------------------------------

        // DRV_TIMI routine (nothing)
        bytes[0x1c130] = 0xc9;
        bytes[0x1c131] = 0xc9;
        bytes[0x1c132] = 0xc9;

        // DRV_VERSION routine (EXT 0)
        bytes[0x1c133] = 0xed;
        bytes[0x1c134] = 0xe0;
        bytes[0x1c135] = 0xc9;

        // DRV_INIT routine (EXT 1)
        bytes[0x1c136] = 0xed;
        bytes[0x1c137] = 0xe1;
        bytes[0x1c138] = 0xc9;

        // DRV_BASSTAT routine (just set carry)
        bytes[0x1c139] = 0x37;
        bytes[0x1c13a] = 0xc9;
        bytes[0x1c13b] = 0xc9;

        // DRV_BASDEV routine (just set carry)
        bytes[0x1c13c] = 0x37;
        bytes[0x1c13d] = 0xc9;
        bytes[0x1c13e] = 0xc9;

        // DRV_EXTBIO routine (nothing)
        bytes[0x1c13f] = 0xc9;
        bytes[0x1c140] = 0xc9;
        bytes[0x1c141] = 0xc9;

        // DRV_DIRECT0/1/2/3/4 (nothing)
        for (b = 0x1c142; b < 0x1c152; ++b) bytes[b] = 0xc9;


        // Routines for device-based driver   ---------------------------------

        // DEV_RW routine (EXT 8)
        bytes[0x1c160] = 0xed;
        bytes[0x1c161] = 0xe8;
        bytes[0x1c162] = 0xc9;

        // DEV_INFO routine (EXT 9)
        bytes[0x1c163] = 0xed;
        bytes[0x1c164] = 0xe9;
        bytes[0x1c165] = 0xc9;

        // DEV_STATUS routine (EXT A)
        bytes[0x1c166] = 0xed;
        bytes[0x1c167] = 0xea;
        bytes[0x1c168] = 0xc9;

        // LUN_INFO routine (EXT B)
        bytes[0x1c169] = 0xed;
        bytes[0x1c16a] = 0xeb;
        bytes[0x1c16b] = 0xc9;
    }

    function DRV_VERSION() {
        // wmsx.Util.log("DRV_VERSION");

        return { A: 5, B: 0, C: 0 };
    }

    function DRV_INIT(A, B, HL) {
        // wmsx.Util.log("DRV_INIT: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex4(HL));

        return { F: 0, A: 0, HL: 0 };
    }

    function DEV_RW(F, A, B, C, DE, HL) {
        // Invalid Device or Logical Unit
        if (A !== 1 || C !== 1)
            return { A: IDEVL, B: 0 };

        drive.motorFlash(2);

        // Not Ready error if Disk not present
        if (!drive.isDiskInserted(2))
            return { A: NRDY, B: 0 };

        if (F & 1) return DEV_RW_Write(F, A, B, C, DE, HL);
        else return DEV_RW_Read(F, A, B, C, DE, HL);
    }

    function DEV_RW_Read(F, A, B, C, DE, HL) {
        // wmsx.Util.log("DEV_RW Read: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        var initialSector = bus.read(DE+0) | (bus.read(DE+1) << 8) | (bus.read(DE+2) << 16) | (bus.read(DE+3) << 24);

        var suc = drive.readSectorsToSlot(2, initialSector, B, bus, HL);

        // Not Ready error if can't read
        if (!suc)
            return { A: NRDY, B: 0 };

        // Success
        return { A: 0 };
    }

    function DEV_RW_Write(F, A, B, C, DE, HL) {
        // wmsx.Util.log("DEV_RW Write: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        // Disk Write Protected
        //if (drive.diskWriteProtected(1))
        //    return { A: WPROT, B: 0 };

        var initialSector = bus.read(DE) | (bus.read(DE+1) << 8) | (bus.read(DE+2) << 16) | (bus.read(DE+3) << 24);

        var suc = drive.writeSectorsFromSlot(2, initialSector, B, bus, HL);

        // Not Ready error if can't write
        if (!suc)
            return { A: NRDY, B: 0 };

        // Success
        return { A: 0 };
    }

    function DEV_INFO(A, B, HL) {
        // wmsx.Util.log("DEV_INFO: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex4(HL));

        // Invalid Device
        if (A !== 1)
            return { A: 1 };

        // Basic Info: One Logical Unit, no Flags
        if (B === 0) {
            bus.write(HL, 0x01); bus.write(HL + 1, 0x00);
            return {A: 0};
        }

        // Manufacturer Name
        if (B === 1) {
            var str = "WebMSX                                                                   ";
            for (var b = 0; b < 64; ++b) bus.write(HL + b, str.charCodeAt(b));
            return {A: 0};
        }

        // Device Name
        if (B === 2) {
            str = "WebMSX Removable Hard Disk                                                   ";
            for (b = 0; b < 64; ++b) bus.write(HL + b, str.charCodeAt(b));
            return {A: 0};
        }

        // Info not available
        return { A: 1 };
    }

    function DEV_STATUS(A, B) {
        // wmsx.Util.log("DEV_STATUS: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B));

        // Invalid Device or Logical Unit
        if (A !== 1 || B !== 1)
            return { A: 0 };

        var res = drive.diskHasChanged(2);       // true = yes, false = no, null = unknown

        // Success
        return { A: res === null ? 3 : res ? 2 : 1 };
    }

    function LUN_INFO(A, B, HL) {
        // wmsx.Util.log("LUN_INFO: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex4(HL));

        // Invalid Device or Logical Unit
        if (A !== 1 || B !== 1)
            return { A: 1 };

        var ts = drive.getTotalSectorsAvailable(2) || 0;

        // Info: Block Device, Sector Size 512, Total Sectors, Removable, no CHS info
        var res = [ 0x00, 0x00, 0x02, ts & 0xff, (ts >> 8) & 0xff, (ts >> 16) & 0xff, (ts >> 24) & 0xff, 0x01, 0x00, 0x00, 0x00, 0x00];
        for (var b = 0; b < 12; ++b) bus.write(HL + b, res[b]);

        // Success
        return { A: 0 };
    }


    var drive;
    var bus;

    var  NRDY =  0xFC,
         WPROT = 0xF8,
         IDEVL = 0xB5;

};


