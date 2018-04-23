// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Remove unstable UNICODE chars (Paste icon, Arrows in Settings)
// TODO Remove "Center" rounding problems as possible. Main screen element centering still remaining
// TODO Possible to use hotkeys and bypass logo messages

// TODO Reset long press for extensions timer on menuLine change

wmsx.CanvasDisplay = function(room, mainElement) {
"use strict";

    var self = this;

    function init() {
        wmsx.Util.insertCSS(wmsx.ScreenGUI.css());
        delete wmsx.ScreenGUI.css;
        setupMain();
        setupBar();
        setupFileLoaderDropTargets();
        setupFullscreen();
        monitor = new wmsx.Monitor(self);
    }

    this.connect = function(pMachine) {
        machine = pMachine;
        monitor.connect(machine.getVideoOutput());
        controllersSocket = machine.getControllersSocket();
        cartridgeSocket = machine.getCartridgeSocket();
        extensionsSocket = machine.getExtensionsSocket();
        machineTypeSocket = machine.getMachineTypeSocket();
    };

    this.connectPeripherals = function(pCartridgeSlot, pFileLoader, pFileDownloader, pMachineControls, pPeripheralControls, pControllersHub, pDiskDrive, pStateMedia) {
        cartridgeSlot = pCartridgeSlot;
        fileLoader = pFileLoader;
        fileLoader.registerForDnD(fsElement);
        fileLoader.registerForFileInputElement(fsElement);
        fileDownloader = pFileDownloader;
        fileDownloader.registerForDownloadElement(fsElement);
        machineControls = pMachineControls;
        peripheralControls = pPeripheralControls;
        controllersHub = pControllersHub;
        controllersHub.setKeyInputElement(fsElement);
        controllersHub.setMouseInputElement(fsElement);
        diskDrive = pDiskDrive;
        stateMedia = pStateMedia;
    };

    this.powerOn = function() {
        monitor.setDefaults();
        updateLogo();
        document.documentElement.classList.add("wmsx-started");
        setPageVisibilityHandling();
        this.focus();
        if (WMSXFullScreenSetup.shouldStartInFullScreen()) {
            setFullscreenState(true);
            setEnterFullscreenByAPIOnFirstTouch();
        }
    };

    this.powerOff = function() {
        document.documentElement.remove("wmsx-started");
    };

    this.start = function(startAction) {
        // Show mobile messages or start automatically
        if (isMobileDevice && !isBrowserStandalone && !isFullscreen) {
            // Install as App message
            if (wmsx.Util.isOfficialHomepage())
                showLogoMessage('For ' + (fullscreenAPIEnterMethod ? 'the best' : 'a full-screen') + ' experience, use<br>the "Add to Home Screen" function<br>then launch from the Installed App', "NICE!", false, startActionInFullScreen);
            // Go fullscreen message
            else
                showLogoMessage('For the best experience,<br>WebMSX will go full-screen', "GO!", true, startActionInFullScreen);
        } else
            startAction();

        function startActionInFullScreen() {
            self.setFullscreen(true);
            startAction();
        }
    };

    this.refresh = function(image, sourceWidth, sourceHeight) {
        // Hide mouse cursor if not moving for some time
        if (cursorHideFrameCountdown > 0)
            if (--cursorHideFrameCountdown <= 0) hideCursorAndBar();

        // If needed, turn signal on and hide logo
        if (!signalIsOn) {
            signalIsOn = true;
            updateLogo();
        }

        // Update frame
        if (!canvasContext) createCanvasContext();
        canvasContext.drawImage(
            image,
            0, 0, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
        );

        //console.log("" + sourceWidth + "x" + sourceHeight + " > " + targetWidth + "x" + targetHeight);
    };

    this.videoSignalOff = function() {
        signalIsOn = false;
        showCursorAndBar();
        updateLogo();
    };

    this.mousePointerLocked = function(state) {
        mousePointerLocked = state;
        if (mousePointerLocked) hideCursorAndBar();
        else showCursorAndBar();
    };

    this.openHelp = function() {
        self.openSettings("GENERAL");
        return false;
    };

    this.openAbout = function() {
        self.openSettings("ABOUT");
        return false;
    };

    this.openSettings = function(page) {
        closeAllOverlays();
        if (!settingsDialog) settingsDialog = new wmsx.SettingsDialog(fsElementCenter, controllersHub, peripheralControls, machineTypeSocket);
        settingsDialog.show(page);
    };

    this.openSaveStateDialog = function (save) {
        closeAllOverlays();
        if (!saveStateDialog) saveStateDialog = new wmsx.SaveStateDialog(fsElementCenter, machineControls, peripheralControls, stateMedia);
        saveStateDialog.show(save);
    };

    this.openDiskSelectDialog = function(drive, inc, altPower) {
        closeAllOverlays();
        if (!diskSelectDialog) diskSelectDialog = new wmsx.DiskSelectDialog(fsElementCenter, diskDrive, peripheralControls, fileLoader);
        diskSelectDialog.show(drive, inc, altPower);
    };

    this.openNewHardDiskDialog = function(altPower, bootable) {
        closeAllOverlays();
        if (!newHardDiskDialog) newHardDiskDialog = new wmsx.NewHardDiskDialog(fsElementCenter, peripheralControls);
        newHardDiskDialog.show(altPower, bootable);
    };

    this.openMachineSelectDialog = function() {
        closeAllOverlays();
        if (!machineSelectDialog) machineSelectDialog = new wmsx.MachineSelectDialog(fsElementCenter, machineTypeSocket, peripheralControls);
        machineSelectDialog.show();
    };

    this.openTouchConfigDialog = function() {
        closeAllOverlays();
        if (virtualKeyboardMode) setVirtualKeyboard(0);
        if (!touchConfigDialog) touchConfigDialog = new wmsx.TouchConfigDialog(fsElement, canvasOuter, controllersHub, peripheralControls);
        touchConfigDialog.show();
    };

    this.openQuickOptionsDialog = function() {
        closeAllOverlays();
        if (virtualKeyboardMode) setVirtualKeyboard(0);
        if (!quickOtionsDialog) quickOtionsDialog = new wmsx.QuickOptionsDialog(fsElementCenter, machineControls, peripheralControls);
        quickOtionsDialog.show();
    };

    this.openNetPlayDialog = function() {
        closeAllOverlays();
        if (!netPlayDialog) netPlayDialog = new wmsx.NetPlayDialog(room, fsElementCenter);
        netPlayDialog.show();
    };

    this.openCartridgeFormatDialog = function(port, altPower) {
        closeAllOverlays();
        if (!cartFormatDialog) cartFormatDialog = new wmsx.CartridgeFormatDialog(this, fsElementCenter, machine, cartridgeSlot);
        cartFormatDialog.show(port, altPower);
    };

    this.openLoadFileDialog = function() {
        peripheralControls.processControlActivated(wmsx.PeripheralControls.AUTO_LOAD_FILE);
        return false;
    };

    this.executeTextCopy = function() {
        if (!signalIsOn) return this.showOSD("Screen Text Copy only available when Power is ON!", true, true);

        if (!document.queryCommandSupported || !document.queryCommandSupported('copy'))
            return this.showOSD("Copy to Clipboard not supported by the browser!", true, true);

        var text = monitor.getScreenText();

        if (!text) return this.showOSD("Screen Text Copy not available in this Screen!", true, true);

        if (!copyTextArea) setupCopyTextArea();
        copyTextArea.innerHTML = text;
        copyTextArea.select();

        if (document.execCommand("copy"))
            this.showOSD("Screen text copied to Clipboard", true);
        else
            this.showOSD("Copy to Clipboard not supported by the browser!", true, true);

        this.focus();
    };

    this.toggleTextPasteDialog = function() {
        if (!signalIsOn) return this.showOSD("Text Paste only available when Power is ON!", true, true);

        if (!pasteDialog) pasteDialog = new wmsx.PasteDialog(canvasOuter, this, machineControls);
        pasteDialog.toggle();
        return false;
    };

    this.toggleTextEntryDialog = function() {
        if (!signalIsOn) return this.showOSD("Text Entry only available when Power is ON!", true, true);

        if (virtualKeyboardMode) setVirtualKeyboard(0);
        if (!textEntryDialog) textEntryDialog = new wmsx.TextEntryDialog(fsElementCenter, this, machineControls);
        textEntryDialog.toggle();
        return false;
    };

    this.toggleMenuByKey = function() {
        if (barMenuActive) hideBarMenu();
        else {
            closeAllOverlays();
            showBarMenu(barMenuSystem, true);
        }
    };

    this.toggleVirtualKeyboard = function() {
        setVirtualKeyboard((virtualKeyboardMode + 1) % 3);
    };

    this.getScreenCapture = function() {
        if (!signalIsOn) return;
        return canvas.toDataURL('image/png');
    };

    this.saveScreenCapture = function() {
        var cap = this.getScreenCapture();
        if (cap) fileDownloader.startDownloadURL("WMSX Screen", cap, "Screen Capture");
    };

    this.displayMetrics = function (pTargetWidth, pTargetHeight) {
        // No need to resize display if target size is unchanged
        if (targetWidth === pTargetWidth && targetHeight === pTargetHeight) return;

        targetWidth = pTargetWidth;
        targetHeight = pTargetHeight;
        updateCanvasContentSize();
        if (isFullscreen) this.requestReadjust(true);
        else updateScale();
    };

    this.displayPixelMetrics = function (pPixelWidth, pPixelHeight) {
        if (pixelWidth === pPixelWidth && pixelHeight === pPixelHeight) return;

        pixelWidth = pPixelWidth;
        pixelHeight = pPixelHeight;
        if (controllersHub) controllersHub.setScreenPixelScale(pixelWidth * scaleY * aspectX, pixelHeight * scaleY);
    };

    this.displayScale = function(pAspectX, pScaleY) {
        aspectX = pAspectX;
        scaleY = pScaleY;
        updateScale();
        if (controllersHub) controllersHub.setScreenPixelScale(pixelWidth * scaleY * aspectX, pixelHeight * scaleY);
    };

    this.getMonitor = function() {
        return monitor;
    };

    this.showOSD = function(message, overlap, error) {
        if (osdTimeout) clearTimeout(osdTimeout);
        if (!message) {
            osd.style.transition = "all 0.15s linear";
            osd.style.top = "-29px";
            osd.style.opacity = 0;
            osdShowing = false;
            return;
        }
        if (overlap || !osdShowing) {
            osd.innerHTML = message;
            osd.style.color = error ? "rgb(255, 60, 40)" : "rgb(0, 255, 0)";
        }
        osd.style.transition = "none";
        osd.style.top = "15px";
        osd.style.opacity = 1;
        osdShowing = true;

        var availWidth = canvasOuter.clientWidth - 30;      //  message width - borders
        var width = osd.clientWidth;
        var scale = width < availWidth ? 1 : availWidth / width;
        osd.style.transform = "scale(" + scale.toFixed(4) + ")";

        osdTimeout = setTimeout(hideOSD, OSD_TIME);
    };

    function displayDefaultScale() {
        if (WMSX.SCREEN_DEFAULT_SCALE > 0) return WMSX.SCREEN_DEFAULT_SCALE;

        var maxWidth = Number.parseFloat(window.getComputedStyle(mainElement.parentElement).width);

        //console.error(">>> Parent width: " + maxWidth);

        return maxWidth >= 660 ? 1.1 : maxWidth >= 540 ? 0.9 : maxWidth >= 420 ? 0.7 : maxWidth >= 320 ? 0.55 : 0.5;
    }

    function hideOSD() {
        osd.style.transition = "all 0.15s linear";
        osd.style.top = "-29px";
        osd.style.opacity = 0;
        osdShowing = false;
    }

    this.setDebugMode = function(boo) {
        debugMode = !!boo;
        canvasContext = null;
    };

    this.aspectAndScaleSetDefault = function() {
        aspectX = WMSX.SCREEN_DEFAULT_ASPECT;
        scaleY = displayDefaultScale();
        scaleYBeforeUserFullscreen = 0;
    };

    this.crtFilterToggle = function() {
        var newLevel = crtFilter + 1; if (newLevel > 3) newLevel = -2;
        setCRTFilter(newLevel);
        var levelDesc = crtFilterEffective === null ? "browser default" : crtFilterEffective < 1 ? "OFF" : "level " + crtFilterEffective;
        this.showOSD("CRT filter: " + (crtFilter === -1 ? "AUTO (" + levelDesc + ")" : levelDesc), true);

        // Persist
        if (WMSX.userPreferences.current.crtFilter !== crtFilter) {
            WMSX.userPreferences.current.crtFilter = crtFilter;
            WMSX.userPreferences.setDirty();
            WMSX.userPreferences.save();
        }
    };

    this.crtFilterSetDefault = function() {
        var user = WMSX.userPreferences.current.crtFilter;
        setCRTFilter(WMSX.SCREEN_FILTER_MODE !== -3 ? WMSX.SCREEN_FILTER_MODE : user !== null && user > -3 ? user : -1);
    };

    this.crtModeToggle = function() {
        var newMode = crtMode + 1; if (newMode > 1) newMode = -1;
        setCRTMode(newMode);
        var effectDesc = crtModeEffective === 1 ? "Phosphor" : "OFF";
        this.showOSD("CRT mode: " + (crtMode === -1 ? "AUTO (" + effectDesc + ")" : effectDesc), true);
    };

    this.crtModeSetDefault = function() {
        setCRTMode(WMSX.SCREEN_CRT_MODE);
    };

    this.getControlReport = function(control) {
        // Only CRT Filter for now
        return { label: crtFilter === -2 ? "Browser" : crtFilter === -1 ? "Auto" : crtFilter === 0 ? "OFF" : "Level " + crtFilter, active: crtFilter >= 0 };
    };

    this.displayToggleFullscreen = function() {                 // Only and Always user initiated
        if (FULLSCREEN_MODE === -2) return;

        // Save scale before Fullscreen
        if (!isFullscreen && !isMobileDevice) scaleYBeforeUserFullscreen = scaleY;

        // If FullScreenAPI supported but not active, enter full screen by API regardless of previous state
        if (fullscreenAPIEnterMethod && !isFullScreenByAPI()) {
            enterFullScreenByAPI();
            return;
        }

        // If not, toggle complete full screen state
        this.setFullscreen(!isFullscreen);
    };

    this.setFullscreen = function(mode) {
        if (fullscreenAPIEnterMethod) {
            if (mode) enterFullScreenByAPI();
            else exitFullScreenByAPI();
        } else
            setFullscreenState(mode)
    };

    this.focus = function() {
        canvas.focus();
    };

    this.machinePowerAndUserPauseStateUpdate = function(power, paused) {
        powerButton.style.backgroundPosition = "" + powerButton.wmsxBX + "px " + (barButtonBackYOffsets[power ? 2 : 1]) + "px";
        if (room.netPlayMode === 2) {
            powerButton.wmsxMenu[5].disabled = powerButton.wmsxMenu[6].disabled = powerButton.wmsxMenu[8].disabled = powerButton.wmsxMenu[9].disabled = true;
            powerButton.wmsxMenu[1].disabled = !power;
        } else {
            powerButton.wmsxMenu[5].disabled = powerButton.wmsxMenu[6].disabled = powerButton.wmsxMenu[8].disabled = false;
            powerButton.wmsxMenu[1].disabled = powerButton.wmsxMenu[9].disabled = !power;
        }
    };

    this.diskDrivesMediaStateUpdate = function(drive) {
        var button = drive === 2 ? diskHButton : drive === 1 ? diskBButton : diskAButton;
        var stack = diskDrive.getDriveStack(drive);
        button.title = diskDrive.getCurrentDiskDesc(drive);
        if (drive < 2) {
            button.wmsxMenu[8].label = "Remove " + (stack.length > 1 ? "Stack" : "Disk");
            if (room.netPlayMode === 2) {
                button.wmsxMenu[0].disabled = button.wmsxMenu[1].disabled = button.wmsxMenu[2].disabled = button.wmsxMenu[3].disabled = button.wmsxMenu[4].disabled =
                button.wmsxMenu[5].disabled = button.wmsxMenu[6].disabled = button.wmsxMenu[7].disabled = button.wmsxMenu[8].disabled = true;
            } else {
                button.wmsxMenu[0].disabled = button.wmsxMenu[4].disabled = button.wmsxMenu[5].disabled = false;
                button.wmsxMenu[1].disabled = button.wmsxMenu[2].disabled = button.wmsxMenu[3].disabled = stack.length >= wmsx.FileDiskDrive.MAX_STACK;
                button.wmsxMenu[6].disabled = stack.length <= 1;
                button.wmsxMenu[7].disabled = button.wmsxMenu[8].disabled = stack.length === 0;
            }
        } else {
            if (room.netPlayMode === 2) {
                button.wmsxMenu[0].disabled = button.wmsxMenu[1].disabled = button.wmsxMenu[2].disabled = button.wmsxMenu[3].disabled =
                button.wmsxMenu[4].disabled = button.wmsxMenu[5].disabled = button.wmsxMenu[6].disabled = true;
            } else {
                button.wmsxMenu[0].disabled = button.wmsxMenu[1].disabled = button.wmsxMenu[2].disabled = button.wmsxMenu[3].disabled = button.wmsxMenu[4].disabled = false;
                button.wmsxMenu[5].disabled = button.wmsxMenu[6].disabled = stack.length === 0;
            }
        }
        if (diskSelectDialog) diskSelectDialog.diskDrivesMediaStateUpdate(drive);
    };

    this.diskDrivesMotorStateUpdate = function (diskA, diskAMotor, diskAModif, diskB, diskBMotor, diskBModif, diskN, diskNMotor, diskNModif) {
        diskAButton.style.backgroundPosition = "" + diskAButton.wmsxBX + "px " + (mediaButtonBackYOffsets[(diskAMotor ? 3 : ( diskA ? diskAModif ?  2 : 1 : 0 ))]) + "px";
        diskBButton.style.backgroundPosition = "" + diskBButton.wmsxBX + "px " + (mediaButtonBackYOffsets[(diskBMotor ? 3 : ( diskB ? diskBModif ?  2 : 1 : 0 ))]) + "px";
        diskHButton.style.backgroundPosition = "" + diskHButton.wmsxBX + "px " + (mediaButtonBackYOffsets[(diskNMotor ? 3 : ( diskN ? diskNModif ?  2 : 1 : 0 ))]) + "px";
    };

    this.diskInterfacesStateUpdate = function(hasDiskInterface, hasHardDiskInterface) {
        peripheralControls.diskInterfacesStateUpdate(hasDiskInterface, hasHardDiskInterface);
        // Show/hide/disable icons
        diskAButton.classList.toggle("wmsx-hidden", !hasDiskInterface);
        diskAButton.wmsxDropTarget.classList.toggle("wmsx-disabled", !hasDiskInterface);
        diskAButton.wmsxDropTarget.wmsxDropInfo.disabled = !hasDiskInterface;
        diskAButton.wmsxMenu.wmsxHidden = !hasDiskInterface;
        diskBButton.classList.toggle("wmsx-hidden", !hasDiskInterface);
        diskBButton.wmsxDropTarget.classList.toggle("wmsx-disabled", !hasDiskInterface);
        diskBButton.wmsxDropTarget.wmsxDropInfo.disabled = !hasDiskInterface;
        diskBButton.wmsxMenu.wmsxHidden = !hasDiskInterface;
        diskHButton.classList.toggle("wmsx-hidden", !hasHardDiskInterface);
        diskHButton.wmsxDropTarget.classList.toggle("wmsx-disabled", !hasHardDiskInterface);
        diskHButton.wmsxDropTarget.wmsxDropInfo.disabled = !hasHardDiskInterface;
        var hdMenu = diskHButton.wmsxMenu;
        hdMenu.wmsxHidden = !hasHardDiskInterface;
        // Order of icons and menus
        var hdFirst = diskDrive.isHardDriveFirst();
        diskHButton.style.float = hdFirst ? "left" : "none";
        diskHButton.wmsxDropTarget.style.float = hdFirst ? "left" : "none";
        var pos = hdFirst ? 1 : 4;
        barMenus[1] = pos === 1 ? hdMenu : null;
        barMenus[4] = pos === 4 ? hdMenu : null;
        hdMenu.wmsxMenuIndex = pos;
    };

    this.extensionsAndCartridgesStateUpdate = function() {
        var cart1 = cartridgeSocket.cartridgeInserted(0);
        var cart2 = cartridgeSocket.cartridgeInserted(1);
        cartridge1Button.title = "Cartridge 1" + ( cart1 ? ": " + (cart1.format.internal ? cart1.format.desc : (cart1.rom.source || "<Unknown>") + "  [" + cart1.format.name + "]") : "" );
        cartridge2Button.title = "Cartridge 2" + ( cart2 ? ": " + (cart2.format.internal ? cart2.format.desc : (cart2.rom.source || "<Unknown>") + "  [" + cart2.format.name + "]") : "" );
        var dataDesc = cart1 && cart1.getDataDesc();
        cartridge1Button.wmsxMenu[2].label = "Load " + (dataDesc || "Data") + " File";
        cartridge1Button.wmsxMenu[3].label = "Save " + (dataDesc || "Data") + " File";
        if (room.netPlayMode === 2) {
            cartridge1Button.wmsxMenu[0].disabled = cartridge1Button.wmsxMenu[1].disabled = cartridge1Button.wmsxMenu[2].disabled = cartridge1Button.wmsxMenu[3].disabled = cartridge1Button.wmsxMenu[4].disabled = true;
        } else {
            cartridge1Button.wmsxMenu[0].disabled = false;
            cartridge1Button.wmsxMenu[2].disabled = cartridge1Button.wmsxMenu[3].disabled = !dataDesc;
            cartridge1Button.wmsxMenu[1].disabled = !cart1 || cart1.format.internal;
            cartridge1Button.wmsxMenu[4].disabled = !cart1;
        }
        dataDesc = cart2 && cart2.getDataDesc();
        cartridge2Button.wmsxMenu[2].label = "Load " + (dataDesc || "Data") + " File";
        cartridge2Button.wmsxMenu[3].label = "Save " + (dataDesc || "Data") + " File";
        if (room.netPlayMode === 2) {
            cartridge2Button.wmsxMenu[0].disabled = cartridge2Button.wmsxMenu[1].disabled = cartridge2Button.wmsxMenu[2].disabled = cartridge2Button.wmsxMenu[3].disabled = cartridge2Button.wmsxMenu[4].disabled = true;
        } else {
            cartridge2Button.wmsxMenu[0].disabled = false;
            cartridge2Button.wmsxMenu[2].disabled = cartridge2Button.wmsxMenu[3].disabled = !dataDesc;
            cartridge2Button.wmsxMenu[1].disabled = !cart2 || cart2.format.internal;
            cartridge2Button.wmsxMenu[4].disabled = !cart2;
        }
        this.cartridgesModifiedStateUpdate(cart1, cart2);
        refreshSettingsMenuForExtensions();
    };

    this.cartridgesModifiedStateUpdate = function(cart1, cart2) {
        cartridge1Button.style.backgroundPosition = "" + cartridge1Button.wmsxBX + "px " + (mediaButtonBackYOffsets[(cart1 ? cart1.dataModified() ? 2 : 1 : 0)]) + "px";
        cartridge2Button.style.backgroundPosition = "" + cartridge2Button.wmsxBX + "px " + (mediaButtonBackYOffsets[(cart2 ? cart2.dataModified() ? 2 : 1 : 0)]) + "px";
    };

    this.tapeStateUpdate = function (name, motor, modif) {
        tapeButton.title = "Cassette Tape" + ( name ? ": " + name : "" );
        tapeButton.style.backgroundPosition = "" + tapeButton.wmsxBX + "px " + (mediaButtonBackYOffsets[motor ? 3 : ( name ? modif ? 2 : 1 : 0 )]) + "px";
        if (room.netPlayMode === 2) {
            tapeButton.wmsxMenu[0].disabled = tapeButton.wmsxMenu[1].disabled = tapeButton.wmsxMenu[2].disabled = tapeButton.wmsxMenu[4].disabled = tapeButton.wmsxMenu[5].disabled = true;
            tapeButton.wmsxMenu[3].disabled = !name;
        } else {
            tapeButton.wmsxMenu[0].disabled = tapeButton.wmsxMenu[1].disabled = false;
            tapeButton.wmsxMenu[2].disabled = tapeButton.wmsxMenu[3].disabled = tapeButton.wmsxMenu[4].disabled = tapeButton.wmsxMenu[5].disabled = !name;
        }
    };

    this.machineTypeStateUpdate = function() {
        if (machineSelectDialog) machineSelectDialog.machineTypeStateUpdate();
        refreshSettingsMenuForMachineType();
    };

    this.keyboardSettingsStateUpdate = function() {
        if(settingsDialog) settingsDialog.keyboardSettingsStateUpdate();
    };

    this.controllersSettingsStateUpdate = function () {
        if(settingsDialog) settingsDialog.controllersSettingsStateUpdate();
        if(touchConfigDialog) touchConfigDialog.controllersSettingsStateUpdate();
    };

    this.mouseActiveCursorStateUpdate = function(boo) {
        cursorType = boo ? 'url("' + wmsx.Images.urls.mouseCursor + '"), auto' : "auto";
        fsElement.style.cursor = cursorShowing ? cursorType : "none";
        showCursorAndBar();
    };

    this.touchControlsActiveUpdate = function(active, dirBig) {
        if (touchControlsActive === active && touchControlsDirBig === dirBig) return;
        touchControlsActive = active;
        touchControlsDirBig = dirBig;
        if (isFullscreen) {
            if (touchControlsActive) controllersHub.setupTouchControlsIfNeeded(fsElementCenter);
            this.requestReadjust(true);
        }
    };

    this.roomNetPlayStatusChangeUpdate = function(oldMode) {
        if (!netPlayDialog || !netPlayDialog.isVisible()) closeAllOverlays();
        if (netPlayDialog) netPlayDialog.roomNetPlayStatusChangeUpdate(oldMode);
    };

    this.quickOptionsControlsStateUpdate = function () {
        if (quickOtionsDialog) quickOtionsDialog.quickOptionsControlsStateUpdate();
    };

    this.machineTurboModesStateUpdate = function() {
        if (quickOtionsDialog) quickOtionsDialog.machineTurboModesStateUpdate();
    };

    this.setLoading = function(state) {
        isLoading = state;
        updateLoading();
        if (!state) {
            machine.getMachineControlsSocket().addPowerAndUserPauseStateListener(this);
            machineTypeSocket.addMachineTypeStateListener(this);
            extensionsSocket.addExtensionsAndCartridgesStateListener(this);
            machine.getDiskDriveSocket().setInterfacesChangeListener(this);
            machine.getBIOSSocket().setMachineTurboModesStateListener(this);
            machine.getCartridgeSocket().setCartridgesModifiedStateListener(this);
        }
    };

    this.requestReadjust = function(now) {
        if (settingsDialog && settingsDialog.isVisible()) settingsDialog.position();
        if (now)
            readjustAll(true);
        else {
            readjustRequestTime = wmsx.Util.performanceNow();
            if (!readjustInterval) readjustInterval = setInterval(readjustAll, 50);
        }
    };

    function setVirtualKeyboard(mode) {
        if (virtualKeyboardMode === mode) return;

        if (mode) {
            if (!isTouchDevice) return self.showOSD("Virtual Keyboard unavailable. Not a touch device!", true, true);
            if (!virtualKeyboardElement) setupVirtualKeyboard();
            virtualKeyboardElement.classList.toggle("wmsx-keyboard-narrow", mode == 2);
        }
        showCursorAndBar(true);
        document.documentElement.classList.toggle("wmsx-virtual-keyboard-active", !!mode);
        virtualKeyboardMode = mode;
        self.requestReadjust(true);
    }

    function releaseControllersOnLostFocus() {
        controllersSocket.releaseControllers();
    }

    function hideCursorAndBar() {
        hideCursor();
        hideBar();
        cursorHideFrameCountdown = -1;
    }

    function showCursorAndBar(forceBar) {
        showCursor();
        if (forceBar || !mousePointerLocked) showBar();
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
    }

    function showCursor() {
        if (!cursorShowing) {
            fsElement.style.cursor = cursorType;
            cursorShowing = true;
        }
    }

    function hideCursor() {
        if (cursorShowing) {
            fsElement.style.cursor = "none";
            cursorShowing = false;
        }
    }

    function fullscreenByAPIChanged() {
        var prevFSState = isFullscreen;
        var newAPIState = isFullScreenByAPI();

        // Return to window interface mode if user asked or not in standalone mode
        if (newAPIState || fullScreenAPIExitUserRequested || !isBrowserStandalone) setFullscreenState(newAPIState);
        else self.requestReadjust();

        // If machine not paused and on mobile, set message to resume, or set event to return to full screen
        if (prevFSState && !newAPIState && !fullScreenAPIExitUserRequested && isMobileDevice) {
            if (isBrowserStandalone) {
                setEnterFullscreenByAPIOnFirstTouch();
            } else {
                machine.systemPause(true);
                showLogoMessage("<br>Emulation suspended", "RESUME", true, function () {
                    self.setFullscreen(true);
                    machine.systemPause(false);
                });
            }
        }

        fullScreenAPIExitUserRequested = false;
    }

    function isFullScreenByAPI() {
        return !!document[fullScreenAPIQueryProp];
    }

    function enterFullScreenByAPI() {
        if (fullscreenAPIEnterMethod) try {
            fullscreenAPIEnterMethod.call(fsElement);
        } catch (e) {
            /* give up */
        }
    }

    function exitFullScreenByAPI() {
        if (fullScreenAPIExitMethod) try {
            fullScreenAPIExitUserRequested = true;
            fullScreenAPIExitMethod.call(document);
        } catch (e) {
            /* give up */
        }
    }

    function updateScale() {
        var canvasWidth = Math.round(targetWidth * scaleY * aspectX);
        var canvasHeight = Math.round(targetHeight * scaleY);
        canvas.style.width = "" + canvasWidth + "px";
        canvas.style.height = "" + canvasHeight + "px";
        updateBarWidth(canvasWidth);
        if (!signalIsOn) updateLogoScale();
        if (settingsDialog && settingsDialog.isVisible()) settingsDialog.position();
    }

    function updateBarWidth(canvasWidth) {
        var fixedWidth = buttonsBarDesiredWidth > 0 ? buttonsBarDesiredWidth : canvasWidth;
        buttonsBar.style.width = buttonsBarDesiredWidth === -1 ? "100%" : "" + fixedWidth + "px";
        buttonsBar.classList.toggle("wmsx-narrow", fixedWidth < NARROW_WIDTH);
    }

    function updateKeyboardWidth(maxWidth) {
        var availWidth = Math.min(1024, maxWidth);       // Limit to 1024px
        var width = virtualKeyboardMode === 1 ? VIRTUAL_KEYBOARD_WIDE_WIDTH : VIRTUAL_KEYBOARD_NARROW_WIDTH;
        var scale = availWidth / width;
        virtualKeyboardElement.style.width = "" + width + "px";
        virtualKeyboardElement.style.transform = "translateX(-50%) scale(" + scale.toFixed(8) + ")";
        return { w: availWidth, h: Math.ceil(VIRTUAL_KEYBOARD_HEIGHT * scale) };
    }

    function updateCanvasContentSize() {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvasContext = null;
    }

    function setCRTFilter(level) {
        crtFilter = level;
        crtFilterEffective = crtFilter === -2 ? null : crtFilter === -1 ? crtFilterAutoValue() : level;
        canvasContext = null;
    }

    function crtFilterAutoValue() {
        // Use mode 1 by default (canvas imageSmoothing OFF and CSS image-rendering set to smooth)
        // iOS browser bug: freezes after some time if imageSmoothing = true. OK if we use the setting above
        // Firefox on Android bug: image looks terrible if imageSmoothing = false. Lets use mode 2 or 3, or let browser default
        return isMobileDevice && !isIOSDevice && browserName === "FIREFOX" ? 2 : 1;
    }

    function setCRTMode(mode) {
        crtMode = mode;
        crtModeEffective = crtMode === -1 ? crtModeAutoValue() : crtMode;
        canvasContext = null;
    }

    function crtModeAutoValue() {
        return isMobileDevice ? 0 : 1;
    }

    function updateLogo() {
        if (!signalIsOn) {
            updateLogoScale();
            closePowerOnModals();
            showCursorAndBar(true);
            if (canvasContext) canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        }
        logo.classList.toggle("wmsx-show", !signalIsOn);
    }

    function updateLoading() {
        var disp = isLoading ? "block" : "none";
        logoLoadingIcon.style.display = disp;
        canvasLoadingIcon.style.display = disp;
    }

    function createCanvasContext() {
        // Prepare Context used to draw frame
        canvasContext = canvas.getContext("2d", { alpha: false, antialias: false });
        updateImageComposition();
        updateImageSmoothing();
    }

    function updateImageComposition() {
        if (crtModeEffective > 0 && !debugMode) {
            canvasContext.globalCompositeOperation = "source-over";
            canvasContext.globalAlpha = 0.8;
        } else {
            canvasContext.globalCompositeOperation = "copy";
            canvasContext.globalAlpha = 1;
        }
    }

    function updateImageSmoothing() {
        if (crtFilterEffective === null) return;    // let default values

        canvas.style.imageRendering = (crtFilterEffective === 1 || crtFilterEffective === 3) ? "initial" : canvasImageRenderingValue;

        var smoothing = crtFilterEffective >= 2;
        if (canvasContext.imageSmoothingEnabled !== undefined)
            canvasContext.imageSmoothingEnabled = smoothing;
        else {
            canvasContext.webkitImageSmoothingEnabled = smoothing;
            canvasContext.mozImageSmoothingEnabled = smoothing;
            canvasContext.msImageSmoothingEnabled = smoothing;
        }
    }

    function suppressContextMenu(element) {
        element.addEventListener("contextmenu", wmsx.Util.blockEvent);
    }

    function preventDrag(element) {
        element.ondragstart = wmsx.Util.blockEvent;
    }

    function setupMain() {
        mainElement.innerHTML = wmsx.ScreenGUI.html();
        mainElement.tabIndex = -1;
        delete wmsx.ScreenGUI.html;

        fsElement = document.getElementById("wmsx-screen-fs");
        fsElementCenter = document.getElementById("wmsx-screen-fs-center");
        canvasOuter = document.getElementById("wmsx-screen-canvas-outer");
        canvas = document.getElementById("wmsx-screen-canvas");
        canvasLoadingIcon = document.getElementById("wmsx-canvas-loading-icon");
        osd = document.getElementById("wmsx-osd");
        logo = document.getElementById("wmsx-logo");
        logoCenter = document.getElementById("wmsx-logo-center");
        logoImage = document.getElementById("wmsx-logo-image");
        logoLoadingIcon = document.getElementById("wmsx-logo-loading-icon");
        logoMessage = document.getElementById("wmsx-logo-message");
        logoMessageText = document.getElementById("wmsx-logo-message-text");
        logoMessageOK = document.getElementById("wmsx-logo-message-ok");
        logoMessageOKText = document.getElementById("wmsx-logo-message-ok-text");
        scrollMessage = document.getElementById("wmsx-screen-scroll-message");

        suppressContextMenu(mainElement);
        preventDrag(logoImage);
        preventDrag(logoLoadingIcon);
        preventDrag(canvasLoadingIcon);

        updateCanvasContentSize();

        // Try to determine correct value for image-rendering for the canvas filter modes
        switch (browserName) {
            case "CHROME":
            case "EDGE":
            case "OPERA":   canvasImageRenderingValue = "pixelated"; break;
            case "FIREFOX": canvasImageRenderingValue = "-moz-crisp-edges"; break;
            case "SAFARI":  canvasImageRenderingValue = "-webkit-optimize-contrast"; break;
            default:        canvasImageRenderingValue = "pixelated";
        }
        setupMainEvents();
    }

    function setupMainEvents() {
        (isMobileDevice ? canvasOuter : fsElement).addEventListener("mousemove", function showCursorOnMouseMove() {
            showCursorAndBar();
        });

        if ("onblur" in document) fsElement.addEventListener("blur", releaseControllersOnLostFocus, true);
        else fsElement.addEventListener("focusout", releaseControllersOnLostFocus, true);

        window.addEventListener("orientationchange", function orientationChanged() {
            closeAllOverlays();
            if (signalIsOn) hideCursorAndBar();
            else showCursorAndBar();
            self.requestReadjust();
        });

        mainElement.addEventListener("drop", closeAllOverlays, false);

        logoMessageOK.wmsxNeedsUIG = logoMessageOKText.wmsxNeedsUIG = true;     // User Initiated Gesture required
        wmsx.Util.onTapOrMouseDownWithBlockUIG(logoMessageOK, closeLogoMessage);

        // Used to show bar and close overlays and modals if not processed by any other function
        wmsx.Util.addEventsListener(fsElementCenter, "touchstart touchend mousedown", function backScreenTouched(e) {
            if (e.type !== "touchend") {                            // Execute actions only for touchstart or mousedown
                closeAllOverlays();
                showCursorAndBar();
            } else
                if (e.cancelable) e.preventDefault();               // preventDefault only on touchend to avoid redundant mousedown ater a touchstart
        });
    }

    function setupVirtualKeyboard() {
        virtualKeyboardElement = document.createElement('div');
        virtualKeyboardElement.id = "wmsx-virtual-keyboard";
        fsElementCenter.appendChild(virtualKeyboardElement);
        virtualKeyboard = new wmsx.DOMVirtualKeyboard(virtualKeyboardElement, controllersHub.getKeyboard(), machineTypeSocket);
    }

    function setupBar() {
        buttonsBar = document.getElementById("wmsx-bar");
        buttonsBarInner = document.getElementById("wmsx-bar-inner");

        if (BAR_AUTO_HIDE) {
            document.documentElement.classList.add("wmsx-bar-auto-hide");
            fsElement.addEventListener("mouseleave", hideBar);
            hideBar();
        }

        var menu = [
            { label: "Power",          clickModif: 0, control: wmsx.PeripheralControls.MACHINE_POWER_TOGGLE },
            { label: "Reset",          clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_RESET },
            { label: "",               divider: true },
            { label: "Net Play!",                     control: wmsx.PeripheralControls.SCREEN_OPEN_NETPLAY },
            { label: "",               divider: true },
            { label: "Open File",      clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.AUTO_LOAD_FILE, needsUIG: true },
            { label: "Open URL",       clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.AUTO_LOAD_URL, needsUIG: true },
            { label: "",               divider: true },
            { label: "Load State",                    control: wmsx.PeripheralControls.MACHINE_LOAD_STATE_MENU },
            { label: "Save State",                    control: wmsx.PeripheralControls.MACHINE_SAVE_STATE_MENU }
        ];
        powerButton = addPeripheralControlButton("wmsx-bar-power", -120, -26, false, "System Power", null, menu, "System");
        barMenuSystem = menu;

        mediaIconsContainer = document.createElement("div");
        mediaIconsContainer.style.display = "inline-block";
        buttonsBarInner.appendChild(mediaIconsContainer);

        // Create a gap in menus. HardDisk menu may be in positions 1 or 4 depending on Disk Interfaces order
        barMenus.push(null);

        menu = [
            { label: "Load Image Files",   clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES, needsUIG: true },
            { label: "Add Image Files",                control: wmsx.PeripheralControls.DISK_ADD_FILES, needsUIG: true },
            { label: "Add Blank Disk",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY },
            { label: "Add Boot Disk",      clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_BOOT },
            { label: "Add Files to Disk",              control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK, needsUIG: true },
            { label: "Add ZIP to Disk",                control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK, needsUIG: true },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, disabled: true },
            { label: "Save Image File",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, disabled: true, needsUIG: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, disabled: true }
        ];
        diskAButton = addPeripheralControlButton("wmsx-bar-diska", -165, -72, true, "Drive A", null, menu, "Drive A", mediaIconsContainer);

        menu = [
            { label: "Load Image Files",   clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES, secSlot: true, needsUIG: true },
            { label: "Add Image Files",                control: wmsx.PeripheralControls.DISK_ADD_FILES, secSlot: true, needsUIG: true },
            { label: "Add Blank Disk",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY, secSlot: true },
            { label: "Add Boot Disk",      clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_BOOT, secSlot: true },
            { label: "Add Files to Disk",              control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK, secSlot: true, needsUIG: true },
            { label: "Add ZIP to Disk",                control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK, secSlot: true, needsUIG: true },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, secSlot: true, disabled: true },
            { label: "Save Image File",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, secSlot: true, disabled: true, needsUIG: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, secSlot: true, disabled: true }
        ];
        diskBButton = addPeripheralControlButton("wmsx-bar-diskb", -194, -72, true, "Drive B", null, menu, "Drive B", mediaIconsContainer);

        menu = [
            { label: "Load Image File",    clickModif: 0, control: wmsx.PeripheralControls.HARDDISK_LOAD_FILE, needsUIG: true },
            { label: "New Blank Disk",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.HARDDISK_CHOOSE_EMPTY },
            { label: "New Boot Disk",                  control: wmsx.PeripheralControls.HARDDISK_CHOOSE_BOOT },
            { label: "Add Files to Disk",              control: wmsx.PeripheralControls.HARDDISK_LOAD_FILES_AS_DISK, needsUIG: true },
            { label: "Add ZIP to Disk",                control: wmsx.PeripheralControls.HARDDISK_LOAD_ZIP_AS_DISK, needsUIG: true },
            { label: "Save Image File",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.HARDDISK_SAVE_FILE, disabled: true, needsUIG: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.HARDDISK_REMOVE, disabled: true }
        ];                                                      /* -223 -252*/
        diskHButton = addPeripheralControlButton("wmsx-bar-diskh", -252, -72, true, "Hard Drive", null, menu, "Hard Drive", mediaIconsContainer);
        diskHButton.classList.add("wmsx-hidden");

        menu = [
            { label: "Load ROM File",      clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, needsUIG: true },
            { label: "Set ROM Format",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_CHOOSE_FORMAT },
            { label: "Load Data File",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, disabled: true, needsUIG: true },
            { label: "Save Data File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, disabled: true, needsUIG: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, disabled: true }
        ];
        cartridge1Button = addPeripheralControlButton("wmsx-bar-cart1", -78, -72, true, "Cartridge 1", null, menu, "Cartridge 1", mediaIconsContainer);

        menu = [
            { label: "Load ROM File",      clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, secSlot: true, needsUIG: true },
            { label: "Set ROM Format",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_CHOOSE_FORMAT, secSlot: true },
            { label: "Load Data File",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, secSlot: true, disabled: true, needsUIG: true },
            { label: "Save Data File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, secSlot: true, disabled: true, needsUIG: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, secSlot: true, disabled: true }
        ];
        cartridge2Button = addPeripheralControlButton("wmsx-bar-cart2", -107, -72, true, "Cartridge 2", null, menu, "Cartridge 2", mediaIconsContainer);

        menu = [
            { label: "Load Image File",    clickModif: 0, control: wmsx.PeripheralControls.TAPE_LOAD_FILE, secSlot: true, needsUIG: true },
            { label: "New Blank Tape",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_EMPTY, secSlot: true },
            { label: "Rewind Tape",                 control: wmsx.PeripheralControls.TAPE_REWIND, disabled: true, secSlot: true },
            { label: "Run Program",        clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_AUTO_RUN, secSlot: true, disabled: true },
            { label: "Save Image File",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_SAVE_FILE, disabled: true, secSlot: true, needsUIG: true },
            { label: "Remove Tape",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE, disabled: true, secSlot: true }
        ];
        tapeButton = addPeripheralControlButton("wmsx-bar-tape", -136, -72, true, "Cassette Tape", null, menu, "Cassette Tape", mediaIconsContainer);

        menu = createSettingsMenuOptions();
        settingsButton = addPeripheralControlButton("wmsx-bar-settings", -96, -1, false, "Settings", null, menu, "Settings");

        if (FULLSCREEN_MODE !== -2) {
            fullscreenButton = addPeripheralControlButton("wmsx-bar-full-screen", -71, -1, false, "Full Screen", wmsx.PeripheralControls.SCREEN_FULLSCREEN);
            fullscreenButton.wmsxNeedsUIG = true;
            if (isMobileDevice) fullscreenButton.classList.add("wmsx-mobile");
        }

        if (!WMSX.SCREEN_RESIZE_DISABLED && !isMobileDevice) {
            scaleUpButton = addPeripheralControlButton("wmsx-bar-scale-plus", -48, -1, false, "Increase Screen", wmsx.PeripheralControls.SCREEN_SCALE_PLUS);
            scaleUpButton.classList.add("wmsx-full-screen-hidden");
            scaleDownButton = addPeripheralControlButton("wmsx-bar-scale-minus", -26, -1, false, "Decrease Screen", wmsx.PeripheralControls.SCREEN_SCALE_MINUS);
            scaleDownButton.classList.add("wmsx-full-screen-hidden");
        }

        if (isMobileDevice) {
            var textButton = addPeripheralControlButton("wmsx-bar-text", -53, -51, false, "Toggle Text Input", wmsx.PeripheralControls.OPEN_ENTER_STRING);
            textButton.classList.add("wmsx-mobile");
        }

        var keyboardButton = addPeripheralControlButton("wmsx-bar-keyboard", -83, -25, false, "Toggle Virtual Keyboard", wmsx.PeripheralControls.SCREEN_TOGGLE_VIRTUAL_KEYBOARD);
        keyboardButton.classList.add("wmsx-full-screen-only");

        logoButton = addPeripheralControlButton("wmsx-bar-logo", -8, -25, false, "About WebMSX", wmsx.PeripheralControls.SCREEN_OPEN_ABOUT);
        logoButton.classList.add("wmsx-full-screen-hidden");
        logoButton.classList.add("wmsx-narrow-hidden");

        // Events for BarButtons and also MenuItems
        wmsx.Util.onTapOrMouseDownWithBlockUIG(buttonsBar, barElementTapOrMouseDown);
        wmsx.Util.addEventsListener(buttonsBar, "touchmove", barElementTouchMove);
        wmsx.Util.addEventsListener(buttonsBar, "mouseup touchend", barElementTouchEndOrMouseUp);
    }

    function addPeripheralControlButton(id, bx, by, media, tooltip, control, menu, menuTitle, parent) {
        var but = document.createElement('div');
        but.id = id;
        but.classList.add("wmsx-bar-button");
        if (media) but.classList.add("wmsx-media-button");
        but.wmsxBarElementType = 1;     // Bar button
        but.wmsxControl = control;
        but.style.backgroundPosition = "" + bx + "px " + by + "px";
        but.wmsxBX = bx;
        if (menu) {
            but.wmsxMenu = menu;
            menu.wmsxTitle = menuTitle;
            menu.wmsxRefElement = but;
            menu.wmsxMenuIndex = barMenus.length;
            barMenus.push(menu);
        }
        if (tooltip) but.title = tooltip;

        // Mouse hover button
        but.addEventListener("mouseenter", function(e) { barButtonHoverOver(e.target, e); });

        (parent || buttonsBarInner).appendChild(but);
        return but;
    }

    function barButtonTapOrMousedown(elem, e, uigStart, uigEnd) {
        if (!uigEnd) controllersHub.hapticFeedbackOnTouch(e);
        if (logoMessageActive || uigStart) return;

        var prevActiveMenu = barMenuActive;
        closeAllOverlays();

        // Single option, only left click
        if (elem.wmsxControl) {
            if (!e.button) peripheralControls.processControlActivated(elem.wmsxControl);
            return;
        }

        var menu = elem.wmsxMenu;
        if (!menu) return;

        var modifs = 0 | (e.altKey && KEY_ALT_MASK) | (e.ctrlKey && KEY_CTRL_MASK) | (e.shiftKey && KEY_SHIFT_MASK);

        // Open/close menu with left-click if no modifiers
        if (modifs === 0 && !e.button) {
            if (prevActiveMenu !== menu) {
                showBarMenu(menu);
                // Only start LongTouch for touches!
                if (e.type === "touchstart") barButtonLongTouchStart(e);
            }
            return;
        }

        // Modifier options for left, middle or right click
        for (var i = 0; i < menu.length; ++i)
            if (menu[i].clickModif === modifs) {
                peripheralControls.processControlActivated(menu[i].control, e.button === 1, menu[i].secSlot);         // altPower for middleClick (button === 1)
                return;
            }
        // If no direct shortcut found with modifiers used, use SHIFT as secSlot modifier and try again
        // if (modifs & KEY_SHIFT_MASK) {
        //     modifs &= ~KEY_SHIFT_MASK;
        //     for (i = 0; i < menu.length; ++i)
        //         if (menu[i].clickModif === modifs) {
        //             peripheralControls.processControlActivated(menu[i].control, e.button === 1, true);               // altPower for middleClick (button === 1)
        //             return;
        //         }
        // }
    }

    function barButtonLongTouchStart(e) {
        barButtonLongTouchTarget = e.target;
        barButtonLongTouchSelectTimeout = window.setTimeout(function buttonsBarLongTouchSelectDefault() {
            if (!barMenuActive) return;
            var items = barMenu.wmsxItems;
            for (var i = 0; i < items.length; ++i) {
                var option = items[i].wmsxMenuOption;
                if (option && option.clickModif === 0) {
                    barMenuItemSetActive(items[i], true);
                    return;
                }}
        }, 450);
    }

    function barButtonLongTouchCancel() {
        if (barButtonLongTouchSelectTimeout) {
            clearTimeout(barButtonLongTouchSelectTimeout);
            barButtonLongTouchSelectTimeout = null;
        }
    }

    function barButtonHoverOver(elem, e) {
        if (barMenuActive && elem.wmsxMenu && barMenuActive !== elem.wmsxMenu ) {
            controllersHub.hapticFeedbackOnTouch(e);
            showBarMenu(elem.wmsxMenu);
        }
    }

    function barButtonTouchEndOrMouseUp(e) {
        if (logoMessageActive) return;
        if (barMenuItemActive) barMenuItemFireActive(e.shiftKey || e.button === 2, e.ctrlKey);
    }

    // TODO Test on other browsers
    function barMenuItemTapOrMouseDown(elem, e, uigEnd) {
        if (uigEnd) return;
        barMenuItemSetActive(elem, e.type === "touchstart");
        barMenuItemTouchActivation = e.type === "touchstart" ? wmsx.Util.performanceNow() : undefined;
    }

    function barMenuItemHoverOver(elem, e) {
        barMenuItemSetActive(elem, e.type === "touchmove");
    }

    function barMenuItemHoverOut() {
        barMenuItemSetActive(null);
    }

    function barMenuItemTouchEndOrMouseUp(e) {
        if (logoMessageActive) return;
        var secSlot = e.shiftKey || e.button === 2;
        if (barMenuItemTouchActivation && (wmsx.Util.performanceNow() - barMenuItemTouchActivation) > TOUCH_SLOT2_TIME) secSlot |= true;
        if (barMenuItemActive) barMenuItemFireActive(secSlot, e.ctrlKey);
    }

    function barMenuItemFireActive(secSlot, altPower) {
        var option = barMenuItemActive.wmsxMenuOption;
        barMenuItemSetActive(null);
        if (option && !option.disabled) {
            if (option.extension) {
                if (!extensionChangeDisabledWarning()) peripheralControls.processControlActivated(wmsx.PeripheralControls.EXTENSION_TOGGLE, altPower, secSlot, option.extension);
            } else if (option.control) {
                secSlot = option.secSlot;
                closeAllOverlays();
                peripheralControls.processControlActivated(option.control, altPower, secSlot);
            }
        }
    }

    function barMenuItemSetActive(element, haptic) {
        if (element === barMenuItemActive) return;
        if (barMenuItemActive) barMenuItemActive.classList.remove("wmsx-hover");
        if (element && element.wmsxMenuOption) {
            barMenuItemActive = element;
            if (haptic) controllersHub.hapticFeedback();
            barMenuItemActive.classList.add("wmsx-hover");
        } else
            barMenuItemActive = null;
    }

    function barElementTapOrMouseDown(e, uigStart, uigEnd) {
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
        var elem = e.target;
        if (elem.wmsxBarElementType === 1) barButtonTapOrMousedown(elem, e, uigStart, uigEnd);
        else if (elem.wmsxBarElementType === 2) barMenuItemTapOrMouseDown(elem, e, uigEnd);
        else hideBarMenu();
    }

    function barElementTouchMove(e) {
        wmsx.Util.blockEvent(e);
        var t = e.changedTouches[0];
        var elem = t && document.elementFromPoint(t.clientX, t.clientY);
        if (barButtonLongTouchTarget && elem !== barButtonLongTouchTarget) barButtonLongTouchCancel();
        if (elem.wmsxBarElementType !== 2 && elem !== barButtonLongTouchTarget) barMenuItemSetActive(null);
        if (elem.wmsxBarElementType === 1) barButtonHoverOver(elem, e);
        else if (elem.wmsxBarElementType === 2) barMenuItemHoverOver(elem, e);

    }

    function barElementTouchEndOrMouseUp(e) {
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
        wmsx.Util.blockEvent(e);
        barButtonLongTouchCancel();
        var elem = e.target;
        if (elem.wmsxBarElementType === 1) barButtonTouchEndOrMouseUp(e);
        else if (elem.wmsxBarElementType === 2) barMenuItemTouchEndOrMouseUp(e);
    }

    function createSettingsMenuOptions() {
        var menu = [ ];

        var extConfig = WMSX.EXTENSIONS_CONFIG;
        for (var ext in extConfig) {
            var conf = extConfig[ext];
            if (conf.desc) {            // Only show extensions with descriptions
                var opt = { label: conf.desc, extension: ext, toggle: true, checkedOp: 0 };
                menu.push(opt);
            }
        }
        menu.push({ label: "",               divider: true });

        menu.push({ label: "Select Machine", clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.SCREEN_OPEN_MACHINE_SELECT });

        if (!isMobileDevice) {
        menu.push({label: "Help & Settings", clickModif: 0, control: wmsx.PeripheralControls.SCREEN_OPEN_SETTINGS});
        menu.push({label: "Quick Options",   clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.SCREEN_OPEN_QUICK_OPTIONS});
        } else
        menu.push({label: "Quick Options",   clickModif: 0, control: wmsx.PeripheralControls.SCREEN_OPEN_QUICK_OPTIONS});

        if (isTouchDevice)
        menu.push({ label: "Touch Setup",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.SCREEN_OPEN_TOUCH_CONFIG, fullScreenOnly: true});

        if (!isMobileDevice)
        menu.push({ label: "Defaults",       clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.SCREEN_DEFAULTS/*,          fullScreenHidden: true*/ });

        return menu;
    }

    function refreshSettingsMenuForExtensions() {
        var menu = settingsButton.wmsxMenu;
        for (var i = 0; i < menu.length; ++i) {
            var opt = menu[i];
            if (opt.extension) {
                opt.hidden = !extensionsSocket.isValid(opt.extension);
                opt.checkedOp = WMSX.EXTENSIONS[opt.extension];
                opt.noOp2 = !WMSX.EXTENSIONS_CONFIG[opt.extension].OP2;
            }
        }
        if (barMenuActive === menu) refreshBarMenu(menu);
    }

    function refreshSettingsMenuForMachineType() {
        var menu = settingsButton.wmsxMenu;
        menu.wmsxTitle = (WMSX.MACHINES_CONFIG[machineTypeSocket.getMachine()].desc.split("(")[0] || "Settings").trim();
        if (barMenuActive === menu) refreshBarMenu(menu);
    }

    function setupCopyTextArea() {
        copyTextArea = document.createElement("textarea");
        copyTextArea.id = "wmsx-copy-texarea";
        fsElement.appendChild(copyTextArea);
    }

    function setupFullscreen() {
        fullscreenAPIEnterMethod = fsElement.requestFullscreen || fsElement.webkitRequestFullscreen || fsElement.webkitRequestFullScreen || fsElement.mozRequestFullScreen;
        fullScreenAPIExitMethod =  document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
        if ("fullscreenElement" in document) fullScreenAPIQueryProp = "fullscreenElement";
        else if ("webkitFullscreenElement" in document) fullScreenAPIQueryProp = "webkitFullscreenElement";
        else if ("mozFullScreenElement" in document) fullScreenAPIQueryProp = "mozFullScreenElement";

        if (!fullscreenAPIEnterMethod && isMobileDevice && !isBrowserStandalone) fullScreenScrollHack = true;

        if ("onfullscreenchange" in document)            document.addEventListener("fullscreenchange", fullscreenByAPIChanged);
        else if ("onwebkitfullscreenchange" in document) document.addEventListener("webkitfullscreenchange", fullscreenByAPIChanged);
        else if ("onmozfullscreenchange" in document)    document.addEventListener("mozfullscreenchange", fullscreenByAPIChanged);

        // Prevent scroll & zoom in fullscreen if not touching on the screen (canvas) or scroll message in hack mode
        if (!fullscreenAPIEnterMethod) {
            scrollMessage.wmsxScroll = canvas.wmsxScroll = logo.wmsxScroll = logoCenter.wmsxScroll = logoImage.wmsxScroll =
                logoMessage.wmsxScroll = logoMessageText.wmsxScroll = logoMessageOK.wmsxScroll = logoMessageOKText.wmsxScroll = true;

            fsElement.addEventListener("touchmove", function preventTouchMoveInFullscreenByHack(e) {
                if (isFullscreen) {
                    if (!fullScreenScrollHack || !e.target.wmsxScroll)
                        return wmsx.Util.blockEvent(e);
                    else
                        if (scrollMessageActive) setScrollMessage(false);
                }
            });
        }
    }

    function setEnterFullscreenByAPIOnFirstTouch() {
        // Add event to enter in real fullScreenByAPI on first touch/click if possible
        if (fullscreenAPIEnterMethod) {
            var done = false;
            var enterFullScreenByAPIonFirstTouch = function() {
                if (done) return;
                done = true;
                wmsx.Util.removeEventsListener(fsElement, "touchend mousedown", enterFullScreenByAPIonFirstTouch, true);
                enterFullScreenByAPI();
            };
            wmsx.Util.addEventsListener(fsElement, "touchend mousedown", enterFullScreenByAPIonFirstTouch, true);    // Capture!
        }
    }

    function setFullscreenState(mode) {
        isFullscreen = mode;

        if (mode) {
            setViewport();
            document.documentElement.classList.add("wmsx-full-screen");
            if (fullScreenScrollHack) document.documentElement.classList.add("wmsx-full-screen-scroll-hack");
            controllersHub.setupTouchControlsIfNeeded(fsElementCenter);
            if (fullScreenScrollHack) setScrollMessage(true);
            if (!fullscreenAPIEnterMethod) tryToFixSafariBugOnFullScreenChange();
        } else {
            restoreViewport();
            document.documentElement.classList.remove("wmsx-full-screen");
            if (fullScreenScrollHack) document.documentElement.classList.remove("wmsx-full-screen-scroll-hack");
            if (!fullscreenAPIEnterMethod) tryToFixSafariBugOnFullScreenChange();
        }

        self.requestReadjust();
    }

    function tryToFixSafariBugOnFullScreenChange() {
        // Toggle a dummy element existence inside mainElement to try to force a reflow
        var dummy = document.getElementById("wmsx-dummy-element");
        if (dummy) {
            mainElement.removeChild(dummy);
        } else {
            dummy = document.createElement("div");
            dummy.id = "wmsx-dummy-element";
            mainElement.appendChild(dummy);
        }
    }

    function showBar() {
        buttonsBar.classList.remove("wmsx-hidden");
    }

    function hideBar() {
        if ((BAR_AUTO_HIDE || isFullscreen) && !barMenuActive && !virtualKeyboardMode) {
            hideBarMenu();
            buttonsBar.classList.add("wmsx-hidden");
        }
    }

    function showBarMenu(menu, select) {
        if (!menu || barMenuActive === menu) return;

        if (!barMenu) {
            setupBarMenu();
            setTimeout(function() {
                showBarMenu(menu, select);
            }, 1);
            return;
        }

        // Define items
        refreshBarMenu(menu);
        barMenuItemSetActive(select ? barMenu.wmsxDefaultItem : null);

        // Position
        var refElement = menu.wmsxRefElement;
        var p = (refElement && (refElement.offsetLeft - 15)) || 0;
        if (p + wmsx.ScreenGUI.BAR_MENU_WIDTH > buttonsBarInner.clientWidth) {
            barMenu.style.right = 0;
            barMenu.style.left = "auto";
            barMenu.style.transformOrigin = "bottom right";
        } else {
            if (p < 0) p = 0;
            barMenu.style.left = "" + p + "px";
            barMenu.style.right = "auto";
            barMenu.style.transformOrigin = "bottom left";
        }

        // Show
        showCursorAndBar(true);
        barMenuActive = menu;
        barMenu.style.display = "inline-block";
        barMenu.wmsxTitle.focus();
    }

    function refreshBarMenu(menu) {
        barMenu.wmsxTitle.innerHTML = menu.wmsxTitle;
        barMenu.wmsxDefaultItem = null;

        var it = 0;
        var item;
        var maxShown = Math.min(menu.length, BAR_MENU_MAX_ITEMS);
        var h = wmsx.ScreenGUI.BAR_MENU_ITEM_HEIGHT + 3;         // title + borders

        for (var op = 0; op < maxShown; ++op) {
            var option = menu[op];
            if (option.label !== undefined) {
                item = barMenu.wmsxItems[it];
                item.firstChild.textContent = option.label;
                item.wmsxMenuOption = null;

                if (option.hidden || (isFullscreen && option.fullScreenHidden) || (!isFullscreen && option.fullScreenOnly)) {
                    item.style.display = "none";
                } else {
                    item.style.display = "block";

                    // Divider?
                    if (option.divider) {
                        item.classList.add("wmsx-bar-menu-item-divider");
                    } else {
                        item.classList.remove("wmsx-bar-menu-item-divider");
                        h += wmsx.ScreenGUI.BAR_MENU_ITEM_HEIGHT;   // each non-divider item

                        // Toggle
                        item.classList.toggle("wmsx-bar-menu-item-toggle", option.toggle !== undefined);
                        item.classList.toggle("wmsx-no-op2", option.noOp2);

                        // Disabled?
                        if (option.disabled) {
                            item.classList.add("wmsx-bar-menu-item-disabled");
                        } else {
                            item.classList.remove("wmsx-bar-menu-item-disabled");

                            item.wmsxMenuOption = option;
                            if (option.clickModif === 0) barMenu.wmsxDefaultItem = item;    // If option is the default, set this item to be selected as default

                            // User Generated Gesture needed?
                            item.wmsxNeedsUIG = option.needsUIG;

                            // Toggle checked
                             if (option.toggle !== undefined) {
                                 item.classList.toggle("wmsx-bar-menu-item-toggle-checked", !!option.checkedOp);
                                 item.classList.toggle("wmsx-op1", (option.checkedOp & 1) !== 0);
                                 item.classList.toggle("wmsx-op2", (option.checkedOp & 2) !== 0);
                             }
                        }
                    }
                }

                ++it;
            }
        }
        for (var r = it; r < BAR_MENU_MAX_ITEMS; ++r) {
            item = barMenu.wmsxItems[r];
            item.firstChild.textContent = "";
            item.style.display = "none";
            item.wmsxMenuOption = null;
        }

        var height = fsElementCenter.clientHeight - wmsx.ScreenGUI.BAR_HEIGHT - 8;      // bar + borders + tolerance
        var scale = h < height ? 1 : height / h;
        if (barMenu) barMenu.style.transform = "scale(" + scale.toFixed(4) + ")";

        //console.error("MESSAGE SCALE height: " + height + ", h: " + h);
    }

    function hideBarMenu() {
        if (!barMenuActive) return;
        barMenuActive = null;
        barMenu.style.display = "none";
        barMenuItemSetActive(null);
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
        self.focus();
    }

    function setupBarMenu() {
        barMenu = document.createElement('div');
        barMenu.id = "wmsx-bar-menu";

        var inner = document.createElement('div');
        inner.id = "wmsx-bar-menu-inner";
        barMenu.appendChild(inner);

        var title = document.createElement('div');
        title.id = "wmsx-bar-menu-title";
        title.tabIndex = -1;
        title.innerHTML = "Menu Title";
        inner.appendChild(title);
        barMenu.wmsxTitle = title;

        barMenu.wmsxItems = new Array(BAR_MENU_MAX_ITEMS);
        for (var i = 0; i < BAR_MENU_MAX_ITEMS; ++i) {
            var item = document.createElement('div');
            item.classList.add("wmsx-bar-menu-item");
            item.style.display = "none";
            item.innerHTML = "Menu Item " + i;
            item.wmsxBarElementType = 2;     // Menu Item
            item.wmsxItemIndex = i;
            item.addEventListener("mouseenter", function (e) { barMenuItemHoverOver(e.target, e); });
            item.addEventListener("mouseleave", barMenuItemHoverOut);
            inner.appendChild(item);
            barMenu.wmsxItems[i] = item;
        }

        // Block keys and respond to some
        barMenu.addEventListener("keydown", function(e) {
            var keyCode = domKeys.codeNewForKeyboardEvent(e);
            // Hide
            if (MENU_CLOSE_KEYS[keyCode]) hideBarMenu();
            // Execute
            else if (barMenuItemActive && MENU_EXEC_KEYS[keyCode & ~KEY_SHIFT_MASK & ~KEY_CTRL_MASK]) barMenuItemFireActive(e.shiftKey, e.ctrlKey);
            // Select Menu
            else if (MENU_SELECT_KEYS[keyCode]) {
                if (!barMenuActive) return;
                var newMenuIndex = barMenuActive.wmsxMenuIndex;
                do {
                    newMenuIndex = (barMenus.length + newMenuIndex + MENU_SELECT_KEYS[keyCode]) % barMenus.length;
                    var newMenu = barMenus[newMenuIndex];
                } while(!newMenu || newMenu.wmsxHidden);    // barMenus has gaps === null
                showBarMenu(newMenu, true);
            }
            // Select Item
            else if (MENU_ITEM_SELECT_KEYS[keyCode]) {
                var items = barMenu.wmsxItems;
                var newItem = barMenuItemActive ? barMenuItemActive.wmsxItemIndex : -1;
                var tries = BAR_MENU_MAX_ITEMS + 1;
                do {
                    newItem = (newItem + items.length + MENU_ITEM_SELECT_KEYS[keyCode]) % items.length;
                } while (--tries >= 0 && !items[newItem].wmsxMenuOption);
                if (tries >= 0) barMenuItemSetActive(items[newItem]);
            }
            return wmsx.Util.blockEvent(e);
        });

        buttonsBar.appendChild(barMenu);
    }


    function closePowerOnModals() {
        if (pasteDialog) pasteDialog.hide();
        if (textEntryDialog) textEntryDialog.hide();
    }

    function closeAllOverlays() {
        hideBarMenu();
        if (pasteDialog) pasteDialog.hide();
        if (textEntryDialog) textEntryDialog.hide();
        if (machineSelectDialog) machineSelectDialog.hide();
        if (diskSelectDialog) diskSelectDialog.hide();
        if (newHardDiskDialog) newHardDiskDialog.hide();
        if (saveStateDialog) saveStateDialog.hide();
        if (touchConfigDialog) touchConfigDialog.hide();
        if (quickOtionsDialog) quickOtionsDialog.hide();
        if (netPlayDialog) netPlayDialog.hide();
        if (cartFormatDialog) cartFormatDialog.hide();
        if (settingsDialog) settingsDialog.hide();
    }

    function showLogoMessage(mes, button, higherButton, afterAction) {
        if (logoMessageActive) return;

        closeAllOverlays();
        if (afterAction) afterMessageAction = afterAction;
        logoMessageText.innerHTML = mes;
        logoMessageOK.classList.toggle("wmsx-higher", !!higherButton);
        logoMessageOKText.innerHTML = button || "OK";
        fsElement.classList.add("wmsx-logo-message-active");
        logoMessageActive = true;

        signalIsOn = false;
        updateLogo();
    }

    function closeLogoMessage(e, uigStart, uigEnd) {
        if (!uigEnd) controllersHub.hapticFeedbackOnTouch(e);
        if (uigStart) return;
        fsElement.classList.remove("wmsx-logo-message-active");
        logoMessageActive = false;
        if (afterMessageAction) {
            var action = afterMessageAction;
            afterMessageAction = null;
            action();
        }
    }

    function updateLogoScale() {
        if (logoMessageActive) {
            var width = canvasOuter.clientWidth;
            var scale = Math.min(width / wmsx.ScreenGUI.LOGO_SCREEN_WIDTH, 1);
            logoCenter.style.transform = "translate(-50%, -50%) scale(" + scale.toFixed(4) + ")";

            // console.error("MESSAGE SCALE width: " + width + ", scale: " + scale);
        } else
            logoCenter.style.transform = "translate(-50%, -50%)";
    }

    function setScrollMessage(state) {
        fsElement.classList.toggle("wmsx-scroll-message", state);
        scrollMessageActive = state;
        if (state) {
            setTimeout(function() {
                setScrollMessage(false);
            }, 5000);
        }
    }

    function readjustAll(force) {
        if (readjustScreeSizeChanged(force)) {
            if (isFullscreen) {
                var isLandscape = readjustScreenSize.w > readjustScreenSize.h;
                var keyboardRect = virtualKeyboardMode && updateKeyboardWidth(readjustScreenSize.w);
                buttonsBarDesiredWidth = isLandscape ? virtualKeyboardMode ? keyboardRect.w : 0 : -1;
                var winH = readjustScreenSize.h;
                if (!isLandscape || virtualKeyboardMode) winH -= wmsx.ScreenGUI.BAR_HEIGHT + 2;
                if (virtualKeyboardMode) winH -= keyboardRect.h + 2;
                monitor.displayScale(aspectX, displayOptimalScaleY(readjustScreenSize.w, winH));
            } else {
                buttonsBarDesiredWidth = -1;
                monitor.displayScale(aspectX, scaleYBeforeUserFullscreen || displayDefaultScale());
            }

            self.focus();
            controllersHub.screenReadjustedUpdate();

            //console.log("READJUST");
        }

        if (readjustInterval && (wmsx.Util.performanceNow() - readjustRequestTime >= 1000)) {
            clearInterval(readjustInterval);
            readjustInterval = null;
            //console.log("READJUST TERMINATED");
        }
    }

    function readjustScreeSizeChanged(force) {
        var parW = mainElement.parentElement.clientWidth;
        var winW = fsElementCenter.clientWidth;
        var winH = fsElementCenter.clientHeight;

        if (!force && readjustScreenSize.pw === parW && readjustScreenSize.w === winW && readjustScreenSize.h === winH)
            return false;

        readjustScreenSize.pw = parW;
        readjustScreenSize.w = winW;
        readjustScreenSize.h = winH;
        return true;
    }

    function displayOptimalScaleY(maxWidth, maxHeight) {
        var scY = maxHeight / targetHeight;
        if (targetWidth * aspectX * scY > maxWidth)
            scY = maxWidth / (targetWidth * aspectX);
        return scY;
    }

    function setViewport() {
        if (!isMobileDevice) return;

        if (viewPortOriginalContent === undefined) {    // store only once!
            viewPortOriginalTag = document.querySelector("meta[name=viewport]");
            viewPortOriginalContent = (viewPortOriginalTag && viewPortOriginalTag.content) || null;
        }

        if (!viewportTag) {
            viewportTag = document.createElement('meta');
            viewportTag.name = "viewport";
            // Android Firefox bug (as of 11/2016). Going back and forth from full-screen makes scale all wrong. Set user-scalable = yes to let user correct it in full-screen :-(
            viewportTag.content = "width = device-width, height = device-height, initial-scale = 1.0, minimum-scale = 1.0, maximum-scale = 1.0, user-scalable = yes";
            document.head.appendChild(viewportTag);
        }

        if (viewPortOriginalTag) try { document.head.removeChild(viewPortOriginalTag); } catch (e) { /* ignore */ }
        viewPortOriginalTag = null;
    }

    function restoreViewport() {
        if (!isMobileDevice) return;

        if (!viewPortOriginalTag && viewPortOriginalContent) {
            viewPortOriginalTag = document.createElement('meta');
            viewPortOriginalTag.name = "viewport";
            viewPortOriginalTag.content = viewPortOriginalContent;
            document.head.appendChild(viewPortOriginalTag);
        }

        if (viewportTag) try { document.head.removeChild(viewportTag); } catch (e) { /* ignore */ }
        viewportTag = null;
    }

    function setPageVisibilityHandling() {
        var wasUnpaused;
        function visibilityChange() {
            if (logoMessageActive) return;

            if (document.hidden) {
                wasUnpaused = !machine.systemPause(true);
            } else {
                if (wasUnpaused) machine.systemPause(false);
            }
        }
        document.addEventListener("visibilitychange", visibilityChange);
    }

    function extensionChangeDisabledWarning() {
        if (WMSX.MEDIA_CHANGE_DISABLED) {
            machine.showOSD("Extension change is disabled!", true, true);
            return true;
        }
        return false;
    }

    function setupFileLoaderDropTargets() {
        fileLoaderDropArea = document.getElementById("wmsx-drop-area");
        fileLoaderDropAreaMessage = document.getElementById("wmsx-drop-area-message");

        var mainEle, subEle, subAdd, subFiles;

        // port = undefined : auto port assignment
        mainEle = fsElement;
        subAdd = { element: mainEle, openType: OPEN_TYPE.DISK, port: undefined, add: true, mainEle: mainEle, mes: "Add Disk(s) to Drive (auto-detect)", mesSec: "Add Disk(s) to Drive B Stack" };
        subFiles = { element: mainEle, openType: OPEN_TYPE.DISK, port: undefined, files: true, mainEle: mainEle, mes: "Add Files to Drive (auto-detect)", mesSec: "Add Files to Disk in Drive B" };
        mainEle.wmsxDropInfo = { element: mainEle, openType: OPEN_TYPE.AUTO, port: undefined, subAdd: subAdd, subFiles: subFiles, mes: "Auto detect media", mesSec: "Auto detect media (to Drive B / Cartridge 2)" };

        diskAButton.wmsxDropTarget = mainEle = document.getElementById("wmsx-drop-drivea");
        subEle = document.getElementById("wmsx-drop-drivea-add");
        subEle.wmsxDropInfo = subAdd = { element: subEle, openType: OPEN_TYPE.DISK, port: 0, add: true, mainEle: mainEle, mes: "Add Disk(s) to Drive A Stack" };
        subEle = document.getElementById("wmsx-drop-drivea-files");
        subEle.wmsxDropInfo = subFiles = { element: subEle, openType: OPEN_TYPE.DISK, port: 0, files: true, mainEle: mainEle, mes: "Add Files to Disk in Drive A" };
        mainEle.wmsxDropInfo = { element: mainEle, openType: OPEN_TYPE.DISK, port: 0, subAdd: subAdd, subFiles: subFiles, mes: "Load Disk(s) in Drive A" };

        diskBButton.wmsxDropTarget = mainEle = document.getElementById("wmsx-drop-driveb");
        subEle = document.getElementById("wmsx-drop-driveb-add");
        subEle.wmsxDropInfo = subAdd = { element: subEle, openType: OPEN_TYPE.DISK, port: 1, add: true, mainEle: mainEle, mes: "Add Disk(s) to Drive B Stack"  };
        subEle = document.getElementById("wmsx-drop-driveb-files");
        subEle.wmsxDropInfo = subFiles = { element: subEle, openType: OPEN_TYPE.DISK, port: 1, files: true, mainEle: mainEle, mes: "Add Files to Disk in Drive B" };
        mainEle.wmsxDropInfo = { element: mainEle, openType: OPEN_TYPE.DISK, port: 1, subAdd: subAdd, subFiles: subFiles, mes: "Load Disk(s) in Drive B" };

        diskHButton.wmsxDropTarget = mainEle = document.getElementById("wmsx-drop-driveh");
        subEle = document.getElementById("wmsx-drop-driveh-files");
        subEle.wmsxDropInfo = subFiles = { element: subEle, openType: OPEN_TYPE.DISK, port: 2, files: true, mainEle: mainEle, mes: "Add Files to Hard Disk" };
        mainEle.wmsxDropInfo = { element: mainEle, openType: OPEN_TYPE.DISK, port: 2, subFiles: subFiles, mes: "Load Hard Disk" };

        mainEle = document.getElementById("wmsx-drop-cart1");
        mainEle.wmsxDropInfo = { element: mainEle, openType: OPEN_TYPE.ROM, port: 0, mes: "Load Cartride 1" };

        mainEle = document.getElementById("wmsx-drop-cart2");
        mainEle.wmsxDropInfo = { element: mainEle, openType: OPEN_TYPE.ROM, port: 1, mes: "Load Cartride 2" };

        mainEle = document.getElementById("wmsx-drop-tape");
        mainEle.wmsxDropInfo = { element: mainEle, openType: OPEN_TYPE.TAPE, port: 0, mes: "Load Cassette Tape" };
    }

    this.setFileLoaderDragMessage = function (mes) {
        var active = !!mes;
        if (active) {
            closeAllOverlays();
            fileLoaderDropAreaMessage.textContent = mes;
        }
        if (active == fileLoaderDragActive) return;
        fileLoaderDragActive = active;
        fileLoaderDropArea.classList.toggle("wmsx-visible", active);
        if (active) wmsx.Util.scaleToFitParentWidth(fileLoaderDropArea, fsElement, 11);
    };


    var afterMessageAction;

    var machine;

    var monitor;
    var machineControls;
    var peripheralControls;
    var cartridgeSlot;
    var fileLoader;
    var fileDownloader;
    var controllersHub;
    var extensionsSocket;
    var machineTypeSocket;
    var controllersSocket;
    var cartridgeSocket;
    var diskDrive;
    var stateMedia;

    var readjustInterval = 0, readjustRequestTime = 0;
    var readjustScreenSize = { w: 0, wk: 0, h: 0, pw: 0 };

    var isFullscreen = false;

    var isTouchDevice = wmsx.Util.isTouchDevice();
    var isMobileDevice = wmsx.Util.isMobileDevice();
    var isIOSDevice = wmsx.Util.isIOSDevice();
    var isBrowserStandalone = wmsx.Util.isBrowserStandaloneMode();
    var browserName = wmsx.Util.browserInfo().name;

    var fileLoaderDropArea, fileLoaderDragActive = false, fileLoaderDropAreaMessage;

    var fullscreenAPIEnterMethod, fullScreenAPIExitMethod, fullScreenAPIQueryProp, fullScreenAPIExitUserRequested = false, fullScreenScrollHack = false;
    var viewportTag, viewPortOriginalTag, viewPortOriginalContent;

    var settingsDialog;
    var saveStateDialog;
    var diskSelectDialog;
    var newHardDiskDialog;
    var machineSelectDialog;
    var touchConfigDialog;
    var quickOtionsDialog;
    var netPlayDialog;
    var cartFormatDialog;
    var pasteDialog;
    var textEntryDialog;
    var copyTextArea;

    var fsElement, fsElementCenter;

    var canvas, canvasOuter, canvasLoadingIcon;
    var canvasContext;
    var canvasImageRenderingValue;

    var touchControlsActive = false, touchControlsDirBig = false;
    var virtualKeyboardMode = 0;
    var virtualKeyboardElement, virtualKeyboard;

    var buttonsBar, buttonsBarInner, buttonsBarDesiredWidth = -1;       // 0 = same as canvas. -1 means full width mode (100%)
    var barButtonLongTouchTarget, barButtonLongTouchSelectTimeout;

    var barMenu;
    var barMenus = [], barMenuActive, barMenuItemActive, barMenuSystem;
    var barMenuItemTouchActivation = 0;

    var osd;
    var osdTimeout;
    var osdShowing = false;

    var cursorType = "auto";
    var cursorShowing = true;
    var cursorHideFrameCountdown = -1;
    var signalIsOn = false;
    var crtFilter = -2, crtFilterEffective = null;
    var crtMode = -1, crtModeEffective = 0;
    var debugMode = false;
    var isLoading = false;

    var aspectX = WMSX.SCREEN_DEFAULT_ASPECT;
    var scaleY = 1.1;
    var scaleYBeforeUserFullscreen = 0;
    var pixelWidth = 1, pixelHeight = 1;

    var mousePointerLocked = false;

    var targetWidth = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
    var targetHeight = WMSX.MACHINES_CONFIG[WMSX.MACHINE].type === 1
        ? wmsx.VDP.SIGNAL_HEIGHT_V9918 * 2
        : wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938;


    var logo, logoCenter, logoImage, logoMessage, logoMessageText, logoMessageOK, logoMessageOKText, logoMessageActive = false;
    var logoLoadingIcon;
    var scrollMessage, scrollMessageActive = false;

    var powerButton;
    var mediaIconsContainer;
    var diskAButton;
    var diskBButton;
    var diskHButton;
    var cartridge1Button;
    var cartridge2Button;
    var tapeButton;
    var logoButton;
    var scaleDownButton;
    var scaleUpButton;
    var fullscreenButton;
    var settingsButton;

    var barButtonBackYOffsets = [ -51, -26, -1 ];
    var mediaButtonBackYOffsets = [ -72, -48, -24, 0 ];

    var OSD_TIME = 4500;
    var CURSOR_HIDE_FRAMES = 180;

    var FULLSCREEN_MODE = WMSX.SCREEN_FULLSCREEN_MODE;

    var BAR_AUTO_HIDE = WMSX.SCREEN_CONTROL_BAR === 0;
    var BAR_MENU_MAX_ITEMS = Math.max(6, Object.keys(WMSX.EXTENSIONS_CONFIG).length) + 1 + 5;

    var VIRTUAL_KEYBOARD_WIDE_WIDTH = 518, VIRTUAL_KEYBOARD_NARROW_WIDTH = 419, VIRTUAL_KEYBOARD_HEIGHT = 161;

    var NARROW_WIDTH = 450;

    var domKeys = wmsx.DOMKeys;

    var TOUCH_SLOT2_TIME = 800;

    var KEY_CTRL_MASK  =  domKeys.CONTROL;
    var KEY_ALT_MASK   =  domKeys.ALT;
    var KEY_SHIFT_MASK =  domKeys.SHIFT;

    var MENU_CLOSE_KEYS = {}; MENU_CLOSE_KEYS[domKeys.VK_ESCAPE.wc] = 1; MENU_CLOSE_KEYS[domKeys.VK_CONTEXT.wc] = 1;
    var MENU_EXEC_KEYS = {}; MENU_EXEC_KEYS[domKeys.VK_ENTER.wc] = 1; MENU_EXEC_KEYS[domKeys.VK_SPACE.wc] = 1;
    var MENU_SELECT_KEYS = {}; MENU_SELECT_KEYS[domKeys.VK_LEFT.wc] = -1; MENU_SELECT_KEYS[domKeys.VK_RIGHT.wc] = 1;
    var MENU_ITEM_SELECT_KEYS = {}; MENU_ITEM_SELECT_KEYS[domKeys.VK_UP.wc] = -1; MENU_ITEM_SELECT_KEYS[domKeys.VK_DOWN.wc] = 1;

    var OPEN_TYPE = wmsx.FileLoader.OPEN_TYPE;

    init();

    this.eval = function(str) {
        return eval(str);
    };

};
