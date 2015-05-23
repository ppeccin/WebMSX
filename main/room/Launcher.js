// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

MSX.start = function () {
    // Emulator can only be started once
    delete MSX.start;
    delete MSX.preLoadImagesAndStart;

    // Init preferences
    MSX.preferences.load();
    // Get container elements
    if (!MSX.screenElement) {
        MSX.screenElement = document.getElementById(MSX.SCREEN_ELEMENT_ID);
        if (!MSX.screenElement)
            throw new Error('MSX cannot be started. ' +
            'HTML document is missing screen element with id "' + MSX.SCREEN_ELEMENT_ID + '"');
    }
    if (!MSX.machinePanelElement)
        MSX.machinePanelElement = document.getElementById(MSX.CONSOLE_PANEL_ELEMENT_ID);
    // Build and start emulator
    MSX.room = new Room(MSX.screenElement, MSX.machinePanelElement);
    MSX.room.powerOn();
    // Auto-load ROM if specified
    if (MSX.ROM_AUTO_LOAD_URL)
        MSX.room.romLoader.loadFromURL(MSX.ROM_AUTO_LOAD_URL);

    MSX.shutdown = function () {
        if (MSX.room) MSX.room.powerOff();
        Util.log("shutdown");
        delete MSX;
    };

    Util.log(MSX.VERSION + " started");
};


// Pre-load images and start emulator as soon as all are loaded and DOM is ready
MSX.preLoadImagesAndStart = function() {
    var images = [ "sprites.png", "logo.png", "screenborder.png" ];
    var numImages = images.length;

    var domReady = false;
    var imagesToLoad = numImages;
    function tryLaunch(bypass) {
        if (MSX.start && MSX.AUTO_START !== false && (bypass || (domReady && imagesToLoad === 0)))
            MSX.start();
    }

    document.addEventListener("DOMContentLoaded", function() {
        domReady = true;
        tryLaunch(false);
    });

    for (var i = 0; i < numImages; i++) {
        var img = new Image();
        img.src = MSX.IMAGES_PATH + images[i];
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
MSX.preLoadImagesAndStart();
