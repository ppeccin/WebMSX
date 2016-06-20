// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskSelectDialog = function(mainElement, diskDrive, peripheralControls) {
    var self = this;

    this.show = function (pDrive) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pDrive);
            }, 0);
        }

        drive = pDrive;
        visible = true;
        peripheralControls.setGroupRestriction("DISK");
        dialog.classList.add("wmsx-show");
        dialog.focus();
        refreshList();
    };

    this.hide = function (confirm) {
        dialog.classList.remove("wmsx-show");
        visible = false;
        peripheralControls.setGroupRestriction(null);
        WMSX.room.screen.focus();
        if (confirm) diskDrive.autoPowerCycle(false);
    };

    this.toggle = function(drive) {
        if (visible) this.hide(false);
        else this.show(drive);
    };

    this.toggleClose = function(drive) {
        if (visible) this.hide(false);
    };

    this.diskDrivesMediaStateUpdate = function(drive) {
        if (!visible) return;
        refreshList();
    };

    function refreshList() {
        var stack = diskDrive.getDriveStack(drive);
        var currDiskNum = diskDrive.getCurrentDiskNum(drive);

        header.textContent = "Select Disk in Drive " + (drive === 1 ? "B:" : "A:") + " " + diskDrive.getCurrentDiskNumDesc(drive);

        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            if (i < stack.length) {
                li.classList.add("wmsx-visible");
                li.innerHTML = stack[i].name;
                if (i === currDiskNum) li.classList.add("wmsx-selected");
                else li.classList.remove("wmsx-selected");
            } else {
                li.classList.remove("wmsx-visible");
            }
            li.classList.remove("wmsx-droptarget");
        }

        diskSelect = diskMoveFrom = diskMoveTo = undefined;
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "wmsx-diskselect";
        dialog.classList.add("wmsx-select-dialog");
        dialog.tabIndex = -1;

        header = document.createTextNode("Select Disk");
        dialog.appendChild(header);

        footer = document.createElement("div");
        footer.id = "wmsx-diskselect-footer";
        footer.classList.add("wmsx-footer");
        footer.innerHTML = "(drag items to change order)";
        dialog.appendChild(footer);

        // Define list
        list = document.createElement('ul');

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
            else if (CONTROLS[e.keyCode] && !e.altKey) peripheralControls.controlActivated(CONTROLS[e.keyCode], true, drive !== 0);
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
            setTimeout(hideConfirm, 140);
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
            e.stopPropagation();
            if (e.target.wmsxDiskNum === undefined) return false;
            diskSelect = undefined;
            diskMoveFrom = e.target;
            e.dataTransfer.setData('text/html', e.target.innerHTML);
            return false;
        });
        list.addEventListener("dragend", function dragEnd(e) {
            e.stopPropagation();
            if (diskMoveTo) diskMoveTo.classList.remove("wmsx-droptarget");
            diskMoveFrom = diskMoveTo = undefined;
            return false;
        });

        list.addEventListener("drop", function dragStart(e) {
            e.stopPropagation();
            e.preventDefault();
            if (!diskMoveFrom || !diskMoveTo) return false;
            var from = diskMoveFrom.wmsxDiskNum;
            var to = diskMoveTo.wmsxDiskNum;
            if (from === undefined || to === undefined || to === from) return false;
            diskDrive.moveDiskInStack(drive, from, to);
            return false;
        });

        list.addEventListener("dragenter", function dragEnter(e) {
            if (!diskMoveFrom || e.target.wmsxDiskNum === undefined) return false;
            if (diskMoveTo && diskMoveTo !== e.target) diskMoveTo.classList.remove("wmsx-droptarget");
            diskMoveTo = e.target !== diskMoveFrom  ? e.target : undefined;
            if (diskMoveTo) diskMoveTo.classList.add("wmsx-droptarget");
            return false;
        });
    }


    var dialog, header, footer, list;
    var listItems = [];
    var visible = false;

    var drive = 0;
    var altPower = true;

    var diskMoveFrom, diskMoveTo, diskSelect;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS =   [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var CONTROLS = {};
        CONTROLS[k.VK_UP.c] = wmsx.PeripheralControls.DISK_PREVIOUS;
        CONTROLS[k.VK_PAGE_UP.c] = wmsx.PeripheralControls.DISK_PREVIOUS;
        CONTROLS[k.VK_DOWN.c] = wmsx.PeripheralControls.DISK_NEXT;
        CONTROLS[k.VK_PAGE_DOWN.c] = wmsx.PeripheralControls.DISK_NEXT;

};
