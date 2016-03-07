// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Accepts multiple AudioSignals with different sampling rates
// Mixes all signals performing per-signal resampling as needed

wmsx.WebAudioSpeaker = function() {

    this.connect = function(audioSocket) {
        audioSocket.connectMonitor(this);
    };

    this.connectAudioSignal = function(pAudioSignal) {
        if (audioSignals.indexOf(pAudioSignal) >=0) return;        // Add only once
        wmsx.Util.arrayAdd(audioSignals, pAudioSignal);
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
            //wmsx.Util.log("Audio resampling factor: " + (1 / resamplingFactors));
        } catch(e) {
            wmsx.Util.log("Could not create AudioContext. Audio disabled.\n" + e.message);
        }
    };

    function updateResamplingFactors() {
        if (!audioContext) return;
        resamplingFactors.length = audioSignals.length;
        for (var i = 0; i < audioSignals.length; i++)
            resamplingFactors[i] = audioSignals[i].getSampleRate() / audioContext.sampleRate;
    }

    function onAudioProcess(event) {

        //console.log(audioContext.currentTime);

        if (audioSignals.length === 0) return;

        // Assumes there is only one output channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var outputBufferSize = outputBuffer.length;

        // Clear output buffer
        for (var j = outputBufferSize - 1; j >= 0; j = j - 1) outputBuffer[j] = 0;

        // Mix all signals, performing resampling on-the-fly
        for (var i = audioSignals.length - 1; i >= 0; i = i - 1) {
            var resamplingFactor = resamplingFactors[i];
            var input = audioSignals[i].retrieveSamples((outputBufferSize * resamplingFactor) | 0);
            var inputBuffer = input.buffer;
            var inputBufferSize = input.bufferSize;

            // Copy to output performing basic re-sampling
            // Same as Util.arrayCopyCircularSourceWithStep, but optimized with local code
            var s = input.start;
            var d = 0;
            while (d < outputBufferSize) {
                outputBuffer[d] += inputBuffer[s | 0];   // source position as integer
                d = d + 1;
                s = s + resamplingFactor;
                if (s >= inputBufferSize) s = s - inputBufferSize;
            }
        }
    }


    var audioSignals = [];
    var resamplingFactors  = [];

    var audioContext;
    var processor;

};