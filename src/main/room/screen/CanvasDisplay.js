// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CanvasDisplay = function(mainElement) {
    var self = this;

    function init() {
        setupMain();
        setupOSD();
        setupBar();
        setupLogo();
        setupLoadingIcon();
        monitor = new wmsx.Monitor(self);
    }

    this.connect = function(pVideoSignal, pMachineControlsSocket, pExtensionsSocket, pCartridgeSocket, pControllersSocket) {
        monitor.connect(pVideoSignal);
        machineControlsSocket = pMachineControlsSocket;
        controllersSocket = pControllersSocket;
        cartridgeSocket = pCartridgeSocket;
        extensionsSocket = pExtensionsSocket;
    };

    this.connectPeripherals = function(fileLoader, pFileDownloader, pPeripheralControls, pControllersHub) {
        fileLoader.registerForDnD(mainElement);
        fileLoader.registerForFileInputElement(mainElement);
        fileDownloader = pFileDownloader;
        fileDownloader.registerForDownloadElement(mainElement);
        peripheralControls = pPeripheralControls;
        controllersHub = pControllersHub;
        controllersHub.setKeyInputElement(mainElement);
        controllersHub.setMouseInputElement(fsElement);
    };

    this.powerOn = function() {
        this.crtFilterSetDefault();
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
        if (!settingsDialog) settingsDialog = new wmsx.SettingsDialog();
        if (pasteDialog) pasteDialog.hide();
        settingsDialog.show(page);
    };

    this.openLoadFileDialog = function() {
        peripheralControls.controlActivated(wmsx.PeripheralControls.ALL_LOAD_FILE);
        return false;
    };

    this.executeTextCopy = function() {
        if (!signalIsOn) return this.showOSD("Screen Text Copy available only when Power is ON!", true);

        if (!document.queryCommandSupported || !document.queryCommandSupported('copy'))
            return this.showOSD("Copy to Clipboard not supported by browser!", true);

        var text = monitor.getScreenText();

        if (!text) return this.showOSD("Sreen Text Copy not available in this Screen!", true);

        if (!copyTextArea) setupCopyTextArea();
        copyTextArea.innerHTML = text;
        copyTextArea.select();

        if (document.execCommand("copy"))
            this.showOSD("Screen text copied to Clibpoard", true);
        else
            this.showOSD("Copy to Clipboard not supported by browser!", true);
    };

    this.toggleTextPasteDialog = function() {
        if (!signalIsOn) return this.showOSD("Text Paste available only when Power is ON!", true);

        if (!pasteDialog) pasteDialog = new wmsx.PasteDialog(fsElement, this);
        pasteDialog.toggle();
        return false;
    };

    this.captureScreen = function() {
        if (!signalIsOn) return;
        fileDownloader.startDownloadURL("WMSX Screen", canvas.toDataURL('image/png'), "Screen Capture");
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

    this.displayOptimalScaleY = function(aspectX) {
        if (isFullscreen) {
            // Maximum size
            var winW = fsElement.clientWidth;
            var winH = fsElement.clientHeight;
            var scY = (winH - 10) / targetHeight;	         	// 10 is a little safety tolerance
            scY -= (scY % wmsx.Monitor.SCALE_STEP);		        // Round to multiple of the step
            var w = aspectX * scY * targetWidth;
            while (w > winW) {
                scY -= wmsx.Monitor.SCALE_STEP;				    // Decrease one step
                w = aspectX * scY * targetWidth;
            }
            return scY;
        } else {
            // Default window size
            return WMSX.SCREEN_DEFAULT_SCALE;
        }
    };

    this.displayScale = function(pAspectX, pScaleY) {
        aspectX = pAspectX;
        scaleY = pScaleY;
        updateScale();

        if (controllersHub) controllersHub.setScreenPixelScale(pixelWidth * scaleY * aspectX, pixelHeight * scaleY);
    };

    this.displayMinimumSize = function(width, height) {
    };

    this.displayCenter = function() {
        this.focus();
    };

    this.getMonitor = function() {
        return monitor;
    };

    this.showOSD = function(message, overlap) {
        //Util.log(message);
        if (osdTimeout) clearTimeout(osdTimeout);
        if (!message) {
            osd.style.transition = "all 0.15s linear";
            osd.style.top = "-29px";
            osd.style.opacity = 0;
            osdShowing = false;
            return;
        }
        if (overlap || !osdShowing) osd.innerHTML = message;
        osd.style.transition = "none";
        osd.style.top = "15px";
        osd.style.opacity = 1;
        osdShowing = true;
        osdTimeout = setTimeout(function() {
            osd.style.transition = "all 0.15s linear";
            osd.style.top = "-29px";
            osd.style.opacity = 0;
            osdShowing = false;
        }, OSD_TIME);
    };

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

        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
            if (fsElement.requestFullscreen)
                fsElement.requestFullscreen();
            else if (fsElement.webkitRequestFullscreen)
                fsElement.webkitRequestFullscreen();
            else if (fsElement.webkitRequestFullScreen)
                fsElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            else if (fsElement.mozRequestFullScreen)
                fsElement.mozRequestFullScreen();
            else if (fsElement.msRequestFullscreen)
                fsElement.msRequestFullscreen();
            else
                this.showOSD("Fullscreen is not supported by your browser!");
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    this.focus = function() {
        canvas.focus();
    };

    this.powerStateUpdate = function(power) {
        powerButton.style.backgroundPositionY = "" + (mediaButtonBackYOffsets[power ? 2 : 1]) + "px";
        powerButton.wmsxMenu[1].disabled = powerButton.wmsxMenu[4].disabled = !power;
    };

    this.diskDrivesStateUpdate = function(diskAName, diskAMotor, diskBName, diskBMotor) {
        diskAButton.title = "Disk A" + ( diskAName ? ": " + diskAName : "" );
        diskBButton.title = "Disk B" + ( diskBName ? ": " + diskBName : "" );
        diskAButton.style.backgroundPositionY = "" + (mediaButtonBackYOffsets[(diskAMotor ? 2 : ( diskAName ? 1 : 0 ))]) + "px";
        diskBButton.style.backgroundPositionY = "" + (mediaButtonBackYOffsets[(diskBMotor ? 2 : ( diskBName ? 1 : 0 ))]) + "px";
        diskAButton.wmsxMenu[6].disabled = diskAButton.wmsxMenu[7].disabled = !diskAName;
        diskBButton.wmsxMenu[6].disabled = diskBButton.wmsxMenu[7].disabled = !diskBName;
    };

    this.extensionsAndCartridgesStateUpdate = function() {
        var cart1 = cartridgeSocket.inserted(0);
        var cart2 = cartridgeSocket.inserted(1);
        cartridge1Button.title = "Cartridge 1" + ( cart1 ? ": " + (cart1.rom.source || "<Unknown>") : "" );
        cartridge2Button.title = "Cartridge 2" + ( cart2 ? ": " + (cart2.rom.source || "<Unknown>") : "" );
        cartridge1Button.style.backgroundPositionY = "" + (mediaButtonBackYOffsets[(cart1 ? 1 : 0)]) + "px";
        cartridge2Button.style.backgroundPositionY = "" + (mediaButtonBackYOffsets[(cart2 ? 1 : 0)]) + "px";
        var dataDesc = cart1 && cart1.getDataDesc();
        cartridge1Button.wmsxMenu[2].disabled = cartridge1Button.wmsxMenu[3].disabled = !dataDesc;
        cartridge1Button.wmsxMenu[2].label = "Load " + (dataDesc || "Memory");
        cartridge1Button.wmsxMenu[3].label = "Save " + (dataDesc || "Memory");
        cartridge1Button.wmsxMenu[4].disabled = !cart1;
        dataDesc = cart2 && cart2.getDataDesc();
        cartridge2Button.wmsxMenu[2].disabled = cartridge2Button.wmsxMenu[3].disabled = !dataDesc;
        cartridge2Button.wmsxMenu[2].label = "Load " + (dataDesc || "Memory");
        cartridge2Button.wmsxMenu[3].label = "Save " + (dataDesc || "Memory");
        cartridge2Button.wmsxMenu[4].disabled = !cart2;
        refreshSettingsMenuOptions();
    };

    this.tapeStateUpdate = function(name, motor) {
        tapeButton.title = "Cassette Tape" + ( name ? ": " + name : "" );
        tapeButton.style.backgroundPositionY = "" + (mediaButtonBackYOffsets[motor ? 2 : ( name ? 1 : 0 )]) + "px";
        tapeButton.wmsxMenu[3].disabled = tapeButton.wmsxMenu[4].disabled = tapeButton.wmsxMenu[5].disabled = tapeButton.wmsxMenu[6].disabled = !name;
    };

    this.controlsStatesRedefined = function () {
        machineControlsSocket.controlsStateReport(machineControlsStateReport);
        this.powerStateUpdate(machineControlsStateReport[wmsx.MachineControls.POWER]);
    };

    this.loading = function(state) {
        isLoading = state;
        updateLogo();
        if (!state) {
            machineControlsSocket.addRedefinitionListener(this);
            extensionsSocket.addExtensionsAndCartridgesStateListener(this);
        }
    };

    this.setMouseActiveCursor = function(boo) {
        cursorType = boo ? 'url("' + wmsx.Images.urls.mouseCursor + '") -10 -10, auto' : "auto";
        showCursor(true);
    };

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

    function fullScreenChanged() {
        var fse = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        isFullscreen = !!fse;
        monitor.setDisplayOptimalScale();
        // Schedule another one to give the browser some time to set full screen properly
        if (isFullscreen) setTimeout(monitor.setDisplayOptimalScale, 120);
    }

    function updateScale() {
        var width = Math.round(targetWidth * scaleY * aspectX);
        var height = Math.round(targetHeight * scaleY);
        setElementsSizes(width, height);
    }

    function setElementsSizes(width, height) {
        canvas.style.width = "" + width + "px";
        canvas.style.height = "" + height + "px";
        // Do not change containers sizes while in fullscreen
        if (isFullscreen) return;
        borderElement.style.width = "" + width + "px";
        borderElement.style.height = "" + height + "px";
        width += BORDER_LATERAL * 2;
        height += BORDER_TOP + BORDER_BOTTOM;
        mainElement.style.width = "" + width + "px";
        mainElement.style.height = "" + height + "px";
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
            loadingImage.style.display = "none";
        } else {
            if (pasteDialog) pasteDialog.hide();
            showBar();
            showCursor(true);
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            /* if (logoImage.isLoaded) */ logoImage.style.display = "block";
            if (isLoading /* && loadingImage.isLoaded */) loadingImage.style.display = "block";
            else loadingImage.style.display = "none";
        }
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
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            return false;
        });
    }

    function setupMain() {
        if (!mainElement.style.position || mainElement.style.position === "static" || mainElement.style.position === "initial")
            mainElement.style.position = "relative";
        mainElement.style.overflow = "hidden";
        mainElement.style.outline = "none";
        mainElement.tabIndex = "0";               // Make it focusable
        suppressContextMenu(mainElement);

        mainElement.addEventListener("focusout", lostFocus, true);
        mainElement.addEventListener("blur", lostFocus, true);

        borderElement = document.createElement('div');
        borderElement.id = "wmsx-border";
        borderElement.style.position = "absolute";
        borderElement.style.left = borderElement.style.right = 0;
        borderElement.style.top = 0;
        borderElement.style.margin = "auto";
        borderElement.style.overflow = "hidden";
        borderElement.style.background = "black";
        borderElement.style.border = "0 solid black";
        borderElement.style.borderWidth = "" + BORDER_TOP + "px " + BORDER_LATERAL + "px " + BORDER_BOTTOM + "px";

        fsElement = document.createElement('div');
        fsElement.id = "wmsx-fs";
        fsElement.style.position = "absolute";
        fsElement.style.left = fsElement.style.right = 0;
        fsElement.style.top = fsElement.style.bottom = 0;
        fsElement.style.overflow = "hidden";
        fsElement.style.background = "black";
        suppressContextMenu(fsElement);

        fsElement.addEventListener("mousemove", function() {
            showCursor();
            showBar();
        });

        document.addEventListener("fullscreenchange", fullScreenChanged);
        document.addEventListener("webkitfullscreenchange", fullScreenChanged);
        document.addEventListener("mozfullscreenchange", fullScreenChanged);
        document.addEventListener("msfullscreenchange", fullScreenChanged);

        borderElement.appendChild(fsElement);

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
        canvas.id = "wmsx-canvas";
        canvas.style.position = "absolute";
        canvas.style.display = "block";
        canvas.style.left = canvas.style.right = 0;
        canvas.style.top = canvas.style.bottom = 0;
        canvas.style.background = "black";
        canvas.style.margin = "auto";
        canvas.tabIndex = "-1";               // Make it focusable
        canvas.style.outline = "none";
        canvas.style.border = "none";
        fsElement.appendChild(canvas);
        mainElement.appendChild(borderElement);

        updateCanvasContentSize();
    }

    function setupBar() {
        buttonsBar = document.createElement('div');
        buttonsBar.id = "wmsx-bar";
        buttonsBar.style.position = "absolute";
        buttonsBar.style.left = 0;
        buttonsBar.style.right = 0;
        buttonsBar.style.zIndex = 30;
        buttonsBar.style.height = "" + BAR_HEIGHT + "px";
        buttonsBar.style.background = "rgb(40, 40, 40)";
        buttonsBar.style.border = "1px solid black";
        buttonsBar.style.bottom = "0";
        if (BAR_AUTO_HIDE) {
            hideBar();
            buttonsBar.style.transition = "bottom 0.3s ease-in-out";
            mainElement.addEventListener("mouseleave", function() {
                hideBar();
            });
        }

        var menu = [
            { label: "Power",              clickModif: 0, control: wmsx.PeripheralControls.MACHINE_POWER_TOGGLE },
            { label: "Reset",              clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_RESET },
            { label: "",                   divider: true },
            { label: "Load State File",    clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.MACHINE_LOAD_STATE_FILE },
            { label: "Save State File",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.MACHINE_SAVE_STATE_FILE, disabled: true },
        ];
        menu.menuTitle = "System";
        powerButton = addPeripheralControlButton(6, -26, 24, 23, -120, -29, "System Power", null, menu);

        menu = [
            { label: "Load Disk File",     clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILE },
            { label: "Load Disk URL",      clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISK_LOAD_URL },
            { label: "Load Files as Disk",             control: wmsx.PeripheralControls.DISK_LOAD_FILES },
            { label: "Load ZIP as Disk",               control: wmsx.PeripheralControls.DISK_LOAD_ZIP },
            { label: "New 720KB Disk",                 control: wmsx.PeripheralControls.DISK_EMPTY_720 },
            { label: "New 360KB Disk",                 control: wmsx.PeripheralControls.DISK_EMPTY_360 },
            { label: "Save Disk File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, disabled: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, disabled: true },
            {                              clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY }
        ];
        menu.menuTitle = "Drive A:";
        diskAButton = addPeripheralControlButton(44, -26, 24, 23, -237, -54, "Disk A", null, menu);

        menu = [
            { label: "Load Disk File",     clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILE, secSlot: true },
            { label: "Load Disk URL",      clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISK_LOAD_URL, secSlot: true },
            { label: "Load Files as Disk",             control: wmsx.PeripheralControls.DISK_LOAD_FILES, secSlot: true },
            { label: "Load ZIP as Disk",               control: wmsx.PeripheralControls.DISK_LOAD_ZIP, secSlot: true },
            { label: "New 720KB Disk",                 control: wmsx.PeripheralControls.DISK_EMPTY_720, secSlot: true },
            { label: "New 360KB Disk",                 control: wmsx.PeripheralControls.DISK_EMPTY_360, secSlot: true },
            { label: "Save Disk File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, secSlot: true, disabled: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, secSlot: true, disabled: true },
            {                              clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY, secSlot: true }
        ];
        menu.menuTitle = "Drive B:";
        diskBButton = addPeripheralControlButton(43 + 26, -26, 24, 23, -266, -54, "Disk B", null, menu);

        menu = [
            { label: "Load ROM File",      clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE },
            { label: "Load ROM URL",       clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_URL },
            { label: "Load Memory",        clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, disabled: true },
            { label: "Save Memory",        clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, disabled: true }
        ];
        menu.menuTitle = "Cartridge 1";
        cartridge1Button = addPeripheralControlButton(43 + 26 * 2, -26, 24, 23, -150, -54, "Cartridge 1", null, menu);

        menu = [
            { label: "Load ROM File",      clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, secSlot: true },
            { label: "Load ROM URL",       clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_URL, secSlot: true },
            { label: "Load Memory",        clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, secSlot: true, disabled: true },
            { label: "Save Memory",        clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, secSlot: true, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, secSlot: true, disabled: true }
        ];
        menu.menuTitle = "Cartridge 2";
        cartridge2Button = addPeripheralControlButton(44 + 26 * 3, -26, 24, 23, -179, -54, "Cartridge 2", null, menu);

        menu = [
            { label: "Load Tape File", clickModif: 0, control: wmsx.PeripheralControls.TAPE_LOAD_FILE },
            { label: "Load Tape URL",  clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.TAPE_LOAD_URL },
            { label: "New Empty Tape", clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_EMPTY },
            { label: "Rewind Tape",                control: wmsx.PeripheralControls.TAPE_REWIND, disabled: true },
            { label: "Run Program",    clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_AUTO_RUN, disabled: true },
            { label: "Save Tape File", clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_SAVE_FILE, disabled: true },
            { label: "Remove Tape",    clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE, disabled: true },
        ];
        menu.menuTitle = "Cassette Tape";
        tapeButton = addPeripheralControlButton(45 + 26 * 4, -26, 24, 23, -208, -54, "Cassette Tape", null, menu);

        var fsGap = 23;
        if (!WMSX.SCREEN_FULLSCREEN_DISABLED) {
            fullscreenButton = addPeripheralControlButton(-53, -26, 24, 22, -71, -4, "Full Screen", wmsx.PeripheralControls.SCREEN_FULLSCREEN);
            fsGap = 0;
        }
        if (!WMSX.SCREEN_RESIZE_DISABLED) {
            scaleDownButton = addPeripheralControlButton(-92 + fsGap, -26, 18, 22, -26, -4, "Decrease Screen", wmsx.PeripheralControls.SCREEN_SCALE_MINUS);
            scaleUpButton = addPeripheralControlButton(-74 + fsGap, -26, 21, 22, -48, -4, "Increase Screen", wmsx.PeripheralControls.SCREEN_SCALE_PLUS);
        }

        logoButton = addPeripheralControlButton("CENTER", -23, 51, 19, -38, -35, "About WebMSX", wmsx.PeripheralControls.SCREEN_OPEN_ABOUT);

        menu = [];     // Will be populated later
        menu.menuTitle = "Settings";
        settingsButton = addPeripheralControlButton(-29, -26, 24, 22, -96, -4, "Settings", null, menu);

        // Mouse buttons perform the various actions
        buttonsBar.addEventListener("mousedown", peripheralControlButtonMouseDown);

        mainElement.appendChild(buttonsBar);
    }

    function createSettingsMenuOptions() {
        var menu = settingsButton.wmsxMenu;
        menu.length = 0;
        var extConfig = WMSX.EXTENSIONS_CONFIG;
        for (var ext in extConfig) {
            var conf = extConfig[ext];
            if (conf.desc) {            // Only show extensions with descriptions
                var opt = { label: conf.desc, extension: ext, toggle: true, checked: false };
                menu.push(opt);
            }
        }
        menu.push({ label: "",            divider: true });
        menu.push({ label: "Help Screen", clickModif: 0, control: wmsx.PeripheralControls.SCREEN_OPEN_SETTINGS });
        menu.push({ label: "Defaults",                   control: wmsx.PeripheralControls.SCREEN_DEFAULTS });
    }

    function refreshSettingsMenuOptions() {
        var menu = settingsButton.wmsxMenu;
        if (menu.length === 0) createSettingsMenuOptions();
        for (var i = 0; i < menu.length; ++i) {
            var opt = menu[i];
            if (opt.extension) opt.checked = extensionsSocket.isActiveAnySlot(opt.extension);
        }
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
        but.style.outline = "none";

        if ((typeof bx) === "number") {
            but.style.backgroundImage = 'url("' + wmsx.Images.urls.sprites + '")';
            but.style.backgroundPosition = "" + bx + "px " + by + "px";
            but.style.backgroundRepeat = "no-repeat";
        }

        if (tooltip) but.title = tooltip;

        buttonsBar.appendChild(but);

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

        // Open menu with left-click if no modifiers
        if (modifs === 0 && e.button === 0 && prevActiveMenu !== menu) {
            showBarMenu(menu, e.target, false);
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
        logoImage.style.position = "absolute";
        logoImage.style.display = "none";
        logoImage.style.top = 0;
        logoImage.style.bottom = 0;
        logoImage.style.left = 0;
        logoImage.style.right = 0;
        logoImage.style.maxWidth = "60%";
        logoImage.style.margin = "auto auto";

        logoImage.style.userSelect = "none";
        logoImage.style.webkitUserSelect = "none";
        logoImage.style.MozUserSelect = "none";
        logoImage.style.msUserSelect = "none";

        logoImage.ondragstart = function(e) {
            e.preventDefault();
            return false;
        };

        fsElement.appendChild(logoImage);

        logoImage.onload = function() {
            logoImage.isLoaded = true;
            updateLogo();
        };
        logoImage.src = wmsx.Images.urls.logo;
    }

    function setupLoadingIcon() {
        loadingImage = new Image();
        loadingImage.isLoaded = false;
        loadingImage.draggable = false;
        loadingImage.style.position = "absolute";
        loadingImage.style.display = "none";
        loadingImage.style.top = "67%";
        loadingImage.style.left = 0;
        loadingImage.style.right = 0;
        loadingImage.style.maxWidth = "12%";
        loadingImage.style.margin = "auto auto";

        loadingImage.style.userSelect = "none";
        loadingImage.style.webkitUserSelect = "none";
        loadingImage.style.MozUserSelect = "none";
        loadingImage.style.msUserSelect = "none";

        loadingImage.ondragstart = function(e) {
            e.preventDefault();
            return false;
        };

        fsElement.appendChild(loadingImage);

        loadingImage.onload = function() {
            loadingImage.isLoaded = true;
            updateLogo();
        };
        loadingImage.src = wmsx.Images.urls.loading;
    }

    function setupOSD() {
        osd = document.createElement('div');
        osd.id = "wmsx-osd";
        osd.style.position = "absolute";
        osd.style.overflow = "hidden";
        osd.style.top = "-29px";
        osd.style.right = "18px";
        osd.style.height = "29px";
        osd.style.padding = "0 12px";
        osd.style.margin = "0";
        osd.style.font = 'bold 15px/29px sans-serif';
        osd.style.color = "rgb(0, 255, 0)";
        osd.style.background = "rgba(0, 0, 0, 0.6)";
        osd.style.opacity = 0;
        osd.style.userSelect = "none";
        osd.style.webkitUserSelect = "none";
        osd.style.MozUserSelect = "none";
        osd.style.msUserSelect = "none";
        osd.innerHTML = "";
        fsElement.appendChild(osd);
    }

    function setupCopyTextArea() {
        copyTextArea = document.createElement("textarea");
        copyTextArea.id = "wmsx-copy-texarea";
        copyTextArea.style.position = "absolute";
        copyTextArea.style.width = "50px";
        copyTextArea.style.height = "20px";
        copyTextArea.style.bottom = "-100px";
        mainElement.appendChild(copyTextArea);
    }

    function showBar() {
        if (BAR_AUTO_HIDE && !mousePointerLocked) buttonsBar.style.bottom = "0px";
    }

    function hideBar() {
        if (BAR_AUTO_HIDE && !barMenuActive) {
            hideBarMenu();
            buttonsBar.style.bottom = "-" + (BAR_HEIGHT + 2) + "px";
        }
    }

    function showBarMenu(menu, refElement, redefine) {
        if (barMenuActive && !redefine) return;
        if (!menu) return;

        if (!barMenu) {
            setupBarMenu();
            window.setTimeout(function() {
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
                p = (refElement.wmsxMidLeft - BAR_MENU_WIDTH / 2) | 0;
                if (p < 0) p = 0;
                barMenu.style.left = "" + p + "px";
                barMenu.style.right = "auto";
            } else {
                p = (refElement.wmsxMidRight - BAR_MENU_WIDTH / 2) | 0;
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
        var height = BAR_MENU_ITEM_HEIGHT + 4;
        var item;
        var maxShown = Math.min(menu.length, BAR_MENU_MAX_ITEMS);
        for (var op = 0; op < maxShown; ++op) {
            if (menu[op].label !== undefined) {
                item = barMenu.wmsxItems[it];
                item.firstChild.textContent = menu[op].label;
                item.style.display = "block";
                item.wmsxMenuOption = menu[op];

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

                height += menu[op].divider ? 3 : BAR_MENU_ITEM_HEIGHT;

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
        setupBarMenuCSS();
        var style;

        barMenu = document.createElement('div');
        barMenu.id = "wmsx-bar-menu";
        style = barMenu.style;
        style.position = "absolute";
        style.overflow = "hidden";
        style.height = 0;
        style.bottom = "" + BAR_HEIGHT + "px";
        style.border = "0 solid black";
        style.borderWidth = "0 1px";
        style.background = "rgb(40, 40, 40)";
        style.font = "13px Helvetica, Arial, sans-serif";
        style.outline = "none";
        style.zIndex = 20;

        var title = document.createElement('button');
        title.id = "wmsx-bar-menu-title";
        title.classList.add("wmsx-bar-menu-item");
        style = title.style;
        style.display = "block";
        style.color = "white";
        style.fontWeight = "bold";
        style.border = "0px solid black";
        style.borderWidth = "1px 0";
        style.margin = "0 0 1px";
        style.textAlign = "center";
        style.background = "rgb(70, 70, 70)";
        style.cursor = "auto";
        title.innerHTML = "Menu Title";
        barMenu.appendChild(title);
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
            barMenu.appendChild(item);
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
                if (e.target.wmsxMenuOption.extension) {
                    secSlot = e.shiftKey;
                    extensionsSocket.toggleExtension(e.target.wmsxMenuOption.extension, altPower, secSlot);
                } else if (e.target.wmsxMenuOption.control) {
                    secSlot = e.target.wmsxMenuOption.secSlot;
                    peripheralControls.controlActivated(e.target.wmsxMenuOption.control, altPower, secSlot);
                    hideBarMenu();
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

        mainElement.appendChild(barMenu);
    }

    function setupBarMenuCSS() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '' +'' +
            '.wmsx-bar-menu-item {' +
            '   position: relative;' +
            '   width: ' + BAR_MENU_WIDTH + 'px;' +
            '   height: ' + BAR_MENU_ITEM_HEIGHT + 'px;' +
            '   color: rgb(205, 205, 205);' +
            '   font: inherit;' +
            '   border: none;' +
            '   padding: 0;' +
            '   text-shadow: 1px 1px 1px black;' +
            '   background-color: transparent;' +
            '   outline: none;' +
            '   backface-visibility: hidden;' +
            '   -webkit-backface-visibility: hidden;' +
            '   cursor: pointer; ' +
            '}\n' +
            '.wmsx-bar-menu-item.wmsx-hover:not(.wmsx-bar-menu-item-disabled):not(.wmsx-bar-menu-item-divider) { ' +
            '   color: white;' +
            '   background-color: rgb(220, 32, 26);' +
            '}\n' +
            '.wmsx-bar-menu-item-disabled { ' +
            '   color: rgb(110, 110, 110);' +
            '}\n' +
            '.wmsx-bar-menu-item-divider { ' +
            '   height: 1px;' +
            '   margin: 1px 0;' +
            '   background-color: black;' +
            '}\n' +
            '.wmsx-bar-menu-item-check { ' +
            '   display: none;' +
            '   position: absolute;' +
            '   width: 6px;' +
            '   height: 19px;' +
            '   top: 4px;' +
            '   left: 9px;' +
            '   box-shadow: black 1px 1px 1px;' +
            '}\n' +
            '.wmsx-bar-menu-item-toggle { ' +
            '   text-align: left;' +
            '   padding: 0 0 0 28px;' +
            '}\n' +
            '.wmsx-bar-menu-item-toggle .wmsx-bar-menu-item-check { ' +
            '   display: block;' +
            '   background-color: rgb(70, 70, 70);' +
            '}\n' +
            '.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked { ' +
            '   color: white;' +
            '}\n' +
            '.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked .wmsx-bar-menu-item-check { ' +
            '   background-color: rgb(248, 33, 28);' +
            '}'
        ;
        document.head.appendChild(style);
    }


    var monitor;
    var peripheralControls;
    var fileDownloader;
    var controllersHub;
    var extensionsSocket;
    var controllersSocket;
    var cartridgeSocket;

    var machineControlsSocket;
    var machineControlsStateReport = {};

    var settingsDialog;
    var pasteDialog;
    var copyTextArea;

    var borderElement;
    var fsElement;

    var canvas;
    var canvasContext;
    var canvasImageRenderingValue;

    var buttonsBar;
    var buttonsBarHideTimeout;

    var barMenu;
    var barMenuActive = null;

    var osd;
    var osdTimeout;
    var osdShowing = false;

    var cursorType = "auto";
    var cursorShowing = true;
    var cursorHideFrameCountdown = -1;
    var signalIsOn = false;
    var isFullscreen = false;
    var crtFilter = 1;
    var crtMode = 1;
    var debugMode = false;
    var isLoading = false;

    var aspectX = 1;
    var scaleY = 1;
    var pixelWidth = 1, pixelHeight = 1;

    var mousePointerLocked = false;

    var targetWidth = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
    var targetHeight = WMSX.MACHINE_TYPE === 1
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

    var MOUSE_BUT1_MASK = 1;
    var MOUSE_BUT2_MASK = 2;
    var MOUSE_BUT3_MASK = 4;
    var MOUSE_VOID_MASK = 0xff00;     // Any impossible value

    var KEY_CTRL_MASK  =  32;
    var KEY_ALT_MASK   =  64;
    var KEY_SHIFT_MASK =  128;

    var BAR_HEIGHT = 29;
    var BAR_AUTO_HIDE = WMSX.SCREEN_CONTROL_BAR === 1;

    var BAR_MENU_WIDTH = 136;
    var BAR_MENU_ITEM_HEIGHT = 28;
    var BAR_MENU_MAX_ITEMS = Math.max(10, Object.keys(WMSX.EXTENSIONS_CONFIG).length + 3);
    var BAR_MENU_TRANSITION = "height 0.12s linear";

    var OSD_TIME = 2500;
    var CURSOR_HIDE_FRAMES = 150;

    var BORDER_TOP = 1;
    var BORDER_LATERAL = 1;
    var BORDER_BOTTOM = BAR_AUTO_HIDE ? 1 : BAR_HEIGHT + 2;


    init();

    this.eval = function(str) {
        return eval(str);
    };

};

