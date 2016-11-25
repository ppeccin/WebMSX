// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSXFullScreenSetup = {};

WMSXFullScreenSetup.apply = function fullScreenSetup() {
    // Setup Basic CSS
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = WMSXFullScreenSetup.css();
    document.head.appendChild(style);

    // Apply Standalone mode full-screen basic style to html and body immediately if we'll enter full-screen later
    document.documentElement.classList.toggle("wmsx-full-screen", WMSXFullScreenSetup.shouldStartInFullScreen());

    WMSXFullScreenSetup.applied = true;
};

WMSXFullScreenSetup.shouldStartInFullScreen = function() {
    return (window.WMSX && (WMSX.SCREEN_FULLSCREEN_MODE === 1 || (WMSX.SCREEN_FULLSCREEN_MODE === -1 && WMSXFullScreenSetup.isBrowserStandaloneMode())))
        || WMSXFullScreenSetup.isBrowserStandaloneMode();
};

WMSXFullScreenSetup.isBrowserStandaloneMode = function() {
    return navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
};

WMSXFullScreenSetup.css = function() {
    return '' +
        'html.wmsx-full-screen .wmsx-full-screen-hidden {' +
        '   display: none;' +
        '}' +
        'html:not(.wmsx-full-screen) .wmsx-full-screen-only {' +
        '   display: none;' +
        '}' +
        'html.wmsx-full-screen, html.wmsx-full-screen body {' +
        '   background: black;' +
        '}';
};

if (!WMSXFullScreenSetup.applied) WMSXFullScreenSetup.apply();