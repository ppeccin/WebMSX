module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            init: ["temp", "release"],
            finish: ["temp"]
        },

        copy: {
            main: {
                files: [
                    {src: ["src/release/*"], dest: "release/", expand: true, flatten: true, filter: "isFile"},
                    {src: ["src/main/images/*"], dest: "release/wmsx/", expand: true, flatten: true, filter: "isFile"}
                ]
            }
        },

        concat: {
            part: {
                src: [
                    "src/main/WMSX.js",
                    "src/main/util/Util.js",
                    "src/main/util/SHA1.js",
                    "src/main/util/ZIP.js",
                    "src/main/msx/cpu/Z80.js",
                    "src/main/msx/ppi/PPI.js",
                    "src/main/msx/vdp/VDP.js",
                    "src/main/msx/vdp/VDPVideoSignal.js",
                    "src/main/msx/vdp/VideoStandard.js",
                    "src/main/msx/psg/PSG.js",
                    "src/main/msx/psg/PSGAudioSignal.js",
                    "src/main/msx/psg/PSGMixedAudioChannel.js",
                    "src/main/msx/rom/ROM.js",
                    "src/main/msx/machine/slots/SlotFormats.js",
                    "src/main/msx/machine/slots/SlotEmpty.js",
                    "src/main/msx/machine/slots/bios/BIOS.js",
                    "src/main/msx/machine/slots/bios/ImageCassetteDriver.js",
                    "src/main/msx/machine/slots/bios/BASICExtension.js",
                    "src/main/msx/machine/slots/SlotRAM64K.js",
                    "src/main/msx/machine/slots/cartridges/Cartridge.js",
                    "src/main/msx/machine/slots/cartridges/CartridgeUnbanked.js",
                    "src/main/msx/machine/slots/cartridges/CartridgeASCII8K.js",
                    "src/main/msx/machine/slots/cartridges/CartridgeASCII16K.js",
                    "src/main/msx/machine/slots/cartridges/CartridgeKonami.js",
                    "src/main/msx/machine/slots/cartridges/CartridgeKonamiSCC.js",
                    "src/main/msx/machine/slots/cartridges/CartridgeRType.js",
                    "src/main/msx/machine/slots/cartridges/CartridgeCrossBlaim.js",
                    "src/main/msx/machine/slots/cartridges/special/CartridgeDiskPatched.js",
                    "src/main/msx/machine/slots/cartridges/special/ImageDiskDriver.js",
                    "src/main/msx/machine/slots/ROMDatabase.js",
                    "src/main/msx/machine/slots/SlotCreator.js",
                    "src/main/msx/machine/DeviceMissing.js",
                    "src/main/msx/machine/Clock.js",
                    "src/main/msx/machine/EngineBUS.js",
                    "src/main/msx/machine/Machine.js",
                    "src/main/msx/controls/MachineControls.js",
                    "src/main/room/files/FileLoader.js",
                    "src/main/room/controls/DOMKeys.js",
                    "src/main/room/controls/DOMKeyboard.js",
                    "src/main/room/controls/DOMMachineControls.js",
                    "src/main/room/screen/Monitor.js",
                    "src/main/room/controls/PeripheralControls.js",
                    "src/main/room/controls/DOMPeripheralControls.js",
                    "src/main/room/screen/CanvasDisplay.js",
                    "src/main/room/speaker/WebAudioSpeaker.js",
                    "src/main/room/files/FileDownloader.js",
                    "src/main/room/savestate/LocalStorageSaveStateMedia.js",
                    "src/main/room/cassette/FileCassetteDeck.js",
                    "src/main/room/disk/FileDiskDrive.js",
                    "src/main/room/Preferences.js",
                    "src/main/room/settings/SettingsGUI.js",
                    "src/main/room/settings/Settings.js",
                    "src/main/room/Room.js",
                    "src/main/room/Launcher.js"
                ],
                dest: "temp/wmsx.part.concat.js"
            },
            final: {
                src: [
                    "src/main/WMSX.js",
                    "temp/wmsx.part.min.js"
                ],
                dest: "release/wmsx/wmsx.js"
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