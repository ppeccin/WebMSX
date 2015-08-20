// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.WebAudioSpeaker = function() {

    this.connect = function(pAudioSignal) {
        audioSignal = pAudioSignal;
        audioSignal.connectMonitor(this);
    };

    this.powerOn = function() {
        createAudioContext();
        if (!audioContext) return;

        processor = audioContext.createScriptProcessor(WMSX.AUDIO_BUFFER_SIZE, 1, 1);
        wmsx.Util.log("Audio Processor buffer size: " + processor.bufferSize);
        processor.onaudioprocess = onAudioProcess;
        this.play();
    };

    this.powerOff = function() {
        this.mute();
        audioContext = undefined;
    };

    this.play = function () {
        if (processor) processor.connect(audioContext.destination);
    };

    this.mute = function () {
        if (processor) processor.disconnect();
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
            resamplingFactor = wmsx.PSGAudioSignal.SAMPLE_RATE / audioContext.sampleRate;
            wmsx.Util.log("Speaker AudioContext created. Sample rate: " + audioContext.sampleRate);
            //wmsx.Util.log("Audio resampling factor: " + (1 / resamplingFactor));
        } catch(e) {
            wmsx.Util.log("Could not create AudioContext. Audio disabled.\n" + e.message);
        }
    };

    var onAudioProcessNoise = function(event) {
        if (!audioSignal) return;

        // Assumes there is only one channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var d = 0;
        var destEnd = 0 + outputBuffer.length;
        while (d < destEnd) {
            outputBuffer[d] = Math.random();
            d++;
        }
    };

    var onAudioProcess = function(event) {
        if (!audioSignal) return;

        // Assumes there is only one channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var input = audioSignal.retrieveSamples((outputBuffer.length * resamplingFactor) | 0);

        // Copy to output performing basic re-sampling
        // Same as Util.arrayCopyCircularSourceWithStep, but optimized with local code
        var s = input.start;
        var d = 0;
        var destEnd = 0 + outputBuffer.length;
        while (d < destEnd) {
            outputBuffer[d] = input.buffer[s | 0];   // as integer
            s += resamplingFactor;
            if (s >= input.bufferSize) s -= input.bufferSize;
            d++;
        }
    };


    var audioSignal;
    var resamplingFactor;

    var audioContext;
    var processor;

};