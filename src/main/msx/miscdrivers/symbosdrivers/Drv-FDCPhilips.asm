;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
;@                                                                            @
;@            S y m b O S   -   M S X   D e v i c e   D r i v e r             @
;@                         FDC WD2793 (PHILIPS/SONY)                          @
;@                                                                            @
;@             (c) 2000-2007 by Prodatron / SymbiosiS (Jörn Mika)             @
;@                                                                            @
;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


;--- MAIN ROUTINES ------------------------------------------------------------
;### FDCOUT -> write sectors (512b)
;### FDCINP -> read sectors (512b)
;### FDCACT -> read and init media (only hardware- and partiondata, no filesystem)

;--- WORK ROUTINES ------------------------------------------------------------
;### FDCTRK -> seek track
;### FDCEXE -> prepare FDC for execution phase (sector read or sector write)
;### FDCRED -> read sector
;### FDCWRT -> write sector
;### FDCRES -> do result phase
;### FDCSEC -> converts logical sector number into physical sector number
;### FDCSID -> read sector ID

;--- SUB ROUTINES -------------------------------------------------------------
;### FDCSHW -> maps FDC memory  to #4000-#7FFF
;### FDCRDY -> waits, until FDC command has been finished
;### FDCCMD -> sends command to FDC
;### FDCMON -> start drive (switch on motor)
;### FDCMOF -> switch motor off after a while (will be called every 1/50 second)
;### FDCSEL -> select drive and head


;==============================================================================
;### HEADER ###################################################################
;==============================================================================

org #1000-32
relocate_start

db "SMD2"               ;ID
dw fdcend-fdcjmp        ;code length
dw relocate_count       ;number of relocate table entries
ds 8                    ;*reserved*
db 1,1,0                ;Version Minor, Version Major, Type (-1=NUL, 0=FDC, 1=IDE, 2=SD, 3=SCSI)
db "FDC WD2793   "      ;comment

fdcjmp  dw fdcinp,fdcout,fdcact,fdcmof0
fdcmof  jp fdcmofx
        db 32*0+1       ;bit[0-4]=driver ID (1=philips), bit[5-7]=storage type (0=FDC)
        ds 4
fdcslt  ds 3

stobnkx equ #202    ;memory mapping, when low level routines read/write sector data
bnkmonx equ #203    ;set special memory mapping during mass storage access
bnkmofx equ #206    ;reset special memory mapping during mass storage access
bnkdofx equ #209    ;hide mass storage device rom
stoadrx equ #20c    ;get device data record
clcd16x equ #20f    ;HL=BC/DE, DE=BC mod DE
stobufx equ #212    ;address of 512byte buffer
stoadry equ #214    ;current device


;*** Variables and Constants

fdctrkpos   db -2,-2,-2,-2  ;current trackpositions for all 4 drives
fdcresult   ds 7            ;result buffer
fdcmoncnt   db 0            ;motor on counter

fdc_rdywait     equ 50*3    ;wait 3 seconds maximum for ready signal
fdc_trkwait     equ 50*5    ;wait 5 seconds maximum for track seek

fdc_cmd_recal   equ #00     ;recalibrate (seek track 0)
fdc_cmd_seek    equ #10     ;seek track
fdc_cmd_read    equ #80     ;read sector
fdc_cmd_write   equ #a0     ;write sector
fdc_cmd_id      equ #c0     ;read sector ID
fdc_cmd_break   equ #d0     ;abort command

fdc_status      equ #7ff8   ;FDC status register
fdc_command     equ #7ff8   ;FDC command register
fdc_track       equ #7ff9   ;FDC track register
fdc_sector      equ #7ffa   ;FDC sector register
fdc_data        equ #7ffb   ;FDC data register

fdc_side        equ #7ffc   ;side select
fdc_drive       equ #7ffd   ;drive and motor select

fdc_drq         equ #7fff   ;drq (bit7), busy (bit6)


;==============================================================================
;### MAIN ROUTINES ############################################################
;==============================================================================

;### FDCOUT -> write sectors (512b)
;### Input      A=device (0-7), IX=logical sector number, B=number of sectors, DE=address, (stobnkx)=banking config
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX,IY
fdcout  ld hl,fdcwrt
        jr fdcinp0

;### FDCINP -> read sectors (512b)
;### Input      A=device (0-7), IX=logical sector number, B=number of sectors, DE=address, (stobnkx)=banking config
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX,IY
fdcinpr db 0                ;number of retries when error

fdcinp  ld hl,fdcred
fdcinp0 ld (fdcinp4+1),hl
        call fdcsec         ;A=drive/head, D=sector, E=Track, HL=address, B=number of sectors, C=sectors per track, IYL=number of heads-1
        push af
        call fdcshw
        ld a,6
        ld (fdcinpr),a
        pop af
        push bc
        push de
        push hl
        db #fd:ld h,a       ;IYH=drive/head
        call fdctrk         ;select first track


        pop hl
        pop ix              ;IXL=track, IXH=sector
        pop bc
        jp c,fdcinp3
fdcinp1 push bc
        push hl
        db #dd:ld a,h
fdcinp4 call fdcred
        pop hl
        pop bc
        jr c,fdcinp6        ;error -> try again
        dec b
        jr z,fdcinp3        ;all sectors have been loaded -> finished
        ld a,6
        ld (fdcinpr),a
        inc h:inc h
        db #dd:ld a,h       ;test, if last sector of current track reached
        and #0f
        cp c
        jr c,fdcinp2        ;no -> just increase sector
        ld a,-1
        ld (fdcmoncnt),a
        db #dd:ld a,h
        sub c
        db #dd:ld h,a       ;reset sector
        db #fd:inc l        ;test, if doubleside
        db #fd:dec l
        jr z,fdcinp5        ;no  -> increase track
        db #fd:ld a,h
        xor 4
        db #fd:ld h,a       ;yes -> head change
        and 4
        jr nz,fdcinp8       ;don't increase track, if changing from head 0 to 1
fdcinp5 db #dd:inc l
        push hl
        push bc
        db #fd:ld a,h
        db #dd:ld e,l
        call fdctrk         ;select next track
        pop bc
        pop hl
        jr fdcinp2
fdcinp8 call fdcwai
        db #fd:ld a,h
        call fdcsel         ;select next side
fdcinp2 db #dd:inc h
        jr fdcinp1
fdcinp6 cp stoerrsec        ;*** error
        scf
        jr nz,fdcinp3       ;no sector error -> end
        ld a,(fdcinpr)
        sub 1
        jr nc,fdcinp7
        ld a,stoerrsec      ;did enough tries -> error
        jr fdcinp3
fdcinp7 ld (fdcinpr),a
        rra
        jr nc,fdcinp1
        push hl
        push bc             ;do recalibrate for every second try
        ld e,39
        db #fd:ld a,h
        call fdctrk
        ld e,0
        db #fd:ld a,h
        call fdctrk
        db #dd:ld e,l
        db #fd:ld a,h
        call fdctrk
        pop bc
        pop hl
        jp fdcinp1
fdcinp3 ld c,a
        call bnkmofx
        call bnkdofx
        ld a,c
        ret

;### FDCACT -> read and init media (only hardware- and partiondata, no filesystem)
;### Input      A=device (0-7)
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL,IX,IY
fdcact  call stoadrx
        ld bc,stodatsub
        add hl,bc
        ld a,(hl)
        and #07             ;A=drive/head
        push hl
        call fdcsid         ;A=Sector-Offset
        pop hl
        ret c
        ld e,a              ;E=sectorOffset
        ld a,(hl)           ;C=drive/head + DoubleStepFlag
        and #0f
        ld c,a
        or e
        ld (hl),a           ;write baack SectorOffset + drive/head + DoubleStepFlag
        ld a,e
        ld de,#109          ;9 sectors per track, 1 head for AMSDOS format
        and #f0
        ld a,d
        jr nz,fdcact1
        push hl
        push bc
        ld a,(stoadry)
        ld ix,0
        ld de,(stobufx)
        ld b,1
        call fdcinp         ;read first physical media sector
        pop bc
        pop hl
        ret c
        ld ix,(stobufx)
        ld e,(ix+bpb_secpertrk)
        ld d,(ix+bpb_numheads)
        ld a,d
        neg
        add 4
fdcact1 inc hl
        inc hl
        ld (hl),e           ;store number of sectors per track
        inc hl
        ld (hl),0
        inc hl
        ld (hl),d           ;store number of heads
        inc hl
        ld (hl),0           ;Flags=0
        ld de,stodatbeg-stodatflg
        add hl,de
        ld b,4
fdcact3 ld (hl),0           ;PartitionStart=0
        inc hl
        djnz fdcact3
        ld de,stodatsta-stodatbeg-4
        add hl,de
        ld (hl),stotypoky   ;device ready
        inc hl
        ld (hl),a           ;medium type is Floppy disc Amsdos SingleSide (1), Fat SingleSide (3) or Fat DoubleSide (2)
        ld a,c
        and 3
        ld c,a              ;C=drive
        ld b,0
        ld hl,fdctrkpos
        add hl,bc
        ld a,(hl)
        cp -2               ;if first run -> recalibrate
        jr z,fdcact2
        ld (hl),-1          ;make track position invalid for drive
fdcact2 xor a
        ret


;==============================================================================
;### WORK ROUTINES ############################################################
;==============================================================================

;### FDCTRK -> seek track
;### Input      A=drive/head, E=Track (Bit7=1 -> double step)
;### Output     CF=0 -> ok
;###            CF=1 -> Drive not ready, A=error code (...)
;### Destroyed  AF,BC,DE,HL
fdctrkp dw 0
fdctrk  bit 7,e
        jr z,fdctrk1
        sla e               ;double step -> double the physical track number
fdctrk1 ld d,e
        ld l,a
        res 2,l
        ld h,0
        call fdcmon
        ret c
        ld bc,fdctrkpos
        add hl,bc
        ld (fdctrkp),hl
        call fdctrk7
        ld a,(hl)
        cp d                ;test, if track already seeked
        ret z
        ld (hl),d           ;no -> remember track and seek it
fdctrk0 ld (fdc_track),a
        cp -2
        jr nz,fdctrk2
        push de
        call fdctrk4        ;drive accessed the first time -> recalibrate first
        pop de
        ret c
fdctrk2 ld a,d
        or a
        jr z,fdctrk4        ;if track 0 -> recalibrate
        ld (fdc_data),a
        ld a,fdc_cmd_seek   ;command
        call fdccmd
fdctrk3 ld de,fdc_trkwait   ;*** check status
fdctrk6 ld a,(fdc_status)
        rra
        ret nc
        call bnkmofx
        call bnkdofx
        rst #30
        call fdcshw
        call fdctrk7
        dec de
        ld a,d
        or e
        jr nz,fdctrk6
        ld a,fdc_cmd_break
        call fdccmd
        ld hl,(fdctrkp)
        ld (hl),-2
        ld a,stoerrrdy      ;track couldn't be reached after X seconds -> error
        scf
        ret
fdctrk4 ld a,fdc_cmd_recal  ;*** seek track 0 (recalibrate)
        call fdccmd
        push de
        call fdctrk3
        pop de
        ret c
        ld a,fdc_cmd_recal
        call fdccmd         ;2x recalibrate, as FDC may stop after 42 tracks
        jr fdctrk3
fdctrk7 ld a,0
        out (#fe),a
        ret

;### FDCEXE -> prepare FDC for execution phase (sector read or sector write)
;### Input      A=sector, B=command
;### Output     PC=(SP)   -> ok, BC=fdc_drq
;###            PC=(SP+2) -> A=error code (...)
;### Destroyed  AF,DE
fdcexe  ld (fdc_sector),a   ;set sector
        ld a,b
        ld (fdc_command),a
        ld bc,fdc_drq
        ld de,0
fdcexe1 ld a,(bc)
        add a
        ret nc
        jp p,fdcexe2
        dec e
        jr nz,fdcexe1
        ld a,(bc)
        add a
        ret nc
        jp p,fdcexe2
        dec d
        jr nz,fdcexe1
        call bnkmofx
        pop bc
        ld a,stoerrrdy
        scf
        ret
fdcexe2 pop bc
        call bnkmofx
        jr fdcres3

;### FDCWRT -> write sector
;### Input      A=sector, HL=source address
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL
fdcwrt  ld b,fdc_cmd_write
        call fdcexe
fdcwrt1 ld a,(hl)
        ld (fdc_data),a
        inc hl
fdcwrt2 ld a,(bc)
        add a
        jr nc,fdcwrt1
        jp m,fdcwrt2
        or a
        jr fdcres

;### FDCRED -> read sector
;### Input      A=sector, HL=destination address
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,BC,DE,HL
fdcred  ld b,fdc_cmd_read
        call fdcexe
fdcred1 ld a,(fdc_data)
        ld (hl),a
        inc hl
fdcred2 ld a,(bc)
        add a
        jr nc,fdcred1       ;bit7=0 drq, new byte
        jp m,fdcred2        ;bit6=0 execution goes on
;### FDCRES -> do result phase
;### Input      CF=0 -> write command has been executed
;### Output     CF=1 -> A=error code (...)
;### Destroyed  AF,DE
fdcres  ld a,(fdc_status)
        jr c,fdcres1
        bit 6,a
        jr z,fdcres1
        ld a,stoerrwrp
        scf
        ret
fdcres1 and #bc
        ret z
fdcres3 ld a,stoerrsec      ;error while sector read/write
        scf
        ret

;### FDCSEC -> converts logical sector number into physical sector number
;### Input      A=device (0-7), IX=sector, DE=address, (stobnkx)=banking config
;### Output     A=drive/head, E=track (Bit7=1 -> double step), D=sector number, HL=corrected address, C=sectors per Track, IYL=number of head -1
;### Destroyed  F
fdcsec  push af
        ld a,(stobnkx)
        ex de,hl
        di
        call bnkmonx
        ld (fdcmon4+1),a
        ld (fdctrk7+1),a
        call bnkmofx
        pop af
        push hl
        call stoadrx
        ld de,stodathed
        add hl,de
        ld c,(hl)
        dec c
        db #fd:ld l,c       ;IYL=number of heads -1
        dec hl
        dec hl
        ld c,(hl)
        push bc             ;push number,sec per track
        ld e,c
        ld d,0              ;DE=sectors per track
        ld bc,stodatsub-stodatspt
        add hl,bc
        ld a,(hl)           ;A=drive / sector offset
        push af
        db #dd:ld c,l
        db #dd:ld b,h       ;BC=logical sector
        call clcd16x        ;L=track
        ld d,e              ;D=physical sector (starting with 0)
        pop af
        ld e,l              ;E=track
        db #fd:dec l
        db #fd:inc l
        jr z,fdcsec2
        srl e               ;doubleside drive -> half track
        jr nc,fdcsec2
        set 2,a             ;previouse track was odd -> head 1
fdcsec2 bit 3,a             ;test, if double step
        jr z,fdcsec1
        set 7,e             ;E7=1 -> double step
fdcsec1 ld l,a
        and #f0             ;A=sector offset
        add d
        inc a
        ld d,a              ;D=sectorID = offset + sector + 1
        ld a,l
        and #07             ;A=drive/head
        pop bc
        pop hl
        ret

;### FDCSID -> read sector ID
;### Input      A=drive/head
;### Output     CF=0 -> ok, A=sector-ID (#00=FAT, #40=System, #C0=Data)
;###            CF=1 -> A=error code (...)
;### Destroyed  F,BC,DE,HL
fdcsidb ds 6
fdcsid  ld c,a
xor a
ret
        call fdcshw
        ld a,c
        push af
        call fdcsid0
        pop bc
        jr nc,fdcsid1
        ld a,b              ;when error -> seek+recalibrate drive and try again
        push af
        ld e,0
        call fdctrk
        pop af
        call fdcsid0
fdcsid1 ld c,a
        call bnkdofx
        ld a,c
        ret
fdcsid0 and 3
        push af
        ld l,0
        call fdcmon         ;start drive
        pop de
        ret c
        ld hl,fdcsidb
        ld a,fdc_cmd_id
        call fdccmd
fdcsid2 ld a,(fdc_status)
        rra
        jr nc,fdcsid3
        rra
        jr nc,fdcsid2
        ld a,(fdc_data)
        ld (hl),a
        inc hl
        jr fdcsid2
fdcsid3 rla
        and #bc
        ld a,stoerrsec      ;error while sector read/write
        scf
        ret nz
        ld a,(fdcsidb+2)
        and #c0
        ret


;==============================================================================
;### SUB ROUTINES #############################################################
;==============================================================================

;### FDCSHW -> maps FDC memory  to #4000-#7FFF
;### Output     DI
;### Destroyed  A
fdcshw  ld a,(fdcslt+0)
        di
        out (#a8),a
fdcshw1 ld a,(fdcslt+1)
        ld (#ffff),a
        ld a,(fdcslt+2)
        out (#a8),a
        ret

;### FDCRDY -> waits, until FDC command has been finished
;### Input      A=command
;### Destroyed  AF,E
fdcrdy  ld a,(fdc_status)
        rra
        jr c,fdcrdy
        ret

;### FDCCMD -> sends command to FDC
;### Input      A=command
;### Destroyed  AF,E
fdccmd  ld e,a
        call fdcrdy
        ld a,e
        ld (fdc_command),a
        ex (sp),hl
        ex (sp),hl
        ret

;### FDCWAI -> waits 30ms
;### Destroyed  AF
fdcwai  push hl
        ld hl,#117b
fdcwai1 dec hl
        ld a,h
        or l
        jr nz,fdcwai1
        pop hl
        ret

;### FDCMON -> start drive (switch on motor)
;### Input      A=drive/head
;### Output     CF=0 -> ok
;###            CF=1 -> A=error code (...)
;### Destroyed  AF,E
fdcmon  call fdcsel
        ld a,-1
        ld (fdcmoncnt),a
        or a
fdcmon0 nop
        call bnkmofx
        call bnkdofx
        ld b,25
fdcmon3 rst #30
        djnz fdcmon3
        call fdcshw
fdcmon4 ld a,0
        out (#fe),a
        ld a,fdc_cmd_break
        ld (fdc_command),a
        ld e,32
fdcmon1 call fdcwai
        ld a,(fdc_status)
        rla
        jr nc,fdcmon2
        dec e
        jr nz,fdcmon1
        ld a,stoerrrdy
        ret
fdcmon2 ld a,#c9
        ld (fdcmon0),a
        ret

;### FDCMOF -> switch motor off after a while (will be called every 1/50 second)
;### Destroyed  AF,BC
fdcmofx ld a,(fdcmoncnt)
        or a
        ret z
        dec a
        ld (fdcmoncnt),a
        ret nz
        call fdcshw
fdcmof0 ld a,3
        ld (fdc_drive),a
        xor a
        ld (fdcmon0),a
        jp bnkdofx

;### FDCSEL -> select drive and head
;### Input      A=drive/head
;### Destroyed  AF,E
fdcsel  ld e,a
        and 1
        or %11000100
        ld (fdc_drive),a
        ld a,e
        srl a
        srl a
        ld (fdc_side),a
        ret

fdcend

relocate_table
relocate_end
