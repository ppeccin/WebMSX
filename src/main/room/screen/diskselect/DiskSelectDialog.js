// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskSelectDialog = function(mainElement, diskDrive, peripheralControls) {
    var self = this;

    this.show = function (pDrive, inc, pAltPower) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pDrive, inc, pAltPower);
            }, 0);
        }

        drive = pDrive;
        altPower = pAltPower;
        visible = true;
        getInitialState();
        incDiskSelected(inc);
        refreshList();
        dialog.classList.add("wmsx-show");
        dialog.focus();
    };

    this.hide = function (confirm) {
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm && diskSelectedNum >= 0) {
            diskDrive.insertDisk(drive, diskSelectedNum);
            diskDrive.autoPowerCycle(altPower);
        }
    };

    this.diskDrivesMediaStateUpdate = function(pDrive) {
        if (!visible || pDrive !== drive) return;
        getInitialState();
        refreshList();
    };

    function refreshList() {
        header.textContent = "Select Disk in Drive " + (drive === 1 ? "B:" : "A:") + " " + diskDrive.getCurrentDiskNumDesc(drive);
        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            if (i < diskStack.length) {
                li.classList.add("wmsx-visible");
                li.innerHTML = diskStack[i].name;
                if (i === diskSelectedNum) li.classList.add("wmsx-selected");
                else li.classList.remove("wmsx-selected");
            } else {
                li.classList.remove("wmsx-visible");
            }
            li.classList.remove("wmsx-droptarget");
        }
        diskMoveFrom = diskMoveTo = undefined;
    }

    function getInitialState() {
        diskStack = diskDrive.getDriveStack(drive);
        diskSelectedNum = diskDrive.getCurrentDiskNum(drive);
    }

    function incDiskSelected(inc) {
        var newNum = diskSelectedNum + inc;
        if (newNum < 0 || newNum >= diskStack.length) return;
        diskSelectedNum = newNum;
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
            // Control to Forward
            else if (e.keyCode === DISK_CONTROL_KEY) peripheralControls.keyDown(e);
            // Select
            else if (SELECT_KEYS[e.keyCode]) {
                incDiskSelected(SELECT_KEYS[e.keyCode]);
                refreshList();
            }

            return false;
        });

        // Hide on lost focus
        dialog.addEventListener("blur", hideAbort, true);
        dialog.addEventListener("focusout", hideAbort, true);

        // Select Disk with click
        list.addEventListener("click", function mouseClickDiskSelect(e) {
            e.stopPropagation();
            var diskNum = e.target.wmsxDiskNum;
            if (diskNum !== undefined) {
                diskSelectedNum = diskNum;
                refreshList();
                setTimeout(hideConfirm, 200);
            }
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
    var diskStack, diskSelectedNum;

    var diskMoveFrom, diskMoveTo;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS =   [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var DISK_CONTROL_KEY = k.VK_F6.c;
    var SELECT_KEYS = {};
        SELECT_KEYS[k.VK_UP.c] = -1;
        SELECT_KEYS[k.VK_PAGE_UP.c] = -1;
        SELECT_KEYS[k.VK_DOWN.c] = 1;
        SELECT_KEYS[k.VK_PAGE_DOWN.c] = 1;

};
