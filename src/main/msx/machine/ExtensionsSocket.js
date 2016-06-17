// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ExtensionsSocket = function(machine) {
    var self = this;

    function init() {
        config = WMSX.EXTENSIONS_CONFIG;
        for (var c in config) if (!config[c].SLOT2) config[c].SLOT2 = config[c].SLOT;
    }

    this.connectFileLoader = function(pFileLoader) {
        fileLoader = pFileLoader;
    };

    this.addExtensionsAndCartridgesStateListener = function (listener) {
        machine.getCartridgeSocket().addCartridgesStateListener(this, true);
        if (listeners.indexOf(listener) < 0) {
            listeners.push(listener);
            listener.extensionsAndCartridgesStateUpdate();
        }
    };

    this.cartridgesStateUpdate = function() {
        this.fireStateUpdate();
    };

    this.isActive = function(ext, secSlot) {
        var loaded = slotSocket.inserted(secSlot ? config[ext].SLOT2 : config[ext].SLOT);
        return loaded && loaded.format.name == config[ext].format;
    };

    this.isActiveAnySlot = function(ext) {
        var conf = config[ext];
        var loaded = slotSocket.inserted(conf.SLOT);
        if (loaded && loaded.format.name == conf.format) return true;
        if (conf.SLOT2 === conf.SLOT) return false;
        loaded = slotSocket.inserted(conf.SLOT2);
        return loaded && loaded.format.name == conf.format;
    };

    this.toggleExtension = function (ext, altPower, secSlot) {
        if (config[ext] === undefined) return;
        if (WMSX.MEDIA_CHANGE_DISABLED) return machine.showOSD("Extension change is disabled!", true, true);

        var newVal = !this.isActive(ext, secSlot);
        setNewState(ext, newVal, secSlot);
        refreshNewState(altPower);

        machine.showOSD(config[ext].desc + " Extension " +
            (newVal ? "enabled at slot " + machine.getSlotSocket().getSlotDesc(secSlot ? config[ext].SLOT2 : config[ext].SLOT) : "disabled"), true);
    };

    this.getDefaultActiveLoaderURLSpecs = function() {
        var loaderUrlSpecs = [];
        for (var ext in config)
            if (WMSX.EXTENSIONS[ext]) loaderUrlSpecs.push(makeLoaderUrlSpec(ext));
        return loaderUrlSpecs;
    };

    this.fireStateUpdate = function() {
        for (var u = 0; u < listeners.length; ++u) listeners[u].extensionsAndCartridgesStateUpdate();
    };

    function setNewState(ext, val, secSlot, stopRecursion) {
        if (self.isActive(ext, secSlot) == val) return;

        var conf = config[ext];
        if (conf.mutual && !stopRecursion) setNewState(conf.mutual, !val, secSlot, true);
        if (val) {
            if (conf.require)
                for (var r = 0, req = conf.require.split(","); r < req.length; ++r) setNewState(req[r].trim(), true, secSlot);
        } else {
            for (var dep in config)
                if (config[dep].require && config[dep].require.indexOf(ext) >= 0) setNewState(dep, false, secSlot);
        }

        conf.newState = val;
        conf.newStateSecSlot = secSlot;
    }

    function refreshNewState(altPower) {
        var toLoadUrlSpecs = [];
        var toRemoveSlots = [];
        for (var ext in config) {
            var conf = config[ext];
            if (conf.newState === false) toRemoveSlots.push(conf.newStateSecSlot ? conf.SLOT2 : conf.SLOT);
            else if (conf.newState === true) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext, conf.newStateSecSlot));
            conf.newState = null;
        }

        // Nothing to do?
        if (toLoadUrlSpecs.length === 0 && toRemoveSlots.length === 0) return;

        var powerWasOn = machine.powerIsOn;
        if (!altPower && powerWasOn) machine.powerOff();

        // Remove
        for (var i = 0; i < toRemoveSlots.length; ++i) slotSocket.insert(null, toRemoveSlots[i], true);

        // Insert
        new wmsx.MultiDownloader(toLoadUrlSpecs,
            function onSuccessAll() {
                self.fireStateUpdate();
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
    }

    function makeLoaderUrlSpec(ext, secSlot) {
        return {
            url: wmsx.SlotFormats[config[ext].format].embeddedURL || "",
            onSuccess: function (res) {
                fileLoader.loadContentAsSlot(res.url, res.content, secSlot ? config[ext].SLOT2 : config[ext].SLOT, true);
            }
        };
    }


    var config;

    var slotSocket = machine.getSlotSocket();
    var fileLoader;

    var listeners = [];


    init();

};
