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
    // Build and start emulator
    WMSX.room = new wmsx.Room(WMSX.screenElement);
    WMSX.room.powerOn();
    wmsx.Util.log(WMSX.VERSION + " started");

    var roomPowerOnTime = Date.now();

    // Prepare ROM Database
    wmsx.ROMDatabase.uncompress();

    // Auto-load BIOS, Expansions, Cartridges, Disks and Tape files if specified
    if (WMSX.STATE_LOAD_URL) {
        // Only 1 file, Machine will Auto Power on
        new wmsx.MultiDownloader([{
            url: WMSX.STATE_LOAD_URL,
            onSuccess: function(res) {
                afterAutoStartWait(function() {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 0, false);
                });
            },
            onError: function(res) {
                var mes = "Could not load file: " + res.url + "\nError: " + res.error;
                wmsx.Util.log(mes);
                wmsx.Util.message(mes);
            }
        }]).start();
    } else if (WMSX.BIOS_URL) {
        var urls = [
            WMSX.EXPANSION0_URL && {
                url: WMSX.EXPANSION0_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 0, false, true);
                }
            },
            WMSX.EXPANSION1_URL && {
                url: WMSX.EXPANSION1_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 1, false, true);
                }
            },
            WMSX.EXPANSION2_URL && {
                url: WMSX.EXPANSION2_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 2, false, true);
                }
            },
            WMSX.CARTRIDGE1_URL && {
                url: WMSX.CARTRIDGE1_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 0, false);
                }
            },
            WMSX.CARTRIDGE2_URL && {
                url: WMSX.CARTRIDGE2_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 1, false);
                }
            },
            WMSX.DISKA_URL && {
                url: WMSX.DISKA_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 0, false);
                }
            },
            WMSX.DISKB_URL && {
                url: WMSX.DISKB_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 1, false);
                }
            },
            WMSX.TAPE_URL && {
                url: WMSX.TAPE_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 0, false);
                }
            },
            {   // BIOS
                url: WMSX.BIOS_URL,
                onSuccess: function (res) {
                    WMSX.room.fileLoader.loadContent(res.url, res.content, 0, false);
                }
            }
        ];
        // Power Machine on only after all slots are loaded and inserted
        new wmsx.MultiDownloader(urls,
            function onSuccessAll() {
                afterAutoStartWait(function() {
                    WMSX.room.machine.userPowerOn(true);
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


    WMSX.shutdown = function () {
        if (WMSX.room) WMSX.room.powerOff();
        wmsx.Util.log("shutdown");
        delete WMSX;
    };

};


// Pre-load images and start emulator as soon as all are loaded and DOM is ready
WMSX.preLoadImagesAndStart = function() {
    var images = [ "sprites.png", "logo.png", "screenborder.png" ];
    var numImages = images.length;

    var domReady = false;
    var imagesToLoad = numImages;
    function tryLaunch(bypass) {
        if (WMSX.start && WMSX.AUTO_START_DELAY >= 0 && (bypass || (domReady && imagesToLoad === 0)))
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
