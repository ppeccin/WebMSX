// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileLoader = function() {
    var self = this;

    this.connect = function(pMachine, pSlotSocket, pBIOSSocket, pExpansionSocket, pCartridgeSocket, pSaveStateSocket) {
        machine = pMachine;
        slotSocket = pSlotSocket;
        biosSocket = pBIOSSocket;
        expansionSocket = pExpansionSocket;
        cartridgeSocket = pCartridgeSocket;
        saveStateSocket = pSaveStateSocket;
    };

    this.connectPeripherals = function(pCassetteDeck, pDiskDrive) {
        cassetteDeck = pCassetteDeck;
        diskDrive = pDiskDrive;
    };

    this.registerForDnD = function (element) {
        element.addEventListener("dragover", onDragOver, false);
        element.addEventListener("drop", onDrop, false);
    };

    this.registerForFileInputElement = function (element) {
        fileInputElementParent = element;
    };

    this.openFileChooserDialog = function(altPower, inSecondaryPort) {
        if (!fileInputElement) createFileInputElement();
        chooserPort = inSecondaryPort ? 1 : 0;
        chooserAltPower = altPower;
        chooserAsExpansion = false;     // No means to load expansion via chooser for now
        fileInputElement.click();
    };

    this.openURLChooserDialog = function(altPower, inSecondaryPort, asExpansion) {
        var port = inSecondaryPort ? 1 : 0;
        var url;
        try {
            url = localStorage && localStorage[LOCAL_STOARAGE_LAST_URL_KEY];
        } catch (e) {
            // give up
        }

        var wasPaused = machine.systemPause(true);

        url = prompt("Load file from URL:", url || "");
        url = url && url.toString().trim();

        if (url) {
            try {
                localStorage[LOCAL_STOARAGE_LAST_URL_KEY] = url;
            } catch (e) {
                // give up
            }
            this.loadFromURL(url, port, altPower, asExpansion, function(s) {
                if (!wasPaused) machine.systemPause(false);
            });
        } else {
            if (!wasPaused) machine.systemPause(false);
        }
    };

    this.loadFromFile = function (file, port, altPower, asExpansion, then) {
        wmsx.Util.log("Reading file: " + file.name);
        var reader = new FileReader();
        reader.onload = function (event) {
            var content = new Uint8Array(event.target.result);
            self.loadContentAsMedia(file.name, content, port || 0, altPower, asExpansion);
            if (then) then(true);
        };
        reader.onerror = function (event) {
            showError("File reading error: " + event.target.error.name);
            if (then) then(false);
        };

        reader.readAsArrayBuffer(file);
    };

    this.loadFromFiles = function (files, port, altPower, then) {
        var reader = new wmsx.MultiFileReader(files,
            function onSuccessAll(files) {
                self.loadFilesAsDisk(files, port, altPower);
                if (then) then(true);
            },
            function onFirstError(files, error) {
                showError("File reading error: " + error);
                if (then) then(false);
            }
        );
        reader.start();
    };

    this.loadFromURL = function (url, port, altPower, asExpansion, then) {
        new wmsx.MultiDownloader([{
            url: url,
            onSuccess: function (res) {
                self.loadContentAsMedia(url, res.content, port || 0, altPower, asExpansion);
                if (then) then(true);
            },
            onError: function (res) {
                showError("URL reading error: " + res.error);
                if (then) then(false);
            }
        }]).start();
    };

    this.loadContentAsMedia = function (name, content, port, altPower, asExpansion) {
        var rom, arrContent;
        // First try reading and creating directly
        try {
            arrContent = new Array(content.length);
            wmsx.Util.arrayCopy(content, 0, arrContent);
            // First try to load as a SaveState file
            if (saveStateSocket.loadStateFile(arrContent, altPower))
                return;
            // Then try to load as a Cassette file
            if (cassetteDeck.loadTapeFile(name, arrContent, altPower))
                return;
            // Then try to load as a Disk file
            if (diskDrive.loadDiskFile(port, name, arrContent, altPower))
                return;
            // Then try to load as a ROM
            rom = new wmsx.ROM(name, arrContent);
            var slot = wmsx.SlotCreator.createFromROM(rom);
            if (slot.format === wmsx.SlotFormats.BIOS)
                biosSocket.insert(slot, altPower);
            else if (asExpansion)
                expansionSocket.insert(slot, port, altPower);
            else
                cartridgeSocket.insert(slot, port, altPower);
        } catch(e) {
            if (!e.msx) {
                wmsx.Util.log(e.stack);
                throw e;
            }

            // If it fails, try assuming its a compressed content (zip with ROMs)
            try {
                var zip = new JSZip(content);
                var files = zip.file(ZIP_INNER_FILES_PATTERN);
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    wmsx.Util.log("Trying zip file content: " + file.name);
                    try {
                        var cont = file.asUint8Array();
                        arrContent = new Array(cont.length);
                        wmsx.Util.arrayCopy(cont, 0, arrContent);
                        // First try to load as a SaveState file
                        if (saveStateSocket.loadStateFile(arrContent, altPower))
                            return;
                        // Then try to load as a Cassette file
                        if (cassetteDeck.loadTapeFile(name, arrContent, altPower))
                            return;
                        // Then try to load as a Disk file
                        if (diskDrive.loadDiskFile(port, name, arrContent, altPower))
                            return;
                        // Then try to load as a ROM (BIOS or Cartridge)
                        rom = new wmsx.ROM(name + " - " + file.name, arrContent);
                        slot = wmsx.SlotCreator.createFromROM(rom);
                        if (slot.format === wmsx.SlotFormats.BIOS)
                            biosSocket.insert(slot, altPower);
                        else if (asExpansion)
                            expansionSocket.insert(slot, port, altPower);
                        else
                            cartridgeSocket.insert(slot, port, altPower);
                        return;
                    } catch (ef) {
                        // Move on and try the next file
                    }
                }
                showError("No valid ROM, Cassette or Disk files inside zip file");
            } catch(ez) {
                // Probably not a zip file. Let the original message show
                showError(e.message);
            }
        }
    };

    this.loadContentAsSlot = function (name, content, slotPos, altPower) {
        var rom, arrContent;
        // First try reading and creating directly
        try {
            arrContent = new Array(content.length);
            wmsx.Util.arrayCopy(content, 0, arrContent);
            rom = new wmsx.ROM(name, arrContent);
            var slot = wmsx.SlotCreator.createFromROM(rom);
            slotSocket.insert(slot, slotPos, altPower);
        } catch(e) {
            if (!e.msx) {
                wmsx.Util.log(e.stack);
                throw e;
            }

            // If it fails, try assuming its a compressed content (zip with ROMs)
            try {
                var zip = new JSZip(content);
                var files = zip.file(ZIP_INNER_FILES_PATTERN);
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    wmsx.Util.log("Trying zip file content: " + file.name);
                    try {
                        var cont = file.asUint8Array();
                        arrContent = new Array(cont.length);
                        wmsx.Util.arrayCopy(cont, 0, arrContent);
                        rom = new wmsx.ROM(name + " - " + file.name, arrContent);
                        slot = wmsx.SlotCreator.createFromROM(rom);
                        slotSocket.insert(slot, slotPos, altPower);
                        return;
                    } catch (ef) {
                        // Move on and try the next file
                    }
                }
                showError("No valid ROMs inside zip file");
            } catch(ez) {
                // Probably not a zip file. Let the original message show
                showError(e.message);
            }
        }
    };

    this.loadFilesAsDisk = function (files, port, altPower) {
        // First try reading and creating directly
        try {
            diskDrive.loadFilesAsDisk(port, files, altPower);
        } catch(e) {
            if (!e.msx) {
                wmsx.Util.log(e.stack);
                throw e;
            }
        }
    };

    var onFileInputChange = function(event) {
        event.returnValue = false;  // IE
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        event.target.focus();
        if (!this.files || !this.files.length) return;

        var file = this.files[0];
        // Tries to clear the last selected file so the same file can be chosen
        try {
            fileInputElement.value = "";
        } catch (e) {
            // Ignore
        }

        var wasPaused = machine.systemPause(true);

        self.loadFromFile(file, chooserPort, chooserAltPower, chooserAsExpansion, function(s) {
            if (!wasPaused) machine.systemPause(false);
        });

        return false;
    };

    var onDragOver = function (event) {
        event.returnValue = false;  // IE
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();

        if (WMSX.MEDIA_CHANGE_DISABLED)
            event.dataTransfer.dropEffect = "none";
        else
            event.dataTransfer.dropEffect = "link";
    };

    var onDrop = function (event) {
        event.returnValue = false;  // IE
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        event.target.focus();

        if (WMSX.MEDIA_CHANGE_DISABLED) return;
        if (!event.dataTransfer) return;

        var wasPaused = machine.systemPause(true);

        var port = event.shiftKey ? 1 : 0;
        var altPower = event.ctrlKey;
        var asExpansion = event.altKey;

        // Try to get local file/files if present
        var files = event.dataTransfer && event.dataTransfer.files;
        var resume = function (s) {
            if (!wasPaused) machine.systemPause(false);
        };
        if (files && files.length > 0) {
            if (files.length === 1)
                self.loadFromFile(files[0], port, altPower, asExpansion, resume);
            else
                self.loadFromFiles(files, port, altPower, resume);
        } else {
            // If not, try to get URL
            var url = event.dataTransfer.getData("text");
            if (url && url.length > 0)
                self.loadFromURL(url, port, altPower, asExpansion, resume);
        }
    };

    var showError = function(message) {
        wmsx.Util.log("" + message);
        wmsx.Util.message("Could not load file:\n\n" + message);
    };

    var createFileInputElement = function () {
        fileInputElement = document.createElement("input");
        fileInputElement.id = "ROMLoaderFileInput";
        fileInputElement.type = "file";
        fileInputElement.accept = INPUT_ELEM_ACCEPT_PROP;
        fileInputElement.style.display = "none";
        fileInputElement.addEventListener("change", onFileInputChange);
        fileInputElementParent.appendChild(fileInputElement);
    };

    var machine;
    var slotSocket;
    var biosSocket;
    var expansionSocket;
    var cartridgeSocket;
    var saveStateSocket;
    var cassetteDeck;
    var diskDrive;

    var fileInputElement;
    var fileInputElementParent;

    var chooserPort = 0;
    var chooserAltPower = false;
    var chooserAsExpansion = false;


    var ZIP_INNER_FILES_PATTERN = /^.*\.(bin|BIN|dsk|DSK|rom|ROM|bios|BIOS|cas|CAS|tape|TAPE|wst|WST)$/;
    var INPUT_ELEM_ACCEPT_PROP  = ".bin,.dsk,.rom,.bios,.cas,.tape,.wst,.zip";
    var LOCAL_STOARAGE_LAST_URL_KEY = "wmsxlasturl";


    WMSX.loadROMFromURL = this.loadFromURL;

};