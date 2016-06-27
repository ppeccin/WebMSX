// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ExtensionsSocket = function(machine) {
"use strict";

    var self = this;

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
        refreshConfigFromSlots();
        this.fireExtensionsAndCartridgesStateUpdate();
    };

    this.isActive = function(ext, secSlot) {
        var loaded = slotSocket.inserted(secSlot ? config[ext].SLOT2 : config[ext].SLOT);
        return !!loaded && loaded.format.name == config[ext].format;
    };

    this.isActiveAnySlot = function(ext) {
        return this.isActive(ext, false) || (config[ext].SLOT2 && this.isActive(ext, true));
    };

    this.isValid = function(ext) {
        var regFlag = config[ext].requireFlag;
        return !regFlag || WMSX[regFlag];
    };

    this.toggleExtension = function (ext, altPower, secSlot) {
        if (config[ext] === undefined) return;
        if (WMSX.MEDIA_CHANGE_DISABLED) return machine.showOSD("Extension change is disabled!", true, true);
        secSlot = secSlot && config[ext].SLOT2;

        var newVal = !this.isActive(ext, secSlot);
        updateExtension(ext, newVal, secSlot);

        var powerWasOn = machine.powerIsOn;
        if (!altPower && powerWasOn) machine.powerOff();

        this.refreshSlotsFromConfig(function(changed) {
            if (!altPower && powerWasOn) machine.userPowerOn(true);
            if (changed) machine.showOSD(config[ext].desc + " Extension " +
                (newVal ? "enabled at slot " + machine.getSlotSocket().getSlotDesc(secSlot ? config[ext].SLOT2 : config[ext].SLOT) : "disabled"), true);
        });
    };

    this.getInitialLoaderURLSpecs = function() {
        var loaderUrlSpecs = [];
        for (var ext in config) {
            if (WMSX.EXTENSIONS[ext] & 1) loaderUrlSpecs.push(makeLoaderUrlSpec(ext, false));
            if (config[ext].SLOT2 && (WMSX.EXTENSIONS[ext] & 2)) loaderUrlSpecs.push(makeLoaderUrlSpec(ext, true));
        }
        return loaderUrlSpecs;
    };

    this.fireExtensionsAndCartridgesStateUpdate = function() {
        for (var u = 0; u < listeners.length; ++u) listeners[u].extensionsAndCartridgesStateUpdate();
    };

    this.refreshSlotsFromConfig = function(then) {
        var toLoadUrlSpecs = [];
        var toRemoveSlots = [];

        for (var ext in config) {
            var conf = config[ext];
            if (WMSX.EXTENSIONS[ext] & 1) {
                if (!self.isActive(ext, false)) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext, false));
            } else {
                if (self.isActive(ext, false)) toRemoveSlots.push(conf.SLOT);
            }
            if (conf.SLOT2) {
                if (WMSX.EXTENSIONS[ext] & 2) {
                    if (!self.isActive(ext, true)) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext, true));
                } else {
                    if (self.isActive(ext, true)) toRemoveSlots.push(conf.SLOT2);
                }
            }
        }

        // Nothing to do?
        if (toLoadUrlSpecs.length === 0 && toRemoveSlots.length === 0) {
            self.fireExtensionsAndCartridgesStateUpdate();
            return then(false);
        }

        // Remove
        for (var i = 0; i < toRemoveSlots.length; ++i) slotSocket.insert(null, toRemoveSlots[i], true);

        // Insert
        new wmsx.MultiDownloader(toLoadUrlSpecs,
            function done() {
                self.fireExtensionsAndCartridgesStateUpdate();
                then(true);
            }
        ).start();
    };

    function refreshConfigFromSlots() {
        for (var ext in config) {
            var state = self.isActive(ext, false) ? 1 : 0;
            state |= (config[ext].SLOT2 && self.isActive(ext, true)) ? 2 : 0;
            WMSX.EXTENSIONS[ext] = state;
        }
    }

    function updateExtension(ext, val, secSlot, stopRecursion) {
        secSlot = secSlot && config[ext].SLOT2;
        if (self.isActive(ext, secSlot) == val) return;

        var conf = config[ext];
        if (conf.mutual && !stopRecursion) updateExtension(conf.mutual, !val, secSlot, true);
        if (val) {
            if (conf.require)
                for (var r = 0, req = conf.require.split(","); r < req.length; ++r) updateExtension(req[r].trim(), true, secSlot);
            if (conf.remove)
                for (var e = 0, rem = conf.remove.split(","); e < rem.length; ++e) updateExtension(rem[e].trim(), false, secSlot);
        } else {
            for (var dep in config)
                if (config[dep].require && config[dep].require.indexOf(ext) >= 0) updateExtension(dep, false, secSlot);
        }

        WMSX.EXTENSIONS[ext] ^= (secSlot ? 2 : 1);
    }

    function makeLoaderUrlSpec(ext, secSlot) {
        return {
            url: wmsx.SlotFormats[config[ext].format].embeddedURL || "",
            onSuccess: function (res) {
                fileLoader.loadContentAsSlot(res.url, res.content, secSlot ? config[ext].SLOT2 : config[ext].SLOT, true);
            }
        };
    }


    var config = WMSX.EXTENSIONS_CONFIG;

    var slotSocket = machine.getSlotSocket();
    var fileLoader;

    var listeners = [];

};
