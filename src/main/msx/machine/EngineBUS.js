// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// BUS interface. Controls 4 Primary Slots and I/O Device Ports
wmsx.EngineBUS = function(machine, cpu, ppi, vdp, psg) {
    var self = this;

    function init() {
        create();
        setupMachine();
    }

    this.powerOn = function(paused) {
        for (var i = 0; i < 4; i++) slots[i].powerOn();
        this.setPrimarySlotConfig(0);
        ppi.powerOn();
        psg.powerOn();
        vdp.powerOn();
        cpu.powerOn();
    };

    this.powerOff = function() {
        cpu.powerOff();
        vdp.powerOff();
        psg.powerOff();
        ppi.powerOff();
        for (var i = 0; i < 4; i++) slots[i].powerOff();
    };

    this.reset = function(paused) {
        this.setPrimarySlotConfig(0);
        cpu.reset();
    };

    this.setBIOS = function(pBios) {
        if (bios) bios.disconnect(machine);
        bios = pBios;
        if (bios) bios.connect(machine);
        slots[0] = bios || new wmsx.SlotEmpty();
        this.setPrimarySlotConfig(0);
    };

    this.getBIOS = function() {
        return bios;
    };

    this.setCartridge = function(pCartridge, port) {
        var slot = pCartridge || new wmsx.SlotEmpty();
        if (port === 1) {
            if (cartridge1) cartridge1.disconnect(machine);
            cartridge1 = slot.format === wmsx.SlotFormats.Empty ? null : pCartridge;
            if (cartridge1) cartridge1.connect(machine);
            slots[3].insertSubSlot(slot, 1);
        } else {
            if (cartridge0) cartridge0.disconnect(machine);
            cartridge0 = slot.format === wmsx.SlotFormats.Empty ? null : pCartridge;
            if (cartridge0) cartridge0.connect(machine);
            slots[1] = slot;
        }
        this.setPrimarySlotConfig(primarySlotConfig);
    };

    this.getCartridge = function(port) {
        return port === 1 ? cartridge1 : cartridge0;
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
        return devicesInputPorts[port & 255]();
    };

    this.output = function(port, val) {
        // Get correct device
        devicesOutputPorts[port & 255](val);
    };

    this.setPrimarySlotConfig = function(val) {
        //console.log("PrimarySlot Select: " + val.toString(16));
        primarySlotConfig = val;
        slotPages[0] = slots[val & 0x03];
        slotPages[1] = slots[(val >>> 2) & 0x03];
        slotPages[2] = slots[(val >>> 4) & 0x03];
        slotPages[3] = slots[(val >>> 6)];
    };

    this.getPrimarySlotConfig = function() {
        //console.log("PrimarySlot Query: " + primarySlotConfig.toString(16));
        return primarySlotConfig;
    };

    function create() {
        var emptySlot = new wmsx.SlotEmpty();
        slots =     [ emptySlot, emptySlot, emptySlot, emptySlot ];
        slotPages = [ emptySlot, emptySlot, emptySlot, emptySlot ];

        var deviceMissing = new wmsx.DeviceMissing();
        devicesInputPorts =  wmsx.Util.arrayFill(new Array(256), deviceMissing.inputPort);
        devicesOutputPorts = wmsx.Util.arrayFill(new Array(256), deviceMissing.outputPort);

        self.slots = slots;
        self.slotPages = slotPages;
        self.devicesInputPorts = devicesInputPorts;
        self.devicesOutputPorts = devicesOutputPorts;
    }

    function setupMachine() {                       // Like a Gradiente Expert 1.1
        cpu.connectBus(self);
        ppi.connectEngine(self);
        vdp.connectEngine(self);
        psg.connectEngine(self);

        // PPI
        devicesInputPorts[0xa8]  = ppi.inputA8;
        devicesOutputPorts[0xa8] = ppi.outputA8;
        devicesInputPorts[0xa9]  = ppi.inputA9;
        devicesInputPorts[0xaa]  = ppi.inputAA;
        devicesOutputPorts[0xaa] = ppi.outputAA;
        devicesOutputPorts[0xab] = ppi.outputAB;

        // VDP
        devicesInputPorts[0x98]  = vdp.input98;
        devicesOutputPorts[0x98] = vdp.output98;
        devicesInputPorts[0x99]  = vdp.input99;
        devicesOutputPorts[0x99] = vdp.output99;

        // PSG
        devicesOutputPorts[0xa0] = psg.outputA0;
        devicesOutputPorts[0xa1] = psg.outputA1;
        devicesInputPorts[0xa2]  = psg.inputA2;

        // RAM
        WMSX.ram = slots[2] = wmsx.SlotRAM64K.createNewEmpty();

        // Expanded Slot at 3
        WMSX.expandedSlot = slots[3] = new wmsx.SlotExpanded();

        self.setPrimarySlotConfig(0);
    }

    var devicesInputPorts;
    var devicesOutputPorts;

    var slots;
    var slotPages;
    var primarySlotConfig = 0;

    var bios;
    var cartridge0;
    var cartridge1;


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
        this.setBIOS(wmsx.SlotCreator.createFromSaveState(s.s0));
        this.setCartridge(wmsx.SlotCreator.createFromSaveState(s.s1), 0);
        WMSX.ram = slots[2] = wmsx.SlotCreator.createFromSaveState(s.s2);
        this.setCartridge(wmsx.SlotCreator.createFromSaveState(s.s3), 1);
        this.setPrimarySlotConfig(s.p);
    };


    init();


    this.eval = function(str) {
        return eval(str);
    };

};