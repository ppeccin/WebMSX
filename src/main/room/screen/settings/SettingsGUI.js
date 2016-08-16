// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

// HTML and CSS data for Settings

wmsx.SettingsGUI = {};

wmsx.SettingsGUI.html = function() {
    return '<div id="wmsx-cover">' +
        '<div id="wmsx-modal">' +
            '<div id="wmsx-menu">' +
                '<div id="wmsx-back">' +
                    '<div id="wmsx-back-arrow">' +
                        '&larr;' +
                    '</div>' +
                '</div>' +
                '<div class="wmsx-caption">' +
                    'WebMSX Help' +
                '</div>' +
                '<div class="items">' +
                    '<div id="wmsx-menu-general" class="item wmsx-selected">' +
                        'GENERAL' +
                    '</div>' +
                    '<div id="wmsx-menu-media" class="item">' +
                        'MEDIA' +
                    '</div>' +
                    '<div id="wmsx-menu-inputs" class="item">' +
                        'INPUT' +
                    '</div>' +
                    '<div id="wmsx-menu-about" class="item">' +
                        'ABOUT' +
                    '</div>' +
                    '<div id="wmsx-menu-selection">' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div id="wmsx-content">' +
                '<div id="wmsx-general">' +
                    '<div class="wmsx-left">' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key">' +
                                    'F11' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">' +
                                'Power' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key">' +
                                    'Shift' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'F11' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Reset</div>' +
                        '</div>' +
                        '<div class="wmsx-full-divider"></div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'Q' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">NTSC/PAL</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'W' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">V-Synch Modes</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp<div class="wmsx-key">' +
                                    'R' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">CRT Modes</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'T' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">CRT Filters</div>' +
                        '</div>' +
                        '<div class="wmsx-full-divider"></div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'D' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Debug Modes</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'S' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Sprite Modes</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'G' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Capture Screen</div>' +
                        '</div>' +
                        '<div class="wmsx-full-divider"></div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-desc">Right-Click Bar Icons: Default Action</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-right">' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    '0 - 9' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Load State</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    '0 - 9' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Save State</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'F11' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Save State File</div>' +
                        '</div>' +
                        '<div class="wmsx-full-divider"></div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key">' +
                                    'F12' +
                                '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key">' +
                                    'Shift' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'F12' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Fast / Slow Speed</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'Arrows' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Adjust Speed</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'P' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Toggle Pause</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'O' +
                                '</div>&nbsp;/&nbsp;<div class="wmsx-key">' +
                                    'F' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Next Frame</div>' +
                        '</div>' +
                        '<div class="wmsx-full-divider"></div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'Enter' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Full Screen</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'Arrows' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Screen Size / Width</div>' +
                        '</div>' +
                        '<div class="wmsx-full-divider"></div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'Backspace' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Defaults</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="wmsx-media">' +
                    '<div class="wmsx-top-left">' +
                        '<div class="wmsx-hotkey wmsx-heading">' +
                            'Media Commands:' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key">' +
                                    'F6' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Load Disk</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key">' +
                                    'F7' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Load Cartridge</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key">' +
                                    'F8' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Load Cassette Tape</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-desc">' +
                                'Right-Click Media Icons on the bottom bar' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-desc">' +
                                'Drag &amp; Drop Files or URLs (auto detect)' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-top-right">' +
                        '<div class="wmsx-hotkey wmsx-heading">' +
                            'Modifiers for Media Commands:' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '+ <div class="wmsx-key">' +
                                    'Shift' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Use Drive B / Slot 2</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '+ <div class="wmsx-key wmsx-key-fixed">' +
                                    'Ctrl' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Load Empty Media</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '+ <div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Remove Media</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '+ <div class="wmsx-key wmsx-key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Save Media File</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey wmsx-clear">' +
                            '<div class="wmsx-desc">' +
                                'Right-Drag / Middle-Click: No Auto-Reset' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-full-divider"></div>' +
                    '<div class="wmsx-hotkey">' +
                        '<div class="wmsx-command">' +
                            '<div class="wmsx-key wmsx-key-fixed">' +
                                'Ctrl' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-desc">&nbsp;+ Drag &amp; Drop Disk Files to Load and Add Disks to the current Drive Stack' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-hotkey">' +
                        '<div class="wmsx-command">' +
                            '<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-desc">&nbsp;+ Drag &amp; Drop Files or ZIP File to force "Files as Disk" or "ZIP as Disk" loading' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-full-divider"></div>' +
                    '<div class="wmsx-bottom-left">' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'Home' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Rewind Tape</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Ctrl' +
                                '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                   'Pg Up / Dn' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Seek Tape</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-bottom-right">' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                  'Pg Up / Dn' +
                               '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Select Disk</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-clear"></div>' +
                    '<div class="wmsx-hotkey wmsx-bottom">' +
                        '<div class="wmsx-command">' +
                            '<div class="wmsx-key">' +
                                'Shift' +
                            '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Ctrl' +
                            '</div>&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                'F8' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-desc">' +
                            'Auto-Run Cassette program at current Tape position' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="wmsx-inputs">' +
                    '<div class="wmsx-left">' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'J' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Toggle Joysticks</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'K' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Toggle Keyboards</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'M' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Toggle Mouse</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-desc">Middle Mouse Button: Lock/unlock pointer</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-right">' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'C' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Copy Screen Text</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'V' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Open Text Paste box</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-fixed">' +
                                    'Alt' +
                                '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                    'H' +
                                '</div>' +
                            '</div>' +
                            '<div class="wmsx-desc">Adjust Turbo-Fire speed</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-full-divider"></div>' +
                    '<div class="wmsx-full-divider"></div>' +
                    '<div id="wmsx-keyboard-outer">' +
                        '<div id="wmsx-keyboard">' +
                        '</div>' +
                    '</div>' +
                    '<div class="wmsx-bottom">' +
                        '<div class="wmsx-hotkey wmsx-heading">' +
                            'Special / Alternative MSX Key bindings:' +
                        '</div>' +
                        '<div class="wmsx-hotkey wmsx-hotkey-msx">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-msx wmsx-key-msx-stop">' +
                                    'STOP' +
                                '</div> :' +
                            '</div>' +
                            '<div class="wmsx-key">' +
                                'Pause' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key">' +
                                'F9' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                '[' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey wmsx-hotkey-msx">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-msx">' +
                                    'SELECT' +
                               '</div> :' +
                            '</div>' +
                            '<div class="wmsx-key">' +
                                'ScrLck' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key">' +
                                'F10' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                ']' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey wmsx-hotkey-msx">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-msx">' +
                                    'GRAPH' +
                                '</div> :' +
                            '</div>' +
                            '<div class="wmsx-key">' +
                                'PgUp' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                'F9' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                ',' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey wmsx-hotkey-msx">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-msx">' +
                                    'CODE' +
                                '</div> :' +
                            '</div>' +
                            '<div class="wmsx-key">' +
                                'PgDn' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                'F10' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                '.' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey wmsx-hotkey-msx">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-msx">' +
                                    'DEAD' +
                                '</div> :' +
                            '</div>' +
                            '<div class="wmsx-key">' +
                                'End' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                '/' +
                            '</div>' +
                        '</div>' +
                        '<div class="wmsx-hotkey wmsx-hotkey-msx">' +
                            '<div class="wmsx-command">' +
                                '<div class="wmsx-key wmsx-key-msx">' +
                                    'ESC' +
                                '</div> :' +
                            '</div>' +
                            '<div class="wmsx-key">' +
                                'Escape' +
                            '</div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key wmsx-key-fixed">' +
                                'Alt' +
                            '</div>&nbsp;+&nbsp;<div class="wmsx-key">' +
                                'F1' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="wmsx-about">' +
                    '<div id="wmsx-logo-version">' +
                        'WebMSX&nbsp&nbsp;-&nbsp;&nbsp&nbsp' + WMSX.VERSION +
                    '</div>' +
                    '<div class="wmsx-info">' +
                        atob("Q3JlYXRlZCBieSBQYXVsbyBBdWd1c3RvIFBlY2Npbg==") +
                        '<br>' +
                        atob("PGEgdGFyZ2V0PSJfYmxhbmsiIGhyZWY9Imh0dHA6Ly93ZWJtc3gub3JnIj5odHRwOi8vd2VibXN4Lm9yZzwvYT4=") +
                    '</div>' +
                    '<div id="wmsx-browserinfo">' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
};

wmsx.SettingsGUI.css = function() {
    return '#wmsx-cover {' +
           'position: fixed;' +
           'top: 0;' +
           'right: 0;' +
           'bottom: 0;' +
           'left: 0;' +
           'visibility: hidden;' +
           'outline: none;' +
           'opacity: 0;' +
           'background: rgba(0, 0, 0, 0.6);' +
           'transition: all .2s ease-out;' +
           'user-select: none;' +
           '-webkit-user-select: none;' +
           '-moz-user-select: none;' +
           '-ms-user-select: none;' +
           'z-index: 999999;' +
       '}' +

       '#wmsx-cover.wmsx-show {' +
           'visibility: visible;' +
           'opacity: 1;' +
       '}' +

       '#wmsx-modal {' +
           'position: relative;' +
           'overflow: hidden;' +
           'width: 600px;' +
           'top: 50px;' +
           'left: -120px;' +
           'margin: 0 auto;' +
           'color: rgba(0, 0, 0, 0.90);' +
           'font: normal 13px sans-serif;' +
           'box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);' +
           'transition: all .2s ease-out;' +
       '}' +

       '#wmsx-modal.wmsx-show {' +
           'left: -0px;' +
       '}' +

       '#wmsx-modal .wmsx-hotkey {' +
           'height: 27px;' +
           'padding: 3px 5px;' +
           'box-sizing: border-box;' +
       '}' +

       '#wmsx-modal .wmsx-heading {' +
           'font-weight: 700;' +
           'color: rgba(0, 0, 0, .60);' +
       '}' +

       '#wmsx-modal .wmsx-hotkey .wmsx-command {' +
           'position: relative;' +
           'float: left;' +
           'font-weight: 600;' +
           'color: rgba(0, 0, 0, .54);' +
       '}' +

       '#wmsx-modal .wmsx-hotkey .wmsx-desc {' +
           'float: left;' +
           'padding-top: 3px;' +
       '}' +

       '#wmsx-modal .wmsx-hotkey-msx {' +
           'font-weight: 600;' +
           'color: rgba(0, 0, 0, .54);' +
       '}' +

       '#wmsx-modal .wmsx-key {' +
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
           'color: rgba(0, 0, 0, .71);' +
           'background: white;' +
           'border-radius: 3px;' +
           'border: 1px solid rgb(210, 210, 210);' +
           'box-shadow: 0 1px 0 1px rgba(0, 0, 0, .5);' +
           'text-align: center;' +
       '}' +

       '#wmsx-modal .wmsx-key-msx {' +
           'width: 65px;' +
           'color: rgb(255, 255, 255);' +
           'background: rgb(90, 90, 90);' +
           'font-weight: normal;' +
           'border-radius: 0px;' +
           'border: 1px solid rgb(140, 140, 140);' +
           'box-shadow: 0 0 0 1px rgba(0, 0, 0, .3);' +
           '-webkit-font-smoothing: antialiased;' +
           '-moz-osx-font-smoothing: grayscale;' +
       '}' +

       '#wmsx-modal .wmsx-key-msx-stop {' +
           'background: rgb(235, 50, 50);' +
           'border: 1px solid rgb(250, 110, 110);' +
       '}' +

       '#wmsx-modal .wmsx-key-fixed {' +
           'width: 31px;' +
           'padding-left: 0;' +
           'padding-right: 2px;' +
       '}' +

       '#wmsx-menu {' +
           'position: relative;' +
           'background: white;' +
           'border-bottom: 1px solid rgb(200, 200, 200);' +
       '}' +

       '#wmsx-menu #wmsx-back {' +
           'position: absolute;' +
           'width: 18px;' +
           'height: 32px;' +
           'margin: 3px;' +
           'padding: 0 11px;' +
           'font-size: 35px;' +
           'color: white;' +
           'cursor: pointer;' +
           'box-sizing: content-box;' +
           '-webkit-font-smoothing: antialiased;' +
           '-moz-osx-font-smoothing: grayscale;' +
       '}' +

       '#wmsx-menu #wmsx-back:hover {' +
           'background: rgba(0, 0, 0, .12);' +
       '}' +

       '#wmsx-menu #wmsx-back-arrow {' +
           'position: relative;' +
           'overflow: hidden;' +
           'top: -7px;' +
       '}' +

       '#wmsx-menu .wmsx-caption {' +
           'height: 29px;' +
           'margin: 0 -1px;' +
           'padding: 10px 0 0 48px;' +
           'font-size: 18px;' +
           'color: white;' +
           'background: rgb(235, 40, 35);' +
           'box-shadow: 0 1px 4px rgba(0, 0, 0, .80);' +
           'vertical-align: middle;' +
           'box-sizing: content-box;' +
           '-webkit-font-smoothing: antialiased;' +
           '-moz-osx-font-smoothing: grayscale;' +
       '}' +

       '#wmsx-menu .items {' +
           'position: relative;' +
           'width: 75%;' +
           'height: 39px;' +
           'margin: 0 auto;' +
           'font-weight: 600;' +
       '}' +

       '#wmsx-menu .item {' +
           'float: left;' +
           'width: 25%;' +
           'height: 100%;' +
           'padding-top: 13px;' +
           'font-size: 14px;' +
           'color: rgba(0, 0, 0, .43);' +
           'text-align: center;' +
           'cursor: pointer;' +
       '}' +

       '#wmsx-menu .wmsx-selected {' +
           'color: rgb(235, 40, 35);' +
       '}' +

       '#wmsx-menu #wmsx-menu-selection {' +
           'position: absolute;' +
           'left: 0;' +
           'bottom: 0;' +
           'width: 25%;' +
           'height: 3px;' +
           'background: rgb(235, 40, 35);' +
           'transition: left 0.3s ease-in-out;' +
       '}' +

    '' +
       '#wmsx-content {' +
           'position: relative;' +
           'left: 0;' +
           'width: 3000px;' +
           'height: 378px;' +
           'background: rgb(220, 220, 220);' +
           'transition: left 0.3s ease-in-out' +
       '}' +

       '#wmsx-general, #wmsx-inputs, #wmsx-media, #wmsx-controls, #wmsx-about {' +
           'position: absolute;' +
           'width: 600px;' +
           'height: 100%;' +
           'box-sizing: border-box;' +
       '}' +

       '#wmsx-general {' +
           'padding-top: 23px;' +
           'padding-left: 36px;' +
       '}' +

       '#wmsx-general .wmsx-left {' +
           'float: left;' +
           'width: 248px;' +
       '}' +

       '#wmsx-general .wmsx-left .wmsx-command {' +
           'width: 105px;' +
       '}' +

       '#wmsx-general .wmsx-right {' +
           'float: left;' +
       '}' +

       '#wmsx-general .wmsx-right .wmsx-command {' +
           'width: 160px;' +
       '}' +

       '#wmsx-media {' +
           'left: 600px;' +
       '}' +

       '#wmsx-media {' +
           'padding-top: 16px;' +
           'padding-left: 32px;' +
       '}' +

       '#wmsx-media .wmsx-top-left {' +
           'float: left;' +
           'width: 290px;' +
       '}' +

       '#wmsx-media .wmsx-top-right {' +
           'float: left;' +
       '}' +

       '#wmsx-media .wmsx-bottom-left {' +
           'float: left;' +
           'width: 294px;' +
       '}' +

       '#wmsx-media .wmsx-bottom-right {' +
           'float: left;' +
       '}' +

       '#wmsx-media .wmsx-top-left .wmsx-command {' +
           'width: 55px;' +
       '}' +

       '#wmsx-media .wmsx-top-right .wmsx-command {' +
           'width: 110px;' +
       '}' +

       '#wmsx-media .wmsx-bottom-left .wmsx-command {' +
           'width: 174px;' +
       '}' +

       '#wmsx-media .wmsx-bottom-right .wmsx-command {' +
           'width: 138px;' +
       '}' +

       '#wmsx-media .wmsx-bottom .wmsx-command {' +
           'width: 174px;' +
       '}' +

       '#wmsx-inputs {' +
           'left: 1200px;' +
       '}' +

       '#wmsx-inputs {' +
           'padding-top: 23px;' +
           'padding-left: 40px;' +
       '}' +

       '#wmsx-inputs .wmsx-left {' +
           'float: left;' +
           'width: 275px;' +
       '}' +

       '#wmsx-inputs .wmsx-left .wmsx-command {' +
           'width: 95px;' +
       '}' +

       '#wmsx-inputs .wmsx-right .wmsx-command {' +
           'width: 95px;' +
       '}' +

       '#wmsx-inputs .wmsx-bottom {' +
           'margin-left: 95px;' +
           'margin-top: 1000px;' +
       '}' +

       '#wmsx-inputs .wmsx-bottom .wmsx-command {' +
           'width: 100px;' +
       '}' +

       '#wmsx-about {' +
           'left: 1800px;' +
           'font-size: 18px;' +
       '}' +

       '#wmsx-about #wmsx-logo-version {' +
           'width: 380px;' +
           'height: 212px;' +
           'margin: 36px auto 24px;' +
           'color: rgba(255, 255, 255, 0.97);' +
           'padding-top: 170px;' +
           'box-sizing: border-box;' +
           'text-align: center;' +
           'background: black url("' + wmsx.Images.urls.logo + '") center 50px no-repeat;' +
           'box-shadow: 3px 3px 14px rgb(75, 75, 75);' +
           '-webkit-font-smoothing: antialiased;' +
           '-moz-osx-font-smoothing: grayscale;' +
       '}' +

       '#wmsx-about .wmsx-info {' +
           'line-height: 30px;' +
           'text-align: center;' +
       '}' +

       '#wmsx-about a {' +
           'color: rgb(0, 80, 230);' +
           'text-decoration: none;' +
       '}' +

       '#wmsx-about #wmsx-browserinfo {' +
           'position: absolute;' +
           'left: 0;' +
           'right: 0;' +
           'bottom: 7px;' +
           'font-size: 10px;' +
           'text-align: center;' +
           'color: transparent;' +
       '}' +

       '.wmsx-clear {' +
           'clear: both;' +
       '}' +

       '.wmsx-full-divider {' +
           'clear: both;' +
           'height: 21px;' +
       '}' +

       '#wmsx-general .wmsx-full-divider {' +
           'clear: both;' +
           'height: 18px;' +
       '}';
};

