// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.CanvasDisplay = function(mainElement) {
    var self = this;

    function init() {
        setupProperties();
        setupMain();
        setupOSD();
        setupButtonsBar();
        setupLogo();
        setupLoadingIcon();
        monitor = new wmsx.Monitor(self);
    }

    this.connect = function(pVideoSignal, pMachineControlsSocket, pCartridgeSocket) {
        monitor.connect(pVideoSignal, pCartridgeSocket);
        machineControlsSocket = pMachineControlsSocket;
        machineControlsSocket.addRedefinitionListener(this);
        pCartridgeSocket.addCartridgesStateListener(this);
    };

    this.connectPeripherals = function(fileLoader, fileDownloader, pKeyboard, machineControls, pPeripheralControls, pControllersHub) {
        fileLoader.registerForDnD(mainElement);
        fileLoader.registerForFileInputElement(mainElement);
        fileDownloader.registerForDownloadElement(mainElement);
        keyboard = pKeyboard;
        keyboard.addInputElements(keyControlsInputElements());
        machineControls.addInputElements(keyControlsInputElements());
        peripheralControls = pPeripheralControls;
        peripheralControls.addInputElements(keyControlsInputElements());
        controllersHub = pControllersHub;
        controllersHub.setMouseInputElement(mouseControlsInputElement())
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

    this.openSettings = function(page) {
        if (!settingsDialog) settingsDialog = new wmsx.SettingsDialog();
        if (pasteDialog) pasteDialog.hide();
        settingsDialog.show(page);
        return false;
    };

    this.openLoadFileDialog = function() {
        diskAButton.click();
        return false;
    };

    this.togglePasteDialog = function(page) {
        if (!signalIsOn) return;
        if (!pasteDialog) pasteDialog = new wmsx.PasteDialog(fsElement);
        pasteDialog.toggle();
        return false;
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
        keyboard.liftAllKeys();
    }

    function hideCursor() {
        cursorShowing = false;
        updateCursor();
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

    function keyControlsInputElements() {
        return [mainElement];
    }

    function mouseControlsInputElement() {
        return fsElement;
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
        width += borderLateral * 2;
        height += borderTop + borderBottom;
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
        element.addEventListener("contextmenu", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        });
    }

    function setupMain() {
        if (!mainElement.style.position || mainElement.style.position === "static" || mainElement.style.position === "initial")
            mainElement.style.position = "relative";
        mainElement.style.overflow = "hidden";
        mainElement.style.outline = "none";
        mainElement.tabIndex = "-1";               // Make it focusable

        mainElement.addEventListener("focusout", lostFocus);

        borderElement = document.createElement('div');
        borderElement.id = "wmsx-border";
        borderElement.style.position = "absolute";
        borderElement.style.left = borderElement.style.right = 0;
        borderElement.style.top = 0;
        borderElement.style.margin = "auto";
        borderElement.style.overflow = "hidden";
        borderElement.style.background = "black";
        borderElement.style.border = "0 solid black";
        borderElement.style.borderWidth = "" + borderTop + "px " + borderLateral + "px " + borderBottom + "px";

        fsElement = document.createElement('div');
        fsElement.id = "wmsx-fs";
        fsElement.style.position = "absolute";
        fsElement.style.left = fsElement.style.right = 0;
        fsElement.style.top = fsElement.style.bottom = 0;
        fsElement.style.overflow = "hidden";
        fsElement.style.background = "black";

        fsElement.addEventListener("mousemove", function() {
            showCursor();
        });

        suppressContextMenu(fsElement);

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

    function setupButtonsBar() {
        buttonsBar = document.createElement('div');
        buttonsBar.id = "wmsx-bar";
        buttonsBar.style.position = "absolute";
        buttonsBar.style.left = "0";
        buttonsBar.style.right = "0";
        buttonsBar.style.height = "29px";
        if (WMSX.SCREEN_CONTROL_BAR == 1) {
            buttonsBar.style.bottom = "-30px";
            buttonsBar.style.background = "rgba(30, 30, 28, .75)";
            buttonsBar.style.transition = "bottom 0.3s ease-in-out";
            mainElement.addEventListener("mouseover", function() {
                if (buttonsBarHideTimeout) clearTimeout(buttonsBarHideTimeout);
                buttonsBar.style.bottom = "0px";
            });
            mainElement.addEventListener("mouseleave", function() {
                buttonsBarHideTimeout = setTimeout(function() {
                    buttonsBar.style.bottom = "-30px";
                }, 1000);
            });
        } else {
            buttonsBar.style.bottom = "0";
            buttonsBar.style.background = "rgb(40, 40, 37)";
            buttonsBar.style.border = "1px solid black";
        }

        suppressContextMenu(buttonsBar);

        powerButton  = addBarButton(6, -26, 24, 23, -120, -29, "System Power");
        var controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.MACHINE_POWER_TOGGLE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.MACHINE_POWER_RESET;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.MACHINE_POWER_RESET;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.MACHINE_SAVE_STATE_FILE;
        peripheralControlButton(powerButton, controls);

        diskAButton = addBarButton(44, -26, 24, 23, -150, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.DISKA_LOAD_FILE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.DISKA_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKA_EMPTY;
        controls[MOUSE_BUT1_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKA_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKA_SAVE_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.DISKA_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKA_LOAD_FILE_ALT_POWER;
        peripheralControlButton(diskAButton, controls);

        diskBButton = addBarButton(43 + 26, -26, 24, 23, -150, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.DISKB_LOAD_FILE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.DISKB_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKB_EMPTY;
        controls[MOUSE_BUT1_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKB_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKB_SAVE_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.DISKB_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKB_LOAD_FILE_ALT_POWER;
        peripheralControlButton(diskBButton, controls);

        cartridge1Button = addBarButton(43 + 26 * 2, -26, 24, 23, -150, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.CARTRIDGE1_LOAD_FILE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.CARTRIDGE1_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.CARTRIDGE1_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.CARTRIDGE1_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.CARTRIDGE1_LOAD_FILE_ALT_POWER;
        peripheralControlButton(cartridge1Button, controls);

        cartridge2Button = addBarButton(44 + 26 * 3, -26, 24, 23, -179, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.CARTRIDGE2_LOAD_FILE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.CARTRIDGE2_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.CARTRIDGE2_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.CARTRIDGE2_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.CARTRIDGE2_LOAD_FILE_ALT_POWER;
        peripheralControlButton(cartridge2Button, controls);

        tapeButton = addBarButton(45 + 26 * 4, -26, 24, 23, -208, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.TAPE_LOAD_FILE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.TAPE_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.TAPE_EMPTY;
        controls[MOUSE_BUT1_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_SAVE_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.TAPE_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.TAPE_LOAD_FILE_ALT_POWER;

        controls[MOUSE_BUT3_MASK] = wmsx.PeripheralControls.TAPE_AUTO_RUN;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_AUTO_RUN;
        peripheralControlButton(tapeButton, controls);

        var fsGap = 23;
        if (!WMSX.SCREEN_FULLSCREEN_DISABLED) {
            fullscreenButton = addBarButton(-53, -26, 24, 22, -71, -4, "Full Screen");
            peripheralControlButton(fullscreenButton, wmsx.PeripheralControls.SCREEN_FULLSCREEN);
            fsGap = 0;
        }
        if (!WMSX.SCREEN_RESIZE_DISABLED) {
            scaleDownButton = addBarButton(-92 + fsGap, -26, 18, 22, -26, -4, "Decrease Screen");
            peripheralControlButton(scaleDownButton, wmsx.PeripheralControls.SCREEN_SCALE_MINUS);
            scaleUpButton = addBarButton(-74 + fsGap, -26, 21, 22, -48, -4, "Increase Screen");
            peripheralControlButton(scaleUpButton, wmsx.PeripheralControls.SCREEN_SCALE_PLUS);
        }

        settingsButton  = addBarButton(-29, -26, 24, 22, -96, -4, "Help Screen");
        localControlButton(settingsButton, self.openSettings);

        logoButton = addBarButton("CENTER", -23, 51, 19, -38, -35, "About WebMSX");
        localControlButton(logoButton, function (e) {
            self.openSettings("ABOUT");
        });

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
        } else if (x > 0) but.style.left = "" + x + "px"; else but.style.right = "" + (-w - x) + "px";
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

    function peripheralControlButton(but, control) {
        but.style.cursor = "pointer";

        // We need a separate approach for left button and the others (middle and right).
        // The left click needs to be a "click" as explained below
        // The others use a "mousedown" since a click only fires for the left button on many browsers

        var handler = function (e) {
            if (e.preventDefault) e.preventDefault();
            // Simple control, only left-click
            if ((typeof control) == "number") {
                if (!e.buttons || e.buttons === 1) peripheralControls.controlActivated(control);
                return;
            }
            // Complex control
            var mask = (e.buttons || 1) | (e.altKey ? KEY_ALT_MASK : 0) | (e.ctrlKey ? KEY_CTRL_MASK : 0) | (e.shiftKey ? KEY_SHIFT_MASK : 0);
            if (control[mask]) peripheralControls.controlActivated(control[mask]);
        };

        // Left Button: a "click" event and not a "mousedown" is necessary here. Without a click, FF does not open the Open File window
        // TODO Hotkeys for this are also not working in FF since they're not click events!
        but.addEventListener("click", function(e) {
            if (e.which === 1) handler(e);            // :-( Chrome fires this for middle button so we need this ugly check
        });

        // Middle and Right buttons, use mousedown but ignore Left clicks
        but.addEventListener("mousedown", function(e) {
            if (e.which > 1) handler(e);
        });

        suppressContextMenu(but);
    }

    function localControlButton(but, func) {
        but.style.cursor = "pointer";
        but.addEventListener("click", function (e) {
            if (e.preventDefault) e.preventDefault();
            func();
        });
        suppressContextMenu(but);
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

    function setupProperties() {
        if (WMSX.SCREEN_CONTROL_BAR == 1) {            // Hover
            borderTop = 1;
            borderLateral = 1;
            borderBottom = 1;
        } else {                                       // Always
            borderTop = 1;
            borderLateral = 1;
            borderBottom = 31;
        }
    }


    var monitor;
    var keyboard;
    var peripheralControls;
    var controllersHub;
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

    var borderTop;
    var borderLateral;
    var borderBottom;

    var mediaButtonsState = { Power: 1, DiskA: 0, DiskB: 0, Cartridge1: 0, Cartridge2: 0, Tape: 0 };
    var mediaButtonsDesc = { Power: "Power", DiskA: "Disk A", DiskB: "Disk B", Cartridge1: "Cartridge 1", Cartridge2: "Cartridge 2", Tape: "Cassette Tape" };
    var mediaButtonBackYOffsets = [ -54, -29, -4 ];

    var MOUSE_BUT1_MASK = 1;
    var MOUSE_BUT2_MASK = 2;
    var MOUSE_BUT3_MASK = 4;
    var KEY_CTRL_MASK  =  32;
    var KEY_ALT_MASK   =  64;
    var KEY_SHIFT_MASK =  128;

    var OSD_TIME = 2500;
    var CURSOR_HIDE_FRAMES = 150;


    init();

    this.eval = function(str) {
        return eval(str);
    };

};

