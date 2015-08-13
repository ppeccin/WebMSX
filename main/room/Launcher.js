// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.start = function () {
    // Emulator can only be started once
    delete WMSX.start;
    delete WMSX.preLoadImagesAndStart;

    // Init preferences
    WMSX.preferences.load();
    // Get container elements
    if (!WMSX.screenElement) {
        WMSX.screenElement = document.getElementById(WMSX.SCREEN_ELEMENT_ID);
        if (!WMSX.screenElement)
            throw new Error('MSX cannot be started. ' +
            'HTML document is missing screen element with id "' + WMSX.SCREEN_ELEMENT_ID + '"');
    }
    if (!WMSX.machinePanelElement)
        WMSX.machinePanelElement = document.getElementById(WMSX.CONSOLE_PANEL_ELEMENT_ID);
    // Build and start emulator
    WMSX.room = new wmsx.Room(WMSX.screenElement, WMSX.machinePanelElement);
    WMSX.room.powerOn();
    // Auto-load BIOS if specified
    if (WMSX.BIOS_AUTO_LOAD_URL)
        WMSX.room.fileLoader.loadFromURL(WMSX.BIOS_AUTO_LOAD_URL);
    // Auto-load ROM if specified
    if (WMSX.ROM_AUTO_LOAD_URL)
        WMSX.room.fileLoader.loadFromURL(WMSX.ROM_AUTO_LOAD_URL);

    WMSX.shutdown = function () {
        if (WMSX.room) WMSX.room.powerOff();
        wmsx.Util.log("shutdown");
        delete WMSX;
    };

    wmsx.Util.log(WMSX.VERSION + " started");
};


// Pre-load images and start emulator as soon as all are loaded and DOM is ready
WMSX.preLoadImagesAndStart = function() {
    var images = [ "sprites.png", "logo.png", "screenborder.png" ];
    var numImages = images.length;

    var domReady = false;
    var imagesToLoad = numImages;
    function tryLaunch(bypass) {
        if (WMSX.start && WMSX.AUTO_START !== false && (bypass || (domReady && imagesToLoad === 0)))
            WMSX.start();
    }

    document.addEventListener("DOMContentLoaded", function() {
        domReady = true;
        tryLaunch(false);
    });

    for (var i = 0; i < numImages; i++) {
        var img = new Image();
        img.src = WMSX.IMAGES_PATH + images[i];
        img.onload = function() {
            imagesToLoad--;
            tryLaunch(false);
        };
    }

    window.addEventListener("load", function() {
        tryLaunch(true);
    });

};

// Start pre-loading images right away
WMSX.preLoadImagesAndStart();
