// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MultiDownloader = function (urlSpecs, onAllSuccess, onAnyError, timeout) {
"use strict";

    this.start = function() {
        if (!urlSpecs || urlSpecs.length === 0)
            onAllSuccess(urlSpecs);
        else {
            for (var i = 0; i < urlSpecs.length; i++) load(urlSpecs[i]);
            checkFinish();
        }
    };

    function load(urlSpec) {
        if (!urlSpec) return;

        var urls = urlSpec.url.trim().split(/\s*,\s*/);
        urlSpec.filesToLoad = urls.length;
        urlSpec.filesContent = new Array(urlSpec.filesToLoad);

        // Ask to load all files
        for (var f = 0; f < urls.length; ++f) {
            var url = urls[f];
            if (url[0] === "@") getEmbedded(urlSpec, f, url);         // Embedded file?
            else getHTTP(urlSpec, f, url);                             // No, HTTP...
        }
    }

    function getEmbedded(urlSpec, f, url) {
        wmsx.Util.log("Reading Embedded file: " + url);
        var file = wmsx.EmbeddedFiles.get(url.substr(1));
        if (file !== undefined) loadSuccess(urlSpec, f, file.content);
        else loadError(urlSpec, "Embedded file not found!");
    }

    function getHTTP(urlSpec, f, url) {
        var req = new XMLHttpRequest();
        req.withCredentials = true;
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.timeout = timeout !== undefined ? timeout : DEFAULT_TIMEOUT;
        req.onload = function () {
            if (req.status === 200) loadSuccess(urlSpec, f, new Uint8Array(req.response));
            else req.onerror();
        };
        req.onerror = req.ontimeout = function () {
            loadError(urlSpec, "" + req.status + " " + req.statusText);
        };
        wmsx.Util.log("Reading file from: " + url);
        req.send();
    }

    function loadSuccess(urlSpec, f, content) {
        urlSpec.filesContent[f] = content;
        if (--urlSpec.filesToLoad > 0) return;                                   // Still some files to complete loading

        urlSpec.success = true;
        urlSpec.content = wmsx.Util.arraysConcatAll(urlSpec.filesContent);       // Concat all files in order
        if (urlSpec.onSuccess) urlSpec.onSuccess(urlSpec);
        checkFinish();
    }

    function loadError(urlSpec, error) {
        urlSpec.success = false;
        urlSpec.error = error;
        var mes = "Could not load file: " + urlSpec.url + "\nError: " + error;
        if (urlSpec.onError) {
            wmsx.Util.error(mes);
            urlSpec.onError(urlSpec);
        } else wmsx.Util.message(mes);
        checkFinish();
    }

    function checkFinish() {
        if (finished) return;

        for (var i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && (urlSpecs[i].success === undefined)) return;

        // All urls have a definition, check for errors
        finished = true;
        for (i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && !urlSpecs[i].success) {
                if (onAnyError) onAnyError(urlSpecs);
                return;
            }

        // If no errors, then success
        if (onAllSuccess) onAllSuccess(urlSpecs);
    }

    var finished = false;

    var DEFAULT_TIMEOUT = 8000;

};
