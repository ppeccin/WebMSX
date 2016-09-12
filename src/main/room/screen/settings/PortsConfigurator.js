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

    this.getMappingForControl = function(button, port) {
        return controllersHub.getMappingForControl(button, port - 1);
    };

    this.customizeControl = function(button, port, mapping) {
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
        for (var p = 1; p <= 2; ++p) {
            var buttonElement;
            for (var b in wmsx.JoystickButtons) {
                buttonElement = document.getElementById("wmsx-joy" + p + "-" + b);
                buttonElement.wmsxButton = b;
                buttonElement.wmsxPort = p;
                setupButtonMouseEvents(buttonElement);
            }
            buttonElement = document.getElementById("wmsx-mouse" + p);
            buttonElement.wmsxButton = "MOUSE";
            buttonElement.wmsxPort = p;
            setupButtonMouseEvents(buttonElement);
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
            portEditing = buttonElementEditing.wmsxPort;
            updatePopup()
        } else
            mouseLeaveButton();
    }

    function mouseLeaveButton() {
        buttonElementEditing = joyButtonEditing = portEditing = null;
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

        var text = controllersHub.getPopupText(joyButtonEditing, portEditing - 1);

        popup.show(self, joyButtonEditing, portEditing, x, y, text.heading, text.footer);
    }


    var mouseModeElement, joysticksModeElement, joykeysModeElement;
    var deviceElements, deviceTitleElements;

    var buttonElementEditing = null, joyButtonEditing = null, portEditing = null;

    var popup = wmsx.ControlMappingPopup.get();

    var DEVICE_CLASSES = [ "wmsx-none-device", "wmsx-mouse-device", "wmsx-joystick-device", "wmsx-joykeys-device" ];


    init();

};
