// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.VideoSignal = function(source, name, shortName) {
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

    this.setDisplayMetrics = function(renderWidth, renderHeight) {
        if (monitor) monitor.setDisplayMetrics(this, renderWidth, renderHeight);
    };

    // Called back by Monitor
    this.setColorMode = function(mode) {
        source.setColorMode(mode);
    };

    // Called back by Monitor
    this.resetOutputAutoMode = function() {
        source.resetOutputAutoMode();
    };

    // Called back by Monitor
    this.refreshDisplayMetrics = function() {
        source.refreshDisplayMetrics();
    };

    // Called back by Monitor
    this.videoSignalDisplayStateUpdate = function(displayed, superimposeActive) {
        source.videoSignalDisplayStateUpdate(displayed, superimposeActive);
    };

    this.setOutputAutoMode = function(mode) {
        if (monitor) monitor.setOutputAutoMode(this, mode);
    };

    this.getSignalDesc = function() {
        return name;
    };

    this.getSignalShortDesc = function() {
        return shortName;
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