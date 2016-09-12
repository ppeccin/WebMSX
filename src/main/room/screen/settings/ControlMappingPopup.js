// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.ControlMappingPopup = function() {
"use strict";

    var self = this;

    function init() {
        setup();
    }

    this.show = function(pController, pControlEditing, pPortEditing, x, y, heading, footer) {
        posX = x; posY = y;
        controller = pController;
        controlEditing = pControlEditing;
        portEditing = pPortEditing;
        modifPending = null;
        popupHeading.innerHTML = heading;
        popupFooter.innerHTML = footer;
        update();
    };

    this.hide = function() {
        posX = posY = 0;
        controller = controlEditing = portEditing = null;
        update();
    };

    function setup() {
        popup = document.getElementById("wmsx-control-mapping-popup");
        popupHeading = document.getElementById("wmsx-control-mapping-popup-heading");
        popupMapping = document.getElementById("wmsx-control-mapping-popup-mapping");
        popupFooter = document.getElementById("wmsx-control-mapping-popup-footer");
        popup.tabIndex = -1;

        popup.addEventListener("keydown", keyDown);
        popup.addEventListener("keyup", keyUp);
    }

    function keyDown(e) {
        if (!controlEditing) return;

        // Modifier keys are accepted only on release
        if (wmsx.DOMKeys.isModifierKeyCode(e.keyCode))
            modifPending = e.keyCode;
        else
            customizeControl(e);

        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function keyUp(e) {
        if (!controlEditing) return;

        // Modifier keys are accepted only on release, and oly the last one depressed
        if (modifPending === e.keyCode) customizeControl(e);

        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function update() {
        if (!controller) {
            // Hide
            popup.style.display = "none";
            return;
        }

        // Show. Define contents
        popup.style.display = "block";
        window.setTimeout(function() { popup.focus(); }, 0);

        var mappings = controller.getMappingForControl(controlEditing, portEditing) || [];
        popupMapping.innerHTML = htmlForMappings(mappings);

        // Position
        var popRec = popup.getBoundingClientRect();
        var x = (posX - popRec.width / 2) | 0;
        var y = (posY - popRec.height - POPUP_DIST) | 0;
        popup.style.top = "" + y + "px";
        popup.style.left = "" + x + "px";
    }

    function customizeControl(e) {
        var mapping = {c: wmsx.DOMKeys.codeForKeyboardEvent(e), n: wmsx.DOMKeys.nameForKeyboardEvent(e)};
        controller.customizeControl(controlEditing, portEditing, mapping);
        modifPending = null;
        update();
    }

    function htmlForMappings(mappings) {
        if (mappings.constructor === String) return mappings;
        if (mappings.constructor === Object) return htmlForMappings(mappings.from) + "&nbsp;&nbsp;=>&nbsp;&nbsp;" + htmlForMappings(mappings.to);
        if (!mappings || mappings.length === 0) return "- none -";

        var res = "";
        for (var i = 0; i < mappings.length; i++) {
            var str;
            var mapping = mappings[i];
            if (mapping.constructor === String) {
                str = mapping;
            } else {
                if (i > 0) res += "&nbsp;,&nbsp;";
                var names = !mapping.n || mapping.n.constructor !== Array ? [mapping.n] : mapping.n;
                str = "";
                for (var k = 0, len = names.length; k < len; ++k) {
                    var cla = mapping.t === "JOYSQUARE" ? "wmsx-joy-button wmsx-square" : mapping.t === "JOY" ? "wmsx-joy-button" : "wmsx-key";
                    if (k > 0) str += (k === (len - 1)) ? "&nbsp;+&nbsp;" : "&nbsp;";
                    str += '<DIV class = "' + cla + '">' + names[k] + '</DIV>';
                }
            }
            res += str;
        }
        return res;
    }


    var posX = 0, posY = 0;
    var controller = null, controlEditing = null, portEditing, modifPending = null;

    var popup, popupHeading, popupMapping, popupFooter;
    var POPUP_BORDER_WIDTH = 8, POPUP_DIST = 14;


    init();

};

wmsx.ControlMappingPopup.get = function() {
    "use strict";
    if (!wmsx.ControlMappingPopup.instance) wmsx.ControlMappingPopup.instance = new wmsx.ControlMappingPopup();
    return wmsx.ControlMappingPopup.instance
};

wmsx.ControlMappingPopup.instance = null;
