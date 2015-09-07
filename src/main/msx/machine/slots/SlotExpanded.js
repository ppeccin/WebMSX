// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Secondary Slot. Controls 4 subSlots. Can be used as a PrimarySlot
wmsx.SlotExpanded = function() {
    var self = this;

    function init() {
        create();
    }

    this.powerOn = function(paused) {
        for (var i = 0; i < 4; i++) subSlots[i].powerOn();
        this.setSecondarySlotConfig(0);
    };

    this.powerOff = function() {
        for (var i = 0; i < 4; i++) subSlots[i].powerOff();
    };

    this.insertSubSlot = function(subSlot, subSlotNumber) {
        subSlots[subSlotNumber] = subSlot;
        this.setSecondarySlotConfig(secondarySlotConfig);
    };

    this.getSubSlot = function(subSlotNumber) {
        return subSlots[subSlotNumber];
    };

    this.read = function(address) {
        // Check for control register
        if (address === 0xFFFF) return ~this.getSecondarySlotConfig();
        // Get correct subSlot
        return subSlotPages[address >>> 14].read(address);
    };

    this.write = function(address, val) {
        // Check for control register
        if (address === 0xFFFF) this.setSecondarySlotConfig(val);
        // Get correct subSlot
        else subSlotPages[address >>> 14].write(address, val);
    };

    this.setSecondarySlotConfig = function(val) {
        console.log("SecondarySlot Select: " + val.toString(16));
        secondarySlotConfig = val;
        subSlotPages[0] = subSlots[val & 0x03];
        subSlotPages[1] = subSlots[(val >>> 2) & 0x03];
        subSlotPages[2] = subSlots[(val >>> 4) & 0x03];
        subSlotPages[3] = subSlots[(val >>> 6)];
    };

    this.getSecondarySlotConfig = function() {
        console.log("SecondarySlot Query: " + secondarySlotConfig.toString(16));
        return secondarySlotConfig;
    };

    function create() {
        var emptySlot = new wmsx.SlotEmpty();
        subSlots =     [ emptySlot, emptySlot, emptySlot, emptySlot ];
        subSlotPages = [ emptySlot, emptySlot, emptySlot, emptySlot ];

        self.slots = subSlots;
        self.slotPages = subSlotPages;
    }

    var subSlots;
    var subSlotPages;
    var secondarySlotConfig = 0;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            s: secondarySlotConfig,
            s0: subSlots[0].saveState(),
            s1: subSlots[1].saveState(),
            s2: subSlots[2].saveState(),
            s3: subSlots[3].saveState()
        };
    };

    this.loadState = function(s) {
        subSlots[0] = wmsx.SlotCreator.createFromSaveState(s.s0);
        subSlots[1] = wmsx.SlotCreator.createFromSaveState(s.s0);
        subSlots[2] = wmsx.SlotCreator.createFromSaveState(s.s0);
        subSlots[3] = wmsx.SlotCreator.createFromSaveState(s.s0);
        this.setSecondarySlotConfig(s.s);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};