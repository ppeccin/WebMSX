// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskImages = function() {
"use strict";

    this.connect = function(pDiskDriveSocket) {
        diskDriveSocket = pDiskDriveSocket;
    };

    // Each file must have properties: "name", "content", "lastModifiedDate", "isDir" (in that case, also "files")
    this.createFromFiles = function (mediaType, items) {
        if (!this.MEDIA_TYPE_BOOT_SECTOR_DOS1[mediaType]) return null;               // MediaType not supported for creation

        var dpb = this.MEDIA_TYPE_DPB[mediaType];
        var bytesPerSector = (dpb[2] << 8) + dpb[1];
        var fatStartSector = (dpb[8] << 8) + dpb[7];
        var rootDirStartSector = (dpb[17] << 8) + dpb[16];
        var rootDirMaxEntries = dpb[10];
        var dataStartSector = (dpb[12] << 8) + dpb[11];
        var sectorsPerCluster = dpb[5] + 1;
        var totalDataClusters = ((dpb[14] << 8) + dpb[13]) - 1;
        var bytesPerCluster = sectorsPerCluster * bytesPerSector;
        var bytesPerDirEntry = 32;

        var image = this.createNewFormattedDisk(mediaType);
        var rootDirContentPosition = rootDirStartSector * bytesPerSector;
        var filesWritten = 0, filesNotWritten = 0;
        var freeCluster = 2;

        // Write root entries, including sub-directories recursively up to available space
        writeDir(0, 0, items);

        // If there were files that could not be written, AND no files could be written, error
        if (filesNotWritten > 0 && filesWritten === 0) {
            var err = new Error("No files could fit in a 720KB Disk!");
            err.wmsx = true;
            throw err;
        }

        // Finish image and return
        this.mirrorFatCopies(mediaType, image);
        return image;


        // Auxiliary functions

        function writeDir(parentDirCluster, thisDirCluster, items) {
            var isRoot = thisDirCluster === 0;
            var thisDirContentPosition = isRoot ? rootDirContentPosition : clusterContentPositon(thisDirCluster);
            var usedNames = new Set();

            // Position directories first, but prioritize files if space is not enough for all
            var availEntries = isRoot ? rootDirMaxEntries : items.length + 2;         // Is this the root dir? Include . and .. if not
            var files = items.filter(function (i) {
                return !i.isDir;
            });
            if (files.length > availEntries) files.length = availEntries;
            availEntries -= files.length;

            var subDirs = items.filter(function (i) {
                return i.isDir;
            });
            if (subDirs.length > availEntries) subDirs.length = availEntries;

            // Write . and .. entries
            if (!isRoot) {
                writeDirEntry(thisDirContentPosition, 0, thisDirCluster, { name: ".", isDir: true, specialName: true }, null);
                writeDirEntry(thisDirContentPosition, 1, parentDirCluster, { name: "..", isDir: true, specialName: true }, null);
            }

            // Write files up to available space
            writeFiles(thisDirContentPosition, subDirs.length + (isRoot ? 0 : 2), files, usedNames);

            // Write subDirs recursively up to available space
            writeSubDirs(thisDirCluster, isRoot ? 0 : 2, subDirs, usedNames);
        }

        function writeFiles(dirContentPosition, startingDirEntry, files, usedNames) {
            // Write each file until disk is full
            var dirEntry = startingDirEntry;
            for (var f = 0; f < files.length; ++f) {
                var file = files[f];
                var fileClusters = clustersTaken(file.content.length);

                // Check if file fits in the remaining space
                if (fileClusters > availClusters()) {
                    ++filesNotWritten;
                    continue;
                }

                writeDirEntry(dirContentPosition, dirEntry, freeCluster, file, usedNames);
                writeFatChain(freeCluster, fileClusters);
                writeContent(freeCluster, file.content);

                ++filesWritten;
                freeCluster += fileClusters;
                ++dirEntry;
            }
        }

        function writeSubDirs(thisDirCluster, startingDirEntry, subDirs, usedNames) {
            var isRoot = thisDirCluster === 0;
            var thisDirContentPosition = isRoot ? rootDirContentPosition : clusterContentPositon(thisDirCluster);

            // Write each subDir until disk is full
            var dirEntry = startingDirEntry;
            for (var d = 0; d < subDirs.length; ++d) {
                var subDir = subDirs[d];
                var subDirClusters = clustersTaken((subDir.items.length + 2) * bytesPerDirEntry);       // subDirs always have . and ..

                // Check if subDir fits in the remaining space
                if (subDirClusters > availClusters()) continue;

                var subDirCluster = freeCluster;
                subDir.content = wmsx.Util.arrayFill(new Array(subDirClusters * bytesPerCluster), 0);

                writeDirEntry(thisDirContentPosition, dirEntry, subDirCluster, subDir, usedNames);
                writeFatChain(subDirCluster, subDirClusters);
                writeContent(subDirCluster, subDir.content);      // Will just allocate space, all 0s

                freeCluster += subDirClusters;
                ++dirEntry;

                // Write items of this subdirectory, recursively
                writeDir(thisDirCluster, subDirCluster, subDir.items);
            }

            // Fill remaining not used (but reserved) entries for dirs with the "entry available" marker
            var rem = subDirs.length - (dirEntry - startingDirEntry);
            for (var i = 0; i < rem; ++i) writeAvailableDirEntry(thisDirContentPosition, dirEntry + i);
        }

        function writeDirEntry(dirContentPosition, entry, cluster, item, usedNames) {
            var entryPos = dirContentPosition + entry * bytesPerDirEntry;
            var pos;

            // File Name
            pos = entryPos;
            var name = fat12Filename(item, usedNames);
            for (var c = 0; c < 11; ++c) image[pos + c] = name.charCodeAt(c);

            // Attributes. "Archive" set
            var attrs = item.isDir ? 0x10 : 0x20;       // Set "Dir" or "Archive"
            image[pos + 0x0b] = attrs;

            // Attributes. "Archive" set
            pos = entryPos + 0x16;
            var d = item.lastModified ? new Date(item.lastModified) : item.lastModifiedDate;         // lastModifiedDate deprecated?
            var time = encodeTime(d);
            image[pos] = time & 255; image[pos + 1] = time >> 8;
            var date = encodeDate(d);
            image[pos + 2] = date & 255; image[pos + 3] = date >> 8;

            // Starting Cluster
            pos = entryPos + 0x1a;
            image[pos] = cluster & 255; image[pos + 1] = cluster >> 8;

            // File Size
            var size = item.isDir ? 0 : item.content.length;
            pos = entryPos + 0x1c;
            image[pos] = size & 255; image[pos + 1] = (size >> 8) & 255; image[pos + 2] = (size >> 16) & 255; image[pos + 3] = (size >> 24) & 255;
        }

        function writeAvailableDirEntry(dirContentPosition, entry) {
            image[dirContentPosition + entry * bytesPerDirEntry] = 0xE5;
        }

        function writeContent(cluster, content) {
            var pos = clusterContentPositon(cluster);
            for (var b = 0, len = content.length; b < len; ++b) image[pos + b] = content[b];
        }

        function writeFatChain(cluster, quant) {
            while (--quant > 0)
                writeFatEntry(cluster, ++cluster);

            writeFatEntry(cluster, 0xfff);              // Enf of chain
        }

        function writeFatEntry(entry, value) {
            var pos = fatStartSector * bytesPerSector + (entry >> 1) * 3;             // Each 2 entries take 3 bytes
            if (entry & 1) {
                // odd entry
                image[pos + 1] = (image[pos + 1] & 0x0f) | ((value & 0x0f) << 4);
                image[pos + 2] = (value & 0xff0) >> 4;
            } else {
                // even entry
                image[pos] = value & 255;
                image[pos + 1] = (image[pos + 1] & 0xf0) | ((value & 0xf00) >> 8);
            }
        }

        function fat12Filename(item, usedNames) {
            if (item.specialName) return (item.name + "           ").substr(0, 11);

            var finalName;

            var name = sanitizeName(wmsx.Util.leafFilenameNoExtension(item.name));
            var ext = sanitizeName(wmsx.Util.leafFilenameOnlyExtension(item.name));
            ext = (ext + "   ").substr(0,3);

            finalName = (name + "        ").substr(0,8) + ext;
            if (name.length > 8 || usedNames.has(finalName)) {
                var index = 0, suffix;
                do {
                    ++index;
                    suffix = "~" + index;
                    finalName = (name.substr(0, 8 - suffix.length) + suffix + "        ").substr(0, 8) + ext;
                } while (usedNames.has(finalName));
            }

            usedNames.add(finalName);
            return finalName;
        }

        function clustersTaken(size) {
            return Math.ceil(size / bytesPerCluster);
        }

        function availClusters() {
            var free = totalDataClusters - (freeCluster - 2);
            return free > 0 ? free : 0;
        }

        function clusterContentPositon(cluster) {
            return dataStartSector * bytesPerSector + (cluster - 2) * bytesPerCluster;
        }

        function sanitizeName(name) {
            return name.toUpperCase().replace(/[^a-z0-9!#$%&'\(\)\-@\^_`{}~]/gi, '_');
        }

        function encodeTime(date) {
            return date ? (date.getHours() << 11) | (date.getMinutes() << 5) + date.getSeconds() / 2 : 0
        }

        function encodeDate(date) {
            return date ? (((date.getFullYear() - 1980) & 127) << 9) | ((date.getMonth() + 1) << 5) + date.getDate() : 0;
        }

    };

    this.createNewBlankDisk = function (mediaType) {
        return wmsx.Util.arrayFill(new Array(this.MEDIA_TYPE_INFO[mediaType].size), 0);
    };

    this.createNewFormattedDisk = function (mediaType) {
        var content = this.createNewBlankDisk(mediaType);
        this.formatDisk(mediaType, content);
        return content;
    };

    this.formatDisk = function (mediaType, content) {
        // Write Boot Sector
        var bootSector = diskDriveSocket.isDOS2() ? this.MEDIA_TYPE_BOOT_SECTOR_DOS2[mediaType] : this.MEDIA_TYPE_BOOT_SECTOR_DOS1[mediaType];
        for (var b = 0; b < bootSector.length; ++b) content[b] = bootSector[b];

        // Initialize FATs
        var fatStart = this.BYTES_PER_SECTOR;
        content[fatStart] = mediaType; content[fatStart + 1] = 0xff; content[fatStart + 2] = 0xff;
        this.mirrorFatCopies(mediaType, content);

        // Initialize data area
        var dpb = this.MEDIA_TYPE_DPB[mediaType];
        var bytesPerSector = (dpb[2] << 8) + dpb[1];
        var dataStartSector = (dpb[12] << 8) + dpb[11];
        for (b = dataStartSector * bytesPerSector; b < content.length; ++b) content[b] = 0xff
    };

    this.mirrorFatCopies = function(mediaType, content) {
        var dpb = this.MEDIA_TYPE_DPB[mediaType];
        var numFats = dpb[9];
        var bytesPerSector = (dpb[2] << 8) + dpb[1];
        var fatStartSector = (dpb[8] << 8) + dpb[7];
        var sectorsPerFat = dpb[15];
        var bytesPerFat = sectorsPerFat * bytesPerSector;

        var dest = fatStartSector * bytesPerSector + bytesPerFat;     // start at second fat
        for (var f = 2; f <= numFats; ++f) {
            var src = fatStartSector * bytesPerSector;
            for (var b = 0; b < bytesPerFat; ++b) content[dest++] = content[src++];
        }
    };

    var diskDriveSocket;

    this.BYTES_PER_SECTOR = 512;

    this.FORMAT_OPTIONS_MEDIA_TYPES = [0xF9, 0xF8];

    this.MEDIA_TYPE_INFO = {
        0xF8: { desc: "360KB", size: 368640 },
        0xF9: { desc: "720KB", size: 737280 },
        0xFA: { desc: "320KB", size: 327680 },
        0xFB: { desc: "640KB", size: 655360 },
        0xFC: { desc: "180KB", size: 184320 },
        0xFD: { desc: "360KB", size: 368640 },
        0xFE: { desc: "160KB", size: 163840 },
        0xFF: { desc: "320KB", size: 327680 }
    };

    // IMPORTANT: In reverse order of size
    this.MEDIA_TYPE_VALID_SIZES = [ 737280, 655360, 368640, 327680, 184320, 163840, 102400 ];

    this.MEDIA_TYPE_BOOT_SECTOR_DOS1 = {
        0xF9: [
            0xEB, 0xFE, 0x90, 0x57, 0x4D, 0x53, 0x58, 0x20, 0x20, 0x20, 0x20, 0x00, 0x02, 0x02, 0x01, 0x00,
            0x02, 0x70, 0x00, 0xA0, 0x05, 0xF9, 0x03, 0x00, 0x09, 0x00, 0x02, 0x00, 0x00, 0x00, 0xD0, 0xED,
            0x53, 0x59, 0xC0, 0x32, 0xD0, 0xC0, 0x36, 0x56, 0x23, 0x36, 0xC0, 0x31, 0x1F, 0xF5, 0x11, 0xAB,
            0xC0, 0x0E, 0x0F, 0xCD, 0x7D, 0xF3, 0x3C, 0xCA, 0x63, 0xC0, 0x11, 0x00, 0x01, 0x0E, 0x1A, 0xCD,
            0x7D, 0xF3, 0x21, 0x01, 0x00, 0x22, 0xB9, 0xC0, 0x21, 0x00, 0x3F, 0x11, 0xAB, 0xC0, 0x0E, 0x27,
            0xCD, 0x7D, 0xF3, 0xC3, 0x00, 0x01, 0x58, 0xC0, 0xCD, 0x00, 0x00, 0x79, 0xE6, 0xFE, 0xFE, 0x02,
            0xC2, 0x6A, 0xC0, 0x3A, 0xD0, 0xC0, 0xA7, 0xCA, 0x22, 0x40, 0x11, 0x85, 0xC0, 0xCD, 0x77, 0xC0,
            0x0E, 0x07, 0xCD, 0x7D, 0xF3, 0x18, 0xB4, 0x1A, 0xB7, 0xC8, 0xD5, 0x5F, 0x0E, 0x06, 0xCD, 0x7D,
            0xF3, 0xD1, 0x13, 0x18, 0xF2, 0x42, 0x6F, 0x6F, 0x74, 0x20, 0x65, 0x72, 0x72, 0x6F, 0x72, 0x0D,
            0x0A, 0x50, 0x72, 0x65, 0x73, 0x73, 0x20, 0x61, 0x6E, 0x79, 0x20, 0x6B, 0x65, 0x79, 0x20, 0x66,
            0x6F, 0x72, 0x20, 0x72, 0x65, 0x74, 0x72, 0x79, 0x0D, 0x0A, 0x00, 0x00, 0x4D, 0x53, 0x58, 0x44,
            0x4F, 0x53, 0x20, 0x20, 0x53, 0x59, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ],
        0xF8: [
            0xEB, 0xFE, 0x90, 0x57, 0x4D, 0x53, 0x58, 0x20, 0x20, 0x20, 0x20, 0x00, 0x02, 0x02, 0x01, 0x00,
            0x02, 0x70, 0x00, 0xD0, 0x02, 0xF8, 0x02, 0x00, 0x09, 0x00, 0x01, 0x00, 0x00, 0x00, 0xD0, 0xED,
            0x53, 0x59, 0xC0, 0x32, 0xD0, 0xC0, 0x36, 0x56, 0x23, 0x36, 0xC0, 0x31, 0x1F, 0xF5, 0x11, 0xAB,
            0xC0, 0x0E, 0x0F, 0xCD, 0x7D, 0xF3, 0x3C, 0xCA, 0x63, 0xC0, 0x11, 0x00, 0x01, 0x0E, 0x1A, 0xCD,
            0x7D, 0xF3, 0x21, 0x01, 0x00, 0x22, 0xB9, 0xC0, 0x21, 0x00, 0x3F, 0x11, 0xAB, 0xC0, 0x0E, 0x27,
            0xCD, 0x7D, 0xF3, 0xC3, 0x00, 0x01, 0x58, 0xC0, 0xCD, 0x00, 0x00, 0x79, 0xE6, 0xFE, 0xFE, 0x02,
            0xC2, 0x6A, 0xC0, 0x3A, 0xD0, 0xC0, 0xA7, 0xCA, 0x22, 0x40, 0x11, 0x85, 0xC0, 0xCD, 0x77, 0xC0,
            0x0E, 0x07, 0xCD, 0x7D, 0xF3, 0x18, 0xB4, 0x1A, 0xB7, 0xC8, 0xD5, 0x5F, 0x0E, 0x06, 0xCD, 0x7D,
            0xF3, 0xD1, 0x13, 0x18, 0xF2, 0x42, 0x6F, 0x6F, 0x74, 0x20, 0x65, 0x72, 0x72, 0x6F, 0x72, 0x0D,
            0x0A, 0x50, 0x72, 0x65, 0x73, 0x73, 0x20, 0x61, 0x6E, 0x79, 0x20, 0x6B, 0x65, 0x79, 0x20, 0x66,
            0x6F, 0x72, 0x20, 0x72, 0x65, 0x74, 0x72, 0x79, 0x0D, 0x0A, 0x00, 0x00, 0x4D, 0x53, 0x58, 0x44,
            0x4F, 0x53, 0x20, 0x20, 0x53, 0x59, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]
    };

    this.MEDIA_TYPE_BOOT_SECTOR_DOS2 = {
        0xF9: [
            0xEB, 0xFE, 0x90, 0x57, 0x4D, 0x53, 0x58, 0x20, 0x20, 0x20, 0x20, 0x00, 0x02, 0x02, 0x01, 0x00,
            0x02, 0x70, 0x00, 0xA0, 0x05, 0xF9, 0x03, 0x00, 0x09, 0x00, 0x02, 0x00, 0x00, 0x00, 0x18, 0x10,
            0x56, 0x4F, 0x4C, 0x5F, 0x49, 0x44, 0x00, 0x40, 0x7C, 0x03, 0x39, 0x00, 0x00, 0x00, 0x00, 0x00,
            0xD0, 0xED, 0x53, 0x6A, 0xC0, 0x32, 0x72, 0xC0, 0x36, 0x67, 0x23, 0x36, 0xC0, 0x31, 0x1F, 0xF5,
            0x11, 0xAB, 0xC0, 0x0E, 0x0F, 0xCD, 0x7D, 0xF3, 0x3C, 0x28, 0x26, 0x11, 0x00, 0x01, 0x0E, 0x1A,
            0xCD, 0x7D, 0xF3, 0x21, 0x01, 0x00, 0x22, 0xB9, 0xC0, 0x21, 0x00, 0x3F, 0x11, 0xAB, 0xC0, 0x0E,
            0x27, 0xCD, 0x7D, 0xF3, 0xC3, 0x00, 0x01, 0x69, 0xC0, 0xCD, 0x00, 0x00, 0x79, 0xE6, 0xFE, 0xD6,
            0x02, 0xF6, 0x00, 0xCA, 0x22, 0x40, 0x11, 0x85, 0xC0, 0x0E, 0x09, 0xCD, 0x7D, 0xF3, 0x0E, 0x07,
            0xCD, 0x7D, 0xF3, 0x18, 0xB8, 0x42, 0x6F, 0x6F, 0x74, 0x20, 0x65, 0x72, 0x72, 0x6F, 0x72, 0x0D,
            0x0A, 0x50, 0x72, 0x65, 0x73, 0x73, 0x20, 0x61, 0x6E, 0x79, 0x20, 0x6B, 0x65, 0x79, 0x20, 0x66,
            0x6F, 0x72, 0x20, 0x72, 0x65, 0x74, 0x72, 0x79, 0x0D, 0x0A, 0x24, 0x00, 0x4D, 0x53, 0x58, 0x44,
            0x4F, 0x53, 0x20, 0x20, 0x53, 0x59, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ],
        0xF8: [
            0xEB, 0xFE, 0x90, 0x57, 0x4D, 0x53, 0x58, 0x20, 0x20, 0x20, 0x20, 0x00, 0x02, 0x02, 0x01, 0x00,
            0x02, 0x70, 0x00, 0xD0, 0x02, 0xF8, 0x02, 0x00, 0x09, 0x00, 0x01, 0x00, 0x00, 0x00, 0x18, 0x10,
            0x56, 0x4F, 0x4C, 0x5F, 0x49, 0x44, 0x01, 0x99, 0xDC, 0x1C, 0xF5, 0x00, 0x00, 0x00, 0x00, 0x00,
            0xD0, 0xED, 0x53, 0x6A, 0xC0, 0x32, 0x72, 0xC0, 0x36, 0x67, 0x23, 0x36, 0xC0, 0x31, 0x1F, 0xF5,
            0x11, 0xAB, 0xC0, 0x0E, 0x0F, 0xCD, 0x7D, 0xF3, 0x3C, 0x28, 0x26, 0x11, 0x00, 0x01, 0x0E, 0x1A,
            0xCD, 0x7D, 0xF3, 0x21, 0x01, 0x00, 0x22, 0xB9, 0xC0, 0x21, 0x00, 0x3F, 0x11, 0xAB, 0xC0, 0x0E,
            0x27, 0xCD, 0x7D, 0xF3, 0xC3, 0x00, 0x01, 0x69, 0xC0, 0xCD, 0x00, 0x00, 0x79, 0xE6, 0xFE, 0xD6,
            0x02, 0xF6, 0x00, 0xCA, 0x22, 0x40, 0x11, 0x85, 0xC0, 0x0E, 0x09, 0xCD, 0x7D, 0xF3, 0x0E, 0x07,
            0xCD, 0x7D, 0xF3, 0x18, 0xB8, 0x42, 0x6F, 0x6F, 0x74, 0x20, 0x65, 0x72, 0x72, 0x6F, 0x72, 0x0D,
            0x0A, 0x50, 0x72, 0x65, 0x73, 0x73, 0x20, 0x61, 0x6E, 0x79, 0x20, 0x6B, 0x65, 0x79, 0x20, 0x66,
            0x6F, 0x72, 0x20, 0x72, 0x65, 0x74, 0x72, 0x79, 0x0D, 0x0A, 0x24, 0x00, 0x4D, 0x53, 0x58, 0x44,
            0x4F, 0x53, 0x20, 0x20, 0x53, 0x59, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]
    };

    this.MEDIA_TYPE_DPB = {
        // Media F8; 80 Tracks; 9 sectors; 1 side; 3.5" 360 Kb
        0xF8: [0xF8, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0c, 0x00, 0x63, 0x01, 0x02, 0x05, 0x00],
        // Media F9; 80 Tracks; 9 sectors; 2 sides; 3.5" 720 Kb
        0xF9: [0xF9, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0e, 0x00, 0xca, 0x02, 0x03, 0x07, 0x00],
        // Media FA; 80 Tracks; 8 sectors; 1 side; 3.5" 320 Kb
        0xFA: [0xFA, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0a, 0x00, 0x3c, 0x01, 0x01, 0x03, 0x00],
        // Media FB; 80 Tracks; 8 sectors; 2 sides; 3.5" 640 Kb
        0xFB: [0xFB, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0c, 0x00, 0x7b, 0x02, 0x02, 0x05, 0x00],
        // Media FC; 40 Tracks; 9 sectors; 1 side; 5.25" 180 Kb
        0xFC: [0xFC, 0x00, 0x02, 0x0F, 0x04, 0x00, 0x01, 0x01, 0x00, 0x02, 0x40, 0x09, 0x00, 0x60, 0x01, 0x02, 0x05, 0x00],
        // Media FD; 40 Tracks; 9 sectors; 2 sides; 5.25" 360 Kb
        0xFD: [0xFD, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0c, 0x00, 0x63, 0x01, 0x02, 0x05, 0x00],
        // Media FE; 40 Tracks; 8 sectors; 1 side; 5.25" 160 Kb
        0xFE: [0xFE, 0x00, 0x02, 0x0F, 0x04, 0x00, 0x01, 0x01, 0x00, 0x02, 0x40, 0x07, 0x00, 0x3a, 0x01, 0x01, 0x03, 0x00],
        // Media FF; 40 Tracks; 8 sectors; 2 sides; 5.25" 320 Kb
        0xFF: [0xFF, 0x00, 0x02, 0x0F, 0x04, 0x01, 0x02, 0x01, 0x00, 0x02, 0x70, 0x0a, 0x00, 0x3c, 0x01, 0x01, 0x03, 0x00]
    };

};