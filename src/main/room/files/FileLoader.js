// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.FileLoader = function() {
"use strict";

    var self = this;

    this.connect = function(pMachine) {
        machine = pMachine;
        slotSocket = machine.getSlotSocket();
        biosSocket = machine.getBIOSSocket();
        machine.getExtensionsSocket().connectFileLoader(this);
        expansionSocket = machine.getExpansionSocket();
        cartridgeSocket = machine.getCartridgeSocket();
        saveStateSocket = machine.getSavestateSocket();
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

    this.openFileChooserDialog = function (openType, altPower, inSecondaryPort, asExpansion) {
        if (!fileInputElement) createFileInputElement();
        fileInputElement.multiple = INPUT_MULTI[OPEN_TYPE[openType] || OPEN_TYPE.AUTO];
        fileInputElement.accept = INPUT_ACCEPT[OPEN_TYPE[openType] || OPEN_TYPE.AUTO];

        chooserOpenType = openType;
        chooserPort = inSecondaryPort ? 1 : 0;
        chooserAltPower = altPower;
        chooserAsExpansion = asExpansion;
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

    this.readFromFile = function (file, openType, port, altPower, asExpansion, then) {      // Auto detects type
        wmsx.Util.log("Reading file: " + file.name);
        var reader = new FileReader();
        reader.onload = function (event) {
            var content = new Uint8Array(event.target.result);
            var aFile = { name: file.name, content: content, lastModifiedDate: file.lastModifiedDate };
            self.loadFromFile(aFile, openType, port, altPower, asExpansion);
            if (then) then(true);
        };
        reader.onerror = function (event) {
            showError("File reading error: " + event.target.error.name + DIR_NOT_SUPPORTED_HINT);     // Directories not supported
            if (then) then(false);
        };

        reader.readAsArrayBuffer(file);
    };

    this.readFromURL = function (url, openType, port, altPower, asExpansion, then) {
        new wmsx.MultiDownloader(
            [{ url: url }],
            function onAllSuccess(urls) {
                var aFile = { name: url, content: urls[0].content, lastModifiedDate: null };
                self.loadFromFile(aFile, openType, port, altPower, asExpansion);
                if (then) then(true);
            },
            function onAnyError(urls) {
                showError("URL reading error: " + urls[0].error);
                if (then) then(false);
            }
        ).start();
    };

    this.readFromFiles = function (files, openType, port, altPower, asExpansion, then) {
        var reader = new wmsx.MultiFileReader(files,
            function onSuccessAll(files) {
                self.loadFromFiles(files, openType, port, altPower, asExpansion);
                if (then) then(true);
            },
            function onFirstError(files, error, known) {
                if (!known) error += DIR_NOT_SUPPORTED_HINT;                  // Directories not supported
                showError("File reading error: " + error);
                if (then) then(false);
            }
        );
        reader.start();
    };

    this.loadFromContent = function(name, content, openType, port, altPower, asExpansion) {
        return this.loadFromFile({ name: name, content: content }, openType, port, altPower, asExpansion);
    };

    this.loadFromFile = function(file, openType, port, altPower, asExpansion) {
        var zip, mes;
        // If As-Disk forced
        if (openType === OPEN_TYPE.AUTO_AS_DISK || openType === OPEN_TYPE.FILES_AS_DISK || openType === OPEN_TYPE.ZIP_AS_DISK) {
            try {
                if (openType === OPEN_TYPE.FILES_AS_DISK) {
                    if (tryLoadFilesAsDisk([file], port, altPower, asExpansion)) return;     // throws
                } else {
                    zip = wmsx.Util.checkContentIsZIP(file.content);
                    if (zip) {
                        if (tryLoadZipAsDisk(file.name, zip, port, altPower, asExpansion)) return;     // throws
                    } else {
                        if (openType === OPEN_TYPE.ZIP_AS_DISK)
                            mes = "Not a ZIP file!";
                        else if (tryLoadFilesAsDisk([file], port, altPower, asExpansion)) return;     // throws
                    }
                }
            } catch(ex) {
                if (ex.wmsx) mes = ex.message;
            }
            showError("Error loading " + TYPE_DESC[openType] + (mes ?  ": " + mes : ""));
        } else {
            // As-Disk NOT forced
            zip = wmsx.Util.checkContentIsZIP(file.content);
            if (zip) {
                try {
                    // Try normal loading from files
                    var files = wmsx.Util.getZIPFilesSorted(zip);
                    if (tryLoadFilesAsMedia(files, openType, port, altPower, asExpansion, true)) return;
                    // Try Zip-as-Disk if allowed
                    if (openType === OPEN_TYPE.AUTO)
                        if (tryLoadZipAsDisk(file.name, zip, port, altPower, asExpansion)) return;     // throws
                } catch(ez) {
                    wmsx.Util.error(ez);      // Error decompressing files. Abort
                }
            } else {
                // Try normal loading from files
                if (tryLoadFilesAsMedia([file], openType, port, altPower, asExpansion, false)) return;
            }
            showError("No valid " + TYPE_DESC[openType] + " found.")
        }
    };

    this.loadFromFiles = function(files, openType, port, altPower, asExpansion) {
        // Sort files by name
        files = wmsx.Util.asNormalArray(files).slice(0);
        files.sort(function sortFiles(a, b) {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });

        // If As-Disk forced
        if (openType === OPEN_TYPE.AUTO_AS_DISK || openType === OPEN_TYPE.FILES_AS_DISK || openType === OPEN_TYPE.ZIP_AS_DISK) {
            var mes;
            try {
                if (tryLoadFilesAsDisk(files, port, altPower, asExpansion)) return;      // throws
            } catch(ex) {
                if (ex.wmsx) mes = ex.message;
            }
            showError("Error loading " + TYPE_DESC[openType] + (mes ?  ": " + mes : ""));
        } else {
            if (tryLoadFilesAsMedia(files, openType, port, altPower, asExpansion, false)) return;
            showError("No valid " + TYPE_DESC[openType] + " found.")
        }
    };

    this.loadFromContentAsSlot = function (name, content, slotPos, altPower) {
        var zip = wmsx.Util.checkContentIsZIP(content);
        if (zip) {
            try {
                var files = wmsx.Util.getZIPFilesSorted(zip);
                for (var i = 0; i < files.length; i++)
                    if (tyrLoadContentAsSingleSlot(name, files[i].asUint8Array(), slotPos, altPower)) return;
            } catch (ez) {
                // Error decompressing files. Abort
            }
        } else {
            if (tyrLoadContentAsSingleSlot(name, content, slotPos, altPower)) return;
        }
        showError("Unsupported ROM file!");
    };

    function tryLoadZipAsDisk(name, zip, port, altPower, asExpansion) {     // throws
        return diskDrive.loadAsDiskFromFiles(port, name, createTreeFromZip(zip), altPower, asExpansion, "ZIP as Disk");    // throws
    }

    function tryLoadFilesAsDisk (files, port, altPower, asExpansion) {     // throws
        var name = files.length !== 1 ? null : wmsx.Util.leafFilename(files[0].name);
        return diskDrive.loadAsDiskFromFiles(port, name, files, altPower, asExpansion, "Files as Disk");     // throws
    }

    function tryLoadFilesAsMedia(files, openType, port, altPower, asExpansion, filesFromZIP) {
        // Try as a Disk Stack (all images found)
        if (openType === OPEN_TYPE.DISK || openType === OPEN_TYPE.AUTO)
            if (diskDrive.loadDiskStackFromFiles(port, files, altPower, asExpansion, filesFromZIP)) return true;
        // Try as other Single media (first found)
        if (openType !== OPEN_TYPE.DISK)
            for (var i = 0; i < files.length; i++)
                if (tryLoadFileAsSingleMedia(files[i], openType, port, altPower, asExpansion, filesFromZIP)) return true;
        return false;
    }

    function tryLoadFileAsSingleMedia(file, openType, port, altPower, asExpansion, fileFromZIP, stopRecursion) {
        try {
            if (fileFromZIP && !file.content) file.content = file.asUint8Array();
            var content = file.content;

            if (!stopRecursion) {
                var zip = wmsx.Util.checkContentIsZIP(content);
                if (zip) {
                    var files = wmsx.Util.getZIPFilesSorted(zip);
                    for (var i = 0; i < files.length; i++)
                        if (tryLoadFileAsSingleMedia(files[i], openType, port, altPower, asExpansion, true, true)) return true;
                    return false;
                }
            }

            var gzip = wmsx.Util.checkContentIsGZIP(content);
            if (gzip) return tryLoadFileAsSingleMedia({ name: file.name, content: gzip }, openType, port, altPower, asExpansion, false, true);
        } catch (ez) {
            wmsx.Util.error(ez);      // Error decompressing files. Abort
            return false;
        }

        return tryLoadContentAsSingleMedia(file.name, content, openType, port, altPower, asExpansion);
    }

    function tryLoadContentAsSingleMedia(name, content, openType, port, altPower, asExpansion) {
        openType = openType || OPEN_TYPE.AUTO;
        // Try as Cassette file
        if (openType === OPEN_TYPE.TAPE || openType === OPEN_TYPE.AUTO)
            if (cassetteDeck.loadTapeFile(name, content, altPower)) return true;
        // Try as a SaveState file
        if (openType === OPEN_TYPE.STATE || openType === OPEN_TYPE.AUTO)
            if (saveStateSocket.loadStateFile(content)) return true;
        // Try as Cartridge Data (SRAM, etc)
        if (openType === OPEN_TYPE.CART_DATA || openType === OPEN_TYPE.AUTO)
            if (cartridgeSocket.loadCartridgeData(port, name, content)) return true;
        // Try to load as ROM (BIOS or Cartridge)
        if (openType === OPEN_TYPE.ROM || openType === OPEN_TYPE.AUTO) {
            var slot = wmsx.SlotCreator.createFromROM(new wmsx.ROM(name, content), cartridgeSocket.inserted(port));
            if (slot) {
                if (slot.format === wmsx.SlotFormats.BIOS) biosSocket.insert(slot, altPower);
                else if (asExpansion) expansionSocket.insert(slot, port, altPower);
                else cartridgeSocket.insert(slot, port, altPower);
                return true;
            }
        }
        // Not a valid content
        return false;
    }

    function tyrLoadContentAsSingleSlot(name, content, slotPos, altPower) {
        var slot = wmsx.SlotCreator.createFromROM(new wmsx.ROM(name, content));
        if (!slot) return false;
        slotSocket.insert(slot, slotPos, altPower);
        return true;
    }

    function createTreeFromZip(zip) {     // throws
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

    function onFileInputChange(e) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();
        e.target.focus();
        if (!this.files || this.files.length === 0) return;           // this will have a property "files"!

        var files = wmsx.Util.asNormalArray(this.files);

        // Tries to clear the last selected file so the same file can be chosen
        try {
            fileInputElement.value = "";
        } catch (ex) {
            // Ignore
        }

        var wasPaused = machine.systemPause(true);
        var resume = function (s) {
            if (!wasPaused) machine.systemPause(false);
        };

        if (files && files.length > 0) {
            if (files.length === 1)
                self.readFromFile(files[0], chooserOpenType, chooserPort, chooserAltPower, chooserAsExpansion, resume);
            else
                self.readFromFiles(files, chooserOpenType, chooserPort, chooserAltPower, chooserAsExpansion, resume);
        }

        return false;
    }

    function onDragOver(e) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer) {
            if (WMSX.MEDIA_CHANGE_DISABLED)
                e.dataTransfer.dropEffect = "none";
            else if (e.ctrlKey)
                e.dataTransfer.dropEffect = "copy";
            else if (e.altKey)
                e.dataTransfer.dropEffect = "link";
        }

        dragButtons = e.buttons > 0 ? e.buttons : MOUSE_BUT1_MASK;      // If buttons not supported, consider it a left-click
    }

    function onDrop(e) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();
        e.target.focus();

        if (WMSX.MEDIA_CHANGE_DISABLED) return;
        if (!e.dataTransfer) return;

        var wasPaused = machine.systemPause(true);

        var port = e.shiftKey ? 1 : 0;
        var altPower = dragButtons & MOUSE_BUT2_MASK;
        var asExpansion = e.ctrlKey;
        var asDisk = e.altKey;

        var openType = asDisk ? OPEN_TYPE.AUTO_AS_DISK : OPEN_TYPE.AUTO;

        // Try to get local file/files if present
        var files = e.dataTransfer && e.dataTransfer.files;
        var resume = function (s) {
            if (!wasPaused) machine.systemPause(false);
        };
        if (files && files.length > 0) {
            if (files.length === 1)
                self.readFromFile(files[0], openType, port, altPower, asExpansion, resume);
            else
                self.readFromFiles(files, openType, port, altPower, asExpansion, resume);
        } else {
            // If not, try to get URL
            var url = e.dataTransfer.getData("text");
            if (url && url.length > 0)
                self.readFromURL(url, null, port, altPower, asExpansion, resume);
            else
                resume();
        }
    }

    function showError(message) {
        wmsx.Util.message("Could not load file(s):\n\n" + message + "\n");
    }

    function createFileInputElement() {
        fileInputElement = document.createElement("input");
        fileInputElement.id = "wmsx-file-loader-input";
        fileInputElement.type = "file";
        fileInputElement.multiple = true;
        fileInputElement.accept = INPUT_ACCEPT.AUTO;
        fileInputElement.style.display = "none";
        fileInputElement.addEventListener("change", onFileInputChange);
        fileInputElementParent.appendChild(fileInputElement);
    }


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
    this.OPEN_TYPE = OPEN_TYPE;                         // For the programatic interface

    var INPUT_ACCEPT = {
        ROM:   ".bin,.BIN,.rom,.ROM,.bios,.BIOS,.zip,.ZIP,.gz,.GZ,.gzip,.GZIP",
        DISK:  ".bin,.BIN,.dsk,.DSK,.zip,.ZIP,.gz,.GZ,.gzip,.GZIP",
        TAPE:  ".bin..BIN,.cas,.CAS,.tape,.TAPE,.zip,.ZIP,.gz,.GZ,.gzip,.GZIP",
        STATE: ".wst,.WST",
        CART_DATA: ".pac,.PAC,.dat,.DAT,.sram,.SRAM",
        FILES_AS_DISK: "",
        ZIP_AS_DISK:   ".zip,.ZIP",
        AUTO_AS_DISK:  "",
        AUTO:   ".bin,.BIN,.dsk,.DSK,.rom,.ROM,.bios,.BIOS,.cas,.CAS,.tape,.TAPE,.wst,.WST,.zip,.ZIP,.gz,.GZ,.gzip,.GZIP"
    };

    var INPUT_MULTI = {
        ROM:   false,
        DISK:  true,
        TAPE:  false,
        STATE: false,
        CART_DATA: false,
        FILES_AS_DISK: true,
        ZIP_AS_DISK:   false,
        AUTO_AS_DISK:  true,
        AUTO:   false
    };

    var TYPE_DESC = {
        ROM:   "ROM",
        DISK:  "Disk",
        TAPE:  "Cassette",
        STATE: "Savestate",
        CART_DATA: "Cartridge Data",
        FILES_AS_DISK: "Files as Disk",
        ZIP_AS_DISK:   "ZIP as Disk",
        AUTO_AS_DISK:  "as Disk",
        AUTO:   "ROM, Cassette or Disk"
    };

    var LOCAL_STORAGE_LAST_URL_KEY = "wmsxlasturl";

    var DIR_NOT_SUPPORTED_HINT = '\n\nIMPORTANT: Directories are not supported for loading!\nPlease use "ZIP as Disk" loading for full directories support.';

    WMSX.fileLoader = this;

};

wmsx.FileLoader.OPEN_TYPE = {  AUTO: "AUTO", ROM: "ROM", DISK: "DISK", TAPE: "TAPE", STATE: "STATE", CART_DATA: "CART_DATA", FILES_AS_DISK: "FILES_AS_DISK", ZIP_AS_DISK: "ZIP_AS_DISK", AUTO_AS_DISK: "AUTO_AS_DISK" };