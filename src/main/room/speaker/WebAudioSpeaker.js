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
            resamplingFactor = wmsx.AudioSignal.SAMPLE_RATE / audioContext.sampleRate;
            wmsx.Util.log("Speaker AudioContext created. Sample rate: " + audioContext.sampleRate);
            //wmsx.Util.log("Audio resampling factor: " + (1 / resamplingFactor));
        } catch(e) {
            wmsx.Util.log("Could not create AudioContext. Audio disabled.\n" + e.message);
        }
    };

    var onAudioProcess = function(event) {

        //console.log(audioContext.currentTime);

        if (!audioSignal) return;

        // Assumes there is only one channel
        var outputBuffer = event.outputBuffer.getChannelData(0);
        var input = audioSignal.retrieveSamples((outputBuffer.length * resamplingFactor) | 0);

        // Copy to output performing basic re-sampling
        // Same as Util.arrayCopyCircularSourceWithStep, but optimized with local code
        var buf = input.buffer;
        var bufSize = input.bufferSize;
        var s = input.start;
        var d = 0;
        var destEnd = 0 + outputBuffer.length;
        while (d < destEnd) {
            outputBuffer[d] = buf[s | 0];   // as integer
            d = d + 1;
            s = s + resamplingFactor;
            if (s >= bufSize) s = s - bufSize;
        }
    };


    var audioSignal;
    var resamplingFactor;

    var audioContext;
    var processor;

};