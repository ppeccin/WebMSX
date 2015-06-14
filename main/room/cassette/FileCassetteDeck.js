// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function FileCassetteDeck() {

    this.connect = function(cassetteSocket) {
        cassetteSocket.connectDeck(this);
    };

    this.loadTapeFile = function(name, arrContent) {
        if (Util.arrayIndexOfSubArray(arrContent, HEADER, 0) < 0)
            return null;

        tapeContent = arrContent.slice(0);
        tapePosition = 0;

        Util.log("Cassette Tape file loaded");
        return tapeContent;
    };

    this.rewind = function() {
        tapePosition = 0;
    };

    this.eject = function() {
        tapeContent = null;
    };

    this.writeHeader = function(long) {
        Util.log("Tape is read-only!");
        return false;
    };

    this.writeByte = function(val) {
        Util.log("Tape is read-only!");
        return false;
    };

    this.readHeader = function() {
        if (tapeEnd()) return false;
        tapePosition = Util.arrayIndexOfSubArray(tapeContent, HEADER, tapePosition);
        if (tapeEnd()) return false;
        console.log("Reading Tape Header");
        tapePosition += 8;
        return true;
    };

    this.readByte = function() {
        if (tapeEnd()) return null;
        return tapeContent[tapePosition++];
    };

    this.motor = function(state) {
        console.log("Cassette Motor: " + (state !== null ? (state ? "ON" : "OFF") : "TOGGLE"));
        return true;
    };

    function tapeEnd() {
        if (tapePosition >= tapeContent.length) tapePosition = -1;
        return tapePosition < 0;
    }


    var tapeContent;
    var tapePosition = 0;

    var HEADER = [ 0x1f, 0xa6, 0xde, 0xba, 0xcc, 0x13, 0x7d, 0x74 ];

}