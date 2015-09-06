// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Cassette Driver for cassette images. Implements driver public calls using the CPU extension protocol
wmsx.ImageCassetteDriver = function() {

    this.connect = function(bios, machine) {
        machine.cpu.setExtensionHandler([0, 1, 2, 3, 4, 5, 6], cassetteBIOSCPUExtension);
        deck = machine.getCassetteSocket().getDeck();
        deck.connectBASICExtension(new wmsx.BASICExtension(machine.bus));
        patchBIOS(bios);
    };

    this.disconnect = function(bios, machine) {
        machine.cpu.setExtensionHandler([0, 1, 2, 3, 4, 5, 6], null);
        deck.connectBASICExtension(null);
    };

    this.powerOff = function() {
        if (deck) deck.motor(false);
    };

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

    function cassetteBIOSCPUExtension(s) {
        if (s.PC < 0x00e1 || s.PC > 0x00f5) return;     // Not intended
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

    function TAPION(F) {
        deck.motor(true);
        return deck.readHeader() ? success(F, HEADER_READ_EXTRA_ITERATIONS) : fail(F);
    }

    function TAPIN(F) {
        var val = deck.readByte();
        if (val === null) return fail(F);
        var res = success(F, READ_WRITE_BYTE_EXTRA_ITERATIONS);
        res.A = val;
        return res;
    }

    function TAPIOF() {
        deck.motor(false);
    }

    function TAPOON(A, F) {
        deck.motor(true);
        return deck.writeHeader(A) ? success(F, A ? HEADER_WRITE_LONG_EXTRA_ITERATIONS : HEADER_WRITE_SHORT_EXTRA_ITERATIONS) : fail(F);
    }

    function TAPOUT(A, F) {
        return deck.writeByte(A) ? success(F, READ_WRITE_BYTE_EXTRA_ITERATIONS) : fail(F);
    }

    function TAPOOF() {
        deck.finishWriting();
        deck.motor(false);
    }

    function STMOTR(A) {
        deck.motor(A === 0xff ? null : (A > 0));
    }

    function success(F, extraIterations) {
        return { F: F &= 0xfe, extraIterations: extraIterations };       // Clear C flag = success
    }

    function fail(F) {
        return { F: F |= 0x01 };                                        // Set C flag = fail
    }


    var deck;

    var HEADER_WRITE_LONG_EXTRA_ITERATIONS = 1500000;
    var HEADER_WRITE_SHORT_EXTRA_ITERATIONS = HEADER_WRITE_LONG_EXTRA_ITERATIONS / 3;
    var HEADER_READ_EXTRA_ITERATIONS = HEADER_WRITE_SHORT_EXTRA_ITERATIONS / 2;
    var READ_WRITE_BYTE_EXTRA_ITERATIONS = 36;

};