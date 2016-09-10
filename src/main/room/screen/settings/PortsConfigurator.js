// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

wmsx.PortsConfigurator = function(controllersHub) {
"use strict";

    var self = this;

    function init() {
        setup();
    }

    this.controllersSettingsStateUpdate = function() {
        this.refresh();
    };

    this.refresh = function() {
        console.log("PORT CONFIGURATOR REFRESH");

        var state = controllersHub.getSettingsState();
        mouseModeElement.innerHTML = "Mouse Mode: " + state.mouseMode;
        joysticksModeElement.innerHTML = "Joysticks Mode: " + state.joysticksMode;
        joykeysModeElement.innerHTML = "Joykeys Mode: " + state.joykeysMode;

        for (var p = 0; p < 2; ++p) {
            var device = state.ports[p];
            var classList = deviceElements[p].classList;
            classList.remove.apply(classList, DEVICE_CLASSES);
            if (device.startsWith(wmsx.ControllersHub.MOUSE))
                classList.add("wmsx-mouse-device");
            else if (device.startsWith(wmsx.ControllersHub.JOY_ANY))
                classList.add(device.startsWith(wmsx.ControllersHub.JOYSTICK) ? "wmsx-joystick-device" : "wmsx-joykeys-device");
            else
                classList.add("wmsx-none-device");
            deviceTitleElements[p].innerHTML = device;
        }
    };

    this.getMappingForControl = function(button) {
        return [ ];
    };

    this.customizeControl = function(key, mapping) {
    };

    function setup() {
        // Set mode fields
        mouseModeElement = document.getElementById("wmsx-ports-mouse-mode");
        joysticksModeElement = document.getElementById("wmsx-ports-joysticks-mode");
        joykeysModeElement = document.getElementById("wmsx-ports-joykeys-mode");

        // Set device elements
        deviceElements = [ document.getElementById("wmsx-ports-device1"), document.getElementById("wmsx-ports-device2") ];
        deviceTitleElements = [ document.getElementById("wmsx-ports-device1-title"), document.getElementById("wmsx-ports-device2-title") ];

        // Set buttons
        for (var j = 1; j <= 2; ++j) {
            for (var b in wmsx.JoystickButtons) {
                var buttonElement = document.getElementById("wmsx-joy" + j + "-" + b);
                buttonElement.wmsxButton = b;
                setupButtonMouseEvents(buttonElement);
            }
        }

    }

    function setupButtonMouseEvents(buttonElement) {
        buttonElement.addEventListener("mouseenter", mouseEnterButton);
        buttonElement.addEventListener("mouseleave", mouseLeaveButton);
    }

    function mouseEnterButton(e) {
        if (e.target.wmsxButton) {
            buttonElementEditing = e.target;
            joyButtonEditing = buttonElementEditing.wmsxButton;
            updatePopup()
        } else
            mouseLeaveButton();
    }

    function mouseLeaveButton() {
        buttonElementEditing = joyButtonEditing = null;
        updatePopup();
    }

    function updatePopup() {
        if (!joyButtonEditing) {
            popup.hide();
            //keyboardElement.focus();
            return;
        }

        // Position
        var keyRec = buttonElementEditing.getBoundingClientRect();
        var x = keyRec.left + keyRec.width / 2;
        var y = keyRec.top;

        popup.show(self, joyButtonEditing, x, y);
    }


    var mouseModeElement, joysticksModeElement, joykeysModeElement;
    var deviceElements, deviceTitleElements;

    var buttonElementEditing = null, joyButtonEditing = null;

    var popup = wmsx.ControlMappingPopup.get();

    var DEVICE_CLASSES = [ "wmsx-none-device", "wmsx-mouse-device", "wmsx-joystick-device", "wmsx-joykeys-device" ];


    init();

};
