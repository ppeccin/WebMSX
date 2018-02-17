// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Mextor Device-bases Driver for disk images. Implements driver public calls using the CPU extension protocol
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
         wmsx.Util.log("DRV_VERSION");

        return { A: 5, B: 0, C: 0 };
    }

    function DRV_INIT(A, B, HL) {
        wmsx.Util.log("DRV_INIT: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex4(HL));

        return { F: 0, A: 0, HL: 0 };
    }

    function DEV_RW(F, A, B, C, DE, HL) {
        if (F & 1) return DEV_RW_Write(F, A, B, C, DE, HL);
        else return DEV_RW_Read(F, A, B, C, DE, HL);
    }

    function DEV_RW_Read(F, A, B, C, DE, HL) {
        wmsx.Util.log("DEV_RW Read: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        var suc = false && drive.readSectorsToSlot(A, DE, B, getSlotForMemoryAccess(HL), HL);

        // Not Ready error if can't read
        if (!suc)
            return { A: 2, B: 0 };

        // Success
        return { A: 0 };
    }

    function DEV_RW_Write(F, A, B, C, DE, HL) {
        wmsx.Util.log("DEV_RW Write: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        // Not Ready error if Disk not present
        if (!drive.isDiskInserted(A))
            return { A: 2, B: 0 };

        // Disk Write Protected
        if (drive.diskWriteProtected(A))
            return { A: 7, B: 0 };

        var suc = false && drive.writeSectorsFromSlot(A, DE, B, getSlotForMemoryAccess(HL), HL);

        // Not Ready error if can't write
        if (!suc)
            return { A: 2, B: 0 };

        // Success
        return { A: 0 };
    }

    function DEV_INFO(A, B, HL) {
        wmsx.Util.log("DEV_INFO: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex4(HL));

        return { A: 0 };
    }

    function DEV_STATUS(A, B) {
        wmsx.Util.log("DEV_STATUS: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B));

        // Invalid Device or Logical Unit
        if (A !== 1 || B !== 1)
            return { A: 0 };

        var res = false && drive.diskHasChanged(A);       // true = yes, false = no, null = unknown

        // Success, Disk not changed
        if (res === false)
            return { A: 1 };

        // Success, Disk changed
        return { A: 2 };
    }

    function LUN_INFO(A, B, HL) {
        wmsx.Util.log("LUN_INFO: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex4(HL));

        // Invalid Device or Logical Unit
        if (A !== 1 || B !== 1)
            return { A: 1 };

        var res = [ 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00];
        for (var b = 0; b < 12; ++b) bus.write(HL + b, res[b]);

        // Success
        return { A: 0 };
    }

    function writeToMemory(bytes, address) {
        var slot = getSlotForMemoryAccess(address);
        for (var i = 0; i < bytes.length; i++)
            slot.write(address + i, bytes[i]);
    }


    var drive;
    var bus;

    var BYTES_PER_SECTOR = 512;                 // Fixed for now

};


