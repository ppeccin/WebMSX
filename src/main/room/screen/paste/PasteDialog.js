// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PasteDialog = function(mainElement) {
    var self = this;

    this.toggle = function() {
        if (this.cover && this.cover.style.visibility === "visible") this.hide();
        else this.show();
    };

    this.show = function () {
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
        self.cover = document.createElement("div");
        self.cover.id = "wmsx-paste-cover";
        self.cover.style.position = "absolute";
        self.cover.style.top = self.cover.style.bottom = 0;
        self.cover.style.left = self.cover.style.right = 0;
        self.cover.style.outline = "none";
        self.cover.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        self.cover.style.transition = "opacity .1s ease-out";
        self.cover.tabIndex = "1";                 // Make it focusable

        self.box = document.createElement("div");
        self.box.id = "wmsx-paste-box";
        self.box.style.position = "absolute";
        self.box.style.top = self.box.style.bottom = 0;
        self.box.style.left = self.box.style.right = 0;
        self.box.style.width = "300px";
        self.box.style.height = "85px";
        self.box.style.lineHeight = "85px";
        self.box.style.margin = "auto";
        self.box.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
        self.box.style.fontFamily = "arial, sans-serif";
        self.box.style.fontWeight = "bold";
        self.box.style.fontSize = "30px";
        self.box.style.textAlign = "center";
        self.box.style.color = "rgb(238, 238, 238)";
        self.box.style.border = "5px dashed";
        self.box.style.borderRadius = "15px";
        self.box.style.padding = "0";
        self.box.style.outline = "green";
        self.box.style.zIndex = 10;
        self.box.tabIndex = "-1";               // Make it focusable
        self.box.innerHTML = "PASTE NOW!";
        self.cover.appendChild(self.box);

        setEvents();

        mainElement.appendChild(self.cover);
    };

    var setEvents = function () {
        // Close the modal with ESC or ALT-X. Ignore common keys like SPACE, ENTER, ARROWS, etc
        self.cover.addEventListener("keydown", function (e) {
            if (e.stopPropagation) e.stopPropagation();

            // Close
            if (e.keyCode === wmsx.DOMKeys.VK_ESCAPE.c || (e.keyCode === wmsx.DOMKeys.VK_X.c && e.altKey && !e.ctrlKey && !e.shiftKey)) {
                if (e.preventDefault) e.preventDefault();
                self.hide();
                return;
            }

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
        document.addEventListener("paste", function(e) {
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

    var IGNORE_KEYS = [
        wmsx.DOMKeys.VK_SPACE.c, wmsx.DOMKeys.VK_ENTER.c, wmsx.DOMKeys.VK_TAB.c,  wmsx.DOMKeys.VK_BACKSPACE.c,
        wmsx.DOMKeys.VK_UP.c, wmsx.DOMKeys.VK_DOWN.c, wmsx.DOMKeys.VK_LEFT.c, wmsx.DOMKeys.VK_RIGHT.c,
        wmsx.DOMKeys.VK_HOME.c, wmsx.DOMKeys.VK_END.c, wmsx.DOMKeys.VK_PAGE_UP.c, wmsx.DOMKeys.VK_PAGE_DOWN.c,
        wmsx.DOMKeys.VK_F1.c, wmsx.DOMKeys.VK_F2.c, wmsx.DOMKeys.VK_F3.c, wmsx.DOMKeys.VK_F4.c, wmsx.DOMKeys.VK_F5.c, wmsx.DOMKeys.VK_F6.c,
        wmsx.DOMKeys.VK_F7.c, wmsx.DOMKeys.VK_F8.c, wmsx.DOMKeys.VK_F9.c, wmsx.DOMKeys.VK_F10.c, wmsx.DOMKeys.VK_F11.c, wmsx.DOMKeys.VK_F12.c
    ];

};

