// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SaveStateMedia = function(room) {
"use strict";

    this.connect = function(socket) {
        socket.connectMedia(this);
    };

    this.connectPeripherals = function(pFileDownloader) {
        fileDownloader = pFileDownloader;
    };

    this.isSlotUsed = function(slot) {
        return localStorage["wmsxsave" + slot + "u"] !== undefined || localStorage["wmsxsave" + slot] !== undefined;
    };

    // ASSYNC!
    this.persistState = function(slot, state, then) {
        var data = buildDataFromState(state);
        saveToPersistence("save" + slot, data, then);
    };

    // ASSYNC!
    this.retrieveState = function(slot, then) {
        loadFromPersistence("save" + slot, function retrieved(data) {
            then(data && buildStateFromData(data));
        });
    };

    this.saveStateFile = function(state) {
        var data = buildDataFromState(state);
        if (data) fileDownloader.startDownloadBinary("WMSX SaveState" + SAVE_STATE_FILE_EXTENSION, data, "State File");
    };

    this.loadStateFile = function(data) {
        return buildStateFromData(data);
    };

    this.externalStateChange = function() {
        // Let the NetPlay Server know
        if (room.netController) room.netController.processExternalStateChange();
    };

    var saveToPersistence = function(entry, data, then) {
        initPersistence(function inited() {
            if (indexedPesistence) {
                indexedPesistence.store(entry, data,
                    function onSuccess() {
                        then(true);
                    },
                    function onerror(e) {
                        fallback(e);
                        saveToLocalPersistence();
                    });
            } else
                saveToLocalPersistence();
        });

        function saveToLocalPersistence() {
            localPersistence.store(entry, data,
                function onSuccess() {
                    then(true);
                },
                function onerror(e) {
                    wmsx.Util.error(e);
                    then(false);
                });
        }
    };

    var loadFromPersistence = function(entry, then) {
        initPersistence(function inited() {
            if (indexedPesistence) {
                indexedPesistence.retrieve(entry,
                    function onSuccess(data) {
                        // Backward compatibility: If not found, but no error, try to get from LocalStorage
                        if (data) then(data);
                        else loadFromLocalPersistence();
                    },
                    function onerror(e) {
                        fallback(e);
                        loadFromPersistence(entry, then);
                    });
            } else
                loadFromLocalPersistence();
        });

        function loadFromLocalPersistence() {
            localPersistence.retrieve(entry,
                function onSuccess(data) {
                    then(data);
                },
                function onerror(e) {
                    wmsx.Util.warning(e);
                    then(undefined);
                });
        }
    };

    var buildDataFromState = function(state) {
        try {
            return SAVE_STATE_IDENTIFIER + JSON.stringify(state);
        } catch(ex) {
            wmsx.Util.error(ex);
            // give up
        }
    };

    var buildStateFromData = function (data) {
        try {
            var id;
            if (typeof data == "string")
                id = data.substr(0, SAVE_STATE_IDENTIFIER.length);
            else
                id = wmsx.Util.int8BitArrayToByteString(data, 0, SAVE_STATE_IDENTIFIER.length);

            // Check for the identifier
            if (id !== SAVE_STATE_IDENTIFIER && id !== SAVE_STATE_IDENTIFIER_OLD) return;

            var stateData;
            if (typeof data == "string")
                stateData = data.slice(SAVE_STATE_IDENTIFIER.length);
            else
                stateData = wmsx.Util.int8BitArrayToByteString(data, SAVE_STATE_IDENTIFIER.length);

            return stateData && JSON.parse(stateData);
        } catch(ex) {
            wmsx.Util.error(ex);
        }
    };

    var initPersistence = function(then) {
        if (localPersistence) return then();

        localPersistence = new wmsx.LocalStoragePersistence();
        indexedPesistence = new wmsx.IndexedDBPersistence();

        indexedPesistence.open(INDEXED_DB_VERSION, then, function onError() {
            indexedPesistence = null;
            then();
        });
    };

    function fallback(e) {
        wmsx.Util.error("Error accessing IndexedDB, falling back to LocalStorage:", e);
        indexedPesistence = undefined;
    }

    this.getIndexed = function() {
        return indexedPesistence;
    };


    var indexedPesistence, localPersistence;

    var fileDownloader;

    var SAVE_STATE_IDENTIFIER = String.fromCharCode(0, 0) + "wmsx" + String.fromCharCode(0, 0) + "state!";     // char 0 so browsers like Safari think the file is binary...  :-(
    var SAVE_STATE_IDENTIFIER_OLD = "wmsxsavestate!";
    var SAVE_STATE_FILE_EXTENSION = ".wst";

    var INDEXED_DB_VERSION = 1;

};
