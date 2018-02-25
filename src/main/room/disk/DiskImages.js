// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskImages = function() {
"use strict";

    this.connect = function(pDiskDriveSocket) {
        diskDriveSocket = pDiskDriveSocket;
    };

    // Image must be formatted with FAT12/16 and empty
    // Each file must have properties: "name", "content", "lastModifiedDate", "isDir" (in that case, also "files")
    this.writeFilesToImage = function (image, rootDirItems) {

        // Check for partitioned disk (MBR signature, first Primary Partition starts at sector 1)
        var mbrSig = image[0x01fe] | (image[0x01ff] << 8);
        var partType = image[0x01c2];
        var partStartSector = image[0x01c6] | (image[0x01c7] << 8) | (image[0x01c8] << 16) | (image[0x01c9] << 24) ;

        var bpb = 0;
        if (mbrSig === 0xaa55 && partStartSector === 1) bpb = this.BYTES_PER_SECTOR;

         // Get data from BPB

        var bytesPerSector =    image[bpb + 0x0b] | (image[bpb + 0x0c] << 8);
        var sectorsPerCluster = image[bpb + 0x0d];
        var reservedSectors =   image[bpb + 0x0e] | (image[bpb + 0x0f] << 8);
        var numberOfFATs =      image[bpb + 0x10];
        var rootDirMaxEntries = image[bpb + 0x11] | (image[bpb + 0x12] << 8);
        var totalSecSmall =     image[bpb + 0x13] | (image[bpb + 0x14] << 8);
        var mediaDescriptor =   image[bpb + 0x15];
        var sectorsPerFAT =     image[bpb + 0x16] | (image[bpb + 0x17] << 8);
        var totalSecLarge =     image[bpb + 0x20] | (image[bpb + 0x21] << 8) | (image[bpb + 0x22] << 16) | (image[bpb + 0x23] << 24);
        var totalSectors = totalSecSmall || totalSecLarge;

        var bytesPerDirEntry = 32;
        var fatStartSector = partStartSector + reservedSectors;
        var rootDirStartSector = fatStartSector + (numberOfFATs * sectorsPerFAT);
        var dataStartSector = rootDirStartSector + (bytesPerDirEntry * rootDirMaxEntries) / bytesPerSector;
        var bytesPerCluster = sectorsPerCluster * bytesPerSector;
        var totalDataClusters = ((totalSectors - (dataStartSector - partStartSector)) / sectorsPerCluster) | 0;
        var totalDataBytes = totalDataClusters * sectorsPerCluster * bytesPerSector;
        var mediaDescriptorFAT = image[fatStartSector * bytesPerSector];

        var fatDepthSig = String.fromCharCode(image[bpb + 0x36], image[bpb + 0x37], image[bpb + 0x38], image[bpb + 0x39], image[bpb + 0x3a], image[bpb + 0x3b], image[bpb + 0x3c], image[bpb + 0x3d]);
        var fat16 = fatDepthSig === "FAT16   " ? true : fatDepthSig === "FAT12   " ? false : totalDataClusters >= 0xff0;

        console.log("bpb", bpb, "fatDepthSig", fatDepthSig, "fat16", fat16, "mediaDescriptor", mediaDescriptor, "mediaDescriptorFAT", mediaDescriptorFAT, "bytesPerSector", bytesPerSector, "fatStartSector", fatStartSector, "rootDirStartSector", rootDirStartSector, "rootDirMaxEntries", rootDirMaxEntries, "dataStartSector", dataStartSector, "sectorsPerCluster", sectorsPerCluster, "sectorsPerFAT", sectorsPerFAT, "totalDataClusters", totalDataClusters, "bytesPerCluster", bytesPerCluster, "totalDataBytes", totalDataBytes);

        // Valid BPB and FAT partition? (MediaType is ok, totalDataClusters >= 64)
        if (!(mediaDescriptor === mediaDescriptorFAT && (mediaDescriptor === 0xf0 || mediaDescriptor >= 0xf8) && totalDataClusters >= 64)) {
            // Try pre-determined DPB geometry for floppy formats (MediaType from FAT)
            var preMediaTypeInfo = this.MEDIA_TYPE_INFO[mediaDescriptorFAT];
            if (preMediaTypeInfo && preMediaTypeInfo.size === image.length) {
                var dpb = this.MEDIA_TYPE_DPB[mediaDescriptorFAT];
                bytesPerSector = (dpb[2] << 8) + dpb[1];
                sectorsPerCluster = dpb[5] + 1;
                fatStartSector = (dpb[8] << 8) + dpb[7];
                numberOfFATs = dpb[9];
                rootDirMaxEntries = dpb[10];
                dataStartSector = (dpb[12] << 8) + dpb[11];
                totalDataClusters = ((dpb[14] << 8) + dpb[13]) - 1;
                sectorsPerFAT = dpb[15];
                rootDirStartSector = (dpb[17] << 8) + dpb[16];
                bytesPerCluster = sectorsPerCluster * bytesPerSector;
                fat16 = false;
            } else {
                var err = new Error("Could not write files: Disk format or partition not recognized");
                err.wmsx = true;
                throw err;
            }
        }


        // Begin process

        var rootDirContentPosition = rootDirStartSector * bytesPerSector;
        var filesWritten = 0, filesNotWritten = 0;

        var info = getFreeClustersInfo();
        var remainFreeClusters = info.quant;
        var nextFreeCluster = info.first;

        if (remainFreeClusters > 0) {
            // Write root entries, including sub-directories recursively up to available space
            writeRootDir(rootDirItems);
        }

        // If there were files that could not be written, AND no files could be written, error
        if (filesNotWritten > 0 && filesWritten === 0) {
            err = new Error("No files could fit in available disk space");
            err.wmsx = true;
            throw err;
        }

        // Finish image and return
        this.mirrorFatCopies(numberOfFATs, fatStartSector, sectorsPerFAT, bytesPerSector, image);
        return true;


        // Auxiliary functions

        function writeRootDir(rootDirItems) {
            var rootDir = {
                name: "ROOT",
                isDir: true,
                items: rootDirItems,
                content: image.slice(rootDirContentPosition, rootDirContentPosition + rootDirMaxEntries * bytesPerDirEntry),
                nextFreeEntry: 0,
                clusterChain: [0],   // Dummy
                usedNames: new Set()
            };

            // Position directories first, but prioritize files if space is not enough for all
            var availEntries = rootDirMaxEntries;
            var files = rootDir.items.filter(function (i) {
                return !i.isDir;
            });
            if (files.length > availEntries) files.length = availEntries;
            availEntries -= files.length;

            var subDirs = rootDir.items.filter(function (i) {
                return i.isDir;
            });
            if (subDirs.length > availEntries) subDirs.length = availEntries;

            // Write files up to available space
            rootDir.nextFreeEntry = subDirs.length;
            writeFileItems(rootDir, files);

            // Write subDirs recursively up to available space
            rootDir.nextFreeEntry = 0;
            writeSubDirItems(rootDir, subDirs);
        }

        function writeSubDir(dir) {
            // Position directories first, but prioritize files if space is not enough for all
            var availEntries = dir.items.length + 2;         // +2 for . and ..
            var files = dir.items.filter(function (i) {
                return !i.isDir;
            });
            if (files.length > availEntries) files.length = availEntries;
            availEntries -= files.length;

            var subDirs = dir.items.filter(function (i) {
                return i.isDir;
            });
            if (subDirs.length > availEntries) subDirs.length = availEntries;

            // Write . and .. entries
            writeDirEntry(dir, { name: ".",  specialName: true, isDir: true, clusterChain: dir.parentDir.clusterChain });
            writeDirEntry(dir, { name: "..", specialName: true, isDir: true, clusterChain: dir.clusterChain });

            // Write files up to available space
            dir.nextFreeEntry = 2 + subDirs.length;
            writeFileItems(dir, files);

            // Write subDirs recursively up to available space
            dir.nextFreeEntry = 2;
            var subDirsWritten = writeSubDirItems(dir, subDirs);

            // Fill remaining not used (but reserved) entries for dirs with the "entry available" marker
            var rem = subDirs.length - subDirsWritten;
            if (rem > 0) {
                dir.nextFreeEntry = 2 + subDirsWritten;
                for (var i = 0; i < rem; ++i) writeAvailableDirEntry(dir);
            }
        }

        // parentDir = Array of items
        function writeSubDirItems(ownerDir, subDirs) {
            // Write each subDir until disk is full
            var itemsWritten = 0;
            for (var d = 0; d < subDirs.length; ++d) {
                var subDir = subDirs[d];

                var subDirClusters = clustersTaken((subDir.items.length + 2) * bytesPerDirEntry);       // +2 for . and ..

                // Check if subDir fits in the remaining space
                if (subDirClusters > availClusters()) continue;

                subDir.content = wmsx.Util.arrayFill(new Array(subDirClusters * bytesPerCluster), 0);
                subDir.parentDir = ownerDir;
                subDir.usedNames = new Set();
                subDir.nextFreeEntry = 0;
                // set clusterChain

                writeDirEntry(ownerDir, subDir);
                writeFatChain(subDirCluster, subDirClusters);
                writeContent(subDirCluster, subDir.content);      // Will just allocate space, all 0s

                nextFreeCluster += subDirClusters;

                // Write items of this subdirectory, recursively
                writeSubDir(subDir);

                ++itemsWritten;
            }
            return itemsWritten;
        }

        function writeFileItems(ownerDir, files) {
            // Write each file until disk is full
            for (var f = 0; f < files.length; ++f) {
                var file = files[f];
                var fileClusters = clustersTaken(file.content.length);

                // Check if file fits in the remaining space
                if (fileClusters > availClusters()) {
                    ++filesNotWritten;
                    continue;
                }

                // set clusterChain
                writeDirEntry(ownerDir, file);
                writeFatChain(nextFreeCluster, fileClusters);
                writeContent(nextFreeCluster, file.content);

                ++filesWritten;
                nextFreeCluster += fileClusters;
            }
        }

        function writeDirEntry(dir, item) {
            var dirContent = dir.content;
            var entryPos = dir.nextFreeEntry * bytesPerDirEntry;
            // File Name
            var name = fat12Filename(item, dir.usedNames);
            for (var c = 0; c < 11; ++c) dirContent[entryPos + c] = name.charCodeAt(c);

            // Attributes. "Archive" set
            var attrs = item.isDir ? 0x10 : 0x20;       // Set "Dir" or "Archive"
            dirContent[entryPos + 0x0b] = attrs;

            // Attributes. "Archive" set
            entryPos = entryPos + 0x16;
            var d = item.lastModified ? new Date(item.lastModified) : item.lastModifiedDate;         // lastModifiedDate deprecated?
            var time = encodeTime(d);
            dirContent[entryPos] = time & 255; dirContent[entryPos + 1] = time >> 8;
            var date = encodeDate(d);
            dirContent[entryPos + 2] = date & 255; dirContent[entryPos + 3] = date >> 8;

            // Starting Cluster
            entryPos = entryPos + 0x1a;
            dirContent[entryPos] = item.clusterChain[0] & 255; dirContent[entryPos + 1] = item.clusterChain[0] >> 8;

            // File Size
            var size = item.isDir ? 0 : item.content.length;
            entryPos = entryPos + 0x1c;
            dirContent[entryPos] = size & 255; dirContent[entryPos + 1] = (size >> 8) & 255; dirContent[entryPos + 2] = (size >> 16) & 255; dirContent[entryPos + 3] = (size >> 24) & 255;

            ++dir.nextFreeEntry;
        }

        function writeAvailableDirEntry(dirContentPosition) {
            dir.content[dir.nextFreeEntry * bytesPerDirEntry] = 0xE5;
            ++dir.nextFreeEntry;
        }

        function writeContent(cluster, content) {
            var pos = clusterContentPositon(cluster);
            for (var b = 0, len = content.length; b < len; ++b) image[pos + b] = content[b];
        }

        function writeFatChain(cluster, quant) {
            while (--quant > 0)
                writeFatEntry(cluster, ++cluster);

            writeFatEntry(cluster, 0xffff);              // Enf of chain
        }

        function writeFatEntry(entry, value) {
            var pos;
            if (fat16) {
                pos = fatStartSector * bytesPerSector + (entry << 1);                 // Each entry takes 2 bytes
                image[pos] = value & 255;
                image[pos + 1] = (value & 0xff00) >> 8;
            } else {
                pos = fatStartSector * bytesPerSector + (entry >> 1) * 3;             // Each 2 entries take 3 bytes
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
        }

        function readFatEntry(entry) {
            var pos;
            if (fat16) {
                pos = fatStartSector * bytesPerSector + (entry << 1);                 // Each entry takes 2 bytes
                return image[pos] | (image[pos + 1] << 8)
            } else {
                pos = fatStartSector * bytesPerSector + (entry >> 1) * 3;             // Each 2 entries take 3 bytes
                if (entry & 1)
                    // odd entry
                    return (image[pos + 1] >> 4) | (image[pos + 2] << 4);
                else
                    // even entry
                    return image[pos] | ((image[pos + 1] & 0x0f) << 8);
            }
        }

        function getFreeClustersInfo() {
            var maxCluster = totalDataClusters + 2 - 1;
            var firstFreeCluster = -1;
            var quantFreeCluesters = 0;
            for (var c = 2; c <= maxCluster; ++c) {
                var val = readFatEntry(c);
                if (val === 0) {
                    ++quantFreeCluesters;
                    if (firstFreeCluster < 0) firstFreeCluster = c;
                }
            }
            return { first: firstFreeCluster, quant: quantFreeCluesters, max: maxCluster };
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
            var free = totalDataClusters - (nextFreeCluster - 2);
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

        var bytesPerSector = bootSector[0x0b] | (bootSector[0x0c] << 8);
        var numberOfFATs = bootSector[0x10];
        var sectorsPerFAT = bootSector[0x16] | (bootSector[0x17] << 8);
        var fatStartSector = bootSector[0x0e] | (bootSector[0x0f] << 8);
        var fatStart = fatStartSector * bytesPerSector;

        // Initialize FATs
        content[fatStart] = mediaType; content[fatStart + 1] = 0xff; content[fatStart + 2] = 0xff;
        this.mirrorFatCopies(numberOfFATs, fatStartSector, sectorsPerFAT, bytesPerSector, content);

        // Initialize data area
        var bytesPerDirEntry = 32;
        var rootDirStartSector = fatStartSector + (numberOfFATs * sectorsPerFAT);
        var rootDirMaxEntries = bootSector[0x11] | (bootSector[0x12] << 8);
        var dataStartSector = rootDirStartSector + (bytesPerDirEntry * rootDirMaxEntries) / bytesPerSector;
        for (b = dataStartSector * bytesPerSector; b < content.length; ++b) content[b] = 0xff
    };

    this.mirrorFatCopies = function(numberOfFats, fatStartSector, sectorsPerFat, bytesPerSector, content) {
        var bytesPerFat = sectorsPerFat * bytesPerSector;
        var dest = fatStartSector * bytesPerSector + bytesPerFat;     // start at second fat
        for (var f = 2; f <= numberOfFats; ++f) {
            var src = fatStartSector * bytesPerSector;
            for (var b = 0; b < bytesPerFat; ++b) content[dest++] = content[src++];
        }
    };


    var diskDriveSocket;


    this.BYTES_PER_SECTOR = 512;

    this.FORMAT_OPTIONS_MEDIA_TYPES = [0xF9, 0xF8];

    // IMPORTANT: In reverse order of size
    this.MEDIA_TYPE_VALID_SIZES = [ 737280, 655360, 368640, 327680, 184320, 163840 ];      // All supported floppy formats

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
