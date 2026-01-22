module.exports = function (grunt) {

    var releasePath = "stable/6.0";

    // Compiled TypeScript files (from src/main -> temp/compiled/main)
    var baseScr = [
        "temp/compiled/main/room/screen/FullScreenSetup.js",
        "temp/compiled/main/util/Util.js",
        "temp/compiled/main/util/SHA1.js",
        "temp/compiled/main/util/ZIP.js",
        "temp/compiled/main/util/EmbeddedFiles.js",
        "temp/compiled/main/util/MultiDownloader.js",
        "temp/compiled/main/util/MultiFileReader.js",
        "temp/compiled/main/msx/cpu/CPU.js",
        "temp/compiled/main/msx/ppi/PPI.js",
        "temp/compiled/main/msx/video/ColorCache.js",
        "temp/compiled/main/msx/video/VDP.js",
        "temp/compiled/main/msx/video/VDPCommandProcessor.js",
        "temp/compiled/main/msx/video/V9990.js",
        "temp/compiled/main/msx/video/V9990CommandProcessor.js",
        "temp/compiled/main/msx/video/VideoSignal.js",
        "temp/compiled/main/msx/video/VideoStandard.js",
        "temp/compiled/main/msx/audio/AudioTables.js",
        "temp/compiled/main/msx/audio/PSG.js",
        "temp/compiled/main/msx/audio/AudioSignal.js",
        "temp/compiled/main/msx/audio/PSGAudio.js",
        "temp/compiled/main/msx/audio/PCM8BitAudio.js",
        "temp/compiled/main/msx/audio/SCCIAudio.js",
        "temp/compiled/main/msx/audio/YM2413Tables.js",
        "temp/compiled/main/msx/audio/YM2413Audio.js",
        "temp/compiled/main/msx/audio/OPL4WaveTables.js",
        "temp/compiled/main/msx/audio/OPL4Audio.js",
        "temp/compiled/main/msx/audio/OPL4AudioFM.js",
        "temp/compiled/main/msx/audio/OPL4AudioWave.js",
        "temp/compiled/main/msx/miscdevices/RTC.js",
        "temp/compiled/main/msx/miscdevices/SystemFlags.js",
        "temp/compiled/main/msx/miscdevices/TurboRDevices.js",
        "temp/compiled/main/msx/drivers/ImageCassetteDriver.js",
        "temp/compiled/main/msx/drivers/TurboDriver.js",
        "temp/compiled/main/msx/drivers/BIOSKeyboardExtension.js",
        "temp/compiled/main/msx/drivers/ImageDiskDriver.js",
        "temp/compiled/main/msx/drivers/ImageNextorDeviceDriver.js",
        "temp/compiled/main/msx/rom/ROM.js",
        "temp/compiled/main/msx/rom/ROMDatabase.js",
        "temp/compiled/main/msx/slots/SlotCreator.js",
        "temp/compiled/main/msx/slots/SlotFormats.js",
        "temp/compiled/main/msx/slots/Slot.js",
        "temp/compiled/main/msx/slots/SlotEmpty.js",
        "temp/compiled/main/msx/slots/SlotExpanded.js",
        "temp/compiled/main/msx/slots/SlotExpanded0.js",
        "temp/compiled/main/msx/slots/SlotExpanded3.js",
        "temp/compiled/main/msx/slots/SlotExpandedM.js",
        "temp/compiled/main/msx/slots/SlotNormal.js",
        "temp/compiled/main/msx/slots/SlotPlainROM.js",
        "temp/compiled/main/msx/slots/ram/SlotRAMNormal.js",
        "temp/compiled/main/msx/slots/ram/SlotRAMMapper.js",
        "temp/compiled/main/msx/slots/bios/SlotBIOS.js",
        "temp/compiled/main/msx/slots/bios/SlotMSX2BIOSExt.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeASCII8K.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeASCII16K.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeKonami.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeRType.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeCrossBlaim.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeDOS2.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeHarryFox.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeAlQuran.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeSuperSwangi.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeZemina80.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeZemina90.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeZemina126.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeSuperLodeRunner.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeDooly.js",
        "temp/compiled/main/msx/slots/cartridges/CartridgeMegaRAM.js",
        "temp/compiled/main/msx/slots/cartridges/special/disk/CartridgeDiskPatched.js",
        "temp/compiled/main/msx/slots/cartridges/special/disk/CartridgeDiskPatchedDOS2TR.js",
        "temp/compiled/main/msx/slots/cartridges/special/disk/CartridgeNextorPatched.js",
        "temp/compiled/main/msx/slots/cartridges/special/scc/CartridgeKonamiSCC.js",
        "temp/compiled/main/msx/slots/cartridges/special/scc/CartridgeSCCExpansion.js",
        "temp/compiled/main/msx/slots/cartridges/special/scc/CartridgeSCCIExpansion.js",
        "temp/compiled/main/msx/slots/cartridges/special/scc/CartridgeManbow2.js",
        "temp/compiled/main/msx/slots/cartridges/special/scc/CartridgeKonamiUltimateCollection.js",
        "temp/compiled/main/msx/slots/cartridges/special/kanji/CartridgeKanjiFont.js",
        "temp/compiled/main/msx/slots/cartridges/special/sram/CartridgePAC.js",
        "temp/compiled/main/msx/slots/cartridges/special/msx-music/CartridgeMSXMUSIC.js",
        "temp/compiled/main/msx/slots/cartridges/special/msx-music/CartridgeFMPAC.js",
        "temp/compiled/main/msx/slots/cartridges/special/moonsound/CartridgeOPL4.js",
        "temp/compiled/main/msx/slots/cartridges/special/psg/CartridgeExtraPSG.js",
        "temp/compiled/main/msx/slots/cartridges/special/v9990/CartridgeV9990.js",
        "temp/compiled/main/msx/slots/cartridges/special/sram/CartridgeGameMaster2.js",
        "temp/compiled/main/msx/slots/cartridges/special/sram/CartridgeASCII8KSRAM.js",
        "temp/compiled/main/msx/slots/cartridges/special/sram/CartridgeASCII16KSRAM.js",
        "temp/compiled/main/msx/slots/cartridges/special/sram/CartridgeHalnote.js",
        "temp/compiled/main/msx/slots/cartridges/special/pcm/CartridgeMajutsushi.js",
        "temp/compiled/main/msx/slots/cartridges/special/pcm/CartridgeSynthesizer.js",
        "temp/compiled/main/msx/machine/MachineTypeSocket.js",
        "temp/compiled/main/msx/machine/ExtensionsSocket.js",
        "temp/compiled/main/msx/machine/DeviceMissing.js",
        "temp/compiled/main/msx/machine/SwitchedDevices.js",
        "temp/compiled/main/msx/machine/BUS.js",
        "temp/compiled/main/msx/machine/Machine.js",
        "temp/compiled/main/msx/controls/KeyboardKeys.js",
        "temp/compiled/main/msx/controls/JoystickButtons.js",
        "temp/compiled/main/msx/controls/MachineControls.js",
        "temp/compiled/main/images/Images.js",
        "temp/compiled/main/userprefs/UserPreferences.js",
        "temp/compiled/main/userprefs/UserROMFormats.js",
        "temp/compiled/main/room/clock/Clock.js",
        "temp/compiled/main/room/files/FileLoader.js",
        "temp/compiled/main/room/files/FileDownloader.js",
        "temp/compiled/main/room/controls/DOMKeys.js",
        "temp/compiled/main/room/controls/GamepadButtons.js",
        "temp/compiled/main/room/controls/TouchControls.js",
        "temp/compiled/main/room/controls/BuiltInKeyboards.js",
        "temp/compiled/main/room/controls/DOMKeyboard.js",
        "temp/compiled/main/room/controls/GamepadJoysticksControls.js",
        "temp/compiled/main/room/controls/DOMJoykeysControls.js",
        "temp/compiled/main/room/controls/DOMMouseControls.js",
        "temp/compiled/main/room/controls/DOMTouchControls.js",
        "temp/compiled/main/room/controls/ControllersHub.js",
        "temp/compiled/main/room/controls/DOMMachineControls.js",
        "temp/compiled/main/room/controls/DOMVirtualKeyboard.js",
        "temp/compiled/main/room/screen/ScreenGUI.es5.js",
        "temp/compiled/main/room/screen/virtualkeyboard/VirtualKeyboard.js",
        "temp/compiled/main/room/screen/Monitor.js",
        "temp/compiled/main/room/screen/CanvasDisplay.js",
        "temp/compiled/main/room/screen/settings/SettingsGUI.es5.js",
        "temp/compiled/main/room/screen/settings/ControlMappingPopup.js",
        "temp/compiled/main/room/screen/settings/KeyboardConfigurator.js",
        "temp/compiled/main/room/screen/settings/PortsConfigurator.js",
        "temp/compiled/main/room/screen/settings/Settings.js",
        "temp/compiled/main/room/screen/dialogs/PasteDialog.js",
        "temp/compiled/main/room/screen/dialogs/TextEntryDialog.js",
        "temp/compiled/main/room/screen/dialogs/SaveStateDialog.js",
        "temp/compiled/main/room/screen/dialogs/CartridgeFormatDialog.js",
        "temp/compiled/main/room/screen/dialogs/DiskSelectDialog.js",
        "temp/compiled/main/room/screen/dialogs/NewHardDiskDialog.js",
        "temp/compiled/main/room/screen/dialogs/MachineSelectDialog.js",
        "temp/compiled/main/room/screen/dialogs/TouchConfigDialog.js",
        "temp/compiled/main/room/screen/dialogs/QuickOptionsDialog.js",
        "temp/compiled/main/room/screen/dialogs/NetPlayDialog.js",
        "temp/compiled/main/room/speaker/WebAudioSpeaker.js",
        "temp/compiled/main/room/savestate/SaveStateMedia.js",
        "temp/compiled/main/room/savestate/LocalStoragePersistence.js",
        "temp/compiled/main/room/savestate/IndexedDBPersistence.js",
        "temp/compiled/main/room/cartridge/FileCartridgeSlot.js",
        "temp/compiled/main/room/cassette/FileCassetteDeck.js",
        "temp/compiled/main/room/disk/DiskImages.js",
        "temp/compiled/main/room/disk/FileDiskDrive.js",
        "temp/compiled/main/room/controls/PeripheralControls.js",
        "temp/compiled/main/room/controls/DOMPeripheralControls.js",
        "temp/compiled/main/room/netplay/NetServer.js",
        "temp/compiled/main/room/netplay/NetClient.js",
        "temp/compiled/main/room/Room.js",
        // Runtime files (still plain JS, not TypeScript)
        "src/runtime/images/EmbeddedImages.js"
    ];


    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            init: ["temp", "release/" + releasePath],
            finish: ["temp"]
        },

        shell: {
            tsc: {
                command: 'npx tsc || true',
                options: {
                    stderr: true,
                    stdout: true,
                    failOnError: false
                }
            }
        },

        concat: {
            emuPart: {
                src: baseScr.concat([
                    "src/runtime/sysfiles/CompressedSystemFiles.js",
                    "src/runtime/sysfiles/EmbeddedSystemFiles.js",
                    "temp/compiled/main/Configurator.js",
                    "temp/compiled/main/Launcher.js"
                ]),
                dest: "temp/wmsx.part.js"
            },
            emuPart_cbios: {
                src: baseScr.concat([
                    "src/runtime/sysfiles/CompressedSystemFilesCBios.js",
                    "src/runtime/sysfiles/EmbeddedSystemFilesCBios.js",
                    "temp/compiled/main/Configurator.js",
                    "temp/compiled/main/Launcher.js"
                ]),
                dest: "temp/cbios/wmsx.part.js"
            },
            emuFinal: {
                src: [
                    "temp/compiled/main/WMSX.js",
                    "temp/wmsx.part.min.js"
                ],
                dest: "temp/wmsx.js"
            },
            emuFinal_cbios: {
                src: [
                    "temp/compiled/main/WMSXCBios.js",
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
    grunt.loadNpmTasks("grunt-shell");
    grunt.registerTask("default", [
        "clean:init",
        "shell:tsc",
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