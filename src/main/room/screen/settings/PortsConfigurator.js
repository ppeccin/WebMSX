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
        var state = controllersHub.getSettingsState();
        mouseModeElement.innerHTML = "Mouse Mode: " + state.mouseMode;
        joysticksModeElement.innerHTML = "Joysticks Mode: " + state.joysticksMode;
        joykeysModeElement.innerHTML = "Joykeys Mode: " + state.joykeysMode;

        for (var p = 0; p < 2; ++p) {


        }
    };

    function setup() {
        // Set mode fields
        mouseModeElement = document.getElementById("wmsx-ports-mouse-mode");
        joysticksModeElement = document.getElementById("wmsx-ports-joysticks-mode");
        joykeysModeElement = document.getElementById("wmsx-ports-joykeys-mode");

        // Set device elements
        joyElements = [ document.getElementById("wmsx-ports-joy1"), document.getElementById("wmsx-ports-joy2") ];

        // Set Popup
        popup = document.getElementById("wmsx-keyboard-popup");
        popupKeys = document.getElementById("wmsx-keyboard-popup-keys");
    }


    var mouseModeElement, joysticksModeElement, joykeysModeElement, joyElements;

    var popup, popupKeys;
    var POPUP_BORDER_WIDTH = 8, POPUP_DIST = 14;


    init();

};
