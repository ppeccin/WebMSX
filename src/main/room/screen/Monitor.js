// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Monitor = function(display) {
"use strict";

    this.connect = function(pVideoSignal) {
        videoSignal = pVideoSignal;
        videoSignal.connectMonitor(this);
    };

    this.newFrame = function(image, sourceWidth, sourceHeight) {
        display.refresh(image, sourceWidth, sourceHeight);
    };

    this.signalOff = function() {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap, error) {
        display.showOSD(message, overlap, error);
    };

    this.setDisplayMetrics = function(targetWidth, targetHeight) {
        display.displayMetrics(targetWidth, targetHeight);
    };

    this.setPixelMetrics = function(pixelWidth, pixelHeight) {
        display.displayPixelMetrics(pixelWidth, pixelHeight);
    };

    this.setDefaults = function() {
        display.crtPhosphorSetDefault();
        display.crtScanlinesSetDefault();
        display.crtFilterSetDefault();
        display.aspectAndScaleSetDefault();
        display.requestReadjust(true);
    };

    this.setDebugMode = function(boo) {
        display.setDebugMode(boo);
    };

    this.crtFilterToggle = function(dec) {
        display.crtFilterToggle(dec);
    };

    this.crtScanlinesToggle = function(dec) {
        display.crtScanlinesToggle(dec);
    };

    this.crtPhosphorToggle = function(dec) {
        display.crtPhosphorToggle(dec);
    };

    this.fullscreenToggle = function(windowed) {
        display.displayToggleFullscreen(windowed);
    };

    this.displayAspectDecrease = function() {
        this.displayScale(normalizeAspectX(displayAspectX - wmsx.Monitor.ASPECT_STEP), displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayAspectIncrease = function() {
        this.displayScale(normalizeAspectX(displayAspectX + wmsx.Monitor.ASPECT_STEP), displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayScaleDecrease = function() {
        this.displayScale(displayAspectX, normalizeScaleY(displayScaleY - wmsx.Monitor.SCALE_STEP));
        this.showOSD("Display Size: " + displayScaleY.toFixed(2) + "x", true);
    };

    this.displayScaleIncrease = function() {
        this.displayScale(displayAspectX, normalizeScaleY(displayScaleY + wmsx.Monitor.SCALE_STEP));
        this.showOSD("Display Size: " + displayScaleY.toFixed(2) + "x", true);
    };

    this.getScreenText = function() {
        return videoSignal.getScreenText();
    };

    this.displayScale = function(aspectX, scaleY) {
        displayAspectX = aspectX;
        displayScaleY = scaleY;
        display.displayScale(displayAspectX, displayScaleY);
    };

    function normalizeAspectX(aspectX) {
        var ret = aspectX < 0.5 ? 0.5 : aspectX > 2.5 ? 2.5 : aspectX;
        return Math.round(ret / wmsx.Monitor.ASPECT_STEP) * wmsx.Monitor.ASPECT_STEP;
    }

    function normalizeScaleY(scaleY) {
        var ret = scaleY < 0.5 ? 0.5 : scaleY;
        return Math.round(ret / wmsx.Monitor.SCALE_STEP) * wmsx.Monitor.SCALE_STEP;
    }


    var videoSignal;

    var displayAspectX;
    var displayScaleY;

};

wmsx.Monitor.SCALE_STEP = 0.05;
wmsx.Monitor.ASPECT_STEP = 0.01;


