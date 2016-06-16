// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PasteDialog = function(mainElement, screen) {
    var self = this;

    this.toggle = function() {
        if (this.cover && this.cover.style.visibility === "visible") this.hide();
        else this.show();
    };

    this.show = function () {
        WMSX.cancelTypeString();
        if (!this.cover) {
            create();
            self.show();
            return;
        }
        setTimeout(function() {
            self.cover.style.visibility = "visible";
            self.cover.style.opacity = "1";
            self.box.focus();
        }, 0);
    };

    this.hide = function () {
        if (!this.cover) return;
        this.cover.style.visibility = "hidden";
        this.cover.style.opacity = "0";
        screen.focus();
    };

    var create = function () {
        var style;

        self.cover = document.createElement("div");
        self.cover.id = "wmsx-paste-cover";
        style = self.cover.style;
        style.position = "absolute";
        style.top = style.bottom = 0;
        style.left = style.right = 0;
        style.background = "rgba(0, 0, 0, 0.6)";
        style.transition = "opacity .1s ease-out";
        style.zIndex = 10;
        mainElement.appendChild(self.cover);

        self.box = document.createElement("input");
        self.box.id = "wmsx-paste-box";
        self.box.value = "\uD83D\uDCCB   PASTE NOW";
        self.box.readOnly = "readonly";
        self.box.innerHTML = "PASTE NOW!";
        style = self.box.style;
        style.userSelect = style.webkitUserSelect = style.MozUserSelect = style.msUserSelect = "none";
        style.position = "absolute";
        style.top = style.bottom = 0;
        style.left = style.right = 0;
        style.width = "270px";
        style.height = "66px";
        style.margin = "auto";
        style.background = "rgba(255, 40, 40, 0.75)";
        style.font = "bold 26px sans-serif";
        style.textAlign = "center";
        style.color = "transparent";
        style.border = "2px dashed rgba(240, 240, 240, 0.70)";
        style.borderRadius = "10px";
        style.textShadow = "0 0 0 rgb(240, 240, 240)";
        style.webkitFontSmoothing = "antialiased";      // Light Text on Dark Background fix
        style.MozOsxFontSmoothing = "grayscale";
        style.padding = "0";
        style.outline = "none";
        self.cover.appendChild(self.box);

        setEvents();
    };

    var setEvents = function () {
        // Close the modal with ESC or ALT-V/Ins. Ignore common keys like SPACE, ENTER, ARROWS, etc
        self.cover.addEventListener("keydown", function (e) {
            e.stopPropagation();

            // Close
            if (e.keyCode === ESC_KEY || ((e.keyCode === EXIT_KEY || e.keyCode === EXIT_KEY2) && e.altKey && !e.ctrlKey && !e.shiftKey)) {
                e.preventDefault();
                self.hide();
                return;
            }

           // Block default
           if (e.preventDefault && ALLOW_DEFAULT_KEYS.indexOf(e.keyCode) < 0) e.preventDefault();
        });

        // Close the modal with a click outside the box...
        self.cover.addEventListener("mousedown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.hide();
        });
        // ... but not with a click inside
        self.box.addEventListener("mousedown", function (e) {
            e.stopPropagation();
        });

        // Capture the paste event
        self.box.addEventListener("paste", function(e) {
            if (self.cover.style.visibility !== "visible") return;

            if (e.clipboardData && e.clipboardData.getData) {
                var str = e.clipboardData.getData("text/plain");
                if (str) {
                    self.hide();
                    WMSX.typeString(str);
                }
            }
        });
    };

    this.cover = null;
    this.box = null;

    var k = wmsx.DOMKeys;
    var ALLOW_DEFAULT_KEYS = [
        k.VK_V.c, k.VK_INSERT.c
    ];
    var ESC_KEY = k.VK_ESCAPE.c, EXIT_KEY = k.VK_V.c, EXIT_KEY2 = k.VK_INSERT.c;

};
