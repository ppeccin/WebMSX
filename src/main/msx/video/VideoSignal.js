// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoSignal = function() {

    this.connectMonitor = function(pMonitor) {
        monitor = pMonitor;
    };

    this.newFrame = function(image, sourceX, sourceY, sourceWidth, sourceHeight) {
        monitor.newFrame(image, sourceX, sourceY, sourceWidth, sourceHeight);
    };

    this.signalOff = function() {
        if (monitor) monitor.signalOff();
    };

    this.showOSD = function(message, overlap) {
        if (monitor) monitor.showOSD(message, overlap);
    };

    this.setSignalHeight = function (height) {
        if (monitor) monitor.setSignalHeight(height);
    };

    this.setDebugMode = function(boo) {
        if (monitor) monitor.setDebugMode(boo);
    };

    var monitor;

};