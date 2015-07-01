// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SlotCreator = function () {

    this.createFromROM = function (rom) {
        // Try to build the Slot if a supported format is found
        var options = getFormatOptions(rom);
        if (options.length === 0) return;

        // Choose the best option
        var bestOption = options[0];
        wmsx.Util.log("" + bestOption.name + ": " + bestOption.desc + ", priority: " + bestOption.priority + (bestOption.priorityBoosted ? " (" + bestOption.priorityBoosted + ")" : ""));
        return bestOption.createFromROM(rom);
    };

    this.createFromSaveState = function (saveState) {
        var cartridgeFormat = wmsx.SlotFormats[saveState.f];
        if (!cartridgeFormat) {
            var ex = new Error("Unsupported ROM Format: " + saveState.f);
            ex.msx = true;
            throw ex;
        }
        return cartridgeFormat.createFromSaveState(saveState);
    };

    this.produceInfo = function(rom) {
        // Preserve original length as MD5 computation may increase it
        var origLen = rom.content.length;
        var hash = wmsx.Util.sha1Generator.calcSHA1FromByteArray(rom.content).toUpperCase();
        if (rom.content.length > origLen) rom.content.splice(origLen);

        // Get info from the library
        var info = wmsx.ROMDatabase[hash];
        if (info) {
            wmsx.Util.log("" + info.n + (info.f ? " (" + info.f + ")" : ""));
        } else {
            info = buildInfo(rom.source);
            wmsx.Util.log("Unknown ROM (" + hash + "): " + info.n);
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
        var name = info.n.toUpperCase();
        // Adjust Format information if absent
        Format: if (!info.f) {
            // First by explicit format hint
            var romURL = romSource.toUpperCase();
            for (var formatName in wmsx.SlotFormats)
                if (formatMatchesByHint(formatName, name) || formatMatchesByHint(formatName, romURL)) {
                    info.f = formatName;
                    break Format;
                }
            // Then by name
            for (formatName in FORMAT_ROM_NAMES)
                if (formatMatchesByName(formatName, name)) {
                    info.f = formatName;
                    break Format;
                }
        }
    };

    var boostPriority = function(formatOption, info) {
        if (info.f && formatOption.name === info.f)
            formatOption.priorityBoosted = formatOption.priority - FORMAT_PRIORITY_BOOST;
        else
            formatOption.priorityBoosted = undefined;
    };

    var produceCartridgeLabel = function(name) {
        return name.split(/(\(|\[)/)[0].trim();   //  .toUpperCase();   // TODO Validade
    };

    var formatMatchesByHint = function(formatName, hint) {
        return hint.match(HINTS_PREFIX_REGEX + formatName + HINTS_SUFFIX_REGEX);
    };

    var formatMatchesByName = function(formatName, name) {
        var namesForFormat = FORMAT_ROM_NAMES[formatName];
        if (!namesForFormat) return false;
        for (var i = 0; i < namesForFormat.length; i++)
            if (name.match(namesForFormat[i]))
                return true;
        return false;
    };


    var FORMAT_ROM_NAMES = {};

    var HINTS_PREFIX_REGEX = "^(|.*?(\\W|_|%20))";
    var HINTS_SUFFIX_REGEX = "(|(\\W|_|%20).*)$";

    var FORMAT_PRIORITY_BOOST = 50;

};

wmsx.SlotCreator = new wmsx.SlotCreator();