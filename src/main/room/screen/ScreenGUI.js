// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// CSS data for Screen

wmsx.ScreenGUI = {
    BAR_HEIGHT: 29,
    BAR_MENU_WIDTH: 136,
    BAR_MENU_ITEM_HEIGHT: 28
};

wmsx.ScreenGUI.html = function() {
    return `

        <div id="wmsx-screen-fs" tabindex="0">
            <div id="wmsx-screen-fs-center" tabindex="-1">
                <div id="wmsx-screen-canvas-outer">
                    <canvas id="wmsx-screen-canvas" tabindex="-1"></canvas>
                    <div id="wmsx-osd"></div>
                    <div id="wmsx-logo">
                        <img id="wmsx-logo-image" draggable="false" src="` + wmsx.Images.urls.logo + `">
                        <div id="wmsx-logo-message-fs">
                            For the best experience on<br>mobile devices, go full-screen
                            <div id="wmsx-logo-message-yes"></div>
                            <div id="wmsx-logo-message-no"></div>
                        </div>
                        <div id="wmsx-logo-message-add">
                            For the best experience, use<br>the "Add to Home Screen" option<br>then reopen from the new Icon
                            <div id="wmsx-logo-message-ok"></div>
                        </div>
                    </div>
                    <img id="wmsx-loading-icon" draggable="false" src="` + wmsx.Images.urls.loading + `">
                </div>
                <div id="wmsx-bar">
                    <div id="wmsx-bar-inner"></div>
                </div>
            </div>
            <div id="wmsx-screen-scroll-message">
                Swipe up/down on the Screen <br>to hide the browser bars!
            </div>
        </div>

        `;
};

wmsx.ScreenGUI.css = function() {
    return `

html.wmsx-started #` + WMSX.SCREEN_ELEMENT_ID + ` {
    visibility: visible;
}
html.wmsx-full-screen .wmsx-full-screen-hidden {
    display: none;
}
html:not(.wmsx-full-screen) .wmsx-full-screen-only {
    display: none;
}

html.wmsx-full-screen-hack body {
    position: absolute;
    width: 100%;
    height: ` + Math.max(1280, (Math.max(screen.width, screen.height) * 1.4) | 0) + `px;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    border: none;
    overflow-x: hidden;
    overflow-y: auto;
}

#wmsx-screen-fs, #wmsx-screen-fs div, #wmsx-screen-fs canvas {
    outline: none;
}

#` + WMSX.SCREEN_ELEMENT_ID + ` {
    display: inline-block;
    visibility: hidden;
    font-family: sans-serif;
    font-weight: normal;
    margin: 0;
    padding: 0;
    border: 1px solid black;
    background: black;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}
html.wmsx-full-screen-hack #` + WMSX.SCREEN_ELEMENT_ID + ` {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    box-shadow: none;
}

#wmsx-screen-scroll-message {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -50%;
    width: 0;
    height: 0;
    padding: 0;
    margin: 0 auto;
    font-size: 16px;
    line-height: 28px;
    color: hsl(0, 0%, 4%);
    white-space: nowrap;
    background: hsl(0, 0%, 92%);
    border-radius: 15px;
    box-shadow: 2px 2px 9px rgba(0, 0, 0, 0.7);
    transition: all 1.1s step-end, opacity 1s linear;
    opacity: 0;
    z-index: -1;
}
html.wmsx-full-screen-hack #wmsx-screen-fs.wmsx-scroll-message #wmsx-screen-scroll-message {
    opacity: 1;
    bottom: 23%;
    width: 215px;
    height: 56px;
    padding: 13px 20px;
    z-index: 10;
    transition: none;
}

#wmsx-screen-fs {
    position: relative;
    background: black;
    text-align: center;
    overflow: hidden;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
    tap-highlight-color: rgba(0,0,0,0)
}
html.wmsx-full-screen #wmsx-screen-fs {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
}
html.wmsx-full-screen-hack #wmsx-screen-fs {
    position: fixed;
    bottom: 0;
    height: 100vh;
}

html.wmsx-full-screen #wmsx-screen-fs-center {      /* Used to center and move things horizontally in Landscape Full Screen */
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

#wmsx-screen-canvas-outer {
    display: inline-block;
    position: relative;
    vertical-align: top;
    line-height: 1px;
    z-index: 3;
}

#wmsx-screen-canvas {
    display: block;
}

#wmsx-bar {
    position: relative;
    left: 0;
    right: 0;
    height: ` + wmsx.ScreenGUI.BAR_HEIGHT + `px;
    margin: 1px auto 0;
    background: rgba(45, 45, 45, .80);
    overflow: visible;                    /* for the Menu to show through */
    z-index: 5;
}
#wmsx-bar-inner {
    position: absolute;
    overflow: hidden;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: left;
}

html.wmsx-bar-auto-hide #wmsx-bar, html.wmsx-full-screen #wmsx-bar {
    position: absolute;
    bottom: 0;
    transition: height 0.3s ease-in-out;
}
html.wmsx-bar-auto-hide #wmsx-bar.wmsx-hidden {
    height: 0;
}
@media only screen and (orientation: landscape) {
    html.wmsx-full-screen #wmsx-bar.wmsx-hidden {
        height: 0;
    }
}

#wmsx-bar.wmsx-narrow .wmsx-narrow-hidden {
    display: none;
}

.wmsx-bar-button {
    display: inline-block;
    width: 24px;
    height: 23px;
    margin: 3px 1px 0;
    background-image: url("` + wmsx.Images.urls.sprites + `");
    background-repeat: no-repeat;
    background-size: 296px 81px;
    cursor: pointer;
}
/*
.wmsx-bar-button {
    border: 1px solid yellow;
    background-origin: border-box;
    box-sizing: border-box;
}
*/

#wmsx-bar-power {
    margin: 3px 12px 0 6px;
}
#wmsx-bar-settings, #wmsx-bar-full-screen, #wmsx-bar-scale-plus, #wmsx-bar-scale-minus {
    float: right;
    margin: 3px 0;
}
#wmsx-bar-settings {
    margin-right: 5px;
}
#wmsx-bar-scale-plus {
    width: 21px;
}
#wmsx-bar-scale-minus {
    width: 18px;
}
#wmsx-bar-keyboard {
    position: absolute;
    left: 0; right: 0;
    width: 37px;
    margin: 4px auto 0;
}
#wmsx-bar.wmsx-narrow #wmsx-bar-keyboard {
    position: static;
    float: right;
    margin: 4px 8px 0 0;
}
#wmsx-bar-logo {
    position: absolute;
    left: 0; right: 0;
    width: 52px;
    margin: 3px auto 0;
}


#wmsx-bar-menu {
    position: absolute;
    display: inline-block;
    height: 0;
    bottom: ` + wmsx.ScreenGUI.BAR_HEIGHT + `px;
    font-size: 13px;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
#wmsx-bar-menu-inner {
    display: inline-block;
    padding-bottom: 3px;
    border: 1px solid black;
    background: rgb(40, 40, 40);
}
.wmsx-bar-menu-item, #wmsx-bar-menu-title {
    position: relative;
    display: none;
    width: ` + wmsx.ScreenGUI.BAR_MENU_WIDTH + `px;
    height: ` + wmsx.ScreenGUI.BAR_MENU_ITEM_HEIGHT + `px;
    color: rgb(205, 205, 205);
    border: none;
    padding: 0;
    font: inherit;
    text-shadow: 1px 1px 1px black;
    background: transparent;
    outline: none;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    cursor: pointer;
}
#wmsx-bar-menu-title {
    display: block;
    color: white;
    font-weight: bold;
    border-bottom: 1px solid black;
    margin-bottom: 1px;
    text-align: center;
    background: rgb(70, 70, 70);
    cursor: auto;
}
.wmsx-bar-menu-item.wmsx-hover:not(.wmsx-bar-menu-item-disabled):not(.wmsx-bar-menu-item-divider) {
    color: white;
    background: hsl(0, 70%, 50%);
}
.wmsx-bar-menu-item-disabled {
    color: rgb(110, 110, 110);
}
.wmsx-bar-menu-item-divider {
    height: 1px;
    margin: 1px 0;
    background: black;
}
.wmsx-bar-menu-item-check {
    display: none;
    position: absolute;
    width: 6px;
    height: 19px;
    top: 4px;
    left: 9px;
    box-shadow: black 1px 1px 1px;
}
.wmsx-bar-menu-item-toggle {
    text-align: left;
    padding: 0 0 0 28px;
}
.wmsx-bar-menu-item-toggle .wmsx-bar-menu-item-check {
    display: block;
    background: rgb(70, 70, 70);
}
.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked {
    color: white;
}
.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked .wmsx-bar-menu-item-check {
    background: rgb(248, 33, 28);
}

#wmsx-screen-fs .wmsx-select-dialog {
    position: absolute;
    overflow: hidden;
    display: none;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 540px;
    max-width: 92%;
    height: 270px;
    max-height: 98%;
    margin: auto;
    color: white;
    font-size: 19px;
    background: rgb(40, 40, 40);
    padding: 20px 0 0;
    text-align: center;
    border: 1px solid black;
    box-sizing: initial;
    text-shadow: 1px 1px 1px black;
    box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    cursor: auto;
    z-index: 4;
}
#wmsx-screen-fs .wmsx-select-dialog.wmsx-show {
    display: block;
}
#wmsx-screen-fs .wmsx-select-dialog .wmsx-footer {
    position: absolute;
    width: 100%;
    bottom: 6px;
    font-size: 13px;
    text-align: center;
    color: rgb(170, 170, 170);
}
#wmsx-screen-fs .wmsx-select-dialog ul {
    position: relative;
    width: 88%;
    top: 15px;
    margin: auto;
    padding: 0;
    list-style: none;
    font-size: 14px;
    color: rgb(225, 225, 225);
}
#wmsx-screen-fs .wmsx-select-dialog li {
    display: none;
    overflow: hidden;
    height: 23px;
    background: rgb(70, 70, 70);
    margin: 7px 0;
    padding: 2px 10px;
    line-height: 15px;
    text-align: left;
    text-overflow: ellipsis;
    border: 2px dashed transparent;
    box-shadow: 1px 1px 1px rgba(0, 0, 0, .5);
    white-space: nowrap;
    box-sizing: border-box;
    cursor: pointer;
}
#wmsx-screen-fs .wmsx-select-dialog li.wmsx-visible {
    display: block;
}
#wmsx-screen-fs .wmsx-select-dialog li.wmsx-selected {
    color: white;
    background: rgb(220, 32, 26);
}
#wmsx-screen-fs .wmsx-select-dialog li.wmsx-droptarget {
    color: white;
    border-color: lightgray;
}

#wmsx-logo {
    position: absolute;
    display: none;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

html:not(.wmsx-full-screen) #wmsx-screen-fs.wmsx-logo-message-fs #wmsx-logo-image, html:not(.wmsx-full-screen) #wmsx-screen-fs.wmsx-logo-message-add #wmsx-logo-image {
    bottom: 36%;
}
html:not(.wmsx-full-screen) #wmsx-screen-fs.wmsx-logo-message-fs #wmsx-loading-icon, html:not(.wmsx-full-screen) #wmsx-screen-fs.wmsx-logo-message-add #wmsx-loading-icon {
    top: 41%;
}
html:not(.wmsx-full-screen) #wmsx-screen-fs.wmsx-logo-message-fs #wmsx-logo-message-fs, html:not(.wmsx-full-screen) #wmsx-screen-fs.wmsx-logo-message-add #wmsx-logo-message-add {
    display: block;
}

#wmsx-logo-image {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 334px;
    max-width: 60%;
    margin: auto;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

#wmsx-logo-message-fs, #wmsx-logo-message-add {
    display: none;
    position: absolute;
    left: 0; right: 0;
    top: 50%;
    bottom: 0px;
    color: hsl(0, 0%, 97%);
    font-size: 32px;
    line-height: 37px;
}

#wmsx-logo-message-yes, #wmsx-logo-message-no, #wmsx-logo-message-ok {
    position: absolute;
    top: 62%;
    width: 34%;
    height: 64%;
    transform: translate(-50%, -50%);
}
#wmsx-logo-message-yes { left: 33%; }
#wmsx-logo-message-no  { left: 67%; }
#wmsx-logo-message-ok  { top: 68%; left: 50%; }

#wmsx-logo-message-yes::after, #wmsx-logo-message-no::after, #wmsx-logo-message-ok::after {
    position: absolute;
    top: 49%;
    left: 50%;
    width: 100px;
    height: 50px;
    font-size: 27px;
    line-height: 50px;
    background: hsl(0, 70%, 50%);
    border-radius: 6px;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .65);
    transform: translate(-50%, -50%);
}
#wmsx-logo-message-yes::after { content: "YES"; }
#wmsx-logo-message-no::after  { content: "NO"; }
#wmsx-logo-message-ok::after  { content: "OK"; }

#wmsx-osd {
    position: absolute;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    top: -29px;
    right: 18px;
    height: 29px;
    max-width: 92%;
    padding: 0 12px;
    margin: 0;
    font-weight: bold;
    font-size: 15px;
    line-height: 29px;
    color: rgb(0, 255, 0);
    background: rgba(0, 0, 0, 0.7);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    opacity: 0;
}

#wmsx-loading-icon {
    position: absolute;
    display: none;
    top: 60%;
    left: 0;
    right: 0;
    height: 3%;
    width: 16%;
    margin: auto;
    background-color: rgba(0, 0, 0, .8);
    border: solid transparent;
    border-width: 12px 30px;
    border-radius: 3px;
    box-sizing: content-box;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

#wmsx-copy-texarea {
    position: absolute;
    width: 50px;
    height: 0;
    bottom: 0;
    z-index: -10;
    opacity: 0;
}

#wmsx-paste-cover {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    transition: opacity .1s ease-out;
    visibility: hidden;
    opacity: 0;
    z-index: 1;
}
#wmsx-paste-cover.wmsx-show {
    visibility: visible;
    opacity: 1;
}

#wmsx-paste-box {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 270px;
    height: 66px;
    margin: auto;
    background: rgba(255, 40, 40, 0.75);
    font-weight: bold;
    font-size: 26px;
    text-align: center;
    color: transparent;
    border: 2px dashed rgba(240, 240, 240, 0.70);
    box-sizing: initial;
    border-radius: 10px;
    text-shadow: 0 0 0 rgb(240, 240, 240);
    padding: 0;
    outline: none;
}


.wmsx-arrow-up, .wmsx-arrow-down, .wmsx-arrow-left, .wmsx-arrow-right {
    border: 0px solid transparent;
    box-sizing: border-box;
}
.wmsx-arrow-up    { border-bottom-color: inherit; }
.wmsx-arrow-down  { border-top-color: inherit; }
.wmsx-arrow-left  { border-right-color: inherit; }
.wmsx-arrow-right { border-left-color: inherit; }


.wmsx-keyboard-key {
    position: relative;
    display: inline-block;
    width: 26px;
    height: 25px;
    padding: 4px 0;
    margin-right: 1px;
    box-sizing: border-box;
    font-weight: normal;
    font-size: 10px;
    line-height: 11px;
    text-align: center;
    vertical-align: top;
    color: white;
    background: hsl(0, 0%, 66%);
    border: 3px solid hsl(0, 0%, 50%);
    border-top: 1px solid hsl(0, 0%, 54%);
    border-bottom: 5px solid hsl(0, 0%, 33%);
    border-radius: 3px 3px 0 0;
    box-shadow: 0 1px 0 1px rgb(0, 0, 0);
    cursor: pointer;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
.wmsx-keyboard-key.wmsx-keyboard-key-dark {
    background: hsl(0, 0%, 46%);
    border-color: hsl(0, 0%, 36%);
    border-top-color: hsl(0, 0%, 40%);
    border-bottom-color: hsl(0, 0%, 24%);
}
.wmsx-keyboard-key.wmsx-keyboard-key-unmapped {
    color: rgb(30, 30, 30);
    font-weight: bold;
    -webkit-font-smoothing: initial;
    -moz-osx-font-smoothing: initial;
}
.wmsx-keyboard-alpha, .wmsx-keyboard-num, .wmsx-keyboard-arrows {
    position: absolute;
}
.wmsx-keyboard-num {
    left: 417px;
}
.wmsx-keyboard-arrows {
    top: 104px;
    left: 417px;
}
.wmsx-keyboard-f1, .wmsx-keyboard-f2, .wmsx-keyboard-f3, .wmsx-keyboard-f4, .wmsx-keyboard-f5,
.wmsx-keyboard-stop, .wmsx-keyboard-select, .wmsx-keyboard-home, .wmsx-keyboard-insert, .wmsx-keyboard-delete {
    width: 39px;
    height: 18px;
    padding: 2px 0;
    font-size: 9px;
    line-height: 9px;
    border-width: 1px 2px 4px;
    margin-bottom: 7px;
}
.wmsx-keyboard-stop {
    margin-left: 10px;
    background: rgb(240, 80, 60);
    border-color: hsl(7, 85%, 40%);
    border-top-color: hsl(7, 85%, 48%);
    border-bottom-color: hsl(7, 85%, 30%);
}
.wmsx-keyboard-escape {
    width: 29px;
}
.wmsx-keyboard-backspace {
    width: 28px;
}
.wmsx-keyboard-tab {
    width: 41px;
}
.wmsx-keyboard-control {
    width: 48px;
}
.wmsx-keyboard-shift, .wmsx-keyboard-shift2 {
    width: 61px;
}
.wmsx-keyboard-enter {
    width: 36px;
    border-radius: 2px 3px 0 0;
    border-top: none;
    box-shadow: none;
}
.wmsx-keyboard-enter_x1 {
    width: 13px;
    min-width: 0;
    margin-right: 0;
    border-radius: 2px 0 0 0;
    border-width: 1px;
    border-right: none;
    box-shadow: -1px 1px 0 0 black;
}
.wmsx-keyboard-enter_x2 {
    position: relative;
    width: 30px;
    padding: 0;
    border: none;
    border-radius: 0 3px 0 0;
    box-shadow: none;
    box-shadow: 1px 1px 0 0 black;
}
.wmsx-keyboard-enter_x2::after {
    content: "";
    display: block;
    position: relative;
    width: 30px;
    height: 50px;
    background: inherit;
    border: 3px solid hsl(0, 0%, 36%);
    border-top: 1px solid hsl(0, 0%, 40%);
    border-bottom: 5px solid hsl(0, 0%, 24%);
    border-radius: 0 3px 0 0;
    box-shadow: 1px 2px 0 0 black, 1px 0 0 0 black;
    box-sizing: border-box;
}
.wmsx-keyboard-space {
    width: 189px;
    background: rgb(172, 172, 172);
}
.wmsx-keyboard-capslock {
    margin-left: 16px;
    width: 38px;
}
.wmsx-keyboard-dead {
    width: 38px;
}
.wmsx-keyboard-graph, .wmsx-keyboard-code {
    width: 46px;
}
.wmsx-keyboard-num .wmsx-keyboard-key {
    width: 22px;
    height: 23px;
    line-height: 9px;
}
.wmsx-keyboard-arrows .wmsx-keyboard-key {
    font-size: 8px;
    line-height: 9px;
    background: rgb(70, 85, 180);
    border-width: 1px 2px 4px;
    border-radius: 2px 2px 0 0;
    border-color: hsl(232, 44%, 37%);
    border-top-color: hsl(232, 44%, 40%);
    border-bottom-color: hsl(232, 44%, 24%);
}
.wmsx-keyboard-left, .wmsx-keyboard-right {
    top: 5px;
    width: 25px;
    height: 35px;
    padding-top: 11px;
}
.wmsx-keyboard-up, .wmsx-keyboard-down {
    width: 39px;
    height: 23px;
    padding-top: 5px;
}
.wmsx-keyboard-down {
    position: absolute;
    top: 23px;
    left: 26px;
}


#wmsx-virtual-keyboard {
    display: none;
    position: absolute;
    left: 50%;
    bottom: ` + ( wmsx.ScreenGUI.BAR_HEIGHT + 3) + `px;
    margin: 0 auto;
    padding: 5px 0 0 5px;
    width: 518px;
    height: 161px;
    background: hsl(0, 0%, 19%);
    box-sizing: border-box;
    transform: translateX(-50%);
    transform-origin: center bottom;
    transition: height 0.3s ease-in-out;
    text-align: left;
    z-index: 2;
}
html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-virtual-keyboard {
    display: block;
}

#wmsx-touch-config {
    display: none;
    position: absolute;
    top: 0; bottom: 0;
    left: 0; right: 0;
    width: 220px;
    height: 189px;
    margin: auto;
    padding: 16px 0 0;
    color: white;
    font-size: 19px;
    line-height: 23px;
    background: rgb(40, 40, 40);
    text-align: center;
    border: 1px solid black;
    box-sizing: initial;
    text-shadow: 1px 1px 1px black;
    box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    cursor: auto;
    z-index: 3;
}
#wmsx-screen-fs.wmsx-touch-config-active #wmsx-touch-config {
    display: block;
}
#wmsx-touch-config::before {
    content: "";
    position: absolute;
    top: 74px;
    left: 12px;
    width: 196px;
    height: 80px;
    background: black;
}

#wmsx-touch-config-minus, #wmsx-touch-config-plus {
    position: absolute;
    top: 74px;
    width: 60px;
    height: 80px;
    cursor: pointer;
}
#wmsx-touch-config-minus {
    left: 12px;
}
#wmsx-touch-config-plus {
    right: 12px;
}

#wmsx-touch-config-minus::after, #wmsx-touch-config-plus::after {
    content: "";
    position: absolute;
    top: 27px;
    border: 12px solid transparent;
}
#wmsx-touch-config-minus::after {
    left: 0;
    border-right: 23px solid hsl(0, 0%, 80%);
}
#wmsx-touch-config-minus.wmsx-disabled::after {
    border-right-color: hsl(0, 0%, 40%);
}
#wmsx-touch-config-plus::after {
    right: 0;
    border-left: 23px solid hsl(0, 0%, 80%);
}
#wmsx-touch-config-plus.wmsx-disabled::after {
    border-left-color: hsl(0, 0%, 40%);
}

#wmsx-touch-config-p1, #wmsx-touch-config-p2, #wmsx-touch-config-off {
    position: absolute;
    bottom: 12px;
    width: 57px;
    height: 26px;
    font-size: 15px;
    line-height: 22px;
    color: hsl(0, 0%, 70%);
    background: black;
    border: 2px solid transparent;
    box-sizing: border-box;
    cursor: pointer;
}
#wmsx-touch-config-p1 {
    left: 12px;
}
#wmsx-touch-config-p2 {
    left: 81px;
}
#wmsx-touch-config-off {
    right: 12px;
    width: 58px;
}
#wmsx-touch-config-p1.wmsx-selected, #wmsx-touch-config-p2.wmsx-selected, #wmsx-touch-config-off.wmsx-selected {
    color: white;
    text-shadow: 1px 1px 1px black;
    background: hsl(0, 70%, 50%);
    box-shadow: 1px 1px 1px rgba(0, 0, 0, .5);
}
#wmsx-touch-config-p1.wmsx-selected.wmsx-selected-inactive, #wmsx-touch-config-p2.wmsx-selected.wmsx-selected-inactive, #wmsx-touch-config-off.wmsx-selected.wmsx-selected-inactive {
    border: 2px dashed hsl(0, 70%, 50%);
    background: black;
    box-shadow: none;
}

#wmsx-touch-config-dir {
    display: none;
    position: absolute;
    top: 49px;
    left: 45px;
    transform: scale(.75);
}
#wmsx-touch-config-dir.wmsx-show {
    display: block;
}
#wmsx-touch-config-dir::before {
    display: none;
}

#wmsx-touch-config-button {
    display: none;
    position: absolute;
    top: 79px;
    left: 74px;
    text-shadow: none;
}
#wmsx-touch-config-button.wmsx-show {
    display: block;
}

#wmsx-touch-left, #wmsx-touch-right {
    display: none;
    position: absolute;
    z-index: 1;
}

html.wmsx-full-screen.wmsx-touch-active #wmsx-touch-left, html.wmsx-full-screen.wmsx-touch-active #wmsx-touch-right {
    display: block;
}

.wmsx-touch-dir {
    width: 130px;
    height: 130px;
    color: hsl(0, 0%, 75%);
    border-radius: 100%;
}
.wmsx-touch-dir::before {
    content: "";
    position: absolute;
    top: 14px; left: 14px;
    right: 14px; bottom: 14px;
    border: 1px solid hsl(0, 0%, 26%);
    border-radius: 100%;
}

.wmsx-touch-dir-joy .wmsx-touch-dir-up, .wmsx-touch-dir-joy .wmsx-touch-dir-left {
    position: absolute;
    background: hsl(0, 0%, 31%);
    border-radius: 2px 2px 0 0;
    box-shadow: inset 1px 2px 0px hsl(0, 0%, 43%), inset -1px -1px hsl(0, 0%, 19%), 0 3px 0 1px hsl(0, 0%, 21%);
}
.wmsx-touch-dir-joy .wmsx-touch-dir-up {
    width: 26px;
    height: 78px;
    top: 24px;
    left: 52px;
}
.wmsx-touch-dir-joy .wmsx-touch-dir-left {
    width: 78px;
    height: 25px;
    top: 51px;
    left: 26px;
}
.wmsx-touch-dir-joy .wmsx-touch-dir-left::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 23px;
    width: 33px;
    height: 22px;
    background: inherit;
    z-index: 1;
}
.wmsx-touch-dir-joy .wmsx-touch-dir-left::after {
    content: "";
    position: absolute;
    top: 4px;
    left: 30px;
    height: 17px;
    width: 17px;
    border-radius: 100%;
    box-shadow:  inset 0 0 2px hsl(0, 0%, 22%), inset 1px 2px 3px 1px hsl(0, 0%, 26%), inset -1px -2px 1px hsl(0, 0%, 64%);
    z-index: 2;
}


.wmsx-touch-dir-key .wmsx-touch-dir-up, .wmsx-touch-dir-key .wmsx-touch-dir-left, .wmsx-touch-dir-key .wmsx-touch-dir-down, .wmsx-touch-dir-key .wmsx-touch-dir-right {
    position: absolute;
    background: rgb(70, 85, 180);
    border: 0 solid hsl(232, 44%, 37%);
    border-width: 1px 2px 4px;
    border-top-color: hsl(232, 44%, 40%);
    border-bottom-color: hsl(232, 44%, 24%);
    border-radius: 2px 2px 0 0;
    box-sizing: border-box;
}
.wmsx-touch-dir-key .wmsx-touch-dir-up, .wmsx-touch-dir-key .wmsx-touch-dir-down {
    left: 50px;
    width: 30px;
}
.wmsx-touch-dir-key .wmsx-touch-dir-up {
    top: 26px;
    height: 26px;
    border-bottom-width: 2px;
}
.wmsx-touch-dir-key .wmsx-touch-dir-down {
    bottom: 26px;
    height: 28px;
}
.wmsx-touch-dir-key .wmsx-touch-dir-left, .wmsx-touch-dir-key .wmsx-touch-dir-right {
    top: 47px;
    width: 25px;
    height: 36px;
}
.wmsx-touch-dir-key .wmsx-touch-dir-left {
    left: 24px;
}
.wmsx-touch-dir-key .wmsx-touch-dir-right {
    right: 24px;
}
.wmsx-touch-dir-key .wmsx-touch-dir-up::after {
    content: "";
    position: absolute;
    top: 28px;
    left: 0px;
    width: 26px;
    height: 18px;
    background: hsl(0, 0%, 20%);
}

.wmsx-touch-dir .wmsx-arrow-up, .wmsx-touch-dir .wmsx-arrow-down, .wmsx-touch-dir .wmsx-arrow-left, .wmsx-touch-dir .wmsx-arrow-right {
    position: absolute;
    border-width: 5px;
    z-index: 2;
}
.wmsx-touch-dir .wmsx-arrow-up {
    top: 26px;
    left: 60px;
    border-bottom-width: 11px;
}
.wmsx-touch-dir .wmsx-arrow-down {
    bottom: 29px;
    left: 60px;
    border-top-width: 11px;
}
.wmsx-touch-dir .wmsx-arrow-left {
    top: 58px;
    left: 26px;
    border-right-width: 11px;
}
.wmsx-touch-dir .wmsx-arrow-right {
    top: 58px;
    right: 26px;
    border-left-width: 11px;
}

.wmsx-touch-button {
    position: relative;
    display: block;
    width: 72px;
    height: 72px;
    font-size: 20px;
    line-height: 68px;
    color: hsl(0, 0%, 79%);
    border-radius: 100%;
    cursor: default;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    z-index: 0;
}

.wmsx-touch-button::before {
    content: "";
    position: absolute;
    box-sizing: border-box;
    z-index: -1;
}

.wmsx-touch-button-joy::before, .wmsx-touch-button-none::before {
    width: 50px;
    height: 48px;
    top: 9px;
    left: 11px;
    border-radius: 100%;
}
#wmsx-screen-fs.wmsx-touch-config-active .wmsx-touch-button-none::before {
    border: 2px solid hsl(0, 0%, 30%);
}

.wmsx-touch-button-joy.wmsx-touch-button-joy-A::before {
    border: none;
    background: hsl(120, 76%, 32%);
    box-shadow: inset 0 2px hsl(120, 76%, 41%), 0 4px 0 1px hsl(120, 76%, 20%);
}
.wmsx-touch-button-joy.wmsx-touch-button-joy-B::before {
    border: none;
    background: hsl(0, 60%, 37%);
    box-shadow: inset 0 2px hsl(0, 60%, 48%), 0 4px 0 1px hsl(0, 60%, 27%);
}
.wmsx-touch-button-joy.wmsx-touch-button-joy-AB::before {
    border: none;
    background: hsl(240, 50%, 48%);
    box-shadow: inset 0 2px hsl(240, 50%, 60%), 0 4px 0 1px hsl(240, 50%, 31%);
}

.wmsx-touch-button-key {
    font-size: 16px;
    line-height: 70px;
}
.wmsx-touch-button-key::before {
    width: 48px;
    height: 46px;
    top: 13px;
    left: 12px;
    background: hsl(0, 0%, 44%);
    border: 4px solid hsl(0, 0%, 31%);
    border-top: 2px solid hsl(0, 0%, 54%);
    border-bottom: 6px solid hsl(0, 0%, 22%);
    border-radius: 3px 3px 1px 1px;
}

#wmsx-touch-T_A { z-index: 7 }
#wmsx-touch-T_B { z-index: 6 }
#wmsx-touch-T_C { z-index: 5 }
#wmsx-touch-T_D { z-index: 4 }
#wmsx-touch-T_E { z-index: 3 }
#wmsx-touch-T_F { z-index: 2 }
#wmsx-touch-T_G { z-index: 1 }

@media only screen and (orientation: landscape) {    /* Landscape */
    #wmsx-touch-left {
        left: calc(-6px - 117px);
        bottom: 50%;
        transform: translateY(50%);
    }
    #wmsx-touch-right {
        right: calc(7px - 85px);
        bottom: 50%;
        transform: translateY(50%);
    }

    /* Adjust centered elements leaving space to the touch controls on both sides */
    html.wmsx-full-screen.wmsx-touch-active #wmsx-screen-fs-center {
        left: ` + wmsx.DOMTouchControls.LEFT_WIDTH + `px;
        right: ` + wmsx.DOMTouchControls.RIGHT_WIDTH + `px;
    }
}

@media only screen and (orientation: landscape) and (max-height: 511px) {    /* Medium Landscape */
    #wmsx-touch-T_F, #wmsx-touch-T_G {
        display: none;
    }
}

@media only screen and (orientation: landscape) and (max-height: 359px) {    /* Short Landscape */
    #wmsx-touch-T_E {
        display: none;
    }
}

@media only screen and (orientation: portrait) {    /* Portrait */

    #wmsx-touch-left {
        left: 3px;
        bottom: 183px;
    }
    #wmsx-touch-right {
        right: 7px;
        bottom: 38px;
        width: 112px;
        height: 224px;
    }

    .wmsx-touch-button {
        position: absolute;
    }
    #wmsx-touch-T_A {
        bottom: 75%;
        right: 50%;
    }
    #wmsx-touch-T_B {
        bottom: 100%;
        right: 0%;
    }
    #wmsx-touch-T_C {
        bottom: 50%;
        right: 100%;
    }
    #wmsx-touch-T_D {
        bottom: 25%;
        right: 50%;
    }
    #wmsx-touch-T_E {
        bottom: 50%;
        right: 0%;
    }
    #wmsx-touch-T_F {
        bottom: 0%;
        right: 100%;
    }
    #wmsx-touch-T_G {
        bottom: 0%;
        right: 0%;
    }

    html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-touch-left, html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-touch-right {
        display: none;
    }

}

@media only screen and (orientation: portrait) and (max-device-height: 638px) {    /* Medium Portrait. Like iPhone 5 */

    #wmsx-touch-T_F, #wmsx-touch-T_G {
        display: none;
    }

    #wmsx-touch-left {
        bottom: 154px;
    }
    #wmsx-touch-right {
        bottom: -18px;
    }

}

@media only screen and (orientation: portrait) and (max-device-height: 518px) {    /* Short Portrait. Like iPhone 4 */

    #wmsx-touch-T_E {
        display: none;
    }

    #wmsx-touch-left {
        bottom: 98px;
    }
    #wmsx-touch-right {
        bottom: -74px;
    }

    #wmsx-touch-T_D {
        bottom: 50%;
        right: 0%;
    }

}

`;

};
