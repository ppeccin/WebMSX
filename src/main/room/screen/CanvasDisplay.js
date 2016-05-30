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

    this.connect = function(pVideoSignal, pMachineControlsSocket, pCartridgeSocket, pControllersSocket) {
        monitor.connect(pVideoSignal, pCartridgeSocket);
        machineControlsSocket = pMachineControlsSocket;
        machineControlsSocket.addRedefinitionListener(this);
        pCartridgeSocket.addCartridgesStateListener(this);
        controllersSocket = pControllersSocket;
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
        diskAButton.click();
        return false;
    };

    this.togglePasteDialog = function() {
        if (!signalIsOn) return;
        if (!pasteDialog) pasteDialog = new wmsx.PasteDialog(fsElement, this);
        pasteDialog.toggle();
        return false;
    };

    this.captureScreen = function() {
        if (!signalIsOn) return;
        fileDownloader.startDownloadURL("WMSX Screen", canvas.toDataURL('image/png'));
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
        mediaButtonsState.Power = power ? 2 : 1;
        refreshMediaButtons();
    };

    this.diskDrivesStateUpdate = function(diskAName, diskAMotor, diskBName, diskBMotor) {
        mediaButtonsState.DiskA = diskAMotor ? 2 : ( diskAName ? 1 : 0 );
        mediaButtonsState.DiskB = diskBMotor ? 2 : ( diskBName ? 1 : 0 );
        mediaButtonsDesc.DiskA = "Disk A" + ( diskAName ? ": " + diskAName : "" );
        mediaButtonsDesc.DiskB = "Disk B" + ( diskBName ? ": " + diskBName : "" );
        refreshMediaButtons();
    };

    this.cartridgesStateUpdate = function(cartridge1, cartridge2) {
        mediaButtonsState.Cartridge1 = cartridge1 ? 1 : 0;
        mediaButtonsState.Cartridge2 = cartridge2 ? 1 : 0;
        mediaButtonsDesc.Cartridge1 = "Cartridge 1" + ( cartridge1 ? ": " + (cartridge1.rom.source || "<Unknown>") : "" );
        mediaButtonsDesc.Cartridge2 = "Cartridge 2" + ( cartridge2 ? ": " + (cartridge2.rom.source || "<Unknown>") : "" );
        refreshMediaButtons();
    };

    this.tapeStateUpdate = function(name, motor) {
        mediaButtonsState.Tape = motor ? 2 : ( name ? 1 : 0 );
        mediaButtonsDesc.Tape = "Cassette Tape" + ( name ? ": " + name : "" );
        refreshMediaButtons();
    };

    this.controlsStatesRedefined = function () {
        machineControlsSocket.controlsStateReport(machineControlsStateReport);
        this.powerStateUpdate(machineControlsStateReport[wmsx.MachineControls.POWER]);
    };

    this.loading = function(boo) {
        isLoading = boo;
        updateLogo();
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

        var menuOptions = [
            { label: "Power",           mouseMask: MOUSE_BUT1_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_TOGGLE },
            { label: "Reset",           mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_RESET },
            { label: "Load State File", mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.MACHINE_LOAD_STATE_FILE },
            { label: "Save State File", mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.MACHINE_SAVE_STATE_FILE },
            {                           mouseMask: MOUSE_BUT3_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_RESET }
        ];
        menuOptions.menuTitle = "System";
        powerButton = addPeripheralControlButton(6, -26, 24, 23, -120, -29, "System Power", menuOptions);

        menuOptions = [
            { label: "Load Disk File",     mouseMask: MOUSE_BUT1_MASK, control: wmsx.PeripheralControls.DISKA_LOAD_FILE },
            { label: "Load Disk URL",      mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISKA_LOAD_URL },
            { label: "Load Filas as Disk", mouseMask: MOUSE_VOID_MASK, control: wmsx.PeripheralControls.DISKA_LOAD_FILES },
            { label: "Load ZIP as Disk",   mouseMask: MOUSE_VOID_MASK, control: wmsx.PeripheralControls.DISKA_LOAD_ZIP },
            { label: "New Empty Disk",     mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISKA_EMPTY },
            { label: "Remove Disk",        mouseMask: MOUSE_BUT1_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISKA_REMOVE },
            { label: "Save Disk File",     mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISKA_SAVE_FILE },
            {                              mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISKA_LOAD_FILE_ALT_POWER },
            {                              mouseMask: MOUSE_BUT3_MASK, control: wmsx.PeripheralControls.DISKA_REMOVE }
        ];
        menuOptions.menuTitle = "Drive A:";
        diskAButton = addPeripheralControlButton(44, -26, 24, 23, -150, -53, null, menuOptions);

        menuOptions = [
            { label: "Load Disk File",     mouseMask: MOUSE_BUT1_MASK, control: wmsx.PeripheralControls.DISKB_LOAD_FILE },
            { label: "Load Disk URL",      mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISKB_LOAD_URL },
            { label: "Load Filas as Disk", mouseMask: MOUSE_VOID_MASK, control: wmsx.PeripheralControls.DISKB_LOAD_FILES },
            { label: "Load ZIP as Disk",   mouseMask: MOUSE_VOID_MASK, control: wmsx.PeripheralControls.DISKB_LOAD_ZIP },
            { label: "New Empty Disk",     mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISKB_EMPTY },
            { label: "Remove Disk",        mouseMask: MOUSE_BUT1_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISKB_REMOVE },
            { label: "Save Disk File",     mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISKB_SAVE_FILE },
            {                              mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISKB_LOAD_FILE_ALT_POWER },
            {                              mouseMask: MOUSE_BUT3_MASK, control: wmsx.PeripheralControls.DISKB_REMOVE }
        ];
        menuOptions.menuTitle = "Drive B:";
        diskBButton = addPeripheralControlButton(43 + 26, -26, 24, 23, -150, -53, null, menuOptions);

        menuOptions = [
            { label: "Load ROM File",    mouseMask: MOUSE_BUT1_MASK, control: wmsx.PeripheralControls.CARTRIDGE1_LOAD_FILE },
            { label: "Load ROM URL",     mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE1_LOAD_URL },
            { label: "Remove Cartridge", mouseMask: MOUSE_BUT1_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE1_REMOVE },
            {                            mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE1_LOAD_FILE_ALT_POWER },
            {                            mouseMask: MOUSE_BUT3_MASK, control: wmsx.PeripheralControls.CARTRIDGE1_REMOVE }
        ];
        menuOptions.menuTitle = "Cartridge 1";
        cartridge1Button = addPeripheralControlButton(43 + 26 * 2, -26, 24, 23, -150, -53, null, menuOptions);

        menuOptions = [
            { label: "Load ROM File",    mouseMask: MOUSE_BUT1_MASK, control: wmsx.PeripheralControls.CARTRIDGE2_LOAD_FILE },
            { label: "Load ROM URL",     mouseMask: MOUSE_BUT1_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE2_LOAD_URL },
            { label: "Remove Cartridge", mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK, control: wmsx.PeripheralControls.CARTRIDGE2_REMOVE },
            {                            mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE2_LOAD_FILE_ALT_POWER },
            {                            mouseMask: MOUSE_BUT3_MASK, control: wmsx.PeripheralControls.CARTRIDGE2_REMOVE }
        ];
        menuOptions.menuTitle = "Cartridge 2";
        cartridge2Button = addPeripheralControlButton(44 + 26 * 3, -26, 24, 23, -179, -53, null, menuOptions);

        menuOptions = [
            { label: "Load Tape File", mouseMask: MOUSE_BUT1_MASK, control: wmsx.PeripheralControls.TAPE_LOAD_FILE },
            { label: "Load Tape URL",  mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK, control: wmsx.PeripheralControls.TAPE_LOAD_URL },
            { label: "Rewind Tape",    mouseMask: MOUSE_VOID_MASK, control: wmsx.PeripheralControls.TAPE_REWIND },
            { label: "New Empty Tape", mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_EMPTY },
            { label: "Remove Tape",    mouseMask: MOUSE_BUT1_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE },
            { label: "Run Program",    mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_AUTO_RUN },
            { label: "Save Tape File", mouseMask: MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_SAVE_FILE },
            {                          mouseMask: MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_LOAD_FILE_ALT_POWER },
            {                          mouseMask: MOUSE_BUT3_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE }
        ];
        menuOptions.menuTitle = "Cassette Tape";
        tapeButton = addPeripheralControlButton(45 + 26 * 4, -26, 24, 23, -208, -53, null, menuOptions);

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

        menuOptions = [
            { label: "Help Screen", mouseMask: MOUSE_BUT1_MASK, control: wmsx.PeripheralControls.SCREEN_OPEN_SETTINGS },
            { label: "Defaults",    mouseMask: MOUSE_BUT3_MASK, control: wmsx.PeripheralControls.SCREEN_DEFAULTS }
        ];
        menuOptions.menuTitle = "Options";
        settingsButton  = addPeripheralControlButton(-29, -26, 24, 22, -96, -4, "Options", menuOptions);

        mainElement.appendChild(buttonsBar);
    }

    function refreshMediaButtons() {
        powerButton.style.backgroundPosition =      "-120px " + (mediaButtonBackYOffsets[mediaButtonsState["Power"]]) + "px";
        diskAButton.style.backgroundPosition =      "-237px " + (mediaButtonBackYOffsets[mediaButtonsState["DiskA"]]) + "px";
        diskBButton.style.backgroundPosition =      "-266px " + (mediaButtonBackYOffsets[mediaButtonsState["DiskB"]]) + "px";
        cartridge1Button.style.backgroundPosition = "-150px " + (mediaButtonBackYOffsets[mediaButtonsState["Cartridge1"]]) + "px";
        cartridge2Button.style.backgroundPosition = "-179px " + (mediaButtonBackYOffsets[mediaButtonsState["Cartridge2"]]) + "px";
        tapeButton.style.backgroundPosition =       "-208px " + (mediaButtonBackYOffsets[mediaButtonsState["Tape"]]) + "px";
        diskAButton.title = mediaButtonsDesc["DiskA"];
        diskBButton.title = mediaButtonsDesc["DiskB"];
        cartridge1Button.title = mediaButtonsDesc["Cartridge1"];
        cartridge2Button.title = mediaButtonsDesc["Cartridge2"];
        tapeButton.title = mediaButtonsDesc["Tape"];
    }

    function addBarButton(x, y, w, h, px, py, tooltip) {
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

        if ((typeof px) === "number") {
            but.style.backgroundImage = 'url("' + wmsx.Images.urls.sprites + '")';
            but.style.backgroundPosition = "" + px + "px " + py + "px";
            but.style.backgroundRepeat = "no-repeat";
        }

        if (tooltip) but.title = tooltip;

        buttonsBar.appendChild(but);

        //but.style.boxSizing = "border-box";
        //but.style.backgroundOrigin = "border-box";
        //but.style.border = "1px solid yellow";

        return but;
    }

    function addPeripheralControlButton(x, y, w, h, px, py, tooltip, options) {
        var but = addBarButton(x, y, w, h, px, py, tooltip);

        but.style.cursor = "pointer";

        // We need a separate approach for left button and the others (middle and right).
        // The left click needs to be a "click" as explained below
        // The others use a "mousedown" since a click only fires for the left button on many browsers

        var clickHandler = function (e) {
            e.stopPropagation();
            e.preventDefault();
            hideBarMenu();

            // Single option, only left-click
            if ((typeof options) == "number") {
                if (!e.buttons || e.buttons === MOUSE_BUT1_MASK) peripheralControls.controlActivated(options);
                return;
            }

            // Has menu options, toggle menu with right-click
            if (options.menuTitle && e.buttons === MOUSE_BUT2_MASK) {
                if (barMenuActive) hideBarMenu();
                showBarMenu(options, but, false);
                return;
            }

            // Complex click options
            var mask = (e.buttons || 1) | (e.altKey ? KEY_ALT_MASK : 0) | (e.ctrlKey ? KEY_CTRL_MASK : 0) | (e.shiftKey ? KEY_SHIFT_MASK : 0);
            for (var i = 0; i < options.length; ++i)
                if (options[i].mouseMask === mask) peripheralControls.controlActivated(options[i].control);
        };

        // Left Button: a "click" event and not a "mousedown" is necessary here. Without a click, FF does not open the Open File window
        // TODO Hotkeys for this are also not working in FF since they're not click events!
        but.addEventListener("click", function(e) {
            if (e.which === 1) clickHandler(e);            // :-( Chrome fires this for middle button so we need this ugly check
        });

        // Middle and Right buttons, use mousedown but ignore Left clicks
        but.addEventListener("mousedown", function(e) {
            if (e.which > 1) clickHandler(e);
        });

        // Mouse hover switch menus if already open
        but.addEventListener("mouseenter", function(e) {
            if (barMenuActive && options.menuTitle) showBarMenu(options, but, true);
        });

        return but;
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

    function showBar() {
        if (BAR_AUTO_HIDE && !mousePointerLocked) buttonsBar.style.bottom = "0px";
    }

    function hideBar() {
        if (BAR_AUTO_HIDE && !barMenuActive) {
            hideBarMenu();
            buttonsBar.style.bottom = "-" + (BAR_HEIGHT + 2) + "px";
        }
    }

    function showBarMenu(options, refElement, redefine) {
        if (barMenuActive && !redefine) return;
        if (!options.menuTitle) return;

        if (!barMenu) {
            setupBarMenu();
            window.setTimeout(function() {
                showBarMenu(options, refElement, redefine);
            }, 1);
            return;
        }

        barMenu.wmsxTitle.innerHTML = options.menuTitle;

        var item = 0;
        for (var op = 0; op < options.length; ++op) {
            if (options[op].label) {
                barMenu.wmsxItems[item].innerHTML = options[op].label;
                barMenu.wmsxItems[item].style.display = "block";
                barMenu.wmsxItems[item].wmsxPeripheralControl = options[op].control;
                ++item;
            }
        }
        for (var r = item; r < 10; ++r) {
            barMenu.wmsxItems[r].innerHTML = "";
            barMenu.wmsxItems[r].style.display = "none";
            barMenu.wmsxItems[r].wmsxPeripheralControl = null;
        }

        if (refElement && (refElement.wmsxMidLeft || refElement.wmsxMidRight)) {
            var p;
            if (refElement.wmsxMidLeft) {
                p = (refElement.wmsxMidLeft - BAR_MENU_WIDTH / 2) | 0; if (p < 0) p = 0;
                barMenu.style.left = "" + p + "px"; barMenu.style.right = "auto";
            }
            else {
                p = (refElement.wmsxMidRight - BAR_MENU_WIDTH / 2) | 0; if (p < 0) p = 0;
                barMenu.style.right = "" + p + "px"; barMenu.style.left = "auto";
            }
        } else {
            barMenu.style.left = barMenu.style.right = 0;
        }

        barMenuActive = true;
        barMenu.style.transition = redefine ? "none" : BAR_MENU_TRANSITION;
        barMenu.style.height = "" + (((item + 1) * BAR_MENU_ITEM_HEIGHT) + 4) + "px";
        barMenu.wmsxTitle.focus();
    }

    function hideBarMenu() {
        if (!barMenuActive) return;

        barMenuActive = false;
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
        style.background = "rgb(65, 65, 65)";
        style.cursor = "auto";
        title.innerHTML = "Menu Title";
        barMenu.appendChild(title);
        barMenu.wmsxTitle = title;

        barMenu.wmsxItems = new Array(10);
        for (var i = 0; i < 10; ++i) {
            var item = document.createElement('button');
            item.classList.add("wmsx-bar-menu-item");
            item.id = "wmsx-bar-menu-item-" + i;
            item.style.display = "none";
            item.innerHTML = "Menu Item " + i;
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

        // Fire menu item with a left-click
        barMenu.addEventListener("click", function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (e.which === 1 && e.target.wmsxPeripheralControl) {
                hideBarMenu();
                peripheralControls.controlActivated(e.target.wmsxPeripheralControl);
                return false;
            }
        });
        // And block other mouse events
        barMenu.addEventListener("mousedown", function(e) {
            e.stopPropagation();
            e.preventDefault();
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
            '.wmsx-bar-menu-item { ' +
            '   width: ' + BAR_MENU_WIDTH + 'px;' +
            '   height: ' + BAR_MENU_ITEM_HEIGHT + 'px;' +
            '   color: lightgray;' +
            '   font: inherit;' +
            '   border: none;' +
            '   text-shadow: 1px 1px 1px black;' +
            '   background-color: transparent;' +
            '   outline: none;' +
            '   cursor: pointer; ' +
            '}' +
            '' +
            '.wmsx-bar-menu-item:hover { ' +
            '   color: white;' +
            '   background-color: rgb(210, 28, 23);' +
            '}'
        ;
        document.head.appendChild(style);
    }


    var monitor;
    var peripheralControls;
    var fileDownloader;
    var controllersHub;
    var controllersSocket;

    var machineControlsSocket;
    var machineControlsStateReport = {};

    var settingsDialog;
    var pasteDialog;

    var borderElement;
    var fsElement;

    var canvas;
    var canvasContext;
    var canvasImageRenderingValue;

    var buttonsBar;
    var buttonsBarHideTimeout;

    var barMenu;
    var barMenuActive = false;

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

    var mediaButtonsState = { Power: 1, DiskA: 0, DiskB: 0, Cartridge1: 0, Cartridge2: 0, Tape: 0 };
    var mediaButtonsDesc = { Power: "Power", DiskA: "Disk A", DiskB: "Disk B", Cartridge1: "Cartridge 1", Cartridge2: "Cartridge 2", Tape: "Cassette Tape" };
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

    var BAR_MENU_WIDTH = 130;
    var BAR_MENU_ITEM_HEIGHT = 28;
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

