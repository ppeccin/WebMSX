// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Room = function(screenElement) {
"use strict";

    var self = this;

    function init() {
        buildPeripherals();
        buildAndPlugMachine();
    }

    this.powerOn = function(paused) {
        setPageVisibilityHandling();
        self.screen.powerOn();
        self.speaker.powerOn();
        self.controllersHub.powerOn();
        if (self.machine.getBIOSSocket().inserted() && !self.machine.powerIsOn) self.machine.powerOn(paused);
    };

    this.powerOff = function() {
        self.machine.powerOff();
        self.controllersHub.powerOff();
        self.speaker.powerOff();
        self.screen.powerOff();
    };

    this.loading = function(boo) {
        this.machine.loading(boo);
        this.screen.loading(boo);
    };

    this.exit = function() {
        self.machine.getMachineControlsSocket().controlStateChanged(wmsx.MachineControls.POWER_OFF, true);
        self.peripheralControls.controlActivated(wmsx.PeripheralControls.SCREEN_DEFAULTS);
    };

    var setPageVisibilityHandling = function() {
        var wasPaused;
        function visibilityChange() {
            if (document.hidden) wasPaused = self.machine.systemPause(true);
            else if (!wasPaused) self.machine.systemPause(false);
        }
        document.addEventListener("visibilitychange", visibilityChange);
    };

    var buildPeripherals = function() {
        self.peripheralControls = new wmsx.DOMPeripheralControls();
        self.machineControls = new wmsx.DOMMachineControls(self.peripheralControls);
        self.controllersHub = new wmsx.ControllersHub(self.machineControls);
        self.keyboard = self.controllersHub.getKeyboard();
        self.fileDownloader = new wmsx.FileDownloader();
        self.stateMedia = new wmsx.LocalStorageSaveStateMedia();
        self.cassetteDeck = new wmsx.FileCassetteDeck();
        self.diskDrive = new wmsx.FileDiskDrive();
        self.fileLoader = new wmsx.FileLoader();
        self.screen = new wmsx.CanvasDisplay(screenElement);
        self.speaker = new wmsx.WebAudioSpeaker();

        self.fileLoader.connectPeripherals(self.cassetteDeck, self.diskDrive);
        self.fileDownloader.connectPeripherals(self.screen);
        self.screen.connectPeripherals(self.fileLoader, self.fileDownloader, self.peripheralControls, self.controllersHub, self.diskDrive);
        self.machineControls.connectPeripherals(self.screen);
        self.controllersHub.connectPeripherals(self.screen);
        self.stateMedia.connectPeripherals(self.fileDownloader);
        self.cassetteDeck.connectPeripherals(self.screen, self.fileDownloader);
        self.diskDrive.connectPeripherals(self.screen, self.fileDownloader);
        self.peripheralControls.connectPeripherals(self.screen, self.controllersHub, self.fileLoader, self.cassetteDeck, self.diskDrive);
    };

    var buildAndPlugMachine = function() {
        self.machine = new wmsx.Machine();
        self.stateMedia.connect(self.machine.getSavestateSocket());
        self.fileLoader.connect(self.machine);
        self.screen.connect(self.machine.getVideoOutput(), self.machine.getMachineControlsSocket(), self.machine.getMachineTypeSocket(), self.machine.getExtensionsSocket(), self.machine.getCartridgeSocket(), self.machine.getControllersSocket());
        self.speaker.connect(self.machine.getAudioSocket());
        self.machineControls.connect(self.machine.getMachineControlsSocket());
        self.controllersHub.connect(self.machine.getControllersSocket(), self.machine.getMachineControlsSocket(), self.machine.getBIOSSocket());
        self.cassetteDeck.connect(self.machine.getCassetteSocket());
        self.diskDrive.connect(self.machine.getDiskDriveSocket());
        self.peripheralControls.connect(self.machine.getMachineControlsSocket(), self.machine.getCartridgeSocket());
        self.machine.getCartridgeSocket().connectFileDownloader(self.fileDownloader);
    };


    this.machine = null;
    this.screen = null;
    this.speaker = null;
    this.machineControls = null;
    this.controllersHub = null;
    this.keyboard = null;
    this.fileDownloader = null;
    this.cassetteDeck = null;
    this.diskDrive = null;
    this.stateMedia = null;
    this.fileLoader = null;
    this.peripheralControls = null;


    init();

};

