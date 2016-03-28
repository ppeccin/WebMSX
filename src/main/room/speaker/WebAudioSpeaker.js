// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Accepts multiple AudioSignals with different sampling rates
// Mixes all signals performing per-signal resampling as needed

wmsx.WebAudioSpeaker = function() {
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

            //lowPassFilter = audioContext.createBiquadFilter();
            //lowPassFilter.type = "lowpass";
            //lowPassFilter.frequency.value = 20000;
            //lowPassFilter.Q.value = 1;
            //lowPassFilter.connect(audioContext.destination);
            //self.lowPassFilter = lowPassFilter;

            updateResamplingFactors();
        } catch(e) {
            wmsx.Util.log("Could not create AudioContext. Audio disabled.\n" + e.message);
        }
    };

    function updateResamplingFactors() {
        if (!audioContext) return;
        resamplingFactor.length = audioSignal.length;
        resamplingLeftOver.length = audioSignal.length;
        for (var i = 0; i < audioSignal.length; i++) {
            resamplingFactor[i] = audioSignal[i].getSampleRate() / audioContext.sampleRate;
            resamplingLeftOver[i] = 0;
        }
    }

    function onAudioProcess(event) {

        //console.log(audioContext.currentTime);

        if (audioSignal.length === 0) return;

        // Assumes there is only one output channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var outputBufferSize = outputBuffer.length;

        // Clear output buffer
        for (var j = outputBufferSize - 1; j >= 0; j = j - 1) outputBuffer[j] = 0;

        // Mix all signals, performing resampling on-the-fly
        for (var i = audioSignal.length - 1; i >= 0; i = i - 1) {
            var resampFactor = resamplingFactor[i];
            var input = audioSignal[i].retrieveSamples((outputBufferSize * resampFactor + resamplingLeftOver[i]) | 0);
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
    //var lowPassFilter;
    var processor;

};