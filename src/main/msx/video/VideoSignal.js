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

    this.setDisplayMetrics = function(targetWidth, targetHeight) {
        if (monitor) monitor.setDisplayMetrics(this, targetWidth, targetHeight);
    };

    this.setPixelMetrics = function(pixelWidth, pixelHeight) {
        if (monitor) monitor.setPixelMetrics(this, pixelWidth, pixelHeight);
    };

    this.setResetOutputModeFunc = function(func) {
        resetOutputModeFunc = func;
    };

    this.setSetSuperimposeFuunc = function(func) {
        setSuperimposeFuunc = func;
    };

    // Called back by Monitor
    this.resetOutputAutoMode = function() {
        if (resetOutputModeFunc) resetOutputModeFunc();
    };

    // Called back by Monitor
    this.setSuperimposeActive = function(state) {
        if (setSuperimposeFuunc) setSuperimposeFuunc(state);
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
    var resetOutputModeFunc;
    var setSuperimposeFuunc;

};