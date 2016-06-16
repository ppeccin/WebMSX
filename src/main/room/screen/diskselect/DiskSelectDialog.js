// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DiskSelectDialog = function(mainElement, diskDrive, peripheralControls, screen) {
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
        console.log("REFRESH");

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
        }
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

        // Select Disk with mouseup
        function mouseDiskSelect(e) {
            var diskNum = e.target.wmsxDiskNum;
            if (diskNum === undefined) return;
            if (e.stopPropagation) e.stopPropagation();

            console.log("SELECT: " + diskNum);

            diskDrive.insertDisk(drive, diskNum);
            window.setTimeout(hideConfirm, 140);
        }
        dialog.addEventListener("mouseup", mouseDiskSelect);

        // Prevent other preventions for mouse events
        function stopEventPropagation(e) {
            e.stopPropagation();
        }
        dialog.addEventListener("mousedown", stopEventPropagation);
        dialog.addEventListener("mouseup",   stopEventPropagation);
        dialog.addEventListener("mousemove", stopEventPropagation);

        // Supress context menu
        dialog.addEventListener("contextmenu", function stopContextMenu(e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            return false;
        });

        mainElement.appendChild(dialog);
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
            '    padding: 4px 10px;' +
            '    text-align: left;' +
            '    text-overflow: ellipsis;' +
            '    white-space: nowrap;' +
            //'    cursor: n-resize;' +
            '}' +
            '#wmsx-diskselect-list li.wmsx-diskselect-visible {' +
            '    display: block;' +
            '}' +
            '#wmsx-diskselect-list li.wmsx-diskselect-selected {' +
            '    color: white;' +
            '    background: rgb(220, 32, 26);' +
            '}';
    }


    var dialog, label, list;
    var listItems = [];
    var visible = false;

    var drive = 0;
    var altPower = true;

    var k = wmsx.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS =   [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECTION_KEYS = [ k.VK_UP.c, k.VK_DOWN.c ];
    var CONTROLS = {};
        CONTROLS[k.VK_UP.c] = wmsx.PeripheralControls.DISK_PREVIOUS;
        CONTROLS[k.VK_DOWN.c] = wmsx.PeripheralControls.DISK_NEXT;

};
