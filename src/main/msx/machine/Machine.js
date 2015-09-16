// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Machine = function() {
    var self = this;

    function init() {
        mainComponentsCreate();
        socketsCreate();
        setVideoStandardAuto();
    }

    this.powerOn = function(paused) {
        if (this.powerIsOn) this.powerOff();
        bus.powerOn();
        this.powerIsOn = true;
        machineControlsSocket.fireRedefinitionUpdate();
        if (!paused) go();
    };

    this.powerOff = function() {
        pause();
        bus.powerOff();
        this.powerIsOn = false;
        machineControlsSocket.fireRedefinitionUpdate();
    };

    this.reset = function(paused) {
        bus.reset();
    };

    this.userPowerOn = function(autoRunCassette) {
        if (getBIOS()) {
            this.powerOn();
            if (autoRunCassette) cassetteSocket.typeAutoRunCommandAfterPowerOn();
        } else this.getVideoOutput().showOSD("Insert BIOS!", true);
     };

    this.clockPulse = function() {
        if (debugPause)
            if (debugPauseMoreFrames-- <= 0) return;
        vdp.frame();
        this.framesGenerated++;
    };

    this.getBIOSSocket = function() {
        return biosSocket;
    };

    this.getExpansionSocket = function() {
        return expansionSocket;
    };

    this.getCartridgeSocket = function() {
        return cartridgeSocket;
    };

    this.getMachineControlsSocket = function() {
        return machineControlsSocket;
    };

    this.getKeyboardSocket = function() {
        return keyboardSocket;
    };

    this.getVideoOutput = function() {
        return vdp.getVideoOutput();
    };

    this.getAudioOutput = function() {
        return psg.getAudioOutput();
    };

    this.getSavestateSocket = function() {
        return saveStateSocket;
    };

    this.getCassetteSocket = function() {
        return cassetteSocket;
    };

    this.getDiskDriveSocket = function() {
        return diskDriveSocket;
    };

    this.showOSD = function(message, overlap) {
        this.getVideoOutput().showOSD(message, overlap);
    };

    var go = function() {
        mainClock.go();
    };

    var pause = function() {
        mainClock.pause();
    };

    var setBIOS = function(bios) {
        bus.insertSlot(bios || wmsx.SlotEmpty.singleton, BIOS_SLOT);
        setVideoStandardAuto();
    };

    var getBIOS = function() {
        var bios = bus.getSlot(BIOS_SLOT);
        return bios === wmsx.SlotEmpty.singleton ? null : bios;
    };

    var setCartridge = function(cartridge, port) {
        var slot = cartridge || wmsx.SlotEmpty.singleton;
        if (port === 1)
            bus.getSlot(EXPANDED_SLOT).insertSubSlot(slot, CARTRIDGE1_EXP_SLOT);
        else
            bus.insertSlot(slot, CARTRIDGE0_SLOT);
        cartridgeSocket.fireStateUpdate();
    };

    var getCartridge = function(port) {
        var cartridge = port === 1 ? bus.getSlot(EXPANDED_SLOT).getSubSlot(CARTRIDGE1_EXP_SLOT) : bus.getSlot(CARTRIDGE0_SLOT);
        return cartridge === wmsx.SlotEmpty.singleton ? null : cartridge;
    };

    var setExpansion = function(expansion, port) {
        var slot = expansion || wmsx.SlotEmpty.singleton;
        bus.getSlot(EXPANDED_SLOT).insertSubSlot(slot, EXPANSIONS_EXP_SLOTS[port]);
    };

    var getExpansion = function(port) {
        var expansion = bus.getSlot(EXPANDED_SLOT).getSubSlot(EXPANSIONS_EXP_SLOTS[port]);
        return expansion === wmsx.SlotEmpty.singleton ? null : expansion;
    };

    var setVideoStandard = function(pVideoStandard) {
        if (videoStandard !== pVideoStandard) {
            videoStandard = pVideoStandard;
            vdp.setVideoStandard(videoStandard);
            mainClockAdjustToNormal();
        }
        self.showOSD((videoStandardIsAuto ? "AUTO: " : "") + videoStandard.name + " " + (videoStandard.fps | 0) +"Hz", false);
    };

    var setVideoStandardAuto = function() {
        videoStandardIsAuto = true;
        var bios = getBIOS();
        if (bios) bios.setVideoStandardUseOriginal();
        setVideoStandard((bios && bios.originalVideoStandard) || wmsx.VideoStandard.NTSC);
    };

    var setVideoStandardForced = function(forcedVideoStandard) {
        videoStandardIsAuto = false;
        if (getBIOS()) getBIOS().setVideoStandardForced(forcedVideoStandard);
        setVideoStandard(forcedVideoStandard);
    };

    var powerFry = function() {
        //ram.powerFry();
    };

    var saveState = function() {
        return {
            b: bus.saveState(),
            pp: ppi.saveState(),
            ps: psg.saveState(),
            vd: vdp.saveState(),
            c: cpu.saveState(),
            va: videoStandardIsAuto,
            vs: videoStandard.name,
            dd: diskDriveSocket.getDrive().saveState(),
            ct: cassetteSocket.getDeck().saveState()
        };
    };

    var loadState = function(state) {
        bus.loadState(state.b);
        ppi.loadState(state.pp);
        psg.loadState(state.ps);
        vdp.loadState(state.vd);
        cpu.loadState(state.c);
        self.ram = bus.getSlot(RAM_SLOT);
        videoStandardIsAuto = state.va;
        setVideoStandard(wmsx.VideoStandard[state.vs]);
        machineControlsSocket.fireRedefinitionUpdate();
        cartridgeSocket.fireStateUpdate();
        diskDriveSocket.getDrive().loadState(state.dd);
        cassetteSocket.getDeck().loadState(state.ct);
    };

    var mainClockAdjustToNormal = function() {
        var freq = videoStandard.fps;
        mainClock.setFrequency(freq);
        psg.getAudioOutput().setFps(freq);
    };

    var mainClockAdjustToFast = function() {
        var freq = 600;     // About 10x faster if host machine is able
        mainClock.setFrequency(freq);
        psg.getAudioOutput().setFps(freq);
    };

    var mainClockAdjustToSlow = function() {
        var freq = 20;     // About 3x slower
        mainClock.setFrequency(freq);
        psg.getAudioOutput().setFps(freq);
    };

    var mainComponentsCreate = function() {
        self.cpu = cpu = new wmsx.Z80();
        self.psg = psg = new wmsx.PSG();
        self.ppi = ppi = new wmsx.PPI(psg.getAudioOutput());
        self.vdp = vdp = new wmsx.VDP(cpu, psg);
        self.bus = bus = new wmsx.EngineBUS(self, cpu, ppi, vdp, psg);
        self.mainClock = mainClock = new wmsx.Clock(self, wmsx.VideoStandard.NTSC.fps);

        // 64K RAM
        self.ram = wmsx.SlotRAM64K.createNewEmpty();
        bus.insertSlot(self.ram, RAM_SLOT);

        // Expanded Slot
        bus.insertSlot(new wmsx.SlotExpanded(), EXPANDED_SLOT);
    };

    var socketsCreate = function() {
        machineControlsSocket = new MachineControlsSocket();
        machineControlsSocket.addForwardedInput(self);
        biosSocket = new BIOSSocket();
        expansionSocket = new ExpansionSocket();
        cartridgeSocket = new CartridgeSocket();
        keyboardSocket = new KeyboardSocket();
        saveStateSocket = new SaveStateSocket();
        cassetteSocket = new CassetteSocket();
        diskDriveSocket = new DiskDriveSocket();
    };


    this.powerIsOn = false;

    this.framesGenerated = 0;

    var cpu;
    var bus;
    var ppi;
    var vdp;
    var psg;
    var mainClock;
    var ram;

    var debugPause = false;
    var debugPauseMoreFrames = 0;

    var videoStandard;
    var machineControlsSocket;
    var keyboardSocket;
    var biosSocket;
    var expansionSocket;
    var cartridgeSocket;
    var saveStateSocket;
    var cassetteSocket;
    var diskDriveSocket;

    var videoStandardIsAuto = false;

    var BIOS_SLOT = 0;
    var RAM_SLOT = 1;
    var CARTRIDGE0_SLOT = 2;
    var EXPANDED_SLOT = 3;
    var CARTRIDGE1_EXP_SLOT = 0;
    var EXPANSIONS_EXP_SLOTS = [ 1, 2, 3 ];


    // MachineControls interface  --------------------------------------------

    var controls = wmsx.MachineControls;

    this.controlStateChanged = function (control, state) {
        // Normal state controls
        if (control == controls.FAST_SPEED) {
            if (state) {
                self.showOSD("FAST FORWARD", true);
                mainClockAdjustToFast();
            } else {
                self.showOSD(null, true);
                mainClockAdjustToNormal();
            }
            return;
        }
        if (control == controls.SLOW_SPEED) {
            if (state) {
                self.showOSD("SLOW MOTION", true);
                mainClockAdjustToSlow();
            } else {
                self.showOSD(null, true);
                mainClockAdjustToNormal();
            }
            return;
        }
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.POWER:
                if (self.powerIsOn) self.powerOff();
                else self.userPowerOn();
                break;
            case controls.RESET:
                if (self.powerIsOn) self.reset();
                break;
            case controls.POWER_OFF:
                if (self.powerIsOn) self.powerOff();
                break;
            case controls.POWER_FRY:
                powerFry();
                break;
            case controls.PAUSE:
                debugPause = !debugPause; debugPauseMoreFrames = 1;
                vdp.getVideoOutput().showOSD(debugPause ? "PAUSE" : "RESUME", true);
                return;
            case controls.FRAME:
                if (debugPause) debugPauseMoreFrames = 1;
                return;
            case controls.SAVE_STATE_0:
            case controls.SAVE_STATE_1:
            case controls.SAVE_STATE_2:
            case controls.SAVE_STATE_3:
            case controls.SAVE_STATE_4:
            case controls.SAVE_STATE_5:
            case controls.SAVE_STATE_6:
            case controls.SAVE_STATE_7:
            case controls.SAVE_STATE_8:
            case controls.SAVE_STATE_9:
            case controls.SAVE_STATE_10:
            case controls.SAVE_STATE_11:
            case controls.SAVE_STATE_12:
                saveStateSocket.saveState(control.to);
                break;
            case controls.SAVE_STATE_FILE:
                saveStateSocket.saveStateFile();
                break;
            case controls.LOAD_STATE_0:
            case controls.LOAD_STATE_1:
            case controls.LOAD_STATE_2:
            case controls.LOAD_STATE_3:
            case controls.LOAD_STATE_4:
            case controls.LOAD_STATE_5:
            case controls.LOAD_STATE_6:
            case controls.LOAD_STATE_7:
            case controls.LOAD_STATE_8:
            case controls.LOAD_STATE_9:
            case controls.LOAD_STATE_10:
            case controls.LOAD_STATE_11:
            case controls.LOAD_STATE_12:
                saveStateSocket.loadState(control.from);
                break;
            case controls.VIDEO_STANDARD:
                self.showOSD(null, true);	// Prepares for the upcoming "AUTO" OSD to always show
                if (videoStandardIsAuto) setVideoStandardForced(wmsx.VideoStandard.NTSC);
                else if (videoStandard == wmsx.VideoStandard.NTSC) setVideoStandardForced(wmsx.VideoStandard.PAL);
                else setVideoStandardAuto();
                break;
            case controls.PALETTE:
                vdp.togglePalettes();
                break;
            case controls.DEFAULTS:
                setVideoStandardAuto();
                vdp.setDefaults();
                break;
        }
    };

    this.controlsStateReport = function (report) {
        //  Only Power Control is visible from outside
        report[controls.POWER] = self.powerIsOn;
    };


    // BIOS Socket  -----------------------------------------

    function BIOSSocket() {
        this.insert = function (bios, altPower) {
            var powerWasOn = self.powerIsOn;
            if (powerWasOn) self.powerOff();
            setBIOS(bios);
            if (!altPower && bios) self.userPowerOn();
        };
        this.inserted = function () {
            return getBIOS();
        };
    }


    // System Expansions Socket  --------------------------------

    function ExpansionSocket() {
        this.insert = function (expansion, port, altPower) {
            var powerWasOn = self.powerIsOn;
            if (powerWasOn) self.powerOff();
            if (expansion == getExpansion(port || 0)) return;
            setExpansion(expansion, port);
            if (!altPower && (expansion || powerWasOn)) self.userPowerOn();
        };
        this.inserted = function (port) {
            return getExpansion(port);
        };
    }


    // CartridgeSocket  -----------------------------------------

    function CartridgeSocket() {

        this.insert = function (cartridge, port, altPower) {
            if (cartridge == getCartridge(port || 0)) return;
            var powerWasOn = self.powerIsOn;
            if (powerWasOn) self.powerOff();
            setCartridge(cartridge, port);
            self.showOSD("Cartridge " + (port === 1 ? "2" : "1") + (cartridge ? " inserted" : " removed"), true);
            if (!altPower && (cartridge || powerWasOn)) self.userPowerOn();
        };

        this.inserted = function (port) {
            return getCartridge(port);
        };

        this.fireStateUpdate = function () {
            for (var i = 0; i < listeners.length; i++)
                listeners[i].cartridgesStateUpdate(this.inserted(0), this.inserted(1));
        };

        this.addCartridgesStateListener = function (listener) {
            if (listeners.indexOf(listener) < 0) {
                listeners.push(listener);
                listener.cartridgesStateUpdate(this.inserted(0), this.inserted(1));		// Fire event
            }
        };

        var listeners = [];

    }


    // Cassette Socket  ------------------------------------------

    function CassetteSocket() {
        this.connectDeck = function (pDeck) {
            deck = pDeck;
        };
        this.connectDriver = function (pDriver) {
            driver = pDriver;
        };
        this.getDeck = function() {
            return deck;
        };
        this.getDriver = function() {
            return driver;
        };
        this.autoPowerCycle = function (altPower) {
            // No power cycle by default if machine is on, only auto power on.
            // With Alt Power, only do power cycle if there is an executable at position
            if (!driver || !driver.currentAutoRunCommand()) return;     // Only do power cycle if there is an executable at position
            var powerWasOn = self.powerIsOn;
            if (powerWasOn && altPower) self.powerOff();
            if (!self.powerIsOn && (!altPower || (powerWasOn && altPower))) self.userPowerOn(true);
        };
        this.typeAutoRunCommandAfterPowerOn = function () {
            if (driver && driver.currentAutoRunCommand())
                // Give some time for reboot and then enter command
                window.setTimeout(driver.typeCurrentAutoRunCommand, 1700);      // TODO Arbitrary time...
        };
        var deck;
        var driver;
    }


    // Disk Drive Socket  -----------------------------------------

    function DiskDriveSocket() {
        this.connectDrive = function (pDrive) {
            drive = pDrive;
        };
        this.getDrive = function() {
            return drive;
        };
        this.autoPowerCycle = function (altPower) {
            // No power cycle by default if machine is on, only auto power on.
            var powerWasOn = self.powerIsOn;
            if (powerWasOn && altPower) self.powerOff();
            if (!self.powerIsOn && (!altPower || (powerWasOn && altPower))) self.userPowerOn(true);
        };
        var drive;
    }


    // Keyboard Socket  -----------------------------------------

    function KeyboardSocket() {
        this.connectKeyboard = function(pKeyboard) {
            keyboard = pKeyboard;
        };
        this.keyboardKeyChanged = function(key, press) {
            ppi.keyboardKeyChanged(key, press);
        };
        var keyboard;
    }


    // MachineControls Socket  -----------------------------------------

    function MachineControlsSocket() {

        this.connectControls = function(pControls) {
            controls = pControls;
        };

        this.controlStateChanged = function(control, state) {
            for (var i = 0; i < forwardedInputsCount; i++)
                forwardedInputs[i].controlStateChanged(control, state);
        };

        this.controlsStateReport = function(report) {
            for (var i = 0; i < forwardedInputsCount; i++)
                forwardedInputs[i].controlsStateReport(report);
        };

        this.addForwardedInput = function(input) {
            forwardedInputs.push(input);
            forwardedInputsCount = forwardedInputs.length;
        };

        this.removeForwardedInput = function(input) {
            wmsx.Util.arrayRemove(forwardedInputs, input);
            forwardedInputsCount = forwardedInputs.length;
        };

        this.addRedefinitionListener = function(listener) {
            if (redefinitionListeners.indexOf(listener) < 0) {
                redefinitionListeners.push(listener);
                listener.controlsStatesRedefined();		// Fire a redefinition event
            }
        };

        this.fireRedefinitionUpdate = function() {
            for (var i = 0; i < redefinitionListeners.length; i++)
                redefinitionListeners[i].controlsStatesRedefined();
        };

        var controls;
        var forwardedInputs = [];
        var forwardedInputsCount = 0;
        var redefinitionListeners = [];

    }


    // SavestateSocket  -----------------------------------------

    function SaveStateSocket() {

        this.connectMedia = function(pMedia) {
            media = pMedia;
        };

        this.getMedia = function() {
            return media;
        };

            this.externalStateChange = function() {
            // Nothing
        };

        this.saveState = function(slot) {
            if (!self.powerIsOn || !media) return;
            var state = saveState();
            state.v = VERSION;
            if (media.saveState(slot, state))
                self.showOSD("State " + slot + " saved", true);
            else
                self.showOSD("State " + slot + " save failed", true);
        };

        this.loadState = function(slot, altPower) {
            if (!media) return;
            var state = media.loadState(slot);
            if (!state) {
                self.showOSD("State " + slot + " not found", true);
                return;
            }
            if (state.v !== VERSION) {
                self.showOSD("State " + slot + " load failed, wrong version", true);
                return;
            }
            if (!altPower && !self.powerIsOn) self.powerOn();
            loadState(state);
            self.showOSD("State " + slot + " loaded", true);
        };

        this.saveStateFile = function() {
            if (!self.powerIsOn || !media) return;
            // Use Cartridge label as file name
            var cart = cartridgeSocket.inserted(0) || cartridgeSocket.inserted(1);
            var fileName = cart && cart.rom.info.l;
            var state = saveState();
            state.v = VERSION;
            if (media.saveStateFile(fileName, state))
                self.showOSD("State File saved", true);
            else
                self.showOSD("State File save failed", true);
        };

        this.loadStateFile = function(data, altPower) {       // Return true if data was indeed a SaveState
            if (!media) return;
            var state = media.loadStateFile(data);
            if (!state) return;
            wmsx.Util.log("SaveState file loaded");
            if (state.v !== VERSION) {
                self.showOSD("State File load failed, wrong version", true);
                return true;
            }
            if (!altPower && !self.powerIsOn) self.powerOn();
            loadState(state);
            self.showOSD("State File loaded", true);
            return true;
        };

        var media;
        var VERSION = 7;
    }


    // Debug methods  ------------------------------------------------------

    this.startProfiling = function() {
        var lastFrameCount = this.framesGenerated;
        setInterval(function() {
            wmsx.Util.log(self.framesGenerated - lastFrameCount);
            lastFrameCount = self.framesGenerated;
        }, 1000);
    };

    this.runFramesAtTopSpeed = function(frames) {
        pause();
        var start = performance.now();
        for (var i = 0; i < frames; i++)
            self.clockPulse();
        var duration = performance.now() - start;
        wmsx.Util.log("Done running " + frames + " in " + duration + " ms");
        wmsx.Util.log(frames / (duration/1000) + "frames/sec");
        go();
    };

    this.eval = function(str) {
        return eval(str);
    };


    init();

};
