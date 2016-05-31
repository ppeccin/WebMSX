// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// BUS interface. Controls 4 Primary Slots and I/O Device Ports
wmsx.BUS = function(machine, cpu) {
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
        if (slots[slotNumber] === slot) return;

        slots[slotNumber].disconnect(machine);
        slots[slotNumber] = slot || slotEmpty;
        slots[slotNumber].connect(machine);
        this.setPrimarySlotConfig(primarySlotConfig);
    };

    this.getSlot = function(slotNumber) {
        return slots[slotNumber];
    };

    this.getSlotForAddress = function(address) {
        return slotPages[address >>> 14];
    };

    this.addDevice = function(device) {
        if (devices.indexOf(device) >= 0) return;

        wmsx.Util.arrayAdd(devices, device);
        device.connect(machine);
    };

    this.removeDevice = function(device) {
        if (devices.indexOf(device) < 0) return;

        device.disconnect(machine);
        wmsx.Util.arrayRemoveAllElement(devices, device);
    };

    this.read = function(address) {
        // Get correct slot
        return slotPages[address >>> 14].read(address);
    };

    this.write = function(address, val) {
        // Get correct slot
        slotPages[address >>> 14].write(address, val);
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
        slotPages[0] = slots[val & 0x03];
        slotPages[1] = slots[(val >>> 2) & 0x03];
        slotPages[2] = slots[(val >>> 4) & 0x03];
        slotPages[3] = slots[(val >>> 6)];
    };

    this.getPrimarySlotConfig = function() {
        //wmsx.Util.log("PrimarySlot Query: " + primarySlotConfig.toString(16));
        return primarySlotConfig;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return slotPages[s.extPC >>> 14].cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return slotPages[s.extPC >>> 14].cpuExtensionFinish(s);
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

    this.getOutputDevice = function(port) {
        return devicesOutputPorts[port];
    };

    this.getInputDevice = function(port) {
        return devicesInputPorts[port];
    };

    function create() {
        // Slots
        slots =     [ slotEmpty, slotEmpty, slotEmpty, slotEmpty ];
        slotPages = [ slotEmpty, slotEmpty, slotEmpty, slotEmpty ];

        // Devices
        devices = [];

        devicesInputPorts =  wmsx.Util.arrayFill(new Array(256), deviceInputMissing);
        devicesOutputPorts = wmsx.Util.arrayFill(new Array(256), deviceOutputMissing);

        // Receive all CPU Extensions
        cpu.setExtensionHandler([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], self);

        // Debug
        self.slots = slots;
        self.slotPages = slotPages;
        self.devicesInputPorts = devicesInputPorts;
        self.devicesOutputPorts = devicesOutputPorts;
    }

    var slots;
    var slotPages;
    var primarySlotConfig = 0;

    var slotEmpty = wmsx.SlotEmpty.singleton;
    var deviceInputMissing = wmsx.DeviceMissing.inputPort;
    var deviceOutputMissing = wmsx.DeviceMissing.outputPort;

    var devices;

    var devicesInputPorts;
    var devicesOutputPorts;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            p: primarySlotConfig,
            s0: slots[0].saveState(),
            s1: slots[1].saveState(),
            s2: slots[2].saveState(),
            s3: slots[3].saveState()
        };
    };

    this.loadState = function(s) {
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s0, slots[0]), 0);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s1, slots[1]), 1);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s2, slots[2]), 2);
        this.insertSlot(wmsx.SlotCreator.recreateFromSaveState(s.s3, slots[3]), 3);
        this.setPrimarySlotConfig(s.p);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};