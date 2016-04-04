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
                    {src: ["src/release/roms/*"], dest: "release/alpha/wmsx/roms", expand: true, flatten: true, filter: "isFile"},
                    {src: ["src/main/images/*"], dest: "release/alpha/wmsx/images", expand: true, flatten: true, filter: "isFile"}
                ]
            }
        },

        concat: {
            part: {
                src: [
                    "scr/main/util/Util.js",
                    "scr/main/util/SHA1.js",
                    "scr/main/util/ZIP.js",
                    "scr/main/util/MultiDownloader.js",
                    "scr/main/msx/cpu/Z80.js",
                    "scr/main/msx/ppi/PPI.js",
                    "scr/main/msx/video/VDP.js",
                    "scr/main/msx/video/VDPCommandProcessor.js",
                    "scr/main/msx/video/VideoSignal.js",
                    "scr/main/msx/video/VideoStandard.js",
                    "scr/main/msx/audio/PSG.js",
                    "scr/main/msx/audio/AudioSignal.js",
                    "scr/main/msx/audio/PSGMixedAudioChannels.js",
                    "scr/main/msx/rtc/RTC.js",
                    "scr/main/msx/syscontrol/SystemControl.js",
                    "scr/main/msx/rom/ROM.js",
                    "scr/main/msx/rom/ROMDatabase.js",
                    "scr/main/msx/slots/SlotFormats.js",
                    "scr/main/msx/slots/Slot.js",
                    "scr/main/msx/slots/SlotEmpty.js",
                    "scr/main/msx/slots/SlotExpanded.js",
                    "scr/main/msx/slots/SlotNormal.js",
                    "scr/main/msx/slots/ram/SlotRAM64K.js",
                    "scr/main/msx/slots/ram/SlotRAMMapper.js",
                    "scr/main/msx/slots/bios/SlotBIOS.js",
                    "scr/main/msx/slots/bios/SlotMSX2BIOSExt.js",
                    "scr/main/msx/slots/bios/ImageCassetteDriver.js",
                    "scr/main/msx/slots/bios/BASICExtension.js",
                    "scr/main/msx/slots/cartridges/CartridgeASCII8K.js",
                    "scr/main/msx/slots/cartridges/CartridgeASCII16K.js",
                    "scr/main/msx/slots/cartridges/CartridgeKonami.js",
                    "scr/main/msx/slots/cartridges/CartridgeRType.js",
                    "scr/main/msx/slots/cartridges/CartridgeCrossBlaim.js",
                    "scr/main/msx/slots/cartridges/CartridgeDOS2.js",
                    "scr/main/msx/slots/cartridges/special/disk/ImageDiskDriver.js",
                    "scr/main/msx/slots/cartridges/special/disk/CartridgeDiskPatched.js",
                    "scr/main/msx/slots/cartridges/special/scc/SCCIMixedAudioChannels.js",
                    "scr/main/msx/slots/cartridges/special/scc/CartridgeKonamiSCC.js",
                    "scr/main/msx/slots/cartridges/special/scc/CartridgeSCCExpansion.js",
                    "scr/main/msx/slots/cartridges/special/scc/CartridgeSCCIExpansion.js",
                    "scr/main/msx/slots/cartridges/special/msx-music/YM2413Tables.js",
                    "scr/main/msx/slots/cartridges/special/msx-music/YM2413MixedAudioChannels.js",
                    "scr/main/msx/slots/cartridges/special/msx-music/CartridgeMSXMUSIC.js",
                    "scr/main/msx/slots/cartridges/special/msx-music/CartridgeFMPAC.js",
                    "scr/main/msx/slots/SlotCreator.js",
                    "scr/main/msx/machine/DeviceMissing.js",
                    "scr/main/msx/machine/Clock.js",
                    "scr/main/msx/machine/ClockMultuplexer.js",
                    "scr/main/msx/machine/BUS.js",
                    "scr/main/msx/machine/Machine.js",
                    "scr/main/msx/controls/MachineControls.js",
                    "scr/main/msx/controls/JoysticksControls.js",
                    "scr/main/room/files/FileLoader.js",
                    "scr/main/room/files/FileDownloader.js",
                    "scr/main/room/controls/DOMKeys.js",
                    "scr/main/room/controls/DOMKeyboard.js",
                    "scr/main/room/controls/GamepadJoysticksControls.js",
                    "scr/main/room/controls/DOMMachineControls.js",
                    "scr/main/room/screen/Monitor.js",
                    "scr/main/room/screen/CanvasDisplay.js",
                    "scr/main/room/screen/settings/SettingsGUI.js",
                    "scr/main/room/screen/settings/Settings.js",
                    "scr/main/room/speaker/WebAudioSpeaker.js",
                    "scr/main/room/savestate/LocalStorageSaveStateMedia.js",
                    "scr/main/room/cassette/FileCassetteDeck.js",
                    "scr/main/room/disk/FileDiskDrive.js",
                    "scr/main/room/controls/PeripheralControls.js",
                    "scr/main/room/controls/DOMPeripheralControls.js",
                    "scr/main/room/Room.js",
                    "scr/main/userprefs/UserPreferences.js",
                    "scr/main/Configurator.js",
                    "scr/main/Launcher.js"
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