// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Machine = function() {
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
        machineControlsSocket.controlsStatesRedefined();
        if (!paused) go();
    };

    this.powerOff = function() {
        pause();
        bus.powerOff();
        this.powerIsOn = false;
        machineControlsSocket.controlsStatesRedefined();
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

    this.showOSD = function(message, overlap) {
        this.getVideoOutput().showOSD(message, overlap);
    };

    var go = function() {
        mainClock.go();
    };

    var pause = function() {
        mainClock.pauseOnNextPulse();
    };

    var setBIOS = function(bios) {
        MSX.bios = bios;
        bus.setBIOS(bios);
    };

    var getBIOS = function() {
        return bus.getBIOS();
    };

    var setCartridge = function(cartridge) {
        MSX.cartridge = cartridge;
        bus.setCartridge(cartridge);
    };

    var getCartridge = function() {
        return bus.getCartridge();
    };

    var setVideoStandard = function(pVideoStandard) {
        if (videoStandard !== pVideoStandard) {
            videoStandard = pVideoStandard;
            vdp.setVideoStandard(videoStandard);
            mainClockAdjustToNormal();
        }
        self.showOSD((videoStandardIsAuto ? "AUTO: " : "") + videoStandard.name, false);
    };

    var setVideoStandardAuto = function() {
        videoStandardIsAuto = true;
        setVideoStandard(VideoStandard.NTSC);
    };

    var setVideoStandardForced = function(forcedVideoStandard) {
        videoStandardIsAuto = false;
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
            //ca: getCartridge() && getCartridge().saveState(),
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
        //insertCartridge(state.ca && CartridgeDatabase.createCartridgeFromSaveState(state.ca));
        setVideoStandard(VideoStandard[state.vs]);
        machineControlsSocket.controlsStatesRedefined();
    };

    var mainClockAdjustToNormal = function() {
        var freq = videoStandard.fps;
        mainClock.setFrequency(freq);
        //tia.getAudioOutput().setFps(freq);
    };

    var mainClockAdjustToFast    = function() {
        var freq = 600;     // About 10x faster
        mainClock.setFrequency(freq);
        //tia.getAudioOutput().setFps(freq);
    };

    var mainComponentsCreate = function() {
        cpu = new Z80();
        ppi = new PPI();
        vdp = new VDP(cpu);
        psg = new PSG();
        bus = new EngineBUS(cpu, ppi, vdp, psg);
        mainClock = new Clock(self, VideoStandard.NTSC.fps);

        BUS = bus;              // TODO Remove
        CPU = cpu;
        VD = vdp;
        CLO = mainClock;
    };

    var socketsCreate = function() {
        machineControlsSocket = new MachineControlsSocket();
        machineControlsSocket.addForwardedInput(self);
        biosSocket = new BIOSSocket();
        cartridgeSocket = new CartridgeSocket();
        keyboardSocket = new KeyboardSocket();
        saveStateSocket = new SaveStateSocket();
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

    var videoStandardIsAuto = false;


    // MachineControls interface  --------------------------------------------

    var controls = MachineControls;

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
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.POWER:
                if (self.powerIsOn) self.powerOff();
                else self.powerOn();
                break;
            case controls.POWER_OFF:
                if (self.powerIsOn) self.powerOff();
                break;
            case controls.PAUSE:
                debugPause = !debugPause; debugPauseMoreFrames = 1;
                vdp.getVideoOutput().showOSD(debugPause ? "PAUSE" : "RESUME", true);
                return;
            case controls.FRAME:
                if (debugPause) debugPauseMoreFrames = 1;
                return;
            case controls.POWER_FRY:
                powerFry();
                break;
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
                if (videoStandardIsAuto) setVideoStandardForced(VideoStandard.NTSC);
                else if (videoStandard == VideoStandard.NTSC) setVideoStandardForced(VideoStandard.PAL);
                else setVideoStandardAuto();
                break;
            case controls.CARTRIDGE_FORMAT:
                cycleCartridgeFormat();
                break;
            case controls.CARTRIDGE_REMOVE:
                if (MSX.CARTRIDGE_CHANGE_DISABLED)
                    self.showOSD("Cartridge change is disabled", true);
                else
                    cartridgeSocket.insert(null, false);
        }
    };

    this.controlsStateReport = function (report) {
        //  Only Power Control is visible from outside
        report[controls.POWER] = self.powerIsOn;
    };


    // CartridgeSocket  -----------------------------------------

    function CartridgeSocket() {

        this.insert = function (cartridge, autoPower) {
            if (autoPower && self.powerIsOn) self.powerOff();
            setCartridge(cartridge);
            if (autoPower && !self.powerIsOn) self.powerOn();
        };

        this.inserted = function () {
            return getCartridge();
        };

        this.cartridgeInserted = function (cartridge, removedCartridge) {
            for (var i = 0; i < insertionListeners.length; i++)
                insertionListeners[i].cartridgeInserted(cartridge, removedCartridge);
        };

        this.addInsertionListener = function (listener) {
            if (insertionListeners.indexOf(listener) < 0) {
                insertionListeners.push(listener);
                listener.cartridgeInserted(this.inserted());		// Fire a insertion event
            }
        };

        this.removeInsertionListener = function (listener) {
            Util.arrayRemove(insertionListeners, listener);
        };

        var insertionListeners = [];

    }


    // BIOS Socket  -----------------------------------------

    function BIOSSocket() {

        this.insert = function (bios, autoPower) {
            if (autoPower && self.powerIsOn) self.powerOff();
            setBIOS(bios);
            if (autoPower && !self.powerIsOn) self.powerOn();
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
            Util.arrayRemove(forwardedInputs, input);
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
            var fileName = cartridgeSocket.inserted() && cartridgeSocket.inserted().rom.info.l;
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
            if (state.v !== VERSION) {
                self.showOSD("State Cartridge load failed, wrong version", true);
                return true;
            }
            loadState(state);
            self.showOSD("State Cartridge loaded", true);
            return true;
        };

        var media;
        var VERSION = 2;
    }


    // Debug methods  ------------------------------------------------------

    this.startProfiling = function() {
        var lastFrameCount = this.framesGenerated;
        setInterval(function() {
            Util.log(self.framesGenerated - lastFrameCount);
            lastFrameCount = self.framesGenerated;
        }, 1000);
    };

    this.runFramesAtTopSpeed = function(frames) {
        pause();
        var start = performance.now();
        for (var i = 0; i < frames; i++)
            self.clockPulse();
        var duration = performance.now() - start;
        Util.log("Done running " + frames + " in " + duration + " ms");
        Util.log(frames / (duration/1000) + "frames/sec");
        go();
    };

    this.eval = function(str) {
        return eval(str);
    };


    init();

};
