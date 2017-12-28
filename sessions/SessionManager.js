
wmsx.SessionManager = function(wss) {

    this.onWSClientConnected = function(client) {
        console.log("SessionManager >>> WSClient " + client.id + " connected");

        client.setMessageListener((client, message) => this.onWSClientMessage(client, message));
    };

    this.onWSClientMessage = function (client, message) {
        console.log("SessionManager >>> WSClient " + client.id + " message: " + message);

        switch(message.messageType) {
            case "startSession":
                this.processCreateSession(client, message); return;
            case "joinSession":
                this.processJoinSession(client, message); return;
        }

        // this.wss.broadcast(message);
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

    this.nextID = function() {
        let id = new Date().getTime();
        while (this.sessions[id]) id++;
        return id;
    };


    this.wss = wss;
    this.sessions = {};

    this.wss.setClientConnectedListener(client => this.onWSClientConnected(client));

};