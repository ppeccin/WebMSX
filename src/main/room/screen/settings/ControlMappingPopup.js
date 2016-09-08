// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.ControlMappingPopup = function() {
"use strict";

    var self = this;

    function init() {
        setup();
    }

    this.show = function(pController, pControlEditing, x, y) {
        posX = x; posY = y;
        controller = pController;
        controlEditing = pControlEditing;
        modifPending = null;
        update();
    };

    this.hide = function() {
        posX = posY = 0;
        controller = controlEditing = null;
        update();
    };

    function setup() {
        popup = document.getElementById("wmsx-control-mapping-popup");
        popupKeys = document.getElementById("wmsx-control-mapping-popup-keys");
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

        var mappings = controller.getMappingForControl(controlEditing) || [];
        popupKeys.innerHTML = mappings.length === 0 ? "- none -" : htmlForMappings(mappings);

        // Position
        var popRec = popup.getBoundingClientRect();
        var x = (posX - popRec.width / 2) | 0;
        var y = (posY - popRec.height - POPUP_DIST) | 0;
        popup.style.top = "" + y + "px";
        popup.style.left = "" + x + "px";
    }

    function customizeControl(e) {
        var mapping = {c: wmsx.DOMKeys.codeForKeyboardEvent(e), n: wmsx.DOMKeys.nameForKeyboardEvent(e)};
        controller.customizeControl(controlEditing, mapping);
        modifPending = null;
        update();
    }

    function htmlForMappings(mappings) {
        if (mappings.length === 0) return "- none -";

        var res = "";
        for (var i = 0; i < mappings.length; i++) {
            var mapping = mappings[i];
            if (i > 0) res += "&nbsp;,&nbsp;";
            var names = !mapping.n || mapping.n.constructor !== Array ? [ mapping.n ] : mapping.n;
            var str = "";
            for (var k = 0, len = names.length; k < len; ++k) {
                if (k > 0) str += (k === (len-1)) ? "&nbsp;+&nbsp;" : "&nbsp;";
                str += '<DIV class = "wmsx-key">' + names[k] + '</DIV>';
            }
            res += str;
        }
        return res;
    }


    var posX = 0, posY = 0;
    var controller = null, controlEditing = null, modifPending = null;

    var popup, popupKeys;
    var POPUP_BORDER_WIDTH = 8, POPUP_DIST = 14;


    init();

};

wmsx.ControlMappingPopup.get = function() {
    "use strict";
    if (!wmsx.ControlMappingPopup.instance) wmsx.ControlMappingPopup.instance = new wmsx.ControlMappingPopup();
    return wmsx.ControlMappingPopup.instance
};

wmsx.ControlMappingPopup.instance = null;
