// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.AudioSignal = function(name, source, sampleRate, volume) {
"use strict";

    var self = this;

    function init() {
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

    this.flush = function() {
        nextSampleToGenerate = 0;
        nextSampleToRetrieve = 0;
        availSamples = maxAvailSamples;

        //console.log("FLUSH!");
    };

    this.setFps = function(fps) {
        // Calculate total samples per frame based on fps
        samplesPerFrame = (sampleRate / fps) | 0;
        updateBufferSize();
    };

    this.audioFinishFrame = function() {             // Enough samples to complete frame, signal always ON
        if (frameSamples > 0) {
            //console.log(">>> Audio finish frame: " + frameSamples);
            while(frameSamples > 0) audioClockPulse32x();
        }
        frameSamples = samplesPerFrame;
    };

    this.retrieveSamples = function(quant, mute) {
        var generated = maxAvailSamples - availSamples;

        //var generated = nextSampleToGenerate >= nextSampleToRetrieve
        //    ? nextSampleToGenerate - nextSampleToRetrieve
        //    : maxSamples - nextSampleToRetrieve + nextSampleToGenerate;

        //console.log(">>> Samples available: " + generated);

        //if (nextSampleToGenerate === nextSampleToRetrieve)
        //    console.log("MATCH: " + nextSampleToGenerate );

        //if (nextSampleToGenerate < nextSampleToRetrieve)
        //    console.log("WRAP: " + nextSampleToGenerate );

        var missing = quant - generated;

        if (missing > 0) {
            if (missing > availSamples) missing = availSamples;
            generateMissingSamples(missing, mute);
            //wmsx.Util.log(">>> Missing samples generated: " + missing);
        } else {
            //wmsx.Util.log(">>> No missing samples");
        }

        retrieveResult.start = nextSampleToRetrieve;

        var retrieved = generated + missing;
        availSamples += retrieved;
        nextSampleToRetrieve += retrieved;
        if (nextSampleToRetrieve >= maxSamples) nextSampleToRetrieve -= maxSamples;     // Circular Buffer

        return retrieveResult;
    };

    this.getSampleRate = function() {
        return sampleRate;
    };

    this.toString = function() {
        return "AudioSignal " + name;
    };

    this.setAudioMonitorBufferSize = function (size) {
        monitorBufferSize = size;
        updateBufferSize();
    };

    function updateBufferSize() {
        var size = (monitorBufferSize * WMSX.AUDIO_SIGNAL_BUFFER_RATIO + samplesPerFrame * WMSX.AUDIO_SIGNAL_ADD_FRAMES) | 0;
        if (size > maxSamples) {
            samples.length = size;
            wmsx.Util.arrayFill(samples, 0, maxSamples, size);
            maxSamples = size;
            retrieveResult.bufferSize = maxSamples;
            maxAvailSamples = maxSamples - 2;
            self.flush();

            //console.log(">>> Buffer size for: " + name + ": " + maxSamples);
        }
    }

    function audioClockPulse32x() {
        if (frameSamples > 0) {
            if (availSamples <= 0) {
                frameSamples = 0;
                return;
            }
            generateNextSample();
            --frameSamples;
        }
    }

    function audioClockPulse72x() {
        // Verify if this clock should be missed. Perform only 4 clocks out of each 9 clock32x
        --clock72xCountDown;
        if ((clock72xCountDown & 1) || clock72xCountDown === 8) return;
        if (clock72xCountDown === 0) clock72xCountDown = 9;

        audioClockPulse32x();
    }

    function generateNextSample() {
        samples[nextSampleToGenerate] = source.nextSample() * volume;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
        --availSamples;
    }

    function generateNextSampleMute() {
        samples[nextSampleToGenerate] = 0;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
        --availSamples;
    }

    function generateMissingSamples(quant, mute) {
        if (mute)
            for (var j = quant; j > 0; j = j - 1) generateNextSampleMute()
        else
            for (var i = quant; i > 0; i = i - 1) generateNextSample()
    }


    this.name = name;

    var clock72xCountDown = 9;              // 4 clocks out of 9 32x clocks. Count from 9 to 0 and misses every odd and the 8th clock

    var nextSampleToGenerate = 0;
    var nextSampleToRetrieve = 0;

    var samplesPerFrame;
    var frameSamples = 0;

    var maxSamples = 0;
    var availSamples = 0, maxAvailSamples = 0;
    var samples = wmsx.Util.arrayFill(new Array(maxSamples), 0);

    var monitorBufferSize = 0;

    var retrieveResult = {
        buffer: samples,
        bufferSize: maxSamples,
        start: 0
    };


    init();

};
