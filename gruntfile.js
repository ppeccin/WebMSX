module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            init: ["temp", "release/alpha"],
            finish: ["temp"]
        },

        copy: {
            main: {
                files: [
                    {src: ["src/release/*"], dest: "release/alpha", expand: true, flatten: true, filter: "isFile"},
                    {src: ["src/main/images/*"], dest: "release/alpha/wmsx/images", expand: true, flatten: true, filter: "isFile"}
                ]
            }
        },

        concat: {
            part: {
                src: [
                    "src/main/util/Util.js",
                    "src/main/util/SHA1.js",
                    "src/main/util/ZIP.js",
                    "src/main/util/MultiDownloader.js",
                    "src/main/msx/cpu/Z80.js",
                    "src/main/msx/ppi/PPI.js",
                    "src/main/msx/video/VDP.js",
                    "src/main/msx/video/VDPCommandProcessor.js",
                    "src/main/msx/video/VideoSignal.js",
                    "src/main/msx/video/VideoStandard.js",
                    "src/main/msx/audio/PSG.js",
                    "src/main/msx/audio/AudioSignal.js",
                    "src/main/msx/audio/PSGAudio.js",
                    "src/main/msx/miscdevices/RTC.js",
                    "src/main/msx/miscdevices/SystemFlags.js",
                    "src/main/msx/rom/ROM.js",
                    "src/main/msx/rom/ROMDatabase.js",
                    "src/main/msx/slots/SlotFormats.js",
                    "src/main/msx/slots/Slot.js",
                    "src/main/msx/slots/SlotEmpty.js",
                    "src/main/msx/slots/SlotExpanded.js",
                    "src/main/msx/slots/SlotNormal.js",
                    "src/main/msx/slots/ram/SlotRAM64K.js",
                    "src/main/msx/slots/ram/SlotRAMMapper.js",
                    "src/main/msx/slots/bios/SlotBIOS.js",
                    "src/main/msx/slots/bios/SlotMSX2BIOSExt.js",
                    "src/main/msx/slots/bios/ImageCassetteDriver.js",
                    "src/main/msx/slots/bios/BASICExtension.js",
                    "src/main/msx/slots/cartridges/CartridgeASCII8K.js",
                    "src/main/msx/slots/cartridges/CartridgeASCII16K.js",
                    "src/main/msx/slots/cartridges/CartridgeKonami.js",
                    "src/main/msx/slots/cartridges/CartridgeRType.js",
                    "src/main/msx/slots/cartridges/CartridgeCrossBlaim.js",
                    "src/main/msx/slots/cartridges/CartridgeDOS2.js",
                    "src/main/msx/slots/cartridges/special/disk/ImageDiskDriver.js",
                    "src/main/msx/slots/cartridges/special/disk/CartridgeDiskPatched.js",
                    "src/main/msx/slots/cartridges/special/scc/SCCIAudio.js",
                    "src/main/msx/slots/cartridges/special/scc/CartridgeKonamiSCC.js",
                    "src/main/msx/slots/cartridges/special/scc/CartridgeSCCExpansion.js",
                    "src/main/msx/slots/cartridges/special/scc/CartridgeSCCIExpansion.js",
                    "src/main/msx/audio/YM2413Tables.js",
                    "src/main/msx/audio/YM2413Audio.js",
                    "src/main/msx/slots/cartridges/special/msx-music/CartridgeMSXMUSIC.js",
                    "src/main/msx/slots/cartridges/special/msx-music/CartridgeFMPAC.js",
                    "src/main/msx/slots/SlotCreator.js",
                    "src/main/msx/machine/DeviceMissing.js",
                    "src/main/msx/machine/Clock.js",
                    "src/main/msx/machine/ClockMultuplexer.js",
                    "src/main/msx/machine/BUS.js",
                    "src/main/msx/machine/Machine.js",
                    "src/main/msx/controls/MachineControls.js",
                    "src/main/room/files/FileLoader.js",
                    "src/main/room/files/FileDownloader.js",
                    "src/main/room/controls/DOMKeys.js",
                    "src/main/room/controls/DOMKeyboard.js",
                    "src/main/room/controls/GamepadJoysticksControls.js",
                    "src/main/room/controls/DOMMouseControls.js",
                    "src/main/room/controls/ControllersHub.js",
                    "src/main/room/controls/DOMMachineControls.js",
                    "src/main/room/screen/Monitor.js",
                    "src/main/room/screen/CanvasDisplay.js",
                    "src/main/room/screen/settings/SettingsGUI.js",
                    "src/main/room/screen/settings/Settings.js",
                    "src/main/room/speaker/WebAudioSpeaker.js",
                    "src/main/room/savestate/LocalStorageSaveStateMedia.js",
                    "src/main/room/cassette/FileCassetteDeck.js",
                    "src/main/room/disk/FileDiskDrive.js",
                    "src/main/room/controls/PeripheralControls.js",
                    "src/main/room/controls/DOMPeripheralControls.js",
                    "src/main/room/Room.js",
                    "src/main/userprefs/UserPreferences.js",
                    "src/main/Configurator.js",
                    "src/main/Launcher.js",
                    "src/release/sysroms/packed/EmbeddedSystemROMs.js"
                ],
                dest: "temp/wmsx.part.concat.js"
            },
            final: {
                src: [
                    "src/main/WMSX.js",
                    "temp/wmsx.part.min.js"
                ],
                dest: "release/alpha/wmsx/wmsx.js"
            }
        },

        uglify: {
            part: {
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
                    "temp/wmsx.part.min.js": ["temp/wmsx.part.concat.js"]
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.registerTask("default", ["clean:init", "copy:main", "concat:part", "uglify:part", "concat:final", "clean:finish"]);

};