// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileCartridgeSlot = function(room) {
"use strict";

    this.connect = function(pCartridgeSocket, pExtensionsSocket) {
        cartridgeSocket = pCartridgeSocket;
        extensionsSocket = pExtensionsSocket;
    };

    this.connectPeripherals = function(pDownloader) {
        fileDownloader = pDownloader;
    };

    this.insertCartridge = function (cartridge, port, altPower, skipMessage) {
        cartridgeSocket.insertCartridge(cartridge, port, altPower, skipMessage);

        // Auto activate extensions if asked by ROM info
        if (cartridge && cartridge.rom.info.e) {
            var ext = cartridge.rom.info.e;
            if (ext && WMSX.EXTENSIONS_CONFIG[ext]) extensionsSocket.activateExtension(ext, true, port === 0, true, true);    // altPower, skipMessage and internal
        }

        if (room.netPlayMode === 1) room.netController.addPeripheralOperationToSend({ op: 0, c: cartridge.saveState(), p: port, a: altPower });
    };

    this.insertSerializedCartridge = function (cartridgeContent, port, altPower) {
        var cart = wmsx.SlotCreator.recreateFromSaveState(cartridgeContent, cartridgeSocket.cartridgeInserted(port));
        this.insertCartridge(cart, port, altPower);
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
    var extensionsSocket;
    var fileDownloader;

};