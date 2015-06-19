// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

(function() {

    var ntscRGB = [
        0x000000,		// 00
        0x404040,		// 02
        0x6c6c6c,		// 04
        0x909090,		// 06
        0xb0b0b0,		// 08
        0xc8c8c8,		// 0A
        0xdcdcdc,		// 0C
        0xf4f4f4,		// 0E
        0x004444,		// 10
        0x106464,		// 12
        0x248484,		// 14
        0x34a0a0,		// 16
        0x40b8b8,		// 18
        0x50d0d0,		// 1A
        0x5ce8e8,		// 1C
        0x68fcfc,		// 1E
        0x002870,		// 20
        0x144484,		// 22
        0x285c98,		// 24
        0x3c78ac,		// 26
        0x4c8cbc,		// 28
        0x5ca0cc,		// 2A
        0x68b4dc,		// 2C
        0x78c8ec,		// 2E
        0x001884,		// 30
        0x183498,		// 32
        0x3050ac,		// 34
        0x4868c0,		// 36
        0x5c80d0,		// 38
        0x7094e0,		// 3A
        0x80a8ec,		// 3C
        0x94bcfc,		// 3E
        0x000088,		// 40
        0x20209c,		// 42
        0x3c3cb0,		// 44
        0x5858c0,		// 46
        0x7070d0,		// 48
        0x8888e0,		// 4A
        0xa0a0ec,		// 4C
        0xb4b4fc,		// 4E
        0x5c0078,		// 50
        0x74208c,		// 52
        0x883ca0,		// 54
        0x9c58b0,		// 56
        0xb070c0,		// 58
        0xc084d0,		// 5A
        0xd09cdc,		// 5C
        0xe0b0ec,		// 5E
        0x780048,		// 60
        0x902060,		// 62
        0xa43c78,		// 64
        0xb8588c,		// 66
        0xcc70a0,		// 68
        0xdc84b4,		// 6A
        0xec9cc4,		// 6C
        0xfcb0d4,		// 6E
        0x840014,		// 70
        0x982030,		// 72
        0xac3c4c,		// 74
        0xc05868,		// 76
        0xd0707c,		// 78
        0xe08894,		// 7A
        0xeca0a8,		// 7C
        0xfcb4bc,		// 7E
        0x880000,		// 80
        0x9c201c,		// 82
        0xb04038,		// 84
        0xc05c50,		// 86
        0xd07468,		// 88
        0xe08c7c,		// 8A
        0xeca490,		// 8C
        0xfcb8a4,		// 8E
        0x7c1800,		// 90
        0x90381c,		// 92
        0xa85438,		// 94
        0xbc7050,		// 96
        0xcc8868,		// 98
        0xdc9c7c,		// 9A
        0xecb490,		// 9C
        0xfcc8a4,		// 9E
        0x5c2c00,		// A0
        0x784c1c,		// A2
        0x906838,		// A4
        0xac8450,		// A6
        0xc09c68,		// A8
        0xd4b47c,		// AA
        0xe8cc90,		// AC
        0xfce0a4,		// AE
        0x2c3c00,		// B0
        0x485c1c,		// B2
        0x647c38,		// B4
        0x809c50,		// B6
        0x94b468,		// B8
        0xacd07c,		// BA
        0xc0e490,		// BC
        0xd4fca4,		// BE
        0x003c00,		// C0
        0x205c20,		// C2
        0x407c40,		// C4
        0x5c9c5c,		// C6
        0x74b474,		// C8
        0x8cd08c,		// CA
        0xa4e4a4,		// CC
        0xb8fcb8,		// CE
        0x003814,		// D0
        0x1c5c34,		// D2
        0x387c50,		// D4
        0x50986c,		// D6
        0x68b484,		// D8
        0x7ccc9c,		// DA
        0x90e4b4,		// DC
        0xa4fcc8,		// DE
        0x00302c,		// E0
        0x1c504c,		// E2
        0x347068,		// E4
        0x4c8c84,		// E6
        0x64a89c,		// E8
        0x78c0b4,		// EA
        0x88d4cc,		// EC
        0x9cece0,		// EE
        0x002844,		// F0
        0x184864,		// F2
        0x306884,		// F4
        0x4484a0,		// F6
        0x589cb8,		// F8
        0x6cb4d0,		// FA
        0x7ccce8,		// FC
        0x8ce0fc		// FE
    ];

    var palRGB = [
        0x000000,		// 00
        0x282828,		// 02
        0x505050,		// 04
        0x747474,		// 06
        0x949494,		// 08
        0xb4b4b4,		// 0A
        0xd0d0d0,		// 0C
        0xf1f1f1,		// 0E
        0x000000,		// 10
        0x282828,		// 12
        0x505050,		// 14
        0x747474,		// 16
        0x949494,		// 18
        0xb4b4b4,		// 1A
        0xd0d0d0,		// 1C
        0xf1f1f1,		// 1E
        0x005880,		// 20
        0x207094,		// 22
        0x3c84a8,		// 24
        0x589cbc,		// 26
        0x70accc,		// 28
        0x84c0dc,		// 2A
        0x9cd0ec,		// 2C
        0xb0e0fc,		// 2E
        0x005c44,		// 30
        0x20785c,		// 32
        0x3c9074,		// 34
        0x58ac8c,		// 36
        0x70c0a0,		// 38
        0x84d4b0,		// 3A
        0x9ce8c4,		// 3C
        0xb0fcd4,		// 3E
        0x003470,		// 40
        0x205088,		// 42
        0x3C68A0,		// 44
        0x5884B4,		// 46
        0x7098C8,		// 48
        0x84ACDC,		// 4A
        0x9CC0EC,		// 4C
        0xB0D4FC,		// 4E
        0x146400,		// 50
        0x348020,		// 52
        0x50983C,		// 54
        0x6CB058,		// 56
        0x84C470,		// 58
        0x9CD884,		// 5A
        0xB4E89C,		// 5C
        0xC8FCB0,		// 5E
        0x140070,		// 60
        0x342088,		// 62
        0x503CA0,		// 64
        0x6C58B4,		// 66
        0x8470C8,		// 68
        0x9C84DC,		// 6A
        0xB49CEC,		// 6C
        0xC8B0FC,		// 6E
        0x5C5C00,		// 70
        0x747420,		// 72
        0x8C8C3C,		// 74
        0xA4A458,		// 76
        0xB8B870,		// 78
        0xC8C884,		// 7A
        0xDCDC9C,		// 7C
        0xECECB0,		// 7E
        0x5C0070,		// 80
        0x742084,		// 82
        0x883C94,		// 84
        0x9C58A8,		// 86
        0xB070B4,		// 88
        0xC084C4,		// 8A
        0xD09CD0,		// 8C
        0xE0B0E0,		// 8E
        0x703C00,		// 90
        0x88581C,		// 92
        0xA07438,		// 94
        0xB48C50,		// 96
        0xC8A468,		// 98
        0xDCB87C,		// 9A
        0xECCC90,		// 9C
        0xFCE0A4,		// 9E
        0x700058,		// A0
        0x88206C,		// A2
        0xA03C80,		// A4
        0xB45894,		// A6
        0xC870A4,		// A8
        0xDC84B4,		// AA
        0xEC9CC4,		// AC
        0xFCB0D4,		// AE
        0x702000,		// B0
        0x883C1C,		// B2
        0xA05838,		// B4
        0xB47450,		// B6
        0xC88868,		// B8
        0xDCA07C,		// BA
        0xECB490,		// BC
        0xFCC8A4,		// BE
        0x80003C,		// C0
        0x942054,		// C2
        0xA83C6C,		// C4
        0xBC5880,		// C6
        0xCC7094,		// C8
        0xDC84A8,		// CA
        0xEC9CB8,		// CC
        0xFCB0C8,		// CE
        0x880000,		// D0
        0x9C2020,		// D2
        0xB03C3C,		// D4
        0xC05858,		// D6
        0xD07070,		// D8
        0xE08484,		// DA
        0xEC9C9C,		// DC
        0xFCB0B0,		// DE
        0x000000,		// E0
        0x282828,		// E2
        0x505050,		// E4
        0x747474,		// E6
        0x949494,		// E8
        0xB4B4B4,		// EA
        0xD0D0D0,		// EC
        0xF1F1F1,		// EE
        0x000000,		// F0
        0x282828,		// F2
        0x505050,		// F4
        0x747474,		// F6
        0x949494,		// F8
        0xB4B4B4,		// FA
        0xD0D0D0,		// FC
        0xF1F1F1		// FE
    ];

    var ntscPalette = new Array(256);
    var palPalette = new Array(256);
    for (var i = 0, len = ntscRGB.length; i < len; i++) {
        // Adds 100% alpha for ARGB use
        ntscPalette[i*2] = ntscPalette[i*2+1] = ntscRGB[i] + 0xff000000;
        palPalette[i*2] = palPalette[i*2+1] = palRGB[i] + 0xff000000;
    }
    // ntscPalette[0] = ntscPalette[1] = palPalette[0] = palPalette[1] = 0;	// Full transparency for blacks. Needed for CRT emulation modes

    // Clean up
    ntscRGB = palRGB = undefined;


    // Set Global Constants --------------------------------------------

    VideoStandard = {
        NTSC: {
            name: "NTSC",
            width: 256,
            height: 192,
            cols: 342,
            lines: 262,
            fps: 60,
            palette: ntscPalette
        },
        PAL: {
            name: "PAL",
            width: 256,
            height: 192,
            cols: 342,
            lines: 313,
            fps: 50,     // So it can match 1 frame each 20ms. Was 50.22364217252396 or 50.3846153846153847
            palette: palPalette
        }
    };

})();

