// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MultiDownloader = function (urlSpecs, onAllSuccess, onAnyError, timeout) {

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
        wmsx.Util.log("Reading file from URL: " + urlSpec.url);

        // Check for embedded file request
        if (urlSpec.url[0] === "@") {
            var file = wmsx.EmbeddedFiles.get(urlSpec.url.substr(1));
            if (file !== undefined) loadSuccess(urlSpec,file.content);
            else loadError(urlSpec, "Embedded file not found!");
            return;
        }

        // If not, request download
        var req = new XMLHttpRequest();
        req.withCredentials = true;
        req.open("GET", urlSpec.url, true);
        req.responseType = "arraybuffer";
        req.timeout = timeout !== undefined ? timeout : DEFAULT_TIMEOUT;
        req.onload = function () {
            if (req.status === 200) loadSuccess(urlSpec, req.response);
            else req.onerror();
        };
        req.onerror =  req.ontimeout = function () {
            loadError(urlSpec, "" + req.status + " " + req.statusText);
        };
        req.send();
    }

    function loadSuccess(urlSpec, content) {
        urlSpec.success = true;
        urlSpec.content = new Uint8Array(content);
        if (urlSpec.onSuccess) urlSpec.onSuccess(urlSpec);
        checkFinish();
    }

    function loadError(urlSpec, error) {
        urlSpec.success = false;
        urlSpec.error = error;
        var mes = "Could not load file: " + urlSpec.url + "\nError: " + error;
        if (urlSpec.onError) {
            wmsx.Util.log(mes);
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
