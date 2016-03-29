// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.AudioSignal = function(name, source, sampleRate, volume) {

    function init(self) {
        var multi = wmsx.Machine.BASE_CPU_CLOCK / sampleRate;
        switch (multi) {
            case 32:
                self.audioClockPulse = audioClockPulse32x;
                break;
            case 72:
                self.audioClockPulse = audioClockPulse72x;
                break;
            default:
                throw new Error("Unsupported AudioSignal Sample Rate CPU clock multiple: " + multi);
        }
    }

    this.audioClockPulse = null;    // Defined at initialization

    this.getMixedAudioChannel = function() {
        return source;
    };

    this.signalOn = function() {
        nextSampleToGenerate = 0;
        nextSampleToRetrieve = 0;
        this.play();
    };

    this.signalOff = function() {
        this.mute();
        nextSampleToGenerate = 0;
        nextSampleToRetrieve = 0;
    };

    this.mute = function() {
        signalOn = false;
    };

    this.play = function() {
        signalOn = true;
    };

    this.setFps = function(fps) {
        // Calculate total samples per frame based on fps
        samplesPerFrame = ((sampleRate / fps) | 0) + SAMPLES_PER_FRRAME_ADJUST;
        if (samplesPerFrame > MAX_SAMPLES) samplesPerFrame = MAX_SAMPLES;
    };

    this.audioFinishFrame = function() {             // Enough samples to complete frame, signal always ON
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

    this.getSampleRate = function() {
        return sampleRate;
    };

    this.toString = function() {
        return "AudioSignal " + name;
    };

    function audioClockPulse32x() {

        //if (frameSamples === 600) console.log("AudioClock: " + name);

        if (frameSamples < samplesPerFrame) {
            generateNextSampleOn();
            frameSamples = frameSamples + 1;
        }
    }

    function audioClockPulse72x() {
        // Verify if this clock should be missed. Perform only 4 clocks out of each 9 clock32x
        --clock72xCountDown;
        if ((clock72xCountDown & 1) || clock72xCountDown === 8) return;
        if (clock72xCountDown === 0) clock72xCountDown = 9;

        audioClockPulse32x();
    }

    function generateNextSampleOn() {
        samples[nextSampleToGenerate] = source.nextSample() * volume;
        if (++nextSampleToGenerate >= MAX_SAMPLES)
            nextSampleToGenerate = 0;
    }

    function generateNextSampleOff() {
        samples[nextSampleToGenerate] = 0;
        if (++nextSampleToGenerate >= MAX_SAMPLES)
            nextSampleToGenerate = 0;
    }

    function generateMissingSamples(quant) {
        if (signalOn)
            for (var i = quant; i > 0; i = i - 1) generateNextSampleOn()
        else
            for (var j = quant; j > 0; j = j - 1) generateNextSampleOff()
    }


    this.name = name;

    var signalOn = false;

    var clock72xCountDown = 9;              // 4 clocks out of 9 32x clocks. Count from 9 to 0 and misses every odd and the 8th clock

    var nextSampleToGenerate = 0;
    var nextSampleToRetrieve = 0;

    var samplesPerFrame;
    var frameSamples = 0;

    var MAX_SAMPLES = 10 * WMSX.AUDIO_BUFFER_SIZE;
    var SAMPLES_PER_FRRAME_ADJUST = -1;             // Helps avoid buffer over-filling

    var samples = wmsx.Util.arrayFill(new Array(MAX_SAMPLES), 0);

    var retrieveResult = {
        buffer: samples,
        bufferSize: MAX_SAMPLES,
        start: 0
    };


    init(this);

};
