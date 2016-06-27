// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Secondary Slot. Controls 4 subSlots. Must be used only as a PrimarySlot
// 0x0000 - 0xffff

wmsx.SlotExpanded3 = function() {
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
        subSlot = subSlot || wmsx.SlotEmpty.singleton;
        if (subSlots[subSlotNumber] === subSlot) return;

        if (machine) subSlots[subSlotNumber].disconnect(machine);
        subSlots[subSlotNumber] = subSlot;
        if (machine) subSlots[subSlotNumber].connect(machine);

        switch (subSlotNumber) {
            case 0: subSlot0 = subSlot; return;
            case 1: subSlot1 = subSlot; return;
            case 2: subSlot2 = subSlot; return;
            case 3: subSlot3 = subSlot; return;
        }
    };

    this.getSubSlot = function(subSlotNumber) {
        return subSlots[subSlotNumber];
    };

    function getSubSlotForAddress(address) {
        switch ((secondarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: return subSlot0;
            case 1: return subSlot1;
            case 2: return subSlot2;
            case 3: return subSlot3;
        }
    }
    this.getSubSlotForAddress = getSubSlotForAddress;

    this.read = function(address) {
        // Check for control register
        if (address === 0xffff) return (~secondarySlotConfig) & 0xff;       // Inverted per specification
        // Get correct subSlot
        switch ((secondarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: return subSlot0.read(address);
            case 1: return subSlot1.read(address);
            case 2: return subSlot2.read(address);
            case 3: return subSlot3.read(address);
        }
    };

    this.write = function(address, val) {
        // Check for control register
        if (address === 0xffff) this.setSecondarySlotConfig(val);
        // Get correct subSlot
        switch ((secondarySlotConfig >> ((address >> 14) << 1)) & 3) {
            case 0: subSlot0.write(address, val); return;
            case 1: subSlot1.write(address, val); return;
            case 2: subSlot2.write(address, val); return;
            case 3: subSlot3.write(address, val); return;
        }
    };

    this.setSecondarySlotConfig = function(val) {
        // wmsx.Util.log("SecondarySlot Select: " + val.toString(16));
        secondarySlotConfig = val;
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
        var emptySlot = wmsx.SlotEmpty.singleton;
        subSlot0 = subSlot1 = subSlot2 = subSlot3 = emptySlot;
        subSlots = [ subSlot0, subSlot1, subSlot2, subSlot3 ];

        self.subSlots = subSlots;
    }


    var machine;

    var subSlots;
    var subSlot0, subSlot1, subSlot2, subSlot3;
    var secondarySlotConfig = 0;

    this.format = wmsx.SlotFormats.Expanded3;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            s: secondarySlotConfig,
            s0: subSlot0.saveState(),
            s1: subSlot1.saveState(),
            s2: subSlot2.saveState(),
            s3: subSlot3.saveState()
        };
    };

    this.loadState = function(s) {
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s0, subSlot0), 0);
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s1, subSlot1), 1);
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s2, subSlot2), 2);
        this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.s3, subSlot3), 3);
        this.setSecondarySlotConfig(s.s);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};

//wmsx.SlotExpanded3.prototype = wmsx.Slot.base;

wmsx.SlotExpanded3.recreateFromSaveState = function(state, previousSlot) {
    var expandedSlot = previousSlot || new wmsx.SlotExpanded3();
    expandedSlot.loadState(state);
    return expandedSlot;
};