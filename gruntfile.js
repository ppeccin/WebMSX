module.exports = function (grunt) {

    var releasePath = "stable/5.4";

    var baseScr = [
        "src/main/room/screen/FullScreenSetup.js",
        "src/main/util/Util.js",
        "src/main/util/SHA1.js",
        "src/main/util/ZIP.js",
        "src/main/util/EmbeddedFiles.js",
        "src/main/util/MultiDownloader.js",
        "src/main/util/MultiFileReader.js",
        "src/main/msx/cpu/Z80.js",
        "src/main/msx/ppi/PPI.js",
        "src/main/msx/video/VDP.js",
        "src/main/msx/video/VDPCommandProcessor.js",
        "src/main/msx/video/VideoSignal.js",
        "src/main/msx/video/VideoStandard.js",
        "src/main/msx/audio/AudioTables.js",
        "src/main/msx/audio/PSG.js",
        "src/main/msx/audio/AudioSignal.js",
        "src/main/msx/audio/PSGAudio.js",
        "src/main/msx/audio/PCM8BitAudio.js",
        "src/main/msx/audio/SCCIAudio.js",
        "src/main/msx/audio/YM2413Tables.js",
        "src/main/msx/audio/YM2413Audio.js",
        "src/main/msx/audio/OPL4WaveTables.js",
        "src/main/msx/audio/OPL4Audio.js",
        "src/main/msx/audio/OPL4AudioFM.js",
        "src/main/msx/audio/OPL4AudioWave.js",
        "src/main/msx/miscdevices/RTC.js",
        "src/main/msx/miscdevices/SystemFlags.js",
        "src/main/msx/miscdevices/ImageCassetteDriver.js",
        "src/main/msx/miscdevices/TurboDriver.js",
        "src/main/msx/miscdevices/BIOSKeyboardExtension.js",
        "src/main/msx/miscdevices/ImageDiskDriver.js",
        "src/main/msx/miscdevices/ImageNextorDeviceDriver.js",
        "src/main/msx/rom/ROM.js",
        "src/main/msx/rom/ROMDatabase.js",
        "src/main/msx/slots/SlotCreator.js",
        "src/main/msx/slots/SlotFormats.js",
        "src/main/msx/slots/Slot.js",
        "src/main/msx/slots/SlotEmpty.js",
        "src/main/msx/slots/SlotExpanded.js",
        "src/main/msx/slots/SlotExpandedSpecial.js",
        "src/main/msx/slots/SlotExpandedModules.js",
        "src/main/msx/slots/SlotNormal.js",
        "src/main/msx/slots/ram/SlotRAMNormal.js",
        "src/main/msx/slots/ram/SlotRAMMapper.js",
        "src/main/msx/slots/bios/SlotBIOS.js",
        "src/main/msx/slots/bios/SlotMSX2BIOSExt.js",
        "src/main/msx/slots/cartridges/CartridgeASCII8K.js",
        "src/main/msx/slots/cartridges/CartridgeASCII16K.js",
        "src/main/msx/slots/cartridges/CartridgeKonami.js",
        "src/main/msx/slots/cartridges/CartridgeRType.js",
        "src/main/msx/slots/cartridges/CartridgeCrossBlaim.js",
        "src/main/msx/slots/cartridges/CartridgeDOS2.js",
        "src/main/msx/slots/cartridges/CartridgeHarryFox.js",
        "src/main/msx/slots/cartridges/CartridgeAlQuran.js",
        "src/main/msx/slots/cartridges/CartridgeSuperSwangi.js",
        "src/main/msx/slots/cartridges/CartridgeZemina80.js",
        "src/main/msx/slots/cartridges/CartridgeZemina90.js",
        "src/main/msx/slots/cartridges/CartridgeZemina126.js",
        "src/main/msx/slots/cartridges/CartridgeSuperLodeRunner.js",
        "src/main/msx/slots/cartridges/CartridgeDooly.js",
        "src/main/msx/slots/cartridges/CartridgeMegaRAM.js",
        "src/main/msx/slots/cartridges/special/disk/CartridgeDiskPatched.js",
        "src/main/msx/slots/cartridges/special/disk/CartridgeNextorPatched.js",
        "src/main/msx/slots/cartridges/special/scc/CartridgeKonamiSCC.js",
        "src/main/msx/slots/cartridges/special/scc/CartridgeSCCExpansion.js",
        "src/main/msx/slots/cartridges/special/scc/CartridgeSCCIExpansion.js",
        "src/main/msx/slots/cartridges/special/scc/CartridgeManbow2.js",
        "src/main/msx/slots/cartridges/special/kanji/CartridgeKanjiFont.js",
        "src/main/msx/slots/cartridges/special/sram/CartridgePAC.js",
        "src/main/msx/slots/cartridges/special/msx-music/CartridgeMSXMUSIC.js",
        "src/main/msx/slots/cartridges/special/msx-music/CartridgeFMPAC.js",
        "src/main/msx/slots/cartridges/special/moonsound/CartridgeMoonSound.js",
        "src/main/msx/slots/cartridges/special/psg/CartridgeExtraPSG.js",
        "src/main/msx/slots/cartridges/special/sram/CartridgeGameMaster2.js",
        "src/main/msx/slots/cartridges/special/sram/CartridgeASCII8KSRAM.js",
        "src/main/msx/slots/cartridges/special/sram/CartridgeASCII16KSRAM.js",
        "src/main/msx/slots/cartridges/special/sram/CartridgeHalnote.js",
        "src/main/msx/slots/cartridges/special/pcm/CartridgeMajutsushi.js",
        "src/main/msx/slots/cartridges/special/pcm/CartridgeSynthesizer.js",
        "src/main/msx/machine/MachineTypeSocket.js",
        "src/main/msx/machine/ExtensionsSocket.js",
        "src/main/msx/machine/DeviceMissing.js",
        "src/main/msx/machine/BUS.js",
        "src/main/msx/machine/Machine.js",
        "src/main/msx/controls/KeyboardKeys.js",
        "src/main/msx/controls/JoystickButtons.js",
        "src/main/msx/controls/MachineControls.js",
        "src/main/images/Images.js",
        "src/main/userprefs/UserPreferences.js",
        "src/main/userprefs/UserROMFormats.js",
        "src/main/room/clock/Clock.js",
        "src/main/room/files/FileLoader.js",
        "src/main/room/files/FileDownloader.js",
        "src/main/room/controls/DOMKeys.js",
        "src/main/room/controls/GamepadButtons.js",
        "src/main/room/controls/TouchControls.js",
        "src/main/room/controls/BuiltInKeyboards.js",
        "src/main/room/controls/DOMKeyboard.js",
        "src/main/room/controls/GamepadJoysticksControls.js",
        "src/main/room/controls/DOMJoykeysControls.js",
        "src/main/room/controls/DOMMouseControls.js",
        "src/main/room/controls/DOMTouchControls.js",
        "src/main/room/controls/ControllersHub.js",
        "src/main/room/controls/DOMMachineControls.js",
        "src/main/room/controls/DOMVirtualKeyboard.js",
        "src/main/room/screen/ScreenGUI.es5.js",
        "src/main/room/screen/virtualkeyboard/VirtualKeyboard.js",
        "src/main/room/screen/Monitor.js",
        "src/main/room/screen/CanvasDisplay.js",
        "src/main/room/screen/settings/SettingsGUI.es5.js",
        "src/main/room/screen/settings/ControlMappingPopup.js",
        "src/main/room/screen/settings/KeyboardConfigurator.js",
        "src/main/room/screen/settings/PortsConfigurator.js",
        "src/main/room/screen/settings/Settings.js",
        "src/main/room/screen/dialogs/PasteDialog.js",
        "src/main/room/screen/dialogs/TextEntryDialog.js",
        "src/main/room/screen/dialogs/SaveStateDialog.js",
        "src/main/room/screen/dialogs/CartridgeFormatDialog.js",
        "src/main/room/screen/dialogs/DiskSelectDialog.js",
        "src/main/room/screen/dialogs/NewHardDiskDialog.js",
        "src/main/room/screen/dialogs/MachineSelectDialog.js",
        "src/main/room/screen/dialogs/TouchConfigDialog.js",
        "src/main/room/screen/dialogs/QuickOptionsDialog.js",
        "src/main/room/screen/dialogs/NetPlayDialog.js",
        "src/main/room/speaker/WebAudioSpeaker.js",
        "src/main/room/savestate/SaveStateMedia.js",
        "src/main/room/savestate/LocalStoragePersistence.js",
        "src/main/room/savestate/IndexedDBPersistence.js",
        "src/main/room/cartridge/FileCartridgeSlot.js",
        "src/main/room/cassette/FileCassetteDeck.js",
        "src/main/room/disk/DiskImages.js",
        "src/main/room/disk/FileDiskDrive.js",
        "src/main/room/controls/PeripheralControls.js",
        "src/main/room/controls/DOMPeripheralControls.js",
        "src/main/room/netplay/NetServer.js",
        "src/main/room/netplay/NetClient.js",
        "src/main/room/Room.js",
        "src/runtime/images/EmbeddedImages.js"
    ];


    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            init: ["temp", "release/" + releasePath],
            finish: ["temp"]
        },

        concat: {
            emuPart: {
                src: baseScr.concat([
                    "src/runtime/sysfiles/CompressedSystemFiles.js",
                    "src/runtime/sysfiles/EmbeddedSystemFiles.js",
                    "src/main/Configurator.js",
                    "src/main/Launcher.js"
                ]),
                dest: "temp/wmsx.part.js"
            },
            emuPart_cbios: {
                src: baseScr.concat([
                    "src/runtime/sysfiles/CompressedSystemFilesCBios.js",
                    "src/runtime/sysfiles/EmbeddedSystemFilesCBios.js",
                    "src/main/Configurator.js",
                    "src/main/Launcher.js"
                ]),
                dest: "temp/cbios/wmsx.part.js"
            },
            emuFinal: {
                src: [
                    "src/main/WMSX.js",
                    "temp/wmsx.part.min.js"
                ],
                dest: "temp/wmsx.js"
            },
            emuFinal_cbios: {
                src: [
                    "src/main/WMSXCBios.js",
                    "temp/cbios/wmsx.part.min.js"
                ],
                dest: "temp/cbios/wmsx.js"
            },
            standalone: {
                src: [
                    "src/runtime/standalone/index.part1.html",
                    "temp/wmsx.js",
                    "src/runtime/standalone/index.part2.html"
                ],
                dest: "temp/index.html"
            },
            standalone_cbios: {
                src: [
                    "src/runtime/standalone/index.part1.html",
                    "temp/cbios/wmsx.js",
                    "src/runtime/standalone/index.part2.html"
                ],
                dest: "temp/cbios/index.html"
            }
        },

        uglify: {
            emuPart: {
                options: {
                    maxLineLen: 7900,
                    mangle: {
                        toplevel: true,
                        screw_ie8: true
                    },
                    compress: {
                        screw_ie8: true,
                        sequences: true,
                        dead_code: true,
                        drop_debugger: true,
                        comparisons: true,
                        conditionals: true,
                        evaluate: true,
                        booleans: true,
                        loops: true,
                        unused: true,
                        if_return: true,
                        hoist_funs: true,
                        join_vars: true,
                        cascade: true,
                        unsafe: false
                    }
                },
                files: {
                    "temp/wmsx.part.min.js": ["temp/wmsx.part.js"]
                }
            },
            emuPart_cbios: {
                options: {
                    maxLineLen: 7900,
                    mangle: {
                        toplevel: true,
                        screw_ie8: true
                    },
                    compress: {
                        screw_ie8: true,
                        sequences: true,
                        dead_code: true,
                        drop_debugger: true,
                        comparisons: true,
                        conditionals: true,
                        evaluate: true,
                        booleans: true,
                        loops: true,
                        unused: true,
                        if_return: true,
                        hoist_funs: true,
                        join_vars: true,
                        cascade: true,
                        unsafe: false
                    }
                },
                files: {
                    "temp/cbios/wmsx.part.min.js": ["temp/cbios/wmsx.part.js"]
                }
            }
        },

        copy: {
            standalone: {
                files: [
                    {src: "temp/index.html", dest: "release/" + releasePath + "/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/cache.manifest", dest: "release/" + releasePath + "/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/manifest.webapp", dest: "release/" + releasePath + "/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon192.png", dest: "release/" + releasePath + "/standalone/images", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon512.png", dest: "release/" + releasePath + "/standalone/images", expand: true, flatten: true, filter: "isFile"}
                ]
            },
            standalone_cbios: {
                files: [
                    {src: "temp/cbios/index.html", dest: "release/" + releasePath + "/cbios/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/cache.manifest", dest: "release/" + releasePath + "/cbios/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/manifest.webapp", dest: "release/" + releasePath + "/cbios/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon192.png", dest: "release/" + releasePath + "/cbios/standalone/images", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon512.png", dest: "release/" + releasePath + "/cbios/standalone/images", expand: true, flatten: true, filter: "isFile"}
                ]
            },
            embedded: {
                files: [
                    {src: "src/runtime/embedded/index.html", dest: "release/" + releasePath + "/embedded", expand: true, flatten: true, filter: "isFile"},
                    {src: "temp/wmsx.js", dest: "release/" + releasePath + "/embedded", expand: true, flatten: true, filter: "isFile"}
                ]
            },
            embedded_cbios: {
                files: [
                    {src: "src/runtime/embedded/index.html", dest: "release/" + releasePath + "/cbios/embedded", expand: true, flatten: true, filter: "isFile"},
                    {src: "temp/cbios/wmsx.js", dest: "release/" + releasePath + "/cbios/embedded", expand: true, flatten: true, filter: "isFile"}
                ]
            },
            symbos: {
                files: [
                    {src: "src/runtime/symbos/*", dest: "release/" + releasePath + "/symbos/", expand: true, flatten: true, filter: "isFile"}
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.registerTask("default", [
        "clean:init",
        "concat:emuPart",
        "concat:emuPart_cbios",
        "uglify:emuPart",
        "uglify:emuPart_cbios",
        "concat:emuFinal",
        "concat:emuFinal_cbios",
        "concat:standalone",
        "concat:standalone_cbios",
        "copy:standalone",
        "copy:standalone_cbios",
        "copy:embedded",
        "copy:embedded_cbios",
        "copy:symbos",
        "clean:finish"
    ]);

};