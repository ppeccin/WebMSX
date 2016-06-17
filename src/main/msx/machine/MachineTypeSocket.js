// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MachineTypeSocket = function(machine) {
    var self = this;

    this.isActive = function(name) {
        return WMSX.MACHINE == name;
    };

    this.activateMachine = function (name) {
        if (WMSX.MACHINE == name) return;
        if (WMSX.MEDIA_CHANGE_DISABLED) return name.showOSD("Machine change is disabled!", true, true);

        var machineConfig = WMSX.MACHINES_CONFIG[name];
        if (!machineConfig) return;

        WMSX.MACHINE = name;
        wmsx.Configurator.applyPresets(machineConfig.presets);

        var wasOn = machine.powerIsOn;
        machine.powerOff();

        new wmsx.MultiDownloader(
            wmsx.Configurator.slotURLSpecs(),
            function onAllSuccess() {
                machine.setMachineType(WMSX.MACHINE_TYPE);
                if (wasOn) machine.powerOn();
                machine.showOSD(machineConfig.desc + " machine activated", true);
                self.fireStateUpdate();
            }
        ).start();
    };

    this.addMachineTypeStateListener = function (listener) {
        if (listeners.indexOf(listener) < 0) {
            listeners.push(listener);
            listener.machineTypeStateUpdate();
        }
    };

    this.fireStateUpdate = function() {
        for (var u = 0; u < listeners.length; ++u) listeners[u].machineTypeStateUpdate();
    };


    var listeners = [];

};
