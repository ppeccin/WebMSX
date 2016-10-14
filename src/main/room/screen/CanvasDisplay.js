// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CanvasDisplay = function(mainElement) {
"use strict";

    var self = this;

    function init() {
        setupCSS();
        setupMain();
        setupOSD();
        setupBar();
        setupLogo();
        setupLoadingIcon();
        setupFullscreenMethod();
        monitor = new wmsx.Monitor(self);
    }

    this.connect = function(pVideoSignal, pMachineControlsSocket, pMachineTypeSocket, pExtensionsSocket, pCartridgeSocket, pControllersSocket) {
        monitor.connect(pVideoSignal);
        machineControlsSocket = pMachineControlsSocket;
        controllersSocket = pControllersSocket;
        cartridgeSocket = pCartridgeSocket;
        extensionsSocket = pExtensionsSocket;
        machineTypeSocket = pMachineTypeSocket;
    };

    this.connectPeripherals = function(fileLoader, pFileDownloader, pPeripheralControls, pControllersHub, pDiskDrive) {
        fileLoader.registerForDnD(mainElement);
        fileLoader.registerForFileInputElement(mainElement);
        fileDownloader = pFileDownloader;
        fileDownloader.registerForDownloadElement(mainElement);
        peripheralControls = pPeripheralControls;
        controllersHub = pControllersHub;
        controllersHub.setKeyInputElement(mainElement);
        controllersHub.setMouseInputElement(fsElement);
        controllersHub.setTouchControlElements(getTouchControlElements());
        diskDrive = pDiskDrive;
    };

    this.powerOn = function() {
        monitor.setDefaults();
        updateLogo();
        mainElement.style.visibility = "visible";
        this.focus();
    };

    this.powerOff = function() {
        mainElement.style.visibility = "hidden";
        mainElement.style.display = "none";
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
        if (!settingsDialog) settingsDialog = new wmsx.SettingsDialog(fsElement, controllersHub);
        if (pasteDialog) pasteDialog.hide();
        settingsDialog.show(page);
    };

    this.openDiskSelectDialog = function(drive, inc, altPower) {
        createDiskSelectDialog();
        if (pasteDialog) pasteDialog.hide();
        diskSelectDialog.show(drive, inc, altPower);
    };

    this.openMachineSelectDialog = function() {
        createMachineSelectDialog();
        if (pasteDialog) pasteDialog.hide();
        machineSelectDialog.show();
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

        if (!pasteDialog) pasteDialog = new wmsx.PasteDialog(fsElement, this, controllersHub.getKeyboard());
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
        updateScale();
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

    this.displayCenter = function() {
        // If we are in Full Screen Hack, fully scroll window to the bottom
        if (isFullscreen && !fullscreenAPIEnterMethod) window.scrollTo(0, 1000);
        this.focus();
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

    function hideOSD() {
        osd.style.transition = "all 0.15s linear";
        osd.style.top = "-29px";
        osd.style.opacity = 0;
        osdShowing = false;
    }

    this.setDebugMode = function(boo) {
        debugMode = !!boo;
        updateImageComposition();
    };

    this.crtFilterToggle = function() {
        var newLevel = (crtFilter + 1) % 4;
        setCRTFilter(newLevel);
        this.showOSD(newLevel === 0 ? "CRT filter: OFF" : "CRT filter level: " + newLevel, true);
    };

    this.crtFilterSetDefault = function() {
        setCRTFilter(WMSX.SCREEN_FILTER_MODE);
    };

    this.crtModeToggle = function() {
        var newMode = (crtMode + 1) % 2;
        setCRTMode(newMode);
        this.showOSD("CRT mode: " + (crtMode === 1 ? "Phosphor" : "OFF"), true);
    };

    this.crtModeSetDefault = function() {
        setCRTMode(WMSX.SCREEN_CRT_MODE);
    };

    this.displayToggleFullscreen = function() {
        if (WMSX.SCREEN_FULLSCREEN_DISABLED) return;
        this.setFullscreen(!isFullscreen);
    };

    this.setFullscreen = function(mode) {
        if (mode && !touchDir) setupTouchControls();

        if (fullscreenAPIEnterMethod) setFullscreenByAPI(mode);
        else setFullscreenByHack(mode);
    };

    function setFullscreenByAPI(mode) {
        if (isFullscreen === mode) return;
        if (mode) fullscreenAPIEnterMethod.call(fsElement);
        else fullScreenAPIExitMethod.call(document);
        // callback fullscreenByAPIChanged() will adjust everything
    }

    function setFullscreenByHack(mode) {
        if (mode) {
            if (!viewportTag) {
                viewportTag = document.querySelector("meta[name=viewport]");
                if (!viewportTag) {
                    viewportTag = document.createElement('meta');
                    viewportTag.name = "viewport";
                    document.head.appendChild(viewportTag);
                }
            }
            if (viewportOriginalContent === null) viewportOriginalContent = viewportTag.content;
            viewportTag.content = "width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=0, minimal-ui";
            document.documentElement.classList.add("wmsx-full-screen");
        } else {
            if (viewportOriginalContent !== null) {
                viewportTag.content = viewportOriginalContent;
                viewportOriginalContent = null;
            }
            document.documentElement.classList.remove("wmsx-full-screen");
        }

        setTimeout(function() {
            isFullscreen = mode;
            readjustAll();
        }, 30);
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
    };

    this.mouseActiveCursorStateUpdate = function(boo) {
        cursorType = boo ? 'url("' + wmsx.Images.urls.mouseCursor + '") -10 -10, auto' : "auto";
        showCursor(true);
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

    function setVirtualKeyboard(active) {
        if (virtualKeyboardActive === active) return;

        if (active) {
            if (!wmsx.Util.isTouchDevice()) return self.showOSD("Virtual Keyboard unavailable. Not a touch device!", true, true);
            if (!virtualKeyboardElement) setupVirtualKeyboard();
            document.documentElement.classList.add("wmsx-virtual-keyboard-showing");
        } else
            document.documentElement.classList.remove("wmsx-virtual-keyboard-showing");

        virtualKeyboardActive = active;
        readjustAll();
    }

    function lostFocus(e) {
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
        var fse = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        isFullscreen = !!fse;
        if (isFullscreen) document.documentElement.classList.add("wmsx-full-screen");
        else document.documentElement.classList.remove("wmsx-full-screen");

        // Give the browser some time to set full screen properly
        setTimeout(readjustAll, 30);
    }

    function updateScale() {
        var width = Math.round(targetWidth * scaleY * aspectX);
        var height = Math.round(targetHeight * scaleY);
        canvas.style.width = "" + width + "px";
        canvas.style.height = "" + height + "px";
    }

    function updateBarAndKeyboardWidth(isPortrait, viewportWidth) {
        var barWidth, keyboardWidth;

        if (isPortrait) {
            barWidth = viewportWidth;
            buttonsBar.style.width = "100%";
            keyboardWidth = viewportWidth;
        } else {
            barWidth = Math.round(targetWidth * scaleY * aspectX);     // Same as display barWidth
            buttonsBar.style.width = "" + barWidth + "px";
            keyboardWidth = barWidth;
        }

        if (barWidth < NARROW_WIDTH) buttonsBar.classList.add("wmsx-narrow");
        else buttonsBar.classList.remove("wmsx-narrow");

        if (virtualKeyboardActive) {
            var keyboardScale = keyboardWidth / VIRT_KEYBOARD_WIDTH;
            virtualKeyboardElement.style.transform = "translateX(-50%) scale(" + keyboardScale.toFixed(6) + ")";
        }
    }

    function updateCanvasContentSize() {
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Prepare Context used to draw frame
        canvasContext = canvas.getContext("2d");

        updateImageComposition();
        updateImageSmoothing();
    }

    function setCRTFilter(level) {
        crtFilter = level;
        updateImageSmoothing();
    }

    function setCRTMode(mode) {
        crtMode = mode;
        updateImageComposition();
    }

    function updateLogo() {
        if (signalIsOn) {
            logoImage.style.display = "none";
        } else {
            if (pasteDialog) pasteDialog.hide();
            showBar();
            showCursor(true);
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            /* if (logoImage.isLoaded) */ logoImage.style.display = "block";
        }
    }

    function updateLoading() {
        if (isLoading /* && loadingImage.isLoaded */) loadingImage.style.display = "block";
        else loadingImage.style.display = "none";
    }

    function updateImageComposition() {
        if (crtMode > 0 && !debugMode) {
            canvasContext.globalCompositeOperation = "source-over";
            canvasContext.globalAlpha = 0.8;
        } else {
            canvasContext.globalCompositeOperation = "copy";
            canvasContext.globalAlpha = 1;
        }
    }

    function updateImageSmoothing() {
        canvas.style.imageRendering = (crtFilter === 1 || crtFilter === 3) ? "initial" : canvasImageRenderingValue;

        var smoothing = crtFilter >= 2;
        if (canvasContext.imageSmoothingEnabled !== undefined)
            canvasContext.imageSmoothingEnabled = smoothing;
        else {
            canvasContext.webkitImageSmoothingEnabled = smoothing;
            canvasContext.mozImageSmoothingEnabled = smoothing;
            canvasContext.msImageSmoothingEnabled = smoothing;
        }
    }

    function suppressContextMenu(element) {
        element.addEventListener("contextmenu", function stopContextMenu(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }

    function createDiskSelectDialog() {
        if (diskSelectDialog) return;
        diskSelectDialog = new wmsx.DiskSelectDialog(fsElement, diskDrive, peripheralControls);
    }

    function createMachineSelectDialog() {
        if (machineSelectDialog) return;
        machineSelectDialog = new wmsx.MachineSelectDialog(fsElement, machineTypeSocket);
    }

    function setupMain() {
        var style = mainElement.style;
        mainElement.tabIndex = "0";               // Make it focusable
        suppressContextMenu(mainElement);

        mainElement.addEventListener("focusout", lostFocus, true);
        mainElement.addEventListener("blur", lostFocus, true);

        fsElement = document.createElement('div');
        fsElement.id = "wmsx-screen-fs";
        mainElement.appendChild(fsElement);

        suppressContextMenu(fsElement);

        fsElement.addEventListener("mousemove", function() {
            showCursor();
            showBar();
        });

        document.addEventListener("fullscreenchange", fullscreenByAPIChanged);
        document.addEventListener("webkitfullscreenchange", fullscreenByAPIChanged);
        document.addEventListener("mozfullscreenchange", fullscreenByAPIChanged);
        document.addEventListener("msfullscreenchange", fullscreenByAPIChanged);

        // Try to determine correct value for image-rendering for the canvas filter modes
        switch (wmsx.Util.browserInfo().name) {
            case "CHROME":
            case "EDGE":
            case "OPERA":   canvasImageRenderingValue = "pixelated"; break;
            case "FIREFOX": canvasImageRenderingValue = "-moz-crisp-edges"; break;
            case "SAFARI":  canvasImageRenderingValue = "-webkit-optimize-contrast"; break;
            default:        canvasImageRenderingValue = "pixelated";
        }

        canvas = document.createElement('canvas');
        canvas.id = "wmsx-screen-canvas";
        canvas.tabIndex = "-1";               // Make it focusable
        fsElement.appendChild(canvas);

        updateCanvasContentSize();

        window.addEventListener("orientationchange", function() {
            setTimeout(readjustAll, 300);
        });
    }

    function setupTouchControls() {
        if (!wmsx.Util.isTouchDevice()) return;

        var group = document.createElement('div');
        group.id = "wmsx-touch-left";
        fsElement.appendChild(group);

        touchDir =  createControl(group, "wmsx-touch-dir");

        group = document.createElement('div');
        group.id = "wmsx-touch-right";
        fsElement.appendChild(group);

        touchButY = createControl(group, "wmsx-touch-y", "wmsx-touch-button");
        touchButB = createControl(group, "wmsx-touch-b", "wmsx-touch-button");
        touchButA = createControl(group, "wmsx-touch-a", "wmsx-touch-button");
        touchButX = createControl(group, "wmsx-touch-x", "wmsx-touch-button");

        function createControl(group, id, cla) {
            var but = document.createElement('div');
            but.id = id;
            but.classList.add("wmsx-touch-control");
            if (cla) but.classList.add(cla);
            group.appendChild(but);
            return but;
        }
    }

    function getTouchControlElements() {
        return { TDIR: touchDir, TB_A: touchButA, TB_B: touchButB, TB_X: touchButX, TB_Y: touchButY };
    }

    function setupVirtualKeyboard() {
        virtualKeyboardElement = document.createElement('div');
        virtualKeyboardElement.id = "wmsx-virtual-keyboard";
        fsElement.appendChild(virtualKeyboardElement);
        virtualKeyboard = new wmsx.DOMVirtualKeyboard(virtualKeyboardElement, controllersHub.getKeyboard());
    }

    function setupBar() {
        buttonsBar = document.createElement('div');
        buttonsBar.id = "wmsx-bar";
        fsElement.appendChild(buttonsBar);
        buttonsBarInner = document.createElement('div');
        buttonsBarInner.id = "wmsx-bar-inner";
        buttonsBar.appendChild(buttonsBarInner);

        if (BAR_AUTO_HIDE) {
            document.documentElement.classList.add("wmsx-bar-auto-hide");
            mainElement.addEventListener("mouseleave", hideBar);
            hideBar();
        }

        var menu = [
            { label: "Power",              clickModif: 0, control: wmsx.PeripheralControls.MACHINE_POWER_TOGGLE },
            { label: "Reset",              clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_RESET },
            { label: "",                   divider: true },
            { label: "Load State File",    clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.MACHINE_LOAD_STATE_FILE },
            { label: "Save State File",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.MACHINE_SAVE_STATE_FILE, disabled: true }
        ];
        menu.menuTitle = "System";
        powerButton = addPeripheralControlButton(6, 3, 24, 23, -120, -29, "System Power", null, menu);

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
        diskAButton = addPeripheralControlButton(44, 3, 24, 23, -237, -54, "Disk A:", null, menu);

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
        diskBButton = addPeripheralControlButton(43 + 26, 3, 24, 23, -266, -54, "Disk B:", null, menu);

        menu = [
            { label: "Load from File",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE },
            { label: "Load Data",          clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, disabled: true },
            { label: "Save Data",          clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, disabled: true }
        ];
        menu.menuTitle = "Cartridge 1";
        cartridge1Button = addPeripheralControlButton(43 + 26 * 2, 3, 24, 23, -150, -54, "Cartridge 1", null, menu);

        menu = [
            { label: "Load from File",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, secSlot: true },
            { label: "Load Data",          clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, secSlot: true, disabled: true },
            { label: "Save Data",          clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, secSlot: true, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, secSlot: true, disabled: true }
        ];
        menu.menuTitle = "Cartridge 2";
        cartridge2Button = addPeripheralControlButton(44 + 26 * 3, 3, 24, 23, -179, -54, "Cartridge 2", null, menu);

        menu = [
            { label: "Load form File", clickModif: 0, control: wmsx.PeripheralControls.TAPE_LOAD_FILE },
            { label: "New Blank Tape", clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_EMPTY },
            { label: "Rewind Tape",                control: wmsx.PeripheralControls.TAPE_REWIND, disabled: true },
            { label: "Run Program",    clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_AUTO_RUN, disabled: true },
            { label: "Save Tape File", clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_SAVE_FILE, disabled: true },
            { label: "Remove Tape",    clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE, disabled: true }
        ];
        menu.menuTitle = "Cassette Tape";
        tapeButton = addPeripheralControlButton(45 + 26 * 4, 3, 24, 23, -208, -54, "Cassette Tape", null, menu);

        var fsGap = 23;
        if (!WMSX.SCREEN_FULLSCREEN_DISABLED) {
            fullscreenButton = addPeripheralControlButton(-53, 3, 24, 22, -71, -4, "Full Screen", wmsx.PeripheralControls.SCREEN_FULLSCREEN);
            fsGap = 0;
        }
        if (!WMSX.SCREEN_RESIZE_DISABLED) {
            scaleDownButton = addPeripheralControlButton(-92 + fsGap, 3, 18, 22, -26, -4, "Decrease Screen", wmsx.PeripheralControls.SCREEN_SCALE_MINUS);
            scaleDownButton.classList.add("wmsx-full-screen-hidden");
            scaleUpButton = addPeripheralControlButton(-74 + fsGap, 3, 21, 22, -48, -4, "Increase Screen", wmsx.PeripheralControls.SCREEN_SCALE_PLUS);
            scaleUpButton.classList.add("wmsx-full-screen-hidden");
        }

        logoButton = addPeripheralControlButton("CENTER", 5, 51, 19, -10, -28, "About WebMSX", wmsx.PeripheralControls.SCREEN_TOGGLE_VIRTUAL_KEYBOARD);  // TODO Restore wmsx.PeripheralControls.SCREEN_OPEN_ABOUT);
        logoButton.classList.add("wmsx-narrow-hidden");

        menu = createSettingsMenuOptions();
        menu.menuTitle = "Settings";
        settingsButton = addPeripheralControlButton(-29, 3, 24, 22, -96, -4, "Settings", null, menu);

        // Mouse buttons perform the various actions
        buttonsBar.addEventListener("mousedown", peripheralControlButtonMouseDown);
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
        menu.push({ label: "Help & Settings", clickModif: 0, control: wmsx.PeripheralControls.SCREEN_OPEN_SETTINGS });
        menu.push({ label: "Defaults",                       control: wmsx.PeripheralControls.SCREEN_DEFAULTS });
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

    function addPeripheralControlButton(x, y, w, h, bx, by, tooltip, control, menu) {
        var but = addBarButton(x, y, w, h, bx, by, tooltip);
        but.style.cursor = "pointer";
        but.wmsxMenu = menu;
        but.wmsxControl = control;

        // Mouse hover switch menus if already open
        but.addEventListener("mouseenter", peripheralControlButtonMouseEnter);

        return but;
    }

    function addBarButton(x, y, w, h, bx, by, tooltip) {
        var but = document.createElement('div');
        but.style.position = "absolute";
        if (x === "CENTER") {
            but.style.left = but.style.right = 0;
            but.style.margin = "0 auto";
            but.wmsxMidLeft = but.wmsxMidRight = null;
        } else if (x > 0) {
            but.style.left = "" + x + "px";
            but.wmsxMidLeft = (x + w/2) | 0;
        } else {
            but.style.right = "" + (-w - x) + "px";
            but.wmsxMidRight = (-x - w/2) | 0;
        }
        if (y > 0) but.style.top = "" + y + "px"; else but.style.bottom = "" + (-h - y) + "px";
        but.style.width = "" + w + "px";
        but.style.height = "" + h + "px";

        if ((typeof bx) === "number") {
            but.style.backgroundImage = 'url("' + wmsx.Images.urls.sprites + '")';
            but.style.backgroundPosition = "" + bx + "px " + by + "px";
            but.style.backgroundRepeat = "no-repeat";
            but.style.backgroundSize = "296px 81px";
            but.wmsxBX = bx; but.wmsxBY = by;
        }

        if (tooltip) but.title = tooltip;

        buttonsBarInner.appendChild(but);

        //but.style.boxSizing = "border-box";
        //but.style.backgroundOrigin = "border-box";
        //but.style.border = "1px solid yellow";

        return but;
    }

    function peripheralControlButtonMouseDown(e) {
        e.stopPropagation();
        e.preventDefault();
        var prevActiveMenu = barMenuActive;
        hideBarMenu();

        // Single option, only left click
        if (e.target.wmsxControl) {
            if (e.button === 0) peripheralControls.controlActivated(e.target.wmsxControl);
            return;
        }

        var menu = e.target.wmsxMenu;
        if (!menu) return;

        var modifs = 0 | (e.altKey && KEY_ALT_MASK) | (e.ctrlKey && KEY_CTRL_MASK) | (e.shiftKey && KEY_SHIFT_MASK);

        // Open/close menu with left-click if no modifiers
        if (modifs === 0 && e.button === 0) {
            if (prevActiveMenu !== menu) showBarMenu(menu, e.target, false);
            return;
        }

        // Modifier options for left, middle or right click
        for (var i = 0; i < menu.length; ++i)
            if (menu[i].clickModif === modifs) peripheralControls.controlActivated(menu[i].control, e.button === 1, menu[i].secSlot);  // altPower for middleClick
    }

    function peripheralControlButtonMouseEnter(e) {
        if (barMenuActive && e.target.wmsxMenu) showBarMenu(e.target.wmsxMenu, e.target, true);
    }

    function setupLogo() {
        logoImage = new Image();
        logoImage.id = "wmsx-logo";
        logoImage.isLoaded = false;
        logoImage.draggable = false;
        fsElement.appendChild(logoImage);

        logoImage.ondragstart = function(e) {
            e.preventDefault();
            return false;
        };

        logoImage.onload = function() {
            logoImage.isLoaded = true;
            updateLogo();
        };
        logoImage.src = wmsx.Images.urls.logo;
    }

    function setupLoadingIcon() {
        loadingImage = new Image();
        loadingImage.id = "wmsx-loading-icon";
        loadingImage.isLoaded = false;
        loadingImage.draggable = false;
        fsElement.appendChild(loadingImage);

        loadingImage.ondragstart = function(e) {
            e.preventDefault();
            return false;
        };

        loadingImage.onload = function() {
            loadingImage.isLoaded = true;
            updateLoading();
        };
        loadingImage.src = wmsx.Images.urls.loading;
    }

    function setupOSD() {
        osd = document.createElement('div');
        osd.id = "wmsx-osd";
        fsElement.appendChild(osd);
    }

    function setupCopyTextArea() {
        copyTextArea = document.createElement("textarea");
        copyTextArea.id = "wmsx-copy-texarea";
        mainElement.appendChild(copyTextArea);
    }

    function setupFullscreenMethod() {
        if (WMSX.SCREEN_FULLSCREEN_DISABLED) return;

        fullscreenAPIEnterMethod = fsElement.requestFullscreen || fsElement.webkitRequestFullscreen || fsElement.webkitRequestFullScreen || fsElement.mozRequestFullScreen || fsElement.msRequestFullscreen;
        fullScreenAPIExitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;

        // Prevent gestures, scroll, zoom in fullscreen
        if (!fullscreenAPIEnterMethod) {
            fsElement.addEventListener("touchmove", function preventTouchMoveInFullscreen(e) {
                if (!isFullscreen) return;
                e.preventDefault();
                return false;
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
        if (refElement && (refElement.wmsxMidLeft || refElement.wmsxMidRight)) {
            var p;
            if (refElement.wmsxMidLeft) {
                p = (refElement.wmsxMidLeft - wmsx.ScreenGUI.BAR_MENU_WIDTH / 2) | 0;
                if (p < 0) p = 0;
                barMenu.style.left = "" + p + "px";
                barMenu.style.right = "auto";
            } else {
                p = (refElement.wmsxMidRight - wmsx.ScreenGUI.BAR_MENU_WIDTH / 2) | 0;
                if (p < 0) p = 0;
                barMenu.style.right = "" + p + "px";
                barMenu.style.left = "auto";
            }
        } else {
            barMenu.style.left = barMenu.style.right = 0;
        }

        // Show
        barMenuActive = menu;
        barMenu.style.transition = redefine ? "none" : BAR_MENU_TRANSITION;
        barMenu.wmsxTitle.focus();
    }

    function refreshBarMenu(menu) {
        barMenu.wmsxTitle.innerHTML = menu.menuTitle;

        var it = 0;
        var height = wmsx.ScreenGUI.BAR_MENU_ITEM_HEIGHT + 6;      // Title height + borders + padding
        var item;
        var maxShown = Math.min(menu.length, BAR_MENU_MAX_ITEMS);
        for (var op = 0; op < maxShown; ++op) {
            if (menu[op].label !== undefined) {
                item = barMenu.wmsxItems[it];
                item.firstChild.textContent = menu[op].label;
                item.wmsxMenuOption = menu[op];

                if (menu[op].hidden) {
                    item.style.display = "none";
                } else {
                    item.style.display = "block";

                    // Disabled ?
                    if (menu[op].disabled) item.classList.add("wmsx-bar-menu-item-disabled");
                    else item.classList.remove("wmsx-bar-menu-item-disabled");

                    // Divider?
                    if (menu[op].divider) item.classList.add("wmsx-bar-menu-item-divider");
                    else item.classList.remove("wmsx-bar-menu-item-divider");

                    // Toggle option?
                    if (menu[op].toggle !== undefined) {
                        item.classList.add("wmsx-bar-menu-item-toggle");
                        if (menu[op].checked) item.classList.add("wmsx-bar-menu-item-toggle-checked");
                        else item.classList.remove("wmsx-bar-menu-item-toggle-checked");
                    } else {
                        item.classList.remove("wmsx-bar-menu-item-toggle");
                    }

                    height += menu[op].divider ? 3 : wmsx.ScreenGUI.BAR_MENU_ITEM_HEIGHT;
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

        barMenu.style.height = "" + height + "px";
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
            e.stopPropagation();
            e.preventDefault();
            if (e.keyCode === wmsx.DOMKeys.VK_ESCAPE.c) {
                hideBarMenu();
                return false;
            }
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
        // Fire menu item with a left or middle mouse up
        barMenu.addEventListener("mouseup", function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (e.button === 0 || e.button === 1) fireItem(e);
            return false;
        });
        // Block mousedown
        barMenu.addEventListener("mousedown", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        // Hide on lost focus
        barMenu.addEventListener("blur", hideBarMenu, true);
        barMenu.addEventListener("focusout", hideBarMenu, true);

        buttonsBar.appendChild(barMenu);
    }

    function setupCSS() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = wmsx.ScreenGUI.css;
        document.head.appendChild(style);
        delete wmsx.ScreenGUI.css;
    }

    function readjustAll(newAspectX) {
        if (newAspectX) aspectX = newAspectX;

        var winW = fsElement.clientWidth;
        if (isFullscreen) {
            var winH = fsElement.clientHeight;
            monitor.displayScale(aspectX, displayOptimalScaleY(winW, winH));
            updateBarAndKeyboardWidth(winH > winW, winW);
        } else {
            monitor.displayScale(aspectX, WMSX.SCREEN_DEFAULT_SCALE);
            updateBarAndKeyboardWidth(true, winW);
        }

        self.displayCenter();
        controllersHub.screenReadjustedUpdate();
    }
    this.readjustAll = readjustAll;

    function displayOptimalScaleY(winW, winH) {
        if (winH < winW) {
            // Landscape, ensure lateral margins for the touch controls
            winW -= wmsx.DOMTouchControls.LANDSCAPE_TOTAL_MARGIN;
        }
        var scY = (winH - 4 - wmsx.ScreenGUI.BAR_HEIGHT) / targetHeight;	   	// 4 is a little safety tolerance
        scY -= (scY % wmsx.Monitor.SCALE_STEP);		                            // Round to multiple of the step
        var w = aspectX * scY * targetWidth;
        while (w > winW) {
            scY -= wmsx.Monitor.SCALE_STEP;				                        // Decrease one step
            w = aspectX * scY * targetWidth;
        }
        return scY;
    }


    var monitor;
    var peripheralControls;
    var fileDownloader;
    var controllersHub;
    var extensionsSocket;
    var machineTypeSocket;
    var controllersSocket;
    var cartridgeSocket;
    var diskDrive;

    var isFullscreen = false;
    var fullscreenAPIEnterMethod, fullScreenAPIExitMethod;
    var viewportTag, viewportOriginalContent = null;

    var machineControlsSocket;
    var machineControlsStateReport = {};

    var settingsDialog;
    var diskSelectDialog;
    var machineSelectDialog;
    var pasteDialog;
    var copyTextArea;

    var fsElement;

    var canvas;
    var canvasContext;
    var canvasImageRenderingValue;

    var touchDir, touchButA, touchButB, touchButX, touchButY;

    var virtualKeyboardActive = false;
    var virtualKeyboardElement, virtualKeyboard;

    var buttonsBar, buttonsBarInner;

    var barMenu;
    var barMenuActive = null;

    var osd;
    var osdTimeout;
    var osdShowing = false;

    var cursorType = "auto";
    var cursorShowing = true;
    var cursorHideFrameCountdown = -1;
    var signalIsOn = false;
    var crtFilter = 1;
    var crtMode = 1;
    var debugMode = false;
    var isLoading = false;

    var aspectX = 1;
    var scaleY = 1;
    var pixelWidth = 1, pixelHeight = 1;

    var mousePointerLocked = false;

    var targetWidth = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
    var targetHeight = WMSX.MACHINES_CONFIG[WMSX.MACHINE].type === 1
        ? wmsx.VDP.SIGNAL_HEIGHT_V9918 * 2
        : wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938;


    var logoImage;
    var loadingImage;

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

    var mediaButtonBackYOffsets = [ -54, -29, -4 ];

    var OSD_TIME = 3000;
    var CURSOR_HIDE_FRAMES = 150;

    var BAR_AUTO_HIDE = WMSX.SCREEN_CONTROL_BAR === 1;
    var BAR_MENU_MAX_ITEMS = Math.max(10, Object.keys(WMSX.EXTENSIONS_CONFIG).length + 1 + 3);
    var BAR_MENU_TRANSITION = "height 0.12s linear";

    var VIRT_KEYBOARD_WIDTH = 520;

    var NARROW_WIDTH = 450;

    var KEY_CTRL_MASK  =  32;
    var KEY_ALT_MASK   =  64;
    var KEY_SHIFT_MASK =  128;


    init();

    this.eval = function(str) {
        return eval(str);
    };

};


