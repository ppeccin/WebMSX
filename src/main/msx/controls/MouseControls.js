// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.MouseControls = {

    MouseDeltaState: function() {
        this.reset = function() {
            this.dX = 0;
            this.dY = 0;
            this.buttons = 0;
        };
        this.reset();
    }

};
