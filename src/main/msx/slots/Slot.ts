// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Abstract base Slot
// 0x0000 - 0xffff

wmsx.Slot = function() {
"use strict";

    this.connect = function(machine) {
    };

    this.refreshConnect = function(machine) {
    };

    this.disconnect = function(machine) {
    };

    this.getDataDesc = function() {
    };

    this.loadData = function(name, arrContent) {
    };

    this.getDataToSave = function() {
    };

    this.dataModified = function() {
        return false;
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.reset = function() {
    };

    this.read = function(address) {
        return 0xff;
    };

    this.write = function(address, value) {
    };

    this.setDRAMMode = function(state) {
    };

    this.getBreakWaitSub = function(address, lastAddress) {
        return 0;
    };

    this.getAccessWaitSub = function(address) {
        return 0;
    };

    this.cpuExtensionBegin = function(s) {
    };

    this.cpuExtensionFinish = function(s) {
    };

    this.isExpanded = function() {
        return false;
    };

    this.getSecondarySlotConfig = function() {
        return 0;
    };

    this.reinsertROMContent = function() {
        if (this.rom.content) return;
        this.rom.content = this.bytes || [];
    };

    this.lightState = function() {
        return WMSX.LIGHT_STATES && wmsx.EmbeddedFiles.isEmbeddedURL(this.rom.source);
    };


    this.format = undefined;
    this.rom = undefined;
    this.bytes = undefined;


    this.dumpBytes = function(from, chunk, quant) {
        wmsx.Util.dump(this.bytes, from, chunk, quant);
    };

    this.dumpRead = function(from, chunk, quant) {
        var res = "";
        var p = from || 0;
        quant = quant || 1;
        for(var i = 0; i < quant; i++) {
            for(var c = 0; c < chunk; c++) {
                var val = this.read(p++);
                res = res + (val != undefined ? val.toString(16, 2) + " " : "? ");
            }
            res = res + "   ";
        }

        console.log(res);
    };

};

wmsx.Slot.base = new wmsx.Slot();