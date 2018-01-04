
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
        const id = this.nextID();
        console.log("SessionManager >>> Creating Session " + id);

        const session = new wmsx.Session(id, this);
        this.sessions[id] = session;

        session.transferWSClientAsServer(wsClient);
    };

    this.processJoinSession = function(wsClient, message) {
        const sessionID = message["sessionID"];
        if (!this.sessions[sessionID])
            return console.log("SessionManager >>> Session " + sessionID + " not found while joining Client " + wsClient.id);

        const session = this.sessions[sessionID];
        session.transferWSClientAsClient(wsClient);
    };

    this.removeSession = function(id) {
        console.log("SessionManager >>> Removing Session " + id);

        delete this.sessions[id];
    };

    this.nextID = function() {
        let id = new Date().getTime();
        while (this.sessions[id]) id++;
        return id;
    };


    this.wss = wss;
    this.sessions = {};

    this.wss.setClientConnectedListener(wsClient => this.onWSClientConnected(wsClient));
    this.wss.setClientDisconnectedListener(wsClient => this.onWSClientDisconnected(wsClient));

};