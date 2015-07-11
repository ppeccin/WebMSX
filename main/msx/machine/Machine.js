// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Machine = function() {
    var self = this;

    function init() {
        mainComponentsCreate();
        socketsCreate();
        extensionsCreate();
        setVideoStandardAuto();
    }

    this.powerOn = function(paused) {
        if (this.powerIsOn) this.powerOff();
        bus.powerOn();
        this.powerIsOn = true;
        machineControlsSocket.controlsStatesRedefined();
        if (!paused) go();
    };

    this.powerOff = function() {
        pause();
        bus.powerOff();
        this.powerIsOn = false;
        machineControlsSocket.controlsStatesRedefined();
    };

    this.reset = function(paused) {
        bus.reset();
    };

    this.userPowerOn = function() {
        if (getBIOS()) this.powerOn();
        else this.getVideoOutput().showOSD("Insert BIOS!", true);
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
        WMSX.bios = bios;
        bus.setBIOS(bios);
        cassetteBIOSExtension.patchBIOS(bios);
        setVideoStandardAuto();
    };

    var getBIOS = function() {
        return bus.getBIOS();
    };

    var setCartridge = function(cartridge, port) {
        if (port === 2) WMSX.cartridge2 = cartridge;
        else WMSX.cartridge1 = cartridge;
        bus.setCartridge(cartridge, port);
    };

    var getCartridge = function(port) {
        return bus.getCartridge(port);
    };

    var setVideoStandard = function(pVideoStandard) {
        if (videoStandard !== pVideoStandard) {
            videoStandard = pVideoStandard;
            vdp.setVideoStandard(videoStandard);
            mainClockAdjustToNormal();
        }
        self.showOSD((videoStandardIsAuto ? "AUTO: " : "") + videoStandard.name + " " + (videoStandard.fps | 0) +"Hz", true);
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

    var cycleCartridgeFormat = function() {
    };

    var saveState = function() {
        return {
            b: bus.saveState(),
            pp: ppi.saveState(),
            ps: psg.saveState(),
            vd: vdp.saveState(),
            c: cpu.saveState(),
            va: videoStandardIsAuto,
            vs: videoStandard.name
        };
    };

    var loadState = function(state) {
        if (!self.powerIsOn) self.powerOn();
        bus.loadState(state.b);
        ppi.loadState(state.pp);
        psg.loadState(state.ps);
        vdp.loadState(state.vd);
        cpu.loadState(state.c);
        videoStandardIsAuto = state.va;
        setVideoStandard(wmsx.VideoStandard[state.vs]);
        machineControlsSocket.controlsStatesRedefined();
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
        self.bus = bus = new wmsx.EngineBUS(cpu, ppi, vdp, psg);
        self.mainClock = mainClock = new wmsx.Clock(self, wmsx.VideoStandard.NTSC.fps);

        self.cpu = cpu;
        self.psg = psg;
        self.ppi = ppi;
        self.vdp = vdp;
        self.bus = bus;
        self.mainClock = mainClock;
    };

    var socketsCreate = function() {
        machineControlsSocket = new MachineControlsSocket();
        machineControlsSocket.addForwardedInput(self);
        biosSocket = new BIOSSocket();
        cartridgeSocket = new CartridgeSocket();
        keyboardSocket = new KeyboardSocket();
        saveStateSocket = new SaveStateSocket();
        cassetteSocket = new CassetteSocket();
    };

    var extensionsCreate = function() {
        cassetteBIOSExtension = new wmsx.CassetteBIOSExtension(cpu);
        basicExtension = new wmsx.BASICExtension(bus);
    };


    this.powerIsOn = false;

    this.framesGenerated = 0;

    var cpu;
    var bus;
    var ppi;
    var vdp;
    var psg;
    var mainClock;

    var debugPause = false;
    var debugPauseMoreFrames = 0;

    var videoStandard;
    var machineControlsSocket;
    var keyboardSocket;
    var biosSocket;
    var cartridgeSocket;
    var saveStateSocket;
    var cassetteSocket;

    var cassetteBIOSExtension;
    var basicExtension;

    var videoStandardIsAuto = false;


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
            case controls.CARTRIDGE_FORMAT:
                cycleCartridgeFormat();
                break;
        }
    };

    this.controlsStateReport = function (report) {
        //  Only Power Control is visible from outside
        report[controls.POWER] = self.powerIsOn;
    };


    // CartridgeSocket  -----------------------------------------

    function CartridgeSocket() {

        this.insert = function (cartridge, port, autoPower) {
            if (autoPower && self.powerIsOn) self.powerOff();
            setCartridge(cartridge, port);
            if (autoPower && !self.powerIsOn) self.userPowerOn();
        };

        this.inserted = function (port) {
            return getCartridge(port);
        };

        this.cartridgeInserted = function (cartridge, port, removedCartridge) {
            for (var i = 0; i < insertionListeners.length; i++)
                insertionListeners[i].cartridgeInserted(cartridge, port, removedCartridge);
        };

        this.addInsertionListener = function (listener) {
            if (insertionListeners.indexOf(listener) < 0) {
                insertionListeners.push(listener);
                listener.cartridgeInserted(this.inserted(1), 1, null);		// Fire a insertion events
                listener.cartridgeInserted(this.inserted(2), 2, null);
            }
        };

        var insertionListeners = [];

    }


    // Cassette Socket  -----------------------------------------

    function CassetteSocket() {

        this.connectDeck = function (pDeck) {
            cassetteBIOSExtension.connectDeck(pDeck);
            pDeck.connectBASICExtension(basicExtension);
        };

    }


    // BIOS Socket  -----------------------------------------

    function BIOSSocket() {

        this.insert = function (bios, autoPower) {
            if (autoPower && self.powerIsOn) self.powerOff();
            setBIOS(bios);
            if (autoPower && !self.powerIsOn) self.userPowerOn();
        };

        this.inserted = function () {
            return getBIOS();
        };

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

        this.controlsStatesRedefined = function() {
            for (var i = 0; i < redefinitionListeners.length; i++)
                redefinitionListeners[i].controlsStatesRedefined();
        };

        var controls;
        var forwardedInputs = [];
        var forwardedInputsCount = 0;
        var redefinitionListeners = [];

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

        this.loadState = function(slot) {
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
            loadState(state);
            self.showOSD("State " + slot + " loaded", true);
        };

        this.saveStateFile = function() {
            if (!self.powerIsOn || !media) return;
            // Use Cartridge label as file name
            var cart = cartridgeSocket.inserted(1) || cartridgeSocket.inserted(2);
            var fileName = cart && cart.rom.info.l;
            var state = saveState();
            state.v = VERSION;
            if (media.saveStateFile(fileName, state))
                self.showOSD("State Cartridge saved", true);
            else
                self.showOSD("State Cartridge save failed", true);
        };

        this.loadStateFile = function(data) {       // Return true if data was indeed a SaveState
            if (!media) return;
            var state = media.loadStateFile(data);
            if (!state) return;
            wmsx.Util.log("SaveState file loaded");
            if (state.v !== VERSION) {
                self.showOSD("State Cartridge load failed, wrong version", true);
                return true;
            }
            loadState(state);
            self.showOSD("State Cartridge loaded", true);
            return true;
        };

        var media;
        var VERSION = 5;
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
