// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.


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


// Launch
function TestMachine() {

    ctr.value = 0;
    CPU.breakpointOutput = breakpointOutput;
    // runClicked();

}

