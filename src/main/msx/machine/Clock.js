// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Clock = function(clockDriven) {
    var self = this;

    this.go = function() {
        if (!running) {
            //lastPulseTime = window.performance.now();
            //timeMeasures = [];

            useRequestAnimationFrame = vSynch && (cyclesPerSecond === wmsx.Clock.HOST_NATIVE_FPS);

            running = true;
            if (useRequestAnimationFrame)
                animationFrame = window.requestAnimationFrame(pulse);
            else
                interval = window.setInterval(pulse, cycleTimeMs);
        }
    };

    this.pause = function(continuation) {
        running = false;
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if (interval) {
            window.clearInterval(interval);
            interval = null;
        }
    };

    this.getFrequency = function() {
        return cyclesPerSecond;
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

    this.setVSynch = function(boo) {
        if (running) {
            this.pause();
            vSynch = boo;
            this.go();
        } else {
            vSynch = boo;
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

    this.eval = function(str) {
        return eval(str);
    };


    var running = false;


    var cyclesPerSecond = 1;
    var cycleTimeMs = 1000;
    var useRequestAnimationFrame;
    var animationFrame = null;
    var interval = null;
    var vSynch = true;

    //var timeMeasures = [];
    //var lastPulseTime = 0;

};

wmsx.Clock.HOST_NATIVE_FPS = WMSX.SCREEN_FORCE_HOST_NATIVE_FPS;         // -1 = Unknown or not detected

wmsx.Clock.detectHostNativeFPSAndCallback = function(callback) {

    if (WMSX.SCREEN_VSYNCH_MODE === 0) {
        wmsx.Util.log("Video native V-Synch disabled");
        if (callback) callback(wmsx.Clock.HOST_NATIVE_FPS);
        return;
    }

    // Bypass if already detected or forced
    if (WMSX.SCREEN_VSYNCH_MODE === 0|| (wmsx.Clock.HOST_NATIVE_FPS !== -1)) {
        if (callback) callback(wmsx.Clock.HOST_NATIVE_FPS);
        return;
    }

    // Start detection

    var tries = 0;
    var samples = [];
    var lastTime = 0;
    var good60 = 0, good50 = 0;
    var tolerance = 0.06;

    var sampler = function() {

        // Detected?
        if (good60 >= 8 || good50 >= 8) {
            wmsx.Clock.HOST_NATIVE_FPS = good60 >= 8 ? 60 : 50;
            wmsx.Util.log("Video native frequency detected: " + wmsx.Clock.HOST_NATIVE_FPS + "Hz");
            if (callback) callback(wmsx.Clock.HOST_NATIVE_FPS);
            return;
        }

        tries++;
        if (tries <= 30) {
            var currentTime = window.performance.now();
            var sample = currentTime - lastTime;
            samples[samples.length] = sample;
            lastTime = currentTime;

            if ((sample >= (1000 / 60) * (1 - tolerance)) && (sample <= (1000 / 60) * (1 + tolerance))) good60++;
            if ((sample >= (1000 / 50) * (1 - tolerance)) && (sample <= (1000 / 50) * (1 + tolerance))) good50++;

            window.requestAnimationFrame(sampler);
        } else {
            wmsx.Clock.HOST_NATIVE_FPS = -1;
            wmsx.Util.log("Video native frequency detected: unsupported. V-Synch disabled");
            if (callback) callback(wmsx.Clock.HOST_NATIVE_FPS);
        }
    };

    sampler();

};