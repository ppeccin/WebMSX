// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VDPVideoSignal = function(signalMetrics) {

    this.connectMonitor = function(pMonitor) {
        this.monitor = pMonitor;
        this.monitor.setSignalMetrics(this.signalMetrics);
    };

    this.setSignalMetrics = function(metrics) {
        this.signalMetrics = metrics;
        this.monitor.setSignalMetrics(this.signalMetrics);
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

    this.signalMetrics = signalMetrics;

};