// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MachineTypeSocket = function(machine) {
"use strict";

    var self = this;

    this.getMachine = function() {
        return machine.machineName;
    };

    this.isJapaneseMachine = function() {
        return WMSX.MACHINES_CONFIG[machine.machineName].japanese === true;
    };

    this.changeMachine = function (name) {
        if (machine.machineName == name) return;
        if (WMSX.MEDIA_CHANGE_DISABLED) return name.showOSD("Machine change is disabled!", true, true);

        var machineConfig = WMSX.MACHINES_CONFIG[name];
        if (!machineConfig) return;

        wmsx.Configurator.applyPresets(machineConfig.presets);

        var wasOn = machine.powerIsOn;
        machine.powerOff();
        var wasPaused = machine.systemPause(true);
        machine.setMachine(name);

        new wmsx.MultiDownloader(
            wmsx.Configurator.slotURLSpecs(),
            function onAllSuccess() {
                machine.getExtensionsSocket().refreshSlotsFromConfig(function() {
                    if (!wasPaused) machine.systemPause(false);
                    if (wasOn) machine.powerOn();
                    machine.showOSD(machineConfig.desc + " machine activated", true);
                    self.fireMachineTypeStateUpdate();
                });
            }
        ).start();      // Synchronous since all loaded files are Embedded
    };

    this.addMachineTypeStateListener = function (listener) {
        if (listeners.indexOf(listener) < 0) {
            listeners.push(listener);
            listener.machineTypeStateUpdate();
        }
    };

    this.fireMachineTypeStateUpdate = function() {
        for (var u = 0; u < listeners.length; ++u) listeners[u].machineTypeStateUpdate();
    };


    var listeners = [];

};
