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
            ws = new WebSocket("ws://" + WMSX.WEB_EXTENSIONS_SERVER);
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

    this.processExternalStateChange = function() {
        room.screen.quickOptionsControlsStateUpdate();
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

        machineControls.netClearControlsToSend();
        keyboard.netClearMatrixChangesToSend();
        controllersHub.netClearPortValuesToSend();
        peripheralControls.netClearControlsToSend();
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
        // if (Object.keys(netUpdate).length) console.log(netUpdate);

        // Full Update?
        if (netUpdate.s) {
            room.mainVideoClock.setVSynchAltNativeFrequency(netUpdate.vf);
            machine.loadState(netUpdate.s);     // extended
            keyboard.loadState(netUpdate.ks);
            controllersHub.netClientSetPortValues(netUpdate.cp);
            controllersHub.netClientAdaptToServerSwappedState(netUpdate.cs);
        } else {
            // Apply controls changes from Server
            if (netUpdate.c) machineControls.netClientApplyControlsChanges(netUpdate.c);
            if (netUpdate.k) keyboard.netClientApplyMatrixChanges(netUpdate.k);
            if (netUpdate.cp) controllersHub.netClientSetPortValues(netUpdate.cp);
            if (netUpdate.pc) peripheralControls.netClientApplyControlsChanges(netUpdate.pc);
            if (netUpdate.po) processPeripheralOperations(netUpdate.po);

            // Send local (Client) Machine clock
            machine.videoClockPulse();
        }

        // Send clock do Controllers
        controllersHub.controllersClockPulse();

        // Send local controls changes. We always send a message even when empty to keep the channel active
        var update = {
            c: machineControls.netGetControlsToSend(),
            k: keyboard.netGetMatrixChangesToSend(),
            cp: controllersHub.netGetPortValuesToSend(),
            pc: peripheralControls.netGetControlsToSend()
        };

        // Use DataChannel if available
        if (dataChannelActive) dataChannel.send(JSON.stringify(update));
        // Or fallback to WebSocket relayed through the Session Server (BAD!)
        else ws.send(JSON.stringify({ wmsxUpdate: update }));

        machineControls.netClearControlsToSend();
        keyboard.netClearMatrixChangesToSend();
        controllersHub.netClearPortValuesToSend();
        peripheralControls.netClearControlsToSend();
    }

    function processPeripheralOperations(ops) {
        for (var i = 0, len = ops.length; i < len; ++i) {
            var op = ops[i];
            switch (op.op) {
                case 0:
                    cartridgeSlot.insertSerializedCartridge(op.c, op.p, op.a); break;
                case 1:
                    cartridgeSlot.loadSerializedCartridgeData(op.p, op.n, op.c); break;
                case 10:
                    diskDrive.loadSerializedStack(op.d, op.s, op.t, op.p, op.a); break;
                case 11:
                    diskDrive.insertNewDisk(op.d, op.m, op.u); break;
                case 20:
                    cassetteDeck.loadSerializedTape(op.n, op.c, op.p); break;
            }
        }
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
    var machineControls = room.machineControls;
    var keyboard = room.keyboard;
    var controllersHub = room.controllersHub;
    var peripheralControls = room.peripheralControls;
    var cartridgeSlot = room.cartridgeSlot;
    var diskDrive = room.diskDrive;
    var cassetteDeck = room.cassetteDeck;

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


    var DATA_CHANNEL_FRAG_SIZE = 16200;
    var DATA_CHANNEL_FRAG_PART = "#@FrgS@#";
    var DATA_CHANNEL_FRAG_END =  "#@FrgE@#";

};
