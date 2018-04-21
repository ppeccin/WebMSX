// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.ControlMappingPopup = function() {
"use strict";

    function init() {
        setup();
    }

    this.show = function(pController, pControlEditing, pPortEditing, x, y, heading, footer, pLocked) {
        posX = x; posY = y;
        controller = pController;
        controlEditing = pControlEditing;
        portEditing = pPortEditing;
        modifKeyCodePending = null;
        popupHeading.innerHTML = heading;
        popupFooter.innerHTML = footer;
        locked = !!pLocked;
        popup.classList.toggle("wmsx-locked", locked);
        update();
    };

    this.hide = function() {
        posX = posY = 0;
        controller = controlEditing = portEditing = null;
        update();
    };

    this.joystickButtonDetected = function (button, port) {
        if (port === portEditing) customizeControlGamepadButton(button);
    };

    function setup() {
        popup = document.getElementById("wmsx-control-mapping-popup");
        popupHeading = document.getElementById("wmsx-control-mapping-popup-heading");
        popupMapping = document.getElementById("wmsx-control-mapping-popup-mapping");
        popupFooter = document.getElementById("wmsx-control-mapping-popup-footer");
        popup.tabIndex = -1;

        popup.addEventListener("mousedown", mouseDown);
        popup.addEventListener("keydown", keyDown);
        popup.addEventListener("keyup", keyUp);
    }

    function mouseDown(e) {
        wmsx.Util.blockEvent(e);
        if (e.which === 3) controller.clearControlEditing();
    }

    function keyDown(e) {
        if (!controlEditing) return;

        var code = domKeys.codeNewForKeyboardEvent(e);
        // console.log("Key Press, code: " + e.code + ", keyCode: " + e.keyCode /*.toString(16)*/ + ", wc: " + code + ", key: " + e.key);

        if (!locked && code === domKeys.VK_ESCAPE.wc) return;

        // Modifier keys are accepted only on release
        if (domKeys.isModifierKey(e))
            modifKeyCodePending = domKeys.codeNewForKeyboardEvent(e);
        else
            customizeControlKeyEvent(e);

        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function keyUp(e) {
        if (!controlEditing) return;

        var code = domKeys.codeNewForKeyboardEvent(e);

        // Modifier keys are accepted only on release, and only the last one depressed
        if (modifKeyCodePending === code) customizeControlKeyEvent(e);

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

    function customizeControlKeyEvent(e) {
        var name = domKeys.nameForKeyboardEvent(e);
        if (!name) return;  // Unidentifiable key, do not accept

        var mapping = { wc: domKeys.codeNewForKeyboardEvent(e), n: name};
        controller.customizeControl(controlEditing, portEditing, mapping);
        modifKeyCodePending = null;
        update();
    }

    function customizeControlGamepadButton(button) {
        controller.customizeControl(controlEditing, portEditing, button);
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
                    var cla = mapping.wc ? "wmsx-key" : mapping.n.length > 1 ? "wmsx-joy-button wmsx-square" : "wmsx-joy-button";
                    if (k > 0) str += (k === (len - 1)) ? "&nbsp;+&nbsp;" : "&nbsp;";
                    str += '<DIV class = "' + cla + '">' + names[k] + '</DIV>';
                }
            }
            res += str;
        }
        return res;
    }


    var domKeys = wmsx.DOMKeys;

    var posX = 0, posY = 0;
    var controller = null, controlEditing = null, portEditing, modifKeyCodePending = null;

    var popup, popupHeading, popupMapping, popupFooter, locked;
    var POPUP_DIST = 14;


    init();

};

wmsx.ControlMappingPopup.get = function() {
    "use strict";
    if (!wmsx.ControlMappingPopup.instance) wmsx.ControlMappingPopup.instance = new wmsx.ControlMappingPopup();
    return wmsx.ControlMappingPopup.instance
};

wmsx.ControlMappingPopup.instance = null;
