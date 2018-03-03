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

    this.isActive = function(ext, op2) {
        var loaded = slotSocket.slotInserted(op2 ? config[ext].OP2 : config[ext].OP1);
        return !!loaded && loaded.format.name === config[ext].format;
    };

    this.getActiveCombinedOps = function(ext) {
        var op = this.isActive(ext, false) ? 1 : 0;
        op |= (config[ext].OP2 ? this.isActive(ext, true) : op) ? 2 : 0;
        return op;
    };

    this.isValid = function(ext) {
        var regFlag = config[ext].requireFlag;
        return !regFlag || WMSX[regFlag];
    };

    // TODO Fix. Toggling is broken for op1 only exts. Message is broken.
    this.toggleExtension = function (ext, altPower, secOp) {
        if (config[ext] === undefined) return;
        var hasOp2 = !!config[ext].OP2;
        secOp = secOp && hasOp2;

        var newOp = 0;

        console.log(this.getActiveCombinedOps(ext));

        switch (this.getActiveCombinedOps(ext)) {
            case 0: newOp = 1; break;
            case 1: newOp = hasOp2 ? 2 : 0; break;
            case 2: newOp = hasOp2 && config[ext].both ? 3 : 0; break;
            case 3: newOp = 0; break;
        }

        updateExtension(ext, (newOp & 1) !== 0, false);
        updateExtension(ext, (newOp & 2) !== 0, true);

        var powerWasOn = machine.powerIsOn;
        if (!altPower && powerWasOn) machine.powerOff();
        var wasPaused = machine.systemPause(true);

        this.refreshSlotsFromConfig(function(changed) {
            if (!wasPaused) machine.systemPause(false);
            if (!altPower && powerWasOn) machine.userPowerOn(false);
            if (changed) {
                var mes = config[ext].desc + " Extension " + (newOp ? "enabled at slot " + machine.getSlotSocket().getSlotDesc(secOp ? config[ext].OP2 : config[ext].OP1) : "disabled");
                machine.showOSD(mes, true);
                console.log(mes);
            }
        });
    };

    this.getInitialLoaderURLSpecs = function() {
        var loaderUrlSpecs = [];
        for (var ext in config) {
            if (WMSX.EXTENSIONS[ext] & 1) loaderUrlSpecs.push(makeLoaderUrlSpec(ext, false));
            if (config[ext].OP2 && (WMSX.EXTENSIONS[ext] & 2)) loaderUrlSpecs.push(makeLoaderUrlSpec(ext, true));
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
                if (self.isActive(ext, false)) toRemoveSlots.push(conf.OP1);
            }
            if (conf.OP2) {
                if (WMSX.EXTENSIONS[ext] & 2) {
                    if (!self.isActive(ext, true)) toLoadUrlSpecs.push(makeLoaderUrlSpec(ext, true));
                } else {
                    if (self.isActive(ext, true)) toRemoveSlots.push(conf.OP2);
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
            }
        ).start();      // Synchronous since all loaded files are Embedded
    };

    function refreshConfigFromSlots() {
        for (var ext in config) {
            var state = self.isActive(ext, false) ? 1 : 0;
            state |= (config[ext].OP2 && self.isActive(ext, true)) ? 2 : 0;
            WMSX.EXTENSIONS[ext] = state;
        }
    }

    function updateExtension(ext, val, op2, stopRecursion) {
        op2 = op2 && !!config[ext].OP2;
        if (self.isActive(ext, op2) === val) return;

        console.log("Update ext: ", ext, val, "op2:", op2);

        WMSX.EXTENSIONS[ext] ^= (op2 ? 2 : 1);

        if (stopRecursion) return;

        var conf = config[ext];
        if (val) {
            // Activate or Deactivate on same op
            if (conf.change)
                for (var c in conf.change) updateExtension(c, !!conf.change[c], op2, true);
            // Toggle options with partner extension if activated
            if (conf.toggleOp) {
                c = conf.toggleOp;
                if (self.isActive(c, op2)) {
                    updateExtension(c, false, op2, true);
                    if (!self.isActive(ext, !op2)) updateExtension(c, true, !op2, true);     // only if we are not there too!
                }
            }
            // Activate others that we require
            if (conf.require)
                for (var r = 0, req = conf.require.split(","); r < req.length; ++r) updateExtension(req[r].trim(), true, op2, false);
        } else {
            // Deactivate others that require this
            for (var dep in config)
                if (config[dep].require && config[dep].require.indexOf(ext) >= 0) {
                    updateExtension(dep, false, false, false);
                    updateExtension(dep, false, true, false);
                }
        }
    }

    function makeLoaderUrlSpec(ext, op2) {
        return {
            url: wmsx.SlotFormats[config[ext].format].embeddedURL || "",
            onSuccess: function (res) {
                fileLoader.loadFromContentAsSlot(res.url, res.content, op2 ? config[ext].OP2 : config[ext].OP1, true, true);     // internal
            }
        };
    }


    var config = WMSX.EXTENSIONS_CONFIG;

    var slotSocket = machine.getSlotSocket();
    var fileLoader;

    var listeners = [];

};
