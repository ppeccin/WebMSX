
wmsx.Session = function() {

    const Class = function Session(id, manager) {

        this.id = id;
        this.manager = manager;

        this.server = undefined;
        this.clients = {};

    };
    const Proto = Class.prototype;

    Proto.transferWSClientAsServer = function(wsClient) {
        console.log("Session " + this.id + " >>> Setting Server " + wsClient.id);

        this.server = wsClient;
        wsClient.isSessionServer = true;
        wsClient.sessionID = this.id;
        wsClient.setMessageListener((wsClient, message) => this.onServerMessage(wsClient, message));

        wsClient.sendMessage({ messageType: "sessionCreated", sessionID: this.id });
    };

    Proto.transferWSClientAsClient = function(wsClient) {
        console.log("Session " + this.id + " >>> Joining Client " + wsClient.id);

        this.clients[wsClient.id] = wsClient;
        wsClient.isSessionClient = true;
        wsClient.sessionID = this.id;
        wsClient.setMessageListener((wsClient, message) => this.onClientMessage(wsClient, message));

        wsClient.sendMessage({ messageType: "sessionJoined", sessionID: this.id });
        this.server.sendMessage({ messageType: "clientJoined", clientID: wsClient.id });
    };

    Proto.onWSClientDisconnected = function(wsClient) {
        console.log("Session " + this.id + " >>> WSClient " + wsClient.id + " disconnected");

        wsClient.setMessageListener(undefined);

        if (wsClient.isSessionServer) {
            this.destroy();
        } else {
            delete this.clients[wsClient.id];
            this.server.sendMessage({ messageType: "clientLeft", clientID: wsClient.id });
        }
    };

    Proto.onServerMessage = function (wsClient, message) {
        console.log("Session " + this.id + " >>> Server message:", message);

        const toClientID = message.toClientID;
        if (toClientID === undefined)
            return console.log("Session " + this.id + " >>> Server message has no destination ClientID");

        if (toClientID === 0) {
            // Broadcast
            for (const cID in this.clients)
                this.clients[cID].sendMessage(message);
        } else {
            const client = this.clients[toClientID];
            if (!client)
                return console.log("Session " + this.id + " >>> Server message, Client " + toClientID + " not found");
            client.sendMessage(message);
        }
    };

    Proto.onClientMessage = function (wsClient, message) {
        console.log("Session " + this.id + " >>> Client " + wsClient.id + " message:", message);

        message.fromClientID = wsClient.id;
        this.server.sendMessage(message);
    };

    Proto.destroy = function() {
        console.log("Session " + this.id + " >>> Destroying Session");

        this.manager.removeSession(this.id);
        for (let cID in this.clients) {
            this.clients[cID].sendMessage({messageType: "sessionDestroyed"});
            this.clients[cID].closeForced();
        }

        this.manager = this.server = this.clients = undefined;
    };

    return Class;

}();