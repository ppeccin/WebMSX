// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MultiDownloader = function (urlSpecs, onAllSuccess, onAnyError, timeout) {
"use strict";

    this.start = function() {
        if (urlSpecs && urlSpecs.length !== 0) {
            scheduleLoadingIcon();
            for (var i = 0; i < urlSpecs.length; i++) load(urlSpecs[i]);
        }
        checkFinish();
    };

    function load(urlSpec) {
        if (!urlSpec) return;

        var url = urlSpec.url.trim();
        if (!url) return loadError(urlSpec, "Empty URL");

        var urls = wmsx.EmbeddedFiles.isEmbeddedURL(url)
            ? [ url ]                             // Ignore any divider, will be treated by EmbeddedFiles
            : url.split(/\s*\|\s*/);              // Special "|" divider (several files to concat)
        urlSpec.filesToLoad = urls.length;
        urlSpec.filesContent = new Array(urlSpec.filesToLoad);

        // Ask to load all files
        for (var f = 0; f < urls.length; ++f) {
            var eachUrl = urls[f];
            if (wmsx.EmbeddedFiles.isEmbeddedURL(eachUrl))
                getEmbedded(urlSpec, f, eachUrl);       // Embedded file. SYNCHRONOUS
            else
                getHTTP(urlSpec, f, eachUrl);           // HTTP GET. ASYNCHRONOUS!!!
        }
    }

    function getEmbedded(urlSpec, f, url) {
        var file = wmsx.EmbeddedFiles.get(url);
        if (file !== undefined) loadSuccess(urlSpec, f, file.content);
        else loadError(urlSpec, "Embedded file not found!");
    }

    function getHTTP(urlSpec, f, url) {
        var finalUrl = isRemote(url) ? proxyze(url) : url;      // May use a proxy downloader if configured

        var req = new XMLHttpRequest();
        req.open("GET", finalUrl, true);
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
        var mes = "Could not load file: " + urlSpec.url + "\nError: " + error;
        urlSpec.success = false;
        urlSpec.error = error;
        urlSpec.errorMessage = mes;
        if (urlSpec.onError) {
            wmsx.Util.error(mes);
            urlSpec.onError(urlSpec);
        } else if (!onAnyError)
            wmsx.Util.message(mes);
        checkFinish();
    }

    function checkFinish() {
        if (finished) return;

        for (var i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && (urlSpecs[i].success === undefined)) return;

        finished = true;
        cancelLoadingIcon();

        // All urls have a definition, check for errors
        for (i = 0; i < urlSpecs.length; i++)
            if (urlSpecs[i] && !urlSpecs[i].success) {
                if (onAnyError) onAnyError(urlSpecs);
                return;
            }

        // If no errors, then success
        if (onAllSuccess) onAllSuccess(urlSpecs);
    }

    function isRemote(url) {
        return url && (url.indexOf("http:") === 0 || url.indexOf("https:") === 0);
    }

    function proxyze(url) {
        return WMSX.WEB_EXTENSIONS_PROXY_SERVER ? "https://" + WMSX.WEB_EXTENSIONS_PROXY_SERVER + "/proxy-remote-download?url=" + url : url;
    }

    function scheduleLoadingIcon() {
        if (!WMSX.room || WMSX.room.isLoading) return;

        loadingTimer = window.setTimeout(function setLoadingOnDelay() {
            loadingTimer = null;
            loadingSet = true;
            WMSX.room.setLoading(true);
        }, LOADING_ICON_TIMEOUT);
    }

    function cancelLoadingIcon() {
        if (loadingTimer) {
            window.clearTimeout(loadingTimer);
            loadingTimer = null;
        }
        if (loadingSet) {
            loadingSet = false;
            WMSX.room.setLoading(false);
        }
    }


    var loadingSet = false;
    var loadingTimer = null;
    var finished = false;

    var LOADING_ICON_TIMEOUT = 100;
    var DEFAULT_TIMEOUT = 15000;

};
