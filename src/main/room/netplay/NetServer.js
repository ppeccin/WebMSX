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

        // Merge Controller ports values from Clients with Server and update resulting port values
        updateClientsMergedControllersPortValues();
        var a = controllersHub.readLocalControllerPort(0) & clientsMergedControllersPortValues[0],
            b = controllersHub.readLocalControllerPort(1) & clientsMergedControllersPortValues[1];

        // Have they changed?
        var controllersPortValuesToSend;
        if (controllersPortValues[0] !== a || controllersPortValues[1] !== b) {
            controllersPortValues[0] = a; controllersPortValues[1] = b;
            controllersPortValuesToSend = controllersPortValues;
        }

        // Send local (Server) Machine clock
        machine.videoClockPulse();

        // Send net clock update to all Clients
        var data, dataFull, dataNormal;
        for (var cNick in clients) {
            var client = clients[cNick];
            if (!client.wsOnly && !client.dataChannelActive) continue;

            if (client.justJoined || nextUpdateFull) {
                client.justJoined = false;
                if (!dataFull) {
                    netUpdateFull.s = machine.saveStateExtended();
                    netUpdateFull.ks = keyboard.saveState();
                    netUpdateFull.cp = controllersPortValues;
                    // TODO NetPlay netUpdateFull.cm = { p1: room.consoleControls.isP1ControlsMode(), pd: room.consoleControls.isPaddleMode() };
                    dataFull = JSON.stringify(netUpdateFull);
                }
                data = dataFull;
            } else {
                if (!dataNormal) {
                    netUpdate.c = machineControls.netGetControlsToSend();
                    netUpdate.k = keyboard.netGetMatrixChangesToSend();
                    netUpdate.cp = controllersPortValuesToSend;
                    netUpdate.dd = diskDrive.netGetOperationsToSend();
                    netUpdate.cd = cassetteDeck.netGetOperationsToSend();
                    dataNormal = JSON.stringify(netUpdate);
                }
                data = dataNormal;
            }

            try {
                if (client.dataChannelActive)
                    // Use DataChannel if available
                    sendToDataChannel(client.dataChannel, data);
                else
                    // Or fallback to WebSocket relayed through the Session Server (BAD!)
                    ws.send(JSON.stringify({ toClientNick: client.nick, wmsxUpdate: data }));
            } catch (e) {
                dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P error sending data');
            }
        }

        nextUpdateFull = false;
        machineControls.netClearControlsToSend();
        keyboard.netClearMatrixChangesToSend();
        diskDrive.netClearOperationsToSend();
        cassetteDeck.netClearOperationsToSend();
    };

    this.readControllerPort = function(port) {
        return controllersPortValues[port];
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
        clientsMergedControllersPortValues = [ CONT_PORT_ALL_RELEASED, CONT_PORT_ALL_RELEASED ];
        clientsControllersPortValuesChanged = false;
        diskDrive.netClearOperationsToSend();
        cassetteDeck.netClearOperationsToSend();
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
        // Process MachineControls and Keyboard changes as if they were local controls immediately
        if (netUpdate.c) {
            for (var i = 0, changes = netUpdate.c, len = changes.length; i < len; ++i) {
                var change = changes[i];
                machineControls.processControlState(change >> 4, change & 0x01);                    // binary encoded
            }
        }
        if (netUpdate.k) {
            for (i = 0, changes = netUpdate.k, len = changes.length; i < len; ++i) {
                change = changes[i];
                keyboard.processMatrixChange(change >> 8, (change & 0xf0) >> 4, change & 0x01);    // binary encoded
            }
        }

        // Store Controllers port value changes for later merging with other Clients and Server values
        if (netUpdate.cp) {
            clientsControllersPortValuesChanged = true;

            // Retain values only if they are different than the all-released state
            var portValues = netUpdate.cp;
            client.controllersPortValues = portValues[0] !== CONT_PORT_ALL_RELEASED || portValues[1] !== CONT_PORT_ALL_RELEASED
                ? portValues : undefined;
        }

        // client.lastUpdate = netUpdate;
    }

    function updateClientsMergedControllersPortValues() {
        if (!clientsControllersPortValuesChanged) return;
        // console.log("Updating clients port values");

        clientsMergedControllersPortValues = [ CONT_PORT_ALL_RELEASED, CONT_PORT_ALL_RELEASED ];
        for (var nick in clients) {
            var portValues = clients[nick].controllersPortValues;
            if (!portValues) continue;
            clientsMergedControllersPortValues[0] &= portValues[0];
            clientsMergedControllersPortValues[1] &= portValues[1];
        }

        clientsControllersPortValuesChanged = false;
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
            if (p < len)
                dataChannel.send(DATA_CHANNEL_FRAG_PART + frag);
            else {
                dataChannel.send(DATA_CHANNEL_FRAG_END + frag);

                // console.log("Fragmented message sent: " + data.length, + ", fragments: " + c);

                return;
            }
        }
    }


    var machine = room.machine;
    var machineControls = room.machineControls;
    var keyboard = room.keyboard;
    var controllersHub = room.controllersHub;
    var diskDrive = room.diskDrive;
    var cassetteDeck = room.cassetteDeck;

    var controllersPortValues = [ CONT_PORT_ALL_RELEASED, CONT_PORT_ALL_RELEASED ];

    var netUpdate = { c: undefined, k: undefined, cp: undefined };
    var netUpdateFull = { s: undefined, ks: undefined, cp: undefined };
    var nextUpdateFull = false;

    var ws;
    var sessionID;
    var sessionIDToCreate;
    var keepAliveTimer;
    var wsOnly = false;

    var clients = {};
    this.clients = clients;
    var clientsMergedControllersPortValues = [ CONT_PORT_ALL_RELEASED, CONT_PORT_ALL_RELEASED ];
    var clientsControllersPortValuesChanged = false;

    var rtcConnectionConfig;
    var dataChannelConfig;


    var CONT_PORT_ALL_RELEASED = 0x7f;

    var MAX_DATA_CHANNEL_SIZE = 16300;
    var DATA_CHANNEL_FRAG_SIZE = 16200;
    var DATA_CHANNEL_FRAG_PART = "#@FrgS@#";
    var DATA_CHANNEL_FRAG_END =  "#@FrgE@#";

};
