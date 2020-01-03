// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.start = function (machinePowerOn) {
"use strict";

    // Get container elements
    if (!WMSX.screenElement) {
        WMSX.screenElement = document.getElementById(WMSX.SCREEN_ELEMENT_ID);
        if (!WMSX.screenElement)
            throw new Error('WMSX cannot be started. ' +
            'HTML document is missing screen element with id "' + WMSX.SCREEN_ELEMENT_ID + '"');
    }

    // Emulator can only be started once
    delete WMSX.start;
    delete WMSX.preLoadImagesAndStart;

    // Apply Configuration, including Machine Type and URL Parameters if allowed. Assync continue after reading Config file if asked
    wmsx.Configurator.applyConfig(function applyConfigAfterFile() {

        // Init preferences
        WMSX.userPreferences.load();

        // Build and start emulator
        if (machinePowerOn === undefined) machinePowerOn = WMSX.AUTO_POWER_ON_DELAY >= 0;
        WMSX.room = new wmsx.Room(WMSX.screenElement, machinePowerOn);
        WMSX.room.powerOn();
        wmsx.Util.log("version " + WMSX.VERSION + " started");

        // Prepare ROM Database
        wmsx.ROMDatabase.uncompress();

        // NetPlay! auto-join Session?
        var joinSession = WMSX.NETPLAY_JOIN;

        // Auto-load BIOS, Expansions, State, Cartridges, Disks and Tape files if specified and downloadable
        if (!joinSession && WMSX.STATE_URL) {
            // Machine State loading, Machine will Auto Power on
            new wmsx.MultiDownloader(
                [{ url: WMSX.STATE_URL }],
                function onAllSuccess(urls) {
                    WMSX.room.start(function() {
                        WMSX.room.fileLoader.loadFromContent(urls[0].url, urls[0].content, wmsx.FileLoader.OPEN_TYPE.STATE, 0, false);
                    });
                }
            ).start();      // Asynchronous
        } else {
            // Normal media loading. Power Machine on only after all files are loaded and inserted, then join Session if needed
            var slotURLs = wmsx.Configurator.slotURLSpecs();
            var extensionsURLs = wmsx.Configurator.extensionsInitialURLSpecs();
            var mediaURLs = joinSession ? [] : wmsx.Configurator.mediaURLSpecs();       // Skip media loading if joining Session
            new wmsx.MultiDownloader(
                slotURLs.concat(mediaURLs).concat(extensionsURLs),
                function onAllSuccess() {
                    WMSX.room.start(joinSession
                        ? function() { WMSX.room.getNetClient().joinSession(joinSession, WMSX.NETPLAY_NICK); }
                        : undefined
                    );
                },
                function onAnyError(url) {
                    wmsx.Util.message(url.errorMessage);
                }
            ).start();      // Asynchronous if there are media to load, otherwise Synchronous
        }

    });

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
        alert("A new version is available!\nWebMSX will restart...");
        window.applicationCache.swapCache();
        window.location.reload();
    }
    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) onUpdateReady();
    else window.applicationCache.addEventListener("updateready", onUpdateReady);
}

WMSX.VERSION = "5.4.3";

// Start pre-loading images right away
WMSX.preLoadImagesAndStart();
