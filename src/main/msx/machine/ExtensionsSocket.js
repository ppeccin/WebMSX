// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ExtensionsSocket = function(machine) {

    function init() {
        all = {};
        loaded = {};
        config = WMSX.EXTENSIONS_CONFIG;
        for (var ext in config) all[ext] = !!WMSX.EXTENSIONS[ext];
    }

    this.connectFileLoader = function(pFileLoader) {
        fileLoader = pFileLoader;
    };

    this.addExtensionsStateListener = function (listener) {
        if (listeners.indexOf(listener) < 0) {
            listeners.push(listener);
            listener.extensionStateUpdate();
        }
    };

    this.getConfiguration = function() {
        return config;
    };

    this.isActive = function(ext) {
        return all[ext];
    };

    this.toggle = function(ext, altPower) {
        if (all[ext] === undefined) return;
        if (WMSX.MEDIA_CHANGE_DISABLED) return machine.showOSD("Extension change is disabled", true);

        all[ext] = !all[ext];
        if (config[ext].mutual) all[config[ext].mutual] = !all[ext];
        if (config[ext].exclude) all[config[ext].exclude] = false;

        machine.showOSD(config[ext].desc + " Extension " + (all[ext] ? "enabled" : "disabled"), true);

        this.refresh(altPower);
    };

    this.refresh = function (altPower) {
        var toLoadUrlSpecs = [];
        var toRemoveSlots = [];
        for (var ext in all) {
            if (all[ext]) {
                if (!loaded[ext]) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext));
                loaded[ext] = true;
            } else {
                if (loaded[ext] && isExtensionLoadedInSlot(ext)) toRemoveSlots.push(config[ext].slot);
                loaded[ext] = false;
            }
        }

        // Nothing to do?
        if (toLoadUrlSpecs.length === 0 && toRemoveSlots.length === 0) return;

        var powerWasOn = machine.powerIsOn;
        if (!altPower && powerWasOn) machine.powerOff();

        // Remove now inactive loaded extensions
        for (var i = 0; i < toRemoveSlots.length; ++i)
            slotSocket.insert(null, toRemoveSlots[i], true);

        // Insert now active not loaded extensions
        new wmsx.MultiDownloader(toLoadUrlSpecs,
            function onSuccessAll() {
                if (!altPower && powerWasOn) machine.userPowerOn(true);
            },
            function onErrorAny(urls) {
                for (var i = 0; i < urls.length; i++) {
                    if (urls[i] && !urls[i].success) {
                        var mes = "Could not load file: " + urls[i].url + "\nError: " + urls[i].error;
                        wmsx.Util.log(mes);
                        wmsx.Util.message(mes);
                    }
                }
            }
        ).start();

        for (var u = 0; u < listeners.length; ++u) listeners[u].extensionStateUpdate();
    };

    this.getDefaultActiveLoaderURLSpecs = function() {
        var loaderUrlSpecs = [];
        for (var ext in all)
            if (all[ext]) loaderUrlSpecs.push(makeLoaderUrlSpec(ext));
        return loaderUrlSpecs;
    };

    this.confirmDefaultActive = function() {
        for (var ext in all) loaded[ext] = all[ext];
    };

    function makeLoaderUrlSpec(ext) {
        return {
            url: config[ext].url,
            onSuccess: function (res) {
                fileLoader.loadContentAsSlot(res.url, res.content, config[ext].slot, true);
            }
        };
    }

    function isExtensionLoadedInSlot(ext) {
        var conf = config[ext];
        var loaded = slotSocket.inserted(conf.slot);
        return loaded && loaded.rom && loaded.rom.source == conf.url;
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: all,
            l: loaded,
            c: config
        };
    };

    this.loadState = function(s) {
        all = s.a;
        loaded = s.l;
        config = s.c;
        // No need to refresh slots since they will be already in place
        for (var u = 0; u < listeners.length; ++u) listeners[u].extensionStateUpdate();
    };


    var all, loaded, config;

    var slotSocket = machine.getSlotSocket();
    var fileLoader;

    var listeners = [];

    init();

};
