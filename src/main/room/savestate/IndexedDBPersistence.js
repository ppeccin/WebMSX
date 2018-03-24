// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.IndexedDBPersistence = function() {
"use strict";

    var self = this;

    this.open = function (ver, onSuccess, onError) {
        try {
            var openReq = indexedDB.open("WebMSX", ver);
        } catch (ex) {
            error(ex);
        }

        openReq.onupgradeneeded = function (e) {
            try {
                var db = event.target.result;
                if (!db.objectStoreNames.contains("WebMSX")) {
                    wmsx.Util.log("Creating IndexedDB persistence");
                    db.createObjectStore("MainStore");
                }
            } catch (ex) {
                error(ex);
            }
        };

        openReq.onsuccess = function (e) {
            self.db = event.target.result;
            onSuccess(self.db);
        };

        openReq.onerror = error;

        function error(e) {
            wmsx.Util.error("Error obtaining IndexedDB persistence, falling back to LocalStorage only");
            self.db = null;
            onError(e);
        }
    };

    this.store = function (key, value, onSuccess, onError) {
        try {
            var tra = this.db.transaction("MainStore", "readwrite");
            tra.onerror = onError;

            var store = tra.objectStore("MainStore");
            var writeReq = store.put(value, key);

            writeReq.onsuccess = function() {
                localStorage["wmsx" + key + "u"] = "Y";     // Used slot mark
                onSuccess();
            };
            writeReq.onerror = onError;
        } catch (ex) {
            onError(ex);
        }
    };

    this.retrieve = function (key, onSuccess, onError) {
        var tra = this.db.transaction("MainStore");
        tra.onerror = onError;

        var store = tra.objectStore("MainStore");
        var readReq = store.get(key);

        readReq.onsuccess = function (e) {
            onSuccess(e.target.result);
        };
        readReq.onerror = onError;
    };


    this.clear = function (onSuccess, onError) {
        var openReq = indexedDB.deleteDatabase("WebMSX");
        openReq.onsuccess = onSuccess;
        openReq.onerror = onError;
    };


    this.db = undefined;

};


