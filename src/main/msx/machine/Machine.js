// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Machine = function() {
"use strict";

    var self = this;

    function init() {
        socketsCreate();
        mainComponentsCreate();
        computeBasicAutoRunCommandParameters();
    }

    this.socketsConnected = function() {
        self.updateMachineType();
        self.setCPUTurboMode(cpuTurboMode);
        self.setVDPTurboMode(vdpTurboMode);
        self.setDefaults();
    };

    this.updateMachineType = function() {
        this.machineName = WMSX.MACHINE;
        this.machineType = WMSX.MACHINES_CONFIG[this.machineName].TYPE || 3;
        vdp.setMachineType(this.machineType);
        rtc.setMachineType(this.machineType);
        syf.setMachineType(this.machineType);
        cpuTurboMode = WMSX.CPU_TURBO_MODE === 1 ? 2 : WMSX.CPU_TURBO_MODE;    // backward compatibility
        vdpTurboMode = WMSX.VDP_TURBO_MODE;
        biosSocket.turboDriverTurboModesUpdate();
        bus.refreshConnect();
        machineTypeSocket.fireMachineTypeStateUpdate();
    };

    this.preStart = function() {
        extensionsSocket.refreshConfigFromSlots();
    };

    this.powerOn = function(fromState) {
        if (this.powerIsOn) this.powerOff();
        bus.powerOn();
        syf.powerOn();
        rtc.powerOn();
        ppi.powerOn();
        psg.powerOn();
        vdp.powerOn();
        cpu.powerOn();
        this.reset(fromState);
        this.powerIsOn = true;
        if (!fromState) machineControlsSocket.firePowerAndUserPauseStateUpdate();       // loadState will fire it
    };

    this.powerOff = function() {
        cpu.powerOff();
        vdp.powerOff();
        psg.powerOff();
        ppi.powerOff();
        rtc.powerOff();
        syf.powerOff();
        bus.powerOff();
        controllersSocket.resetControllers();
        this.powerIsOn = false;
        if (userPaused) this.userPause(false);
        else machineControlsSocket.firePowerAndUserPauseStateUpdate();
    };

    this.reset = function(fromState) {
        videoStandardSoft = null;
        if (videoStandardIsAuto) setVideoStandardAuto();
        controllersSocket.resetControllers();
        syf.reset();
        rtc.reset();
        ppi.reset();
        psg.reset();
        vdp.reset();
        cpu.reset();
        bus.reset();
        audioSocket.flushAllSignals();
        if (fastBootFrames > 0) {
            if (!fromState) {
                // Init fast speed
                fastBootCountdown = fastBootFrames;
                alternateSpeed = SPEED_FAST;
                videoClockUpdateSpeed();
            } else {
                // Cancel fast speed
                if (fastBootCountdown > 0) {
                    alternateSpeed = null;
                    videoClockUpdateSpeed();
                }
            }
        }
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
        // Video clock will be the VDP Frame video clock (60Hz/50Hz)
        // CPU and other clocks will be sent by the VDP

        // Fast Boot
        if (fastBootCountdown > 0) {
            if (--fastBootCountdown <= 0) {
                alternateSpeed = null;
                videoClockUpdateSpeed();
            }
        }

        rtc.videoClockPulse();
        if (bios) bios.getKeyboardExtension().keyboardExtensionClockPulse();

        if (!self.powerIsOn) return;

        if (userPaused && userPauseMoreFrames-- <= 0) return;

        vdp.videoClockPulse();

        // Finish audio signal (generate any missing samples to adjust to sample rate)
        audioSocket.audioFinishFrame();
    };

    this.getMachineTypeSocket = function() {
        return machineTypeSocket;
    };

    this.getVideoClockSocket = function() {
        return videoClockSocket;
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

    this.getLedsSocket = function() {
        return ledsSocket;
    };

    this.showOSD = function(message, overlap, error) {
        this.getVideoOutput().showOSD(message, overlap, error);
    };

    this.setVideoStandardSoft = function(pVideoStandard) {
        videoStandardSoft = pVideoStandard;
        if (videoStandardIsAuto && videoStandard !== pVideoStandard) setVideoStandard(pVideoStandard, false, true);     // force OSD
        else if (!videoStandardIsAuto && videoStandard !== pVideoStandard)
                self.showOSD("Cannot change Video Standard. Its FORCED: " + videoStandard.desc, true, true);
    };

    this.setBIOS = function(pBIOS) {                    // Called by SlotBIOS on connection
        bios = pBIOS === EMPTY_SLOT ? null : pBIOS;
        videoStandardSoft = null;
        setVideoStandardAuto();
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

    // To be called once and only by Room during Native Video Freq detection
    this.vSynchSetSupported = function(boo) {
        var user = WMSX.userPreferences.current.vSynch;
        var mode = WMSX.SCREEN_VSYNC_MODE !== -1 && boo
            ? WMSX.SCREEN_VSYNC_MODE >= 0
                ? WMSX.SCREEN_VSYNC_MODE
                : user !== null && user >= 0 ? user : 1
            : -1;
        setVSynchMode(mode, true);  // force
    };

    this.toggleCPUTurboMode = function(dec) {
        if (dec) this.setCPUTurboMode(cpuTurboMode < 0 ? 8 : cpuTurboMode === 0 ? -1 : cpuTurboMode <= 1.5 ? 0 : cpuTurboMode <= 2 ? 1.5 : (cpuTurboMode | 0) - 1);
        else     this.setCPUTurboMode(cpuTurboMode === 0 ? 1.5 : cpuTurboMode < 1 ? 0 : cpuTurboMode < 1.5 ? 1.5 : (cpuTurboMode | 0) + 1);
        this.showCPUTurboModeMessage();
    };

    this.setCPUTurboMode = function(mode) {
        cpuTurboMode = mode < 0 || mode > 8 ? -1 : mode === 1 ? 2 : mode;        // -1, 0..8
        biosSocket.turboDriverTurboModesUpdate();
    };

    this.getCPUTurboMode = function() {
        return cpuTurboMode;
    };

    this.showCPUTurboModeMessage = function() {
        self.showOSD("CPU Turbo: " + this.getCPUTurboModeDesc(), true);
    };

    this.getCPUTurboModeDesc = function() {
        var desc = cpuTurboMode < 0 ? "OFF " : cpuTurboMode === 0 ? "Auto " : "";
        var multi = cpu.getCPUTurboMulti();
        desc += (multi !== 1 ? "" + multi + "x " : "") + "(" + cpu.getCPUTurboFreqDesc() + ")";
        return desc;
    };

    this.toggleVDPTurboMode = function(dec) {
        if (dec) this.setVDPTurboMode(vdpTurboMode < 0 ? 9 : vdpTurboMode === 2 ? 0 : vdpTurboMode - 1);
        else     this.setVDPTurboMode(vdpTurboMode + 1);
        self.showOSD("VDP Engine Turbo: " + this.getVDPTurboModeDesc(), true);
    };

    this.setVDPTurboMode = function(mode) {
        vdpTurboMode = mode < 0 || mode > 9 ? -1 : mode === 1 ? 2 : mode;        // -1, 0, 2..9
        biosSocket.turboDriverTurboModesUpdate();
    };

    this.getVDPTurboMode = function() {
        return vdpTurboMode;
    };

    this.getVDPTurboModeDesc = function() {
        var desc = vdpTurboMode < 0 ? "OFF " : vdpTurboMode === 0 ? "Auto " : vdpTurboMode === 9 ? "Instant" : "";
        var multi = vdp.getVDPTurboMulti();
        desc += (multi > 1 && multi < 9 ? "" + multi + "x " : "");
        return desc;
    };

    this.setDefaults = function() {
        setVideoStandardAuto(false);        // no OSD
        vdp.setDefaults();
        speedControl = defaultSpeed;
        alternateSpeed = null;
        videoClockUpdateSpeed();
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
        return pri > 3 ? undefined : pri.toString() + (bus.getSlot(pri).isExpanded() ? "-" + (slotPos[1] || 0) : "");
    }

    function insertSlot(slot, slotPos) {
        if (typeof slotPos === "number") slotPos = [slotPos];

        var isEmpty = !slot || slot === EMPTY_SLOT;
        if (isEmpty && sec !== -1 && (getSlot(slotPos) || EMPTY_SLOT) === EMPTY_SLOT) return;

        var pri = slotPos[0], sec = slotPos[1];

        var curPriSlot = bus.getSlot(pri);
        if (sec >= 0) {
            if (!curPriSlot.isExpanded()) {
                var oldPriSlot = curPriSlot;
                // Automatically insert an ExpandedSlot if not present
                // ExpandedSlotSpecial for primary slot 2. SlotExpandedModules for extra slot 4
                curPriSlot = pri === 2 ? new wmsx.SlotExpandedSpecial() : pri === 4 ? new wmsx.SlotExpandedModules() : new wmsx.SlotExpanded();
                bus.insertSlot(curPriSlot, pri);
                if (oldPriSlot !== EMPTY_SLOT && sec > 0) curPriSlot.insertSubSlot(oldPriSlot, 0);
            }
            curPriSlot.insertSubSlot(slot, sec);
            // Demotes an Expanded slot to a normal Empty slot if all empty
            if (isEmpty && curPriSlot.isAllEmpty()) bus.insertSlot(slot, pri);
        } else {
            if (curPriSlot.isExpanded() && sec !== -1) {
                curPriSlot.insertSubSlot(slot, 0);
                // Demotes an Expanded slot to a normal Empty slot if all empty
                if (isEmpty && curPriSlot.isAllEmpty()) bus.insertSlot(slot, pri);
            } else
                bus.insertSlot(slot, pri);      // will remove any ExpandedSlot present if sec = -1
        }
    }

    function setVideoStandard(pVideoStandard, forceUpdate, osdMode) {
        if (osdMode !== false) self.showOSD((videoStandardIsAuto ? "AUTO: " : "FORCED: ") + pVideoStandard.desc, !!osdMode);
        if (!forceUpdate && videoStandard === pVideoStandard) return;

        videoStandard = pVideoStandard;
        vdp.setVideoStandard(videoStandard);
        videoClockUpdateSpeed();
    }

    function setVideoStandardAuto(osdMode) {
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
        setVideoStandard(newStandard, true, osdMode);
    }

    function setVideoStandardForced(forcedVideoStandard) {
        videoStandardIsAuto = false;
        if (bios) bios.setVideoStandardForced(forcedVideoStandard);
        setVideoStandard(forcedVideoStandard, false, true);     // force OSD
    }

    function setVSynchMode(mode, force) {
        if (vSynchMode === mode && !force) return;
        vSynchMode = mode < 0 ? mode : mode % 2;
        vdp.setVSynchMode(vSynchMode);
        videoClockUpdateSpeed();
    }

    function vSynchModeToggle() {
        if (vSynchMode < 0 || videoClockSocket.getVSynchNativeFrequency() === -1)
            return self.showOSD("VSync is disabled / unsupported", true, true);

        setVSynchMode(vSynchMode + 1);
        self.showOSD("VSync: " + (vSynchMode === 1 ? "Auto (" + (videoClockSocket.isVSynchActive() ? "ON" : "OFF") + ")" : vSynchMode === 0 ? "OFF" : "DISABLED"), true);

        // Persist
        WMSX.userPreferences.current.vSynch = vSynchMode;
        WMSX.userPreferences.setDirty();
        WMSX.userPreferences.save();
    }

    function saveState(extended) {
        var s = {
            cfg: wmsx.Configurator.saveState(),
            mn: self.machineName,
            mt: self.machineType,
            b:  bus.saveState(),
            rc: rtc.saveState(),
            sf: syf.saveState(),
            pp: ppi.saveState(),
            ps: psg.saveState(),
            vd: vdp.saveState(extended),
            c:  cpu.saveState(),
            va: videoStandardIsAuto,
            vs: videoStandard.name,
            ctm: cpuTurboMode,
            vtm: vdpTurboMode,
            s: speedControl,
            br: basicAutoRunDone,
            bc: basicAutoRunCommand || "",
            vss: videoStandardSoft && videoStandardSoft.name,
            dd: diskDriveSocket.getDrive().saveState(),
            ct: cassetteSocket.getDeck().saveState(),
            cs: controllersSocket.saveState()
        };
        if (extended) {
            s.vy = vSynchMode;
            s.pw = self.powerIsOn;
            s.up = userPaused;
            s.upf = userPauseMoreFrames;
        }
        return s;
    }
    this.saveState = saveState;

    function loadState(s) {
        // Configuration
        wmsx.Configurator.loadState(s, s.cfg);

        // Extended
        if (s.vy !== undefined) setVSynchMode(s.vy, true);  // force update
        if (s.pw !== undefined && self.powerIsOn !== s.pw) s.pw ? self.powerOn(true) : self.powerOff();    // true = powerOn from state
        if (s.up !== undefined) self.userPause(s.up);
        if (s.upf !== undefined) userPauseMoreFrames = s.upf;

        // Normal
        self.machineName = s.mn;
        self.machineType = s.mt;
        videoStandardIsAuto = s.va;
        setVideoStandard(wmsx.VideoStandard[s.vs]);
        videoStandardSoft = s.vss && wmsx.VideoStandard[s.vss];
        speedControl = s.s || 1; if (speedControl === 1) speedControl = defaultSpeed;
        basicAutoRunDone = !!s.br;
        if (s.bc !== undefined) basicAutoRunCommand = s.bc;
        videoClockUpdateSpeed();
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
        diskDriveSocket.fireInterfacesChangeUpdate();
        cpuTurboMode = s.ctm !== undefined ? s.ctm : cpu.getCPUTurboMulti() > 1 ? cpu.getCPUTurboMulti() : 0;
        vdpTurboMode = s.vtm !== undefined ? s.vtm : vdp.getVDPTurboMulti() > 1 ? vdp.getVDPTurboMulti() : 0;
        biosSocket.turboDriverTurboModesUpdate();
        saveStateSocket.externalStateChange();
    }
    this.loadState = loadState;

    function videoClockUpdateSpeed() {
        var pulldown = vdp.getDesiredVideoPulldown();
        videoClockSocket.setVSynch(vSynchMode === 1);
        var hostFreq = (pulldown.frequency * (alternateSpeed || speedControl)) | 0;
        videoClockSocket.setFrequency(hostFreq, pulldown.divider);
        audioSocket.setFps(hostFreq / pulldown.divider);
        rtc.setFps(pulldown.frequency / pulldown.divider);
    }

    function mainComponentsCreate() {
        self.cpu = cpu = new wmsx.Z80();
        self.vdp = vdp = new wmsx.VDP(self, cpu);
        self.psg = psg = new wmsx.PSG(controllersSocket, ledsSocket, false);
        self.ppi = ppi = new wmsx.PPI(psg.getAudioChannel(), controllersSocket, ledsSocket);
        self.rtc = rtc = new wmsx.RTC(videoClockSocket);
        self.syf = syf = new wmsx.SystemFlags();
        self.bus = bus = new wmsx.BUS(self, cpu);
        cpu.connectBus(bus);
        ppi.connectBus(bus);
        vdp.connectBus(bus);
        psg.setAudioSocket(audioSocket);
        psg.connectBus(bus);
        rtc.connectBus(bus);
        syf.connectBus(bus);
    }

    function socketsCreate() {
        machineTypeSocket = new wmsx.MachineTypeSocket(self);
        videoClockSocket = new VideoClockSocket();
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
        ledsSocket = new LedsSocket();
    }

    function computeBasicAutoRunCommandParameters() {
        basicAutoRunCommand = (WMSX.BASIC_ENTER ? WMSX.BASIC_ENTER + "\r" : "") + (WMSX.BASIC_TYPE || "");
        if (WMSX.BASIC_RUN)        basicAutoRunCommand = '\r\r\rRUN "' + WMSX.BASIC_RUN + '"\r' + basicAutoRunCommand;
        else if (WMSX.BASIC_LOAD)  basicAutoRunCommand = '\r\r\rLOAD "' + WMSX.BASIC_LOAD + '"\r' + basicAutoRunCommand;
        else if (WMSX.BASIC_BRUN)  basicAutoRunCommand = '\r\r\rBLOAD "' + WMSX.BASIC_BRUN + '",r\r' + basicAutoRunCommand;
        else if (WMSX.BASIC_BLOAD) basicAutoRunCommand = '\r\r\rBLOAD "' + WMSX.BASIC_BLOAD + '"\r' + basicAutoRunCommand;
    }

    function typeBasicAutoRunCommand() {
        // Cassette auto run: only if there is no other possible bootable media inserted
        if (!diskDriveSocket.hasAnyMediaInserted() && !cartridgeSocket.hasAnyMediaInserted())
            cassetteSocket.typeAutoRunCommand();
        // Basic command from parameters
        if (!basicAutoRunDone) {
            if (basicAutoRunCommand) biosSocket.keyboardExtensionTypeString(basicAutoRunCommand);
            basicAutoRunDone = true;
            basicAutoRunCommand = undefined;
        }
    }


    this.machineName = null;
    this.machineType = 0;
    this.powerIsOn = false;

    var speedControl = 1;
    var alternateSpeed = false;
    var defaultSpeed = WMSX.SPEED > 0 ? WMSX.SPEED / 100 : 1;

    var isLoading = false;
    var basicAutoRunDone = false, basicAutoRunCommand;

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
    var videoClockSocket;
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
    var ledsSocket;

    var bios;
    var videoStandard;
    var videoStandardSoft;
    var videoStandardIsAuto = false;

    var vSynchMode;

    var fastBootFrames = WMSX.FAST_BOOT <= 0 ? 0 : WMSX.FAST_BOOT > 1 ? WMSX.FAST_BOOT : WMSX.BOOT_KEYS_FRAMES > 0 ? WMSX.BOOT_KEYS_FRAMES : WMSX.BOOT_DURATION_AUTO;
    var fastBootCountdown = 0;

    var cpuTurboMode = 0;
    var vdpTurboMode = 0;

    var EMPTY_SLOT = wmsx.SlotEmpty.singleton;

    var SPEEDS = [ 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2, 3, 5, 10 ];
    var SPEED_FAST = 10, SPEED_SLOW = 0.3;


    // MachineControls interface  --------------------------------------------

    var controls = wmsx.MachineControls;

    function controlStateChanged(control, state, altFunc, data) {
        if (isLoading) return;

        // Normal state controls
        if (control === controls.FAST_SPEED && !altFunc) {
            if (state && alternateSpeed !== SPEED_FAST) {
                alternateSpeed = SPEED_FAST;
                videoClockUpdateSpeed();
                self.showOSD("FAST FORWARD", true);
            } else if (!state && alternateSpeed === SPEED_FAST) {
                alternateSpeed = null;
                videoClockUpdateSpeed();
                self.showOSD(null, true);
            }
            return;
        }
        if (control === controls.FAST_SPEED && altFunc) {
            if (state && alternateSpeed !== SPEED_SLOW) {
                alternateSpeed = SPEED_SLOW;
                videoClockUpdateSpeed();
                self.showOSD("SLOW MOTION", true);
            } else if (!state && alternateSpeed === SPEED_SLOW) {
                alternateSpeed = null;
                videoClockUpdateSpeed();
                self.showOSD(null, true);
            }
            return;
        }
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.POWER:
                if (!altFunc) {
                    if (self.powerIsOn) self.powerOff();
                    else self.userPowerOn(false);
                } else {
                    if (self.powerIsOn) self.reset();
                }
                break;
            case controls.POWER_OFF:
                if (self.powerIsOn) self.powerOff();
                break;
            case controls.PAUSE:
                self.userPause(!userPaused, altFunc);
                self.getVideoOutput().showOSD(userPaused ? "PAUSE" + (altFunc ? " with AUDIO ON" : "") : "RESUME", true);
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
                videoClockUpdateSpeed();
                return;
            case controls.SAVE_STATE_0: case controls.SAVE_STATE_1: case controls.SAVE_STATE_2: case controls.SAVE_STATE_3: case controls.SAVE_STATE_4: case controls.SAVE_STATE_5:
            case controls.SAVE_STATE_6: case controls.SAVE_STATE_7: case controls.SAVE_STATE_8: case controls.SAVE_STATE_9: case controls.SAVE_STATE_10: case controls.SAVE_STATE_11: case controls.SAVE_STATE_12:
                // ASSYNC! Get binary encoded slot number
                saveStateSocket.saveState(control & 0xff);
                break;
            case controls.SAVE_STATE_FILE:
                saveStateSocket.saveStateFile();
                break;
            case controls.LOAD_STATE_0: case controls.LOAD_STATE_1: case controls.LOAD_STATE_2: case controls.LOAD_STATE_3: case controls.LOAD_STATE_4: case controls.LOAD_STATE_5:
            case controls.LOAD_STATE_6: case controls.LOAD_STATE_7: case controls.LOAD_STATE_8: case controls.LOAD_STATE_9: case controls.LOAD_STATE_10: case controls.LOAD_STATE_11: case controls.LOAD_STATE_12:
                // ASSYNC! Get binary encoded slot number
                saveStateSocket.loadState(control & 0xff);
                break;
            case controls.TYPE_STRING:
                biosSocket.keyboardExtensionTypeString(data);
                break;
            case controls.VIDEO_STANDARD:
                // always force OSD
                if (videoStandardIsAuto) setVideoStandardForced(altFunc ? wmsx.VideoStandard.PAL : wmsx.VideoStandard.NTSC);
                else if (videoStandard == wmsx.VideoStandard.NTSC) altFunc ? setVideoStandardAuto(true) : setVideoStandardForced(wmsx.VideoStandard.PAL);
                else altFunc ? setVideoStandardForced(wmsx.VideoStandard.NTSC) : setVideoStandardAuto(true);
                break;
            case controls.VSYNCH:
                vSynchModeToggle();
                break;
            case controls.CPU_TURBO_MODE:
                self.toggleCPUTurboMode(altFunc);
                break;
            case controls.VDP_TURBO_MODE:
                self.toggleVDPTurboMode(altFunc);
                break;
            case controls.DEBUG:
                var resultingMode = vdp.toggleDebugModes(altFunc);
                wmsx.DeviceMissing.setDebugMode(resultingMode);
                break;
            case controls.SPRITE_MODE:
                vdp.toggleSpriteDebugModes(altFunc);
                break;
            case controls.DEFAULTS:
                self.setDefaults();
                self.showOSD("Default Settings", true);
                break;
        }
    }


    // Video Clock Socket  -----------------------------------------

    function VideoClockSocket() {
        this.connectClock = function(clock) {
            videoClock = clock;
            rtc.syncTimeWithSource();
        };
        this.getVSynchNativeFrequency = function() {
            return videoClock.getVSynchNativeFrequency();
        };
        this.setVSynch = function(state) {
            videoClock.setVSynch(state);
        };
        this.setFrequency = function(freq, div) {
            videoClock.setFrequency(freq, div);
        };
        this.isVSynchActive = function() {
            return videoClock.isVSynchActive();
        };
        this.getRealTime = function() {
            return videoClock.getRealTime();
        };
        var videoClock;
    }


    // BIOS Socket  -----------------------------------------

    function BIOSSocket() {
        this.insertBIOS = function (bios, altPower) {
            slotSocket.insertSlot(bios, WMSX.BIOS_SLOT, altPower);
        };
        this.insertBIOSEXT = function (biosExt, altPower) {
            slotSocket.insertSlot(biosExt, WMSX.BIOSEXT_SLOT, altPower);
        };
        this.keyboardExtensionTypeString = function(str) {
            if (bios) bios.getKeyboardExtension().typeString(str);
        };
        this.keyboardExtensionCancelTypeString = function() {
            if (bios) bios.getKeyboardExtension().cancelTypeString();
        };
        this.turboDriverTurboModesUpdate = function() {
            if (bios) bios.getTurboDriver().turboModesUpdate();
        };
        this.setMachineTurboModesStateListener = function(list) {
            machineTurboModesListener = list;
            machineTurboModesListener.machineTurboModesStateUpdate();
        };
        this.fireMachineTurboModesStateUpdate = function() {
            if (machineTurboModesListener) machineTurboModesListener.machineTurboModesStateUpdate();
        };
        var machineTurboModesListener;
    }


    // System Expansions Socket  --------------------------------

    function ExpansionSocket() {
        this.insertExpansion = function (expansion, port, altPower) {
            var slot = port ? WMSX.EXPANSION2_SLOT : WMSX.EXPANSION1_SLOT;
            if (expansion === slotSocket.slotInserted(slot)) return;
            slotSocket.insertSlot(expansion, slot, altPower);
            cartridgeSocket.fireCartridgesStateUpdate();
            self.showOSD("Expansion " + (port === 1 ? "2" : "1") + " (slot " + getSlotDesc(slot) + "): " + (expansion ? expansion.rom.source : "EMPTY"), true);
        };
        this.expansionInserted = function (port) {
            return slotSocket.slotInserted(port ? WMSX.EXPANSION2_SLOT : WMSX.EXPANSION1_SLOT);
        };
    }


    // CartridgeSocket  -----------------------------------------

    function CartridgeSocket() {
        this.insertCartridge = function (cartridge, port, altPower, skipMessage) {
            var slotPos = port === 1 ? WMSX.CARTRIDGE2_SLOT : WMSX.CARTRIDGE1_SLOT;
            slotSocket.insertSlot(cartridge, slotPos, altPower, true);  // internal
            this.fireCartridgesStateUpdate();
            if (!skipMessage) self.showOSD("Cartridge " + (port === 1 ? "2" : "1") + ": " + (cartridge ? cartridge.rom.source : "EMPTY"), true);
        };
        this.removeCartridge = function (port, altPower) {
            var slotPos = port === 1 ? WMSX.CARTRIDGE2_SLOT : WMSX.CARTRIDGE1_SLOT;
            if (slotSocket.slotInserted(slotPos) === null) {
                self.showOSD("No Cartridge in Slot " + (port === 1 ? "2" : "1"), true, true);
                return false;
            }
            slotSocket.insertSlot(null, slotPos, altPower, true);     // internal
            this.fireCartridgesStateUpdate();
            self.showOSD("Cartridge " + (port === 1 ? "2" : "1") + " removed", true);
            return true;
        };
        this.cartridgeInserted = function (port) {
            return slotSocket.slotInserted(port === 1 ? WMSX.CARTRIDGE2_SLOT : WMSX.CARTRIDGE1_SLOT);
        };
        this.dataOperationNotSupportedMessage = function(port, operation, silent) {
            var slotPos = port === 1 ? WMSX.CARTRIDGE2_SLOT : WMSX.CARTRIDGE1_SLOT;
            var cart = slotSocket.slotInserted(slotPos);
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
            var slotPos = port === 1 ? WMSX.CARTRIDGE2_SLOT : WMSX.CARTRIDGE1_SLOT;
            var cart = slotSocket.slotInserted(slotPos);
            if (!cart) return;
            if (!cart.loadData(wmsx.Util.leafFilename(name), arrContent)) return;
            self.showOSD(cart.getDataDesc() + " loaded in Cartridge " + (port === 1 ? "2" : "1"), true);
            return arrContent;
        };
        this.getCartridgeData = function (port) {
            if (this.dataOperationNotSupportedMessage(port, true, false)) return;
            var cart = slotSocket.slotInserted(port === 1 ? WMSX.CARTRIDGE2_SLOT : WMSX.CARTRIDGE1_SLOT);
            return cart.getDataToSave();
        };
        this.fireCartridgesStateUpdate = function () {
            for (var i = 0; i < listeners.length; i++)
                listeners[i].cartridgesStateUpdate();
        };
        this.fireCartridgesModifiedStateUpdate = function () {
            if (modifiedListener)
                modifiedListener.cartridgesModifiedStateUpdate(slotSocket.slotInserted(WMSX.CARTRIDGE1_SLOT), slotSocket.slotInserted(WMSX.CARTRIDGE2_SLOT));
        };
        this.addCartridgesStateListener = function (listener, silent) {
            if (listeners.indexOf(listener) < 0) {
                listeners.push(listener);
                if (!silent) listener.cartridgesStateUpdate();
            }
        };
        this.setCartridgesModifiedStateListener = function (listener) {
            modifiedListener = listener;
            this.fireCartridgesModifiedStateUpdate();
        };
        this.hasAnyMediaInserted = function() {
            return slotSocket.slotInserted(WMSX.CARTRIDGE1_SLOT) || slotSocket.slotInserted(WMSX.CARTRIDGE2_SLOT);
        };
        var listeners = [];
        var modifiedListener;
    }


    // Slot Socket  ---------------------------------------------

    function SlotSocket() {
        this.insertSlot = function (slot, slotPos, altPower, internal) {
            var powerWasOn = self.powerIsOn;
            if (powerWasOn && !altPower) self.powerOff();
            insertSlot(slot, slotPos);
            if (!altPower && (slot || powerWasOn)) self.userPowerOn(false);
            else if (slot && self.powerIsOn) slot.powerOn();

            if (!internal) saveStateSocket.externalStateChange();
        };
        this.slotInserted = function (slotPos) {
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
            if (monitor) monitor.pauseAudio();
        };
        this.unpauseAudio = function() {
            if (monitor) monitor.unpauseAudio();
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
        this.connectDrive = function (pDrive) {     // Multi Disk/HardDisk drive
            drive = pDrive;
        };
        this.getDrive = function() {
            return drive;
        };
        this.autoPowerCycle = function (altPower) {
            // No power cycle by default if machine is on, only auto power on.
            if (!self.powerIsOn && !altPower) self.userPowerOn(false);
        };
        this.diskInterfaceConnected = function(cart) {
            diskInterfaces.add(cart);
            this.fireInterfacesChangeUpdate();
        };
        this.diskInterfaceDisconnected = function(cart) {
            diskInterfaces.delete(cart);
            this.fireInterfacesChangeUpdate();
        };
        this.hardDiskInterfaceConnected = function(cart) {
            hardDiskInterfaces.add(cart);
            this.fireInterfacesChangeUpdate();
        };
        this.hardDiskInterfaceDisconnected = function(cart) {
            hardDiskInterfaces.delete(cart);
            this.fireInterfacesChangeUpdate();
        };
        this.dos2ROMConnected = function(cart) {
            dos2ROMs.add(cart);
        };
        this.dos2ROMDisconnected = function(cart) {
            dos2ROMs.delete(cart);
        };
        this.hasDiskInterface = function() {
            return diskInterfaces.size > 0;
        };
        this.hasHardDiskInterface = function() {
            return hardDiskInterfaces.size > 0;
        };
        this.hasDOS2 = function() {
            return dos2ROMs.size > 0 || hardDiskInterfaces.size > 0;
        };
        this.setInterfacesChangeListener = function(list) {
            interfacesChangeListener = list;
            this.fireInterfacesChangeUpdate();
        };
        this.fireInterfacesChangeUpdate = function() {
            if (interfacesChangeListener)
                interfacesChangeListener.diskInterfacesStateUpdate(this.hasDiskInterface(), this.hasHardDiskInterface());
        };
        this.hasAnyMediaInserted = function() {
            return this.getDrive().hasAnyMediaInserted();
        };
        var diskInterfaces = new Set(), hardDiskInterfaces = new Set(), dos2ROMs = new Set();
        var interfacesChangeListener;
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
        this.controlStateChanged = function(control, state, altFunc, data) {
            controlStateChanged(control, state, altFunc, data);
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
                    var multi = cpu.getCPUTurboMulti();
                    var desc = cpuTurboMode < 0 ? "OFF" : cpuTurboMode === 0 ? "Auto" + (multi !== 1 ? " " + multi + "x" : "") : "" + multi + "x" ;
                    return { label: desc, active: multi > 1 };
                case controls.VDP_TURBO_MODE:
                    multi = vdp.getVDPTurboMulti();
                    return { label: self.getVDPTurboModeDesc(), active: multi !== 1 };
                case controls.SPRITE_MODE:
                    desc = vdp.getSpriteDebugModeQuickDesc();
                    return { label: desc, active: desc !== "Normal" };
                case controls.VSYNCH:
                    return { label: vSynchMode < 0 ? "DISABL" : vSynchMode ? "Auto" : "OFF", active: vSynchMode === 0 };
            }
            return { label: "Unknown", active: false };
        };
        var powerAndUserPauseStateListeners = [];
    }


    // Leds Socket  -----------------------------------------

    function LedsSocket() {
        this.ledStateChanged = function(led, state) {
            if (ledsState[led] === state) return;
            ledsState[led] = state;
            this.fireLedsStateUpdate();
        };
        this.setLedsStateListener = function(listener) {
            ledsStateListener = listener;
            this.fireLedsStateUpdate();
        };
        this.fireLedsStateUpdate = function() {
            if (ledsStateListener) ledsStateListener.ledsStateUpdate(ledsState[0], ledsState[1]);
        };
        var ledsState = [ false, false ];   // Caps, Kana
        var ledsStateListener;
    }


    // SavestateSocket  -----------------------------------------

    function SaveStateSocket() {
        this.connectMedia = function(pMedia) {
            media = pMedia;
        };
        this.saveState = function(slot) {
            if (!self.powerIsOn || !media) return;
            var wasPaused = self.systemPause(true);
            self.showOSD("Saving State " + slot, true);
            var state = saveState();
            state.v = VERSION;
            // ASSYNC call!
            media.persistState(slot, state, function then(success) {
                if (success) self.showOSD("State " + slot + " saved", true);
                else         self.showOSD("State " + slot + " save FAILED!", true, true);
                if (!wasPaused) self.systemPause(false);
            });
        };
        this.loadState = function(slot) {
            if (!media) return;
            var wasPaused = self.systemPause(true);
            self.showOSD("Loading State " + slot, true);
            // ASSYNC call!
            media.retrieveState(slot, function then(state) {
                if (!state) {
                    self.showOSD("State " + slot + " not found!", true, true);
                } else if (!VERSIONS_ACCEPTED[state.v]) {
                    self.showOSD("State " + slot + " load failed. State version incompatible!", true, true);
                } else {
                    if (self.powerIsOn) self.reset(true);
                    else self.powerOn(true);    // true = powerOn from state loading
                    loadState(state);
                    if (WMSX.userPreferences.current.syncTimeLoadState) rtc.syncTimeWithSource();
                    self.showOSD("State " + slot + " loaded", true);
                }
                if (!wasPaused) self.systemPause(false);
            });
        };
        this.saveStateFile = function() {
            if (!self.powerIsOn || !media) return;
            var wasPaused = self.systemPause(true);
            self.showOSD("Saving State File", true);
            var state = saveState();
            state.v = VERSION;
            media.saveStateFile(state);
            if (!wasPaused) self.systemPause(false);
        };
        this.loadStateFile = function(data) {       // Returns true if data was indeed a SaveState
            if (!media) return false;
            self.showOSD("Loading State File", true);
            var state = media.loadStateFile(data);
            if (!state) {
                self.showOSD(null, true);           // Clear "Loading" message
                return false;
            }
            wmsx.Util.log("State file loaded");
            if (!VERSIONS_ACCEPTED[state.v]) {
                self.showOSD("State File load failed. State version incompatible!", true, true);
            } else {
                if (self.powerIsOn) self.reset(true);
                else self.powerOn(true);    // true = powerOn from state
                loadState(state);
                self.showOSD("State File loaded", true);
            }
            return true;
        };
        this.externalStateChange = function() {
            media.externalStateChange();
        };
        var media;
        var VERSION = WMSX.STATE_VERSION;
        var VERSIONS_ACCEPTED = WMSX.STATE_VERSIONS_ACCEPTED;
    }


    // Debug methods  ------------------------------------------------------

    this.eval = function(str) {
        return eval(str);
    };


    init();

};

wmsx.Machine.BASE_CPU_CLOCK = 228 * 262 * 60;        // 3584160Hz, rectified to 60Hz (228 clocks per line, 262 lines, 60 fps)