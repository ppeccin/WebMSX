// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Nextor Device-based and SymbOS Driver for disk images. Implements driver public calls using the CPU extension protocol
wmsx.ImageNextorDeviceDriver = function() {
"use strict";

    this.connect = function(kernel, machine) {
        drive = machine.getDiskDriveSocket().getDrive();
        bus = machine.bus;
        patchNextorKernel(kernel);
        // SymbOS HD Driver
        bus.setCpuExtensionHandler(0xf0, this);
        bus.setCpuExtensionHandler(0xf1, this);
        bus.setCpuExtensionHandler(0xf2, this);
    };

    this.disconnect = function(kernel, machine) {
        // SymbOS HD Driver
        machine.bus.setCpuExtensionHandler(0xf0, undefined);
        machine.bus.setCpuExtensionHandler(0xf1, undefined);
        machine.bus.setCpuExtensionHandler(0xf2, undefined);
    };

    this.powerOff = function() {
    };

    this.cpuExtensionBegin = function(s) {
        switch (s.extNum) {
            // Nextor Device Driver
            case 0xe0:
                return DRV_VERSION();
            case 0xe1:
                return DRV_INIT(s.A, s.B, s.HL);
            case 0xe8:
                return DEV_RW(s.F, s.A, s.B, s.C, s.DE, s.HL);
            case 0xe9:
                return DEV_INFO(s.A, s.B, s.HL);
            case 0xea:
                return DEV_STATUS(s.A, s.B);
            case 0xeb:
                return LUN_INFO(s.A, s.B, s.HL);

            // SymbOS HD Driver
            case 0xf0:
                return SYMBOS_HD_DRVINP(s.F, s.C, s.B, s.HL, s.IX, s.IY);
            case 0xf1:
                return SYMBOS_HD_DRVOUT(s.F, s.C, s.B, s.HL, s.IX, s.IY);
            case 0xf2:
                return SYMBOS_HD_DRVACT(s.F, s.C, s.HL);
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
            return { A: NEXTOR_IDEVL, B: 0 };

        drive.motorFlash(2);

        // Not Ready error if Disk not present
        if (!drive.isDiskInserted(2))
            return { A: NEXTOR_NRDY, B: 0 };

        if (F & 1) return DEV_RW_Write(F, A, B, C, DE, HL);
        else return DEV_RW_Read(F, A, B, C, DE, HL);
    }

    function DEV_RW_Read(F, A, B, C, DE, HL) {
        // wmsx.Util.log("DEV_RW Read: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        var initialSector = bus.read(DE+0) | (bus.read(DE+1) << 8) | (bus.read(DE+2) << 16) | (bus.read(DE+3) << 24);

        var suc = drive.readSectorsToSlot(2, initialSector, B, bus, HL);

        // Not Ready error if can't read
        if (!suc)
            return { A: NEXTOR_NRDY, B: 0 };

        // Success
        return { A: 0 };
    }

    function DEV_RW_Write(F, A, B, C, DE, HL) {
        // wmsx.Util.log("DEV_RW Write: " + wmsx.Util.toHex2(A) + ", " + wmsx.Util.toHex2(B) + ", " + wmsx.Util.toHex2(C) + ", " + wmsx.Util.toHex4(DE) + ", " + wmsx.Util.toHex4(HL));

        // Disk Write Protected
        //if (drive.diskWriteProtected(1))
        //    return { A: NEXTOR_WPROT, B: 0 };

        var initialSector = bus.read(DE) | (bus.read(DE+1) << 8) | (bus.read(DE+2) << 16) | (bus.read(DE+3) << 24);

        var suc = drive.writeSectorsFromSlot(2, initialSector, B, bus, HL);

        // Not Ready error if can't write
        if (!suc)
            return { A: NEXTOR_NRDY, B: 0 };

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


    // SymboOS Driver

    function SYMBOS_HD_DRVACT(F, C, HL) {
        // wmsx.Util.log("SYMBOS_HD_DRVACT. C (device): " + wmsx.Util.toHex2(C) + ", HL (info addr): " + wmsx.Util.toHex4(HL) + ", PC: " + WMSX.room.machine.cpu.eval("PC").toString(16));

        // HL points to device information

        delete symbOSDevicePartOffset[C];               // Set device as not initialized

        // Channel and Partition info
        var chaPart = bus.read(HL + 26);                // bit [0-3] -> 0 = not partitioned, 1-4 = primary, 5-15 = extended, bit [4-7] -> channel (0 = master, 1 = slave or 0-15)
        var channel = chaPart >> 4;
        var partition = chaPart & 0xf;

        // Only Channel 0 Supported
        var available = channel === 0;
        var partOffset = 0;

        if (available) {
            // Error if no disk
            if (!drive.isDiskInserted(2)) return { F: F | 1, A: 26 };           // CF = 1, A = Device not ready Error

            drive.motorFlash(2);

            var mbrSig = (drive.readByte(2, 510) << 8) | drive.readByte(2, 511);

            // Error if could not read
            if (mbrSig === null) return { F: F | 1, A: 26 };                    // CF = 1, A = Device not ready Error

            var isPartitioned = mbrSig === 0x55AA;

            // Partition asked?
            if (partition > 0) {
                // Disk not partitioned?
                if (!isPartitioned) return { F: F | 1, A: 4 };                  // CF = 1, A = Partition does not exist Error
                // Get Partition data and offset
                var partData = 0x1be + (16 * (partition - 1));
                var partType = drive.readByte(2, partData + 4);
                partOffset = drive.readDWord(2, partData + 8);
                // Error if could not read
                if (partType === null || partOffset === null) return { F: F | 1, A: 26 };  // Device not ready Error
                // Partition not found or invalid?
                if (!partOffset || !partType) return { F: F | 1, A: 4 };        // CF = 1, A = Partition does not exist Error
            } else {
                // Disk partitioned?
                if (isPartitioned) return { F: F | 1, A: 4 };                   // CF = 1, A = Partition does not exist Error
                // No offset
            }
        }

        // Set Symbos Device registers on memory
        bus.write(HL + 0, available ? 1 : 0);               // stodatsta <- stotypoky,  Device Status = Ready (1) or Unavailable (0)
        bus.write(HL + 1, 0x91);                            // stodattyp <- stomedsdc,  Device Type = SD Card, Removable
        bus.write(HL + 12+0, partOffset & 0xff);            // stodatbeg <- 0,          Starting Sector = 0
        bus.write(HL + 12+1, (partOffset >> 8) & 0xff);
        bus.write(HL + 12+2, (partOffset >> 16) & 0xff);
        bus.write(HL + 12+3, (partOffset >> 24) & 0xff);
        bus.write(HL + 31, 0);                              // stodatflg <- 00,         SD Slot (always 0), not SHDC

        symbOSDevicePartOffset[C] = partOffset;             // Remember for later device accesses

        // OK
        return { F: F & ~1 };     // CF = 0
    }

    function SYMBOS_HD_DRVINP(F, C, B, HL, IX, IY) {
        // wmsx.Util.log("SYMBOS_HD_DRVINP. C (device): " + wmsx.Util.toHex2(C) + ", B (quant): " + wmsx.Util.toHex2(B) + ", HL (dest): " + wmsx.Util.toHex4(HL) + ", IX (sectorL): " + wmsx.Util.toHex4(IX) + ", IY (sectorH): " + wmsx.Util.toHex4(IY) + ", PC: " + WMSX.room.machine.cpu.eval("PC").toString(16));

        // Channel (SD Slot) fixed at 0

        var partOffset = symbOSDevicePartOffset[C];

        // Error if no disk or Device not initialized
        if (partOffset === undefined || !drive.isDiskInserted(2)) return { F: F | 1, A: 26 };       // CF = 1, A = Device not ready Error

        drive.motorFlash(2);

        var suc = drive.readSectorsToSlot(2, partOffset + (IY << 16) + IX, B, bus, HL);

        // Error if can't read
        if (!suc) return { F: F | 1, A: 9 };        // CF = 1, A = Unknown disk Error

        // Success
        return { F: F & ~1 };     // CF = 0
    }

    function SYMBOS_HD_DRVOUT(F, C, B, HL, IX, IY) {
        // wmsx.Util.log("SYMBOS_HD_DRVOUT. C (device): " + wmsx.Util.toHex2(C) + ", B (quant): " + wmsx.Util.toHex2(B) + ", HL (dest): " + wmsx.Util.toHex4(HL) + ", IX (sectorL): " + wmsx.Util.toHex4(IX) + ", IY (sectorH): " + wmsx.Util.toHex4(IY) + ", PC: " + WMSX.room.machine.cpu.eval("PC").toString(16));

        // Channel (SD Slot) fixed at 0

        var partOffset = symbOSDevicePartOffset[C];

        // Error if no disk or Device not initialized
        if (partOffset === undefined || !drive.isDiskInserted(2)) return { F: F | 1, A: 26 };       // CF = 1, A = Device not ready Error

        drive.motorFlash(2);

        var suc = drive.writeSectorsFromSlot(2, partOffset + (IY << 16) + IX, B, bus, HL);

        // Error if can't write
        if (!suc) return { F: F | 1, A: 9 };        // CF = 1, A = Unknown disk Error

        // Success
        return { F: F & ~1 };     // CF = 0
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return { so: symbOSDevicePartOffset };
    };

    this.loadState = function(s) {
        symbOSDevicePartOffset = (s && s.so) !== undefined ? s.so : { };
    };


    var symbOSDevicePartOffset = { };       // Stores Partition Offset for each SymbOS device (0..7)

    var drive;
    var bus;


    var  NEXTOR_NRDY =  0xFC,
         NEXTOR_WPROT = 0xF8,
         NEXTOR_IDEVL = 0xB5;

};


