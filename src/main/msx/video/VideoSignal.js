// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoSignal = function(name, source) {
"use strict";

    this.connectMonitor = function(pMonitor) {
        monitor = pMonitor;
    };

    this.newFrame = function(image, sourceX, sourceY, sourceWidth, sourceHeight) {
        monitor.newFrame(this, image, sourceX, sourceY, sourceWidth, sourceHeight);
    };

    this.signalOff = function() {
        if (monitor) monitor.signalOff(this);
    };

    this.showOSD = function(message, overlap, error) {
        if (monitor) monitor.showOSD(message, overlap, error);
    };

    this.setDisplayMetrics = function(targetWidth, targetHeight) {
        if (monitor) monitor.setDisplayMetrics(this, targetWidth, targetHeight);
    };

    this.setPixelMetrics = function(pixelWidth, pixelHeight) {
        if (monitor) monitor.setPixelMetrics(this, pixelWidth, pixelHeight);
    };

    this.setDebugMode = function(boo) {
        if (monitor) monitor.setDebugMode(this, boo);
    };

    this.getScreenText = function() {
        return source.getScreenText();
    };


    this.name = name;

    var monitor;

};