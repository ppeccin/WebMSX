// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.start = function () {
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

    // Apply Configuration, including Machine Typye and URL Parameters if allowed
    wmsx.Configurator.applyConfig();

    // Build and start emulator
    WMSX.room = new wmsx.Room(WMSX.screenElement);
    WMSX.room.powerOn();
    WMSX.room.setLoading(true);
    var roomPowerOnTime = Date.now();
    wmsx.Util.log(WMSX.VERSION + " started");

    // Prepare ROM Database
    wmsx.ROMDatabase.create();

    // Auto-load BIOS, Expansions, Cartridges, Disks and Tape files if specified and downloadable
    if (WMSX.STATE_LOAD_URL) {
        // Machine State loading, Machine will Auto Power on
        new wmsx.MultiDownloader(
            [{ url: WMSX.STATE_LOAD_URL }],
            function onAllSuccess(urls) {
                wmsx.Clock.detectHostNativeFPSAndCallback(function() {
                    afterAutoStartWait(function () {
                        WMSX.room.setLoading(false);
                        WMSX.room.fileLoader.loadFromContent(urls[0].url, urls[0].content, wmsx.FileLoader.OPEN_TYPE.STATE, 0, false);
                    });
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
                wmsx.Clock.detectHostNativeFPSAndCallback(function() {
                    afterAutoStartWait(function () {
                        WMSX.room.setLoading(false);
                        WMSX.room.machine.userPowerOn(true);        // Auto-run cassette, or type basic commands if any
                    });
                });
            }
        ).start();
    }

    function afterAutoStartWait(func) {
        if (WMSX.AUTO_START_DELAY < 0) return;
        var wait = WMSX.AUTO_START_DELAY - (Date.now() - roomPowerOnTime);
        if (wait < 0) wait = 0;
        setTimeout(func, wait);
    }

    WMSX.shutdown = function () {
        if (WMSX.room) WMSX.room.powerOff();
        wmsx.Util.log("shutdown");
    };

};

// Pre-load images if needed and start emulator as soon as all are loaded and DOM is ready
WMSX.preLoadImagesAndStart = function() {
    var domReady = false;
    var imagesToLoad = wmsx.Images.embedded ? 0 : wmsx.Images.urls.length;

    function tryLaunch(bypass) {
        if (WMSX.start && WMSX.AUTO_START_DELAY >= 0 && (bypass || (domReady && imagesToLoad === 0)))
            WMSX.start();
    }

    document.addEventListener("DOMContentLoaded", function() {
        domReady = true;
        tryLaunch(false);
    });

    if (imagesToLoad > 0) {
        for (var i in wmsx.Images.urls) {
            var img = new Image();
            img.src = wmsx.Images.urls[i];
            img.onload = function () {
                imagesToLoad--;
                tryLaunch(false);
            };
        }
    }

    window.addEventListener("load", function() {
        tryLaunch(true);
    });
};

WMSX.VERSION = "version 2.1";

// Start pre-loading images right away
WMSX.preLoadImagesAndStart();
