// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file./**

// HTML and CSS data for Settings

wmsx.SettingsGUI = {};

wmsx.SettingsGUI.html = function() {
    return `

    <div id="wmsx-cover" class="wmsx-show">
        <div id="wmsx-modal" class="wmsx-show">
            <div id="wmsx-menu">
                <div id="wmsx-back">
                    <div id="wmsx-back-arrow">
                        &larr;
                    </div>
                </div>
                <div class="wmsx-caption">
                    WebMSX Help
                </div>
                <div class="wmsx-items">
                    <div id="wmsx-menu-general" class="wmsx-item wmsx-selected">
                        GENERAL
                    </div>
                    <div id="wmsx-menu-media" class="wmsx-item">
                        MEDIA
                    </div>
                    <div id="wmsx-menu-inputs" class="wmsx-item">
                        KEYBOARD
                    </div>
                    <div id="wmsx-menu-ports" class="wmsx-item">
                        PORTS
                    </div>
                    <div id="wmsx-menu-about" class="wmsx-item">
                        ABOUT
                    </div>
                    <div id="wmsx-menu-selection">
                    </div>
                </div>
            </div>
            <div id="wmsx-content">
                <div id="wmsx-general">
                    <div class="wmsx-left">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key">
                                    F11
                                </div>
                            </div>
                            <div class="wmsx-desc">
                                Power
                            </div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key">
                                    Shift
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    F11
                                </div>
                            </div>
                            <div class="wmsx-desc">Reset</div>
                        </div>
                        <div class="wmsx-full-divider"></div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Q
                                </div>
                            </div>
                            <div class="wmsx-desc">NTSC/PAL</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    W
                                </div>
                            </div>
                            <div class="wmsx-desc">V-Synch Modes</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    R
                                </div>
                            </div>
                            <div class="wmsx-desc">CRT Modes</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    T
                                </div>
                            </div>
                            <div class="wmsx-desc">CRT Filters</div>
                        </div>
                        <div class="wmsx-full-divider"></div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    D
                                </div>
                            </div>
                            <div class="wmsx-desc">Debug Modes</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    S
                                </div>
                            </div>
                            <div class="wmsx-desc">Sprite Modes</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    G
                                </div>
                            </div>
                            <div class="wmsx-desc">Capture Screen</div>
                        </div>
                        <div class="wmsx-full-divider"></div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-desc">Right-Click Bar Icons: Default Action</div>
                        </div>
                    </div>
                    <div class="wmsx-right">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    0 - 9
                                </div>
                            </div>
                            <div class="wmsx-desc">Load State</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Ctrl
                                </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    0 - 9
                                </div>
                            </div>
                            <div class="wmsx-desc">Save State</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Ctrl
                                </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    F11
                                </div>
                            </div>
                            <div class="wmsx-desc">Save State File</div>
                        </div>
                        <div class="wmsx-full-divider"></div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key">
                                    F12
                                </div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="wmsx-key">
                                    Shift
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    F12
                                </div>
                            </div>
                            <div class="wmsx-desc">Fast / Slow Speed</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key">
                                    Shift
                                </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Arrows
                                </div>
                            </div>
                            <div class="wmsx-desc">Adjust Speed</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    P
                                </div>
                            </div>
                            <div class="wmsx-desc">Toggle Pause</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    O
                                </div>&nbsp;/&nbsp;<div class="wmsx-key">
                                    F
                                </div>
                            </div>
                            <div class="wmsx-desc">Next Frame</div>
                        </div>
                        <div class="wmsx-full-divider"></div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Enter
                                </div>
                            </div>
                            <div class="wmsx-desc">Full Screen</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Ctrl
                                </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Arrows
                                </div>
                            </div>
                            <div class="wmsx-desc">Screen Size / Width</div>
                        </div>
                        <div class="wmsx-full-divider"></div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Backspace
                                </div>
                            </div>
                            <div class="wmsx-desc">Defaults</div>
                        </div>
                    </div>
                </div>
                <div id="wmsx-media">
                    <div class="wmsx-top-left">
                        <div class="wmsx-hotkey wmsx-heading">
                            Media Commands:
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key">
                                    F6
                                </div>
                            </div>
                            <div class="wmsx-desc">Load Disk</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key">
                                    F7
                                </div>
                            </div>
                            <div class="wmsx-desc">Load Cartridge</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key">
                                    F8
                                </div>
                            </div>
                            <div class="wmsx-desc">Load Cassette Tape</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-desc">
                                Right-Click Media Icons on the bottom bar
                            </div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-desc">
                                Drag &amp; Drop Files or URLs (auto detect)
                            </div>
                        </div>
                    </div>
                    <div class="wmsx-top-right">
                        <div class="wmsx-hotkey wmsx-heading">
                            Modifiers for Media Commands:
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                + <div class="wmsx-key">
                                    Shift
                                </div>
                            </div>
                            <div class="wmsx-desc">Use Drive B / Slot 2</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                + <div class="wmsx-key wmsx-key-fixed">
                                    Ctrl
                                </div>
                            </div>
                            <div class="wmsx-desc">Load Empty Media</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                + <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>
                            </div>
                            <div class="wmsx-desc">Remove Media</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                + <div class="wmsx-key wmsx-key-fixed">
                                    Ctrl
                                </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>
                            </div>
                            <div class="wmsx-desc">Save Media File</div>
                        </div>
                        <div class="wmsx-hotkey wmsx-clear">
                            <div class="wmsx-desc">
                                Right-Drag / Middle-Click: No Auto-Reset
                            </div>
                        </div>
                    </div>
                    <div class="wmsx-full-divider"></div>
                    <div class="wmsx-hotkey">
                        <div class="wmsx-command">
                            <div class="wmsx-key wmsx-key-fixed">
                                Ctrl
                            </div>
                        </div>
                        <div class="wmsx-desc">&nbsp;+ Drag &amp; Drop Disk Files to Load and Add Disks to the current Drive Stack
                        </div>
                    </div>
                    <div class="wmsx-hotkey">
                        <div class="wmsx-command">
                            <div class="wmsx-key wmsx-key-fixed">
                                Alt
                            </div>
                        </div>
                        <div class="wmsx-desc">&nbsp;+ Drag &amp; Drop Files or ZIP File to force "Files as Disk" or "ZIP as Disk" loading
                        </div>
                    </div>
                    <div class="wmsx-full-divider"></div>
                    <div class="wmsx-bottom-left">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Ctrl
                                </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Home
                                </div>
                            </div>
                            <div class="wmsx-desc">Rewind Tape</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Ctrl
                                </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Pg Up / Dn
                                </div>
                            </div>
                            <div class="wmsx-desc">Seek Tape</div>
                        </div>
                    </div>
                    <div class="wmsx-bottom-right">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    Pg Up / Dn
                                </div>
                            </div>
                            <div class="wmsx-desc">Select Disk</div>
                        </div>
                    </div>
                    <div class="wmsx-clear"></div>
                    <div class="wmsx-hotkey wmsx-bottom">
                        <div class="wmsx-command">
                            <div class="wmsx-key">
                                Shift
                            </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                Ctrl
                            </div>&nbsp;<div class="wmsx-key wmsx-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                F8
                            </div>
                        </div>
                        <div class="wmsx-desc">
                            Auto-Run Cassette program at current Tape position
                        </div>
                    </div>
                </div>
                <div id="wmsx-inputs">
                    <div class="wmsx-left">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                C
                            </div>
                            </div>
                            <div class="wmsx-desc">Copy Screen Text</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                V
                            </div>
                            </div>
                            <div class="wmsx-desc">Open Text Paste box</div>
                        </div>
                    </div>
                    <div class="wmsx-right">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    H
                                </div>
                            </div>
                            <div class="wmsx-desc">Adjust Turbo-Fire speed</div>
                        </div>
                    </div>
                    <div class="wmsx-full-divider"></div>
                    <div class="wmsx-bottom">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    K
                                </div>
                            </div>
                            <div class="wmsx-desc">Toggle Keyboards</div>
                        </div>
                        <div id="wmms-inputs-keyboard-name" class="wmsx-hotkey wmsx-link">
                            Keyboard:
                        </div>
                        <div id="wmsx-keyboard"></div>
                    </div>
                    <div class="wmsx-footer">
                        (hover mouse pointer over MSX Keyboard keys to display/modify mappings)
                    </div>
                </div>
                <div id="wmsx-ports">
                    <div class="wmsx-left">
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    M
                                </div>
                            </div>
                            <div class="wmsx-desc">Toggle Mouse</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    J
                                </div>
                            </div>
                            <div class="wmsx-desc">Toggle Joysticks</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    L
                                </div>
                            </div>
                            <div class="wmsx-desc">Toggle Joykeys</div>
                        </div>
                        <div class="wmsx-hotkey">
                            <div class="wmsx-command">
                                <div class="wmsx-key wmsx-key-fixed">
                                    Alt
                                </div>&nbsp;+&nbsp;<div class="wmsx-key">
                                    H
                                </div>
                            </div>
                            <div class="wmsx-desc">Adjust Turbo-Fire speed</div>
                        </div>
                    </div>
                    <div class="wmsx-right">
                        <div id="wmsx-ports-mouse-mode" class="wmsx-hotkey wmsx-link wmsx-mouse-device">Mouse Mode: AUTO</div>
                        <div id="wmsx-ports-joysticks-mode" class="wmsx-hotkey wmsx-link wmsx-joystick-device">Joysticks Mode: AUTO</div>
                        <div id="wmsx-ports-joykeys-mode" class="wmsx-hotkey wmsx-link wmsx-joykeys-device">Joykeys Mode: AUTO</div>
                    </div>
                    <div class="wmsx-full-divider"></div>
                    <div class="wmsx-bottom">
                        <div class="wmsx-bottom-left">
                            PORT 1
                            <div id="wmsx-ports-device1" class="wmsx-none-device">
                                <div id="wmsx-ports-device1-title" class="wmsx-device-title">NO DEVICE</div>
                                <div class="wmsx-joy">
                                    <div class="wmsx-joy-trig wmsx-joy-trig1">
                                    </div>
                                    <div class="wmsx-joy-trig wmsx-joy-trig2">
                                    </div>
                                    <div class="wmsx-joy-middle">
                                    </div>
                                    <div class="wmsx-joy-logo">
                                    </div>
                                    <div class="wmsx-joy-outleft">
                                    </div>
                                    <div class="wmsx-joy-outright">
                                    </div>
                                    <div class="wmsx-joy-left">
                                        <div class="wmsx-joy-dir wmsx-joy-dirh"></div>
                                        <div class="wmsx-joy-dir wmsx-joy-dirv"></div>
                                        <div class="wmsx-joy-dir-center"></div>
                                    </div>
                                    <div class="wmsx-joy-right">
                                        <div class="wmsx-joy-button wmsx-joy-button1"></div>
                                        <div class="wmsx-joy-button wmsx-joy-button2"></div>
                                        <div class="wmsx-joy-button wmsx-joy-button3"></div>
                                        <div class="wmsx-joy-button wmsx-joy-button4"></div>
                                    </div>
                                    <div class="wmsx-joy-center">
                                        <div class="wmsx-joy-button wmsx-joy-buttona"></div>
                                        <div class="wmsx-joy-button wmsx-joy-buttonb"></div>
                                    </div>
                                    <div id="wmsx-joy1-up" class="wmsx-joy-hs wmsx-joy-hs-up">&#9650;</div>
                                    <div id="wmsx-joy1-down" class="wmsx-joy-hs wmsx-joy-hs-down">&#9660;</div>
                                    <div id="wmsx-joy1-left" class="wmsx-joy-hs wmsx-joy-hs-left">&#9668;</div>
                                    <div id="wmsx-joy1-right" class="wmsx-joy-hs wmsx-joy-hs-right">&#9658;</div>
                                    <div id="wmsx-joy1-button1" class="wmsx-joy-hs wmsx-joy-hs-button1">1</div>
                                    <div id="wmsx-joy1-button2" class="wmsx-joy-hs wmsx-joy-hs-button2">2</div>
                                    <div id="wmsx-joy1-button3" class="wmsx-joy-hs wmsx-joy-hs-button3">X</div>
                                    <div id="wmsx-joy1-button4" class="wmsx-joy-hs wmsx-joy-hs-button4">Y</div>
                                    <div id="wmsx-joy1-button5" class="wmsx-joy-hs wmsx-joy-hs-button5">L</div>
                                    <div id="wmsx-joy1-button6" class="wmsx-joy-hs wmsx-joy-hs-button6">R</div>
                                    <div id="wmsx-joy1-button7" class="wmsx-joy-hs wmsx-joy-hs-button7">A</div>
                                    <div id="wmsx-joy1-button8" class="wmsx-joy-hs wmsx-joy-hs-button8">B</div>
                                </div>
                                <div class="wmsx-mouse">
                                    <div class="wmsx-mouse-body">
                                        <div class="wmsx-mouse-button1"></div><div class="wmsx-mouse-button2"></div>
                                    </div>
                                </div>
                                <div class="wmsx-none">&#8416;</div>
                            </div>
                        </div>
                        <div class="wmsx-bottom-right">
                            PORT 2
                            <div id="wmsx-ports-device2" class="wmsx-none-device">
                                <div id="wmsx-ports-device2-title" class="wmsx-device-title">NO DEVICE</div>
                                <div class="wmsx-joy">
                                    <div class="wmsx-joy-trig wmsx-joy-trig1">
                                    </div>
                                    <div class="wmsx-joy-trig wmsx-joy-trig2">
                                    </div>
                                    <div class="wmsx-joy-middle">
                                    </div>
                                    <div class="wmsx-joy-logo">
                                    </div>
                                    <div class="wmsx-joy-outleft">
                                    </div>
                                    <div class="wmsx-joy-outright">
                                    </div>
                                    <div class="wmsx-joy-left">
                                        <div class="wmsx-joy-dir wmsx-joy-dirh"></div>
                                        <div class="wmsx-joy-dir wmsx-joy-dirv"></div>
                                        <div class="wmsx-joy-dir-center"></div>
                                    </div>
                                    <div class="wmsx-joy-right">
                                        <div class="wmsx-joy-button wmsx-joy-button1"></div>
                                        <div class="wmsx-joy-button wmsx-joy-button2"></div>
                                        <div class="wmsx-joy-button wmsx-joy-button3"></div>
                                        <div class="wmsx-joy-button wmsx-joy-button4"></div>
                                    </div>
                                    <div class="wmsx-joy-center">
                                        <div class="wmsx-joy-button wmsx-joy-buttona"></div>
                                        <div class="wmsx-joy-button wmsx-joy-buttonb"></div>
                                    </div>
                                    <div id="wmsx-joy2-up" class="wmsx-joy-hs wmsx-joy-hs-up">&#9650;</div>
                                    <div id="wmsx-joy2-down" class="wmsx-joy-hs wmsx-joy-hs-down">&#9660;</div>
                                    <div id="wmsx-joy2-left" class="wmsx-joy-hs wmsx-joy-hs-left">&#9668;</div>
                                    <div id="wmsx-joy2-right" class="wmsx-joy-hs wmsx-joy-hs-right">&#9658;</div>
                                    <div id="wmsx-joy2-button1" class="wmsx-joy-hs wmsx-joy-hs-button1">1</div>
                                    <div id="wmsx-joy2-button2" class="wmsx-joy-hs wmsx-joy-hs-button2">2</div>
                                    <div id="wmsx-joy2-button3" class="wmsx-joy-hs wmsx-joy-hs-button3">X</div>
                                    <div id="wmsx-joy2-button4" class="wmsx-joy-hs wmsx-joy-hs-button4">Y</div>
                                    <div id="wmsx-joy2-button5" class="wmsx-joy-hs wmsx-joy-hs-button5">L</div>
                                    <div id="wmsx-joy2-button6" class="wmsx-joy-hs wmsx-joy-hs-button6">R</div>
                                    <div id="wmsx-joy2-button7" class="wmsx-joy-hs wmsx-joy-hs-button7">A</div>
                                    <div id="wmsx-joy2-button8" class="wmsx-joy-hs wmsx-joy-hs-button8">B</div>
                                </div>
                                <div class="wmsx-mouse">
                                    <div class="wmsx-mouse-body">
                                        <div class="wmsx-mouse-button1"></div><div class="wmsx-mouse-button2"></div>
                                    </div>
                                </div>
                                <div class="wmsx-none">&#8416;</div>
                            </div>
                        </div>
                    </div>
                    <div class="wmsx-footer">
                        (hover mouse pointer over Controller buttons to display/modify mappings)
                    </div>
                </div>
                <div id="wmsx-about">
                    <div id="wmsx-logo-version">
                        WebMSX&nbsp;&nbsp;-&nbsp;&nbsp;${ WMSX.VERSION }
                    </div>
                    <div class="wmsx-info">
                        ${ atob("Q3JlYXRlZCBieSBQYXVsbyBBdWd1c3RvIFBlY2Npbg==") }
                        <br>
                        ${ atob("PGEgdGFyZ2V0PSJfYmxhbmsiIGhyZWY9Imh0dHA6Ly93ZWJtc3gub3JnIj5odHRwOi8vd2VibXN4Lm9yZzwvYT4=") }
                    </div>
                        <div id="wmsx-browserinfo">
                    </div>
                </div>
                <div id="wmsx-keyboard-popup">
                    Key mapped to:
                    <br>
                    <div id="wmsx-keyboard-popup-keys" class="wmsx-command"></div>
                    <div>Press new key.</div>
                    <div>(right-click to clear)</div>
                </div>
            </div>
        </div>
    </div>
`;
};


wmsx.SettingsGUI.css = function() {
    return `

#wmsx-cover {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    visibility: hidden;
    outline: none;
    opacity: 0;
    background: rgba(0, 0, 0, 0.6);
    transition: all .2s ease-out;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    z-index: 999998;
}

#wmsx-cover.wmsx-show {
    visibility: visible;
    opacity: 1;
}

#wmsx-modal {
    position: relative;
    overflow: hidden;
    width: 600px;
    top: 50px;
    left: -120px;
    margin: 0 auto;
    color: rgba(0, 0, 0, 0.90);
    font: normal 13px sans-serif;
    box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);
    transition: all .2s ease-out;
}

#wmsx-modal.wmsx-show {
    left: -0px;
}

#wmsx-modal .wmsx-hotkey {
    height: 27px;
    padding: 3px 5px;
    box-sizing: border-box;
}

#wmsx-modal .wmsx-heading {
    font-weight: 700;
    color: rgba(0, 0, 0, .72);
}

#wmsx-modal .wmsx-link {
    font-weight: 700;
    line-height: 21px;
    color: hsl(228, 90%, 40%);
    cursor: pointer;
}

#wmsx-modal .wmsx-command {
    position: relative;
    display: inline-block;
    font-weight: 600;
    color: rgba(0, 0, 0, .54);
}

#wmsx-modal .wmsx-hotkey .wmsx-desc {
    display: inline-block;
    line-height: 21px;
}

#wmsx-modal .wmsx-key {
    position: relative;
    display: inline-block;
    top: -1px;
    min-width: 25px;
    height: 21px;
    padding: 4px 6px 3px;
    box-sizing: border-box;
    font-weight: 600;
    font-size: 12px;
    line-height: 12px;
    color: rgba(0, 0, 0, .71);
    background: white;
    border-radius: 3px;
    border: 1px solid rgb(210, 210, 210);
    box-shadow: 0 1px 0 1px rgba(0, 0, 0, .5);
    text-align: center;
}

#wmsx-modal .wmsx-key-fixed {
    width: 31px;
    padding-left: 0;
    padding-right: 2px;
}

.wmsx-footer {
    width: 543px;
    margin-top: 16px;
    text-align: center;
}

#wmsx-menu {
    position: relative;
    background: white;
    border-bottom: 1px solid rgb(200, 200, 200);
}

#wmsx-menu #wmsx-back {
    position: absolute;
    width: 18px;
    height: 32px;
    margin: 3px;
    padding: 0 11px;
    font-size: 35px;
    color: white;
    cursor: pointer;
    box-sizing: content-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#wmsx-menu #wmsx-back:hover {
    background: rgba(0, 0, 0, .12);
}

#wmsx-menu #wmsx-back-arrow {
    position: relative;
    overflow: hidden;
    top: -7px;
}

#wmsx-menu .wmsx-caption {
    height: 29px;
    margin: 0 -1px;
    padding: 10px 0 0 48px;
    font-size: 18px;
    color: white;
    background: rgb(235, 40, 35);
    box-shadow: 0 1px 4px rgba(0, 0, 0, .80);
    vertical-align: middle;
    box-sizing: content-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#wmsx-menu .wmsx-items {
    position: relative;
    width: 80%;
    height: 39px;
    margin: 0 auto;
    font-weight: 600;
}

#wmsx-menu .wmsx-item {
    float: left;
    width: 20%;
    height: 100%;
    padding-top: 13px;
    font-size: 14px;
    color: rgba(0, 0, 0, .43);
    text-align: center;
    cursor: pointer;
}

#wmsx-menu .wmsx-selected {
    color: rgb(235, 40, 35);
}

#wmsx-menu #wmsx-menu-selection {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 20%;
    height: 3px;
    background: rgb(235, 40, 35);
    transition: left 0.3s ease-in-out;
}

#wmsx-content {
    position: relative;
    left: 0;
    width: 3000px;
    height: 378px;
    background: rgb(218, 218, 218);
    transition: left 0.3s ease-in-out
}

#wmsx-general, #wmsx-inputs, #wmsx-media, #wmsx-ports, #wmsx-about {
    position: absolute;
    width: 600px;
    height: 100%;
    box-sizing: border-box;
}

#wmsx-general {
    padding-top: 23px;
    padding-left: 36px;
}

#wmsx-general .wmsx-left {
    float: left;
    width: 248px;
}

#wmsx-general .wmsx-left .wmsx-command {
    width: 105px;
}

#wmsx-general .wmsx-right {
    float: left;
}

#wmsx-general .wmsx-right .wmsx-command {
    width: 160px;
}

#wmsx-media {
    left: 600px;
}

#wmsx-media {
    padding-top: 16px;
    padding-left: 32px;
}

#wmsx-media .wmsx-top-left {
    float: left;
    width: 290px;
}

#wmsx-media .wmsx-top-right {
    float: left;
}

#wmsx-media .wmsx-bottom-left {
    float: left;
    width: 294px;
}

#wmsx-media .wmsx-bottom-right {
    float: left;
}

#wmsx-media .wmsx-top-left .wmsx-command {
    width: 55px;
}

#wmsx-media .wmsx-top-right .wmsx-command {
    width: 110px;
}

#wmsx-media .wmsx-bottom-left .wmsx-command {
    width: 174px;
}

#wmsx-media .wmsx-bottom-right .wmsx-command {
    width: 138px;
}

#wmsx-media .wmsx-bottom .wmsx-command {
    width: 174px;
}

#wmsx-inputs {
    left: 1200px;
    padding: 26px 0 0 33px;
}

#wmsx-inputs .wmsx-left {
    float: left;
    width: 290px;
}

#wmsx-inputs .wmsx-command {
    width: 91px;
}

#wmsx-inputs .wmsx-bottom {
    margin-top: 11px;
}

#wmsx-inputs .wmsx-bottom .wmsx-hotkey {
    display: inline-block;
    width: 230px;
}

#wmsx-inputs .wmsx-bottom .wmsx-link {
    width: 297px;
    text-align: right;
}

#wmsx-keyboard {
    position: relative;
    left: -1px;
    width: 536px;
    height: 178px;
    margin-top: 5px;
    background: rgb(76, 76, 76);
    border-radius: 1px 1px 0 0;
    box-sizing: border-box;
    box-shadow: 0 1px 0 1px rgb(10, 10, 10);
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
    background: linear-gradient(90deg, rgb(166, 166, 166), rgb(172, 172, 172), rgb(172, 172, 172), rgb(182, 182, 182));
    border: 3px solid rgba(0, 0, 0, .25);
    border-top: 1px solid rgba(0, 0, 0, .10);
    border-bottom: 5px solid rgba(0, 0, 0, .5);
    border-radius: 3px 3px 0 0;
    box-shadow: 0 1px 0 1px rgb(0, 0, 0);
    cursor: pointer;
}
.wmsx-keyboard-key.wmsx-keyboard-key-dark {
    background: rgb(127, 127, 127);
}
.wmsx-keyboard-key.wmsx-keyboard-key-unmapped {
    color: rgb(40, 40, 40);
    font-weight: bold;
}
#wmsx-keyboard-alpha, #wmsx-keyboard-num, #wmsx-keyboard-arrows {
    position: absolute;
    top: 12px;
}
#wmsx-keyboard-alpha {
    left: 14px;
}
#wmsx-keyboard-num {
    left: 427px;
}
#wmsx-keyboard-arrows {
    top: 118px;
    left: 427px;
}
#wmsx-keyboard-f1, #wmsx-keyboard-f2, #wmsx-keyboard-f3, #wmsx-keyboard-f4, #wmsx-keyboard-f5,
#wmsx-keyboard-stop, #wmsx-keyboard-select, #wmsx-keyboard-home, #wmsx-keyboard-insert, #wmsx-keyboard-delete {
    width: 37px;
    height: 18px;
    padding: 2px 0;
    font-size: 9px;
    line-height: 9px;
    border-width: 1px 2px 4px;
    margin-bottom: 12px;
    background: rgb(172, 172, 172);
}
#wmsx-keyboard-stop, #wmsx-keyboard-select, #wmsx-keyboard-home, #wmsx-keyboard-insert, #wmsx-keyboard-delete {
    width: 37px;
}
#wmsx-keyboard-stop {
    background: rgb(240, 80, 60);
    margin-left: 18px;
}
#wmsx-keyboard-escape, #wmsx-keyboard-backspace {
    width: 29px;
}
#wmsx-keyboard-tab {
    width: 41px;
}
#wmsx-keyboard-control {
    width: 48px;
}
#wmsx-keyboard-shift, #wmsx-keyboard-shift2 {
    width: 61px;
}
#wmsx-keyboard-enter {
    width: 36px;
    border-radius: 2px 0 0 0;
    border-top-width: 0;
}
#wmsx-keyboard-enter_x1 {
    width: 13px;
    min-width: 0;
    margin-right: 0;
    border-radius: 2px 0 0 0;
    border-width: 1px;
    border-right: none;
    box-shadow: -1px 1px 0 0 rgb(0, 0, 0)
}
#wmsx-keyboard-enter_x2 {
    width: 30px;
    border-bottom: none;
    border-radius: 0 3px 0 0;
    box-shadow: 1px 1px 0 0 rgb(0, 0, 0)
}
#wmsx-keyboard-space {
    width: 181px;
    background: rgb(172, 172, 172);
}
#wmsx-keyboard-capslock {
    margin-left: 15px;
    width: 38px;
}
#wmsx-keyboard-dead {
    width: 38px;
}
#wmsx-keyboard-graph, #wmsx-keyboard-code {
    width: 46px;
}
#wmsx-keyboard-num .wmsx-keyboard-key {
    width: 23px;
    height: 23px;
}
#wmsx-keyboard-arrows .wmsx-keyboard-key {
    font-size: 8px;
    line-height: 8px;
    background: rgb(70, 85, 180);
    border-width: 1px 2px 4px;
    border-radius: 2px 2px 0 0;
}
#wmsx-keyboard-arrows #wmsx-keyboard-left, #wmsx-keyboard-arrows #wmsx-keyboard-right {
    top: 5px;
    width: 26px;
    height: 34px;
    padding-top: 11px;
}
#wmsx-keyboard-arrows #wmsx-keyboard-up, #wmsx-keyboard-arrows #wmsx-keyboard-down {
    width: 41px;
    height: 22px;
    padding-top: 5px;
}
#wmsx-keyboard-arrows #wmsx-keyboard-down {
    position: absolute;
    top: 22px;
    left: 27px;
}

#wmsx-ports {
    left: 1800px;
    padding: 26px 0 0 27px;
}

#wmsx-ports .wmsx-left {
    float: left;
    width: 285px;
    padding-left: 26px;
}

#wmsx-ports .wmsx-right {
    float: left;
}

#wmsx-ports .wmsx-command {
    width: 91px;
}

#wmsx-ports .wmsx-bottom {
    width: 546px;
    text-align: center;
}

#wmsx-ports .wmsx-bottom-left, #wmsx-ports .wmsx-bottom-right {
    display: inline-block;
    height: 162px;
    margin-top: 5px;
    vertical-align: top;
    text-align: center;
    font-size: 14px;
    line-height: 14px;
    font-weight: bold;
    color: hsl(0, 0%, 32%);
}

#wmsx-ports .wmsx-device-title {
    margin-top: 14px;
    height: 12px;
    font-size: 12px;
    line-height: 12px;
    font-weight: bold;
    color: hsl(0, 0%, 35%);
    text-align: center;
}

#wmsx-ports .wmsx-joystick-device .wmsx-joy, #wmsx-ports .wmsx-joykeys-device .wmsx-joy {
    display: block;
}
#wmsx-ports .wmsx-mouse-device .wmsx-mouse {
    display: block;
}
#wmsx-ports .wmsx-none-device .wmsx-none {
    display: block;
}

#wmsx-ports .wmsx-mouse-device, #wmsx-ports .wmsx-mouse-device .wmsx-device-title {
    color: hsl(120, 100%, 30%);
}
#wmsx-ports .wmsx-joystick-device, #wmsx-ports .wmsx-joystick-device .wmsx-device-title {
    color: hsl(228, 90%, 40%)
}
#wmsx-ports .wmsx-joykeys-device, #wmsx-ports .wmsx-joykeys-device .wmsx-device-title {
    color: hsl(0, 90%, 43%);
}

#wmsx-ports .wmsx-joy {
    display: none;
    position: relative;
    top: 14px;
    width: 250px;
    margin: 0 10px;
    font-weight: bold;
    text-align: center;
    vertical-align: top;
    box-sizing: border-box;
}

.wmsx-joy .wmsx-joy-trig {
    position: absolute;
    top: -6px;
    width: 45px;
    height: 40px;
    background: hsl(0, 0%, 68%);
    border-radius: 5px;
    box-shadow: inset 1px 1px 1px hsl(0, 0%, 98%), 0 2px 2px 2px hsl(0, 0%, 47%);
}
.wmsx-joy .wmsx-joy-trig1 {
    left: 25px;
    border-top-left-radius: 16px;
}
.wmsx-joy .wmsx-joy-trig2 {
    right: 25px;
    border-top-right-radius: 16px;
}

.wmsx-joy .wmsx-joy-middle {
    position: absolute;
    left: 2px;
    right: 2px;
    height: 86px;
    background: white;
    background: linear-gradient(hsl(0, 0%, 94%), white, white, hsl(0, 0%, 93%));
    border-radius: 50px 50px 40px 40px;
    box-shadow:
    0 5px 0 0     hsl(0, 0%, 78%),
    0 1px 2px 1px hsl(0, 0%, 62%),
    0 6px 3px 1px hsl(0, 0%, 46%);
}

.wmsx-joy-logo {
    position: absolute;
    top: 17px;
    left: 101px;
    width: 46px;
    height: 14px;
    background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAOCAYAAABU4P48AAAGXklEQVRIx9VWbUyUVxZ+3vedd2YYvmYQhrF8CNuCWMoKgqhp7a7rtutC9gOMrtnEuEZ0daHaWLtsqV2DGnaTkqbJbsq2dmti2ZZ1I2m0mHZr1JKCgDUja3EHbEUHBDowMzAM77xf9579USQ0Xfu/z697T87JeXKec8+5wDyovk7AdwALJB+y2zznH13+53yb9YdDmuabMM1geVzcSgD66ZlIX1VyYplEcN5QtXMb/nPz6AsNDT/du3t3Y1RR2OXLl9+sra39e1NT07YtW7Y8p2ma0tvbe2rXrl1v1NfXL9m0adNOl8tVQUSJRPSNwlgsFkHX9etlZWUvAPi8qrq69NixY81zipIhybLR1dn52oH9+98AYCwEpduseZ8UP3aXNjxO9ORaaitcrtD6NUQb19OLuctC9EQ50ZPr6JPvr1DswI6ujo4hmkdbW9ssgOozZ84MLLJFAez0er2fRqNR4pzTt0HVdXrx8OELAFb++8KFTkXXyeCMLnZ2stzc3JMAkgHAstASwGSfonz6eGJCNqwy/quqDIybAFmSJFEeVzVjqc0mF1jlOAmoWF5cnHU/trS0NAHAz0pKSpbdt7ndbltFRcVv8/PzVzkcDszMzCAcDkOSpK/yEYFxDkEU4Xa7YbPb8btnntmY7HS2lZSVPgJRxNj4BPbu2X1reHj4PQCzXyMc0PTI9ahyCamsGpBRYLdbhnWd51ok/CIx3n4+MhvblSLJSyDgEZtclux22+7HZmZmoqioaH1WVpZjQbH0dLGqqmqFIAiIxWKoq6sLt7a2Xnc6nZosy9bUtLQ4q9UqK4oi76utza3Zsycp0ZWMnTU1BVa7Haqm4bmDB0NDvsF/AOgAwL/Rz9sf8vx8ZHXxLP1gHU2WF7PWFXlztLaUaF0Z/TItJUDlJeR/OJs3bK6OMMYW5DQMg1pbW9XFEkejUWpvb4+Njo6ajHPyj4ywkdFRYyIQ0L/w+8NHjx9/CUA+AJcrJeXAlatXI+FYjEKKQpNzc9TU3KwAeBuAazFJcdGZhmMxf38sdhemiVSLLA7MKYwxRiCOBFGUpzSdfzgeMNY89WOrIAgL0kqShK1bt9oAgHMOToT4+HjMzEZw4eJFDYKArMxMMSMjw5KaliZ7PB5n3bPPHn2psfFlACwcCr17x++fMBiDbhpQNR3nOzoiAF4BEF5MWFp88atabHVi4tq1cfZCcEK/qrJMi0VyioKoEYm3NUO/EQxT8aHnxWU5OVIwGCSv18uzs7NFUZLAGMOAz8dNk8MR7xCC4WnzWGNjt9frjQVCodSbPp/g8/koyeWCIyFBSExKyj154sTEn1599emfVFZWQhRFDgEEwqqysoSLH300NjM9/fGDKgwAc1PMGA7oBgPnKLBZZW9MNWcNExtsdus/A5NznuV5lJGdLRKA28O3WUtLyywAmIxBN0309fbq3b1X9JiuY1lurjXd42EnXn/9ZM2OHU3bt207XLdv3+mbgz5NNXTEJyVKss32602VlTUWq9Wi6ToGBwe5SYTMnBw0t7Q0AFjzbYTZQDT22eeqGjFMEx5BFHyqasYYgygAgZimi48VTqemp0uMc/T2XlXujvgDkZhCBufQdB09PVdCPd3dk7phkNvjEf919uzTM4bRPG0Yh0OqevzW2NivVpevsYsWGT09vWzvgf2Ppi1dmkaCgO6uLmNjefngtb6+WYMx5BcW2pr+8te3AXzvQYTpvalQr183IhYixAOSSGSZZQzgHCs5t4dXrlKS4uIESRTx/vvngpOTU9dD4WkmyzKmIxH4Boe+vOv3+yFJgmCxwCSCwRgM04RJBN0wYImLw8eXLuHmwADVHznihCDgzp072L558xCAP7x76tTpYCgMm92O9Rt/lPeb2tojAJK+NtYW4YvOqPK3rrm5gxGTOyYMwz8QUxMMw1xyi3M1u79//OChQ6mqpskffvBBH4CXT771luve2NgTwclJpauzs6uwqOhy09GjSVPBYB6IOM0/TgIgiCL1X7sWueH1jhxoaHD88fnfZ5imaT/X3j4Kzl8DcLb9nXe8nOC02W0VhmkI46P3Sm0Ox8Oaongf9H+Q52VIBzADQAGQBoABCAJIAWADcA/AbQBOAEXzq9MP4EsAHgA5/0dFAJiGIHwGIjeAgq/2FmYA9C/yibs/9ubz+wFM4LuG/wFQqng3L3GLVwAAAABJRU5ErkJggg==');
}

.wmsx-joy .wmsx-joy-outleft, .wmsx-joy .wmsx-joy-outright {
    position: absolute;
    width: 100px;
    height: 100px;
    background: white;
    border-radius: 1000px;
    transform-origin: 50px 50px;
    transform: rotate(6deg);
    box-shadow:
    0 5px 0 -1px      hsl(0, 0%, 78%),
    0 6px 0 -1px      hsl(0, 0%, 78%),
    -1px 8px 2px -2px hsl(0, 0%, 48%),
    0 9px 4px -2px    hsl(0, 0%, 38%);
}
.wmsx-joy .wmsx-joy-outright {
    right: 0;
    transform: rotate(-6deg);
    box-shadow:
    0 5px 0 -1px     hsl(0, 0%, 78%),
    0 6px 0 -1px     hsl(0, 0%, 78%),
    1px 8px 2px -2px hsl(0, 0%, 48%),
    0 9px 4px -2px   hsl(0, 0%, 38%);
}

.wmsx-joy .wmsx-joy-left, .wmsx-joy .wmsx-joy-right {
    position: absolute;
    top: 10px;
    width: 80px;
    height: 80px;
    background: hsl(0, 0%, 87%);
    border: 1px solid rgba(0, 0, 0, .11);
    border-right: none;
    border-bottom: none;
    border-radius: 1000px;
    box-sizing: border-box;
}
.wmsx-joy .wmsx-joy-left {
    left: 10px;
}
.wmsx-joy .wmsx-joy-left:before {
    content: "";
    position: absolute;
    top: 10px;
    left: 10px;
    width: 58px;
    height: 58px;
    background: hsl(0, 0%, 77%);
    border-radius: 1000px;
    box-sizing: border-box;
}
.wmsx-joy .wmsx-joy-right {
    right: 10px;
}
.wmsx-joy .wmsx-joy-right:before {
    content: "";
    position: absolute;
    top: 21px;
    right: 16px;
    width: 27px;
    height: 57px;
    background: hsl(0, 0%, 77%);
    border-radius: 1000px;
    box-sizing: border-box;
    transform: rotate(45deg);
}

.wmsx-joy .wmsx-joy-dir {
    position: absolute;
    color: hsl(0, 0%, 95%);
    font-size: 10px;
    line-height: 12px;
    background: hsl(0, 0%, 49%);
    border: 1px solid hsl(0, 0%, 64%);
    border-right-color: hsl(0, 0%, 42%);
    border-bottom-color: hsl(0, 0%, 35%);
    border-radius: 2px 2px 0 0;
    box-shadow:  0 3px 1px hsl(0, 0%, 40%), 0 3px 0 1px hsl(0, 0%, 15%);
    box-sizing: border-box;
}
.wmsx-joy .wmsx-joy-dirh {
    top: 29px;
    left: 16px;
    width: 46px;
    height: 14px;
}
.wmsx-joy .wmsx-joy-dirv {
    top: 13px;
    left: 32px;
    width: 14px;
    height: 45px;
}
.wmsx-joy .wmsx-joy-dir-center {
    position: absolute;
    top: 30px;
    left: 31px;
    width: 16px;
    height: 12px;
    background: hsl(0, 0%, 49%);
}
.wmsx-joy .wmsx-joy-dir-center:after {
    content: '';
    position: absolute;
    top: 2px;
    left: 4px;
    height: 8px;
    width: 8px;
    border-radius: 1000px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.25), inset 1px 1px 2px -1px rgba(0, 0, 0, 0.25), 1px 1px 0 rgba(255, 255, 255, 0.27);
}

.wmsx-joy .wmsx-joy-button {
    position: absolute;
    width: 19px;
    height: 19px;
    color: hsl(0, 0%, 97%);
    border-radius: 1000px;
}

.wmsx-joy .wmsx-joy-button1 {
    top: 47px;
    left: 30px;
    background: hsl(132, 90%, 41%);
    box-shadow: inset 0 2px 1px rgba(0, 0, 0, 0.1), 0 3px 0 0 hsl(127, 90%, 30%), 0 3px 0 1px hsl(0, 0%, 15%);
}
.wmsx-joy .wmsx-joy-button2 {
    top: 27px;
    left: 50px;
    background: hsl(0, 94%, 63%);
    box-shadow: inset 0 2px 1px rgba(0, 0, 0, 0.1), 0 3px 0 0 hsl(0, 90%, 43%), 0 3px 0 1px hsl(0, 0%, 15%);
}
.wmsx-joy .wmsx-joy-button3 {
    top: 27px;
    left: 10px;
    background: hsl(234, 80%, 66%);
    box-shadow: inset 0 2px 1px rgba(0, 0, 0, 0.1), 0 3px 0 0 hsl(234, 80%, 47%), 0 3px 0 1px hsl(0, 0%, 15%);
}
.wmsx-joy .wmsx-joy-button4 {
    top: 07px;
    left: 30px;
    background: hsl(58, 100%, 44%);
    box-shadow: inset 0 2px 1px rgba(0, 0, 0, 0.06), 0 3px 0 0 hsl(56, 100%, 33%), 0 3px 0 1px hsl(0, 0%, 15%);
}

.wmsx-joy .wmsx-joy-center .wmsx-joy-button {
    position: absolute;
    top: 43px;
    width: 18px;
    height: 09px;
    color: hsl(0, 0%, 58%);
    border-radius: 1000px;
    background: hsl(0, 0%, 85%);
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1), 0 2px 0 0 hsl(0, 0%, 65%), 0 2px 0 1px hsl(0, 0%, 33%);
}

.wmsx-joy .wmsx-joy-center .wmsx-joy-buttona {
    left: 103px;
    border-top-right-radius: 1px;
    border-bottom-right-radius: 1px;
}
.wmsx-joy .wmsx-joy-center .wmsx-joy-buttonb {
    right: 103px;
    border-top-left-radius: 1px;
    border-bottom-left-radius: 1px;
}

.wmsx-joy-hs {
    position: absolute;
    border: 1px solid transparent;
    border-radius: 1000px;
    box-sizing: border-box;
}
.wmsx-joy-hs-up, .wmsx-joy-hs-down, .wmsx-joy-hs-left, .wmsx-joy-hs-right {
    width: 26px;
    height: 25px;
    padding-top: 6px;
    font-size: 10px;
    line-height: 10px;
    color: hsl(0, 0%, 95%);
}
.wmsx-joy-hs-up {
    top: 19px;
    left: 37px;
    padding-top: 7px;
}
.wmsx-joy-hs-down {
    top: 52px;
    left: 37px;
    padding-top: 4px;
}
.wmsx-joy-hs-left {
    top: 35px;
    left: 21px;
}
.wmsx-joy-hs-right {
    top: 35px;
    left: 53px;
}
.wmsx-joy-hs-button1, .wmsx-joy-hs-button2, .wmsx-joy-hs-button3, .wmsx-joy-hs-button4 {
    width: 21px;
    height: 23px;
    font-size: 12px;
    line-height: 19px;
    color: hsl(0, 0%, 99%);
}
.wmsx-joy-hs-button1 {
    top: 58px;
    right: 39px;
}
.wmsx-joy-hs-button2 {
    top: 38px;
    right: 19px;
}
.wmsx-joy-hs-button3 {
    top: 38px;
    right: 59px;
}
.wmsx-joy-hs-button4 {
    top: 18px;
    right: 39px;
}
.wmsx-joy-hs-button5, .wmsx-joy-hs-button6 {
    width: 54px;
    height: 28px;
    top: -20px;
    color: hsl(0, 0%, 52%);
    font-size: 12px;
    line-height: 13px;
    border-radius: 0;
}
.wmsx-joy-hs-button5 {
    left: 21px;
}
.wmsx-joy-hs-button6 {
    right: 22px;
}
.wmsx-joy-hs-button7, .wmsx-joy-hs-button8 {
    width: 26px;
    height: 34px;
    top: 38px;
    padding-top: 18px;
    font-size: 11px;
    line-height: 11px;
    color: hsl(0, 0%, 56%);
    border-radius: 0;
}
.wmsx-joy-hs-button7 {
    left: 98px;
}
.wmsx-joy-hs-button8 {
    right: 98px;
}

#wmsx-ports .wmsx-mouse {
    display: none;
    position: relative;
    width: 230px;
}

#wmsx-ports .wmsx-mouse-body {
    position: relative;
    top: 6px;
    left: -6px;
    overflow: visible;
    white-space: nowrap;
    width: 61px;
    height: 73px;
    margin: 14px auto;
    background: linear-gradient(166deg, white, white, white, white, hsl(0, 0%, 97%), hsl(0, 0%, 90%));
    border: 1px solid hsl(0, 0%, 79%);
    border-radius: 10px 7px 23px 30px;
    box-sizing: border-box;
    transform: skew(-48deg, 29deg) rotateZ(2deg);
    box-shadow:
     /* inset 0px 0px 1px 0      hsl(0, 0%, 45% */
     3px 2px 0   -1px hsl(0, 0%, 70%)
    ,4px 3px 0   -1px hsl(0, 0%, 60%)       /* line */
    ,6px 4px 0   -2px hsl(0, 0%, 82%)       /* line */
    ,5px 0   0   -4px hsl(0, 0%, 70%)
    ,6px 0   0   -4px hsl(0, 0%, 70%)
    ,7px 1px 0   -4px hsl(0, 0%, 70%)
    ,8px 2px 0   -4px hsl(0, 0%, 70%)
    ,9px 3px 0   -4px hsl(0, 0%, 70%)
    ,10px 4px 0  -4px hsl(0, 0%, 70%)
    ,11px 5px 0  -4px hsl(0, 0%, 70%)
    ,12px 6px 0  -4px hsl(0, 0%, 70%)
    ,13px 7px 0  -4px hsl(0, 0%, 70%)
    ,14px 8px 0  -4px hsl(0, 0%, 70%)
    ,17px 8px 0  -6px hsl(0, 0%, 70%)
    ,18px 11px 0 -6px hsl(0, 0%, 70%)
    ,2px 6px 0   -4px hsl(0, 0%, 70%)       /* bottom correction */
    ,4px 7px 0   -4px hsl(0, 0%, 70%)       /* bottom correction */
    ,8px 9px 0   -4px hsl(0, 0%, 70%)       /* bottom correction */
    ,10px 09px 0 -4px hsl(0, 0%, 70%)       /* bottom correction */
    ,12px 10px 0 -4px hsl(0, 0%, 70%)       /* bottom correction */
    ,14px 10px 0 -4px hsl(0, 0%, 70%)       /* bottom correction */
    ,19px 11px 4px -6px hsl(0, 0%, 3%)      /* shadow */
    ,13px 12px 4px -6px hsl(0, 0%, 3%)      /* shadow */
    ;
}

#wmsx-ports .wmsx-mouse-button1, #wmsx-ports .wmsx-mouse-button2 {
    position: absolute;
    height: 25px;
    background: transparent;
    border: 0 solid hsl(0, 0%, 70%);
    box-sizing: border-box;
}
#wmsx-ports .wmsx-mouse-button1 {
    width: 47%;
    border-right-width: 1px;
}
#wmsx-ports .wmsx-mouse-button2 {
    width: 101%;
    border-bottom-width: 1px;
}

#wmsx-ports .wmsx-none {
    display: none;
    width: 230px;
    margin-top: 9px;
    font-size: 106px;
    line-height: 106px;
    font-weight: bold;
    color: rgba(50, 50, 50, .17);
}

#wmsx-about {
    left: 2400px;
    font-size: 18px;
}

#wmsx-about #wmsx-logo-version {
    width: 380px;
    height: 212px;
    margin: 36px auto 24px;
    color: rgba(255, 255, 255, 0.97);
    padding-top: 170px;
    box-sizing: border-box;
    text-align: center;
    background: black url("${ wmsx.Images.urls.logo }") center 50px no-repeat;
    box-shadow: 3px 3px 14px rgb(75, 75, 75);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#wmsx-about .wmsx-info {
    line-height: 30px;
    text-align: center;
}

#wmsx-about a {
    color: rgb(0, 40, 200);
    text-decoration: none;
}

#wmsx-about #wmsx-browserinfo {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 7px;
    font-size: 10px;
    text-align: center;
    color: transparent;
}

#wmsx-keyboard-popup {
    display: none;
    position: fixed;
    padding: 4px 9px;
    line-height: 16px;
    text-align: center;
    vertical-align: top;
    border-radius: 6px;
    border: 8px white solid;
    background: rgb(220, 220, 220);
    box-shadow: 0 3px 3px 2px rgba(0, 0, 0, .55);
    box-sizing: border-box;
    z-index: 999999;
}
#wmsx-keyboard-popup .wmsx-command {
    width: auto;
    line-height: 21px;
    margin: 9px 0 8px;
    font-weight: bold;
}
#wmsx-keyboard-popup:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 0;
    margin: 0 auto;
    border-width: 10px;
    border-style: solid;
    border-color: transparent white white transparent;
    box-shadow: 4px 4px 2px 0 rgba(0, 0, 0, .55);
    box-sizing: border-box;
    transform: translateY(16px) rotate(45deg);
}

.wmsx-clear {
    clear: both;
}

.wmsx-full-divider {
    clear: both;
    height: 21px;
}

#wmsx-general .wmsx-full-divider {
    clear: both;
    height: 18px;
}

`;
};
