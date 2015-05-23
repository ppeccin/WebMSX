// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function handleFileSelect(event) {
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();

    var files = event.dataTransfer.files; // FileList object.
    if (!files || files.length === 0) {
        return
    }

    var file = files[0];

    console.log(">>> Reading ROM:" + file.name);
    readFile(file);
}

function handleDragOver(event) {
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function readFile(file) {
    var reader = new FileReader();
    reader.onload = function (event) {
        var contents = event.target.result;
        var rom = new Uint8Array(contents);
        scr.innerHTML = "";
        startEmulator(rom);
    };
    reader.onerror = function (event) {
        alert("Could not read ROM! Error: " + event.target.error.code);
    };

    reader.readAsArrayBuffer(file);
}

// Trace facility

var to = document.getElementById("traceOutput");
var ctr = document.getElementById("cyclesToRun");

function stepClicked() {
    CLO.pauseOnNextPulse(function() {
        CPU.trace = true;
        CPU.runCycles(1000, false);
    })
}

function runClicked() {
    CPU.trace = false;
    var cycles = Number.parseInt(ctr.value);
    if (cycles > 0) {
        // Run CPU for N clocks
        breakpointOutput("<<<< RUNNING for " + cycles + " cycles >>>>>>");
        setTimeout(function() {
            CPU.runCycles(cycles, true);
            CPU.breakpoint("DONE!");
        }, 1);
    } else {
        // Let Clock run
        breakpointOutput("<<<< RUNNING CLOCK >>>>>>");
        CLO.go();
    }
}

function breakpointOutput(text) {
    CPU.stop = true;
    text = text.replace(/ /g, "&nbsp;");
    text = text.replace(/\n/g, "<br>");

    to.innerHTML = text;
}


// Text Mode screen

var scr = document.getElementById("screen");

function textModeUpdater(text) {
    text = Util.escapeHtml(text);
    text = text.replace(/[\x00-\x20]/g, "&nbsp;");
    text = text.replace(/[\x7f-\xfe]/g, "&nbsp;");
    text = text.replace(/\xff/g, "&#9608;");

    scr.innerHTML = text;
}


// Canvas screen

var canv = document.getElementById("msx-canvas");
var contex = canv.getContext("2d");

function canvasUpdater(imageData) {
    //cotex.drawImage(image, 0, 0);
    contex.putImageData(imageData, 0, 0);
}


// Listeners
scr.addEventListener('dragover', handleDragOver, false);
scr.addEventListener('drop', handleFileSelect, false);
canv.addEventListener('dragover', handleDragOver, false);
canv.addEventListener('drop', handleFileSelect, false);


// Launch

ctr.value = 0;

function startEmulator(rom) {

    R = new Room(rom);
    R.powerOn();

    CPU.breakpointOutput = breakpointOutput;

    VD.textModeUpdater = textModeUpdater;
    VD.canvasUpdater = canvasUpdater;

    CONT.addInputElements([scr, canv]);

    runClicked();
    scr.focus();

}


