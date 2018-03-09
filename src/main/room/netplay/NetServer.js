// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.NetServer = function(room) {
    "use strict";

    var self = this;

    this.startSession = function(pSessionID) {
        sessionIDToCreate = pSessionID ? ("" + pSessionID).trim() : undefined;

        // Check for wsOnly indicator
        var wsOnlyAsked;
        if (sessionIDToCreate && sessionIDToCreate[sessionIDToCreate.length - 1] === "@") {
            sessionIDToCreate  = sessionIDToCreate.substr(0, sessionIDToCreate.length -1);
            wsOnlyAsked = true;
        } else
            wsOnlyAsked = false;

        if (sessionIDToCreate && (sessionID === sessionIDToCreate) && (wsOnly === wsOnlyAsked)) return;
        if (sessionID) this.stopSession(true);

        room.enterNetPendingMode(this);

        wsOnly = wsOnlyAsked;

        if (!ws) {
            ws = new WebSocket("ws://" + WMSX.WEB_EXTENSIONS_SERVER);
            ws.onmessage = onSessionMessage;
            ws.onopen = onSessionServerConnected;
            ws.onclose = onSessionServerDisconnected;
        } else
            onSessionServerConnected();
    };

    this.stopSession = function(wasError, userMessage) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = undefined;

        if (ws) {
            ws.onmessage = ws.onopen = ws.onclose = undefined;
            ws.close();
            ws = undefined;
        }

        if (wasError) dropAllClients();
        else setTimeout(dropAllClients, 300);      // Give some time before ending RTC so Session ending can be detected first by Clients

        room.showOSD(userMessage || 'NetPlay Session "' + sessionID + '" stopped', true, wasError);
        (wasError ? wmsx.Util.error : wmsx.Util.log) (userMessage || 'NetPlay Session "' + sessionID + '" stopped');

        sessionID = undefined;
        room.enterStandaloneMode();
    };

    this.getSessionID = function() {
        return sessionID;
    };

    this.netVideoClockPulse = function() {
        // Send clock do Controllers
        controllersHub.controllersClockPulse();

        // Send net clock update to all Clients
        var data, dataFull, dataNormal;
        for (var cNick in clients) {
            var client = clients[cNick];
            if (!client.wsOnly && !client.dataChannelActive) continue;

            if (client.justJoined || nextUpdateFull) {
                client.justJoined = false;
                if (!dataFull) {
                    var netUpdateFull = {
                        vf: room.mainVideoClock.getVSynchNativeFrequency(),
                        s: machine.saveState(true),      // extended
                        ks: keyboard.saveState(),
                        cm: controllersHub.netServerGetControlsModes(),
                        ch: controllersHub.netServerGetFullInfo()
                    };
                    dataFull = JSON.stringify(netUpdateFull);
                }
                data = dataFull;
            } else {
                if (!dataNormal) {
                    netUpdate.c = machineControls.netGetControlsToSend();
                    netUpdate.k = keyboard.netGetMatrixChangesToSend();
                    netUpdate.ch = controllersHub.netGetInfoToSend();
                    netUpdate.pc = peripheralControls.netGetControlsToSend();
                    netUpdate.po = peripheralOperationsToSend.length ? peripheralOperationsToSend : undefined;
                    dataNormal = JSON.stringify(netUpdate);
                }
                data = dataNormal;
            }

            try {
                // Use DataChannel if available
                if (client.dataChannelActive) sendToDataChannel(client.dataChannel, data);
                // Or fallback to WebSocket relayed through the Session Server (BAD!)
                else ws.send(JSON.stringify({ toClientNick: client.nick, wmsxUpdate: data }));
            } catch (e) {
                dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P error sending data');
            }
        }
        nextUpdateFull = false;
        machineControls.netClearControlsToSend();
        keyboard.netClearMatrixChangesToSend();
        controllersHub.netClearInfoToSend();
        peripheralControls.netClearControlsToSend();
        peripheralOperationsToSend.length = 0;

        // Send local (Server) Machine clock
        machine.videoClockPulse();
    };

    this.addPeripheralOperationToSend = function(op) {
        peripheralOperationsToSend.push(op);
    };

    this.processExternalStateChange = function() {
        nextUpdateFull = true;
    };

    function onSessionServerConnected() {
        // Setup keep-alive
        if (keepAliveTimer === undefined) keepAliveTimer = setInterval(keepAlive, 30000);
        // Start a new Session
        var command = { sessionControl: "createSession", sessionType: "wmsx", wsOnly: wsOnly, queryVariables: [ "RTC_CONFIG", "RTC_DATA_CHANNEL_CONFIG" ] };
        if (sessionIDToCreate) command.sessionID = sessionIDToCreate;
        ws.send(JSON.stringify(command));
    }

    function onSessionServerDisconnected() {
        self.stopSession(true, keepAliveTimer ? "NetPlay Session stopped: Connection lost" : "NetPlay: Connection error");
    }

    function onSessionMessage(event) {
        const message = JSON.parse(event.data);

        if (message.wmsxUpdate) {
            var client = clients[event.clientNick];
            if (client) onClientNetUpdate(client, message.wmsxUpdate);
            return;
        }

        if (message.sessionControl) {
            switch (message.sessionControl) {
                case "sessionCreated":
                    onSessionCreated(message);
                    return;
                case "clientJoined":
                    onClientJoined(message);
                    return;
                case "clientLeft":
                    onClientLeft(message);
                    return;
                case "createError":
                    self.stopSession(true, "NetPlay: " + message.errorMessage);
                    return;
            }
            return;
        }

        if(message.clientSDP)
            onClientSDP(message);
    }

    function onSessionCreated(message) {
        try {
            rtcConnectionConfig = JSON.parse(message.queriedVariables.RTC_CONFIG || "{}");
        } catch (e) {}
        try {
            dataChannelConfig = JSON.parse(message.queriedVariables.RTC_DATA_CHANNEL_CONFIG || "{}");
        } catch (e) {}

        sessionID = message.sessionID;
        machineControls.netClearControlsToSend();
        keyboard.netClearMatrixChangesToSend();
        controllersHub.netClearInfoToSend();
        controllersHub.netServerClearClientsMergedInfo();
        peripheralControls.netClearControlsToSend();
        peripheralOperationsToSend.length = 0;
        room.enterNetServerMode(self);

        room.showOSD('NetPlay session "' + message.sessionID + '" started', true);
        wmsx.Util.log('NetPlay session "' + message.sessionID + '" started');
    }

    function onClientJoined(message) {
        var client = { nick: message.clientNick, justJoined: true, wsOnly: wsOnly || !!message.wsOnly };
        clients[client.nick] = client;

        room.showOSD('NetPlay client "' + client.nick + '" joined', true);
        wmsx.Util.log('NetPlay client "' + client.nick + '" joined');

        // Use RTC?
        if (client.wsOnly) return;

        // Start RTC
        var rtcConnection = new RTCPeerConnection(rtcConnectionConfig);
        client.rtcConnection = rtcConnection;

        rtcConnection.onicecandidate = function(e) {
            if (!e.candidate) {
                wmsx.Util.log("Server SDP for client " + client.nick + ":", rtcConnection.localDescription);

                ws.send(JSON.stringify({toClientNick: client.nick, serverSDP: rtcConnection.localDescription}));
            }
        };

        var dataChannel = rtcConnection.createDataChannel("dataChannel", dataChannelConfig );
        client.dataChannel = dataChannel;
        dataChannel.onopen = function(event) { onDataChannelOpen(client, event) };
        dataChannel.onclose = function(event) { onDataChannelClose(client, event) };
        dataChannel.onmessage = function(event) { onDataChannelMessage(client, event) };

        // Create an offer to connect
        rtcConnection.createOffer()
            .then(function(desc) { return rtcConnection.setLocalDescription(desc); })
            .catch( function(error) { onRTCError(client, error); });
    }

    function onClientLeft(message) {
        var client = clients[message.clientNick];
        if (!client) return;

        dropClient(client, true, false, 'NetPlay client "' + client.nick + '" left');
    }

    function onClientSDP(message) {
        var client = clients[message.fromClientNick];
        if (!client) return;

        wmsx.Util.log("Client SDP from client " + client.nick + ":", message.clientSDP);

        client.rtcConnection.setRemoteDescription(new RTCSessionDescription(message.clientSDP))
            .catch(onRTCError);
    }

    function onDataChannelOpen(client, event) {
        wmsx.Util.log("Client " + client.nick + " dataChannel open");

        client.dataChannelActive = true;
    }

    function onDataChannelClose(client, event) {
        wmsx.Util.error("NetPlay Client " + client.nick + " dataChannel closed");
        dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P connection lost');
    }

    function onDataChannelMessage(client, event) {
        onClientNetUpdate(client, JSON.parse(event.data));
    }

    function onRTCError(client, error) {
        wmsx.Util.error("NetPlay Client " + client.nick + " RTC error:", error);
        dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P connection error');
    }

    function dropAllClients() {
        for (var cID in clients)
            dropClient(clients[cID], false);
    }

    function dropClient(client, showMessage, wasError, userMessage) {
        if (showMessage) {
            room.showOSD(userMessage || 'NetPlay client "' + client.nick + '" left', true, wasError);
            (wasError ? wmsx.Util.error : wmsx.Util.log) (userMessage || 'NetPlay client "' + client.nick + '" left');
        }

        if (client.dataChannel) {
            client.dataChannel.onopen = client.dataChannel.onclose = client.dataChannel.onmessage = undefined;
            client.dataChannel.close();
        }
        if (client.rtcConnection) {
            client.rtcConnection.onicecandidate = undefined;
            client.rtcConnection.close();
        }
        delete clients[client.nick];
    }

    function onClientNetUpdate(client, netUpdate) {
        // if (Object.keys(netUpdate).length) console.log(netUpdate);
        // client.lastUpdate = netUpdate;

        // Process MachineControls and Keyboard changes as if they were local controls immediately
        if (netUpdate.c) machineControls.netServerProcessControlsChanges(netUpdate.c);
        if (netUpdate.k) keyboard.netServerProcessMatrixChanges(netUpdate.k);
        if (netUpdate.pc) peripheralControls.netServerProcessControlsChanges(netUpdate.pc);

        // Process Controller ports info
        if (netUpdate.ch) controllersHub.netServerReceiveClientInfo(client, netUpdate.ch);
    }

    function keepAlive() {
        try {
            ws.send('{ "sessionControl": "keep-alive" }');
        } catch (e) {
            wmsx.Util.error("NetPlay error sending keep-alive");
            self.stopSession(true, "NetPlay Session stopped: connection error");
        }
    }

    // Automatically fragments message if needed. Data must be a String
    function sendToDataChannel(dataChannel, data) {
        var len = data.length;

        if (len < MAX_DATA_CHANNEL_SIZE)
            return dataChannel.send(data);

        var c = 0;
        var p = 0;
        while (true) {
            var frag = data.substr(p, DATA_CHANNEL_FRAG_SIZE);
            p += DATA_CHANNEL_FRAG_SIZE;
            c++;
            if (p < len) {
                // console.log("Sending fragment: " + c);
                dataChannel.send(DATA_CHANNEL_FRAG_PART + frag);
            } else {
                // console.log("Sending fragment: " + c);
                dataChannel.send(DATA_CHANNEL_FRAG_END + frag);
                // console.log("Fragmented message sent: " + data.length + ", fragments: " + c);
                return;
            }
        }
    }


    var machine = room.machine;
    var machineControls = room.machineControls;
    var keyboard = room.keyboard;
    var cartridgeSlot = room.cartridgeSlot;
    var controllersHub = room.controllersHub;
    var peripheralControls = room.peripheralControls;
    var diskDrive = room.diskDrive;
    var cassetteDeck = room.cassetteDeck;

    var netUpdate = { c: undefined, k: undefined, cp: undefined };
    var nextUpdateFull = false;

    var ws;
    var sessionID;
    var sessionIDToCreate;
    var keepAliveTimer;
    var wsOnly = false;

    var clients = {};
    this.clients = clients;

    var peripheralOperationsToSend = new Array(10); peripheralOperationsToSend.length = 0;     // pre allocate empty Array

    var rtcConnectionConfig;
    var dataChannelConfig;


    var MAX_DATA_CHANNEL_SIZE = 16300;
    var DATA_CHANNEL_FRAG_SIZE = 16200;
    var DATA_CHANNEL_FRAG_PART = "#@FrgS@#";
    var DATA_CHANNEL_FRAG_END =  "#@FrgE@#";

};
