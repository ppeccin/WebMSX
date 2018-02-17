// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Turbo Control Driver. Implements BIOS public calls using the CPU extension protocol
wmsx.TurboDriver = function() {
"use strict";

    var self = this;

    this.connect = function(bios, pMachine) {
        machine = pMachine;
        if (machine.machineType > 1) patchBIOS(bios);       // Only for MSX2 or better
    };

    this.disconnect = function(bios, machine) {
        machine = undefined;
    };

    this.powerOff = function() {
    };

    this.cpuExtensionBegin = function(s) {
        if (machine.machineType <= 1) return;               // Only for MSX2 or better
        switch (s.extNum) {
            case 8:
                return CHGCPU(s.A);
            case 9:
                return GETCPU();
        }
    };

    this.cpuExtensionFinish = function(s) {
        // No Finish operation
    };

    function patchBIOS(bios) {
        var bytes = bios.bytes;

        // CHGCPU routine JUMP
        bytes[0x0180] = 0xc3;
        bytes[0x0181] = 0x8c;
        bytes[0x0182] = 0x01;

        // GETCPU routine JUMP
        bytes[0x0183] = 0xc3;
        bytes[0x0184] = 0x8f;
        bytes[0x0185] = 0x01;

        // CHGCPU routine (EXT 8)
        bytes[0x018c] = 0xed;
        bytes[0x018d] = 0xe8;
        bytes[0x018e] = 0xc9;

        // GETCPU routine (EXT 9)
        bytes[0x018f] = 0xed;
        bytes[0x0190] = 0xe9;
        bytes[0x0191] = 0xc9;
    }

    function CHGCPU(A) {
        console.log("CHGCPU: " + A);

        machine.cpu.setCPUTurboMulti((A & 0x03) > 0 ? 2 : 1);
    }

    function GETCPU() {
        console.log("GETCPU");

        return { A: machine.cpu.getCPUTurboMulti() > 1 ? 1 : 0 };
    }


    var machine;

};