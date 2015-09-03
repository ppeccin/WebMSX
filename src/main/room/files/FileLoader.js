// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileLoader = function() {
    var self = this;

    this.connect = function(pBIOSSocket, pCartrigeSocket, pSaveStateSocket, pCassetteDeck) {
        biosSocket = pBIOSSocket;
        cartridgeSocket = pCartrigeSocket;
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

    this.openFileChooserDialog = function(withAutoPower, inSecondaryPort) {
        if (!fileInputElement) createFileInputElement();
        secondaryPort = inSecondaryPort === true;
        autoPower = withAutoPower !== false;
        fileInputElement.click();
    };

    this.openURLChooserDialog = function(withAutoPower, inSecondaryPort) {
        secondaryPort = inSecondaryPort === true;
        autoPower = withAutoPower !== false;
        var url;
        try {
            url = localStorage && localStorage[LOCAL_STOARAGE_LAST_URL_KEY];
        } catch (e) {
            // give up
        }
        url = prompt("Load file from URL:", url || "");
        if (!url) return;
        url = url.toString().trim();
        if (!url) return;
        try {
            localStorage[LOCAL_STOARAGE_LAST_URL_KEY] = url;
        } catch (e) {
            // give up
        }
        this.loadFromURL(url);
    };

    this.loadFromFile = function (file) {
        wmsx.Util.log("Reading file: " + file.name);
        var reader = new FileReader();
        reader.onload = function (event) {
            var content = new Uint8Array(event.target.result);
            loadContent(file.name, content);
        };
        reader.onerror = function (event) {
            showError("File reading error: " + event.target.error.name);
        };

        reader.readAsArrayBuffer(file);
    };

    this.loadFromURL = function (url) {
        wmsx.Util.log("Reading file from URL: " + url);

        var req = new XMLHttpRequest();
        req.withCredentials = true;
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.timeout = 2000;
        req.onload = function () {
            if (req.status === 200) {
                var content = new Uint8Array(req.response);
                loadContent(url, content);
            } else
                showError("URL reading error: " + (req.statusText || req.status));
        };
        req.onerror = function () {
            showError("URL reading error: " + (req.statusText || req.status));
        };
        req.ontimeout = function () {
            showError("URL reading error: " + (req.statusText || req.status));
        };

        req.send();
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
        self.loadFromFile(file);
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

        autoPower = event.altKey !== true;
        secondaryPort = event.ctrlKey === true;

        if (WMSX.MEDIA_CHANGE_DISABLED) return;
        if (!event.dataTransfer) return;

        // First try to get local file
        var files = event.dataTransfer && event.dataTransfer.files;
        if (files && files.length > 0) {
            self.loadFromFile(files[0]);
            return;
        }

        // Then try to get URL
        var url = event.dataTransfer.getData("URL");
        if (url && url.length > 0) {
            self.loadFromURL(url);
        }
    };

    var loadContent = function (name, content) {
        var rom, arrContent;
        // First try reading and creating directly
        try {
            arrContent = new Array(content.length);
            wmsx.Util.arrayCopy(content, 0, arrContent, 0, arrContent.length);
            // First try to load as a SaveState file
            if (saveStateSocket.loadStateFile(arrContent))
                return;
            // Then try to load as a Cassette file
            if (cassetteDeck.loadTapeFile(name, arrContent, autoPower))
                return;
            // Then try to load as a Disk file
            if (diskDrive.loadDiskFile(secondaryPort ? 1 : 0, name, arrContent, autoPower))
                return;
            // Then try to load as a normal, uncompressed ROM (BIOS or Cartridge)
            rom = new wmsx.ROM(name, arrContent);
            var slot = wmsx.SlotCreator.createFromROM(rom);
            if (slot.constructor === wmsx.BIOS) {
                biosSocket.insert(slot, autoPower);
            } else {
                cartridgeSocket.insert(slot, secondaryPort ? 2 : 1, autoPower);
            }
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
                        wmsx.Util.arrayCopy(cont, 0, arrContent, 0, arrContent.length);
                        // First try to load as a SaveState file
                        if (saveStateSocket.loadStateFile(arrContent))
                            return;
                        // Then try to load as a Cassette file
                        if (cassetteDeck.loadTapeFile(name, arrContent, autoPower))
                            return;
                        // Then try to load as a Disk file
                        if (diskDrive.loadDiskFile(secondaryPort ? 1 : 0, name, arrContent, autoPower))
                            return;
                        // Then try to load as a ROM (BIOS or Cartridge)
                        rom = new wmsx.ROM(file.name, arrContent);
                        slot = wmsx.SlotCreator.createFromROM(rom);
                        if (slot.constructor === wmsx.BIOS) {
                            biosSocket.insert(slot, autoPower);
                        } else {
                            cartridgeSocket.insert(slot, secondaryPort ? 2 : 1, autoPower);
                        }
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

    var showError = function(message) {
        wmsx.Util.log("" + message);
        wmsx.Util.message("Could not load ROM:\n\n" + message);
    };

    var createFileInputElement = function (element) {
        fileInputElement = document.createElement("input");
        fileInputElement.id = "ROMLoaderFileInput";
        fileInputElement.type = "file";
        fileInputElement.accept = INPUT_ELEM_ACCEPT_PROP;
        fileInputElement.style.display = "none";
        fileInputElement.addEventListener("change", onFileInputChange);
        fileInputElementParent.appendChild(fileInputElement);
    };


    var biosSocket;
    var cartridgeSocket;
    var saveStateSocket;
    var cassetteDeck;
    var diskDrive;

    var fileInputElement;
    var fileInputElementParent;

    var autoPower = true;
    var secondaryPort = false;


    var ZIP_INNER_FILES_PATTERN = /^.*\.(bin|BIN|rom|ROM|bios|BIOS|cas|CAS|tape|TAPE|wst|WST)$/;
    var INPUT_ELEM_ACCEPT_PROP  = ".bin,.rom,.bios,.cas,.tape,.wst,.zip";
    var LOCAL_STOARAGE_LAST_URL_KEY = "wmsxlasturl";


    WMSX.loadROMFromURL = this.loadFromURL;

};