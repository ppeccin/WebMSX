// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

VDPVideoSignal = function() {

    this.connectMonitor = function(pMonitor) {
        this.monitor = pMonitor;
    };

    this.newFrame = function(image, backdropColor) {
        this.monitor.newFrame(image, backdropColor);
    };

    this.signalOff = function() {
        if (this.monitor) this.monitor.signalOff();
    };

    this.showOSD = function(message, overlap) {
        if (this.monitor) this.monitor.showOSD(message, overlap);
    };


    this.monitor = null;

};