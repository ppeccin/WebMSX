// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.NetClient = function(room) {
    "use strict";

    var self = this;

    this.joinSession = function(pSessionID, pNick) {
        sessionIDToJoin = ("" + pSessionID).trim();
        if (!sessionIDToJoin)
            return room.showOSD("Must enter Session Name for joining NetPlay session", true, true);

        // Check for wsOnly indicator
        var wsOnlyAsked;
        if (sessionIDToJoin[sessionIDToJoin.length - 1] === "@") {
            sessionIDToJoin  = sessionIDToJoin.substr(0, sessionIDToJoin.length -1);
            wsOnlyAsked = true;
        } else
            wsOnlyAsked = false;

        nickDesired = pNick;
        wsOnlyDesired = wsOnlyAsked;

        if (sessionID === sessionIDToJoin && nick === nickDesired && wsOnly === wsOnlyDesired) return;
        if (sessionID) this.leaveSession(true);

        room.enterNetPendingMode(this);

        if (!ws) {
            // ws = new WebSocket("ws://10.42.10.141:8081");
            ws = new WebSocket("ws://webmsx.herokuapp.com");
            ws.onmessage = onSessionMessage;
            ws.onopen = onSessionServerConnected;
            ws.onclose = onSessionServerDisconnected;
        } else
            onSessionServerConnected();
    };

    this.leaveSession = function(wasError, userMessage) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = undefined;

        sessionID = nick = undefined;
        wsOnly = false;

        if (ws) {
            ws.onpen = ws.onclose = ws.onmessage = undefined;
            ws.close();
            ws = undefined;
        }
        if (dataChannel) dataChannel.onpen = dataChannel.onclose = dataChannel.onmessage = undefined;
        if (rtcConnection) rtcConnection.onicecandidate = rtcConnection.ondatachannel = undefined;

        dataChannelActive = false;
        dataChannelFragmentData = "";

        if (wasError) stopRTC();
        else setTimeout(stopRTC, 300);      // Give some time before ending RTC so Session Disconnection can be detected first by Server

        room.showOSD(userMessage || "NetPlay session ended", true, wasError);
        (wasError ? wmsx.Util.error : wmsx.Util.log) (userMessage || "NetPlay session ended");

        room.enterStandaloneMode();
    };

    this.getSessionID = function() {
        return sessionID;
    };

    this.netVideoClockPulse = function() {
        // Client gets clocks from Server at onServerNetUpdate()
    };

    this.processLocalMachineControlState = function (control, press) {
        // Reject controls not available to NetPlay Clients
        if (disabledMachineControls.has(control))
            return room.showOSD("Function not available in NetPlay Client mode", true, true);

        // Store and send only to server, do not process locally
        machineControlsToSend.push((control << 4) | press );                    // binary encoded
    };

    this.processLocalKeyboardMatrixChange = function(line, col, press) {
        // Store and send only to server, do not process locally
        keyboardMatrixChangesToSend.push((line << 8) | (col << 4) | press );    // binary encoded
    };

    this.processCheckLocalPeripheralControl = function (control) {
        // Reject controls not available to NetPlay Clients
        if (disabledPeripheralControls.has(control)) {
            room.showOSD("Function not available in NetPlay Client mode", true, true);
            return false;
        }
        return true;
    };

    function onSessionServerConnected() {
        // Setup keep-alive
        if (keepAliveTimer === undefined) keepAliveTimer = setInterval(keepAlive, 30000);
        // Join a Session
        ws.send(JSON.stringify({
            sessionControl: "joinSession", sessionType: "wmsx", sessionID: sessionIDToJoin, clientNick: nickDesired, wsOnly: wsOnlyDesired,
            queryVariables: [ "RTC_CONFIG" ]
        }));
    }

    function onSessionServerDisconnected() {
        self.leaveSession(true, keepAliveTimer ? "NetPlay session ended: Connection lost" : "NetPlay: Connection error");
    }

    function onSessionMessage(event) {
        const message = JSON.parse(event.data);

        if (message.wmsxUpdate)
            return onServerNetUpdate(JSON.parse(message.wmsxUpdate));

        if (message.sessionControl) {
            switch (message.sessionControl) {
                case "sessionJoined":
                    onSessionJoined(message);
                    return;
                case "sessionDestroyed":
                    self.leaveSession(false, 'NetPlay Session "' + sessionID + '" ended');
                    return;
                case "joinError":
                    self.leaveSession(true, "NetPlay: " + message.errorMessage);
                    return;
            }
            return;
        }

        if(message.serverSDP)
            onServerSDP(message);
    }

    function onSessionJoined(message) {
        sessionID = message.sessionID;
        nick = message.clientNick;
        wsOnly = wsOnlyDesired || message.wsOnly;
        // nextUpdate = -1;

        if (wsOnly) return enterNetClientMode();

        try {
            rtcConnectionConfig = JSON.parse(message.queriedVariables.RTC_CONFIG || "{}");
        } catch (e) {}

        // Start RTC
        rtcConnection = new RTCPeerConnection(rtcConnectionConfig);

        // Set up the ICE candidates
        rtcConnection.onicecandidate = function(e) {
            if (!e.candidate)
                ws.send(JSON.stringify({ clientSDP: rtcConnection.localDescription }));
        };

        // Wait for data channel
        rtcConnection.ondatachannel = function(event) {
            dataChannel = event.channel;
            dataChannel.onopen = onDataChannelOpen;
            dataChannel.onclose = onDataChannelClose;
            dataChannel.onmessage = onDataChannelMessage;
        };
    }

    function enterNetClientMode() {
        room.showOSD('NetPlay Session "' + sessionID + '" joined as "' + nick + '"', true);
        wmsx.Util.log('NetPlay Session "' + sessionID + '" joined as "' + nick + '"');

        machineControlsToSend.length = 0;
        keyboardMatrixChangesToSend.length = 0;
        room.enterNetClientMode(self);
    }

    function onServerSDP(message) {
        rtcConnection.setRemoteDescription(new RTCSessionDescription(message.serverSDP))
            .then(function() { return rtcConnection.createAnswer(); })
            .then(function(desc) { return rtcConnection.setLocalDescription(desc); })
            .catch(onRTCError);
    }

    function onDataChannelOpen(event) {
        dataChannelActive = true;
        dataChannelFragmentData = "";
        enterNetClientMode();
    }

    function onDataChannelClose(event) {
        wmsx.Util.error("NetPlay dataChannel closed");
        self.leaveSession(true, "NetPlay session ended: P2P connection lost");
    }

    function onDataChannelMessage(event) {
        var data = receiveFromDataChannel(event);
        if (data) onServerNetUpdate(JSON.parse(data));
    }

    function onRTCError(error) {
        wmsx.Util.error("NetPlay RTC error:", error);
        self.leaveSession(true, "NetPlay session ended: P2P connection error");
    }

    function stopRTC() {
        if (dataChannel) {
            dataChannel.onpen = dataChannel.onclose = dataChannel.onmessage = undefined;
            dataChannel.close();
            dataChannel = undefined;
        }
        if (rtcConnection) {
            rtcConnection.onicecandidate = rtcConnection.ondatachannel = undefined;
            rtcConnection.close();
            rtcConnection = undefined;
        }
    }

    function onServerNetUpdate(netUpdate) {
        // window.machine.log(netUpdate);

        // Not needed in an ordered DataChannel?
        //if (netUpdate.u !== nextUpdate && nextUpdate >= 0) {
        //    wmsx.Util.error("NetPlay Client expected update: " + nextUpdate + ", but got: " + netUpdate.u);
        //    self.leaveSession(true, "NetPlay session ended: Update sequence error");
        //}
        //nextUpdate = netUpdate.u + 1;

        // NetClient gets no local clock, so...
        machine.getControllersSocket().controllersClockPulse();

        // Full Update?
        if (netUpdate.s) {
            machine.loadStateExtended(netUpdate.s);
            keyboard.loadState(netUpdate.ks);
            // Change Controls Mode automatically to adapt to Server
            // TODO NetPlay room.consoleControls.setP1ControlsAndPaddleMode(!netUpdate.cm.p1, netUpdate.cm.pd);
        }

        // Apply controls changes
        if (netUpdate.c) {
            var controls = netUpdate.c;
            for (var i = 0, len = controls.length; i < len; ++i) {
                var control = controls[i];
                machineControlsSocket.controlStateChanged(control >> 4, control & 0x01);        // binary encoded
            }
        }
        if (netUpdate.k) {
            var changes = netUpdate.k;
            for (i = 0, len = changes.length; i < len; ++i) {
                var change = changes[i];
                keyboard.applyMatrixChange(change >> 8, (change & 0xf0) >> 4, change & 0x01);   // binary encoded
            }
        }

        machine.videoClockPulse();

        // Send local controls to Server. We always send a message even when empty to keep the channel active
        if (dataChannelActive) {
            // Use DataChannel if available
            dataChannel.send(JSON.stringify({
                c: machineControlsToSend.length ? machineControlsToSend : undefined,
                k: keyboardMatrixChangesToSend.length ? keyboardMatrixChangesToSend : undefined
            }));
        } else {
            // Or fallback to WebSocket relayed through the Session Server (BAD!)
            ws.send(JSON.stringify({wmsxUpdate: {
                c: machineControlsToSend.length ? machineControlsToSend : undefined,
                k: keyboardMatrixChangesToSend.length ? keyboardMatrixChangesToSend : undefined
            }}));
        }
        machineControlsToSend.length = 0;
        keyboardMatrixChangesToSend.length = 0;
    }

    function keepAlive() {
        try {
            ws.send('{ "sessionControl": "keep-alive" }');
        } catch (e) {
            wmsx.Util.error("NetPlay error sending keep-alive");
            self.leaveSession(true, "NetPlay session ended: Connection error");
        }
    }

    // Automatically reconstructs message fragments as needed. Data must be a String
    function receiveFromDataChannel(event) {
        var data = event.data;

        var fragFlag = data.substr(0, 8);
        if (fragFlag === DATA_CHANNEL_FRAG_PART || fragFlag === DATA_CHANNEL_FRAG_END) {
            dataChannelFragmentData += data.substr(8);
            if (fragFlag === DATA_CHANNEL_FRAG_END) {
                data = dataChannelFragmentData;

                // console.log("Fragmented message received: " + data.length + ", fragments: " + ((data.length / DATA_CHANNEL_FRAG_SIZE - 0.0001) | 0 + 1));

                dataChannelFragmentData = "";
                return data;
            }
        } else {
            dataChannelFragmentData = "";
            return data;
        }
    }


    var machine = room.machine;
    var machineControlsSocket = machine.getMachineControlsSocket();
    var keyboard = room.keyboard;

    var machineControlsToSend = new Array(100); machineControlsToSend.length = 0;                   // pre allocate empty Array
    var keyboardMatrixChangesToSend = new Array(100); keyboardMatrixChangesToSend.length = 0;       // pre allocate empty Array

    var ws;
    var sessionID;
    var sessionIDToJoin;
    var nick;
    var nickDesired;
    var wsOnlyDesired = false;
    var keepAliveTimer;

    var rtcConnectionConfig;
    var wsOnly = false;

    var rtcConnection;
    var dataChannel;
    var dataChannelActive = false;
    var dataChannelFragmentData = "";

    // var nextUpdate = -1;

    var mc = wmsx.MachineControls;
    var disabledMachineControls = new Set([
        // TODO NetPlay
        mc.SAVE_STATE_0, mc.SAVE_STATE_1, mc.SAVE_STATE_2, mc.SAVE_STATE_3, mc.SAVE_STATE_4, mc.SAVE_STATE_5, mc.SAVE_STATE_6,
        mc.SAVE_STATE_7, mc.SAVE_STATE_8, mc.SAVE_STATE_9, mc.SAVE_STATE_10, mc.SAVE_STATE_11, mc.SAVE_STATE_12, mc.SAVE_STATE_FILE,
        mc.LOAD_STATE_0, mc.LOAD_STATE_1, mc.LOAD_STATE_2, mc.LOAD_STATE_3, mc.LOAD_STATE_4, mc.LOAD_STATE_5, mc.LOAD_STATE_6,
        mc.LOAD_STATE_7, mc.LOAD_STATE_8, mc.LOAD_STATE_9, mc.LOAD_STATE_10, mc.LOAD_STATE_11, mc.LOAD_STATE_12,
        mc.POWER_FRY, mc.VSYNCH, mc.TRACE
    ]);

    var pc = wmsx.PeripheralControls;
    var disabledPeripheralControls = new Set([
        // TODO NetPlay
        pc.MACHINE_LOAD_STATE_FILE, pc.MACHINE_SAVE_STATE_FILE, pc.MACHINE_LOAD_STATE_MENU, pc.MACHINE_SAVE_STATE_MENU,
        pc.CARTRIDGE_LOAD_FILE, pc.CARTRIDGE_LOAD_URL, pc.CARTRIDGE_REMOVE, pc.CARTRIDGE_LOAD_DATA_FILE, pc.CARTRIDGE_SAVE_DATA_FILE,
        pc.AUTO_LOAD_FILE, pc.AUTO_LOAD_URL
    ]);


    var DATA_CHANNEL_FRAG_SIZE = 16200;
    var DATA_CHANNEL_FRAG_PART = "#@FrgS@#";
    var DATA_CHANNEL_FRAG_END =  "#@FrgE@#";

};
