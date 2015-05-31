// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// BUS interface, mapped to the configured slots and devices. No expanded slots
function EngineBUS(cpu, ppi, vdp, psg) {
    var self = this;

    function init() {
        create();
        setupMachine();
    }

    this.powerOn = function(paused) {
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
    };

    this.setBIOS = function(pBios) {
        bios = pBios;
        slots[0] = bios || new SlotEmpty();
        this.setPrimarySlotConfig(0);
    };

    this.getBIOS = function() {
        return bios;
    };

    this.setCartridge = function(pCartridge) {
        cartridge = pCartridge;
        slots[1] = cartridge || new SlotEmpty();
        this.setPrimarySlotConfig(primarySlotConfig);
    };

    this.getCartridge = function() {
        return cartridge;
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
        return devicesInputPorts[port & 255](port & 255);
    };

    this.output = function(port, val) {
        // Get correct device
        devicesOutputPorts[port & 255](port & 255, val);
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
        var emptySlot = new SlotEmpty();
        slots =     [ emptySlot, emptySlot, emptySlot, emptySlot ];
        slotPages = [ emptySlot, emptySlot, emptySlot, emptySlot ];

        var deviceMissing = new DeviceMissing();
        devicesInputPorts =  Util.arrayFill(new Array(256), deviceMissing.inputPort);
        devicesOutputPorts = Util.arrayFill(new Array(256), deviceMissing.outputPort);

        this.slots = slots;
        this.slotPages = slotPages;
        this.devicesInputPorts = devicesInputPorts;
        this.devicesOutputPorts = devicesOutputPorts;
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
        devicesOutputPorts[0xab] = ppi.outputAA;

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
        MSX.ram = slots[2] = SlotRAM64K.createNewEmpty();

        self.setPrimarySlotConfig(0);
    }

    var slots;
    var slotPages;
    var primarySlotConfig = 0;

    var devicesInputPorts;
    var devicesOutputPorts;

    var bios;
    var cartridge;


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
        slots[0] = SlotCreator.createFromSaveState(s.s0);
        slots[1] = SlotCreator.createFromSaveState(s.s1);
        slots[2] = SlotCreator.createFromSaveState(s.s2);
        slots[3] = SlotCreator.createFromSaveState(s.s3);
        this.setPrimarySlotConfig(s.p);
    };


    init();

}