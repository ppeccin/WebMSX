// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.SessionManager = function(wss) {

    this.onWSClientConnected = function(wsClient) {
        console.log("SessionManager >>> WSClient " + wsClient.id + " connected");

        wsClient.setMessageListener((client, message) => this.onWSClientMessage(client, message));
    };

    this.onWSClientDisconnected = function(wsClient) {
        console.log("SessionManager >>> WSClient " + wsClient.id + " disconnected");

        const session = this.sessions[wsClient.sessionID];
        if (!session) return;

        session.onWSClientDisconnected(wsClient);
    };

    this.onWSClientMessage = function (wsClient, message) {
        if (message.sessionControl) {
            console.log("SessionManager >>> WSClient " + wsClient.id + " session control message: " + message.sessionControl);

            switch (message.sessionControl) {
                case "createSession":
                    this.processCreateSession(wsClient, message);
                    return;
                case "joinSession":
                    this.processJoinSession(wsClient, message);
                    return;
                case "keep-alive":
                    return;
                default:
                    console.log("SessionManager >>> Ignored...");
            }
        }
    };

    this.processCreateSession = function(wsClient, message) {
        let id;
        if (message.sessionID) {
            id = ("" + message.sessionID).trim();
            if (this.sessions[id]) {
                console.log("SessionManager >>> Session " + id + " is already in use");
                wsClient.sendMessage({ sessionControl: "createError", errorMessage: 'Session "' + id + '" is already in use'});
                wsClient.closeForced();
                return;
            }
            console.log("SessionManager >>> Creating asked Session " + id);
        } else {
            id = "" + this.nextID();
            console.log("SessionManager >>> Creating Session " + id);
        }

        const session = new wmsx.Session(id, this);
        this.sessions[id] = session;

        session.transferWSClientAsServer(wsClient, message);
    };

    this.processJoinSession = function(wsClient, message) {
        const sessionID = ("" + message.sessionID).trim();
        if (!this.sessions[sessionID]) {
            console.log("SessionManager >>> Session " + sessionID + " not found while joining Client " + wsClient.id);
            wsClient.sendMessage({ sessionControl: "joinError", errorMessage: 'Session "' + sessionID + '" is not available' });
            wsClient.closeForced();
            return;
        }

        const session = this.sessions[sessionID];
        session.transferWSClientAsClient(wsClient, message);
    };

    this.removeSession = function(id) {
        console.log("SessionManager >>> Removing Session " + id);

        delete this.sessions[id];
    };

    this.nextID = function() {
        let id = (Math.random() * 90000 | 0) + 10000;
        while (this.sessions[id]) {
            id++;
            if (id > 99999) id = 10000;
        }
        return id;
    };


    this.wss = wss;
    this.sessions = {};

    this.wss.setClientConnectedListener(wsClient => this.onWSClientConnected(wsClient));
    this.wss.setClientDisconnectedListener(wsClient => this.onWSClientDisconnected(wsClient));

};