// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// This implementation fetches the base opcode at the FIRST clock cycle
// Then fetches operands and executes all operations of the instruction at the LAST clock cycle
// NMI is not supported. All IM modes supported, but data coming from device in bus will always be FFh (MSX). IFF2 is always the same as IFF1
// Original base clock: 3579545 Hz. Rectified to real 60Hz: 3584160Hz

wmsx.Z80 = function() {
"use strict";

    var self = this;

    function init() {
        defineAllInstructions();
    }

    this.powerOn = function() {
        toAF(0xfffd); toBC(0xffff); DE = 0xffff; HL = 0xffff;
        AF2 = 0xfffd; BC2 = 0xffff; DE2 = 0xffff; HL2 = 0xffff;
        toIX(0xffff); toIY(0xffff); SP = 0xffff;
        setINT(0xff);
        this.reset();
    };

    this.powerOff = function() {
    };

    this.clockPulses = function(quant) {
        var turboQuant = quant * turboClockMulti;
        for (var t = turboQuant; t > 0; --t) {
            if (--T > 1) continue;                   // Still counting cycles of current instruction
            if (T > 0) {
                instruction.operation();
            } else {
                ++R;                                 // Verify: R can have bit 7 = 1 only if set manually. How the increment handles that? Ignoring for now, also do not check for 8 bits overflow
                if (ackINT) acknowledgeINT();
                else fetchNextInstruction();
            }
        }
        busCycles += quant;                          // Quantized bus cycle reporting in original clock (no turbo). Lower precision, better performance
    };

    // this.clockPulsesPrecise = function(quant) {
    //     for (var q = quant; q > 0; --q) {
    //         for (var t = turboClockMulti; t > 0; --t) {
    //             if (--T > 1) continue;               // Still counting cycles of current instruction
    //             if (T > 0) {
    //                 instruction.operation();
    //             } else {
    //                 ++R;                             // Verify: R can have bit 7 = 1 only if set manually. How the increment handles that? Ignoring for now, also do not check for 8 bits overflow
    //                 if (ackINT) acknowledgeINT();
    //                 else fetchNextInstruction();
    //             }
    //         }
    //         ++busCycles;                             // Precise bus cycle reporting in original clock (no turbo). Higher precision, worse performance
    //     }
    // };

    this.connectBus = function(aBus) {
        bus = aBus;
    };

    this.reset = function() {
        busCycles = 0;
        T = -1; opcode = null; ackINT = false;
        instruction = null; prefix = 0;
        PC = 0; I = 0; R = 0; IFF1 = 0; IM = 0;
        extensionCurrentlyRunning = null; extensionExtraIterations = 0;
    };

    this.setINTChannel = function(chan, state) {
        var val = state ? INT | (1 << chan) : INT & ~(1 << chan);
        setINT(val);
    };

    function setINT(val) {
        if (INT !== val) {
            INT = val;
            ackINT = val !== 0xff && IFF1 && prefix === 0;
        }
    }

    this.getBUSCycles = function() {
        return busCycles;
    };

    this.setCPUTurboMulti = function(multi) {
        // console.log("SET CPU MULTI:" + multi);

        turboClockMulti = multi < 1 ? 1 : multi > 8 ? 8 : multi;    // 1..8
    };

    this.getCPUTurboMulti = function() {
        return turboClockMulti;
    };

    this.getCPUTurboFreqDesc = function() {
        switch (turboClockMulti) {
            case 1: return "3.58 MHz";
            case 2: return "7.16 MHz";
            case 3: return "10.7 MHz";
            case 4: return "14.3 MHz";
            case 5: return "17.9 MHz";
            case 6: return "21.5 MHz";
            case 7: return "25.1 MHz";
            case 8: return "28.6 MHz";
        }
    };


    // Speed mode
    var turboClockMulti = 1;

    // Extension Handling
    var extensionCurrentlyRunning = null;
    var extensionExtraIterations = 0;

    // Interfaces
    var bus;
    var INT = 0xff; // 8 parallel INT channels. OR behavior (any bit set to 0 triggers INT)

    // Registers
    var PC = 0;     // 16 bits
    var SP = 0;     // 16 bits

    var A = 0;
    var F = 0;
    var B = 0;
    var C = 0;
    var DE = 0;     // 16 bits
    var HL = 0;     // 16 bits
    var IX = 0;     // 16 bits
    var IY = 0;     // 16 bits

    var AF2 = 0;    // 16 bits
    var BC2 = 0;    // 16 bits
    var DE2 = 0;    // 16 bits
    var HL2 = 0;    // 16 bits

    var I = 0;
    var R = 0;

    // Interrupt flags and mode
    var IFF1 = 0;   // No IFF2 supported as NMI is not supported. Always the same as IFF1
    var IM = 0;

    // Status Bits references
    var bS =  0x80,  nS =  7;
    var bZ =  0x40,  nZ =  6;
    var bF5 = 0x20,  nF5 = 5;
    var bH =  0x10,  nH =  4;
    var bF3 = 0x08,  nF3 = 3;
    var bPV = 0x04,  nPV = 2;
    var bN =  0x02,  nN =  1;
    var bC =  0x01,  nC =  0;


    // Fetch and Instruction control

    var busCycles = 0;
    var T = -1;                         // Clocks remaining in the current instruction

    var opcode;
    var prefix;
    var instruction;
    var ackINT = false;

    var instructions =     new Array(270);
    var instructionsED =   new Array(270);
    var instructionsCB =   new Array(270);
    var instructionsDD =   new Array(270);
    var instructionsFD =   new Array(270);
    var instructionsDDCB = new Array(270);
    var instructionsFDCB = new Array(270);
    var instructionsByPrefix = [
        instructions,       // 0
        instructionsED,     // 1
        instructionsCB,     // 2
        instructionsDD,     // 3
        instructionsFD,     // 4
        instructionsDDCB,   // 5
        instructionsFDCB,   // 6
        instructions        // 7  After EI
    ];

    var instructionADT_CYCLES;
    var instructionHALT;

    this.instructionsAll  = [];


    // Internal operations

    function fetchNextInstruction() {
        // if (DEBUG && DEBUG--) console.log(PC.toString(16));

        opcode = fromN();           // Will inc PC
        selectInstruction();
        T = instruction.remainCycles;
        // if (self.trace) self.breakpoint("TRACE");
    }

    function acknowledgeINT() {
        pINT();
    }

    function selectInstruction() {
        if (prefix === 0) {
            instruction = instructions[opcode];                                            // always found
        } else {
            instruction = instructionsByPrefix[prefix][opcode] || instructions[opcode];    // if nothing found, ignore prefix
            if (INT !== 0xff && IFF1) ackINT = true;
            prefix = 0;
        }
    }

    function pcInc() {
        var old = PC;
        PC = (PC + 1) & 0xffff;
        return old;
    }

    function spInc() {
        var old = SP;
        SP = (SP + 1) & 0xffff;
        return old;
    }

    function decSP() {
        return SP = (SP - 1) & 0xffff;
    }

    function fromA() {
        return A;
    }
    function fromB() {
        return B;
    }
    function fromC() {
        return C;
    }
    function fromD() {
        return DE >>> 8;
    }
    function fromE() {
        return DE & 0xff;
    }
    function fromH() {
        return HL >>> 8;
    }
    function fromL() {
        return HL & 0xff;
    }
    function fromIXh() {
        return IX >>> 8;
    }
    function fromIXl() {
        return IX & 0xff;
    }
    function fromIYh() {
        return IY >>> 8;
    }
    function fromIYl() {
        return IY & 0xff;
    }

    function toA(val) {
        A = val;
    }
    function toB(val) {
        B = val;
    }
    function toC(val) {
        C = val;
    }
    function toD(val) {
        DE = (DE & 0xff) | (val << 8);
    }
    function toE(val) {
        DE = (DE & 0xff00) | val;
    }
    function toH(val) {
        HL = (HL & 0xff) | (val << 8);
    }
    function toL(val) {
        HL = (HL & 0xff00) | val;
    }
    function toIXh(val) {
        IX = (IX & 0xff) | (val << 8);
    }
    function toIXl(val) {
        IX = (IX & 0xff00) | val;
    }
    function toIYh(val) {
        IY = (IY & 0xff) | (val << 8);
    }
    function toIYl(val) {
        IY = (IY & 0xff00) | val;
    }

    function fromAF() {
        return (A << 8) | F;
    }
    function fromBC() {
        return (B << 8) | C;
    }
    function fromDE() {
        return DE;
    }
    function fromHL() {
        return HL;
    }
    function fromSP() {
        return SP;
    }
    function fromIX () {
        return IX;
    }
    function fromIY () {
        return IY;
    }

    function toAF(val) {
        A = val >>> 8; F = val & 0xff;
    }
    function toBC(val) {
        B = val >>> 8; C = val & 0xff;
    }
    function toDE(val) {
        DE = val;
    }
    function toHL(val) {
        HL = val;
    }
    function toSP(val) {
        SP = val;
    }
    function toIX(val) {
        IX = val;
    }
    function toIY(val) {
        IY = val;
    }

    function from_BC_8() {
        return bus.read(fromBC());
    }
    function from_DE_8() {
        return bus.read(DE);
    }
    function from_HL_8() {
        return bus.read(HL);
    }
    function from_SP_16() {
        var aux = SP + 1; if (aux > 0xffff) aux = 0;
        return bus.read(SP) | (bus.read(aux) << 8);
    }

    function to_BC_8(val) {
        bus.write(fromBC(), val);
    }
    function to_DE_8(val) {
        bus.write(DE, val);
    }
    function to_HL_8(val) {
        bus.write(HL, val);
    }
    function to_SP_16(val) {
        bus.write(SP, val & 255);
        var aux = SP + 1; if (aux > 0xffff) aux = 0;
        bus.write(aux, val >>> 8);
    }

    var preReadIXYdOffset = 0;
    function preReadIXYd() {
        preReadIXYdOffset = bus.read(pcInc());
    }

    function from_IXd_8() {
        return bus.read(sum16Signed(IX, bus.read(pcInc())));
    }
    from_IXd_8.fromPreReadAddr = function() {
        return bus.read(sum16Signed(IX, preReadIXYdOffset));
    };

    function from_IYd_8() {
        return bus.read(sum16Signed(IY, bus.read(pcInc())));
    }
    from_IYd_8.fromPreReadAddr = function() {
        return bus.read(sum16Signed(IY, preReadIXYdOffset));
    };

    function to_IXd_8(val) {
        bus.write(sum16Signed(IX, bus.read(pcInc())), val);
    }
    to_IXd_8.toPreReadAddr = function(val) {
        bus.write(sum16Signed(IX, preReadIXYdOffset), val);
    };

    function to_IYd_8(val) {
        bus.write(sum16Signed(IY, bus.read(pcInc())), val);
    }
    to_IYd_8.toPreReadAddr = function(val) {
        bus.write(sum16Signed(IY, preReadIXYdOffset), val);
    };

    function fromN() {
        return bus.read(pcInc());
    }
    function fromNN() {
        return bus.read(pcInc()) | (bus.read(pcInc()) << 8);
    }

    function from_NN_8() {
        return bus.read(bus.read(pcInc()) | (bus.read(pcInc()) << 8));
    }

    function to_NN_8(val) {
        var addr = bus.read(pcInc()) | (bus.read(pcInc()) << 8);
        bus.write(addr, val);
    }

    function from_NN_16() {
        var addr = bus.read(pcInc()) | (bus.read(pcInc()) << 8);
        var low = bus.read(addr);
        addr = addr +  1; if (addr > 0xffff) addr = 0;
        return (bus.read(addr) << 8) | low;
    }

    function to_NN_16(val) {
        var addr = bus.read(pcInc()) | (bus.read(pcInc()) << 8);
        bus.write(addr, val & 255);
        addr = addr + 1; if (addr > 0xffff) addr = 0;
        bus.write(addr, val >>> 8);
    }

    function sum16Signed(a, b) {
        return (a + (b > 127 ? (-256 + b) : b)) & 0xffff;
    }

    function push16(val) {
        bus.write(decSP(), val >>> 8);
        bus.write(decSP(), val & 255);
    }

    function pop16() {
        return bus.read(spInc()) | (bus.read(spInc()) << 8);
    }

    var parities = [    // 0b00000100 ready for P flag
        4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,
        4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,
        4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,
        4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,
        4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4,4,0,0,4,0,4,4,0,
        4,0,0,4,0,4,4,0,0,4,4,0,4,0,0,4
    ];


    // Instruction Cores  ---------------------------------------------------------------

    function NOP() {
    }

    function HALT() {
        //Util.log("HALT!");
        //self.breakpoint("HALT");
        --PC;    // Keep repeating HALT instruction until an INT or RESET
    }

    function newLD(to, from) {
        return function LD() {
            to(from());
        };
    }

    function LDAI() {
        A = I;
        // Flags
        F = (F & 0x01)                      // H = 0; N = 0; C = C
            | (A & 0xA8)                    // S = A is negative; f5, f3 copied from A
            | ((A === 0) << nZ)             // Z = A is 0
            | (IFF1 << nPV);                // PV = IFF2 (same as IFF1)
    }

    function LDAR() {
        A = R & 0x7f;
        // Flags
        F = (F & 0x01)                      // H = 0; N = 0; C = C
            | (A & 0xA8)                    // S = A is negative; f5, f3 copied from A
            | ((A === 0) << nZ)             // Z = A is 0
            | (IFF1 << nPV);                // PV = IFF2 (same as IFF1)
    }

    function LDIA() {
        I = A;
    }

    function LDRA() {
        R = A;                              // R can have bit 7 = 1 if set manually
    }

    function newPUSH(from) {
        return function PUSH() {
            push16(from());
        };
    }

    function newPOP(to) {
        return function POP() {
            to(pop16());
        };
    }

    function EXDEHL() {
        var temp = DE;
        DE = HL;
        HL = temp;
    }

    function EXX() {
        var temp = fromBC();
        toBC(BC2);
        BC2 = temp;
        temp = DE;
        DE = DE2;
        DE2 = temp;
        temp = HL;
        HL = HL2;
        HL2 = temp;
    }

    function EXAFAF2() {
        var temp = fromAF();
        toAF(AF2);
        AF2 = temp;
    }

    function LDI() {
        to_DE_8(from_HL_8());
        DE = (DE + 1) & 0xffff;
        HL = (HL + 1) & 0xffff;
        if (--C < 0) { C = 0xff; B = (B - 1) & 0xff; }     // BC--
        // Flags
        F = (F & 0xc1)                        // S = S; Z = Z; f5 = ?; H = 0; f3 = ?; N = 0; C = C;
            | ((B + C !== 0) << nPV);         // PV = BC != 0
        // Verify: Undocumented f5/f3 behavior for all LD block instructions, not implemented. Left 0
    }

    function LDIR() {
        LDI();
        if (F & bPV) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function LDD() {
        to_DE_8(from_HL_8());
        DE = (DE - 1) & 0xffff;
        HL = (HL - 1) & 0xffff;
        if (--C < 0) { C = 0xff; B = (B - 1) & 0xff; }     // BC--
        // Flags
        F = (F & 0xc1)                      // S = S; Z = Z; f5 = ?; H = 0; f3 = ?; N = 0; C = C;
            | ((B + C !== 0) << nPV);       // PV = BC != 0
    }

    function LDDR() {
        LDD();
        if (F & bPV) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function CPI() {
        var val = from_HL_8();
        if (--C < 0) { C = 0xff; B = (B - 1) & 0xff; }     // BC--
        HL = (HL + 1) & 0xffff;
        // Flags
        var res = A - val;
        var compare = A ^ val ^ res;
        F = (F & bC) | bN                   // N = 1; C = C
            | (res & 0xa8)                  // S = res is negative; f5, f3 copied from res
            | ((res === 0) << nZ)           // Z = res is 0
            | (compare & bH)                // H = borrow from bit 4
            | ((B + C !== 0) << nPV);       // PV = BC != 0
    }

    function CPIR() {
        CPI();
        if ((F & bPV) && !(F & bZ)) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function CPD() {
        var val = from_HL_8();
        if (--C < 0) { C = 0xff; B = (B - 1) & 0xff; }     // BC--
        HL = (HL - 1) & 0xffff;
        // Flags
        var res = A - val;
        var compare = A ^ val ^ res;
        F = (F & bC) | bN                   // N = 1; C = C
            | (res & 0xa8)                  // S = res is negative; f5, f3 copied from res
            | ((res === 0) << nZ)           // Z = res is 0
            | (compare & bH)                // H = borrow from bit 4
            | ((B + C !== 0) << nPV);       // PV = BC != 0
    }

    function CPDR() {
        CPD();
        if ((F & bPV) && !(F & bZ)) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function DAA() {
        var res = A;
        if (F & bN) {
            // Coming from a subtraction
            if ((F & bH) || ((A & 0x0f) > 9)) res -= 0x06;
            if ((F & bC) || (A > 0x99)) res -= 0x60;
        } else {
            // Coming from an addition
            if ((F & bH) || ((A & 0x0f) > 9)) res += 0x06;
            if ((F & bC) || (A > 0x99)) res += 0x60;
        }
        res &= 255;
        // Flags
        F = (F & 0x03)                            // N = N; C = C
            | (res & 0xa8)                        // S = res has bit 7 set; f5, f3 copied from res
            | ((res === 0) << nZ)                 // Z = res (as will be set to A) is 0
            | ((A ^ res) & bH)                    // H = bit 4 changed after adjust
            | parities[res]                       // P = parity of A
            | (A > 0x99);                         // C = carry from decimal range
        A = res;
    }

    function CPL() {
        A = ~A & 255;
        // Flags
        F = (F & 0xc5) | 0x12        // S = S; Z = Z; H = 1; PV = PV; N = 1; C = C
            | (A & 0x28);            // f5, f3 copied from A
    }

    function NEG() {
        var before = A;
        A = -A & 255;
        // Flags
        F = bN                                        // N = 1
            | (A & 0xa8)                              // S = A is negative; f5, f3 copied from A
            | ((A === 0) << nZ)                       // Z = A is 0
            | (((before & 0x0f) !== 0) << nH)         // H = borrow from bit 4
            | ((before === 0x80) << nPV)              // PV = A was 0x80 before
            | (before !== 0);                         // C = A was not 0 before
    }

    function CCF() {
        // Flags
        F = (F & 0xc4)                  // S = S; Z = Z; PV = PV; N = 0
            | (A & 0x28)                // f5, f3 copied from A
            | ((F & bC) << nH)          // H = previous C
            | (~F & bC);                // C = ~C
    }

    function SCF() {
        // Flags
        F = (F & 0xc4) | bC;            // S = S; Z = Z; H = 0; PV = PV; N = 0; C = 1;
    }

    function DI() {
        IFF1 = 0;
        ackINT = false;
    }

    function EI() {
        IFF1 = 1;
        prefix = 7;
        ackINT = false;
    }

    function RLCA() {
        A = ((A << 1) | (A >>> 7)) & 255;
        // Flags
        F = (F & 0xc4)                       // S = S; Z = Z; H = 0; PV = PV; N = 0
            | (A & 0x28)                     // f5, f3 copied from A
            | (A & bC);                      // C = bit 7 of A before
    }

    function RLA() {
        var oldA = A;
        A = ((A << 1) | (F & bC)) & 255;
        // Flags
        F = (F & 0xc4)                       // S = S; Z = Z; H = 0; PV = PV; N = 0
            | (A & 0x28)                     // f5, f3 copied from A
            | ((oldA >>> 7) & bC);           // C = bit 7 of A before
    }

    function RRCA() {
        A = ((A >>> 1) | (A << 7)) & 255;
        // Flags
        F = (F & 0xc4)                       // S = S; Z = Z; H = 0; PV = PV; N = 0
            | (A & 0x28)                     // f5, f3 copied from A
            | (A >>> 7);                     // C = bit 0 of A before
    }

    function RRA() {
        var oldA = A;
        A = ((A >>> 1) | ((F & bC) << 7));
        // Flags
        F = (F & 0xc4)                       // S = S; Z = Z; H = 0; PV = PV; N = 0
            | (A & 0x28)                     // f5, f3 copied from A
            | (oldA & bC);                   // C = bit 0 of A before
    }

    function RLD() {
        var val = from_HL_8();
        to_HL_8(((val << 4) | (A & 0x0f)) & 255);
        A = (A & 0xf0) | (val >>> 4);
        // Flags
        F = (F & bC)                               // H = 0; N = 0; C = C
            | (A & 0xa8)                           // S = A is negative; f5, f3 copied from A
            | ((A === 0) << nZ)                    // Z = A is 0
            | parities[A];                         // P = parity of A
    }

    function RRD() {
        var val = from_HL_8();
        to_HL_8(((A << 4) | (val >>> 4)) & 255);
        A = (A & 0xf0) | (val & 0x0f);
        // Flags
        F = (F & bC)                               // H = 0; N = 0; C = C
            | (A & 0xa8)                           // S = A is negative; f5, f3 copied from A
            | ((A === 0) << nZ)                    // Z = A is 0
            | parities[A];                         // P = parity of A
    }

    function JR() {
        var addr = fromN();
        PC = sum16Signed(PC, addr);
    }

    function DJNZ() {
        var relat = fromN();
        B = (B - 1) & 0xff;
        if (B !== 0) {
            PC = sum16Signed(PC, relat);
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function CALL() {
        var addr = fromNN();
        push16(PC);
        PC = addr;
    }

    function RET() {
        PC = pop16();
    }

    function RETI() {
        // No IFF2 supported
        RET();
    }

    function RETN() {
        // No IFF2 supported
        RET();
    }

    function INAn() {
        var port = fromN();
        A = bus.input((A << 8) | port);
    }

    function INI() {
        to_HL_8(bus.input(fromBC()));
        HL = (HL + 1) & 0xffff;
        B = (B - 1) & 0xff;
        // Flags
        F = (F & bC) | bN                          // S = ?; f5 = ?; H = ?; f3 = ?; PV = ?; N = 1; C = C
            | ((B === 0) << nZ);                   // Z = B is 0
        // Verify: Undocumented S/f5/H/f3/PV behavior for all IN/OUT block instructions, not implemented. Left 0
    }

    function INIR() {
        INI();
        if (B !== 0) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function IND() {
        to_HL_8(bus.input(fromBC()));
        HL = (HL - 1) & 0xffff;
        B = (B - 1) & 0xff;
        // Flags
        F = (F & bC) | bN                          // S = ?; f5 = ?; H = ?; f3 = ?; PV = ?; N = 1; C = C
            | ((B === 0) << nZ);                   // Z = B is 0
    }

    function INDR() {
        IND();
        if (B !== 0) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function OUTnA() {
        var val = fromN();
        bus.output((A << 8) | val, A);
    }

    function OUTI() {
        B = (B - 1) & 0xff;
        bus.output(fromBC(), from_HL_8());
        HL = (HL + 1) & 0xffff;
        // Flags
        F = (F & bC) | bN                          // S = ?; f5 = ?; H = ?; f3 = ?; PV = ?; N = 1; C = C
            | ((B === 0) << nZ);                   // Z = B is 0
    }

    function OTIR() {
        OUTI();
        if (B !== 0) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function OUTD() {
        B = (B - 1) & 0xff;
        bus.output(fromBC(), from_HL_8());
        HL = (HL - 1) & 0xffff;
        // Flags
        F = (F & bC) | bN                          // S = ?; f5 = ?; H = ?; f3 = ?; PV = ?; N = 1; C = C
            | ((B === 0) << nZ);                   // Z = B is 0
    }

    function OTDR() {
        OUTD();
        if (B !== 0) {
            // Will repeat this instruction
            PC -= 2;
            // Uses more cycles
            T += 5;
            instruction = instructionADT_CYCLES;
        }
    }

    function newLD_PreRead_IXYd_(to, from) {
        return function LD_PreRead_IXYd_() {
            // Special case. Pre-reads d before n to ensure correct order of reads
            preReadIXYd();
            to(from());
        };
    }

    function newEXr_SP_16(to, from) {
        return function EXr_SP_16() {
            var temp = from_SP_16();
            to_SP_16(from());
            to(temp);
        }
    }

    function newADD(from) {
        return function ADD() {
            var val = from();
            var res = A + val;
            var compare = A ^ val ^ res;
            A = res & 255;
            // Flags
            F =                                                 // N = 0
                (A & 0xa8)                                      // S = A is negative; f5, f3 copied from A
                | ((A === 0) << nZ)                             // Z = A is 0
                | (compare & bH)                                // H = carry from bit 3
                | (((compare >>> 6) ^ (compare >>> 5)) & bPV)   // V = overflow
                | ((res >>> 8) & bC);                           // C = carry from bit 7
        };
    }

    function newADC(from) {
        return function ADC() {
            var val = from();
            var res = A + val + (F & bC);
            var compare = A ^ val ^ res;
            A = res & 255;
            // Flags
            F =                                                 // N = 0
                (A & 0xa8)                                      // S = A is negative; f5, f3 copied from A
                | ((A === 0) << nZ)                             // Z = A is 0
                | (compare & bH)                                // H = carry from bit 3
                | (((compare >>> 6) ^ (compare >>> 5)) & bPV)   // V = overflow
                | ((res >>> 8) & bC);                           // C = carry from bit 7
        };
    }

    function newSUB(from) {
        return function SUB() {
            var val = from();
            var res = A - val;
            var compare = A ^ val ^ res;
            A = res & 255;
            // Flags
            F = (bN)                                             // N = 1
                | (A & 0xa8)                                     // S = A is negative; f5, f3 copied from A
                | ((A === 0) << nZ)                              // Z = A is 0
                | (compare & bH)                                 // H = borrow from bit 4
                | (((compare >>> 6) ^ (compare >>> 5)) & bPV)    // V = overflow
                | ((res >>> 8) & bC);                            // C = borrow
        };
    }

    function newSBC(from) {
        return function SBC() {
            var val = from();
            var res = A - val - (F & bC);
            var compare = A ^ val ^ res;
            A = res & 255;
            // Flags
            F = (bN)                                             // N = 1
                | (A & 0xa8)                                     // S = A is negative; f5, f3 copied from A
                | ((A === 0) << nZ)                              // Z = A is 0
                | (compare & bH)                                 // H = borrow from bit 4
                | (((compare >>> 6) ^ (compare >>> 5)) & bPV)    // V = overflow
                | ((res >>> 8) & bC);                            // C = borrow
        };
    }

    function newAND(from) {
        return function AND() {
            A &= from();
            // Flags
            F = bH                          // H = 1; N = 0; C = 0;
                | (A & 0xa8)                // S = A is negative; f5, f3 copied from A
                | ((A === 0) << nZ)         // Z = A is 0
                | parities[A];              // P = parity of A
        };
    }

    function newOR(from) {
        return function OR() {
            A |= from();
            // Flags
            F =                             // H = 0; N = 0; C = 0;
                (A & 0xa8)                  // S = A is negative; f5, f3 copied from A
                | ((A === 0) << nZ)         // Z = A is 0
                | parities[A];              // P = parity of A
        };
    }

    function newXOR(from) {
        return function XOR() {
            A ^= from();
            // Flags
            F =                             // H = 0; N = 0; C = 0;
                (A & 0xa8)                  // S = A is negative; f5, f3 copied from A
                | ((A === 0) << nZ)         // Z = A is 0
                | parities[A];              // P = parity of A
        };
    }

    function newCP(from) {
        return function CP() {
            var val = from();
            var res = A - val;
            // Flags
            var compare = A ^ val ^ res;
            F = (bN)                                             // N = 1
                | (res & bS)                                     // S = res is negative
                | (val & 0x28)                                   // f5, f3 copied from val (operand)
                | ((res === 0) << nZ)                            // Z = res (as would be set to A) is 0
                | (compare & bH)                                 // H = borrow from bit 4
                | (((compare >>> 6) ^ (compare >>> 5)) & bPV)    // V = overflow
                | ((res >>> 8) & bC);                            // C = borrow
        };
    }

    function newINC(from, to) {
        return function INC() {
            var res = (from() + 1) & 255;
            to(res);
            // Flags
            F = (F & bC)                              // N = 0; C = C
                | (res & 0xa8)                        // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                 // Z = res is 0
                | (((res & 0x0f) === 0) << nH)        // H = carry from bit 3
                | ((res === 0x80) << nPV);            // V = overflow
        };
    }

    function newINC_PreRead_IXYd_(from, to) {
        return function INC_PreRead_IXYd_() {
            preReadIXYd();
            var res = (from() + 1) & 255;
            to(res);
            // Flags
            F = (F & bC)                              // N = 0; C = C
                | (res & 0xa8)                        // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                 // Z = res is 0
                | (((res & 0x0f) === 0) << nH)        // H = carry from bit 3
                | ((res === 0x80) << nPV);            // V = overflow
        };
    }

    function newDEC(from, to) {
        return function DEC() {
            var res = (from() - 1) & 255;
            to(res);
            // Flags
            F = (F & bC) | bN                             // N = 1; C = C
                | (res & 0xa8)                            // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                     // Z = res is 0
                | (((res & 0x0f) === 0x0f) << nH)         // H = borrow from bit 4
                | ((res === 0x7f) << nPV);                // V = overflow
        };
    }

    function newDEC_PreRead_IXYd_(from, to) {
        return function DEC_PreRead_IXYd_() {
            preReadIXYd();
            var res = (from() - 1) & 255;
            to(res);
            // Flags
            F = (F & bC) | bN                             // N = 1; C = C
                | (res & 0xa8)                            // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                     // Z = res is 0
                | (((res & 0x0f) === 0x0f) << nH)         // H = borrow from bit 4
                | ((res === 0x7f) << nPV);                // V = overflow
        };
    }

    function newIM(mode) {
        return function setIM() {
            IM = mode;
            //if (mode !== 1) {
            //    //self.trace = true;
            //    self.breakpoint("Entering IM mode " + mode + "!!!");
            //}
        }
    }

    function newADD16(to, a, b) {
        return function ADD16() {
            var valA = a();
            var valB = b();
            var res = valA + valB;
            to(res & 0xffff);
            // Flags
            var compare = (valA ^ valB ^ res) >>> 8;
            F = (F & 0xc4)                                    // S = S; Z = Z; PV = PV; N = 0
                | ((res >>> 8) & 0x28)                        // f5, f3 copied from high byte of res
                | (compare & bH)                              // H = carry from bit 11
                | ((res >>> 16) & bC);                        // C = carry from bit 15
        };
    }

    function newADC16(to, a, b) {
        return function ADC16() {
            var valA = a();
            var valB = b();
            var res = valA + valB + (F & bC);
            to(res & 0xffff);
            // Flags
            var compare = (valA ^ valB ^ res) >>> 8;
            F =                                                 // N = 0
                ((res >>> 8) & 0xa8)                            // S = res is negative; f5, f3 copied from high byte of res
                | (((res & 0xffff) === 0) << nZ)                // Z = res (as set to destination) is 0
                | (compare & bH)                                // H = carry from bit 11
                | (((compare >>> 6) ^ (compare >>> 5)) & bPV)   // V = overflow
                | ((res >>> 16) & bC);                          // C = carry from bit 15
        };
    }

    function newSBC16(to, a, b) {
        return function SBC16() {
            var valA = a();
            var valB = b();
            var res = valA - valB - (F & bC);
            to(res & 0xffff);
            // Flags
            var compare = (valA ^ valB ^ res) >>> 8;
            F = bN                                              // N = 1
                | ((res >>> 8) & 0xa8)                          // S = res is negative; f5, f3 copied from high byte of res
                | (((res & 0xffff) === 0) << nZ)                // Z = res (as set to destination) is 0
                | (compare & bH)                                // H = borrow from bit 12
                | (((compare >>> 6) ^ (compare >>> 5)) & bPV)   // V = overflow
                | ((res >>> 16) & bC);                          // C = borrow
        };
    }

    function newINC16(to, from) {
        return function INC16() {
            to((from() + 1) & 0xffff);
        };
    }

    function newDEC16(to, from) {
        return function DEC16() {
            to((from() - 1) & 0xffff);
        };
    }

    function newRLC(to, from, toExt) {
        return function RLC() {
            var val = from();
            var res = ((val << 1) | (val >>> 7)) & 255;
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | (res & bC);                          // C = bit 7 of val before
        }
    }

    function newRL(to, from, toExt) {
        return function RL() {
            var val = from();
            var res = ((val << 1) | (F & bC)) & 255;
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | ((val >>> 7) & bC);                  // C = bit 7 of val before
        }
    }

    function newRRC(to, from, toExt) {
        return function RRC() {
            var val = from();
            var res = ((val >>> 1) | (val << 7)) & 255;
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | (val & bC);                          // C = bit 0 of val before
        }
    }

    function newRR(to, from, toExt) {
        return function RR() {
            var val = from();
            var res = ((val >>> 1) | ((F & bC) << 7)) & 255;
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | (val & bC);                          // C = bit 0 of val before
        }
    }

    function newSLA(to, from, toExt) {
        return function SLA() {
            var val = from();
            var res = (val << 1) & 255;
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | ((val >>> 7) & bC);                  // C = bit 7 of val before
        }
    }

    function newSRA(to, from, toExt) {
        return function SRA() {
            var val = from();
            var res = (val >>> 1) | (val & 0x80);
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | (val & bC);                          // C = bit 0 of val before
        }
    }

    function newSLL(to, from, toExt) {
        return function SLL() {
            var val = from();
            var res = ((val << 1) | 1) & 255;
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | ((val >>> 7) & bC);                  // C = bit 7 of val before
        }
    }

    function newSRL(to, from, toExt) {
        return function SRL() {
            var val = from();
            var res = val >>> 1;
            to(res);
            if (toExt) toExt(res);
            // Flags
            F =                                        // H = 0; N = 0
                (res & 0xa8)                           // S = res is negative; f5, f3 copied from res
                | ((res === 0) << nZ)                  // Z = res is 0
                | parities[res]                        // P = parity of res
                | (val & bC);                          // C = bit 0 of val before
        }
    }

    function newBIT(to, from, bit, setF53) {
        return function BIT() {
            // Flags
            var res = from() & (1 << bit);
            if (res) {
                F = (F & bC) | bH                      // Z = 0; H = 1; P = 0; N = 0; C = C
                    | (res & bS);                      // S copied from res
                if (setF53) F = F | (res & 0x28);      // f5, f3 copied from res or left 0 if not to be set
            } else {
                F = (F & bC) | 0x54;                   // S = 0, Z = 1; f5 = 0; H = 1; f3 = 0; P = 1; N = 0; C = C
            }
            // Verify: Undocumented f5/f3 behavior when (HL/IX/IY) used, not implemented. Left 0
        }
    }

    function newSET(to, from, bit, toExt) {
        return function SET() {
            var res = from() | (1 << bit);
            to(res);
            if (toExt) toExt(res);
        }
    }

    function newRES(to, from, bit, toExt) {
        return function RES() {
            var res = from() & ~(1 << bit);
            to(res);
            if (toExt) toExt(res);
        }
    }

    function newJP(from) {
        return function JP() {
            PC = from();
        }
    }

    function newJPcc(flag, val) {
        return function JPcc() {
            var addr = fromNN();
            if ((F & flag) === val)
                PC = addr;
        }
    }

    function newJRcc(flag, val) {
        return function JRcc() {
            var relat = fromN();
            if ((F & flag) === val) {
                PC = sum16Signed(PC, relat);
                T += 5;
                instruction = instructionADT_CYCLES;
            }
        }
    }

    function newCALLcc(flag, val) {
        return function CALLcc() {
            var addr = fromNN();
            if ((F & flag) === val) {
                push16(PC);
                PC = addr;
                T += 7;
                instruction = instructionADT_CYCLES;
            }
        }
    }

    function newRETcc(flag, val) {
        return function RETcc() {
            if ((F & flag) === val) {
                RET();
                T += 6;
                instruction = instructionADT_CYCLES;
            }
        }
    }

    function newRST(addr) {
        return function RST() {
            push16(PC);
            PC = addr;
        }
    }

    function newINrC(to) {
        return function INrC() {
            var val = bus.input(fromBC());
            to(val);
            // Flags
            F = (F & bC)                               // H = 0; N = 0; C = C
                | (val & 0xa8)                         // S = val is negative; f5, f3 copied from res
                | ((val === 0) << nZ)                  // Z = res is 0
                | parities[val];                       // P = parity of res
        }
    }

    function newOUTCr(from) {
        return function OUTCr() {
            bus.output(fromBC(), from());
        }
    }


    // Undocumented instructions

    function uNOP() {
        // DO nothing
    }

    function uIN_C() {                       // Like the normal IN r, (C) but does not store the data
        var val = bus.input(fromBC());
        // Flags
        F = (F & bC)                               // H = 0; N = 0; C = C
            | (val & 0xa8)                         // S = val is negative; f5, f3 copied from res
            | ((val === 0) << nZ)                  // Z = res is 0
            | parities[val];                       // P = parity of res
    }

    function uOUTC0() {                      // Like the normal OUT (C), r but always output 0
        bus.output(fromBC(), 0);
    }

    // Pseudo instructions

    function pINT() {
        IFF1 = 0;
        ackINT = false;
        if (instruction === instructionHALT) pcInc();     // To "escape" from the HALT, and continue in the next instruction after RET
        push16(PC);
        instruction = instructionADT_CYCLES;
        if (IM === 1) {
            // Same as a RST 38h
            PC = 0x0038;
            T = 13;
        } else if (IM === 2) {
            // Read Jump Table address low from Bus (always FFh in this implementation)
            // Read Jump Table address high from I
            var jumpTableEntry = (I << 8) | 0xff;
            // Call address read from Jump Table
            PC = bus.read(jumpTableEntry) | (bus.read(jumpTableEntry + 1) << 8);
            T = 19;
        } else {
            // IM 0. Read instruction to execute from Bus (always FFh in this implementation)
            // Since its always FF, its the same as a RST 38h
            PC = 0x0038;
            T = 13;
        }
    }

    function pSET_CB() {
        prefix = 2;
        ackINT = false;
    }

    function pSET_ED() {
        prefix = 1;
        ackINT = false;
    }

    function pSET_DD() {
        prefix = 3;
        ackINT = false;
    }

    function pSET_FD() {
        prefix = 4;
        ackINT = false;
    }

    function pSET_DDCB() {
        prefix = 5;
        ackINT = false;
        preReadIXYd();     // Special case. Pre-reads d before the real opcode
        R = R - 1;         // Special case. R should not be incremented next opcode fetch so adjust here
    }

    function pSET_FDCB() {
        prefix = 6;
        ackINT = false;
        preReadIXYd();     // Special case. Pre-reads d before the real opcode
        R = R - 1;         // Special case. R should not be incremented next opcode fetch so adjust here
    }

    function pADT_CYCLES() {
        // Do nothing
    }


    // Extension Point pseudo instructions

    function newpEXT(num) {
        return function pEXT() {
            // Check for extraIterations of last extension instruction. No new instruction until iterations end
            if (extensionCurrentlyRunning !== null) {
                if (extensionExtraIterations > 0) {         // Need more iterations?
                    extensionExtraIterations--;
                    PC -= 2;
                } else {                                    // End of iterations, perform finish operation
                    var finish = bus.cpuExtensionFinish(extractCPUState(num));
                    reinsertCPUState(finish);
                    extensionCurrentlyRunning = null;
                }
                return;
            }
            // New extension instruction may happen now
            extensionCurrentlyRunning = num; extensionExtraIterations = 0;
            var init = bus.cpuExtensionBegin(extractCPUState(num));
            reinsertCPUState(init);
            // Recur to finish the process
            pEXT();
        };

        function extractCPUState(extNum) {
            return {
                // extPC points to Extended Instruction being executed
                extNum: extNum, extPC: PC - 2, PC: PC, SP: SP, A: A, F: F, B: B, C: C, DE: DE, HL: HL, IX: IX, IY: IY,
                AF2: AF2, BC2: BC2, DE2: DE2, HL2: HL2, I: I, R: R, IM: IM
                // No IFF1
            }
        }

        function reinsertCPUState(state) {
            if (!state) return;
            if (state.PC !== undefined)    PC = state.PC;
            if (state.SP !== undefined)    SP = state.SP;
            if (state.A !== undefined)     A = state.A;
            if (state.F !== undefined)     F = state.F;
            if (state.B !== undefined)     B = state.B;
            if (state.C !== undefined)     C = state.C;
            if (state.DE !== undefined)    DE = state.DE;
            if (state.HL !== undefined)    HL = state.HL;
            if (state.I !== undefined)     I = state.I;
            if (state.R !== undefined)     R = state.R;
            if (state.IX !== undefined)    IX = state.IX;
            if (state.IY !== undefined)    IY = state.IY;
            if (state.AF2 !== undefined)   AF2 = state.AF2;
            if (state.BC2 !== undefined)   BC2 = state.BC2;
            if (state.DE2 !== undefined)   DE2 = state.DE2;
            if (state.HL2 !== undefined)   HL2 = state.HL2;
            // No IFF1
            if (state.IM !== undefined)    IM = state.IM;
            if (state.extraIterations > 0) extensionExtraIterations = state.extraIterations;
        }
    }


    // Testing pseudo instructions

    //function pSTOP() {
    //    self.breakpoint("STOP");
    //    self.stop = true;
    //}

    //function pCPM_BDOS() {
    //    var cha;
    //    if (C === 2) {
    //        // Prints char in E
    //        cha = String.fromCharCode(DE & 0xff);
    //        self.testPrintChar(cha);
    //    } else if (C === 9) {
    //        // Prints string at DE, terminated with "$". Auto returns (RET)
    //        do {
    //            cha = String.fromCharCode(bus.read(DE));
    //            if (cha === "$") break;
    //            DE++; if (DE > 0xffff) DE = 0;
    //            self.testPrintChar(cha);
    //        } while (true);
    //    }
    //    RET();
    //}


    // Instructions Definitions  ---------------------------------------------------

    function defineAllInstructions() {

        // LD 8-bit Group  -------------------------------------------------------------

        var operR = {
            A:   { bits: 7, to: toA, from: fromA, desc: "A" },
            B:   { bits: 0, to: toB, from: fromB, desc: "B" },
            C:   { bits: 1, to: toC, from: fromC, desc: "C" },
            D:   { bits: 2, to: toD, from: fromD, desc: "D" },
            E:   { bits: 3, to: toE, from: fromE, desc: "E" },
            H:   { bits: 4, to: toH, from: fromH, desc: "H" },
            L:   { bits: 5, to: toL, from: fromL, desc: "L" }
        };

        var operRp = {
            A:   { bits: 7, to: toA,   from: fromA,   desc: "A" },
            B:   { bits: 0, to: toB,   from: fromB,   desc: "B" },
            C:   { bits: 1, to: toC,   from: fromC,   desc: "C" },
            D:   { bits: 2, to: toD,   from: fromD,   desc: "D" },
            E:   { bits: 3, to: toE,   from: fromE,   desc: "E" },
            H:   { bits: 4, to: toH,   from: fromH,   desc: "H",   nopref: true },
            L:   { bits: 5, to: toL,   from: fromL,   desc: "L",   nopref: true },
            IXh: { bits: 4, to: toIXh, from: fromIXh, desc: "IXh", pref: 0xdd },
            IXl: { bits: 5, to: toIXl, from: fromIXl, desc: "IXl", pref: 0xdd },
            IYh: { bits: 4, to: toIYh, from: fromIYh, desc: "IYh", pref: 0xfd },
            IYl: { bits: 5, to: toIYl, from: fromIYl, desc: "IYl", pref: 0xfd }
        };

        var oper_HLp_ = {
            _HL_ :  { to: to_HL_8,  from: from_HL_8,  desc: "(HL)" },
            _IXd_ : { to: to_IXd_8, from: from_IXd_8, desc: "(IX+d)", pref: 0xdd },
            _IYd_ : { to: to_IYd_8, from: from_IYd_8, desc: "(IY+d)", pref: 0xfd }
        };

        // 1byte *+1, 1M *+1, 4T *+4: - LD rp, rp'          * Includes DD and FD prefixed variations for r
        var opcodeBase = 0x40;
        for (var to in operRp) {
            var operTo = operRp[to];
            for (var from in operRp) {
                var operFrom = operRp[from];
                // can't mix prefixes in the wrong combinations
                if ((operTo.pref && (operFrom.nopref || (operFrom.pref && (operFrom.pref != operTo.pref))))
                    || (operFrom.pref && (operTo.nopref || (operTo.pref && (operTo.pref != operFrom.pref)))))
                    continue;
                var opcode = opcodeBase | (operTo.bits << 3) | operFrom.bits;
                var instr = newLD(
                    operTo.to,
                    operFrom.from
                );
                var prefix = operTo.pref | operFrom.pref;
                defineInstruction(prefix, null, opcode, 4, instr, "LD " + operTo.desc + ", " + operFrom.desc, prefix);
            }
        }

        // 2 bytes *+1, 2M *+1, 7T *+4: - LD rp, n          * Includes DD and FD prefixed variations for r
        opcodeBase = 0x06;
        for (to in operRp) {
            operTo = operRp[to];
            opcode = opcodeBase | (operTo.bits << 3);
            instr = newLD(
                operTo.to,
                fromN
            );
            prefix = operTo.pref;
            defineInstruction(prefix, null, opcode, 7, instr, "LD " + operTo.desc + ", n", prefix);
        }

        // 1 byte *+2, 2M *+3, 7T *+12: - LD r, (HLp)       * Includes DD and FD prefixed variations for _HL_
        opcodeBase = 0x46;
        for (to in operR) {
            operTo = operR[to];
            for (from in oper_HLp_) {
                operFrom = oper_HLp_[from];
                opcode = opcodeBase | (operTo.bits << 3);
                instr = newLD(
                    operTo.to,
                    operFrom.from
                );
                prefix = operFrom.pref;
                defineInstruction(prefix, null, opcode, 7 + (prefix ? 8 : 0), instr, "LD " + operTo.desc + ", " + operFrom.desc, false);
            }
        }

        // 1 byte *+2, 2M *+3, 7T *+12: - LD (HLp), r       * Includes DD and FD prefixed variations for _HL_
        opcodeBase = 0x70;
        for (to in oper_HLp_) {
            operTo = oper_HLp_[to];
            for (from in operR) {
                operFrom = operR[from];
                opcode = opcodeBase | operFrom.bits;
                instr = newLD(
                    operTo.to,
                    operFrom.from
                );
                prefix = operTo.pref;
                defineInstruction(prefix, null, opcode, 7 + (prefix ? 8 : 0), instr, "LD " + operTo.desc + ", " + operFrom.desc, false);
            }
        }

        // 2 byte *+2, 3M *+2, 10T *+9: - LD (HLp), n        * Includes DD and FD prefixed variations for _HL_
        opcodeBase = 0x36;
        for (to in oper_HLp_) {
            operTo = oper_HLp_[to];
            opcode = opcodeBase;
            // +++ Must use preRead_d in case of prefixed variations
            prefix = operTo.pref;
            if (prefix) {
                instr = newLD_PreRead_IXYd_(
                    operTo.to.toPreReadAddr,
                    fromN
                );
            } else {
                instr = newLD(
                    operTo.to,
                    fromN
                );
            }
            defineInstruction(prefix, null, opcode, 10 + (prefix ? 5 : 0), instr, "LD " + operTo.desc + ", n", false);
        }

        // 1 byte, 2M, 7T: - LD A, (BC)
        opcode = 0x0a;
        instr = newLD(
            toA,
            from_BC_8
        );
        defineInstruction(null, null, opcode, 7, instr, "LD A, (BC)", false);

        // 1 byte, 2M, 7T: - LD A, (DE)
        opcode = 0x1a;
        instr = newLD(
            toA,
            from_DE_8
        );
        defineInstruction(null, null, opcode, 7, instr, "LD A, (DE)", false);

        // 3 bytes, 4M, 13T: - LD A, (nn)
        opcode = 0x3a;
        instr = newLD(
            toA,
            from_NN_8
        );
        defineInstruction(null, null, opcode, 13, instr, "LD A, (nn)", false);

        // 1 byte, 2M, 7T: - LD (BC), A
        opcode = 0x02;
        instr = newLD(
            to_BC_8,
            fromA
        );
        defineInstruction(null, null, opcode, 7, instr, "LD (BC), A", false);

        // 1 byte, 2M, 7T: - LD (DE), A
        opcode = 0x12;
        instr = newLD(
            to_DE_8,
            fromA
        );
        defineInstruction(null, null, opcode, 7, instr, "LD (DE), A", false);

        // 3 bytes, 4M, 13T: - LD A, (nn)
        opcode = 0x32;
        instr = newLD(
            to_NN_8,
            fromA
        );
        defineInstruction(null, null, opcode, 13, instr, "LD (nn), A", false);

        // 2 bytes, 2M, 9T: - LD A, I
        opcode = 0x57;
        instr = LDAI;
        defineInstruction(null, 0xed, opcode, 5, instr, "LD A, I", false);

        // 2 bytes, 2M, 9T: - LD A, R
        opcode = 0x5f;
        instr = LDAR;
        defineInstruction(null, 0xed, opcode, 5, instr, "LD A, R", false);

        // 2 bytes, 2M, 9T: - LD I, A
        opcode = 0x47;
        instr = LDIA;
        defineInstruction(null, 0xed, opcode, 5, instr, "LD I, A", false);

        // 2 bytes, 2M, 9T: - LD R, A
        opcode = 0x4f;
        instr = LDRA;
        defineInstruction(null, 0xed, opcode, 5, instr, "LD R, A", false);


        // LD 16-bit Group  -----------------------------------------------------

        var operDD = {
            BC: { bits: 0, to: toBC, from: fromBC, desc: "BC" },
            DE: { bits: 1, to: toDE, from: fromDE, desc: "DE" },
            HL: { bits: 2, to: toHL, from: fromHL, desc: "HL" },
            SP: { bits: 3, to: toSP, from: fromSP, desc: "SP" }
        };

        var operDDp = {
            BC: { bits: 0, to: toBC, from: fromBC, desc: "BC" },
            DE: { bits: 1, to: toDE, from: fromDE, desc: "DE" },
            HL: { bits: 2, to: toHL, from: fromHL, desc: "HL", nopref: true },
            SP: { bits: 3, to: toSP, from: fromSP, desc: "SP" },
            IX: { bits: 2, to: toIX, from: fromIX, desc: "IX", pref: 0xdd },
            IY: { bits: 2, to: toIY, from: fromIY, desc: "IY", pref: 0xfd }
        };

        var operQQp = {
            BC: { bits: 0, to: toBC, from: fromBC, desc: "BC" },
            DE: { bits: 1, to: toDE, from: fromDE, desc: "DE" },
            HL: { bits: 2, to: toHL, from: fromHL, desc: "HL" },
            AF: { bits: 3, to: toAF, from: fromAF, desc: "AF" },
            IX: { bits: 2, to: toIX, from: fromIX, desc: "IX", pref: 0xdd },
            IY: { bits: 2, to: toIY, from: fromIY, desc: "IY", pref: 0xfd }
        };

        var operHLp = {
            HL :  { to: toHL, from: fromHL, desc: "HL", nopref: true },
            IXd : { to: toIX, from: fromIX, desc: "IX", pref: 0xdd },
            IYd : { to: toIY, from: fromIY, desc: "IY", pref: 0xfd }
        };

        // 3 bytes *+1, 2M *+4, 10T *+4: - LD ddp, nn           * Includes DD and FD prefixed variations for dd
        opcodeBase = 0x01;
        for (to in operDDp) {
            operTo = operDDp[to];
            opcode = opcodeBase | (operTo.bits << 4);
            instr = newLD(
                operTo.to,
                fromNN
            );
            prefix = operTo.pref;
            defineInstruction(prefix, null, opcode, 10, instr, "LD " + operTo.desc + ", nn", false);
        }

        // 3 bytes *+1, 5M *+1, 16T *+4: - LD HLp, (nn)         * Includes DD and FD prefixed variations for HL
        opcode = 0x2a;
        for (to in operHLp) {
            operTo = operHLp[to];
            instr = newLD(
                operTo.to,
                from_NN_16
            );
            prefix = operTo.pref;
            defineInstruction(prefix, null, opcode, 16, instr, "LD " + operTo.desc + ", (nn)", false);
        }

        // 4 bytes, 6M, 20T: - LD dd, (nn)          Extended with ED prefix so no DD and FD prefix variations
        opcodeBase = 0x4b;
        for (to in operDD) {
            operTo = operDD[to];
            opcode = opcodeBase | (operTo.bits << 4);
            instr = newLD(
                operTo.to,
                from_NN_16
            );
            defineInstruction(null, 0xed, opcode, 16, instr, "LD " + operTo.desc + ", (nn)", false);
        }

        // 3 bytes *+1, 5M *+1, 16T *+4: - LD (nn), HLp         * Includes DD and FD prefixed variations for HL
        opcode = 0x22;
        for (from in operHLp) {
            operFrom = operHLp[from];
            instr = newLD(
                to_NN_16,
                operFrom.from
            );
            prefix = operFrom.pref;
            defineInstruction(prefix, null, opcode, 16, instr, "LD (nn), " + operFrom.desc, false);
        }

        // 4 bytes, 6M, 20T: - LD (nn), dd              Extended with ED prefix so no DD and FD prefix variations
        opcodeBase = 0x43;
        for (from in operDD) {
            operFrom = operDD[from];
            opcode = opcodeBase | (operFrom.bits << 4);
            instr = newLD(
                to_NN_16,
                operFrom.from
            );
            defineInstruction(null, 0xed, opcode, 16, instr, "LD (nn), " + operFrom.desc, false);
        }

        // 1 bytes *+1, 1M *+1, 6T *+4: - LD SP, HLp        * Includes DD and FD prefixed variations for HL
        opcode = 0xf9;
        for (from in operHLp) {
            operFrom = operHLp[from];
            instr = newLD(
                toSP,
                operFrom.from
            );
            prefix = operFrom.pref;
            defineInstruction(prefix, null, opcode, 6, instr, "LD SP, " + operFrom.desc, false);
        }

        // 1 byte *+1, 3M *+1, 11T *+4: - PUSH qqp          * Includes DD and FD prefixed variations for qq
        opcodeBase = 0xc5;
        for (from in operQQp) {
            operFrom = operQQp[from];
            opcode = opcodeBase | (operFrom.bits << 4);
            instr = newPUSH(
                operFrom.from
            );
            prefix = operFrom.pref;
            defineInstruction(prefix, null, opcode, 11, instr, "PUSH " + operFrom.desc, false);
        }

        // 1 byte *+1, 3M *+1, 10T *+4: - POP qqp           * Includes DD and FD prefixed variations for qq
        opcodeBase = 0xc1;
        for (to in operQQp) {
            operTo = operQQp[to];
            opcode = opcodeBase | (operTo.bits << 4);
            instr = newPOP(
                operTo.to
            );
            prefix = operTo.pref;
            defineInstruction(prefix, null, opcode, 10, instr, "POP " + operTo.desc, false);
        }

    // Exchange, Block Transfer, and Search Group  -------------------------------------

        // 1 byte, 1M, 4T: - EX DE, HL
        opcode = 0xeb;
        instr = EXDEHL;
        defineInstruction(null, null, opcode, 4, instr, "EX DE, HL", false);

        // 1 byte, 1M, 4T: - EX AF, AF'
        opcode = 0x08;
        instr = EXAFAF2;
        defineInstruction(null, null, opcode, 4, instr, "EX AF, AF'", false);

        // 1 byte, 1M, 4T: - EXX
        opcode = 0xd9;
        instr = EXX;
        defineInstruction(null, null, opcode, 4, instr, "EXX", false);

        // 1 byte *+1, 5M *+1, 19T *+4: - EX (SP), HLp
        opcode = 0xe3;
        for (var op in operHLp) {
            var oper = operHLp[op];
            instr = newEXr_SP_16(oper.to, oper.from);
            prefix = oper.pref;
            defineInstruction(prefix, null, opcode, 19, instr, "EX (SP), " + oper.desc, false);
        }

        // 2 bytes, 4M, 16T: - LDI
        opcode = 0xa0;
        instr = LDI;
        defineInstruction(null, 0xed, opcode, 12, instr, "LDI", false);

        // 2 bytes, 4M *+1, 16T *+5: - LDIR         *  in case a repeat occurs
        opcode = 0xb0;
        instr = LDIR;
        defineInstruction(null, 0xed, opcode, 12, instr, "LDIR", false);

        // 2 bytes, 4M, 16T: - LDD
        opcode = 0xa8;
        instr = LDD;
        defineInstruction(null, 0xed, opcode, 12, instr, "LDD", false);

        // 2 bytes, 4M *+1, 16T *+5: - LDDR         *  in case a repeat occurs
        opcode = 0xb8;
        instr = LDDR;
        defineInstruction(null, 0xed, opcode, 12, instr, "LDDR", false);

        // 2 bytes, 4M, 16T: - CPI
        opcode = 0xa1;
        instr = CPI;
        defineInstruction(null, 0xed, opcode, 12, instr, "CPI", false);

        // 2 bytes, 4M *+1, 16T *+5: - CPIR         *  in case a repeat occurs
        opcode = 0xb1;
        instr = CPIR;
        defineInstruction(null, 0xed, opcode, 12, instr, "CPIR", false);

        // 2 bytes, 4M, 16T: - CPD
        opcode = 0xa9;
        instr = CPD;
        defineInstruction(null, 0xed, opcode, 12, instr, "CPD", false);

        // 2 bytes, 4M *+1, 16T *+5: - CPDR         *  in case a repeat occurs
        opcode = 0xb9;
        instr = CPDR;
        defineInstruction(null, 0xed, opcode, 12, instr, "CPDR", false);

        // 8-bit Arithmetic Group  ----------------------------------------------------

        var arith8Instructions = {
            ADD: { desc: "ADD A, ", instr: newADD, variations: {
                rp:    {opcode: 0x80},
                n:     {opcode: 0xc6},
                _HLp_: {opcode: 0x86, T: 7}
            }},
            ADC: { desc: "ADC A, ", instr: newADC, variations: {
                rp:    {opcode: 0x88},
                n:     {opcode: 0xce},
                _HLp_: {opcode: 0x8e, T: 7}
            }},
            SUB: { desc: "SUB ", instr: newSUB, variations: {
                rp:    {opcode: 0x90},
                n:     {opcode: 0xd6},
                _HLp_: {opcode: 0x96, T: 7}
            }},
            SBC: { desc: "SBC A, ", instr: newSBC, variations: {
                rp:    {opcode: 0x98},
                n:     {opcode: 0xde},
                _HLp_: {opcode: 0x9e, T: 7}
            }},
            AND: { desc: "AND ", instr: newAND, variations: {
                rp:    {opcode: 0xa0},
                n:     {opcode: 0xe6},
                _HLp_: {opcode: 0xa6, T: 7}
            }},
            OR: { desc: "OR ", instr: newOR, variations: {
                rp:    {opcode: 0xb0},
                n:     {opcode: 0xf6},
                _HLp_: {opcode: 0xb6, T: 7}
            }},
            XOR: { desc: "XOR ", instr: newXOR, variations: {
                rp:    {opcode: 0xa8},
                n:     {opcode: 0xee},
                _HLp_: {opcode: 0xae, T: 7}
            }},
            CP: { desc: "CP ", instr: newCP, variations: {
                rp:    {opcode: 0xb8},
                n:     {opcode: 0xfe},
                _HLp_: {opcode: 0xbe, T: 7}
            }},
            INC: { desc: "INC ", instr: newINC, selfModifyInstr: newINC_PreRead_IXYd_, variations: {
                rp:    {opcode: 0x04, rShift: 3},     // r bits right shift by 3
                // no n variation
                _HLp_: {opcode: 0x34, T: 11}
            }},
            DEC: { desc: "DEC ", instr: newDEC, selfModifyInstr: newDEC_PreRead_IXYd_, variations: {
                rp:    {opcode: 0x05, rShift: 3},     // r bits right shift by 3
                // no n variation
                _HLp_: {opcode: 0x35, T: 11}
            }}
        };

        for (var i in arith8Instructions) {
            var ins = arith8Instructions[i];
            // Define INS rp   * Includes DD and FD prefixed variations for r
            var vari = ins.variations.rp;
            opcodeBase = vari.opcode;
            for (op in operRp) {
                oper = operRp[op];
                opcode = opcodeBase | (oper.bits << vari.rShift);
                instr = ins.instr(
                    oper.from, oper.to
                );
                prefix = oper.pref;
                defineInstruction(prefix, null, opcode, 4, instr, ins.desc + oper.desc, prefix);
            }
            // Define INS n (if included)
            vari = ins.variations.n;
            if (vari) {
                opcode = vari.opcode;
                instr = ins.instr(
                    fromN, null
                );
                defineInstruction(null, null, opcode, 7, instr, ins.desc + "n", false);
            }
            // Define INS (HLp)   * Includes DD and FD prefixed variations for _HL_
            // +++ Must use preRead_d in case of selfModifyInstructions with prefix
            vari = ins.variations._HLp_;
            opcode = vari.opcode;
            for (op in oper_HLp_) {
                oper = oper_HLp_[op];
                prefix = oper.pref;
                if (prefix && ins.selfModifyInstr) {
                    instr = ins.selfModifyInstr(
                        oper.from.fromPreReadAddr, oper.to.toPreReadAddr
                    );
                } else {
                    instr = ins.instr(
                        oper.from, oper.to
                    );
                }
                defineInstruction(prefix, null, opcode, vari.T + (prefix ? 8 : 0), instr, ins.desc + oper.desc, false);
            }
        }

        // General-Purpose Arithmetic and CPU Control Group  -----------------------

        // 1 bytes, 1M, 4T: - DAA
        opcode = 0x27;
        instr = DAA;
        defineInstruction(null, null, opcode, 4, instr, "DAA", false);

        // 1 bytes, 1M, 4T: - CPL
        opcode = 0x2f;
        instr = CPL;
        defineInstruction(null, null, opcode, 4, instr, "CPL", false);

        // 2 bytes, 2M, 8T: - NEG
        opcode = 0x44;
        instr = NEG;
        defineInstruction(null, 0xed, opcode, 4, instr, "NEG", false);

        // 1 bytes, 1M, 4T: - CCF
        opcode = 0x3f;
        instr = CCF;
        defineInstruction(null, null, opcode, 4, instr, "CCF", false);

        // 1 bytes, 1M, 4T: - SCF
        opcode = 0x37;
        instr = SCF;
        defineInstruction(null, null, opcode, 4, instr, "SCF", false);

        // 1 bytes, 1M, 4T: - NOP
        opcode = 0x00;
        instr = NOP;
        defineInstruction(null, null, opcode, 4, instr, "NOP", false);

        // 1 bytes, 1M, 4T: - HALT
        opcode = 0x76;
        instr = HALT;
        instructionHALT = defineInstruction(null, null, opcode, 4, instr, "HALT", false);

        // 1 bytes, 1M, 4T: - DI
        opcode = 0xf3;
        instr = DI;
        defineInstruction(null, null, opcode, 4, instr, "DI", false);

        // 1 bytes, 1M, 4T: - EI
        opcode = 0xfb;
        instr = EI;
        defineInstruction(null, null, opcode, 4, instr, "EI", false);

        // 2 bytes, 2M, 8T: - IM 0
        opcode = 0x46;
        instr = newIM(0);
        defineInstruction(null, 0xed, opcode, 4, instr, "IM 0", false);

        // 2 bytes, 2M, 8T: - IM 1
        opcode = 0x56;
        instr = newIM(1);
        defineInstruction(null, 0xed, opcode, 4, instr, "IM 1", false);

        // 2 bytes, 2M, 8T: - IM 2
        opcode = 0x5e;
        instr = newIM(2);
        defineInstruction(null, 0xed, opcode, 4, instr, "IM 2", false);

        // 16-bit Arithmetic Group  ----------------------------------------------------

        var arith16ExtendedInstructions = {
            ADC: {desc: "ADC HL, ", instr: newADC16, opcode: 0x4a },
            SBC: {desc: "SBC HL, ", instr: newSBC16, opcode: 0x42 }
        };

        var arith16SelfModifyInstructions = {
            INC: { desc: "INC ", instr: newINC16, opcode: 0x03 },
            DEC: { desc: "DEC ", instr: newDEC16, opcode: 0x0b }
        };

        // Define ADD HLp, ddp     1 byte *+1, 3M *+1, 11T *+4       * Includes DD and FD prefixed variations for HL and dd
        opcodeBase = 0x09;
        for (to in operHLp) {
            operTo = operHLp[to];
            for (from in operDDp) {
                operFrom = operDDp[from];
                // can't mix prefixes in the wrong combinations
                if ((operTo.pref && (operFrom.nopref || (operFrom.pref && (operFrom.pref != operTo.pref))))
                    || (operFrom.pref && (operTo.nopref || (operTo.pref && (operTo.pref != operFrom.pref)))))
                    continue;
                opcode = opcodeBase | (operFrom.bits << 4);
                instr = newADD16(
                    operTo.to, operTo.from, operFrom.from
                );
                prefix = operTo.pref;
                defineInstruction(prefix, null, opcode, 11, instr, "ADD " + operTo.desc + ", " + operFrom.desc, false);
            }
        }

        // Define INS HL, dd   (ADC and SBC)   2 bytes, 4M, 15T        * Extended with ED prefix so no DD and FD prefixed variations
        for (i in arith16ExtendedInstructions) {
            ins = arith16ExtendedInstructions[i];
            opcodeBase = ins.opcode;
            for (op in operDD) {
                oper = operDD[op];
                opcode = opcodeBase | (oper.bits << 4);
                instr = ins.instr(
                    toHL, fromHL, oper.from
                );
                defineInstruction(null, 0xed, opcode, 11, instr, ins.desc + oper.desc, false);
            }
        }

        // Define INS ddp   (INC, DEC)    1 byte *+1, 1M *+1, 6T *+4    * Includes DD and FD prefixed variations for dd
        for (i in arith16SelfModifyInstructions) {
            ins = arith16SelfModifyInstructions[i];
            opcodeBase = ins.opcode;
            for (op in operDDp) {
                oper = operDDp[op];
                opcode = opcodeBase | (oper.bits << 4);
                instr = ins.instr(
                    oper.to, oper.from
                );
                prefix = oper.pref;
                defineInstruction(prefix, null, opcode, 6, instr, ins.desc + oper.desc, false);
            }
        }

        // Rotate and Shift Group  ----------------------------------------------------

        // 1 bytes, 1M, 4T: - RLCA
        opcode = 0x07;
        instr = RLCA;
        defineInstruction(null, null, opcode, 4, instr, "RLCA", false);

        // 1 bytes, 1M, 4T: - RLA
        opcode = 0x17;
        instr = RLA;
        defineInstruction(null, null, opcode, 4, instr, "RLA", false);

        // 1 bytes, 1M, 4T: - RRCA
        opcode = 0x0f;
        instr = RRCA;
        defineInstruction(null, null, opcode, 4, instr, "RRCA", false);

        // 1 bytes, 1M, 4T: - RRA
        opcode = 0x1f;
        instr = RRA;
        defineInstruction(null, null, opcode, 4, instr, "RRA", false);

        var operRu = {
            A:    { bits: 7, to: toA,     from: fromA,     desc: "A" },
            B:    { bits: 0, to: toB,     from: fromB,     desc: "B" },
            C:    { bits: 1, to: toC,     from: fromC,     desc: "C" },
            D:    { bits: 2, to: toD,     from: fromD,     desc: "D" },
            E:    { bits: 3, to: toE,     from: fromE,     desc: "E" },
            H:    { bits: 4, to: toH,     from: fromH,     desc: "H" },
            L:    { bits: 5, to: toL,     from: fromL,     desc: "L" },
            _HL_: { bits: 6, to: to_HL_8, from: from_HL_8, desc: "(HL)" }
        } ;

        var oper_IXIY_pre = {
            _IXd_: { prefix: 0xdd, to: to_IXd_8.toPreReadAddr, from: from_IXd_8.fromPreReadAddr, desc: "(IX+d)" },
            _IYd_: { prefix: 0xfd, to: to_IYd_8.toPreReadAddr, from: from_IYd_8.fromPreReadAddr, desc: "(IY+d)" }
        };

        var rotateShiftRegOrMem = {
            RLC: { desc: "RLC ",  instr: newRLC,  opcode: 0x00 },
            RL:  { desc: "RL ",   instr: newRL,   opcode: 0x10 },
            RRC: { desc: "RRC ",  instr: newRRC,  opcode: 0x08 },
            RR:  { desc: "RR ",   instr: newRR,   opcode: 0x18 },
            SLA: { desc: "SLA ",  instr: newSLA,  opcode: 0x20 },
            SRA: { desc: "SRA ",  instr: newSRA,  opcode: 0x28 },
            SLL: { desc: "SLL ",  instr: newSLL, opcode: 0x30, undoc: true },
            SRL: { desc: "SRL ",  instr: newSRL,  opcode: 0x38 }
        };

        for (i in rotateShiftRegOrMem) {
            ins = rotateShiftRegOrMem[i];
            opcodeBase = ins.opcode;
            // Define INS ru              * Includes (HL), but NOT DD and FD prefixed variations for r
            for (op in operRu) {
                oper = operRu[op];
                opcode = opcodeBase | oper.bits;
                instr = ins.instr(
                    oper.to,
                    oper.from,
                    null
                );
                T = op == "_HL_" ? 11 : 4;
                defineInstruction(null, 0xcb, opcode, T, instr, ins.desc + oper.desc, ins.undoc);
            }
            // Define INS (IX+d/IY+d)    * DD and FD prefixed variations, can also store result in register
            for (var p in oper_IXIY_pre) {
                var pref = oper_IXIY_pre[p];
                for (op in operRu) {
                    oper = operRu[op];
                    opcode = opcodeBase | oper.bits;
                    var toExt = (op != "_HL_") ? oper.to : null;
                    instr = ins.instr(
                        pref.to,
                        pref.from,
                        toExt         // Also store result in the register! Undocumented.
                    );
                    defineInstruction(pref.prefix, 0xcb, opcode, 11 + (pref.prefix ? 4 : 0), instr, ins.desc + pref.desc + (toExt ? ", " + oper.desc : ""), ins.undoc || toExt);
                }
            }
        }

        // 2 bytes, 5M, 18T: - RLD
        opcode = 0x6f;
        instr = RLD;
        defineInstruction(null, 0xed, opcode, 14, instr, "RLD", false);

        // 2 bytes, 5M, 18T: - RRD
        opcode = 0x67;
        instr = RRD;
        defineInstruction(null, 0xed, opcode, 14, instr, "RRD", false);

        // Bit Set, Reset, and Test Group  --------------------------------------------------

        var bitSetResetRegOrMem = {
            BIT: { desc: "BIT ", instr: newBIT, opcode: 0x40, T_HL_: 8 },
            SET: { desc: "SET ", instr: newSET, opcode: 0xc0, T_HL_: 11, toExt: true },
            RES: { desc: "RES ", instr: newRES, opcode: 0x80, T_HL_: 11, toExt: true }
        };

        for (i in bitSetResetRegOrMem) {
            ins = bitSetResetRegOrMem[i];
            opcodeBase = ins.opcode;
            // Define INS ru               * Includes (HL), but NOT DD and FD prefixed variations for ru
            for (op in operRu) {
                oper = operRu[op];
                for (var bit = 0; bit <= 7; bit++) {
                    opcode = opcodeBase | (bit << 3) | oper.bits;
                    instr = ins.instr(
                        oper.to,
                        oper.from,
                        bit,
                        null
                    );
                    T = op == "_HL_" ? ins.T_HL_ : 4;
                    defineInstruction(null, 0xcb, opcode, T, instr, ins.desc + bit + ", " + oper.desc, false);
                }
            }
            // Define INS (IX+d/IY+d)     * DD and FD prefixed variations, can also store result in register
            for (p in oper_IXIY_pre) {
                pref = oper_IXIY_pre[p];
                for (op in operRu) {
                    oper = operRu[op];
                    for (bit = 0; bit <= 7; bit++) {
                        opcode = opcodeBase | (bit << 3) | oper.bits;
                        var undoc = op != "_HL_";
                        toExt = undoc && ins.toExt ? oper.to : null;
                        instr = ins.instr(
                            pref.to,
                            pref.from,
                            bit,
                            toExt         // Also store result in the register! Undocumented.
                        );
                        defineInstruction(pref.prefix, 0xcb, opcode, ins.T_HL_ + (pref.prefix ? 4 : 0), instr, ins.desc + bit + ", " + pref.desc + (toExt ? ", " + oper.desc : ""), undoc);
                    }
                }
            }
        }

        // Jump Group  --------------------------------------------------------------------

        var operVVp = {
            nn:   { desc: "nn",   from: fromNN, opcode: 0xc3, T: 10 },
            HL:   { desc: "(HL)", from: fromHL, opcode: 0xe9, T: 4 },                   // Not really indirect
            IX:   { desc: "(IX)", from: fromIX, opcode: 0xe9, T: 4, pref: 0xdd },       // Not really indirect
            IY:   { desc: "(IY)", from: fromIY, opcode: 0xe9, T: 4, pref: 0xfd }        // Not really indirect
        };

        var operCC = {
            NZ: { bits: 0, desc: "NZ", flag: bZ,  val: 0 },
            Z:  { bits: 1, desc: "Z",  flag: bZ,  val: bZ },
            NC: { bits: 2, desc: "NC", flag: bC,  val: 0 },
            C:  { bits: 3, desc: "C",  flag: bC,  val: bC },
            PO: { bits: 4, desc: "PO", flag: bPV, val: 0 },
            PE: { bits: 5, desc: "PE", flag: bPV, val: bPV },
            P:  { bits: 6, desc: "P",  flag: bS,  val: 0 },
            M:  { bits: 7, desc: "M",  flag: bS,  val: bS }
        };

        // JP vvp                           * Includes DD and DF prefixed variations for vv
        for (op in operVVp) {
            oper = operVVp[op];
            opcode = oper.opcode;
            instr = newJP(
                oper.from
            );
            prefix = oper.pref;
            defineInstruction(prefix, null, opcode, oper.T, instr, "JP " + oper.desc, false);
        }

        // 3 bytes, 3M, 10T: - JP cc, nn
        opcodeBase = 0xc2;
        for (op in operCC) {
            oper = operCC[op];
            opcode = opcodeBase | (oper.bits << 3);
            instr = newJPcc(
                oper.flag,
                oper.val
            );
            defineInstruction(null, null, opcode, 10, instr, "JP " + oper.desc + ", nn", false);
        }

        // 2 bytes, 3M, 12T: - JR e
        opcode = 0x18;
        instr = JR;
        defineInstruction(null, null, opcode, 12, instr, "JR e", false);

        var operCCe = {
            C:  { opcode: 0x38, desc: "C",  flag: bC, val: bC },
            NC: { opcode: 0x30, desc: "NC", flag: bC, val: 0 },
            Z:  { opcode: 0x28, desc: "Z",  flag: bZ, val: bZ },
            NZ: { opcode: 0x20, desc: "NZ", flag: bZ, val: 0 }
        };

        // 2 bytes, 2M *+1, 7T *+5: - JR cc, e       * if condition is true and branch taken
        for (op in operCCe) {
            oper = operCCe[op];
            opcode = oper.opcode;
            instr = newJRcc(
                oper.flag,
                oper.val
            );
            defineInstruction(null, null, opcode, 7, instr, "JR " + oper.desc + ", e", false);
        }

        // 2 bytes, 2M *+1, 8T *+5: - DJNZ e       * if condition is true and branch taken
        opcode = 0x10;
        instr = DJNZ;
        defineInstruction(null, null, opcode, 8, instr, "DJNZ e", false);

        // Call and Return Group  ----------------------------------------------------------

        // 3 bytes, 5M,  17T: - CALL nn
        opcode = 0xcd;
        instr = CALL;
        defineInstruction(null, null, opcode, 17, instr, "CALL nn", false);

        // 3 bytes, 3M *+2, 10T *+7: - CALL cc, nn       * if condition is true and branch taken
        opcodeBase = 0xc4;
        for (op in operCC) {
            oper = operCC[op];
            opcode = opcodeBase | (oper.bits << 3);
            instr = newCALLcc(
                oper.flag,
                oper.val
            );
            defineInstruction(null, null, opcode, 10, instr, "CALL " + oper.desc + ", nn", false);
        }

        // 1 bytes, 3M, 10T: - RET
        opcode = 0xc9;
        instr = RET;
        defineInstruction(null, null, opcode, 10, instr, "RET", false);

        // 1 bytes, 1M *+2, 5T *+6: - RET cc          * if condition is true and branch taken
        opcodeBase = 0xc0;
        for (op in operCC) {
            oper = operCC[op];
            opcode = opcodeBase | (oper.bits << 3);
            instr = newRETcc(
                oper.flag,
                oper.val
            );
            defineInstruction(null, null, opcode, 5, instr, "RET " + oper.desc, false);
        }

        // 2 bytes, 4M, 14T: - RETI
        opcode = 0x4d;
        instr = RETI;
        defineInstruction(null, 0xed, opcode, 10, instr, "RETI", false);

        // 2 bytes, 4M, 14T: - RETN
        opcode = 0x45;
        instr = RETN;
        defineInstruction(null, 0xed, opcode, 10, instr, "RETN", false);

        var operRST = {
            h00: { bits: 0, addr: 0x0000, desc: "00h" },
            h08: { bits: 1, addr: 0x0008, desc: "08h" },
            h10: { bits: 2, addr: 0x0010, desc: "10h" },
            h18: { bits: 3, addr: 0x0018, desc: "18h" },
            h20: { bits: 4, addr: 0x0020, desc: "20h" },
            h28: { bits: 5, addr: 0x0028, desc: "28h" },
            h30: { bits: 6, addr: 0x0030, desc: "30h" },
            h38: { bits: 7, addr: 0x0038, desc: "38h" }
        };

        // 1 bytes, 3M, 11T: - RST p
        opcodeBase = 0xc7;
        for (op in operRST) {
            oper = operRST[op];
            opcode = opcodeBase | (oper.bits << 3);
            instr = newRST(
                oper.addr
            );
            defineInstruction(null, null, opcode, 11, instr, "RST " + oper.desc, false);
        }

        // Input and Output Group  ----------------------------------------------------------

        // 2 bytes, 3M, 11T: - IN A, (n)
        opcode = 0xdb;
        instr = INAn;
        defineInstruction(null, null, opcode, 11, instr, "IN A, (n)", false);

        // 2 bytes, 3M, 12T: - IN r, (C)
        opcodeBase = 0x40;
        for (op in operR) {
            oper = operR[op];
            opcode = opcodeBase | (oper.bits << 3);
            instr = newINrC(
                oper.to
            );
            defineInstruction(null, 0xed, opcode, 8, instr, "IN " + oper.desc + ", (C)", false);
        }

        // 2 bytes, 4M, 16T: - INI
        opcode = 0xa2;
        instr = INI;
        defineInstruction(null, 0xed, opcode, 12, instr, "INI", false);

        // 2 bytes, 4M *+1, 16T *+5: - INIR         *  in case a repeat occurs
        opcode = 0xb2;
        instr = INIR;
        defineInstruction(null, 0xed, opcode, 12, instr, "INIR", false);

        // 2 bytes, 4M, 16T: - IND
        opcode = 0xaa;
        instr = IND;
        defineInstruction(null, 0xed, opcode, 12, instr, "IND", false);

        // 2 bytes, 4M *+1, 16T *+5: - INDR         *  in case a repeat occurs
        opcode = 0xba;
        instr = INDR;
        defineInstruction(null, 0xed, opcode, 12, instr, "INDR", false);

        // 2 bytes, 3M, 11T: - OUT (n), A
        opcode = 0xd3;
        instr = OUTnA;
        defineInstruction(null, null, opcode, 11, instr, "OUT (n), A", false);

        // 2 bytes, 3M, 12T: - OUT (C), r
        opcodeBase = 0x41;
        for (op in operR) {
            oper = operR[op];
            opcode = opcodeBase | (oper.bits << 3);
            instr = newOUTCr(
                oper.from
            );
            defineInstruction(null, 0xed, opcode, 8, instr, "OUT (C), " + oper.desc, false);
        }

        // 2 bytes, 4M, 16T: - OUTI
        opcode = 0xa3;
        instr = OUTI;
        defineInstruction(null, 0xed, opcode, 12, instr, "OUTI", false);

        // 2 bytes, 4M *+1, 16T *+5: - OTIR         *  in case a repeat occurs
        opcode = 0xb3;
        instr = OTIR;
        defineInstruction(null, 0xed, opcode, 12, instr, "OTIR", false);

        // 2 bytes, 4M, 16T: - OUTD
        opcode = 0xab;
        instr = OUTD;
        defineInstruction(null, 0xed, opcode, 12, instr, "OUTD", false);

        // 2 bytes, 4M *+1, 16T *+5: - OTDR         *  in case a repeat occurs
        opcode = 0xbb;
        instr = OTDR;
        defineInstruction(null, 0xed, opcode, 12, instr, "OTDR", false);

        // Undocumented instructions, besides DD and FD prefixed variations already defined

        // 2 bytes, 2M, 8T: - uNEG
        var ops = [0x4c, 0x54, 0x5c, 0x64, 0x6c, 0x74, 0x7c];
        for (i = 0; i < ops.length; i++) {
            opcode = ops[i];
            instr = NEG;
            defineInstruction(null, 0xed, opcode, 4, instr, "NEG", true);
        }

        // 2 bytes, 4M, 14T: - uRETN
        ops = [0x55, 0x5d, 0x65, 0x6d, 0x75, 0x7d];
        for (i = 0; i < ops.length; i++) {
            opcode = ops[i];
            instr = RETN;
            defineInstruction(null, 0xed, opcode, 10, instr, "RETN", true);
        }

        // 2 bytes, 2M, 8T: - uIM 0
        ops = [0x4e, 0x66, 0x6e];
        for (i = 0; i < ops.length; i++) {
            opcode = ops[i];
            instr = newIM(0);
            defineInstruction(null, 0xed, opcode, 4, instr, "IM 0", true);
        }

        // 2 bytes, 2M, 8T: - uIM 1
        opcode = 0x76;
        instr = newIM(1);
        defineInstruction(null, 0xed, opcode, 4, instr, "IM 1", true);

        // 2 bytes, 2M, 8T: - uIM 2
        opcode = 0x7e;
        instr = newIM(2);
        defineInstruction(null, 0xed, opcode, 4, instr, "IM 2", true);

        // 2 bytes, 3M, 12T: - uIN (C)
        opcode = 0x70;
        instr = uIN_C;
        defineInstruction(null, 0xed, opcode, 8, instr, "IN (C)", true);

        // 2 bytes, 3M, 12T: - uOUT (C)
        opcode = 0x71;
        instr = uOUTC0;
        defineInstruction(null, 0xed, opcode, 8, instr, "OUT (C), 0", true);

        // Extension pseudo Instructions (ED E0 to ED FF)

        for (opcode = 0xe0; opcode <= 0xff; opcode++) {
            instr = newpEXT(opcode);
            defineInstruction(null, 0xed, opcode, 4, instr, "EXT " + opcode.toString(16), true);
        }

        // 2 bytes, 2M, 8T: - uNOP              All ED extended instructions not yet defined are NOPs
        for (i = 0x00; i <= 0xff; i++) {
            if (!instructionsED[i]) {
                opcode = i;
                instr = uNOP;
                defineInstruction(null, 0xed, opcode, 4, instr, "NOP", true);
            }
        }

        // Pseudo instructions

        opcode = 0xcb;
        instr = pSET_CB;
        defineInstruction(null, null, opcode, 4, instr, "< SET CB >", false);

        opcode = 0xed;
        instr = pSET_ED;
        defineInstruction(null, null, opcode, 4, instr, "< SET ED >", false);

        opcode = 0xdd;
        instr = pSET_DD;
        defineInstruction(null, null, opcode, 4, instr, "< SET DD >", false);
        opcode = 0xdd;
        instr = pSET_DD;
        defineInstruction(0xdd, null, opcode, 4, instr, "< SET DD again >", false);
        opcode = 0xfd;
        instr = pSET_FD;
        defineInstruction(0xdd, null, opcode, 4, instr, "< SWITCH to FD >", false);
        opcode = 0xcb;
        instr = pSET_DDCB;
        defineInstruction(0xdd, null, opcode, 3, instr, "< SET DDCB >", false);         // Discount -1 for wrongly added M1 wait

        opcode = 0xfd;
        instr = pSET_FD;
        defineInstruction(null, null, opcode, 4, instr, "< SET FD >", false);
        opcode = 0xfd;
        instr = pSET_FD;
        defineInstruction(0xfd, null, opcode, 4, instr, "< SET FD again >", false);
        opcode = 0xdd;
        instr = pSET_DD;
        defineInstruction(0xfd, null, opcode, 4, instr, "< SWITCH to DD >", false);
        opcode = 0xcb;
        instr = pSET_FDCB;
        defineInstruction(0xfd, null, opcode, 3, instr, "< SET FDCB >", false);         // Discount -1 for wrongly added M1 wait

        opcode = 257;
        instr = pADT_CYCLES;
        instructionADT_CYCLES = defineInstruction(null, null, opcode, 0, instr, "< ADT CYCLES >", false);

        // Testing pseudo instructions

        //opcode = 258;
        //instr = pSTOP;
        //defineInstruction(null, null, opcode, 4, instr, "++ BDOS STOP ++", false);
        //
        //opcode = 259;
        //instr = pCPM_BDOS;
        //defineInstruction(null, null, opcode, 4, instr, "++ BDOS PRINT ++", false);


        // ------------------------------

        function defineInstruction(prefix1, prefix2, opcode, cycles, operation, mnemonic, undocumented) {
            var instr = {};
            instr.prefix = prefix2 ? ((prefix1 << 8) | prefix2) : prefix1;
            instr.opcode = opcode;
            instr.remainCycles = cycles + 1;                                                     // extra M1 wait for MSX
            instr.totalCycles = instr.remainCycles + (prefix1 ? 5 : 0) + (prefix2 ? 4 : 0);      // each prefix adds 4T + 1 extra M1 state for the first prefix
            instr.operation = operation;
            instr.mnemonic = mnemonic;
            instr.undocumented = undocumented;

            instr.opcodeString =
                (instr.prefix ? wmsx.Util.toHex2(instr.prefix) : "") + (instr.prefix === 0xddcb || instr.prefix === 0xfdcb ? " " : "") +
                wmsx.Util.toHex2(instr.opcode) + " " +
                mnemonic + (undocumented ? "*" : "");

            instr.toString = function() {
                return this.opcodeString;
            };

            registerInstruction(instr);
            return instr;
        }

        function registerInstruction(instr) {
            self.instructionsAll.push(instr);

            if (!instr.prefix)                instructions[instr.opcode] = instr;
            else if (instr.prefix === 0xed)   instructionsED[instr.opcode] = instr;
            else if (instr.prefix === 0xcb)   instructionsCB[instr.opcode] = instr;
            else if (instr.prefix === 0xddcb) instructionsDDCB[instr.opcode] = instr;
            else if (instr.prefix === 0xfdcb) instructionsFDCB[instr.opcode] = instr;
            else if (instr.prefix === 0xdd)   instructionsDD[instr.opcode] = instr;
            else if (instr.prefix === 0xfd)   instructionsFD[instr.opcode] = instr;
            else throw new Error("Invalid instruction prefix!");
        }
    }

    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            PC: PC, SP: SP, A: A, F: F, B: B, C: C, DE: DE, HL: HL, IX: IX, IY: IY,
            AF2: AF2, BC2: BC2, DE2: DE2, HL2: HL2, I: I, R: R, IM: IM, IFF1: IFF1, INT: INT, nINT: 1,
            c: busCycles, T: T, o: opcode, p: prefix, ai: ackINT, ii: this.instructionsAll.indexOf(instruction),
            ecr: extensionCurrentlyRunning, eei: extensionExtraIterations,
            tcm: turboClockMulti
        };
    };

    this.loadState = function(s) {
        PC = s.PC; SP = s.SP; A = s.A; F = s.F; B = s.B; C = s.C; DE = s.DE; HL = s.HL; IX = s.IX; IY = s.IY;
        AF2 = s.AF2; BC2 = s.BC2; DE2 = s.DE2; HL2 = s.HL2; I = s.I; R = s.R; IM = s.IM; IFF1 = s.IFF1;
        setINT(s.nINT ? s.INT : s.INT ? 0xff : 0xfe);   // Backward compatibility
        busCycles = s.c; T = s.T; opcode = s.o; prefix = s.p; ackINT = s.ai; instruction = this.instructionsAll[s.ii] || null;
        extensionCurrentlyRunning = s.ecr; extensionExtraIterations = s.eei;
        turboClockMulti = s.tcm !== undefined ? s.tcm : s.tcs > 0 ? 2 : 1;  // Backward compatibility
    };


    // Accessory variables and methods for testing

    this.toString = function() {
        return "CPU " +
            " PC: " + wmsx.Util.toHex2(PC) + "      op: " + (instruction ? instruction.mnemonic : "NULL") + "          cycle: " + busCycles + "\n\n" +
            "A: " + wmsx.Util.toHex2(A) + "     B: " + wmsx.Util.toHex2(B) + "     C: " + wmsx.Util.toHex2(C) + "     D: " + wmsx.Util.toHex2(DE >>> 8) +
            "     E: " + wmsx.Util.toHex2(DE & 0xff) + "     H: " + wmsx.Util.toHex2(HL >>> 8) + "     L: " + wmsx.Util.toHex2(HL & 0xff) + "\n" +
            "BC: " + wmsx.Util.toHex2(fromBC()) + "  DE: " + wmsx.Util.toHex2(DE) + "  HL: " + wmsx.Util.toHex2(HL) +
            "  IX: " + wmsx.Util.toHex2(IX) + "  IY: " + wmsx.Util.toHex2(IY) + "       SP: " + wmsx.Util.toHex2(SP) +  "\n\n" +
            "Flags: " + (F & bS ? "S " : "- ") + (F & bZ ? "Z " : "- ") + (F & bF5 ? "5 " : "- ") + (F & bH ? "H " : "- ") +
            (F & bF3 ? "3 " : "- ") + (F & bPV ? "P " : "- ") + (F & bN ? "N " : "- ") + (F & bC ? "C" : "-") +
            "            IFF: " + IFF1 + "     INT: " + wmsx.Util.toHex2(INT) + "     prefix: " + prefix;
    };

    //this.trace = false;
    //this.stop = false;
    //this.breakpointOutput = null;

    //function checkState() {
    //    if (
    //        (A > 255 || A < 0 || A === null || A === undefined) ||
    //        (F > 255 || F < 0 || F === null || F === undefined) ||
    //        (B > 255 || B < 0 || B === null || B === undefined) ||
    //        (C > 255 || C < 0 || C === null || C === undefined) ||
    //        (DE > 65535 || DE < 0 || DE === null || DE === undefined) ||
    //        (HL > 65535 || HL < 0 || HL === null || HL === undefined) ||
    //        (IX > 65535 || IX < 0 || IX === null || IX === undefined) ||
    //        (IY > 65535 || IY < 0 || IY === null || IY === undefined))
    //        throw new Error("Oh my gosh!");
    //}

    //this.printInstructions = function() {
    //    this.instructionsAll.sort(function(a,b) {
    //        return a == b ? 0 : a.opcodeString > b.opcodeString ? 1 : -1;
    //    });
    //    var res = "";
    //    for (var i = 0, len = this.instructionsAll.length; i < len; i++) {
    //        var opcodeString = this.instructionsAll[i].opcodeString;
    //        for (; opcodeString.length < 30;) opcodeString += " ";
    //        res += "\n" + opcodeString + " : " + this.instructionsAll[i].totalCycles;
    //    }
    //    return res;
    //};

    //this.breakpoint = function(mes) {
    //    self.stop = true;
    //    var text = "CPU Breakpoint!  " + (mes ? "(" + mes + ")" : "") + "\n\n" + this.toString();
    //    if (self.breakpointOutput)
    //        self.breakpointOutput(text);
    //    else
    //        wmsx.Util.message(text);
    //};

    //this.testPrint = "";
    //this.testPrintChar = function(charac) {
    //    this.testPrint += charac;
    //};

    // var DEBUG = 0;

    this.eval = function(str) {
        return eval(str);
    };

    init();

};

wmsx.Z80.BASE_CLOCK = 3584160;      // MHz
