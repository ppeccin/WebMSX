// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileCartridgeSlot = function(room) {
"use strict";

    this.connect = function(pCartridgeSocket) {
        cartridgeSocket = pCartridgeSocket;
    };

    this.connectPeripherals = function(pDownloader) {
        fileDownloader = pDownloader;
    };

    this.insertCartridge = function (cartridge, port, altPower) {
        return cartridgeSocket.insertCartridge(cartridge, port, altPower);
    };

    this.cartridgeInserted = function (port) {
        return cartridgeSocket.cartridgeInserted(port);
    };

    this.removeCartridge = function (port, altPower) {
        return cartridgeSocket.removeCartridge(port, altPower);
    };

    this.loadCartridgeData = function (port, name, arrContent) {
        return cartridgeSocket.loadCartridgeData(port, name, arrContent);
    };

    this.saveCartridgeDataFile = function (port) {
        var data = cartridgeSocket.getCartridgeData(port);
        fileDownloader.startDownloadBinary(data.fileName, data.content, data.desc);
    };


    var cartridgeSocket;
    var fileDownloader;

    var netOperationsToSend = [];

};