// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Implement Settings
// TODO Implement phosphor and other CRT modes

wmsx.CanvasDisplay = function(mainElement) {

    function init(self) {
        setupProperties();
        setupMain();
        setupOSD();
        setupButtonsBar();
        setupLogo();
        monitor = new wmsx.Monitor();
        monitor.connectDisplay(self);
        monitor.addControlInputElements(self.keyControlsInputElements());
    }

    this.connectPeripherals = function(fileLoader, fileDownloader, cassetteDeck) {
        fileLoader.registerForDnD(mainElement);
        fileLoader.registerForFileInputElement(mainElement);
        fileDownloader.registerForDownloadElement(mainElement);
        monitor.connectPeripherals(fileLoader, cassetteDeck);
    };

    this.connect = function(pVideoSignal, pControlsSocket, pCartridgeSocket) {
        monitor.connect(pVideoSignal, pCartridgeSocket);
        controlsSocket = pControlsSocket;
        pCartridgeSocket.addCartridgesStateListener(this);
    };

    this.powerOn = function() {
        setCRTFilter(crtFilter);
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

    this.keyControlsInputElements = function() {
        return [mainElement];
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

    this.toggleCRTFilter = function() {
        var newLevel = crtFilter + 1; if (newLevel > 3) newLevel = 0;
        this.showOSD(newLevel === 0 ? "CRT filter: OFF" : "CRT filter level: " + newLevel, true);
        setCRTFilter(newLevel);
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

    this.exit = function() {
        controlsSocket.controlStateChanged(wmsx.MachineControls.POWER_OFF, true);
        monitor.controlActivated(wmsx.PeripheralControls.SCREEN_SIZE_DEFAULT);
    };

    this.focus = function() {
        canvas.focus();
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

    var openSettings = function(page) {
        if (!settings) settings = new wmsx.Settings();
        settings.show(page);
    };

    var fullScreenChanged = function() {
        var fse = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        isFullscreen = !!fse;
        monitor.controlActivated(wmsx.PeripheralControls.SCREEN_SIZE_DEFAULT);
        // Schedule another one to give the browser some time to set full screen properly
        if (isFullscreen)
            setTimeout(function() {
                monitor.controlActivated(wmsx.PeripheralControls.SCREEN_SIZE_DEFAULT);
            }, 120);
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
        } else {
            canvas.style.background = "black";
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            if (logoImage.isLoaded) logoImage.style.display = "block";
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

        powerButton  = addBarButton(6, -26, 24, 23, -120, -3);
        consoleControlButton(powerButton, wmsx.MachineControls.POWER);

        cartridge1Button = addBarButton(43, -26, 24, 23, -150, -53);
        var controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.CARTRIDGE1_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.CARTRIDGE1_LOAD_URL;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.CARTRIDGE1_REMOVE;
        screenControlButton(cartridge1Button, controls);

        cartridge2Button = addBarButton(43 + 26, -26, 24, 23, -179, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.CARTRIDGE2_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.CARTRIDGE2_LOAD_URL;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.CARTRIDGE2_REMOVE;
        screenControlButton(cartridge2Button, controls);

        tapeButton = addBarButton(43 + 26 * 2, -26, 24, 23, -208, -53);
        controls = {};
        controls[MOUSE_BUT1_MASK] = wmsx.PeripheralControls.TAPE_LOAD_FILE;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK] = wmsx.PeripheralControls.TAPE_LOAD_URL;
        controls[MOUSE_BUT1_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_LOAD_FILE_NO_AUTO_RUN;
        controls[MOUSE_BUT1_MASK | KEY_CTRL_MASK | KEY_ALT_MASK] = wmsx.PeripheralControls.TAPE_SAVE_FILE;
        controls[MOUSE_BUT2_MASK] = wmsx.PeripheralControls.TAPE_LOAD_EMPTY;
        controls[MOUSE_BUT3_MASK] = wmsx.PeripheralControls.TAPE_AUTO_RUN;
        screenControlButton(tapeButton, controls);

        var fsGap = 23;
        if (!WMSX.SCREEN_FULLSCREEN_DISABLED) {
            fullscreenButton = addBarButton(-53, -26, 24, 22, -71, -4);
            screenControlButton(fullscreenButton, wmsx.PeripheralControls.SCREEN_FULLSCREEN);
            fsGap = 0;
        }
        if (!WMSX.SCREEN_RESIZE_DISABLED) {
            scaleDownButton = addBarButton(-92 + fsGap, -26, 18, 22, -26, -4);
            screenControlButton(scaleDownButton, wmsx.PeripheralControls.SCREEN_SIZE_MINUS);
            scaleUpButton = addBarButton(-74 + fsGap, -26, 21, 22, -48, -4);
            screenControlButton(scaleUpButton, wmsx.PeripheralControls.SCREEN_SIZE_PLUS);
        }

        settingsButton  = addBarButton(-29, -26, 24, 22, -96, -4);
        settingsButton.style.cursor = "pointer";
        settingsButton.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            openSettings();
        });

        logoButton = addBarButton("CENTER", -23, 51, 19, -38, -35);
        logoButton.style.cursor = "pointer";
        logoButton.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            openSettings("ABOUT");
        });

        mainElement.appendChild(buttonsBar);
    };

    var refreshMediaButtons = function() {
        cartridge1Button.style.backgroundPositionY = (mediaButtonOffsets[mediaButtonsState["Cartridge1"]]) + "px";
        cartridge2Button.style.backgroundPositionY = (mediaButtonOffsets[mediaButtonsState["Cartridge2"]]) + "px";
        tapeButton.style.backgroundPositionY =       (mediaButtonOffsets[mediaButtonsState["Tape"]]) + "px";
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

    var screenControlButton = function (but, control) {
        but.style.cursor = "pointer";
        but.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();

            // Simple control, only left-click
            if ((typeof control) == "number" || !e.buttons) {
                if (!e.button || e.button === 0) monitor.controlActivated(control);
                return;
            }

            var mask = e.buttons | (e.altKey ? KEY_ALT_MASK : 0) | (e.ctrlKey ? KEY_CTRL_MASK : 0) | (e.shiftKey ? KEY_SHIFT_MASK : 0);
            if (control[mask]) monitor.controlActivated(control[mask]);
        });

        but.addEventListener("contextmenu", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        });

    };

    var consoleControlButton = function (but, control) {
        but.style.cursor = "pointer";
        but.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            controlsSocket.controlStateChanged(control, true);
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
        logoImage.style.mozUserSelect = "none";
        logoImage.style.msUserSelect = "none";

        fsElement.appendChild(logoImage);

        logoImage.onload = function() {
            logoImage.isLoaded = true;
            updateLogo();
        };
        logoImage.src = IMAGE_PATH + "logo.png";
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
    var controlsSocket;
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
    var crtFilter = WMSX.SCREEN_FILTER_MODE;

    var logoImage;

    var powerButton;
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

    var mediaButtonOffsets = [ -53, -29, -4 ];
    var mediaButtonsState = { Cartridge1: 0, Cartridge2: 0, Tape: 0 };

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

