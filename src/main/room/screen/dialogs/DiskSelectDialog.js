// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskSelectDialog = function(mainElement, diskDrive, peripheralControls) {
"use strict";

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

        var availHeight = mainElement.clientHeight - wmsx.ScreenGUI.BAR_HEIGHT - 20;      //  bar - tolerance
        var height = dialog.clientHeight;
        var scale = height < availHeight ? 1 : availHeight / height;
        dialog.style.transform = "translateY(-" + ((wmsx.ScreenGUI.BAR_HEIGHT / 2) | 0) + "px) scale(" + scale.toFixed(4) + ")";

        //console.error("DISK SEL SCALE availHeight: " + availHeight + ", height: " + height + ", final: " + height * scale);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("wmsx-show");
        visible = false;
        WMSX.room.screen.focus();
        if (confirm && diskSelectedNum >= 0)
            peripheralControls.controlActivated(wmsx.PeripheralControls.DISK_INSERT, altPower, false, { d: drive, n: diskSelectedNum, a: altPower });
    };

    this.diskDrivesMediaStateUpdate = function(pDrive) {
        if (!visible || pDrive !== drive) return;
        getInitialState();
        refreshList();
    };

    function refreshList() {
        header.textContent = "Select Disk in Drive " + (drive === 1 ? "B:" : "A:") + " " + diskDrive.getCurrentDiskNumDesc(drive);
        var height = 61 + Math.max(diskStack.length, 4) * 33;
        dialog.style.height = "" + height + "px";
        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            if (i < diskStack.length) {
                li.classList.add("wmsx-visible");
                li.innerHTML = "" + (i + 1) + ":&nbsp;&nbsp;" + diskStack[i].name;
                li.classList.toggle("wmsx-selected", i === diskSelectedNum);
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
        dialog.style.height = "270px";
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

        // Do not close with taps or clicks inside, but allow drags to start
        wmsx.Util.onTapOrMouseDown(dialog, function(e) {
            dialog.focus();
            e.stopPropagation();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            var code = wmsx.DOMKeys.codeForKeyboardEvent(e);
            // Abort
            if (code === ESC_KEY) hideAbort();
            // Confirm
            else if (CONFIRM_KEYS.indexOf(code) >= 0) hideConfirm();
            else {
                var codeNoMod = code & IGNORE_ALL_MODIFIERS_MASK;
                // Disk Control to Forward
                if (codeNoMod === DISK_CONTROL_KEY) peripheralControls.processKey(code, true);
                // Select
                else if (SELECT_KEYS[codeNoMod]) {
                    incDiskSelected(SELECT_KEYS[codeNoMod]);
                    refreshList();
                }
            }
            return wmsx.Util.blockEvent(e);
        });

        // Select with tap or mouseup
        wmsx.Util.onTapOrMouseUpWithBlock(list, function(e) {
            var diskNum = e.target.wmsxDiskNum;
            if (diskNum !== undefined) {
                wmsx.ControllersHub.hapticFeedbackOnTouch(e);
                diskSelectedNum = diskNum;
                refreshList();
                setTimeout(hideConfirm, 120);
            }
            return false;
        });

        // Block mousemove preventions down event stack, so drags can start
        list.addEventListener("mousemove", function(e) { e.stopPropagation(); });
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

        dialog.addEventListener("drop", function drop(e) {
            e.preventDefault();
            if (!diskMoveFrom) return false;
            e.stopPropagation();
            if (!diskMoveTo) return false;
            var from = diskMoveFrom.wmsxDiskNum;
            var to = diskMoveTo.wmsxDiskNum;
            if (from === undefined || to === undefined || to === from) return false;
            peripheralControls.controlActivated(wmsx.PeripheralControls.DISK_MOVE, altPower, false, { d: drive, f: from, t: to });
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

    var IGNORE_ALL_MODIFIERS_MASK = wmsx.DOMKeys.IGNORE_ALL_MODIFIERS_MASK;

};
