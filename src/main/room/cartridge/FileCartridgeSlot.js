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

        if (room.netPlayMode === 1) netOperationsToSend.push({ op: 0, c: cartridge.saveState(), p: port, a: altPower });
    };

    this.cartridgeInserted = function (port) {
        return cartridgeSocket.cartridgeInserted(port);
    };

    this.removeCartridge = function (port, altPower) {
        var removed = cartridgeSocket.removeCartridge(port, altPower);

        if (removed && room.netPlayMode === 1) netOperationsToSend.push({ op: 1, p: port, a: altPower });
    };

    this.loadCartridgeData = function (port, name, arrContent) {
        var loaded = cartridgeSocket.loadCartridgeData(port, name, arrContent);

        if (loaded && room.netPlayMode === 1) netOperationsToSend.push({ op: 2, p: port, n: name, c: wmsx.Util.compressInt8BitArrayToStringBase64(arrContent) });

        return loaded;
    };

    this.saveCartridgeDataFile = function (port) {
        var data = cartridgeSocket.getCartridgeData(port);
        fileDownloader.startDownloadBinary(data.fileName, data.content, data.desc);
    };


    // NetPlay  -------------------------------------------

    this.netServerGetOperationsToSend = function() {
        return netOperationsToSend.length ? netOperationsToSend : undefined;
    };

    this.netServerClearOperationsToSend = function() {
        netOperationsToSend.length = 0;
    };

    this.netClientProcessOperations = function(ops) {
        for (var i = 0, len = ops.length; i < len; ++i) {
            var op = ops[i];
            switch (op.op) {
                case 0:
                    cartridgeSocket.insertCartridge(wmsx.SlotCreator.recreateFromSaveState(op.c, cartridgeSocket.cartridgeInserted(op.p)), op.p, op.a); break;
                case 1:
                    cartridgeSocket.removeCartridge(op.p, op.a); break;
                case 2:
                    cartridgeSocket.loadCartridgeData(op.p, op.n, wmsx.Util.uncompressStringBase64ToInt8BitArray(op.c)); break;
            }
        }
    };


    var cartridgeSocket;
    var fileDownloader;

    var netOperationsToSend = [];

};