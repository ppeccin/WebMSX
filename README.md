# WebMSX

**WebMSX**, or simply **WMSX**, is a new cross platform MSX emulator designed for the Web.

WebMSX is great for displaying MSX software running inside webpages. You can launch the emulator and load ROMs, DSK and CAS images with a single link.
Join friends in multiplayer games or pair programming sessions with the new NetPlay! function.

Please go to **https://webmsx.org** to enjoy it online!

Refer to [**/doc**](https://github.com/ppeccin/WebMSX/tree/master/doc) for parameters reference and URL usage examples.
Refer to [**/release**](https://github.com/ppeccin/WebMSX/tree/master/release) for stable release files and deployment examples.

#### Coming soon in Version 5.3

- Additional 5.37MHz (1.5x) CPU Turbo speed
- Left-side Touch Control buttons
- Full Windowed mode (Shift + Alt + Enter)
- Improved Quick Options with increase/decrease values
- Hotkeys + Shift modifier: decrease values
- MegaRAM Extension (256KB - 2MB)
- Several fixes. SD Snatcher Melancholia now works

### Features

- 9 Generic machines (MSX1, MSX2, MSX2+). NTSC 60Hz or PAL 50Hz
- PSG, SCC, SCC-I, FM-PAC, PCM, MSX-MUSIC and OPL4-Wave sound
- Cross platform HTML5/JS. Runs in any Browser, tested in Chrome/Firefox/Safari
- Finally enjoy MSX games on your iPhone/iPad
- NetPlay! Connect several users on the same Virtual MSX machine over the internet
- Customizable Touch Controls/Virtual Keyboard for mobile devices (iOS, Android)
- CPU and VDP Turbo modes up to 8x, with manual or software activation
- Install as a WebApp, then run offline
- Open files from local storage, iCloud, Google Drive, Dropbox, web links
- Put games or any MSX software in webpages easily
- Show MSX software running with a single link to the WebMSX page
- Play Cartridge ROMs, HardDisk (Nextor), Disk and Tape images
- Powerful Drag & Drop system for loading media files
- Load several disks at once and easily switch disks
- Dynamically import files to any MSX disk drive, automatic image creation
- Savestates support. Export and share Savestate files
- Fully customizable Keyboard, Joysticks, Joykeys, Mouse and Touch controllers
- Joykeys support. Emulate MSX Joysticks using Host Keyboard
- Virtual buttons. Map Host Joystick buttons to MSX Keyboard keys
- Easily toggle extensions like SCC+, SCC, PAC, MegaRAM, Nextor, DoublePSG, etc.
- Adjustable speed, Pause and Frame-by-frame advance
- PSG/SCC/OPLL Stereo Sound simulation, configurable
- Copy & Paste text, Screen Capture, Debug modes
- Resizable Screen, Full Screen, Full Window modes
- Javascript API for loading media and machine control

## About the NetPlay! feature

WebMSX 5.0 brings NetPlay!, in which any number of users may connect and control the same virtual MSX machine.
To access the feature, open the NetPlay! control dialog available on the System Menu (Power button).

One user must be the "Server" and start a NetPlay! Session. Just choose a name for the Session, or let the emulator generate it randomly, then hit "START".
Once the Session is started and active, other users may join the Session simply by entering the same Session name and hitting "JOIN".
All users connected have complete control over the machine, except that only the Server user may load/change media files (ROMs, Disks, etc). All features of the emulator work during NetPlay!
Any Client user may leave the Session at any time, but only the Server user may end the Session completely.

Be careful not to make your Session name public! Anyone that knows your Session name will be able to join it while its active. Send the session name only to people you want to invite.
Another way of sharing your Session to users is sending them a link that will open the emulator and join the session automatically.
In the NetPlay! dialog, once you are Hosting a Session, there will be a link button on the upper right, that will generate the link and copy it to your clipboard.

**IMPORTANT:** NetPlay! performance is completely dependent on the network quality. The lower the network latency between users, the better. Higher bandwidths with higher latencies won't help much.
It uses a specialized P2P protocol, and tries to use STUN to traverse NATs/routers so users don't have to worry about IPs and opening ports. Use at your own risk! :-)

To make all this work seamlessly, WebMSX uses modern Web technologies including WebRTC, which are supported by all major browsers and platforms.
Unfortunately, those technologies are still not available on Apple iOS, so NetPlay! will not work on iOS devices. Sorry but there is not much we can do about it, until Apple feels it should allow its customers to access those technologies.

## About the Nextor Hard Disk Drive

To make the Hard Disk Drive available, you must first activate the Hard Drive Extension, through the Extensions Menu on the user interface, or by using the respective Presets.
The Hard Disk device may be placed "before" the Floppy Drives, so it will appear on the system as Drive A, or "after" the Floppy Drives, so it will appear as Drive C. The position depends on which Slot the Extension is activated on.
If using Presets, there are two available: `HARDDISK` will place the device as Drive A, and `HARDDISKC` will place it as Drive C.
On the Hard Drive menu (HD icon), there are options to automatically create Empty and Boot disks of several sizes. You can also load DSK images, Files or ZIPs normally.

## WebMSX Configuration and Launch Options

Several parameters are available for customizing the emulator. They can be changed either directly in Javascript if you are hosting the emulator in your own page, or via URL Query Parameters if you are creating links or bookmarks to open the emulator, or just using it in your browser.

All parameters are in the form of properties in the global object `WMSX`. Just set these object properties in Javascript, or use URL Query parameter/value pairs. For example:

```
WMSX.ROM = "files/Game.rom";      is the same as      https://webmsx.org?ROM=files/Game.rom
```

**IMPORTANT:** Any parameter setting via Javascript must be done AFTER importing the `webmsx.js` file.

Another important concept is the use of configuration **Presets**. Some configurations are a bit complicated and may require setting various parameters in conjunction. For those cases, its easier to use a Preset that will automatically set all the relevant parameters for a specific task. You may specify any number of Presets to be used by setting the `PRESETS` (or `P` for short) parameter, with a comma separated list of the Preset names to apply. For example:

```
WMSX.PRESETS = "RAM128, NODISK";         or           https://webmsx.org?P=RAM128,NODISK
```

## Media Loading

The emulator can be set to automatically load files like ROMs, DSK and CAS images. Additionally, files can be loaded and automatically injected into any of the Disks Drives, without having to first create an image. Image files may be compressed in ZIP or GZIP formats. If several Disk images are found in a ZIP file, all of them (up to 10) will be loaded in the Drive Stack. Available parameters:

| Parameter | Function | Shortcut for URL form
| --- | --- | ---
| `CARTRIDGE1_URL`     | URL of ROM image file to load in Slot 1              | `ROM`, `CART1`
| `CARTRIDGE2_URL`     | URL of ROM image file to load in Slot 2              | `CART2`
| `CARTRIDGE1_FORMAT`  | Force ROM Format for Cartridge in Slot 1             | `ROM_FORMAT`, `CART1_FORMAT`
| `CARTRIDGE2_FORMAT`  | Force ROM Format for Cartridge in Slot 2             | `CART2_FORMAT`
| `DISKA_URL`          | URL of Disk image file to load in Drive A:           | `DISK`, `DISKA`
| `DISKB_URL`          | URL of Disk image file to load in Drive B:           | `DISKB`
| `HARDDISK_URL`       | URL of Disk image file to load in the Hard Drive     | `HARDDISK`
| `DISKA_FILES_URL`    | URL of file or ZIP (for several files) to load in Drive A:   | `DISK_FILES`, `DISKA_FILES`
| `DISKB_FILES_URL`    | URL of file or ZIP (for several files) to load in Drive B:   | `DISKB_FILES`
| `HARDDISK_FILES_URL` | URL of file or ZIP (for several files) to load in Hard Drive | `HARDDISK_FILES`
| `TAPE_URL`           | URL of Tape image file to load                       | `TAPE`
| `STATE_URL`          | URL of SaveState file to load                        | `STATE`, `SAVESTATE`
| `AUTODETECT_URL`     | URL of file to load with media auto-detection        | `AUTODETECT`, `AUTO`, `ANY`

### ROM Format (or Mapper Type)
The ROM Format is auto-detected. To force a format, set the `CARTRIDGE1_FORMAT` and `CARTRIDGE2_FORMAT` parameters, or access the User Interface.
You can also put the format specification in the ROM file name, between brackets. Example: `Game [KonamiSCC].rom`

#### Valid Formats
`Normal`, `Mirrored`, `NotMirrored`, `ASCII8`, `ASCII16`, `Konami`, `KonamiSCC`, `KonamiSCCI`, `ASCII8SRAM2`, `ASCII8SRAM8`, `ASCII16SRAM2`, `ASCII16SRAM8`, `MegaRAM`, `GameMaster2`, `KoeiSRAM8`, `KoeiSRAM32`, `Wizardry`, `FMPAC`, `FMPAK`, `MSXDOS2`, `Majutsushi`, `Synthesizer`, `RType`, `CrossBlaim`, `Manbow2`, `HarryFox`, `AlQuran`, `AlQuranDecoded`, `Halnote`, `SuperSwangi`, `SuperLodeRunner`, `Dooly`, `Zemina80in1`, `Zemina90in1`, `Zemina126in1`, `MSXWrite`

## Enabling Extensions

The emulator supports several Extensions, or optional components that can be turned on/off. Some are in the form of expansion cartridges that can be inserted in either Slot 1 or 2. We use Presets to make configuring Extensions easier:

| Extension | Default in Machine | Presets
| --- | :---: | ---
| Hard Disk interface (Nextor)          | MSX2++               | `HARDDISK`, `HARDDISKC`, `NOHARDDISK`
| Floppy Disk interface with 2 drives   | ALL                  | `DISK`, `NODISK`
| Standard RAM Mapper, adjustable size  | MSX2, MSX2+          | `RAM128`..`RAM4096`, `RAMNORMAL`
| Support for Kanji Characters          | Japanese MSX2, MSX2+ | `KANJI`, `NOKANJI`
| MSX-MUSIC sound with BASIC extension  | MSX2, MSX2+          | `MSXMUSIC`, `NOMSXMUSIC`
| OPL4 Wave sound                       | --                   | `OPL4`
| Double PSG                            | --                   | `DOUBLEPSG`
| SCC-I Sound Cartridge with 128K RAM   | --                   | `SCCI`, `SCCI2` (in Slot 1/2)
| SCC Sound Cartridge                   | --                   | `SCC`, `SCC2` (in Slot 1/2)
| PAC SRAM Cartridge                    | --                   | `PAC`, `PAC2` (in Slot 1/2)
| MegaRAM Cartridge                     | --                   | `MEGARAM`, `MEGARAM2` (in Slot 1/2)

## Loading BASIC files and Typing commands after launch

The emulator can be set to automatically Run/Load BASIC programs after launch, or type any commands or text in the BASIC prompt. **NOTE** that these are not necessary for `AUTOEXEC.BAS` and `AUTOEXEC.BAT` files, or if you have loaded a Tape Image file (in which case the emulator will automatically detect and Run the first program in the Tape). Available parameters:

| Parameter | Action 
| --- | --- 
| `BASIC_RUN`     |  Run the specified file
| `BASIC_LOAD`    |  Load the specified file
| `BASIC_BRUN`    |  Run the specified bynary file
| `BASIC_BLOAD`   |  Load the specified bynary file
| `BASIC_TYPE`    |  Type the specified text
| `BASIC_ENTER`   |  Type the specified text then hit ENTER

## Controlling boot speed and automatically pressing keys at boot time
| Parameter | Action
| --- | ---
| `FAST_BOOT`        |  Boot at max. speed
| `BOOT_KEYS`        |  Keys to keep pressed at every boot, comma separated
| `BOOT_KEYS_ONCE`   |  Same as above, but only on first boot (do not use both)
| `BOOT_KEYS_FRAMES` |  Optional number of frames for Boot Keys

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
https://webmsx.org?ROM=https://gamesarchive.org/Goonies.rom
```
- To load a game in a ZIPped Disk Image and insert a SCC+ Sound Cartridge:
```
https://webmsx.org?DISK=https://gamesarchive.org/SDSnatcher.zip&PRESETS=SCCI
```
- To launch an European MSX1 machine, loading a Disk image and then run a BASIC program:
```
https://webmsx.org?MACHINE=MSX1E&DISK=https://basicmuseum.org/Demos.dsk&BASIC_RUN=Bubbles.bas
```

## Presets Reference

| Preset | Description
| --- | ---
| `ALTSLOTCONFIG`                                         |  Alternate Slot Configuration. RAM at Primary Slot 3
| `HARDDISK`, `HARDDISKC`, `NOHARDDISK`                   |  Hard Drive Extension
| `DISK`, `DISKA`, `NODISK`                               |  Floppy Drives Extension
| `RAMMAPPER`, `RAM128` - `RAM4096`, `RAMNORMAL`          |  RAM Mapper Extension & sizes
| `KANJI`, `NOKANJI`                                      |  Kanji ROM Extension
| `MSXMUSIC`, `NOMSXMUSIC`, `DOUBLEPSG`, `OPL4`           |  Sound Devices Extensions
| `SCCI`, `SCCI2`, `SCC`, `SCC2`                          |  SCC+/SCC Cartridge (in Slot 1/2)
| `PAC`, `PAC2`                                           |  PAC SRAM Cartridge (in Slot 1/2)
| `MEGARAM`, `MEGARAM2`, `MEGARAM256` - `MEGARAM2048`     |  MegaRam Cartridge (in Slot 1/2) & sizes
| `VSYNCON`, `VSYNCOFF`, `VSYNCDISABLED`                  |  VSync options
| `ALLSTEREO`, `ALLSTEREO2`                               |  Stereo simulation for all devices (default/variation)
| `PSGSTEREO`, `PSGSTEREO2`                               |  PSG Stereo simulation (default/variation)
| `SCCSTEREO`, `SCCSTEREO2`                               |  SCC Stereo simulation (default/variation)
| `OPLLSTEREO`, `OPLLSTEREO2`                             |  OPLL Stereo simulation (default/variation)

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
| `HARDDISK_URL`                  |  --                 |  URL of Disk image file to load in the Hard Drive
| `DISKA_FILES_URL`               |  --                 |  URL of file or ZIP (for several files) to load in Drive A:
| `DISKB_FILES_URL`               |  --                 |  URL of file or ZIP (for several files) to load in Drive B:
| `HARDDISK_FILES_URL`            |  --                 |  URL of file or ZIP (for several files) to load in Hard Drive
| `TAPE_URL`                      |  --                 |  URL of Tape image file to load
| `STATE_URL`                     |  --                 |  URL of SaveState file to load
| `AUTODETECT_URL`                |  --                 |  URL of file to load with media auto-detection
| `NETPLAY_JOIN`                  |  --                 |  Join NetPlay! Session automatically
| `NETPLAY_NICK`                  |  --                 |  NetPlay! Nickname, optional
| `BASIC_RUN`                     |  --                 |  Run the specified file name
| `BASIC_LOAD`                    |  --                 |  Load the specified file name
| `BASIC_BRUN`                    |  --                 |  Run the specified binary file name
| `BASIC_BLOAD`                   |  --                 |  Load the specified binary file name
| `BASIC_TYPE`                    |  --                 |  Type the specified text
| `BASIC_ENTER`                   |  --                 |  Type the specified text then hit ENTER
| `BOOT_KEYS`                     |  --                 |  Keys to keep pressed at every boot, comma separated
| `BOOT_KEYS_ONCE`                |  --                 |  Same as above, but only on first boot (do not use both)
| `BOOT_KEYS_FRAMES`              |  -1                 |  Number of frames for Boot Keys. -1: auto; > 0: frames
| `FAST_BOOT`                     |  0                  |  Number of frames for Fast Boot. 0: off; 1: auto (same as Boot Keys frames); > 1: number of frames
| `RAMMAPPER_SIZE`                |  512                |  RAM Mapper size. 128, 256, 512 .. 4096, if enabled
| `VOL`                           |  1.0                |  Master Volume factor
| `SPEED`                         |  100                |  Default emulation speed (in %)
| `SCREEN_ELEMENT_ID`             |  "wmsx-screen"      |  HTML Element ID to place the Emulator Screen
| `ALLOW_URL_PARAMETERS`          |  true               |  Allows overriding any parameters via URL query parameters
| `AUTO_START`                    |  true               |  Auto-Start the emulator as soon as ready
| `AUTO_POWER_ON_DELAY`           |  1200               |  Auto-Power-ON after specified msecs. -1: no Auto-Power-ON
| `MEDIA_CHANGE_DISABLED`         |  false              |  Block user from changing Media (Cartridges, Disks, etc)
| `SCREEN_RESIZE_DISABLED`        |  false              |  Block user from changing Sreen size
| `SCREEN_FULLSCREEN_MODE`        |  -1                 |  FullScreen mode. -2: disabled; -1: auto; 0: off; 1: on (Full Screen); 2: on (Full Windowed)
| `SCREEN_FILTER_MODE`            |  -3                 |  Screen CRT Filter level. -3: user set (default auto); -2: browser default; -1: auto; 0..3: smoothing level
| `SCREEN_CRT_MODE`               |  0                  |  Screen CRT Phosphor Effect. -1: auto; 0: off; 1: on
| `SCREEN_DEFAULT_SCALE`          |  -1                 |  Screen size. -1: auto; 0.5..N in 0.1 steps
| `SCREEN_DEFAULT_ASPECT`         |  1.1                |  Screen aspect ratio (width) in 0.1 steps
| `SCREEN_CONTROL_BAR`            |  1                  |  Screen Bottom Bar controls. 0: on hover; 1: always
| `SCREEN_FORCE_HOST_NATIVE_FPS`  |  -1                 |  Force host native video frequency. -1: auto-detect. Don't change! :-)
| `SCREEN_VSYNC_MODE`             |  -2                 |  VSync mode. -2: user set(default on); -1: disabled; 0: off; 1: on
| `AUDIO_MONITOR_BUFFER_BASE`     |  -3                 |  Audio buffer base size. -3: user set (default auto); -2: disable audio; -1: auto; 0: browser default; 1..6: base value. More buffer = more delay
| `AUDIO_MONITOR_BUFFER_SIZE`     |  -1                 |  Audio buffer size. -1: auto; 256, 512, 1024, 2048, 4096, 8192, 16384: buffer size. More buffer = more delay. Don't change! :-)
| `AUDIO_SIGNAL_BUFFER_RATIO`     |  2                  |  Internal Audio Signal buffer based on Monitor buffer
| `AUDIO_SIGNAL_ADD_FRAMES`       |  3                  |  Additional frames in internal Audio Signal buffer based on Monitor buffer
| `CPU_TURBO_MODE`                |  0                  |  CPU Turbo. -1: off; 0: auto (software activation); 2..8: CPU clock multiplier; 1: 2x multiplier (backward compatibility)
| `VDP_TURBO_MODE`                |  0                  |  VDP Command Engine Turbo. -1: off; 0: auto (software activation); 2..8: Engine clock multiplier; 9: instantaneous
| `CPU_SOFT_TURBO_MULTI`          |  2                  |  CPU clock multiplier when in AUTO mode and activated by software. 1..8: multi
| `VDP_SOFT_TURBO_MULTI`          |  4                  |  VDP Command Engine clock multiplier when in AUTO mode and activated by software. 1..9: multi
| `JOYSTICKS_MODE`                |  0                  |  Joysticks (on Host) controls. -1: disabled; 0: auto; 1: auto (swapped)
| `JOYKEYS_MODE`                  |  -1                 |  JoyKeys controls. -1: disabled; 0: enabled at port 1; 1: enabled at port 2; 2: enabled at both ports; 3: enabled at both ports (swapped)
| `MOUSE_MODE`                    |  -1                 |  Mouse controls. -1: disabled; 0: auto; 1: enabled at port 1; 2: enabled at port 2
| `TOUCH_MODE`                    |  0                  |  Touch controls. -1: disabled; 0: auto; 1: enabled at port 1; 2: enabled at port 2
| `DEBUG_MODE`                    |  0                  |  Debug Modes. 0: off; 1..7: mode. Don't change! :-)
| `SPRITES_DEBUG_MODE`            |  0                  |  Sprites Debug Modes. 0: off; 1: unlimited; 2: no collisions; 3: both. May cause problems :-)
| `KEYBOARD_JAPAN_LAYOUT`         |  1                  |  Japanese keyboard layout. 0: ANSI, 1: JIS
| `ROM_MAX_HASH_SIZE_KB`          |  3072               |  Maximum ROM size for Hash calculation
| `HARDDISK_MIN_SIZE_KB`          |  720                |  Minimum file size to be accepted as HardDisk image (besides all valid Floppy formats)
| `MEGARAM_SIZE`                  |  2048               |  MegaRAM size in KB
| `PSG_VOL`                       |  "f"                |  PSG Volume adjust: 0..f (hex digit). Set globally or for each channel (4 values)
| `PSG_PAN`                       |  "8"                |  PSG PanPot adjust: 0; 1..8..f (hex digit). Set globally or for each channel (4 values)
| `SCC_VOL`                       |  "f"                |  SCC Volume adjust. Same as above (5 values)
| `SCC_PAN`                       |  "8"                |  SCC PanPot adjust. Same as above (5 values)
| `OPLL_VOL`                      |  "f"                |  OPLL Volume adjust. Same as above (14 values)
| `OPLL_PAN`                      |  "8"                |  OPLL PanPot adjust. Same as above (14 values)
| `PAGE_BACK_CSS`                 |  --                 |  CSS to modify page background color. Applied to the body element
