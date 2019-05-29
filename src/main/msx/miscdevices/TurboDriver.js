// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Turbo Control Driver. Implements BIOS public calls using the CPU extension protocol
wmsx.TurboDriver = function() {
"use strict";

    var self = this;

    this.connect = function(pBios, pMachine) {
        bios = pBios;
        biosSocket = pMachine.getBIOSSocket();
        machine = pMachine;
        this.turboModesUpdate();
    };

    this.reset = function() {
        chgCpuValue = 0;
        if (!softTurboON) return;
        softTurboON = false;
        this.turboModesUpdate();
    };

    this.turboModesUpdate = function() {
        var softTurbo = machine.machineType >= 2;         // auto: Only for MSX2 or better, CHGCPU active
        var cpuMode = machine.getCPUTurboMode();
        var vdpMode = machine.getVDPTurboMode();

        if (cpuMode < 0 || !softTurbo) unPatchBIOS();
        else patchBIOS();

        machine.cpu.setCPUTurboMulti(cpuMode === 0 && softTurboON ? WMSX.CPU_SOFT_TURBO_MULTI : cpuMode <= 0 ? 1 : cpuMode);
        machine.vdp.setVDPTurboMulti(vdpMode === 0 && softTurboON ? WMSX.VDP_SOFT_TURBO_MULTI : vdpMode > 1 ? vdpMode : 1);

        biosSocket.fireMachineTurboModesStateUpdate();
    };

    this.cpuExtensionBegin = function(s) {
        if (machine.machineType <= 1) return;           // Only for MSX2 or better, safety
        switch (s.extNum) {
            case 0xe8:
                return CHGCPU(s.A);
            case 0xe9:
                return GETCPU();
        }
    };

    this.cpuExtensionFinish = function(s) {
        // No Finish operation
    };

    function patchBIOS() {
        var bytes = bios.bytes;
        if (bytes[0x190] === 0xed) return;      // already patched

        // CHGCPU routine JUMP
        bytes[0x0180] = 0xc3;
        bytes[0x0181] = 0x8d;
        bytes[0x0182] = 0x01;

        // GETCPU routine JUMP
        bytes[0x0183] = 0xc3;
        bytes[0x0184] = 0x90;
        bytes[0x0185] = 0x01;

        // CHGCPU routine (EXT 8)
        bytes[0x018d] = 0xed;
        bytes[0x018e] = 0xe8;
        bytes[0x018f] = 0xc9;

        // GETCPU routine (EXT 9)
        bytes[0x0190] = 0xed;
        bytes[0x0191] = 0xe9;
        bytes[0x0192] = 0xc9;

        // console.log("BIOS Patched");
    }

    function unPatchBIOS() {
        var bytes = bios.bytes;
        if (bytes[0x190] !== 0xed) return;      // already un-patched

        bytes[0x0180] = bytes[0x0183] = bytes[0x018d] = bytes[0x0190] = 0xc9;

        // console.log("BIOS UN-Patched");
    }

    function CHGCPU(A) {
        // console.log("CHGCPU: " + A);

        chgCpuValue = A & 0x83;
        var newSoftON = (chgCpuValue & 0x03) > 0;
        if (softTurboON === newSoftON) return;

        softTurboON = newSoftON;

        if (machine.getCPUTurboMode() === 0) {
            self.turboModesUpdate();
            machine.showCPUTurboModeMessage();
        } else
            machine.showOSD("Could not set CPU Turbo by software: mode is FORCED " + machine.getCPUTurboModeDesc(), true, true);
    }

    function GETCPU() {
        // console.log("GETCPU");

        return { A: chgCpuValue };
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            st: softTurboON,
            cv: chgCpuValue
        };
    };

    this.loadState = function(s) {
        softTurboON = s ? s.st : false;
        chgCpuValue = s ? s.cv : 0;
    };


    var bios;
    var biosSocket;
    var machine;
    var chgCpuValue = 0;
    var softTurboON = false;

};