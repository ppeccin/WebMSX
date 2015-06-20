// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

CassetteBIOSExtension = function(casseteSocket) {
    var self = this;

    this.connectDeck = function(pDeck) {
        deck = pDeck;
    };

    this.patchBIOS = function(bios) {
        if (bios) patchBIOS(bios);
    };

    this.cpuExtension = function(num, PC, SP, A, F, B, C, D, E, H, L, IX, IY, AF2, BC2, DE2, HL2, I, R, IFF1, IM) {
        if (num === 0)
            return TAPION(F);
        else if (num === 1)
            return TAPIN(F);
        else if (num === 2)
            return TAPIOF();
        else if (num === 3)
            return TAPOON(A, F);
        else if (num === 4)
            return TAPOUT(A, F);
        else if (num === 5)
            return TAPOOF();
        else if (num === 6)
            return STMOTR(A);
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

    function TAPION(F) {
        return deck.readHeader() ? success(F) : fail(F);
    }

    function TAPIN(F) {
        var val = deck.readByte();
        if (val === null) return fail(F);
        var res = success(F);
        res.A = val;
        return res;
    }

    function TAPIOF() {
        // nothing
    }

    function TAPOON(A, F) {
        return deck.writeHeader(A) ? success(F) : fail(F);
    }

    function TAPOUT(A, F) {
        return deck.writeByte(A) ? success(F) : fail(F);
    }

    function TAPOOF() {
        // nothing
    }

    function STMOTR(A) {
        deck.motor(A === 0xff ? null : A);
    }

    function success(F) {
        return { F: F &= 0xfe };            // Clear C flag = success
    }

    function fail(F) {
        return { F: F |= 0x01 };            // Set C flag = fail
    }


    var deck;

};