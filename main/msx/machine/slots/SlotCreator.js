// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

SlotCreator = function () {

    this.createFromROM = function (rom) {
        // Try to build the Slot if a supported format is found
        var options = getFormatOptions(rom);
        if (options.length === 0) return;

        // Choose the best option
        var bestOption = options[0];
        Util.log("" + bestOption.name + ": " + bestOption.desc + ", priority: " + bestOption.priority + (bestOption.priorityBoosted ? " (" + bestOption.priorityBoosted + ")" : ""));
        return bestOption.createFromROM(rom);
    };

    this.createFromSaveState = function (saveState) {
        var cartridgeFormat = SlotFormats[saveState.f];
        if (!cartridgeFormat) {
            var ex = new Error("Unsupported ROM Format: " + saveState.f);
            ex.msx = true;
            throw ex;
        }
        return cartridgeFormat.createFromSaveState(saveState);
    };

    function getFormatOptions(rom) {
        var formatOptions = [];
        var formatOption;
        var denialEx;
        for (var format in SlotFormats) {
            try {
                formatOption = SlotFormats[format].tryFormat(rom);
                if (!formatOption) continue;	    	    // rejected by format
                //boostPriority(formatOption, rom.info);	    // adjust priority based on ROM info
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

};

SlotCreator = new SlotCreator();