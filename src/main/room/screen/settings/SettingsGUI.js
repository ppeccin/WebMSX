// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

// HTML and CSS data for Settings

wmsx.SettingsGUI = {};

wmsx.SettingsGUI.html = function() {
    return  '<div id="jt-cover" class="show">' +
        '<div id="jt-modal" class="show">' +
            '<div id="jt-menu">' +
                '<div id="jt-back">' +
                    '<div id="jt-back-arrow">' +
                        '&larr;' +
                    '</div>' +
                '</div>' +
                '<div class="caption">' +
                    'WebMSX Help' +
                '</div>' +
                '<div class="items">' +
                    '<div id="jt-menu-general" class="item selected">' +
                        'GENERAL' +
                    '</div>' +
                    '<div id="jt-menu-media" class="item">' +
                        'MEDIA' +
                    '</div>' +
                    '<div id="jt-menu-about" class="item">' +
                        'ABOUT' +
                    '</div>' +
                    '<div id="jt-menu-selection">' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div id="jt-content">' +
                '<div id="jt-general">' +
                    '<div class="left">' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'F11' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Power' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'F12' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Fast Speed' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'F12' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Slow Speed' +
                            '</div>' +
                        '</div>' +
                        '<div class="full-divider">' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'P' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Pause' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'F' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Next Frame' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'V' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'NTSC/PAL' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'D' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Debug Modes' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'S' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Sprite Modes' +
                            '</div>' +
                        '</div>' +
                        '<div class="full-divider">' +
                        '</div>' +
                        '<div id="jt-general-swap-joysticks" class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                'J' +
                            '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Swap Joysticks' +
                            '</div>' +
                        '</div>' +
                        '<div id="jt-general-toggle-keyboards" class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'K' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Keyboard Layout' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="right">' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    '0 - 9' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Load State' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    '0 - 9' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Save State' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'F11' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Save State File' +
                            '</div>' +
                        '</div>' +
                        '<div class="full-divider">' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'Enter' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Full Screen' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'Arrows' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Screen Size' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'Shift' +
                                '</div>&nbsp;<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'Arrows' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Screen Scale' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                'E' +
                            '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Color Modes' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                'R' +
                            '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'CRT Modes' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                'T' +
                            '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'CRT Filters' +
                            '</div>' +
                        '</div>' +
                        '<div class="full-divider">' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                'Backspace' +
                            '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Defaults' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="jt-media">' +
                    '<div class="top-left">' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'F6' +
                                '</div>&nbsp;,&nbsp;<div class="key">' +
                                    'F7' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Load Disk Drive A, B' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'F8' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Load Cassette Tape' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'F9' +
                                '</div>&nbsp;,&nbsp;<div class="key">' +
                                    'F10' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Load Cartridge Slot 1, 2' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="top-right">' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'Shift' +
                                '</div>&nbsp;<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'F6 - F10' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Load from URL' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key">' +
                                    'Shift' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'F6 - F8' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Load Empty Media' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'F6 - F8' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Save Media File' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'F6 - F10' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Remove Media' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="divider">' +
                    '</div>' +
                    '<div class="hotkey">' +
                        '<div class="desc">' +
                            'Drag & Drop File or URL to load Media' +
                        '</div>' +
                    '</div>' +
                    '<div class="hotkey">' +
                        '<div class="command">' +
                            '<div class="key key-fixed">' +
                                'Alt' +
                            '</div>' +
                        '</div>' +
                        '<div class="desc">' +
                            '&nbsp;+ Drag & Drop File or URL to load Media in Drive B or Cartridge Slot 2' +
                        '</div>' +
                    '</div>' +
                    '<div class="hotkey">' +
                        '<div class="command">' +
                            '<div class="key key-fixed">' +
                                'Ctrl' +
                            '</div>' +
                        '</div>' +
                        '<div class="desc">' +
                            '&nbsp;+ Drag & Drop File or URL to load Media with alternate Auto-Power' +
                        '</div>' +
                    '</div>' +
                    '<div class="full-divider">' +
                    '</div>' +
                    '<div class="bottom-left">' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'Home' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Rewind Tape' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'End' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Seek to Tape end' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="bottom-right">' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'PgUp' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Seek Tape backward' +
                            '</div>' +
                        '</div>' +
                        '<div class="hotkey">' +
                            '<div class="command">' +
                                '<div class="key key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="key">' +
                                    'PgDn' +
                                '</div>' +
                            '</div>' +
                            '<div class="desc">' +
                                'Seek Tape forward' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="full-divider">' +
                    '</div>' +
                    '<div class="hotkey bottom">' +
                        '<div class="command">' +
                            '<div class="key">' +
                                'Shift' +
                            '</div>&nbsp;<div class="key key-fixed">' +
                                'Ctrl' +
                            '</div>&nbsp;<div class="key key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="key">' +
                                'F8' +
                            '</div>' +
                        '</div>' +
                        '<div class="desc">' +
                            'Auto-Run Cassette program at current Tape position' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="jt-about">' +
                    '<div id="jt-logo-version">' +
                        'WebMSX&nbsp&nbsp;-&nbsp;&nbsp&nbspversion&nbsp' + WMSX.VERSION +
                    '</div>' +
                    '<div class="info">' +
                        'Created by Paulo Augusto Peccin' +
                        '<br>' +
                        '<a href="http://webmsx.org">http://webmsx.org</a>' +
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
       ' position: fixed;' +
       ' top: 0;' +
       ' right: 0;' +
       ' bottom: 0;' +
       ' left: 0;' +
       ' visibility: hidden;' +
       ' opacity: 0;' +
       ' background-color: rgba(0, 0, 0, 0.6);' +
       ' transition: all .2s ease-out;' +
    '}' +

    '#jt-cover.show {' +
       ' visibility: visible;' +
       ' opacity: 1;' +
    '}' +

    '#jt-modal {' +
       ' position: relative;' +
       ' overflow: hidden;' +
       ' width: 580px;' +
       ' top: 80px;' +
       ' left: -120px;' +
       ' margin: 0 auto;' +
       ' color: rgba(0, 0, 0, 0.90);' +
       ' font-family: arial, sans-serif;' +
       ' box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);' +
       ' transition: all .2s ease-out;' +
    '}' +

    '#jt-modal.show {' +
       ' left: -0px;' +
    '}' +

    '#jt-modal .hotkey {' +
       ' height: 27px;' +
       ' padding: 3px 5px;' +
       ' font-size: 13px;' +
       ' box-sizing: border-box;' +
    '}' +

    '#jt-modal .hotkey .command {' +
       ' position: relative;' +
       ' float: left;' +
       ' font-weight: 600;' +
       ' color: rgba(0, 0, 0, .54);' +
    '}' +

    '#jt-modal .hotkey .desc {' +
       ' float: left;' +
       ' padding-top: 3px;' +
    '}' +

    '#jt-modal .key {' +
       ' position: relative;' +
       ' display: inline-block;' +
       ' top: -1px;' +
       ' min-width: 25px;' +
       ' height: 21px;' +
       ' padding: 4px 6px 3px;' +
       ' box-sizing: border-box;' +
       ' font-weight: 600;' +
       ' font-size: 12px;' +
       ' line-height: 12px;' +
       ' color: rgba(0, 0, 0, .71);' +
       ' background-color: white;' +
       ' border-radius: 3px;' +
       ' border: 1px solid rgb(210, 210, 210);' +
       ' box-shadow: 0 1px 0 1px rgba(0, 0, 0, .5);' +
       ' text-align: center;' +
    '}' +

    '#jt-modal .key-fixed {' +
       ' width: 31px;' +
       ' padding-left: 0;' +
       ' padding-right: 2px;' +
    '}' +

    '#jt-menu {' +
       ' position: relative;' +
       ' background-color: white;' +
       ' border-bottom: 1px solid rgb(200, 200, 200);' +
    '}' +

    '#jt-menu #jt-back {' +
       ' position: absolute;' +
       ' width: 18px;' +
       ' height: 32px;' +
       ' margin: 3px;' +
       ' padding: 0 11px;' +
       ' font-size: 35px;' +
       ' color: white;' +
       ' cursor: pointer;' +
    '}' +

    '#jt-menu #jt-back:hover {' +
       ' background-color: rgba(0, 0, 0, .12);' +
    '}' +

    '#jt-menu #jt-back-arrow {' +
       ' position: relative;' +
       ' overflow: hidden;' +
       ' top: -7px;' +
    '}' +

    '#jt-menu .caption {' +
       ' height: 29px;' +
       ' margin: 0 -1px;' +
       ' padding: 10px 0 0 48px;' +
       ' font-size: 18px;' +
       ' color: white;' +
       ' background-color: rgb(235, 62, 35);' +
       ' box-shadow: 0 1px 4px rgba(0, 0, 0, .80);' +
       ' vertical-align: middle;' +
    '}' +

    '#jt-menu .items {' +
       ' position: relative;' +
       ' width: 70%;' +
       ' height: 39px;' +
       ' margin: 0 auto;' +
       ' font-weight: 600;' +
    '}' +

    '#jt-menu .item {' +
       ' float: left;' +
       ' width: 33.3%;' +
       ' height: 100%;' +
       ' padding-top: 13px;' +
       ' font-size: 14px;' +
       ' color: rgba(0, 0, 0, .43);' +
       ' text-align: center;' +
       ' cursor: pointer;' +
    '}' +

    '#jt-menu .selected {' +
       ' color: rgb(224, 56, 34);' +
    '}' +

    '#jt-menu #jt-menu-selection {' +
       ' position: absolute;' +
       ' left: 0;' +
       ' bottom: 0;' +
       ' width: 33.3%;' +
       ' height: 3px;' +
       ' background-color: rgb(235, 62, 35);' +
       ' transition: left 0.3s ease-in-out;' +
    '}' +


    '#jt-content {' +
       ' position: relative;' +
       ' left: 0;' +
       ' width: 2300px;' +
       ' height: 360px;' +
       ' background-color: rgb(220, 220, 220);' +
       ' transition: left 0.3s ease-in-out' +
    '}' +

    '#jt-general, #jt-media, #jt-controls, #jt-about {' +
       ' position: absolute;' +
       ' width: 580px;' +
       ' height: 100%;' +
       ' box-sizing: border-box;' +
    '}' +

    '#jt-general {' +
       ' padding-top: 23px;' +
       ' padding-left: 33px;' +
    '}' +

    '#jt-general .left {' +
       ' float: left;' +
       ' width: 251px;' +
    '}' +

    '#jt-general .right {' +
       ' float: left;' +
    '}' +

    '#jt-general .left .command {' +
       ' width: 100px;' +
    '}' +

    '#jt-general .right .command {' +
       ' width: 166px;' +
    '}' +

    '#jt-media {' +
       ' left: 580px;' +
    '}' +

    '#jt-media {' +
       ' padding-top: 23px;' +
       ' padding-left: 25px;' +
    '}' +

    '#jt-media .top-left {' +
       ' float: left;' +
       ' width: 255px;' +
    '}' +

    '#jt-media .top-right {' +
       ' float: left;' +
    '}' +

    '#jt-media .bottom-left {' +
       ' float: left;' +
       ' width: 265px;' +
    '}' +

    '#jt-media .bottom-right {' +
       ' float: left;' +
    '}' +

    '#jt-media .top-left .command {' +
       ' width: 89px;' +
    '}' +

    '#jt-media .top-right .command {' +
       ' width: 166px;' +
    '}' +

    '#jt-media .bottom-left .command {' +
       ' width: 110px;' +
    '}' +

    '#jt-media .bottom-right .command {' +
       ' width: 107px;' +
    '}' +

    '#jt-media .bottom .command {' +
       ' width: 170px;' +
    '}' +


    '#jt-about {' +
       ' left: 1160px;' +
    '}' +

    '#jt-about #jt-logo-version {' +
       ' width: 380px;' +
       ' height: 212px;' +
       ' margin: 36px auto 24px;' +
       ' font-size: 18px;' +
       ' color: rgba(255, 255, 255, 0.97);' +
       ' padding-top: 170px;' +
       ' box-sizing: border-box;' +
       ' text-align: center;' +
       ' background: black url("' + WMSX_IMAGES_PATH + 'logo.png") center 50px no-repeat;' +
       ' box-shadow: 3px 3px 14px rgb(75, 75, 75);' +
    '}' +

    '#jt-about .info {' +
       ' font-size: 18px;' +
       ' line-height: 30px;' +
       ' text-align: center;' +
    '}' +

    '#jt-about a {' +
       ' color: rgb(0, 80, 230);' +
       ' text-decoration: none;' +
    '}' +

    '#jt-about #jt-browserinfo {' +
       ' position: absolute;' +
       ' left: 0;' +
       ' right: 0;' +
       ' bottom: 7px;' +
       ' font-size: 10px;' +
       ' text-align: center;' +
       ' color: transparent;' +
    '}' +

    '.divider {' +
       ' clear: both;' +
    '}' +

    '.full-divider {' +
       ' clear: both;' +
       ' height: 21px;' +
    '}' +

    '#jt-general .full-divider {' +
       ' clear: both;' +
       ' height: 19px;' +
    '}';

};

