// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Partitioned Slot. Controls up to 4 subSlots. Allows a different subSlot to appear at each of the 4 pages
// 0x0000 - 0xffff

wmsx.SlotPartitioned = function() {
    var self = this;

    function init() {
        create();
    }

    this.connect = function(pMachine) {
        machine = pMachine;
        var slot;
        for (var p = 0; p < 4; p++) {
            slot = getSubSlotUnique(p);
            if (slot) slot.connect(machine);
        }
    };

    this.disconnect = function(pMachine) {
        var slot;
        for (var p = 0; p < 4; p++) {
            slot = getSubSlotUnique(p);
            if (slot) slot.disconnect(machine);
        }
        machine = null;
    };

    this.powerOn = function() {
        var slot;
        for (var p = 0; p < 4; p++) {
            slot = getSubSlotUnique(p);
            if (slot) slot.powerOn();
        }
    };

    this.powerOff = function() {
        var slot;
        for (var p = 0; p < 4; p++) {
            slot = getSubSlotUnique(p);
            if (slot) slot.powerOff();
        }
    };

    this.reset = function() {
        var slot;
        for (var p = 0; p < 4; p++) {
            if (subSlotPages[p] === slot) continue;     // avoids repeated operation on the same slot
            slot = subSlotPages[p];
            slot.reset();
        }
    };

    this.insertSubSlot = function(slot) {
        var addStart = slot.addressRange[0];        // automatically place the slot on the proper pages
        var addEnd =   slot.addressRange[1];
        var pAdd = 0;
        for (var p = 0; p < 4; p++) {
            if (pAdd >= addStart && pAdd <= addEnd) {
                if (subSlotPages[p] !== emptySlot) removeSubSlot(p);
                subSlotPages[p] = slot;
            }
            pAdd += 0x4000;
        }
        if (machine) slot.connect(machine);
    };

    this.getSubSlot = function(page) {
        return subSlotPages[page];
    };

    this.read = function(address) {
        // Get correct slot
        return subSlotPages[address >>> 14].read(address);
    };

    this.write = function(address, val) {
        // Get correct slot
        subSlotPages[address >>> 14].write(address, val);
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
        subSlotPages = [ emptySlot, emptySlot, emptySlot, emptySlot ];
        self.subSlotPages = subSlotPages;
    }

    // Used to avoid repeated operations on the same subSlot
    function getSubSlotUnique(num) {
        return num === 0 ? subSlotPages[0] : subSlotPages[num - 1] === subSlotPages[num] ? null : subSlotPages[num];
    }

    function removeSubSlot(num) {
        var slot = subSlotPages[num];
        if (!slot) return;
        for (var s = 0; s < 4; s++)
            if (subSlotPages[s] === slot) subSlotPages[s] = emptySlot;
        if (machine) slot.disconnect(machine);
    }


    var machine;

    var subSlotPages;
    var secondarySlotConfig = 0;

    var emptySlot = wmsx.SlotEmpty.singleton;

    this.format = wmsx.SlotFormats.SlotExpanded;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        var slot;
        return {
            f: this.format.name,
            p0: (slot = getSubSlotUnique(0)) ? slot.saveState() : null,
            p1: (slot = getSubSlotUnique(1)) ? slot.saveState() : null,
            p2: (slot = getSubSlotUnique(2)) ? slot.saveState() : null,
            p3: (slot = getSubSlotUnique(3)) ? slot.saveState() : null
        };
    };

    this.loadState = function(s) {
        if (s.p0) this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.p0, subSlotPages[0]));
        if (s.p1) this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.p1, subSlotPages[1]));
        if (s.p2) this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.p2, subSlotPages[2]));
        if (s.p3) this.insertSubSlot(wmsx.SlotCreator.recreateFromSaveState(s.p3, subSlotPages[3]));
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};

wmsx.SlotPartitioned.prototype = wmsx.Slot.base;

wmsx.SlotPartitioned.recreateFromSaveState = function(state, previousSlot) {
    var partitionedSlot = previousSlot || new wmsx.SlotPartitioned();
    partitionedSlot.loadState(state);
    return partitionedSlot;
};