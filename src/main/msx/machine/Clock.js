// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Clock = function(clockDriven, pCyclesPerSecond) {
    var self = this;

    function init() {
        internalSetFrequency(pCyclesPerSecond || NATURAL_FPS);
    }

    this.go = function() {
        if (!running) {
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
        animationFrame = null;
        clockDriven.clockPulse();
        if (useRequestAnimationFrame && !animationFrame)
            animationFrame = window.requestAnimationFrame(pulse);
    };


    var running = false;

    var cyclesPerSecond = null;
    var cycleTimeMs = null;
    var useRequestAnimationFrame = null;
    var animationFrame = null;
    var interval = null;

    var NATURAL_FPS = WMSX.SCREEN_NATURAL_FPS;

    init();

};