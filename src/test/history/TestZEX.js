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
        console.log(rom.length);
        startEmulator(rom);
    };
    reader.onerror = function (event) {
        alert("Could not read ROM! Error: " + event.target.error.code);
    };

    reader.readAsArrayBuffer(file);
}

// Listeners
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


function startEmulator(rom) {

    var start = 0x100;

    CPU = new wmsx.Z80();
    RAM = new TestRam64K(rom, start);
    CPU.connectBus(RAM);


    // ZEX Program modifications  -------------

    // Address for SP at boot???
    RAM.write(0x0006, 0xff);
    RAM.write(0x0007, 0xff);

    // CPU Routines to print chars
    RAM.write(0x0005, 258);     // pPRINT

    // Test to start with (frist = 0)
    var test = 0;
    RAM.write(0x0120, (test * 2 + 0x013a) & 255);
    RAM.write(0x0121, (test * 2 + 0x013a) >>> 8);

    // ---------------------------------------

    CPU.powerOn();
    CPU.setPC(start);

}


