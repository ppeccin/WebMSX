// TODO Update SymboOS images

;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
;@                                                                            @
;@            S y m b O S   -   M S X   D e v i c e   D r i v e r             @
;@                                  MEGA SD                                   @
;@                                                                            @
;@              (c) 2008-2014 by Manuel Pazos & Caro & Prodatron              @
;@                                                                            @
;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

;- multiple sector writes (currently always "single" writes)


;--- MAIN ROUTINES ------------------------------------------------------------
;### DRVOUT -> write sectors (512b)
;### DRVINP -> read sectors (512b)
;### DRVACT -> read and init media (only hardware- and partiondata, no filesystem)

;--- SUB ROUTINES -------------------------------------------------------------
;### DRVSEC -> converts logical sector number into physical sector number
;### DRVSHW -> maps device memory  to #4000-#7FFF and activates SD card access
;### DRVCMD -> Sends command to SD controller
;### DRVINI -> Inits SD card and detects card type
;### DRVRED -> read sectors
;### DRVWRT -> write sectors
;### DRVCOP -> Copies 512 bytes


;==============================================================================
;### HEADER ###################################################################
;==============================================================================

org #1000-32
relocate_start

db "SMD2"               ;ID
dw drvend-drvjmp        ;code length
dw relocate_count       ;number of relocate table entries
ds 8                    ;*reserved*
db 0,1,2                ;Version Minor, Version Major, Type (-1=NUL, 0=FDC, 1=IDE, 2=SD, 3=SCSI)
db "MegaSD       "      ;comment

drvjmp  dw drvinp,drvout,drvact,drvmof
drvmof  ret:dw 0
        db 32*2+7       ;bit[0-4]=driver ID (7=megasd), bit[5-7]=storage type (2=SD)
        ds 4
drvslt  ds 3        ;slot config for switching device rom at #4000

drvct_mmc   equ 0
drvct_sd1   equ 1
drvct_sd2   equ 2
drvct_shc   equ 3

stobnkx equ #202    ;memory mapping, when low level routines read/write sector data
bnkmonx equ #203    ;set special memory mapping during mass storage access (show destination/source memory block at #8000), HL=address; will be corrected from #0000-#ffff to #8000-#bfff
bnkmofx equ #206    ;reset special memory mapping during mass storage access (show OS memory at #8000)
bnkdofx equ #209    ;hide mass storage device rom (switch back to memory mapper slot config at #4000)
stoadrx equ #20c    ;get device data record
stobufx equ #212    ;address of 512byte buffer

ideparadr   equ #1be        ;start of partition table inside the master boot record (MBR)
idepartyp   equ #04         ;00=not used, 01/11=FAT12, 04/06/0E/14/16/1E=FAT16, 0B/0C/1B/1C=FAT32, 05/0F=extended
ideparbeg   equ #08         ;first logical sector of the partition

idepartok   db #01,#11, #04,#06,#0e,#14,#16,#1e, #0b,#0c,#1b,#1c
idepartan   equ 12


;### DRVINP -> read sectors (512b)
;### Input      A=device (0-7), IY,IX=logical sector number, B=number of sectors, DE=destination address, (stobnkx)=banking config
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX,IY
drvinp  push de
        push bc
        call drvsec     ;BC,DE=sector address
        pop ix          ;IXH=number of sectors
        pop hl
drvinp0 push de
        ld a,(stobnkx)
        call bnkmonx
        pop de
        ld (drvred1+1),a
        call bnkmofx
        jp drvred

;### DRVOUT -> write sectors (512b)
;### Input      A=device (0-7), IY,IX=logical sector number, B=number of sectors, DE=source address, (stobnkx)=banking config
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX,IY
drvout  push de
        push bc
        call drvsec     ;BC,DE=sector address
        pop ix          ;IXH=number of sectors
        pop hl
        push de
        ld a,(stobnkx)
        call bnkmonx
        pop de
        ld (drvwrt1+1),a
        call bnkmofx
        jp drvwrt

;### DRVACT -> read and init media (only hardware- and partiondata, no filesystem)
;### Input      A=device (0-7)
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX,IY
drvact  push af                 ;*** read hardware data
----    call stoadrx
        pop bc
        ex de,hl
<---    ld hl,stodatsub
        add hl,de
        ld a,(hl)               ;get channel (0-15)
        rra:rra:rra:rra
        and #f
        ld c,a
        cp 2
        ccf
<---    ld a,stoerrxch          ;>2 -> wrong channel
        ret c
        push hl
        push de
<---    ld de,stodatflg-stodatsub
        add hl,de
--->    ld (hl),c               ;store channel (0/1)
        ld a,c
        ld (drvshw1+1),a

        push hl
        ld a,b
        ld bc,0
        ld de,0
        db #dd:ld h,1
<---    ld hl,(stobufx)
        call drvinp0            ;read first physical sector (=Bootsector or MBR)
        pop hl

        push af                 ;detect card type
        push hl
        call drvshw
        call drvini
        call bnkdofx
        pop hl
        ld a,(drvinic)
        cp drvct_shc
        jr nz,drvact6
--->    set 4,(hl)              ;set SD-HC bit, if detected
drvact6 pop af
        pop de
        pop hl
        ret c
<---    ld a,(hl)
        and #f                  ;A=partition number
        ld c,a
        ld b,a
        ld iy,0
        jr z,drvact5
<---    ld ix,(stobufx)
<---    ld bc,ideparadr
drvact1 add ix,bc               ;IX points to partition table
        ld bc,16
        dec a
        jr nz,drvact1
drvact2 ld a,(ix+idepartyp)
        ld b,a
        or a
<---    ld a,stoerrpno          ;partion does not exist -> error
        scf
        ret z
        ld a,b
        ld hl,idepartok
        ld b,idepartan
drvact3 cp (hl)
        jr z,drvact4
        inc hl
        djnz drvact3
        ld a,stoerrptp          ;partition type not supported -> error
        scf
        ret
drvact4 ld c,(ix+ideparbeg+2)
        ld b,(ix+ideparbeg+3)
        db #fd:ld l,c
        db #fd:ld h,b
        ld c,(ix+ideparbeg+0)
        ld b,(ix+ideparbeg+1)
drvact5 ex de,hl                ;HL=device data record
--->    ld (hl),stotypoky       ;device ready
        inc hl
--->    ld (hl),stomedsdc       ;media type is SD-Card
<---    ld de,stodatbeg-stodattyp
        add hl,de
--->    ld (hl),c:inc hl        ;store start sector
--->    ld (hl),b:inc hl
--->    db #fd:ld a,l:ld (hl),a:inc hl
--->    db #fd:ld a,h:ld (hl),a
        xor a
        ret

;### DRVSEC -> converts logical sector number into physical sector number
;### Input      A=device (0-7), IY,IX=logical sector number
;### Output     BC,DE=physical sector number
;### Destroyed  AF,HL,IX,IY
drvsec  call stoadrx
        ld bc,stodatbeg     ;add partition offset to IY,IX
        add hl,bc
        ld c,(hl)
        inc hl
        ld b,(hl)
        inc hl
        add ix,bc
        ld c,(hl)
        inc hl
        ld b,(hl)
        jr nc,drvsec1
        inc bc
drvsec1 add iy,bc
        ld bc,stodatflg-3-stodatbeg
        add hl,bc
        ld a,(hl)           ;set channel
        and #1
        ld (drvshw1+1),a
        bit 4,(hl)          ;check sector addressing mode
        jr nz,drvsec2
        xor a                   ;MMC/SD1.x/SD2.x
        ld (drvwrt7+1),a
        ld e,a
        db #dd:ld d,l
        db #dd:ld c,h
        db #fd:ld b,l
        sla d
        rl c
        rl b
        ret
drvsec2 ld a,drvwrt6-drvwrt7-2  ;SD-HC
        ld (drvwrt7+1),a
        db #dd:ld e,l
        db #dd:ld d,h
        db #fd:ld c,l
        db #fd:ld b,h
        ret

;### DRVSHW -> maps device memory  to #4000-#7FFF and activates SD card access
;### Destroyed  A
drvshw  ld a,(drvslt+0) ;slot selection
        di
        out (#a8),a
        ld a,(drvslt+1)
        ld (#ffff),a
        ld a,(drvslt+2)
        out (#a8),a
        ld a,#40        ;enable ports
        ld (#6000),a
drvshw1 ld a,0          ;select SD card slot (0/1)
        ld (#5800),a
        ret

;### DRVCMD -> Sends command to SD controller
;### Input      A=command, BC,DE=parameters
;### Output     CF=0 -> ok, CF=1 -> timeout
;### Destroyed  AF,BC,DE,HL
drvcmd0 ld de,0
        ld bc,0
drvcmd  ld hl,#4000
        ld l,(hl)
        nop
        nop
        ld (hl),a:nop
        ld (hl),b:nop
        ld (hl),c:nop
        ld (hl),d:nop
        ld (hl),e:nop
drvcmd2 ld (hl),#95
        ld a,(hl)
        ld a,(hl)
        ld b,0
drvcmd1 ld a,(hl)
        cp #ff
        ccf
        ret nc
        djnz drvcmd1
        scf
        ret

;### DRVINI -> Inits SD card and detects card type
;### Output     CF=1 -> timeout, ZF=0 -> command error
;###            CF=0, ZF=1 -> ok, (drvinic)=card type (0=mmc, 1=sd1.x, 2=sd2.x, 3=sdhc)
;### Destroyed  AF,BC,DE,HL
drvinic db 0                ;temp card type

drvini  call drvini0
        ret c               ;Timeout (card removed or damaged?)
        ret nz              ;Command error
        xor a
        ld a,e
        ld (drvinic),a
        ret

drvini0 ld b,10             ;Dummy cycle > 76 clocks
drvini1 ld a,(#5000)
        djnz drvini1
        ld a,#40+0          ;CMD0 -> Reset
        call drvcmd0
        ret c               ;response timeout
        and #f3             ;F7=>F3h Changed to support Nokia
        cp 1
        ret nz
drvini2 ld a,#87
        ld (drvcmd2+1),a
        ld a,#40+8          ;CMD8
        ld bc,#0000
        ld de,#01aa
        call drvcmd
        push af
        ld a,#95
        ld (drvcmd2+1),a
        pop af
        ret c
        cp 1
        jr nz,drvini5       ;SD V1.X or MMC
        ld a,(hl):nop
        ld a,(hl):nop
        ld a,(hl)
        and #f
        cp 1
        ret nz
        ld a,(hl)
        cp #aa
        ret nz              ;Wrong voltage range
drvini3 ld a,#40+55         ;CMD55
        call drvcmd0
        ret c
        cp 1
        ret nz
        ld a,#40+41         ;ACMD41 (HCS = 1)
        ld bc,#4000
        ld de,#0000
        call drvcmd
        ret c
        and 1
        cp 1
        jr z,drvini3
        ld a,#40+58         ;CMD58
        call drvcmd0
        ret c
        ld a,(hl)           ;CSS 32 bits
        cp (hl)
        cp (hl)
        cp (hl)
        bit 6,a             ;bit 30
        ld e,drvct_sd2      ;-> SD card v2.x
        jr z,drvini4
        ld e,drvct_shc      ;-> SDHC
drvini4 xor a
        ret
drvini5 ld a,#40+55
        call drvcmd0
        ret c
        bit 2,a
        jr nz,drvini6
        cp 1
        ret nz
        ld a,#40+41
        call drvcmd0
        ret c
        bit 2,a
        jr nz,drvini6
        bit 0,a
        jr nz,drvini5
        xor a
        ld e,drvct_sd1      ;-> SD card v1.x
        ret
drvini6 ld a,#40+1
        call drvcmd0
        ret c               ;response timeout
        cp 1
        jr z,drvini5
        ld e,drvct_mmc      ;-> MMC
        or a                ;zf=1 OK, zf=0 error
        ret

;### DRVRED -> read sectors
;### Input      BC,DE=Sector, IXH=Number of sectors, HL=destionation address
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX
drvred0 call drvini
        pop bc
        pop de
        pop hl
        db #dd:ld l,stoerrsec
        jr nz,drvred3
        db #dd:ld l,stoerrrdy
        jr c,drvred5

drvred  push hl
        push de
        push bc
        call drvshw     ;DI, map device rom at #4000, activate SD ports
        ld a,#40+18     ;CMD18 -> read multiple block
        call drvcmd
        jr c,drvred0
        or a
        jr nz,drvred0
        pop bc
        pop de
        pop hl
drvred1 ld a,0          ;show destination/source memory at #8000
        out (#fe),a
        ex de,hl
        ld hl,#4000     ;wait for ready
        ld bc,#8000
drvred2 ld a,(hl)
        cp #fe
        jr z,drvred6
        dec bc
        ld a,b:or c
        jr nz,drvred2
        db #dd:ld l,stoerrsec
        jr drvred3
drvred6 call drvcop     ;copy 512byte sector
        ld a,(hl)
        ld a,(hl)
        ex de,hl
        xor a           ;disable SD ports
        ld (#6000),a
        call bnkmofx    ;show OS memory at #8000
        call bnkdofx    ;unmap device rom at #4000, EI
        db #dd:dec h
        call drvshw
        jr nz,drvred1
        db #dd:ld l,0

drvred3 ld a,#40+12     ;CMD12 -> stop multiblock read
	    call drvcmd
drvred4 call bnkmofx
drvred5 xor a           ;disable SD ports
        ld (#6000),a
        call bnkdofx
        xor a
        db #dd:cp l
        db #dd:ld a,l
        ret
drvred7 pop bc
        pop de
        jr drvred4

;### DRVWRT -> write sectors
;### Input      BC,DE=Sector, IXH=Number of sectors, HL=destionation address
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX
drvwrt0 call drvini
        pop bc
        pop de
        pop hl
        db #dd:ld l,stoerrsec
        jr nz,drvred5
        db #dd:ld l,stoerrrdy
        jr c,drvred5

drvwrt  push hl
        push de
        push bc
        call drvshw     ;DI, map device rom at #4000, activate SD ports
        ld a,#58
        call drvcmd
        jr c,drvwrt0
        pop bc
        pop de
        pop hl
        or a
        jr nz,drvwrt
drvwrt1 ld a,0          ;show destination/source memory at #8000
        out (#fe),a
        push de
        push bc
        ld de,#4000
        ld a,(de)
        ld a,#fe
        ld (de),a
        call drvcop     ;copy 512byte sector
        ex (sp),hl
        ld a,(de)
        ex (sp),hl
        ld a,(de)
        ld a,(de)
        nop
        ld a,(de)
        and #1f
        cp #05
        db #dd:ld l,stoerrsec
        jr nz,drvred7
;        ld bc,#8000
drvwrt2 ld a,(de)
        cp #ff
;        jr z,drvwrt4
;        dec bc
;        ld a,c
;        or b
        jr nz,drvwrt2
;        db #dd:
               ;ld l,stoerrsec
;        jr drvred7
drvwrt4 xor a           ;disable SD ports
        ld (#6000),a
        call bnkmofx    ;show OS memory at #8000
        call bnkdofx    ;unmap device rom at #4000, EI
        pop bc
        pop de

drvwrt7 jr drvwrt7
        inc d:inc d     ;MMC/SD1.x/SD2.x
        jr nz,drvwrt3
        inc bc
        jr drvwrt3
drvwrt6 inc de          ;SD-HC
        ld a,d
        or e
        jr nz,drvwrt3
        inc bc
drvwrt3 db #dd:dec h
        jr nz,drvwrt
        xor a
        ret

;### DRVCOP -> Copies 512 bytes
;### Input      HL=source, DE=destination
;### Destroyed  AF,BC,DE,HL
drvcop  ld a,512/64
drvcop1 ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi
        ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi
        ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi
        ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi:ldi
        dec a
        jp nz,drvcop1
        ret

drvend

relocate_table
relocate_end
