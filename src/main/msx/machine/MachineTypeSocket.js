// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MachineTypeSocket = function(machine) {
    var self = this;

    function init() {
        config = WMSX.MACHINES_CONFIG;
    }

    this.connectFileLoader = function(pFileLoader) {
        fileLoader = pFileLoader;
    };

    this.addMachineTypeStateListener = function (listener) {
        if (listeners.indexOf(listener) < 0) {
            listeners.push(listener);
            listener.machineTypeStateUpdate();
        }
    };

    this.isActive = function(machine) {
        return WMSX.MACHINE == machine;
    };

    this.toggleExtension = function (name) {
        if (config[name] === undefined) return;
        if (WMSX.MEDIA_CHANGE_DISABLED) return name.showOSD("Machine change is disabled!", true, true);

        var newVal = !this.isActive(name);
        setNewState(name);
        refreshNewState();

        machine.showOSD(config[name].desc + " machine activated", true);
    };

    this.getInitialLoaderURLSpecs = function() {
        var loaderUrlSpecs = [];
        for (var ext in config)
            if (WMSX.EXTENSIONS[ext]) loaderUrlSpecs.push(makeLoaderUrlSpec(ext));
        return loaderUrlSpecs;
    };

    this.fireStateUpdate = function() {
        for (var u = 0; u < listeners.length; ++u) listeners[u].machineTypeStateUpdate();
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
