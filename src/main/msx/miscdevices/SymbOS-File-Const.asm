;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
;@                                                                            @
;@             S y m b O S   -   File-Manager - C o n s t a n t s             @
;@                                                                            @
;@             (c) 2000-2007 by Prodatron / SymbiosiS (Jörn Mika)             @
;@                                                                            @
;@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


;Fehler-Codes
stoerrmis   equ 0       ;Gerät nicht vorhanden
stoerruni   equ 2       ;Gerät nicht initialisiert
stoerrfai   equ 3       ;Medium defekt
stoerrpno   equ 4       ;Partition nicht vorhanden
stoerrptp   equ 5       ;Medium oder Partition wird nicht unterstützt
stoerrsec   equ 6       ;Fehler beim Sektor lesen/schreiben
stoerrpos   equ 7       ;Fehler bei der Positionierung
stoerrabo   equ 8       ;Abbruch während der Datenträgeransteuerung
stoerrunk   equ 9       ;Unbekannter Datenträgerfehler
stoerrhnd   equ 10      ;kein Dateihandler mehr frei
stoerrxdv   equ 11      ;Gerät existiert nicht (bei Pfadauswahl)
stoerrxdi   equ 12      ;Pfad existiert nicht (bei Pfadauswahl)
stoerrxfi   equ 13      ;Datei existiert nicht (bei Pfadauswahl)
stoerracs   equ 14      ;Zugriff nicht erlaubt
stoerrnam   equ 15      ;ungültiger Datei-, Wildcard- oder Pfadname
stoerrxhn   equ 16      ;Handler existiert nicht
stoerrdev   equ 17      ;Geräteslot bereits belegt
stoerrrea   equ 18      ;Fehler beim Lesen der Datei (Fileorganisation)
stoerrnna   equ 19      ;ungültiger Zielname (falsch oder es wurde ein Pfad angegeben)
stoerrdbl   equ 20      ;(Ziel)name existiert bereits
stoerrcmd   equ 21      ;falscher Sub-Commando-Code
stoerratr   equ 22      ;falsches Attribut
stoerrdfl   equ 23      ;kein freier Platz im Directory
stoerrsfl   equ 24      ;kein Platz auf dem Gerät
stoerrwrp   equ 25      ;Schreibschutz vorhanden, es kann nicht auf den Datenträger geschrieben werden
stoerrrdy   equ 26      ;Gerät nicht bereit
stoerrdne   equ 27      ;Directory ist nicht leer und kann nicht gelöscht werden
stoerrwdv   equ 28      ;Zielgerät ist nicht mit Quellgerät identisch
stoerrsup   equ 29      ;für dieses Filesystem nicht unterstütztes Commando
stoerrdvp   equ 30      ;Device wird nicht unterstützt
stoerrrdo   equ 31      ;Datei ist ReadOnly
stoerrxch   equ 32      ;Geräte-Kanal nicht verfügbar
stoerrndi   equ 33      ;Ziel ist kein Directory
stoerrnfi   equ 34      ;Ziel ist kein File
stoerrgen   equ 255     ;*undefinierter Fehler*

;Speichergeräte-Status
stotypmis   equ 0           ;Gerät nicht vorhanden
stotypoky   equ 1           ;Gerät bereit
stotypuni   equ 2           ;Gerät nicht initialisiert
stotypfai   equ 3           ;Gerät defekt

;Datenträger-Typen
stomedfda   equ 1           ;FDC Floppydisc SingleSide (AMSDOS)
stomedfdd   equ 2           ;FDC Floppydisc DoubleSide (FAT12)
stomedfds   equ 3           ;FDC Floppydisc SingleSide (FAT12)
stomedhdi   equ 16          ;IDE device                (FAT12/16/32)
stomedsdc   equ 17          ;SD/MMC Card               (FAT12/16/32)
stomedusb   equ 18          ;USB device                (FAT12/16/32)

;Filesystem-Typen (#!ACHTUNG! -> Bei ID-Änderungen FSYPRP anpassen!#)
stofilada   equ 1           ;Amsdos Data
stofilasy   equ 2           ;Amsdos System
stofilajy   equ 3           ;Amsdos PCW
stofilf12   equ 16          ;Fat 12
stofilf16   equ 17          ;Fat 16
stofilf32   equ 18          ;Fat 32


;--- DEVICES ------------------------------------------------------------------
stodatsta   equ 0           ;L Geräte-Status
stodattyp   equ 1           ;L Bit[0-6]=Datenträger-Typ, Bit[7]=Flag, ob Wechseldatenträger
stodatfsy   equ 2           ;F Filesystem-Typ
stodatsec   equ 3           ;F Anzahl Sektoren pro Cluster (1-128; 2er Potenz)
stodatmax   equ 4           ;F Anzahl verfügbarer Cluster (32Bit)
stodatdat   equ 8           ;F erster logischer Sektor von Cluster 0
stodatbeg   equ 12          ;L erster logischer Sektor (32Bit), mit dem die Partition startet (wird nur von Low-Level Sektor-Routine benutzt)
stodatjrd   equ 16          ;  Sprung-Adresse "Sektor lesen"
stodatjwr   equ 18          ;  Sprung-Adresse "Sektor schreiben"
stodatjac   equ 20          ;  Sprung-Adresse "Medium einlesen"
stodatjcl   equ 22          ;  Sprung-Adresse "Gerät schließen"
stodatts2   equ 24          ;  **reserviert (2Byte)**
stodatsub   equ 26          ;  IDE/SD/SCSI/USB  Bit[0-3] -> 0=nicht partitioniert, 1-4=Primäre, 5-15=Erweiterte), Bit[4-7] -> Kanal (0=Master, 1=Slave bzw. 0-15)
                            ;  FDC              Bit[0-1] -> Laufwerk (0=A, 1=B, 2=C, 3=D), Bit[2] -> Kopf, Bit[3]=DoubleStep, Bit[4-7] -> SektorOffset (erst nach STOACT)
stodatrs1   equ 27          ;  **reserviert (1Byte)**
stodatspt   equ 28          ;L Anzahl Sektoren pro Track (max.256)
stodathed   equ 30          ;L Anzahl Köpfe (max.16)
stodatflg   equ 31          ;L treiberinterne Flags (IDE -> bit0=LBA-Modus, SD -> bit0=slot, bit4=HC)
stodatfil   equ 32          ;F filesystemspezifischer Unterbereich
;FAT Daten
fatdattyp   equ 0           ;Typ (0=FAT12, 1=FAT16, 2=FAT32)
fatdatdln   equ 1           ;Anzahl Sektoren des Root-Dirs (8Bit, nur FAT12/16)
fatdatbeg   equ 2           ;erster Sektor der FAT (32bit)
fatdatanz   equ 6           ;Größe der FAT in Sektoren (32bit)
fatdatdir   equ 10          ;erster Cluster(FAT32) oder Sektor(FAT12/16) des Root-Dirs (32Bit)
fatdatfsi   equ 14          ;Nummer des FSInfo-Sektors (FAT32) oder erster freier Cluster (FAT12/16)

stodatlen   equ 32+16       ;Datensatzlänge
stogrpmax   equ 8           ;Maximal 8 Geräte


;--- FAT-DIRECTORY-EINTRAG ----------------------------------------------------
dir_name            equ 00  ;Filename (8+3 Zeichen)
dir_attr            equ 11  ;Attribute (+1=ReadOnly, +2=Hidden, +4=System, +8=VolumeID, +16=Directory, +32=Archive, #0f=Longname, +128=don't list non-matching directory entries)
dir_ntres           equ 12  ;*für WinNT reserviert*
dir_crttimetenth    equ 13  ;Zeit-Erstellung (Hunderstel-Sekunde, 0-199)
dir_crttime         equ 14  ;Zeit  -> Erstellung (b0-4=Sekunde*2, b5-10=Minute, b11-15=Stunde)
dir_crtdate         equ 16  ;Datum -> Erstellung (b0-4=Tag,       b5-8 =Monat,  b9-15 =Jahr-1980)
dir_lstaccdat       equ 18  ;Datum -> letzter Zugriff
dir_fstclushi       equ 20  ;Startcluster (High-Word)
dir_wrttime         equ 22  ;Zeit  -> letzte Modifikation
dir_wrtdate         equ 24  ;Datum -> letzte Modifikation
dir_fstcluslo       equ 26  ;Startcluster (Low-Word)
dir_filesize        equ 28  ;Filelänge (32Bit)

;--- FAT-BOOT-SEKTOR ----------------------------------------------------------
bs_jmpboot          equ 0   ;Sprung zur Boot-Routine
bs_oemname          equ 3   ;OEM-Name
bpb_bytespersec     equ 11  ;Bytes pro Sektor (nur 512 wird unterstützt)
bpb_secperclus      equ 13  ;Sektoren pro Cluster
bpb_rsvdseccnt      equ 14  ;Anzahl reservierter Sektoren (vor Start der ersten FAT)
bpb_numfats         equ 16  ;Anzahl FATs
bpb_rootentcnt      equ 17  ;Anzahl 32Byte-Einträge im Root-Verzeichnis
bpb_totsec16        equ 19  ;Gesamtanzahl der Sektoren, falls in 16Bit darstellbar (ansonsten 0)
bpb_media           equ 21  ;#F8=fixed, #F0=removeable
bpb_fatsz16         equ 22  ;Sektoren pro FAT (nur FAT12/16)
bpb_secpertrk       equ 24  ;Sektoren pro Track
bpb_numheads        equ 26  ;Anzahl Köpfe
bpb_hiddsec         equ 28  ;Anzahl Sektoren vor Sektor 0 der Partition
bpb_totsec32        equ 32  ;Gesamtanzahl der Sektoren in 32Bit, falls in 16Bit nicht darstellbar (ansonsten 0)

bs_drvnum           equ 36  ;#00=floppy, #80=harddisc
bs_reserved1        equ 37  ;reserviert für WinNT (sollte 0 sein)
bs_bootsig          equ 38  ;#29, wenn die folgenden 3 Einträge existieren
bs_volid            equ 39  ;normalerweise Timestamp,  um Medien-Wechsel zu erkennen
bs_vollab           equ 43  ;Volume-Label
bs_filsystype       equ 54  ;"FAT....." string

bpb_fatsz32         equ 36  ;Sektoren pro FAT (nur FAT32)
bpb_extflags        equ 40  ;[Bit0-3]=aktive FAT-Nummer, falls kein Mirroring aktiv, [Bit7]=1, wenn kein Mirroring aktiv
bpb_fsver           equ 42  ;FAT32-Version, sollte 0/0 sein
bpb_rootclus        equ 44  ;erster Cluster des RootDirs; sollte 2 oder direkt hinter dem ersten nicht kaputten Cluster sein
bpb_fsinfo          equ 48  ;Sektor-Nummer vom "FSINFO"-Sektor; sollte 1 sein
bpb_bkbootsec       equ 50  ;Sektor mit Boot-Sektor-Kopie; 0=nicht vorhanden, sollte ansonsten 6 sein
bpb_reserved        equ 52  ;reserviert (sollte 0 sein)

bs32_drvnum         equ 64  ;#00=floppy, #80=harddisc
bs32_reserved1      equ 65  ;reserviert für WinNT (sollte 0 sein)
bs32_bootsig        equ 66  ;#29, wenn die folgenden 3 Einträge existieren
bs32_volid          equ 67  ;normalerweise Timestamp,  um Medien-Wechsel zu erkennen
bs32_vollab         equ 71  ;Volume-Label
bs32_filsystype     equ 82  ;"FAT....." string

fsi_free_count      equ 488 ;Anzahl freier Cluster (-1=Anzahl unbekannt) [32Bit]
fsi_nxt_free        equ 492 ;Clusternummer, ab der nach freien Clustern gesucht werden kann (-1=Nummer unbekannt, Start ab 2) [32Bit]
