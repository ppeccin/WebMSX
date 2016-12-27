// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// BUS interface. Controls 4 Primary Slots and I/O Device Ports

wmsx.BUS = function(machine, cpu) {
"use strict";

    var self = this;

    function init() {
        create();
    }

    this.powerOn = function() {
        this.setPrimarySlotConfig(0);
        for (var i = 0; i < 4; i++) slots[i].powerOn();
    };

    this.powerOff = function() {
        for (var i = 0; i < 4; i++) slots[i].powerOff();
    };

    this.reset = function() {
        this.setPrimarySlotConfig(0);
        for (var i = 0; i < 4; i++) slots[i].reset();
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
        }
    };

    this.write = function(address, val) {
        // BUS Write Monitoring active?
        if (writeMonitor) writeMonitor(address, val);
        // Get correct slot
        switch ((primarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: slot0.write(address, val); return;
            case 1: slot1.write(address, val); return;
            case 2: slot2.write(address, val); return;
            case 3: slot3.write(address, val); return;
        }
    };

    this.input = function(port) {
        // Get correct device
        return devicesInputPorts[port & 255](port);
    };

    this.output = function(port, val) {
        // Get correct device
        return devicesOutputPorts[port & 255](val, port);
    };

    this.setPrimarySlotConfig = function(val) {
        //wmsx.Util.log("PrimarySlot Select: " + val.toString(16));
        primarySlotConfig = val;
    };

    this.getPrimarySlotConfig = function() {
        //wmsx.Util.log("PrimarySlot Query: " + primarySlotConfig.toString(16));
        return primarySlotConfig;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return getSlotForAddress(s.extPC).cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return getSlotForAddress(s.extPC).cpuExtensionFinish(s);
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
    };

    function create() {
        // Slots
        slot0 = slot1 = slot2 = slot3 = slotEmpty;
        slots = [ slot0, slot1, slot2, slot3 ];

        // Devices
        devicesInputPorts =  wmsx.Util.arrayFill(new Array(256), deviceInputMissing);
        devicesOutputPorts = wmsx.Util.arrayFill(new Array(256), deviceOutputMissing);

        // Receive all CPU Extensions
        cpu.setExtensionHandler([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], self);

        // Debug
        self.slots = slots;
        self.devicesInputPorts = devicesInputPorts;
        self.devicesOutputPorts = devicesOutputPorts;
    }

    var slots;
    var slot0, slot1, slot2, slot3;
    var primarySlotConfig = 0;

    var slotEmpty = wmsx.SlotEmpty.singleton;
    var deviceInputMissing = wmsx.DeviceMissing.inputPort;
    var deviceOutputMissing = wmsx.DeviceMissing.outputPort;

    var devicesInputPorts;
    var devicesOutputPorts;

    var writeMonitor;

    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            p: primarySlotConfig,
            s0: slot0.saveState(),
            s1: slot1.saveState(),
            s2: slot2.saveState(),
            s3: slot3.saveState()
        };
    };

    this.loadState = function(s) {
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s0, slot0), 0);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s1, slot1), 1);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s2, slot2), 2);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s3, slot3), 3);
        this.setPrimarySlotConfig(s.p);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};