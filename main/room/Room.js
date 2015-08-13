// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Room = function(screenElement, machinePanelElement, biosProvided) {
    var self = this;

    function init() {
        buildPeripherals();
        buildAndPlugMachine();
    }

    this.powerOn = function(paused) {

        TestMachine();          // TODO Remove

        setPageVisibilityHandling();
        self.screen.powerOn();
        if (self.machinePanel) this.machinePanel.powerOn();
        self.speaker.powerOn();
        self.keyboard.powerOn();
        insertBIOSProvided();
        // TODO insert Cartridge and Tape provided
        if (self.machine.getBIOSSocket().inserted() && !self.machine.powerIsOn) self.machine.powerOn(paused);
    };

    this.powerOff = function() {
        self.machine.powerOff();
        self.keyboard.powerOff();
        self.speaker.powerOff();
        self.screen.powerOff();
        if (self.machinePanel) this.machinePanel.powerOff();
    };

    var insertBIOSProvided = function() {
        if (biosProvided) self.machine.getBIOSSocket().insert(biosProvided, false);
    };

    var insertRomProvidedIfNoneInserted = function() {
        //if (self.machine.getCartridgeSocket().inserted()) return;
        //if (cartridgeProvided) self.machine.getCartridgeSocket().insert(cartridgeProvided, false);
    };

    var setPageVisibilityHandling = function() {
        function visibilityChange() {
            if (document.hidden) self.speaker.mute();
            else self.speaker.play();
        }
        document.addEventListener("visibilitychange", visibilityChange);
    };

    var buildPeripherals = function() {
        self.fileDownloader = new wmsx.FileDownloader();
        self.stateMedia = new wmsx.LocalStorageSaveStateMedia();
        self.cassetteDeck = new wmsx.FileCassetteDeck();
        self.fileLoader = new wmsx.FileLoader();
        self.screen = new wmsx.CanvasDisplay(screenElement);
        self.speaker = new wmsx.WebAudioSpeaker();
        self.keyboard = new wmsx.DOMKeyboard();
        self.machineControls = new wmsx.DOMMachineControls();
        if (machinePanelElement) self.machinePanel = new wmsx.MachinePanel(machinePanelElement);

        self.fileLoader.connectPeripherals(self.cassetteDeck);
        self.screen.connectPeripherals(self.fileLoader, self.fileDownloader, self.cassetteDeck);
        self.machineControls.connectPeripherals(self.screen, self.machinePanel);
        self.keyboard.connectPeripherals(self.screen, self.machinePanel);
        self.stateMedia.connectPeripherals(self.fileDownloader);
        self.cassetteDeck.connectPeripherals(self.screen, self.fileDownloader);
        if (self.machinePanel) self.machinePanel.connectPeripherals(self.screen, self.fileLoader);
   };

    var buildAndPlugMachine = function() {
        self.machine = new wmsx.Machine();
        self.stateMedia.connect(self.machine.getSavestateSocket());
        self.fileLoader.connect(self.machine.getBIOSSocket(), self.machine.getCartridgeSocket(), self.machine.getSavestateSocket());
        self.screen.connect(self.machine.getVideoOutput(), self.machine.getMachineControlsSocket(), self.machine.getCartridgeSocket());
        if (self.machinePanel) self.machinePanel.connect(self.machine.getMachineControlsSocket(), self.machine.getCartridgeSocket(), self.controls);
        self.speaker.connect(self.machine.getAudioOutput());
        self.machineControls.connect(self.machine.getMachineControlsSocket());
        self.keyboard.connect(self.machine.getKeyboardSocket());
        self.cassetteDeck.connect(self.machine.getCassetteSocket());
    };


    this.machine = null;
    this.screen = null;
    this.machinePanel = null;
    this.speaker = null;
    this.machineControls = null;
    this.keyboard = null;
    this.fileDownloader = null;
    this.cassetteDeck = null;
    this.stateMedia = null;
    this.fileLoader = null;


    init();

};

