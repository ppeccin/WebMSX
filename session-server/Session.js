// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.Session = function() {

    const Class = function Session(id, manager) {

        this.id = id;
        this.manager = manager;

        this.server = undefined;
        this.clients = {};

    };
    const Proto = Class.prototype;

    Proto.transferWSClientAsServer = function(wsClient, message) {
        // console.log("Session " + this.id + " >>> Setting Server " + wsClient.id);

        this.server = wsClient;
        wsClient.isSessionServer = true;
        wsClient.sessionID = this.id;
        wsClient.setMessageListener((wsClient, message) => this.onServerMessage(wsClient, message));

        const response = { sessionControl: "sessionCreated", sessionID: this.id };

        // Server wants to query variables?
        insertQueriedVariablesInReponse(message, response);

        wsClient.sendMessage(response);
    };

    Proto.transferWSClientAsClient = function(wsClient, message) {
        let nick = message.clientNick || "Client";
        if (this.clients[nick] || nick === "Client") {
            let i = 1;
            while (this.clients[nick + i]) ++i;
            nick += i;
        }

        console.log("Session " + this.id + " >>> Joining Client " + nick);

        this.clients[nick] = wsClient;
        wsClient.nick = nick;
        wsClient.isSessionClient = true;
        wsClient.sessionID = this.id;
        wsClient.setMessageListener((wsClient, message) => this.onClientMessage(wsClient, message));

        const clientResponse = { sessionControl: "sessionJoined", sessionID: this.id, clientNick: wsClient.nick };

        // Client wants to query variables?
        insertQueriedVariablesInReponse(message, clientResponse);

        wsClient.sendMessage(clientResponse);

        // Sends the same Client message to Server, to carry additional properties passed
        message.sessionControl = "clientJoined";
        message.clientNick = wsClient.nick;
        this.server.sendMessage(message);
    };

    Proto.onWSClientDisconnected = function(wsClient) {
        wsClient.setMessageListener(undefined);

        if (wsClient.isSessionServer) {
            console.log("Session " + this.id + " >>> Server disconnected");
            this.destroy();
        } else {
            console.log("Session " + this.id + " >>> Client " + wsClient.nick + " disconnected");
            delete this.clients[wsClient.nick];
            this.server.sendMessage({ sessionControl: "clientLeft", clientNick: wsClient.nick });
        }
    };

    Proto.onServerMessage = function (wsClient, message) {
        // console.log("Session " + this.id + " >>> Server message:", message);

        if (message.sessionControl === "keep-alive") return;

        const toClientNick = message.toClientNick;
        if (toClientNick === undefined)
            return console.error("Session " + this.id + " >>> ERROR: Server message has no destination 'toClientNick'");

        // if (toClientNick === "") {
        //     // Broadcast
        //     for (const cNick in this.clients)
        //         this.clients[cNick].sendMessage(message);
        // } else {
            const client = this.clients[toClientNick];
            if (!client)
                return console.error("Session " + this.id + " >>> ERROR: Server message, Client " + toClientNick + " not found");
            client.sendMessage(message);
        // }
    };

    Proto.onClientMessage = function (wsClient, message) {
        // console.log("Session " + this.id + " >>> Client " + wsClient.clientNick + " message:", message);

        if (message.sessionControl === "keep-alive") return;

        message.fromClientNick = wsClient.nick;
        this.server.sendMessage(message);
    };

    Proto.destroy = function() {
        console.log("Session " + this.id + " >>> Destroying Session");

        this.manager.removeSession(this.id);
        for (let cNick in this.clients) {
            this.clients[cNick].sendMessage({ sessionControl: "sessionDestroyed" });
            this.clients[cNick].closeForced();
        }

        this.manager = this.server = this.clients = undefined;
    };

    function insertQueriedVariablesInReponse(message, response) {
        let qVars = message.queryVariables;
        if (qVars) {
            const resVars = {};
            for (let i = 0, len = qVars.length; i < len; ++i) {
                const v = qVars[i].trim();
                resVars[v] = process.env[v];
            }
            response.queriedVariables = resVars;
        }
    }

    return Class;

}();