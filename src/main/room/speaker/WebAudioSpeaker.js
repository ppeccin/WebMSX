// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Accepts multiple AudioSignals with different sampling rates
// Mixes all signals performing per-signal resampling as needed

wmsx.WebAudioSpeaker = function(mainElement) {
"use strict";

    this.connect = function(audioSocket) {
        audioSocket.connectMonitor(this);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.connectAudioSignal = function(pAudioSignal) {
        if (audioSignals.indexOf(pAudioSignal) >= 0) return;        // Add only once
        wmsx.Util.arrayAdd(audioSignals, pAudioSignal);
        updateResamplingFactors();
    };

    this.disconnectAudioSignal = function(pAudioSignal) {
        if (audioSignals.indexOf(pAudioSignal) < 0) return;         // Not present
        wmsx.Util.arrayRemoveAllElement(audioSignals, pAudioSignal);
        updateResamplingFactors();
    };

    this.powerOn = function() {
        createAudioContext();
        if (!processor) return;

        registerUnlockOnTouchIfNeeded();
        this.unpauseAudio();
    };

    this.powerOff = function() {
        this.pauseAudio();
        if (audioContext) audioContext.close();
        audioContext = processor = undefined;
    };

    this.mute = function () {
        mute = true;
    };

    this.unMute = function () {
        mute = false;
    };

    this.pauseAudio = function () {
        if (processor) processor.disconnect();
    };

    this.unpauseAudio = function () {
        if (processor) processor.connect(audioContext.destination);
        //if (processor) processor.connect(filter);
    };

    this.toggleBufferBaseSize = function() {
        if (!audioContext) return screen.showOSD("Audio is DISABLED", true, true);

        bufferBaseSize = ((bufferBaseSize + 2) % 8) - 1;  // -1..6
        this.pauseAudio();
        createProcessor();
        this.unpauseAudio();
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
                ? 4      // for now mobile Chrome needs more buffer, except on iOS
                : 3      // other mobile scenarios
            : 2;         // desktop
    }

    function determineBrowserDefaultBufferBaseSize() {
        // Safari/WebKit does not allow 0 (browser default), so use Auto instead
        return wmsx.Util.browserInfo().name === "SAFARI" || wmsx.Util.isIOSDevice() ? determineAutoBufferBaseSize() : 0;
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
            var baseSize = bufferBaseSize === -1 ? determineAutoBufferBaseSize() : bufferBaseSize === 0 ? determineBrowserDefaultBufferBaseSize() : bufferBaseSize;
            var totalSize = WMSX.AUDIO_MONITOR_BUFFER_SIZE > 0 ? WMSX.AUDIO_MONITOR_BUFFER_SIZE : baseSize > 0 ? wmsx.Util.exp2(wmsx.Util.log2((audioContext.sampleRate + 14000) / 22050) | 0) * wmsx.Util.exp2(baseSize - 1) * 256 : 0;
            processor = audioContext.createScriptProcessor(totalSize, 2, 2);
            processor.onaudioprocess = onAudioProcess;
            bufferSize = processor.bufferSize;
            updateResamplingFactors();

            //filter = audioContext.createBiquadFilter();
            //filter.type = "lowpass";
            //filter.frequency.value = 22050;
            //filter.Q.value = 100;
            //filter.connect(audioContext.destination);

            //window.F = filter;

            wmsx.Util.log("Audio Processor buffer size: " + processor.bufferSize);
        } catch(ex) {
            wmsx.Util.error("Could not create ScriptProcessorNode. Audio DISABLED!\n" + ex);
        }
    };

    function registerUnlockOnTouchIfNeeded() {
        // iOS and now Chrome need unlocking of the AudioContext on user interaction!
        if (processor && (!audioContext.state || audioContext.state === "suspended")) {
            mainElement.addEventListener("touchend", unlockAudioContext, true);
            mainElement.addEventListener("mousedown", unlockAudioContext, true);
            wmsx.Util.log("Speaker Audio Context resume event registered");
        }

        function unlockAudioContext() {
            mainElement.removeEventListener("touchend", unlockAudioContext, true);
            mainElement.removeEventListener("mousedown", unlockAudioContext, true);

            var ex;
            try {
                audioContext.resume().then(function () {
                    wmsx.Util.log('Speaker Audio Context resumed!');
                });
            } catch (e) {
                ex = e;
            }

            var source = audioContext.createBufferSource();
            source.buffer = audioContext.createBuffer(1, 1, 22050);
            source.connect(audioContext.destination);
            source.start(0);
            if (ex) wmsx.Util.log("Audio Context unlocked!");
        }
    }

    function updateResamplingFactors() {
        //if (bufferSizeProblem !== undefined) console.error("+++++++ buffer size problem: " + bufferSizeProblem);

        if (!processor) return;
        resamplingFactor.length = resamplingLeftOver.length =
        prevSample0.length = prevSample1.length = prevFracPart.length = audioSignals.length;
        for (var i = 0; i < audioSignals.length; i++) {
            resamplingFactor[i] = audioSignals[i].getSampleRate() / audioContext.sampleRate;
            resamplingLeftOver[i] = 0;
            prevSample0[i] = prevSample1[i] = prevFracPart[i] = 0;
            audioSignals[i].setAudioMonitorBufferSize((resamplingFactor[i] * bufferSize) | 0);
        }
    }

    function onAudioProcess(event) {
        //if (WMSX.room.machine.powerIsOn) {
        //    var now = performance.now();
        //    WMSX.onAudioProcessLog.push(now - lastOnAudioProcessTime);
        //    lastOnAudioProcessTime = now;
        //}

        // Assumes there are 2 output channels
        var outputBuffer0 = event.outputBuffer.getChannelData(0);
        var outputBuffer1 = event.outputBuffer.getChannelData(1);
        // Assumes L & R buffers will always have the same size
        var outputBufferSize = outputBuffer0.length;

        //if (outputBufferSize !== bufferSize) bufferSizeProblem = outputBufferSize;

        // Clear output buffers
        for (var j = outputBufferSize - 1; j >= 0; j = j - 1) outputBuffer0[j] = outputBuffer1[j] = 0;

        if (audioSignals.length === 0) return;

        // Mix all signals, performing resampling on-the-fly
        for (var i = audioSignals.length - 1; i >= 0; i = i - 1) {
            var resampFactor = resamplingFactor[i];
            var quantSamplesRetrived = (outputBufferSize * resampFactor + resamplingLeftOver[i]) | 0;
            var input = audioSignals[i].retrieveSamples(quantSamplesRetrived, mute);
            var inputBuffer0 = input.buffer0;
            var inputBuffer1 = input.buffer1;
            var inputBufferSize = input.bufferSize;

            // Copy to output performing basic re-sampling
            // Same as Util.arrayCopyCircularSourceWithStep, but optimized with local code
            var pFracPart = prevFracPart[i];
            var start = input.start;
            var s = start + resamplingLeftOver[i];

            for (var d = 0; d < outputBufferSize; ++d) {

                outputBuffer0[d] += prevSample0[i] * (1 - pFracPart);
                outputBuffer1[d] += prevSample1[i] * (1 - pFracPart);

                s += resampFactor;
                if (s >= inputBufferSize) s -= inputBufferSize;

                prevSample0[i] = inputBuffer0[(s | 0)];
                prevSample1[i] = inputBuffer1[(s | 0)];

                outputBuffer0[d] += prevSample0[i] * pFracPart;
                outputBuffer1[d] += prevSample1[i] * pFracPart;

                pFracPart = s - (s | 0);

                // outputBuffer0[d] += inputBuffer0[s | 0];
                // outputBuffer1[d] += inputBuffer1[s | 0];
            }

            if (s < start) s += inputBufferSize;
            resamplingLeftOver[i] = s - (start + quantSamplesRetrived);
            prevFracPart[i] = pFracPart;
        }

        //var str = ""; for (var i = 0; i < audioSignals.length; i++) str = str + audioSignals[i].name + " ";
        //console.log("AudioProcess: " + str);
    }


    var screen;

    var audioSignals = [];
    this.signals = audioSignals;
    var resamplingFactor = [];
    var resamplingLeftOver = [];
    var prevSample0 = [];
    var prevSample1 = [];
    var prevFracPart = [];
    var bufferBaseSize = WMSX.AUDIO_MONITOR_BUFFER_BASE === -3 ? WMSX.userPreferences.current.audioBufferBase : WMSX.AUDIO_MONITOR_BUFFER_BASE;

    var audioContext;
    var bufferSize;
    var processor;
    var filter;

    var mute = false;

    //var bufferSizeProblem;
    //WMSX.onAudioProcessLog = [ ];
    //var lastOnAudioProcessTime = 0;
    //var COUNTER = 0;
    //var SIGNAL = 1;

};