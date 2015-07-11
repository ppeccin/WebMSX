// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.BASICExtension = function(bus) {

    this.typeString = function(str) {
        if (!str || (str.length === 0)) return;
        if (str.length > 39) str = str.slice(0, 39);

        var buffPos = 0xfbf0;
        for (var i = 0; i < str.length; i++)
            bus.write(buffPos + i, str.charCodeAt(i));
        bus.write(0xf3fa, 0xf0); bus.write(0xf3fb, 0xfb);
        buffPos += i;
        bus.write(0xf3f8, buffPos & 0xff); bus.write(0xf3f9, buffPos >>> 8);
    };

};