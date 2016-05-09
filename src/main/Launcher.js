// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSX.start = function () {
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

    // Read and apply parameters from URL
    if (WMSX.ALLOW_URL_PARAMETERS)
        wmsx.Configurator.applyConfig();            // Will also apply specified preset
    else
        wmsx.Configurator.applyPresets();           // Apply only predefined preset

    // Build and start emulator
    WMSX.room = new wmsx.Room(WMSX.screenElement);
    WMSX.room.powerOn();
    wmsx.Util.log(WMSX.VERSION + " started");
    var roomPowerOnTime = Date.now();

    // Prepare ROM Database
    wmsx.ROMDatabase.create();

    // Auto-load BIOS, Expansions, Cartridges, Disks and Tape files if specified and downloadable
    if (WMSX.STATE_LOAD_URL) {
        WMSX.room.loading(true);
        // Only 1 file, Machine will Auto Power on
        new wmsx.MultiDownloader([{
            url: WMSX.STATE_LOAD_URL,
            onSuccess: function (res) {
                wmsx.Clock.detectHostNativeFPSAndCallback(function() {
                    afterAutoStartWait(function () {
                        WMSX.room.loading(false);
                        WMSX.room.fileLoader.loadContentAsMedia(res.url, res.content, 0, false);
                    });
                    wmsx.EmbeddedSystemROMs.flush();
                });
            },
            onError: function (res) {
                var mes = "Could not load file: " + res.url + "\nError: " + res.error;
                wmsx.Util.log(mes);
                wmsx.Util.message(mes);
            }
        }]).start();
    } else {
        // Multiple files. Power Machine on only after all files are loaded and inserted
        WMSX.room.loading(true);
        var slotURLs = slotURLSpecs();
        var mediaURLs = mediaURLSpecs();
        new wmsx.MultiDownloader(slotURLs.concat(mediaURLs),
            function onSuccessAll() {
                wmsx.Clock.detectHostNativeFPSAndCallback(function() {
                    afterAutoStartWait(function () {
                        WMSX.room.loading(false);
                        WMSX.room.machine.userPowerOn(true);
                    });
                    wmsx.EmbeddedSystemROMs.flush();
                });
            }, function onErrorAny(urls) {
                for (var i = 0; i < urls.length; i++) {
                    if (urls[i] && !urls[i].success) {
                        var mes = "Could not load file: " + urls[i].url + "\nError: " + urls[i].error;
                        wmsx.Util.log(mes);
                        wmsx.Util.message(mes);
                    }
                }
            }
        ).start();
    }

    function afterAutoStartWait(func) {
        if (WMSX.AUTO_START_DELAY < 0) return;
        var wait = WMSX.AUTO_START_DELAY - (Date.now() - roomPowerOnTime);
        if (wait < 0) wait = 0;
        window.setTimeout(func, wait);
    }

    function mediaURLSpecs() {
        // URLs specified by fixed media loading parameters
        return [
            WMSX.CARTRIDGE1_URL && {
                url: WMSX.CARTRIDGE1_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContentAsMedia(res.url, res.content, 0, true);
                }
            },
            WMSX.CARTRIDGE2_URL && {
                url: WMSX.CARTRIDGE2_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContentAsMedia(res.url, res.content, 1, true);
                }
            },
            WMSX.DISKA_URL && {
                url: WMSX.DISKA_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContentAsMedia(res.url, res.content, 0, true);
                }
            },
            WMSX.DISKB_URL && {
                url: WMSX.DISKB_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContentAsMedia(res.url, res.content, 1, true);
                }
            },
            WMSX.TAPE_URL && {
                url: WMSX.TAPE_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContentAsMedia(res.url, res.content, 0, true);
                }
            }
        ];
    }

    function slotURLSpecs() {
        // Any URL specified in the format SLOT_N_N_URL
        var slotsPars = Object.keys(WMSX).filter(function(key) {
            return wmsx.Util.stringStartsWith(key, "SLOT") && wmsx.Util.stringEndsWith(key, "URL")
                && key.match(/[0-9]+/g);
        });

        return slotsPars.map(function(key) {
            var pos = key.match(/[0-9]+/g).map(function(strNum) {
                return strNum | 0;
            });
            return {
                url: WMSX[key],
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContentAsSlot(res.url, res.content, pos, true);
                }
            }

        });
    }


    WMSX.shutdown = function () {
        if (WMSX.room) WMSX.room.powerOff();
        wmsx.Util.log("shutdown");
        delete WMSX;
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

WMSX.VERSION = "version 2.0";

// Start pre-loading images right away
WMSX.preLoadImagesAndStart();
