// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoSignal = function() {

    this.connectMonitor = function(pMonitor) {
        monitor = pMonitor;
    };

    this.newFrame = function(image, sourceWidth, sourceHeight) {
        monitor.newFrame(image, sourceWidth, sourceHeight);
    };

    this.signalOff = function() {
        if (monitor) monitor.signalOff();
    };

    this.showOSD = function(message, overlap) {
        if (monitor) monitor.showOSD(message, overlap);
    };

    this.setSignalMetrics = function(sourceWidth, pixelWidth, sourceHeight, pixelHeight) {
        if (monitor) monitor.setSignalMetrics(sourceWidth, pixelWidth, sourceHeight, pixelHeight);
    };

    this.setDebugMode = function(boo) {
        if (monitor) monitor.setDebugMode(boo);
    };

    var monitor;

};