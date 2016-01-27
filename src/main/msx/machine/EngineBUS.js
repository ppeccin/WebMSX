// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// BUS interface. Controls 4 Primary Slots and I/O Device Ports
wmsx.EngineBUS = function(machine, cpu) {
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
        slots[slotNumber].disconnect(machine);
        slots[slotNumber] = slot;
        slot.connect(machine);
        this.setPrimarySlotConfig(primarySlotConfig);
    };

    this.getSlot = function(slotNumber) {
        return slots[slotNumber];
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
        var p = devicesInputPorts[port & 255];

        if (p === wmsx.DeviceMissing.inputPort && !wmsx.Util.arrayHasElement(wmsx.DeviceMissing.IGNORED_PORTS, port & 255)) return console.log("Missing IN " + (port & 255).toString(16));

        return p();
    };

    this.output = function(port, val) {
        // Get correct device
        var p = devicesOutputPorts[port & 255];

        if (p === wmsx.DeviceMissing.outputPort && !wmsx.Util.arrayHasElement(wmsx.DeviceMissing.IGNORED_PORTS, port & 255)) return console.log("Missing OUT " + (port & 255).toString(16) + ", " + val.toString(16));

        p(val);
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

    this.disconnectInputDevice = function(port) {
        devicesInputPorts[port] = wmsx.DeviceMissing.inputPort;
    };

    this.disconnectOutputDevice = function(port) {
        devicesOutputPorts[port] = wmsx.DeviceMissing.outputPort;
    };

    function create() {
        var emptySlot = wmsx.SlotEmpty.singleton;
        slots =     [ emptySlot, emptySlot, emptySlot, emptySlot ];
        slotPages = [ emptySlot, emptySlot, emptySlot, emptySlot ];

        devicesInputPorts =  wmsx.Util.arrayFill(new Array(256), wmsx.DeviceMissing.inputPort);
        devicesOutputPorts = wmsx.Util.arrayFill(new Array(256), wmsx.DeviceMissing.outputPort);

        self.slots = slots;
        self.slotPages = slotPages;
        self.devicesInputPorts = devicesInputPorts;
        self.devicesOutputPorts = devicesOutputPorts;

        // Receive all CPU Extensions
        cpu.setExtensionHandler([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], self);
    }


    var devicesInputPorts;
    var devicesOutputPorts;

    var slots;
    var slotPages;
    var primarySlotConfig = 0;


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
        this.insertSlot(wmsx.SlotCreator.createFromSaveState(s.s0), 0);
        this.insertSlot(wmsx.SlotCreator.createFromSaveState(s.s1), 1);
        this.insertSlot(wmsx.SlotCreator.createFromSaveState(s.s2), 2);
        this.insertSlot(wmsx.SlotCreator.createFromSaveState(s.s3), 3);
        this.setPrimarySlotConfig(s.p);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};