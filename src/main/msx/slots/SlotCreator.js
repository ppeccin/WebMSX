// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotCreator = function () {
"use strict";

    this.createFromROM = function (rom, insertedCartridge) {
        // Try to build the Slot if a supported format is found
        var options = getFormatOptions(rom, insertedCartridge);
        if (options.length === 0) return;

        // Choose the best option
        var bestOption = options[0];
        var silent = wmsx.EmbeddedFiles.isEmbeddedURL(rom.source);
        if (!silent) wmsx.Util.log("Format selected: " + bestOption.desc + ", priority: " + bestOption.prioritySelected);
        return bestOption.createFromROM(rom);
    };

    this.recreateFromSaveState = function (saveState, previousSlot) {
        var format = wmsx.SlotFormats[saveState.f];
        if (!format) throw new Error("Unsupported ROM Format in Savestate: " + saveState.f);
        if (previousSlot && previousSlot.format !== format) previousSlot = null;       // Only possible to reuse previousSlot if the format is the same
        return format.recreateFromSaveState(saveState, previousSlot);
    };

    this.produceInfo = function(rom, formatHint) {
        // Preserve original length as MD5 computation may increase it
        var origLen = rom.content.length;

        // Don't compute hash for too big contents. Will rely on hints only
        var hash = rom.content.length > MAX_HASH_CONTENT_SIZE
            ? "0000000000000000000000000000000000000000"
            : wmsx.Util.sha1Generator.calcSHA1FromByteArray(rom.content).toUpperCase();
        if (rom.content.length > origLen) rom.content.length = origLen;

        // Get info from the library
        var info = wmsx.ROMDatabase[hash];
        var silent = wmsx.EmbeddedFiles.isEmbeddedURL(rom.source);
        if (info) {
            info = cloneInfo(info);
            if (!silent) wmsx.Util.log("ROM: " + info.n + (info.f ? ", format: " + info.f : "") + " (" + hash + ")");
        } else {
            info = buildInfo(rom.source);
            if (!silent) wmsx.Util.log("ROM: " + (origLen > 0 ? "Unknown content" : "No content") + ", " + info.n + (info.f ? ", format: " + info.f : "") + (hash ? " (" + hash + ")" : ""));
        }

        finishInfo(info, rom.source, hash, formatHint);
        return info;
    };

    function getFormatOptions(rom, insertedCartridge) {
        var formatOptions = [];
        var formatOption;
        for (var format in wmsx.SlotFormats) {
            formatOption = wmsx.SlotFormats[format];
            formatOption.prioritySelected = formatOption.priorityForRom(rom, insertedCartridge);
            if (!formatOption.prioritySelected) continue;	    	                      // rejected by format
            boostPriority(formatOption, rom.info);                                        // adjust priority selected based on ROM info
            if (formatOption.prioritySelected >= FORMAT_PRIORITY_LIMIT) continue;         // reject options that require hints
            formatOptions.push(formatOption);
        }
        // Sort according to priority
        formatOptions.sort(function formatOptionComparator(a, b) {
            return a.prioritySelected - b.prioritySelected;
        });
        return formatOptions;
    }

    var buildInfo = function(romSource) {
        var info = { n: "Unknown" };
        if (!romSource) return info;

        // Get only the file name without the extension
        info.n = wmsx.Util.leafFilenameNoExtension(romSource) || "Unknown";
        return info;
    };

    // Fill absent information based on ROM name
    var finishInfo = function(info, romSource, hash, formatHint) {
        // Saves the hash on the info
        info.h = hash;
        // Adjust Format information if hint passed
        if (formatHint) {
            formatHint = formatHint.trim().toUpperCase();
            for (var formatName in wmsx.SlotFormats)
                if (formatName.toUpperCase() === formatHint) {
                    info.f = wmsx.SlotFormats[formatName].name;          // Translation from Synonym to Base Name
                    info.t = true;
                    break;
                }
        }
        // Adjust Format information, of not yet defined (forced), and hint is present in source name
        if (!info.t) {
            var romURL = romSource.toUpperCase();
            for (formatName in wmsx.SlotFormats)
                if (formatMatchesByHint(formatName.toUpperCase(), romURL)) {
                    info.f = wmsx.SlotFormats[formatName].name;          // Translation from Synonym to Base Name
                    info.t = true;
                    break;
                }
        }
        // Compute label based on other info
        if (!info.l) info.l = produceCartridgeLabel(info);
    };

    function cloneInfo(info) {
        var i = {};
        if (info.n) i.n = info.n;
        if (info.h) i.h = info.h;
        if (info.f) i.f = info.f;
        if (info.t) i.t = info.t;
        if (info.l) i.l = info.l;
        return i;
    }

    var boostPriority = function(formatOption, info) {
        if (info.f && (formatOption.name === info.f))
            formatOption.prioritySelected -= info.t ? FORMAT_FORCE_PRIORITY_BOOST : FORMAT_PRIORITY_BOOST;
    };

    var produceCartridgeLabel = function(info) {
        return info.n[0] === "[" ? (info.f ? info.f : info.n) : info.n.split(/(\(|\[)/)[0].trim();
    };

    var formatMatchesByHint = function(formatName, hint) {
        return hint.match(HINTS_PREFIX_REGEX + formatName + HINTS_SUFFIX_REGEX);
    };


    var HINTS_PREFIX_REGEX = "\\[";
    var HINTS_SUFFIX_REGEX = "\\]";

    var FORMAT_PRIORITY_LIMIT = 1000;
    var FORMAT_PRIORITY_BOOST = 1000;
    var FORMAT_FORCE_PRIORITY_BOOST = 5000;

    var MAX_HASH_CONTENT_SIZE = (WMSX.ROM_MAX_HASH_SIZE_KB || 3072) * 1024;

    this.FORMAT_PRIORITY_BOOST = FORMAT_PRIORITY_BOOST;

};

wmsx.SlotCreator = new wmsx.SlotCreator();