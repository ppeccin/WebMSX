// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

PSGAudioSignal = function() {

    this.connectMonitor = function(pMonitor) {
        monitor = pMonitor;
    };

    this.getMixedAudioChannel = function() {
        return mixedChannel;
    };

    this.audioClockPulses = function(quant) {
        var maxSamplesToFrame = samplesPerFrame - frameSamples;
        generateNextSamples(quant < maxSamplesToFrame ? quant : maxSamplesToFrame);
    };

    this.signalOn = function() {
        signalOn = true;
        mixedChannel.reset();
    };

    this.signalOff = function() {
        signalOn = false;
        mixedChannel.setMixerControl(0xff);
        mixedChannel.setAmplitudeA(0);
        mixedChannel.setAmplitudeB(0);
        mixedChannel.setAmplitudeC(0);
    };

    this.setFps = function(fps) {
        // Calculate total samples per frame based on fps
        samplesPerFrame = Math.round(PSGAudioSignal.SAMPLE_RATE / fps);
        if (samplesPerFrame > MAX_SAMPLES) samplesPerFrame = MAX_SAMPLES;
    };

    this.setExternalSignal = function(val) {
        externalAddedValue = val;
    };

    this.finishFrame = function() {
        var missingSamples = samplesPerFrame - frameSamples;
        if (missingSamples > 0) generateNextSamples(missingSamples);
        frameSamples = 0;
    };

    this.retrieveSamples = function(quant) {
        //Util.log(">>> Samples generated: " + (nextSampleToGenerate - nextSampleToRetrieve));

        //if (nextSampleToGenerate === nextSampleToRetrieve)
        //    console.log("MATCH: " + nextSampleToGenerate );

        //if (nextSampleToGenerate < nextSampleToRetrieve)
        //    console.log("WRAP: " + nextSampleToGenerate );

        var missing = nextSampleToGenerate >= nextSampleToRetrieve
            ? quant - (nextSampleToGenerate - nextSampleToRetrieve)
            : quant - (MAX_SAMPLES - nextSampleToRetrieve + nextSampleToGenerate);

        if (missing > 0) {
            generateNextSamples(missing, true);
            //Util.log(">>> Extra samples generated: " + missing);
        } else {
            //Util.log(">>> No missing samples");
        }

        var end = nextSampleToRetrieve + quant;
        if (end >= MAX_SAMPLES) end -= MAX_SAMPLES;

        var result = retrieveResult;

        result.start = nextSampleToRetrieve;

        nextSampleToRetrieve = end;

        return result;
    };

    var generateNextSamples = function(quant, extra) {
        var mixedSample;
        for (var i = quant; i > 0; i--) {
            if (signalOn) {
                mixedSample = mixedChannel.nextSample();
                // Add a little damper effect to round the edges of the square wave
                if (mixedSample !== lastSample) {
                    mixedSample = (mixedSample * 2 + lastSample) / 3;
                    lastSample = mixedSample;
                }
                // Add the External value. Used by the PPI to generate the Keyboard Click
                mixedSample += externalAddedValue;
            } else {
                mixedSample = 0;
            }

            samples[nextSampleToGenerate] = mixedSample * MAX_AMPLITUDE;

            nextSampleToGenerate++;
            if (nextSampleToGenerate >= MAX_SAMPLES)
                nextSampleToGenerate = 0;
        }
        if (!extra) frameSamples += quant;
    };


    var monitor;

    var signalOn = false;
    var mixedChannel = new PSGMixedAudioChannel();

    var nextSampleToGenerate = 0;
    var nextSampleToRetrieve = 0;

    var samplesPerFrame =  PSGAudioSignal.SAMPLE_RATE / VideoStandard.NTSC.fps;
    var frameSamples = 0;

    var lastSample = 0;

    var externalAddedValue = 0;

    var MAX_SAMPLES = 10 * MSX.AUDIO_BUFFER_SIZE;
    var MAX_AMPLITUDE = 0.65;

    var samples = Util.arrayFill(new Array(MAX_SAMPLES), 0);

    var retrieveResult = {
        buffer: samples,
        bufferSize: MAX_SAMPLES,
        start: 0
    };

};

PSGAudioSignal.SAMPLE_RATE = 111960;
