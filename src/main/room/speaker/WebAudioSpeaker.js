// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Accepts multiple AudioSignals with different sampling rates
// Mixes all signals performing per-signal resampling as needed

wmsx.WebAudioSpeaker = function(mainElement) {
"use strict";

    var self = this;

    this.connect = function(audioSocket) {
        audioSocket.connectMonitor(this);
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
        createAudioContextAndProcessor();
        if (!processor) return;

        registerUnpauseOnTap();
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
        if (processor) {
            if ((!audioContext.state || audioContext.state === "suspended") && audioContext.resume) audioContext.resume().then(function() {
                processor.connect(audioContext.destination)
            });
            else processor.connect(audioContext.destination);
        }
    };

    var createAudioContextAndProcessor = function() {
        if (WMSX.AUDIO_BUFFER_SIZE === 0) {
            wmsx.Util.warning("Audio disabled in configuration");
            return;
        }
        try {
            var constr = (window.AudioContext || window.webkitAudioContext || window.WebkitAudioContext);
            if (!constr) throw new Error("WebAudio API not supported by the browser");
            audioContext = new constr();
            wmsx.Util.log("Speaker AudioContext created. Sample rate: " + audioContext.sampleRate);
            updateResamplingFactors();
            // If not specified, calculate buffer size according to host audio sampling rate. 22050Hz = 256, 44100 = 512, 48000 = 512, 96000 = 1024, 192000 = 2048, etc
            bufferSize = WMSX.AUDIO_BUFFER_SIZE !== -1 ? WMSX.AUDIO_BUFFER_SIZE : wmsx.Util.exp2(wmsx.Util.log2((audioContext.sampleRate + 14000) / 22050) | 0) * WMSX.AUDIO_BUFFER_BASE;
            processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
            processor.onaudioprocess = onAudioProcess;
            wmsx.Util.log("Audio Processor buffer size: " + processor.bufferSize);
        } catch(ex) {
            wmsx.Util.error("Could not create AudioContext. Audio DISABLED!\n" + ex);
        }
    };

    function registerUnpauseOnTap() {
        // iOS needs to resume AudioContext on user interaction!
        if (processor && (!audioContext.state || audioContext.state === "suspended"))
            mainElement.addEventListener("touchstart", function unpauseSpeakerOnTouch() {
                mainElement.removeEventListener("touchstart", unpauseSpeakerOnTouch);
                self.unpause();
            });
    }

    function updateResamplingFactors() {
        if (!processor) return;
        resamplingFactor.length = audioSignal.length;
        resamplingLeftOver.length = audioSignal.length;
        for (var i = 0; i < audioSignal.length; i++) {
            resamplingFactor[i] = audioSignal[i].getSampleRate() / audioContext.sampleRate;
            resamplingLeftOver[i] = 0;
        }
    }

    function onAudioProcess(event) {
        // Assumes there is only one output channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var outputBufferSize = outputBuffer.length;

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
                d = d + 1;
                s = s + resampFactor;
                if (s >= inputBufferSize) s = s - inputBufferSize;
            }
            resamplingLeftOver[i] = s - (s | 0);        // fractional part
        }

        //var str = ""; for (var i = 0; i < audioSignal.length; i++) str = str + audioSignal[i].name + " ";
        //console.log("AudioProcess: " + str);
    }


    var audioSignal = [];
    this.signals = audioSignal;
    var resamplingFactor = [];
    var resamplingLeftOver = [];

    var audioContext;
    var bufferSize;
    var processor;

    var mute = false;

};