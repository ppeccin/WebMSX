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

    this.saveStateFile = function(state) {
        var data = buildDataFromState(state);
        if (data) fileDownloader.startDownloadBinary("WMSX SaveState" + SAVE_STATE_FILE_EXTENSION, data, "System State file");
    };

    this.loadStateFile = function(data) {
        return buildStateFromData(data);
    };

    this.saveResourceToFile = function(entry, data) {
        try {
            var res = data && JSON.stringify(data);
            return saveToLocalStorage(entry, res);
        } catch(ex) {
            console.log(ex.stack);
            // give up
        }
    };

    this.loadResourceFromFile = function(entry) {
        try {
            var res = loadFromLocalStorage(entry);
            return res && JSON.parse(res);
        } catch(ex) {
            console.log(ex.stack);
            // give up
        }
    };

    var saveToLocalStorage = function(entry, data) {
        try {
            localStorage["wmsx" + entry] = data;
            return true;
        } catch (ex) {
            console.log(ex.stack);
            return false;
        }
    };

    var loadFromLocalStorage = function(entry) {
        try {
            return localStorage["wmsx" + entry];
        } catch (ex) {
            console.log(ex.stack);
            // give up
        }
    };

    var buildDataFromState = function(state) {
        try {
            return SAVE_STATE_IDENTIFIER + JSON.stringify(state);
        } catch(ex) {
            console.log(ex.stack);
            // give up
        }
    };

    var buildStateFromData = function (data) {
        try {
            var id;
            if (data instanceof Array)
                id = wmsx.Util.int8BitArrayToByteString(data, 0, SAVE_STATE_IDENTIFIER.length);
            else
                id = data.substr(0, SAVE_STATE_IDENTIFIER.length);

            // Check for the identifier
            if (id !== SAVE_STATE_IDENTIFIER) return;

            var stateData;
            if (data instanceof Array)
                stateData = wmsx.Util.int8BitArrayToByteString(data, SAVE_STATE_IDENTIFIER.length);
            else
                stateData = data.slice(SAVE_STATE_IDENTIFIER.length);

            return stateData && JSON.parse(stateData);
        } catch(e) {
            console.log(ex.stack);
        }
    };


    var fileDownloader;

    var SAVE_STATE_IDENTIFIER = "wmsxsavestate!";
    var SAVE_STATE_FILE_EXTENSION = ".wst";

};
