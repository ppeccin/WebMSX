// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PSGAudioSignal = function() {

    this.connectMonitor = function(pMonitor) {
        monitor = pMonitor;
    };

    this.getMixedAudioChannel = function() {
        return mixedChannel;
    };

    this.signalOn = function() {
        signalOn = true;
    };

    this.signalOff = function() {
        signalOn = false;
        mixedChannel.setMixerControl(0xff);
        mixedChannel.setAmplitudeA(0);
        mixedChannel.setAmplitudeB(0);
        mixedChannel.setAmplitudeC(0);
        audioCartridge = undefined;
    };

    this.setFps = function(fps) {
        // Calculate total samples per frame based on fps
        samplesPerFrame = Math.round(wmsx.PSGAudioSignal.SAMPLE_RATE / fps);
        if (samplesPerFrame > MAX_SAMPLES) samplesPerFrame = MAX_SAMPLES;
    };

    this.connectAudioCartridge = function(cart) {
        audioCartridge = cart;
    };

    this.disconnectAudioCartridge = function(cart) {
        if (audioCartridge === cart) audioCartridge = undefined;
    };

    this.getAudioCartridge = function() {
        return audioCartridge
    };

    this.setExternalSignalValue = function(val) {
        externalAddedValue = val;
    };

    this.audioClockPulse = function() {         // Just one clock pulse, signal always ON
        if (frameSamples < samplesPerFrame) {
            generateNextSampleOn();
            frameSamples = frameSamples + 1;
        }
    };

    this.finishFrame = function() {             // Enough samples to complete frame, signal always ON
        var missingSamples = samplesPerFrame - frameSamples;
        if (missingSamples > 0)
            for (var i = missingSamples; i > 0; i = i - 1) generateNextSampleOn()
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
            generateMissingSamples(missing);
            //wmsx.Util.log(">>> Missing samples generated: " + missing);
        } else {
            //wmsx.Util.log(">>> No missing samples");
        }

        var end = nextSampleToRetrieve + quant;
        if (end >= MAX_SAMPLES) end -= MAX_SAMPLES;

        var result = retrieveResult;
        result.start = nextSampleToRetrieve;
        nextSampleToRetrieve = end;

        return result;
    };

    var generateNextSampleOn = function() {
        var mixedSample;
        mixedSample = mixedChannel.nextSample();
        // Add the External value. Used by the PPI to generate the Keyboard Click
        mixedSample -= externalAddedValue;
        // Add the AudioCartridge value
        if (audioCartridge) mixedSample += audioCartridge.nextSample();
        // Add a little damper effect to round the edges of the square wave
        if (mixedSample !== lastSample) {
            mixedSample = (mixedSample * 2 + lastSample) / 3;
            lastSample = mixedSample;
        }

        samples[nextSampleToGenerate] = mixedSample * MAX_AMPLITUDE;
        nextSampleToGenerate = nextSampleToGenerate + 1;
        if (nextSampleToGenerate >= MAX_SAMPLES)
            nextSampleToGenerate = 0;

    };

    var generateNextSampleOff = function() {
        samples[nextSampleToGenerate] = 0;
        nextSampleToGenerate = nextSampleToGenerate + 1;
        if (nextSampleToGenerate >= MAX_SAMPLES)
            nextSampleToGenerate = 0;
    };

    var generateMissingSamples = function(quant) {
        if (signalOn)
            for (var i = quant; i > 0; i = i - 1) generateNextSampleOn()
        else
            for (var j = quant; j > 0; j = j - 1) generateNextSampleOff()
    };


    var monitor;

    var signalOn = false;
    var mixedChannel = new wmsx.PSGMixedAudioChannel();

    var nextSampleToGenerate = 0;
    var nextSampleToRetrieve = 0;

    var samplesPerFrame;
    var frameSamples = 0;

    var lastSample = 0;

    var externalAddedValue = 0;
    var audioCartridge;

    var MAX_SAMPLES = 10 * WMSX.AUDIO_BUFFER_SIZE;
    var MAX_AMPLITUDE = 0.54;

    var samples = wmsx.Util.arrayFill(new Array(MAX_SAMPLES), 0);

    var retrieveResult = {
        buffer: samples,
        bufferSize: MAX_SAMPLES,
        start: 0
    };

    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            a: mixedChannel.saveState(),
            ac: !!audioCartridge
        };
    };

    this.loadState = function(s) {
        if (s.hasOwnProperty("pa")) {               // Backward compatibility
            mixedChannel.loadState(s);
            audioCartridge = undefined;
        } else {
            mixedChannel.loadState(s.a);
            if (!s.ac) audioCartridge = undefined;
        }
    };

};

wmsx.PSGAudioSignal.SAMPLE_RATE = 111960;
