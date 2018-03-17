// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MultiFileReader = function (fileList, onAllSuccess, onFirstError, maxTotalSize) {
"use strict";

    this.start = function() {
        if (!fileList || fileList.length === 0)
            onAllSuccess(fileList);
        else {

            // Total Size limit disabled for now
            // if (!maxTotalSize) maxTotalSize = MAX_TOTAL_SIZE;
            // var totalSize = 0;
            // for (var i = 0; i < fileList.length; i++) totalSize += fileList[i].size;
            // if (maxTotalSize > 0 && totalSize > maxTotalSize) {
            //     var error = "Maximum total size limit of " + (((maxTotalSize / 1024) | 0) + "KB") + " exceeded";
            //     if (onFirstError) onFirstError(files, error, true);     // known error
            //     return;
            // }

            // IMPORTANT: Crazy error if we keep using the native fileList passed as argument. So lets copy it
            for (var f = 0; f < fileList.length; f++) files.push(fileList[f]);

            for (var i = 0; i < files.length; i++) load(files[i]);
            checkFinish();
        }
    };

    function load(file) {
        if (!file) return;

        wmsx.Util.log("Reading file: " + file.name);
        var reader = new FileReader();
        reader.onload = function (event) {
            file.wmsxSuccess = true;
            file.content = new Uint8Array(event.target.result);
            // console.log("SUCCESS:", file.name);
            checkFinish();
        };
        reader.onerror = function (event) {
            file.wmsxSuccess = false;
            file.wmsxError = event.target.error.name;
            console.log("ERROR:", file.name, file.wmsxError);
            checkFinish();
        };
        reader.readAsArrayBuffer(file);
    }

    function checkFinish() {
        if (finished) return;

        for (var i = 0; i < files.length; i++)
            if (files[i] && (files[i].wmsxSuccess === undefined)) return;

        finished = true;

        // All files have a definition, check for errors
        for (i = 0; i < files.length; i++)
            if (files[i] && !files[i].wmsxSuccess) {
                if (onFirstError) onFirstError(files, files[i].wmsxError);
                return files;
            }

        // If no errors, then success
        if (onAllSuccess) onAllSuccess(files);
    }

    var files  = [];
    var finished = false;

    var MAX_TOTAL_SIZE = 10 * 720 * 1024;   // Default limit. Read up 10 720KB disks of files

};
