// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Accepts multiple AudioSignals with different sampling rates
// Mixes all signals performing per-signal resampling as needed

wmsx.WebAudioSpeaker = function() {
"use strict";

    this.connect = function(audioSocket) {
        audioSocket.connectMonitor(this);
    };

    this.connectAudioSignal = function(pAudioSignal) {
        if (audioSignal.indexOf(pAudioSignal) >= 0) return;        // Add only once
        if (audioSignalNum >= MAX_SIGNALS) return;                 // Doesn't fit
        audioSignal[audioSignalNum++] = pAudioSignal;
        updateResamplingFactors();
    };

    this.disconnectAudioSignal = function(pAudioSignal) {
        var i = audioSignal.indexOf(pAudioSignal);
        if (i < 0) return;         // Not present
        audioSignal[i] = null;
        audioSignalNum = 0;
        for (i = 0; i < MAX_SIGNALS; ++i) if (audioSignal[i]) audioSignalNum = i + 1;   // Minimal resulting audioSignalNum
        updateResamplingFactors();
    };

    this.powerOn = function() {
        createAudioContext();
        if (!audioContext) return;

        processor = audioContext.createScriptProcessor(WMSX.AUDIO_BUFFER_SIZE, 1, 1);
        wmsx.Util.log("Audio Processor buffer size: " + processor.bufferSize);
        processor.onaudioprocess = onAudioProcess;
        this.unpause();
    };

    this.powerOff = function() {
        this.pause();
        audioContext = undefined;
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

    var createAudioContext = function() {
        if (WMSX.AUDIO_BUFFER_SIZE === 0) {
            wmsx.Util.log("Audio disabled in config file.");
            return;
        }
        try {
            var constr = (window.AudioContext || window.webkitAudioContext || window.WebkitAudioContext);
            if (!constr) throw new Error("WebAudio API not supported by the browser");
            audioContext = new constr();
            wmsx.Util.log("Speaker AudioContext created. Sample rate: " + audioContext.sampleRate);
            updateResamplingFactors();
        } catch(ex) {
            console.log(ex.stack);
            wmsx.Util.log("Could not create AudioContext. Audio disabled.");
        }
    };

    function updateResamplingFactors() {
        if (!audioContext) return;
        for (var i = 0; i < audioSignalNum; ++i) {
            if (!audioSignal[i]) continue;
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

        if (audioSignalNum === 0) return;

        // Mix all signals, performing resampling on-the-fly
        for (var i = audioSignalNum - 1; i >= 0; --i) {
            if (!audioSignal[i]) continue;

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


    var MAX_SIGNALS = 5;

    var audioSignalNum = 0;
    var audioSignal =        new Array(MAX_SIGNALS);
    var resamplingFactor =   new Float64Array(MAX_SIGNALS);
    var resamplingLeftOver = new Float64Array(MAX_SIGNALS);
    this.signals = audioSignal;

    var audioContext;
    var processor;

    var mute = false;

};