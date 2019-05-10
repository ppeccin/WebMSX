// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

WMSXFullScreenSetup = {
    apply: function fullScreenSetup() {
        // Setup Basic full-screen CSS
        if (!this.cssApplied) {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = this.css;
            document.head.appendChild(style);
            this.cssApplied = true;
        }
        // Apply Standalone mode full-screen basic styles to html and body immediately if needed
        document.documentElement.classList.toggle("wmsx-full-screen", this.shouldStartInFullScreen());
    },
    shouldStartInFullScreen: function () {
        return window.WMSX
            ? WMSX.SCREEN_FULLSCREEN_MODE >= 1 || (WMSX.SCREEN_FULLSCREEN_MODE === -1 && this.isBrowserStandaloneMode())
            : this.isBrowserStandaloneMode();
    },
    isBrowserStandaloneMode: function () {
        return navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
    },
    css: '' +
        'html.wmsx-full-screen, html.wmsx-full-screen body {' +
        '   background: black;' +
        '}' +
        'html.wmsx-full-screen .wmsx-full-screen-hidden {' +
        '   display: none;' +
        '}' +
        'html:not(.wmsx-full-screen) .wmsx-full-screen-only {' +
        '   display: none;' +
        '}'
};
WMSXFullScreenSetup.apply();
