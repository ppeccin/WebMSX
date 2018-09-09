// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.AudioSignal = function (name, source, volume, sampleRate, stereo, clock) {
"use strict";

    var self = this;

    function init() {
        generateNextSample = stereo ? generateNextSampleStereo : generateNextSampleMono;
        generateNextSampleMute = stereo ? generateNextSampleStereoMute : generateNextSampleMonoMute;
        var multi = Math.floor(wmsx.Machine.BASE_CPU_CLOCK / sampleRate);
        var sampleFunc = getAudioSampleFunction(multi);
        if (clock) {
            multi = Math.floor(wmsx.Machine.BASE_CPU_CLOCK / clock);
            var clockFunc = getClockFunction(multi);
            self.audioClockPulse = function() {
                clockFunc();
                sampleFunc();
            }
        } else
            self.audioClockPulse = sampleFunc;
    }

    function getAudioSampleFunction(multi) {
        switch (multi) {
            case 32:                // 112005 Hz exact
                return audioSamplePulse32x;
            case 72:                // 49780 Hz exact
                return audioSamplePulse72x;
            case 81:                // 44100 Hz approximation (81.2734693877551) TODO Improve
                return audioSamplePulse80x;
            default:
                throw new Error("Unsupported AudioSignal Sample Rate CPU Clock multiple: " + multi);
        }
    }

    function getClockFunction(multi) {
        switch (multi) {
            case 72:                // 49780 Hz exact
                return audioClockPulse72x;
            default:
                throw new Error("Unsupported AudioSignal Clock CPU Clock multiple: " + multi);
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
        samplesPerFrame = Math.floor(sampleRate / fps);
        updateBufferSize();
    };

    this.audioFinishFrame = function() {             // Enough samples to complete frame, signal always ON
        if (frameSamples > 0) {
            //console.log(">>> Audio finish frame: " + frameSamples);
            while(frameSamples > 0) audioSamplePulse32x();
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
            // if (stereo) wmsx.Util.log(">>> Missing samples generated: " + missing);
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
        samples0.length = size;
        if (size > maxSamples) wmsx.Util.arrayFill(samples0, 0, maxSamples, size);
        if (stereo) {
            samples1.length = size;
            if (size > maxSamples) wmsx.Util.arrayFill(samples1, 0, maxSamples, size);
        }
        maxSamples = size;
        retrieveResult.bufferSize = maxSamples;
        maxAvailSamples = maxSamples - 2;
        self.flush();

        //console.log(">>> Buffer size for: " + name + ": " + maxSamples);
    }

    function audioSamplePulse32x() {
        if (frameSamples > 0) {
            if (availSamples <= 0) {
                frameSamples = 0;
                return;
            }
            generateNextSample();
            --frameSamples;
            --availSamples;
        }
    }

    function audioSamplePulse72x() {
        // Verify if this clock should be missed. Perform only 4 clocks out of each 9 clock32x
        --sample72xCountDown;
        if ((sample72xCountDown & 1) || sample72xCountDown === 8) return;
        if (sample72xCountDown === 0) sample72xCountDown = 9;

        audioSamplePulse32x();
    }

    function audioSamplePulse80x() {
        // Verify if this clock should be missed. Perform only 2 clocks out of each 5 clock32x
        --sample80xCountDown;
        if (sample80xCountDown & 1) audioSamplePulse32x();
        if (sample80xCountDown === 0) sample80xCountDown = 5;
    }

    function audioClockPulse72x() {
        // Verify if this clock should be missed. Perform only 4 clocks out of each 9 clock32x
        --clock72xCountDown;
        if ((clock72xCountDown & 1) || clock72xCountDown === 8) return;
        if (clock72xCountDown === 0) clock72xCountDown = 9;

        source.audioClockPulse();
    }

    function generateNextSampleMono() {
        samples0[nextSampleToGenerate] = source.nextSample() * volume;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
    }
    function generateNextSampleStereo() {
        var sourceSamples = source.nextSample();
        samples0[nextSampleToGenerate] = sourceSamples[0] * volume;
        samples1[nextSampleToGenerate] = sourceSamples[1] * volume;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
    }
    var generateNextSample = generateNextSampleMono;

    function generateNextSampleMonoMute() {
        samples0[nextSampleToGenerate] = 0;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
    }
    function generateNextSampleStereoMute() {
        samples0[nextSampleToGenerate] = samples1[nextSampleToGenerate] = 0;
        if (++nextSampleToGenerate >= maxSamples) nextSampleToGenerate = 0;          // Circular Buffer
    }
    var generateNextSampleMute = generateNextSampleMonoMute;

    function generateMissingSamples(quant, mute) {
        if (mute) for (var j = quant; j > 0; j = j - 1) generateNextSampleMute();
        else      for (var i = quant; i > 0; i = i - 1) generateNextSample();
        availSamples -= quant;
    }


    this.name = name;

    var sample72xCountDown = 9;              // 4 clocks out of 9 32x clocks. Count from 8 to 0 and misses every odd and the 8th clock
    var sample80xCountDown = 5;              // 2 clocks out of 5 32x clocks. Count from 4 to 0 and misses every even clock

    var clock72xCountDown = 9;               // 4 clocks out of 9 32x clocks. Count from 8 to 0 and misses every odd and the 8th clock

    var nextSampleToGenerate = 0;
    var nextSampleToRetrieve = 0;

    var samplesPerFrame;
    var frameSamples = 0;

    var maxSamples = 0;
    var availSamples = 0, maxAvailSamples = 0;
    var samples0 = wmsx.Util.arrayFill(new Array(maxSamples), 0);
    var samples1 = stereo ? wmsx.Util.arrayFill(new Array(maxSamples), 0) : samples0;

    var monitorBufferSize = 0;

    var retrieveResult = {
        stereo: stereo,
        buffer0: samples0,
        buffer1: samples1,
        bufferSize: maxSamples,
        start: 0
    };


    init();

};
