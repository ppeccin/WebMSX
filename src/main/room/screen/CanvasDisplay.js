// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Remove unstable UNICODE chars (Paste icon, Arrows in Settings)
// TODO Remove "Center" rounding problems as possible. Main screen element centering still remaining
// TODO Possible to use hotkeys and bypass logo messages

wmsx.CanvasDisplay = function(room, mainElement) {
"use strict";

    var self = this;

    function init() {
        wmsx.Util.insertCSS(document, wmsx.ScreenGUI.css());
        setupMain();
        setupBar();
        setupFileLoaderDropTargets();
        setupFullscreen();
        monitor = new wmsx.Monitor(self);
    }

    this.connect = function(pMachine) {
        machine = pMachine;
        machine.getVideoSocket().connectMonitor(monitor);
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
        controllersHub.addKeyInputElement(fsElement);
        controllersHub.setMouseInputElement(canvas);
        diskDrive = pDiskDrive;
        stateMedia = pStateMedia;
    };

    this.powerOn = function() {
        this.setDefaults();
        updateLogo();
        document.documentElement.classList.add("wmsx-started");
        setPageVisibilityHandling();
        this.focus();
        if (WMSXFullScreenSetup.shouldStartInFullScreen()) {
            setFullscreenState(true);
            if (FULLSCREEN_MODE !== 2 & isMobileDevice) setEnterFullscreenByAPIOnFirstTouch();       // Not if mode = 2 (Windowed)
        }
    };

    this.powerOff = function() {
        document.documentElement.classList.remove("wmsx-started");
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

    this.isDualScreenAllowed = function() {
        return !isMobileDevice;
    };

    this.refresh = function(image, sourceX, sourceY, sourceWidth, sourceHeight, internal) {
        // Hide mouse cursor if not moving for some time
        if (cursorHideFrameCountdown > 0)
            if (--cursorHideFrameCountdown <= 0) hideCursorAndBar();

        // Update Leds if necessary
        if (ledsStatePending) updateLeds();

        // If needed, turn signal on and hide logo
        if (!signalIsOn) {
            signalIsOn = true;
            updateLogo();
        }

        // Dual Screen mode? Decide which canvas to paint
        var paintContext, paintCanvas;
        if (videoOutputMode < 4 || ((videoOutputMode === 5) ^ internal)) {
            paintContext = canvasContext || createCanvasContext();
            paintCanvas = canvas;
        } else {
            paintContext = auxCanvasContext || auxCreateCanvasContext();
            paintCanvas = auxCanvas;
            if (!paintContext) return;      // auxWindow not ready
        }

        // Need to clear previous image? (Only in Mixed mode, right before painting Internal signal)
        if (videoOutputMode === 3 && internal) paintContext.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

        // Paint frame
        paintContext.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, paintCanvas.width, paintCanvas.height
        );

        // Paint Scanlines on top. Only if not in Debug and Signal is not Interlaced, also only once for both signals or for each in Dual mode
        if (crtScanlines && pixelHeight > 1 && !debugMode && (videoOutputMode >= 4 || (videoOutputMode <= 1 || !internal))) {
            var oldComposite = paintContext.globalCompositeOperation;
            var oldAlpha = paintContext.globalAlpha;
            paintContext.globalCompositeOperation = "source-over";
            paintContext.globalAlpha = crtScanlines / 10;
            paintContext.drawImage(
                scanlinesImage,
                0, 0, 1, paintCanvas.height,
                0, 0, paintCanvas.width, paintCanvas.height
            );
            paintContext.globalCompositeOperation = oldComposite;
            paintContext.globalAlpha = oldAlpha;
        }

        // console.log("Internal: " + internal + ", " + sourceWidth + "x" + sourceHeight + " > " + targetWidth + "x" + targetHeight);
    };

    this.videoSignalOff = function() {
        signalIsOn = false;
        showCursorAndBar();
        updateLeds();
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
        if (WMSX.MEDIA_CHANGE_DISABLED) return this.showOSD("Machine change is disabled!", true, true);
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
        if (!quickOtionsDialog) quickOtionsDialog = new wmsx.QuickOptionsDialog(fsElementCenter, machineTypeSocket, machineControls, peripheralControls);
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
        // this.showOSD("Info: " + navigator.maxTouchPoints + ", " + window.orientation + ", " + wmsx.Util.isMobileDevice() + ", " + WMSX.MOBILE_MODE);

        setVirtualKeyboard((virtualKeyboardMode + 1) % 3);
    };

    this.getScreenCapture = function() {
        if (!signalIsOn) return;
        return canvas.toDataURL('image/png');
    };

    this.saveScreenCapture = function() {
        var cap = this.getScreenCapture();
        if (cap) fileDownloader.startDownloadURL("WMSX Screen.png", cap, "WebMSX Screen Capture");
    };

    this.displayMetrics = function (renderWidth, renderHeight, internal) {
        // Target metrics are at fixed sizes around double the normal 256x212 render metrics + borders
        // All modes will use 512x424 + borders, except V9918 256x192 mode (2x), and V9990 768x240, 1024x212, 640x400, 640x480 modes (1x)

        // console.error("Display Metrics Render:", renderWidth, renderHeight, internal ? "int" : "ext");

        var newTargetWidth, newTargetHeight, newScrTargetWidth;

        switch (renderWidth) {
            case 192: case 384:            newTargetWidth = 384; break;
            case 256 + 16: case 512 + 32:  newTargetWidth = 512 + 32; break;
            case 640:                      newTargetWidth = 640; break;
            case 768:                      newTargetWidth = 768; break;
            case 1024 + 64:                newTargetWidth = 1024 + 64; break;
            default:                       newTargetWidth = 512 + 32;
        }
        newScrTargetWidth = newTargetWidth === 640 ? 640 : 512 + 32;    // For the actual screen, use 512 for all modes, except 640

        switch (renderHeight) {
            case 192 + 16:                 newTargetHeight = 384 + 32; break;
            case 212 + 16: case 424 + 32:  newTargetHeight = 424 + 32; break;
            case 400:                      newTargetHeight = 400; break;
            case 240: case 480:            newTargetHeight = 480; break;
            default:                       newTargetHeight = 424 + 32;
        }

        // Main or Aux screen?
        if ((videoOutputMode === 0 || videoOutputMode === 4) === internal)
            updateDisplayMetrics(renderWidth, renderHeight, newTargetWidth, newScrTargetWidth, newTargetHeight);
        else
            auxUpdateDisplayMetrics(renderWidth, renderHeight, newTargetWidth, newScrTargetWidth, newTargetHeight);
    };

    function updateDisplayMetrics(renderWidth, renderHeight, newTargetWidth, newScrTargetWidth, newTargetHeight) {
        updatePixelMetrics(renderWidth, renderHeight, newScrTargetWidth, newTargetHeight);

        if (targetWidth === newTargetWidth && scrTargetWidth === newScrTargetWidth && targetHeight === newTargetHeight) return;

        targetWidth = newTargetWidth;
        scrTargetWidth = newScrTargetWidth;
        targetHeight = newTargetHeight;

        updateCanvasContentSize();
        if (isFullscreen) requestReadjust(true);
        else updateScale();

        // console.error("Display Metrics TARGET:", targetWidth, targetHeight);
    }

    function updatePixelMetrics(renderWidth, renderHeight, scrTargetWidth, targetHeight) {
        // Pixel Metrics is inferred from render metrics

        var newPixelWidth = scrTargetWidth / renderWidth;
        var newPixelHeight = targetHeight / renderHeight;

        if (pixelWidth === newPixelWidth && pixelHeight === newPixelHeight) return;

        pixelWidth = newPixelWidth;
        pixelHeight = newPixelHeight;
        refreshPixelMetrics();
    }

    function auxUpdateDisplayMetrics(renderWidth, renderHeight, newTargetWidth, newScrTargetWidth, newTargetHeight) {
        if (auxTargetWidth === newTargetWidth && auxScrTargetWidth === newScrTargetWidth && auxTargetHeight === newTargetHeight) return;

        auxTargetWidth = newTargetWidth;
        auxScrTargetWidth = newScrTargetWidth;
        auxTargetHeight = newTargetHeight;

        if (!auxWindow) return false;       // auxWindow not ready

        auxUpdateCanvasContentSize();
        auxReadjustAll(true);

        // console.error("Display Metrics AUX TARGET:", auxTargetWidth, auxTargetHeight);
    }

    function displayScale (pAspectX, pScaleY) {
        aspectX = pAspectX;
        scaleY = pScaleY;
        updateScale();
        refreshPixelMetrics();
    }

    function auxDisplayScale (pAspectX, pScaleY, resizeWindow) {
        auxAspectX = pAspectX;
        auxScaleY = pScaleY;
        auxUpdateScale(resizeWindow);
    }

    function refreshPixelMetrics() {
        if (controllersHub) controllersHub.setScreenPixelScale(pixelWidth * scaleY * aspectX, pixelHeight * scaleY);
    }

    this.getMonitor = function() {
        return monitor;
    };

    this.showOSD = function(message, overlap, error) {
        if (osdTimeout) clearTimeout(osdTimeout);

        if (!message) return hideOSDs();

        var vOsd, vCanvas;
        if (isFocusOnAuxWindow()) { vOsd = auxOsd; vCanvas = auxCanvas; }
        else                      { vOsd = osd; vCanvas = canvasOuter; }

        if (overlap || !osdShowing) {
            vOsd.innerHTML = message;
            vOsd.style.color = error ? "rgb(255, 60, 40)" : "rgb(0, 255, 0)";
        }
        vOsd.style.transition = "none";
        vOsd.style.top = "12px";
        vOsd.style.opacity = 1;
        osdShowing = true;

        var availWidth = vCanvas.clientWidth - 30;      //  message width - borders
        var width = vOsd.clientWidth;
        var scale = width < availWidth ? 1 : availWidth / width;
        vOsd.style.transform = "scale(" + scale.toFixed(4) + ")";

        osdTimeout = setTimeout(hideOSDs, OSD_TIME);
    };

    function hideOSDs() {
        osd.style.transition = auxOsd.style.transition = "all 0.15s linear";
        osd.style.top = auxOsd.style.top = "-29px";
        osd.style.opacity = auxOsd.style.opacity =  0;
        osdShowing = false;
    }

    function displayDefaultScale() {
        if (WMSX.SCREEN_DEFAULT_SCALE > 0) return WMSX.SCREEN_DEFAULT_SCALE;

        var maxWidth = mainElement.parentElement.clientWidth;

        //console.error(">>> Parent width: " + maxWidth);

        return crtScanlines
            ? maxWidth >= 660 ? 1.0 : maxWidth >= 420 ? 0.75 : 0.5
            : maxWidth >= 660 ? 1.1 : maxWidth >= 540 ? 0.9 : maxWidth >= 420 ? 0.7 : maxWidth >= 320 ? 0.55 : 0.5;
    }

    this.setDebugMode = function(boo) {
        debugMode = !!boo;
        if (debugMode && videoOutputMode > 1 && videoOutputMode < 4) monitor.setOutputMode(Math.min(1, videoOutputMode), true);        // Return to Internal or External output mode. Superimposed and Mixed not supported in Debug
        canvasContext = null;
    };

    this.setDefaults = function() {
        crtPhosphorSetDefault();
        crtScanlinesSetDefault();
        crtFilterSetDefault();
        aspectAndScaleSetDefault();
    };

    function aspectAndScaleSetDefault() {
        if (isFocusOnAuxWindow()) return auxAspectAndScaleSetDefault();

        aspectX = WMSX.SCREEN_DEFAULT_ASPECT;
        scaleY = displayDefaultScale();
        scaleYBeforeUserFullscreen = 0;
        requestReadjust(true);
    }

    function auxAspectAndScaleSetDefault () {
        auxAspectX = WMSX.SCREEN_DEFAULT_ASPECT;
        auxScaleY = displayDefaultScale();
        auxReadjustAll(true);
    }

    this.crtFilterToggle = function(dec) {
        var newLevel;
        if (dec) { newLevel = crtFilter - 1; if (newLevel < -2) newLevel = 3; }
        else     { newLevel = crtFilter + 1; if (newLevel > 3) newLevel = -2; }

        setCRTFilter(newLevel);
        var levelDesc = crtFilterEffective === null ? "browser default" : crtFilterEffective < 1 ? "OFF" : "level " + crtFilterEffective;
        this.showOSD("CRT Filter: " + (crtFilter === -1 ? "AUTO (" + levelDesc + ")" : levelDesc), true);

        // Persist
        if (WMSX.userPreferences.current.crtFilter !== crtFilter) {
            WMSX.userPreferences.current.crtFilter = crtFilter;
            WMSX.userPreferences.setDirty();
            WMSX.userPreferences.save();
        }
    };

    function crtFilterSetDefault() {
        var user = WMSX.userPreferences.current.crtFilter;
        setCRTFilter(WMSX.SCREEN_FILTER_MODE !== -3 ? WMSX.SCREEN_FILTER_MODE : user !== null && user > -3 ? user : -1);
    }

    this.crtScanlinesToggle = function(dec) {
        var newLevel;
        if (dec) { newLevel = crtScanlines - 1; if (newLevel < 0) newLevel = 10; }
        else     { newLevel = crtScanlines + 1; if (newLevel > 10) newLevel = 0; }

        // Set scale to the nearest lower sweet spot
        if (!crtScanlines && newLevel) {
            var spots = [ 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5 ];
            var i = 0; while (i < spots.length - 1 && scaleY >= spots[i]) ++i;
            displayScale(aspectX, spots[i - 1]);
            if (auxWindow) {
                i = 0; while (i < spots.length - 1 && auxScaleY >= spots[i]) ++i;
                auxDisplayScale(auxAspectX, spots[i - 1], !auxIsMaxed());
            }
        }

        setCRTScanlines(newLevel);
        this.showOSD("CRT Scanlines: " + (crtScanlines === 0 ? "OFF" : "" + (crtScanlines * 10) + "%"), true);

        // Persist
        if (WMSX.userPreferences.current.crtScanlines !== crtScanlines) {
            WMSX.userPreferences.current.crtScanlines = crtScanlines;
            WMSX.userPreferences.setDirty();
            WMSX.userPreferences.save();
        }
    };

    function crtScanlinesSetDefault() {
        var user = WMSX.userPreferences.current.crtScanlines;
        setCRTScanlines(WMSX.SCREEN_CRT_SCANLINES !== -1 ? Math.max(0, Math.min(10, WMSX.SCREEN_CRT_SCANLINES)) : user !== null && user > -1 ? user : 0);
    }

    this.crtPhosphorToggle = function(dec) {
        var newMode;
        if (dec) { newMode = crtPhosphor - 1; if (newMode < -1) newMode = 1; }
        else     { newMode = crtPhosphor + 1; if (newMode > 1) newMode = -1; }

        setCRTPhosphor(newMode);
        var effectDesc = crtPhosphorEffective === 1 ? "ON" : "OFF";
        this.showOSD("CRT Phosphor: " + (crtPhosphor === -1 ? "AUTO (" + effectDesc + ")" : effectDesc), true);
    };

    function crtPhosphorSetDefault() {
        setCRTPhosphor(WMSX.SCREEN_CRT_PHOSPHOR);
    }

    this.getControlReport = function(control) {
        switch (control) {
            case wmsx.PeripheralControls.SCREEN_CRT_FILTER:
                return { label: crtFilter === -2 ? "Browser" : crtFilter === -1 ? "Auto" : crtFilter === 0 ? "OFF" : "Level " + crtFilter, active: crtFilter >= 0 };
            case wmsx.PeripheralControls.SCREEN_CRT_SCANLINES:
                return { label: crtScanlines === 0 ? "OFF" : "" + (crtScanlines * 10) + "%", active: crtScanlines > 0 };
        }
        return { label: "Unknown", active: false };
    };

    this.fullscreenToggle = function(windowed) {                 // Only and Always user initiated
        if (FULLSCREEN_MODE === -2) return;

        if (isFocusOnAuxWindow()) return auxDisplayToggleFullscreen();

        // Save scale before Fullscreen
        if (!isFullscreen && !isMobileDevice) scaleYBeforeUserFullscreen = scaleY;

        // If we think we are in FullScreen but FullScreenAPI supported and not active, enter full screen by API regardless of previous state
        // Sometimes mobile browsers can exit full screen API without firing the notification event
        //if (!windowed && isFullscreen && fullscreenAPIEnterMethod && !isFullScreenByAPI()) {
        //    enterFullScreenByAPI();
        //    return;
        //}

        // If not, toggle complete full screen state
        this.setFullscreen(!isFullscreen, windowed);
    };

    this.setFullscreen = function(mode, windowed) {
        if (mode) {
            if (!windowed && fullscreenAPIEnterMethod) enterFullScreenByAPI();
            else setFullscreenState(true);
        } else {
            if (isFullScreenByAPI()) exitFullScreenByAPI();
            else setFullscreenState(false);
        }

        //if (fullscreenAPIEnterMethod) {
        //    if (mode) enterFullScreenByAPI();
        //    else exitFullScreenByAPI();
        //} else
        //    setFullscreenState(mode)
    };

    function auxDisplayToggleFullscreen() {
        if (!auxIsFullScreenByAPI()) auxEnterFullScreenByAPI();
        else auxExitFullScreenByAPI();
    }

    this.displayAspectDecrease = function() {
        if (isFocusOnAuxWindow()) {
            auxDisplayScale(normalizeAspectX(auxAspectX - ASPECT_STEP), auxScaleY, !auxIsMaxed());
            this.showOSD("Display Aspect: " + auxAspectX.toFixed(2) + "x", true);
        } else {
            displayScale(normalizeAspectX(aspectX - ASPECT_STEP), scaleY);
            this.showOSD("Display Aspect: " + aspectX.toFixed(2) + "x", true);
        }
    };

    this.displayAspectIncrease = function() {
        if (isFocusOnAuxWindow()) {
            auxDisplayScale(normalizeAspectX(auxAspectX + ASPECT_STEP), auxScaleY, !auxIsMaxed());
            this.showOSD("Display Aspect: " + auxAspectX.toFixed(2) + "x", true);
        } else {
            displayScale(normalizeAspectX(aspectX + ASPECT_STEP), scaleY);
            this.showOSD("Display Aspect: " + aspectX.toFixed(2) + "x", true);
        }
    };

    this.displayScaleDecrease = function() {
        if (isFocusOnAuxWindow()) {
            auxDisplayScale(auxAspectX, normalizeScaleY(auxScaleY - SCALE_STEP), !auxIsMaxed());
            this.showOSD("Display Size: " + auxScaleY.toFixed(2) + "x", true);
        } else {
            displayScale(aspectX, normalizeScaleY(scaleY - SCALE_STEP));
            this.showOSD("Display Size: " + scaleY.toFixed(2) + "x", true);
        }
    };

    this.displayScaleIncrease = function() {
        if (isFocusOnAuxWindow()) {
            auxDisplayScale(auxAspectX, normalizeScaleY(auxScaleY + SCALE_STEP), !auxIsMaxed());
            this.showOSD("Display Size: " + auxScaleY.toFixed(2) + "x", true);
        } else {
            displayScale(aspectX, normalizeScaleY(scaleY + SCALE_STEP));
            this.showOSD("Display Size: " + scaleY.toFixed(2) + "x", true);
        }
    };

    function normalizeAspectX(aspectX) {
        var ret = aspectX < 0.5 ? 0.5 : aspectX > 2.5 ? 2.5 : aspectX;
        return Math.round(ret / ASPECT_STEP) * ASPECT_STEP;
    }

    function normalizeScaleY(scaleY) {
        var ret = scaleY < 0.5 ? 0.5 : scaleY;
        return Math.round(ret / SCALE_STEP) * SCALE_STEP;
    }

    this.focus = function() {
        canvas.focus();
    };

    this.machinePowerAndUserPauseStateUpdate = function(power, paused) {
        powerButton.style.backgroundPosition = "" + powerButton.wmsxBX + "px " + (powerButton.wmsxBY + barButtonBackYOffset * (power ? 1 : 0)) + "px";
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

        if (stack.length > 1) {
            var diskNum = diskDrive.getCurrentDiskNum(drive) + 1;
            button.wmsxMenu.wmsxTitle = diskDrive.getDriveName(drive) + "&nbsp;&nbsp;(" + diskNum + "/" + stack.length + ")";
        } else {
            button.wmsxMenu.wmsxTitle = diskDrive.getDriveName(drive);
        }
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
        diskHButton.classList.toggle("wmsx-hd-first", !!hdFirst);
        diskHButton.wmsxDropTarget.classList.toggle("wmsx-hd-first", !!hdFirst);
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
        if (quickOtionsDialog) quickOtionsDialog.machineTypeStateUpdate();
        kanaLed.textContent =  machineTypeSocket.getCodeLedLabel();
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

    this.touchControlsActiveUpdate = function(active, dirBig, mirror) {
        if (touchControlsActive === active && touchControlsDirBig === dirBig && touchControlsMirror === mirror) return;
        touchControlsActive = active;
        touchControlsDirBig = dirBig;
        touchControlsMirror = mirror;
        if (isFullscreen) {
            if (touchControlsActive) controllersHub.setupTouchControlsIfNeeded(fsElementCenter);
            requestReadjust(true);
        }
    };

    this.roomNetPlayStatusChangeUpdate = function(oldMode) {
        if (!netPlayDialog || !netPlayDialog.isVisible()) closeAllOverlays();
        if (netPlayDialog) netPlayDialog.roomNetPlayStatusChangeUpdate(oldMode);
        netplayButton.classList.toggle("wmsx-hidden", room.netPlayMode < 1);
    };

    this.quickOptionsControlsStateUpdate = function () {
        if (quickOtionsDialog) quickOtionsDialog.quickOptionsControlsStateUpdate();
    };

    this.machineTurboModesStateUpdate = function() {
        if (quickOtionsDialog) quickOtionsDialog.machineTurboModesStateUpdate();
        var multi = machine.cpu.getZ80ClockMulti();
        turboButton.classList.toggle("wmsx-hidden", multi === 1);
        if (multi !== 1) turboButton.textContent = "" + multi + "x";
    };

    this.speakerUnlockStateUpdate = function(state) {
        unmuteMessage.classList.toggle("wmsx-show", !state);

        if (!state) {
            var availWidth = canvasOuter.clientWidth - 30;      //  message width - borders
            var width = unmuteMessage.clientWidth;
            var scale = width < availWidth ? 1 : availWidth / width;
            unmuteMessage.style.transform = "translate(-50%, 0) scale(" + scale.toFixed(4) + ")";
        }
    };

    this.configurationStateUpdate = function() {
        closeAllOverlays();
        if (machineSelectDialog) machineSelectDialog.configurationStateUpdate();
        defineSettingsMenuExtensions();
    };

    this.ledsStateUpdate = function(ledsState, ledsInfo) {
        ledsStatePending = ledsState;
        ledsInfoPending = ledsInfo;
        if (!signalIsOn) updateLeds();
    };

    this.videoOutputModeUpdate = function(mode, effectiveMode, autoInternal, autoModeDesc, extDesc, dualPri) {
        videoOutputButton.classList.toggle("wmsx-hidden", !extDesc);
        videoOutputButton.style.backgroundPosition = "" + videoOutputButton.wmsxBX + "px " + (videoOutputButton.wmsxBY + barButtonBackYOffset * Math.min(effectiveMode, 4)) + "px";
        var menu = videoOutputButton.wmsxMenu;
        for (var i = 0; i <= 4; ++i)
            menu[i].checkedOp = mode === (i - 1) ? 1 : 0;
        menu[0].label = autoModeDesc;
        menu[2].label = extDesc;
        menu[6].checkedOp = mode >= 4 ? mode - 3 : 0;
        menu[6].disabled = !this.isDualScreenAllowed();
        menu[8].disabled = autoInternal && mode === -1;

        if (videoOutputMode !== effectiveMode) {
            videoOutputMode = effectiveMode;
            canvasContext = null; auxCanvasContext = null;
        }

        if (videoOutputMode >= 4) {
            setupAndShowAuxWindow();
            auxWindowUpdateTitle();
        } else
            closeAuxWindow();

        if (barMenuActive === menu) refreshBarMenu(menu);
    };

    this.setLoading = function(state) {
        isLoading = state;
        updateLoading();
        if (!state) {
            wmsx.Configurator.addConfigurationStateListener(this);
            machine.getMachineControlsSocket().addPowerAndUserPauseStateListener(this);
            machineTypeSocket.addMachineTypeStateListener(this);
            extensionsSocket.addExtensionsAndCartridgesStateListener(this);
            machine.getDiskDriveSocket().setInterfacesChangeListener(this);
            machine.getCartridgeSocket().setCartridgesModifiedStateListener(this);
            machine.getLedsSocket().setLedsStateListener(this);
        }
    };

    function requestReadjust(now, keepFocus) {
        if (now)
            readjustAll(true, keepFocus);
        else {
            readjustRequestTime = wmsx.Util.performanceNow();
            if (!readjustInterval) readjustInterval = setInterval(readjustAll, 50);
        }
    }

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
        requestReadjust(true);
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
        else requestReadjust();

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

    function auxEnterFullScreenByAPI() {
        if (fullscreenAPIEnterMethod) try {
            fullscreenAPIEnterMethod.call(auxFsElementCenter);      // resize event will trigger
        } catch (e) {
            /* give up */
        }
    }

    function auxExitFullScreenByAPI() {
        if (fullScreenAPIExitMethod) try {
            fullScreenAPIExitMethod.call(auxWindow.document);      // resize event will trigger
        } catch (e) {
            /* give up */
        }
    }

    function auxIsFullScreenByAPI() {
        return !!auxWindow.document[fullScreenAPIQueryProp];
    }

    function auxIsMaxed() {
        return auxIsFullScreenByAPI() || (auxWindow.outerWidth >= auxWindow.screen.availWidth && auxWindow.outerHeight >= auxWindow.screen.availHeight)
    }

    function updateScale() {
        var width = Math.round(scrTargetWidth * scaleY * aspectX);
        var height = Math.round(targetHeight * scaleY);
        canvas.style.width = "" + width + "px";
        canvas.style.height = "" + height + "px";
        updateBarWidth(width);
        if (!signalIsOn) updateLogoScale();
        if (settingsDialog && settingsDialog.isVisible()) settingsDialog.position();
    }

    function auxUpdateScale(changeWindow) {
        var newWidth = Math.round(auxScrTargetWidth * auxScaleY * auxAspectX);
        var newHeight = Math.ceil(auxTargetHeight * auxScaleY);
        auxCanvas.style.width = "" + newWidth + "px";
        auxCanvas.style.height = "" + newHeight + "px";

        if (changeWindow) {
            auxWindow.resizeTo(newWidth + auxWindowAddWidth, newHeight + auxWindowAddHeight);
            // console.error("AuxWindow scale:", auxScaleY, newWidth, newHeight, newWidth + auxWindowAddWidth, newHeight + auxWindowAddHeight);
        } else {
            // console.error("AuxCanvas scale:", auxScaleY, newWidth, newHeight);
        }
    }

    function updateBarWidth(canvasWidth) {
        var fixedWidth = buttonsBarDesiredWidth > 0 ? buttonsBarDesiredWidth : canvasWidth;
        buttonsBar.style.width = buttonsBarDesiredWidth === -1 ? "100%" : "" + fixedWidth + "px";

        var clientWidth = buttonsBar.clientWidth;
        buttonsBar.classList.toggle("wmsx-narrow", clientWidth < NARROW_WIDTH);
        buttonsBar.classList.toggle("wmsx-semi-narrow", clientWidth < SEMI_NARROW_WIDTH);
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

    function auxUpdateCanvasContentSize() {
        auxCanvas.width = auxTargetWidth;
        auxCanvas.height = auxTargetHeight;
        auxCanvasContext = null;
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
        return isMobileDevice && isAndroidDevice && browserName === "FIREFOX" ? 2 : 1;
    }

    function setCRTScanlines(level) {
        crtScanlines = level;
        if (crtScanlines) setupScanlines();
        canvasContext = null;
    }

    function setCRTPhosphor(mode) {
        crtPhosphor = mode;
        crtPhosphorEffective = crtPhosphor === -1 ? 0 : crtPhosphor;
        canvasContext = null;
    }

    function updateLogo() {
        if (!signalIsOn) {
            updateLogoScale();
            closePowerOnModals();
            showCursorAndBar(true);
            if (canvasContext) canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        }
        logo.classList.toggle("wmsx-show", !signalIsOn);
        if (auxWindow) auxLogo.classList.toggle("wmsx-show", !signalIsOn);
    }

    function updateLoading() {
        var disp = isLoading ? "block" : "none";
        logoLoadingIcon.style.display = disp;
        canvasLoadingIcon.style.display = disp;
    }

    function createCanvasContext() {
        // Prepare Context used to draw frame
        canvasContext = canvas.getContext("2d", { alpha: false, antialias: false });
        updateImageComposition(canvasContext);
        updateImageSmoothing(canvasContext);
        return canvasContext;
    }

    function auxCreateCanvasContext() {
        // Prepare Context used to draw frame
        if (!auxWindow) return;

        auxCanvasContext = auxCanvas.getContext("2d", { alpha: false, antialias: false });
        updateImageComposition(auxCanvasContext);
        updateImageSmoothing(auxCanvasContext);
        return auxCanvasContext;
    }

    function updateImageComposition(context) {
        context.globalCompositeOperation = debugMode
            ? "copy"
            : videoOutputMode <= 1 || videoOutputMode >= 4                  // Internal, External, Dual
                ? crtPhosphorEffective
                    ? "source-over"
                    : "copy"
                : videoOutputMode === 3
                    ? "lighten"                                             // Mixed
                    : "source-over";                                        // Superimposed

        context.globalAlpha = debugMode
            ? 1
            : videoOutputMode <= 1 || videoOutputMode >= 4                  // Internal, External, Dual
                ? crtPhosphorEffective
                    ? 0.8
                    : 1
                : videoOutputMode === 3
                    ? 0.66                                                  // Mixed
                    : 1;                                                    // Superimposed

        // console.log("Image Composition: ", canvasContext.globalCompositeOperation, canvasContext.globalAlpha);
    }

    function updateImageSmoothing(context) {
        if (crtFilterEffective === null) return;    // let default values

        canvas.style.imageRendering = (crtFilterEffective === 1 || crtFilterEffective === 3) ? "initial" : canvasImageRenderingValue;

        var smoothing = crtFilterEffective >= 2;
        if (context.imageSmoothingEnabled !== undefined)
            context.imageSmoothingEnabled = smoothing;
        else {
            context.webkitImageSmoothingEnabled = smoothing;
            context.mozImageSmoothingEnabled = smoothing;
            context.msImageSmoothingEnabled = smoothing;
        }
    }

    function updateLeds() {
        if (!ledsStatePending) return;

        capsLed.classList.toggle("wmsx-hidden", !ledsStatePending[0]);
        kanaLed.classList.toggle("wmsx-hidden", !ledsStatePending[1]);
        pauseLed.classList.toggle("wmsx-hidden", !ledsStatePending[2]);

        turboButton.classList.toggle("wmsx-hidden", !ledsStatePending[3] && !ledsStatePending[4]);
        turboButton.textContent = ledsStatePending[4] > 1 ? ledsInfoPending[4] : ledsInfoPending[3];
        turboButton.style.backgroundPositionY = "" + (ledsStatePending[4] === 3 ? -91 : ledsStatePending[4] === 2 ? -116 : ledsStatePending[4] === 1 ? -141 : -166) + "px";

        if (quickOtionsDialog) quickOtionsDialog.machineTurboModesStateUpdate();

        ledsStatePending = undefined;

        // console.error("Display Update Leds");
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
        unmuteMessage = document.getElementById("wmsx-unmute-message");

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

    function setupAndShowAuxWindow() {
        if (auxWindow) return;

        var scale = displayDefaultScale();
        var width = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938 * auxAspectX * scale;       // 682
        var height = wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938 * scale;                  //  502;

        var newWindow = window.open("", "WebMSX: 2nd Video", "width=" + width + ",height=" + (height + 1)
            + ",scrollbars=no,status=no,location=no,toolbar=no,menubar=no");

        var document = newWindow.document;
        document.open("text/html", "replace").write(wmsx.ScreenGUI.auxHtml());
        document.close();
    }

    this.auxWindowFirstResize = function(newWindow) {
        if (auxWindow) return;

        // Get window chrome additional dimensions only once. Use some maximum values for safety
        auxWindowAddWidth = Math.min(16, newWindow.outerWidth - newWindow.innerWidth);
        auxWindowAddHeight = Math.min(100, newWindow.outerHeight - newWindow.innerHeight);
        // console.error("AuxWindow first resize:", newWindow.innerWidth, newWindow.innerHeight, auxWindowAddWidth, auxWindowAddHeight);

        auxWindow = newWindow;
        var document = auxWindow.document;

        auxFsElementCenter = document.getElementById("wmsx-screen-fs-center");
        auxCanvas = document.getElementById("wmsx-screen-canvas");
        auxLogo = document.getElementById("wmsx-logo");
        auxOsd = document.getElementById("wmsx-osd");

        auxWindowUpdateTitle();
        auxUpdateCanvasContentSize();
        auxAspectAndScaleSetDefault();

        suppressContextMenu(document.body);
        preventDrag(auxLogo);

        if (!signalIsOn) updateLogo();

        fileLoader.registerForDnDReject(auxFsElementCenter);
        controllersHub.addKeyInputElement(auxFsElementCenter);

        auxWindow.addEventListener("resize", auxWindowResized);
        auxWindow.addEventListener("beforeunload", auxWindowUnload);

        auxCanvas.focus();
    };

    function auxWindowResized() {
        auxReadjustAll(false, true);
    }

    function auxWindowUnload() {
        monitor.setOutputMode(-1);
        self.focus();
    }

    function closeAuxWindow() {
        if (!auxWindow) return;

        self.focus();
        auxWindow.removeEventListener("resize", auxWindowResized);
        auxWindow.removeEventListener("beforeunload", auxWindowUnload);
        auxWindow.close();
        auxWindow = auxFsElementCenter = auxLogo = auxCanvas = auxCanvasContext = undefined;
        auxOsd = { style: {} };         // Dummy for use when AuxWindow is not open
    }

    function auxWindowUpdateTitle() {
        if (auxWindow) auxWindow.document.title = "WebMSX: " + (videoOutputMode === 4 ? "V9990 Video" : "Internal Video" );
    }

    function isFocusOnAuxWindow() {
        return auxWindow && auxWindow.document.hasFocus();
    }

    function setupScanlines() {
        if (scanlinesImage) return;

        scanlinesImage = document.createElement('canvas');
        scanlinesImage.width = 1;
        scanlinesImage.height = wmsx.V9990.SIGNAL_MAX_HEIGHT;
        var ctx = scanlinesImage.getContext("2d", { alpha: true, antialias: false });
        ctx.clearRect(0, 0, 1, scanlinesImage.height);
        ctx.fillStyle = 'black';
        for (var y = 1, h = scanlinesImage.height; y < h; y += 2) ctx.fillRect(0, y, 1, 1);
    }

    function setupMainEvents() {
        (isMobileDevice ? canvasOuter : fsElement).addEventListener("mousemove", function showCursorOnMouseMove() {
            showCursorAndBar();
        });

        if ("onblur" in document) fsElement.addEventListener("blur", releaseControllersOnLostFocus, true);
        else fsElement.addEventListener("focusout", releaseControllersOnLostFocus, true);

        window.addEventListener("orientationchange", function windowOrientChanged() {
            closeAllOverlays();
            if (signalIsOn) hideCursorAndBar();
            else showCursorAndBar();
            requestReadjust();
        });

        window.addEventListener("resize", function windowResized() {
            if (isFullscreen) {
                closeAllOverlays(true);
                if (signalIsOn) hideCursorAndBar();
                else showCursorAndBar();
                requestReadjust(true, true);
            }
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

        window.addEventListener("beforeunload", closeAuxWindow);
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

        if (isMobileDevice) document.documentElement.classList.add("wmsx-bar-mobile");

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

        netplayButton  = addPeripheralControlButton("wmsx-bar-netplay", -91, -76, false, "NetPlay!", wmsx.PeripheralControls.SCREEN_OPEN_NETPLAY);
        netplayButton.classList.add("wmsx-hidden");

        mediaIconsContainer = document.createElement("div");
        mediaIconsContainer.id = "wmsx-bar-media-icons";
        mediaIconsContainer.style.display = "inline-block";
        buttonsBarInner.appendChild(mediaIconsContainer);

        // Create a gap in menus. HardDisk menu may be in positions 1 or 4 depending on Disk Interfaces order
        barMenus.push(null);

        menu = [
            { label: "Load Disk Images",   clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES, secSlot: false, needsUIG: true },
            { label: "Add Disk Images",                control: wmsx.PeripheralControls.DISK_ADD_FILES, secSlot: false, needsUIG: true },
            { label: "Add Blank Disk",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY, secSlot: false },
            { label: "Add Boot Disk",      clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_BOOT, secSlot: false },
            { label: "Import Files to Disk",           control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK, secSlot: false, needsUIG: true },
            { label: "Expand ZIP to Disk",             control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK, secSlot: false, needsUIG: true },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, secSlot: false, disabled: true },
            { label: "Save Disk Image",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, secSlot: false, disabled: true, needsUIG: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, secSlot: false, disabled: true }
        ];
        diskAButton = addPeripheralControlButton("wmsx-bar-diska", -165, -72, true, "Drive A", null, menu, "Drive A", mediaIconsContainer);
        if (!WMSX.EXTENSIONS.DISK) diskAButton.classList.add("wmsx-hidden");    // starting visibility

        menu = [
            { label: "Load Disk Images",   clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES, secSlot: true, needsUIG: true },
            { label: "Add Disk Images",                control: wmsx.PeripheralControls.DISK_ADD_FILES, secSlot: true, needsUIG: true },
            { label: "Add Blank Disk",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY, secSlot: true },
            { label: "Add Boot Disk",      clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_BOOT, secSlot: true },
            { label: "Import Files to Disk",           control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK, secSlot: true, needsUIG: true },
            { label: "Expand ZIP to Disk",             control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK, secSlot: true, needsUIG: true },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, secSlot: true, disabled: true },
            { label: "Save Disk Image",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, secSlot: true, disabled: true, needsUIG: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, secSlot: true, disabled: true }
        ];
        diskBButton = addPeripheralControlButton("wmsx-bar-diskb", -194, -72, true, "Drive B", null, menu, "Drive B", mediaIconsContainer);
        if (!WMSX.EXTENSIONS.DISK) diskBButton.classList.add("wmsx-hidden");    // starting visibility

        menu = [
            { label: "Load Disk Image",    clickModif: 0, control: wmsx.PeripheralControls.HARDDISK_LOAD_FILE, needsUIG: true },
            { label: "New Blank Disk",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.HARDDISK_CHOOSE_EMPTY },
            { label: "New Boot Disk",      clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.HARDDISK_CHOOSE_BOOT },
            { label: "Import Files to Disk",           control: wmsx.PeripheralControls.HARDDISK_LOAD_FILES_AS_DISK, needsUIG: true },
            { label: "Expand ZIP to Disk",             control: wmsx.PeripheralControls.HARDDISK_LOAD_ZIP_AS_DISK, needsUIG: true },
            { label: "Save Disk Image",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.HARDDISK_SAVE_FILE, disabled: true, needsUIG: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.HARDDISK_REMOVE, disabled: true }
        ];                                                      /* -223 -252*/
        diskHButton = addPeripheralControlButton("wmsx-bar-diskh", -252, -72, true, "Hard Drive", null, menu, "Hard Drive", mediaIconsContainer);
        if (!WMSX.EXTENSIONS.HARDDISK) diskHButton.classList.add("wmsx-hidden");    // starting visibility
        if (WMSX.EXTENSIONS.HARDDISK !== 2) diskHButton.classList.add("wmsx-hd-first");

        menu = [
            { label: "Load ROM Image",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, secSlot: false, needsUIG: true },
            { label: "Set ROM Format",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_CHOOSE_FORMAT, secSlot: false },
            { label: "Load Data File",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, secSlot: false, disabled: true, needsUIG: true },
            { label: "Save Data File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, secSlot: false, disabled: true, needsUIG: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, secSlot: false, disabled: true }
        ];
        cartridge1Button = addPeripheralControlButton("wmsx-bar-cart1", -78, -72, true, "Cartridge 1", null, menu, "Cartridge 1", mediaIconsContainer);

        menu = [
            { label: "Load ROM Image",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, secSlot: true, needsUIG: true },
            { label: "Set ROM Format",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_CHOOSE_FORMAT, secSlot: true },
            { label: "Load Data File",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, secSlot: true, disabled: true, needsUIG: true },
            { label: "Save Data File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, secSlot: true, disabled: true, needsUIG: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, secSlot: true, disabled: true }
        ];
        cartridge2Button = addPeripheralControlButton("wmsx-bar-cart2", -107, -72, true, "Cartridge 2", null, menu, "Cartridge 2", mediaIconsContainer);

        menu = [
            { label: "Load Tape Image",    clickModif: 0, control: wmsx.PeripheralControls.TAPE_LOAD_FILE, secSlot: true, needsUIG: true },
            { label: "New Blank Tape",     clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_EMPTY, secSlot: true },
            { label: "Rewind Tape",                    control: wmsx.PeripheralControls.TAPE_REWIND, disabled: true, secSlot: true },
            { label: "Run Program",        clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_AUTO_RUN, secSlot: true, disabled: true },
            { label: "Save Tape Image",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_SAVE_FILE, disabled: true, secSlot: true, needsUIG: true },
            { label: "Remove Tape",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE, disabled: true, secSlot: true }
        ];
        tapeButton = addPeripheralControlButton("wmsx-bar-tape", -136, -72, true, "Cassette", null, menu, "Cassette", mediaIconsContainer);

        var settingsIconsContainer = document.createElement("div");
        settingsIconsContainer.id = "wmsx-bar-settings-icons";
        settingsIconsContainer.style.display = "inline-block";
        buttonsBarInner.appendChild(settingsIconsContainer);

        if (!WMSX.SCREEN_RESIZE_DISABLED && !isMobileDevice) {
            scaleDownButton = addPeripheralControlButton("wmsx-bar-scale-minus", -26, -3, false, "Decrease Screen", wmsx.PeripheralControls.SCREEN_SCALE_MINUS, null, "", settingsIconsContainer);
            scaleDownButton.classList.add("wmsx-full-screen-hidden");
            scaleUpButton = addPeripheralControlButton("wmsx-bar-scale-plus", -48, -2, false, "Increase Screen", wmsx.PeripheralControls.SCREEN_SCALE_PLUS, null, "", settingsIconsContainer);
            scaleUpButton.classList.add("wmsx-full-screen-hidden");
        }

        if (FULLSCREEN_MODE !== -2) {
            fullscreenButton = addPeripheralControlButton("wmsx-bar-full-screen", -71, -1, false, "Full Screen", wmsx.PeripheralControls.SCREEN_FULLSCREEN, null, "", settingsIconsContainer);
            fullscreenButton.wmsxNeedsUIG = true;
        }

        menu = [
            { label: "Auto",               clickModif: 0, control: wmsx.PeripheralControls.SCREEN_OUTPUT_AUTO, toggle: true, radio: true },
            { label: "Internal",           clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.SCREEN_OUTPUT_INTERNAL, toggle: true, radio: true },
            { label: "External",           clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.SCREEN_OUTPUT_EXTERNAL, toggle: true, radio: true },
            { label: "Superimposed",       clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.SCREEN_OUTPUT_SUPERIMPOSED, toggle: true, radio: true },
            { label: "Mixed",              clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.SCREEN_OUTPUT_MIXED, toggle: true, radio: true },
            { label: "",                   divider: true },
            { label: "Dual Screen",        clickModif: KEY_ALT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.SCREEN_OUTPUT_DUAL, toggle: true },
            { label: "",                   divider: true },
            { label: "Reset Auto Internal",            control: wmsx.PeripheralControls.SCREEN_OUTPUT_RESET_AUTO }
        ];
        videoOutputButton  = addPeripheralControlButton("wmsx-bar-video", -120, -176, false, "Video Output", null, menu, "Video Output", settingsIconsContainer);
        videoOutputButton.classList.add("wmsx-hidden");

        menu = createSettingsMenuOptions();
        settingsButton = addPeripheralControlButton("wmsx-bar-settings", -96, -1, false, "Settings", null, menu, "Settings", settingsIconsContainer);
        defineSettingsMenuExtensions();

        if (isMobileDevice)
            var textButton = addPeripheralControlButton("wmsx-bar-text", -53, -51, false, "Toggle Text Input", wmsx.PeripheralControls.OPEN_ENTER_STRING);

        if (isTouchDevice) {
            var keyboardButton = addPeripheralControlButton("wmsx-bar-keyboard", -83, -25, false, "Toggle Virtual Keyboard", wmsx.PeripheralControls.SCREEN_TOGGLE_VIRTUAL_KEYBOARD);
            keyboardButton.classList.add("wmsx-full-screen-only");
        }

        var logoButton = addPeripheralControlButton("wmsx-bar-logo", -8, -25, false, "About WebMSX", wmsx.PeripheralControls.SCREEN_OPEN_ABOUT);
        if (isTouchDevice) logoButton.classList.add("wmsx-full-screen-hidden");
        logoButton.classList.add("wmsx-narrow-hidden");

        pauseLed  = addPeripheralControlButton("wmsx-bar-pause", -94, -101);
        pauseLed.classList.add("wmsx-semi-narrow-hidden");
        pauseLed.classList.add("wmsx-hidden");

        turboButton  = addPeripheralControlButton("wmsx-bar-turbo", -2, -91, false, "CPU Turbo", wmsx.PeripheralControls.SCREEN_OPEN_QUICK_OPTIONS);
        turboButton.classList.add("wmsx-hidden");

        kanaLed  = addPeripheralControlButton("wmsx-bar-kana", 0, 0);
        kanaLed.classList.add("wmsx-semi-narrow-hidden");
        kanaLed.classList.add("wmsx-hidden");

        capsLed  = addPeripheralControlButton("wmsx-bar-caps", 0, 0);
        capsLed.textContent =  "CAPS";
        capsLed.classList.add("wmsx-narrow-hidden");
        capsLed.classList.add("wmsx-hidden");

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
        but.wmsxBY = by;
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

        var modifs = 0 | (e.altKey && KEY_ALT_MASK) | (e.ctrlKey && KEY_CTRL_MASK) | (e.shiftKey && KEY_SHIFT_MASK);

        // Single option. Only leftClick and middleClick
        if (elem.wmsxControl) {
            if (!e.button || e.button === 2)
                peripheralControls.processControlActivated(elem.wmsxControl, false, e.button === 2 || modifs === KEY_SHIFT_MASK);    // secPort for rightClick or SHIFT
            return;
        }

        var menu = elem.wmsxMenu;
        if (!menu) return;

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

    function barMenuItemTapOrMouseDown(elem, e, uigEnd) {
        if (uigEnd) return;
        barMenuItemSetActive(elem, e.type === "touchstart");
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
        if (barMenuItemTouchActivation && (wmsx.Util.performanceNow() - barMenuItemTouchActivation) > TOUCH_EXT_SLOT2_TIME) secSlot |= true;
        if (barMenuItemActive) barMenuItemFireActive(secSlot, e.ctrlKey);
    }

    function barMenuItemFireActive(secSlot, altPower) {
        var option = barMenuItemActive.wmsxMenuOption;
        barMenuItemSetActive(null);
        if (option && !option.disabled) {
            if (option.extension) {
                if (!extensionChangeDisabledWarning()) peripheralControls.processControlActivated(wmsx.PeripheralControls.EXTENSION_TOGGLE, altPower, secSlot, option.extension);
            } else if (option.control) {
                secSlot = option.secSlot !== undefined ? option.secSlot : secSlot;
                closeAllOverlays();
                peripheralControls.processControlActivated(option.control, altPower, secSlot);
            }
        }
    }

    function barMenuItemSetActive(element, touch) {
        if (element === barMenuItemActive) return;
        if (barMenuItemActive) barMenuItemActive.classList.remove("wmsx-hover");
        if (element && element.wmsxMenuOption) {
            barMenuItemActive = element;
            if (touch) controllersHub.hapticFeedback();
            barMenuItemActive.classList.add("wmsx-hover");
        } else
            barMenuItemActive = null;
        // Init time counting for long-press Extensions activation on Op2
        barMenuItemTouchActivation = touch && barMenuItemActive ? wmsx.Util.performanceNow() : undefined;
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

    function defineSettingsMenuExtensions() {
        var menu = settingsButton.wmsxMenu;
        while (menu[0].extension) menu.shift();
        if (!menu[0].divider) menu.unshift({ label: "", divider: true });

        var extConfig = WMSX.EXTENSIONS_CONFIG;
        var extNames = Object.keys(extConfig).reverse();
        for (var i = 0; i < extNames.length; ++i) {
            var ext = extNames[i];
            var conf = extConfig[ext];
            if (conf.DESC) {            // Only show extensions with descriptions
                var opt = {label: conf.DESC, extension: ext, toggle: true, checkedOp: 0};
                menu.unshift(opt);
            }
        }
        if (menu[0].divider) menu.shift();
    }

    function refreshSettingsMenuForExtensions() {
        var menu = settingsButton.wmsxMenu;
        for (var i = 0; i < menu.length; ++i) {
            var opt = menu[i];
            if (opt.extension) {
                opt.checkedOp = WMSX.EXTENSIONS[opt.extension];
                opt.noOp2 = !WMSX.EXTENSIONS_CONFIG[opt.extension].SLOT2;
            }
        }
        if (barMenuActive === menu) refreshBarMenu(menu);
    }

    function refreshSettingsMenuForMachineType() {
        var menu = settingsButton.wmsxMenu;
        var conf = WMSX.MACHINES_CONFIG[machineTypeSocket.getMachine()];
        menu.wmsxTitle = ((conf.DESC || conf.DESCX).split("(")[0] || "Settings").trim();
        settingsButton.wmsxMenu[settingsButton.wmsxMenu.length - 5].disabled = room.netPlayMode === 2;

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

        closeAllOverlays();
        requestReadjust();
        controllersHub.screenFullscreenStateUpdate(isFullscreen);
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
                        item.classList.toggle("wmsx-bar-menu-item-toggle-radio", !!option.radio);
                        item.classList.toggle("wmsx-no-op2", option.noOp2 || !!option.radio);

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

        var height = fsElementCenter.clientHeight - wmsx.ScreenGUI.BAR_HEIGHT - 12;      // bar + borders + tolerance
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

    function closeAllOverlays(keepTextEntry) {
        hideBarMenu();
        if (pasteDialog) pasteDialog.hide();
        if (machineSelectDialog) machineSelectDialog.hide();
        if (diskSelectDialog) diskSelectDialog.hide();
        if (newHardDiskDialog) newHardDiskDialog.hide();
        if (saveStateDialog) saveStateDialog.hide();
        if (touchConfigDialog) touchConfigDialog.hide();
        if (quickOtionsDialog) quickOtionsDialog.hide();
        if (cartFormatDialog) cartFormatDialog.hide();
        if (settingsDialog) settingsDialog.hide();
        if (netPlayDialog && !keepTextEntry) netPlayDialog.hide();
        if (textEntryDialog && !keepTextEntry) textEntryDialog.hide();
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

    function readjustAll(force, keepFocus) {
        if (readjustScreeSizeChanged(force)) {
            if (isFullscreen) {
                var isLandscape = readjustScreenSize.w > readjustScreenSize.h;
                var keyboardRect = virtualKeyboardMode && updateKeyboardWidth(readjustScreenSize.w);
                buttonsBarDesiredWidth = isLandscape ? virtualKeyboardMode ? keyboardRect.w : 0 : -1;
                var winH = readjustScreenSize.h;
                if (!isLandscape || virtualKeyboardMode) winH -= wmsx.ScreenGUI.BAR_HEIGHT + 2;
                if (virtualKeyboardMode) winH -= keyboardRect.h + 2;
                displayScale(aspectX, displayOptimalScaleY(readjustScreenSize.w, winH));
            } else {
                buttonsBarDesiredWidth = -1;
                displayScale(aspectX, scaleYBeforeUserFullscreen || displayDefaultScale());
            }

            if (!keepFocus) self.focus();
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

    function auxReadjustAll(force, byWindow) {
        if (auxReadjustScreeSizeChanged(force || byWindow)) {
            if (auxIsMaxed() || byWindow) {
                auxDisplayScale(auxAspectX, auxDisplayOptimalScaleY(auxReadjustScreenSize.w, auxReadjustScreenSize.h));
            } else {
                auxDisplayScale(auxAspectX, auxScaleY, true);   // resize AuxWindow
            }
        }
    }

    function auxReadjustScreeSizeChanged(force) {
        var parW = auxWindow.document.body.clientWidth;
        var winW = auxFsElementCenter.clientWidth;
        var winH = auxFsElementCenter.clientHeight;

       if (!force && auxReadjustScreenSize.pw === parW && auxReadjustScreenSize.w === winW && auxReadjustScreenSize.h === winH) return false;

        auxReadjustScreenSize.pw = parW;
        auxReadjustScreenSize.w = winW;
        auxReadjustScreenSize.h = winH;
        return true;
    }

    function displayOptimalScaleY(maxWidth, maxHeight) {
        var scY = maxHeight / targetHeight;
        if (scrTargetWidth * aspectX * scY > maxWidth)
            scY = maxWidth / (scrTargetWidth * aspectX);
        return scY;
    }

    function auxDisplayOptimalScaleY(maxWidth, maxHeight) {
        var scY = maxHeight / auxTargetHeight;
        if (auxScrTargetWidth * auxAspectX * scY > maxWidth)
            scY = maxWidth / (auxScrTargetWidth * auxAspectX);
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
    var videoOutputMode = 0;

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
    var isAndroidDevice = wmsx.Util.isAndroidDevice();
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
    var unmuteMessage;

    var canvas, canvasOuter, canvasLoadingIcon;
    var canvasContext;
    var canvasImageRenderingValue;
    var scanlinesImage;

    var touchControlsActive = false, touchControlsDirBig = false, touchControlsMirror = false;
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
    var crtFilter = -1, crtFilterEffective = null;
    var crtScanlines = 0;
    var crtPhosphor = -1, crtPhosphorEffective = 0;
    var debugMode = false;
    var isLoading = false;
    var ledsStatePending, ledsInfoPending;

    var aspectX = WMSX.SCREEN_DEFAULT_ASPECT;
    var scaleY = 1.0;
    var scaleYBeforeUserFullscreen = 0;
    var pixelWidth = 1, pixelHeight = 1;

    var mousePointerLocked = false;

    var targetWidth = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938, scrTargetWidth = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
    var targetHeight = wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938;

    var fsElement, fsElementCenter;

    var logo, logoCenter, logoImage, logoMessage, logoMessageText, logoMessageOK, logoMessageOKText, logoMessageActive = false;
    var logoLoadingIcon;
    var scrollMessage, scrollMessageActive = false;

    var auxWindow, auxWindowAddWidth, auxWindowAddHeight;
    var auxCanvas, auxCanvasContext;
    var auxReadjustScreenSize = { w: 0, wk: 0, h: 0, pw: 0 };
    var auxAspectX = WMSX.SCREEN_DEFAULT_ASPECT;
    var auxScaleY = 1.1;
    var auxTargetWidth = targetWidth, auxScrTargetWidth = scrTargetWidth, auxTargetHeight = targetHeight;
    var auxLogo, auxFsElementCenter;
    var auxOsd = { style: {} };         // Dummy for use when AuxWindow is not open

    var powerButton;
    var mediaIconsContainer;
    var diskAButton;
    var diskBButton;
    var diskHButton;
    var cartridge1Button;
    var cartridge2Button;
    var tapeButton;
    var turboButton;
    var capsLed;
    var kanaLed;
    var pauseLed;
    var netplayButton;
    var scaleDownButton;
    var scaleUpButton;
    var fullscreenButton;
    var videoOutputButton;
    var settingsButton;

    var barButtonBackYOffset = 25;
    var mediaButtonBackYOffsets = [ -72, -48, -24, 0 ];

    var OSD_TIME = 4500;
    var CURSOR_HIDE_FRAMES = 180;

    var FULLSCREEN_MODE = WMSX.SCREEN_FULLSCREEN_MODE;

    var BAR_AUTO_HIDE = WMSX.SCREEN_CONTROL_BAR === 0;
    var BAR_MENU_MAX_ITEMS = 25;

    var VIRTUAL_KEYBOARD_WIDE_WIDTH = 518, VIRTUAL_KEYBOARD_NARROW_WIDTH = 419, VIRTUAL_KEYBOARD_HEIGHT = 161;

    var NARROW_WIDTH = 500, SEMI_NARROW_WIDTH = 589;

    var domKeys = wmsx.DOMKeys;

    var TOUCH_EXT_SLOT2_TIME = 650;

    var KEY_CTRL_MASK  =  domKeys.CONTROL;
    var KEY_ALT_MASK   =  domKeys.ALT;
    var KEY_SHIFT_MASK =  domKeys.SHIFT;

    var MENU_CLOSE_KEYS = {}; MENU_CLOSE_KEYS[domKeys.VK_ESCAPE.wc] = 1; MENU_CLOSE_KEYS[domKeys.VK_CONTEXT.wc] = 1;
    var MENU_EXEC_KEYS = {}; MENU_EXEC_KEYS[domKeys.VK_ENTER.wc] = 1; MENU_EXEC_KEYS[domKeys.VK_SPACE.wc] = 1;
    var MENU_SELECT_KEYS = {}; MENU_SELECT_KEYS[domKeys.VK_LEFT.wc] = -1; MENU_SELECT_KEYS[domKeys.VK_RIGHT.wc] = 1;
    var MENU_ITEM_SELECT_KEYS = {}; MENU_ITEM_SELECT_KEYS[domKeys.VK_UP.wc] = -1; MENU_ITEM_SELECT_KEYS[domKeys.VK_DOWN.wc] = 1;

    var OPEN_TYPE = wmsx.FileLoader.OPEN_TYPE;

    var SCALE_STEP = 0.05;
    var ASPECT_STEP = 0.01;


    init();

    this.eval = function(str) {
        return eval(str);
    };

};
