// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ExtensionsSocket = function(machine) {
"use strict";

    var self = this;

    function init() {
        wmsx.Configurator.addConfigurationStateListener(self);
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
        this.refreshConfigFromSlots();
        this.fireExtensionsAndCartridgesStateUpdate();
    };

    this.configurationStateUpdate = function() {
        config = WMSX.EXTENSIONS_CONFIG;
    };

    this.isActiveOnConf = function(ext, op2) {
        if (!config[ext]) return false;
        var op = config[ext].SLOT2 && op2 ? 2 : 1;
        return (WMSX.EXTENSIONS[ext] & op) !== 0;
    };

    this.isActiveOnSlot = function(ext, op2) {
        var conf = config[ext];
        if (!conf) return false;

        var hasOp2 = !!conf.SLOT2;
        var loaded = slotSocket.slotInserted(op2 && hasOp2 ? conf.SLOT2 : conf.SLOT);
        return !!loaded && loaded.rom.source === conf.URL;
    };

    this.activateExtension = function(ext, altPower, op2, skipMessage, internal) {
        if (!this.isActiveOnSlot(ext, op2)) this.toggleExtension(ext, altPower, op2, skipMessage, internal);
    };

    this.toggleExtension = function (ext, altPower, secOp, skipMessage, internal) {
        var conf = config[ext];
        if (!conf) return;

        var hasOp2 = !!conf.SLOT2;
        var both = hasOp2 && !conf.TOGGLE;
        secOp = secOp && hasOp2;

        var newOp = 0;

        //console.log(ext, WMSX.EXTENSIONS[ext]);

        switch (WMSX.EXTENSIONS[ext] || 0) {
            case 0: newOp = secOp ? 2 : 1; break;
            case 1: newOp = secOp ? both ? 3 : 2 : 0; break;
            case 2: newOp = secOp ? 0 : both ? 3 : 1; break;
            case 3: newOp = secOp ? 1 : 2; break;
        }

        if (hasOp2) {
            // Must remove first then add
            if ((newOp & 1) === 0) {
                updateExtensionOnConf(ext, false, false);
                updateExtensionOnConf(ext, (newOp & 2) !== 0, true);
            } else {
                updateExtensionOnConf(ext, (newOp & 2) !== 0, true);
                updateExtensionOnConf(ext, true, false);
            }
        } else {
            updateExtensionOnConf(ext, (newOp & 1) !== 0, false);
        }

        var powerWasOn = machine.powerIsOn;
        if (!altPower && powerWasOn) machine.powerOff();
        var wasPaused = machine.systemPause(true);

        this.refreshSlotsFromConfig(function(changed) {
            if (!internal) machine.getSavestateSocket().externalStateChange();
            if (!wasPaused) machine.systemPause(false);
            if (!altPower && powerWasOn) machine.userPowerOn(false);
            if (changed && !skipMessage) {
                var slotDesc = machine.getSlotSocket().getSlotDesc(newOp & 2 ? conf.SLOT2 : conf.SLOT);
                var mes = conf.DESC + " Extension " + (newOp ? "enabled" + (newOp === 3 ? " at both slots" : (slotDesc ? " at slot " + slotDesc : "")) : "disabled");
                machine.showOSD(mes, true);
                wmsx.Util.log(mes);
            }
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
                if (!self.isActiveOnSlot(ext, false)) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext, false));
            } else {
                if (self.isActiveOnSlot(ext, false)) toRemoveSlots.push(conf.SLOT);
            }
            if (conf.SLOT2) {
                if (WMSX.EXTENSIONS[ext] & 2) {
                    if (!self.isActiveOnSlot(ext, true)) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext, true));
                } else {
                    if (self.isActiveOnSlot(ext, true)) toRemoveSlots.push(conf.SLOT2);
                }
            }
        }

        // Nothing to do?
        if (toLoadUrlSpecs.length === 0 && toRemoveSlots.length === 0) {
            self.fireExtensionsAndCartridgesStateUpdate();
            return then(false);
        }

        // Remove
        for (var i = 0; i < toRemoveSlots.length; ++i) slotSocket.insertSlot(null, toRemoveSlots[i], true, true);   // internal

        // Insert
        new wmsx.MultiDownloader(
            toLoadUrlSpecs,
            function onAllSuccess() {
                self.fireExtensionsAndCartridgesStateUpdate();
                then(true);
            },
            function onAnyError(url) {
                wmsx.Util.message(url.errorMessage);
            }
        ).start();      // May be asynchronous if Extensions use ROMs not embedded
    };

    this.refreshConfigFromSlots = function(){
        for (var ext in config) {
            var state = self.isActiveOnSlot(ext, false) ? 1 : 0;
            state |= (config[ext].SLOT2 && self.isActiveOnSlot(ext, true)) ? 2 : 0;
            WMSX.EXTENSIONS[ext] = state;
        }
    };

    function updateExtensionOnConf(ext, val, op2, stopRecursion) {
        if (!config[ext]) return;
        op2 = op2 && !!config[ext].SLOT2;
        if (self.isActiveOnConf(ext, op2) === val) return;

        //console.log("Update ext: ", ext, val, "op2:", op2);

        WMSX.EXTENSIONS[ext] ^= (op2 ? 2 : 1);

        if (stopRecursion) return;

        var conf = config[ext];
        if (conf.MUTUAL) updateExtensionOnConf(conf.MUTUAL, !val, op2, true);
        if (val) {
            // Activate or Deactivate on same op
            if (conf.CHANGE)
                for (var c in conf.CHANGE) updateExtensionOnConf(c, !!conf.CHANGE[c], op2, true);
            // Toggle options with partner extension if activated
            if (conf.TOGGLE) {
                c = conf.TOGGLE;
                if (self.isActiveOnConf(c, op2)) {
                    updateExtensionOnConf(c, false, op2, true);
                    if (!self.isActiveOnConf(ext, !op2)) updateExtensionOnConf(c, true, !op2, true);     // only if we are not there too!
                }
            }
            // Activate others that we require
            //if (conf.require)
            //    for (var r = 0, req = conf.require.split(","); r < req.length; ++r) updateExtensionOnConf(req[r].trim(), true, op2, false);
        } else {
            // Deactivate others that require this
            //for (var dep in config)
            //    if (config[dep].require && config[dep].require.indexOf(ext) >= 0) {
            //        updateExtensionOnConf(dep, false, false, false);
            //        updateExtensionOnConf(dep, false, true, false);
            //    }
        }
    }

    function makeLoaderUrlSpec(ext, op2) {
        return {
            url: config[ext].URL || "",
            onSuccess: function (res) {
                fileLoader.loadFromContentAsSlot(res.url, res.content, op2 ? config[ext].SLOT2 : config[ext].SLOT, true, null, null, true);     // altPower, internal
            }
        };
    }


    var config = WMSX.EXTENSIONS_CONFIG;

    var slotSocket = machine.getSlotSocket();
    var fileLoader;

    var listeners = [];


    init();

};
