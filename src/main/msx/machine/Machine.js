// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Machine = function() {
"use strict";

    var self = this;

    function init() {
        socketsCreate();
        mainComponentsCreate();
        self.setMachine(WMSX.MACHINE);
        self.setDefaults();
        setVSynchMode(WMSX.SCREEN_VSYNCH_MODE);
    }

    this.setMachine = function(name) {
        this.machineName = name;
        this.machineType = WMSX.MACHINES_CONFIG[name].type || 3;
        vdp.setMachineType(this.machineType);
        rtc.setMachineType(this.machineType);
        syf.setMachineType(this.machineType);
    };

    this.powerOn = function() {
        if (this.powerIsOn) this.powerOff();
        bus.powerOn();
        if (syf) syf.powerOn();
        if (rtc) rtc.powerOn();
        ppi.powerOn();
        psg.powerOn();
        vdp.powerOn();
        cpu.powerOn();
        this.reset();
        this.powerIsOn = true;
        machineControlsSocket.firePowerAndUserPauseStateUpdate();
        if (!mainVideoClock.isRunning()) mainVideoClock.go();
    };

    this.powerOff = function() {
        cpu.powerOff();
        vdp.powerOff();
        psg.powerOff();
        ppi.powerOff();
        if (rtc) rtc.powerOff();
        if (syf) syf.powerOff();
        bus.powerOff();
        controllersSocket.resetControllers();
        this.powerIsOn = false;
        if (userPaused) this.userPause(false);
        else machineControlsSocket.firePowerAndUserPauseStateUpdate();
    };

    this.reset = function() {
        videoStandardSoft = null;
        if (videoStandardIsAuto) setVideoStandardAuto();
        controllersSocket.resetControllers();
        if (syf) syf.reset();
        if (rtc) rtc.reset();
        psg.reset();
        vdp.reset();
        cpu.reset();
        bus.reset();
        audioSocket.flushAllSignals();
    };

    this.userPowerOn = function(basicAutoRun) {
        if (isLoading) return;
        if (!bios) {
            this.getVideoOutput().showOSD("Insert BIOS!", true, true);
            return;
        }
        this.powerOn();
        if (basicAutoRun) typeBasicAutoRunCommand();
     };

    this.videoClockPulse = function() {
        if (systemPaused) return;

        if (bios) bios.getKeyboardExtension().keyboardExtensionClockPulse();
        controllersSocket.controllersClockPulse();

        if (!self.powerIsOn) return;

        if (userPaused && userPauseMoreFrames-- <= 0) return;

        vdp.videoClockPulse();

        // Finish audio signal (generate any missing samples to adjust to sample rate)
        audioSocket.audioFinishFrame();
    };

    this.getMachineTypeSocket = function() {
        return machineTypeSocket;
    };

    this.getSlotSocket = function() {
        return slotSocket;
    };

    this.getBIOSSocket = function() {
        return biosSocket;
    };

    this.getExtensionsSocket = function() {
        return extensionsSocket;
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

    this.getControllersSocket = function() {
        return controllersSocket;
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

    this.showOSD = function(message, overlap, error) {
        this.getVideoOutput().showOSD(message, overlap, error);
    };

    this.setVideoStandardSoft = function(pVideoStandard) {
        videoStandardSoft = pVideoStandard;
        if (videoStandardIsAuto && videoStandard !== pVideoStandard) setVideoStandard(pVideoStandard);
        else if (!videoStandardIsAuto && videoStandard !== pVideoStandard)
                self.showOSD("Cannot change Video Standard. Its FORCED: " + videoStandard.desc, true, true);
    };

    this.setLoading = function(state) {
        isLoading = state;
    };

    this.userPause = function(pause, keepAudio) {
        var prev = userPaused;
        if (userPaused !== pause) {
            userPaused = !!pause; userPauseMoreFrames = -1;
            if (userPaused && !keepAudio) audioSocket.muteAudio();
            else audioSocket.unMuteAudio();
            machineControlsSocket.firePowerAndUserPauseStateUpdate();
        }
        return prev;
    };

    this.systemPause = function(val) {
        var prev = systemPaused;
        if (systemPaused !== val) {
            systemPaused = !!val;
            if (systemPaused) audioSocket.pauseAudio();
            else audioSocket.unpauseAudio();
        }
        return prev;
    };

    this.isSystemPaused = function() {
        return systemPaused;
    };

    this.setBIOS = function(pBIOS) {                    // Called by SlotBIOS on connection
        bios = pBIOS === EMPTY_SLOT ? null : pBIOS;
        videoStandardSoft = null;
        setVideoStandardAuto();
    };

    this.setDefaults = function() {
        setVideoStandardAuto();
        vdp.setDefaults();
        speedControl = 1;
        alternateSpeed = null;
        mainVideoClockUpdateSpeed();
    };

    function getSlot(slotPos) {
        if (typeof slotPos === "number") slotPos = [slotPos];
        var pri = slotPos[0], sec = slotPos[1];

        var res = bus.getSlot(pri);
        if (sec >= 0) {
            if (res.isExpanded()) res = res.getSubSlot(sec);
            else res = null;
        } else {
            if (res.isExpanded()) res = res.getSubSlot(0);
        }
        return res;
    }

    function getSlotDesc(slotPos) {
        var pri = typeof slotPos === "number" ? slotPos : slotPos[0];
        return pri.toString() + (bus.getSlot(pri).isExpanded() ? "-" + (slotPos[1] || 0) : "");
    }

    function insertSlot(slot, slotPos) {
        if (typeof slotPos === "number") slotPos = [slotPos];

        if ((!slot || slot === EMPTY_SLOT) && (getSlot(slotPos) || EMPTY_SLOT) === EMPTY_SLOT) return;

        var pri = slotPos[0], sec = slotPos[1];

        var curPriSlot = bus.getSlot(pri);
        if (sec >= 0) {
            if (!curPriSlot.isExpanded()) {
                var oldPriSlot = curPriSlot;
                // Automatically insert an ExpandedSlot if not present. SpecialExpandedSlot for primary slot 2
                curPriSlot = pri === 2 ? new wmsx.SlotExpandedSpecial() : new wmsx.SlotExpanded();
                bus.insertSlot(curPriSlot, pri);
                if (oldPriSlot !== EMPTY_SLOT) curPriSlot.insertSubSlot(oldPriSlot, sec === 0 ? 1 : 0);
            }
            curPriSlot.insertSubSlot(slot, sec);
        } else {
            if (curPriSlot.isExpanded()) {
                curPriSlot.insertSubSlot(slot, 0);
            } else
                bus.insertSlot(slot, pri);
        }
    }

    function setVideoStandard(pVideoStandard, forceUpdate) {
        self.showOSD((videoStandardIsAuto ? "AUTO: " : "FORCED: ") + pVideoStandard.desc, false);
        if (!forceUpdate && videoStandard === pVideoStandard) return;

        videoStandard = pVideoStandard;
        vdp.setVideoStandard(videoStandard);
        mainVideoClockUpdateSpeed();
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
        setVideoStandard(newStandard, true);
    }

    function setVideoStandardForced(forcedVideoStandard) {
        videoStandardIsAuto = false;
        if (bios) bios.setVideoStandardForced(forcedVideoStandard);
        setVideoStandard(forcedVideoStandard);
    }

    function setVSynchMode(mode) {
        if (vSynchMode === mode) return;
        if (vSynchMode !== -1) vSynchMode = mode % 2;
        vdp.setVSynchMode(vSynchMode);
        mainVideoClockUpdateSpeed();
    }

    function powerFry() {
        //ram.powerFry();
    }

    function saveState() {
        return {
            mn: self.machineName,
            mt: self.machineType,
            b:  bus.saveState(),
            rc: rtc.saveState(),
            sf: syf.saveState(),
            pp: ppi.saveState(),
            ps: psg.saveState(),
            vd: vdp.saveState(),
            c:  cpu.saveState(),
            va: videoStandardIsAuto,
            vs: videoStandard.name,
            s: speedControl,
            br: basicAutoRunDone,
            vss: videoStandardSoft && videoStandardSoft.name,
            dd: diskDriveSocket.getDrive().saveState(),
            ct: cassetteSocket.getDeck().saveState(),
            cs: controllersSocket.saveState()
        };
    }

    function loadState(s) {
        self.machineName = s.mn;
        self.machineType = s.mt;
        videoStandardIsAuto = s.va;
        setVideoStandard(wmsx.VideoStandard[s.vs]);
        videoStandardSoft = s.vss && wmsx.VideoStandard[s.vss];
        speedControl = s.s || 1;
        basicAutoRunDone = !!s.br;
        mainVideoClockUpdateSpeed();
        cpu.loadState(s.c);
        vdp.loadState(s.vd);
        psg.loadState(s.ps);
        ppi.loadState(s.pp);
        rtc.loadState(s.rc);
        syf.loadState(s.sf);
        bus.loadState(s.b);
        diskDriveSocket.getDrive().loadState(s.dd);
        cassetteSocket.getDeck().loadState(s.ct);
        if (s.cs) controllersSocket.loadState(s.cs);
        machineTypeSocket.fireMachineTypeStateUpdate();
        cartridgeSocket.fireCartridgesStateUpdate();        // Will perform a complete Extensions refresh from Slots
        machineControlsSocket.firePowerAndUserPauseStateUpdate();
        audioSocket.flushAllSignals();
    }

    function mainVideoClockUpdateSpeed() {
        var freq = vdp.getDesiredBaseFrequency();
        mainVideoClock.setVSynch(vSynchMode > 0);
        mainVideoClock.setFrequency((freq * (alternateSpeed || speedControl)) | 0);
        audioSocket.setFps(freq);
    }

    function mainComponentsCreate() {
        // Main clock will be the VDP VideoClock (60Hz/50Hz)
        // CPU and other clocks (CPU and AudioClocks dividers) will be sent by the VDP
        self.mainVideoClock = mainVideoClock = new wmsx.Clock(self.videoClockPulse);

        self.cpu = cpu = new wmsx.Z80();
        self.vdp = vdp = new wmsx.VDP(self, cpu);
        self.psg = psg = new wmsx.PSG(audioSocket, controllersSocket);
        self.ppi = ppi = new wmsx.PPI(psg.getAudioChannel(), controllersSocket);
        self.rtc = rtc = new wmsx.RTC();
        self.syf = syf = new wmsx.SystemFlags();
        self.bus = bus = new wmsx.BUS(self, cpu);
        cpu.connectBus(bus);
        ppi.connectBus(bus);
        vdp.connectBus(bus);
        psg.connectBus(bus);
        rtc.connectBus(bus);
        syf.connectBus(bus);
    }

    function socketsCreate() {
        machineTypeSocket = new wmsx.MachineTypeSocket(self);
        slotSocket = new SlotSocket();
        biosSocket = new BIOSSocket();
        extensionsSocket = new wmsx.ExtensionsSocket(self);
        cartridgeSocket = new CartridgeSocket();
        expansionSocket = new ExpansionSocket();
        controllersSocket = new ControllersSocket();
        saveStateSocket = new SaveStateSocket();
        cassetteSocket = new CassetteSocket();
        audioSocket = new AudioSocket();
        diskDriveSocket = new DiskDriveSocket();
        machineControlsSocket = new MachineControlsSocket();
    }

    function typeBasicAutoRunCommand() {
        if (!basicAutoRunDone) {
            var type = WMSX.BASIC_ENTER ? WMSX.BASIC_ENTER + "\r" : "";
            type += WMSX.BASIC_TYPE || "";
            if (WMSX.BASIC_RUN)        bios.getKeyboardExtension().typeString('\r\r\rRUN "' + WMSX.BASIC_RUN + '"\r' + type);
            else if (WMSX.BASIC_LOAD)  bios.getKeyboardExtension().typeString('\r\r\rLOAD "' + WMSX.BASIC_LOAD + '"\r' + type);
            else if (WMSX.BASIC_BRUN)  bios.getKeyboardExtension().typeString('\r\r\rBLOAD "' + WMSX.BASIC_BRUN + '",r\r' + type);
            else if (WMSX.BASIC_BLOAD) bios.getKeyboardExtension().typeString('\r\r\rBLOAD "' + WMSX.BASIC_BLOAD + '"\r' + type);
            else {
                cassetteSocket.typeAutoRunCommand();
                if (type) bios.getKeyboardExtension().typeString(type);
            }

            basicAutoRunDone = true;
        } else
            cassetteSocket.typeAutoRunCommand();
    }


    this.machineName = null;
    this.machineType = 0;
    this.powerIsOn = false;

    var speedControl = 1;
    var alternateSpeed = false;

    var isLoading = false;
    var basicAutoRunDone = false;

    var mainVideoClock;
    var cpu;
    var bus;
    var ppi;
    var vdp;
    var psg;
    var rtc;
    var syf;

    var userPaused = false;
    var userPauseMoreFrames = 0;
    var systemPaused = false;

    var machineTypeSocket;
    var slotSocket;
    var biosSocket;
    var extensionsSocket;
    var expansionSocket;
    var cartridgeSocket;
    var saveStateSocket;
    var cassetteSocket;
    var diskDriveSocket;
    var machineControlsSocket;
    var controllersSocket;
    var audioSocket;

    var bios;
    var videoStandard;
    var videoStandardSoft;
    var videoStandardIsAuto = false;

    var vSynchMode;

    var BIOS_SLOT = WMSX.BIOS_SLOT;
    var CARTRIDGE0_SLOT = WMSX.CARTRIDGE1_SLOT;
    var CARTRIDGE1_SLOT = WMSX.CARTRIDGE2_SLOT;
    var EXPANSIONS_SLOTS = WMSX.EXPANSION_SLOTS;
    var EMPTY_SLOT = wmsx.SlotEmpty.singleton;

    var SPEEDS = [ 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2, 3, 5, 10 ];
    var SPEED_FAST = 10, SPEED_SLOW = 0.3;


    // MachineControls interface  --------------------------------------------

    var controls = wmsx.MachineControls;

    function controlStateChanged(control, state) {
        if (isLoading || systemPaused) return;

        // Normal state controls
        if (control === controls.FAST_SPEED) {
            if (state && alternateSpeed !== SPEED_FAST) {
                alternateSpeed = SPEED_FAST;
                mainVideoClockUpdateSpeed();
                self.showOSD("FAST FORWARD", true);
            } else if (!state && alternateSpeed === SPEED_FAST) {
                alternateSpeed = null;
                mainVideoClockUpdateSpeed();
                self.showOSD(null, true);
            }
            return;
        }
        if (control === controls.SLOW_SPEED) {
            if (state && alternateSpeed !== SPEED_SLOW) {
                alternateSpeed = SPEED_SLOW;
                mainVideoClockUpdateSpeed();
                self.showOSD("SLOW MOTION", true);
            } else if (!state && alternateSpeed === SPEED_SLOW) {
                alternateSpeed = null;
                mainVideoClockUpdateSpeed();
                self.showOSD(null, true);
            }
            return;
        }
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.POWER:
                if (self.powerIsOn) self.powerOff();
                else self.userPowerOn(false);
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
                self.userPause(!userPaused, false);
                self.getVideoOutput().showOSD(userPaused ? "PAUSE" : "RESUME", true);
                return;
            case controls.PAUSE_AUDIO_ON:
                self.userPause(!userPaused, true);
                self.getVideoOutput().showOSD(userPaused ? "PAUSE with AUDIO ON" : "RESUME", true);
                return;
            case controls.FRAME:
                if (userPaused) userPauseMoreFrames = 1;
                return;
            case controls.INC_SPEED: case controls.DEC_SPEED: case controls.NORMAL_SPEED: case controls.MIN_SPEED:
                var speedIndex = SPEEDS.indexOf(speedControl);
                if (control === controls.INC_SPEED && speedIndex < SPEEDS.length - 1) ++speedIndex;
                else if (control === controls.DEC_SPEED && speedIndex > 0) --speedIndex;
                else if (control === controls.MIN_SPEED) speedIndex = 0;
                else if (control === controls.NORMAL_SPEED) speedIndex = SPEEDS.indexOf(1);
                speedControl = SPEEDS[speedIndex];
                self.showOSD("Speed: " + ((speedControl * 100) | 0) + "%", true);
                mainVideoClockUpdateSpeed();
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
                if (vSynchMode === -1 || wmsx.Clock.HOST_NATIVE_FPS === -1) {
                    self.showOSD("V-Synch is disabled / unsupported", true, true);
                } else {
                    setVSynchMode(vSynchMode + 1);
                    self.showOSD("V-Synch: " + (vSynchMode === 1 ? "ON" : vSynchMode === 0 ? "OFF" : "DISABLED"), true);
                }
                break;
            case controls.CPU_TURBO_MODE:
                cpu.toggleTurboMode();
                var multi = cpu.getTurboMulti();
                self.showOSD("CPU Turbo Speed: " + (multi > 1 ? "" + multi + "x (" + cpu.getTurboFreqDesc() + ")" : "OFF"), true);
                break;
            case controls.PALETTE:
                vdp.togglePalettes();
                break;
            case controls.DEBUG:
                var resultingMode = vdp.toggleDebugModes();
                wmsx.DeviceMissing.setDebugMode(resultingMode);
                break;
            case controls.SPRITE_MODE:
                vdp.toggleSpriteDebugModes();
                break;
        }
    }


    // BIOS Socket  -----------------------------------------

    function BIOSSocket() {
        this.insert = function (bios, altPower) {
            slotSocket.insert(bios, BIOS_SLOT, altPower);
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
            self.showOSD("Expansion " + (port === 1 ? "2" : "1") + ": " + (expansion ? expansion.rom.source : "EMPTY"), true);
        };
        this.inserted = function (port) {
            return slotSocket.inserted(EXPANSIONS_SLOTS[port || 0]);
        };
    }


    // CartridgeSocket  -----------------------------------------

    function CartridgeSocket() {
        this.connectFileDownloader = function (pFileDownloader) {
            fileDownloader = pFileDownloader;
        };
        this.insert = function (cartridge, port, altPower) {
            var slotPos = port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT;
            if (cartridge === slotSocket.inserted(slotPos)) return;
            slotSocket.insert(cartridge, slotPos, altPower);
            this.fireCartridgesStateUpdate();
            self.showOSD("Cartridge " + (port === 1 ? "2" : "1") + ": " + (cartridge ? cartridge.rom.source : "EMPTY"), true);
        };
        this.remove = function (port, altPower) {
            var slotPos = port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT;
            if (slotSocket.inserted(slotPos) === null) return self.showOSD("No Cartridge in Slot " + (port === 1 ? "2" : "1"), true, true);
            slotSocket.insert(null, slotPos, altPower);
            this.fireCartridgesStateUpdate();
            self.showOSD("Cartridge " + (port === 1 ? "2" : "1") + " removed", true);
        };
        this.inserted = function (port) {
            return slotSocket.inserted(port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT);
        };
        this.dataOperationNotSupportedMessage = function(port, operation, silent) {
            var slotPos = port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT;
            var cart = slotSocket.inserted(slotPos);
            if (cart === null) {
                if (!silent) self.showOSD("No Cartridge in Slot " + (port === 1 ? "2" : "1"), true, true);
                return true;
            }
            if (!cart.getDataDesc()) {
                if (!silent)  self.showOSD("Data " + (operation ? "Saving" : "Loading") + " not supported for Cartridge " + (port === 1 ? "2" : "1"), true, true);
                return true;
            }
            return false;
        };
        this.loadCartridgeData = function (port, name, arrContent) {
            var slotPos = port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT;
            var cart = slotSocket.inserted(slotPos);
            if (!cart) return null;
            if (!cart.loadData(wmsx.Util.leafFilename(name), arrContent)) return;
            self.showOSD(cart.getDataDesc() + " loaded in Cartridge " + (port === 1 ? "2" : "1"), true);
            return arrContent;
        };
        this.saveCartridgeDataFile = function (port) {
            if (this.dataOperationNotSupportedMessage(port, true, false)) return;
            var cart = slotSocket.inserted(port === 1 ? CARTRIDGE1_SLOT : CARTRIDGE0_SLOT);
            var dataToSave = cart.getDataToSave();
            fileDownloader.startDownloadBinary(dataToSave.fileName, dataToSave.content, cart.getDataDesc());
        };
        this.fireCartridgesStateUpdate = function () {
            for (var i = 0; i < listeners.length; i++)
                listeners[i].cartridgesStateUpdate();
        };
        this.addCartridgesStateListener = function (listener, silent) {
            if (listeners.indexOf(listener) < 0) {
                listeners.push(listener);
                if (!silent) listener.cartridgesStateUpdate();
            }
        };
        var fileDownloader;
        var listeners = [];
    }


    // Slot Socket  ---------------------------------------------

    function SlotSocket() {
        this.insert = function (slot, slotPos, altPower) {
            var powerWasOn = self.powerIsOn;
            if (powerWasOn && !altPower) self.powerOff();
            insertSlot(slot, slotPos);
            if (!altPower && (slot || powerWasOn)) self.userPowerOn(false);
            else if (slot && self.powerIsOn) slot.powerOn();
        };
        this.inserted = function (slotPos) {
            var res = getSlot(slotPos);
            return res === EMPTY_SLOT ? null : res;
        };
        this.getSlotDesc = function (slotPos) {
            return getSlotDesc(slotPos);
        }
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
            this.flushAllSignals();                            // To always keep signals in synch
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
        this.muteAudio = function() {
            if (monitor) monitor.mute();
        };
        this.unMuteAudio = function() {
            if (monitor) monitor.unMute();
        };
        this.setFps = function(pFps) {
            fps = pFps;
            for (var i = signals.length - 1; i >= 0; --i) signals[i].setFps(fps);
        };
        this.pauseAudio = function() {
            if (monitor) monitor.pause();
        };
        this.unpauseAudio = function() {
            if (monitor) monitor.unpause();
        };
        this.flushAllSignals = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].flush();
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
            if (!driver || !driver.currentAutoRunCommand()) return;     // Only do power-on if there is an executable at position
            if (!self.powerIsOn && !altPower) self.userPowerOn(true);
        };
        this.typeAutoRunCommand = function () {
            if (driver) driver.typeCurrentAutoRunCommand();
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
            if (!self.powerIsOn && !altPower) self.userPowerOn(false);
        };
        this.dos2CartridgeConnected = function(cart) {
            dos2Carts.add(cart);
        };
        this.dos2CartridgeDisconnected = function(cart) {
            dos2Carts.delete(cart);
        };
        this.isDOS2 = function() {
            return dos2Carts.size > 0;
        };
        var dos2Carts = new Set();
        var drive;
    }


    // Controllers / Keyboard Socket  -----------------------------------------

    function ControllersSocket() {
        this.connectControls = function(pControls) {
            controls = pControls;
        };
        this.readKeyboardPort = function(row) {
            return controls.readKeyboardPort(row);
        };
        this.readControllerPort = function(port) {
            return controls.readControllerPort(port);
        };
        this.writeControllerPin8Port = function(port, value) {
            controls.writeControllerPin8Port(port, value);
        };
        this.releaseControllers = function() {
            controls.releaseControllers();
        };
        this.resetControllers = function() {
            controls.resetControllers();
        };
        this.controllersClockPulse = function() {
            controls.controllersClockPulse();
        };
        this.getBUSCycles = function() {
            return cpu.getBUSCycles();
        };
        this.saveState = function() {
            return controls.saveState();
        };
        this.loadState = function(s) {
            controls.loadState(s);
        };
        var controls;
    }


    // MachineControls Socket  -----------------------------------------

    function MachineControlsSocket() {
        this.setDefaults = function() {
            self.setDefaults();
        };
        this.controlStateChanged = function(control, state) {
            controlStateChanged(control, state);
        };
        this.addPowerAndUserPauseStateListener = function(listener) {
            if (powerAndUserPauseStateListeners.indexOf(listener) >= 0) return;
            powerAndUserPauseStateListeners.push(listener);
            this.firePowerAndUserPauseStateUpdate();
        };
        this.firePowerAndUserPauseStateUpdate = function() {
            for (var i = 0; i < powerAndUserPauseStateListeners.length; ++i)
                powerAndUserPauseStateListeners[i].machinePowerAndUserPauseStateUpdate(self.powerIsOn, userPaused);
        };
        this.getControlReport = function(control) {
            switch (control) {
                case controls.VIDEO_STANDARD:
                    return { label: videoStandardIsAuto ? "Auto" : videoStandard.name, active: !videoStandardIsAuto };
                case controls.CPU_TURBO_MODE:
                    var mode = cpu.getTurboMulti() > 1 ? cpu.getTurboFreqDesc() : "OFF";
                    return { label: mode, active: mode !== "OFF" };
                case controls.SPRITE_MODE:
                    var desc = vdp.getSpriteDebugModeQuickDesc();
                    return { label: desc, active: desc !== "Normal" };
            }
            return { label: "Unknown", active: false };
        };
        var powerAndUserPauseStateListeners = [];
    }


    // SavestateSocket  -----------------------------------------

    function SaveStateSocket() {
        this.connectMedia = function(pMedia) {
            media = pMedia;
        };
        this.saveState = function(slot) {
            if (!self.powerIsOn || !media) return;
            var state = saveState();
            state.v = VERSION;
            if (media.saveState(slot, state))
                self.showOSD("State " + slot + " saved", true);
            else
                self.showOSD("State " + slot + " save FAILED!", true, true);
        };
        this.loadState = function(slot) {
            if (!media) return;
            var state = media.loadState(slot);
            if (!state) {
                self.showOSD("State " + slot + " not found!", true, true);
            } else if (state.v !== VERSION) {
                self.showOSD("State " + slot + " load failed, wrong version!", true, true);
            } else {
                if (!self.powerIsOn) self.powerOn();
                loadState(state);
                self.showOSD("State " + slot + " loaded", true);
            }
        };
        this.saveStateFile = function() {
            if (!self.powerIsOn || !media) return;
            var state = saveState();
            state.v = VERSION;
            media.saveStateFile(state);
        };
        this.loadStateFile = function(data) {       // Returns true if data was indeed a SaveState
            if (!media) return false;
            var state = media.loadStateFile(data);
            if (!state) return false;
            wmsx.Util.log("SaveState file loaded");
            if (state.v !== VERSION) {
                self.showOSD("State File load failed, wrong version!", true, true);
            } else {
                if (!self.powerIsOn) self.powerOn();
                loadState(state);
                self.showOSD("State File loaded", true);
            }
            return true;
        };
        var media;
        var VERSION = 9;
    }


    // Debug methods  ------------------------------------------------------

    this.runFramesAtTopSpeed = function(frames) {
        mainVideoClock.pause();
        var start = wmsx.Util.performanceNow();
        for (var i = 0; i < frames; i++) {
            //var pulseTime = wmsx.Util.performanceNow();
            self.videoClockPulse();
            //console.log(wmsx.Util.performanceNow() - pulseTime);
        }
        var duration = wmsx.Util.performanceNow() - start;
        wmsx.Util.log("Done running " + frames + " frames in " + (duration | 0) + " ms");
        wmsx.Util.log((frames / (duration/1000)).toFixed(2) + "  frames/sec");
        mainVideoClock.go();
    };

    this.eval = function(str) {
        return eval(str);
    };


    init();

};

wmsx.Machine.BASE_CPU_CLOCK = 228 * 262 * 60;        // 3584160Hz, rectified to 60Hz (228 clocks per line, 262 lines, 60 fps)