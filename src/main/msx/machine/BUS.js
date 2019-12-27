// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// BUS interface. Controls 4 Primary Slots and I/O Device Ports
// I/O ports addressing limited to 8 bits (lower 8 bits of Z80 I/O address)
// For Turbo R S19990 added waits, assumes the standard Slot configuration

wmsx.BUS = function(machine, cpu) {
"use strict";

    var self = this;

    function init() {
        create();
    }

    this.powerOn = function() {
        switchedDevices.reset();
        this.setPrimarySlotConfig(0);
        for (var i = 0; i < 5; i++) slots[i].powerOn();
    };

    this.powerOff = function() {
        for (var i = 0; i < 5; i++) slots[i].powerOff();
    };

    this.reset = function() {
        vdpIOClock = 0;
        switchedDevices.reset();
        this.setPrimarySlotConfig(0);
        for (var i = 0; i < 5; i++) slots[i].reset();
    };

    this.refreshConnect = function() {
        for (var s = 0; s < 5; ++s) slots[s].refreshConnect();
    };

    this.insertSlot = function(slot, slotNumber) {
        slot = slot || slotEmpty;
        if (slots[slotNumber] === slot) return;

        slots[slotNumber].disconnect(machine);
        slots[slotNumber] = slot;
        slots[slotNumber].connect(machine);

        switch (slotNumber) {
            case 0: slot0 = slot; return;
            case 1: slot1 = slot; return;
            case 2: slot2 = slot; return;
            case 3: slot3 = slot; return;
            case 4: slotModules = slot; return;     // extra slow
        }
    };

    this.getSlot = function(slotNumber) {
        return slots[slotNumber];
    };

    function getSlotForAddress(address) {
        switch ((primarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: return slot0;
            case 1: return slot1;
            case 2: return slot2;
            case 3: return slot3;
            // slotModules inaccessible
        }
    }
    this.getSlotForAddress = getSlotForAddress;

    this.read = function(address) {
        // Get correct slot
        switch ((primarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: return slot0.read(address);
            case 1: return slot1.read(address);
            case 2: return slot2.read(address);
            case 3: return slot3.read(address);
            // slotModules inaccessible
        }
    };

    this.write = function(address, val) {
        // Get correct slot
        switch ((primarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: slot0.write(address, val); return;
            case 1: slot1.write(address, val); return;
            case 2: slot2.write(address, val); return;
            case 3: slot3.write(address, val); return;
            // slotModules inaccessible
        }
    };
    var origWrite = this.write;

    this.writeWithBusMonitor = function(address, val) {
        writeMonitor(address, val);
        // Get correct slot
        switch ((primarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: slot0.write(address, val); return;
            case 1: slot1.write(address, val); return;
            case 2: slot2.write(address, val); return;
            case 3: slot3.write(address, val); return;
            // slotModules inaccessible
        }
    };

    this.setDRAMMode = function(state) {
        slot0.setDRAMMode(!!state);
        slot3.setDRAMMode(!!state);
    };

    this.getBreakWait = function(address, lastAddress) {
        var s = (primarySlotConfig >> ((address >> 14) << 1)) & 3;
        if (s === 3) return slot3.getBreakWaitSub(address, lastAddress);     // Slot3 (ROM/RAM)
        if (s === 0) return slot0.getBreakWaitSub(address, lastAddress);     // Slot0 (ROM/RAM)
        return 1;                                                            // External: Forced Page Break
    };

    this.getAccessWait = function(address) {
        var s = (primarySlotConfig >> ((address >> 14) << 1)) & 3;
        if (s === 3) return slot3.getAccessWaitSub(address);                 // Slot3 (ROM/RAM)
        if (s === 0) return slot0.getAccessWaitSub(address);                 // Slot0 (ROM/RAM)
        return 2;                                                            // External: 2 extra waits
    };

    this.input = function(port) {
        // Get correct device
        return devicesInputPorts[port & 255](port);
    };

    this.output = function(port, val) {
        // Get correct device
        return devicesOutputPorts[port & 255](val, port);
    };

    this.getIOWait = function(port, clockMulti) {
        if (port > 0x9b || port < 0x98) return 0;       // Not a VDP port

        var last = vdpIOClock;
        vdpIOClock = cpu.getBUSCycles();

        var wait = 31 - (vdpIOClock - last);            // Minimum 31 BUS clocks between VDP accesses

        return wait > 0 ? wait * clockMulti: 0;         // Wait in BUS cycles, so use CPU clock multi
    };

    this.setPrimarySlotConfig = function(val) {
        //wmsx.Util.log("PrimarySlot Select: " + val.toString(16));
        primarySlotConfig = val;
    };

    this.getPrimarySlotConfig = function() {
        //wmsx.Util.log("PrimarySlot Query: " + primarySlotConfig.toString(16));
        return primarySlotConfig;
    };

    // Receive all CPU Extensions and pass to slot at instruction for E0 - EF exts and to set handlers for F0 - FF exts
    // WARNING: Extensions 0xe1, 0xe3, 0xe9, 0xf3, 0xf9 CANNOT be used, as they are valid opcodes for the R800 CPU
    this.cpuExtensionBegin = function(s) {
        if (s.extNum < 0xf0) return getSlotForAddress(s.extPC).cpuExtensionBegin(s);
        var handler = cpuExtensionHandlers[s.extNum];
        if (handler) return handler.cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction for E0 - EF exts and to set handlers for F0 - FF exts
        if (s.extNum < 0xf0) return getSlotForAddress(s.extPC).cpuExtensionFinish(s);
        var handler = cpuExtensionHandlers[s.extNum];
        if (handler) return handler.cpuExtensionFinish(s);
    };

    // Register handler for F0 - FF extensions
    // WARNING: Extensions 0xf3, 0xf9 CANNOT be used, as they are valid opcodes for the R800 CPU
    this.setCpuExtensionHandler = function(num, handler) {
        cpuExtensionHandlers[num] = handler;
    };

    this.connectInputDevice = function(port, handler) {
        devicesInputPorts[port] = handler;
    };

    this.connectOutputDevice = function(port, handler) {
        devicesOutputPorts[port] = handler;
    };

    this.disconnectInputDevice = function(port, handler) {
        if (!handler || devicesInputPorts[port] === handler) devicesInputPorts[port] = deviceInputMissing;
    };

    this.disconnectOutputDevice = function(port, handler) {
        if (!handler || devicesOutputPorts[port] === handler) devicesOutputPorts[port] = deviceOutputMissing;
    };

    this.setWriteMonitor = function(monitor) {      // Only 1 monitor can be active
        writeMonitor = monitor;
        if (writeMonitor) this.write = this.writeWithBusMonitor;
        else this.write = origWrite;
    };

    this.connectSwitchedDevice = function(port, device) {
        switchedDevices.connectSwitchedDevice(port, device);
    };

    this.disconnectSwitchedDevice = function(port, device) {
        switchedDevices.disconnectSwitchedDevice(port, device);
    };

    function create() {
        // Slots
        slot0 = slot1 = slot2 = slot3 = slotModules = slotEmpty;
        slots = [ slot0, slot1, slot2, slot3, slotModules ];

        // Devices
        devicesInputPorts =  wmsx.Util.arrayFill(new Array(256), deviceInputMissing);
        devicesOutputPorts = wmsx.Util.arrayFill(new Array(256), deviceOutputMissing);

        // Switched IP Ports
        switchedDevices = new wmsx.SwitchedDevices();
        switchedDevices.connect(self);

        // Debug
        self.slots = slots;
        self.devicesInputPorts = devicesInputPorts;
        self.devicesOutputPorts = devicesOutputPorts;
    }


    var slots;
    var slot0, slot1, slot2, slot3;
    var slotModules;                        // Special Expanded Slot for Modules (Device-only Slots). Memory is inaccessible!
    var primarySlotConfig = 0;

    var slotEmpty = wmsx.SlotEmpty.singleton;
    var deviceInputMissing = wmsx.DeviceMissing.inputPort;
    var deviceOutputMissing = wmsx.DeviceMissing.outputPort;

    var devicesInputPorts;
    var devicesOutputPorts;

    var writeMonitor;
    var switchedDevices;
    var vdpIOClock = 0;

    var cpuExtensionHandlers = {};


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            p: primarySlotConfig,
            s0: slot0.saveState(),
            s1: slot1.saveState(),
            s2: slot2.saveState(),
            s3: slot3.saveState(),
            sM: slotModules.saveState(),
            vc: vdpIOClock
        };
    };

    this.loadState = function(s) {
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s0, slot0), 0);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s1, slot1), 1);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s2, slot2), 2);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s3, slot3), 3);
        this.insertSlot(s.sM ? wmsx.SlotCreator.recreateFromSaveState(s.sM, slotModules) : slotEmpty, 4);
        this.setPrimarySlotConfig(s.p);
        vdpIOClock = s.vc || 0;             // Backward Compatibility
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};