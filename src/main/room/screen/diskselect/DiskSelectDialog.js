// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskSelectDialog = function(mainElement, diskDrive, peripheralControls) {
    var self = this;

    this.show = function (pDrive, pAltPower) {
        if (!dialog) {
            create();
            setTimeout(function() {
                self.show(pDrive);
            }, 0);
            return;
        }

        drive = pDrive;
        altPower = pAltPower;
        visible = true;
        peripheralControls.setGroupRestriction("DISK");
        dialog.classList.add("wmsx-diskselect-show");
        dialog.focus();
        refreshList();
    };

    this.hide = function (confirm) {
        dialog.classList.remove("wmsx-diskselect-show");
        visible = false;
        peripheralControls.setGroupRestriction(null);
        WMSX.room.screen.focus();
        if (confirm) diskDrive.autoPowerCycle(altPower);     // altPower defined at show time
    };

    this.toggle = function(drive, altPower) {
        if (visible) this.hide(false);
        else this.show(drive, altPower);
    };

    this.diskDrivesMediaStateUpdate = function(drive) {
        if (!visible) return;
        refreshList();
    };

    function refreshList() {
        var stack = diskDrive.getDriveStack(drive);
        var currDiskNum = diskDrive.getCurrentDiskNum(drive);

        label.textContent = "Select Disk in Drive " + (drive === 1 ? "B:" : "A:") + " " + diskDrive.getCurrentDiskNumDesc(drive);

        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            if (i < stack.length) {
                li.classList.add("wmsx-diskselect-visible");
                li.innerHTML = stack[i].name;
                if (i === currDiskNum) li.classList.add("wmsx-diskselect-selected");
                else li.classList.remove("wmsx-diskselect-selected");
            } else {
                li.classList.remove("wmsx-diskselect-visible");
            }
            li.classList.remove("wmsx-diskselect-droptarget");
        }

        diskSelect = diskMoveFrom = diskMoveTo = undefined;
    }

    function create() {
        var styles = document.createElement('style');
        styles.type = 'text/css';
        styles.innerHTML = css();
        document.head.appendChild(styles);

        dialog = document.createElement("div");
        dialog.id = "wmsx-diskselect-modal";
        dialog.tabIndex = -1;

        label = document.createTextNode("Select Disk");
        dialog.appendChild(label);

        // Define list
        list = document.createElement('ul');
        list.id = "wmsx-diskselect-list";

        var max = wmsx.FileDiskDrive.MAX_STACK + 1;     // + 1 for the additional Blank User Disk
        for (var i = 0; i < max; ++i) {
            var li = document.createElement("li");
            li.draggable = true;
            li.wmsxDiskNum = i;
            listItems.push(li);
            list.appendChild(li);
        }
        dialog.appendChild(list);

        setupEvents();
        setupDnD();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        function hideAbort()   { self.hide(false); }
        function hideConfirm() { self.hide(true); }

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Abort
            if (e.keyCode === ESC_KEY) hideAbort();
            // Confirm
            else if (CONFIRM_KEYS.indexOf(e.keyCode) >= 0) hideConfirm();
            // Select
            else if (SELECTION_KEYS.indexOf(e.keyCode) >= 0) peripheralControls.controlActivated(CONTROLS[e.keyCode], true, drive !== 0);
            // Forward
            else peripheralControls.keyDown(e);

            return false;
        });

        // Hide on lost focus
        dialog.addEventListener("blur", hideAbort, true);
        dialog.addEventListener("focusout", hideAbort, true);

        // Determine Disk to select with mousedown
        list.addEventListener("mousedown", function mouseDownDiskSelect(e) {
            e.stopPropagation();
            if (e.button === 0 && e.target.wmsxDiskNum !== undefined) diskSelect = e.target;
            return false;
        });

        // Select Disk with mouseup
        list.addEventListener("mouseup", function mouseUpDiskSelect(e) {
            e.stopPropagation();
            if (e.button !== 0 || e.target !== diskSelect) return false;
            diskSelect = undefined;
            var diskNum = e.target.wmsxDiskNum;
            if (diskNum === undefined) return false;
            diskDrive.insertDisk(drive, diskNum);
            window.setTimeout(hideConfirm, 140);
            return false;
        });

        // Block mousemove preventions down event stack, so drags can start
        list.addEventListener("mousemove", function(e) { e.stopPropagation(); });

        // Supress context menu
        dialog.addEventListener("contextmenu", function stopContextMenu(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }

    function setupDnD() {
        list.addEventListener("dragstart", function dragStart(e) {
            if (e.target.wmsxDiskNum === undefined) return false;
            diskSelect = undefined;
            diskMoveFrom = e.target;
            e.dataTransfer.setData('text/html', e.target.innerHTML);
            return false;
        });
        list.addEventListener("dragend", function dragEnd(e) {
            if (diskMoveTo) diskMoveTo.classList.remove("wmsx-diskselect-droptarget");
            diskMoveFrom = diskMoveTo = undefined;
            return false;
        });

        list.addEventListener("drop", function dragStart(e) {
            if (!diskMoveFrom || !diskMoveTo) return false;
            var from = diskMoveFrom.wmsxDiskNum;
            var to = diskMoveTo.wmsxDiskNum;
            if (from === undefined || to === undefined || to === from) return false;
            diskDrive.moveDiskInStack(drive, from, to);
            return false;
        });

        list.addEventListener("dragenter", function dragEnter(e) {
            if (!diskMoveFrom || e.target.wmsxDiskNum === undefined) return false;
            if (diskMoveTo && diskMoveTo !== e.target) diskMoveTo.classList.remove("wmsx-diskselect-droptarget");
            diskMoveTo = e.target !== diskMoveFrom  ? e.target : undefined;
            if (diskMoveTo) diskMoveTo.classList.add("wmsx-diskselect-droptarget");
            return false;
        });
    }

    function css() {
        return '' +
            '#wmsx-diskselect-modal {' +
            '    position: absolute;' +
            '    overflow: hidden;' +
            '    display: none;' +
            '    top: 0;' +
            '    bottom: 0;' +
            '    left: 0;' +
            '    right: 0;' +
            '    width: 450px;' +
            '    height: 270px;' +
            '    margin: auto;' +
            '    color: white;' +
            '    font: normal 19px sans-serif;' +
            '    background: rgb(40, 40, 40);' +
            '    padding-top: 20px;' +
            '    text-align: center;' +
            '    border: 1px solid black;' +
            '    box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);' +
            '    -webkit-font-smoothing: antialiased;' +
            '    -moz-osx-font-smoothing: grayscale;' +
            '    cursor: auto;' +
            '    outline: none;' +
            '}' +
            '#wmsx-diskselect-modal.wmsx-diskselect-show {' +
            '    display: block;' +
            '}' +
            '#wmsx-diskselect-list {' +
            '    position: relative;' +
            '    width: 80%;' +
            '    top: 20px;' +
            '    margin: auto;' +
            '    padding: 0;' +
            '    list-style: none;' +
            '    font-size: 13px;' +
            '    color: rgb(205, 205, 205);' +
            '}' +
            '#wmsx-diskselect-list li {' +
            '    display: none;' +
            '    overflow: hidden;' +
            '    background: rgb(70, 70, 70);' +
            '    margin: 7px 0;' +
            '    padding: 2px 10px;' +
            '    text-align: left;' +
            '    text-overflow: ellipsis;' +
            '    border: 2px dashed transparent;' +
            '    white-space: nowrap;' +
            '}' +
            '#wmsx-diskselect-list li.wmsx-diskselect-visible {' +
            '    display: block;' +
            '}' +
            '#wmsx-diskselect-list li.wmsx-diskselect-selected {' +
            '    color: white;' +
            '    background: rgb(220, 32, 26);' +
            '}' +
            '#wmsx-diskselect-list li.wmsx-diskselect-droptarget {' +
            '    color: white;' +
            '    border-color: lightgray;' +
            '}';
    }


    var dialog, label, list;
    var listItems = [];
    var visible = false;

    var drive = 0;
    var altPower = true;

    var diskMoveFrom, diskMoveTo, diskSelect;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS =   [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECTION_KEYS = [ k.VK_UP.c, k.VK_DOWN.c ];
    var CONTROLS = {};
        CONTROLS[k.VK_UP.c] = wmsx.PeripheralControls.DISK_PREVIOUS;
        CONTROLS[k.VK_DOWN.c] = wmsx.PeripheralControls.DISK_NEXT;

};
