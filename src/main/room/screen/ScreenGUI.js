// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// CSS data for Screen

wmsx.ScreenGUI = {
    BAR_HEIGHT: 29,
    BAR_MENU_WIDTH: 136,
    BAR_MENU_ITEM_HEIGHT: 28
};

wmsx.ScreenGUI.css = `

html.wmsx-full-screen .wmsx-full-screen-hidden {
    display: none;
}

/* Full Screen by hack */
html.wmsx-full-screen, html.wmsx-full-screen body {
    position: absolute;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    border: none;
}
html.wmsx-full-screen body {
    height: calc(100vh + 200px);
}

#wmsx-screen {
    font-family: sans-serif;
    font-weight: normal;
}
#wmsx-screen, #wmsx-screen div, #wmsx-screen canvas {
    outline: none;
}

#wmsx-screen {
    display: inline-block;
    border: 1px solid black;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    background: black;
}
html.wmsx-full-screen #wmsx-screen {
    width: 0;
    height: 0;
    border: none;
    box-shadow: none;
    box-sizing: border-box;
}

#wmsx-screen-fs {
    position: relative;
    background: black;
    overflow: hidden;
}
html.wmsx-full-screen #wmsx-screen-fs {
    position: absolute;
    width: 100vw;
    height: 100vh;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
}

#wmsx-screen-canvas-outer {
    display: inline-block;
    position: relative;
    vertical-align: top;
    line-height: 1px;
}

#wmsx-screen-canvas {
    display: block;
    margin: auto;
}

#wmsx-bar {
    position: relative;
    left: 0;
    right: 0;
    height: ` + wmsx.ScreenGUI.BAR_HEIGHT + `px;
    margin: 1px auto 0;
    background: rgba(45, 45, 45, .80);
    overflow: visible;                    /* for the Menu to show through */
    z-index: 30;
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
html.wmsx-bar-auto-hide #wmsx-bar.wmsx-hidden, html.wmsx-full-screen #wmsx-bar.wmsx-hidden {
    height: 0;
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
    background: rgb(220, 32, 26);
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

#wmsx-screen .wmsx-select-dialog {
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
}
#wmsx-screen .wmsx-select-dialog.wmsx-show {
    display: block;
}
#wmsx-screen .wmsx-select-dialog .wmsx-footer {
    position: absolute;
    width: 100%;
    bottom: 6px;
    font-size: 13px;
    text-align: center;
    color: rgb(170, 170, 170);
}
#wmsx-screen .wmsx-select-dialog ul {
    position: relative;
    width: 88%;
    top: 15px;
    margin: auto;
    padding: 0;
    list-style: none;
    font-size: 14px;
    color: rgb(225, 225, 225);
}
#wmsx-screen .wmsx-select-dialog li {
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
#wmsx-screen .wmsx-select-dialog li.wmsx-visible {
    display: block;
}
#wmsx-screen .wmsx-select-dialog li.wmsx-selected {
    color: white;
    background: rgb(220, 32, 26);
}
#wmsx-screen .wmsx-select-dialog li.wmsx-droptarget {
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
    width: 334px;
    max-width: 60%;
    margin: auto;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

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
    z-index: 10;
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


.wmsx-keyboard-key {
    position: relative;
    display: inline-block;
    width: 25px;
    height: 24px;
    padding: 4px 0;
    margin-right: 1px;
    box-sizing: border-box;
    font-weight: normal;
    font-size: 10px;
    line-height: 10px;
    text-align: center;
    vertical-align: top;
    color: white;
    background: hsl(0, 0%, 67%);
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
    background: rgb(127, 127, 127);
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
    left: 413px;
}
.wmsx-keyboard-arrows {
    top: 106px;
    left: 413px;
}
.wmsx-keyboard-f1, .wmsx-keyboard-f2, .wmsx-keyboard-f3, .wmsx-keyboard-f4, .wmsx-keyboard-f5,
.wmsx-keyboard-stop, .wmsx-keyboard-select, .wmsx-keyboard-home, .wmsx-keyboard-insert, .wmsx-keyboard-delete {
    width: 37px;
    height: 18px;
    padding: 2px 0;
    font-size: 9px;
    line-height: 9px;
    border-width: 1px 2px 4px;
    margin-bottom: 12px;
    background: rgb(172, 172, 172);
}
.wmsx-keyboard-stop {
    margin-left: 18px;
    background: rgb(240, 80, 60);
    border-color: hsl(7, 85%, 40%);
    border-top-color: hsl(7, 85%, 48%);
    border-bottom-color: hsl(7, 85%, 30%);
}
.wmsx-keyboard-escape, .wmsx-keyboard-backspace {
    width: 29px;
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
    height: 48px;
    background: rgb(127, 127, 127);
    border: 3px solid hsl(0, 0%, 36%);
    border-top: 1px solid hsl(0, 0%, 40%);
    border-bottom: 5px solid hsl(0, 0%, 24%);
    border-radius: 0 3px 0 0;
    box-shadow: 1px 2px 0 0 black, 1px 0 0 0 black;
    box-sizing: border-box;
}
.wmsx-keyboard-space {
    width: 181px;
    background: rgb(172, 172, 172);
}
.wmsx-keyboard-capslock {
    margin-left: 15px;
    width: 38px;
}
.wmsx-keyboard-dead {
    width: 38px;
}
.wmsx-keyboard-graph, .wmsx-keyboard-code {
    width: 46px;
}
.wmsx-keyboard-num .wmsx-keyboard-key {
    width: 23px;
    height: 23px;
}
.wmsx-keyboard-arrows .wmsx-keyboard-key {
    font-size: 8px;
    line-height: 8px;
    background: rgb(70, 85, 180);
    border-width: 1px 2px 4px;
    border-radius: 2px 2px 0 0;
    border-color: hsl(232, 44%, 37%);
    border-top-color: hsl(232, 44%, 40%);
    border-bottom-color: hsl(232, 44%, 24%);
}
.wmsx-keyboard-left, .wmsx-keyboard-right {
    top: 5px;
    width: 26px;
    height: 34px;
    padding-top: 11px;
}
.wmsx-keyboard-up, .wmsx-keyboard-down {
    width: 41px;
    height: 22px;
    padding-top: 5px;
}
.wmsx-keyboard-down {
    position: absolute;
    top: 22px;
    left: 27px;
}


#wmsx-virtual-keyboard {
    display: none;
    position: absolute;
    left: 50%;
    bottom: ` + ( wmsx.ScreenGUI.BAR_HEIGHT + 4) + `px;
    margin: 0 auto;
    padding: 6px 0 0 6px;
    width: 520px;
    height: 163px;
    background: rgb(55, 55, 55);
    box-sizing: border-box;
    transform: translateX(-50%);
    transform-origin: center bottom;
    transition: height 0.3s ease-in-out;
}
html.wmsx-full-screen.wmsx-virtual-keyboard-showing #wmsx-virtual-keyboard {
    display: block;
}


#wmsx-touch-left, #wmsx-touch-right {
    display: none;
    position: absolute;
    z-index: -5;
}

html.wmsx-full-screen #wmsx-touch-left, html.wmsx-full-screen #wmsx-touch-right {
    display: block;
}
html.wmsx-touch-disabled #wmsx-touch-left, html.wmsx-touch-disabled #wmsx-touch-right {
    display: none;
}
@media only screen and (orientation: portrait) {
    html.wmsx-full-screen.wmsx-virtual-keyboard-showing #wmsx-touch-left, html.wmsx-full-screen.wmsx-virtual-keyboard-showing #wmsx-touch-right {
        display: none;
    }
}

#wmsx-touch-dir {
    width: 130px;
    height: 130px;
    border-radius: 100%;
}
#wmsx-touch-dir::before {
    content: "";
    display: block;
    position: absolute;
    width: 80px;
    height: 80px;
    top: 25px;
    left: 25px;
    border: 2px solid rgba(255, 255, 255, .5);
    border-radius: 100%;
    box-sizing: border-box;
}
#wmsx-touch-dir::after {
    content: "";
    display: block;
    position: absolute;
    width: 46px;
    height: 46px;
    top: 42px;
    left: 42px;
    background: rgba(255, 255, 255, .3);
    border-radius: 100%;
    box-sizing: border-box;
}

.wmsx-touch-button {
    width: 76px;
    height: 76px;
    border-radius: 100%;
}
.wmsx-touch-button::after {
    content: "";
    display: block;
    position: relative;
    width: 60px;
    height: 60px;
    top: 8px;
    left: 8px;
    font-size: 20px;
    line-height: 56px;
    color: rgba(255, 255, 255, .65);
    border: 2px solid rgba(255, 255, 255, .5);
    border-radius: 100%;
    box-sizing: border-box;
}
#wmsx-touch-a:after {
    content: "A";
}
#wmsx-touch-b:after {
    content: "B";
}
#wmsx-touch-x:after {
    content: "X";
}
#wmsx-touch-y:after {
    content: "Y";
}

@media only screen and (orientation: landscape) {
    #wmsx-touch-left {
        left: -11px;
        bottom: 50%;
        transform: translateY(50%);
    }
    #wmsx-touch-right {
        right: 14px;
        bottom: 50%;
        transform: translateY(50%);
    }
}

@media only screen and (orientation: portrait) {    /* Wide Portrait */

    #wmsx-touch-left {
        left: 106px;
        bottom: 185px;
        transform: translate(-50%, 50%);
    }
    #wmsx-touch-right {
        right: 140px;
        bottom: 185px;
        width: 190px;
        height: 190px;
        transform: translate(50%, 50%);
    }

    .wmsx-touch-button {
        position: absolute;
    }
    #wmsx-touch-a {
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
    }
    #wmsx-touch-b {
        top: 50%;
        right: 0;
        transform: translateY(-50%);
    }
    #wmsx-touch-x {
        top: 50%;
        left: 0;
        transform: translateY(-50%);
    }
    #wmsx-touch-y {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
    }
}

@media only screen and (orientation: portrait) and (max-device-width: 511px) {   /* Medium Wide Portrait */
    #wmsx-touch-left {
        left: 80px;
        bottom: 150px;
    }
    #wmsx-touch-right {
        right: 120px;
        bottom: 150px;
    }
}

@media only screen and (orientation: portrait) and (max-device-width: 399px) {   /* Narrow Portrait */
    #wmsx-touch-left {
        left: 66px;
        bottom: 100px;
    }
    #wmsx-touch-right {
        right: 110px;
        bottom: 180px;
    }
}

`;
