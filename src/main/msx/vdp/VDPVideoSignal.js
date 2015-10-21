// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VDPVideoSignal = function() {

    this.connectMonitor = function(pMonitor) {
        this.monitor = pMonitor;
    };

    this.newFrame = function(image) {
        this.monitor.newFrame(image);
    };

    this.signalOff = function() {
        if (this.monitor) this.monitor.signalOff();
    };

    this.showOSD = function(message, overlap) {
        if (this.monitor) this.monitor.showOSD(message, overlap);
    };


    this.monitor = null;

};