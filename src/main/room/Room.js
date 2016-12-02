// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Room = function(screenElement, machineStartPowerOn) {
"use strict";

    var self = this;

    function init() {
        buildPeripherals();
        buildAndPlugMachine();
    }

    this.powerOn = function(paused) {
        self.screen.powerOn();
        self.speaker.powerOn();
        self.controllersHub.powerOn();
        self.setLoading(true);
        roomPowerOnTime = Date.now();
    };

    this.powerOff = function() {
        self.machine.powerOff();
        self.controllersHub.powerOff();
        self.speaker.powerOff();
        self.screen.powerOff();
    };

    this.setLoading = function(boo) {
        if (this.isLoading === boo) return;
        this.isLoading = boo;
        this.machine.setLoading(this.isLoading);
        this.screen.setLoading(this.isLoading);
    };

    this.start = function(startAction) {
        wmsx.Clock.detectHostNativeFPSAndCallback(function() {
            afterPowerONDelay(function () {
                self.setLoading(false);
                self.screen.start(startAction || machinePowerOnStartAction);
            });
        });
    };

    function afterPowerONDelay(func) {
        var wait = WMSX.AUTO_POWER_ON_DELAY;
        if (wait >= 0 && WMSXFullScreenSetup.shouldStartInFullScreen()) wait += 1400;   // Wait a bit more
        wait -= (Date.now() - roomPowerOnTime);
        if (wait < 1) wait = 1;
        setTimeout(func, wait);
    }

    function machinePowerOnStartAction() {
        if (machineStartPowerOn) self.machine.userPowerOn(true);        // Auto-run cassette, or type basic commands if any
    }

    function buildPeripherals() {
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
        self.speaker = new wmsx.WebAudioSpeaker(screenElement);

        self.fileLoader.connectPeripherals(self.cassetteDeck, self.diskDrive);
        self.fileDownloader.connectPeripherals(self.screen);
        self.screen.connectPeripherals(self.fileLoader, self.fileDownloader, self.peripheralControls, self.controllersHub, self.diskDrive);
        self.machineControls.connectPeripherals(self.screen);
        self.controllersHub.connectPeripherals(self.screen);
        self.stateMedia.connectPeripherals(self.fileDownloader);
        self.cassetteDeck.connectPeripherals(self.screen, self.fileDownloader);
        self.diskDrive.connectPeripherals(self.screen, self.fileDownloader);
        self.peripheralControls.connectPeripherals(self.screen, self.controllersHub, self.fileLoader, self.cassetteDeck, self.diskDrive);
    }

    function buildAndPlugMachine() {
        self.machine = new wmsx.Machine();
        self.stateMedia.connect(self.machine.getSavestateSocket());
        self.fileLoader.connect(self.machine);
        self.screen.connect(self.machine);
        self.speaker.connect(self.machine.getAudioSocket());
        self.machineControls.connect(self.machine.getMachineControlsSocket());
        self.controllersHub.connect(self.machine.getMachineControlsSocket(), self.machine.getControllersSocket(), self.machine.getBIOSSocket());
        self.cassetteDeck.connect(self.machine.getCassetteSocket());
        self.diskDrive.connect(self.machine.getDiskDriveSocket());
        self.peripheralControls.connect(self.machine.getMachineControlsSocket(), self.machine.getCartridgeSocket());
        self.machine.getCartridgeSocket().connectFileDownloader(self.fileDownloader);
    }


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

    this.isLoading = false;

    var roomPowerOnTime;


    init();

};

