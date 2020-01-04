// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Special Expanded Slot 3. Controls 4 subSlots. Must be used only as a PrimarySlot
// 0x0000 - 0xffff

wmsx.SlotExpanded3 = function() {
    "use strict";

    var self = this;

    function init() {
        // console.log("Creating Expanded3");

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

    this.isAllEmpty = function() {
        return subSlots[0] === EMPTY_SLOT && subSlots[1] === EMPTY_SLOT && subSlots[2] === EMPTY_SLOT && subSlots[3] === EMPTY_SLOT;
    };

    this.insertSubSlot = function(subSlot, subSlotNumber) {
        subSlot = subSlot || wmsx.SlotEmpty.singleton;
        if (subSlots[subSlotNumber] === subSlot) return;

        if (machine) subSlots[subSlotNumber].disconnect(machine);
        subSlots[subSlotNumber] = subSlot;
        if (machine) subSlots[subSlotNumber].connect(machine);

        this.setSecondarySlotConfig(secondarySlotConfig);
    };

    this.getSubSlot = function(subSlotNumber) {
        return subSlots[subSlotNumber];
    };

    function getSubSlotForAddress(address) {
        var s = address >> 14;
        if (s === 0) return page0Slot;
        if (s === 1) return page1Slot;
        if (s === 2) return page2Slot;
                     return page3Slot;
    }
    this.getSubSlotForAddress = getSubSlotForAddress;

    this.read = function(address) {
        var s = address >> 14;
        if (s === 0) return page0Slot.read(address);
        if (s === 1) return page1Slot.read(address);
        if (s === 2) return page2Slot.read(address);
        // Check for control register
        if (address === 0xffff) return (~secondarySlotConfig) & 0xff;       // Inverted per specification
                     return page3Slot.read(address);
    };

    this.write = function(address, val) {
        var s = address >> 14;
        if      (s === 0)   page0Slot.write(address, val);
        else if (s === 3) {
            // Check for control register
            if (address === 0xffff) this.setSecondarySlotConfig(val);
            else            page3Slot.write(address, val);
        } else if (s === 1) page1Slot.write(address, val);
         else               page2Slot.write(address, val);
    };

    this.setSecondarySlotConfig = function(val) {
        // wmsx.Util.log("SecondarySlot Select: " + val.toString(16));
        secondarySlotConfig = val;
        page0Slot = subSlots[val & 3];
        page1Slot = subSlots[(val >> 2) & 3];
        page2Slot = subSlots[(val >> 4) & 3];
        page3Slot = subSlots[(val >> 6) & 3];
    };

    this.getSecondarySlotConfig = function() {
        // wmsx.Util.log("SecondarySlot Query: " + secondarySlotConfig.toString(16));
        return secondarySlotConfig;
    };

    this.cpuExtensionBegin = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return getSubSlotForAddress(s.extPC).cpuExtensionBegin(s);
    };

    this.cpuExtensionFinish = function(s) {
        // Receive all CPU Extensions and pass to slot at instruction
        return getSubSlotForAddress(s.extPC).cpuExtensionFinish(s);
    };

    function create() {
        subSlots = [ EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT ];

        self.subSlots = subSlots;
    }


    var machine;

    var subSlots;
    var secondarySlotConfig = 0;

    var page0Slot, page1Slot, page2Slot, page3Slot;

    var EMPTY_SLOT = wmsx.SlotEmpty.singleton;

    this.format = wmsx.SlotFormats.Expanded3;

    this.formatBack = wmsx.SlotFormats.Expanded;


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

};

wmsx.SlotExpanded3.prototype = wmsx.Slot.base;

wmsx.SlotExpanded3.recreateFromSaveState = function(state, previousSlot) {
    var expandedSlot = previousSlot || new wmsx.SlotExpanded3();
    expandedSlot.loadState(state);
    return expandedSlot;
};