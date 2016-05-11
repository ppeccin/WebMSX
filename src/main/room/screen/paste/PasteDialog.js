// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.PasteDialog = function(mainElement) {
    var self = this;

    this.show = function () {
        if (!this.panel) {
            create();
            setTimeout(function() {
                self.show();
            }, 0);
            return;
        }
        this.panel.style.visibility = "visible";
        this.panel.style.opacity = 1;
    };

    this.hide = function () {
        this.panel.style.visibility = "hidden";
        this.panel.style.opacity = 0;
        WMSX.room.screen.focus();
    };

    var create = function () {
        self.panel = document.createElement("div");
        self.panel.style.position = "absolute";
        self.panel.style.top = self.panel.style.bottom = 0;
        self.panel.style.left = self.panel.style.right = 0;
        self.panel.style.outline = "none";
        self.panel.tabIndex = -1;
        self.panel.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        self.panel.style.transition = "all .1s ease-out";
        mainElement.appendChild(self.panel);

        self.message = document.createElement("div");
        self.message.style.position = "absolute";
        self.message.style.top = self.message.style.bottom = 0;
        self.message.style.left = self.message.style.right = 0;
        self.message.style.width = "300px";
        self.message.style.height = "85px";
        self.message.style.lineHeight = "85px";
        self.message.style.margin = "auto";
        self.message.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
        self.message.style.fontFamily = "arial, sans-serif";
        self.message.style.fontWeight = "bold";
        self.message.style.fontSize = "30px";
        self.message.style.textAlign = "center";
        self.message.style.color = "rgb(238, 238, 238)";
        self.message.style.border = "5px dashed";
        self.message.style.borderRadius = "15px";
        self.message.innerHTML = "PASTE NOW!";
        self.panel.appendChild(self.message);

        setEvents();
    };

    var setEvents = function () {
        // Close the modal with a click outside
        self.panel.addEventListener("mousedown", function (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            self.hide();
        });
    };


    this.panel = null;
    this.message = null;

};

