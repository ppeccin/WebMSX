// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotCreator = function () {

    this.createFromROM = function (rom) {
        // Try to build the Slot if a supported format is found
        var options = getFormatOptions(rom);
        if (options.length === 0) return;

        // Choose the best option
        var bestOption = options[0];
        wmsx.Util.log("Format selected: " + bestOption.desc + ", priority: " + bestOption.priority + (bestOption.priorityBoosted ? " (" + bestOption.priorityBoosted + ")" : ""));
        return bestOption.createFromROM(rom);
    };

    this.recreateFromSaveState = function (saveState, previousSlot) {
        var format = wmsx.SlotFormats[saveState.f];
        if (!format) {
            var ex = new Error("Unsupported ROM Format: " + saveState.f);
            ex.msx = true;
            throw ex;
        }
        if (previousSlot && previousSlot.format !== format) previousSlot = null;       // Only possible to reuse previousSlot if the format is the same
        return format.recreateFromSaveState(saveState, previousSlot);
    };

    this.produceInfo = function(rom) {
        // Preserve original length as MD5 computation may increase it
        var origLen = rom.content.length;
        var hash = wmsx.Util.sha1Generator.calcSHA1FromByteArray(rom.content).toUpperCase();
        if (rom.content.length > origLen) rom.content.splice(origLen);

        // Get info from the library
        var info = wmsx.ROMDatabase[hash];
        if (info) {
            wmsx.Util.log("ROM: " + info.n + (info.f ? ", format: " + info.f : "") + " (" + hash + ")");
        } else {
            info = buildInfo(rom.source);
            wmsx.Util.log("ROM: " + (origLen > 0 ? "Unknown content" : "No content") + ", " + info.n + (info.f ? ", format: " + info.f : "") + (hash ? " (" + hash + ")" : ""));
        }

        finishInfo(info, rom.source, hash);
        return info;
    };

    function getFormatOptions(rom) {
        var formatOptions = [];
        var formatOption;
        var denialEx;
        for (var format in wmsx.SlotFormats) {
            try {
                formatOption = wmsx.SlotFormats[format].tryFormat(rom);
                if (!formatOption) continue;	    	    // rejected by format
                boostPriority(formatOption, rom.info);	    // adjust priority based on ROM info
                formatOptions.push(formatOption);
            } catch (ex) {
                if (!ex.formatDenial) throw ex;
                if (!denialEx) denialEx = ex;               // Keep only the first one
            }
        }
        // If no Format could be found, throw error
        if (formatOptions.length === 0) {
            var ex = denialEx || new Error("Unsupported ROM Format. Size: " + rom.content.length);
            ex.msx = true;
            throw ex;
        }
        // Sort according to priority
        formatOptions.sort(function formatOptionComparator(a, b) {
            return (a.priorityBoosted || a.priority) - (b.priorityBoosted || b.priority);
        });
        return formatOptions;
    }

    var buildInfo = function(romSource) {
        var info = { n: "Unknown" };
        if (!romSource || !romSource.trim()) return info;

        var name = romSource;

        // Get the last part of the URL (file name)
        var slash = name.lastIndexOf("/");
        var bslash = name.lastIndexOf("\\");
        var question = name.lastIndexOf("?");
        var i = Math.max(slash, Math.max(bslash, question));
        if (i >= 0 && i < name.length - 1) name = name.substring(i + 1);
        // Get only the file name without the extension
        var dot = name.lastIndexOf(".");
        if (dot >= 0) name = name.substring(0, dot);

        info.n = name.trim() || "Unknown";
        return info;
    };

    // Fill absent information based on ROM name
    var finishInfo = function(info, romSource, hash) {
        // Saves the hash on the info
        info.h = hash;
        // Compute label based on name
        if (!info.l) info.l = produceCartridgeLabel(info.n);
        // Adjust Format information if hint is present
        var romURL = romSource.toUpperCase();
        for (var formatName in wmsx.SlotFormats)
            if (formatMatchesByHint(formatName.toUpperCase(), romURL)) {
                info.f = wmsx.SlotFormats[formatName].name;          // Translation from Synonym - Base Name
                info.t = true;
                break;
            }
    };

    var boostPriority = function(formatOption, info) {
        if (info.f && (formatOption.name === info.f))
            formatOption.priorityBoosted = formatOption.priority - (info.t ? FORMAT_FORCE_PRIORITY_BOOST : FORMAT_PRIORITY_BOOST);
        else
            formatOption.priorityBoosted = undefined;
    };

    var produceCartridgeLabel = function(name) {
        return name.split(/(\(|\[)/)[0].trim();
    };

    var formatMatchesByHint = function(formatName, hint) {
        return hint.match(HINTS_PREFIX_REGEX + formatName + HINTS_SUFFIX_REGEX);
    };


    var HINTS_PREFIX_REGEX = "\\[";
    var HINTS_SUFFIX_REGEX = "\\]";

    var FORMAT_PRIORITY_BOOST = 1000;
    var FORMAT_FORCE_PRIORITY_BOOST = 2000;

};

wmsx.SlotCreator = new wmsx.SlotCreator();