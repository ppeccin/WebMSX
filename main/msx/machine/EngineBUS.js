// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// BUS interface, mapped to the configured slots and devices. No expanded slots
function EngineBUS(cpu, ppi, vdp, psg) {
    var self = this;

    function init() {
        setup();
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

    this.insertBIOS = function(bios) {
        slots[0] = new SlotROM64K(bios.rom.content);
        this.setPrimarySlotConfig(0);
    };

    this.read = function(address) {
        // Special meaning for address 0xffff: secondary slot selection
        //if (address === 0xffff) this.getSecondarySlotConfig();

        // Get correct slot
        return slotPages[address >>> 14].read(address);
    };

    this.write = function(address, val) {
        // Special meaning for address 0xffff: secondary slot selection
        //if (address === 0xffff) this.setSecondarySlotConfig(val);

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

    this.setSecondarySlotConfig = function(val) {
        //console.log("SecondarySlot Select try: " + val.toString(16));
    };

    this.getSecondarySlotConfig = function() {
        //console.log("SecondarySlot Query try");
    };

    function setup() {
        cpu.connectBus(self);
        ppi.connectEngine(self);
        vdp.connectEngine(self);
        psg.connectEngine(self);

        devicesInputPorts[0xa8]  = ppi.inputA8;
        devicesOutputPorts[0xa8] = ppi.outputA8;
        devicesInputPorts[0xa9]  = ppi.inputA9;
        devicesInputPorts[0xaa]  = ppi.inputAA;
        devicesOutputPorts[0xaa] = ppi.outputAA;
        devicesOutputPorts[0xab] = ppi.outputAA;

        devicesInputPorts[0x98]  = vdp.input98;
        devicesOutputPorts[0x98] = vdp.output98;
        devicesInputPorts[0x99]  = vdp.input99;
        devicesOutputPorts[0x99] = vdp.output99;

        devicesOutputPorts[0xa0] = psg.outputA0;
        devicesOutputPorts[0xa1] = psg.outputA1;
        devicesInputPorts[0xa2]  = psg.inputA2;

        slots[2] = new SlotRAM64K();

        self.setPrimarySlotConfig(0);
    }


    // Default empty initial configuration

    var emptySlot = {
        read: function (address) {
            //console.log ("Empty Read " + address.toString(16));
            return 0xff;
        },
        write: function (address, val) {
            //console.log ("Empty Write " + address.toString(16) + ", " + val.toString(16));
        }
    };

    var emptyDevice = {
        inputPort:  function(port) {
            console.log ("Empty IN " + port.toString(16));
            return 0xff
        },
        outputPort: function(port, val) {
            //console.log ("Empty OUT " + port.toString(16) + ", " + val.toString(16));
        }
    };


    var primarySlotConfig =   0;

    var slots =     [ emptySlot, emptySlot, emptySlot, emptySlot ];
    var slotPages = [ emptySlot, emptySlot, emptySlot, emptySlot ];

    var devicesInputPorts =  Util.arrayFill(new Array(256), emptyDevice.inputPort);
    var devicesOutputPorts = Util.arrayFill(new Array(256), emptyDevice.outputPort);

    this.slots = slots;
    this.slotPages = slotPages;
    this.devicesInputPorts = devicesInputPorts;
    this.devicesOutputPorts = devicesOutputPorts;


    init();

}