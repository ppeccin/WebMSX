// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CassetteBIOSCPUExtension = function(cpu) {

    cpu.setExtensionHandler([0, 1, 2, 3, 4, 5, 6], cassetteBIOSCPUExtension);

    this.connectDeck = function(pDeck) {
        deck = pDeck;
    };

    this.patchBIOS = function(bios) {
        patchBIOS(bios);
    };

    function cassetteBIOSCPUExtension(s) {
        switch (s.extNum) {
            case 0:
                return TAPION(s.F);
            case 1:
                return TAPIN(s.F);
            case 2:
                return TAPIOF();
            case 3:
                return TAPOON(s.A, s.F);
            case 4:
                return TAPOUT(s.A, s.F);
            case 5:
                return TAPOOF();
            case 6:
                return STMOTR(s.A);
        }
    }

    function patchBIOS(bios) {
        var bytes = bios.bytes;

        // TAPION routine (EXT 0)
        bytes[0x00e1] = 0xed;
        bytes[0x00e2] = 0xe0;
        bytes[0x00e3] = 0xc9;

        // TAPIN routine (EXT 1)
        bytes[0x00e4] = 0xed;
        bytes[0x00e5] = 0xe1;
        bytes[0x00e6] = 0xc9;

        // TAPIOF routine (EXT 2)
        bytes[0x00e7] = 0xed;
        bytes[0x00e8] = 0xe2;
        bytes[0x00e9] = 0xc9;

        // TAPOON routine (EXT 3)
        bytes[0x00ea] = 0xed;
        bytes[0x00eb] = 0xe3;
        bytes[0x00ec] = 0xc9;

        // TAPOUT routine (EXT 4)
        bytes[0x00ed] = 0xed;
        bytes[0x00ee] = 0xe4;
        bytes[0x00ef] = 0xc9;

        // TAPOOF routine (EXT 5)
        bytes[0x00f0] = 0xed;
        bytes[0x00f1] = 0xe5;
        bytes[0x00f2] = 0xc9;

        // STMOTR routine (EXT 6)
        bytes[0x00f3] = 0xed;
        bytes[0x00f4] = 0xe6;
        bytes[0x00f5] = 0xc9;
    }

    function TAPION(F) {
        deck.motor(true);
        return deck.readHeader() ? success(F, HEADER_READ_CYCLES) : fail(F);
    }

    function TAPIN(F) {
        var val = deck.readByte();
        if (val === null) return fail(F);
        var res = success(F, READ_WRITE_BYTE_CYCLES);
        res.A = val;
        return res;
    }

    function TAPIOF() {
        deck.motor(false);
    }

    function TAPOON(A, F) {
        deck.motor(true);
        return deck.writeHeader(A) ? success(F, A ? HEADER_WRITE_LONG_CYCLES : HEADER_WRITE_SHORT_CYCLES) : fail(F);
    }

    function TAPOUT(A, F) {
        return deck.writeByte(A) ? success(F, READ_WRITE_BYTE_CYCLES) : fail(F);
    }

    function TAPOOF() {
        deck.finishWriting();
        deck.motor(false);
    }

    function STMOTR(A) {
        deck.motor(A === 0xff ? null : (A > 0));
    }

    function success(F, extraCycles) {
        return { F: F &= 0xfe, extraCycles: extraCycles };       // Clear C flag = success
    }

    function fail(F) {
        return { F: F |= 0x01 };                                 // Set C flag = fail
    }


    var deck;

    var HEADER_WRITE_LONG_CYCLES = 6000000;
    var HEADER_WRITE_SHORT_CYCLES = HEADER_WRITE_LONG_CYCLES / 3;
    var HEADER_READ_CYCLES = HEADER_WRITE_SHORT_CYCLES / 2;
    var READ_WRITE_BYTE_CYCLES = 150;

};