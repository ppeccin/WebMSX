## WebMSX Configuration and Launch Options

Several parameters are available for customizing the emulator. They can be changed either directly in Javascript if you are hosting the emulator in your own page, or via URL Query Parameters if you are creating links or bookmarks to open the emulator, or just using it in your browser.

All parameters are in the form of properties in the global object `WMSX`. Just set these object properties in Javascript, or use URL Query parameter/value pairs. For example:

```
WMSX.ROM = "files/Game.rom";      is the same as      http://webmsx.org?ROM=files/Game.rom
```

Another important concept is the use of configuration **Presets**. Some configurations are a bit complicated and may require setting various parameters in conjunction. For those cases, its easier to use a Preset that will automatically set all the relevant parameters for a specific task. You may specify any number of Presets to be used by setting the `PRESETS` parameter, with a comma separated list of the Preset names to apply. For example:

```
WMSX.PRESETS = "RAM128, NODISK";         or           http://webmsx.org?PRESETS=RAM128,NODISK
```

## Media Loading

The emulator can be set to automatically load files like ROMs, DSK and CAS images. Additionally, normal "loose" files can be loaded and automatically put in a Disk image. Image files may be compressed in ZIP or GZIP formats. If several Disk images are found in a ZIP file, all of them (up to 5) will be loaded in the Drive Stack. Available parameters:

| Parameter | Function | Shortcut for URL form
| --- | --- | ---
| `CARTRIDGE1_URL`  | URL of ROM image file to load in Slot 1              | `ROM`, `CART`, `CART1`
| `CARTRIDGE2_URL`  | URL of ROM image file to load in Slot 2              | `CART2`
| `DISKA_URL`       | URL of Disk image file to load in Drive A:           | `DISK`, `DISKA`
| `DISKB_URL`       | URL of Disk image file to load in Drive B:           | `DISKB`   
| `DISKA_FILES_URL` | URL of "loose" file or ZIP file to load in Drive A:  | `DISK_FILES`, `DISKA_FILES`
| `DISKB_FILES_URL` | URL of "loose" file or ZIP file to load in Drive B:  | `DISKB_FILES`
| `TAPE_URL`        | URL of Tape image file to load                       | `TAPE`
| `STATE_URL`       | URL of SaveState file to load                        | `STATE`, `SAVESTATE`
| `AUTODETECT_URL`  | URL of file to load with media auto-detection        | `AUTODETECT`

## Enabling Extensions

The emulator supports several Extensions, or optional components that can be turnef on/off. Some are in the form of expansion cartridges that can be inserted in either Slot 1 or 2. We use Presets to make configuring Extensions easier:

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