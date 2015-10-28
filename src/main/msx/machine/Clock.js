// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Clock = function(clockDriven, pCyclesPerSecond) {
    var self = this;

    function init() {
        internalSetFrequency(pCyclesPerSecond || NATURAL_FPS);
    }

    this.go = function() {
        if (!running) {
            //lastPulseTime = window.performance.now();
            //timeMeasures = [];

            running = true;
            useRequestAnimationFrame = cyclesPerSecond === NATURAL_FPS;
            if (useRequestAnimationFrame)
                animationFrame = window.requestAnimationFrame(pulse);
            else
                interval = window.setInterval(pulse, cycleTimeMs);
        }
    };

    this.pause = function(continuation) {
        running = false;
        useRequestAnimationFrame = false;
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if (interval) {
            window.clearInterval(interval);
            interval = null;
        }
    };

    this.setFrequency = function(freq) {
        if (running) {
            this.pause();
            internalSetFrequency(freq);
            this.go();
        } else {
            internalSetFrequency(freq);
        }
    };

    var internalSetFrequency = function(freq) {
        cyclesPerSecond = freq;
        cycleTimeMs = 1000 / freq;
    };

    var pulse = function() {
        //var currentTime = window.performance.now();
        //timeMeasures[timeMeasures.length] = currentTime - lastPulseTime;
        //lastPulseTime = currentTime;

        animationFrame = null;
        clockDriven.clockPulse();
        if (useRequestAnimationFrame && !animationFrame)
            animationFrame = window.requestAnimationFrame(pulse);
    };

    //this.getMeasures = function() {
    //    return timeMeasures;
    //};


    var running = false;

    var cyclesPerSecond = null;
    var cycleTimeMs = null;
    var useRequestAnimationFrame = null;
    var animationFrame = null;
    var interval = null;

    //var timeMeasures = [];
    //var lastPulseTime = 0;

    var NATURAL_FPS = WMSX.SCREEN_NATURAL_FPS;

    init();

};