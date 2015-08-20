// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Clock = function(clockDriven, pCyclesPerSecond) {
    var self = this;

    function init() {
        internalSetFrequency(pCyclesPerSecond || NATURAL_FPS);
    }

    this.go = function() {
        if (!running) {
            running = true;
            pulse();
        }
    };

    this.pause = function(continuation) {
        if (running) {
            running = false;
            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            if (interval) {
                window.clearInterval(interval);
                interval = null;
            }
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
        useRequestAnimationFrame = freq === NATURAL_FPS;
    };

    var pulse = function() {
        clockDriven.clockPulse();
        if (useRequestAnimationFrame)
            animationFrame = window.requestAnimationFrame(pulse);
        else
            if (!interval) interval = window.setInterval(pulse, cycleTimeMs);
    };


    var running = false;

    var cyclesPerSecond = null;
    var cycleTimeMs = null;
    var useRequestAnimationFrame = null;
    var animationFrame = null;
    var interval = null;

    var NATURAL_FPS = 60;

    init();

};