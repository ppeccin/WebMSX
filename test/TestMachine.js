// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Trace facility

var to = document.getElementById("traceOutput");
var ctr = document.getElementById("cyclesToRun");

function stepClicked() {
    CPU.trace = true;
    CPU.stop = false;
}

function runClicked() {
    CPU.trace = false;
    CPU.stop = false;
    //var cycles = Number.parseInt(ctr.value);
    //if (cycles > 0) {
    //    // Run CPU for N clocks
    //    breakpointOutput("<<<< RUNNING for " + cycles + " cycles >>>>>>");
    //    setTimeout(function() {
    //        CPU.runCycles(cycles, true);
    //        CPU.breakpoint("DONE!");
    //    }, 1);
    //} else {
    //    // Let Clock run
    //    CLO.go();
        breakpointOutput("<<<< RUNNING CLOCK >>>>>>");
    //}
}

function breakpointOutput(text) {
    text = text.replace(/ /g, "&nbsp;");
    text = text.replace(/\n/g, "<br>");

    to.innerHTML = text;
}


// Launch
function TestMachine() {

    ctr.value = 0;
    WMSX.room.machine.cpu.breakpointOutput = breakpointOutput;
    // runClicked();

}

