// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Savestates... :-(

wmsx.FileCassetteDeck = function() {

    this.connect = function(cassetteSocket) {
        cassetteSocket.connectDeck(this);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.connectBASICExtension = function(pExtension) {
        basicExtension = pExtension;
    };

    this.loadTapeFile = function(name, arrContent) {
        if (wmsx.Util.arrayIndexOfSubArray(arrContent, HEADER, 0) !== 0)
            return null;

        tapeContent = arrContent.slice(0);
        toTapeStart();

        var mes = "Cassette loaded." + positionMessage();
        wmsx.Util.log(mes);
        screen.showOSD(mes, true);

        this.typeCurrentAutoRunCommand();

        return tapeContent;
    };

    this.loadEmpty = function() {
        tapeContent = [];
        toTapeStart();

        var mes = "Cassette loaded with empty tape";
        wmsx.Util.log(mes);
        screen.showOSD(mes, true);
    };

    this.saveFile = function() {
        var mes = "Cassette file saved";
        wmsx.Util.log(mes);
        screen.showOSD(mes, true);
    };

    this.rewind = function() {
        toTapeStart();
        var mes = "Cassette rewound." + positionMessage();
        wmsx.Util.log(mes);
        screen.showOSD(mes, true);
    };

    this.seekToEnd = function() {
        toTapeEnd();
        var mes = "Cassette forwarded to tape end";
        wmsx.Util.log(mes);
        screen.showOSD(mes, true);
    };

    this.seekForward = function() {
        if (!isTapeEnd()) seekHeader(1, 1);
        if(isTapeEnd()) return this.seekToEnd();
        var mes = "Cassette skipped forward." + positionMessage();
        wmsx.Util.log(mes);
        screen.showOSD(mes, true);
    };

    this.seekBackward = function() {
        if (!isTapeStart()) seekHeader(-1, -1);
        if(isTapeStart()) return this.rewind();
        var mes = "Cassette skipped backward." + positionMessage();
        wmsx.Util.log(mes);
        screen.showOSD(mes, true);
    };

    this.typeCurrentAutoRunCommand = function() {
        basicExtension.typeString(currentAutoRunCommand());
    };


    // Access interface methods

    this.readHeader = function() {
        if (isTapeEnd()) return false;
        seekHeader(1);
        if (isTapeEnd()) return false;
        tapePosition += 8;          // Skip "read" Header
        return true;
    };

    this.readByte = function() {
        if (isTapeEnd()) return null;
        return tapeContent[tapePosition++];
    };

    this.writeHeader = function(long) {
        wmsx.Util.log("Tape is read-only!");
        return false;
    };

    this.writeByte = function(val) {
        wmsx.Util.log("Tape is read-only!");
        return false;
    };

    this.motor = function(state) {
        //console.log("Cassette Motor: " + (state !== null ? (state ? "ON" : "OFF") : "TOGGLE"));
        return true;
    };


    function seekHeader(dir, from) {
        do {
            tapePosition = wmsx.Util.arrayIndexOfSubArray(tapeContent, HEADER, tapePosition + (from || 0), dir);
        } while (tapePosition >= 0 && ((tapePosition % 8) !== 0));
        if (tapePosition === -1) dir === -1 ? toTapeStart() : toTapeEnd();
    }

    function isTapeEnd() {
        return tapePosition === tapeContent.length;
    }

    function isTapeStart() {
        return tapePosition === 0;
    }

    function toTapeEnd() {
        tapePosition = tapeContent.length;
    }

    function toTapeStart() {
        tapePosition = 0;
    }

    function peekFileInfo() {       // Tape must be positioned at a Header
        if (tapeContent.length < tapePosition + 24) return null;        // Not a complete Header

        var type = null;
        if (wmsx.Util.arrayIndexOfSubArray(tapeContent, BIN_ID, tapePosition) === tapePosition + 8) type = "Binary";
        else if (wmsx.Util.arrayIndexOfSubArray(tapeContent, TOK_ID, tapePosition) === tapePosition + 8) type = "Basic";
        else if (wmsx.Util.arrayIndexOfSubArray(tapeContent, ASC_ID, tapePosition) === tapePosition + 8) type = "ASCII";
        else return null;

        var name = wmsx.Util.uInt8ArrayToByteString(tapeContent.slice(tapePosition + 18, tapePosition + 18 + 6));

        return { type: type, name: name.trim() };
    }

    function positionMessage() {
        var mes = "";
        if (tapeContent.length === 0) {
            mes += " Tape empty";
        } else if (isTapeEnd()) {
            mes += " Tape at end";
        } else {
            var info = peekFileInfo();
            if (info) mes += ' Tape at ' + info.type + ' file "' + info.name + '"';
        }
        return mes;
    }

    function currentAutoRunCommand() {
        var info = peekFileInfo();
        if (!info) return null;

        switch (info.type) {
            case "Binary": return 'bload "cas:' + info.name + '", r\r';
            case "Basic": return 'cload "cas:' + info.name + '", r\r';
            case "ASCII": return 'load "cas:' + info.name + '", r\r';
        }
        return null;
    }


    var basicExtension;

    var tapeContent = [];
    var tapePosition = 0;

    var screen;

    var HEADER = [ 0x1f, 0xa6, 0xde, 0xba, 0xcc, 0x13, 0x7d, 0x74 ];
    var BIN_ID = [ 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0 ];
    var TOK_ID = [ 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3 ];
    var ASC_ID = [ 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea ];

};