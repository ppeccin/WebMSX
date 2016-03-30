// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Machine = function() {
    var self = this;

    function init() {
        socketsCreate();
        mainComponentsCreate();
        setVideoStandardAuto();
        setVSynchMode(WMSX.SCREEN_VSYNCH_MODE);
    }

    this.powerOn = function(paused) {
        if (this.powerIsOn) this.powerOff();
        rtc.powerOn();
        bus.powerOn();
        ppi.powerOn();
        psg.powerOn();
        vdp.powerOn();
        cpu.powerOn();
        this.reset();
        this.powerIsOn = true;
        machineControlsSocket.fireRedefinitionUpdate();
        if (!paused) mainVideoClock.go();
    };

    this.powerOff = function() {
        mainVideoClock.pause();
        cpu.powerOff();
        vdp.powerOff();
        psg.powerOff();
        ppi.powerOff();
        rtc.powerOff();
        bus.powerOff();
        this.powerIsOn = false;
        machineControlsSocket.fireRedefinitionUpdate();
    };

    this.reset = function() {
        rtc.reset();
        psg.reset();
        vdp.reset();
        cpu.reset();
        bus.reset();
        videoStandardSoft = null;
        if (videoStandardIsAuto) setVideoStandardAuto();
    };

    this.userPowerOn = function(autoRunCassette) {
        if (isLoading) return;
        if (!bios) {
            this.getVideoOutput().showOSD("Insert BIOS!", true);
            return;
        }
        this.powerOn();
        if (autoRunCassette) cassetteSocket.typeAutoRunCommandAfterPowerOn();
     };

    this.videoClockPulse = function() {
        if (systemPaused) return;
        joysticksSocket.joysticksClockPulse();
        if (userPaused)
            if (userPauseMoreFrames-- <= 0) return;

        vdp.videoClockPulse();

        // Finish audio signal (generate any missing samples to adjust to sample rate)
        audioSocket.audioFinishFrame();
    };

    this.getSlotSocket = function() {
        return slotSocket;
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

    this.getJoysticksSocket = function() {
        return joysticksSocket;
    };

    this.getVideoOutput = function() {
        return vdp.getVideoOutput();
    };

    this.getAudioSocket = function() {
        return audioSocket;
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

    this.setVideoStandardSoft = function(pVideoStandard) {
        videoStandardSoft = pVideoStandard;
        if (videoStandardIsAuto && videoStandard !== pVideoStandard) setVideoStandard(pVideoStandard);
        else if (!videoStandardIsAuto && videoStandard !== pVideoStandard)
                self.showOSD("Cannot change Video Standard. Its FORCED: " + videoStandard.desc, true);
    };

    this.getSlot = function(slotPos) {
        if (typeof slotPos === "number") slotPos = [slotPos];
        var pri = slotPos[0], sec = slotPos[1];

        var res = bus.getSlot(pri);
        if (sec >= 0) {
            if (res.isExpanded()) res = res.getSubSlot(sec);
            else res = null;
        }
        return res;
    };

    this.insertSlot = function(slot, slotPos) {
        if (typeof slotPos === "number") slotPos = [slotPos];
        var pri = slotPos[0], sec = slotPos[1];

        var curPriSlot = bus.getSlot(pri);
        if (sec >= 0) {
            if (!curPriSlot.isExpanded()) {
                var oldPriSlot = curPriSlot;
                curPriSlot = new wmsx.SlotExpanded();       // Automatically insert an ExpandedSlot if not present
                bus.insertSlot(curPriSlot, pri);
                if (oldPriSlot !== EMPTY_SLOT && sec !== pri) curPriSlot.insertSubSlot(oldPriSlot, pri);     // Keep old slot at the same position within Expanded Slot if possible
            }
            curPriSlot.insertSubSlot(slot, sec);
        } else bus.insertSlot(slot, pri);
    };

    this.loading = function(boo) {
        isLoading = boo;
    };

    this.userPause = function(val) {
        var prev = userPaused;
        if (userPaused !== val) {
            userPaused = !!val; userPauseMoreFrames = -1;
            if (userPaused) audioSocket.mute();
            else audioSocket.unmute();
        }
        return prev;
    };

    this.systemPause = function(val) {
        var prev = systemPaused;
        if (systemPaused !== val) {
            systemPaused = !!val;
            if (systemPaused) audioSocket.pauseMonitor();
            else audioSocket.unpauseMonitor();
        }
        return prev;
    };

    this.setBIOS = function(pBIOS) {                    // Called by SlotBIOS on connection
        bios = pBIOS === EMPTY_SLOT ? null : pBIOS;
        videoStandardSoft = null;
        setVideoStandardAuto();
    };

    function setVideoStandard(pVideoStandard) {
        self.showOSD((videoStandardIsAuto ? "AUTO: " : "FORCED: ") + pVideoStandard.desc, false);
        if (videoStandard === pVideoStandard) return;

        videoStandard = pVideoStandard;
        vdp.setVideoStandard(videoStandard);
        mainVideoClockAdjustToNormal();
    }

    function setVideoStandardAuto() {
        videoStandardIsAuto = true;
        var newStandard = wmsx.VideoStandard.NTSC;          // Default in case we can't discover it
        if (videoStandardSoft) {
            newStandard = videoStandardSoft;
        } else {
            if (bios) {
                bios.setVideoStandardUseOriginal();
                newStandard = bios.originalVideoStandard;
            }
        }
        setVideoStandard(newStandard);
    }

    function setVideoStandardForced(forcedVideoStandard) {
        videoStandardIsAuto = false;
        if (bios) bios.setVideoStandardForced(forcedVideoStandard);
        setVideoStandard(forcedVideoStandard);
    }

    function setVSynchMode(mode) {
        mode %= 3;
        if (vSynchMode === mode) return;

        vSynchMode = mode;
        vdp.setVSynchMode(vSynchMode);
        mainVideoClockAdjustToNormal();
    }

    function powerFry() {
        //ram.powerFry();
    }

    function saveState() {
        return {
            b:  bus.saveState(),
            pp: ppi.saveState(),
            rc: rtc.saveState(),
            ps: psg.saveState(),
            vd: vdp.saveState(),
            c:  cpu.saveState(),
            va: videoStandardIsAuto,
            vs: videoStandard.name,
            vss: videoStandardSoft && videoStandardSoft.name,
            dd: diskDriveSocket.getDrive().saveState(),
            ct: cassetteSocket.getDeck().saveState()
        };
    }

    function loadState(state) {
        videoStandardIsAuto = state.va;
        setVideoStandard(wmsx.VideoStandard[state.vs]);
        videoStandardSoft = state.vss && wmsx.VideoStandard[state.vss];
        cpu.loadState(state.c);
        vdp.loadState(state.vd);
        psg.loadState(state.ps);
        rtc.loadState(state.rc);
        ppi.loadState(state.pp);
        bus.loadState(state.b);
        machineControlsSocket.fireRedefinitionUpdate();
        cartridgeSocket.fireStateUpdate();
        diskDriveSocket.getDrive().loadState(state.dd);
        cassetteSocket.getDeck().loadState(state.ct);
    }

    function mainVideoClockAdjustToNormal() {
        var freq = vdp.getDesiredBaseFrequency();
        mainVideoClock.setVSynch(vSynchMode > 0);
        mainVideoClock.setFrequency(freq);
        audioSocket.setFps(freq);
    }

    function mainVideoClockAdjustToFast() {
        var freq = 600;     // About 10x faster limited to host performance
        mainVideoClock.setFrequency(freq);
        audioSocket.setFps(freq);
    }

    function mainVideoClockAdjustToSlow() {
        var freq = 20;      // About 3x slower
        mainVideoClock.setFrequency(freq);
        audioSocket.setFps(freq);
    }

    function mainComponentsCreate() {
        // Main clock will be the VDP VideoClock (60Hz/50Hz)
        // CPU and other clocks (CPU and AudioClocks dividers) will be sent by the VDP
        self.mainVideoClock = mainVideoClock = new wmsx.Clock(self.videoClockPulse);

        self.cpu = cpu = new wmsx.Z80();
        self.vdp = vdp = new wmsx.V9938(self, cpu, !MSX2);
        self.psg = psg = new wmsx.PSG(audioSocket);
        self.ppi = ppi = new wmsx.PPI(psg);
        self.rtc = rtc = new wmsx.RTC(MSX2);
        self.bus = bus = new wmsx.EngineBUS(self, cpu);
        cpu.connectBus(bus);
        ppi.connectBus(bus);
        vdp.connectBus(bus);
        psg.connectBus(bus);
        rtc.connectBus(bus);
    }

    function socketsCreate() {
        slotSocket = new SlotSocket();
        biosSocket = new BIOSSocket();
        expansionSocket = new ExpansionSocket();
        cartridgeSocket = new CartridgeSocket();
        keyboardSocket = new KeyboardSocket();
        joysticksSocket = new JoysticksSocket();
        saveStateSocket = new SaveStateSocket();
        cassetteSocket = new CassetteSocket();
        audioSocket = new AudioSocket();
        diskDriveSocket = new DiskDriveSocket();
        machineControlsSocket = new MachineControlsSocket();
        machineControlsSocket.addForwardedInput(self);
    }


    this.powerIsOn = false;

    var isLoading = false;

    var mainVideoClock;
    var cpu;
    var bus;
    var ppi;
    var vdp;
    var psg;
    var rtc;

    var userPaused = false;
    var userPauseMoreFrames = 0;
    var systemPaused = false;

    var audioSocket;
    var slotSocket;
    var machineControlsSocket;
    var keyboardSocket;
    var joysticksSocket;
    var biosSocket;
    var expansionSocket;
    var cartridgeSocket;
    var saveStateSocket;
    var cassetteSocket;
    var diskDriveSocket;

    var bios;
    var videoStandard;
    var videoStandardSoft;
    var videoStandardIsAuto = false;

    var vSynchMode;

    var MSX2 = WMSX.MACHINE_TYPE === 2;

    var BIOS_SLOT = WMSX.BIOS_SLOT;
    var CARTRIDGE0_SLOT = WMSX.CARTRIDGE1_SLOT;
    var CARTRIDGE1_SLOT = WMSX.CARTRIDGE2_SLOT;
    var EXPANSIONS_SLOTS = WMSX.EXPANSION_SLOTS;
    var EMPTY_SLOT = wmsx.SlotEmpty.singleton;

    // MachineControls interface  --------------------------------------------

    var controls = wmsx.MachineControls;

    this.controlStateChanged = function (control, state) {
        // Normal state controls
        if (control === controls.FAST_SPEED) {
            if (state) {
                self.showOSD("FAST FORWARD", true);
                mainVideoClockAdjustToFast();
            } else {
                self.showOSD(null, true);
                mainVideoClockAdjustToNormal();
            }
            return;
        }
        if (control === controls.SLOW_SPEED) {
            if (state) {
                self.showOSD("SLOW MOTION", true);
                mainVideoClockAdjustToSlow();
            } else {
                self.showOSD(null, true);
                mainVideoClockAdjustToNormal();
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
                this.userPause(!userPaused);
                this.getVideoOutput().showOSD(userPaused ? "PAUSE" : "RESUME", true);
                return;
            case controls.FRAME:
                if (userPaused) userPauseMoreFrames = 1;
                return;
            case controls.SAVE_STATE_0: case controls.SAVE_STATE_1: case controls.SAVE_STATE_2: case controls.SAVE_STATE_3: case controls.SAVE_STATE_4: case controls.SAVE_STATE_5:
            case controls.SAVE_STATE_6: case controls.SAVE_STATE_7: case controls.SAVE_STATE_8: case controls.SAVE_STATE_9: case controls.SAVE_STATE_10: case controls.SAVE_STATE_11: case controls.SAVE_STATE_12:
                var wasPaused = self.systemPause(true);
                saveStateSocket.saveState(control.to);
                if (!wasPaused) self.systemPause(false);
                break;
            case controls.SAVE_STATE_FILE:
                wasPaused = self.systemPause(true);
                saveStateSocket.saveStateFile();
                if (!wasPaused) self.systemPause(false);
                break;
            case controls.LOAD_STATE_0: case controls.LOAD_STATE_1: case controls.LOAD_STATE_2: case controls.LOAD_STATE_3: case controls.LOAD_STATE_4: case controls.LOAD_STATE_5:
            case controls.LOAD_STATE_6: case controls.LOAD_STATE_7: case controls.LOAD_STATE_8: case controls.LOAD_STATE_9: case controls.LOAD_STATE_10: case controls.LOAD_STATE_11: case controls.LOAD_STATE_12:
                wasPaused = self.systemPause(true);
                saveStateSocket.loadState(control.from);
                if (!wasPaused) self.systemPause(false);
                break;
            case controls.VIDEO_STANDARD:
                self.showOSD(null, true);	// Prepares for the upcoming "AUTO" OSD to always show
                if (videoStandardIsAuto) setVideoStandardForced(wmsx.VideoStandard.NTSC);
                else if (videoStandard == wmsx.VideoStandard.NTSC) setVideoStandardForced(wmsx.VideoStandard.PAL);
                else setVideoStandardAuto();
                break;
            case controls.VSYNCH:
                if (wmsx.Clock.HOST_NATIVE_FPS === -1) {
                    self.showOSD("V-Synch is disabled / unsupported", true);
                } else {
                    setVSynchMode(vSynchMode + 1);
                    self.showOSD("V-Synch: " + (vSynchMode === 1 ? "AUTO" : vSynchMode === 0 ? "DISABLED" : "FORCED"), true);
                }
                break;
            case controls.PALETTE:
                vdp.togglePalettes();
                break;
            case controls.DEBUG:
                vdp.toggleDebugModes();
                break;
            case controls.SPRITE_MODE:
                vdp.toggleSpriteDebugModes();
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
            slotSocket.insert(bios, BIOS_SLOT);
        };
        this.inserted = function () {
            return bios;
        };
    }


    // System Expansions Socket  --------------------------------

    function ExpansionSocket() {
        this.insert = function (expansion, port, altPower) {
            if (expansion == slotSocket.inserted(EXPANSIONS_SLOTS[port || 0])) return;
            slotSocket.insert(expansion, EXPANSIONS_SLOTS[port || 0], altPower);
        };
        this.inserted = function (port) {
            return slotSocket.inserted(EXPANSIONS_SLOTS[port || 0]);
        };
    }


    // CartridgeSocket  -----------------------------------------

    function CartridgeSocket() {

        this.insert = function (cartridge, port, altPower) {
            var slotPos = port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT;
            if (cartridge === slotSocket.inserted(slotPos)) return;
            slotSocket.insert(cartridge, slotPos);
            cartridgeSocket.fireStateUpdate();
            self.showOSD("Cartridge " + (port === 1 ? "2" : "1") + (cartridge ? " inserted" : " removed"), true);
        };

        this.inserted = function (port) {
            return slotSocket.inserted(port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT);
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


    // Slot Socket  ---------------------------------------------

    function SlotSocket() {
        this.insert = function (slot, slotPos, altPower) {
            var powerWasOn = self.powerIsOn;
            if (powerWasOn) self.powerOff();
            self.insertSlot(slot, slotPos);
            if (!altPower && (slot || powerWasOn)) self.userPowerOn();
        };
        this.inserted = function (slotPos) {
            var res = self.getSlot(slotPos);
            return res === EMPTY_SLOT ? null : res;
        };
    }


    // Audio Socket  ---------------------------------------------

    function AudioSocket() {
        this.connectMonitor = function (pMonitor) {
            monitor = pMonitor;
            for (var i = signals.length - 1; i >= 0; i--) monitor.connectAudioSignal(signals[i]);
        };
        this.connectAudioSignal = function(signal) {
            if (signals.indexOf(signal) >= 0) return;
            wmsx.Util.arrayAdd(signals, signal);
            signal.setFps(fps);
            if (monitor) monitor.connectAudioSignal(signal);
        };
        this.disconnectAudioSignal = function(signal) {
            wmsx.Util.arrayRemoveAllElement(signals, signal);
            if (monitor) monitor.disconnectAudioSignal(signal);
        };
        this.audioClockPulse32 = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].audioClockPulse();
        };
        this.audioFinishFrame = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].audioFinishFrame();
        };
        this.mute = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].mute();
        };
        this.unmute = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].play();
        };
        this.setFps = function(pFps) {
            fps = pFps;
            for (var i = signals.length - 1; i >= 0; --i) signals[i].setFps(fps);
        };
        this.pauseMonitor = function() {
            if (monitor) monitor.pause();
        };
        this.unpauseMonitor = function() {
            if (monitor) monitor.unpause();
        };

        var signals = [];
        var monitor;
        var fps;
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
        this.keyboardKeyChanged = function(key, press) {
            ppi.keyboardKeyChanged(key, press);
        };
        this.keyboardReset = function() {
            ppi.keyboardReset();
        };
    }


    // Joysticks Socket  -----------------------------------------

    function JoysticksSocket() {
        this.connectControls = function(pControls) {
            controls = pControls;
        };
        this.controlStateChanged = function(control, state) {
            psg.joystickControlStateChanged(control, state);
        };
        this.controlValueChanged = function(control, value) {
            psg.joystickControlValueChanged(control, value);
        };
        this.joysticksClockPulse = function() {
            controls.joysticksClockPulse();
        };
        var controls;
    }


    // MachineControls Socket  -----------------------------------------

    function MachineControlsSocket() {

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
            wmsx.Util.arrayRemoveAllElement(forwardedInputs, input);
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
            } else if (state.v !== VERSION) {
                self.showOSD("State " + slot + " load failed, wrong version", true);
            } else {
                if (!altPower && !self.powerIsOn) self.powerOn();
                loadState(state);
                self.showOSD("State " + slot + " loaded", true);
            }
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

        this.loadStateFile = function(data, altPower) {       // Returns true if data was indeed a SaveState
            if (!media) return false;
            var state = media.loadStateFile(data);
            if (!state) return false;
            wmsx.Util.log("SaveState file loaded");
            if (state.v !== VERSION) {
                self.showOSD("State File load failed, wrong version", true);
            } else {
                if (!altPower && !self.powerIsOn) self.powerOn();
                loadState(state);
                self.showOSD("State File loaded", true);
            }
            return true;
        };

        var media;
        var VERSION = 7;
    }


    // Debug methods  ------------------------------------------------------

    this.runFramesAtTopSpeed = function(frames) {
        mainVideoClock.pause();
        var start = performance.now();
        for (var i = 0; i < frames; i++) {
            //var pulseTime = window.performance.now();
            self.videoClockPulse();
            //console.log(window.performance.now() - pulseTime);
        }
        var duration = performance.now() - start;
        wmsx.Util.log("Done running " + frames + " frames in " + duration + " ms");
        wmsx.Util.log(frames / (duration/1000) + "  frames/sec");
        mainVideoClock.go();
    };

    this.eval = function(str) {
        return eval(str);
    };


    init();

};

wmsx.Machine.BASE_CPU_CLOCK = 228 * 262 * 60;        // 3584160Hz, rectified to 60Hz (228 clocks per line, 262 lines, 60 fps)