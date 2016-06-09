// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoSignal = function(vdp) {

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

    this.setDisplayMetrics = function(targetWidth, targetHeight) {
        if (monitor) monitor.setDisplayMetrics(targetWidth, targetHeight);
    };

    this.setPixelMetrics = function(pixelWidth, pixelHeight) {
        if (monitor) monitor.setPixelMetrics(pixelWidth, pixelHeight);
    };

    this.setDebugMode = function(boo) {
        if (monitor) monitor.setDebugMode(boo);
    };

    this.getScreenText = function() {
        return vdp.getScreenText();
    };

    var monitor;

};