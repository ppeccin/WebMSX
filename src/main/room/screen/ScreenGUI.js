// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// CSS data for Screen

wmsx.ScreenGUI = {
    BAR_MENU_WIDTH: 136,
    BAR_MENU_ITEM_HEIGHT: 28
};

wmsx.ScreenGUI.css = `

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
#wmsx-screen-fs {
    position: relative;
    background: black;
    overflow: hidden;
}
#wmsx-screen-fs.wmsx-full-screen {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}
#wmsx-screen-fs.wmsx-full-screen-hack {
    position: fixed;
}

#wmsx-screen-canvas {
    display: block;
    margin: auto;
}

#wmsx-bar {
    position: relative;
    left: 0;
    right: 0;
    height: 29px;
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
}
#wmsx-bar.wmsx-auto-hide, #wmsx-screen-fs.wmsx-full-screen #wmsx-bar {
    position: absolute;
    bottom: 0;
    transition: height 0.3s ease-in-out;
}
#wmsx-bar.wmsx-auto-hide.wmsx-hidden, #wmsx-screen-fs.wmsx-full-screen #wmsx-bar.wmsx-hidden {
    height: 0;
}
#wmsx-bar-menu {
    position: absolute;
    height: 0;
    bottom: 29px;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
#wmsx-bar-menu-inner {
    padding-bottom: 3px;
    border: 1px solid black;
    background: rgb(40, 40, 40);
    font: normal 13px sans-serif;
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
#wmsx-bar.wmsx-narrow .wmsx-narrow-hidden {
    display: none;
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
    font: normal 19px sans-serif;
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
    font: bold 15px/29px sans-serif;
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
    font: bold 26px sans-serif;
    text-align: center;
    color: transparent;
    border: 2px dashed rgba(240, 240, 240, 0.70);
    box-sizing: initial;
    border-radius: 10px;
    text-shadow: 0 0 0 rgb(240, 240, 240);
    padding: 0;
    outline: none;
}

`;
