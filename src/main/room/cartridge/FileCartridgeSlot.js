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
        cartridgeSocket.insertCartridge(cartridge, port, altPower);

        if (room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 0, c: cartridge.saveState(), p: port, a: altPower });
    };

    this.insertSerializedCartridge = function (cartridgeContent, port, altPower) {
        var cart = wmsx.SlotCreator.recreateFromSaveState(cartridgeContent, cartridgeSocket.cartridgeInserted(port));
        cartridgeSocket.insertCartridge(cart, port, altPower);
    };

    this.loadCartridgeData = function (port, name, arrContent) {
        var loaded = cartridgeSocket.loadCartridgeData(port, name, arrContent);

        if (loaded && room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 1, p: port, n: name, c: wmsx.Util.compressInt8BitArrayToStringBase64(arrContent) });

        return loaded;
    };

    this.loadSerializedCartridgeData = function (port, name, content) {
        cartridgeSocket.loadCartridgeData(port, name, wmsx.Util.uncompressStringBase64ToInt8BitArray(content));
    };

    this.cartridgeInserted = function (port) {
        return cartridgeSocket.cartridgeInserted(port);
    };

    this.removeCartridge = function (port, altPower) {
        cartridgeSocket.removeCartridge(port, altPower);
    };

    this.saveCartridgeDataFile = function (port) {
        var data = cartridgeSocket.getCartridgeData(port);
        fileDownloader.startDownloadBinary(data.fileName, data.content, data.desc);
    };


    var cartridgeSocket;
    var fileDownloader;

};