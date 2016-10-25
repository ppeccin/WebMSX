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
        display.crtModeSetDefault();
        display.crtFilterSetDefault();
        this.displayScale(WMSX.SCREEN_DEFAULT_ASPECT, displayScaleY);
        display.requestReadjust();
    };

    this.setDebugMode = function(boo) {
        display.setDebugMode(boo);
    };

    this.crtModeToggle = function() {
        display.crtModeToggle();
    };

    this.crtFilterToggle = function() {
        display.crtFilterToggle();
    };

    this.fullscreenToggle = function() {
        display.displayToggleFullscreen();
    };

    this.displayAspectDecrease = function() {
        this.displayScale(limitAspectX(displayAspectX - wmsx.Monitor.SCALE_STEP), displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayAspectIncrease = function() {
        this.displayScale(limitAspectX(displayAspectX + wmsx.Monitor.SCALE_STEP), displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayScaleDecrease = function() {
        this.displayScale(displayAspectX, limitScaleY(displayScaleY - wmsx.Monitor.SCALE_STEP));
        this.showOSD("Display Size: " + displayScaleY.toFixed(2) + "x", true);
    };

    this.displayScaleIncrease = function() {
        this.displayScale(displayAspectX, limitScaleY(displayScaleY + wmsx.Monitor.SCALE_STEP));
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

    function limitAspectX(aspectX) {
        return aspectX < 0.5 ? 0.5 : aspectX > 2.5 ? 2.5 : aspectX;
    }

    function limitScaleY(scaleY) {
        return scaleY < 0.5 ? 0.5 : scaleY;
    }


    var videoSignal;

    var displayAspectX;
    var displayScaleY;

};

wmsx.Monitor.SCALE_STEP = 0.05;


