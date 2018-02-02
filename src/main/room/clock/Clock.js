// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Clock Pulse generator. Intended to be synchronized with Host machine Video Frequency whenever possible

wmsx.Clock = function(clockPulse) {
"use strict";

    this.connect = function(clockSocket) {
        clockSocket.connectClock(this);
    };

    this.go = function() {
        if (!running) {
            //lastPulseTime = wmsx.Util.performanceNow();
            //timeMeasures = [];

            useRequestAnimationFrame = vSynch && (cyclesPerSecond === this.getVSynchNativeFrequency());

            // console.log("Clock at " + cyclesPerSecond + " / " + divider + " using RequestAnimationFrame: " + useRequestAnimationFrame);

            running = true;
            if (useRequestAnimationFrame)
                animationFrame = requestAnimationFrame(pulse);
            else
                interval = setInterval(pulse, cycleTimeMs);
        }
    };

    this.pause = function() {
        running = false;
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    };

    this.setFrequency = function(freq, div) {
        if (running) {
            this.pause();
            internalSetFrequency(freq, div);
            this.go();
        } else {
            internalSetFrequency(freq, div);
        }
    };

    this.setVSynch = function(state) {
        if (running) {
            this.pause();
            vSynch = state;
            this.go();
        } else {
            vSynch = state;
        }
    };

    this.getVSynchNativeFrequency = function() {
        return vSynchAltNativeFrequency || vSynchNativeFrequency;
    };

    this.setVSynchAltNativeFrequency = function(freq) {
        vSynchAltNativeFrequency = freq;
    };

    var internalSetFrequency = function(freq, div) {
        cyclesPerSecond = freq;
        cycleTimeMs = 1000 / freq;
        divider = div >= 1 ? div : 1;
        if (dividerCounter > divider) dividerCounter = divider;
    };

    var pulse = function() {
        //var pulseTime = wmsx.Util.performanceNow();
        //timeMeasures[timeMeasures.length] = pulseTime - lastPulseTime;
        //lastPulseTime = pulseTime;

        animationFrame = null;

        if (divider > 1) {
            if (--dividerCounter <= 0) {
                dividerCounter = divider;
                clockPulse();
            }
        } else
            clockPulse();

        if (useRequestAnimationFrame && !animationFrame)
            animationFrame = requestAnimationFrame(pulse);

        //console.log(wmsx.Util.performanceNow() - pulseTime);
    };

    //this.getMeasures = function() {
    //    return timeMeasures;
    //};

    this.detectHostNativeFPSAndCallback = function(callback) {

        if (WMSX.SCREEN_VSYNCH_MODE === -1) {
            wmsx.Util.warning("Video native V-Synch disabled in configuration");
            if (callback) callback();
            return;
        }
        if (WMSX.SCREEN_FORCE_HOST_NATIVE_FPS !== -1) {
            wmsx.Util.warning("Host video frequency forced in configuration: " + WMSX.SCREEN_FORCE_HOST_NATIVE_FPS);
            if (callback) callback();
            return;
        }

        // Start detection

        var tries = 0;
        var samples = [];
        var lastTime = 0;
        var good60 = 0, good50 = 0, good120 = 0, good100 = 0;
        var tolerance = 0.06;

        var nativeFPSSampler = function() {
            // Detected?
            if (good60 >= 10 || good50 >= 10 || good120 >= 10 || good100 >= 10) {
                vSynchNativeFrequency = good60 >= 10 ? 60 : good50 >= 10 ? 50 : good120 >= 10 ? 120 : 100;
                wmsx.Util.log("Video native frequency detected: " + vSynchNativeFrequency + "Hz");
                if (callback) callback();
                return;
            }

            tries++;
            if (tries <= 50) {
                var currentTime = wmsx.Util.performanceNow();
                var sample = currentTime - lastTime;
                samples[samples.length] = sample;
                lastTime = currentTime;
                if ((sample >= (1000 / 60) *  (1 - tolerance)) && (sample <= (1000 / 60) *  (1 + tolerance))) good60++;
                if ((sample >= (1000 / 50) *  (1 - tolerance)) && (sample <= (1000 / 50) *  (1 + tolerance))) good50++;
                if ((sample >= (1000 / 120) * (1 - tolerance)) && (sample <= (1000 / 120) * (1 + tolerance))) good120++;
                if ((sample >= (1000 / 100) * (1 - tolerance)) && (sample <= (1000 / 100) * (1 + tolerance))) good100++;
                requestAnimationFrame(nativeFPSSampler);
            } else {
                vSynchNativeFrequency = -1;
                wmsx.Util.error("Could not detect video native frequency. V-Synch DISABLED!");
                if (callback) callback();
            }
        };

        nativeFPSSampler();
    };

    this.eval = function(str) {
        return eval(str);
    };


    var running = false;

    var cyclesPerSecond = 1;
    var cycleTimeMs = 1000;
    var divider = 1;
    var dividerCounter = 1;
    var useRequestAnimationFrame;
    var animationFrame = null;
    var interval = null;
    var vSynch = true;

    var vSynchNativeFrequency = WMSX.SCREEN_FORCE_HOST_NATIVE_FPS;      // -1 = Unknown or not detected
    var vSynchAltNativeFrequency = undefined;                           // undefined = deactivated. Used by NetPlay to force the same frequency as the Server

    //var timeMeasures = [];
    //var lastPulseTime = 0;

};


