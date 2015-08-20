// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.LocalStorageSaveStateMedia = function() {

    this.connect = function(socket) {
        socket.connectMedia(this);
    };

    this.connectPeripherals = function(pFileDownloader) {
        fileDownloader = pFileDownloader;
    };

    this.saveState = function(slot, state) {
        var data = buildDataFromState(state);
        return data && saveToLocalStorage("save" + slot, data);
    };

    this.loadState = function(slot) {
        var data = loadFromLocalStorage("save" + slot);
        return buildStateFromData(data);
    };

    this.saveStateFile = function(fileName, state) {
        var data = buildDataFromState(state);
        return data && startDownload(fileName || "WebMSXSave", data);
    };

    this.loadStateFile = function(data) {
        return buildStateFromData(data);
    };

    this.saveResourceToFile = function(entry, data) {
        try {
            var res = data && JSON.stringify(data);
            return saveToLocalStorage(entry, res);
        } catch(ex) {
            // give up
        }
    };

    this.loadResourceFromFile = function(entry) {
        try {
            var res = loadFromLocalStorage(entry);
            return res && JSON.parse(res);
        } catch(ex) {
            // give up
        }
    };

    var saveToLocalStorage = function(entry, data) {
        try {
            localStorage["msx" + entry] = data;
            return true;
        } catch (e) {
            return false;
        }
    };

    var loadFromLocalStorage = function(entry) {
        try {
            return localStorage["msx" + entry];
        } catch (e) {
            // give up
        }
    };

    var buildDataFromState = function(state) {
        try {
            return SAVE_STATE_IDENTIFIER + JSON.stringify(state);
        } catch(ex) {
            // give up
        }
    };

    var buildStateFromData = function (data) {
        try {
            var id;
            if (data instanceof Array)
                id = wmsx.Util.uInt8ArrayToByteString(data.slice(0, SAVE_STATE_IDENTIFIER.length));
            else
                id = data.substr(0, SAVE_STATE_IDENTIFIER.length);

            // Check for the identifier
            if (id !== SAVE_STATE_IDENTIFIER) return;

            var stateData = data.slice(SAVE_STATE_IDENTIFIER.length);
            if (stateData instanceof Array)
                stateData = wmsx.Util.uInt8ArrayToByteString(stateData);

            return stateData && JSON.parse(stateData);
        } catch(e) {
        }
    };

    var startDownload = function (fileName, data) {
        if (fileName) fileName = fileName + SAVE_STATE_FILE_EXTENSION;
        fileDownloader.startDownload(fileName, data);
        return true;
    };


    var fileDownloader;

    var SAVE_STATE_IDENTIFIER = "wmsxsavestate!";
    var SAVE_STATE_FILE_EXTENSION = ".wst";

};
