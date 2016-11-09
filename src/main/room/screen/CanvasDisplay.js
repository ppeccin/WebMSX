// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Remove unstable UNICODE chars (Paste, Arrows)
// TODO Remove "Center" rounding problems as possible

wmsx.CanvasDisplay = function(mainElement) {
"use strict";

    var self = this;

    function init() {
        setupCSS();
        setupMain();
        setupBar();
        setupFullscreen();
        monitor = new wmsx.Monitor(self);
    }

    this.connect = function(pMachine) {
        machine = pMachine;
        monitor.connect(machine.getVideoOutput());
        machineControlsSocket = machine.getMachineControlsSocket();
        controllersSocket = machine.getControllersSocket();
        cartridgeSocket = machine.getCartridgeSocket();
        extensionsSocket = machine.getExtensionsSocket();
        machineTypeSocket = machine.getMachineTypeSocket();
    };

    this.connectPeripherals = function(fileLoader, pFileDownloader, pPeripheralControls, pControllersHub, pDiskDrive) {
        fileLoader.registerForDnD(fsElement);
        fileLoader.registerForFileInputElement(fsElement);
        fileDownloader = pFileDownloader;
        fileDownloader.registerForDownloadElement(fsElement);
        peripheralControls = pPeripheralControls;
        controllersHub = pControllersHub;
        controllersHub.setKeyInputElement(fsElement);
        controllersHub.setMouseInputElement(fsElement);
        diskDrive = pDiskDrive;
    };

    this.powerOn = function() {
        monitor.setDefaults();
        updateLogo();
        document.documentElement.classList.add("wmsx-started");
        setPageVisibilityHandling();
        this.focus();
        //if (FULLSCREEN_MODE === 1 && isBrowserStandalone) this.setFullscreen(true);
    };

    this.powerOff = function() {
        document.documentElement.remove("wmsx-started");
    };

    this.start = function(startAction) {
        // Show the logo messages or start automatically
        if (isMobileDevice && !isFullscreen) {
            if (!fullscreenAPIEnterMethod && !isBrowserStandalone) showLogoMessage(false, 'For the best experience, use<br>the "Add to Home Screen" option<br>then reopen from the new Icon', startAction);
            else showLogoMessage(true, "For the best experience on<br>mobile devices, go full-screen", startAction);
        } else
            startAction();
    };

    this.refresh = function(image, sourceWidth, sourceHeight) {
        // Hide mouse cursor if not moving for some time
        if (cursorShowing)
            if (--cursorHideFrameCountdown < 0) hideCursor();

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
    };

    this.videoSignalOff = function() {
        signalIsOn = false;
        updateLogo();
    };

    this.mousePointerLocked = function(state) {
        mousePointerLocked = state;
        if (mousePointerLocked) hideBar();
        else showBar();
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
        if (!settingsDialog) settingsDialog = new wmsx.SettingsDialog(fsElementCenter, controllersHub);
        if (pasteDialog) pasteDialog.hide();
        settingsDialog.show(page);
    };

    this.openSaveStateDialog = function (save) {
        if (!saveStateDialog) saveStateDialog = new wmsx.SaveStateDialog(fsElementCenter, machineControlsSocket, peripheralControls);
        if (pasteDialog) pasteDialog.hide();
        saveStateDialog.show(save);
    };

    this.openDiskSelectDialog = function(drive, inc, altPower) {
        if (!diskSelectDialog) diskSelectDialog = new wmsx.DiskSelectDialog(fsElementCenter, diskDrive, peripheralControls);
        if (pasteDialog) pasteDialog.hide();
        diskSelectDialog.show(drive, inc, altPower);
    };

    this.openMachineSelectDialog = function() {
        if (!machineSelectDialog) machineSelectDialog = new wmsx.MachineSelectDialog(fsElementCenter, machineTypeSocket);
        if (pasteDialog) pasteDialog.hide();
        machineSelectDialog.show();
    };

    this.openTouchConfigDialog = function() {
        if (!touchConfigDialog) touchConfigDialog = new wmsx.TouchConfigDialog(fsElement, canvasOuter, controllersHub);
        if (pasteDialog) pasteDialog.hide();
        touchConfigDialog.show();
    };

    this.openLoadFileDialog = function() {
        peripheralControls.controlActivated(wmsx.PeripheralControls.AUTO_LOAD_FILE);
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

        if (!pasteDialog) pasteDialog = new wmsx.PasteDialog(canvasOuter, this, controllersHub.getKeyboard());
        pasteDialog.toggle();
        return false;
    };

    this.toggleVirtualKeyboard = function() {
        setVirtualKeyboard(!virtualKeyboardActive);
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
        osdTimeout = setTimeout(hideOSD, OSD_TIME);
    };

    this.displayDefaultScale = function() {
        if (WMSX.SCREEN_DEFAULT_SCALE > 0) return WMSX.SCREEN_DEFAULT_SCALE;

        var maxWidth = Number.parseFloat(window.getComputedStyle(mainElement.parentElement).width);

        //console.error(">>> Parent width: " + maxWidth);

        return maxWidth >= 660 ? 1.1 : maxWidth >= 540 ? 0.9 : maxWidth >= 420 ? 0.7 : maxWidth >= 320 ? 0.55 : 0.5;
    };

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

    this.crtFilterToggle = function() {
        var newLevel = crtFilter + 1; if (newLevel > 3) newLevel = -2;
        setCRTFilter(newLevel);
        var levelDesc = crtFilterEffective === null ? "browser default" : crtFilterEffective < 1 ? "OFF" : "level " + crtFilterEffective;
        this.showOSD("CRT filter: " + (crtFilter === -1 ? "AUTO (" + levelDesc + ")" : levelDesc), true);
    };

    this.crtFilterSetDefault = function() {
        setCRTFilter(WMSX.SCREEN_FILTER_MODE);
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

    this.displayToggleFullscreen = function() {                 // Only and Always user initiated
        if (FULLSCREEN_MODE === -1) return;

        closeLogoMessage();

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
        // Toggle a dummy element existence inside mainElemen to force a reflow
        var dummy = document.getElementById("wmsx-dummy-element");
        if (dummy) {
            mainElement.removeChild(dummy);
        } else {
            dummy = document.createElement("div");
            dummy.id = "wmsx-dummy-element";
            mainElement.appendChild(dummy);
        }
    }

    this.focus = function() {
        canvas.focus();
    };

    this.powerStateUpdate = function(power) {
        powerButton.style.backgroundPosition = "" + powerButton.wmsxBX + "px " + (mediaButtonBackYOffsets[power ? 2 : 1]) + "px";
        powerButton.wmsxMenu[1].disabled = powerButton.wmsxMenu[4].disabled = !power;
    };

    this.diskDrivesMediaStateUpdate = function(drive) {
        var button = drive === 1 ? diskBButton : diskAButton;
        var stack = diskDrive.getDriveStack(drive);
        button.title = diskDrive.getCurrentDiskDesc(drive);
        button.wmsxMenu[1].disabled = stack.length === 0 || stack.length >= wmsx.FileDiskDrive.MAX_STACK;
        button.wmsxMenu[6].disabled = button.wmsxMenu[7].disabled = button.wmsxMenu[8].disabled = stack.length === 0;
        button.wmsxMenu[8].label = "Remove " + (stack.length > 1 ? "Stack" : "Disk");
        if (diskSelectDialog) diskSelectDialog.diskDrivesMediaStateUpdate(drive);
    };

    this.diskDrivesMotorStateUpdate = function(diskA, diskAMotor, diskB, diskBMotor) {
        diskAButton.style.backgroundPosition = "" + diskAButton.wmsxBX + "px " + (mediaButtonBackYOffsets[(diskAMotor ? 2 : ( diskA ? 1 : 0 ))]) + "px";
        diskBButton.style.backgroundPosition = "" + diskBButton.wmsxBX + "px " + (mediaButtonBackYOffsets[(diskBMotor ? 2 : ( diskB ? 1 : 0 ))]) + "px";
    };

    this.extensionsAndCartridgesStateUpdate = function() {
        var cart1 = cartridgeSocket.inserted(0);
        var cart2 = cartridgeSocket.inserted(1);
        cartridge1Button.title = "Cartridge 1" + ( cart1 ? ": " + (cart1.rom.source || "<Unknown>") + "  [" + cart1.format.name + "]" : "" );
        cartridge2Button.title = "Cartridge 2" + ( cart2 ? ": " + (cart2.rom.source || "<Unknown>") + "  [" + cart2.format.name + "]" : "" );
        cartridge1Button.style.backgroundPosition = "" + cartridge1Button.wmsxBX + "px " + (mediaButtonBackYOffsets[(cart1 ? 1 : 0)]) + "px";
        cartridge2Button.style.backgroundPosition = "" + cartridge2Button.wmsxBX + "px " + (mediaButtonBackYOffsets[(cart2 ? 1 : 0)]) + "px";
        var dataDesc = cart1 && cart1.getDataDesc();
        cartridge1Button.wmsxMenu[1].disabled = cartridge1Button.wmsxMenu[2].disabled = !dataDesc;
        cartridge1Button.wmsxMenu[1].label = "Load " + (dataDesc || "Data");
        cartridge1Button.wmsxMenu[2].label = "Save " + (dataDesc || "Data");
        cartridge1Button.wmsxMenu[3].disabled = !cart1;
        dataDesc = cart2 && cart2.getDataDesc();
        cartridge2Button.wmsxMenu[1].disabled = cartridge2Button.wmsxMenu[2].disabled = !dataDesc;
        cartridge2Button.wmsxMenu[1].label = "Load " + (dataDesc || "Data");
        cartridge2Button.wmsxMenu[2].label = "Save " + (dataDesc || "Data");
        cartridge2Button.wmsxMenu[3].disabled = !cart2;
        refreshSettingsMenuForExtensions();
    };

    this.tapeStateUpdate = function(name, motor) {
        tapeButton.title = "Cassette Tape" + ( name ? ": " + name : "" );
        tapeButton.style.backgroundPosition = "" + tapeButton.wmsxBX + "px " + (mediaButtonBackYOffsets[motor ? 2 : ( name ? 1 : 0 )]) + "px";
        tapeButton.wmsxMenu[2].disabled = tapeButton.wmsxMenu[3].disabled = tapeButton.wmsxMenu[4].disabled = tapeButton.wmsxMenu[5].disabled = !name;
    };

    this.machineTypeStateUpdate = function() {
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
        cursorType = boo ? 'url("' + wmsx.Images.urls.mouseCursor + '") -10 -10, auto' : "auto";
        showCursor(true);
    };

    this.touchControlsActiveUpdate = function(active) {
        if (touchControlsActive === active) return;

        touchControlsActive = active;
        if (isFullscreen) {
            if (touchControlsActive) controllersHub.setupTouchControlsIfNeeded(fsElementCenter);
            this.requestReadjust(true, true);
        }
    };

    this.setLoading = function(state) {
        isLoading = state;
        updateLoading();
        if (!state) {
            machineControlsSocket.addPowerStateListener(this);
            machineTypeSocket.addMachineTypeStateListener(this);
            extensionsSocket.addExtensionsAndCartridgesStateListener(this);
        }
    };

    this.requestReadjust = function(now, skipFocus) {
        if (settingsDialog && settingsDialog.isVisible()) settingsDialog.hide();
        if (now)
            readjustAll(true, skipFocus);
        else {
            readjustRequestTime = wmsx.Util.performanceNow();
            if (!readjustInterval) readjustInterval = setInterval(readjustAll, 50);
        }
    };

    function setVirtualKeyboard(active) {
        if (virtualKeyboardActive === active) return;

        if (active) {
            if (!isTouchDevice) return self.showOSD("Virtual Keyboard unavailable. Not a touch device!", true, true);
            if (!virtualKeyboardElement) setupVirtualKeyboard();
        }
        document.documentElement.classList.toggle("wmsx-virtual-keyboard-active", active);

        virtualKeyboardActive = active;
        self.requestReadjust(true);
    }

    function releaseControllersOnLostFocus(e) {
        controllersSocket.releaseControllers();
    }

    function hideCursor() {
        cursorShowing = false;
        updateCursor();
        hideBar();
    }

    function showCursor(force) {
        if (!cursorShowing || force) {
            cursorShowing = true;
            updateCursor();
        }
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
    }

    function updateCursor() {
        fsElement.style.cursor = cursorShowing ? cursorType : "none";
    }

    function fullscreenByAPIChanged() {
        setFullscreenState(isFullScreenByAPI());
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
        if (logoMessageActive) updateLogoMessageScale();
    }

    function updateBarWidth(canvasWidth) {
        var fixedWidth = buttonsBarDesiredWidth > 0 ? buttonsBarDesiredWidth : canvasWidth;
        buttonsBar.style.width = buttonsBarDesiredWidth === -1 ? "100%" : "" + fixedWidth + "px";
        buttonsBar.classList.toggle("wmsx-narrow", fixedWidth < NARROW_WIDTH);
    }

    function updateKeyboardWidth(maxWidth) {
        var width = Math.min(1024, maxWidth);       // Limit to 1024px
        var scale = width / VIRTUAL_KEYBOARD_WIDTH;
        virtualKeyboardElement.style.transform = "translateX(-50%) scale(" + scale.toFixed(8) + ")";
        return { w: width, h: Math.ceil(VIRTUAL_KEYBOARD_HEIGHT * scale) };
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
        logo.classList.toggle("wmsx-show", !signalIsOn);
        if (!signalIsOn) {
            if (pasteDialog) pasteDialog.hide();
            showBar();
            showCursor(true);
            if (canvasContext) canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function updateLoading() {
        if (isLoading /* && loadingImage.isLoaded */) loadingImage.style.display = "block";
        else loadingImage.style.display = "none";
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

    function onMouseDown(element, handler) {
        element.addEventListener("mousedown", handler);
    }

    function onMouseUp(element, handler) {
        element.addEventListener("mouseup", handler);
    }


    function blockEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function suppressContextMenu(element) {
        element.addEventListener("contextmenu", blockEvent);
    }

    function preventDrag(element) {
        element.ondragstart = blockEvent;
    }

    function setupMain() {
        mainElement.innerHTML = wmsx.ScreenGUI.html();
        delete wmsx.ScreenGUI.html;

        fsElement = document.getElementById("wmsx-screen-fs");
        fsElementCenter = document.getElementById("wmsx-screen-fs-center");
        canvasOuter = document.getElementById("wmsx-screen-canvas-outer");
        canvas = document.getElementById("wmsx-screen-canvas");
        osd = document.getElementById("wmsx-osd");
        logo = document.getElementById("wmsx-logo");
        logoImage = document.getElementById("wmsx-logo-image");
        logoMessage = document.getElementById("wmsx-logo-message");
        logoMessageText = document.getElementById("wmsx-logo-message-text");
        logoMessageYes = document.getElementById("wmsx-logo-message-yes");
        logoMessageNo =  document.getElementById("wmsx-logo-message-no");
        logoMessageOk =  document.getElementById("wmsx-logo-message-ok");
        loadingImage = document.getElementById("wmsx-loading-icon");
        scrollMessage = document.getElementById("wmsx-screen-scroll-message");

        suppressContextMenu(mainElement);
        suppressContextMenu(fsElement);
        preventDrag(logoImage);
        preventDrag(loadingImage);

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

        fsElement.addEventListener("mousemove", function() {
            showCursor();
            showBar();
        });

        if ("onblur" in document) fsElement.addEventListener("blur", releaseControllersOnLostFocus, true);
        else fsElement.addEventListener("focusout", releaseControllersOnLostFocus, true);

        window.addEventListener("orientationchange", function orientationChanged() {
            self.requestReadjust();
        });

        onMouseDown(logoMessageYes,logoMessageYesClicked);    // User Initiated Gesture required
        onMouseDown(logoMessageNo,logoMessageNoClicked);
        onMouseDown(logoMessageOk,logoMessageOkClicked);
    }

    function setupVirtualKeyboard() {
        virtualKeyboardElement = document.createElement('div');
        virtualKeyboardElement.id = "wmsx-virtual-keyboard";
        fsElementCenter.appendChild(virtualKeyboardElement);
        virtualKeyboard = new wmsx.DOMVirtualKeyboard(virtualKeyboardElement, controllersHub.getKeyboard());
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
            { label: "Power",              clickModif: 0, control: wmsx.PeripheralControls.MACHINE_POWER_TOGGLE },
            { label: "Reset",              clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_RESET },
            { label: "",                   divider: true },
            { label: "Load State",         clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.MACHINE_LOAD_STATE_MENU },
            { label: "Save State",         clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.MACHINE_SAVE_STATE_MENU, disabled: true }
        ];
        menu.menuTitle = "System";
        powerButton = addPeripheralControlButton("wmsx-bar-power", -120, -26, "System Power", null, menu);

        menu = [
            { label: "Load from Files",    clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES },
            { label: "Add from Files",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISK_ADD_FILES, disabled: true },
            { label: 'Load "Files as Disk"',           control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK },
            { label: 'Load "ZIP as Disk"',             control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK },
            { label: "Blank 720KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_720 },
            { label: "Blank 360KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_360 },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, disabled: true },
            { label: "Save Disk File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, disabled: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, disabled: true },
            {                              clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY }
        ];
        menu.menuTitle = "Drive A:";
        diskAButton = addPeripheralControlButton("wmsx-bar-diska", -237, -51, "Disk A:", null, menu);

        menu = [
            { label: "Load from Files",    clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES, secSlot: true },
            { label: "Add from Files",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISK_ADD_FILES, secSlot: true, disabled: true },
            { label: 'Load "Files as Disk"',           control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK, secSlot: true },
            { label: 'Load "ZIP as Disk"',             control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK, secSlot: true },
            { label: "Blank 720KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_720, secSlot: true },
            { label: "Blank 360KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_360, secSlot: true },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, secSlot: true, disabled: true },
            { label: "Save Disk File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, secSlot: true, disabled: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, secSlot: true, disabled: true },
            {                              clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY, secSlot: true }
        ];
        menu.menuTitle = "Drive B:";
        diskBButton = addPeripheralControlButton("wmsx-bar-diskb", -266, -51, "Disk B:", null, menu);

        menu = [
            { label: "Load from File",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE },
            { label: "Load Data",          clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, disabled: true },
            { label: "Save Data",          clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, disabled: true }
        ];
        menu.menuTitle = "Cartridge 1";
        cartridge1Button = addPeripheralControlButton("wmsx-bar-cart1", -150, -51, "Cartridge 1", null, menu);

        menu = [
            { label: "Load from File",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, secSlot: true },
            { label: "Load Data",          clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, secSlot: true, disabled: true },
            { label: "Save Data",          clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, secSlot: true, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, secSlot: true, disabled: true }
        ];
        menu.menuTitle = "Cartridge 2";
        cartridge2Button = addPeripheralControlButton("wmsx-bar-cart2", -179, -51, "Cartridge 2", null, menu);

        menu = [
            { label: "Load form File", clickModif: 0, control: wmsx.PeripheralControls.TAPE_LOAD_FILE },
            { label: "New Blank Tape", clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_EMPTY },
            { label: "Rewind Tape",                control: wmsx.PeripheralControls.TAPE_REWIND, disabled: true },
            { label: "Run Program",    clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_AUTO_RUN, disabled: true },
            { label: "Save Tape File", clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_SAVE_FILE, disabled: true },
            { label: "Remove Tape",    clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE, disabled: true }
        ];
        menu.menuTitle = "Cassette Tape";
        tapeButton = addPeripheralControlButton("wmsx-bar-tape", -208, -51, "Cassette Tape", null, menu);

        menu = createSettingsMenuOptions();
        menu.menuTitle = "Settings";
        settingsButton = addPeripheralControlButton("wmsx-bar-settings", -96, -1, "Settings", null, menu);

        if (FULLSCREEN_MODE !== -1) {
            fullscreenButton = addPeripheralControlButton("wmsx-bar-full-screen", -71, -1, "Full Screen", wmsx.PeripheralControls.SCREEN_FULLSCREEN);
            if (isMobileDevice) fullscreenButton.classList.add("wmsx-mobile");
        }

        if (!WMSX.SCREEN_RESIZE_DISABLED && !isMobileDevice) {
            scaleUpButton = addPeripheralControlButton("wmsx-bar-scale-plus", -48, -1, "Increase Screen", wmsx.PeripheralControls.SCREEN_SCALE_PLUS);
            scaleUpButton.classList.add("wmsx-full-screen-hidden");
            scaleDownButton = addPeripheralControlButton("wmsx-bar-scale-minus", -26, -1, "Decrease Screen", wmsx.PeripheralControls.SCREEN_SCALE_MINUS);
            scaleDownButton.classList.add("wmsx-full-screen-hidden");
        }

        var keyboardButton = addPeripheralControlButton("wmsx-bar-keyboard", -68, -25, "Toggle Virtual Keyboard", wmsx.PeripheralControls.SCREEN_TOGGLE_VIRTUAL_KEYBOARD);
        keyboardButton.classList.add("wmsx-full-screen-only");

        logoButton = addPeripheralControlButton("wmsx-bar-logo", -8, -25, "About WebMSX", wmsx.PeripheralControls.SCREEN_OPEN_ABOUT);
        logoButton.classList.add("wmsx-full-screen-hidden");
        logoButton.classList.add("wmsx-narrow-hidden");

        // Mouse buttons perform the various actions
        onMouseDown(buttonsBar, peripheralControlButtonMouseDown);
    }

    function createSettingsMenuOptions() {
        var menu = [ ];

        var extConfig = WMSX.EXTENSIONS_CONFIG;
        for (var ext in extConfig) {
            var conf = extConfig[ext];
            if (conf.desc) {            // Only show extensions with descriptions
                var opt = { label: conf.desc, extension: ext, toggle: true, checked: false };
                menu.push(opt);
            }
        }
        menu.push({ label: "",            divider: true });

        menu.push({ label: "Select Machine",                 control: wmsx.PeripheralControls.MACHINE_SELECT });
        if (!isMobileDevice)
        menu.push({ label: "Help & Settings", clickModif: 0, control: wmsx.PeripheralControls.SCREEN_OPEN_SETTINGS });
        if (isTouchDevice)
        menu.push({ label: "Touch Controls",                 control: wmsx.PeripheralControls.SCREEN_OPEN_TOUCH_CONFIG, fullScreenOnly: true});
        if (!isMobileDevice)
        menu.push({ label: "Defaults",                       control: wmsx.PeripheralControls.SCREEN_DEFAULTS,          fullScreenHidden: true });
        return menu;
    }

    function refreshSettingsMenuForExtensions() {
        var menu = settingsButton.wmsxMenu;
        for (var i = 0; i < menu.length; ++i) {
            var opt = menu[i];
            if (opt.extension) {
                opt.hidden = !extensionsSocket.isValid(opt.extension);
                opt.checked = extensionsSocket.isActiveAnySlot(opt.extension);
            }
        }
        if (barMenuActive === menu) refreshBarMenu(menu);
    }

    function refreshSettingsMenuForMachineType() {
        var menu = settingsButton.wmsxMenu;
        menu.menuTitle = (WMSX.MACHINES_CONFIG[machineTypeSocket.getMachine()].desc.split("(")[0] || "Settings").trim();
        if (barMenuActive === menu) refreshBarMenu(menu);
    }

    function addPeripheralControlButton(id, bx, by, tooltip, control, menu) {
        var but = document.createElement('div');
        but.id = id;
        but.classList.add("wmsx-bar-button");
        but.wmsxControl = control;
        but.wmsxMenu = menu;
        but.style.backgroundPosition = "" + bx + "px " + by + "px";
        but.wmsxBX = bx;
        if (tooltip) but.title = tooltip;

        // Mouse hover switch menus if already open
        but.addEventListener("mouseenter", peripheralControlButtonMouseEnter);

        buttonsBarInner.appendChild(but);
        return but;
    }

    function peripheralControlButtonMouseDown(e) {
        blockEvent(e);

        // Single option, only left click
        if (e.target.wmsxControl) {
            hideBarMenu();
            if (!e.button) peripheralControls.controlActivated(e.target.wmsxControl);
            return;
        }

        var menu = e.target.wmsxMenu;
        if (!menu) {
            hideBarMenu();
            return;
        }

        var modifs = 0 | (e.altKey && KEY_ALT_MASK) | (e.ctrlKey && KEY_CTRL_MASK) | (e.shiftKey && KEY_SHIFT_MASK);

        // Open/close menu with left-click if no modifiers
        if (modifs === 0 && !e.button) {
            if (barMenuActive !== menu) showBarMenu(menu, e.target, true);
            return;
        }

        // Modifier options for left, middle or right click
        for (var i = 0; i < menu.length; ++i)
            if (menu[i].clickModif === modifs) peripheralControls.controlActivated(menu[i].control, e.button === 1, menu[i].secSlot); // altPower for middleClick
    }

    function peripheralControlButtonMouseEnter(e) {
        if (barMenuActive && e.target.wmsxMenu) showBarMenu(e.target.wmsxMenu, e.target, true);
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
            scrollMessage.wmsxScroll = canvas.wmsxScroll = logo.wmsxScroll = logoImage.wmsxScroll =
                logoMessage.wmsxScroll = logoMessageText.wmsxScroll = logoMessageYes.wmsxScroll = logoMessageNo.wmsxScroll = logoMessageOk.wmsxScroll = true;

            fsElement.addEventListener("touchmove", function preventTouchMoveInFullscreenByHack(e) {
                if (isFullscreen) {
                    if (!fullScreenScrollHack || !e.target.wmsxScroll)
                        return blockEvent(e);
                    else
                    if (scrollMessageActive) setScrollMessage(false);
                }
            });
        }
    }

    function showBar() {
        if (!mousePointerLocked) buttonsBar.classList.remove("wmsx-hidden");
    }

    function hideBar() {
        if ((BAR_AUTO_HIDE || isFullscreen) && !barMenuActive && !virtualKeyboardActive) {
            hideBarMenu();
            buttonsBar.classList.add("wmsx-hidden");
        }
    }

    function showBarMenu(menu, refElement, redefine) {
        if (barMenuActive && !redefine) return;
        if (!menu) return;

        if (!barMenu) {
            setupBarMenu();
            setTimeout(function() {
                showBarMenu(menu, refElement, redefine);
            }, 1);
            return;
        }

        // Define items
        refreshBarMenu(menu);

        // Position
        if (refElement) {
            var p;
            p = (refElement.offsetLeft + refElement.clientWidth / 2 - wmsx.ScreenGUI.BAR_MENU_WIDTH / 2) | 0;
            if (p + wmsx.ScreenGUI.BAR_MENU_WIDTH > refElement.parentElement.clientWidth) {
                barMenu.style.right = 0;
                barMenu.style.left = "auto";
                barMenu.style.transformOrigin = "bottom right";
            } else {
                if (p < 0) p = 0;
                barMenu.style.left = "" + p + "px";
                barMenu.style.right = "auto";
                barMenu.style.transformOrigin = "bottom left";
            }
        } else {
            barMenu.style.left = barMenu.style.right = 0;
            barMenu.style.transformOrigin = "bottom center";
        }

        // Show
        barMenuActive = menu;
        barMenu.style.transition = redefine ? "none" : BAR_MENU_TRANSITION;
        barMenu.wmsxTitle.focus();
    }

    function refreshBarMenu(menu) {
        barMenu.wmsxTitle.innerHTML = menu.menuTitle;

        var it = 0;
        var item;
        var maxShown = Math.min(menu.length, BAR_MENU_MAX_ITEMS);
        var h = wmsx.ScreenGUI.BAR_MENU_ITEM_HEIGHT + 3;         // title + borders

        for (var op = 0; op < maxShown; ++op) {
            if (menu[op].label !== undefined) {
                item = barMenu.wmsxItems[it];
                item.firstChild.textContent = menu[op].label;
                item.wmsxMenuOption = menu[op];

                if (menu[op].hidden || (isFullscreen && menu[op].fullScreenHidden) || (!isFullscreen && menu[op].fullScreenOnly)) {
                    item.style.display = "none";
                } else {
                    item.style.display = "block";

                    // Disabled ?
                    item.classList.toggle("wmsx-bar-menu-item-disabled", !!menu[op].disabled);

                    // Divider?
                    if (menu[op].divider) {
                        item.classList.add("wmsx-bar-menu-item-divider");
                    } else {
                        item.classList.remove("wmsx-bar-menu-item-divider");
                        h += wmsx.ScreenGUI.BAR_MENU_ITEM_HEIGHT;   // ecah non-divider item
                    }

                    // Toggle option?
                    if (menu[op].toggle !== undefined) {
                        item.classList.add("wmsx-bar-menu-item-toggle");
                        item.classList.toggle("wmsx-bar-menu-item-toggle-checked", !!menu[op].checked);
                    } else {
                        item.classList.remove("wmsx-bar-menu-item-toggle");
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

        barMenu.style.height = "auto";
    }

    function hideBarMenu() {
        if (!barMenuActive) return;

        barMenuActive = null;
        barMenu.style.transition = BAR_MENU_TRANSITION;
        barMenu.style.height = 0;
        self.focus();
    }

    function setupBarMenu() {
        barMenu = document.createElement('div');
        barMenu.id = "wmsx-bar-menu";

        var inner = document.createElement('div');
        inner.id = "wmsx-bar-menu-inner";
        barMenu.appendChild(inner);

        var title = document.createElement('button');
        title.id = "wmsx-bar-menu-title";
        title.innerHTML = "Menu Title";
        inner.appendChild(title);
        barMenu.wmsxTitle = title;

        var itemMouseEntered = function (e) {
            e.target.classList.add("wmsx-hover");
        };
        var itemMouseLeft = function (e) {
            e.target.classList.remove("wmsx-hover");
        };

        barMenu.wmsxItems = new Array(BAR_MENU_MAX_ITEMS);
        for (var i = 0; i < BAR_MENU_MAX_ITEMS; ++i) {
            var item = document.createElement('button');
            item.classList.add("wmsx-bar-menu-item");
            item.style.display = "none";
            item.innerHTML = "Menu Item " + i;
            item.addEventListener("mouseenter", itemMouseEntered);
            item.addEventListener("mouseleave", itemMouseLeft);
            var check = document.createElement('div');
            check.classList.add("wmsx-bar-menu-item-check");
            item.appendChild(check);
            inner.appendChild(item);
            barMenu.wmsxItems[i] = item;
        }

        // Block keys and hide with ESC
        barMenu.addEventListener("keydown", function(e) {
            if (e.keyCode === wmsx.DOMKeys.VK_ESCAPE.c) hideBarMenu();
            return blockEvent(e);
        });

        var fireItem = function(e) {
            if (e.target.wmsxMenuOption && !e.target.wmsxMenuOption.disabled) {
                var altPower = e.button === 1;
                var secSlot;
                if (e.target.wmsxMenuOption.machine) {
                    machineTypeSocket.changeMachine(e.target.wmsxMenuOption.machine);
                } else if (e.target.wmsxMenuOption.extension) {
                    secSlot = e.shiftKey;
                    extensionsSocket.toggleExtension(e.target.wmsxMenuOption.extension, altPower, secSlot);
                } else if (e.target.wmsxMenuOption.control) {
                    secSlot = e.target.wmsxMenuOption.secSlot;
                    hideBarMenu();
                    peripheralControls.controlActivated(e.target.wmsxMenuOption.control, altPower, secSlot);
                }
            }
        };
        // Fire menu item with a left or middle mouse up or a touchEnd
        onMouseUp(barMenu, function (e) {
            if (!e.button || e.button === 1) fireItem(e);
            return blockEvent(e);
        });
        // Block mousedown
        onMouseDown(barMenu, blockEvent);

        // Hide on lost focus
        barMenu.addEventListener("blur", hideBarMenu, true);
        barMenu.addEventListener("focusout", hideBarMenu, true);

        buttonsBar.appendChild(barMenu);
    }

    function showLogoMessage(yesNo, mes, afterAction) {
        logoMessageActive = true;
        if (afterAction) afterMessageAction = afterAction;
        logoMessageText.innerHTML = mes;
        logoMessageOk.classList.toggle("wmsx-show", !yesNo);
        logoMessageYes.classList.toggle("wmsx-show", yesNo);
        logoMessageNo .classList.toggle("wmsx-show", yesNo);
        fsElement.classList.add("wmsx-logo-message-active");

        updateLogoMessageScale();
        signalIsOn = false;
        updateLogo();
    }

    function closeLogoMessage() {
        if (afterMessageAction) {
            afterMessageAction();
            afterMessageAction = null;
        }
        logoMessageOk.classList.remove("wmsx-show");
        logoMessageYes.classList.remove("wmsx-show");
        logoMessageNo .classList.remove("wmsx-show");
        fsElement.classList.remove("wmsx-logo-message-active");
        logoMessageActive = false;
    }

    function logoMessageYesClicked(e) {
        self.setFullscreen(true);
        closeLogoMessage();
        return blockEvent(e);
    }

    function logoMessageNoClicked(e) {
        closeLogoMessage();
        return blockEvent(e);
    }

    function logoMessageOkClicked(e) {
        if (!isFullscreen) showLogoMessage(true, "For the best experience on<br>mobile devices, go full-screen");  // Keep same action
        else closeLogoMessage();
        return blockEvent(e);
    }

    function updateLogoMessageScale() {
        var width = fsElementCenter.clientWidth;
        var scale = Math.min(width / wmsx.ScreenGUI.LOGO_MESSAGE_WIDTH, 1);
        logoMessage.style.transform = "translate(-50%, -50%) scale(" + scale.toFixed(4) + ")";
        //console.error("MESSAGE SCALE width: " + width + ", scale: " + scale);
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

    function setupCSS() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = wmsx.ScreenGUI.css();
        document.head.appendChild(style);
        delete wmsx.ScreenGUI.css;
    }

    function readjustAll(force, skipFocus) {
        if (readjustScreeSizeChanged(force)) {
            if (isFullscreen) {
                var isLandscape = readjustScreenSize.w > readjustScreenSize.h;
                var keyboardRect = virtualKeyboardActive && updateKeyboardWidth(readjustScreenSize.wk);
                buttonsBarDesiredWidth = isLandscape ? virtualKeyboardActive ? keyboardRect.w : 0 : -1;
                var winH = readjustScreenSize.h;
                if (!isLandscape || virtualKeyboardActive) winH -= wmsx.ScreenGUI.BAR_HEIGHT + 2;
                if (virtualKeyboardActive) winH -= keyboardRect.h + 2;
                monitor.displayScale(aspectX, displayOptimalScaleY(readjustScreenSize.w, winH));
            } else {
                buttonsBarDesiredWidth = -1;
                monitor.displayScale(WMSX.SCREEN_DEFAULT_ASPECT, self.displayDefaultScale());
            }

            if (!skipFocus) self.focus();
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
        var winW = fsElement.clientWidth;
        var winH = fsElement.clientHeight;
        var winWK = winW;
        if (winW > winH) {
            // For Keyboard in Landscape, always treat as if TouchControls are enabled
            winWK -= wmsx.DOMTouchControls.TOTAL_WIDTH;
            if (touchControlsActive) winW = winWK;      // The same for everytinhg if TouchControls indeed enabled
        }

        if (!force && readjustScreenSize.pw === parW && readjustScreenSize.w === winW && readjustScreenSize.h === winH && readjustScreenSize.wk === winWK)
            return false;

        readjustScreenSize.pw = parW;
        readjustScreenSize.w = winW;
        readjustScreenSize.wk = winWK;
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
        var wasUnpaused, wasFullscreenByAPI;
        function visibilityChange() {
            if (document.hidden) {
                wasFullscreenByAPI = isFullScreenByAPI();
                wasUnpaused = !machine.systemPause(true);
            } else {
                if (isMobileDevice) self.requestReadjust();
                if (wasUnpaused) {
                    if (wasFullscreenByAPI && !isFullScreenByAPI())
                        showLogoMessage(true, "Emulation paused.<br>Resume in full-screen?", machineSystemUnpauseAction);
                    else
                        machineSystemUnpauseAction();
                }
            }
        }
        document.addEventListener("visibilitychange", visibilityChange);

        function machineSystemUnpauseAction() {
            machine.systemPause(false);
        }
    }


    var afterMessageAction;

    var machine;
    var monitor;
    var peripheralControls;
    var fileDownloader;
    var controllersHub;
    var extensionsSocket;
    var machineTypeSocket;
    var controllersSocket;
    var cartridgeSocket;
    var diskDrive;

    var readjustInterval = 0, readjustRequestTime = 0;
    var readjustScreenSize = { w: 0, wk: 0, h: 0, pw: 0 };

    var isFullscreen = false;

    var isTouchDevice = wmsx.Util.isTouchDevice();
    var isMobileDevice = wmsx.Util.isMobileDevice();
    var isIOSDevice = wmsx.Util.isIOSDevice();
    var isBrowserStandalone = wmsx.Util.isBrowserStandaloneMode();
    var browserName = wmsx.Util.browserInfo().name;

    var fullscreenAPIEnterMethod, fullScreenAPIExitMethod, fullScreenAPIQueryProp, fullScreenScrollHack = false;
    var viewportTag, viewPortOriginalTag, viewPortOriginalContent;

    var machineControlsSocket;
    var machineControlsStateReport = {};

    var settingsDialog;
    var saveStateDialog;
    var diskSelectDialog;
    var machineSelectDialog;
    var touchConfigDialog;
    var pasteDialog;
    var copyTextArea;

    var fsElement, fsElementCenter;

    var canvas, canvasOuter;
    var canvasContext;
    var canvasImageRenderingValue;

    var touchControlsActive = false;
    var virtualKeyboardActive = false;
    var virtualKeyboardElement, virtualKeyboard;

    var buttonsBar, buttonsBarInner, buttonsBarDesiredWidth = -1;       // 0 = same as canvas. -1 means full width mode (100%)

    var barMenu;
    var barMenuActive = null;

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
    var pixelWidth = 1, pixelHeight = 1;

    var mousePointerLocked = false;

    var targetWidth = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
    var targetHeight = WMSX.MACHINES_CONFIG[WMSX.MACHINE].type === 1
        ? wmsx.VDP.SIGNAL_HEIGHT_V9918 * 2
        : wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938;


    var logo, logoImage, logoMessage, logoMessageText, logoMessageYes, logoMessageNo, logoMessageOk, logoMessageActive = false;
    var loadingImage;
    var scrollMessage, scrollMessageActive = false;

    var powerButton;
    var diskAButton;
    var diskBButton;
    var cartridge1Button;
    var cartridge2Button;
    var tapeButton;
    var logoButton;
    var scaleDownButton;
    var scaleUpButton;
    var fullscreenButton;
    var settingsButton;

    var mediaButtonBackYOffsets = [ -51, -26, -1 ];

    var OSD_TIME = 3000;
    var CURSOR_HIDE_FRAMES = 150;

    var FULLSCREEN_MODE = WMSX.SCREEN_FULLSCREEN_MODE;

    var BAR_AUTO_HIDE = WMSX.SCREEN_CONTROL_BAR === 1;
    var BAR_MENU_MAX_ITEMS = Math.max(10, Object.keys(WMSX.EXTENSIONS_CONFIG).length + 1 + 3);
    var BAR_MENU_TRANSITION = "height 0.12s linear";

    var VIRTUAL_KEYBOARD_WIDTH = 518, VIRTUAL_KEYBOARD_HEIGHT = 161;

    var NARROW_WIDTH = 450;

    var KEY_CTRL_MASK  =  32;
    var KEY_ALT_MASK   =  64;
    var KEY_SHIFT_MASK =  128;


    init();

    this.eval = function(str) {
        return eval(str);
    };

};
