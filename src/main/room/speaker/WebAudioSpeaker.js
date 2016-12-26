// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Accepts multiple AudioSignals with different sampling rates
// Mixes all signals performing per-signal resampling as needed

wmsx.WebAudioSpeaker = function(mainElement) {
"use strict";

    var self = this;

    this.connect = function(audioSocket) {
        audioSocket.connectMonitor(this);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.connectAudioSignal = function(pAudioSignal) {
        if (audioSignal.indexOf(pAudioSignal) >= 0) return;        // Add only once
        wmsx.Util.arrayAdd(audioSignal, pAudioSignal);
        updateResamplingFactors();
    };

    this.disconnectAudioSignal = function(pAudioSignal) {
        if (audioSignal.indexOf(pAudioSignal) < 0) return;         // Not present
        wmsx.Util.arrayRemoveAllElement(audioSignal, pAudioSignal);
        updateResamplingFactors();
    };

    this.powerOn = function() {
        createAudioContext();
        if (!processor) return;

        registerUnlockOnTouchIfNeeded();
        this.unpause();
    };

    this.powerOff = function() {
        this.pause();
        if (audioContext) audioContext.close();
        audioContext = processor = undefined;
    };

    this.mute = function () {
        mute = true;
    };

    this.unMute = function () {
        mute = false;
    };

    this.pause = function () {
        if (processor) processor.disconnect();
    };

    this.unpause = function () {
        if (processor) processor.connect(audioContext.destination);
    };

    this.toggleBufferBaseSize = function() {
        if (!audioContext) return screen.showOSD("Audio is DISABLED", true, true);

        bufferBaseSize = ((bufferBaseSize + 2) % 8) - 1;  // -1..6
        this.pause();
        createProcessor();
        this.unpause();
        screen.showOSD("Audio Buffer size: " + (bufferBaseSize === -1 ? "Auto (" + bufferSize + ")" : bufferBaseSize === 0 ? "Browser (" + bufferSize + ")" : bufferSize), true);
        WMSX.userPreferences.current.audioBufferBase = bufferBaseSize;
        WMSX.userPreferences.setDirty();
    };

    this.getControlReport = function(control) {
        // Only BufferBaseSize for now
        return { label: bufferBaseSize === -2 ? "OFF" : bufferBaseSize === -1 ? "Auto" : bufferBaseSize === 0 ? "Browser" : bufferSize, active: bufferBaseSize > 0 };
    };

    function determineAutoBufferBaseSize() {
        // Set bufferBaseSize according to browser and platform
        return wmsx.Util.isMobileDevice()
            ? wmsx.Util.browserInfo().name === "CHROME" && !wmsx.Util.isIOSDevice()
                ? 5      // for now mobile Chrome needs more buffer, except on iOS
                : 3      // other mobile scenarios
            : 2;         // desktop
    }

    var createAudioContext = function() {
        if (bufferBaseSize === -2 || WMSX.AUDIO_MONITOR_BUFFER_SIZE === 0) {
            wmsx.Util.warning("Audio disabled in configuration");
            return;
        }
        try {
            var constr = (window.AudioContext || window.webkitAudioContext || window.WebkitAudioContext);
            if (!constr) throw new Error("WebAudio API not supported by the browser");
            audioContext = new constr();
            wmsx.Util.log("Speaker AudioContext created. Sample rate: " + audioContext.sampleRate + (audioContext.state ? ", " + audioContext.state : ""));
            createProcessor();
        } catch(ex) {
            wmsx.Util.error("Could not create AudioContext. Audio DISABLED!\n" + ex);
        }
    };

    var createProcessor = function() {
        try {
            // If not specified, calculate buffer size based on baseSize and host audio sampling rate. Ex: for a baseSize = 1 then 22050Hz = 256, 44100 = 512, 48000 = 512, 96000 = 1024, 192000 = 2048, etc
            var baseSize = bufferBaseSize === -1 ? determineAutoBufferBaseSize() : bufferBaseSize > 0 ? bufferBaseSize : 0;
            var totalSize = WMSX.AUDIO_MONITOR_BUFFER_SIZE > 0 ? WMSX.AUDIO_MONITOR_BUFFER_SIZE : baseSize > 0 ? wmsx.Util.exp2(wmsx.Util.log2((audioContext.sampleRate + 14000) / 22050) | 0) * wmsx.Util.exp2(baseSize - 1) * 256 : 0;
            processor = audioContext.createScriptProcessor(totalSize, 1, 1);
            processor.onaudioprocess = onAudioProcess;
            bufferSize = processor.bufferSize;
            updateResamplingFactors();
            wmsx.Util.log("Audio Processor buffer size: " + processor.bufferSize);
        } catch(ex) {
            wmsx.Util.error("Could not create ScriptProcessorNode. Audio DISABLED!\n" + ex);
        }
    };

    function registerUnlockOnTouchIfNeeded() {
        // iOS needs to unlock AudioContext on user interaction!
        if (processor && (!audioContext.state || audioContext.state === "suspended")) {
            mainElement.addEventListener("touchend", function unlockAudioContextOnTouch() {
                wmsx.Util.log("Unlocking Audio Context...");
                mainElement.removeEventListener("touchend", unlockAudioContextOnTouch);

                var source = audioContext.createBufferSource();
                source.buffer = audioContext.createBuffer(1, 1, 22050);
                source.connect(audioContext.destination);
                source.start(0);
            });
            wmsx.Util.log("Audio Context unlock on Touch registered");
        }
    }

    function updateResamplingFactors() {
        //if (bufferSizeProblem !== undefined) console.error("+++++++ buffer size problem: " + bufferSizeProblem);

        if (!processor) return;
        resamplingFactor.length = audioSignal.length;
        resamplingLeftOver.length = audioSignal.length;
        for (var i = 0; i < audioSignal.length; i++) {
            resamplingFactor[i] = audioSignal[i].getSampleRate() / audioContext.sampleRate;
            resamplingLeftOver[i] = 0;
            audioSignal[i].setAudioMonitorBufferSize((resamplingFactor[i] * bufferSize) | 0);
        }
    }

    function onAudioProcess(event) {
        //if (WMSX.room.machine.powerIsOn) {
        //    var now = performance.now();
        //    WMSX.onAudioProcessLog.push(now - lastOnAudioProcessTime);
        //    lastOnAudioProcessTime = now;
        //}

        // Assumes there is only one output channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var outputBufferSize = outputBuffer.length;

        //if (outputBufferSize !== bufferSize) bufferSizeProblem = outputBufferSize;

        // Clear output buffer
        for (var j = outputBufferSize - 1; j >= 0; j = j - 1) outputBuffer[j] = 0;

        if (audioSignal.length === 0) return;

        // Mix all signals, performing resampling on-the-fly
        for (var i = audioSignal.length - 1; i >= 0; i = i - 1) {
            var resampFactor = resamplingFactor[i];
            var input = audioSignal[i].retrieveSamples((outputBufferSize * resampFactor + resamplingLeftOver[i]) | 0, mute);
            var inputBuffer = input.buffer;
            var inputBufferSize = input.bufferSize;

            // Copy to output performing basic re-sampling
            // Same as Util.arrayCopyCircularSourceWithStep, but optimized with local code
            var s = input.start + resamplingLeftOver[i];
            var d = 0;
            while (d < outputBufferSize) {
                outputBuffer[d] += inputBuffer[s | 0];   // source position as integer

                //COUNTER--; if (COUNTER < 0) {
                //    COUNTER = 160;
                //    SIGNAL = -SIGNAL;
                //}
                //outputBuffer[d] = SIGNAL * 0.4;

                d = d + 1;
                s = s + resampFactor;
                if (s >= inputBufferSize) s = s - inputBufferSize;
            }
            resamplingLeftOver[i] = s - (s | 0);        // fractional part
        }

        //var str = ""; for (var i = 0; i < audioSignal.length; i++) str = str + audioSignal[i].name + " ";
        //console.log("AudioProcess: " + str);
    }


    var screen;

    var audioSignal = [];
    this.signals = audioSignal;
    var resamplingFactor = [];
    var resamplingLeftOver = [];
    var bufferBaseSize = WMSX.AUDIO_MONITOR_BUFFER_BASE === -3 ? WMSX.userPreferences.current.audioBufferBase : WMSX.AUDIO_MONITOR_BUFFER_BASE;

    var audioContext;
    var bufferSize;
    var processor;

    var mute = false;

    //var bufferSizeProblem;
    //WMSX.onAudioProcessLog = [ ];
    //var lastOnAudioProcessTime = 0;
    //var COUNTER = 0;
    //var SIGNAL = 1;

};