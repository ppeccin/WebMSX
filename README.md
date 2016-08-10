# WebMSX

**WebMSX**, or simply **WMSX**, is a new cross platform MSX emulator designed for the Web.

WebMSX is great for displaying MSX software running inside webpages. You can launch the emulator and load ROMs, DSK and CAS images with a single link.

Please go to **http://webmsx.org** to enjoy it online!

Refer to [**/doc**](https://github.com/ppeccin/WebMSX/tree/master/doc) for parameters reference and URL usage examples.

Refer to [**/release**](https://github.com/ppeccin/WebMSX/tree/master/release) for stable release files and deployment examples.

#### New in Version 2.1

- The WebMSX website can now load files from any source in the web
- Just open or drag & drop files and links directly from any website
- Display your games/software running with a single link to the WebMSX page

#### Features

- 9 Generic machines (MSX1, MSX2, MSX2+). NTSC 60Hz or PAL 50Hz
- PSG, SCC, SCC-I, FM-PAC and MSX-MUSIC sound
- Cross platform HTML5/JS. Runs in any Browser, tested in Chrome/Firefox
- Put games or any MSX software in webpages easily
- Run it locally with a single HTML file, no install needed
- Play Cartridge ROMs, Disk and Tape images
- Powerful Drag & Drop system for loading media files
- Load several disks at once and easily switch disks
- "Files as Disk" and "ZIP as Disk" emulation
- Savestates support. Export and share Savestate files
- Keyboard, Gamepad and Mouse controllers with auto-detection
- Easily toggle extensions like SCC, PAC, DOS2, etc.
- Adjustable speed, Pause and Frame-by-frame advance
- Copy & Paste text, Screen Capture, Debug modes
- Resizable Screen, Full Screen mode


## WebMSX Configuration and Launch Options

Several parameters are available for customizing the emulator. They can be changed either directly in Javascript if you are hosting the emulator in your own page, or via URL Query Parameters if you are creating links or bookmarks to open the emulator, or just using it in your browser.

All parameters are in the form of properties in the global object `WMSX`. Just set these object properties in Javascript, or use URL Query parameter/value pairs. For example:

```
WMSX.ROM = "files/Game.rom";      is the same as      http://webmsx.org?ROM=files/Game.rom
```

**IMPORTANT:** Any parameter setting via Javascript must be done AFTER importing the `webmsx.js` file.

Another important concept is the use of configuration **Presets**. Some configurations are a bit complicated and may require setting various parameters in conjunction. For those cases, its easier to use a Preset that will automatically set all the relevant parameters for a specific task. You may specify any number of Presets to be used by setting the `PRESETS` parameter, with a comma separated list of the Preset names to apply. For example:

```
WMSX.PRESETS = "RAM128, NODISK";         or           http://webmsx.org?PRESETS=RAM128,NODISK
```

## Media Loading

The emulator can be set to automatically load files like ROMs, DSK and CAS images. Additionally, normal "loose" files can be loaded and automatically put in a Disk image. Image files may be compressed in ZIP or GZIP formats. If several Disk images are found in a ZIP file, all of them (up to 5) will be loaded in the Drive Stack. Available parameters:

| Parameter | Function | Shortcut for URL form
| --- | --- | ---
| `CARTRIDGE1_URL`    | URL of ROM image file to load in Slot 1              | `ROM`, `CART1`
| `CARTRIDGE2_URL`    | URL of ROM image file to load in Slot 2              | `CART2`
| `CARTRIDGE1_FORMAT` | Force ROM Format for Cartridge in Slot 1             | `ROM_FORMAT`, `CART1_FORMAT`
| `CARTRIDGE2_FORMAT` | Force ROM Format for Cartridge in Slot 2             | `CART2_FORMAT`
| `DISKA_URL`         | URL of Disk image file to load in Drive A:           | `DISK`, `DISKA`
| `DISKB_URL`         | URL of Disk image file to load in Drive B:           | `DISKB`   
| `DISKA_FILES_URL`   | URL of "loose" file or ZIP file to load "as Disk" in Drive A:  | `DISK_FILES`, `DISKA_FILES`
| `DISKB_FILES_URL`   | URL of "loose" file or ZIP file to load "as Disk" in Drive B:  | `DISKB_FILES`
| `TAPE_URL`          | URL of Tape image file to load                       | `TAPE`
| `STATE_URL`         | URL of SaveState file to load                        | `STATE`, `SAVESTATE`
| `AUTODETECT_URL`    | URL of file to load with media auto-detection        | `AUTODETECT`

### ROM Format (or Mapper Type)
The ROM Format is auto-detected. To force a format, use the `CARTRIDGE1_FORMAT` and `CARTRIDGE2_FORMAT` parameters.
You can also put the format specification in the ROM file name, between brackets. Example: `Game [KonamiSCC].rom`

#### Valid Formats
`Normal`, `Mirrored`, `NotMirrored`, `ASCII8`, `ASCII16`, `Konami`, `KonamiSCC`, `KonamiSCCI`, `ASCII8SRAM2`, `ASCII8SRAM8`, `ASCII16SRAM2`, `ASCII16SRAM8`, `GameMaster2`, `KoeiSRAM8`, `KoeiSRAM32`, `Wizardry`, `FMPAC`, `FMPAK`, `MSXDOS2`, `Majutsushi`, `Synthesizer`, `RType`, `CrossBlaim`, `Manbow2`, `HarryFox`, `AlQuran`, `AlQuranDecoded`

## Enabling Extensions

The emulator supports several Extensions, or optional components that can be turned on/off. Some are in the form of expansion cartridges that can be inserted in either Slot 1 or 2. We use Presets to make configuring Extensions easier:

| Extension | Default in Machine | Presets
| --- | :---: | ---
| Disk interface with 2 drives          | ALL                  | `DISK`, `NODISK`
| Standard RAM Mapper, adjustable size  | MSX2, MSX2+          | `RAM128`..`RAM4096`, `NORAMMAPPER`
| MSX-MUSIC sound with BASIC extension  | MSX2, MSX2+          | `MSXMUSIC`, `NOMSXMUSIC`
| Support for Kanji Characters          | Japanese MSX2, MSX2+ | `KANJI`, `NOKANJI`
| MSX-DOS 2 ROM Cartridge               | --                   | `DOS2`
| SCC-I Sound Cartridge with 128K RAM   | --                   | `SCCI`, `SCCI2` (in Slot 2)
| SCC Sound Cartridge                   | --                   | `SCC`, `SCC2` (in Slot 2)
| PAC SRAM Cartridge                    | --                   | `PAC`, `PAC2` (in Slot 2)

## Loading BASIC files and Typing commands after launch

The emulator can be set to automatically Run/Load BASIC programs after launch, or type any commands or text in the BASIC prompt. **NOTE** that these are not necessary for `AUTOEXEC.BAS` and `AUTOEXEC.BAT` files, or if you have loaded a Tape Image file (in which case the emulator will automatically detect and Run the first program in the Tape). Available parameters:

| Parameter | Action 
| --- | --- 
| `BASIC_RUN`     |  Run the specified file name                
| `BASIC_LOAD`    |  Load the specified file name                
| `BASIC_ENTER`   |  Type the specified text then hit ENTER                
| `BASIC_TYPE`    |  Type the specified text                

## Choosing a Machine

There are 9 different generic machines to choose from. The default machine is the MSX2+, and the emulator will try to auto-detect your region. You can ask for a specific machine by setting the `MACHINE` parameter with the respective Machine ID:

| Machine | Machine ID | Specific Machine | Machine ID 
| --- | :---: | --- | :---: 
| MSX2+ Auto-detection   | `MSX2P` | MSX2+ American (NTSC 60Hz)  |  `MSX2PA`                
|                        |         | MSX2+ European (PAL 50Hz)   |  `MSX2PE`
|                        |         | MSX2+ Japanese (NTSC 60Hz)  |  `MSX2PJ`
| MSX2  Auto-detection   | `MSX2`  | MSX2  American (NTSC 60Hz)  |  `MSX2A`          
|                        |         | MSX2  European (PAL 50Hz)   |  `MSX2E`
|                        |         | MSX2  Japanese (NTSC 60Hz)  |  `MSX2J`
| MSX1  Auto-detection   | `MSX1`  | MSX1  American (NTSC 60Hz)  |  `MSX1A`          
|                        |         | MSX1  European (PAL 50Hz)   |  `MSX1E`
|                        |         | MSX1  Japanese (NTSC 60Hz)  |  `MSX1J`

## Launch URL Examples

WebMSX is great for displaying MSX software in the web. With a simple URL, you can launch the emulator and automatically load and run anything. You may combine several settings and media loading options in a single link. Here are some examples:

- To load a game in ROM format:
```
http://webmsx.org?ROM=http://gamesarchive.org/Goonies.rom
```
- To load a game in a ZIPped Disk Image and insert a SCC+ Sound Cartridge:
```
http://webmsx.org?DISK=http://gamesarchive.org/SDSnatcher.zip&PRESETS=SCCI
```
- To launch an European MSX1 machine, loading a Disk image and then run a BASIC program:
```
http://webmsx.org?MACHINE=MSX1E&DISK=http://basicmuseum.org/Demos.dsk&BASIC_RUN=Bubbles.bas
```

## Parameters Reference

| Parameter | Default | Description
| --- | :---: | ---
| `MACHINE`                       |  --                 |  Machine Type. Leave blank for auto-detection
| `PRESETS`                       |  --                 |  Configuration Presets names to apply, comma separated
| `CARTRIDGE1_URL`                |  --                 |  URL of ROM image file to load in Slot 1 
| `CARTRIDGE2_URL`                |  --                 |  URL of ROM image file to load in Slot 2            
| `CARTRIDGE1_FORMAT`             |  --                 |  ROM Format for Cartridge in Slot 1 
| `CARTRIDGE2_FORMAT`             |  --                 |  ROM Format for Cartridge in Slot 2 
| `DISKA_URL`                     |  --                 |  URL of Disk image file to load in Drive A:         
| `DISKB_URL`                     |  --                 |  URL of Disk image file to load in Drive B:
| `DISKA_FILES_URL`               |  --                 |  URL of "loose" file or ZIP file to load "as Disk" in Drive A:
| `DISKB_FILES_URL`               |  --                 |  URL of "loose" file or ZIP file to load "as Disk" in Drive B: 
| `TAPE_URL`                      |  --                 |  URL of Tape image file to load
| `STATE_URL`                     |  --                 |  URL of SaveState file to load
| `AUTODETECT_URL`                |  --                 |  URL of file to load with media auto-detection
| `BASIC_RUN`                     |  --                 |  Run the specified file name
| `BASIC_LOAD`                    |  --                 |  Load the specified file name
| `BASIC_ENTER`                   |  --                 |  Type the specified text then hit ENTER
| `BASIC_TYPE`                    |  --                 |  Type the specified text                
| `SCREEN_ELEMENT_ID`             |  "wmsx-screen"      |  HTML Element ID to place the Emulator Screen
| `ALLOW_URL_PARAMETERS`          |  true               |  Allows overriding any parameters via URL query parameters
| `AUTO_START`                    |  true               |  Auto-Start the emulator as soon as ready
| `AUTO_POWER_ON_DELAY`           |  1000               |  Auto-Power-ON after specified msecs. -1: no Auto-Power-ON
| `RAMMAPPER_SIZE`                |  512                |  RAM Mapper size. 128, 256, 512 .. 4096, if enabled
| `CARTRIDGE1_SLOT`               |  [1]                |  Slot specification for Cartridge Slot 1
| `CARTRIDGE2_SLOT`               |  [2, 0]             |  Slot specification for Cartridge Slot 2
| `MEDIA_CHANGE_DISABLED`         |  false              |  Block user from changing Media (Cartridges, Disks, etc)
| `SCREEN_RESIZE_DISABLED`        |  false              |  Block user from changing Sreen size
| `SCREEN_FULLSCREEN_DISABLED`    |  false              |  Block user from entering FullScreen mode
| `SCREEN_FILTER_MODE`            |  1                  |  Screen CRT Filter level. 0 .. 3
| `SCREEN_CRT_MODE`               |  1                  |  Screen CRT Phosphor Effect. 0: off, 1: on
| `SCREEN_DEFAULT_SCALE`          |  1.1                |  Screen size. 0.5 .. N, in 0.1 steps
| `SCREEN_DEFAULT_ASPECT`         |  1.1                |  Screen aspect ratio (width) in 0.1 steps
| `SCREEN_CONTROL_BAR`            |  0                  |  Screen Bottom Bar controls. 0: always, 1: on hover
| `SCREEN_FORCE_HOST_NATIVE_FPS`  |  -1                 |  Force host native video frequency. -1: auto-detect. Don't change! :-)
| `SCREEN_VSYNCH_MODE`            |  1                  |  V-Synch mode. -1: disabled, 0: off, 1: on
| `AUDIO_SIGNAL_BUFFER_FRAMES`    |  3                  |  Internal audio buffer in frames.  Don't change! :-)
| `AUDIO_BUFFER_BASE`             |  256                |  Audio base buffer size. 256, 512 .. 2048. Don't change! :-)
| `AUDIO_BUFFER_SIZE`             |  -1                 |  Audio buffer size. 256, 512 .. 8192. 0: no sound. -1: auto. More buffer = more delay
| `MOUSE_MODE`                    |  0                  |  Mouse control. -1: disabled, 0: auto, 1: enabled at port 1, 2: enabled at port 2
| `KEYBOARD_JAPAN_LAYOUT`         |  1                  |  Japanese keyboard layout. 0: ANSI, 1: JIS
