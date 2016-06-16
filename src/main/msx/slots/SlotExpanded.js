// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Secondary Slot. Controls 4 subSlots. Must be used only as a PrimarySlot
// 0x0000 - 0xffff

wmsx.SlotExpanded = function() {
    var self = this;

    function init() {
        create();
    }

    this.isExpanded = function() {
        return true;
    };

    this.connect = function(pMachine) {
        machine = pMachine;
        for (var s = 0; s < 4; s++) subSlots[s].connect(machine);
    };

    this.disconnect = function(pMachine) {
        for (var s = 0; s < 4; s++) subSlots[s].disconnect(pMachine);
        machine = null;
    };

    this.powerOn = function() {
        this.setSecondarySlotConfig(0);
        for (var s = 0; s < 4; s++) subSlots[s].powerOn();
    };

    this.powerOff = function() {
        for (var s = 0; s < 4; s++) subSlots[s].powerOff();
    };

    this.reset = function() {
        this.setSecondarySlotConfig(0);
        for (var s = 0; s < 4; s++) subSlots[s].reset();
    };

    this.insertSubSlot = function(subSlot, subSlotNumber) {
        if (subSlots[subSlotNumber] === subSlot) return;

        if (machine) subSlots[subSlotNumber].disconnect(machine);
        subSlots[subSlotNumber] = subSlot || wmsx.SlotEmpty.singleton;
        if (machine) subSlots[subSlotNumber].connect(machine);
        this.setSecondarySlotConfig(secondarySlotConfig);
    };

    this.getSubSlot = function(subSlotNumber) {
        return subSlots[subSlotNumber];
    };

    this.getSubSlotForAddress = function(address) {
        return subSlotPages[address >>> 14];
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

    this.format = wmsx.SlotFormats.Expanded;


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
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s0, subSlots[0]), 0);
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s1, subSlots[1]), 1);
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s2, subSlots[2]), 2);
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s3, subSlots[3]), 3);
        this.setSecondarySlotConfig(s.s);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};

wmsx.SlotExpanded.prototype = wmsx.Slot.base;

wmsx.SlotExpanded.recreateFromSaveState = function(state, previousSlot) {
    var expandedSlot = previousSlot || new wmsx.SlotExpanded();
    expandedSlot.loadState(state);
    return expandedSlot;
};