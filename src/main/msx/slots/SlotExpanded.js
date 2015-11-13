// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Secondary Slot. Controls 4 subSlots. Can be used as a PrimarySlot
wmsx.SlotExpanded = function() {
    var self = this;

    function init() {
        create();
    }

    this.connect = function(pMachine) {
        machine = pMachine;
        subSlots[0].connect(machine);
        subSlots[1].connect(machine);
        subSlots[2].connect(machine);
        subSlots[3].connect(machine);
    };

    this.disconnect = function(pMachine) {
        subSlots[0].disconnect(machine);
        subSlots[1].disconnect(machine);
        subSlots[2].disconnect(machine);
        subSlots[3].disconnect(machine);
        machine = null;
    };

    this.powerOn = function() {
        this.setSecondarySlotConfig(0);
        for (var i = 0; i < 4; i++) subSlots[i].powerOn();
    };

    this.powerOff = function() {
        for (var i = 0; i < 4; i++) subSlots[i].powerOff();
    };

    this.reset = function() {
        this.setSecondarySlotConfig(0);
        for (var i = 0; i < 4; i++) subSlots[i].reset();
    };

    this.insertSubSlot = function(subSlot, subSlotNumber) {
        if (machine) subSlots[subSlotNumber].disconnect(machine);
        subSlots[subSlotNumber] = subSlot;
        if (machine) subSlot.connect(machine);
        this.setSecondarySlotConfig(secondarySlotConfig);
    };

    this.getSubSlot = function(subSlotNumber) {
        return subSlots[subSlotNumber];
    };

    this.read = function(address) {
        // Check for control register
        if (address === 0xffff) return (~secondarySlotConfig) & 0xff;       // Inverted per specification
        // Get correct subSlot
        return subSlotPages[address >>> 14].read(address);
    };

    this.write = function(address, val) {
        // Check for control register
        if (address === 0xffff) this.setSecondarySlotConfig(val);
        // Get correct subSlot
        else subSlotPages[address >>> 14].write(address, val);
    };

    this.setSecondarySlotConfig = function(val) {
        // wmsx.Util.log("SecondarySlot Select: " + val.toString(16));
        secondarySlotConfig = val;
        subSlotPages[0] = subSlots[val & 0x03];
        subSlotPages[1] = subSlots[(val >>> 2) & 0x03];
        subSlotPages[2] = subSlots[(val >>> 4) & 0x03];
        subSlotPages[3] = subSlots[(val >>> 6)];
    };

    this.getSecondarySlotConfig = function() {
        // wmsx.Util.log("SecondarySlot Query: " + secondarySlotConfig.toString(16));
        return secondarySlotConfig;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return subSlotPages[s.extPC >>> 14].cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return subSlotPages[s.extPC >>> 14].cpuExtensionFinish(s);
    };

    function create() {
        var emptySlot = wmsx.SlotEmpty.singleton;
        subSlots =     [ emptySlot, emptySlot, emptySlot, emptySlot ];
        subSlotPages = [ emptySlot, emptySlot, emptySlot, emptySlot ];

        self.subSlots = subSlots;
        self.subSlotPages = subSlotPages;
    }


    var machine;

    var subSlots;
    var subSlotPages;
    var secondarySlotConfig = 0;

    this.format = wmsx.SlotFormats.SlotExpanded;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            s: secondarySlotConfig,
            s0: subSlots[0].saveState(),
            s1: subSlots[1].saveState(),
            s2: subSlots[2].saveState(),
            s3: subSlots[3].saveState()
        };
    };

    this.loadState = function(s) {
        this.insertSubSlot(wmsx.SlotCreator.createFromSaveState(s.s0), 0);
        this.insertSubSlot(wmsx.SlotCreator.createFromSaveState(s.s1), 1);
        this.insertSubSlot(wmsx.SlotCreator.createFromSaveState(s.s2), 2);
        this.insertSubSlot(wmsx.SlotCreator.createFromSaveState(s.s3), 3);
        this.setSecondarySlotConfig(s.s);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};

wmsx.SlotExpanded.prototype = wmsx.Slot.base;

wmsx.SlotExpanded.createFromSaveState = function(state) {
    var expandedSlot = new wmsx.SlotExpanded();
    expandedSlot.loadState(state);
    return expandedSlot;
};