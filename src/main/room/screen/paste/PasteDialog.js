// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PasteDialog = function(mainElement) {
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
        WMSX.room.screen.focus();
    };

    var create = function () {
        var style;

        self.cover = document.createElement("div");
        self.cover.id = "wmsx-paste-cover";
        style = self.cover.style;
        style.position = "absolute";
        style.top = style.bottom = 0;
        style.left = style.right = 0;
        style.backgroundColor = "rgba(0, 0, 0, 0.6)";
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
        style.backgroundColor = "rgba(255, 40, 40, 0.75)";
        style.fontFamily = "Helvetica Arial, sans-serif";
        style.fontWeight = "bold";
        style.fontSize = "26px";
        style.textAlign = "center";
        style.color = "transparent";
        style.border = "2px dashed rgba(240, 240, 240, 0.70)";
        style.borderRadius = "10px";
        style.textShadow = "0 0 0 rgb(240, 240, 240)";
        style.padding = "0";
        style.outline = "none";
        self.cover.appendChild(self.box);

        setEvents();
    };

    var setEvents = function () {
        // Close the modal with ESC or ALT-V/Ins. Ignore common keys like SPACE, ENTER, ARROWS, etc
        self.cover.addEventListener("keydown", function (e) {
            if (e.stopPropagation) e.stopPropagation();

            // Close
            if (e.keyCode === ESC_KEY || ((e.keyCode === EXIT_KEY || e.keyCode === EXIT_KEY2) && e.altKey && !e.ctrlKey && !e.shiftKey)) {
                if (e.preventDefault) e.preventDefault();
                self.hide();
                return;
            }

           // Ignore
            if (e.preventDefault && IGNORE_KEYS.indexOf(e.keyCode) >= 0) e.preventDefault();
        });

        // Close the modal with a click outside the box...
        self.cover.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            self.hide();
        });
        // ... but not with a click inside
        self.box.addEventListener("mousedown", function (e) {
            if (e.stopPropagation) e.stopPropagation();
        });

        // Capture the paste event
        self.box.addEventListener("paste", function(e) {
            console.log("PASTE from: " + window.document.activeElement.id);

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
    var IGNORE_KEYS = [
        k.VK_SPACE.c, k.VK_ENTER.c, k.VK_TAB.c,  k.VK_BACKSPACE.c,
        k.VK_UP.c, k.VK_DOWN.c, k.VK_LEFT.c, k.VK_RIGHT.c,
        k.VK_HOME.c, k.VK_END.c, k.VK_PAGE_UP.c, k.VK_PAGE_DOWN.c,
        k.VK_F1.c, k.VK_F2.c, k.VK_F3.c, k.VK_F4.c, k.VK_F5.c, k.VK_F6.c,
        k.VK_F7.c, k.VK_F8.c, k.VK_F9.c, k.VK_F10.c, k.VK_F11.c, k.VK_F12.c
    ];

    var ESC_KEY = k.VK_ESCAPE.c, EXIT_KEY = k.VK_V.c, EXIT_KEY2 = k.VK_INSERT.c;

};
