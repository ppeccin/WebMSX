// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Implement phosphor and other CRT modes

wmsx.CanvasDisplay = function(mainElement) {

    function init(self) {
        setupProperties();
        setupMain();
        setupOSD();
        setupButtonsBar();
        setupLogo();
        setupLoadingIcon();
        monitor = new wmsx.Monitor();
        monitor.connectDisplay(self);
    }

    this.connect = function(pVideoSignal, pMachineControlsSocket, pCartridgeSocket) {
        monitor.connect(pVideoSignal, pCartridgeSocket);
        machineControlsSocket = pMachineControlsSocket;
        machineControlsSocket.addRedefinitionListener(this);
        pCartridgeSocket.addCartridgesStateListener(this);
    };

    this.connectPeripherals = function(fileLoader, fileDownloader, pKeyboard, machineControls, pPeripheralControls) {
        fileLoader.registerForDnD(mainElement);
        fileLoader.registerForFileInputElement(mainElement);
        fileDownloader.registerForDownloadElement(mainElement);
        keyboard = pKeyboard;
        keyboard.addInputElements(keyControlsInputElements());
        machineControls.addInputElements(keyControlsInputElements());
        peripheralControls = pPeripheralControls;
        peripheralControls.addInputElements(keyControlsInputElements());
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

    this.refresh = function(image, originX, originY, newContentBackdrop) {
        if (!signalIsOn) {
            signalIsOn = true;
            updateLogo();
        }
        // Update content backdrop color if needed
        if (newContentBackdrop !== contentBackdrop) {
            contentBackdrop = newContentBackdrop;
            canvas.style.background = "rgb(" + (newContentBackdrop & 0xff) + "," + ((newContentBackdrop >> 8) & 0xff) + "," + ((newContentBackdrop >>> 16) & 0xff) + ")";
        }
        // Then update content
        canvasContext.drawImage(
            image,
            originX * contentBaseScale, originY * contentBaseScale,
            image.width * contentBaseScale, image.height * contentBaseScale
        );
    };

    this.videoSignalOff = function() {
        signalIsOn = false;
        updateLogo();
    };

    this.displayDefaultOpeningScaleX = function(displayWidth, displayHeight) {
        if (isFullscreen) {
            var winW = fsElement.clientWidth;
            var winH = fsElement.clientHeight;
            var scaleX = winW / displayWidth;
            scaleX -= (scaleX % DEFAULT_SCALE_ASPECT_X);		    // Round multiple of the default X scale
            var h = scaleX / DEFAULT_SCALE_ASPECT_X * displayHeight;
            while (h > winH + 35) {									//  35 is a little tolerance
                scaleX -= DEFAULT_SCALE_ASPECT_X;				    // Decrease one full default X scale
                h = scaleX / DEFAULT_SCALE_ASPECT_X * displayHeight;
            }
            return scaleX | 0;
        } else
            return wmsx.Monitor.DEFAULT_SCALE_X;
    };

    this.displaySize = function(width, height, contentBorderWidth, contentBorderHeight) {
        setElementsSizes(width, height, contentBorderWidth, contentBorderHeight);
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

    this.crtFilterToggle = function() {
        var newLevel = crtFilter + 1; if (newLevel > 3) newLevel = 0;
        this.showOSD(newLevel === 0 ? "CRT filter: OFF" : "CRT filter level: " + newLevel, true);
        setCRTFilter(newLevel);
    };

    this.crtFilterSetDefault = function() {
        setCRTFilter(WMSX.SCREEN_FILTER_MODE);
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

    this.diskDrivesStateUpdate = function(diskAPresent, diskAMotor, diskBPresent, diskBMotor) {
        mediaButtonsState.DiskA = diskAMotor ? 2 : ( diskAPresent ? 1 : 0 );
        mediaButtonsState.DiskB = diskBMotor ? 2 : ( diskBPresent ? 1 : 0 );
        refreshMediaButtons();
    };

    this.cartridgesStateUpdate = function(cartridge1, cartridge2) {
        mediaButtonsState.Cartridge1 = cartridge1 ? 1 : 0;
        mediaButtonsState.Cartridge2 = cartridge2 ? 1 : 0;
        refreshMediaButtons();
    };

    this.tapeStateUpdate = function(present, motor) {
        mediaButtonsState.Tape = motor ? 2 : ( present ? 1 : 0 );
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

    var lostFocus = function(e) {
        keyboard.liftAllKeys();
    };

    var keyControlsInputElements = function() {
        return [mainElement];   // Add ConsolePanel if present
    };

    var openSettings = function(page) {
        if (!settings) settings = new wmsx.Settings();
        settings.show(page);
    };

    var fullScreenChanged = function() {
        var fse = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        isFullscreen = !!fse;
        monitor.setDisplayDefaultSize();
        // Schedule another one to give the browser some time to set full screen properly
        if (isFullscreen) setTimeout(monitor.setDisplayDefaultSize, 120);
    };

    var setElementsSizes = function (width, height) {
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
    };

    var setCRTFilter = function(level) {
        crtFilter = level;
        updateImageSmoothing();
    };

    var updateLogo = function () {
        if (signalIsOn) {
            logoImage.style.display = "none";
            loadingImage.style.display = "none";
        } else {
            canvas.style.background = "black";
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            /* if (logoImage.isLoaded) */ logoImage.style.display = "block";
            if (isLoading /* && loadingImage.isLoaded */) loadingImage.style.display = "block";
            else loadingImage.style.display = "none";
        }
    };

    var updateImageSmoothing = function () {
        canvas.style.imageRendering = (crtFilter === 1 || crtFilter === 3) ? "initial" : canvasImageRenderingValue;

        var smoothing = crtFilter >= 2;
        if (canvasContext.imageSmoothingEnabled !== undefined)
            canvasContext.imageSmoothingEnabled = smoothing;
        else {
            canvasContext.webkitImageSmoothingEnabled = smoothing;
            canvasContext.mozImageSmoothingEnabled = smoothing;
            canvasContext.msImageSmoothingEnabled = smoothing;
        }
    };

    var setupMain = function () {
        mainElement.style.position = "relative";
        mainElement.style.overflow = "hidden";
        mainElement.style.outline = "none";
        mainElement.tabIndex = "-1";               // Make it focusable

        mainElement.addEventListener("focusout", lostFocus);

        borderElement = document.createElement('div');
        borderElement.style.position = "relative";
        borderElement.style.overflow = "hidden";
        borderElement.style.background = "black";
        borderElement.style.border = "0 solid black";
        borderElement.style.borderWidth = "" + borderTop + "px " + borderLateral + "px " + borderBottom + "px";
        if (WMSX.SCREEN_CONTROL_BAR === 2) {
            borderElement.style.borderImage = "url(" + IMAGE_PATH + "screenborder.png) " +
                borderTop + " " + borderLateral + " " + borderBottom + " repeat stretch";
        }

        fsElement = document.createElement('div');
        fsElement.style.position = "relative";
        fsElement.style.width = "100%";
        fsElement.style.height = "100%";
        fsElement.style.overflow = "hidden";
        fsElement.style.background = "black";

        document.addEventListener("fullscreenchange", fullScreenChanged);
        document.addEventListener("webkitfullscreenchange", fullScreenChanged);
        document.addEventListener("mozfullscreenchange", fullScreenChanged);
        document.addEventListener("msfullscreenchange", fullScreenChanged);

        borderElement.appendChild(fsElement);

        canvas = document.createElement('canvas');
        canvas.width = wmsx.Monitor.CONTENT_WIDTH * contentBaseScale;      // Canvas base size will never chance, only scale via CSS
        canvas.height = wmsx.Monitor.CONTENT_HEIGHT * contentBaseScale;
        canvas.style.position = "absolute";
        canvas.style.display = "block";
        canvas.style.left = canvas.style.right = 0;
        canvas.style.top = canvas.style.bottom = 0;
        canvas.style.margin = "auto";
        canvas.tabIndex = "-1";               // Make it focusable
        canvas.style.outline = "none";
        canvas.style.border = "none";
        fsElement.appendChild(canvas);

        setElementsSizes(canvas.width, canvas.height);

        // Prepare Context used to draw frame
        canvasContext = canvas.getContext("2d");
        canvasContext.globalCompositeOperation = "copy";

        // Try to determine correct value for image-rendering for the canvas filter modes. TODO Find better solution, include Edge
        switch (wmsx.Util.browserInfo().name) {
            case "CHROME":
            case "OPERA":   canvasImageRenderingValue = "pixelated"; break;
            case "FIREFOX": canvasImageRenderingValue = "-moz-crisp-edges"; break;
            case "SAFARI":  canvasImageRenderingValue = "-webkit-crisp-edges"; break;
            default:        canvasImageRenderingValue = "initial";
        }

        mainElement.appendChild(borderElement);
    };

    var setupButtonsBar = function() {
        buttonsBar = document.createElement('div');
        buttonsBar.style.position = "absolute";
        buttonsBar.style.left = "0";
        buttonsBar.style.right = "0";
        buttonsBar.style.height = "29px";
        if (WMSX.SCREEN_CONTROL_BAR === 2) {
            buttonsBar.style.bottom = "0";
            // No background
        } else if (WMSX.SCREEN_CONTROL_BAR === 1) {
            buttonsBar.style.bottom = "-30px";
            buttonsBar.style.background = "rgba(47, 47, 43, .8)";
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
            buttonsBar.style.background = "rgb(44, 44, 40)";
            buttonsBar.style.border = "1px solid black";
        }

        powerButton  = addBarButton(6, -26, 24, 23, -120, -29);
        var controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.MACHINE_POWER_TOGGLE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.MACHINE_POWER_RESET;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.MACHINE_POWER_RESET;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.MACHINE_SAVE_STATE_FILE;
        peripheralControlButton(powerButton, controls);

        diskAButton = addBarButton(44, -26, 24, 23, -150, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.DISKA_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKA_LOAD_FILE_ALT_POWER;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKA_LOAD_URL;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.DISKA_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKA_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.DISKA_EMPTY;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKA_SAVE_FILE;
        peripheralControlButton(diskAButton, controls);

        diskBButton = addBarButton(43 + 26, -26, 24, 23, -150, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.DISKB_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKB_LOAD_FILE_ALT_POWER;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKB_LOAD_URL;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.DISKB_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.DISKB_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.DISKB_EMPTY;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.DISKB_SAVE_FILE;
        peripheralControlButton(diskBButton, controls);

        cartridge1Button = addBarButton(43 + 26 * 2, -26, 24, 23, -150, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.CARTRIDGE1_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.CARTRIDGE1_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.CARTRIDGE1_REMOVE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.CARTRIDGE1_REMOVE;
        peripheralControlButton(cartridge1Button, controls);

        cartridge2Button = addBarButton(44 + 26 * 3, -26, 24, 23, -179, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.CARTRIDGE2_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.CARTRIDGE2_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.CARTRIDGE2_REMOVE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.CARTRIDGE2_REMOVE;
        peripheralControlButton(cartridge2Button, controls);

        tapeButton = addBarButton(45 + 26 * 4, -26, 24, 23, -208, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.TAPE_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.TAPE_LOAD_FILE_ALT_POWER;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_LOAD_URL;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.TAPE_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.TAPE_REMOVE;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK] = wmsx.PeripheralControls.TAPE_EMPTY;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_SAVE_FILE;

        controls[MOUSE_BUT3_MASK] = wmsx.PeripheralControls.TAPE_AUTO_RUN;
        controls[MOUSE_BUT1_MASK | KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_AUTO_RUN;
        peripheralControlButton(tapeButton, controls);

        var fsGap = 23;
        if (!WMSX.SCREEN_FULLSCREEN_DISABLED) {
            fullscreenButton = addBarButton(-53, -26, 24, 22, -71, -4);
            peripheralControlButton(fullscreenButton, wmsx.PeripheralControls.SCREEN_FULLSCREEN);
            fsGap = 0;
        }
        if (!WMSX.SCREEN_RESIZE_DISABLED) {
            scaleDownButton = addBarButton(-92 + fsGap, -26, 18, 22, -26, -4);
            peripheralControlButton(scaleDownButton, wmsx.PeripheralControls.SCREEN_SIZE_MINUS);
            scaleUpButton = addBarButton(-74 + fsGap, -26, 21, 22, -48, -4);
            peripheralControlButton(scaleUpButton, wmsx.PeripheralControls.SCREEN_SIZE_PLUS);
        }

        settingsButton  = addBarButton(-29, -26, 24, 22, -96, -4);
        localControlButton(settingsButton, openSettings);

        logoButton = addBarButton("CENTER", -23, 51, 19, -38, -35);
        localControlButton(logoButton, function (e) {
            openSettings("ABOUT");
        });

        mainElement.appendChild(buttonsBar);
    };

    var refreshMediaButtons = function() {
        powerButton.style.backgroundPosition =      "-120px " + (mediaButtonBackYOffsets[mediaButtonsState["Power"]]) + "px";
        diskAButton.style.backgroundPosition =      "-237px " + (mediaButtonBackYOffsets[mediaButtonsState["DiskA"]]) + "px";
        diskBButton.style.backgroundPosition =      "-266px " + (mediaButtonBackYOffsets[mediaButtonsState["DiskB"]]) + "px";
        cartridge1Button.style.backgroundPosition = "-150px " + (mediaButtonBackYOffsets[mediaButtonsState["Cartridge1"]]) + "px";
        cartridge2Button.style.backgroundPosition = "-179px " + (mediaButtonBackYOffsets[mediaButtonsState["Cartridge2"]]) + "px";
        tapeButton.style.backgroundPosition =       "-208px " + (mediaButtonBackYOffsets[mediaButtonsState["Tape"]]) + "px";
    };

    var addBarButton = function(x, y, w, h, px, py, noImage) {
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

        if (!noImage) {
            but.style.backgroundImage = "url(" + IMAGE_PATH + "sprites.png" + ")";
            but.style.backgroundPosition = "" + px + "px " + py + "px";
            but.style.backgroundRepeat = "no-repeat";
        }

        buttonsBar.appendChild(but);

        //but.style.boxSizing = "border-box";
        //but.style.backgroundOrigin = "border-box";
        //but.style.border = "1px solid yellow";

        return but;
    };

    var peripheralControlButton = function (but, control) {
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

        // Suppress Context menu
        but.addEventListener("contextmenu", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        });
    };

    var localControlButton = function (but, func) {
        but.style.cursor = "pointer";
        but.addEventListener("click", function (e) {
            if (e.preventDefault) e.preventDefault();
            func();
        });
        but.addEventListener("contextmenu", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        });
    };

    var setupLogo = function() {
        logoImage = new Image();
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
        logoImage.src = IMAGE_PATH + "logo.png";
    };

    var setupLoadingIcon = function() {
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
        loadingImage.src = IMAGE_PATH + "loading.gif";
    };

    var setupOSD = function() {
        osd = document.createElement('div');
        osd.style.position = "absolute";
        osd.style.overflow = "hidden";
        osd.style.top = "-29px";
        osd.style.right = "18px";
        osd.style.height = "29px";
        osd.style.padding = "0 12px";
        osd.style.margin = "0";
        osd.style.font = 'bold 15px/29px sans-serif';
        osd.style.color = "rgb(0, 255, 0)";
        osd.style.background = "rgba(0, 0, 0, 0.4)";
        osd.style.opacity = 0;
        osd.style.userSelect = "none";
        osd.style.webkitUserSelect = "none";
        osd.style.MozUserSelect = "none";
        osd.style.msUserSelect = "none";
        osd.innerHTML = "";
        fsElement.appendChild(osd);
    };

    var setupProperties = function() {
        if (WMSX.SCREEN_CONTROL_BAR === 2) {            // Legacy
            borderTop = 5;
            borderLateral = 5;
            borderBottom = 31;
        } else if (WMSX.SCREEN_CONTROL_BAR === 1) {     // Hover
            borderTop = 1;
            borderLateral = 1;
            borderBottom = 1;
        } else {                                       // Always
            borderTop = 1;
            borderLateral = 1;
            borderBottom = 30;
        }
    };


    var monitor;
    var keyboard;
    var peripheralControls;
    var machineControlsSocket;
    var machineControlsStateReport = {};

    var settings;

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

    var signalIsOn = false;
    var isFullscreen = false;
    var crtFilter = 1;
    var isLoading = false;

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

    var contentBackdrop;

    var borderTop;
    var borderLateral;
    var borderBottom;

    var contentBaseScale = WMSX.SCREEN_SHARP_SIZE;

    var mediaButtonsState = { Power: 1, DiskA: 0, DiskB: 0, Cartridge1: 0, Cartridge2: 0, Tape: 0 };
    var mediaButtonBackYOffsets = [ -54, -29, -4 ];

    var MOUSE_BUT1_MASK = 1;
    var MOUSE_BUT2_MASK = 2;
    var MOUSE_BUT3_MASK = 4;
    var KEY_CTRL_MASK  =  32;
    var KEY_ALT_MASK   =  64;
    var KEY_SHIFT_MASK =  128;

    var IMAGE_PATH = WMSX.IMAGES_PATH;
    var OSD_TIME = 2500;
    var DEFAULT_SCALE_ASPECT_X = 1;


    init(this);

};

