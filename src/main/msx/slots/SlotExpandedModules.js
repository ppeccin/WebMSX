// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Secondary Slot. Controls 4 subSlots. Must be used only as a PrimarySlot
// Special Expanded Slot for Modules (Device-only Slots). Memory is inaccessible!

wmsx.SlotExpandedModules = function() {
    "use strict";

    var self = this;

    function init() {
        create();
    }

    this.isExpanded = function() {
        return true;
    };

    this.connect = function(pMachine) {
        machine = pMachine;
        for (var s = 0; s < 4; ++s) subSlots[s].connect(machine);
    };

    this.refreshConnect = function() {
        for (var s = 0; s < 4; ++s) subSlots[s].refreshConnect();
    };

    this.disconnect = function(pMachine) {
        for (var s = 0; s < 4; ++s) subSlots[s].disconnect(pMachine);
        machine = null;
    };

    this.powerOn = function() {
        for (var s = 0; s < 4; s++) subSlots[s].powerOn();
    };

    this.powerOff = function() {
        for (var s = 0; s < 4; s++) subSlots[s].powerOff();
    };

    this.reset = function() {
        for (var s = 0; s < 4; s++) subSlots[s].reset();
    };

    this.isAllEmpty = function() {
        return subSlots[0] === EMPTY_SLOT && subSlots[1] === EMPTY_SLOT && subSlots[2] === EMPTY_SLOT && subSlots[3] === EMPTY_SLOT;
    };

    this.insertSubSlot = function(subSlot, subSlotNumber) {
        subSlot = subSlot || wmsx.SlotEmpty.singleton;
        if (subSlots[subSlotNumber] === subSlot) return;

        if (machine) subSlots[subSlotNumber].disconnect(machine);
        subSlots[subSlotNumber] = subSlot;
        if (machine) subSlots[subSlotNumber].connect(machine);
    };

    this.getSubSlot = function(subSlotNumber) {
        return subSlots[subSlotNumber];
    };

    this.getSubSlotForAddress = function(address) {
        // Not needed
    };

    this.read = function(address) {
        // Not needed
    };

    this.write = function(address, val) {
        // Not needed
    };

    this.setSecondarySlotConfig = function(val) {
        // Not needed
    };

    this.getSecondarySlotConfig = function() {
        // Not needed
    };

    this.cpuExtensionBegin = function(s) {
        // Not needed
    };

    this.cpuExtensionFinish = function(s) {
        // Not needed
    };

    function create() {
        subSlots = [ EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT ];

        self.subSlots = subSlots;
    }


    var machine;

    var subSlots;

    var EMPTY_SLOT = wmsx.SlotEmpty.singleton;

    this.format = wmsx.SlotFormats.ExpandedM;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
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
    };


    init();

};

wmsx.SlotExpandedModules.recreateFromSaveState = function(state, previousSlot) {
    var expandedSlot = previousSlot || new wmsx.SlotExpandedModules();
    expandedSlot.loadState(state);
    return expandedSlot;
};