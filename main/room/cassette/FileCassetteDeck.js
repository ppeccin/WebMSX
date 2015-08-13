// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Savestates... :-(

wmsx.FileCassetteDeck = function() {

    this.connect = function(pCassetteSocket) {
        cassetteSocket = pCassetteSocket;
        cassetteSocket.connectDeck(this);
    };

    this.connectPeripherals = function(pScreen, pDownloader) {
        screen = pScreen;
        fileDownloader = pDownloader;
    };

    this.connectBASICExtension = function(pExtension) {
        basicExtension = pExtension;
    };

    this.loadTapeFile = function(name, arrContent, autoPower) {
        if (wmsx.Util.arrayIndexOfSubArray(arrContent, HEADER, 0) !== 0)
            return null;

        tapeFileName = name;
        tapeContent = arrContent.slice(0);
        toTapeStart();
        screen.showOSD("Cassette loaded." + positionMessage(), true);
        fireStateUpdate();

        if (autoPower && currentAutoRunCommand()) {
            cassetteSocket.autoPowerCycle();
            // Give some type for reboot and then enter command
            window.setTimeout(this.typeCurrentAutoRunCommand, 1700);        // TODO Arbitrary...
        }

        return tapeContent;
    };

    this.loadEmpty = function() {
        tapeFileName = null;
        tapeContent = [];
        toTapeStart();
        screen.showOSD("Cassette loaded with empty tape", true);
        fireStateUpdate();
    };

    this.saveTapeFile = function() {
        if (!tapeContent || (tapeContent.length === 0)) {
            screen.showOSD("Cassette is empty!", true);
            return;
        }

        try {
            var fileName = tapeFileName;
            if (!fileName) {
                var info = peekFileInfo(0);
                if (info) fileName = info.name && info.name.trim();
                if (!fileName) fileName = "WebMSXTape";
                fileName += ".cas";
            }
            var data = new ArrayBuffer(tapeContent.length);
            var view = new Uint8Array(data);
            for (var i = 0; i < tapeContent.length; i++)
                view[i] = tapeContent[i];
            fileDownloader.startDownload(fileName, data);
            screen.showOSD("Cassette File saved", true);
        } catch(ex) {
            screen.showOSD("Cassette File save failed", true);
        }
    };

    this.rewind = function() {
        toTapeStart();
        screen.showOSD("Cassette rewound." + positionMessage(), true);
    };

    this.seekToEnd = function() {
        toTapeEnd();
        screen.showOSD("Cassette forwarded to tape end", true);
    };

    this.seekForward = function() {
        if (!isTapeEnd()) seekHeader(1, 1);
        if(isTapeEnd()) return this.seekToEnd();
        screen.showOSD("Cassette skipped forward." + positionMessage(), true);
    };

    this.seekBackward = function() {
        if (!isTapeStart()) seekHeader(-1, -1);
        if(isTapeStart()) return this.rewind();
        screen.showOSD("Cassette skipped backward." + positionMessage(), true);
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
        for (var i = 0; i < HEADER.length; i++)
            tapeContent[tapePosition++] = HEADER[i];
        return true;
    };

    this.writeByte = function(val) {
        tapeContent[tapePosition++] = val;
        return true;
    };

    this.motor = function(state) {
        if (state !== null) motor = state;
        else motor = !motor;
        fireStateUpdate();
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

    function peekFileInfo(position) {       // Tape must be positioned at a Header
        if (tapeContent.length < position + 24) return null;        // Not a complete Header

        var type = null;
        if (wmsx.Util.arrayIndexOfSubArray(tapeContent, BIN_ID, position) === position + 8) type = "Binary";
        else if (wmsx.Util.arrayIndexOfSubArray(tapeContent, TOK_ID, position) === position + 8) type = "Basic";
        else if (wmsx.Util.arrayIndexOfSubArray(tapeContent, ASC_ID, position) === position + 8) type = "ASCII";
        else return null;

        var name = wmsx.Util.uInt8ArrayToByteString(tapeContent.slice(position + 18, position + 18 + 6));

        return { type: type, name: name.trim() };
    }

    function positionMessage() {
        var mes = "";
        if (tapeContent.length === 0) {
            mes += " Tape empty";
        } else if (isTapeEnd()) {
            mes += " Tape at end";
        } else {
            var info = peekFileInfo(tapePosition);
            if (info) mes += ' Tape at ' + info.type + ' file "' + info.name + '"';
        }
        return mes;
    }

    function currentAutoRunCommand() {
        var info = peekFileInfo(tapePosition);
        if (!info) return null;

        switch (info.type) {
            case "Binary": return '\r\rbload "cas:' + info.name + '", r\r';
            case "Basic": return '\r\rcload "cas:' + info.name + '", r\r';
            case "ASCII": return '\r\rload "cas:' + info.name + '", r\r';
        }
        return null;
    }

    function fireStateUpdate() {
        screen.tapeStateUpdate(tapeContent.length > 0, motor);
    }


    var basicExtension;
    var cassetteSocket;

    var tapeFileName = null;
    var tapeContent = [];
    var tapePosition = 0;
    var motor = false;

    var screen;
    var fileDownloader;

    var HEADER = [ 0x1f, 0xa6, 0xde, 0xba, 0xcc, 0x13, 0x7d, 0x74 ];
    var BIN_ID = [ 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0, 0xd0 ];
    var TOK_ID = [ 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3 ];
    var ASC_ID = [ 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea, 0xea ];

};