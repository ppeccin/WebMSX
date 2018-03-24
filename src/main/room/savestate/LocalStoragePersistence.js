// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.LocalStoragePersistence = function() {
"use strict";

    var self = this;

    this.open = function (ver, onSuccess, onError) {
        // Nothing
        onSuccess();
    };

    this.store = function (key, value, onSuccess, onError) {
        try {
            localStorage["wmsx" + key] = value;
            localStorage["wmsx" + key + "u"] = "Y";     // Used slot mark
            onSuccess();
        } catch (ex) {
            onError(ex);
        }
    };

    this.retrieve = function (key, onSuccess, onError) {
        try {
            var data = localStorage["wmsx" + key];
            onSuccess(data);
        } catch (ex) {
            onError(ex);
        }
    };

    this.clear = function (onSuccess, onError) {
        // Nothing
        onSuccess();
    };

};


