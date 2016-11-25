// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.start = function (machinePowerOn) {
"use strict";

    // Emulator can only be started once
    delete WMSX.start;
    delete WMSX.preLoadImagesAndStart;

    // Init preferences
    WMSX.userPreferences.load();

    // Get container elements
    if (!WMSX.screenElement) {
        WMSX.screenElement = document.getElementById(WMSX.SCREEN_ELEMENT_ID);
        if (!WMSX.screenElement)
            throw new Error('WMSX cannot be started. ' +
            'HTML document is missing screen element with id "' + WMSX.SCREEN_ELEMENT_ID + '"');
    }

    // Apply Configuration, including Machine Type and URL Parameters if allowed
    wmsx.Configurator.applyConfig();

    // Build and start emulator
    if (machinePowerOn === undefined) machinePowerOn = WMSX.AUTO_POWER_ON_DELAY >= 0;
    WMSX.room = new wmsx.Room(WMSX.screenElement, machinePowerOn);
    WMSX.room.powerOn();
    wmsx.Util.log("version " + WMSX.VERSION + " started");

    // Prepare ROM Database
    wmsx.ROMDatabase.uncompress();

    // Auto-load BIOS, Expansions, Cartridges, Disks and Tape files if specified and downloadable
    if (WMSX.STATE_URL) {
        // Machine State loading, Machine will Auto Power on
        new wmsx.MultiDownloader(
            [{ url: WMSX.STATE_URL }],
            function onAllSuccess(urls) {
                WMSX.room.start(function() {
                    WMSX.room.fileLoader.loadFromContent(urls[0].url, urls[0].content, wmsx.FileLoader.OPEN_TYPE.STATE, 0, false);
                });
            }
        ).start();
    } else {
        // Normal parameters loading. Power Machine on only after all files are loaded and inserted
        var slotURLs = wmsx.Configurator.slotURLSpecs();
        var mediaURLs = wmsx.Configurator.mediaURLSpecs();
        var extensionsURLs = wmsx.Configurator.extensionsInitialURLSpecs();
        new wmsx.MultiDownloader(
            slotURLs.concat(mediaURLs).concat(extensionsURLs),
            function onAllSuccess() {
                WMSX.room.start();
            }
        ).start();
    }

    WMSX.shutdown = function () {
        if (WMSX.room) WMSX.room.powerOff();
        wmsx.Util.log("shutdown");
    };

};

// Pre-load images if needed and start emulator as soon as all are loaded and DOM is ready
WMSX.preLoadImagesAndStart = function() {
    var domReady = false;
    var imagesToLoad = wmsx.Images.embedded ? 0 : wmsx.Images.count;

    function tryStart(bypass) {
        if (WMSX.start && WMSX.AUTO_START && (bypass || (domReady && imagesToLoad === 0)))
            WMSX.start();
    }

    document.addEventListener("DOMContentLoaded", function() {
        domReady = true;
        tryStart(false);
    });

    if (imagesToLoad > 0) {
        for (var i in wmsx.Images.urls) {
            var img = new Image();
            img.src = wmsx.Images.urls[i];
            img.onload = function () {
                imagesToLoad--;
                tryStart(false);
            };
        }
    }

    window.addEventListener("load", function() {
        tryStart(true);
    });
};

// AppCache update control
if (window.applicationCache) {
    function onUpdateReady() {
        window.applicationCache.swapCache();
        window.location.reload();
    }
    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) onUpdateReady();
    else window.applicationCache.addEventListener("updateready", onUpdateReady);
}

WMSX.VERSION = "4.0.23";

// Start pre-loading images right away
WMSX.preLoadImagesAndStart();
