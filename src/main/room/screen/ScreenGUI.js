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
html:not(.wmsx-full-screen) .wmsx-full-screen-only {
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
    z-index: 20;
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
    bottom: ` + ( wmsx.ScreenGUI.BAR_HEIGHT + 4) + `px;
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
}
html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-virtual-keyboard {
    display: block;
}


#wmsx-touch-left, #wmsx-touch-right {
    display: none;
    position: absolute;
}

html.wmsx-full-screen.wmsx-touch-active #wmsx-touch-left, html.wmsx-full-screen.wmsx-touch-active #wmsx-touch-right {
    display: block;
}

@media only screen and (orientation: portrait) {
    html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-touch-left, html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-touch-right {
        display: none;
    }
}


.wmsx-arrow-up, .wmsx-arrow-down, .wmsx-arrow-left, .wmsx-arrow-right {
    border: 0px solid transparent;
    box-sizing: border-box;
}
.wmsx-arrow-up    { border-bottom-color: inherit; }
.wmsx-arrow-down  { border-top-color: inherit; }
.wmsx-arrow-left  { border-right-color: inherit; }
.wmsx-arrow-right { border-left-color: inherit; }


#wmsx-touch-dir {
    width: 130px;
    height: 130px;
    color: hsl(0, 0%, 72%);
    border-radius: 100%;
}
#wmsx-touch-dir::after {
    content: "";
    position: absolute;
    top: 14px; left: 14px;
    right: 14px; bottom: 14px;
    border: 1px solid hsl(0, 0%, 26%);
    border-radius: 100%;
}

.wmsx-touch-dir-joy #wmsx-touch-dir-up, .wmsx-touch-dir-joy #wmsx-touch-dir-left {
    position: absolute;
    background: hsl(0, 0%, 31%);
    border-radius: 2px 2px 0 0;
    box-shadow: inset 1px 2px 0px hsl(0, 0%, 43%), inset -1px -1px hsl(0, 0%, 19%), 0 3px 0 1px hsl(0, 0%, 21%);
}
.wmsx-touch-dir-joy #wmsx-touch-dir-up {
    width: 26px;
    height: 78px;
    top: 24px;
    left: 52px;
}
.wmsx-touch-dir-joy #wmsx-touch-dir-left {
    width: 78px;
    height: 25px;
    top: 51px;
    left: 26px;
}
.wmsx-touch-dir-joy #wmsx-touch-dir-left::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 23px;
    width: 33px;
    height: 22px;
    background: inherit;
    z-index: 1;
}
.wmsx-touch-dir-joy #wmsx-touch-dir-left::after {
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


.wmsx-touch-dir-key #wmsx-touch-dir-up, .wmsx-touch-dir-key #wmsx-touch-dir-left, .wmsx-touch-dir-key #wmsx-touch-dir-down, .wmsx-touch-dir-key #wmsx-touch-dir-right {
    position: absolute;
    background: rgb(70, 85, 180);
    border: 0 solid hsl(232, 44%, 37%);
    border-width: 1px 2px 4px;
    border-top-color: hsl(232, 44%, 40%);
    border-bottom-color: hsl(232, 44%, 24%);
    border-radius: 2px 2px 0 0;
    box-sizing: border-box;
}
.wmsx-touch-dir-key #wmsx-touch-dir-up, .wmsx-touch-dir-key #wmsx-touch-dir-down {
    left: 50px;
    width: 30px;
}
.wmsx-touch-dir-key #wmsx-touch-dir-up {
    top: 26px;
    height: 26px;
    border-bottom-width: 2px;
}
.wmsx-touch-dir-key #wmsx-touch-dir-down {
    bottom: 26px;
    height: 28px;
}
.wmsx-touch-dir-key #wmsx-touch-dir-left, .wmsx-touch-dir-key #wmsx-touch-dir-right {
    top: 47px;
    width: 25px;
    height: 36px;
}
.wmsx-touch-dir-key #wmsx-touch-dir-left {
    left: 24px;
}
.wmsx-touch-dir-key #wmsx-touch-dir-right {
    right: 24px;
}
.wmsx-touch-dir-key #wmsx-touch-dir-up::after {
    content: "";
    position: absolute;
    top: 28px;
    left: 0px;
    width: 26px;
    height: 18px;
    background: hsl(0, 0%, 20%);
}

#wmsx-touch-dir .wmsx-arrow-up, #wmsx-touch-dir .wmsx-arrow-down, #wmsx-touch-dir .wmsx-arrow-left, #wmsx-touch-dir .wmsx-arrow-right {
    position: absolute;
    border-width: 5px;
    z-index: 2;
}
#wmsx-touch-dir .wmsx-arrow-up {
    top: 26px;
    left: 60px;
    border-bottom-width: 11px;
}
#wmsx-touch-dir .wmsx-arrow-down {
    bottom: 29px;
    left: 60px;
    border-top-width: 11px;
}
#wmsx-touch-dir .wmsx-arrow-left {
    top: 58px;
    left: 26px;
    border-right-width: 11px;
}
#wmsx-touch-dir .wmsx-arrow-right {
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
    color: hsl(0, 0%, 77%);
    border-radius: 100%;
    cursor: default;
}

.wmsx-touch-button::before {
    content: "";
    position: absolute;
    box-sizing: border-box;
    z-index: -1;
}

.wmsx-touch-button-joy::before {
    width: 50px;
    height: 48px;
    top: 09px;
    left: 11px;
    border: 2px solid hsl(0, 0%, 47%);
    border-radius: 100%;
}
.wmsx-touch-button-joy.wmsx-touch-button-joy-A::before {
    border: none;
    background: hsl(120, 76%, 32%);
    box-shadow: inset 0 2px hsl(120, 76%, 41%), 0 4px 0 1px hsl(120, 76%, 22%);
}
.wmsx-touch-button-joy.wmsx-touch-button-joy-B::before {
    border: none;
    background: hsl(0, 60%, 37%);
    box-shadow: inset 0 2px hsl(0, 60%, 48%), 0 4px 0 1px hsl(0, 60%, 27%);
}
.wmsx-touch-button-joy.wmsx-touch-button-joy-AB::before {
    border: none;
    background: hsl(240, 50%, 48%);
    box-shadow: inset 0 2px hsl(240, 50%, 60%), 0 4px 0 1px hsl(240, 50%, 33%);
}

.wmsx-touch-button-key {
    font-size: 16px;
    line-height: 68px;
}
.wmsx-touch-button-key::before {
    width: 50px;
    height: 49px;
    top: 11px;
    left: 12px;
    background: hsl(0, 0%, 47%);
    border: 5px solid hsl(0, 0%, 33%);
    border-top: 3px solid hsl(0, 0%, 55%);
    border-bottom: 8px solid hsl(0, 0%, 22%);
    border-radius: 4px 4px 1px 1px;
}

@media only screen and (orientation: landscape) {    /* Landscape */
    #wmsx-touch-left {
        left: -6px;
        bottom: 50%;
        transform: translateY(50%);
    }
    #wmsx-touch-right {
        right: 7px;
        bottom: 50%;
        transform: translateY(50%);
    }

    /* Adjust centered elements leaving space to the touch controls on both sides */
    html.wmsx-full-screen.wmsx-touch-active #wmsx-screen-fs-center {
        left: 117px;
        right: 85px;
    }
}

@media only screen and (orientation: landscape) and (max-height: 511px) {    /* Medium Landscape */
    #wmsx-touch-T_F, #wmsx-touch-T_G {
        display: none;
    }
}

@media only screen and (orientation: landscape) and (max-height: 359px) {    /* Short Landscape */
    #wmsx-touch-T_E, #wmsx-touch-T_F, #wmsx-touch-T_G {
        display: none;
    }
}

@media only screen and (orientation: portrait) {    /* Portrait */

    #wmsx-touch-left {
        left: 3px;
        bottom: 183px;
    }
    #wmsx-touch-right {
        right: 9px;
        bottom: 38px;
        width: 112px;
        height: 224px;
    }

    #wmsx-touch-T_G {
        display: none;
    }

    .wmsx-touch-button {
        position: absolute;
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
    #wmsx-touch-T_G {
        bottom: 0%;
        right: 0%;
    }
}

@media only screen and (orientation: portrait) and (max-width: 320px) {    /* Thin Portrait. Like iPhone 5 */

    #wmsx-touch-T_E, #wmsx-touch-T_F, #wmsx-touch-T_G {
        display: none;
    }

    #wmsx-touch-left {
        bottom: 158px;
    }

    .wmsx-touch-button {
        position: absolute;
    }
    #wmsx-touch-T_D {
        bottom: 50%;
        right: 50%;
    }
    #wmsx-touch-T_A {
        bottom: 0%;
        right: 50%;
    }
    #wmsx-touch-T_B {
        bottom: 25%;
        right: 0%;
    }
    #wmsx-touch-T_C {
        bottom: 25%;
        right: 100%;
    }

}

@media only screen and (orientation: portrait) and (max-width: 320px) and (max-height: 519px) {    /* Thin and Short Portrait. Like iPhone 4 */

    #wmsx-touch-left {
        bottom: 110px;
    }
    #wmsx-touch-right {
        bottom: 24px;
    }

}

`;
