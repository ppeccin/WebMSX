// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ExtensionsSocket = function(machine) {

    function init() {
        for (var ext in config) active[ext] = !!WMSX.EXTENSIONS[ext];
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
        return active[ext];
    };

    this.toggleExtension = function(ext, altPower) {
        if (config[ext] === undefined) return;
        if (WMSX.MEDIA_CHANGE_DISABLED) return machine.showOSD("Extension change is disabled", true);

        set(ext, !active[ext], altPower);
        machine.showOSD(config[ext].desc + " Extension " + (active[ext] ? "enabled" : "disabled"), true);
        this.refresh(altPower);
    };

    this.refresh = function (altPower) {
        var toLoadUrlSpecs = [];
        var toRemoveSlots = [];
        for (var ext in config) {
            if (active[ext]) {
                if (!loaded[ext]) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext));
                loaded[ext] = true;
            } else {
                if (loaded[ext] && isExtensionLoadedInSlot(ext)) toRemoveSlots.push(config[ext].SLOT);
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

        fireUpdate();
    };

    this.getDefaultActiveLoaderURLSpecs = function() {
        var loaderUrlSpecs = [];
        for (var ext in config)
            if (active[ext]) loaderUrlSpecs.push(makeLoaderUrlSpec(ext));
        return loaderUrlSpecs;
    };

    this.confirmDefaultActiveLoaded = function() {
        for (var ext in config) loaded[ext] = active[ext];
        fireUpdate();
    };

    function set(ext, val, altPower) {
        if (active[ext] == val) return;

        active[ext] = val;
        if (config[ext].mutual) set(config[ext].mutual, !val, altPower);
        if (val) {
            if (config[ext].require)
                for (var r = 0, req = config[ext].require.split(","); r < req.length; ++r) set(req[r].trim(), true, altPower);
            if (config[ext].exclude)
                for (var e = 0, exc = config[ext].exclude.split(","); e < exc.length; ++e) set(exc[e].trim(), false, altPower);
        } else {
            for (var dep in config)
                if (config[dep].require && config[dep].require.indexOf(ext) >= 0) set(dep, false, altPower);
        }
    }

    function fireUpdate() {
        for (var u = 0; u < listeners.length; ++u) listeners[u].extensionStateUpdate();
    }

    function makeLoaderUrlSpec(ext) {
        return {
            url: config[ext].url,
            onSuccess: function (res) {
                fileLoader.loadContentAsSlot(res.url, res.content, config[ext].SLOT, true);
            }
        };
    }

    function isExtensionLoadedInSlot(ext) {
        var conf = config[ext];
        var loaded = slotSocket.inserted(conf.SLOT);
        return loaded && loaded.rom && loaded.rom.source == conf.url;
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: active,
            l: loaded,
            c: config
        };
    };

    this.loadState = function(s) {
        active = s.a;
        loaded = s.l;
        config = s.c;
        // No need to refresh slots since they will be already in place
        for (var u = 0; u < listeners.length; ++u) listeners[u].extensionStateUpdate();
    };


    var active = {};
    var loaded = {};
    var config = WMSX.EXTENSIONS_CONFIG;

    var slotSocket = machine.getSlotSocket();
    var fileLoader;

    var listeners = [];

    init();

};
