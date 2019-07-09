// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ScreenGUI = wmsx.Util.isMobileDevice()
    ? {
        BAR_HEIGHT: 29,
        BAR_MENU_WIDTH: 150,
        BAR_MENU_ITEM_HEIGHT: 33,
        BAR_MENU_ITEM_FONT_SIZE: 14,
        LOGO_SCREEN_WIDTH: 597,
        LOGO_SCREEN_HEIGHT: 455,
        TOUCH_CONTROLS_LEFT_WIDTH: 119,
        TOUCH_CONTROLS_LEFT_WIDTH_BIG: 143,
        TOUCH_CONTROLS_RIGHT_WIDTH: 80
    }
    : {
        BAR_HEIGHT: 29,
        BAR_MENU_WIDTH: 140,
        BAR_MENU_ITEM_HEIGHT: 29,
        BAR_MENU_ITEM_FONT_SIZE: 13,
        LOGO_SCREEN_WIDTH: 597,
        LOGO_SCREEN_HEIGHT: 455,
        TOUCH_CONTROLS_LEFT_WIDTH: 119,
        TOUCH_CONTROLS_LEFT_WIDTH_BIG: 143,
        TOUCH_CONTROLS_RIGHT_WIDTH: 80
    };

wmsx.ScreenGUI.html = function() {
    return `<div id="wmsx-screen-fs" tabindex="0">
            <div id="wmsx-screen-fs-center" tabindex="-1">
                <div id="wmsx-screen-canvas-outer">
                    <canvas id="wmsx-screen-canvas" tabindex="-1"></canvas>
                    <img id="wmsx-canvas-loading-icon" draggable="false" src="` + wmsx.Images.urls.loading + `">
                    <div id="wmsx-unmute-message"></div>
                    <div id="wmsx-logo">
                        <div id="wmsx-logo-center">
                            <img id="wmsx-logo-image" draggable="false" src="` + wmsx.Images.urls.logo + `">
                            <img id="wmsx-logo-loading-icon" draggable="false" src="` + wmsx.Images.urls.loading + `">
                            <div id="wmsx-logo-message">
                                <div id="wmsx-logo-message-text"></div>
                                <div id="wmsx-logo-message-ok">
                                    <div id="wmsx-logo-message-ok-text"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="wmsx-osd"></div>
                </div>
                <div id="wmsx-drop-area">
                    <div id="wmsx-drop-drivea"><div id="wmsx-drop-drivea-add" class="wmsx-drop-add"></div><i></i><div id="wmsx-drop-drivea-files" class="wmsx-drop-files"></div><br>Drive A</div>
                    <div id="wmsx-drop-driveb"><div id="wmsx-drop-driveb-add" class="wmsx-drop-add"></div><i></i><div id="wmsx-drop-driveb-files" class="wmsx-drop-files"></div><br>Drive B</div>
                    <div id="wmsx-drop-driveh"><i></i><div id="wmsx-drop-driveh-files" class="wmsx-drop-files"></div><br>Hard Drive</div>
                    <div id="wmsx-drop-cart1"><i></i><br>Cartridge 1</div>
                    <div id="wmsx-drop-cart2"><i></i><br>Cartridge 2</div>
                    <div id="wmsx-drop-tape"><i></i><br>Cassette</div>
                    <span id="wmsx-drop-area-message"></span>
                </div>
                <div id="wmsx-bar">
                    <div id="wmsx-bar-inner"></div>
                </div>
            </div>
            <div id="wmsx-screen-scroll-message">
                Swipe up/down on the Screen <br>to hide the browser bars!
            </div>
        </div>`;
};

wmsx.ScreenGUI.css = function() {
    return `html.wmsx-full-screen-scroll-hack body {
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
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    tap-highlight-color: transparent;
    -webkit-text-size-adjust: none;
    -moz-text-size-adjust: none;
    text-size-adjust: none;
}
html.wmsx-full-screen #` + WMSX.SCREEN_ELEMENT_ID + ` {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    box-shadow: none;
    z-index: 2147483646;    /* one behind fsElement */
}
html.wmsx-started #` + WMSX.SCREEN_ELEMENT_ID + ` {
    visibility: visible;
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
    transition: all 1.7s step-end, opacity 1.6s linear;
    opacity: 0;
    z-index: -1;
}
html.wmsx-full-screen-scroll-hack #wmsx-screen-fs.wmsx-scroll-message #wmsx-screen-scroll-message {
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
html.wmsx-full-screen-scroll-hack #wmsx-screen-fs {
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
    height: ` + this.BAR_HEIGHT + `px;
    margin: 0 auto;
    border-top: 1px solid black;
    background: hsl(0, 0%, 16%);
    overflow: visible;                    /* for the Menu to show through */
    box-sizing: content-box;
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
    transition: height 0.08s ease-in-out;
}
html.wmsx-bar-auto-hide #wmsx-bar.wmsx-hidden {
    transition: height 0.5s ease-in-out;
    height: 0;
    bottom: -1px;
}
@media only screen and (orientation: landscape) {
    html.wmsx-full-screen #wmsx-bar.wmsx-hidden {
        transition: height 0.5s ease-in-out;
        height: 0;
        bottom: -1px;
    }
}

#wmsx-bar.wmsx-narrow .wmsx-narrow-hidden {
    display: none;
}

.wmsx-bar-button {
    display: inline-block;
    width: 24px;
    height: 29px;
    margin: 0 1px;
    background-image: url("` + wmsx.Images.urls.sprites + `");
    background-repeat: no-repeat;
    background-size: 568px 206px;
    cursor: pointer;
}
.wmsx-bar-button.wmsx-media-button {
    background-size: 284px 103px;
}
.wmsx-bar-button.wmsx-hidden {
    display: none;
}
/* Firefox-specific rules */
@-moz-document url-prefix() {
    .wmsx-bar-button {
        image-rendering: optimizequality;
    }
}
/*
.wmsx-bar-button {
    border: 1px solid yellow;
    background-origin: border-box;
    box-sizing: border-box;
}
*/

#wmsx-bar-power {
    margin-left: 6px;
}
#wmsx-bar-media-icons {
    margin-left: 10px;
}
#wmsx-bar-settings, #wmsx-bar-full-screen, #wmsx-bar-scale-plus, #wmsx-bar-scale-minus {
    float: right;
    margin: 0;
}
#wmsx-bar-settings {
    margin-right: 5px;
}
#wmsx-bar-full-screen.wmsx-mobile {
    margin: 0 6px;
}
#wmsx-bar-scale-plus {
    width: 21px;
}
#wmsx-bar-scale-minus {
    width: 18px;
}
#wmsx-bar-text {
    float: right;
    width: 32px;
}
#wmsx-bar-text.wmsx-mobile {
    margin: 0 0 0 6px;
}
#wmsx-bar-keyboard {
    position: absolute;
    left: 0; right: 0;
    width: 37px;
    margin: 0 auto;
}
#wmsx-bar.wmsx-narrow #wmsx-bar-keyboard {
    position: static;
    float: right;
}
#wmsx-bar-logo {
    position: absolute;
    left: 0; right: 0;
    width: 52px;
    margin: 0 auto;
}
#wmsx-bar-turbo, #wmsx-bar-caps, #wmsx-bar-kana {
    position: absolute;
    left: 0; right: 0;
    width: 47px;
    margin: 0 auto;
    padding: 8px 0 0 0;
    color: hsl(0, 98%, 61%);
    font-weight: bold;
    font-size: 12px;
    line-height: 14px;
    text-shadow: 2px 2px 0 black;
    vertical-align: top;
    box-sizing: border-box;
}
#wmsx-bar-turbo     { left: 109px; padding-left: 25px }
#wmsx-bar-caps      { left: calc(166px + 10%); height: 29px; background: none; }
#wmsx-bar-kana      { left: calc(170px + 25%); height: 29px; background: none; }

#wmsx-bar-menu {
    position: absolute;
    display: none;
    bottom: ` + this.BAR_HEIGHT + `px;
    font-size: ` + this.BAR_MENU_ITEM_FONT_SIZE + `px;
    line-height: 1px;
    overflow: hidden;
    transform-origin: bottom center;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
#wmsx-bar-menu-inner {
    display: inline-block;
    padding-bottom: 2px;
    border: 1px solid black;
    background: hsl(0, 0%, 16%);
}
.wmsx-bar-menu-item, #wmsx-bar-menu-title {
    position: relative;
    display: none;
    width: ` + this.BAR_MENU_WIDTH + `px;
    height: ` + this.BAR_MENU_ITEM_HEIGHT + `px;
    color: rgb(205, 205, 205);
    border: none;
    padding: 0;
    line-height: ` + this.BAR_MENU_ITEM_HEIGHT + `px;
    text-shadow: 1px 1px 1px black;
    background: transparent;
    outline: none;
    overflow: hidden;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    cursor: pointer;
    box-sizing: border-box;
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
    background: hsl(358, 67%, 46%);
}
.wmsx-bar-menu-item-disabled {
    color: rgb(110, 110, 110);
}
.wmsx-bar-menu-item-divider {
    height: 1px;
    margin: 1px 0;
    background: black;
}
.wmsx-bar-menu-item-toggle {
    text-align: left;
    padding-left: 33px;
}
.wmsx-bar-menu-item-toggle::before,
.wmsx-bar-menu-item-toggle::after {
    content: "";
    position: absolute;
    width: 6px;
    height: 9px;
    top: ` + (((this.BAR_MENU_ITEM_HEIGHT - 21) / 2) | 0) + `px;
    left: 12px;
    background: rgb(82, 82, 82);
    box-shadow: black 1px 1px 1px;
}
.wmsx-bar-menu-item-toggle::after {
    top: ` + (((this.BAR_MENU_ITEM_HEIGHT - 21) / 2) + 10 | 0) + `px;
}

.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked {
    color: white;
}
.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked.wmsx-op1::before,
.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked.wmsx-op3::before {
    background: rgb(254, 32, 30);
}
.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked.wmsx-op2::after,
.wmsx-bar-menu-item-toggle.wmsx-bar-menu-item-toggle-checked.wmsx-op3::after {
    background: rgb(254, 32, 30);
}
.wmsx-bar-menu-item-toggle.wmsx-no-op2::before {
    top: ` + (((this.BAR_MENU_ITEM_HEIGHT - 21) / 2) + 2 | 0) + `px;
    height: 16px;
}
.wmsx-bar-menu-item-toggle.wmsx-no-op2::after {
    display: none;
}

.wmsx-select-dialog {
    position: absolute;
    overflow: hidden;
    display: none;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 540px;
    max-width: 92%;
    height: 297px;
    margin: auto;
    color: white;
    font-size: 18px;
    background: hsl(0, 0%, 16%);
    padding: 14px 0 0;
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
.wmsx-select-dialog.wmsx-show {
    display: block;
}
.wmsx-select-dialog > .wmsx-footer {
    position: absolute;
    width: 100%;
    bottom: 7px;
    font-size: 13px;
    text-align: center;
    color: rgb(170, 170, 170);
}
.wmsx-select-dialog > ul {
    position: relative;
    width: 88%;
    top: 5px;
    margin: auto;
    padding: 0;
    list-style: none;
    font-size: 14px;
    color: hsl(0, 0%, 88%);
}
.wmsx-select-dialog > ul li {
    display: none;
    position: relative;
    overflow: hidden;
    height: 26px;
    background: rgb(70, 70, 70);
    margin: 7px 0;
    padding: 11px 10px 0;
    line-height: 0;
    text-align: left;
    text-overflow: ellipsis;
    border: 2px dashed transparent;
    box-shadow: 1px 1px 1px rgba(0, 0, 0, .5);
    white-space: nowrap;
    box-sizing: border-box;
    cursor: pointer;
}
.wmsx-select-dialog > ul li.wmsx-visible {
    display: block;
}
.wmsx-select-dialog > ul li.wmsx-selected {
    color: white;
    background: hsl(358, 67%, 46%);
}
.wmsx-select-dialog > ul li.wmsx-droptarget {
    color: white;
    border-color: lightgray;
}
.wmsx-select-dialog > ul li.wmsx-toggle::after {
    content: "";
    position: absolute;
    width: 6px;
    height: 17px;
    top: 2px;
    left: 6px;
    background: rgb(60, 60, 60);
    box-shadow: black 1px 1px 1px;
}
.wmsx-select-dialog > ul li.wmsx-toggle-checked::after {
    background: rgb(254, 32, 30);
}


#wmsx-diskselect.wmsx-select-dialog li {
    padding-left: 23px;
}
#wmsx-diskselect.wmsx-select-dialog li.wmsx-toggle::after {
    background: hsl(0, 0%, 73%);
}
#wmsx-diskselect.wmsx-select-dialog li.wmsx-toggle-checked::after {
    background: rgb(230, 205, 31);
}


#wmsx-cartridge-format.wmsx-select-dialog > ul {
    width: 100%;
    height: 292px;
    margin: 7px auto 0;
    padding: 0 0 0 30px;
    overflow-y: auto;
    box-sizing: border-box;
}
#wmsx-cartridge-format.wmsx-select-dialog > ul li {
    width: 220px;
    margin: 7px 0 2px 0;
}
#wmsx-cartridge-format.wmsx-select-dialog > ul li:first-child {
    margin-top: 0;
}
#wmsx-cartridge-format ::-webkit-scrollbar {
    width: 12px;
}
#wmsx-cartridge-format ::-webkit-scrollbar-track {
    background: transparent;
}
#wmsx-cartridge-format ::-webkit-scrollbar-thumb {
    border: solid transparent;
    border-width: 1px 1px 1px 2px;
    background: rgb(80, 80, 80);
    background-clip: content-box;
}
#wmsx-cartridge-format ul.wmsx-quick-options-list {
    width: 220px;
    margin: 18px 0 0 30px;
}
#wmsx-cartridge-format ul.wmsx-quick-options-list li div {
    height: 24px;
    line-height: 24px;
}
#wmsx-cartridge-format .wmsx-control {
    width: 52px;
    line-height: 24px;
    cursor: pointer;
}
/* Firefox-specific rules */
@-moz-document url-prefix() {
    /* Try to hide scrollbar, since we cant style it :-( */
    #wmsx-cartridge-format.wmsx-select-dialog > ul {
        width: 304px;
    }
}

#wmsx-savestate {
    width: 280px;
    height: 403px;
}
#wmsx-savestate.wmsx-load {
    height: 438px;
}
#wmsx-savestate ul.wmsx-quick-options-list {
    display: none;
    width: 220px;
    margin: 18px 0 0 30px;
}
#wmsx-savestate.wmsx-load ul.wmsx-quick-options-list {
    display: block;
}
#wmsx-savestate ul.wmsx-quick-options-list li div {
    height: 24px;
    line-height: 24px;
}
#wmsx-savestate .wmsx-control {
    width: 52px;
    cursor: pointer;
}

#wmsx-logo {
    position: absolute;
    display: none;
    top: 0; bottom: 0;
    left: 0; right: 0;
    background: black;
}
#wmsx-logo.wmsx-show {
    display: block;
}

#wmsx-logo-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 598px;
    height: 456px;
    transform: translate(-50%, -50%);
}
#wmsx-screen-fs:not(.wmsx-logo-message-active) #wmsx-logo-center {
    max-width: 100%;
    max-height: 100%;
}

#wmsx-logo-image {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 334px;
    max-width: 57%;
    transform: translate(-50%, -50%);
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
html.wmsx-full-screen #wmsx-logo-image {
    max-width: 67%;
}
#wmsx-screen-fs.wmsx-logo-message-active #wmsx-logo-image {
    top: 138px;
    max-width: initial;
}

#wmsx-unmute-message {
    display: none;
    position: absolute;
    left: 50%;
    bottom: 5px;
    height: 30px;
    padding: 0 10px;
    margin: 0 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    font-size: 15px;
    line-height: 30px;
    color: rgb(210, 210, 210);
    background: rgba(0, 0, 0, 0.7);
    transform-origin: bottom center;
    transform: translate(-50%, 0);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
#wmsx-unmute-message::before {
    content: "";
    display: inline-block;
    width: 24px;
    height: 20px;
    margin: 5px 9px 0 0;
    background-image: url("` + wmsx.Images.urls.muteIcon + `");
    background-repeat: no-repeat;
    background-size: 24px 20px;
    vertical-align: top;
}
#wmsx-unmute-message::after {
    content: "Audio is muted. Click to unmute";
}
#wmsx-unmute-message.wmsx-show {
    display: inline-block;
}

#wmsx-logo-loading-icon, #wmsx-canvas-loading-icon {
    display: none;
    position: absolute;
    top: 62%;
    left: 0; right: 0;
    width: 14%;
    height: 3%;
    margin: 0 auto;
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
#wmsx-screen-fs.wmsx-logo-message-active #wmsx-logo-loading-icon {
    top: 190px;
}

#wmsx-logo-message {
    display: none;
    position: absolute;
    top: 224px;
    width: 100%;
    color: hsl(0, 0%, 97%);
    font-size: 29px;
    line-height: 34px;
}
#wmsx-screen-fs.wmsx-logo-message-active #wmsx-logo-message {
    display: block;
}

#wmsx-logo-message-ok {
    display: block;
    position: absolute;
    top: 91px;
    left: 193px;
    width: 214px;
    height: 130px;
}
#wmsx-logo-message-ok.wmsx-higher {
    top: 74px;
}
#wmsx-logo-message-ok-text {
    position: absolute;
    top: 49%;
    left: 50%;
    width: 120px;
    height: 47px;
    font-size: 23px;
    line-height: 47px;
    background: hsl(358, 67%, 46%);
    border-radius: 6px;
    color: white;
    transform: translate(-50%, -50%);
}

#wmsx-osd {
    position: absolute;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    top: -29px;
    right: 20px;
    height: 28px;
    padding: 0 10px;
    margin: 0;
    font-weight: bold;
    font-size: 15px;
    line-height: 28px;
    color: rgb(0, 255, 0);
    background: rgba(0, 0, 0, 0.7);
    transform-origin: top right;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    opacity: 0;
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
    display: none;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 340px;
    height: 136px;
    margin: auto;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
}
#wmsx-paste-cover.wmsx-show {
    display: block;
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


#wmsx-text-entry-dialog {
    display: none;
    position: absolute;
    top: 25px;
    left: 0; right: 0;
    width: 96%;
    max-width: 540px;
    height: 47%;
    max-height: 450px;
    margin: 0 auto;
    color: white;
    font-size: 19px;
    line-height: 23px;
    background: hsl(0, 0%, 16%);
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
#wmsx-text-entry-dialog.wmsx-show {
    display: block;
}

#wmsx-text-entry-dialog-bar {
    position: absolute;
    height: 40px;
    width: 100%;
    line-height: 40px;
    background: inherit;
    overflow: hidden;
}
#wmsx-text-entry-dialog-bar::before {
    content: "Input Text";
}

#wmsx-text-entry-dialog-ok, #wmsx-text-entry-dialog-cancel {
    display: inline-block;
    float: right;
    width: 70px;
    height: 22px;
    margin-right: 15px;
    border: 9px solid hsl(0, 0%, 16%);
    border-left: none;
    border-right: none;
    font-size: 14px;
    line-height: 22px;
    background: hsl(358, 67%, 46%);
    cursor: pointer;
}
#wmsx-text-entry-dialog-cancel {
    color: hsl(0, 0%, 90%);
    background: hsl(0, 0%, 30%);
}
#wmsx-text-entry-dialog-ok::before {
    content: "OK";
}
#wmsx-text-entry-dialog-cancel::before {
    content: "CANCEL";
}

#wmsx-text-entry-input {
    position: absolute;
    top: 15px;
    left: 15px;
    width: calc(100% - 30px);
    height: calc(100% - 30px);
    padding: 29px 6px 4px;
    font-size: 16px;
    border: none;
    border-radius: 0;
    background: hsl(0, 0%, 90%);
    box-sizing: border-box;
    resize: none;
    outline: none;
    -webkit-touch-callout: default;
    touch-callout: default;
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
    position: absolute;
    height: 25px;
    padding: 5px 0 0;
    overflow: hidden;
    font-weight: normal;
    font-size: 10px;
    line-height: 10px;
    text-align: center;
    vertical-align: top;
    color: white;
    background: hsl(0, 0%, 66%);
    border: 3px solid hsl(0, 0%, 50%);
    border-top: 1px solid hsl(0, 0%, 54%);
    border-bottom: 5px solid hsl(0, 0%, 33%);
    border-radius: 3px 3px 0 0;
    box-shadow: 0 1px 0 1px rgb(0, 0, 0);
    box-sizing: border-box;
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
.wmsx-keyboard-alpha > div, .wmsx-keyboard-num > div, .wmsx-keyboard-arrows > div {
    position: absolute;
}
.wmsx-keyboard-num {
    left: 416px;
}
.wmsx-keyboard-arrows {
    top: 104px;
    left: 417px;
}
.wmsx-keyboard-f1, .wmsx-keyboard-f2, .wmsx-keyboard-f3, .wmsx-keyboard-f4, .wmsx-keyboard-f5,
.wmsx-keyboard-stop, .wmsx-keyboard-select, .wmsx-keyboard-home, .wmsx-keyboard-insert, .wmsx-keyboard-delete {
    height: 18px;
    padding-top: 2px;
    font-size: 9px;
    line-height: 9px;
    border-width: 1px 2px 4px;
}
.wmsx-keyboard-stop {
    margin-left: 10px;
    background: hsl(0, 70%, 54%);
    border-color: hsl(0, 70%, 36%);
    border-top-color: hsl(0, 70%, 40%);
    border-bottom-color: hsl(0, 70%, 28%);
}
.wmsx-keyboard-enter {
    border-radius: 2px 3px 0 0;
    border-top: none;
    box-shadow: none;
    overflow: visible;
}
.wmsx-keyboard-enter::after {
    content: "";
    display: block;
    position: absolute;
    left: -10px;
    bottom: -7px;
    width: 20px;
    height: 2px;
    background: black;
}

.wmsx-keyboard-enter_x1 {
    border-radius: 2px 0 0 0;
    border-width: 1px;
    border-right: none;
    box-shadow: -1px 1px 0 0 black;
}
.wmsx-keyboard-enter_x2 {
    overflow: visible;
    padding: 0;
    border: none;
    border-radius: 0 3px 0 0;
    box-shadow: none;
    box-shadow: 1px 1px 0 0 black;
}
.wmsx-keyboard-enter_x2::after {
    content: "";
    display: block;
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
.wmsx-keyboard-capslock {
    margin-left: 16px;
}
.wmsx-keyboard-space {
    left: 103px;
    width: 217px;
}
.wmsx-keyboard-dead {
    left: 333px;
    width: 26px;
}
.wmsx-keyboard-shift2 {
    left: 360px;
    width: 41px;
}
.wmsx-keyboard-code {
    left: 321px;
    width: 46px;
}

.wmsx-keyboard-num .wmsx-keyboard-key {
    height: 23px;
    padding-top: 4px;
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
    top: 6px;
    width: 26px;
    height: 33px;
    padding: 10px 0 0 6px;
}
.wmsx-keyboard-up, .wmsx-keyboard-down {
    left: 27px;
    width: 37px;
    height: 23px;
    padding: 5px 0 0 12px;
}
.wmsx-keyboard-down {
    top: 23px;
    padding-top: 7px;
}
.wmsx-keyboard-right {
    left: 65px;
    padding-left: 10px;
}

.wmsx-keyboard-up::after, .wmsx-keyboard-down::after, .wmsx-keyboard-left::after, .wmsx-keyboard-right::after {
    content: "";
    display: block;
    border: 4px solid transparent;
    width: 6px;
    height: 6px;
    box-sizing: border-box;
}
.wmsx-keyboard-up::after {
    border-bottom: 5px solid white;
    border-top-width: 0;
}
.wmsx-keyboard-up.wmsx-keyboard-key-unmapped::after {
    border-bottom-color: black;
}
.wmsx-keyboard-down::after {
    border-top: 5px solid white;
    border-bottom-width: 0;
}
.wmsx-keyboard-down.wmsx-keyboard-key-unmapped::after {
    border-top-color: black;
}
.wmsx-keyboard-left::after {
    border-right: 5px solid white;
    border-left-width: 0;
}
.wmsx-keyboard-left.wmsx-keyboard-key-unmapped::after {
    border-right-color: black;
}
.wmsx-keyboard-right::after {
    border-left: 5px solid white;
    border-right-width: 0;
}
.wmsx-keyboard-right.wmsx-keyboard-key-unmapped::after {
    border-left-color: black;
}

.wmsx-keyboard-narrow .wmsx-keyboard-num {
    display: none;
}
.wmsx-keyboard-narrow .wmsx-keyboard-arrows {
    left: 336px;
}
.wmsx-keyboard-narrow .wmsx-keyboard-space {
    width: 155px;
}
.wmsx-keyboard-narrow .wmsx-keyboard-code {
    left: 259px;
    width: 39px;
}
.wmsx-keyboard-narrow .wmsx-keyboard-dead {
    left: 299px;
    top: 25px;
}
.wmsx-keyboard-narrow .wmsx-keyboard-shift2 {
    display: none;
}
.wmsx-keyboard-narrow .wmsx-keyboard-left, .wmsx-keyboard-narrow .wmsx-keyboard-right  {
    top: 9px;
    width: 23px;
    height: 27px;
    padding: 7px 0 0 5px;
    border-bottom-width: 3px;
}
.wmsx-keyboard-narrow .wmsx-keyboard-up, .wmsx-keyboard-narrow .wmsx-keyboard-down  {
    left: 24px;
    width: 26px;
    padding-left: 7px;
    border-bottom-width: 3px;
}
.wmsx-keyboard-narrow .wmsx-keyboard-right  {
    left: 51px;
    padding-left: 8px;
}


#wmsx-virtual-keyboard {
    display: none;
    position: absolute;
    left: 50%;
    bottom: ` + ( this.BAR_HEIGHT + 2) + `px;
    overflow: hidden;
    margin: 0 auto;
    padding: 5px 0 0 4px;
    width: 518px;
    height: 161px;
    background: hsl(0, 0%, 16%);
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


.wmsx-quick-options-list {
    margin-top: 12px;
    padding: 0;
    list-style: none;
    color: hsl(0, 0%, 88%);
}
.wmsx-quick-options-list li {
    margin-top: 9px;
    line-height: 1px;
    text-align: left;
}
.wmsx-quick-options-list li div {
    display: inline-block;
    overflow: hidden;
    height: 26px;
    font-size: 14px;
    line-height: 26px;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
}
.wmsx-quick-options-list .wmsx-control {
    position: relative;
    float: right;
    width: 134px;
    font-size: 15px;
    line-height: 25px;
    color: hsl(0, 0%, 70%);
    background: black;
    text-align: center;
    box-shadow: 1px 1px 1px rgba(0, 0, 0, .5);
}
.wmsx-quick-options-list .wmsx-control > button {
    position: absolute;
    top: 0; bottom: 0;
    width: 26px;
    height: 100%;
    background: rgb(70, 70, 70);
    border: none;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
}
.wmsx-quick-options-list .wmsx-control > button::after {
    content: "";
    position: absolute;
    top: 7px;
    border: 6px solid transparent;
}
.wmsx-quick-options-list .wmsx-control .wmsx-control-dec {
    left: 0;
    border-right: 1px solid black;
}
.wmsx-quick-options-list .wmsx-control .wmsx-control-dec::after {
    left: 2px;
    border-right-color: #c0c0c0;
}
.wmsx-quick-options-list .wmsx-control .wmsx-control-inc {
    right: 0;
    border-left: 1px solid black;
}
.wmsx-quick-options-list .wmsx-control .wmsx-control-inc::after {
    right: 2px;
    border-left-color: #c0c0c0;
}
.wmsx-quick-options-list .wmsx-control.wmsx-selected {
    color: white;
    background: hsl(358, 67%, 46%);
    box-shadow: 1px 1px 1px rgba(0, 0, 0, .5);
}
.wmsx-quick-options-list .wmsx-control.wmsx-selected.wmsx-inactive {
    line-height: 21px;
    border: 2px dashed hsl(358, 67%, 46%);
    background: black;
}


#wmsx-quick-options {
    display: none;
    position: absolute;
    top: 0; bottom: 0;
    left: 0; right: 0;
    width: 270px;
    height: 351px;
    margin: auto;
    padding: 14px 15px 0;
    color: white;
    font-size: 18px;
    line-height: 22px;
    background: hsl(0, 0%, 16%);
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
#wmsx-quick-options.wmsx-show {
    display: block;
}
#wmsx-quick-options::before {
    content: "Quick Options";
    display: block;
}

#wmsx-netplay {
    display: none;
    position: absolute;
    top: 0; bottom: 0;
    left: 0; right: 0;
    width: 390px;
    height: 220px;
    margin: auto;
    padding-top: 11px;
    color: white;
    font-size: 18px;
    line-height: 22px;
    background: hsl(0, 0%, 16%);
    text-align: center;
    border: 1px solid black;
    box-sizing: initial;
    text-shadow: 1px 1px 1px black;
    box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);
    transform-origin: left center;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    cursor: auto;
    z-index: 50;
}
#wmsx-netplay.wmsx-show {
    display: block;
}
#wmsx-netplay::before {
    content: "Net Play!";
    display: block;
}
#wmsx-netplay-status-box {
    position: relative;
    margin-top: 17px;
}
#wmsx-netplay-status {
    display: inline-block;
    position: relative;
    width: 340px;
    font-size: 15px;
    line-height: 27px;
    background: black;
    vertical-align: top;
    text-shadow: none;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
    box-sizing: border-box;
    cursor: auto;
}
#wmsx-netplay-status-box.wmsx-active #wmsx-netplay-status {
    padding: 0 16px 0 12px;
}
#wmsx-netplay-status-box.wmsx-active #wmsx-netplay-status::after {
    content: "";
    position: absolute;
    width: 6px;
    height: 18px;
    top: 4px;
    left: 7px;
    background: rgb(254, 32, 30);
}
#wmsx-netplay-link {
    display: none;
    position: absolute;
    right: 25px;
    top: 0;
    width: 26px;
    height: 27px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    line-height: 27px;
    text-decoration: none;
    background: black;
    text-align: center;
}
#wmsx-netplay-link:hover {
    background: hsl(358, 67%, 46%);
    cursor: pointer;
}
#wmsx-netplay-status-box.wmsx-active #wmsx-netplay-link {
    display: block;
}
.wmsx-netplay-button {
    display: inline-block;
    width: 86px;
    padding: 0;
    margin: 0;
    font-size: 15px;
    line-height: 26px;
    color: white;
    background: hsl(358, 67%, 46%);
    text-shadow: 1px 1px 1px black;
    border: none;
    box-shadow: 1px 1px 1px rgba(0, 0, 0, .5);
    cursor: pointer;    
}
#wmsx-netplay-session-box {
    margin-top: 18px;
}
#wmsx-netplay-session-label,
#wmsx-netplay-nick-label {
    font-size: 15px;
    margin-bottom: 4px;
}
#wmsx-netplay-session-label::before {
    content: "Session Name";
}
#wmsx-netplay-session-box input {
    width: 150px;
    height: 26px;
    padding: 0 10px;
    margin: 0 8px;
    font-size: 15px;
    line-height: 26px;
    background: rgb(240, 240, 240);
    border: none;
    border-radius: 0;
    box-sizing: border-box;
    outline: none;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
    cursor: auto;
}
#wmsx-netplay-nick-label {
    margin-top: 10px;
}
#wmsx-netplay-nick-label::before {
    content: "User Nickname";
}
.wmsx-netplay-button:disabled {
    color: rgb(130, 130, 130);
    background: rgb(70, 70, 70);
    cursor: default;
}
#wmsx-netplay input:disabled {
    color: black;
    background: rgb(180, 180, 180);
    cursor: default;
}
#wmsx-netplay-session-box.wmsx-disabled div {
    color: rgb(130, 130, 130);
}
input#wmsx-netplay-link-text {
    position: absolute;
    top: 8px;
    left: 50px;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: 0;
    border: none;
    color: transparent;
    background: transparent;
    opacity: 0;
    z-index: -10;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
}

#wmsx-touch-config {
    display: none;
    position: absolute;
    top: 0; bottom: 0;
    left: 0; right: 0;
    width: 294px;
    height: 304px;
    margin: auto;
    padding: 0 16px;
    color: white;
    font-size: 18px;
    line-height: 22px;
    background: hsl(0, 0%, 16%);
    text-align: center;
    border: 1px solid black;
    box-sizing: border-box;
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
#wmsx-touch-config::after {
    content: "Tap Control to Setup";
    position: absolute;
    display: block;
    top: 14px;
    left: 0;
    width: 100%;
}
#wmsx-touch-config::before {
    content: "";
    display: block;
    margin-top: 46px;
    height: 68px;
    background: black;
}

#wmsx-touch-config-minus, #wmsx-touch-config-plus {
    position: absolute;
    top: 46px;
    width: 72px;
    height: 68px;
    cursor: pointer;
}
#wmsx-touch-config-minus {
    left: 19px;
}
#wmsx-touch-config-plus {
    right: 19px;
}
#wmsx-touch-config-minus::after, #wmsx-touch-config-plus::after {
    content: "";
    position: absolute;
    top: 20px;
    border: 14px solid transparent;
}
#wmsx-touch-config-minus::after {
    left: 9px;
    border-right: 18px solid #c0c0c0;
}
#wmsx-touch-config-minus.wmsx-disabled::after {
    border-right-color: #404040;
}
#wmsx-touch-config-plus::after {
    right: 9px;
    border-left: 18px solid #c0c0c0;
}
#wmsx-touch-config-plus.wmsx-disabled::after {
    border-left-color: #404040;
}

#wmsx-touch-config-dir {
    display: none;
    position: absolute;
    top: 15px;
    left: 79px;
    transform: scale(.70);
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
    top: 46px;
    right: 109px;
    text-shadow: none;
}
#wmsx-touch-config-button.wmsx-show {
    display: block;
}

#wmsx-touch-config .wmsx-quick-options-list {
    margin-top: 11px;
}
#wmsx-touch-config .wmsx-control {
    width: 110px;
}


#wmsx-touch-left, #wmsx-touch-right {
    display: none;
    position: absolute;
    z-index: 1;
}
#wmsx-touch-speed {
    display: none;
}

html.wmsx-full-screen.wmsx-touch-active #wmsx-touch-left,
html.wmsx-full-screen.wmsx-touch-active #wmsx-touch-right,
html.wmsx-full-screen.wmsx-touch-active #wmsx-touch-speed {
    display: block;
}

.wmsx-touch-dir {
    position: relative;
    width: 130px;
    height: 130px;
    color: hsl(0, 0%, 75%);
    border-radius: 100%;
    z-index: 2
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
    height: 25px;
    border-bottom-width: 2px;
}
.wmsx-touch-dir-key .wmsx-touch-dir-down {
    bottom: 26px;
    height: 27px;
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
    top: 26px;
    left: -1px;
    width: 28px;
    height: 22px;
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
    line-height: 67px;
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
    background: hsl(120, 76%, 31%);
    box-shadow: inset 0 2px hsl(120, 76%, 41%), 0 4px 0 1px hsl(120, 76%, 20%);
}
.wmsx-touch-button-joy.wmsx-touch-button-joy-B::before {
    border: none;
    background: hsl(0, 60%, 35%);
    box-shadow: inset 0 2px hsl(0, 60%, 48%), 0 4px 0 1px hsl(0, 60%, 23%);
}
.wmsx-touch-button-joy.wmsx-touch-button-joy-AB::before {
    border: none;
    background: hsl(240, 50%, 48%);
    box-shadow: inset 0 2px hsl(240, 50%, 60%), 0 4px 0 1px hsl(240, 50%, 31%);
}

.wmsx-touch-button-key {
    font-size: 16px;
    line-height: 69px;
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
#wmsx-touch-T_X { z-index: 1 }
#wmsx-touch-T_Y { z-index: 1 }

#wmsx-touch-pause, #wmsx-touch-fast {
    float: left;
    width: 46px;
    height: 48px;
    border-color: hsl(0, 0%, 70%);
}
#wmsx-touch-pause::after, #wmsx-touch-fast::before, #wmsx-touch-fast::after {
    content: "";
    display: inline-block;
    border: 0 solid transparent;
    box-sizing: border-box;
}
#wmsx-touch-pause::after {
    margin-top: 16px;
    width: 14px;
    height: 16px;
    border-width: 0;
    border-left-width: 4px;
    border-left-color: inherit;
    border-right-width: 4px;
    border-right-color: inherit;
}
#wmsx-touch-fast::before, #wmsx-touch-fast::after {
    margin-top: 16px;
    width: 12px;
    height: 16px;
    border-width: 8px;
    border-left-width: 12px;
    border-left-color: inherit;
    border-right-width: 0;
}
#wmsx-touch-speed.wmsx-paused #wmsx-touch-pause::after, #wmsx-touch-speed.wmsx-poweroff #wmsx-touch-pause::after {
    margin-top: 14px;
    width: 17px;
    height: 20px;
    border-width: 10px;
    border-left-width: 17px;
    border-right-width: 0;
}
#wmsx-touch-speed.wmsx-paused  #wmsx-touch-fast::after {
    width: 7px;
    border-width: 0;
    border-left-width: 3px;
}
#wmsx-touch-speed.wmsx-poweroff #wmsx-touch-fast {
    display: none;
}

.wmsx-hd-first {
    float: left;
}

#wmsx-drop-area {
    position: absolute;
    display: none;
    bottom: 56px;
    width: 574px;
    height: 238px;
    margin: auto;
    padding: 0;
    font-size: 0;
    line-height: 0;
    color: hsl(0, 0%, 82%);
    background: black;
    text-align: left;
    transform-origin: left bottom;
    z-index: 99;
}
#wmsx-drop-area.wmsx-visible {
    display: block;
}
#wmsx-drop-area > div {
    position: relative;
    display: inline-block;
    width: 178px;
    height: 90px;
    margin: 10px 0 0 10px;
    padding: 0;
    font-size: 19px;
    line-height: 24px;
    text-shadow: 2px 2px black;
    text-align: center;
    background: hsl(0, 0%, 16%);
    vertical-align: bottom;
    box-sizing: border-box;
}
#wmsx-drop-area > div.wmsx-disabled {
    color: #616161;
}
#wmsx-drop-area > div:not(.wmsx-disabled).wmsx-selected {
    background: hsl(358, 67%, 38%);
}
#wmsx-drop-area-message {
    position: absolute;
    left: 0; right: 0;
    bottom: 2px;
    height: 34px;
    font-size: 16px;
    line-height: 34px;
    text-align: center;
}

#wmsx-drop-area i {
    display: inline-block;
    margin: 11px auto 7px;
    width: 41px;
    height: 36px;
    background: url("` + wmsx.Images.urls.sprites + `");
    background-size: 568px 206px;
    vertical-align: bottom;
}
#wmsx-drop-drivea i { background-position: -334px -107px; }
#wmsx-drop-drivea.wmsx-disabled i { background-position: -334px -156px; }
#wmsx-drop-driveb i { background-position: -392px -107px; }
#wmsx-drop-driveb.wmsx-disabled i { background-position: -392px -156px; }
#wmsx-drop-driveh i { background-position: -508px -107px; }
#wmsx-drop-driveh.wmsx-disabled i { background-position: -508px -156px; }
#wmsx-drop-cart1 i  { background-position: -159px -107px; }
#wmsx-drop-cart2 i  { background-position: -217px -107px; }
#wmsx-drop-tape i   { background-position: -275px -107px; }

.wmsx-drop-add, 
.wmsx-drop-files {
    position: absolute;
    display: none;
    left: 0; top: 0;
    width: 50px;
    height: 34px;
    padding-top: 10px;
    font-size: 11px;
    line-height: 9px;
    text-shadow: 1px 1px 1px black;
    border: 3px solid transparent;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: visible;
}    
.wmsx-drop-files {
    left: unset; right: 0;
}
.wmsx-drop-add::after {
    content: "+ DISKS";
} 
.wmsx-drop-files::after {
    content: "+ FILES ";
} 
#wmsx-drop-area > div:not(.wmsx-disabled).wmsx-selected .wmsx-drop-add, 
#wmsx-drop-area > div:not(.wmsx-disabled).wmsx-selected .wmsx-drop-files {
    display: block;
}
.wmsx-drop-add.wmsx-selected, 
.wmsx-drop-files.wmsx-selected {
    border-color: hsl(0, 0%, 82%);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, .8);
}

html.wmsx-full-screen.wmsx-touch-active.wmsx-dir-big #wmsx-touch-left .wmsx-touch-dir {
    transform: scale(1.2);
    transform-origin: left center;
}
html.wmsx-full-screen.wmsx-touch-active.wmsx-touch-mirror.wmsx-dir-big #wmsx-touch-left .wmsx-touch-dir {
    transform-origin: right center;
}

#wmsx-touch-left .wmsx-touch-button {
    margin-left: 11px;
}
html.wmsx-touch-mirror #wmsx-touch-left .wmsx-touch-button {
    margin-left: 47px;
}
#wmsx-touch-T_X {
    margin-bottom: var(--touch-left-button-vert-margin);
}
#wmsx-touch-T_Y {
    margin-top: var(--touch-left-button-vert-margin);
}

@media only screen and (orientation: landscape) {    /* Landscape */
    #wmsx-touch-left {
        left: calc(-6px - ` + this.TOUCH_CONTROLS_LEFT_WIDTH + `px);
        bottom: 50%;
        transform: translateY(50%);
        --touch-left-button-vert-margin: 10px;
    }
    html.wmsx-full-screen.wmsx-touch-active.wmsx-dir-big #wmsx-touch-left {
        left: calc(-6px - ` + this.TOUCH_CONTROLS_LEFT_WIDTH_BIG + `px);
        --touch-left-button-vert-margin: 20px;
    }
    html.wmsx-touch-mirror #wmsx-touch-left {
        right: calc(-6px - ` + this.TOUCH_CONTROLS_LEFT_WIDTH + `px);
        left: initial  !important;
    }
    html.wmsx-full-screen.wmsx-touch-active.wmsx-touch-mirror.wmsx-dir-big #wmsx-touch-left {
        right: calc(-6px - ` + this.TOUCH_CONTROLS_LEFT_WIDTH_BIG + `px);
    }

    #wmsx-touch-right {
        right: calc(5px - ` + this.TOUCH_CONTROLS_RIGHT_WIDTH + `px);
        bottom: 50%;
        transform: translateY(50%);
    }
    html.wmsx-touch-mirror #wmsx-touch-right {
        left: calc(5px - ` + this.TOUCH_CONTROLS_RIGHT_WIDTH + `px);
        right: initial  !important;
    }

    #wmsx-touch-speed {
        position: absolute;
        left: -106px;
        top: 8px;
    }
    html.wmsx-full-screen.wmsx-touch-active.wmsx-dir-big #wmsx-touch-speed {
        left: -130px;
    }
    html.wmsx-touch-mirror #wmsx-touch-speed {
        right: -106px;
        left: initial  !important;
    }
    html.wmsx-full-screen.wmsx-touch-active.wmsx-touch-mirror.wmsx-dir-big #wmsx-touch-speed {
        right: -130px;
    }

    /* Adjust centered elements leaving space to the touch controls on both sides */
    html.wmsx-full-screen.wmsx-touch-active #wmsx-screen-fs-center {
        left: ` + this.TOUCH_CONTROLS_LEFT_WIDTH + `px;
        right: ` + this.TOUCH_CONTROLS_RIGHT_WIDTH + `px;
    }
    html.wmsx-full-screen.wmsx-touch-active.wmsx-dir-big #wmsx-screen-fs-center {
        left: ` + this.TOUCH_CONTROLS_LEFT_WIDTH_BIG + `px;
    }

    html.wmsx-full-screen.wmsx-touch-active.wmsx-touch-mirror #wmsx-screen-fs-center {
        right: ` + this.TOUCH_CONTROLS_LEFT_WIDTH + `px;
        left: ` + this.TOUCH_CONTROLS_RIGHT_WIDTH + `px;
    }
    html.wmsx-full-screen.wmsx-touch-active.wmsx-touch-mirror.wmsx-dir-big #wmsx-screen-fs-center {
        right: ` + this.TOUCH_CONTROLS_LEFT_WIDTH_BIG + `px;
    }
}

@media only screen and (orientation: landscape) and (max-height: 511px) {    /* Medium/Large Landscape */

    #wmsx-touch-left {
        --touch-left-button-vert-margin: 10px  !important;
    }

    #wmsx-touch-T_F, #wmsx-touch-T_G {
        display: none;
    }

    #wmsx-touch-speed {
        top: 2px;
    }

}

@media only screen and (orientation: landscape) and (max-height: 410px) {    /* Medium Landscape */

    #wmsx-touch-left {
        --touch-left-button-vert-margin: -2px  !important;
    }

}

@media only screen and (orientation: landscape) and (max-height: 359px) {    /* Short Landscape */

    #wmsx-touch-left {
        --touch-left-button-vert-margin: 6px  !important;
    }

    #wmsx-touch-T_E {
        display: none;
    }
    #wmsx-touch-T_X {
        visibility: hidden;
    }

    #wmsx-touch-speed {
        top: 8px;
    }
}

@media only screen and (orientation: portrait) {    /* Portrait */

    #wmsx-touch-left {
        left: 2px;
        bottom: 182px;
    }
    html.wmsx-touch-mirror #wmsx-touch-left {
        right: 2px;
        left: initial  !important;
    }

    #wmsx-touch-right {
        right: 5px;
        bottom: 36px;
        width: 112px;
        height: 224px;
    }
    html.wmsx-touch-mirror #wmsx-touch-right {
        left: 77px;
        right: initial  !important;
    }

    #wmsx-touch-speed {
        position: absolute;
        left: 19px;
        bottom: ` + (this.BAR_HEIGHT + 10) + `px;
    }
    html.wmsx-touch-mirror #wmsx-touch-speed {
        right: 19px;
        left: initial  !important;
    }

    .wmsx-touch-button {
        position: absolute;
    }
    #wmsx-touch-T_A { bottom: 75%; right: 50%; }
    #wmsx-touch-T_B { bottom: 100%; right: 0%; }
    #wmsx-touch-T_C { bottom: 50%; right: 100%; }
    #wmsx-touch-T_D { bottom: 25%; right: 50%; }
    #wmsx-touch-T_E { bottom: 50%; right: 0%; }
    #wmsx-touch-T_F { bottom: 0%; right: 100%; }
    #wmsx-touch-T_G { bottom: 0%; right: 0%; }
    #wmsx-touch-T_X { display: none; }
    #wmsx-touch-T_Y { bottom: -88px; }

    html.wmsx-touch-mirror #wmsx-touch-T_B { right: 100%; }
    html.wmsx-touch-mirror #wmsx-touch-T_C { right: 0%; }
    html.wmsx-touch-mirror #wmsx-touch-T_E { right: 100%; }
    html.wmsx-touch-mirror #wmsx-touch-T_F { right: 0%; }
    html.wmsx-touch-mirror #wmsx-touch-T_G { right: 100%; }

    html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-touch-left, html.wmsx-full-screen.wmsx-virtual-keyboard-active #wmsx-touch-right {
        display: none;
    }

}

@media only screen and (orientation: portrait) and (max-device-height: 638px) {    /* Medium Portrait. Like iPhone 5 */

    #wmsx-touch-right {
        bottom: -18px;
    }

    #wmsx-touch-T_F, #wmsx-touch-T_G {
        display: none;
    }

}

@media only screen and (orientation: portrait) and (max-device-height: 518px) {    /* Short Portrait. Like iPhone 4 */

    #wmsx-touch-left {
        bottom: 98px;
    }
    #wmsx-touch-right {
        bottom: -74px;
    }

    #wmsx-touch-T_E, #wmsx-touch-T_Y {
        display: none;
    }
    #wmsx-touch-T_D { bottom: 50%; right: 0%; }

    html.wmsx-touch-mirror #wmsx-touch-T_D { right: 100%; }

}`;

};
