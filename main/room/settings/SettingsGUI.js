// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

// HTML and CSS data for Settings

wmsx.SettingsGUI = {};

wmsx.SettingsGUI.html = function() {
    return '<div id="jt-cover">' +
        '<div id="jt-modal">' +
        '<div id="jt-menu">' +
        '<div id="jt-back">' +
        '<div id="jt-back-arrow">' +
        '&larr;' +
        '</div>' +
        '</div>' +
        '<div class="caption">' +
        'Settings' +
        '</div>' +
        '<div class="items">' +
        '<div id="jt-menu-help" class="item selected">' +
        'HELP' +
        '</div>' +
        '<div id="jt-menu-controls" class="item">' +
        'CONTROLS' +
        '</div>' +
        '<div id="jt-menu-about" class="item">' +
        'ABOUT' +
        '</div>' +
        '<div id="jt-menu-selection">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="jt-content">' +
        '<div id="jt-help">' +
        '<div class="left">' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Ctrl' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        '1 - 0' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Save State' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        '1 - 0' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Load State' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key">' +
        'F8' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Save State File' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'P' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Pause' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'F' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Next Frame' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'V' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'NTSC/PAL' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'R' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'CRT Modes' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'T' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'CRT Filter' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'G' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Show Info' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'D' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Debug Modes' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'C' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Collisions' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="right">' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key">' +
        'Tab' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Fast Speed' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'Enter' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Full Screen' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Ctrl' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'F1' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Fry Console' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command">' +
        '<div class="key">' +
        'F7' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Remove Cartridge' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command right-bottom">' +
        '<div class="key">' +
        'Backspace' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Screen Defaults' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command right-bottom">' +
        '<div class="key">' +
        'Shift' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'Arrows' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Screen Size' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command right-bottom">' +
        '<div class="key">' +
        'Shift' +
        '</div>' +
        ' ' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'Arrows' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Screen Scale' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command right-bottom">' +
        '<div class="key">' +
        'Shift' +
        '</div>' +
        ' ' +
        '<div class="key key-ctrlalt">' +
        'Ctrl' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'Arrows' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Viewport Size' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="command right-bottom">' +
        '<div class="key key-ctrlalt">' +
        'Ctrl' +
        '</div>' +
        ' ' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'Arrows' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Viewport Origin' +
        '</div>' +
        '</div>' +
        '<div class="hotkey">' +
        '</div>' +
        '<div class="hotkey">' +
        '<div class="desc">' +
        'Drag/Drop Files or URLs to load ROMs' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="jt-controls">' +
        '<div class="player p1">' +
        '<div id="jt-control-p1-label" class="title">' +
        'Player 1' +
        '</div>' +
        '<div class="command fire1">' +
        'Button<br>' +
        '<div id="jt-control-p1-button1" class="key">' +
        'Space' +
        '</div>' +
        '</div>' +
        '<div class="command up">' +
        '<div id="jt-control-p1-up-label">' +
        'Up' +
        '</div>' +
        '<div id="jt-control-p1-up" class="key">' +
        'Up' +
        '</div>' +
        '</div>' +
        '<div class="command fire2">' +
        'Button<br>' +
        '<div id="jt-control-p1-button2" class="key">' +
        'Del' +
        '</div>' +
        '</div>' +
        '<div class="command left">' +
        'Left<br>' +
        '<div id="jt-control-p1-left" class="key">' +
        'Left' +
        '</div>' +
        '</div>' +
        '<div class="command controller">' +
        '<div id="jt-control-p1-controller">' +
        '</div>' +
        '</div>' +
        '<div class="command right">' +
        'Right<br>' +
        '<div id="jt-control-p1-right" class="key">' +
        'Right' +
        '</div>' +
        '</div>' +
        '<div class="command down">' +
        '<div id="jt-control-p1-down-label">' +
        'Down' +
        '</div>' +
        '<div id="jt-control-p1-down" class="key">' +
        'Down' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="player p2">' +
        '<div id="jt-control-p2-label" class="title">' +
        'Player 2' +
        '</div>' +
        '<div class="command fire1">' +
        'Button<br>' +
        '<div id="jt-control-p2-button1" class="key">' +
        'A' +
        '</div>' +
        '</div>' +
        '<div class="command up">' +
        '<div id="jt-control-p2-up-label">' +
        'Up' +
        '</div>' +
        '<div id="jt-control-p2-up" class="key">' +
        'T' +
        '</div>' +
        '</div>' +
        '<div class="command fire2">' +
        'Button<br>' +
        '<div id="jt-control-p2-button2" class="key">' +
        'Dot' +
        '</div>' +
        '</div>' +
        '<div class="command left">' +
        'Left<br>' +
        '<div id="jt-control-p2-left" class="key">' +
        'F' +
        '</div>' +
        '</div>' +
        '<div class="command controller">' +
        '<div id="jt-control-p2-controller">' +
        '</div>' +
        '</div>' +
        '<div class="command right">' +
        'Right<br>' +
        '<div id="jt-control-p2-right" class="key">' +
        'H' +
        '</div>' +
        '</div>' +
        '<div class="command down">' +
        '<div id="jt-control-p2-down-label">' +
        'Down' +
        '</div>' +
        '<div id="jt-control-p2-down" class="key">' +
        'G' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="modes">' +
        '<div class="title">' +
        'Modes' +
        '</div>' +
        '<div id="jt-controls-swap-keys" class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'K' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Swap Keys' +
        '</div>' +
        '</div>' +
        '<div id="jt-controls-swap-gamepads" class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'J' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Swap Gamepads' +
        '</div>' +
        '</div>' +
        '<div id="jt-controls-toggle-paddles" class="hotkey">' +
        '<div class="command">' +
        '<div class="key key-ctrlalt">' +
        'Alt' +
        '</div>' +
        ' + ' +
        '<div class="key">' +
        'L' +
        '</div>' +
        '</div>' +
        '<div class="desc">' +
        'Toggle Paddles' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="jt-controls-revert">' +
        'REVERT' +
        '</div>' +
        '<div id="jt-controls-defaults">' +
        'DEFAULTS' +
        '</div>' +
        '</div>' +
        '<div id="jt-about">' +
        '<div id="jt-logo-version">' +
        WMSX.VERSION +
        '</div>' +
        '<div class="info">' +
        'Created by Paulo Augusto Peccin' +
        '<br>' +
        '<a href="http://javatari.org">http://javatari.org</a>' +
        '</div>' +
        '<div id="jt-browserinfo">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
};

wmsx.SettingsGUI.css = function() {
    return '#jt-cover {' +
        'position: fixed;' +
        'top: 0;' +
        'right: 0;' +
        'bottom: 0;' +
        'left: 0;' +
        'visibility: hidden;' +
        'opacity: 0;' +
        'background-color: rgba(0, 0, 0, 0.6);' +
        'transition: all .2s ease-out;' +
        '}' +

        '#jt-cover.show {' +
        'visibility: visible;' +
        'opacity: 1;' +
        '}' +

        '#jt-modal {' +
        'position: relative;' +
        'overflow: hidden;' +
        'width: 560px;' +
        'top: 80px;' +
        'left: -120px;' +
        'margin: 0 auto;' +
        'color: rgba(0, 0, 0, 0.90);' +
        'font-family: arial, sans-serif;' +
        'box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);' +
        'transition: all .2s ease-out;' +
        '}' +

        '#jt-modal.show {' +
        'left: 0;' +
        '}' +

        '#jt-modal .hotkey {' +
        'height: 27px;' +
        'padding: 3px 5px;' +
        'font-size: 13px;' +
        'box-sizing: border-box;' +
        '}' +

        '#jt-modal .hotkey .command {' +
        'position: relative;' +
        'float: left;' +
        'font-weight: 600;' +
        'color: rgba(0, 0, 0, .50);' +
        '}' +

        '#jt-modal .hotkey .desc {' +
        'float: left;' +
        'padding-top: 3px;' +
        '}' +

        '#jt-modal .key {' +
        'position: relative;' +
        'display: inline-block;' +
        'top: -1px;' +
        'min-width: 25px;' +
        'height: 21px;' +
        'padding: 4px 6px 3px;' +
        'box-sizing: border-box;' +
        'font-weight: 600;' +
        'font-size: 12px;' +
        'line-height: 12px;' +
        'color: rgba(0, 0, 0, .68);' +
        'background-color: white;' +
        'border-radius: 3px;' +
        'border: 1px solid rgb(210, 210, 210);' +
        'box-shadow: 0 1px 0 1px rgba(0, 0, 0, .5);' +
        'text-align: center;' +
        '}' +

        '#jt-modal .key-ctrlalt {' +
        'width: 31px;' +
        'padding-left: 0;' +
        'padding-right: 2px;' +
        '}' +

        '#jt-menu {' +
        'position: relative;' +
        'background-color: white;' +
        'border-bottom: 1px solid rgb(200, 200, 200);' +
        '}' +

        '#jt-menu #jt-back {' +
        'position: absolute;' +
        'width: 18px;' +
        'height: 32px;' +
        'margin: 3px;' +
        'padding: 0 11px;' +
        'font-size: 35px;' +
        'color: white;' +
        'cursor: pointer;' +
        '}' +

        '#jt-menu #jt-back:hover {' +
        'background-color: rgba(0, 0, 0, .12);' +
        '}' +

        '#jt-menu #jt-back-arrow {' +
        'position: relative;' +
        'overflow: hidden;' +
        'top: -7px;' +
        '}' +

        '#jt-menu .caption {' +
        'height: 29px;' +
        'margin: 0 -1px;' +
        'padding: 9px 0 0 48px;' +
        'font-size: 19px;' +
        'color: white;' +
        'background-color: rgb(235, 62, 35);' +
        'box-shadow: 0 1px 4px rgba(0, 0, 0, .8);' +
        '}' +

        '#jt-menu .items {' +
        'position: relative;' +
        'width: 70%;' +
        'height: 39px;' +
        'margin: 0 auto;' +
        'font-weight: 600;' +
        '}' +

        '#jt-menu .item {' +
        'float: left;' +
        'width: 33.3%;' +
        'height: 100%;' +
        'padding-top: 13px;' +
        'font-size: 14px;' +
        'color: rgba(0, 0, 0, .43);' +
        'text-align: center;' +
        'cursor: pointer' +
        '}' +

        '#jt-menu .selected {' +
        'color: rgb(224, 56, 34);' +
        '}' +

        '#jt-menu #jt-menu-selection {' +
        'position: absolute;' +
        'left: 0;' +
        'bottom: 0;' +
        'width: 33.3%;' +
        'height: 3px;' +
        'background-color: rgb(235, 62, 35);' +
        'transition: left 0.3s ease-in-out' +
        '}' +


        '#jt-content {' +
        'position: relative;' +
        'left: 0;' +
        'width: 1680px;' +
        'height: 370px;' +
        'background-color: rgb(220, 220, 220);' +
        'transition: left 0.3s ease-in-out' +
        '}' +

        '#jt-help, #jt-controls, #jt-about {' +
        'position: absolute;' +
        'width: 560px;' +
        'height: 100%;' +
        'box-sizing: border-box;' +
        '}' +

        '#jt-help {' +
        'padding-top: 22px;' +
        '}' +

        '#jt-help .left {' +
        'float: left;' +
        'padding-left: 30px;' +
        '}' +

        '#jt-help .right {' +
        'float: left;' +
        'padding-left: 34px;' +
        '}' +

        '#jt-help .left .command {' +
        'width: 104px;' +
        '}' +

        '#jt-help .right .command {' +
        'width: 109px;' +
        '}' +

        '#jt-help .command.right-bottom {' +
        'width: 164px;' +
        '}' +

        '#jt-controls {' +
        'left: 560px;' +
        '}' +

        '#jt-controls .player {' +
        'position: absolute;' +
        'top: 15px;' +
        'width: 217px;' +
        'color: rgba(0, 0, 0, .8);' +
        '}' +

        '#jt-controls .p1 {' +
        'left: 28px;' +
        '}' +

        '#jt-controls .p2 {' +
        'right: 28px;' +
        '}' +

        '#jt-controls .title {' +
        'padding-bottom: 4px;' +
        'margin: 0 14px 8px 12px;' +
        'font-size: 18px;' +
        'text-align: center;' +
        'border-bottom: 2px solid rgba(242, 66, 35, .55);' +
        '}' +

        '#jt-controls .player .command {' +
        'position: relative;' +
        'float: left;' +
        'width: 33%;' +
        'height: 45px;' +
        'font-size: 13px;' +
        'text-align: center;' +
        '}' +

        '#jt-controls .command.fire1, #jt-controls .command.fire2 {' +
        'top: 14px;' +
        '}' +

        '#jt-controls .command.left, #jt-controls .command.right {' +
        'top: 27px;' +
        '}' +

        '#jt-controls .command.down {' +
        'float: none;' +
        'clear: both;' +
        'margin: 0 auto;' +
        '}' +

        '#jt-controls .command.controller {' +
        'height: 90px;' +
        '}' +

        '#jt-controls #jt-control-p1-controller, #jt-controls #jt-control-p2-controller {' +
        'width: 70px;' +
        'height: 89px;' +
        'margin-left: 1px;' +
        'background: url("' + WMSX.IMAGES_PATH + 'sprites.png") no-repeat -466px 0;' +
        '}' +

        '#jt-controls .player .key {' +
        'min-width: 33px;' +
        'height: 23px;' +
        'padding: 5px 6px 4px;' +
        'margin-top: 2px;' +
        'cursor: pointer;' +
        '}' +

        '#jt-controls .player .key:hover {' +
        'box-shadow: 0 1px 0 1px rgba(0, 0, 0, .5), 1px 2px 6px 4px rgb(170, 170, 170);' +
        '}' +

        '#jt-controls .player .key.redefining {' +
        'color: white;' +
        'background-color: rgb(87, 128, 255);' +
        'border-color: rgb(71, 117, 255);' +
        '}' +

        '#jt-controls .player .key.undefined {' +
        'background-color: rgb(255, 150, 130);' +
        'border-color: rgb(255, 130, 90);' +
        '}' +

        '#jt-controls .modes {' +
        'position: absolute;' +
        'top: 200px;' +
        'left: 0;' +
        'right: 0;' +
        'width: 200px;' +
        'margin: 0 auto;' +
        '}' +

        '#jt-controls .modes .hotkey {' +
        'position: relative;' +
        'padding-left: 8px;' +
        'cursor: pointer;' +
        '}' +

        '#jt-controls .modes .hotkey:hover {' +
        'background-color: white;' +
        'box-shadow: 1px 1px 3px 1px rgb(180, 180, 180);' +
        '}' +

        '#jt-controls .modes .command {' +
        'margin-right: 12px;' +
        '}' +

        '#jt-controls-defaults, #jt-controls-revert {' +
        'position: absolute;' +
        'bottom: 18px;' +
        'padding: 7px 10px;' +
        'font-size: 12px;' +
        'font-weight: 600;' +
        'border-radius: 1px;' +
        'cursor: pointer' +
        '}' +

        '#jt-controls-defaults:hover, #jt-controls-revert:hover {' +
        'background-color: white;' +
        'box-shadow: 1px 1px 3px 1px rgb(180, 180, 180);' +
        '}' +

        '#jt-controls-revert {' +
        'right: 30px;' +
        'color: rgba(0, 0, 0, 0.8);' +
        '}' +

        '#jt-controls-defaults {' +
        'right: 115px;' +
        'color: rgb(0, 80, 230);' +
        '}' +


        '#jt-about {' +
        'left: 1120px;' +
        '}' +

        '#jt-about #jt-logo-version {' +
        'width: 248px;' +
        'height: 220px;' +
        'margin: 28px auto 14px;' +
        'font-size: 18px;' +
        'color: rgba(255, 255, 255, 0.97);' +
        'padding-top: 190px;' +
        'box-sizing: border-box;' +
        'text-align: center;' +
        'background: black url("' + WMSX.IMAGES_PATH + 'logo.png") no-repeat 5px 13px;' +
        'background-size: 233px 173px;' +
        'box-shadow: 3px 3px 14px rgb(75, 75, 75);' +
        '}' +

        '#jt-about .info {' +
        'font-size: 18px;' +
        'line-height: 30px;' +
        'text-align: center;' +
        '}' +

        '#jt-about a {' +
        'color: rgb(0, 80, 230);' +
        'text-decoration: none;' +
        '}' +

        '#jt-about #jt-browserinfo {' +
        'position: absolute;' +
        'left: 0;' +
        'right: 0;' +
        'bottom: 7px;' +
        'font-size: 10px;' +
        'text-align: center;' +
        'color: transparent;' +
        '}';
};

