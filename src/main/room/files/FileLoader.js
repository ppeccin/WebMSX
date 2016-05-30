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

    this.openFileChooserDialog = function (openType, altPower, inSecondaryPort) {
        if (!fileInputElement) createFileInputElement();
        fileInputElement.multiple = INPUT_MULTI[OPEN_TYPE[openType] || OPEN_TYPE.ALL];
        fileInputElement.accept = INPUT_ACCEPT[OPEN_TYPE[openType] || OPEN_TYPE.ALL];

        chooserOpenType = openType;
        chooserPort = inSecondaryPort ? 1 : 0;
        chooserAltPower = altPower;
        chooserAsExpansion = false;     // No means to load expansion via chooser for now
        fileInputElement.click();
    };

    this.openURLChooserDialog = function (openType, altPower, inSecondaryPort, asExpansion) {
        var port = inSecondaryPort ? 1 : 0;
        var url;
        try {
            url = localStorage && localStorage[LOCAL_STORAGE_LAST_URL_KEY];
        } catch (e) {
            // give up
        }

        var wasPaused = machine.systemPause(true);

        url = prompt("Load file from URL:", url || "");
        url = url && url.toString().trim();

        if (url) {
            try {
                localStorage[LOCAL_STORAGE_LAST_URL_KEY] = url;
            } catch (e) {
                // give up
            }
            this.readFromURL(url, openType, port, altPower, asExpansion, function (s) {
                if (!wasPaused) machine.systemPause(false);
            });
        } else {
            if (!wasPaused) machine.systemPause(false);
        }
    };

    this.readFromFile = function (file, openType, port, altPower, asExpansion, then) {
        wmsx.Util.log("Reading file: " + file.name);
        var reader = new FileReader();
        reader.onload = function (event) {
            var content = new Uint8Array(event.target.result);
            self.loadContentAsMedia(file.name, content, openType, port || 0, altPower, asExpansion);
            if (then) then(true);
        };
        reader.onerror = function (event) {
            showError("File reading error: " + event.target.error.name + DIR_NOT_SUPPORTED_HINT);     // Directories not supported
            if (then) then(false);
        };

        reader.readAsArrayBuffer(file);
    };

    this.readFromFiles = function (files, port, altPower, then) {   // Files as Disk
        var reader = new wmsx.MultiFileReader(files,
            function onSuccessAll(files) {
                self.loadFilesAsDisk(files, port, altPower);
                if (then) then(true);
            },
            function onFirstError(files, error, known) {
                if (!known) error += DIR_NOT_SUPPORTED_HINT;    // Directories not supported
                showError("File reading error: " + error);
                if (then) then(false);
            },
            720 * 1024
        );
        reader.start();
    };

    this.readFromURL = function (url, openType, port, altPower, asExpansion, then) {
        new wmsx.MultiDownloader([{
            url: url,
            onSuccess: function (res) {
                self.loadContentAsMedia(url, res.content, openType, port || 0, altPower, asExpansion);
                if (then) then(true);
            },
            onError: function (res) {
                showError("URL reading error: " + res.error);
                if (then) then(false);
            }
        }]).start();
    };

    this.loadContentAsMedia = function (name, content, openType, port, altPower, asExpansion) {
        var arrContent;
        openType = OPEN_TYPE[openType] || OPEN_TYPE.ALL;
        // First try reading and creating directly
        arrContent = new Array(content.length);
        wmsx.Util.arrayCopy(content, 0, arrContent);
        // First try to load as a Disk file
        if (openType === OPEN_TYPE.DISK || openType === OPEN_TYPE.ALL)
            if (diskDrive.loadDiskFile(port, name, arrContent, altPower))
                return;
        // Then try to load as a Cassette file
        if (openType === OPEN_TYPE.TAPE || openType === OPEN_TYPE.ALL)
            if (cassetteDeck.loadTapeFile(name, arrContent, altPower))
                return;
        // Then try to load as a ROM
        if (openType === OPEN_TYPE.ROM || openType === OPEN_TYPE.ALL) {
            var slot = wmsx.SlotCreator.createFromROM(new wmsx.ROM(name, arrContent));
            if (slot) {
                if (slot.format === wmsx.SlotFormats.BIOS) biosSocket.insert(slot, altPower);
                else if (asExpansion) expansionSocket.insert(slot, port, altPower);
                else cartridgeSocket.insert(slot, port, altPower);
                return;
            }
        }
        // Then try to load as a SaveState file
        if (openType === OPEN_TYPE.STATE || openType === OPEN_TYPE.ALL)
            if (saveStateSocket.loadStateFile(arrContent))
                return;
        // Then try as compressed content (zip file). Any file extension
        try {
            var zip = new JSZip(content);
            var files = zip.file(ZIP_PATTERN.ALL);

            // If loading as "ZIP as Disk", try only this option
            if (openType === OPEN_TYPE.ZIP)
                return this.loadZipAsDisk(name, zip, port, altPower);

            // If not, try finding a valid file inside
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                wmsx.Util.log("Trying zip file content: " + file.name);
                var cont = file.asUint8Array();
                arrContent = new Array(cont.length);
                wmsx.Util.arrayCopy(cont, 0, arrContent);
                // First try to load as a Disk file
                if (openType === OPEN_TYPE.DISK || openType === OPEN_TYPE.ALL)
                    if (diskDrive.loadDiskFile(port, name, arrContent, altPower))
                        return;
                // Then try to load as a Cassette file
                if (openType === OPEN_TYPE.TAPE || openType === OPEN_TYPE.ALL)
                    if (cassetteDeck.loadTapeFile(name, arrContent, altPower))
                        return;
                // Then try to load as a ROM (BIOS or Cartridge)
                if (openType === OPEN_TYPE.ROM || openType === OPEN_TYPE.ALL) {
                    slot = wmsx.SlotCreator.createFromROM(new wmsx.ROM(name, arrContent));
                    if (slot) {
                        if (slot.format === wmsx.SlotFormats.BIOS) biosSocket.insert(slot, altPower);
                        else if (asExpansion) expansionSocket.insert(slot, port, altPower);
                        else cartridgeSocket.insert(slot, port, altPower);
                        return;
                    }
                }
                // Then try to load as a SaveState file
                if (openType === OPEN_TYPE.STATE || openType === OPEN_TYPE.ALL)
                    if (saveStateSocket.loadStateFile(arrContent))
                        return;
                // Not a valid file to load... Next!
            }
            // Try again as "ZIP as Disk" if type is ALL
            if (openType === OPEN_TYPE.ALL)
                return this.loadZipAsDisk(name, zip, port, altPower);

            // If nothing worked, error
            showError("No valid " + TYPE_DESC[openType] + " image files found in ZIP file");
        } catch(ez) {
            // Error decompressing. Probably not a zip file. Give up
            console.log(ez.stack);
            showError("Unsupported file!");
        }
    };

    this.loadContentAsSlot = function (name, content, slotPos, altPower) {      // Used only by Launcher
        var arrContent;
        // First try reading and creating directly
        arrContent = new Array(content.length);
        wmsx.Util.arrayCopy(content, 0, arrContent);
        var slot = wmsx.SlotCreator.createFromROM(new wmsx.ROM(name, arrContent));
        if (slot) {
            slotSocket.insert(slot, slotPos, altPower);
            return;
        }
        // Then try as compressed content (zip file). Any file extension
        try {
            var zip = new JSZip(content);
            var files = zip.file(ZIP_PATTERN.ALL);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                wmsx.Util.log("Trying zip file content: " + file.name);
                var cont = file.asUint8Array();
                arrContent = new Array(cont.length);
                wmsx.Util.arrayCopy(cont, 0, arrContent);
                slot = wmsx.SlotCreator.createFromROM(new wmsx.ROM(name + " - " + file.name, arrContent));
                if (slot) {
                    slotSocket.insert(slot, slotPos, altPower);
                    return;
                }
                // Not a valid file to load... Next!
            }
            showError("No valid ROMs found in ZIP file");
        } catch(ez) {
            console.log(ez.stack);
            showError("Unsupported file!");
        }
    };

    this.loadFilesAsDisk = function (files, port, altPower) {
        // Sort files by name
        files = Array.prototype.slice.call(files);
        files.sort(function sortFiles(a, b) {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });

        diskDrive.loadFilesAsDisk(port, null, files, altPower, "Files as Disk");
    };

    this.loadZipAsDisk = function (name, zip, port, altPower) {
        diskDrive.loadFilesAsDisk(port, name, createTreeFromZip(zip), altPower, "ZIP as Disk");
    };

    function createTreeFromZip(zip) {
        // Build file tree structure as required by image creator
        var rootDir = [];
        var dirs = zip.folder(/.+/).filter(function(f) { return f.dir && f.name; });         // get only directories first
        dirs.sort(function (a, b) {                                                          // sort dirs according to depth
            return wmsx.Util.stringCountOccurrences(a.name, "/") - wmsx.Util.stringCountOccurrences(b.name, "/");
        });
        for (var d = 0; d < dirs.length; ++d)
            createDir(dirs[d]);

        var files = zip.file(/.+/).filter(function(f) { return !f.dir && f.name; });         // get only real files
        for (var f = 0; f < files.length; ++f)
            putFile(files[f]);

        return rootDir;

        function createDir(newDir) {
            var parts = newDir.name.split("/");
            var dir = rootDir;
            for (var p = 0; p < parts.length - 2; ++p) {
                var part = parts[p];
                var subDir = dir.find(function(i) { return i.isDir && i.name == part; });
                if (!subDir) {
                    subDir = { isDir: true, name: part, items: [] };
                    dir.push(subDir);
                }
                dir = subDir.items;
            }
            newDir.isDir = true;
            newDir.name = parts[parts.length - 2];
            newDir.lastModifiedDate = newDir.date;
            newDir.items = [];
            dir.push(newDir);
        }

        function putFile(file) {
            var parts = file.name.split("/");
            var dir = rootDir;
            for (var p = 0; p < parts.length - 1; ++p) {
                var part = parts[p];
                var subDir = dir.find(function(i) { return i.isDir && i.name == part; });
                if (!subDir) {
                    subDir = { isDir: true, name: part, items: [] };
                    dir.push(subDir);
                }
                dir = subDir.items;
            }
            file.isDir = false;
            file.name = parts[parts.length - 1];
            file.lastModifiedDate = file.date;
            file.content = file.asUint8Array();
            dir.push(file);
        }
    }

    var onFileInputChange = function(event) {
        event.returnValue = false;  // IE
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        event.target.focus();
        if (!this.files || this.files.length === 0) return;           // this will have a property "files"!

        var files = Array.prototype.slice.call(this.files);

        // Tries to clear the last selected file so the same file can be chosen
        try {
            fileInputElement.value = "";
        } catch (e) {
            // Ignore
        }

        var wasPaused = machine.systemPause(true);
        var resume = function (s) {
            if (!wasPaused) machine.systemPause(false);
        };

        if (files.length === 1)
            self.readFromFile(files[0], chooserOpenType, chooserPort, chooserAltPower, chooserAsExpansion, resume);
        else
            self.readFromFiles(files, chooserPort, chooserAltPower, resume);

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

        dragButtons = event.buttons > 0 ? event.buttons : MOUSE_BUT1_MASK;      // If buttons not supported, consider it a left-click
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
        var altPower = dragButtons & MOUSE_BUT2_MASK;
        var asExpansion = event.altKey;

        // Try to get local file/files if present
        var files = event.dataTransfer && event.dataTransfer.files;
        var resume = function (s) {
            if (!wasPaused) machine.systemPause(false);
        };
        if (files && files.length > 0) {
            if (files.length === 1)
                self.readFromFile(files[0], null, port, altPower, asExpansion, resume);
            else
                self.readFromFiles(files, port, altPower, resume);
        } else {
            // If not, try to get URL
            var url = event.dataTransfer.getData("text");
            if (url && url.length > 0)
                self.readFromURL(url, null, port, altPower, asExpansion, resume);
        }
    };

    var showError = function(message) {
        wmsx.Util.log("" + message);
        wmsx.Util.message("Could not load file(s):\n\n" + message + "\n");
    };

    var createFileInputElement = function () {
        fileInputElement = document.createElement("input");
        fileInputElement.id = "ROMLoaderFileInput";
        fileInputElement.type = "file";
        fileInputElement.multiple = true;
        fileInputElement.accept = INPUT_ACCEPT.ALL;
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

    var chooserOpenType;
    var chooserPort = 0;
    var chooserAltPower = false;
    var chooserAsExpansion = false;

    var dragButtons = 1;

    var MOUSE_BUT1_MASK = 1;
    var MOUSE_BUT2_MASK = 2;


    var OPEN_TYPE = wmsx.FileLoader.OPEN_TYPE;

    var ZIP_PATTERN = {
        ROM:   /^.+\.(bin|BIN|rom|ROM|bios|BIOS)$/,
        DISK:  /^.+\.(bin|BIN|dsk|DSK)$/,
        TAPE:  /^.+\.(bin|BIN|cas|CAS|tape|TAPE)$/,
        STATE: /^.+\.(wst|WST)$/,
        FILES: /.+/,
        ZIP:   /.+/,
        ALL:   /.+/
    };

    var INPUT_ACCEPT = {
        ROM:   ".bin,.BIN,.rom,.ROM,.bios,.BIOS,.zip,.ZIP",
        DISK:  ".bin,.BIN,.dsk,.DSK,.zip,.ZIP",
        TAPE:  ".bin..BIN,.cas,.CAS,.tape,.TAPE,.zip,.ZIP",
        STATE: ".wst,.WST",
        FILES: ".*",
        ZIP:   ".zip,.ZIP",
        ALL:   ".bin,.BIN,.dsk,.DSK,.rom,.ROM,.bios,.BIOS,.cas,.CAS,.tape,.TAPE,.wst,.WST,.zip,.ZIP"
    };

    var INPUT_MULTI = {
        ROM:   false,
        DISK:  false,
        TAPE:  false,
        STATE: false,
        FILES: true,
        ZIP:   false,
        ALL:   false
    };

    var TYPE_DESC = {
        ROM:   "ROM",
        DISK:  "Disk",
        TAPE:  "Cassette",
        STATE: "Savestate",
        FILES: "Files",
        ZIP:   "ZIP",
        ALL:   "ROM, Cassette or Disk"
    };

    var LOCAL_STORAGE_LAST_URL_KEY = "wmsxlasturl";

    var DIR_NOT_SUPPORTED_HINT = '\n\nIMPORTANT: Directories are not supported for loading!\nPlease use "ZIP as Disk" loading for full directories support.';

    WMSX.fileLoader = this;

};

wmsx.FileLoader.OPEN_TYPE = { ROM: "ROM", DISK: "DISK", TAPE: "TAPE", STATE: "STATE", ALL: "ALL" };