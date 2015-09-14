// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MultiDownloader = function (urlSpecs, onAllSuccess, onAnyError, timeout) {

    this.start = function() {
        if (!urlSpecs || urlSpecs.length === 0) onAllSuccess(urlSpecs);

        for (var i = 0; i < urlSpecs.length; i++)
            load(urlSpecs[i]);
    };

    function load(urlSpec) {
        if (!urlSpec) return;
        wmsx.Util.log("Reading file from URL: " + urlSpec.url);

        var req = new XMLHttpRequest();
        req.withCredentials = true;
        req.open("GET", urlSpec.url, true);
        req.responseType = "arraybuffer";
        req.timeout = timeout !== undefined ? timeout : DEFAULT_TIMEOUT;
        req.onload = function () {
            if (req.status === 200) {
                urlSpec.success = true;
                urlSpec.content = new Uint8Array(req.response);
                if (urlSpec.onSuccess) urlSpec.onSuccess(urlSpec);
            } else {
                urlSpec.success = false;
                urlSpec.error = (req.statusText || req.status);
                if (urlSpec.onError) urlSpec.onError(urlSpec);
            }
            checkFinish();
        };
        req.onerror = function () {
            urlSpec.success = false;
            urlSpec.error = (req.statusText || req.status);
            if (urlSpec.onError) urlSpec.onError(urlSpec);
            checkFinish();
        };
        req.ontimeout = function () {
            urlSpec.success = false;
            urlSpec.error = (req.statusText || req.status);
            if (urlSpec.onError) urlSpec.onError(urlSpec);
            checkFinish();
        };
        req.send();
    }

    function checkFinish() {
        if (finished) return;

        for (var i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && (urlSpecs[i].success === undefined)) return;

        finished = true;

        // All urls have a definition, check for errors
        for (i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && !urlSpecs[i].success) {
                if (onAnyError) onAnyError(urlSpecs);
                return;
            }

        // If no errors, then success
        if (onAllSuccess) onAllSuccess(urlSpecs);
    }

    var finished = false;

    var DEFAULT_TIMEOUT = 3000;

};

